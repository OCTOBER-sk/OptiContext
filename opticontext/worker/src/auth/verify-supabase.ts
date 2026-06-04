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
    const signature = Uint8Array.from(atob(base64UrlDecode(parts[2])), (c) => c.charCodeAt(0));
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

  if (header.alg !== "HS256") {
    logger.warn("[Supabase Auth] Unsupported JWT algorithm", { alg: header.alg });
    return null;
  }

  const claimError = validateClaims(payload, supabaseUrl);
  if (claimError) {
    logger.warn("[Supabase Auth] JWT claim validation failed", { error: claimError });
    return null;
  }

  try {
    const secretKey = await importSecretKey(jwtSecret);
    const parts = token.split(".");
    const signedContent = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);

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
  } catch (err) {
    logger.error("[Supabase Auth] Crypto verification error", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    return null;
  }

  return { uid: payload.sub, email: payload.email ?? "" };
}
