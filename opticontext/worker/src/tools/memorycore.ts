import { ToolCallResult } from "../mcp/router";
import { AgentAuthInfo } from "../auth/verify";
import { dispatchAI } from "../ai/router";
import { embedText } from "../ai/gemini";
import { supabase } from "../storage/supabase";
import { logger } from "../utils/logger";
import { memoryWriteSchema, memorySearchSchema, validateArgs } from "../mcp/validation";

const CHUNK_SIZE = 2048;        // ~512 tokens (at ~4 chars/token) per plan spec
const CHUNK_OVERLAP = 200;      // ~50 token overlap between chunks
const AUTO_SUMMARIZE_THRESHOLD = 8000;

export function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
    if (start >= text.length) break;
  }

  return chunks;
}

/**
 * Unified MemoryCore handler.
 * toolName disambiguates write vs search since both map to "memorycore" internally.
 */
export async function handleMemory(
  args: Record<string, unknown>,
  auth: AgentAuthInfo,
  toolName: string,
): Promise<ToolCallResult> {
  const startTime = Date.now();
  const isSearch = toolName === "opticontext_memory_search";

  // Validate args early so Zod errors propagate to the MCP server's error handler
  if (isSearch) {
    validateArgs(memorySearchSchema, args);
  } else {
    validateArgs(memoryWriteSchema, args);
  }

  try {
    if (isSearch) {
      return await handleSearch(args, auth, startTime);
    } else {
      return await handleWrite(args, auth, startTime);
    }
  } catch (err) {
    logger.error("MemoryCore operation failed", {
      agent_id: auth.agent_id,
      operation: isSearch ? "search" : "write",
      error: err instanceof Error ? err.message : "Unknown",
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: "Memory operation failed",
            message: err instanceof Error ? err.message : "Unknown error",
          }),
        },
      ],
      isError: true,
      meta: { latency_ms: Date.now() - startTime },
    };
  }
}

