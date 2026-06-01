import { describe, it, expect, vi } from "vitest";

vi.mock("../src/storage/kv", () => ({
  kv: { get: vi.fn(), put: vi.fn(), getJson: vi.fn() },
}));
vi.mock("../src/ai/cerebras", () => ({
  filterAndSummarize: vi.fn(),
  generateDorkQuery: vi.fn(),
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
vi.mock("../src/utils/crypto", () => ({
  default: { hashString: vi.fn().mockResolvedValue("abc123") },
}));
vi.mock("../src/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

import { handleSearch } from "../src/tools/intellisearch";
import * as tavily from "../src/search/tavily";
import * as ddg from "../src/search/ddg";
import * as apify from "../src/search/apify";

const mockAuth = {
  agent_id: "test-agent",
  allowed_tools: ["intellisearch"],
  tier: "standard",
  rate_limits: { requests_per_minute: 30, daily_cap: 500 },
};

describe("IntelliSearch", () => {
  it("returns error when query is missing", async () => {
    await expect(handleSearch({ query: "" }, mockAuth)).rejects.toThrow();
  });

  it("routes to Tavily in research mode", async () => {
    vi.mocked(tavily.search).mockResolvedValue({
      results: [{ title: "Test", url: "https://test.com", content: "content", score: 0.9 }],
      creditsUsed: 1,
      provider: "tavily",
    });

    const result = await handleSearch(
      { query: "test", mode: "research", summarize: false },
      mockAuth,
    );
    expect(result.isError).toBeFalsy();
    expect(result.meta?.provider_used).toBe("tavily");
  });

  it("falls back through Tavily→DDG→Apify in auto mode when all empty", async () => {
    vi.mocked(tavily.search).mockResolvedValue({ results: [], creditsUsed: 1, provider: "tavily" });
    vi.mocked(ddg.search).mockResolvedValue({ results: [], provider: "ddg" });
    vi.mocked(apify.scrape).mockResolvedValue({ data: [{ scraped: true }], cost: 0, provider: "apify" });

    const result = await handleSearch(
      { query: "test", mode: "auto", summarize: false },
      mockAuth,
    );
    expect(result.isError).toBeFalsy();
    expect(result.meta?.provider_used).toBe("apify");
  });

  it("uses Tavily results in auto mode and skips fallback", async () => {
    vi.mocked(tavily.search).mockResolvedValue({
      results: [{ title: "T", url: "https://t.com", content: "c", score: 0.9 }],
      creditsUsed: 1,
      provider: "tavily",
    });

    const result = await handleSearch(
      { query: "test", mode: "auto", summarize: false },
      mockAuth,
    );
    expect(result.meta?.provider_used).toBe("tavily");
  });

  it("falls back to DDG when Tavily returns empty in auto mode", async () => {
    vi.mocked(tavily.search).mockResolvedValue({ results: [], creditsUsed: 0, provider: "tavily" });
    vi.mocked(ddg.search).mockResolvedValue({
      results: [{ title: "DDG", url: "https://ddg.com", snippet: "snip" }],
      provider: "ddg",
    });

    const result = await handleSearch(
      { query: "test", mode: "auto", summarize: false },
      mockAuth,
    );
    expect(result.meta?.provider_used).toBe("ddg");
  });
});
