import { routeToProvider, routeGeminiModel, estimateContextTokens } from "../src/ai/router";

describe("router", () => {
  describe("routeToProvider", () => {
    it("routes files to gemini", () => {
      const result = routeToProvider({ hasFile: true, isMultimodal: false, estimatedContextTokens: 100, requiresLowLatency: false });
      expect(result).toBe("gemini");
    });

    it("routes multimodal to gemini", () => {
      const result = routeToProvider({ hasFile: false, isMultimodal: true, estimatedContextTokens: 100, requiresLowLatency: false });
      expect(result).toBe("gemini");
    });

    it("routes large context to gemini", () => {
      const result = routeToProvider({ hasFile: false, isMultimodal: false, estimatedContextTokens: 10000, requiresLowLatency: false });
      expect(result).toBe("gemini");
    });

    it("routes low-latency to cerebras", () => {
      const result = routeToProvider({ hasFile: false, isMultimodal: false, estimatedContextTokens: 100, requiresLowLatency: true });
      expect(result).toBe("cerebras");
    });

    it("defaults to cerebras", () => {
      const result = routeToProvider({ hasFile: false, isMultimodal: false, estimatedContextTokens: 100, requiresLowLatency: false });
      expect(result).toBe("cerebras");
    });

    it("respects forceProvider", () => {
      const result = routeToProvider({ hasFile: true, isMultimodal: false, estimatedContextTokens: 100, requiresLowLatency: false, forceProvider: "cerebras" });
      expect(result).toBe("cerebras");
    });
  });

  describe("routeGeminiModel", () => {
    it("returns flash for small context", () => {
      const result = routeGeminiModel(10000);
      expect(result).toContain("flash");
    });

    it("returns 2.0 flash for medium context", () => {
      const result = routeGeminiModel(100000);
      expect(result).toBe("gemini-2.0-flash");
    });

    it("returns 1.5 pro for large context", () => {
      const result = routeGeminiModel(600000);
      expect(result).toBe("gemini-1.5-pro");
    });
  });

  describe("estimateContextTokens", () => {
    it("estimates ~1 token per 4 characters", () => {
      expect(estimateContextTokens("a".repeat(100))).toBe(25);
    });

    it("returns 0 for empty string", () => {
      expect(estimateContextTokens("")).toBe(0);
    });
  });
});
