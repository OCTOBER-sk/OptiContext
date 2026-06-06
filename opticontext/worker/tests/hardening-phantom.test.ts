import { describe, it, expect, vi } from "vitest";

vi.mock("../src/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

import { detectLowConfidence } from "../src/tools/intellisearch";

describe("FIX 1 — Phantom-answer suppression", () => {
  describe("detectLowConfidence helper", () => {
    it("flags phantom when sources=[] and confidence<0.3 (audit reproducer)", () => {
      const auditResponse = JSON.stringify({
        summary: "The provided search results discuss MCP, an open standard for connecting AI assistants to external data sources, but they do not mention OptiContext or an OptiContext MCP platform.",
        facts: [],
        sources: [],
        confidence: 0.15,
      });
      const r = detectLowConfidence(auditResponse);
      expect(r.isLowConfidence).toBe(true);
      expect(r.confidence).toBe(0.15);
      expect(r.sourcesCount).toBe(0);
    });

    it("does not flag when sources present even if confidence low", () => {
      const r = detectLowConfidence(JSON.stringify({
        summary: "x",
        sources: ["https://a.com"],
        confidence: 0.1,
      }));
      expect(r.isLowConfidence).toBe(false);
    });

    it("does not flag when confidence high even if sources empty", () => {
      const r = detectLowConfidence(JSON.stringify({
        summary: "x",
        sources: [],
        confidence: 0.9,
      }));
      expect(r.isLowConfidence).toBe(false);
    });

    it("tolerates JSON wrapped in markdown code fences", () => {
      const wrapped = "```json\n" + JSON.stringify({
        summary: "x",
        sources: [],
        confidence: 0.1,
      }) + "\n```";
      const r = detectLowConfidence(wrapped);
      expect(r.isLowConfidence).toBe(true);
    });

    it("treats non-JSON as not-phantom (safe fallback)", () => {
      const r = detectLowConfidence("This is just plain text, not JSON.");
      expect(r.isLowConfidence).toBe(false);
    });

    it("treats empty input as not-phantom", () => {
      const r = detectLowConfidence("");
      expect(r.isLowConfidence).toBe(false);
    });

    it("treats missing sources/confidence fields as not-phantom", () => {
      const r = detectLowConfidence(JSON.stringify({ summary: "x" }));
      expect(r.isLowConfidence).toBe(false);
      // Default confidence is 1.0 (safe — no false positive)
      expect(r.confidence).toBe(1);
    });
  });
});
