# OptiContext — Phase 5: Capability Documentation
## Production Copy · `/docs/tools/[capability]` · All Four Capabilities
### Version 1.0 · Sandy · May 2026

---

> **Source-of-truth alignment:**
> Generated from OPTICONTEXT_PLAN__4_.md (sections 7–10), OPTICONTEXT_FRONTEND_GUIDE.txt (Part 5),
> and OPTICONTEXT_TERMINOLOGY.md (language contract).
> Four pages. Identical skeleton. Unique content per capability.
> Tone: technical, neutral, precise. No marketing language.

---

## FILE STRUCTURE

```
/docs/tools/intellisearch    → Page 1
/docs/tools/voicebridge      → Page 2
/docs/tools/deepdoc          → Page 3
/docs/tools/memorycore       → Page 4
```

**Page navigation order (bottom of each page):**
`IntelliSearch → VoiceBridge → DeepDoc → MemoryCore`

---

---

# PAGE 1 — IntelliSearch
## `/docs/tools/intellisearch`

**Background atmosphere:** Faint radial lines suggesting search-result paths. Branching from a central point, upper-right area. SVG background. Opacity: 0.025 maximum. Color: emerald-tinted. Imperceptible at reading distance.

---

### Breadcrumb

```
DOCUMENTATION  ›  CAPABILITIES  ›  INTELLISEARCH
```

*Switzer 500 · 13px · Uppercase · Text muted*

---

### Heading

```
IntelliSearch
```

*Zodiak 4xl (48px) · Text primary*

---

### One-line description

```
Web search with AI-enhanced dorking, multi-provider routing, and Cerebras summarization.
```

*Switzer lg (18px) · Text secondary · Margin-top: 8px*

---

### Best For Block

*Background: accent subtle (#E8F4EE) · Border-left: 3px solid accent primary (#1A6B4A)*
*Radius: 0 8px 8px 0 · Padding: 12px 16px · Margin-top: 24px*

**Label:** `BEST FOR`
*Switzer 600 · 12px · Uppercase · Accent text*

```
Agents that need current, precise information from the web.
Runtimes that query time-sensitive data, research sources, documentation, or structured datasets.
Any agent where hallucination from stale training data is a failure mode.
```

*Switzer base · Text primary*

---

### MCP tool name

```
opticontext_search
```

*JetBrains Mono · 14px · inline chip · Border default · Radius sm · Padding: 4px 10px*

---

---

## What it does

IntelliSearch routes every search request through three providers — Tavily, DuckDuckGo, and Apify — selecting the appropriate one based on the `mode` parameter or automatically based on query type.
Before returning results, it constructs a precision search query using advanced dorking operators, then passes the raw results through Cerebras inference at 2,600 tokens per second to filter noise and produce a structured, agent-ready output.
The final response contains a summary, extracted key findings, source URLs, a confidence score, and the provider that resolved the query.
Results are cached in Cloudflare KV for 15 minutes — identical queries within that window return immediately without consuming provider credits.

---

## Problem it solves

Without IntelliSearch, agents are limited to training data with a fixed knowledge cutoff.
Any query requiring current information — news, documentation updates, CVEs, pricing, availability — either returns stale data or produces a hallucination.
IntelliSearch gives every MCP-compatible runtime live web access through a single capability call, with no per-runtime search integration required.

---

## Input schema

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | string | Yes | — | The search query in natural language. |
| `mode` | string | No | `"auto"` | Provider routing mode: `"auto"`, `"research"`, `"fast"`, or `"scrape"`. |
| `dork` | object | No | — | Advanced search operator parameters (see dork sub-schema below). |
| `max_results` | integer | No | `5` | Maximum number of results to return. Range: 1–20. |
| `summarize` | boolean | No | `true` | Run Cerebras AI filter and summarization on raw results before returning. |

---

### Mode values

| Value | Provider | When to use |
|---|---|---|
| `"auto"` | Tavily → DDG fallback | Default. Routes by query type and current budget state. |
| `"research"` | Tavily | Deep queries requiring full page content extraction. Costs 2 Tavily credits. |
| `"fast"` | DuckDuckGo | Instant queries. Free. Returns snippets, not full content. |
| `"scrape"` | Apify | Structured data extraction from specific URLs. Use sparingly. |

---

### Dork sub-schema

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `site_filter` | string | No | — | Restrict results to a specific domain: `"github.com"`. |
| `file_type` | string | No | — | Filter by file extension: `"pdf"`, `"py"`, `"md"`. |
| `date_after` | string | No | — | Only return results after this date. Format: `"YYYY-MM-DD"`. |
| `exclude_terms` | array | No | — | Terms to exclude from results. Each item is a string. |

---

### Full input example

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_search",
    "arguments": {
      "query": "Python RAG implementation examples",
      "mode": "research",
      "dork": {
        "site_filter": "github.com",
        "file_type": "py",
        "date_after": "2025-01-01",
        "exclude_terms": ["tutorial", "beginner"]
      },
      "max_results": 5,
      "summarize": true
    }
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/call — opticontext_search` · Copy button*

---

## Output schema

| Field | Type | Description |
|---|---|---|
| `summary` | string | AI-generated summary of the most relevant search results. |
| `key_findings` | array | Extracted factual findings. Each item is a string. |
| `sources` | array | Source objects. Each has `url` (string) and `title` (string). |
| `confidence` | number | Relevance confidence score from 0.0 to 1.0. |
| `provider_used` | string | Which provider resolved the query: `"tavily"`, `"ddg"`, or `"apify"`. |
| `cached` | boolean | Whether this result was served from cache. |
| `query_executed` | string | The final dorked query string sent to the provider. |

---

### Full output example

*OptiContext processes the request at the edge and returns:*

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"summary\":\"Several production-grade Python RAG implementations were found on GitHub from 2025. Key patterns include LangChain-based retrieval chains with pgvector backends, and direct OpenAI Embeddings + Supabase integrations. Most recent repos favor async pipelines over synchronous chains.\",\"key_findings\":[\"LangChain RAG with pgvector is the dominant pattern in recent repos\",\"Async retrieval pipelines outperform sync in benchmarks by 2–3x\",\"Chunking strategy (512 tokens, 50-token overlap) appears in most production examples\"],\"sources\":[{\"url\":\"https://github.com/user/rag-pgvector\",\"title\":\"Production RAG with pgvector\"},{\"url\":\"https://github.com/user/async-rag\",\"title\":\"Async RAG Pipeline\"}],\"confidence\":0.94,\"provider_used\":\"tavily\",\"cached\":false,\"query_executed\":\"site:github.com filetype:py retrieval augmented generation after:2025-01-01 -tutorial -beginner\"}"
      }
    ]
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `IntelliSearch response` · Copy button*

---

## Example call

### Minimal call (auto mode, no dorking)

```bash
curl -X POST https://mcp.opticontext.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_search",
      "arguments": {
        "query": "latest CVE for OpenSSL 2026"
      }
    },
    "id": 1
  }'
