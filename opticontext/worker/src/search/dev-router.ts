/**
 * Dev-search dispatcher.
 *
 * Orchestrates the per-intent adapter chain:
 *   - package_lookup    → registry adapters (parallel)
 *   - framework_docs    → DDG with site:dork (existing pipeline, with boost)
 *   - api_reference     → DDG with site:dork
 *   - code_example      → DDG with site:dork + GitHub code search
 *   - compatibility_check → registry + DDG
 *   - issue_diagnosis   → DDG + forum adapter (Stack Exchange, later)
 *   - general_dev       → existing web search
 *
 * The existing `intellisearch` pipeline is reused for docs / code / forum
 * adapters — we just add domain-boost to its output.
 */

import { classifyDevQuery, ClassificationResult, DevIntent } from "./classify";
import { boostScore, preferredDomainsForFramework, buildSiteDork } from "./domain-priority";
import {
  lookupMaven,
  lookupNpm,
  lookupNuget,
  lookupPypi,
  lookupCrates,
  lookupPub,
  PackageResult,
} from "./registries";
import * as tavily from "./tavily";
import * as ddg from "./ddg";
import { ProjectContext, projectMentionsInQuery } from "./project-context";
import { withTimeout } from "../utils/with-timeout";
import { logger } from "../utils/logger";

export interface DevSearchOptions {
  query: string;
  /** Optional pre-resolved project context. */
  projectContext?: ProjectContext;
  /** Hard ceiling for the whole call. Default 10s. */
  timeoutMs?: number;
  /** Max results to return per category. Default 5. */
  maxResults?: number;
}

export interface DevSearchResponse {
  query: string;
  intent: DevIntent;
  confidence: number;
  /** Structured package result (only present for package_lookup, compatibility_check). */
  packages: PackageResult[];
  /** Ranked web results (docs / code / forum), with priority boost applied. */
  web: WebResult[];
  /** Memory suggestions derived from the project context. */
  memory_suggestions: Array<{ content: string; namespace: string; importance: number; reason: string }>;
  /** Diagnostics — useful for agent self-correction. */
  meta: {
    adapters_attempted: string[];
    adapters_succeeded: string[];
    total_ms: number;
    cache_hit: boolean;
  };
}

export interface WebResult {
  title: string;
  url: string;
  content: string;
  score: number;
  /** Multiplier applied by domain-priority. */
  priority: number;
  source: "search";
}

/**
 * Run a developer search. This is the main entry point used by the
 * `opticontext_dev_search` tool handler.
 */
export async function runDevSearch(opts: DevSearchOptions): Promise<DevSearchResponse> {
  const start = Date.now();
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const maxResults = opts.maxResults ?? 5;
  const classification = classifyDevQuery(opts.query);

  const attempted: string[] = [];
  const succeeded: string[] = [];

  // Run the right adapter chain in parallel where possible.
  const [packages, webRaw] = await Promise.all([
    runPackageAdapter(classification, opts)
      .then((r) => {
        attempted.push("package");
        if (r.length > 0) succeeded.push("package");
        return r;
      })
      .catch((err) => {
        logger.warn("[dev-search] package adapter failed", {
          error: err instanceof Error ? err.message : "Unknown",
        });
        return [] as PackageResult[];
      }),
    runWebAdapter(classification, opts, maxResults)
      .then((r) => {
        attempted.push("web");
        if (r.length > 0) succeeded.push("web");
        return r;
      })
      .catch((err) => {
        logger.warn("[dev-search] web adapter failed", {
          error: err instanceof Error ? err.message : "Unknown",
        });
        return [] as WebResult[];
      }),
  ]);

  // Apply project-mention boost.
  const projectMentions = opts.projectContext
    ? projectMentionsInQuery(opts.projectContext, opts.query)
    : [];
  const web = applyProjectBoost(webRaw, projectMentions, opts.query);

  // Memory suggestions only matter when a project context was supplied.
  const memorySuggestions = projectMentions.length > 0
    ? projectMentions.map((f) => ({
        content: `Project uses ${f.name}${f.version ? " " + f.version : ""} — relevant to query "${opts.query}"`,
        namespace: `project:${opts.projectContext!.projectId ?? "default"}:relevant`,
        importance: 4,
        reason: "Detected project context overlap with query",
      }))
    : [];

  return {
    query: opts.query,
    intent: classification.intent,
    confidence: classification.confidence,
    packages,
    web,
    memory_suggestions: memorySuggestions,
    meta: {
      adapters_attempted: attempted,
      adapters_succeeded: succeeded,
      total_ms: Date.now() - start,
      cache_hit: false, // not implemented yet — package adapter is the cacheable layer
    },
  };
}

