import { getEnv } from "../context";
import { ProviderError } from "../utils/errors";
import { logger } from "../utils/logger";
import { kv } from "../storage/kv";
import { providerFetch, safeJson } from "../utils/safe-fetch";

const TAVILY_API_BASE = "https://api.tavily.com";
const DAILY_REQUEST_LIMIT = 250;

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content: string | null;
}

interface TavilyResponse {
  results: TavilySearchResult[];
  answer: string;
  query: string;
  response_time: number;
}

/**
 * Daily budget guard: tracked in KV so it survives across Worker instances.
 * Key: tavily_requests:<YYYY-MM-DD> → requests used today
 *
 * Throws ProviderError if the daily limit has been reached.
 * Does NOT increment yet — call deductTavilyBudget() only after a successful API response.
 */
async function checkTavilyBudget(creditCost: number): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const key = `tavily_requests:${date}`;
  const used = parseInt((await kv.get("CACHE", key)) ?? "0", 10);
  if (used + creditCost > DAILY_REQUEST_LIMIT) {
    logger.warn("[Tavily] Daily request budget exceeded", { used, limit: DAILY_REQUEST_LIMIT });
    throw new ProviderError(
      `Tavily daily request budget (${DAILY_REQUEST_LIMIT}) exceeded. Try again tomorrow or use fast/auto mode which routes to DuckDuckGo (free, no budget).`,
      "tavily",
      429,
    );
  }
}

async function deductTavilyBudget(creditCost: number): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const key = `tavily_requests:${date}`;
  const used = parseInt((await kv.get("CACHE", key)) ?? "0", 10);
  await kv.put("CACHE", key, (used + creditCost).toString(), {
    expirationTtl: 86400,
  });
}

export async function search(
  query: string,
  options: {
    max_results?: number;
    include_answer?: boolean;
    search_depth?: "basic" | "advanced";
  } = {},
): Promise<{ results: TavilySearchResult[]; creditsUsed: number; provider: string }> {
  const apiKey = getEnv().TAVILY_API_KEY;

  if (!apiKey) {
    logger.warn("[Tavily] TAVILY_API_KEY not set");
    return { results: [], creditsUsed: 0, provider: "tavily" };
  }

  const searchDepth = options.search_depth ?? "basic";
  const creditCost = searchDepth === "advanced" ? 2 : 1;

  await checkTavilyBudget(creditCost);

  try {
    const { response, error: fetchError } = await providerFetch(
      `${TAVILY_API_BASE}/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          search_depth: searchDepth,
          include_answer: options.include_answer ?? true,
          max_results: options.max_results ?? 5,
          include_raw_content: false,
        }),
      },
    );

    if (fetchError || !response) {
      throw new ProviderError(
        `Tavily request failed: ${fetchError ?? "No response"}`,
        "tavily",
      );
    }

    if (!response.ok) {
      const text = await response.text();
      throw new ProviderError(
        `Tavily search failed: ${response.status} ${text.slice(0, 500)}`,
        "tavily",
        response.status,
      );
    }

    const data = await safeJson<TavilyResponse>(response);
    if (!data) {
      throw new ProviderError("Tavily returned invalid or empty response", "tavily");
    }

    // Deduct credits only after a confirmed successful response.
    deductTavilyBudget(creditCost).catch(() => {});

    return {
      results: data.results ?? [],
      creditsUsed: creditCost,
      provider: "tavily",
    };
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    throw new ProviderError(
      `Tavily request failed: ${err instanceof Error ? err.message : "Unknown"}`,
      "tavily",
    );
  }
}
