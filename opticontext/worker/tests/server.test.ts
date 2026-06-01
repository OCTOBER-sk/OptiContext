import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/auth/verify", () => ({
  verifyApiKey: vi.fn(),
  extractBearerToken: vi.fn(),
}));
vi.mock("../src/auth/ratelimit", () => ({
  checkRateLimit: vi.fn(),
}));
vi.mock("../src/mcp/router", () => ({
  getToolHandler: vi.fn(),
  resolveToolName: vi.fn(),
  checkToolPermission: vi.fn(),
}));
vi.mock("../src/storage/turso", () => ({
  turso: { logRequest: vi.fn() },
}));
vi.mock("../src/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

import { handleMCPRequest } from "../src/mcp/server";
import { verifyApiKey, extractBearerToken } from "../src/auth/verify";
import { checkRateLimit } from "../src/auth/ratelimit";
import { getToolHandler, resolveToolName, checkToolPermission } from "../src/mcp/router";
import { AuthError } from "../src/utils/errors";

const mockAuth = {
  agent_id: "test-agent",
  allowed_tools: ["intellisearch", "voicebridge", "deepdoc", "memorycore"],
  tier: "standard",
  rate_limits: { requests_per_minute: 30, daily_cap: 500 },
};

function makeRequest(method: string, body?: unknown, headers?: Record<string, string>): Request {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: "Bearer opctx_test_abc123",
    ...headers,
  };
  return new Request("http://localhost/mcp", {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("MCP Server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyApiKey).mockResolvedValue(mockAuth);
    vi.mocked(checkRateLimit).mockResolvedValue(undefined);
    vi.mocked(extractBearerToken).mockReturnValue("Bearer opctx_test_abc123");
  });

  it("handles OPTIONS preflight with CORS headers", async () => {
    const req = new Request("http://localhost/mcp", { method: "OPTIONS" });
    const res = await handleMCPRequest(req);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("handles MCP initialize request", async () => {
    const req = makeRequest("POST", {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-11-25" },
    });
    const res = await handleMCPRequest(req);
    const data = await res.json();
    expect(data.jsonrpc).toBe("2.0");
    expect(data.result.serverInfo.name).toBe("OptiContext");
    expect(data.result.protocolVersion).toBe("2025-11-25");
  });

  it("handles tools/list request", async () => {
    const req = makeRequest("POST", {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    });
    const res = await handleMCPRequest(req);
    const data = await res.json();
    expect(data.jsonrpc).toBe("2.0");
    expect(data.result.tools).toBeDefined();
  });

  it("handles ping request", async () => {
    const req = makeRequest("POST", {
      jsonrpc: "2.0",
      id: 3,
      method: "ping",
    });
    const res = await handleMCPRequest(req);
    const data = await res.json();
    expect(data.result).toEqual({});
  });

  it("rejects request with invalid JSON", async () => {
    const req = new Request("http://localhost/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer opctx_test_abc123",
      },
      body: "not-json",
    });
    const res = await handleMCPRequest(req);
    const data = await res.json();
    expect(data.error.code).toBe(-32700);
  });

  it("rejects non-JSON-RPC 2.0 message", async () => {
    const req = makeRequest("POST", { jsonrpc: "1.0", id: 4, method: "ping" });
    const res = await handleMCPRequest(req);
    const data = await res.json();
    expect(data.error.code).toBe(-32600);
  });

  it("rejects unknown method", async () => {
    const req = makeRequest("POST", {
      jsonrpc: "2.0",
      id: 5,
      method: "unknown_method",
    });
    const res = await handleMCPRequest(req);
    const data = await res.json();
    expect(data.error.code).toBe(-32601);
  });

  it("handles GET /mcp for SSE initialization", async () => {
    const req = makeRequest("GET");
    const res = await handleMCPRequest(req);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
  });

  it("rejects unauthorized requests", async () => {
    vi.mocked(verifyApiKey).mockRejectedValue(new AuthError("Invalid API key"));
    const req = makeRequest("POST", {
      jsonrpc: "2.0",
      id: 1,
      method: "ping",
    });
    const res = await handleMCPRequest(req);
    expect(res.status).toBe(401);
  });

  it("handles tools/call with valid tool", async () => {
    vi.mocked(resolveToolName).mockReturnValue("intellisearch");
    vi.mocked(checkToolPermission).mockReturnValue(undefined);
    vi.mocked(getToolHandler).mockReturnValue(async () => ({
      content: [{ type: "text", text: '{"result": "ok"}' }],
      meta: { tokens_used: 10, provider_used: "tavily" },
    }));

    const req = makeRequest("POST", {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: { name: "opticontext_search", arguments: { query: "test" } },
    });
    const res = await handleMCPRequest(req);
    const data = await res.json();
    expect(data.result.content[0].text).toContain("ok");
  });

  it("handles Mcp-Session-Id header", async () => {
    vi.mocked(resolveToolName).mockReturnValue("intellisearch");
    vi.mocked(checkToolPermission).mockReturnValue(undefined);
    vi.mocked(getToolHandler).mockReturnValue(async () => ({
      content: [{ type: "text", text: "ok" }],
    }));

    const req = makeRequest("POST",
      { jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "opticontext_search", arguments: { query: "test" } } },
      { "Mcp-Session-Id": "session-123" },
    );
    const res = await handleMCPRequest(req);
    expect(res.status).toBe(200);
  });
});
