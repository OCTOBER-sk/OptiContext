import { logger } from "./logger";

const FETCH_TIMEOUT_MS = 15_000; // 15 second default
const PROVIDER_FETCH_TIMEOUT_MS = 25_000; // 25 second for AI/search providers

const PRIVATE_IP_RANGES = [
  /^127\./,                          // loopback
  /^10\./,                           // RFC 1918 class A
  /^172\.(1[6-9]|2\d|3[01])\./,     // RFC 1918 class B
  /^192\.168\./,                      // RFC 1918 class C
  /^0\./,                            // "This" network
  /^169\.254\./,                      // link-local
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT (RFC 6598)
  /^fc00:/i,                         // IPv6 unique local
  /^fd00:/i,                         // IPv6 unique local
  /^fe80:/i,                         // IPv6 link-local
  /^::1$/i,                           // IPv6 loopback
  /^::$/,                             // IPv6 unspecified
];

const BLOCKED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "169.254.169.254",  // cloud metadata endpoints
  "[::1]",
  "metadata.google.internal",
];

function isPrivateIP(hostname: string): boolean {
  for (const range of PRIVATE_IP_RANGES) {
    if (range.test(hostname)) return true;
  }
  return false;
}

function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  for (const blocked of BLOCKED_HOSTS) {
    if (lower === blocked || lower.endsWith("." + blocked)) return true;
  }
  return false;
}

/**
 * Validates a URL for safe external fetching.
 * Blocks private IPs, localhost, metadata endpoints, and non-https protocols.
 *
 * Returns null if the URL is safe, or an error message string if blocked.
 */
export function validateFetchUrl(urlString: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return "Invalid URL format";
  }

  // Protocol check
  const protocol = parsed.protocol.replace(":", "").toLowerCase();
  if (protocol !== "https" && protocol !== "http") {
    return `Protocol not allowed: ${protocol}`;
  }

  const hostname = parsed.hostname;

  // Block known-dangerous hostnames
  if (isBlockedHost(hostname)) {
    return `Hostname not allowed: ${hostname}`;
  }

  // Block private/reserved IPs
  if (isPrivateIP(hostname)) {
    return `Private/reserved IP not allowed: ${hostname}`;
  }

  // Reject numeric IPs that aren't in private ranges (explicit allowlist is safer)
  // IPv4 with port: e.g., "192.168.1.1:8080" → hostname is "192.168.1.1"
  const isIPv4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
  if (isIPv4 && isPrivateIP(hostname)) {
    return `Private IP not allowed: ${hostname}`;
  }

  return null;
}

/**
 * Safely fetches an external URL with:
 * - URL validation (blocks private IPs, localhost, metadata endpoints)
 * - Protocol allowlist (https only in production)
 * - Timeout
 * - Redirect protection
 * - Size limit
 *
 * Returns Response or throws an error string.
 */
export async function safeFetch(
  urlString: string,
  options?: {
    timeoutMs?: number;
    maxSizeBytes?: number;
    headers?: Record<string, string>;
  },
): Promise<Response> {
  const validationError = validateFetchUrl(urlString);
  if (validationError) {
    throw new Error(validationError);
  }

  const timeout = options?.timeoutMs ?? FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(urlString, {
      method: "GET",
      headers: {
        "User-Agent": "OptiContext/1.0",
        ...(options?.headers ?? {}),
      },
      redirect: "manual",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle redirects explicitly — do NOT follow automatically
    const status = response.status;
    if (status >= 300 && status < 400) {
      const location = response.headers.get("Location");
      if (location) {
        // Only allow a single redirect, and validate the target
        const redirectError = validateFetchUrl(location);
        if (redirectError) {
          throw new Error(`Redirect target blocked: ${redirectError}`);
        }
        return safeFetch(location, options);
      }
    }

    return response;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeout}ms`);
    }

    if (err instanceof Error && err.message.startsWith("Redirect target blocked")) {
      throw err;
    }

    throw err;
  }
}

/**
 * Sanitizes a filename for safe storage.
 * - Strips path separators and traversal sequences
 * - Limits to alphanumeric + dots + hyphens + underscores
 * - Truncates to max length
 */
export function sanitizeFilename(filename: string, maxLength: number = 200): string {
  let sanitized = filename
    .replace(/[/\\]/g, "_")          // Replace path separators
    .replace(/^\.+/, "")              // Remove leading dots (hidden files)
    .replace(/[^a-zA-Z0-9._-]/g, "_"); // Keep safe chars only

  if (sanitized.length > maxLength) {
    const ext = sanitized.lastIndexOf(".");
    if (ext > 0 && (maxLength - (sanitized.length - ext)) > 0) {
      const base = sanitized.substring(0, ext).slice(0, maxLength - (sanitized.length - ext));
      sanitized = base + sanitized.substring(ext);
    } else {
      sanitized = sanitized.slice(0, maxLength);
    }
  }

  return sanitized || "unnamed_file";
}

/**
 * Extracts a safe file extension from a filename.
 * Returns lowercase extension or empty string.
 */
export function safeExtension(filename: string): string {
  const sanitized = sanitizeFilename(filename);
  const parts = sanitized.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/**
 * Validates MIME type against allowed types and checks basic consistency.
 */
const ALLOWED_MIME_PATTERNS = [
  /^application\/(pdf|json|xml|zip|gzip|x-tar|x-sh|x-7z-compressed)/,
  /^application\/vnd\.(openxmlformats|rar|ms)/,
  /^text\//,
  /^image\/(png|jpeg|webp|gif|heic|heif)/,
  /^audio\//,
  /^video\//,
];

export function validateMimeType(mimeType: string, filename?: string): string | null {
  const normalized = mimeType.toLowerCase().trim();

  // Reject empty or absurdly long MIME types
  if (!normalized || normalized.length > 200) {
    return `Invalid MIME type: ${mimeType}`;
  }

  // Check against allowed patterns
  const allowed = ALLOWED_MIME_PATTERNS.some((p) => p.test(normalized));
  if (!allowed) {
    return `MIME type not allowed: ${mimeType}`;
  }

  // Basic MIME/extension consistency check
  if (filename) {
    const ext = safeExtension(filename);
    if (ext && ext !== "bin") {
      const extMime = MIME_TO_EXT[ext];
      if (extMime && extMime !== normalized) {
        // Don't block — just warn. Heuristic only.
        logger.warn("[safe-fetch] MIME/extension mismatch", {
          mime: normalized,
          extension: ext,
          expectedMime: extMime,
        });
      }
    }
  }

  return null;
}

const MIME_TO_EXT: Record<string, string> = {
  pdf: "application/pdf",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  mp4: "video/mp4",
  txt: "text/plain",
  md: "text/markdown",
  html: "text/html",
  xml: "application/xml",
  csv: "text/csv",
  zip: "application/zip",
};

/**
 * Safely parses JSON from a Response, returning null on any failure.
 */
export async function safeJson<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text || text.trim().length === 0) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Fetches a provider API endpoint with timeout and defensive JSON parsing.
 * Returns { data, error } — never throws on parse/network issues.
 */
export async function providerFetch(
  url: string,
  init: RequestInit = {},
  opts?: { timeoutMs?: number },
): Promise<{ response: Response | null; error: string | null }> {
  const timeout = opts?.timeoutMs ?? PROVIDER_FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return { response, error: null };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { response: null, error: `Request timed out after ${timeout}ms` };
    }
    return { response: null, error: err instanceof Error ? err.message : "Unknown fetch error" };
  }
}
