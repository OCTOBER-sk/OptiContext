import { describe, it, expect } from "vitest";
import { classifyDevQuery } from "../src/search/classify";

describe("classifyDevQuery", () => {
  describe("package_lookup", () => {
    it("classifies Maven coordinates as package_lookup with high confidence", () => {
      const r = classifyDevQuery("androidx.media3:media3-exoplayer");
      expect(r.intent).toBe("package_lookup");
      expect(r.confidence).toBeGreaterThanOrEqual(0.95);
      expect(r.extracted.mavenCoord).toEqual({
        group: "androidx.media3",
        artifact: "media3-exoplayer",
      });
      expect(r.adapters).toEqual(["package"]);
    });

    it("classifies retrofit Maven coord", () => {
      const r = classifyDevQuery("com.squareup.retrofit2:retrofit:2.11.0");
      expect(r.intent).toBe("package_lookup");
      expect(r.extracted.mavenCoord?.group).toBe("com.squareup.retrofit2");
    });

    it("classifies npm install pattern", () => {
      const r = classifyDevQuery("npm install react");
      expect(r.intent).toBe("package_lookup");
      expect(r.extracted.npmPackage).toBe("react");
    });

    it("classifies scoped npm install", () => {
      const r = classifyDevQuery("pnpm add @apollo/client");
      expect(r.intent).toBe("package_lookup");
      expect(r.extracted.npmPackage).toBe("@apollo/client");
    });

    it("classifies yarn add", () => {
      const r = classifyDevQuery("yarn add @types/node@20");
      expect(r.intent).toBe("package_lookup");
      expect(r.extracted.npmPackage).toBe("@types/node@20");
    });

    it("classifies NuGet pattern", () => {
      const r = classifyDevQuery("Install-Package Newtonsoft.Json");
      expect(r.intent).toBe("package_lookup");
      expect(r.extracted.nugetId).toBe("Newtonsoft.Json");
    });

    it("classifies cargo add", () => {
      const r = classifyDevQuery("cargo add serde");
      expect(r.intent).toBe("package_lookup");
      expect(r.extracted.crateName).toBe("serde");
    });

    it("classifies pip install", () => {
      const r = classifyDevQuery("pip install requests");
      expect(r.intent).toBe("package_lookup");
      expect(r.extracted.pypiPackage).toBe("requests");
    });

    it("classifies flutter pub add", () => {
      const r = classifyDevQuery("flutter pub add http");
      expect(r.intent).toBe("package_lookup");
      expect(r.extracted.pubPackage).toBe("http");
    });

    it("classifies 'latest version' phrasing", () => {
      const r = classifyDevQuery("what is the latest version of numpy");
      expect(r.intent).toBe("package_lookup");
      expect(r.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it("classifies 'maven dependency' phrasing", () => {
      const r = classifyDevQuery("maven dependency for ExoPlayer");
      expect(r.intent).toBe("package_lookup");
    });
  });

  describe("framework_docs", () => {
    it("classifies Android query as framework_docs", () => {
      const r = classifyDevQuery("how to use Hilt for dependency injection");
      expect(r.intent).toBe("framework_docs");
      expect(r.extracted.framework).toBe("hilt");
    });

    it("classifies Kotlin Coroutines query", () => {
      const r = classifyDevQuery("Kotlin Flow combine example");
      expect(r.extracted.framework).toBe("kotlinx-coroutines");
    });

    it("classifies React query", () => {
      const r = classifyDevQuery("how do I use useEffect in react");
      expect(r.extracted.framework).toBe("react");
    });

    it("classifies explicit developer.android.com reference", () => {
      const r = classifyDevQuery("ExoPlayer HLS docs on developer.android.com");
      expect(r.intent).toBe("framework_docs");
      expect(r.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it("classifies kotlinlang.org reference", () => {
      const r = classifyDevQuery("kotlin coroutines docs kotlinlang.org");
      expect(r.intent).toBe("framework_docs");
    });
  });

  describe("api_reference", () => {
    it("classifies 'api reference' phrasing", () => {
      const r = classifyDevQuery("React useState API reference");
      expect(r.intent).toBe("api_reference");
      expect(r.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it("classifies 'method signature' phrasing", () => {
      const r = classifyDevQuery("kotlin List.map method signature");
      expect(r.intent).toBe("api_reference");
    });
  });

  describe("code_example", () => {
    it("classifies 'example' query for known framework", () => {
      const r = classifyDevQuery("kotlin coroutine example");
      expect(["code_example", "framework_docs"]).toContain(r.intent);
      expect(r.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it("classifies 'tutorial' phrasing", () => {
      const r = classifyDevQuery("ExoPlayer tutorial android");
      expect(r.extracted.framework).toBe("androidx-media3");
    });
  });

  describe("compatibility_check", () => {
    it("classifies compatibility phrasing", () => {
      const r = classifyDevQuery("is Concentus compatible with .NET 8");
      expect(r.intent).toBe("compatibility_check");
      expect(r.extracted.framework).toBe("dotnet");
    });

    it("classifies 'works with' phrasing", () => {
      const r = classifyDevQuery("does Spring Boot 3 work with Java 17");
      expect(r.intent).toBe("compatibility_check");
    });
  });

  describe("issue_diagnosis", () => {
    it("classifies error phrasing", () => {
      const r = classifyDevQuery("kotlin coroutine deadlock error");
      expect(r.intent).toBe("issue_diagnosis");
    });

    it("classifies exception phrasing", () => {
      const r = classifyDevQuery("NullPointerException in my React component");
      expect(r.intent).toBe("issue_diagnosis");
    });
  });

  describe("non-dev queries", () => {
    it("classifies weather as general_dev (no strong dev signal)", () => {
      const r = classifyDevQuery("weather today in Paris");
      expect(r.intent).toBe("general_dev");
      expect(r.confidence).toBeLessThan(0.5);
    });
  });

  describe("regression: false positives", () => {
    it("rejects URL-like patterns as Maven coordinates", () => {
      const r = classifyDevQuery("visit https://example.com:8080/path for docs");
      // Should NOT extract a maven coord from a URL
      expect(r.extracted.mavenCoord).toBeUndefined();
    });

    it("rejects trivial a:b patterns", () => {
      const r = classifyDevQuery("ratio:3.14 is the answer");
      // "ratio" has only 1 segment — too short to be a Maven group
      expect(r.extracted.mavenCoord).toBeUndefined();
    });
  });
});
