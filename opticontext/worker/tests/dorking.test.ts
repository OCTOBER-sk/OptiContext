import { buildDorkQuery, buildDorkForIntent } from "../src/search/dorking";

describe("dorking", () => {
  describe("buildDorkQuery", () => {
    it("returns base query when no params", () => {
      expect(buildDorkQuery("hello world")).toBe("hello world");
    });

    it("adds site filter", () => {
      const result = buildDorkQuery("test", { site_filter: "example.com" });
      expect(result).toContain("site:example.com");
      expect(result).toContain("(test)");
    });

    it("adds file type filter", () => {
      const result = buildDorkQuery("report", { file_type: "pdf" });
      expect(result).toContain("filetype:pdf");
    });

    it("excludes terms", () => {
      const result = buildDorkQuery("test", { exclude_terms: ["spam", "ads"] });
      expect(result).toContain("-spam");
      expect(result).toContain("-ads");
    });

    it("adds date filters", () => {
      const result = buildDorkQuery("news", { date_after: "2025-01-01", date_before: "2025-12-31" });
      expect(result).toContain("after:2025-01-01");
      expect(result).toContain("before:2025-12-31");
    });

    it("adds search_in operator", () => {
      expect(buildDorkQuery("test", { search_in: "title" })).toContain("intitle:");
      expect(buildDorkQuery("test", { search_in: "url" })).toContain("inurl:");
    });

    it("handles multiple sites", () => {
      const result = buildDorkQuery("test", { site_filter: "a.com,b.com" });
      expect(result).toContain("site:a.com OR site:b.com");
    });
  });

  describe("buildDorkForIntent", () => {
    it("scopes code-example queries to forums (GitHub + Stack Overflow)", () => {
      // "find code example" should NOT be scoped to github.com only
      // (the old behavior). It should hit a technical-source mix so the
      // agent gets both source and discussion.
      const r = buildDorkForIntent("find code example");
      expect(r).toMatch(/site:(github\.com|stackoverflow\.com)/);
      expect(r).toContain("code example");
    });

    it("scopes GitHub-only when user explicitly asks for source/repo", () => {
      const r = buildDorkForIntent("find the github repo for kotlinx coroutines");
      expect(r).toContain("site:github.com");
    });

    it("adds nvd/cve site filter for security intents", () => {
      const r = buildDorkForIntent("cve-2025-1234 vulnerability");
      expect(r).toContain("site:nvd.nist.gov");
    });

    it("adds pricing inurl for pricing intents", () => {
      const r = buildDorkForIntent("competitor pricing plans");
      expect(r).toContain("inurl:pricing");
    });

    it("adds pdf filetype for document intents", () => {
      const r = buildDorkForIntent("financial report pdf");
      expect(r).toContain("filetype:pdf");
    });

    it("scopes Android queries to developer.android.com and kotlinlang.org", () => {
      const r = buildDorkForIntent("how to use Flow in coroutines");
      expect(r).toMatch(/site:(kotlinlang\.org|developer\.android\.com)/);
    });

    it("scopes React queries to react.dev", () => {
      const r = buildDorkForIntent("useState example react");
      expect(r).toContain("site:react.dev");
    });

    it("scopes package version queries to registries", () => {
      const r = buildDorkForIntent("what is the latest version of react");
      expect(r).toMatch(/site:(npmjs\.com|react\.dev)/);
    });

    it("returns original intent if no pattern matches", () => {
      const r = buildDorkForIntent("weather today");
      expect(r).toBe("weather today");
    });
  });
});