async function runPackageAdapter(
  classification: ClassificationResult,
  opts: DevSearchOptions,
): Promise<PackageResult[]> {
  // Only invoke registry adapters for intents where they're likely to be useful.
  const usePackage =
    classification.intent === "package_lookup" ||
    classification.intent === "compatibility_check" ||
    classification.intent === "general_dev" && !!classification.extracted.mavenCoord;

  if (!usePackage) return [];

  const tasks: Array<Promise<PackageResult | null>> = [];

  if (classification.extracted.mavenCoord) {
    const { group, artifact } = classification.extracted.mavenCoord;
    tasks.push(withTimeout(3000, lookupMaven(group, artifact)));
  }
  if (classification.extracted.npmPackage) {
    tasks.push(withTimeout(3000, lookupNpm(classification.extracted.npmPackage)));
  }
  if (classification.extracted.nugetId) {
    tasks.push(withTimeout(3000, lookupNuget(classification.extracted.nugetId)));
  }
  if (classification.extracted.crateName) {
    tasks.push(withTimeout(3000, lookupCrates(classification.extracted.crateName)));
  }
  if (classification.extracted.pypiPackage) {
    tasks.push(withTimeout(3000, lookupPypi(classification.extracted.pypiPackage)));
  }
  if (classification.extracted.pubPackage) {
    tasks.push(withTimeout(3000, lookupPub(classification.extracted.pubPackage)));
  }

  if (tasks.length === 0) {
    // No extracted package identifier. Try a fuzzy package-name match
    // only if the query has a clearly-cased identifier (PascalCase or
    // kebab-case single token).
    const fuzzy = extractFuzzyPackageName(opts.query);
    if (fuzzy) {
      tasks.push(withTimeout(3000, lookupNpm(fuzzy)));
    }
  }

  if (tasks.length === 0) return [];
  const settled = await Promise.allSettled(tasks);
  return settled
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((r): r is PackageResult => r !== null);
}

async function runWebAdapter(
  classification: ClassificationResult,
  opts: DevSearchOptions,
  maxResults: number,
): Promise<WebResult[]> {
  // Skip web for pure package_lookup (structured response is enough).
  if (classification.intent === "package_lookup" && classification.confidence >= 0.9) {
    return [];
  }

  const framework = classification.extracted.framework;
  const preferredDomains = preferredDomainsForFramework(framework);
  const dork = buildSiteDork(preferredDomains.slice(0, 5)); // limit dork size
  const finalQuery = dork ? `${dork} (${opts.query})` : opts.query;

  // Try Tavily first (depth), fall back to DDG.
  try {
    const tav = await tavily.search(finalQuery, {
      max_results: maxResults,
      search_depth: "basic",
      include_answer: false, // dev_search returns structured data; do not summarize
    });
    if (tav.results.length > 0) {
      return tav.results.map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
        priority: boostScore(r.url),
        source: "search" as const,
      }));
    }
  } catch {
    // fall through to DDG
  }

  try {
    const d = await ddg.search(finalQuery, maxResults);
    if (d.results.length > 0) {
      return d.results.map((r) => ({
        title: r.title,
        url: r.url,
        content: r.snippet,
        score: 0.5,
        priority: boostScore(r.url),
        source: "search" as const,
      }));
    }
  } catch {
    // both failed
  }

  return [];
}

function applyProjectBoost(
  results: WebResult[],
  projectMentions: ReturnType<typeof projectMentionsInQuery>,
  query: string,
): WebResult[] {
  if (results.length === 0) return results;
  const q = query.toLowerCase();
  return results
    .map((r) => {
      let score = r.score * r.priority;
      const contentLower = r.content.toLowerCase();
      for (const f of projectMentions) {
        if (contentLower.includes(f.name.toLowerCase())) score *= 1.2;
        if (f.version && contentLower.includes(f.version)) score *= 1.1;
      }
      // Slight boost for results that quote version numbers — devs care
      // about exactness.
      if (/\b\d+\.\d+(\.\d+)?\b/.test(r.content) || /\b\d+\.\d+(\.\d+)?\b/.test(r.title)) {
        score *= 1.05;
      }
      return { ...r, score };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Best-effort: when the query is something like "what is opus codec" or
 * "Concentus .NET", try to extract a candidate package name. Conservative —
 * only returns when there's a single clear PascalCase or kebab-case token
 * and the query otherwise looks like a package lookup.
 */
function extractFuzzyPackageName(query: string): string | null {
  const trimmed = query.trim();
  // Match single PascalCase / kebab-case token.
  const m = trimmed.match(/\b([A-Z][A-Za-z0-9]+(?:[A-Z][a-z0-9]+)+)\b/);
  if (m) return m[1];
  const m2 = trimmed.match(/\b([a-z][a-z0-9]+-[a-z0-9][a-z0-9-]*)\b/);
  if (m2) return m2[1];
  return null;
}
