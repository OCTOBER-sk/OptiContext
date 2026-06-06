import { ToolCallResult } from "../mcp/router";
import { AgentAuthInfo } from "../auth/verify";
import { r2 } from "../storage/r2";
import { turso } from "../storage/turso";
import { kv } from "../storage/kv";
import { dispatchAI, routeGeminiModel, estimateContextTokens } from "../ai/router";
import { embedText } from "../ai/gemini";
import { supabase as supabaseClient } from "../storage/supabase";
import { logger } from "../utils/logger";
import cryptoUtils from "../utils/crypto";
import { safeFetch, validateFetchUrl, sanitizeFilename, safeExtension, validateMimeType } from "../utils/safe-fetch";
import { analyzeSchema, validateArgs } from "../mcp/validation";

const MAX_INLINE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const PERSISTED_FILE_TTL_SEC = 30 * 24 * 60 * 60; // 30 days — matches KV expirationTtl for file_idx
const UPLOAD_FILE_TTL_SEC = 24 * 60 * 60;          // 24 hours — matches /upload contract

const SUPPORTED_MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  txt: "text/plain",
  md: "text/markdown",
  html: "text/html",
  xml: "application/xml",
  json: "application/json",
  py: "text/x-python",
  js: "text/javascript",
  ts: "text/typescript",
  java: "text/x-java-source",
  cpp: "text/x-c++src",
  c: "text/x-csrc",
  go: "text/x-go",
  rs: "text/x-rust",
  rb: "text/x-ruby",
  php: "text/x-php",
  sh: "application/x-sh",
  yaml: "text/yaml",
  toml: "text/toml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  gif: "image/gif",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  flac: "audio/flac",
  aac: "audio/aac",
  ogg: "audio/ogg",
  opus: "audio/opus",
  mp4: "video/mp4",
  avi: "video/x-msvideo",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  webm: "video/webm",
  zip: "application/zip",
  gz: "application/gzip",
  tar: "application/x-tar",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
};

function detectMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return SUPPORTED_MIME_TYPES[ext] ?? "application/octet-stream";
}

