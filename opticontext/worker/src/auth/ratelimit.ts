import { kv } from "../storage/kv";
import { RateLimitError } from "../utils/errors";
import { logger } from "../utils/logger";

interface RateLimitConfig {
  requests_per_minute: number;
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
