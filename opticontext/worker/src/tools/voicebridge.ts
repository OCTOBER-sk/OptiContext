import { getEnv } from "../context";
import { ToolCallResult } from "../mcp/router";
import { AgentAuthInfo } from "../auth/verify";
import { kv } from "../storage/kv";
import { r2 } from "../storage/r2";
import { logger } from "../utils/logger";
import crypto from "../utils/crypto";
import { ttsSchema, validateArgs } from "../mcp/validation";

const UNREAL_SPEECH_API = "https://api.v7.unrealspeech.com/stream";

const CHUNK_MAX_CHARS = 2900;

export function chunkTextForTTS(text: string): string[] {
  if (text.length <= CHUNK_MAX_CHARS) return [text];
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  if (sentences.length <= 1 && text.length > CHUNK_MAX_CHARS) {
    for (let i = 0; i < text.length; i += CHUNK_MAX_CHARS) {
      chunks.push(text.slice(i, i + CHUNK_MAX_CHARS).trim());
    }
    return chunks.filter(Boolean);
  }
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > CHUNK_MAX_CHARS && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Maps our internal speed (0.25-4.0, 1.0=normal) to the Unreal Speech API
 * speed range (-1.0 to 1.0, 0=normal).
 *
 * API docs: Speed defaults to 0. Positive = faster, negative = slower.
 *   0.5 = 50% faster, -0.5 = 50% slower.
 *
 * Our speed is a multiplier where 1.0 = normal, 2.0 = 2x, 0.5 = half speed.
 * The relationship is simply: apiSpeed = ourSpeed - 1
 *   our 1.0 → api 0   (normal)
 *   our 2.0 → api 1.0 (2x speed = 100% faster)
 *   our 0.5 → api -0.5 (half speed = 50% slower)
 */
function mapSpeedToAPI(speed: number): string {
  const apiSpeed = Math.max(-1.0, Math.min(1.0, speed - 1.0));
  return apiSpeed.toFixed(2);
}

async function processChunk(
  text: string,
  voice: string,
  speed: number,
  format: string,
  platform: string,
  auth: AgentAuthInfo,
): Promise<{ audioBuffer: ArrayBuffer | null; audioUrl: string | null; durationMs: number }> {
  const apiKey = getEnv().UNREAL_SPEECH_KEY;
  if (!apiKey) {
    return { audioBuffer: null, audioUrl: null, durationMs: estimateDuration(text, speed) };
  }

  const response = await fetch(UNREAL_SPEECH_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Text: text,
      VoiceId: voice,
      Speed: mapSpeedToAPI(speed),
      Pitch: "1",
      Bitrate: getOptimalBitrate(platform, format),
      TimestampType: "sentence",
      OutputFormat: format === "ogg" ? "ogg" : "mp3",
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    logger.error("[UnrealSpeech] API error", { status: response.status, error: errText });
    return { audioBuffer: null, audioUrl: null, durationMs: estimateDuration(text, speed) };
  }

  const contentType = response.headers.get("Content-Type") || "";
  const audioBuffer = await response.arrayBuffer();

  if (!contentType.startsWith("audio/")) {
    logger.error("[UnrealSpeech] Unexpected Content-Type", { contentType, status: response.status });
    return { audioBuffer: null, audioUrl: null, durationMs: estimateDuration(text, speed) };
  }

  if (audioBuffer.byteLength < 100) {
    logger.error("[UnrealSpeech] Audio too small — likely garbled", { bytes: audioBuffer.byteLength });
    return { audioBuffer: null, audioUrl: null, durationMs: estimateDuration(text, speed) };
  }

  if (format === "mp3" || contentType.includes("mpeg")) {
    const header = new Uint8Array(audioBuffer.slice(0, 3));
    const startsWithId3 = header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33;
    const hasSyncFrame = (header[0] === 0xFF) && ((header[1] & 0xF0) === 0xF0);
    if (!startsWithId3 && !hasSyncFrame && audioBuffer.byteLength < 10000) {
      logger.error("[UnrealSpeech] Invalid MP3 header — audio may be garbled", { headerHex: `${header[0].toString(16).padStart(2, "0")} ${header[1].toString(16).padStart(2, "0")} ${header[2].toString(16).padStart(2, "0")}` });
      return { audioBuffer: null, audioUrl: null, durationMs: estimateDuration(text, speed) };
    }
  }

  return { audioBuffer, audioUrl: null, durationMs: estimateDuration(text, speed) };
}

export async function handleTTS(
  args: Record<string, unknown>,
  auth: AgentAuthInfo,
): Promise<ToolCallResult> {
  const startTime = Date.now();
  const { text: rawText, voice, speed, format, platform, stream: shouldStream } = validateArgs(ttsSchema, args);

  if (!rawText) {
    return errorResult("Text is required");
  }

  try {
    const processedText = preprocessText(rawText);
    const textChunks = processedText.length > CHUNK_MAX_CHARS ? chunkTextForTTS(processedText) : [processedText];

    // Phase 1: Hash all chunks + check KV cache in parallel
    interface ChunkEntry {
      text: string;
      hash: string;
      cacheKey: string;
      cachedUrl: string | null;
      result?: { audioBuffer: ArrayBuffer | null; durationMs: number };
      audioUrl?: string;
    }
    const chunkEntries: ChunkEntry[] = await Promise.all(
      textChunks.map(async (text) => {
        const hash = await crypto.hashString(text + voice + speed + format + platform);
        const cacheKey = `tts_cache:${hash}`;
        const cachedUrl = await kv.get("CACHE", cacheKey);
        return { text, hash, cacheKey, cachedUrl };
      }),
    );

    // Phase 2: Process only uncached chunks in parallel
    const uncached = chunkEntries.filter((e) => !e.cachedUrl);
    const processedResults = await Promise.all(
      uncached.map((e) => processChunk(e.text, voice, speed, format, platform, auth)),
    );
    uncached.forEach((e, i) => { e.result = processedResults[i]; });

    // Phase 3: Upload uncached results to R2 in parallel
    // and store URLs in KV cache.
    await Promise.all(
      uncached.map(async (e) => {
        if (!e.result?.audioBuffer) return;
        const r2Key = `tts/${e.hash}.${format}`;
        await r2.put("tts", r2Key, e.result.audioBuffer, {
          customMetadata: {
            agent_id: auth.agent_id,
            voice,
            format,
            duration_ms: e.result.durationMs.toString(),
          },
        });
        e.audioUrl = r2.getPublicUrl("tts", r2Key);
        await kv.put("CACHE", e.cacheKey, e.audioUrl, { expirationTtl: 86400 });
      }),
    );

    // Build segments preserving original chunk order
    const segments = chunkEntries.map((e) => {
      if (e.cachedUrl) {
        return { audioUrl: e.cachedUrl, audioBuffer: null, durationMs: estimateDuration(e.text, speed), text: e.text };
      }
      return {
        audioUrl: e.audioUrl ?? null,
        audioBuffer: e.result?.audioBuffer ?? null,
        durationMs: e.result?.durationMs ?? estimateDuration(e.text, speed),
        text: e.text,
      };
    });

    // Cache-hit classification: every segment was served from cache.
    // Mixed (some cached, some fresh) is reported as false because the
    // caller still paid for the fresh synthesis.
    const allCached = segments.length > 0 && segments.every((s) => s.audioUrl && !s.audioBuffer);

    const totalDuration = segments.reduce((sum, s) => sum + s.durationMs, 0);
    const responsePayload: Record<string, unknown> = {
      total_duration_ms: totalDuration,
      voice_used: voice,
      platform,
      segments: segments.length,
    };

    if (segments.length === 1) {
      responsePayload.audio_url = segments[0].audioUrl;
      responsePayload.duration_ms = segments[0].durationMs;
    } else {
      responsePayload.audio_urls = segments.map((s) => s.audioUrl);
      responsePayload.segment_durations = segments.map((s) => s.durationMs);
    }

    if (shouldStream) {
      responsePayload.chunks = segments
        .filter((s) => s.audioBuffer)
        .map((s) => ({ data: arrayBufferToBase64(s.audioBuffer!), format }));
    }

    const notes: string[] = [];
    if (textChunks.length > 1) notes.push(`Split into ${textChunks.length} segments (max ${CHUNK_MAX_CHARS} chars each)`);
    if (segments.some((s) => !s.audioUrl && !s.audioBuffer)) {
      notes.push("UNREAL_SPEECH_KEY not configured or API unavailable — duration estimates only");
    }
    if (notes.length) responsePayload.note = notes.join("; ");

    return {
      content: [{ type: "text", text: JSON.stringify(responsePayload) }],
      meta: {
        latency_ms: Date.now() - startTime,
        total_duration_ms: Date.now() - startTime,
        provider_used: segments.some((s) => s.audioBuffer) ? "unrealspeech" : "mock",
        cache_hit: allCached,
        fallback_used: false,
      },
    };
  } catch (err) {
    logger.error("VoiceBridge failed", {
      agent_id: auth.agent_id,
      error: err instanceof Error ? err.message : "Unknown",
    });

    return {
      content: [
        { type: "text", text: JSON.stringify({ error: "TTS failed", message: err instanceof Error ? err.message : "Unknown error" }) },
      ],
      isError: true,
      meta: {
        latency_ms: Date.now() - startTime,
        total_duration_ms: Date.now() - startTime,
        provider_used: "unrealspeech",
        cache_hit: false,
        fallback_used: false,
      },
    };
  }
}

export function preprocessText(text: string): string {
  let processed = text
    .replace(/```[\s\S]*?```/g, "[code block]")
    .replace(/`[^`]+`/g, (match) => match.slice(1, -1))
    .replace(/#{1,6}\s/g, "")
    .replace(/\*{1,2}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[_~>|]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Normalize common abbreviations for better TTS pronunciation
  processed = processed
    .replace(/\b(\d+)px\b/gi, "$1 pixels")
    .replace(/\b(\d+)ms\b/gi, "$1 milliseconds")
    .replace(/\b(\d+)s\b/gi, "$1 seconds")
    .replace(/\b(\d+)gb\b/gi, "$1 gigabytes")
    .replace(/\b(\d+)mb\b/gi, "$1 megabytes")
    .replace(/\b(\d+)kb\b/gi, "$1 kilobytes")
    .replace(/\b(\d+)ghz\b/gi, "$1 gigahertz")
    .replace(/\bAPI\b/g, "A P I")
    .replace(/\bURL\b/g, "U R L")
    .replace(/\bHTTP\b/g, "H T T P")
    .replace(/\bHTTPS\b/g, "H T T P S")
    .replace(/\bJSON\b/g, "J SON")
    .replace(/\bCLI\b/g, "C L I")
    .replace(/\bSSH\b/g, "S S H")
    .replace(/\bSQL\b/g, "S Q L")
    .replace(/\bUUID\b/g, "U U I D")
    .replace(/\bHTML\b/g, "H T M L")
    .replace(/\bCSS\b/g, "C S S")
    .replace(/\bPDF\b/g, "P D F");

  // Normalize numbers with commas (1,234 → 1234 for clean TTS)
  processed = processed.replace(/(\d),(\d{3})/g, "$1$2");

  return processed;
}

export function estimateDuration(text: string, speed: number): number {
  // Average ~15 chars/second at speed=1.0
  const avgCharsPerSecond = 15 * speed;
  return Math.ceil((text.length / avgCharsPerSecond) * 1000);
}

export function getOptimalBitrate(platform: string, format: string): string {
  if (platform === "telegram" || platform === "whatsapp") return "48k";
  if (platform === "discord") return "128k";
  if (format === "ogg") return "48k";
  return "192k";
}

function errorResult(message: string): ToolCallResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ error: "Invalid input", message }),
      },
    ],
    isError: true,
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
