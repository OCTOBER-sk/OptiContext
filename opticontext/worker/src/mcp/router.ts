import { ToolName, resolveToolName, checkToolPermission } from "../auth/permissions";
import { AgentAuthInfo } from "../auth/verify";
import * as intellisearch from "../tools/intellisearch";
import * as voicebridge from "../tools/voicebridge";
import * as deepdoc from "../tools/deepdoc";
import * as memorycore from "../tools/memorycore";
import * as guide from "../tools/guide";

export interface ToolCallResult {
  content: Array<{
    type: "text" | "resource";
    text?: string;
    resource?: { text: string; uri: string };
  }>;
  isError?: boolean;
  meta?: {
    tokens_used?: number;
    latency_ms?: number;
    provider_used?: string;
    topic?: string;
    file_id?: string;
  };
}

type ToolHandler = (
  args: Record<string, unknown>,
  auth: AgentAuthInfo,
  toolName: string,
) => Promise<ToolCallResult>;

const toolHandlers: Record<ToolName, ToolHandler> = {
  intellisearch: (args, auth, _toolName) => intellisearch.handleSearch(args, auth),
  voicebridge: (args, auth, _toolName) => voicebridge.handleTTS(args, auth),
  deepdoc: (args, auth, _toolName) => deepdoc.handleAnalyze(args, auth),
  // memorycore needs the full MCP tool name to distinguish write vs search
  memorycore: (args, auth, toolName) => memorycore.handleMemory(args, auth, toolName),
  guide: (args, _auth, _toolName) => guide.handleGuide(args),
};

export function getToolHandler(mcpToolName: string): ToolHandler | null {
  const internalName = resolveToolName(mcpToolName);
  if (!internalName) return null;
  return toolHandlers[internalName] ?? null;
}

// Re-export for use in server.ts
export { resolveToolName, checkToolPermission };
