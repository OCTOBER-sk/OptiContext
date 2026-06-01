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
    it("adds github site filter for code intents", () => {
      expect(buildDorkForIntent("find code example")).toContain("site:github.com");
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

    it("returns original intent if no pattern matches", () => {
      const r = buildDorkForIntent("weather today");
      expect(r).toBe("weather today");
    });
  });
});