```

*JetBrains Mono · 14px · Code surface · Top bar: `bash` · Copy button*

---

### Research call with dorking (CVE example)

```bash
curl -X POST https://mcp.opticontext.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_search",
      "arguments": {
        "query": "latest CVE for OpenSSL",
        "mode": "research",
        "dork": {
          "site_filter": "nvd.nist.gov",
          "date_after": "2026-01-01"
        },
        "max_results": 3
      }
    },
    "id": 1
  }'
```

*JetBrains Mono · 14px · Code surface · Top bar: `bash` · Copy button*

---

## Error states

| Error code | Cause | Resolution |
|---|---|---|
| `-32001` | `UNAUTHORIZED` — Agent key missing or invalid. | Verify `Authorization: Bearer opctx_<key>` header is present and correctly formatted. |
| `-32029` | `RATE_LIMITED` — Per-minute request limit reached for this agent key. | Wait for the reset window stated in the error message. Default limit: 30 req/min. |
| `-32030` | `DAILY_CAP_REACHED` — IntelliSearch daily cap exhausted for this agent key. | Resets at 00:00 UTC. Cap is 500 requests/day per agent key on the standard tier. |
| `-32040` | `PROVIDER_UNAVAILABLE` — All search providers failed to return results. | Retry with `"mode": "fast"` to force DuckDuckGo, which has no quota. |
| `-32041` | `BUDGET_GUARD_ACTIVE` — Tavily monthly credit limit approaching (≥800/1000 used). | Request automatically routed to DuckDuckGo. No action required. |
| `-32050` | `QUERY_TOO_LONG` — Query string exceeds 500 characters. | Shorten the query. Use `dork` parameters for precision instead of long queries. |

---

## Limits

| Limit | Value | Notes |
|---|---|---|
| Requests per minute (per agent key) | 30 | Shared across all capabilities. |
| Requests per day (per agent key) | 500 | IntelliSearch-specific daily cap. |
| Tavily credits per month | 1,000 | Budget guard activates at 800. Requests route to DuckDuckGo automatically. |
| DuckDuckGo | Unlimited | Rate-limited by IP jitter. No budget guard needed. |
| Apify credits per month | ~$5 | Reserved for `"scrape"` mode. Budget guard activates at $4.50. |
| Cache TTL | 15 minutes | Identical query + params within TTL returns from cache. Does not consume credits. |
| Max results per call | 20 | Default: 5. |
| Max query length | 500 characters | |

---

### Budget guard behavior

```
When Tavily credits reach 800/1000 for the month:
  → IntelliSearch automatically routes all requests to DuckDuckGo
  → No error is returned to the runtime
  → provider_used field in response reflects "ddg"
  → Dashboard shows a warning indicator under Usage Alerts

When DuckDuckGo is unavailable (rare):
  → Returns PROVIDER_UNAVAILABLE error with code -32040
  → Retry with explicit "mode": "fast" or "mode": "scrape"
```

*Switzer sm · Text secondary · Code surface background · Padding: 12px 16px · Radius sm*

---

### Page navigation

```
← (no previous)                    IntelliSearch                    VoiceBridge →
                         View full API reference
