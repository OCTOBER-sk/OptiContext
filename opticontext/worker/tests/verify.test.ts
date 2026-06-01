import { describe, it, expect, vi } from "vitest";

vi.mock("../src/storage/kv", () => ({
  kv: { get: vi.fn(), getJson: vi.fn(), putJson: vi.fn(), put: vi.fn() },
}));
vi.mock("../src/storage/turso", () => ({
  turso: { lookupKeyHash: vi.fn(), updateKeyLastUsed: vi.fn() },
}));
vi.mock("../src/utils/crypto", () => ({
  default: { hashString: vi.fn() },
}));
vi.mock("../src/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

import { verifyApiKey, registerApiKey, extractBearerToken } from "../src/auth/verify";
import { kv } from "../src/storage/kv";
import { turso } from "../src/storage/turso";
import crypto from "../src/utils/crypto";

const mockAuthInfo = {
  agent_id: "test-agent",
  allowed_tools: ["intellisearch"],
  tier: "standard",
  rate_limits: { requests_per_minute: 30, daily_cap: 500 },
};

describe("Auth Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts Bearer token from Authorization header", () => {
    const req = new Request("http://localhost/", {
      headers: { Authorization: "Bearer opctx_test_key123" },
    });
    const token = extractBearerToken(req);
    expect(token).toBe("Bearer opctx_test_key123");
  });

  it("returns null for missing Authorization header", () => {
    const req = new Request("http://localhost/");
    const token = extractBearerToken(req);
    expect(token).toBeNull();
  });

  it("verifies API key from KV cache hit", async () => {
    vi.mocked(kv.getJson).mockResolvedValue(mockAuthInfo);
    vi.mocked(kv.get).mockResolvedValue(null);

    const result = await verifyApiKey("Bearer opctx_test_abc123");
    expect(result.agent_id).toBe("test-agent");
    expect(kv.getJson).toHaveBeenCalledTimes(1);
  });

  it("falls back to Turso when KV misses and key is valid", async () => {
    vi.mocked(kv.getJson).mockResolvedValue(null);
    vi.mocked(crypto.hashString).mockResolvedValue("hashed_key_abc");
    vi.mocked(turso.lookupKeyHash).mockResolvedValue({
      agent_id: "test-agent",
      allowed_tools: ["intellisearch"],
      tier: "standard",
    });
    vi.mocked(kv.putJson).mockResolvedValue(undefined);
    vi.mocked(turso.updateKeyLastUsed).mockResolvedValue(undefined);

    const result = await verifyApiKey("Bearer opctx_test_abc123");
    expect(result.agent_id).toBe("test-agent");
    expect(turso.lookupKeyHash).toHaveBeenCalledWith("hashed_key_abc");
    expect(kv.putJson).toHaveBeenCalledTimes(1);
  });

  it("throws AuthError when KV misses and Turso also misses", async () => {
    vi.mocked(kv.getJson).mockResolvedValue(null);
    vi.mocked(crypto.hashString).mockResolvedValue("invalid_hash");
    vi.mocked(turso.lookupKeyHash).mockResolvedValue(null);

    await expect(verifyApiKey("Bearer opctx_test_abc123")).rejects.toThrow("Invalid API key");
    expect(turso.lookupKeyHash).toHaveBeenCalledWith("invalid_hash");
  });

  it("throws AuthError for revoked keys", async () => {
    vi.mocked(kv.getJson).mockResolvedValue(mockAuthInfo);
    vi.mocked(kv.get).mockResolvedValue("true");

    await expect(verifyApiKey("Bearer opctx_test_abc123")).rejects.toThrow("revoked");
  });

  it("throws AuthError for malformed header", async () => {
    await expect(verifyApiKey("Basic dXNlcjpwYXNz")).rejects.toThrow("Missing or invalid");
  });

  it("registers API key in KV with 30-day TTL", async () => {
    vi.mocked(kv.putJson).mockResolvedValue(undefined);

    await registerApiKey("opctx_test_abc123", mockAuthInfo);
    expect(kv.putJson).toHaveBeenCalledWith(
      "API_KEYS",
      "opctx_key:opctx_test_abc123",
      mockAuthInfo,
      expect.objectContaining({ expirationTtl: 30 * 24 * 3600 }),
    );
  });
});
