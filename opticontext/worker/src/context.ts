/**
 * OptiContext Worker Environment Context
 *
 * CF Workers pass KV namespaces, R2 buckets, and secrets via the `env`
 * parameter of the `fetch` handler. This module holds a per-request reference
 * so every downstream module can access bindings without prop-drilling.
 *
 * Usage:
 *   import { setEnv, getEnv } from "./context";
 *   setEnv(env); // called once at the top of fetch()
 *   getEnv().API_KEYS; // used anywhere downstream
 */

export interface Env {
  // KV Namespaces
  API_KEYS: KVNamespace;
  RATE_LIMITS: KVNamespace;
  CACHE: KVNamespace;

  // R2 Buckets
  FILES_BUCKET: R2Bucket;
  TTS_BUCKET: R2Bucket;

  // AI Provider Keys
  CEREBRAS_API_KEY: string;
  GEMINI_API_KEY: string;
  GEMINI_API_KEY_2?: string;

  // Search Provider Keys
  TAVILY_API_KEY: string;
  APIFY_API_KEY: string;

  // Voice Provider Key
  UNREAL_SPEECH_KEY: string;

  // Database Credentials
  TURSO_DB_URL: string;
  TURSO_AUTH_TOKEN: string;

  // Supabase Credentials
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;

  // Supabase JWT Secret (for dashboard auth verification)
  // Required in production — when not set, Supabase JWT verification
  // is skipped and X-Admin-Secret fallback is used for local development.
  // Get this from Supabase Dashboard → Settings → API → JWT Settings → JWT Secret
  SUPABASE_JWT_SECRET?: string;

  // Admin Token (for dashboard → worker admin API calls)
  ADMIN_SECRET: string;

  // Admin Email (optional, for local dev when Supabase JWT extraction fails)
  ADMIN_EMAIL?: string;

  // MCP Tool timeout (ms), default 180000 (3 min)
  MCP_TOOL_TIMEOUT_MS?: string;

  // Optional: HTTP webhook URL for monitoring/observability. If set,
  // worker errors are POSTed here in addition to the local structured
  // log. Compatible with Sentry / Better Stack / Logflare ingest.
  MONITORING_WEBHOOK_URL?: string;
}

let _env: Env | null = null;

/**
 * Called once at the top of each fetch() handler to capture the env binding.
 * Logs warnings for missing optional configs but does not throw.
 */
export function setEnv(env: Env): void {
  _env = env;
}

/**
 * Returns the current request's env. Throws if called before setEnv().
 */
export function getEnv(): Env {
  if (!_env) {
    throw new Error(
      "[OptiContext] Environment not initialized. Call setEnv(env) at the start of fetch().",
    );
  }
  return _env;
}