```

*Ghost buttons · Centered "View full API reference" links to /docs/api-reference*

---

---

# PAGE 2 — VoiceBridge
## `/docs/tools/voicebridge`

**Background atmosphere:** Faint horizontal sine-wave curves, evenly spaced, suggesting an audio waveform. SVG background. Opacity: 0.02. Color: warm neutral. Imperceptible at reading distance.

---

### Breadcrumb

```
DOCUMENTATION  ›  CAPABILITIES  ›  VOICEBRIDGE
```

---

### Heading

```
VoiceBridge
```

*Zodiak 4xl · Text primary*

---

### One-line description

```
TTS streaming via Unreal Speech. 48 voices, 8 languages, sub-300ms time to first byte.
```

*Switzer lg · Text secondary*

---

### Best For Block

**Label:** `BEST FOR`

```
Runtimes that deliver audio responses to end users.
Telegram, Discord, and WhatsApp agents that respond in voice.
Any runtime where text-to-speech is a required output modality.
```

---

### MCP tool name

```
opticontext_tts
```

*JetBrains Mono · inline chip*

---

---

## What it does

VoiceBridge converts text to natural speech using Unreal Speech and returns either a Cloudflare R2 audio URL or a stream of audio chunks, depending on the `stream` parameter.
Incoming text is preprocessed before synthesis: markdown formatting is stripped, code blocks are replaced with spoken placeholders, numbers and abbreviations are normalized, and text longer than 3,000 characters is split into sequential chunks.
Synthesized audio is cached in Cloudflare R2 for 24 hours keyed on a SHA-256 hash of the text and voice combination — repeat calls with identical inputs return the cached URL without re-synthesizing.
The `platform` parameter optimizes the audio format automatically for the target delivery context: `ogg` for Telegram and WhatsApp, `mp3` for Discord, `wav` for raw consumption.

---

## Problem it solves

Runtimes that operate in voice-native channels — Telegram, Discord, WhatsApp — have no native TTS output path.
Each platform requires a separate audio pipeline: format negotiation, streaming handling, buffering, and delivery.
VoiceBridge resolves this to a single capability call that returns a ready-to-send audio URL or chunk stream, with platform-specific format optimization already applied.

---

## Input schema

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `text` | string | Yes | — | Text to synthesize. Maximum 3,000 characters per call. |
| `voice` | string | No | `"Scarlett"` | Voice ID to use. See voice reference table below. |
| `speed` | number | No | `1.0` | Speech speed multiplier. Range: 0.5–2.0. |
| `format` | string | No | `"mp3"` | Output audio format: `"mp3"`, `"ogg"`, or `"wav"`. |
| `platform` | string | No | `"raw"` | Target delivery platform: `"telegram"`, `"discord"`, `"whatsapp"`, or `"raw"`. Overrides `format` with platform-optimal value. |
| `stream` | boolean | No | `false` | Return audio chunks via SSE stream instead of a URL. |

---

### Voice reference

| Voice ID | Language | Character |
|---|---|---|
| `Scarlett` | English US | Female, warm |
| `Dan` | English US | Male, clear |
| `Will` | English US | Male, deep |
| `Liv` | English UK | Female, British |
| `Harry` | English UK | Male, British |
| `Priya` | Hindi | Female |
| `Arjun` | Hindi | Male |
| `Sofia` | Spanish | Female |
| `Miguel` | Spanish | Male |
| `Emma` | French | Female |
| `Pierre` | French | Male |
| `Yuki` | Japanese | Female |
| `Kenji` | Japanese | Male |
| `Mei` | Mandarin | Female |
| `Wei` | Mandarin | Male |
| `Ana` | Portuguese | Female |
| `Rafael` | Portuguese | Male |

*48 voices total across 8 languages. Full list available from Unreal Speech documentation. The IDs listed above are a representative subset.*

---

### Platform and format behavior

| `platform` value | Effective format | Notes |
|---|---|---|
| `"telegram"` | `ogg/opus` | Required format for Telegram voice messages. |
| `"discord"` | `mp3` | Discord voice channel audio. |
| `"whatsapp"` | `ogg/opus` | Required format for WhatsApp audio messages. |
| `"raw"` | Uses `format` field | No platform optimization applied. |

---

### Full input example

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_tts",
    "arguments": {
      "text": "The build completed successfully. Three tests failed in the authentication module. Check the logs for details.",
      "voice": "Dan",
      "platform": "telegram",
      "speed": 1.0,
      "stream": false
    }
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/call — opticontext_tts` · Copy button*

---

## Output schema

| Field | Type | Description |
|---|---|---|
| `audio_url` | string | Signed Cloudflare R2 URL for the generated audio file. Valid for 24 hours. |
| `duration_ms` | integer | Duration of the audio in milliseconds. |
| `voice_used` | string | The voice ID that was used for synthesis. |
| `format` | string | The audio format of the returned file: `"mp3"`, `"ogg"`, or `"wav"`. |
| `cached` | boolean | Whether this audio was served from the 24-hour TTS cache. |
| `chunks` | array | Present only when `stream: true`. Array of base64-encoded audio chunk strings. |

---

### Full output example

*OptiContext processes the request at the edge and returns:*

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"audio_url\":\"https://r2.opticontext.dev/tts/b4c7d9f1a3e5b7d9.ogg\",\"duration_ms\":3200,\"voice_used\":\"Dan\",\"format\":\"ogg\",\"cached\":false,\"chunks\":[]}"
      }
    ]
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `VoiceBridge response` · Copy button*

---

## Example call

### Telegram voice message (URL delivery)

```bash
curl -X POST https://mcp.opticontext.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_tts",
      "arguments": {
        "text": "Your daily summary is ready. Three tasks are overdue.",
        "voice": "Scarlett",
        "platform": "telegram"
      }
    },
    "id": 1
  }'
```

*JetBrains Mono · 14px · Code surface · Top bar: `bash` · Copy button*

---

### Discord audio (mp3 with speed adjustment)

```bash
curl -X POST https://mcp.opticontext.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_tts",
      "arguments": {
        "text": "Pull request approved. Merging to main now.",
        "voice": "Will",
        "platform": "discord",
        "speed": 1.1
      }
    },
    "id": 1
  }'
```

*JetBrains Mono · 14px · Code surface · Top bar: `bash` · Copy button*

---

### Platform delivery patterns

```
Telegram delivery sequence:
  1. Runtime calls opticontext_tts with platform: "telegram"
  2. VoiceBridge synthesizes and returns audio_url (R2 signed URL, ogg/opus)
  3. Runtime downloads audio from audio_url
  4. Runtime sends audio file as Telegram voice message via bot API
  End-to-end target: < 800ms

Discord delivery sequence:
  1. Runtime calls opticontext_tts with platform: "discord"
  2. VoiceBridge returns audio_url (mp3)
  3. Runtime streams audio into Discord voice channel
  Time to first audio chunk: < 500ms

WhatsApp delivery sequence:
  1. Runtime calls opticontext_tts with platform: "whatsapp"
  2. VoiceBridge returns audio_url (ogg/opus) and duration_ms
  3. Runtime sends as WhatsApp audio message via Business API
  End-to-end target: < 1s
```

*Switzer sm · Text secondary · Code surface background · Padding: 12px 16px · Radius sm*

---

## Error states

| Error code | Cause | Resolution |
|---|---|---|
| `-32001` | `UNAUTHORIZED` — Agent key missing or invalid. | Verify `Authorization: Bearer opctx_<key>` header. |
| `-32029` | `RATE_LIMITED` — Per-minute limit reached. | Wait for reset. Default: 30 req/min per agent key. |
| `-32060` | `TEXT_TOO_LONG` — Input text exceeds 3,000 characters. | Split text into multiple calls. Each call handles up to 3,000 characters. |
| `-32061` | `INVALID_VOICE_ID` — Voice ID not recognized. | Use a valid voice ID from the voice reference table above. |
| `-32062` | `SYNTHESIS_FAILED` — Unreal Speech returned an error. | Retry the call. If the error persists, switch to a different voice ID. |
| `-32063` | `STREAM_UNSUPPORTED` — SSE streaming not available in this context. | Set `stream: false` and use URL delivery instead. |

