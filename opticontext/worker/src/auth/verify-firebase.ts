import { getEnv } from "../context";
import { kv } from "../storage/kv";
import { logger } from "../utils/logger";

const FIREBASE_ISSUER_PREFIX = "https://securetoken.google.com/";
const GOOGLE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const CERTS_CACHE_KEY = "firebase:google_certs";
const CERTS_CACHE_TTL = 3600; // 1 hour
const CLOCK_SKEW_SEC = 300;   // 5 min tolerance

interface FirebaseJWTHeader {
  alg: string;
  kid: string;
}

interface FirebaseJWTPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  [key: string]: unknown;
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4 !== 0) str += "=";
  return atob(str);
}

function parseJWT(token: string): { header: FirebaseJWTHeader; payload: FirebaseJWTPayload; signature: Uint8Array } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const header = JSON.parse(base64UrlDecode(parts[0])) as FirebaseJWTHeader;
    const payload = JSON.parse(base64UrlDecode(parts[1])) as FirebaseJWTPayload;
    const signature = Uint8Array.from(atob(base64UrlDecode(parts[2])), (c) => c.charCodeAt(0));
    return { header, payload, signature };
  } catch {
    return null;
  }
}

async function getGoogleCerts(): Promise<Record<string, string>> {
  const cached = await kv.get("CACHE", CERTS_CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached) as Record<string, string>;
    } catch {
      // Invalid cache, proceed to fetch
    }
  }

  logger.info("[Firebase Auth] Fetching Google public certs");

  const response = await fetch(GOOGLE_CERTS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Google certs: ${response.status}`);
  }

  const certs = (await response.json()) as Record<string, string>;
  await kv.put("CACHE", CERTS_CACHE_KEY, JSON.stringify(certs), { expirationTtl: CERTS_CACHE_TTL });
  return certs;
}

async function pemToCryptoKey(pem: string, kid: string): Promise<CryptoKey> {
  const pemContent = pem
    .replace("-----BEGIN CERTIFICATE-----", "")
    .replace("-----END CERTIFICATE-----", "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

  try {
    return await crypto.subtle.importKey(
      "spki",
      binaryDer.buffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
  } catch (err) {
    throw new Error(`Failed to import public key for kid=${kid}: ${err instanceof Error ? err.message : "Unknown"}`);
  }
}

function validateClaims(payload: FirebaseJWTPayload, projectId: string): string | null {
  const now = Math.floor(Date.now() / 1000);

  const expectedIssuer = `${FIREBASE_ISSUER_PREFIX}${projectId}`;
  if (payload.iss !== expectedIssuer) {
    return `Invalid issuer: expected ${expectedIssuer}, got ${payload.iss}`;
  }

  if (payload.aud !== projectId) {
    return `Invalid audience: expected ${projectId}, got ${payload.aud}`;
  }

  if (typeof payload.exp !== "number" || payload.exp < now - CLOCK_SKEW_SEC) {
    return "Token has expired";
  }

  if (typeof payload.iat !== "number" || payload.iat > now + CLOCK_SKEW_SEC) {
    return "Token issued in the future";
  }

  if (!payload.sub || typeof payload.sub !== "string") {
    return "Token missing subject claim";
  }

  return null;
}

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
}

export async function verifyFirebaseToken(token: string): Promise<VerifiedFirebaseUser | null> {
  const env = getEnv();
  const projectId = env.FIREBASE_PROJECT_ID;

  if (!projectId) {
    logger.warn("[Firebase Auth] FIREBASE_PROJECT_ID not configured");
    return null;
  }

  const parsed = parseJWT(token);
  if (!parsed) {
    logger.warn("[Firebase Auth] Failed to parse JWT");
    return null;
  }

  const { header, payload, signature } = parsed;

  // Validate algorithm
  if (header.alg !== "RS256") {
    logger.warn("[Firebase Auth] Unsupported JWT algorithm", { alg: header.alg });
    return null;
  }

  // Validate key ID
  if (!header.kid) {
    logger.warn("[Firebase Auth] JWT missing kid header");
    return null;
  }

  // Validate claims before crypto verification (fail fast)
  const claimError = validateClaims(payload, projectId);
  if (claimError) {
    logger.warn("[Firebase Auth] JWT claim validation failed", { error: claimError });
    return null;
  }

  // Fetch public certs and verify signature
  try {
    const certs = await getGoogleCerts();
    const pem = certs[header.kid];
    if (!pem) {
      logger.warn("[Firebase Auth] Unknown key ID", { kid: header.kid });
      return null;
    }

    const publicKey = await pemToCryptoKey(pem, header.kid);

    // Build the signed content (header.payload)
    const parts = token.split(".");
    const signedContent = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);

    const isValid = await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      publicKey,
      signature.buffer as ArrayBuffer,
      signedContent.buffer as ArrayBuffer,
    );

    if (!isValid) {
      logger.warn("[Firebase Auth] JWT signature verification failed");
      return null;
    }
  } catch (err) {
    logger.error("[Firebase Auth] Crypto verification error", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    return null;
  }

  return { uid: payload.sub, email: payload.email ?? "" };
}
