import { getEnv } from "../context";
import { logger } from "../utils/logger";

const CLOCK_SKEW_SEC = 300;

interface SupabaseJWTPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  nbf?: number;
  email?: string;
  phone?: string;
  role?: string;
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4 !== 0) str += "=";
  return atob(str);
}

function parseJWT(token: string): { header: Record<string, unknown>; payload: SupabaseJWTPayload; signature: Uint8Array } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1])) as SupabaseJWTPayload;
    // base64UrlDecode returns the raw signature bytes as a string.
    // Convert each byte (char) directly to its char code — do NOT call atob
    // a second time (that would treat raw bytes as base64 and throw).
    const signature = Uint8Array.from(base64UrlDecode(parts[2]), (c) => c.charCodeAt(0));
    return { header, payload, signature };
  } catch {
    return null;
  }
}

async function importSecretKey(jwtSecret: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(jwtSecret);
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

function validateClaims(payload: SupabaseJWTPayload, supabaseUrl: string): string | null {
  const now = Math.floor(Date.now() / 1000);

  const expectedIssuer = `${supabaseUrl}/auth/v1`;
  if (payload.iss !== expectedIssuer) {
    return `Invalid issuer: expected ${expectedIssuer}, got ${payload.iss}`;
  }

  if (payload.aud !== "authenticated") {
    return `Invalid audience: expected authenticated, got ${payload.aud}`;
  }

  if (typeof payload.exp !== "number" || payload.exp < now - CLOCK_SKEW_SEC) {
    return "Token has expired";
  }

  if (typeof payload.iat !== "number" || payload.iat > now + CLOCK_SKEW_SEC) {
    return "Token issued in the future";
  }

  if (typeof payload.nbf === "number" && payload.nbf > now + CLOCK_SKEW_SEC) {
    return "Token not yet valid (nbf)";
  }

  if (!payload.sub || typeof payload.sub !== "string" || payload.sub.length < 1 || payload.sub.length > 128) {
    return "Token missing or invalid subject claim";
  }

  return null;
}

// ── JWKS cache for ES256 verification ──────────────────────────────────────
// Supabase signs ES256 tokens with a rotating ECDSA P-256 key. The public side
// is published at `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` and selected
// by the `kid` (Key ID) in the JWT header. The cache is module-level and
// shared across requests in the same Worker isolate, with a 1-hour TTL.
// On unknown `kid` the cache is refetched only if expired (prevents
// request-flood refetch attacks).
const JWKS_TTL_MS = 60 * 60 * 1000;

interface JwkKey {
  kid: string;
  kty: string;
  alg?: string;
  use?: string;
  crv?: string;
  x?: string;
  y?: string;
}

interface JwksCacheEntry {
  keys: JwkKey[];
  fetchedAt: number;
}

let jwksCache: JwksCacheEntry | null = null;

async function fetchJwks(supabaseUrl: string): Promise<JwkKey[] | null> {
  const url = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;
  const res = await fetch(url);
  if (!res.ok) {
    logger.warn("[Supabase Auth] JWKS fetch failed", { status: res.status, url });
    return null;
  }
  const data = (await res.json()) as { keys?: JwkKey[] };
  if (!Array.isArray(data.keys)) {
    logger.warn("[Supabase Auth] JWKS response missing keys array");
    return null;
  }
  return data.keys;
}

async function getJwk(kid: string, supabaseUrl: string): Promise<JwkKey | null> {
  const isCacheFresh =
    jwksCache !== null && Date.now() - jwksCache.fetchedAt <= JWKS_TTL_MS;

  if (jwksCache) {
    const cached = jwksCache.keys.find((k) => k.kid === kid);
    if (cached) return cached;
  }

  // Don't refetch on every miss — only when cache is stale or empty.
  // This prevents an attacker from forcing a JWKS refetch on every request
  // by sending tokens with bogus `kid` values.
  if (isCacheFresh) return null;

  const keys = await fetchJwks(supabaseUrl);
  if (!keys) return null;
  jwksCache = { keys, fetchedAt: Date.now() };
  return keys.find((k) => k.kid === kid) ?? null;
}

function b64UrlToBytes(s: string): Uint8Array {
  let str = s.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4 !== 0) str += "=";
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function verifyEs256Signature(
  signedContent: Uint8Array,
  signature: Uint8Array,
  jwk: JwkKey,
): Promise<boolean> {
  if (jwk.kty !== "EC" || jwk.crv !== "P-256" || !jwk.x || !jwk.y) {
    logger.warn("[Supabase Auth] JWK is not an EC P-256 key", { kid: jwk.kid });
    return false;
  }

  let x: Uint8Array;
  let y: Uint8Array;
  try {
    x = b64UrlToBytes(jwk.x);
    y = b64UrlToBytes(jwk.y);
  } catch (err) {
    logger.error("[Supabase Auth] JWK coordinate decode failed", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    return false;
  }

  // Uncompressed SEC1 point: 0x04 || X (32 bytes) || Y (32 bytes)
  if (x.length !== 32 || y.length !== 32) {
    logger.warn("[Supabase Auth] JWK coordinates are not 32 bytes", {
      x_len: x.length,
      y_len: y.length,
    });
    return false;
  }
  const point = new Uint8Array(65);
  point[0] = 0x04;
  point.set(x, 1);
  point.set(y, 33);

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      point.buffer as ArrayBuffer,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      signature.buffer as ArrayBuffer,
      signedContent.buffer as ArrayBuffer,
    );
  } catch (err) {
    logger.error("[Supabase Auth] ES256 verification error", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    return false;
  }
}

// Test-only: reset module-level JWKS cache (used in unit tests).
export function __resetJwksCacheForTests(): void {
  jwksCache = null;
}

export interface VerifiedSupabaseUser {
  uid: string;
  email: string;
}

export async function verifySupabaseToken(token: string): Promise<VerifiedSupabaseUser | null> {
  const env = getEnv();
  const jwtSecret = env.SUPABASE_JWT_SECRET;
  const supabaseUrl = env.SUPABASE_URL;

  if (!jwtSecret || !supabaseUrl) {
    logger.warn("[Supabase Auth] SUPABASE_JWT_SECRET or SUPABASE_URL not configured");
    return null;
  }

  if (!token) {
    logger.warn("[Supabase Auth] Empty token provided");
    return null;
  }

  const parsed = parseJWT(token);
  if (!parsed) {
    logger.warn("[Supabase Auth] Failed to parse JWT");
    return null;
  }

  const { header, payload, signature } = parsed;

  if (!header.alg || typeof header.alg !== "string") {
    logger.warn("[Supabase Auth] JWT missing algorithm header");
    return null;
  }

  if (header.alg === "none") {
    logger.warn("[Supabase Auth] JWT alg 'none' explicitly rejected");
    return null;
  }

  // HS256 is the legacy symmetric algorithm (older Supabase projects).
  // ES256 is the current asymmetric default for new Supabase projects.
  // Both are accepted; all other algorithms are rejected.
  if (header.alg !== "HS256" && header.alg !== "ES256") {
    logger.warn("[Supabase Auth] Unsupported JWT algorithm", { alg: header.alg });
    return null;
  }

  const claimError = validateClaims(payload, supabaseUrl);
  if (claimError) {
    logger.warn("[Supabase Auth] JWT claim validation failed", { error: claimError });
    return null;
  }

  try {
    const parts = token.split(".");
    const signedContent = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);

    if (header.alg === "ES256") {
      // ES256: asymmetric ECDSA P-256, public key fetched from Supabase JWKS
      const kid = header.kid;
      if (typeof kid !== "string" || kid.length === 0) {
        logger.warn("[Supabase Auth] ES256 token missing kid");
        return null;
      }
      const jwk = await getJwk(kid, supabaseUrl);
      if (!jwk) {
        logger.warn("[Supabase Auth] JWKS key not found", { kid });
        return null;
      }
      const isValid = await verifyEs256Signature(signedContent, signature, jwk);
      if (!isValid) {
        logger.warn("[Supabase Auth] JWT signature verification failed");
        return null;
      }
    } else {
      // HS256: symmetric HMAC-SHA-256 with the project JWT secret (legacy)
      const secretKey = await importSecretKey(jwtSecret);
      const isValid = await crypto.subtle.verify(
        { name: "HMAC" },
        secretKey,
        signature.buffer as ArrayBuffer,
        signedContent.buffer as ArrayBuffer,
      );
      if (!isValid) {
        logger.warn("[Supabase Auth] JWT signature verification failed");
        return null;
      }
    }
  } catch (err) {
    logger.error("[Supabase Auth] Crypto verification error", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    return null;
  }

  return { uid: payload.sub, email: payload.email ?? "" };
}