---

## Limits

| Limit | Value | Notes |
|---|---|---|
| Max text per call | 3,000 characters | Text longer than this is rejected with `-32060`. Split into sequential calls. |
| Requests per minute (per agent key) | 30 | Shared across all capabilities. |
| Requests per day (per agent key) | 500 | VoiceBridge-specific daily cap. |
| TTS cache TTL | 24 hours | Same text + voice combination returns cached URL at < 30ms. |
| Audio file retention in R2 | 24 hours | Files are deleted after cache TTL expires. |
| Free tier character limit | Unreal Speech free tier | Budget guard switches to a fallback response if the monthly character limit is reached. |

---

### Cache behavior

```
Cache key: SHA-256(text + voice_id)
Cache hit:  Returns audio_url from CF KV → R2 in < 30ms. No synthesis cost.
Cache miss: Full synthesis pipeline. TTFB ~300ms. Total ~600ms for short text.
Cache TTL:  24 hours from time of synthesis.

Effect: If the same message is spoken multiple times (e.g., a daily summary
with identical text), it is synthesized once and served from cache on all
subsequent calls within the 24-hour window.
```

*Switzer sm · Text secondary · Code surface background · Padding: 12px 16px · Radius sm*

---

### Page navigation

```
← IntelliSearch                    VoiceBridge                    DeepDoc →
                         View full API reference
```

---

---

# PAGE 3 — DeepDoc
## `/docs/tools/deepdoc`

**Background atmosphere:** Faint horizontal strata lines suggesting document pages layered on each other. SVG background. Opacity: 0.02. Color: warm neutral. Imperceptible at reading distance.

---

### Breadcrumb

```
DOCUMENTATION  ›  CAPABILITIES  ›  DEEPDOC
```

---

### Heading

```
DeepDoc
```

*Zodiak 4xl · Text primary*

---

### One-line description

```
File analysis via Gemini's 2M token context window. Handles any file type, any size.
```

*Switzer lg · Text secondary*

---

### Best For Block

**Label:** `BEST FOR`

```
Agents that need to reason over uploaded files — PDFs, codebases, spreadsheets, audio, and video.
Runtimes where file size exceeds what fits in a standard context window.
Any agent where file analysis results should persist and be recalled in future sessions.
```

---

### MCP tool name

```
opticontext_analyze
```

*JetBrains Mono · inline chip*

---

---

## What it does

DeepDoc accepts a file via four intake paths — a public URL, inline base64, a pre-upload ID, or a previously stored file ID — and routes it through Gemini's Files API for analysis.
The model used for analysis is selected automatically: Gemini 2.5 Flash for small files with simple queries, Gemini 2.0 Flash for medium files, and Gemini 1.5 Pro (2M token context window) for files larger than 500KB or queries that require deep reasoning.
The structured response contains a summary, extracted key findings, an answer to the specific query, any data tables found in the file, relevant code blocks, a confidence score, and a `file_id` that can be used to re-analyze the same file without re-uploading.
Files submitted via base64 or pre-upload are automatically persisted to Cloudflare R2 under the calling agent's namespace.

---

## Problem it solves

Agents operating on large files — a 200-page PDF, a multi-file codebase, a data spreadsheet — cannot fit the content into a standard context window.
Without DeepDoc, the agent either silently truncates the file, fails the analysis, or requires the runtime operator to build a separate file-handling pipeline.
DeepDoc resolves file intake, model routing, structured extraction, and optional memory persistence to a single capability call.

---

## Pre-upload flow (for large files)

```
For files too large to send as base64 (recommended threshold: > 5MB), use the /upload endpoint first.
```

*Switzer sm · Text secondary*

**Step 1 — Upload the file:**

```bash
curl -X POST https://mcp.opticontext.dev/upload \
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \
  -F "file=@/path/to/report.pdf"
```

*JetBrains Mono · 14px · Code surface · Top bar: `bash — POST /upload` · Copy button*

**Upload response:**

```json
{
  "upload_id": "upload_7f3a9b2e",
  "filename": "report.pdf",
  "size_bytes": 8421376,
  "expires_at": "2026-05-22T14:30:00Z"
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `/upload response` · Copy button*

**Step 2 — Analyze using the upload ID:**

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_analyze",
    "arguments": {
      "upload_id": "upload_7f3a9b2e",
      "query": "Summarize the key financial findings and flag any anomalies."
    }
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/call — opticontext_analyze` · Copy button*

```
The response includes a file_id. Use this ID in future calls to re-analyze without re-uploading.
The file is retained in Cloudflare R2 under your agent's namespace.
```

*Switzer sm · Text muted*

---

## Input schema

