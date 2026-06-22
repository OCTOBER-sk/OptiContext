/**
 * Provider abstraction layer.
 *
 * The user-facing surface (MCP clients, agents, end users) must never
 * see implementation-provider names. Provider names belong in
 * telemetry, logs, and (optionally) debug responses only.
 *
 * Rules:
 *   - `userProviderName(internal)` → returns a generic platform-level
 *     label like "search", "tts", "memory", "analyze", or "cache".
 *   - `userErrorMessage(err, debug)` → returns a sanitized user-facing
 *     message. In normal mode it never contains a provider name; in
 *     debug mode it preserves the original error.
 *   - `userProviderBreakdown(internal)` → returns a stable set of
 *     platform-level categories for billing/dashboards without exposing
 *     the vendor.
 *
 * Provider information is preserved in:
 *   - logger.info / logger.warn / logger.error calls (telemetry)
 *   - `_meta.debug` (only when debug flag is set)
 *   - the `details` field of ProviderError (server-side only)
 *
 * Provider information is REMOVED from:
 *   - `meta.provider_used` exposed to the MCP client
 *   - `isError` text content
 *   - JSON-RPC error `message` field
 *   - tool description `description` field for the public schemas
 *   - the `intellisearch` summary's `confidence`/`sources` JSON
 */

import { logger } from "./logger";

/** Public provider categories that survive abstraction. */
export type PublicProvider =
  | "search"
  | "tts"
  | "analyze"
  | "memory"
  | "cache"
  | "internal"
  | "guide";

/** Map internal provider names to public categories. Used for telemetry/admin display only — normal user-facing meta uses the capability directly (see `publicMetaForCapability`). */
const INTERNAL_TO_PUBLIC: Record<string, PublicProvider> = {
  tavily: "search",
  ddg: "search",
  apify: "search",
  cerebras: "analyze",
  gemini: "analyze",
  "gemini-embedding": "analyze",
  unrealspeech: "tts",
  supabase: "memory",
  turso: "memory",
  cloudflare: "internal",
  cache: "cache",
};

/**
 * Translate an internal provider name to the public category.
 * Unknown providers fall back to "internal" — never to the raw name.
 */
export function publicProviderName(internal: string | null | undefined): PublicProvider {
  if (!internal) return "internal";
  const k = internal.toLowerCase();
  return INTERNAL_TO_PUBLIC[k] ?? "internal";
}

/**
 * Classify a provider error into a public, user-facing message.
 * The original error is preserved in server logs via logger.error
 * before sanitization. The caller decides what to do with the result.
 *
 * Returns a stable shape so callers can serialize directly.
 */
export interface PublicError {
  /** Stable error code — never changes across deploys. Safe to log/branch on. */
  code:
    | "SEARCH_UNAVAILABLE"
    | "SEARCH_QUALITY_INSUFFICIENT"
    | "RATE_LIMITED"
    | "QUOTA_EXCEEDED"
    | "TTS_UNAVAILABLE"
    | "ANALYZE_UNAVAILABLE"
    | "MEMORY_UNAVAILABLE"
    | "INVALID_PARAMS"
    | "INTERNAL_ERROR";
  /** Short, sanitized message. Provider names NEVER appear here. */
  message: string;
  /** Optional retry hint. Provider names NEVER appear here. */
  retry_hint?: string;
}

const RETRYABLE: PublicError["code"][] = [
  "SEARCH_UNAVAILABLE",
  "TTS_UNAVAILABLE",
  "ANALYZE_UNAVAILABLE",
  "MEMORY_UNAVAILABLE",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
];

export function isRetryableError(err: PublicError): boolean {
  return RETRYABLE.includes(err.code);
}

/**
 * Translate any error into a user-facing shape.
 *
 * The original error (with provider details) is logged via logger.error
 * for telemetry BEFORE sanitization. The returned object is what the
 * MCP client sees.
 */
