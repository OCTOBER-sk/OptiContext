import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/storage/kv", () => ({
  kv: { get: vi.fn().mockResolvedValue(null), put: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("../src/search/tavily", () => ({
  search: vi.fn(),
}));
vi.mock("../src/search/ddg", () => ({
  search: vi.fn(),
}));
vi.mock("../src/search/registries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/search/registries")>();
  return {
    ...actual,
    lookupMaven: vi.fn(),
    lookupNpm: vi.fn(),
    lookupNuget: vi.fn(),
    lookupPypi: vi.fn(),
    lookupCrates: vi.fn(),
    lookupPub: vi.fn(),
  };
});
vi.mock("../src/utils/crypto", () => ({
  default: { hashString: vi.fn().mockResolvedValue("abc") },
}));
vi.mock("../src/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

import { handleDevSearch } from "../src/tools/devsearch";
import * as tavily from "../src/search/tavily";
import * as ddg from "../src/search/ddg";
import * as registries from "../src/search/registries";

const mockAuth = {
  agent_id: "test-agent",
  allowed_tools: ["devsearch"],
  tier: "standard",
  rate_limits: { requests_per_minute: 30, daily_cap: 500 },
};

beforeEach(() => {
  vi.mocked(tavily.search).mockReset();
  vi.mocked(ddg.search).mockReset();
  vi.mocked(registries.lookupMaven).mockReset();
  vi.mocked(registries.lookupNpm).mockReset();
  vi.mocked(registries.lookupNuget).mockReset();
  vi.mocked(registries.lookupPypi).mockReset();
  vi.mocked(registries.lookupCrates).mockReset();
  vi.mocked(registries.lookupPub).mockReset();
});

describe("opticontext_dev_search", () => {
  describe("action=search", () => {
    it("routes Maven coordinate to lookupMaven adapter", async () => {
      vi.mocked(registries.lookupMaven).mockResolvedValue({
        ecosystem: "maven",
        group: "androidx.media3",
        artifact: "media3-exoplayer",
        latestVersion: "1.4.1",
        recentVersions: ["1.4.1", "1.4.0"],
      });
      const result = await handleDevSearch(
        { action: "search", query: "androidx.media3:media3-exoplayer" },
        mockAuth,
      );
      expect(result.isError).toBeFalsy();
      const body = JSON.parse(result.content[0].text!);
      expect(body.intent).toBe("package_lookup");
      expect(body.packages).toHaveLength(1);
      expect(body.packages[0].latestVersion).toBe("1.4.1");
      expect(registries.lookupMaven).toHaveBeenCalledWith("androidx.media3", "media3-exoplayer");
    });

    it("routes npm install to lookupNpm", async () => {
      vi.mocked(registries.lookupNpm).mockResolvedValue({
        ecosystem: "npm",
        artifact: "react",
        latestVersion: "18.2.0",
        recentVersions: ["18.2.0"],
      });
      const result = await handleDevSearch(
        { action: "search", query: "npm install react" },
        mockAuth,
      );
      const body = JSON.parse(result.content[0].text!);
      expect(body.intent).toBe("package_lookup");
      expect(body.packages[0].artifact).toBe("react");
    });

    it("falls back to web search with site:dork for framework_docs", async () => {
      vi.mocked(tavily.search).mockResolvedValue({
        results: [
          {
            title: "Kotlin Coroutines Guide",
            url: "https://kotlinlang.org/docs/coroutines-guide.html",
            content: "Official Kotlin coroutines documentation",
            score: 0.9,
          },
        ],
        creditsUsed: 1,
        provider: "tavily",
      });
      const result = await handleDevSearch(
        { action: "search", query: "kotlin coroutines example" },
        mockAuth,
      );
      const body = JSON.parse(result.content[0].text!);
      expect(["code_example", "framework_docs"]).toContain(body.intent);
      expect(body.web.length).toBeGreaterThan(0);
      expect(tavily.search).toHaveBeenCalled();
      // The query sent to Tavily should include a site:dork for kotlinlang.org
      const sentQuery = vi.mocked(tavily.search).mock.calls[0][0];
      expect(sentQuery).toMatch(/site:kotlinlang\.org/);
    });

    it("boosts official docs over SEO blogs in web results", async () => {
      vi.mocked(tavily.search).mockResolvedValue({
        results: [
          {
            title: "Medium: Some article about ExoPlayer",
            url: "https://medium.com/@user/exoplayer-tutorial",
            content: "Learn ExoPlayer in 5 minutes",
            score: 0.9,
          },
          {
            title: "Android Developer: Media3 ExoPlayer",
            url: "https://developer.android.com/media/exoplayer",
            content: "Canonical documentation",
            score: 0.7,
          },
        ],
        creditsUsed: 1,
        provider: "tavily",
      });
      const result = await handleDevSearch(
        { action: "search", query: "ExoPlayer HLS android" },
        mockAuth,
      );
      const body = JSON.parse(result.content[0].text!);
      // developer.android.com should rank higher despite lower base score
      const top = body.web[0];
      expect(top.url).toContain("developer.android.com");
    });

    it("falls back from Tavily to DDG on empty Tavily result", async () => {
      vi.mocked(tavily.search).mockResolvedValue({
        results: [],
        creditsUsed: 1,
        provider: "tavily",
      });
      vi.mocked(ddg.search).mockResolvedValue({
        results: [
          {
            title: "MDN: fetch",
            url: "https://developer.mozilla.org/en-US/docs/Web/API/fetch",
            snippet: "Fetch API",
          },
        ],
        provider: "ddg",
      });
      const result = await handleDevSearch(
        { action: "search", query: "MDN fetch api" },
        mockAuth,
      );
      const body = JSON.parse(result.content[0].text!);
      expect(body.web.length).toBeGreaterThan(0);
      expect(ddg.search).toHaveBeenCalled();
    });

    it("returns empty packages list when no registry match", async () => {
      vi.mocked(registries.lookupMaven).mockResolvedValue(null);
      const result = await handleDevSearch(
        { action: "search", query: "androidx.doesnotexist:fake:1.0.0" },
        mockAuth,
      );
      const body = JSON.parse(result.content[0].text!);
      expect(body.intent).toBe("package_lookup");
      expect(body.packages).toEqual([]);
    });

    it("rejects when query is missing", async () => {
      await expect(
        handleDevSearch({ action: "search" }, mockAuth),
      ).rejects.toThrow();
    });
  });

  describe("action=set_context", () => {
    it("accepts a parsed manifest bundle", async () => {
      const result = await handleDevSearch(
        {
          action: "set_context",
          project_id: "myapp",
          context: {
            libsVersionsToml: `[versions]\nfoo = "1.0"\n[libraries]\nbar = { group = "com.x", name = "bar", version.ref = "foo" }`,
            languages: ["kotlin"],
            toolchain: { kotlin: "1.9.24", java: "17" },
          },
        },
        mockAuth,
      );
      expect(result.isError).toBeFalsy();
      const body = JSON.parse(result.content[0].text!);
      expect(body.stored).toBe(true);
      expect(body.project_id).toBe("myapp");
      expect(body.ecosystems).toContain("gradle");
      expect(body.toolchain.kotlin).toBe("1.9.24");
      expect(body.memory_suggestions.length).toBeGreaterThan(0);
    });

    it("rejects set_context without context block", async () => {
      const result = await handleDevSearch(
        { action: "set_context", project_id: "x" },
        mockAuth,
      );
      expect(result.isError).toBe(true);
    });
  });
});
