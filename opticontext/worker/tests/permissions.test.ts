import { resolveToolName, checkToolPermission } from "../src/auth/permissions";

describe("permissions", () => {
  describe("resolveToolName", () => {
    it("resolves opticontext_search to intellisearch", () => {
      expect(resolveToolName("opticontext_search")).toBe("intellisearch");
    });

    it("resolves opticontext_tts to voicebridge", () => {
      expect(resolveToolName("opticontext_tts")).toBe("voicebridge");
    });

    it("resolves opticontext_analyze to deepdoc", () => {
      expect(resolveToolName("opticontext_analyze")).toBe("deepdoc");
    });

    it("resolves opticontext_memory_write to memorycore", () => {
      expect(resolveToolName("opticontext_memory_write")).toBe("memorycore");
    });

    it("resolves opticontext_memory_search to memorycore", () => {
      expect(resolveToolName("opticontext_memory_search")).toBe("memorycore");
    });

    it("returns null for unknown tool", () => {
      expect(resolveToolName("unknown_tool")).toBeNull();
    });
  });

  describe("checkToolPermission", () => {
    it("does not throw if tool is allowed", () => {
      expect(() => checkToolPermission(["intellisearch", "voicebridge"], "intellisearch")).not.toThrow();
    });

    it("throws PermissionError if tool is not allowed", () => {
      expect(() => checkToolPermission(["voicebridge"], "intellisearch")).toThrow(/not have permission/);
    });
  });
});
