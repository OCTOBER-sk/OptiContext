import { chunkText } from "../src/tools/memorycore";

describe("memorycore", () => {
  describe("chunkText", () => {
    it("returns single chunk for short text", () => {
      const chunks = chunkText("Hello world");
      expect(chunks).toEqual(["Hello world"]);
    });

    it("splits text longer than 2048 chars", () => {
      const text = "a".repeat(3000);
      const chunks = chunkText(text);
      expect(chunks.length).toBeGreaterThan(1);
    });

    it("preserves all content across chunks (minus overlap)", () => {
      const text = "Hello world. ".repeat(100);
      const chunks = chunkText(text);
      const combined = chunks.join("");
      expect(combined.length).toBeGreaterThanOrEqual(text.length);
    });
  });
});
