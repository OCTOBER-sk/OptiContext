import { getEnv } from "../context";
import { ProviderError } from "../utils/errors";
import { logger } from "../utils/logger";
import { kv } from "../storage/kv";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const BUDGET = {
  FLASH_REQUESTS_DAY: 1500,
  FLASH_RPM: 15,
  PRO_REQUESTS_DAY: 50,
  PRO_RPM: 2,
  EMBEDDING_REQUESTS_DAY: 5000,
} as const;

function getModelFamily(model: string): "flash" | "pro" | "embedding" {
  if (model.includes("embedding")) return "embedding";
  if (model.includes("pro")) return "pro";
  return "flash";
}

async function checkGeminiBudget(model: string): Promise<{ allowed: boolean; dayKey: string; rpmKey: string; family: string }> {
  const date = new Date().toISOString().slice(0, 10);
  const family = getModelFamily(model);

  if (family === "embedding") {
    const key = `gemini_embedding:${date}`;
    const used = parseInt((await kv.get("CACHE", key)) ?? "0", 10);
    const allowed = used + 1 <= BUDGET.EMBEDDING_REQUESTS_DAY;
    return { allowed, dayKey: key, rpmKey: "", family };
  }

  const isPro = family === "pro";
  const dayLimit = isPro ? BUDGET.PRO_REQUESTS_DAY : BUDGET.FLASH_REQUESTS_DAY;
  const rpmLimit = isPro ? BUDGET.PRO_RPM : BUDGET.FLASH_RPM;

  // Daily check
  const dayKey = `gemini_${family}:${date}`;
  const dayUsed = parseInt((await kv.get("CACHE", dayKey)) ?? "0", 10);
  if (dayUsed + 1 > dayLimit) {
    logger.warn("[Gemini] Daily request budget exceeded", { model: family, used: dayUsed, limit: dayLimit });
    return { allowed: false, dayKey, rpmKey: "", family };
  }

  // Per-minute check (read-only — increment happens only on success via deductGeminiRpm)
  const minute = new Date().toISOString().slice(0, 16);
  const rpmKey = `gemini_rpm_${family}:${minute}`;
  const rpmUsed = parseInt((await kv.get("CACHE", rpmKey)) ?? "0", 10);
  if (rpmUsed >= rpmLimit) {
    logger.warn("[Gemini] RPM budget exceeded", { model: family, rpm: rpmUsed, limit: rpmLimit });
    return { allowed: false, dayKey, rpmKey, family };
  }

  return { allowed: true, dayKey, rpmKey, family };
}

/** Deduct one from the RPM counter and daily budget AFTER a successful API call. */
async function deductGeminiBudget(dayKey: string, rpmKey: string): Promise<void> {
  const dayUsed = parseInt((await kv.get("CACHE", dayKey)) ?? "0", 10);
  await kv.put("CACHE", dayKey, (dayUsed + 1).toString(), { expirationTtl: 86400 });
  if (rpmKey) {
    await kv.increment("CACHE", rpmKey, 120);
  }
}

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
  file_data?: { file_uri: string; mime_type: string };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiRequest {
  contents: GeminiContent[];
  system_instruction?: { parts: { text: string }[] };
  generation_config?: {
    max_output_tokens?: number;
    temperature?: number;
    response_mime_type?: string;
  };
}

