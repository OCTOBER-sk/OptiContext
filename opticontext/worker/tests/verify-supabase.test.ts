import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../src/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

import { setEnv } from "../src/context";
import { logger } from "../src/utils/logger";
import {
  verifySupabaseToken,
  __resetJwksCacheForTests,
} from "../src/auth/verify-supabase";

const TEST_SUPABASE_URL = "https://test.supabase.co";
const TEST_JWT_SECRET = "test-jwt-secret-that-is-32-chars-long-x";
const TEST_KID = "test-kid-uuid-1234";

function b64url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function makePayload(overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: `${TEST_SUPABASE_URL}/auth/v1`,
    sub: "user-uuid-123",
    aud: "authenticated",
    iat: now,
    exp: now + 3600,
    email: "user@test.com",
    role: "authenticated",
    ...overrides,
  };
}

async function signHs256(payload: object, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = new TextEncoder();
  const signing = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(signing));
  return `${signing}.${b64url(new Uint8Array(sig))}`;
}

async function generateEs256KeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
}

async function signEs256(
  payload: object,
  privateKey: CryptoKey,
  kid: string,
): Promise<string> {
  const header = { alg: "ES256", typ: "JWT", kid };
  const enc = new TextEncoder();
  const signing = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    enc.encode(signing),
  );
  return `${signing}.${b64url(new Uint8Array(sig))}`;
}

async function exportPublicJwk(keyPair: CryptoKeyPair, kid: string) {
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  return { ...publicJwk, kid, alg: "ES256", use: "sig" };
}

function mockJwksFetch(jwksBody: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(jwksBody), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

beforeEach(() => {
  setEnv({
    SUPABASE_URL: TEST_SUPABASE_URL,
    SUPABASE_JWT_SECRET: TEST_JWT_SECRET,
  } as never);
  __resetJwksCacheForTests();
  vi.restoreAllMocks();
});

afterEach(() => {
  __resetJwksCacheForTests();
});

describe("verifySupabaseToken — HS256 (legacy, regression)", () => {
  it("verifies a valid HS256 token", async () => {
    const token = await signHs256(makePayload(), TEST_JWT_SECRET);
    const result = await verifySupabaseToken(token);
    expect(result).toEqual({ uid: "user-uuid-123", email: "user@test.com" });
  });

  it("rejects HS256 with wrong secret", async () => {
    const token = await signHs256(makePayload(), "wrong-secret-that-is-32-chars-xx");
    const result = await verifySupabaseToken(token);
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "[Supabase Auth] JWT signature verification failed",
    );
  });

  it("rejects token with wrong issuer", async () => {
    const token = await signHs256(
      makePayload({ iss: "https://evil.supabase.co/auth/v1" }),
      TEST_JWT_SECRET,
    );
    const result = await verifySupabaseToken(token);
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "[Supabase Auth] JWT claim validation failed",
      expect.objectContaining({ error: expect.stringContaining("Invalid issuer") }),
    );
  });

  it("rejects expired token", async () => {
    const token = await signHs256(
      makePayload({ exp: Math.floor(Date.now() / 1000) - 1000 }),
      TEST_JWT_SECRET,
    );
    const result = await verifySupabaseToken(token);
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "[Supabase Auth] JWT claim validation failed",
      expect.objectContaining({ error: expect.stringContaining("expired") }),
    );
  });
});

