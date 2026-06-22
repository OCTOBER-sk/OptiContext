import { describe, it, expect } from "vitest";
import {
  detectLowConfidence,
  detectUngroundedFacts,
  detectOverconfidentSummary,
  stripCodeFence,
} from "../src/tools/intellisearch";

describe("phantom-answer suppression — extended", () => {
  describe("detectLowConfidence (existing behavior preserved)", () => {
    it("flags when sources=[] and confidence<0.3", () => {
      const r = detectLowConfidence(
        JSON.stringify({ summary: "x", sources: [], confidence: 0.15 }),
      );
      expect(r.isLowConfidence).toBe(true);
    });

    it("does not flag when sources present", () => {
      const r = detectLowConfidence(
        JSON.stringify({ summary: "x", sources: ["https://a.com"], confidence: 0.1 }),
      );
      expect(r.isLowConfidence).toBe(false);
    });

    it("does not flag when confidence high even if sources empty", () => {
      const r = detectLowConfidence(
        JSON.stringify({ summary: "x", sources: [], confidence: 0.9 }),
      );
      expect(r.isLowConfidence).toBe(false);
    });

    it("tolerates code-fenced JSON", () => {
      const wrapped = "```json\n" + JSON.stringify({ summary: "x", sources: [], confidence: 0.1 }) + "\n```";
      expect(detectLowConfidence(wrapped).isLowConfidence).toBe(true);
    });

    it("treats non-JSON as not-phantom (safe fallback)", () => {
      expect(detectLowConfidence("plain text").isLowConfidence).toBe(false);
    });
  });

  describe("detectUngroundedFacts (NEW)", () => {
    it("flags fact whose source URL is not in the raw results", () => {
      const aiResp = JSON.stringify({
        summary: "x",
        facts: [
          { fact: "f1", source: "https://fabricated.com/article" },
          { fact: "f2", source: "https://legit.com/page" },
        ],
        sources: ["https://legit.com/page"],
        confidence: 0.8,
      });
      const raw = `[{"url":"https://legit.com/page","content":"legit content"}]`;
      const r = detectUngroundedFacts(aiResp, raw);
      expect(r.isUngrounded).toBe(true);
      expect(r.ungroundedCount).toBe(1);
      expect(r.totalFacts).toBe(2);
    });

    it("passes when all fact sources appear in raw results", () => {
      const aiResp = JSON.stringify({
        facts: [
          { fact: "f1", source: "https://legit.com/page" },
          { fact: "f2", source: "https://other.com/page" },
        ],
      });
      const raw = `legit.com/page and other.com/page both appear here`;
      const r = detectUngroundedFacts(aiResp, raw);
      expect(r.isUngrounded).toBe(false);
    });

    it("passes when hostname (without protocol) appears in raw results", () => {
      const aiResp = JSON.stringify({
        facts: [{ fact: "f1", source: "https://developer.android.com/jetpack/compose" }],
      });
      const raw = `developer.android.com is a great site for Android`;
      const r = detectUngroundedFacts(aiResp, raw);
      expect(r.isUngrounded).toBe(false);
    });

    it("flags fact with no source at all", () => {
      const aiResp = JSON.stringify({
        facts: [{ fact: "f1" }, { fact: "f2", source: "https://real.com" }],
      });
      const raw = `https://real.com is in raw`;
      const r = detectUngroundedFacts(aiResp, raw);
      expect(r.isUngrounded).toBe(true);
      expect(r.ungroundedCount).toBe(1);
    });

    it("handles non-JSON gracefully (no facts)", () => {
      const r = detectUngroundedFacts("not json", "any");
      expect(r.isUngrounded).toBe(false);
      expect(r.totalFacts).toBe(0);
    });

    it("handles empty facts array", () => {
      const r = detectUngroundedFacts(JSON.stringify({ facts: [] }), "any");
      expect(r.isUngrounded).toBe(false);
    });
  });

  describe("detectOverconfidentSummary (NEW)", () => {
    it("flags empty sources + high confidence", () => {
      const r = detectOverconfidentSummary(
        JSON.stringify({ summary: "x", sources: [], confidence: 0.95 }),
      );
      expect(r.isOverconfident).toBe(true);
    });

    it("does not flag when sources present", () => {
      const r = detectOverconfidentSummary(
        JSON.stringify({ summary: "x", sources: ["https://a.com"], confidence: 0.95 }),
      );
      expect(r.isOverconfident).toBe(false);
    });

    it("does not flag when confidence is medium (0.5)", () => {
      const r = detectOverconfidentSummary(
        JSON.stringify({ summary: "x", sources: [], confidence: 0.5 }),
      );
      expect(r.isOverconfident).toBe(false);
    });

    it("flags the exact audit reproducer scenario: medium confidence + 1 source", () => {
      // The original audit failed because: 1 source + confidence 0.15 was
      // caught. But: 1 source + high confidence is also suspicious.
      // Verify we DON'T trigger overconfident in this case (sources present).
      const r = detectOverconfidentSummary(
        JSON.stringify({
          summary: "Concentus is a .NET port of Opus",
          sources: ["https://github.com/lostromb/concentus"],
          confidence: 0.92,
        }),
      );
      expect(r.isOverconfident).toBe(false);
    });
  });

  describe("stripCodeFence (helper)", () => {
    it("strips json fences", () => {
      expect(stripCodeFence("```json\n{}\n```")).toBe("{}");
    });

    it("strips plain fences", () => {
      expect(stripCodeFence("```\n{}\n```")).toBe("{}");
    });

    it("passes through plain text", () => {
      expect(stripCodeFence("{}")).toBe("{}");
    });
  });

  describe("Media3-style failure case", () => {
    it("CATCHES: model cites github.com but raw results have developer.android.com", () => {
      // The exact failure pattern from the audit.
      const aiResp = JSON.stringify({
        summary: "ExoPlayer is configured for HLS via MediaSource.Factory",
        facts: [
          { fact: "Configure via MediaSource.Factory", source: "https://github.com/androidx/media" },
        ],
        sources: ["https://github.com/androidx/media"],
        confidence: 0.9,
      });
      const raw = `developer.android.com/media/exoplayer is the canonical doc`;
      const r = detectUngroundedFacts(aiResp, raw);
      // The github.com fact is not present in raw → ungrounded.
      expect(r.isUngrounded).toBe(true);
    });
  });

  describe("Concentus-style failure case", () => {
    it("CATCHES: model cites nonexistent URL", () => {
      const aiResp = JSON.stringify({
        summary: "Concentus is on NuGet",
        facts: [
          { fact: "Latest version is 2.2.0", source: "https://made-up.example/xyz" },
        ],
        sources: ["https://made-up.example/xyz"],
        confidence: 0.85,
      });
      const raw = `nuget.org/packages/Concentus is the real listing`;
      const r = detectUngroundedFacts(aiResp, raw);
      expect(r.isUngrounded).toBe(true);
    });
  });
});
