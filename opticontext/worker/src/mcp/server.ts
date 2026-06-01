import { verifyApiKey, AgentAuthInfo, extractBearerToken } from "../auth/verify";
import { checkRateLimit } from "../auth/ratelimit";
import { getToolHandler, resolveToolName, checkToolPermission } from "./router";
import type { ToolCallResult } from "./router";
import { TOOL_SCHEMAS } from "./schemas";
import { turso } from "../storage/turso";
import { logger } from "../utils/logger";
import { corsHeaders } from "../utils/cors";
import { getEnv } from "../context";
import { OptiContextError } from "../utils/errors";
import type { ExecutionContext } from "@cloudflare/workers-types";

interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

const SUPPORTED_PROTOCOL_VERSION = "2025-11-25";

export async function handleMCPRequest(
  request: Request,
  ctx?: ExecutionContext,
): Promise<Response> {
  const startTime = Date.now();

  // CORS headers for dashboard / browser clients
  const originCors = corsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: originCors });
  }

  try {
    // Extract Mcp-Session-Id for optional session tracking
    const sessionId = request.headers.get("Mcp-Session-Id") ?? undefined;

    // GET /mcp — SSE stream initialization for Streamable HTTP.
    // No auth required: the stream is established before authentication
    // occurs on the POST side (per protocol spec).
    if (request.method === "GET") {
      return handleSSEInitialization(originCors, sessionId);
    }

    // POST /mcp — requires authentication
    const authHeader = extractBearerToken(request);
    const authInfo = await verifyApiKey(authHeader);

    await checkRateLimit(authInfo.agent_id, authInfo.rate_limits);

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: originCors,
      });
    }

    let body: JSONRPCRequest;
    try {
      body = (await request.json()) as JSONRPCRequest;
    } catch {
      return jsonRpcError(null, -32700, "Parse error: invalid JSON", originCors);
    }

    if (body.jsonrpc !== "2.0") {
      return jsonRpcError(body.id, -32600, "Invalid Request: must use JSON-RPC 2.0", originCors);
    }

    let result: JSONRPCResponse;

    switch (body.method) {
      case "initialize":
        result = handleInitialize(body.id, body.params);
        break;
      case "notifications/initialized":
        result = { jsonrpc: "2.0", id: body.id, result: null };
        break;
      case "tools/list":
        result = handleToolsList(body.id);
        break;
      case "tools/call":
        result = await handleToolCall(body.id, body.params, authInfo, startTime, sessionId, ctx);
        break;
      case "ping":
        result = { jsonrpc: "2.0", id: body.id, result: {} };
        break;
      default:
        result = {
          jsonrpc: "2.0",
          id: body.id,
          error: { code: -32601, message: `Method not found: ${body.method}` },
        };
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json", ...originCors },
    });
  } catch (err) {
    const latency = Date.now() - startTime;
    logger.error("MCP request failed", {
      error: err instanceof Error ? err.message : "Unknown",
      latency_ms: latency,
    });

    if (err instanceof OptiContextError) {
      const res = err.toResponse();
      return new Response(res.body, {
        status: res.status,
        headers: {
          ...Object.fromEntries(res.headers.entries()),
          ...originCors,
        },
      });
    }

    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message: "Internal error",
          data: err instanceof Error ? err.message : "Unknown",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...originCors },
      },
    );
  }
}

function handleInitialize(
  id: string | number | null,
  params?: Record<string, unknown>,
): JSONRPCResponse {
  const _clientProtocol = (params?.protocolVersion as string) || "unknown";

  return {
    jsonrpc: "2.0",
    id,
    result: {
      protocolVersion: SUPPORTED_PROTOCOL_VERSION,
      serverInfo: {
        name: "OptiContext",
        version: "1.0.0",
      },
      capabilities: {
        tools: {},
        logging: {},
      },
    },
  };
}

function handleToolsList(id: string | number | null): JSONRPCResponse {
  return {
    jsonrpc: "2.0",
    id,
    result: {
      tools: TOOL_SCHEMAS,
    },
  };
}

async function handleToolCall(
  id: string | number | null,
  params: Record<string, unknown> | undefined,
  authInfo: AgentAuthInfo,
  startTime: number,
  sessionId?: string,
  ctx?: ExecutionContext,
): Promise<JSONRPCResponse> {
  const toolName = params?.name as string;
  const toolArgs = (params?.arguments as Record<string, unknown>) || {};

  if (!toolName) {
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32602, message: "Missing required parameter: name" },
    };
  }

  const internalName = resolveToolName(toolName);
  if (!internalName) {
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32602, message: `Unknown tool: ${toolName}` },
    };
  }

  try {
    checkToolPermission(authInfo.allowed_tools, internalName);
  } catch (err) {
    if (err instanceof OptiContextError) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32001, message: err.message },
      };
    }
    throw err;
  }

  const handler = getToolHandler(toolName);
  if (!handler) {
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32603, message: `No handler registered for tool: ${toolName}` },
    };
  }

  // Pass toolName as third argument so memorycore can distinguish write vs search
  let toolResult: ToolCallResult;
  try {
    const env = getEnv();
    const timeoutMs = parseInt(
      (env as unknown as Record<string, string>).MCP_TOOL_TIMEOUT_MS ?? "180000",
      10,
    );
    const handlerPromise = handler(toolArgs, authInfo, toolName);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Tool execution timed out after ${timeoutMs}ms`)), timeoutMs),
    );
    toolResult = await Promise.race([handlerPromise, timeoutPromise]);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Tool execution timed out")) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32002, message: err.message },
      };
    }
    if (err instanceof Error && err.name === "ZodError") {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32602, message: `Invalid params: ${err.message}` },
      };
    }
    if (err instanceof OptiContextError) {
      const errorCode = String(err.code) === "429" ? -32002 : -32001;
      return {
        jsonrpc: "2.0",
        id,
        error: { code: errorCode, message: err.message },
      };
    }
    // Unhandled errors — return as JSON-RPC internal error, not HTTP 500
    const message = err instanceof Error ? err.message : "Unknown tool error";
    logger.error("Unhandled tool error", { tool: toolName, error: message });
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32603, message: `Tool execution failed: ${message}` },
    };
  }

  const latency = Date.now() - startTime;

  // Log asynchronously — never blocks the response
  const logPromise = turso.logRequest({
    agent_id: authInfo.agent_id,
    tool_name: toolName,
    latency_ms: latency,
    tokens_used: toolResult.meta?.tokens_used ?? 0,
    provider_used: toolResult.meta?.provider_used,
    success: !toolResult.isError,
    error_code: toolResult.isError ? "TOOL_ERROR" : undefined,
  });
  if (ctx) {
    ctx.waitUntil(logPromise);
  }

  if (sessionId) {
    logger.debug("Session context", { agent_id: authInfo.agent_id, session_id: sessionId, tool: toolName });
  }

  return {
    jsonrpc: "2.0",
    id,
    result: {
      content: toolResult.content,
      isError: toolResult.isError ?? false,
      ...(toolResult.meta ? { _meta: toolResult.meta } : {}),
    },
  };
}

function handleSSEInitialization(
  originCors: Record<string, string>,
  sessionId?: string,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send the endpoint event so SSE clients know where to POST
      controller.enqueue(encoder.encode("event: endpoint\ndata: /mcp\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...originCors,
    },
  });
}

function jsonRpcError(
  id: string | number | null,
  code: number,
  message: string,
  originCors: Record<string, string>,
  data?: unknown,
): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: { code, message, ...(data ? { data } : {}) },
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json", ...originCors },
    },
  );
}
