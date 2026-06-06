import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted KV store so the ratelimit module reads from a controlled backing
const testKvStore = vi.hoisted(() => ({} as Record<string, string>));

vi.mock("../src/storage/kv", () => ({
  kv: {
    get: async (_ns: string, key: string) => testKvStore[key] ?? null,
    increment: async (_ns: string, key: string, _ttl: number) => {
      const cur = parseInt(testKvStore[key] ?? "0", 10) || 0;
      const next = cur + 1;
      testKvStore[key] = next.toString();
      return next;
    },
    put: async (_ns: string, key: string, value: string) => { testKvStore[key] = value; },
  },
}));

vi.mock("../src/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

import { getRateLimitStatus, checkRateLimit } from "../src/auth/ratelimit";

describe("FIX 3 — Rate-limit visibility", () => {
  beforeEach(() => {
    Object.keys(testKvStore).forEach((k) => delete testKvStore[k]);
  });

  describe("getRateLimitStatus", () => {
    it("returns full quota when no requests used", async () => {
      const status = await getRateLimitStatus("agent-a", {
        requests_per_minute: 30,
        daily_cap: 500,
      });
      expect(status.minute_remaining).toBe(30);
      expect(status.day_remaining).toBe(500);
      expect(status.limit_per_minute).toBe(30);
      expect(status.daily_cap).toBe(500);
      expect(status.retry_after_sec).toBeGreaterThan(0);
      expect(status.retry_after_sec).toBeLessThanOrEqual(60);
    });

    it("reflects consumed quota", async () => {
      const cfg = { requests_per_minute: 30, daily_cap: 500 };
      // Consume 5 minute + 100 day via the increment path
      for (let i = 0; i < 5; i++) await checkRateLimit("agent-b", cfg);
      // Manually bump the daily counter to 100
      const dailyKey = Object.keys(testKvStore).find((k) => k.startsWith("daily:agent-b:"));
      if (dailyKey) testKvStore[dailyKey] = "100";

      const status = await getRateLimitStatus("agent-b", cfg);
      expect(status.minute_remaining).toBe(25);
      expect(status.day_remaining).toBe(400);
    });

    it("floors remaining at 0 (never negative)", async () => {
      const cfg = { requests_per_minute: 30, daily_cap: 500 };
      for (let i = 0; i < 35; i++) await checkRateLimit("agent-c", cfg).catch(() => {});
      const status = await getRateLimitStatus("agent-c", cfg);
      expect(status.minute_remaining).toBe(0);
      expect(status.day_remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe("checkRateLimit backwards compatibility", () => {
    it("still returns void (does not break existing callers)", async () => {
      const r = await checkRateLimit("agent-d", { requests_per_minute: 30, daily_cap: 500 });
      expect(r).toBeUndefined();
    });
  });
});
