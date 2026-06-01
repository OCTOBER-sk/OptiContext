import { filterAndSummarize, generateDorkQuery, rerankResults, simpleChat } from "./cerebras";
import { analyzeFile, embedText, uploadFileToGemini, simpleGenerate } from "./gemini";
import { withRetry } from "../utils/retry";
import { logger } from "../utils/logger";

export type Provider = "cerebras" | "gemini";
export type GeminiModel = "gemini-2.5-flash" | "gemini-2.0-flash" | "gemini-1.5-pro";

export interface TaskMetadata {
  hasFile: boolean;
  isMultimodal: boolean;
  estimatedContextTokens: number;
  requiresLowLatency: boolean;
  fileSizeBytes?: number;
  /** Force a specific provider (skip routing) */
  forceProvider?: Provider;
}

export type AITaskType =
  | "summarize_search"
  | "generate_dork"
  | "rerank_memories"
  | "chat"
  | "analyze_file"
  | "embed_text"
  | "upload_file"
  | "preprocess_tts";

export function routeToProvider(task: TaskMetadata): Provider {
  if (task.forceProvider) return task.forceProvider;
  if (task.hasFile) return "gemini";
  if (task.isMultimodal) return "gemini";
  if (task.estimatedContextTokens > 8000) return "gemini";
  if (task.requiresLowLatency) return "cerebras";
  return "cerebras";
}

export function routeGeminiModel(contextSize: number): GeminiModel {
  if (contextSize < 50000) return "gemini-2.5-flash";
  if (contextSize < 500000) return "gemini-2.0-flash";
  return "gemini-1.5-pro";
}

export function estimateContextTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface AIResult {
  content: string;
  tokens_used: number;
  provider_used: string;
}

async function tryProvider(
  provider: Provider,
  taskType: AITaskType,
  params: Record<string, unknown>,
): Promise<AIResult> {
  switch (taskType) {
    case "summarize_search": {
      const r = await filterAndSummarize(
        params.query as string,
        params.results as string,
      );
      return { content: r.summary, tokens_used: r.tokens_used, provider_used: provider };
    }
    case "generate_dork": {
      const r = await generateDorkQuery(
        params.intent as string,
        params.dorkParams as Record<string, unknown> | undefined,
      );
      return { content: r, tokens_used: 0, provider_used: provider };
    }
    case "rerank_memories": {
      const r = await rerankResults(
        params.query as string,
        params.results as string[],
      );
      return { content: JSON.stringify(r.ranked), tokens_used: r.tokens_used, provider_used: provider };
    }
    case "chat": {
      if (provider === "cerebras") {
        const r = await simpleChat(
          params.messages as Array<{ role: "system" | "user" | "assistant"; content: string }>,
          { max_tokens: (params.maxTokens as number) || 500 },
        );
        return { content: r.content, tokens_used: r.tokens_used, provider_used: provider };
      } else {
        const r = await simpleGenerate(
          (params.prompt as string) || "",
          {
            model: (params.model as string) || "gemini-2.5-flash",
            maxTokens: (params.maxTokens as number) || 4096,
            jsonMode: params.jsonMode as boolean | undefined,
          },
        );
        return { content: r.content, tokens_used: r.tokens_used, provider_used: provider };
      }
    }
    case "analyze_file": {
      const r = await analyzeFile(
        params.fileUri as string,
        params.mimeType as string,
        params.query as string,
        {
          model: (params.model as string) || "gemini-2.5-flash",
          maxTokens: (params.maxTokens as number) || 4096,
        },
      );
      return { content: r.content, tokens_used: r.tokens_used, provider_used: provider };
    }
    case "embed_text": {
      const embedding = await embedText(params.text as string);
      return { content: JSON.stringify(embedding), tokens_used: 0, provider_used: provider };
    }
    case "upload_file": {
      const r = await uploadFileToGemini(
        params.fileData as ArrayBuffer,
        params.mimeType as string,
        params.filename as string,
      );
      return { content: JSON.stringify(r), tokens_used: 0, provider_used: provider };
    }
    case "preprocess_tts": {
      const { preprocessText } = await import("../tools/voicebridge");
      const processed = preprocessText(params.text as string);
      return { content: processed, tokens_used: 0, provider_used: "none" };
    }
  }
}

function getFallbackProvider(primary: Provider): Provider | null {
  return primary === "cerebras" ? "gemini" : null;
}

export async function dispatchAI(
  taskType: AITaskType,
  params: Record<string, unknown>,
  taskMeta?: Partial<TaskMetadata>,
): Promise<AIResult> {
  const metadata: TaskMetadata = {
    hasFile: taskType === "analyze_file" || taskType === "upload_file",
    isMultimodal: false,
    estimatedContextTokens: params.estimatedContextTokens as number || 1000,
    requiresLowLatency: taskType === "summarize_search" || taskType === "generate_dork" || taskType === "preprocess_tts",
    ...taskMeta,
  };

  const primary = routeToProvider(metadata);
  const label = `${taskType}@${primary}`;

  try {
    return await withRetry(
      () => tryProvider(primary, taskType, params),
      { label, maxRetries: 2 },
    );
  } catch (primaryErr) {
    const isBudgetExceeded =
      primaryErr instanceof Error &&
      (primaryErr.message.includes("budget") || primaryErr.message.includes("exceeded"));

    const fallback = getFallbackProvider(primary);
    if (fallback && isBudgetExceeded) {
      logger.warn(`[Router] ${label} budget exceeded, falling back to ${fallback}`, {
        error: primaryErr instanceof Error ? primaryErr.message : "Unknown",
      });
      try {
        return await withRetry(
          () => tryProvider(fallback, taskType, params),
          { label: `${taskType}@${fallback}`, maxRetries: 1 },
        );
      } catch (fallbackErr) {
        logger.error(`[Router] Both providers failed for ${taskType}`, {
          primary: String(primaryErr),
          fallback: String(fallbackErr),
        });
        throw fallbackErr;
      }
    }

    throw primaryErr;
  }
}
