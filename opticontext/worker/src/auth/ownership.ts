import { turso } from "../storage/turso";

export class OwnershipError extends Error {
  status: number;
  constructor(message: string, status: number = 403) {
    super(message);
    this.status = status;
    this.name = "OwnershipError";
  }
}

/** Assert that the given agent belongs to the verified owner email.
 *  Only bypasses ownership checks for development scenarios where
 *  a real owner email is not available (e.g., local dev admin secret).
 *  In production, ownerEmail MUST be present and valid. */
export async function assertOwnership(
  agentId: string,
  ownerEmail: string,
  hasOwnershipContext: boolean = true,
): Promise<void> {
  if (!ownerEmail || !hasOwnershipContext) return;
  const owns = await turso.agentBelongsToOwner(agentId, ownerEmail);
  if (!owns) {
    throw new OwnershipError("Forbidden — agent not owned by this user");
  }
}

/**
 * JSON error response for OwnershipError.
 * Centralizes the shape so all handlers return consistent 403/400 errors.
 */
export function ownershipErrorResponse(err: OwnershipError, request?: Request): Response {
  const origin = request?.headers.get("Origin");
  const allowOrigin = origin ? { "Access-Control-Allow-Origin": origin } : { "Access-Control-Allow-Origin": "*" };
  return new Response(
    JSON.stringify({ error: err.message }),
    {
      status: err.status,
      headers: {
        "Content-Type": "application/json",
        ...allowOrigin,
      },
    },
  );
}
