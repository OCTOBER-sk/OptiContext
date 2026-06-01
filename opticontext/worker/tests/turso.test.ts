import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/context", () => ({
  getEnv: vi.fn().mockReturnValue({
    TURSO_DB_URL: "https://test.turso.io",
    TURSO_AUTH_TOKEN: "test-token",
  }),
}));

import { turso } from "../src/storage/turso";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeTursoResponse(rows: Record<string, unknown>[]) {
  const cols = rows.length > 0 ? Object.keys(rows[0]).map((k) => ({ name: k, type: "text" })) : [];
  const rowData = rows.map((r) =>
    Object.values(r).map((v) => ({ type: v === null ? "null" : "text", value: v })),
  );
  return {
    results: [
      {
        type: "response",
        response: { type: "ok", result: { cols, rows: rowData, affected_row_count: 1 } },
      },
      { type: "close" },
    ],
  };
}

describe("Turso Storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lookupKeyHash returns agent info for valid key", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        makeTursoResponse([
          {
            agent_id: "test-agent",
            allowed_tools: '["intellisearch","voicebridge"]',
            tier: "standard",
          },
        ]),
    });

    const result = await turso.lookupKeyHash("abc123hash");
    expect(result).not.toBeNull();
    expect(result?.agent_id).toBe("test-agent");
    expect(result?.allowed_tools).toEqual(["intellisearch", "voicebridge"]);
    expect(result?.tier).toBe("standard");
  });

  it("lookupKeyHash returns null for unknown key", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => makeTursoResponse([]),
    });

    const result = await turso.lookupKeyHash("unknown");
    expect(result).toBeNull();
  });

  it("storeKeyHash inserts a key hash", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => makeTursoResponse([]),
    });

    await expect(turso.storeKeyHash("hash123", "test-agent")).resolves.not.toThrow();
  });

  it("revokeKey updates revoked flag", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => makeTursoResponse([]),
    });

    await expect(turso.revokeKey("test-agent")).resolves.not.toThrow();
  });

  it("getUsageStats returns daily usage rows", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        makeTursoResponse([
          { agent_id: "test-agent", date: "2026-05-21", tool_name: "intellisearch", count: 10, tokens_total: 5000 },
        ]),
    });

    const result = await turso.getUsageStats("test-agent", 30);
    expect(result.length).toBe(1);
    expect(result[0].tool_name).toBe("intellisearch");
  });

  it("registerAgent inserts a new agent", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => makeTursoResponse([]),
    });

    await expect(
      turso.registerAgent("new-agent", "New Agent", "test@test.com", ["intellisearch"]),
    ).resolves.not.toThrow();
  });

  it("logRequest does not throw on fire-and-forget", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => makeTursoResponse([]),
    });

    await expect(
      turso.logRequest({
        agent_id: "test-agent",
        tool_name: "intellisearch",
        latency_ms: 100,
        tokens_used: 50,
        success: true,
      }),
    ).resolves.not.toThrow();
  });
});
