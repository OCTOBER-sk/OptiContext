import { describe, it, expect } from "vitest";
import {
  getDomainPriority,
  boostScore,
  buildSiteDork,
  preferredDomainsForFramework,
  DOCS_DOMAINS,
} from "../src/search/domain-priority";

describe("domain-priority", () => {
  describe("getDomainPriority", () => {
    it("returns tier 2 for developer.android.com", () => {
      const p = getDomainPriority("https://developer.android.com/jetpack/compose");
      expect(p?.tier).toBe(2);
    });

    it("returns tier 2 for kotlinlang.org", () => {
      const p = getDomainPriority("https://kotlinlang.org/docs/coroutines-guide.html");
      expect(p?.tier).toBe(2);
    });

    it("returns tier 2 for react.dev", () => {
      const p = getDomainPriority("https://react.dev/reference/react/useState");
      expect(p?.tier).toBe(2);
    });

    it("returns tier 1 for npmjs.com", () => {
      const p = getDomainPriority("https://www.npmjs.com/package/react");
      expect(p?.tier).toBe(1);
    });

    it("returns tier 0 for github.com", () => {
      const p = getDomainPriority("https://github.com/facebook/react");
      expect(p?.tier).toBe(0);
    });

    it("returns tier -1 for medium.com", () => {
      const p = getDomainPriority("https://medium.com/some-article");
      expect(p?.tier).toBe(-1);
    });

    it("returns tier -1 for reddit.com", () => {
      const p = getDomainPriority("https://reddit.com/r/programming/comments/xyz");
      expect(p?.tier).toBe(-1);
    });

    it("returns null for unknown domains", () => {
      const p = getDomainPriority("https://my-private-blog.dev/post");
      expect(p).toBeNull();
    });

    it("handles invalid URLs gracefully", () => {
      const p = getDomainPriority("not a url");
      expect(p).toBeNull();
    });

    it("handles subdomains of known parents", () => {
      // docs.spring.io is in the explicit subdomain map
      const p = getDomainPriority("https://docs.spring.io/spring-boot/docs/current/reference/html/");
      expect(p?.tier).toBe(2);
    });

    it("handles www. prefix", () => {
      const p = getDomainPriority("https://www.developer.android.com/training");
      expect(p?.tier).toBe(2);
    });
  });

  describe("boostScore", () => {
    it("boosts official docs by 1.6x", () => {
      const s = boostScore("https://developer.android.com/jetpack/compose", 1.0);
      expect(s).toBeCloseTo(1.6);
    });

    it("boosts registries by 1.3x", () => {
      const s = boostScore("https://npmjs.com/package/react", 1.0);
      expect(s).toBeCloseTo(1.3);
    });

    it("demotes SEO blogs to 0.55x", () => {
      const s = boostScore("https://medium.com/@author/some-article", 1.0);
      expect(s).toBeCloseTo(0.55);
    });

    it("leaves unknown domains at base score", () => {
      const s = boostScore("https://unknown.example.com/post", 1.0);
      expect(s).toBe(1.0);
    });

    it("multiplies base score correctly", () => {
      const s = boostScore("https://developer.android.com/jetpack/compose", 0.5);
      expect(s).toBeCloseTo(0.8);
    });
  });

  describe("buildSiteDork", () => {
    it("returns empty string for empty list", () => {
      expect(buildSiteDork([])).toBe("");
    });

    it("joins domains with site: prefix", () => {
      const dork = buildSiteDork(["developer.android.com", "kotlinlang.org"]);
      expect(dork).toBe("site:developer.android.com OR site:kotlinlang.org");
    });
  });

  describe("preferredDomainsForFramework", () => {
    it("returns Android docs for androidx-media3", () => {
      const d = preferredDomainsForFramework("androidx-media3");
      expect(d).toContain("developer.android.com");
    });

    it("returns React docs for react", () => {
      const d = preferredDomainsForFramework("react");
      expect(d).toContain("react.dev");
    });

    it("returns docs.rs for rust", () => {
      const d = preferredDomainsForFramework("rust");
      expect(d).toContain("docs.rs");
      expect(d).toContain("rust-lang.org");
    });

    it("returns all tier-2 docs for unknown framework", () => {
      const d = preferredDomainsForFramework("totally-unknown");
      // Should be a non-empty superset of the canonical tier-2 list
      expect(d.length).toBeGreaterThan(10);
      expect(d).toContain("developer.android.com");
    });

    it("returns all tier-2 docs when no framework given", () => {
      const d = preferredDomainsForFramework(undefined);
      expect(d.length).toBeGreaterThan(10);
    });
  });

  describe("DOCS_DOMAINS catalog", () => {
    it("contains all required Tier-2 domains", () => {
      const required = [
        "developer.android.com",
        "kotlinlang.org",
        "developer.mozilla.org",
        "react.dev",
        "docs.python.org",
        "docs.oracle.com",
        "go.dev",
        "rust-lang.org",
        "nodejs.org",
        "spring.io",
        "developers.cloudflare.com",
        "supabase.com",
        "central.sonatype.com",
        "search.maven.org",
      ];
      const catalog = DOCS_DOMAINS.map((d) => d.domain);
      for (const r of required) {
        expect(catalog, `expected ${r} in DOCS_DOMAINS`).toContain(r);
      }
    });

    it("does not include SEO sites at tier 2", () => {
      const tier2 = DOCS_DOMAINS.filter((d) => d.tier === 2).map((d) => d.domain);
      expect(tier2).not.toContain("medium.com");
      expect(tier2).not.toContain("reddit.com");
    });
  });
});
