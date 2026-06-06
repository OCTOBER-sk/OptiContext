import { ToolCallResult } from "../mcp/router";
import { AgentAuthInfo } from "../auth/verify";
import * as tavily from "../search/tavily";
import * as ddg from "../search/ddg";
import * as apify from "../search/apify";
import { buildDorkQuery, buildDorkForIntent, DorkParams } from "../search/dorking";
import { dispatchAI } from "../ai/router";
import { kv } from "../storage/kv";
import { logger } from "../utils/logger";
import crypto from "../utils/crypto";
import { searchSchema, validateArgs } from "../mcp/validation";

export async function handleSearch(
  args: Record<string, unknown>,
  auth: AgentAuthInfo,
): Promise<ToolCallResult> {
  const startTime = Date.now();
  const { query, mode, max_results: maxResults, summarize: shouldSummarize, dork: dorkParams } = validateArgs(searchSchema, args);

  // Hoisted so the catch block can include them in error telemetry
  // without re-declaring.
  let providerUsed = "unknown";
  let cacheHit = false;
  let fallbackUsed = false;

  try {
    const cacheKey = `search_cache:${await crypto.hashString(query + String(maxResults) + JSON.stringify(dorkParams) + mode + (shouldSummarize ? "s" : "r"))}`;
    const cached = await kv.get("CACHE", cacheKey);
    if (cached) {
      logger.info("Search cache hit", { agent_id: auth.agent_id });
      return {
        content: [{ type: "text", text: cached }],
        meta: {
          latency_ms: Date.now() - startTime,
          total_duration_ms: Date.now() - startTime,
          provider_used: "cache",
          cache_hit: true,
          fallback_used: false,
        },
      };
    }

    let finalQuery = query;
    if (dorkParams && Object.keys(dorkParams).length > 0) {
      finalQuery = buildDorkQuery(query, dorkParams);
    } else {
      finalQuery = buildDorkForIntent(query);
    }

    let results: string;

    switch (mode) {
      case "research": {
        const tavilyResult = await tavily.search(finalQuery, {
          max_results: maxResults,
          search_depth: "advanced",
          include_answer: true,
        });
        results = formatTavilyResults(tavilyResult.results);
        providerUsed = tavilyResult.provider;
        break;
      }

      case "fast": {
        const ddgResult = await ddg.search(finalQuery, maxResults);
        results = formatDDGResults(ddgResult.results);
        providerUsed = ddgResult.provider;
        break;
      }

      case "scrape": {
        // Extract URLs from the query for Apify scraping
        const urlRegex = /https?:\/\/[^\s]+/g;
        const urls = finalQuery.match(urlRegex) || [];
        if (urls.length > 0) {
          const apifyResult = await apify.scrape(urls, {
            maxPages: maxResults,
          });
          results = JSON.stringify(apifyResult.data);
          providerUsed = apifyResult.provider;
        } else {
          // No URLs in query — fall back to DDG
          const ddgResult = await ddg.search(finalQuery, maxResults);
          results = formatDDGResults(ddgResult.results);
          providerUsed = ddgResult.provider;
        }
        break;
      }

      case "auto":
      default: {
        const tavilyResult = await tavily.search(finalQuery, {
          max_results: maxResults,
          search_depth: "basic",
          include_answer: true,
        });

        if (tavilyResult.results.length > 0) {
          results = formatTavilyResults(tavilyResult.results);
          providerUsed = tavilyResult.provider;
        } else {
          fallbackUsed = true;
          const ddgResult = await ddg.search(finalQuery, maxResults);
          if (ddgResult.results.length > 0) {
            results = formatDDGResults(ddgResult.results);
            providerUsed = ddgResult.provider;
          } else {
            const apifyResult = await apify.scrape([finalQuery], {
              maxPages: maxResults,
            });
            results = JSON.stringify(apifyResult.data);
            providerUsed = apifyResult.provider;
          }
        }
        break;
      }
    }

    let finalResponse = results;

    if (shouldSummarize) {
      const aiResult = await dispatchAI("summarize_search", {
        query,
        results,
      }, { requiresLowLatency: true, estimatedContextTokens: results.length / 4 });
      finalResponse = aiResult.content;
      logger.info("Search results summarized", {
        agent_id: auth.agent_id,
        tokens_used: aiResult.tokens_used,
        provider: aiResult.provider_used,
      });

      // Phantom-answer suppression: when the AI returns zero sources AND
      // low confidence, replace the synthesized answer with a structured
      // warning that asks the caller to retry with research mode.
      const lowConfidence = detectLowConfidence(finalResponse);
      if (lowConfidence.isLowConfidence) {
        logger.warn("Phantom-answer suppressed", {
          agent_id: auth.agent_id,
          mode,
          provider_used: providerUsed,
          confidence: lowConfidence.confidence,
          sources_count: lowConfidence.sourcesCount,
        });
        finalResponse = JSON.stringify({
          summary: null,
          low_confidence_warning:
            "No reliable sources found. Retry using research mode.",
          requires_research_mode: true,
          confidence: lowConfidence.confidence,
          sources_count: lowConfidence.sourcesCount,
        });
      }
    }

    await kv.put("CACHE", cacheKey, finalResponse, { expirationTtl: 900 });

    const latency = Date.now() - startTime;
    return {
      content: [{ type: "text", text: finalResponse }],
      meta: {
        latency_ms: latency,
        total_duration_ms: latency,
        provider_used: providerUsed,
        cache_hit: cacheHit,
        fallback_used: fallbackUsed,
      },
    };
  } catch (err) {
    logger.error("IntelliSearch failed", {
      agent_id: auth.agent_id,
      error: err instanceof Error ? err.message : "Unknown",
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: "Search failed",
            message: err instanceof Error ? err.message : "Unknown error",
          }),
        },
      ],
      isError: true,
      meta: {
        latency_ms: Date.now() - startTime,
        total_duration_ms: Date.now() - startTime,
        provider_used: providerUsed,
        cache_hit: cacheHit,
        fallback_used: fallbackUsed,
      },
    };
  }
}