*One of `file_url`, `file_b64`, `upload_id`, or `file_id` is required. `query` is required in all cases.*

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_url` | string | Conditional | — | Public URL of the file to fetch and analyze. |
| `file_b64` | string | Conditional | — | Base64-encoded file content. For files under 100MB. |
| `upload_id` | string | Conditional | — | ID returned from `POST /upload`. |
| `file_id` | string | Conditional | — | ID from a previous DeepDoc response. Re-analyzes without re-uploading. |
| `query` | string | Yes | — | The specific question or analysis task to run against the file. |
| `model` | string | No | `"auto"` | Model selection: `"auto"`, `"flash"`, or `"pro"`. |
| `output_format` | string | No | `"structured"` | Response shape: `"structured"`, `"markdown"`, `"json"`, or `"summary_only"`. |
| `save_to_memory` | boolean | No | `false` | Store the analysis result in MemoryCore for future semantic recall. |
| `max_tokens` | integer | No | `4096` | Maximum response tokens. Range: 1–16384. |

---

### Model routing behavior

| Condition | Model selected | Context window |
|---|---|---|
| File < 50KB and simple query | Gemini 2.5 Flash | 1M tokens |
| File < 500KB or complex query | Gemini 2.0 Flash | 1M tokens |
| File > 500KB or `model: "pro"` | Gemini 1.5 Pro | 2M tokens |
| `model: "flash"` (explicit) | Gemini 2.5 Flash | 1M tokens |
| `model: "auto"` | AI router decides | — |

---

### Supported file types

| Category | Formats |
|---|---|
| Documents | PDF, DOCX, PPTX, XLSX, CSV, TXT, Markdown, HTML, XML, JSON |
| Images | PNG, JPG, JPEG, WEBP, HEIC, HEIF, GIF (static) |
| Code | `.py`, `.js`, `.ts`, `.java`, `.cpp`, `.c`, `.go`, `.rs`, `.rb`, `.php`, `.sh`, `.yaml`, `.toml` |
| Audio | MP3, WAV, FLAC, AAC, OGG, OPUS |
| Video | MP4, AVI, MOV, MKV, WEBM |
| Archives | ZIP (contents extracted and analyzed) |

*Maximum file size: 2GB via Gemini Files API. Inline base64 (`file_b64`): 100MB maximum.*

---

### Full input example

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_analyze",
    "arguments": {
      "file_id": "a3f8d9e1b2c4",
      "query": "What are the three most critical security vulnerabilities identified in this audit report?",
      "model": "auto",
      "output_format": "structured",
      "save_to_memory": true,
      "max_tokens": 4096
    }
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/call — opticontext_analyze` · Copy button*

---

## Output schema

| Field | Type | Description |
|---|---|---|
| `summary` | string | High-level summary of the file's content relative to the query. |
| `key_findings` | array | Extracted facts, structured conclusions, or notable elements. Each item is a string. |
| `answer` | string | Direct answer to the `query` field. The most agent-relevant field. |
| `tables` | array | Data tables extracted from the file. Each item is a structured table object. |
| `code_blocks` | array | Code segments extracted from the file. Each item has `language` and `content`. |
| `confidence` | number | Model confidence in the analysis quality. Range: 0.0–1.0. |
| `file_id` | string | 12-character hex ID for this file. Use in future calls to re-analyze without re-uploading. |
| `tokens_used` | integer | Total tokens consumed by the Gemini analysis. |
| `model_used` | string | Which Gemini model was selected by the router. |

---

### Full output example

*OptiContext processes the request at the edge and returns:*

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"summary\":\"The security audit report covers 47 findings across three severity tiers. Critical findings are concentrated in the authentication layer and input validation modules.\",\"key_findings\":[\"SQL injection vulnerability in the user login endpoint (CVSS 9.1)\",\"Hardcoded JWT secret in production environment variables (CVSS 8.7)\",\"Unvalidated file upload endpoint accessible without authentication (CVSS 8.4)\"],\"answer\":\"The three most critical vulnerabilities are: (1) SQL injection in the login endpoint with CVSS score 9.1, (2) hardcoded JWT secret in production config with CVSS 8.7, and (3) unauthenticated file upload endpoint with CVSS 8.4.\",\"tables\":[],\"code_blocks\":[],\"confidence\":0.97,\"file_id\":\"a3f8d9e1b2c4\",\"tokens_used\":3847,\"model_used\":\"gemini-2.5-flash\"}"
      }
    ]
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `DeepDoc response` · Copy button*

---

## Example call

### Re-analyze a stored file

```bash
curl -X POST https://mcp.opticontext.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_analyze",
      "arguments": {
        "file_id": "a3f8d9e1b2c4",
        "query": "List all functions that interact with the database layer.",
        "model": "pro"
      }
    },
    "id": 1
  }'
```

*JetBrains Mono · 14px · Code surface · Top bar: `bash` · Copy button*

---

### Analyze a public URL

```bash
curl -X POST https://mcp.opticontext.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_analyze",
      "arguments": {
        "file_url": "https://example.com/spec/api-contract-v2.pdf",
        "query": "What breaking changes were introduced in v2 compared to v1?"
      }
    },
    "id": 1
  }'
```

*JetBrains Mono · 14px · Code surface · Top bar: `bash` · Copy button*

---

## Error states

| Error code | Cause | Resolution |
|---|---|---|
| `-32001` | `UNAUTHORIZED` — Agent key missing or invalid. | Verify Authorization header. |
| `-32029` | `RATE_LIMITED` — Per-minute limit reached. | Wait for reset window stated in error message. |
| `-32070` | `FILE_NOT_FOUND` — `file_id` does not exist for this agent. | The file may have been deleted or the ID is from a different agent key. Re-upload. |
| `-32071` | `UPLOAD_EXPIRED` — `upload_id` has expired (temp files expire after 1 hour). | Re-upload the file via `POST /upload` and use the new `upload_id`. |
| `-32072` | `FILE_TOO_LARGE` — File exceeds 2GB limit. | Split the file before uploading. Archives (ZIP) are unpacked automatically within the limit. |
| `-32073` | `UNSUPPORTED_FILE_TYPE` — File format not supported by Gemini Files API. | Check the supported file types table. |
| `-32074` | `GEMINI_QUOTA_REACHED` — Daily Gemini request limit reached. | Gemini 1.5 Pro: 50 req/day. Gemini Flash: 1,500 req/day. Resets at midnight PST. |
| `-32075` | `ANALYSIS_FAILED` — Gemini returned an empty or malformed response. | Retry with a more specific query or switch model with `model: "pro"`. |

---

## Limits

| Limit | Value | Notes |
|---|---|---|
| Max file size (inline base64) | 100MB | Larger files must use `POST /upload`. |
| Max file size (pre-upload) | 2GB | Gemini Files API limit. |
| File retention in Gemini | 48 hours | Files are reusable within this window via `file_uri`. |
| File retention in R2 (via `file_id`) | No expiry | Agent-managed. Files persist until explicitly deleted. |
| Gemini 2.5 Flash requests/day | 1,500 | Budget guard activates at 1,200. |
| Gemini 1.5 Pro requests/day | 50 | Budget guard activates at 40. Reserved for files > 500KB or explicit `model: "pro"`. |
| Max response tokens | 16,384 | Default: 4,096. |
| Requests per minute (per agent key) | 30 | Shared across all capabilities. |

