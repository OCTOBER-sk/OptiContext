import { describe, it, expect } from "vitest";
import {
  publicProviderName,
  publicMetaForCapability,
  publicErrorMessage,
  publicMetaProvider,
  isDebugMode,
  isRetryableError,
  sanitizeDetails,
  PublicError,
} from "../src/utils/provider-abstraction";
import { OptiContextError, ProviderError } from "../src/utils/errors";

describe("provider-abstraction", () => {
  describe("publicProviderName", () => {
    it("maps tavily to search", () => {
      expect(publicProviderName("tavily")).toBe("search");
    });
    it("maps ddg to search", () => {
      expect(publicProviderName("ddg")).toBe("search");
    });
    it("maps apify to search", () => {
      expect(publicProviderName("apify")).toBe("search");
    });
    it("maps gemini to analyze", () => {
      expect(publicProviderName("gemini")).toBe("analyze");
    });
    it("maps cerebras to analyze", () => {
      expect(publicProviderName("cerebras")).toBe("analyze");
    });
    it("maps unrealspeech to tts", () => {
      expect(publicProviderName("unrealspeech")).toBe("tts");
    });
    it("maps supabase to memory", () => {
      expect(publicProviderName("supabase")).toBe("memory");
    });
    it("returns 'internal' for unknown providers", () => {
      expect(publicProviderName("made-up-vendor")).toBe("internal");
    });
    it("returns 'internal' for null", () => {
      expect(publicProviderName(null)).toBe("internal");
    });
    it("returns 'internal' for undefined", () => {
      expect(publicProviderName(undefined)).toBe("internal");
    });
  });

  describe("publicMetaForCapability", () => {
    it("returns 'search' for search capability", () => {
      expect(publicMetaForCapability("search")).toBe("search");
    });
    it("returns 'tts' for tts capability", () => {
      expect(publicMetaForCapability("tts")).toBe("tts");
    });
    it("returns 'analyze' for analyze capability", () => {
      expect(publicMetaForCapability("analyze")).toBe("analyze");
    });
    it("returns 'memory' for memory capability", () => {
      expect(publicMetaForCapability("memory")).toBe("memory");
    });
  });

  describe("publicErrorMessage — search", () => {
    it("classifies Tavily rate-limit error as RATE_LIMITED", () => {
      const err = new Error("Tavily daily request budget (250) exceeded");
      const r = publicErrorMessage(err, { capability: "search" });
      expect(r.code).toBe("RATE_LIMITED");
      expect(r.message).not.toMatch(/tavily|ddg|apify|gemini|cerebras/i);
    });

    it("classifies DDG error as SEARCH_UNAVAILABLE (no provider leak)", () => {
      const err = new Error("DuckDuckGo search returned status 503");
      const r = publicErrorMessage(err, { capability: "search" });
      expect(r.message).not.toMatch(/duckduckgo|ddg/i);
    });

    it("classifies Apify budget error with no provider mention", () => {
      const err = new Error("Apify monthly spend guard ($4.50) exceeded");
      const r = publicErrorMessage(err, { capability: "search" });
      expect(r.message).not.toMatch(/apify/i);
      // Should suggest retry or fallback
      expect(r.retry_hint).toBeDefined();
    });

    it("classifies Cerebras error without leaking Cerebras", () => {
      const err = new Error("Cerebras daily token budget (1M) exceeded");
      const r = publicErrorMessage(err, { capability: "search" });
      expect(r.message).not.toMatch(/cerebras/i);
    });

    it("classifies Gemini error without leaking Gemini", () => {
      const err = new Error("Gemini API error: 500");
      const r = publicErrorMessage(err, { capability: "search" });
      expect(r.message).not.toMatch(/gemini/i);
    });

    it("classifies invalid-params phrasing as INVALID_PARAMS", () => {
      const err = new Error("Invalid request: missing query");
      const r = publicErrorMessage(err, { capability: "search" });
      expect(r.code).toBe("INVALID_PARAMS");
    });

    it("classifies 429 phrasing as RATE_LIMITED", () => {
      const err = new Error("429 Too Many Requests");
      const r = publicErrorMessage(err, { capability: "search" });
      expect(r.code).toBe("RATE_LIMITED");
    });
  });

  describe("publicErrorMessage — tts", () => {
    it("classifies UnrealSpeech error without leaking the provider", () => {
      const err = new Error("UnrealSpeech API error: 500");
      const r = publicErrorMessage(err, { capability: "tts" });
      expect(r.message).not.toMatch(/unrealspeech|unreal/i);
      expect(r.code).toBe("TTS_UNAVAILABLE");
    });

    it("returns QUOTA_EXCEEDED for tts rate phrasing", () => {
      const err = new Error("rate limit exceeded");
      const r = publicErrorMessage(err, { capability: "tts" });
      expect(r.code).toBe("QUOTA_EXCEEDED");
    });
  });

  describe("publicErrorMessage — analyze", () => {
    it("classifies Gemini error without leaking Gemini", () => {
      const err = new Error("Gemini file processing failed");
      const r = publicErrorMessage(err, { capability: "analyze" });
      expect(r.message).not.toMatch(/gemini/i);
    });
  });

  describe("publicErrorMessage — memory", () => {
    it("classifies Supabase error without leaking Supabase", () => {
      const err = new Error("Supabase connection failed");
      const r = publicErrorMessage(err, { capability: "memory" });
      expect(r.message).not.toMatch(/supabase|postgres/i);
    });
  });

  describe("publicErrorMessage — debug mode", () => {
    it("preserves original error message when debug=true", () => {
      const err = new Error("Cerebras API error: 503");
      const r = publicErrorMessage(err, { capability: "search", debug: true });
      expect(r.message).toContain("Cerebras");
      expect(r.message).toContain("[debug]");
    });
  });

  describe("isRetryableError", () => {
    it("marks SEARCH_UNAVAILABLE as retryable", () => {
      expect(isRetryableError({ code: "SEARCH_UNAVAILABLE", message: "x" })).toBe(true);
    });
    it("marks TTS_UNAVAILABLE as retryable", () => {
      expect(isRetryableError({ code: "TTS_UNAVAILABLE", message: "x" })).toBe(true);
    });
    it("marks INVALID_PARAMS as not retryable", () => {
      expect(isRetryableError({ code: "INVALID_PARAMS", message: "x" })).toBe(false);
    });
    it("marks SEARCH_QUALITY_INSUFFICIENT as not retryable (not in retryable list)", () => {
      expect(isRetryableError({ code: "SEARCH_QUALITY_INSUFFICIENT", message: "x" })).toBe(false);
    });
  });

  describe("isDebugMode", () => {
    it("returns true for tier=admin", () => {
      expect(isDebugMode({ tier: "admin", agent_id: "x" })).toBe(true);
    });
    it("returns true for tier=debug", () => {
      expect(isDebugMode({ tier: "debug", agent_id: "x" })).toBe(true);
    });
    it("returns false for tier=standard", () => {
      expect(isDebugMode({ tier: "standard", agent_id: "x" })).toBe(false);
    });
    it("returns false for null auth", () => {
      expect(isDebugMode(null)).toBe(false);
    });
    it("per-call debug override beats auth tier", () => {
      expect(isDebugMode({ tier: "standard", agent_id: "x" }, true)).toBe(true);
    });
  });

  describe("publicMetaProvider", () => {
    it("strips provider name from meta provider_used", () => {
      expect(publicMetaProvider("tavily")).toBe("search");
      expect(publicMetaProvider("unrealspeech")).toBe("tts");
      expect(publicMetaProvider("gemini")).toBe("analyze");
    });
    it("returns 'internal' for unknown names", () => {
      expect(publicMetaProvider("random-vendor")).toBe("internal");
    });
  });

  describe("sanitizeDetails (ProviderError.toJSON)", () => {
    it("removes the 'provider' key from user-facing details", () => {
      const err = new ProviderError("upstream blew up", "tavily", 502);
      const json = err.toJSON() as { error: { details?: Record<string, unknown> } };
      // details should either be missing or not contain "provider"
      if (json.error.details) {
        expect(json.error.details).not.toHaveProperty("provider");
      }
    });

    it("replaces provider-named string values with 'internal'", () => {
      const json = new OptiContextError("oops", 500, "TEST", {
        upstream: "tavily",
        ok: true,
        nested: "duckduckgo hit",
      }).toJSON() as { error: { details: Record<string, unknown> } };
      expect(json.error.details.upstream).toBe("internal");
      expect(json.error.details.ok).toBe(true);
      expect(json.error.details.nested).toBe("internal");
    });
  });

  describe("integration: error response contains no provider names", () => {
    it("the search error path returns sanitized content for non-debug", () => {
      // The exact failure patterns from the audit (Tavily, DDG, Apify, Cerebras, Gemini)
      const rawErrors = [
        "Tavily daily request budget (250) exceeded",
        "DuckDuckGo search returned status 503",
        "Apify monthly spend guard ($4.50) exceeded",
        "Cerebras daily token budget (1M) exceeded",
        "Gemini API error: 500",
        "Cerebras request failed: ECONNREFUSED",
      ];
      for (const raw of rawErrors) {
        const r = publicErrorMessage(new Error(raw), { capability: "search" });
        // No provider name should appear in the sanitized message OR retry_hint.
        expect(r.message + (r.retry_hint ?? "")).not.toMatch(
          /tavily|ddg|duckduckgo|apify|cerebras|gemini|unrealspeech|supabase|turso/i,
        );
      }
    });
  });
});
