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
import { publicMetaForCapability, publicMetaProvider, publicErrorMessage, isDebugMode } from "../utils/provider-abstraction";

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

      // Phantom-answer suppression. Three checks, in order of severity:
      //   1. detectLowConfidence — empty sources AND low model confidence
      //   2. detectUngroundedFacts — at least one fact with no supporting source
      //   3. detectOverconfidentSummary — high confidence but no sources
      const lowConfidence = detectLowConfidence(finalResponse);
      const ungrounded = detectUngroundedFacts(finalResponse, results);
      const overconfident = detectOverconfidentSummary(finalResponse);

      if (lowConfidence.isLowConfidence || ungrounded.isUngrounded || overconfident.isOverconfident) {
        logger.warn("Phantom-answer suppressed", {
          agent_id: auth.agent_id,
          mode,
          provider_used: providerUsed,
          confidence: lowConfidence.confidence,
          sources_count: lowConfidence.sourcesCount,
          ungrounded_facts: ungrounded.ungroundedCount,
          total_facts: ungrounded.totalFacts,
          overconfident: overconfident.isOverconfident,
        });
        finalResponse = JSON.stringify({
          summary: null,
          low_confidence_warning: (() => {
            if (ungrounded.isUngrounded) {
              return `Detected ${ungrounded.ungroundedCount} ungrounded fact(s) — at least one claim in the summary is not supported by the search results. Retry with research mode or a more specific query.`;
            }
            if (overconfident.isOverconfident) {
              return "Model expressed high confidence but provided no sources. Retry with research mode.";
            }
            return "No reliable sources found. Retry using research mode.";
          })(),
          requires_research_mode: true,
          confidence: lowConfidence.confidence,
          sources_count: lowConfidence.sourcesCount,
          ungrounded_facts: ungrounded.ungroundedCount,
          total_facts: ungrounded.totalFacts,
        });
      }
    }

    await kv.put("CACHE", cacheKey, finalResponse, { expirationTtl: 900 });

    const latency = Date.now() - startTime;
    const debug = isDebugMode(auth);
    return {
      content: [{ type: "text", text: finalResponse }],
      meta: {
        latency_ms: latency,
        total_duration_ms: latency,
        provider_used: debug ? providerUsed : publicMetaForCapability("search"),
        cache_hit: cacheHit,
        // Always emit fallback_used for telemetry contract — value is meaningful
        // only in debug mode. Non-debug consumers see a stable false.
        fallback_used: debug ? fallbackUsed : false,
        ...(debug ? { _debug: { internal_provider: providerUsed } } : {}),
      },
    };
  } catch (err) {
    // Log the original error with provider details for telemetry. Never expose.
    logger.error("IntelliSearch failed", {
      agent_id: auth.agent_id,
      error: err instanceof Error ? err.message : "Unknown",
    });

    const debug = isDebugMode(auth);
    const publicErr = publicErrorMessage(err, { capability: "search", debug });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: publicErr.code,
            message: publicErr.message,
            ...(publicErr.retry_hint ? { retry_hint: publicErr.retry_hint } : {}),
            ...(debug && err instanceof Error ? { _debug: { raw: err.message } } : {}),
          }),
        },
      ],
      isError: true,
      meta: {
        latency_ms: Date.now() - startTime,
        total_duration_ms: Date.now() - startTime,
        provider_used: debug ? providerUsed : publicMetaForCapability("search"),
        cache_hit: cacheHit,
        fallback_used: debug ? fallbackUsed : false,
        ...(debug ? { _debug: { internal_provider: providerUsed } } : {}),
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

/**
 * Heuristic grounding check: for each `fact` in the AI response, verify
 * that at least one of its `source` URLs is mentioned (or its domain
 * appears) in the raw search results string. This catches the most
 * common phantom pattern: the model cites a plausible URL that was
 * NOT in the input context.
 *
 * Conservative on purpose — we only flag a fact as ungrounded when
 * *no* part of its source URL is present in the input. A fact with
 * no source at all is always considered ungrounded.
 */
export function detectUngroundedFacts(
  aiResponse: string,
  rawResults: string,
): { isUngrounded: boolean; ungroundedCount: number; totalFacts: number } {
  if (!aiResponse) return { isUngrounded: false, ungroundedCount: 0, totalFacts: 0 };
  const stripped = aiResponse
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  let parsed: { facts?: unknown } | null = null;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return { isUngrounded: false, ungroundedCount: 0, totalFacts: 0 };
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.facts)) {
    return { isUngrounded: false, ungroundedCount: 0, totalFacts: 0 };
  }
  const facts = parsed.facts as Array<{ source?: unknown }>;
  const lowerResults = (rawResults ?? "").toLowerCase();
  let ungrounded = 0;
  for (const f of facts) {
    if (typeof f !== "object" || f === null) continue;
    const source = (f as { source?: unknown }).source;
    if (typeof source !== "string" || source.length === 0) {
      ungrounded++;
      continue;
    }
    // Accept either the full URL or the hostname being present in the raw results.
    const lowerSource = source.toLowerCase();
    let host = lowerSource;
    try {
      host = new URL(source).hostname.toLowerCase();
    } catch {
      // not a URL — fall through to substring match
    }
    if (!lowerResults.includes(lowerSource) && !lowerResults.includes(host)) {
      ungrounded++;
    }
  }
  return {
    isUngrounded: ungrounded > 0,
    ungroundedCount: ungrounded,
    totalFacts: facts.length,
  };
}

/**
 * Detect "confident synthesis with no source citations" — a model
 * that returns a high `confidence` but an empty `sources` array.
 * The original `detectLowConfidence` only catches this when
 * confidence < 0.3; this catches the inverse pattern where the
 * model is confidently wrong.
 */
export function detectOverconfidentSummary(
  aiResponse: string,
): { isOverconfident: boolean; confidence: number; sourcesCount: number } {
  if (!aiResponse) return { isOverconfident: false, confidence: 1, sourcesCount: 0 };
  const stripped = aiResponse
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  let parsed: { sources?: unknown; confidence?: unknown } | null = null;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return { isOverconfident: false, confidence: 1, sourcesCount: 0 };
  }
  if (!parsed || typeof parsed !== "object") {
    return { isOverconfident: false, confidence: 1, sourcesCount: 0 };
  }
  const sources = Array.isArray(parsed.sources) ? parsed.sources : [];
  const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0;
  const isOverconfident = sources.length === 0 && confidence >= 0.85;
  return { isOverconfident, confidence, sourcesCount: sources.length };
}

/**
 * Strips a code fence from a JSON response. Exposed for tests.
 */
export function stripCodeFence(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
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
