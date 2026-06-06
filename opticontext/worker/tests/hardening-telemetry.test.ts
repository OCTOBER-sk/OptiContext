import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted shared stores for KV + R2 ──────────────────────────────
const testKvStore = vi.hoisted(() => ({} as Record<string, string>));
const testR2Store = vi.hoisted(() =>
  ({} as Record<string, { data: ArrayBuffer; metadata?: Record<string, string> }>),
);

// ── Mocks ───────────────────────────────────────────────────────────
vi.mock("../src/storage/kv", () => {
  const store = testKvStore as Record<string, string>;
  return {
    kv: {
      get: async (_ns: string, key: string) => store[key] ?? null,
      getJson: async (_ns: string, key: string) => {
        const v = store[key];
        return v ? JSON.parse(v) : null;
      },
      put: async (_ns: string, key: string, value: string) => { store[key] = value; },
      putJson: async (_ns: string, key: string, value: unknown) => { store[key] = JSON.stringify(value); },
      delete: async (_ns: string, key: string) => { delete store[key]; },
      increment: async () => 1,
    },
  };
});

vi.mock("../src/storage/r2", () => {
  const store = testR2Store as Record<string, { data: ArrayBuffer; metadata?: Record<string, string> }>;
  return {
    r2: {
      put: async (_b: string, key: string, data: ArrayBuffer, opts?: any) => {
        store[key] = { data, metadata: opts?.customMetadata };
        return { key };
      },
      get: async (_b: string, key: string) => {
        const e = store[key];
        if (!e) return null;
        return { key, body: e.data, arrayBuffer: async () => e.data, customMetadata: e.metadata ?? {}, size: e.data.byteLength };
      },
      delete: async (_b: string, key: string) => { delete store[key]; },
      getPublicUrl: () => "https://cdn.example.com/x",
    },
  };
});

