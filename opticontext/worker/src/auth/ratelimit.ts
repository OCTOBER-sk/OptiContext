import { kv } from "../storage/kv";
import { RateLimitError } from "../utils/errors";
import { logger } from "../utils/logger";

interface RateLimitConfig {
  requests_per_minute: number;
  daily_cap: number;
}

export interface RateLimitStatus {
  /** Requests remaining in the current minute window. Floored at 0. */
  minute_remaining: number;
  /** Requests remaining in the current UTC day. Floored at 0. */
  day_remaining: number;
  /** Seconds until the current minute bucket rolls over. */
  retry_after_sec: number;
  /** Configured per-minute ceiling (mirrors `config.requests_per_minute`). */
  limit_per_minute: number;
  /** Configured daily cap. */
  daily_cap: number;
}

const RATE_PREFIX = "rate:";
const DAILY_PREFIX = "daily:";

function getMinuteBucket(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}`;
}

function getDailyBucket(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
}

function getRetryAfterSec(): number {
  const now = new Date();
  return 60 - now.getUTCSeconds();
}

export async function checkRateLimit(
  agent_id: string,
  config: RateLimitConfig,
): Promise<void> {
  const minuteBucket = getMinuteBucket();
  const dailyBucket = getDailyBucket();

  const minuteKey = `${RATE_PREFIX}${agent_id}:${minuteBucket}`;
  const dailyKey = `${DAILY_PREFIX}${agent_id}:${dailyBucket}`;

  const minuteCount = await kv.increment("RATE_LIMITS", minuteKey, 120);
  const dailyCount = await kv.increment("RATE_LIMITS", dailyKey, 86400);

  if (minuteCount > config.requests_per_minute) {
    logger.warn("Rate limit exceeded (per minute)", {
      agent_id,
      count: minuteCount,
      limit: config.requests_per_minute,
    });
    throw new RateLimitError(
      `Rate limit exceeded: ${config.requests_per_minute} requests per minute`,
    );
  }

  if (dailyCount > config.daily_cap) {
    logger.warn("Rate limit exceeded (daily)", {
      agent_id,
      count: dailyCount,
      limit: config.daily_cap,
    });
    throw new RateLimitError(
      `Daily cap exceeded: ${config.daily_cap} requests per day`,
    );
  }
}

/**
 * Read-only snapshot of an agent's current rate-limit usage.
 * Does NOT increment counters. Safe to call from response shaping
 * paths that just want to surface the remaining quota to the caller.
 *
 * This function is purely additive — it does not change the contract
 * of `checkRateLimit`, which continues to return `void`.
 */
export async function getRateLimitStatus(
  agent_id: string,
  config: RateLimitConfig,
): Promise<RateLimitStatus> {
  const minuteBucket = getMinuteBucket();
  const dailyBucket = getDailyBucket();

  const [minuteRaw, dailyRaw] = await Promise.all([
    kv.get("RATE_LIMITS", `${RATE_PREFIX}${agent_id}:${minuteBucket}`),
    kv.get("RATE_LIMITS", `${DAILY_PREFIX}${agent_id}:${dailyBucket}`),
  ]);

  const minuteCount = parseInt(minuteRaw ?? "0", 10) || 0;
  const dailyCount = parseInt(dailyRaw ?? "0", 10) || 0;

  return {
    minute_remaining: Math.max(0, config.requests_per_minute - minuteCount),
    day_remaining: Math.max(0, config.daily_cap - dailyCount),
    retry_after_sec: getRetryAfterSec(),
    limit_per_minute: config.requests_per_minute,
    daily_cap: config.daily_cap,
  };
}
