import { getEnv, Env } from "../context";
import { logger } from "./logger";

/**
 * Lightweight, opt-in monitoring facade.
 *
 * Behavior:
 *   - Always: structured `console.error` log with the full context
 *   - If `MONITORING_WEBHOOK_URL` is set in env: POSTs a compact JSON
 *     envelope to that URL. Compatible with Sentry, Better Stack,
 *     Logflare, or any plain HTTP ingest endpoint.
 *
 * Intentionally NOT a hard dependency on a vendor SDK. We do not want
 * observability code to crash the worker on a transient vendor outage.
 *
 * The webhook call is fire-and-forget (no await) so the caller is
 * never blocked. The Cloudflare Workers execution context is used to
 * keep the fetch alive past the response when available.
 */
export interface MonitoringContext {
  [key: string]: unknown;
}

// No module-level cache: `getEnv()` is an O(1) closure read, and a cache
// here would make the function untestable when the env changes between
// tests. The webhook URL is checked on every captureError call.
function resolveWebhookUrl(): string | null {
  try {
    const env: Env = getEnv();
    return env.MONITORING_WEBHOOK_URL ?? null;
  } catch {
    return null;
  }
}

function buildEnvelope(
  err: unknown,
  context: MonitoringContext,
): Record<string, unknown> {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  return {
    timestamp: new Date().toISOString(),
    level: "error",
    message,
    stack,
    ...context,
  };
}

export function captureError(
  err: unknown,
  context: MonitoringContext = {},
): void {
  const envelope = buildEnvelope(err, context);

  // Always emit a structured log entry.
  logger.error("monitoring.capture", envelope);

  const url = resolveWebhookUrl();
  if (!url) return;

  // Fire-and-forget. Do NOT await — this must never block a request.
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(envelope),
  }).catch((webhookErr) => {
    // We can't recurse into captureError here without risking a loop.
    // Just log and move on.
    logger.warn("monitoring.webhook_failed", {
      webhook_status: "failed",
      error: webhookErr instanceof Error ? webhookErr.message : "Unknown",
    });
  });
}
