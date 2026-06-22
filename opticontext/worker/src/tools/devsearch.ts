/**
 * opticontext_dev_search — developer-aware search.
 *
 * Two actions:
 *   1. "search"  — run a developer query with the dispatcher.
 *                  Returns structured packages + ranked web results.
 *   2. "set_context" — store the agent's project context (manifests)
 *                       and receive memory suggestions.
 *
 * This tool does NOT replace opticontext_search. It is a strict
 * superset for developer queries: it calls the same underlying
 * providers (Tavily, DDG, Apify) plus structured package registries.
 * General web queries should still go to opticontext_search.
 */

import { z } from "zod";
import { ToolCallResult } from "../mcp/router";
import { AgentAuthInfo } from "../auth/verify";
import { runDevSearch, DevSearchResponse } from "../search/dev-router";
import {
  buildProjectContext,
  getProjectContext,
  setProjectContext,
  ProjectContext,
} from "../search/project-context";
import { kv } from "../storage/kv";
import crypto from "../utils/crypto";
import { logger } from "../utils/logger";
import { publicMetaForCapability, publicErrorMessage, isDebugMode } from "../utils/provider-abstraction";

export const devSearchSchema = z.object({
  action: z.enum(["search", "set_context"]).default("search"),
  query: z.string().max(2000).optional(),
  project_id: z.string().max(200).optional(),
  max_results: z.number().int().min(1).max(20).optional().default(5),
  timeout_ms: z.number().int().min(500).max(30000).optional().default(10_000),
  context: z
    .object({
      libsVersionsToml: z.string().max(200_000).optional(),
      buildGradleKts: z.string().max(200_000).optional(),
      buildGradle: z.string().max(200_000).optional(),
      packageJson: z.string().max(200_000).optional(),
      cargoToml: z.string().max(200_000).optional(),
      requirementsTxt: z.string().max(200_000).optional(),
      pyprojectToml: z.string().max(200_000).optional(),
      languages: z.array(z.string().max(50)).max(20).optional(),
      toolchain: z
        .object({
          java: z.string().max(20).optional(),
          kotlin: z.string().max(20).optional(),
          gradle: z.string().max(20).optional(),
          node: z.string().max(20).optional(),
          rust: z.string().max(20).optional(),
          python: z.string().max(20).optional(),
          dart: z.string().max(20).optional(),
          go: z.string().max(20).optional(),
        })
        .optional(),
    })
    .optional(),
}).refine(
  (data) => data.action !== "search" || (data.query !== undefined && data.query.length > 0),
  { message: "query is required for action=search", path: ["query"] },
);

export type DevSearchArgs = z.infer<typeof devSearchSchema>;

export async function handleDevSearch(
  args: Record<string, unknown>,
  auth: AgentAuthInfo,
): Promise<ToolCallResult> {
  const start = Date.now();
  const parsed = devSearchSchema.parse(args);

  if (parsed.action === "set_context") {
    return handleSetContext(parsed, auth, start);
  }

  // action=search
  return handleSearch(parsed, auth, start);
}

async function handleSearch(
  args: DevSearchArgs,
  auth: AgentAuthInfo,
  start: number,
): Promise<ToolCallResult> {
  const query = args.query as string;
  const projectId = args.project_id;
  const cacheKey = `devsearch:${await crypto.hashString(
    query +
      String(args.max_results) +
      (projectId ?? "") +
      (args.context ? "with-ctx" : "no-ctx"),
  )}`;
  const cached = await kv.get("CACHE", cacheKey);
  if (cached) {
    logger.info("DevSearch cache hit", { agent_id: auth.agent_id });
    return {
      content: [{ type: "text", text: cached }],
      meta: {
        latency_ms: Date.now() - start,
        total_duration_ms: Date.now() - start,
        provider_used: "cache",
        cache_hit: true,
        fallback_used: false,
      },
    };
  }

  // Resolve project context if a project_id is provided.
  let projectContext: ProjectContext | undefined;
  if (projectId) {
    projectContext = (await getProjectContext(auth.agent_id, projectId)) ?? undefined;
  }

  let response: DevSearchResponse;
  try {
    response = await runDevSearch({
      query,
      projectContext,
      timeoutMs: args.timeout_ms,
      maxResults: args.max_results,
    });
  } catch (err) {
    logger.error("DevSearch failed", {
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
        latency_ms: Date.now() - start,
        total_duration_ms: Date.now() - start,
        provider_used: publicMetaForCapability("search"),
        cache_hit: false,
        fallback_used: false,
        ...(debug ? { _debug: { internal_provider: "registry_or_search" } } : {}),
      },
    };
  }

  const text = JSON.stringify(response, null, 2);
  await kv.put("CACHE", cacheKey, text, { expirationTtl: 900 });

  const internalSource = response.packages.length > 0
    ? "registry"
    : (response.web[0]?.source ?? "search");
  const debug = isDebugMode(auth);

  return {
    content: [{ type: "text", text }],
    meta: {
      latency_ms: Date.now() - start,
      total_duration_ms: Date.now() - start,
      provider_used: debug ? internalSource : publicMetaForCapability("search"),
      cache_hit: false,
      fallback_used: false,
      ...(debug ? { _debug: { internal_provider: internalSource } } : {}),
    },
  };
}

async function handleSetContext(
  args: DevSearchArgs,
  auth: AgentAuthInfo,
  start: number,
): Promise<ToolCallResult> {
  if (!args.context) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: "context is required for action=set_context",
          }),
        },
      ],
      isError: true,
      meta: {
        latency_ms: Date.now() - start,
        total_duration_ms: Date.now() - start,
        provider_used: "dev-search",
        cache_hit: false,
        fallback_used: false,
      },
    };
  }
  const ctx = buildProjectContext(args.context, args.project_id);
  const { stored, suggestions } = await setProjectContext(auth.agent_id, ctx);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            stored,
            project_id: ctx.projectId,
            ecosystems: ctx.ecosystems,
            languages: ctx.languages,
            frameworks_detected: ctx.frameworks.length,
            toolchain: ctx.toolchain ?? null,
            memory_suggestions: suggestions,
          },
          null,
          2,
        ),
      },
    ],
    meta: {
      latency_ms: Date.now() - start,
      total_duration_ms: Date.now() - start,
      provider_used: "dev-search",
      cache_hit: false,
      fallback_used: false,
    },
  };
}