async function handleWrite(
  args: Record<string, unknown>,
  auth: AgentAuthInfo,
  startTime: number,
): Promise<ToolCallResult> {
  const content = args.content as string;
  const namespace = (args.namespace as string) || "general";
  const importance = (args.importance as number) || 5;
  const source = args.source as string | undefined;
  const expiresAt = args.expires_at as string | undefined;

  const chunks = chunkText(content);
  const storedIds: string[] = [];
  let tokensUsed = 0;

  if (content.length > AUTO_SUMMARIZE_THRESHOLD) {
    try {
      const summary = await dispatchAI("chat", {
        messages: [
          { role: "system", content: "You are a precise summarizer. Condense the following text into a concise summary (max 500 chars) preserving all key facts, data points, and conclusions." },
          { role: "user", content: content.slice(0, 16000) },
        ],
        maxTokens: 600,
        jsonMode: false,
      });
      const summaryEmbedding = await embedText(summary.content);
      const summaryId = await supabase.insertMemoryEmbedding({
        agent_id: auth.agent_id,
        content_text: `[Auto-summary] ${summary.content}`,
        embedding: summaryEmbedding,
        metadata: { source, importance, type: "auto_summary", original_length: content.length },
        importance_score: Math.max(importance, 8),
        namespace,
        expires_at: expiresAt,
      });
      if (summaryId) storedIds.push(summaryId);
      tokensUsed += summary.tokens_used;
      await supabase.insertMemoryEntry({
        agent_id: auth.agent_id,
        namespace,
        content: `[Auto-summary] ${summary.content}`,
        source_tool: source + "_auto_summary",
        importance_score: Math.max(importance, 8),
        expires_at: expiresAt,
      });
      logger.info("MemoryCore: Auto-summarized large content", {
        agent_id: auth.agent_id,
        original_length: content.length,
        summary_length: summary.content.length,
      });
    } catch (err) {
      logger.warn("MemoryCore: Auto-summarization failed, storing raw chunks", {
        error: err instanceof Error ? err.message : "Unknown",
      });
    }
  }

  for (const chunk of chunks) {
    try {
      const embedding = await embedText(chunk);
      // embedText is free-tier; no token count returned

      const memoryId = await supabase.insertMemoryEmbedding({
        agent_id: auth.agent_id,
        content_text: chunk,
        embedding,
        metadata: { source, importance },
        importance_score: importance,
        namespace,
        expires_at: expiresAt,
      });

      if (memoryId) {
        storedIds.push(memoryId);
      } else {
        logger.warn("MemoryCore: Chunk vector embedding stored but returned no ID", {
          agent_id: auth.agent_id,
          namespace,
          chunk_length: chunk.length,
        });
      }

      // Also store in memory_entries for non-vector queries
      const entryId = await supabase.insertMemoryEntry({
        agent_id: auth.agent_id,
        namespace,
        content: chunk,
        source_tool: source,
        importance_score: importance,
        expires_at: expiresAt,
      });
      if (!entryId) {
        logger.warn("MemoryCore: Chunk entry stored but returned no ID", {
          agent_id: auth.agent_id,
          namespace,
          chunk_length: chunk.length,
        });
      }
    } catch (chunkErr) {
      logger.warn("MemoryCore: Failed to store chunk", {
        agent_id: auth.agent_id,
        error: chunkErr instanceof Error ? chunkErr.message : "Unknown",
      });
    }
  }

  const writeSuccess = storedIds.length > 0;
  const responsePayload: Record<string, unknown> = {
    memory_id: storedIds[0] ?? null,
    chunks_stored: storedIds.length,
    total_chunks: chunks.length,
    namespace,
    success: writeSuccess,
  };

  if (!writeSuccess) {
    responsePayload.warning = "Memory storage failed — check Supabase RLS policies and connection config. Error details logged server-side.";
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(responsePayload),
      },
    ],
    meta: {
      latency_ms: Date.now() - startTime,
      tokens_used: tokensUsed,
      provider_used: "gemini",
    },
  };
}

async function handleSearch(
  args: Record<string, unknown>,
  auth: AgentAuthInfo,
  startTime: number,
): Promise<ToolCallResult> {
  const query = args.query as string;
  const namespace = (args.namespace as string) || "general";
  const topK = (args.top_k as number) || 5;
  const minSimilarity = (args.min_similarity as number) || 0.5;
  const shouldRerank = (args.rerank as boolean) || false;

  const queryEmbedding = await embedText(query);

  let memories = await supabase.searchMemoryEmbeddings(
    auth.agent_id,
    queryEmbedding,
    namespace,
    topK,
    minSimilarity,
  );

  if (shouldRerank && memories.length > 1) {
    try {
      const texts = memories.map((m) => m.content_text);
      const aiResult = await dispatchAI("rerank_memories", {
        query,
        results: texts,
      });
      const ranked = JSON.parse(aiResult.content) as string[];
      const textToMemory = new Map(memories.map((m) => [m.content_text, m]));
      memories = ranked
        .map((t) => textToMemory.get(t))
        .filter(Boolean) as typeof memories;
    } catch {
      logger.warn("MemoryCore: Reranking failed, using vector order");
    }
  }

  const contextBlock = memories
    .map(
      (m, i) =>
        `[Memory ${i + 1}] (importance: ${m.importance_score}/10)\n${m.content_text}`,
    )
    .join("\n\n---\n\n");

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          memories: memories.map((m) => ({
            content: m.content_text,
            namespace: m.namespace,
            importance: m.importance_score,
            source: m.metadata?.source ?? "unknown",
            created_at: m.created_at,
          })),
          total_found: memories.length,
          context_block: contextBlock,
        }),
      },
    ],
    meta: {
      latency_ms: Date.now() - startTime,
      provider_used: "gemini",
    },
  };
}
