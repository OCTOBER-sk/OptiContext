import { setEnv, getEnv, Env } from "./context";
import type { ExecutionContext } from "@cloudflare/workers-types";
import { handleMCPRequest } from "./mcp/server";
import { verifyApiKey, registerApiKey, extractBearerToken } from "./auth/verify";
import { r2 } from "./storage/r2";
import { kv } from "./storage/kv";
import { turso } from "./storage/turso";
import { supabase } from "./storage/supabase";
import { logger } from "./utils/logger";
import { corsHeaders, corsPreflightHeaders } from "./utils/cors";
import cryptoUtil from "./utils/crypto";
import { GUIDE } from "./tools/guide";
import { assertOwnership, OwnershipError, ownershipErrorResponse } from "./auth/ownership";
import { verifyFirebaseToken } from "./auth/verify-firebase";
import { sanitizeFilename, safeExtension, validateMimeType } from "./utils/safe-fetch";

const SERVER_VERSION = "1.0.0";

// Track worker start time for uptime reporting (CF Workers don't have process.uptime)
const WORKER_START_MS = Date.now();

// ── Body size limits ──────────────────────────────────────────────────────────
const MAX_JSON_BODY_BYTES = 1 * 1024 * 1024;      // 1 MB for JSON endpoints
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;         // 25 MB for file uploads (staging)

/**
 * Validates request body size against a limit before consuming the body.
 * Returns null if OK, or an error Response if the body exceeds the limit.
 */
