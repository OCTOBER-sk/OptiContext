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

  try {
    const cacheKey = `search_cache:${await crypto.hashString(query + String(maxResults) + JSON.stringify(dorkParams) + mode + (shouldSummarize ? "s" : "r"))}`;
    const cached = await kv.get("CACHE", cacheKey);
    if (cached) {
      logger.info("Search cache hit", { agent_id: auth.agent_id });
      return {
        content: [{ type: "text", text: cached }],
        meta: { latency_ms: Date.now() - startTime, provider_used: "cache" },
      };
    }

    let finalQuery = query;
    if (dorkParams && Object.keys(dorkParams).length > 0) {
      finalQuery = buildDorkQuery(query, dorkParams);
    } else {
      finalQuery = buildDorkForIntent(query);
    }

    let results: string;
    let providerUsed: string;

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
    }

    await kv.put("CACHE", cacheKey, finalResponse, { expirationTtl: 900 });

    const latency = Date.now() - startTime;
    return {
      content: [{ type: "text", text: finalResponse }],
      meta: {
        latency_ms: latency,
        provider_used: providerUsed,
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
      meta: { latency_ms: Date.now() - startTime },
    };
  }
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