export async function handleAnalyze(
  args: Record<string, unknown>,
  auth: AgentAuthInfo,
): Promise<ToolCallResult> {
  const startTime = Date.now();
  const { query, model: modelOverride, output_format: outputFormat, save_to_memory: saveToMemory, max_tokens: maxTokens, file_url, file_b64, upload_id, file_id, mime_type } = validateArgs(analyzeSchema, args);

  const hasFileUrl = !!file_url;
  const hasFileB64 = !!file_b64;
  const hasUploadId = !!upload_id;
  const hasFileId = !!file_id;

  if (!hasFileUrl && !hasFileB64 && !hasUploadId && !hasFileId) {
    return errorResult("One of file_url, file_b64, upload_id, or file_id is required");
  }

  // Hoisted so the catch block can include them in error telemetry
  // without re-declaring.
  let fileExpiresAt: string | null = null;

  try {
    let fileData: ArrayBuffer | null = null;
    let mimeType = "text/plain";
    let filename = "unknown";
    let geminiFileUri: string | null = null;
    let returnedFileId: string | null = null;
    let geminiUriCacheHit = false;
    let fallbackUsed = false;

    // ── File intake ──────────────────────────────────────────────────
    if (hasFileId) {
      const rawFileId = String(file_id);
      if (!/^[a-zA-Z0-9._-]+$/.test(rawFileId)) {
        return errorResult("Invalid file_id format.");
      }
      // Look up from KV (fast), fallback to Turso (durable)
      let record = await kv.getJson<{
        file_id: string; agent_id: string; filename: string;
        mime_type: string; file_size: number; r2_key: string;
        gemini_file_uri?: string; gemini_expires_at?: string;
        expires_at?: string; created_at?: string;
      }>("CACHE", `file_idx:${auth.agent_id}:${rawFileId}`);
      if (!record) {
        const tRecord = await turso.getFileRecord(rawFileId, auth.agent_id);
        if (!tRecord) {
          return errorResult("File not found. Use a fresh file source (file_url, file_b64, or upload_id).");
        }
        record = tRecord;
      }
      if (record.agent_id !== auth.agent_id) {
        return errorResult("File not found (wrong agent).");
      }
      const r2Object = await r2.get("files", record.r2_key);
      if (!r2Object) {
        return errorResult("File no longer available in storage. Re-upload.");
      }
      fileData = await r2Object.arrayBuffer();
      filename = record.filename;
      mimeType = record.mime_type;

      // Surface expiration: prefer record.expires_at (new records); fall back
      // to 30-day window from now for legacy records (safe lower bound).
      if (record.expires_at) {
        fileExpiresAt = record.expires_at;
      } else {
        fileExpiresAt = new Date(Date.now() + PERSISTED_FILE_TTL_SEC * 1000).toISOString();
      }

      // Check for cached Gemini file URI (avoids re-upload within 48h window)
      if (record.gemini_file_uri && record.gemini_expires_at && new Date(record.gemini_expires_at) > new Date()) {
        geminiFileUri = record.gemini_file_uri;
        geminiUriCacheHit = true;
      }
    } else if (hasUploadId) {
      const rawId = String(upload_id);
      if (!/^[a-zA-Z0-9._-]+$/.test(rawId)) {
        return errorResult("Invalid upload_id format.");
      }
      const r2Key = `${auth.agent_id}/${rawId}`;
      const r2Object = await r2.get("files", r2Key);
      if (!r2Object) {
        return errorResult("Upload not found or expired. Re-upload the file.");
      }

      // Enforce the 24-hour expiry contract stored in metadata at upload time.
      const expiresAtStr = r2Object.customMetadata?.expires_at;
      if (expiresAtStr && Date.now() > new Date(expiresAtStr).getTime()) {
        // Best-effort cleanup of the expired object.
        r2.delete("files", r2Key).catch(() => {});
        return {
          content: [{ type: "text", text: JSON.stringify({
            error: "UPLOAD_EXPIRED — The upload_id has expired (24-hour window). Re-upload the file and retry immediately.",
            expires_at: expiresAtStr,
          }) }],
          isError: true,
          meta: {
            latency_ms: Date.now() - startTime,
            total_duration_ms: Date.now() - startTime,
            provider_used: "gemini",
            cache_hit: false,
            fallback_used: false,
            expires_at: expiresAtStr,
          },
        };
      }

      fileData = await r2Object.arrayBuffer();
      filename = r2Object.customMetadata?.filename ?? String(upload_id);
      mimeType = r2Object.customMetadata?.mimeType ?? detectMimeType(filename);
      // Surface 24h upload window — file will be re-persisted below with its own 30d TTL
      fileExpiresAt = expiresAtStr ?? new Date(Date.now() + UPLOAD_FILE_TTL_SEC * 1000).toISOString();
      // Delete temp upload — file will be persisted below
      r2.delete("files", r2Key).catch(() => {});
    } else if (hasFileB64) {
      const b64 = file_b64;
      if (b64.length > MAX_INLINE_SIZE_BYTES * 1.37) {
        return errorResult("File too large for inline base64. Use POST /upload instead.");
      }
      const binaryStr = atob(b64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      fileData = bytes.buffer;
      mimeType = mime_type || "text/plain";
      const b64MimeError = validateMimeType(mimeType);
      if (b64MimeError) {
        return errorResult(b64MimeError);
      }
    } else if (hasFileUrl) {
      const fileUrl = file_url;
      // SSRF protection: validate URL before fetching
      const urlError = validateFetchUrl(fileUrl);
      if (urlError) {
        return errorResult(`URL not allowed: ${urlError}`);
      }
      const urlResponse = await safeFetch(fileUrl, { timeoutMs: 30_000, maxSizeBytes: MAX_INLINE_SIZE_BYTES });
      if (!urlResponse.ok) {
        return errorResult(`Failed to fetch file from URL: ${urlResponse.status}`);
      }
      fileData = await urlResponse.arrayBuffer();
      filename = sanitizeFilename(fileUrl.split("/").pop()?.split("?")[0] ?? "remote-file");
      mimeType = urlResponse.headers.get("content-type")?.split(";")[0].trim() ?? detectMimeType(filename);
      // Validate MIME type from response or filename
      const mimeError = validateMimeType(mimeType, filename);
      if (mimeError) {
        return errorResult(mimeError);
      }
    }

    if (!fileData) {
      return errorResult("Failed to load file data");
    }

    const fileSize = fileData.byteLength;

    // ── Persist to R2 + KV + Turso ──────────────────────────────────
    if (hasFileB64 || hasUploadId || hasFileUrl) {
      const fileId = cryptoUtils.randomHex(12);
      const persistKey = `persist/${auth.agent_id}/${fileId}`;
      const createdAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + PERSISTED_FILE_TTL_SEC * 1000).toISOString();

      await r2.put("files", persistKey, fileData, {
        customMetadata: { filename, mimeType, agent_id: auth.agent_id, expires_at: expiresAt },
      });

      const fileMeta = {
        file_id: fileId,
        agent_id: auth.agent_id,
        filename,
        mime_type: mimeType,
        file_size: fileSize,
        r2_key: persistKey,
        gemini_file_uri: undefined as string | undefined,
        gemini_expires_at: undefined as string | undefined,
        created_at: createdAt,
        expires_at: expiresAt,
      };

      // Write KV index eagerly — this is the primary lookup path for file_id.
      await kv.putJson("CACHE", `file_idx:${auth.agent_id}:${fileId}`, fileMeta, { expirationTtl: 2592000 }).catch(() => {
        logger.warn("DeepDoc: KV index write failed, file_id lookups will fall back to Turso", { file_id: fileId });
      });

      // Write Turso as durable fallback
      turso.storeFileRecord(fileMeta).catch((err: Error) => {
        logger.warn("DeepDoc: Turso file record failed", {
          file_id: fileId, error: err.message,
        });
      });

      returnedFileId = fileId;
      // Newly persisted files inherit the 30-day TTL window
      fileExpiresAt = expiresAt;
    }

    // ── Model selection ──────────────────────────────────────────────
    let selectedModel: string;
    if (modelOverride === "flash") {
      selectedModel = "gemini-2.5-flash";
    } else if (modelOverride === "pro") {
      selectedModel = "gemini-1.5-pro";
    } else {
      // Auto-route based on file size
      const estimatedCtx = estimateContextTokens(query) + Math.ceil(fileSize / 4);
      selectedModel = routeGeminiModel(estimatedCtx);
    }

    // ── Upload file to Gemini Files API via dispatch (skip if cached URI is valid) ──
    if (!geminiFileUri) {
      const uploadResult = await dispatchAI("upload_file", {
        fileData,
        mimeType,
        filename,
      }, { hasFile: true, forceProvider: "gemini" });
      const geminiFile = JSON.parse(uploadResult.content);
      geminiFileUri = geminiFile.file_uri;

      // Persist gemini_file_uri to Turso + KV for future re-analysis
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      if (returnedFileId) {
        // Newly persisted file — update the KV cache record with the URI
        const fileIdxKey = `file_idx:${auth.agent_id}:${returnedFileId}`;
        kv.getJson<Record<string, unknown>>("CACHE", fileIdxKey).then((existing) => {
          if (existing) {
            existing.gemini_file_uri = geminiFileUri;
            existing.gemini_expires_at = expiresAt;
            kv.putJson("CACHE", fileIdxKey, existing, { expirationTtl: 2592000 }).catch(() => {});
          }
        }).catch(() => {});
        // Update Turso record (best-effort)
        turso.updateFileGeminiUri(returnedFileId, auth.agent_id, geminiFileUri!, expiresAt).catch(() => {});
      } else if (hasFileId) {
        // Re-analyzed existing file — update Turso with the fresh URI
        const rawFileId = String(file_id);
        turso.updateFileGeminiUri(rawFileId, auth.agent_id, geminiFileUri!, expiresAt).catch(() => {});
        // Update KV cache if present
        const fileIdxKey = `file_idx:${auth.agent_id}:${rawFileId}`;
        kv.getJson<Record<string, unknown>>("CACHE", fileIdxKey).then((existing) => {
          if (existing) {
            existing.gemini_file_uri = geminiFileUri;
            existing.gemini_expires_at = expiresAt;
            kv.putJson("CACHE", fileIdxKey, existing, { expirationTtl: 2592000 }).catch(() => {});
          }
        }).catch(() => {});
      }
    }

    // ── Analyze via dispatch ─────────────────────────────────────────
    const analysis = await dispatchAI("analyze_file", {
      fileUri: geminiFileUri,
      mimeType,
      query,
      model: selectedModel,
      maxTokens,
    }, { hasFile: true, forceProvider: "gemini" });

    // ── Format output ────────────────────────────────────────────────
    let resultContent = analysis.content;
    if (outputFormat === "summary_only") {
      try {
        const parsed = JSON.parse(analysis.content) as { summary?: string };
        resultContent = parsed.summary ?? analysis.content;
      } catch {
        resultContent = analysis.content;
      }
    } else if (outputFormat === "markdown") {
      try {
        const parsed = JSON.parse(analysis.content) as {
          summary?: string;
          key_findings?: string[];
          answer_to_query?: string;
        };
        const sections: string[] = [];
        if (parsed.summary) sections.push(`## Summary\n${parsed.summary}`);
        if (parsed.key_findings?.length) {
          sections.push(
            `## Key Findings\n${parsed.key_findings.map((f) => `- ${f}`).join("\n")}`,
          );
        }
        if (parsed.answer_to_query) {
          sections.push(`## Answer\n${parsed.answer_to_query}`);
        }
        resultContent = sections.join("\n\n") || analysis.content;
      } catch {
        resultContent = analysis.content;
      }
    }

    // ── Optionally save to MemoryCore ────────────────────────────────
    if (saveToMemory) {
      memoryCoreSave(resultContent, auth, mimeType, selectedModel, filename);
    }

    if (returnedFileId) {
      resultContent += `\n\n---\nfile_id: ${returnedFileId}`;
    }

    return {
      content: [{ type: "text", text: resultContent }],
      meta: {
        latency_ms: Date.now() - startTime,
        total_duration_ms: Date.now() - startTime,
        tokens_used: analysis.tokens_used,
        provider_used: selectedModel,
        cache_hit: geminiUriCacheHit,
        fallback_used: false,
        ...(returnedFileId ? { file_id: returnedFileId } : {}),
        ...(fileExpiresAt ? { expires_at: fileExpiresAt } : {}),
      },
    };
  } catch (err) {
    logger.error("DeepDoc analysis failed", {
      agent_id: auth.agent_id,
      error: err instanceof Error ? err.message : "Unknown",
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: "File analysis failed",
            message: err instanceof Error ? err.message : "Unknown error",
          }),
        },
      ],
      isError: true,
      meta: {
        latency_ms: Date.now() - startTime,
        total_duration_ms: Date.now() - startTime,
        provider_used: "gemini",
        cache_hit: false,
        fallback_used: false,
        ...(fileExpiresAt ? { expires_at: fileExpiresAt } : {}),
      },
    };
  }
}

async function memoryCoreSave(
  content: string,
  auth: AgentAuthInfo,
  mimeType: string,
  model: string,
  filename: string,
): Promise<void> {
  try {
    const embedding = await embedText(content.slice(0, 8000));
    await supabaseClient.insertMemoryEmbedding({
      agent_id: auth.agent_id,
      content_text: content.slice(0, 8000),
      embedding,
      metadata: {
        source_tool: "deepdoc",
        file_type: mimeType,
        model,
        filename,
      },
      importance_score: 7,
      namespace: "general",
    });
  } catch (err) {
    logger.warn("DeepDoc: Failed to save analysis to memory", {
      error: err instanceof Error ? err.message : "Unknown",
    });
  }
}

function errorResult(message: string): ToolCallResult {
  return {
    content: [{ type: "text", text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}