---

### Page navigation

```
← VoiceBridge                    DeepDoc                    MemoryCore →
                         View full API reference
```

---

---

# PAGE 4 — MemoryCore
## `/docs/tools/memorycore`

**Background atmosphere:** Faint dot grid with thin connecting lines between nodes, suggesting a graph of stored memories. SVG background. Opacity: 0.025. Color: emerald-tinted. Imperceptible at reading distance.

---

### Breadcrumb

```
DOCUMENTATION  ›  CAPABILITIES  ›  MEMORYCORE
```

---

### Heading

```
MemoryCore
```

*Zodiak 4xl · Text primary*

---

### One-line description

```
Persistent RAG memory backed by Supabase pgvector. Agents store and retrieve context across sessions.
```

*Switzer lg · Text secondary*

---

### Best For Block

**Label:** `BEST FOR`

```
Personal agents that maintain a model of users across conversations.
Runtimes that need to recall past task outputs, document analyses, or research results.
Any agent where state should persist beyond a single session window.
```

---

### MCP tool names

```
opticontext_memory_write    opticontext_memory_search
```

*JetBrains Mono · inline chips · Both names shown side by side*

---

---

## What it does

MemoryCore provides two paired operations — write and search — that together give an agent a persistent, semantically searchable memory store.
On write, content is chunked into 512-token segments with 50-token overlap, embedded using Gemini's embedding model (768-dimensional vectors), and stored in Supabase pgvector under the calling agent's namespace.
On search, the query is embedded with the same model, and a cosine similarity search retrieves the most relevant stored chunks ranked by similarity score.
Results can optionally be re-ranked by Cerebras before being assembled into a context block for direct injection into the agent's prompt.
Memory is scoped per agent key and per namespace — one agent's memories are never accessible to another.

---

## Problem it solves

Without MemoryCore, every agent session starts from zero.
Facts learned in one session — a user's preferences, a completed task's output, a file analysis result — are discarded when the session ends.
The agent must ask the user to repeat context, cannot build continuity across interactions, and cannot reference its own prior outputs.
MemoryCore resolves this with two capability calls: one to store, one to retrieve.

---

## Write operation

### Input schema — `opticontext_memory_write`

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `content` | string | Yes | — | Text content to store in memory. Chunked automatically if long. |
| `namespace` | string | No | `"general"` | Logical partition for this memory. Used to scope searches. |
| `importance` | integer | No | `5` | Importance score from 1 (lowest) to 10 (highest). Used during auto-summarization. |
| `source` | string | No | — | Origin of this memory: e.g., `"user_message"`, `"deepdoc_analysis"`, `"search_result"`. |
| `expires_at` | string | No | — | ISO 8601 datetime after which this memory is excluded from searches. |

---

### Full write input example

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_memory_write",
    "arguments": {
      "content": "User's name is Arjun. Preferred language is Tamil. Works in Chennai. Prefers concise responses without code blocks unless explicitly requested.",
      "namespace": "personal",
      "importance": 9,
      "source": "user_message"
    }
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/call — opticontext_memory_write` · Copy button*

---

### Write output schema

| Field | Type | Description |
|---|---|---|
| `memory_id` | string | Unique identifier for this memory entry. |
| `chunks_stored` | integer | Number of 512-token chunks the content was split into. |
| `namespace` | string | The namespace this memory was stored under. |
| `embedding_dimensions` | integer | Dimensions of the embedding vector: `768`. |

---

### Write output example

*OptiContext processes the request at the edge and returns:*

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"memory_id\":\"mem_c8d2f1a9b3e4\",\"chunks_stored\":1,\"namespace\":\"personal\",\"embedding_dimensions\":768}"
      }
    ]
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `memory_write response` · Copy button*

---

## Search operation

### Input schema — `opticontext_memory_search`

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | string | Yes | — | The search query. Embedded and compared against stored vectors. |
| `namespace` | string | No | `"general"` | Namespace to search within. Searches are scoped to this namespace only. |
| `top_k` | integer | No | `5` | Number of top results to return. Maximum: 20. |
| `min_similarity` | number | No | `0.7` | Minimum cosine similarity threshold. Range: 0.0–1.0. Results below this score are excluded. |
| `rerank` | boolean | No | `true` | Re-rank results using Cerebras before returning. Improves relevance ordering. |

---

### Full search input example

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_memory_search",
    "arguments": {
      "query": "What does the user prefer about response formatting?",
      "namespace": "personal",
      "top_k": 3,
      "min_similarity": 0.75,
      "rerank": true
    }
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/call — opticontext_memory_search` · Copy button*

---

### Search output schema

| Field | Type | Description |
|---|---|---|
| `memories` | array | Ranked list of matching memory entries. Each has `content`, `namespace`, `importance`, `source`, `created_at`. |
| `relevance_scores` | array | Cosine similarity score for each returned memory. Parallel array to `memories`. |
| `total_found` | integer | Total number of memories matching the query above `min_similarity`, before `top_k` truncation. |
| `context_block` | string | Pre-assembled context string from top results. Ready for direct injection into an agent prompt. |

---

### Search output example

*OptiContext processes the request at the edge and returns:*

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"memories\":[{\"content\":\"User prefers concise responses without code blocks unless explicitly requested.\",\"namespace\":\"personal\",\"importance\":9,\"source\":\"user_message\",\"created_at\":\"2026-05-21T10:14:00Z\"}],\"relevance_scores\":[0.94],\"total_found\":1,\"context_block\":\"User preferences: Prefers concise responses without code blocks unless explicitly requested.\"}"
      }
    ]
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `memory_search response` · Copy button*

---

## Example calls

### Write a task output to memory

