import { getEnv } from "../context";

function getAllowedOrigins(): string[] {
  const env = getEnv();
  const raw = (env as unknown as Record<string, string>).ALLOWED_ORIGINS;
  if (!raw) return ["http://localhost:5173", "http://localhost:3000", "https://opticontext.pages.dev"];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Returns CORS headers for a response.
 * - If Origin header is present AND matches an allowed origin → reflects it (never wildcard)
 * - If Origin header is present but does NOT match → returns no CORS headers (blocks the request)
 * - If no Origin header (non-browser client, e.g. MCP tools) → returns "*" safely
 */
export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin");
  if (!origin) {
    return { "Access-Control-Allow-Origin": "*" };
  }
  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) {
    return { "Access-Control-Allow-Origin": origin };
  }
  return {};
}

/**
 * Returns CORS preflight headers for OPTIONS requests.
 */
export function corsPreflightHeaders(request: Request): Record<string, string> {
  return {
    ...corsHeaders(request),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Secret, X-OptiContext-Admin, Mcp-Session-Id",
    "Access-Control-Max-Age": "86400",
  };
}