vi.mock("../src/storage/turso", () => ({
  turso: {
    logRequest: vi.fn().mockResolvedValue(undefined),
    getFileRecord: vi.fn().mockResolvedValue(null),
    storeFileRecord: vi.fn().mockResolvedValue(undefined),
    updateFileGeminiUri: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../src/storage/supabase", () => ({
  supabase: {
    insertMemoryEmbedding: vi.fn().mockResolvedValue("id"),
    insertMemoryEntry: vi.fn().mockResolvedValue("id"),
    searchMemoryEmbeddings: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../src/ai/gemini", () => ({
  embedText: vi.fn().mockResolvedValue(new Array(768).fill(0)),
  uploadFileToGemini: vi.fn().mockResolvedValue({ file_uri: "files/x" }),
  analyzeFile: vi.fn().mockResolvedValue({ content: '{"summary":"ok","key_findings":[]}', tokens_used: 10 }),
  simpleGenerate: vi.fn().mockResolvedValue({ content: "x", tokens_used: 0 }),
}));

vi.mock("../src/ai/router", () => ({
  dispatchAI: vi.fn().mockImplementation(async (task: string) => {
    if (task === "summarize_search") return { content: '{"summary":"x","sources":["https://a.com"],"confidence":0.9}', tokens_used: 5, provider_used: "cerebras" };
    return { content: "x", tokens_used: 0, provider_used: "cerebras" };
  }),
  routeGeminiModel: vi.fn().mockReturnValue("gemini-2.5-flash"),
  estimateContextTokens: vi.fn().mockReturnValue(100),
}));

vi.mock("../src/search/tavily", () => ({
  search: vi.fn(),
}));

vi.mock("../src/search/ddg", () => ({
  search: vi.fn(),
}));

vi.mock("../src/search/apify", () => ({
  scrape: vi.fn(),
}));

vi.mock("../src/search/dorking", () => ({
  buildDorkQuery: vi.fn().mockReturnValue("dorked query"),
  buildDorkForIntent: vi.fn().mockReturnValue("intent query"),
}));

vi.mock("../src/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

vi.mock("../src/utils/crypto", () => ({
  default: { hashString: vi.fn().mockResolvedValue("abc"), randomHex: vi.fn().mockReturnValue("fileid123") },
}));

import * as tavily from "../src/search/tavily";
import * as ddg from "../src/search/ddg";

import { handleSearch } from "../src/tools/intellisearch";
import { handleTTS } from "../src/tools/voicebridge";
import { handleAnalyze } from "../src/tools/deepdoc";
import { handleMemory } from "../src/tools/memorycore";

const mockAuth = {
  agent_id: "test-agent",
  allowed_tools: ["intellisearch", "voicebridge", "deepdoc", "memorycore"],
  tier: "standard",
  rate_limits: { requests_per_minute: 30, daily_cap: 500 },
};

const REQUIRED_META = ["latency_ms", "total_duration_ms", "provider_used", "cache_hit", "fallback_used"];

describe("FIX 2 — Telemetry fields on tool responses", () => {
  beforeEach(() => {
    Object.keys(testKvStore).forEach((k) => delete testKvStore[k]);
    Object.keys(testR2Store).forEach((k) => delete testR2Store[k]);
  });

  describe("search tool", () => {
    it("returns all 5 required meta fields", async () => {
      const r = await handleSearch(
        { query: "test", mode: "research", summarize: false },
        mockAuth,
      );
      for (const f of REQUIRED_META) {
        expect(r.meta).toHaveProperty(f);
      }
      expect(typeof r.meta?.latency_ms).toBe("number");
      expect(typeof r.meta?.total_duration_ms).toBe("number");
      expect(typeof r.meta?.cache_hit).toBe("boolean");
      expect(typeof r.meta?.fallback_used).toBe("boolean");
    });

    it("reports cache_hit=true on cache hit", async () => {
      testKvStore["search_cache:abc"] = "cached body";
      const r = await handleSearch(
        { query: "test", mode: "research", summarize: false },
        mockAuth,
      );
      expect(r.meta?.cache_hit).toBe(true);
      expect(r.meta?.provider_used).toBe("cache");
    });

    it("reports fallback_used=true in auto mode when Tavily returns empty", async () => {
      const tavily = await import("../src/search/tavily");
      const ddg = await import("../src/search/ddg");
      vi.mocked(tavily.search).mockResolvedValue({ results: [], creditsUsed: 0, provider: "tavily" });
      vi.mocked(ddg.search).mockResolvedValue({ results: [{ title: "x", url: "https://x", snippet: "y" }], provider: "ddg" });

      const r = await handleSearch(
        { query: "test", mode: "auto", summarize: false },
        mockAuth,
      );
      expect(r.meta?.fallback_used).toBe(true);
      expect(r.meta?.provider_used).toBe("ddg");
    });
  });

  describe("tts tool", () => {
    it("returns all 5 required meta fields", async () => {
      // No cache → cache_hit false
      const r = await handleTTS(
        { text: "hello world", voice: "Scarlett" },
        mockAuth,
      );
      for (const f of REQUIRED_META) {
        expect(r.meta).toHaveProperty(f);
      }
      expect(typeof r.meta?.cache_hit).toBe("boolean");
    });
  });

  describe("analyze tool", () => {
    it("returns all 5 required meta fields + expires_at for new files", async () => {
      const r = await handleAnalyze(
        {
          query: "summarize",
          file_b64: Buffer.from("hello world").toString("base64"),
          mime_type: "text/plain",
        },
        mockAuth,
      );
      for (const f of REQUIRED_META) {
        expect(r.meta).toHaveProperty(f);
      }
      // FIX 4: expires_at should be present for newly persisted files
      expect(r.meta?.expires_at).toBeDefined();
      const expiresAt = new Date(r.meta!.expires_at as string);
      const now = Date.now();
      const days = (expiresAt.getTime() - now) / (1000 * 60 * 60 * 24);
      // 30-day TTL → should be 29-31 days out
      expect(days).toBeGreaterThan(29);
      expect(days).toBeLessThan(31);
    });

    it("surfaces expires_at from re-analyzed file_id (legacy record fallback)", async () => {
      // Pre-populate the KV with a legacy record that has NO expires_at
      const fileId = "legacy123";
      const key = `file_idx:test-agent:${fileId}`;
      testKvStore[key] = JSON.stringify({
        file_id: fileId,
        agent_id: "test-agent",
        filename: "old.txt",
        mime_type: "text/plain",
        file_size: 100,
        r2_key: `persist/test-agent/${fileId}`,
        // No expires_at, no gemini_file_uri → legacy path
      });
      // Put the actual file bytes in R2
      testR2Store[`persist/test-agent/${fileId}`] = {
        data: new TextEncoder().encode("legacy data").buffer,
        metadata: {},
      };

      const r = await handleAnalyze(
        { query: "summarize", file_id: fileId },
        mockAuth,
      );
      // FIX 4: legacy record should still surface an expires_at (safe fallback = 30d from now)
      expect(r.meta?.expires_at).toBeDefined();
    });
  });

  describe("memory_write tool", () => {
    it("returns all 5 required meta fields", async () => {
      const r = await handleMemory(
        { content: "test memory", namespace: "qa", importance: 5 },
        mockAuth,
        "opticontext_memory_write",
      );
      for (const f of REQUIRED_META) {
        expect(r.meta).toHaveProperty(f);
      }
      expect(r.meta?.provider_used).toBe("gemini");
    });
  });

  describe("memory_search tool", () => {
    it("returns all 5 required meta fields", async () => {
      const r = await handleMemory(
        { query: "test", namespace: "qa" },
        mockAuth,
        "opticontext_memory_search",
      );
      for (const f of REQUIRED_META) {
        expect(r.meta).toHaveProperty(f);
      }
      expect(r.meta?.provider_used).toBe("gemini");
    });
  });
});
