import crypto from "../src/utils/crypto";

describe("crypto", () => {
  describe("hashString", () => {
    it("returns a 64-char hex string for any input", async () => {
      const hash = await crypto.hashString("hello world");
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("produces deterministic output for same input", async () => {
      const [a, b] = await Promise.all([
        crypto.hashString("test"),
        crypto.hashString("test"),
      ]);
      expect(a).toBe(b);
    });

    it("produces different output for different inputs", async () => {
      const [a, b] = await Promise.all([
        crypto.hashString("foo"),
        crypto.hashString("bar"),
      ]);
      expect(a).not.toBe(b);
    });
  });

  describe("randomHex", () => {
    it("returns a string of the requested length", () => {
      expect(crypto.randomHex(32)).toHaveLength(32);
      expect(crypto.randomHex(16)).toHaveLength(16);
      expect(crypto.randomHex(64)).toHaveLength(64);
    });

    it("returns only hex characters", () => {
      const result = crypto.randomHex(100);
      expect(result).toMatch(/^[0-9a-f]+$/);
    });
  });
});
