import { kv } from "../storage/kv";
import { turso } from "../storage/turso";
import { AuthError } from "../utils/errors";
import { logger } from "../utils/logger";
import crypto from "../utils/crypto";

const KEY_PREFIX = "opctx_key:";
const KV_KEY_TTL_SEC = 30 * 24 * 3600; // 30 days

export interface AgentAuthInfo {
  agent_id: string;
  allowed_tools: string[];
  tier: string;
  rate_limits: {
    requests_per_minute: number;
    daily_cap: number;
  };
  owner_email?: string;
}

export async function verifyApiKey(
  authHeader: string | null,
): Promise<AgentAuthInfo> {
  if (!authHeader || !authHeader.startsWith("Bearer opctx_")) {
    throw new AuthError("Missing or invalid Authorization header");
  }

  const key = authHeader.slice(7);
  const cacheKey = `${KEY_PREFIX}${key}`;

  // 1. KV hot-path lookup
  const cached = await kv.getJson<AgentAuthInfo>("API_KEYS", cacheKey);

  if (cached) {
    const isRevoked = await kv.get("API_KEYS", `revoked_agent:${cached.agent_id}`);
    if (isRevoked === "true") {
      throw new AuthError("API key has been revoked");
    }
    logger.debug("API key cache hit", { agent_id: cached.agent_id });
    return cached;
  }

  // 2. KV miss — fallback to Turso (key might have evicted from cache)
  const keyHash = await crypto.hashString(key);
  const agentInfo = await turso.lookupKeyHash(keyHash);

  if (agentInfo) {
    const authInfo: AgentAuthInfo = {
      agent_id: agentInfo.agent_id,
      allowed_tools: agentInfo.allowed_tools,
      tier: agentInfo.tier,
      rate_limits: {
        requests_per_minute: 30,
        daily_cap: 500,
      },
      owner_email: agentInfo.owner_email,
    };

    // Re-populate KV cache for subsequent requests
    await kv.putJson("API_KEYS", cacheKey, authInfo, { expirationTtl: KV_KEY_TTL_SEC });
    logger.info("API key restored from Turso fallback", { agent_id: agentInfo.agent_id });

    await turso.updateKeyLastUsed(keyHash);
    return authInfo;
  }

  throw new AuthError("Invalid API key");
}

export function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  return auth;
}

export async function registerApiKey(
  key: string,
  info: AgentAuthInfo,
): Promise<void> {
  const cacheKey = `${KEY_PREFIX}${key}`;
  // Store in KV with 30-day TTL; Turso is the permanent source of truth
  await kv.putJson("API_KEYS", cacheKey, info, { expirationTtl: KV_KEY_TTL_SEC });
  logger.info("API key registered", { agent_id: info.agent_id });
}