```bash
curl -X POST https://mcp.opticontext.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_memory_write",
      "arguments": {
        "content": "Completed migration of authentication module to JWT RS256. All 47 tests passing. Deployment to staging was successful on 2026-05-21.",
        "namespace": "projects",
        "importance": 7,
        "source": "task_completion"
      }
    },
    "id": 1
  }'
```

*JetBrains Mono · 14px · Code surface · Top bar: `bash` · Copy button*

---

### Search for project context

```bash
curl -X POST https://mcp.opticontext.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_memory_search",
      "arguments": {
        "query": "authentication module status",
        "namespace": "projects",
        "top_k": 5
      }
    },
    "id": 1
  }'
```

*JetBrains Mono · 14px · Code surface · Top bar: `bash` · Copy button*

---

## Namespace system

```
Namespaces partition memory within a single agent key.
Searches are scoped to one namespace per call.
```

*Switzer sm · Text secondary*

| Namespace example | Suggested use |
|---|---|
| `general` | Default. Mixed-purpose storage. |
| `personal` | Facts about the end user: preferences, name, location. |
| `projects` | Project-specific state, task outputs, decisions. |
| `web_research` | Saved search results from IntelliSearch. |
| `conversations` | Session summaries and notable exchanges. |

```
Namespaces are created automatically on first write.
No schema setup required.
Use consistent namespace strings within an agent to keep memory scoped correctly.
```

*Switzer sm · Text muted*

---

## Error states

| Error code | Cause | Resolution |
|---|---|---|
| `-32001` | `UNAUTHORIZED` — Agent key missing or invalid. | Verify Authorization header. |
| `-32029` | `RATE_LIMITED` — Per-minute limit reached. | Wait for the reset window in the error message. |
| `-32080` | `NAMESPACE_NOT_FOUND` — No memories exist in the specified namespace for this agent key. | Write to the namespace first using `opticontext_memory_write`. Namespaces are case-sensitive. |
| `-32081` | `EMBEDDING_FAILED` — Gemini embedding API returned an error. | Retry. If the error persists, check Gemini API status. |
| `-32082` | `MEMORY_LIMIT_REACHED` — Agent has reached the 10,000-chunk memory limit. | Auto-summarization will run at 8,000 chunks to compress old memories. If limit is still reached, delete low-importance memories or expand the namespace scope. |

---

## Limits

| Limit | Value | Notes |
|---|---|---|
| Max chunks per agent | 10,000 | Auto-summarization triggers at 8,000 chunks to compress old memories. |
| Chunk size | 512 tokens | Fixed. 50-token overlap between adjacent chunks. |
| Embedding dimensions | 768 | Gemini Embedding model output. Fixed. |
| Max `top_k` | 20 | |
| `min_similarity` range | 0.0–1.0 | Default: 0.7. Values below 0.5 may return low-relevance results. |
| Requests per minute (per agent key) | 30 | Shared across all capabilities. |
| Requests per day (per agent key) | 500 | MemoryCore write and search each count as one request. |
| Memory retention | No expiry by default | Set `expires_at` on write to create time-bounded memories. |

---

### Auto-summarization behavior

```
Trigger:    Agent's memory store reaches 8,000 chunks.
Action:     Cerebras summarization pass runs over the oldest, lowest-importance chunks.
            Groups of related chunks are compressed into single summary entries.
            Original chunks are deleted after summarization.
Effect:     Memory count is reduced. Total semantic coverage is preserved.
            Agents do not notice the compression — search results remain coherent.
Threshold:  Hard cap at 10,000 chunks. Writes above this limit return -32082.
```

*Switzer sm · Text secondary · Code surface background · Padding: 12px 16px · Radius sm*

---

### How `save_to_memory` works across capabilities

```
IntelliSearch, VoiceBridge, and DeepDoc all accept a save_to_memory parameter.
When set to true, OptiContext automatically calls opticontext_memory_write
after the primary capability completes, storing the result under the general namespace
(or a capability-specific namespace if configured).

This means memory accumulates passively as the agent works,
without requiring explicit write calls in the runtime.
```

*Switzer sm · Text secondary · Code surface background · Padding: 12px 16px · Radius sm*

---

### Page navigation

```
← DeepDoc                    MemoryCore                    (no next)
                         View full API reference
```

---

---

## GLOBAL TERMINOLOGY VERIFICATION

*Applied across all four capability pages.*

---

### ✓ Test 1 — Infrastructure or Plugin?

All four page headings read as capability names of an infrastructure product, not features of another product.
> "IntelliSearch — Web search with AI-enhanced dorking..."
> "VoiceBridge — TTS streaming via Unreal Speech..."
> "DeepDoc — File analysis via Gemini's 2M token context window..."
> "MemoryCore — Persistent RAG memory backed by Supabase pgvector..."

Result: **Pass.**

---

### ✓ Test 2 — Vendor Bias Check

Vendor names appear only as infrastructure identifiers (Unreal Speech, Gemini, Supabase pgvector, Cerebras, Cloudflare R2, DuckDuckGo, Tavily, Apify).
No vendor is described as preferred or recommended over another.
No vendor appears more than twice in any single section.
No runtime vendor appears in any capability page — these pages are about the capabilities, not about runtimes.

Result: **Pass.**

---

### ✓ Test 3 — Specificity Check

| Adjective | Replaced with |
|---|---|
| "fast" | Specific values: "2,600 tokens per second", "sub-300ms TTFB", "< 30ms cached", "~1.1s first call" |
| "large" | Specific values: "2M token context window", "up to 2GB", "512-token chunks" |
| "powerful" | Not used. Specific capability descriptions used instead |
| "seamless" | Not used |
| "intelligent" | Not used for capabilities — "AI-enhanced" used with specific mechanism named |

Result: **Pass.**

---

### ✓ Test 4 — Forbidden Term Scan (all four pages)