function checkBodySize(request: Request, maxBytes: number): Response | null {
  const contentLength = request.headers.get("Content-Length");
  if (contentLength) {
    const length = parseInt(contentLength, 10);
    if (isNaN(length) || length < 0) {
      return jsonResponse({ error: "Invalid Content-Length header" }, 400, request);
    }
    if (length > maxBytes) {
      return jsonResponse({ error: `Request body too large. Maximum ${Math.round(maxBytes / 1024 / 1024)} MB.` }, 413, request);
    }
  }
  return null;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // ── 1. Inject env into all modules ──────────────────────────────
    setEnv(env);

    const url = new URL(request.url);
    const { pathname } = url;
    const startTime = Date.now();

    logger.info(`${request.method} ${pathname}`);

    // ── 2. Route ─────────────────────────────────────────────────────
    try {
      // CORS preflight (all routes)
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsPreflightHeaders(request),
        });
      }

      // Public endpoints
      if (pathname === "/health") return handleHealth();
      if (pathname === "/mcp") return await handleMCPRequest(request, ctx);
      if (pathname === "/guide") return handleGuideDownload();
      if (pathname === "/sse") return await handleLegacySSE(request, ctx);

      // Authenticated agent endpoints
      if (pathname === "/upload" && request.method === "POST") {
        return await handleUpload(request);
      }
      if (pathname === "/usage" && request.method === "GET") {
        return await handleUsage(request);
      }
      if (pathname === "/usage/activity" && request.method === "GET") {
        return await handleUserActivity(request);
      }

      // Admin endpoints (require ADMIN_SECRET header)
      if (pathname === "/admin/agents") {
        if (request.method === "POST") return await handleAdminCreateAgent(request, env);
        if (request.method === "GET") return await handleAdminListAgents(request, env);
      }
      if (pathname.startsWith("/admin/agents/") && pathname.endsWith("/rename")) {
        if (request.method === "POST") return await handleAdminRenameAgent(request, env, pathname);
      }
      if (pathname.startsWith("/admin/agents/") && pathname.endsWith("/revoke")) {
        if (request.method === "POST") return await handleAdminRevokeAgent(request, env, pathname);
      }
      if (pathname === "/admin/logs" && request.method === "GET") {
        return await handleAdminLogs(request, env, url);
      }

      return new Response(
        JSON.stringify({ error: "Not Found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders(request) } },
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown";
      const errStack = err instanceof Error ? err.stack : undefined;
      logger.error("Unhandled request error", {
        error: errMsg,
        stack: errStack,
        path: pathname,
        method: request.method,
        latency_ms: Date.now() - startTime,
      });
      return new Response(
        JSON.stringify({ error: "Internal Server Error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders(request) } },
      );
    }
  },
};

// ── Handlers ──────────────────────────────────────────────────────────────────

function handleHealth(): Response {
  const body = JSON.stringify({
    status: "ok",
    version: SERVER_VERSION,
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - WORKER_START_MS) / 1000),
    tools: [
      "opticontext_search",
      "opticontext_tts",
      "opticontext_analyze",
      "opticontext_memory_write",
      "opticontext_memory_search",
      "opticontext_guide",
    ],
  });
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function handleGuideDownload(): Response {
  return new Response(GUIDE, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="opticontext-agent-guide.md"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/** Legacy SSE endpoint — redirects old clients to /mcp */
async function handleLegacySSE(request: Request, ctx?: ExecutionContext): Promise<Response> {
  return handleMCPRequest(request, ctx);
}

async function handleUpload(request: Request): Promise<Response> {
  const authHeader = extractBearerToken(request);
  let authInfo;
  const uploadSizeCheck = checkBodySize(request, MAX_UPLOAD_BYTES);
  if (uploadSizeCheck) return uploadSizeCheck;
  try {
    authInfo = await verifyApiKey(authHeader);
  } catch {
    return jsonResponse({ error: "Unauthorized" }, 401, request);
  }

  try {
    const formData = await request.formData();
    const fileField = formData.get("file");

    if (!fileField || typeof fileField !== "object" || !("size" in fileField)) {
      return jsonResponse({ error: "No file field in form data" }, 400, request);
    }

    const file = fileField as unknown as File;

    // 25 MB limit (staging)
    if (file.size > 25 * 1024 * 1024) {
      return jsonResponse({ error: "File too large. Max 25 MB." }, 413, request);
    }

    const safeName = sanitizeFilename(file.name);
    const mimeError = validateMimeType(file.type || "application/octet-stream", safeName);
    if (mimeError) {
      return jsonResponse({ error: mimeError }, 400, request);
    }

    const uploadId = cryptoUtil.randomHex(16);
    const ext = safeExtension(file.name) || "bin";
    const r2Key = `${authInfo.agent_id}/${uploadId}.${ext}`;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const fileBuffer = await file.arrayBuffer();
    await r2.put("files", r2Key, fileBuffer, {
      // R2 does not support per-object expirationTtl in the Workers API.
      // Expiry is enforced at read time: the handler compares expires_at metadata
      // against Date.now() and returns UPLOAD_EXPIRED (-32071) if the window has passed.
      // For automatic cleanup, configure a bucket lifecycle rule in the Cloudflare dashboard
      // with a 1-day expiration on the files/ prefix.
      customMetadata: {
        filename: safeName,
        mimeType: file.type || "application/octet-stream",
        agent_id: authInfo.agent_id,
        size_bytes: file.size.toString(),
        expires_at: expiresAt,
      },
    });

    // Persist file record to Turso for tracking and re-analysis via file_id
    turso.storeFileRecord({
      file_id: uploadId,
      agent_id: authInfo.agent_id,
      filename: safeName,
      mime_type: file.type || "application/octet-stream",
      file_size: file.size,
      r2_key: r2Key,
    }).catch((err: Error) => {
      logger.warn("Upload: Turso file record failed", {
        upload_id: uploadId, error: err.message,
      });
    });

    return jsonResponse(
      {
        upload_id: `${uploadId}.${ext}`,
        filename: safeName,
        size_bytes: file.size,
        mime_type: file.type,
        expires_at: expiresAt,
        note: "Use this upload_id in opticontext_analyze within 24 hours.",
      },
      201,
      request,
    );
  } catch (err) {
    logger.error("Upload failed", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    return jsonResponse({ error: "Upload failed" }, 500, request);
  }
}

async function handleUsage(request: Request): Promise<Response> {
  const authHeader = extractBearerToken(request);
  const urlObj = new URL(request.url);
  let agentId: string | null = null;

  const env = getEnv();

  // Admin access path: verify Firebase JWT (production) or admin secret (dev mode)
  // Ownership is enforced for Firebase-authenticated users.
  if (request.headers.get("X-OptiContext-Admin") === "1") {
    const { authorized, email, hasOwnershipContext } = await getFirebaseUser(request, env);
    if (!authorized) return jsonResponse({ error: "Unauthorized" }, 401, request);
    agentId = urlObj.searchParams.get("agent_id") ?? null;
    if (!agentId) {
      return jsonResponse({ error: "Missing agent_id query parameter for admin access" }, 400, request);
    }
    try {
      await assertOwnership(agentId, email, hasOwnershipContext);
    } catch (err) {
      if (err instanceof OwnershipError) return ownershipErrorResponse(err, request);
      throw err;
    }
  } else {
    // Agent key path
    try {
      const authInfo = await verifyApiKey(authHeader);
      agentId = authInfo.agent_id;
    } catch {
      return jsonResponse({ error: "Unauthorized" }, 401, request);
    }
  }

  try {
    const [dailyUsage, recentRequests, providerUsage, keyInfo] = await Promise.all([
      turso.getUsageStats(agentId, 30),
      turso.getRecentRequests(agentId, 100),
      turso.getProviderBreakdown(agentId, 30),
      turso.getAgentKeyInfo(agentId),
    ]);

    const toolBreakdown: Record<string, { count: number; tokens: number }> = {};
    let monthlyRequests = 0;
    let monthlyTokens = 0;

    for (const usage of dailyUsage) {
      if (!toolBreakdown[usage.tool_name]) {
        toolBreakdown[usage.tool_name] = { count: 0, tokens: 0 };
      }
      toolBreakdown[usage.tool_name].count += usage.count;
      toolBreakdown[usage.tool_name].tokens += usage.tokens_total;
      monthlyRequests += usage.count;
      monthlyTokens += usage.tokens_total;
    }

    // Calculate today_requests from daily_usage table (UTC date) instead of recentRequests
    const todayDate = new Date().toISOString().split('T')[0];
    const todayRequests = dailyUsage
      .filter((u) => u.date === todayDate)
      .reduce((sum, u) => sum + u.count, 0);

    return jsonResponse({
      agent_id: agentId,
      today_requests: todayRequests,
      monthly_requests: monthlyRequests,
      monthly_tokens: monthlyTokens,
      tool_breakdown: toolBreakdown,
      provider_breakdown: providerUsage,
      key_status: keyInfo
        ? {
            created_at: keyInfo.created_at,
            last_used: keyInfo.last_used,
            revoked: keyInfo.revoked === 1,
          }
        : null,
    }, 200, request);
  } catch (err) {
    logger.error("Usage fetch failed", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    return jsonResponse({ error: "Failed to fetch usage" }, 500, request);
  }
}

async function handleUserActivity(request: Request): Promise<Response> {
  const authHeader = extractBearerToken(request);
  const urlObj = new URL(request.url);
  let agentId: string | null = null;

  const env = getEnv();

  // Admin access path: verify Firebase JWT (production) or admin secret (dev mode)
  if (request.headers.get("X-OptiContext-Admin") === "1") {
    const { authorized, email, hasOwnershipContext } = await getFirebaseUser(request, env);
    if (!authorized) return jsonResponse({ error: "Unauthorized" }, 401, request);
    agentId = urlObj.searchParams.get("agent_id") ?? null;
    if (!agentId) {
      return jsonResponse({ error: "Missing agent_id query parameter for admin access" }, 400, request);
    }
    try {
      await assertOwnership(agentId, email, hasOwnershipContext);
    } catch (err) {
      if (err instanceof OwnershipError) return ownershipErrorResponse(err, request);
      throw err;
    }
  } else {
    try {
      const authInfo = await verifyApiKey(authHeader);
      agentId = authInfo.agent_id;
    } catch {
      return jsonResponse({ error: "Unauthorized" }, 401, request);
    }
  }

  try {
    const limit = Math.max(1, Math.min(100, parseInt(urlObj.searchParams.get("limit") ?? "10", 10) || 10));
    const logs = await turso.getRecentRequests(agentId, limit);
    const rows = logs.map((log) => ({
      id: log.timestamp ? `${agentId}-${log.timestamp}` : cryptoUtil.randomHex(8),
      agent_id: log.agent_id,
      tool_name: log.tool_name,
      timestamp: log.timestamp,
      latency_ms: log.latency_ms,
      tokens_used: log.tokens_used,
      provider_used: log.provider_used,
      success: log.success ? 1 : 0,
      error_code: log.error_code,
    }));
    return jsonResponse({ logs: rows, count: rows.length }, 200, request);
  } catch (err) {
    logger.error("User activity fetch failed", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    return jsonResponse({ error: "Failed to fetch activity" }, 500, request);
  }
}

// ── Admin Handlers ────────────────────────────────────────────────────────────

async function getFirebaseUser(request: Request, env: Env): Promise<{
  authorized: boolean;
  email: string;
  hasOwnershipContext: boolean;
}> {
  // ── 1. PRIMARY: Firebase JWT verification ──────────────────────────
  //    Production auth path. Verifies JWT signature, issuer, audience,
  //    expiration, and project binding using Google public certs.
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (env.FIREBASE_PROJECT_ID) {
      try {
        const verified = await verifyFirebaseToken(token);
        if (verified) {
          return { authorized: true, email: verified.email, hasOwnershipContext: !!verified.email };
        }
      } catch {
        // Verification failed — fall through to X-Admin-Secret only in dev mode
      }
    }
  }

  // ── 2. FALLBACK: X-Admin-Secret (local development only) ───────────
  //    This fallback is restricted to development environments where
  //    Firebase is not fully configured. In production, X-Admin-Secret
  //    is only accepted as a supplementary header alongside a valid
  //    Firebase JWT, NOT as a standalone auth mechanism.
  //
  //    Guard: FIREBASE_PROJECT_ID must NOT be configured (i.e., dev mode).
  const isProduction = !!env.FIREBASE_PROJECT_ID;
  const adminSecret = request.headers.get("X-Admin-Secret");
  if (!isProduction && env.ADMIN_SECRET && adminSecret === env.ADMIN_SECRET) {
    const devEmail = env.ADMIN_EMAIL || "dev@opticontext.local";
    logger.info("[getFirebaseUser] Dev-mode X-Admin-Secret auth", { email: devEmail });
    return { authorized: true, email: devEmail, hasOwnershipContext: false };
  }

  // ── 3. SUPPLEMENTARY: X-Admin-Secret in production ─────────────────
  //    In production, X-Admin-Secret is ONLY accepted if a valid Firebase
  //    JWT was also provided. This prevents standalone admin-secret auth.
  if (isProduction && env.ADMIN_SECRET && adminSecret === env.ADMIN_SECRET) {
    // A valid Firebase JWT is required for user identity.
    // X-Admin-Secret alone is insufficient in production.
    logger.warn("[getFirebaseUser] X-Admin-Secret used without valid Firebase JWT in production — rejected");
  }

  return { authorized: false, email: "", hasOwnershipContext: false };
}

async function handleAdminCreateAgent(
  request: Request,
  env: Env,
): Promise<Response> {
  const { authorized, email } = await getFirebaseUser(request, env);
  if (!authorized) {
    return jsonResponse({ error: "Forbidden" }, 403, request);
  }

  const sizeCheck = checkBodySize(request, MAX_JSON_BODY_BYTES);
  if (sizeCheck) return sizeCheck;

  let body: {
    agent_id: string;
    display_name: string;
    allowed_tools?: string[];
    tier?: string;
    requests_per_minute?: number;
    daily_cap?: number;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, request);
  }

  if (!body.agent_id || !body.display_name) {
    return jsonResponse(
      { error: "agent_id and display_name are required" },
      400,
      request,
    );
  }

  // Validate agent_id format
  if (!/^[a-z0-9_-]{2,32}$/.test(body.agent_id)) {
    return jsonResponse(
      {
        error:
          "agent_id must be 2-32 chars, lowercase letters, numbers, hyphens, underscores only",
      },
      400,
      request,
    );
  }

  const allowedTools = body.allowed_tools ?? [
    "intellisearch",
    "voicebridge",
    "deepdoc",
    "memorycore",
  ];

  const rawKey = cryptoUtil.randomHex(32);
  let agentId = body.agent_id;
  const apiKey = `opctx_${agentId}_${rawKey}`;

  const authInfo = {
    agent_id: agentId,
    allowed_tools: allowedTools,
    tier: body.tier ?? "standard",
    rate_limits: {
      requests_per_minute: body.requests_per_minute ?? 30,
      daily_cap: body.daily_cap ?? 500,
    },
    owner_email: email || undefined,
  };

  try {
    // Store key in KV (fast auth path, 30-day TTL then needs rotation)
    await registerApiKey(apiKey, authInfo);

    // Store agent in Turso for analytics + dashboard
    await turso.registerAgent(
      agentId,
      body.display_name,
      email,
      allowedTools,
    );

    // Store SHA-256 hash of the API key in Turso's api_keys table for audit
    const keyHash = await cryptoUtil.hashString(apiKey);
    await turso.storeKeyHash(keyHash, agentId);

    // Store agent profile in Supabase for dashboard visibility
    await supabase.upsertAgentProfile({
      agent_id: agentId,
      display_name: body.display_name,
      owner_email: email,
      allowed_tools: allowedTools,
      tier: authInfo.tier,
      settings: {},
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE constraint")) {
      // Check if the collision is with the same user's own agent
      const existing = await turso.getAgentOwner(agentId);
      if (existing === email) {
        return jsonResponse({ error: "An agent with this name already exists in your account" }, 409, request);
      }
      // Collision with another user — retry with a deduplicated ID (up to 3 attempts)
      for (let attempt = 0; attempt < 3; attempt++) {
        const suffix = cryptoUtil.randomHex(4);
        agentId = `${body.agent_id}-${suffix}`;
        const newApiKey = `opctx_${agentId}_${cryptoUtil.randomHex(32)}`;
        const newAuthInfo = { ...authInfo, agent_id: agentId };
        try {
          await registerApiKey(newApiKey, newAuthInfo);
          await turso.registerAgent(agentId, body.display_name, email, allowedTools);
          const newKeyHash = await cryptoUtil.hashString(newApiKey);
          await turso.storeKeyHash(newKeyHash, agentId);
          await supabase.upsertAgentProfile({
            agent_id: agentId,
            display_name: body.display_name,
            owner_email: email,
            allowed_tools: allowedTools,
            tier: authInfo.tier,
            settings: {},
          });
          logger.info("Admin: agent created (deduped)", { agent_id: agentId, original: body.agent_id, attempt: attempt + 1 });
          return jsonResponse(
            {
              key: newApiKey,
              agent_id: agentId,
              display_name: body.display_name,
              allowed_tools: allowedTools,
              tier: authInfo.tier,
              rate_limits: authInfo.rate_limits,
              warning: "Store this key securely. It will not be shown again.",
            },
            201,
            request,
          );
        } catch (retryErr) {
          const retryMsg = retryErr instanceof Error ? retryErr.message : "";
          if (retryMsg.includes("UNIQUE constraint") && attempt < 2) {
            continue;
          }
          throw retryErr;
        }
      }
    }
    throw err;
  }

  logger.info("Admin: agent created", { agent_id: body.agent_id });

  return jsonResponse(
    {
      key: apiKey,
      agent_id: body.agent_id,
      display_name: body.display_name,
      allowed_tools: allowedTools,
      tier: authInfo.tier,
      rate_limits: authInfo.rate_limits,
      warning:
        "Store this key securely. It will not be shown again.",
    },
    201,
    request,
  );
}

async function handleAdminListAgents(
  request: Request,
  env: Env,
): Promise<Response> {
  const { authorized, email } = await getFirebaseUser(request, env);
  if (!authorized) {
    return jsonResponse({ error: "Forbidden" }, 403, request);
  }

  try {
    const agents = await turso.getRegisteredAgents(email);
    return jsonResponse({ agents }, 200, request);
  } catch (err) {
    return jsonResponse({ error: "Failed to list agents" }, 500, request);
  }
}

async function handleAdminRevokeAgent(
  request: Request,
  env: Env,
  pathname: string,
): Promise<Response> {
  const { authorized, email, hasOwnershipContext } = await getFirebaseUser(request, env);
  if (!authorized) {
    return jsonResponse({ error: "Forbidden" }, 403, request);
  }

  const parts = pathname.split("/");
  const agentId = parts[3];

  if (!agentId) {
    return jsonResponse({ error: "Missing agent_id in path" }, 400, request);
  }

  try {
    await assertOwnership(agentId, email, hasOwnershipContext);
  } catch (err) {
    if (err instanceof OwnershipError) return ownershipErrorResponse(err, request);
    throw err;
  }

  try {
    const revokedCount = await turso.revokeKey(agentId);
    if (revokedCount === 0) {
      return jsonResponse({ error: "Agent key not found or already revoked" }, 404, request);
    }
    await kv.put("API_KEYS", `revoked_agent:${agentId}`, "true", { expirationTtl: 86400 });
    logger.info("Admin: agent key revoked", { agent_id: agentId });
    return jsonResponse({ success: true, agent_id: agentId }, 200, request);
  } catch (err) {
    return jsonResponse({ error: "Failed to revoke agent" }, 500, request);
  }
}

async function handleAdminRenameAgent(
  request: Request,
  env: Env,
  pathname: string,
): Promise<Response> {
  const { authorized, email, hasOwnershipContext } = await getFirebaseUser(request, env);
  if (!authorized) {
    return jsonResponse({ error: "Forbidden" }, 403, request);
  }

  const parts = pathname.split("/");
  const agentId = parts[3];

  if (!agentId) {
    return jsonResponse({ error: "Missing agent_id in path" }, 400, request);
  }

  try {
    await assertOwnership(agentId, email, hasOwnershipContext);
  } catch (err) {
    if (err instanceof OwnershipError) return ownershipErrorResponse(err, request);
    throw err;
  }

  let body: { display_name: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, request);
  }

  const newName = body.display_name?.trim();
  if (!newName || newName.length > 48 || !/^[a-zA-Z0-9-]+$/.test(newName)) {
    return jsonResponse(
      { error: "display_name must be 1-48 chars, letters, numbers, hyphens only" },
      400,
      request,
    );
  }

  try {
    await turso.renameAgent(agentId, newName, email);
    logger.info("Admin: agent renamed", { agent_id: agentId, new_name: newName });
    return jsonResponse({ success: true, agent_id: agentId, display_name: newName }, 200, request);
  } catch (err) {
    return jsonResponse({ error: "Failed to rename agent" }, 500, request);
  }
}

async function handleAdminLogs(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const { authorized, email, hasOwnershipContext } = await getFirebaseUser(request, env);
  if (!authorized) {
    return jsonResponse({ error: "Forbidden" }, 403, request);
  }

  const agent = url.searchParams.get("agent") ?? undefined;
  const tool = url.searchParams.get("tool") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const limit = Math.max(1, Math.min(500, parseInt(url.searchParams.get("limit") ?? "100", 10) || 100));

  if (email && agent) {
    try {
      await assertOwnership(agent, email, hasOwnershipContext);
    } catch (err) {
      if (err instanceof OwnershipError) return ownershipErrorResponse(err, request);
      throw err;
    }
  }

  try {
    const logs = await turso.getAllRequests({ agent, tool, status, limit, owner_email: email || undefined });
    return jsonResponse({ logs, count: logs.length }, 200, request);
  } catch (err) {
    return jsonResponse({ error: "Failed to fetch logs" }, 500, request);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200, req?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(req ? corsHeaders(req) : { "Access-Control-Allow-Origin": "*" }),
    },
  });
}
