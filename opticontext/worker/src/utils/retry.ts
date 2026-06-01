import { logger } from "./logger";

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 10000;

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    retryOn?: (error: unknown) => boolean;
    label?: string;
  },
): Promise<T> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelay = options?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelay = options?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const shouldRetry = options?.retryOn ?? ((_err: unknown) => true);
  const label = options?.label ?? "operation";

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && shouldRetry(err)) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        const jitter = delay * (0.5 + Math.random() * 0.5);
        logger.warn(`[Retry] ${label} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(jitter)}ms`, {
          error: err instanceof Error ? err.message : "Unknown",
        });
        await new Promise((r) => setTimeout(r, jitter));
      }
    }
  }

  throw lastError;
}