export function publicErrorMessage(
  err: unknown,
  context: {
    capability: "search" | "tts" | "analyze" | "memory";
    debug?: boolean;
    /** Optional original error message for debug mode. */
    rawMessage?: string;
  },
): PublicError {
  // Log the original (with provider info) for telemetry. Never expose to user.
  const rawMsg = err instanceof Error ? err.message : String(err);
  logger.error("[public-error] provider error sanitized", {
    capability: context.capability,
    debug: !!context.debug,
    raw_message: rawMsg.slice(0, 500),
  });

  // If debug mode is on, return a structured error with the original wrapped.
  if (context.debug) {
    return {
      code: "INTERNAL_ERROR",
      message: `[debug] ${context.capability} failed: ${rawMsg.slice(0, 200)}`,
      retry_hint: "Internal diagnostic — provider details shown for admin/debug mode.",
    };
  }

  const lcMsg = rawMsg.toLowerCase();

  // Rate limit / budget signals — these are common across providers.
  // Detect them by phrasing, not by provider name.
  if (
    /budget|quota|rate\s*limit|too\s*many\s*requests|429/.test(lcMsg) ||
    /exceeded|exhausted/.test(lcMsg)
  ) {
    if (context.capability === "search") {
      return {
        code: "RATE_LIMITED",
        message: "Search is temporarily rate-limited.",
        retry_hint: "Retry in a few seconds, or reduce request frequency.",
      };
    }
    if (context.capability === "tts") {
      return {
        code: "QUOTA_EXCEEDED",
        message: "Speech synthesis quota exceeded for today.",
        retry_hint: "Retry tomorrow, or reduce audio length.",
      };
    }
    if (context.capability === "analyze") {
      return {
        code: "QUOTA_EXCEEDED",
        message: "Analysis quota exceeded for today.",
        retry_hint: "Retry tomorrow.",
      };
    }
    if (context.capability === "memory") {
      return {
        code: "QUOTA_EXCEEDED",
        message: "Memory quota exceeded.",
        retry_hint: "Retry tomorrow or reduce memory writes.",
      };
    }
  }

  // Auth / key / config signals.
  if (/api[_ ]?key|not\s*configured|authentication|unauthor/i.test(lcMsg)) {
    return {
      code: "INTERNAL_ERROR",
      message: `${capabilityLabel(context.capability)} is temporarily unavailable.`,
      retry_hint: "If the issue persists, contact your administrator.",
    };
  }

  // Schema / validation / 400-class errors.
  if (/invalid|schema|validation|bad\s*request|400/.test(lcMsg)) {
    return {
      code: "INVALID_PARAMS",
      message: "Invalid request parameters.",
      retry_hint: "Check the tool schema and retry.",
    };
  }

  // Default by capability.
  switch (context.capability) {
    case "search":
      return {
        code: "SEARCH_UNAVAILABLE",
        message: "Search is temporarily unavailable.",
        retry_hint: "Retry in a few seconds.",
      };
    case "tts":
      return {
        code: "TTS_UNAVAILABLE",
        message: "Speech synthesis is temporarily unavailable.",
        retry_hint: "Retry in a few seconds.",
      };
    case "analyze":
      return {
        code: "ANALYZE_UNAVAILABLE",
        message: "File analysis is temporarily unavailable.",
        retry_hint: "Retry in a few seconds.",
      };
    case "memory":
      return {
        code: "MEMORY_UNAVAILABLE",
        message: "Memory service is temporarily unavailable.",
        retry_hint: "Retry in a few seconds.",
      };
  }
}

function capabilityLabel(c: "search" | "tts" | "analyze" | "memory"): string {
  switch (c) {
    case "search": return "Search";
    case "tts": return "Speech synthesis";
    case "analyze": return "File analysis";
    case "memory": return "Memory";
  }
}

/**
 * Strip provider name from a meta `provider_used` field. Returns the
 * public category, or "internal" if unknown.
 */
export function publicMetaProvider(internal: string | null | undefined): PublicProvider {
  return publicProviderName(internal);
}

/**
 * Public category for a tool's user-facing meta. This is the *capability*
 * the user invoked, not the internal provider that served it. The tool
 * handler knows which capability it implements, so this always returns
 * the correct public category regardless of which internal provider
 * the result actually came from.
 */
export function publicMetaForCapability(
  capability: "search" | "tts" | "analyze" | "memory" | "guide" | "cache" | "internal",
): PublicProvider {
  switch (capability) {
    case "search": return "search";
    case "tts": return "tts";
    case "analyze": return "analyze";
    case "memory": return "memory";
    case "guide": return "guide";
    case "cache": return "cache";
    case "internal": return "internal";
  }
}

/**
 * Determine whether the current agent is in debug mode.
 *
 * Debug mode is opt-in and reserved for:
 *   - Agents with tier "admin" or "debug"
 *   - Explicit per-call override via the `debug` argument
 *
 * Never auto-enable based on environment. Never trust a request header.
 */
export function isDebugMode(auth: { tier?: string; agent_id?: string } | null | undefined, perCallDebug?: boolean): boolean {
  if (perCallDebug) return true;
  if (!auth) return false;
  return auth.tier === "admin" || auth.tier === "debug";
}
