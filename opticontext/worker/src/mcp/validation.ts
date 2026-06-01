import { z } from "zod";

export const searchSchema = z.object({
  query: z.string().min(1).max(2000),
  mode: z.enum(["auto", "fast", "research", "scrape"]).optional().default("auto"),
  max_results: z.number().int().min(1).max(50).optional().default(5),
  summarize: z.boolean().optional().default(true),
  dork: z
    .object({
      site_filter: z.string().max(500).optional(),
      file_type: z.string().max(50).optional(),
      date_after: z.string().max(20).optional(),
      date_before: z.string().max(20).optional(),
      exclude_terms: z.array(z.string().max(200)).optional(),
      include_phrases: z.array(z.string().max(200)).optional(),
      search_in: z.enum(["url", "title", "body"]).optional(),
    })
    .optional(),
});

export const ttsSchema = z.object({
  text: z.string().min(1).max(30000),
  voice: z.string().max(100).optional().default("Scarlett"),
  speed: z.number().min(0.25).max(4.0).optional().default(1.0),
  format: z.enum(["mp3", "ogg", "wav", "aac", "flac"]).optional().default("mp3"),
  platform: z.enum(["raw", "discord", "telegram", "whatsapp"]).optional().default("raw"),
  stream: z.boolean().optional().default(false),
});

export const analyzeSchema = z.object({
  query: z.string().min(1).max(5000),
  file_url: z.string().max(2000).optional(),
  file_b64: z.string().max(200_000_000).optional(),
  upload_id: z.string().max(200).optional(),
  file_id: z.string().max(100).optional(),
  mime_type: z.string().max(200).optional(),
  model: z.enum(["auto", "flash", "pro"]).optional().default("auto"),
  output_format: z.enum(["structured", "summary_only", "markdown"]).optional().default("structured"),
  save_to_memory: z.boolean().optional().default(false),
  max_tokens: z.number().int().min(1).max(65536).optional().default(4096),
}).refine(
  (data) => data.file_url || data.file_b64 || data.upload_id || data.file_id,
  { message: "One of file_url, file_b64, upload_id, or file_id is required" },
);

export const memoryWriteSchema = z.object({
  content: z.string().min(1).max(100_000),
  namespace: z.string().max(200).optional().default("general"),
  importance: z.number().int().min(1).max(10).optional().default(5),
  source: z.string().max(500).optional(),
  expires_at: z.string().max(30).optional(),
});

export const memorySearchSchema = z.object({
  query: z.string().min(1).max(5000),
  namespace: z.string().max(200).optional().default("general"),
  top_k: z.number().int().min(1).max(100).optional().default(5),
  min_similarity: z.number().min(0).max(1).optional().default(0.5),
  rerank: z.boolean().optional().default(false),
});

export const guideSchema = z.object({
  topic: z
    .enum(["all", "search", "tts", "analyze", "memory", "limits", "errors", "best-practices"])
    .optional()
    .default("all"),
});

export function validateArgs<T extends z.ZodTypeAny>(schema: T, args: unknown): z.infer<T> {
  return schema.parse(args);
}
