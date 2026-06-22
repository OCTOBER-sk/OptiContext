import { getEnv } from "../context";
import { ProviderError } from "../utils/errors";
import { logger } from "../utils/logger";
import { kv } from "../storage/kv";

const CEREBRAS_API_BASE = "https://api.cerebras.ai/v1";
const DAILY_TOKEN_LIMIT = 1_000_000;

interface CerebrasMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CerebrasRequest {
  model: string;
  messages: CerebrasMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

interface CerebrasResponse {
  id: string;
  choices: {
    message: { content: string };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function checkCerebrasBudget(tokenCost: number): Promise<boolean> {
  const date = new Date().toISOString().slice(0, 10);
  const key = `cerebras_tokens:${date}`;
  const used = parseInt((await kv.get("CACHE", key)) ?? "0", 10);
  if (used + tokenCost > DAILY_TOKEN_LIMIT) {
    logger.warn("[Cerebras] Daily token budget exceeded", {
      used,
      limit: DAILY_TOKEN_LIMIT,
    });
    return false;
  }
  await kv.put("CACHE", key, (used + tokenCost).toString(), {
    expirationTtl: 86400,
  });
  return true;
}

async function cerebrasCompletion(
  messages: CerebrasMessage[],
  options: {
    model?: string;
    max_tokens?: number;
    temperature?: number;
  } = {},
): Promise<{ content: string; tokens_used: number }> {
  const apiKey = getEnv().CEREBRAS_API_KEY;

  if (!apiKey) {
    logger.warn("[Cerebras] CEREBRAS_API_KEY not set");
    throw new ProviderError("CEREBRAS_API_KEY not configured. Set it or the router will use Gemini as fallback.", "cerebras", 503);
  }

  const budgetAllowed = await checkCerebrasBudget(options.max_tokens || 500);
  if (!budgetAllowed) {
    logger.warn("[Cerebras] Daily token budget exceeded — router will fall back to Gemini");
    throw new ProviderError("Cerebras daily token budget (1M) exceeded", "cerebras", 429);
  }

  try {
    const response = await fetch(`${CEREBRAS_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || "gpt-oss-120b",
        messages,
        max_tokens: options.max_tokens || 500,
        temperature: options.temperature ?? 0.3,
        stream: false,
      } satisfies CerebrasRequest),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ProviderError(
        `Cerebras API error: ${response.status} ${text}`,
        "cerebras",
        response.status,
      );
    }

    const data = (await response.json()) as CerebrasResponse;
    return {
      content: data.choices[0]?.message?.content ?? "",
      tokens_used: data.usage?.total_tokens ?? 0,
    };
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    throw new ProviderError(
      `Cerebras request failed: ${err instanceof Error ? err.message : "Unknown"}`,
      "cerebras",
    );
  }
}

export async function filterAndSummarize(
  query: string,
  results: string,
): Promise<{ summary: string; tokens_used: number }> {
  const systemPrompt = `You are a precise search result filter for an AI agent working in a developer-tools context.

Given a search query and raw search results, filter and summarize them.

PRESERVE (do not paraphrase, do not summarize away):
- Exact version numbers (e.g. "1.4.1", "2.31.0", "v18.2.0")
- Exact package coordinates (e.g. "androidx.media3:media3-exoplayer:1.4.1", "npm install react@18.2.0")
- Exact API names, class names, method signatures
- Code blocks — quote them verbatim if they are short, otherwise summarize the first line and the URL
- Deprecation notices and "removed in version X" warnings
- License strings
- Exact URLs of official documentation pages

REMOVE:
- Ads, nav links, cookie notices
- Off-topic content
- Blog post preambles ("In this article we will...") that don't contain technical facts

Return ONLY valid JSON with these keys:
- summary: string (2-3 sentence overview, preserving exact facts)
- facts: array of { fact: string, source: string, confidence: number }
- sources: string[] (top source URLs, prioritized by relevance)
- confidence: number (0-1, how relevant results are to the query)`;

  const result = await cerebrasCompletion(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Query: ${query}\n\nResults:\n${results}`,
      },
    ],
    { max_tokens: 800 },
  );

  return { summary: result.content, tokens_used: result.tokens_used };
}

export async function generateDorkQuery(
  intent: string,
  dorkParams?: Record<string, unknown>,
): Promise<string> {
  const systemPrompt =
    "You are a search dorking expert. Convert natural language search intents into precise search queries using Google dork operators (site:, filetype:, inurl:, intitle:, after:, before:, -term, \"phrase\"). Return ONLY the final query string, no explanation.";

  const paramsStr = dorkParams
    ? `\nAdditional constraints: ${JSON.stringify(dorkParams)}`
    : "";

  const result = await cerebrasCompletion(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Convert this search intent into a dorked query:\n${intent}${paramsStr}`,
      },
    ],
    { max_tokens: 100 },
  );

  return result.content.trim();
}

export async function rerankResults(
  query: string,
  results: string[],
): Promise<{ ranked: string[]; tokens_used: number }> {
  if (results.length <= 1) return { ranked: results, tokens_used: 0 };

  const result = await cerebrasCompletion(
    [
      {
        role: "system",
        content:
          "You are a relevance reranker. Given a query and results, return a JSON array of integer indices ordered by relevance (most relevant first). Return ONLY the JSON array, e.g. [2, 0, 1].",
      },
      {
        role: "user",
        content: `Query: ${query}\n\nResults:\n${results.map((r, i) => `[${i}]: ${r}`).join("\n")}`,
      },
    ],
    { max_tokens: 50 },
  );

  try {
    const indices = JSON.parse(result.content) as number[];
    const ranked = indices
      .filter((i) => i >= 0 && i < results.length)
      .map((i) => results[i]);
    // Append any missed results at the end
    const included = new Set(indices);
    results.forEach((r, i) => {
      if (!included.has(i)) ranked.push(r);
    });
    return { ranked, tokens_used: result.tokens_used };
  } catch {
    // Reranking parse failed — return original order
    return { ranked: results, tokens_used: result.tokens_used };
  }
}

export async function simpleChat(
  messages: CerebrasMessage[],
  options?: { max_tokens?: number },
): Promise<{ content: string; tokens_used: number }> {
  return cerebrasCompletion(messages, options);
}