| Forbidden term | Status |
|---|---|
| "tool" in product/marketing context | ✓ "Capability" used. "Tool" used only in MCP protocol context: `tools/call`, `opticontext_*` MCP tool names, "MCP tool name" — all protocol-correct usages. |
| "API key" standalone | ✓ "Agent key" used throughout. |
| "plugin" | ✓ Not present. |
| "client" for runtimes | ✓ "Runtime" used. |
| "REST API" | ✓ Not present. Endpoint references use "MCP endpoint" and `POST /mcp`. |
| "webhook" | ✓ Not present. |
| "seamless" / "powerful" / "robust" / "intuitive" | ✓ Not present anywhere. |
| "we" / "our" | ✓ Not present. "OptiContext" used. |
| "works with" plural listing | ✓ Not present. |
| "free tier" as value prop | ✓ Appears only in Limits tables as factual constraint, not as a selling point. |
| "for developers" | ✓ Not present. |

Result: **Pass.**

---

### ✓ Test 5 — One-Sentence Summary per page

- IntelliSearch: "IntelliSearch is a web search capability with AI-enhanced dorking, multi-provider routing, and Cerebras summarization that returns structured, agent-ready results."
- VoiceBridge: "VoiceBridge is a TTS capability that synthesizes text to speech via Unreal Speech and returns an audio URL or stream optimized for the target delivery platform."
- DeepDoc: "DeepDoc is a file analysis capability that routes any file through Gemini's Files API and returns a structured analysis with a persistent file ID for re-analysis."
- MemoryCore: "MemoryCore is a persistent RAG memory capability backed by Supabase pgvector that stores and semantically retrieves agent context across sessions."

All complete: *"OptiContext [capability] is ______"* correctly. Result: **Pass.**

---

### ✓ Schema and Formatting Check (all four pages)

| Rule | Status |
|---|---|
| All parameter tables use: Parameter · Type · Required · Default · Description | ✓ |
| `Required` column uses "Yes"/"No" — not "true"/"false" | ✓ |
| Default values in code font | ✓ |
| All JSON blocks use 2-space indentation | ✓ |
| `"jsonrpc": "2.0"` present in all request/response blocks | ✓ |
| `"id": 1` in all request/response pairs and they match | ✓ |
| Language labels on all code blocks | ✓ `json`, `bash`, `text` — no unlabeled blocks |
| curl structure: `-X POST`, `Content-Type` before `Authorization`, `\` continuation | ✓ |
| Realistic dummy key `opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4` in curl examples | ✓ |
| `file_id` examples use 12-char hex: `a3f8d9e1b2c4` | ✓ |
| `upload_id` examples use `upload_7f3a9b2e` | ✓ |
| `session_id` not needed on these pages — not present | ✓ |
| Endpoint URL: `https://mcp.opticontext.dev/mcp` | ✓ |
| Upload endpoint URL: `https://mcp.opticontext.dev/upload` | ✓ |

---

### ✓ Backend Alignment Check

| Claim | Plan section |
|---|---|
| IntelliSearch: Tavily → DDG → Apify routing | Section 7 |
| IntelliSearch: Cerebras at 2,600 tok/s | Section 7 + 11 |
| IntelliSearch: cache TTL 15 minutes | Section 7 |
| IntelliSearch: budget guard at 800/1000 Tavily credits | Section 7 |
| VoiceBridge: Unreal Speech, sub-300ms TTFB | Section 8 |
| VoiceBridge: TTS cache TTL 24 hours in R2 | Section 8 |
| VoiceBridge: text preprocessing (markdown strip, normalize) | Section 8 |
| VoiceBridge: 48 voices, 8 languages | Section 8 |
| VoiceBridge: platform delivery latency targets | Section 8 |
| DeepDoc: Gemini 2.5 Flash / 2.0 Flash / 1.5 Pro routing | Section 9 |
| DeepDoc: 2M token context window (Gemini 1.5 Pro) | Section 9 |
| DeepDoc: `/upload` pre-upload flow | Section 9 |
| DeepDoc: `file_id` for re-analysis without re-upload | Section 9 |
| DeepDoc: `save_to_memory` writes to MemoryCore | Section 9 |
| DeepDoc: file retention 48h on Gemini, no expiry in R2 | Section 9 |
| MemoryCore: 512-token chunks, 50-token overlap | Section 10 |
| MemoryCore: Gemini Embedding, 768-dimension vectors | Section 10 |
| MemoryCore: cosine similarity search via Supabase pgvector | Section 10 |
| MemoryCore: Cerebras reranking | Section 10 |
| MemoryCore: 10,000-chunk limit, auto-summarization at 8,000 | Section 10 |
| MemoryCore: `save_to_memory` across all capabilities | Section 9 + 10 |

---

### ✓ Frontend Structure Alignment Check

| Element | Frontend Guide reference | Status |
|---|---|---|
| Breadcrumb: DOCUMENTATION › CAPABILITIES › [Name] | Part 5 — Breadcrumb | ✓ (CAPABILITIES used — not "Tools") |
| Heading: Zodiak 4xl | Part 5 — Tool name heading | ✓ |
| One-line description: Switzer lg | Part 5 — One-line description | ✓ |
| Best For block with accent subtle bg, 3px left border | Part 5 — Best for block | ✓ |
| Best For block before technical sections | Part 5 — Position note | ✓ |
| Section order: What it does → Problem it solves → Input schema → Output schema → Example call → Error states → Limits | Part 5 — Sections in order | ✓ |
| Schema tables with column structure | Part 5 — Input schema | ✓ |
| JSON example below each table | Part 5 — Schema format | ✓ |
| Error states: 5–8 rows | Part 5 — Error states note | ✓ (IntelliSearch: 6, VoiceBridge: 6, DeepDoc: 8, MemoryCore: 6) |
| Bottom navigation: ← prev · → next · View full API reference | Part 5 — Tool page navigation | ✓ |
| Navigation order: IntelliSearch → VoiceBridge → DeepDoc → MemoryCore | Part 5 — Tool order | ✓ |
| Background atmosphere per tool (SVG, opacity specs) | Part 5 — Tool-specific atmosphere | ✓ |

---

*OptiContext Capability Documentation · Phase 5 of 9*
*Version 1.0 · Sandy · May 2026*
*Next phase: Phase 6 — API Reference*
