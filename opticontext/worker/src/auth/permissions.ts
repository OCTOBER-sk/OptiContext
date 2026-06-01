import { PermissionError } from "../utils/errors";

const VALID_TOOLS = [
  "intellisearch",
  "voicebridge",
  "deepdoc",
  "memorycore",
  "guide",
] as const;

export type ToolName = (typeof VALID_TOOLS)[number];

const MCP_TOOL_TO_INTERNAL: Record<string, ToolName> = {
  opticontext_search: "intellisearch",
  opticontext_tts: "voicebridge",
  opticontext_analyze: "deepdoc",
  opticontext_memory_write: "memorycore",
  opticontext_memory_search: "memorycore",
  opticontext_guide: "guide",
};

export function resolveToolName(mcpToolName: string): ToolName | null {
  return MCP_TOOL_TO_INTERNAL[mcpToolName] || null;
}

export function checkToolPermission(
  allowed_tools: string[],
  tool: ToolName,
): void {
  if (tool === "guide") return;
  if (!allowed_tools.includes(tool)) {
    throw new PermissionError(
      `Agent does not have permission to use tool: ${tool}`,
    );
  }
}

export function getAllTools(): readonly string[] {
  return VALID_TOOLS;
}
