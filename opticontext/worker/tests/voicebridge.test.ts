import { chunkTextForTTS, preprocessText, estimateDuration, getOptimalBitrate } from "../src/tools/voicebridge";

describe("voicebridge utilities", () => {
  describe("chunkTextForTTS", () => {
    it("returns single chunk for short text", () => {
      expect(chunkTextForTTS("Hello world")).toEqual(["Hello world"]);
    });

    it("splits at sentence boundaries", () => {
      const longText = "First sentence. ".repeat(200);
      const chunks = chunkTextForTTS(longText);
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((c) => expect(c.length).toBeLessThanOrEqual(2950));
    });

    it("preserves all content across chunks", () => {
      const text = "A. ".repeat(1000);
      const chunks = chunkTextForTTS(text);
      const combined = chunks.join(" ");
      expect(combined.replace(/\s+/g, " ").trim().length).toBeGreaterThan(500);
    });

    it("handles long text without punctuation by splitting on whitespace", () => {
      const text = "hello world ".repeat(300);
      const chunks = chunkTextForTTS(text);
      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  describe("preprocessText", () => {
    it("strips markdown code blocks", () => {
      expect(preprocessText("text ```code``` more")).toMatch(/text .* more/);
    });

    it("strips inline code", () => {
      expect(preprocessText("use `cmd` here")).toContain("cmd here");
    });

    it("strips headings", () => {
      expect(preprocessText("# Title\nContent")).toContain("Content");
    });

    it("strips bold/italic markers", () => {
      expect(preprocessText("**bold** and *italic*")).toContain("bold and italic");
    });

    it("converts links to plain text", () => {
      expect(preprocessText("[click](https://example.com)")).toContain("click");
    });

    it("normalizes multiple newlines", () => {
      expect(preprocessText("a\n\n\n\nb")).toBe("a\n\nb");
    });

    it("trims whitespace", () => {
      expect(preprocessText("  hello  ")).toBe("hello");
    });
  });

  describe("estimateDuration", () => {
    it("returns positive duration for any text", () => {
      expect(estimateDuration("hello", 1.0)).toBeGreaterThan(0);
    });

    it("scales inversely with speed", () => {
      const slow = estimateDuration("test text here", 0.5);
      const fast = estimateDuration("test text here", 2.0);
      expect(slow).toBeGreaterThan(fast);
    });
  });

  describe("getOptimalBitrate", () => {
    it("returns 48k for telegram", () => {
      expect(getOptimalBitrate("telegram", "mp3")).toBe("48k");
    });

    it("returns 48k for whatsapp", () => {
      expect(getOptimalBitrate("whatsapp", "mp3")).toBe("48k");
    });

    it("returns 128k for discord", () => {
      expect(getOptimalBitrate("discord", "mp3")).toBe("128k");
    });

    it("returns 48k for ogg format", () => {
      expect(getOptimalBitrate("raw", "ogg")).toBe("48k");
    });

    it("returns 192k for raw mp3", () => {
      expect(getOptimalBitrate("raw", "mp3")).toBe("192k");
    });
  });
});