describe("verifySupabaseToken — algorithm gating", () => {
  it("rejects alg=none", async () => {
    const header = { alg: "none", typ: "JWT" };
    const token = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(makePayload()))}.`;
    const result = await verifySupabaseToken(token);
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "[Supabase Auth] JWT alg 'none' explicitly rejected",
    );
  });

  it("rejects alg=RS256", async () => {
    const header = { alg: "RS256", typ: "JWT" };
    const token = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(makePayload()))}.AAAA`;
    const result = await verifySupabaseToken(token);
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "[Supabase Auth] Unsupported JWT algorithm",
      { alg: "RS256" },
    );
  });

  it("rejects alg=HS384", async () => {
    const header = { alg: "HS384", typ: "JWT" };
    const token = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(makePayload()))}.AAAA`;
    const result = await verifySupabaseToken(token);
    expect(result).toBeNull();
  });
});

describe("verifySupabaseToken — ES256 (new, with JWKS)", () => {
  it("verifies a valid ES256 token via JWKS lookup", async () => {
    const keyPair = await generateEs256KeyPair();
    const jwk = await exportPublicJwk(keyPair, TEST_KID);
    mockJwksFetch({ keys: [jwk] });
    const token = await signEs256(makePayload(), keyPair.privateKey, TEST_KID);

    const result = await verifySupabaseToken(token);
    expect(result).toEqual({ uid: "user-uuid-123", email: "user@test.com" });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${TEST_SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
    );
  });

  it("caches JWKS — no refetch on second call with same kid", async () => {
    const keyPair = await generateEs256KeyPair();
    const jwk = await exportPublicJwk(keyPair, TEST_KID);
    mockJwksFetch({ keys: [jwk] });
    const token = await signEs256(makePayload(), keyPair.privateKey, TEST_KID);

    await verifySupabaseToken(token);
    await verifySupabaseToken(token);
    await verifySupabaseToken(token);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("refetches JWKS when cache is expired", async () => {
    const keyPair = await generateEs256KeyPair();
    const jwk = await exportPublicJwk(keyPair, TEST_KID);
    const fetchSpy = mockJwksFetch({ keys: [jwk] });
    const token = await signEs256(makePayload(), keyPair.privateKey, TEST_KID);

    await verifySupabaseToken(token);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    __resetJwksCacheForTests();
    await verifySupabaseToken(token);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("rejects ES256 token with missing kid", async () => {
    const keyPair = await generateEs256KeyPair();
    const header = { alg: "ES256", typ: "JWT" };
    const enc = new TextEncoder();
    const signing = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(makePayload()))}`;
    const sig = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      keyPair.privateKey,
      enc.encode(signing),
    );
    const token = `${signing}.${b64url(new Uint8Array(sig))}`;

    const result = await verifySupabaseToken(token);
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "[Supabase Auth] ES256 token missing kid",
    );
  });

  it("rejects ES256 token with unknown kid (no JWKS refetch while cache fresh)", async () => {
    const keyPair = await generateEs256KeyPair();
    const jwk = await exportPublicJwk(keyPair, TEST_KID);
    const fetchSpy = mockJwksFetch({ keys: [jwk] });

    const token = await signEs256(makePayload(), keyPair.privateKey, "unknown-kid");
    const result = await verifySupabaseToken(token);

    expect(result).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      "[Supabase Auth] JWKS key not found",
      { kid: "unknown-kid" },
    );
  });

  it("rejects ES256 token with bad signature (key mismatch)", async () => {
    const keyPair1 = await generateEs256KeyPair();
    const keyPair2 = await generateEs256KeyPair();
    const jwk1 = await exportPublicJwk(keyPair1, TEST_KID);
    mockJwksFetch({ keys: [jwk1] });

    const token = await signEs256(makePayload(), keyPair2.privateKey, TEST_KID);
    const result = await verifySupabaseToken(token);

    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "[Supabase Auth] JWT signature verification failed",
    );
  });

  it("rejects ES256 with non-EC JWK", async () => {
    const keyPair = await generateEs256KeyPair();
    const token = await signEs256(makePayload(), keyPair.privateKey, TEST_KID);
    mockJwksFetch({
      keys: [
        {
          kid: TEST_KID,
          kty: "RSA",
          alg: "ES256",
          n: "abc",
          e: "AQAB",
        },
      ],
    });

    const result = await verifySupabaseToken(token);
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "[Supabase Auth] JWK is not an EC P-256 key",
      { kid: TEST_KID },
    );
  });

  it("handles JWKS fetch failure gracefully", async () => {
    const keyPair = await generateEs256KeyPair();
    const token = await signEs256(makePayload(), keyPair.privateKey, TEST_KID);
    mockJwksFetch({}, 500);

    const result = await verifySupabaseToken(token);
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      "[Supabase Auth] JWKS fetch failed",
      expect.objectContaining({ status: 500 }),
    );
  });
});