/**
 * Parses an AI-summarized search response and reports whether it
 * constitutes a "phantom answer" — i.e. a confident-sounding summary
 * produced without any backing source URLs.
 *
 * Returns `isLowConfidence: true` when BOTH conditions hold:
 *   - `sources` is empty (or absent)
 *   - `confidence` is below 0.3
 *
 * The function is tolerant of non-JSON, partial JSON, or JSON wrapped
 * in code fences — anything we can't parse is treated as "not phantom"
 * (so we never accidentally suppress a real answer just because the
 * model added markdown formatting).
 */
export function detectLowConfidence(
  aiResponse: string,
): { isLowConfidence: boolean; confidence: number; sourcesCount: number } {
  if (!aiResponse || typeof aiResponse !== "string") {
    return { isLowConfidence: false, confidence: 1, sourcesCount: 0 };
  }

  // Strip code fences if the model wrapped JSON in markdown
  const stripped = aiResponse
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: { sources?: unknown; confidence?: unknown } | null = null;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return { isLowConfidence: false, confidence: 1, sourcesCount: 0 };
  }

  if (!parsed || typeof parsed !== "object") {
    return { isLowConfidence: false, confidence: 1, sourcesCount: 0 };
  }

  const sources = Array.isArray(parsed.sources) ? parsed.sources : [];
  const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 1;

  const isLowConfidence = sources.length === 0 && confidence < 0.3;
  return { isLowConfidence, confidence, sourcesCount: sources.length };
}

function formatTavilyResults(
  results: { title: string; url: string; content: string; score: number }[],
): string {
  return JSON.stringify(
    results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      relevance: r.score,
    })),
    null,
    2,
  );
}

function formatDDGResults(
  results: { title: string; url: string; snippet: string }[],
): string {
  return JSON.stringify(
    results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
    })),
    null,
    2,
  );
}
