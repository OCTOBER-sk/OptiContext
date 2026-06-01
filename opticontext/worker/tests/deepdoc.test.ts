import { describe, it, expect, vi } from "vitest";

vi.mock("../src/storage/kv", () => ({
  kv: { get: vi.fn(), getJson: vi.fn().mockResolvedValue(null), put: vi.fn(), putJson: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("../src/storage/r2", () => {
  const mockR2Object = (data?: string) => ({
    arrayBuffer: () => Promise.resolve(new TextEncoder().encode(data ?? "test").buffer),
    customMetadata: { filename: "test.pdf", mimeType: "application/pdf" },
    size: 100,
  });
  return {
    r2: { get: vi.fn().mockResolvedValue(mockR2Object()), put: vi.fn(), delete: vi.fn().mockResolvedValue(undefined) },
  };
});
vi.mock("../src/ai/router", () => {
  const mockDispatch = vi.fn();
  mockDispatch.mockImplementation(async (taskType: string) => {
    if (taskType === "upload_file") {
      return { content: JSON.stringify({ file_uri: "files/test123", mime_type: "application/pdf" }), tokens_used: 0, provider_used: "gemini" };
    }
    if (taskType === "analyze_file") {
      return { content: JSON.stringify({ summary: "test", key_findings: [], answer_to_query: "test", data_tables: [], code_blocks: [], confidence: 0.9 }), tokens_used: 100, provider_used: "gemini" };
    }
    return { content: "{}", tokens_used: 0, provider_used: "gemini" };
  });
  return {
    dispatchAI: mockDispatch,
    routeToProvider: vi.fn().mockReturnValue("gemini"),
    routeGeminiModel: vi.fn().mockReturnValue("gemini-2.5-flash-preview-05-20"),
    estimateContextTokens: vi.fn().mockReturnValue(1000),
  };
});
vi.mock("../src/storage/supabase", () => ({
  supabase: { insertMemoryEmbedding: vi.fn(), insertMemoryEntry: vi.fn() },
}));
vi.mock("../src/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));
vi.mock("../src/utils/crypto", () => ({
  default: { hashString: vi.fn().mockResolvedValue("hash123"), randomHex: vi.fn().mockReturnValue("a3f8d9e1b2c4") },
}));
vi.mock("../src/storage/turso", () => ({
  turso: { storeFileRecord: vi.fn().mockResolvedValue(undefined), updateFileGeminiUri: vi.fn().mockResolvedValue(undefined) },
}));

import { handleAnalyze } from "../src/tools/deepdoc";

const mockAuth = {
  agent_id: "test-agent",
  allowed_tools: ["deepdoc"],
  tier: "standard",
  rate_limits: { requests_per_minute: 30, daily_cap: 500 },
};

describe("DeepDoc", () => {
  it("throws validation error when no file source provided", async () => {
    await expect(handleAnalyze({ query: "summarize" }, mockAuth)).rejects.toThrow();
  });

  it("throws validation error when query is missing", async () => {
    await expect(handleAnalyze({ file_url: "https://example.com/doc.pdf" }, mockAuth)).rejects.toThrow();
  });

  it("validates upload_id format", async () => {
    const result = await handleAnalyze(
      { upload_id: "../ malicious", query: "analyze" },
      mockAuth,
    );
    expect(result.isError).toBe(true);
  });

  it("accepts valid upload_id", async () => {
    const result = await handleAnalyze(
      { upload_id: "abc123.pdf", query: "analyze" },
      mockAuth,
    );
    expect(result.isError).toBeFalsy();
  });
});
