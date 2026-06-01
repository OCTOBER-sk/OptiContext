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
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
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
    super(message, statusCode, "PROVIDER_ERROR", { provider });
    this.name = "ProviderError";
  }
}