interface GeminiResponse {
  candidates: {
    content: { parts: { text?: string }[] };
    finishReason: string;
  }[];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface GeminiFileStatus {
  name: string;
  uri: string;
  mimeType: string;
  state: "PROCESSING" | "ACTIVE" | "FAILED";
}

const KEY_ROTATION_COUNTER = "gemini_key_idx";

async function getApiKey(): Promise<string> {
  const key1 = getEnv().GEMINI_API_KEY;
  const key2 = getEnv().GEMINI_API_KEY_2;
  if (!key1) throw new ProviderError("GEMINI_API_KEY not configured", "gemini", 503);

  // Single key — no rotation
  if (!key2) return key1;

  // Round-robin via KV counter (keep key for 1hr)
  const idx = await kv.increment("CACHE", KEY_ROTATION_COUNTER, 3600);
  return (idx % 2 === 0) ? key1 : key2;
}

async function tryGeminiKeys<T>(
  fn: (key: string) => Promise<T>,
): Promise<T> {
  const key1 = getEnv().GEMINI_API_KEY;
  const key2 = getEnv().GEMINI_API_KEY_2;
  if (!key1) throw new ProviderError("GEMINI_API_KEY not configured", "gemini", 503);

  // Single key path
  if (!key2) return fn(key1);

  // Round-robin which key to try FIRST
  const idx = await kv.increment("CACHE", KEY_ROTATION_COUNTER, 3600);
  const primaryKey = (idx % 2 === 0) ? key1 : key2;
  const fallbackKey = (idx % 2 === 0) ? key2 : key1;

  try {
    return await fn(primaryKey);
  } catch (err) {
    // Only fallback on quota/rate-limit errors
    if (err instanceof ProviderError && (err.statusCode === 429 || err.statusCode === 503)) {
      logger.warn("[Gemini] Primary key quota exhausted, trying fallback key", {
        primaryIdx: idx % 2,
      });
      return fn(fallbackKey);
    }
    throw err;
  }
}

async function generateContent(
  contents: GeminiContent[],
  options: {
    model?: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
  } = {},
): Promise<{ content: string; tokens_used: number }> {
  const key1 = getEnv().GEMINI_API_KEY;
  if (!key1) {
    logger.warn("[Gemini] GEMINI_API_KEY not set — using mock response");
    return {
      content: JSON.stringify({
        summary: "Gemini API key not configured. Placeholder response.",
        key_findings: [],
        answer: "API not configured",
        confidence: 0,
      }),
      tokens_used: 0,
    };
  }

  const model = options.model ?? "gemini-2.5-flash";

  const { allowed, dayKey, rpmKey } = await checkGeminiBudget(model);
  if (!allowed) {
    throw new ProviderError(
      `Gemini daily budget exceeded for model ${model}. Try a different model or try again later.`,
      "gemini",
    );
  }

  const url = `${GEMINI_API_BASE}/models/${model}:generateContent`;

  const body: GeminiRequest = {
    contents,
    generation_config: {
      max_output_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.3,
      ...(options.jsonMode === true
        ? { response_mime_type: "application/json" }
        : {}),
    },
  };

  if (options.systemPrompt) {
    body.system_instruction = {
      parts: [{ text: options.systemPrompt }],
    };
  }

  return tryGeminiKeys(async (apiKey) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ProviderError(
        `Gemini API error: ${response.status} ${text}`,
        "gemini",
        response.status,
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const tokens = data.usageMetadata?.totalTokenCount ?? 0;

    // Deduct budget only after confirmed success — failed calls do not consume quota.
    deductGeminiBudget(dayKey, rpmKey).catch(() => {});

    return { content: text, tokens_used: tokens };
  });
}

/**
 * Uploads a file to the Gemini Files API using the resumable upload protocol.
 * Returns the file URI and mime type for use in subsequent generateContent calls.
 *
 * Gemini Files API docs:
 * https://ai.google.dev/gemini-api/docs/vision?lang=rest#upload-video
 */
export async function uploadFileToGemini(
  fileData: ArrayBuffer,
  mimeType: string,
  filename: string,
): Promise<{ file_uri: string; mime_type: string }> {
  const apiKey = await getApiKey();

  const numBytes = fileData.byteLength;

  // Step 1: Initiate resumable upload
  const initiateUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files`;
  const initiateResponse = await fetch(initiateUrl, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": numBytes.toString(),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file: { display_name: filename },
    }),
  });

  if (!initiateResponse.ok) {
    const text = await initiateResponse.text();
    throw new ProviderError(
      `Gemini Files API initiation failed: ${initiateResponse.status} ${text}`,
      "gemini",
    );
  }

  const uploadUrl = initiateResponse.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) {
    throw new ProviderError(
      "Gemini Files API did not return an upload URL",
      "gemini",
    );
  }

  // Step 2: Upload file bytes
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": numBytes.toString(),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: fileData,
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new ProviderError(
      `Gemini file upload failed: ${uploadResponse.status} ${text}`,
      "gemini",
    );
  }

  const result = (await uploadResponse.json()) as { file: GeminiFileStatus };
  const fileUri = result.file.uri;

  if (!fileUri) {
    throw new ProviderError("Gemini file upload returned no URI", "gemini");
  }

  // Wait for file to be ACTIVE (usually instant for small files)
  let status = result.file.state;
  if (status === "PROCESSING") {
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const checkResp = await fetch(
        `${GEMINI_API_BASE}/files/${result.file.name}`,
        { headers: { "x-goog-api-key": apiKey } },
      );
      const check = (await checkResp.json()) as GeminiFileStatus;
      status = check.state;
      if (status === "ACTIVE") break;
      if (status === "FAILED") {
        throw new ProviderError("Gemini file processing failed", "gemini");
      }
    }
  }

  return { file_uri: fileUri, mime_type: mimeType };
}

/**
 * Analyzes a file that has already been uploaded to Gemini Files API.
 */
export async function analyzeFile(
  fileUri: string,
  mimeType: string,
  query: string,
  options: {
    model?: string;
    maxTokens?: number;
  } = {},
): Promise<{ content: string; tokens_used: number }> {
  const systemPrompt = `You are a precise document analyst. Given the file and the query, provide a structured analysis.
Return valid JSON with these keys:
- summary: string (concise overview of the file)
- key_findings: string[] (bullet-point findings, 3-10 items)
- answer_to_query: string (direct answer to the specific query)
- data_tables: object[] (any structured data extracted, empty array if none)
- code_blocks: string[] (relevant code snippets, empty array if none)
- confidence: number (0-1, how confident in the analysis)`;

  return generateContent(
    [
      {
        role: "user",
        parts: [
          { file_data: { file_uri: fileUri, mime_type: mimeType } },
          { text: query },
        ],
      },
    ],
    { ...options, systemPrompt },
  );
}

/**
 * Generates embeddings for text using Gemini's embedding model.
 * Returns a 768-dimensional float vector.
 * Note: produces 768d vectors, not 1536d.
 * Update your Supabase schema to VECTOR(768) if using this.
 */
export async function embedText(text: string): Promise<number[]> {
  const key1 = getEnv().GEMINI_API_KEY;
  if (!key1) {
    logger.warn("[Gemini Embedding] GEMINI_API_KEY not set — returning zero vector");
    return new Array(768).fill(0);
  }

  const budgetAllowed = await checkGeminiBudget("gemini-embedding-2");
  if (!budgetAllowed) {
    logger.warn("[Gemini Embedding] Daily embedding budget exceeded");
    throw new ProviderError("Gemini embedding budget exceeded for today", "gemini");
  }

  const url = `${GEMINI_API_BASE}/models/gemini-embedding-2:embedContent`;

  return tryGeminiKeys(async (apiKey) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model: "models/gemini-embedding-2",
        content: { parts: [{ text }] },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new ProviderError(
        `Gemini embedding failed: ${response.status} ${errText}`,
        "gemini",
        response.status,
      );
    }

    const data = (await response.json()) as {
      embedding: { values: number[] };
    };

    return data.embedding.values;
  });
}

export async function simpleGenerate(
  prompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    jsonMode?: boolean;
  },
): Promise<{ content: string; tokens_used: number }> {
  return generateContent(
    [{ role: "user", parts: [{ text: prompt }] }],
    options,
  );
}
