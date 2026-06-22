export class OptiContextError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "OptiContextError";
  }

  toJSON() {
    // Provider details (if any) are stripped from the user-facing response.
    // The original details object is preserved in server logs at the call
    // site via logger.error. Only a sanitized version crosses the boundary.
    const safeDetails = this.details ? sanitizeDetails(this.details) : undefined;
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        ...(safeDetails ? { details: safeDetails } : {}),
      },
    };
  }
  toResponse(): Response {
    return new Response(JSON.stringify(this.toJSON()), {
      status: this.statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Strip provider names from a details object before it crosses the
 * trust boundary to the MCP client. Provider-named keys (provider,
 * internal_provider) are removed. Any string value matching a known
 * provider name is replaced with "internal".
 */
function sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
  const PROVIDER_NAMES = /cerebras|tavily|ddg|duckduckgo|apify|gemini|unrealspeech|supabase|turso/i;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(details)) {
    if (k === "provider" || k === "internal_provider") continue;
    if (typeof v === "string" && PROVIDER_NAMES.test(v)) {
      out[k] = "internal";
    } else {
      out[k] = v;
    }
  }
  return out;
}

export class AuthError extends OptiContextError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "AUTH_ERROR");
    this.name = "AuthError";
  }
}

export class RateLimitError extends OptiContextError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT_ERROR");
    this.name = "RateLimitError";
  }
}

export class PermissionError extends OptiContextError {
  constructor(message: string = "Tool not permitted") {
    super(message, 403, "PERMISSION_ERROR");
    this.name = "PermissionError";
  }
}

export class ValidationError extends OptiContextError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class ProviderError extends OptiContextError {
  constructor(
    message: string,
    public provider: string,
    statusCode: number = 502,
  ) {
    // We still record the provider internally via the constructor argument,
    // but toResponse() / toJSON() strips it from the user-facing payload.
    super(message, statusCode, "PROVIDER_ERROR", { provider });
    this.name = "ProviderError";
  }
}
