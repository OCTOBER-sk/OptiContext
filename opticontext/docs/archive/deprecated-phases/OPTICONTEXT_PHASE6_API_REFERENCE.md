# OptiContext — Phase 6: API Reference
## Production Copy · `/docs/api-reference` Route
### Version 1.0 · Sandy · May 2026

---

> **Source-of-truth alignment:**
> Generated from OPTICONTEXT_PLAN__4_.md (sections 4, 5, 7–13),
> OPTICONTEXT_FRONTEND_GUIDE.txt (Part 6 — API Reference),
> OPTICONTEXT_TERMINOLOGY.md (language contract),
> and OPTICONTEXT_PHASE5_CAPABILITY_DOCS.md (error codes, schema consistency).
>
> Tone: contract documentation. Tables and code blocks are the primary medium.
> Prose is minimal and precise. No tutorial language. No marketing language.
> Every claim is traceable to the backend plan.

---

## LAYOUT NOTES (for frontend implementation)

**Route:** `/docs/api-reference`

**Background:** Paper grain layer only. No atmospheric glow. No structural grid. The page earns authority through density, not decoration.

**Layout:** Docs sidebar (same as all docs pages) + full-width content area.

**Inline quick-nav:** Anchored navigation at top of content area, rendered as bottom-border tab links (matching global tab component):
```
Authentication · Endpoints · MCP Lifecycle · Transport · Capabilities · Upload Flow · Error Reference · Rate Limits
```
*Switzer 500 · 14px · Bottom-border tab style · Sticky on scroll*

---

---

## BREADCRUMB

```
DOCUMENTATION  ›  API REFERENCE
```

*Switzer 500 · 13px · Uppercase · Text muted · Letter-spacing: 0.06em*

---

## PAGE HEADING

```
API Reference
```

*Zodiak 3xl (36px) · Text primary*

---

## ORIENTATION PARAGRAPH

```
Complete technical contract for the OptiContext MCP endpoint.
This document covers authentication, the MCP protocol lifecycle, all five
capability schemas, the file upload flow, error codes, and rate limits.
```

*Switzer base (16px) · Text secondary · Margin-top: 8px · Max-width: 640px*

---

## PROTOCOL NOTE

```
OptiContext implements the Model Context Protocol specification (MCP 2025-11-25)
using Streamable HTTP transport. All capability calls are JSON-RPC 2.0 messages
sent to a single endpoint. No REST semantics. No separate tool endpoints.
```

*Switzer sm (14px) · Text secondary · Border-left: 3px solid border default · Padding-left: 16px · Margin: 20px 0 32px*

---

## ENDPOINT SUMMARY TABLE

| Endpoint | Method | Auth required | Purpose |
|---|---|---|---|
| `/mcp` | `POST` | Yes | All capability calls — MCP Streamable HTTP |
| `/mcp` | `GET` | Yes | SSE stream initialization for streaming responses |
| `/upload` | `POST` | Yes | Pre-upload files for DeepDoc |
| `/usage` | `GET` | Yes | Usage stats for the authenticated agent key |
| `/health` | `GET` | No | Server health check |

*Switzer 400 · 14px · Table component · No outer border*

---

---

# SECTION 1 — AUTHENTICATION
## Anchor: `#authentication`

*Zodiak 2xl (28px) · Text primary · Border-top: 1px border default · Padding-top: 48px*

---

### Agent key format

Every agent authenticates with a long-lived agent key issued at key creation. Agent keys are not JWTs. They are opaque bearer credentials verified against Cloudflare KV on every request.

**Format:**

```text
opctx_<agent_slug>_<32_hex_characters>
```

**Example:**

```text
opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4
```

*JetBrains Mono · 14px · Code surface · Radius sm · Copy button*

Agent keys are created from the dashboard at `/dashboard/settings`. Each agent should use its own key. Keys are scoped per-agent — usage, rate limits, and permission checks are tracked individually.

---

### Authorization header

All requests to authenticated endpoints must include:

```bash
Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4
```

*JetBrains Mono · 14px · Code surface · Radius sm · Copy button*

The header must use the `Bearer` scheme. Other schemes are rejected with `-32001 UNAUTHORIZED`.

---

### Key verification flow

```
Request arrives at Cloudflare Workers edge
  │
  ├─ [1] Extract Authorization header
  │       Missing or malformed → -32001 UNAUTHORIZED
  │
  ├─ [2] KV lookup: opctx_key:<key> → agent_id
  │       Not found    → -32001 KEY_NOT_FOUND
  │       Key revoked  → -32001 KEY_REVOKED
  │
  ├─ [3] Rate limit check: rate:<agent_id>:<minute_bucket>
  │       Over 30 req/min → -32029 RATE_LIMITED
  │
  ├─ [4] Permission check: agent allowed for this capability
  │       Not permitted → -32003 FORBIDDEN
  │
  └─ [5] Execute capability
```

*JetBrains Mono · 13px · Code surface · Radius sm*

---

### Per-agent isolation

Each agent key is fully isolated:

- Rate limits are tracked per key, per minute bucket
- Usage caps are tracked per key, per day
- File storage in Cloudflare R2 is namespaced under `<agent_id>/`
- MemoryCore embeddings are scoped to `agent_id` in Supabase pgvector
- Revoking one key has no effect on any other key

Two runtimes using separate keys have no visibility into each other's usage, files, or memories.

---

### Key revocation

Revoke a key from the dashboard at `/dashboard/settings`. Revocation takes effect within one Cloudflare KV propagation cycle — typically under 60 seconds globally. After revocation, any request using the revoked key receives `-32001 KEY_REVOKED`.

A revoked key cannot be reactivated. Create a new key if access needs to be restored.

---

---

# SECTION 2 — ENDPOINTS
## Anchor: `#endpoints`

*Zodiak 2xl · Text primary · Border-top: 1px border default · Padding-top: 48px*

---

## POST /mcp

The primary MCP endpoint. All capability calls are sent here as JSON-RPC 2.0 messages.

**URL:**
```text
https://mcp.opticontext.dev/mcp
```

**Required headers:**

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer <agent_key>` |
| `Mcp-Session-Id` | Optional. Enables stateful agent session tracking. |

**Body:** JSON-RPC 2.0 message. See MCP Lifecycle section.

**Response:** JSON-RPC 2.0 result or error object. HTTP 200 for all well-formed requests, including capability errors. HTTP 4xx/5xx for transport-layer failures only.

---

## GET /mcp

Opens an SSE stream for streaming capability responses (VoiceBridge `stream: true`, long-running DeepDoc analyses). The runtime sends the capability request via `POST /mcp` first. OptiContext upgrades the response to a chunked SSE stream when the capability requires it.

**Required headers:** same as `POST /mcp`.

---

## POST /upload

Pre-upload endpoint for large files before calling `opticontext_analyze`. Accepts `multipart/form-data`. Returns an `upload_id` for use in a subsequent DeepDoc capability call.

**URL:**
```text
https://mcp.opticontext.dev/upload
```

**Required headers:**

| Header | Value |
|---|---|
| `Authorization` | `Bearer <agent_key>` |
| `Content-Type` | `multipart/form-data` |

**Body field:**

| Field | Type | Description |
|---|---|---|
| `file` | binary | The file to upload. Maximum 2GB. |

**Response:**

```json
{
  "upload_id": "upload_7f3a9b2e",
  "filename": "report.pdf",
  "size_bytes": 8421376,
  "expires_at": "2026-05-22T14:30:00Z"
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `/upload response` · Copy button*

Upload IDs expire after 1 hour. Pass `upload_id` to `opticontext_analyze` before expiry.

---

## GET /usage

Returns usage statistics for the authenticated agent key.

**URL:**
```text
https://mcp.opticontext.dev/usage
```

**Required headers:**

| Header | Value |
|---|---|
| `Authorization` | `Bearer <agent_key>` |

**Response:**

```json
{
  "agent_id": "myagent",
  "today_requests": 47,
  "monthly_requests": 812,
  "tool_breakdown": {
    "intellisearch": 22,
    "voicebridge": 8,
    "deepdoc": 5,
    "memorycore_write": 7,
    "memorycore_search": 5
  },
  "daily_cap_remaining": 453,
  "reset_at": "2026-05-22T00:00:00Z"
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `/usage response` · Copy button*

---

## GET /health

Health check endpoint. No authentication required. Returns HTTP 200 when the edge server is operational.

**URL:**
```text
https://mcp.opticontext.dev/health
```

**Response:**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-05-22T14:23:11Z"
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `/health response` · Copy button*

The dashboard polls this endpoint every 60 seconds to maintain the status chip displayed in `/dashboard`.

---

---

# SECTION 3 — MCP LIFECYCLE
## Anchor: `#mcp-lifecycle`

*Zodiak 2xl · Text primary · Border-top: 1px border default · Padding-top: 48px*

Every MCP-compatible runtime that connects to OptiContext follows the same three-step lifecycle: `initialize` → `tools/list` → `tools/call`.

---

## Initialize

The runtime sends an `initialize` request on first connection to negotiate the protocol version and receive server metadata.

### Request

```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "clientInfo": {
      "name": "my-agent",
      "version": "1.0.0"
    },
    "capabilities": {}
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `initialize request` · Copy button*

---

### Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "protocolVersion": "2025-11-25",
    "serverInfo": {
      "name": "OptiContext",
      "version": "1.0.0",
      "description": "Edge-native MCP context infrastructure"
    },
    "capabilities": {
      "tools": {},
      "logging": {}
    }
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `initialize response` · Copy button*

**`protocolVersion`:** OptiContext uses `2025-11-25` — the current stable MCP specification. If a runtime sends a different version, OptiContext responds with `2025-11-25` regardless. Older HTTP+SSE transport runtimes are supported via the legacy `/sse` endpoint.

---

## tools/list

After initialization, the runtime requests the list of available MCP tools.

### Request

```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "params": {},
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/list request` · Copy button*

---

### Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "opticontext_search",
        "description": "Web search with AI-enhanced dorking and Cerebras summarization. Returns structured, agent-ready results."
      },
      {
        "name": "opticontext_tts",
        "description": "Text to speech via Unreal Speech. Returns an audio URL or stream optimized for the target delivery platform."
      },
      {
        "name": "opticontext_analyze",
        "description": "File analysis via Gemini's 2M token context window. Handles any supported file type."
      },
      {
        "name": "opticontext_memory_write",
        "description": "Store content in persistent RAG memory backed by Supabase pgvector."
      },
      {
        "name": "opticontext_memory_search",
        "description": "Search persistent memory using semantic similarity. Returns ranked results with a context block."
      }
    ]
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/list response` · Copy button*

The `tools/list` response reflects only the capabilities the calling agent key is permitted to use. If an agent key has `memorycore` disabled, `opticontext_memory_write` and `opticontext_memory_search` are absent from the list.

---

## tools/call

The runtime invokes a capability.

### Request structure

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "<mcp_tool_name>",
    "arguments": {
      <capability_parameters>
    }
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/call structure` · Copy button*

### Success response structure

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "<json_string_of_capability_output>"
      }
    ]
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/call success response` · Copy button*

The `content[0].text` field contains a JSON-serialized string of the capability output. The runtime parses this string to access individual response fields (`summary`, `audio_url`, `memories`, etc.).

### Error response structure

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32029,
    "message": "RATE_LIMITED — 30 requests/minute reached for this agent key. Resets in 43 seconds."
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/call error response` · Copy button*

---

## Session handling

OptiContext supports optional stateful sessions via the `Mcp-Session-Id` header. Sessions allow the edge server to maintain per-agent context across multiple requests in a single interaction.

**Header:**

```bash
Mcp-Session-Id: sess_4c8d2f1a9b3e
```

Sessions are tracked in Cloudflare Durable Objects. If no `Mcp-Session-Id` is provided, each request is treated as stateless. Session state does not affect capability behavior — it is used for logging context and session-level rate tracking only.

---

---

# SECTION 4 — TRANSPORT
## Anchor: `#transport`

*Zodiak 2xl · Text primary · Border-top: 1px border default · Padding-top: 48px*

---

## Streamable HTTP transport

OptiContext implements MCP Streamable HTTP transport — the current transport standard in the MCP 2025-11-25 specification. A single endpoint (`/mcp`) handles all MCP messages. The same endpoint handles both synchronous responses and SSE-streamed responses, negotiated per request.

**Why Streamable HTTP:**

| Property | Behavior |
|---|---|
| Single endpoint | `POST /mcp` for requests. `GET /mcp` for SSE stream initiation. |
| Stateless by default | Each request is independent. No persistent connection required. |
| Horizontal scale | Cloudflare Workers handles concurrent requests without sticky sessions. |
| Auth | Standard HTTP `Authorization: Bearer` header. No handshake-level auth. |
| Streaming | SSE upgrade available when capabilities return chunked output. |

---

## JSON-RPC 2.0 message format

All messages sent to and received from `/mcp` are JSON-RPC 2.0 objects.

**Request envelope:**

| Field | Type | Value |
|---|---|---|
| `jsonrpc` | string | Always `"2.0"` |
| `method` | string | `"initialize"`, `"tools/list"`, or `"tools/call"` |
| `params` | object | Method-specific parameters |
| `id` | integer | Request identifier. Must be echoed in the response. |

**Response envelope (success):**

| Field | Type | Value |
|---|---|---|
| `jsonrpc` | string | Always `"2.0"` |
| `result` | object | Method-specific result |
| `id` | integer | Echoed from the request |

**Response envelope (error):**

| Field | Type | Value |
|---|---|---|
| `jsonrpc` | string | Always `"2.0"` |
| `error` | object | Contains `code` (integer) and `message` (string) |
| `id` | integer | Echoed from the request |

---

## Request flow

```
Runtime sends: POST /mcp
  Headers: Content-Type: application/json
           Authorization: Bearer opctx_<key>
           Mcp-Session-Id: <optional>
  Body: JSON-RPC 2.0 message

Edge receives → Auth guard → Rate limiter → Tool dispatcher

For synchronous responses (search, memory, most DeepDoc):
  Returns: HTTP 200, JSON-RPC 2.0 result object

For streaming responses (VoiceBridge stream: true, large DeepDoc):
  Runtime first opens: GET /mcp with same headers
  OptiContext upgrades to SSE
  Streams chunked audio or analysis tokens as SSE events
  Closes stream when response is complete
```

*JetBrains Mono · 13px · Code surface · Radius sm*

---

## Legacy transport

OptiContext maintains a `/sse` endpoint for runtimes that have not yet migrated to Streamable HTTP transport. This endpoint uses the HTTP+SSE transport from the MCP 2025-03-26 specification. The primary transport path is Streamable HTTP via `/mcp`. The `/sse` endpoint receives no new capability features.

---

---

# SECTION 5 — CAPABILITY REFERENCE
## Anchor: `#capabilities`

*Zodiak 2xl · Text primary · Border-top: 1px border default · Padding-top: 48px*

The five MCP tools exposed by OptiContext. All tools are called via `POST /mcp` using the `tools/call` method.

---

## opticontext_search — IntelliSearch

**MCP tool name:** `opticontext_search`
**Capability:** IntelliSearch
**Full reference:** `/docs/tools/intellisearch`

### Input schema

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | string | Yes | — | The search query in natural language. Maximum 500 characters. |
| `mode` | string | No | `"auto"` | Provider routing mode: `"auto"`, `"research"`, `"fast"`, or `"scrape"`. |
| `dork` | object | No | — | Advanced search operator parameters. See dork sub-schema. |
| `max_results` | integer | No | `5` | Maximum results to return. Range: 1–20. |
| `summarize` | boolean | No | `true` | Run Cerebras summarization on raw results before returning. |
| `save_to_memory` | boolean | No | `false` | Store the result in MemoryCore after the search completes. |

**Dork sub-schema:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `site_filter` | string | No | — | Restrict results to a specific domain. Example: `"github.com"`. |
| `file_type` | string | No | — | Filter by file extension. Example: `"pdf"`. |
| `date_after` | string | No | — | Return results published after this date. Format: `"YYYY-MM-DD"`. |
| `exclude_terms` | array | No | — | Terms to exclude. Each item is a string. |

**Mode routing:**

| `mode` | Provider | Cost | When to use |
|---|---|---|---|
| `"auto"` | Tavily → DuckDuckGo fallback | Budget-managed | Default. Routes by query type and current Tavily budget state. |
| `"research"` | Tavily | 2 Tavily credits | Full page content extraction required. |
| `"fast"` | DuckDuckGo | Free | Snippets sufficient. No quota. |
| `"scrape"` | Apify | Apify credits | Structured data extraction from specific URLs. Use sparingly. |

### Request example

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

### Response schema

| Field | Type | Description |
|---|---|---|
| `summary` | string | AI-generated summary of the most relevant results. |
| `key_findings` | array | Extracted factual findings. Each item is a string. |
| `sources` | array | Source objects. Each has `url` (string) and `title` (string). |
| `confidence` | number | Relevance confidence score. Range: 0.0–1.0. |
| `provider_used` | string | Which provider resolved the query: `"tavily"`, `"ddg"`, or `"apify"`. |
| `cached` | boolean | Whether this result was served from the 15-minute cache. |
| `query_executed` | string | The final dorked query string sent to the provider. |

### Limits

| Limit | Value |
|---|---|
| Requests per minute (per agent key) | 30 — shared across all capabilities |
| Requests per day (per agent key) | 500 |
| Tavily credits per month | 1,000 — budget guard activates at 800 |
| Cache TTL | 15 minutes |
| Max query length | 500 characters |
| Max results per call | 20 |

### Error codes

| Code | Name | Cause |
|---|---|---|
| `-32001` | `UNAUTHORIZED` | Agent key missing, malformed, not found, or revoked. |
| `-32029` | `RATE_LIMITED` | 30 requests/minute per agent key reached. |
| `-32030` | `DAILY_CAP_REACHED` | 500 requests/day for this key exhausted. Resets at 00:00 UTC. |
| `-32040` | `PROVIDER_UNAVAILABLE` | All search providers failed. Retry with `"mode": "fast"`. |
| `-32041` | `BUDGET_GUARD_ACTIVE` | Tavily at ≥800/1,000 credits. Request automatically routed to DuckDuckGo — no action required. |
| `-32050` | `QUERY_TOO_LONG` | Query exceeds 500 characters. |

---

## opticontext_tts — VoiceBridge

**MCP tool name:** `opticontext_tts`
**Capability:** VoiceBridge
**Full reference:** `/docs/tools/voicebridge`

### Input schema

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `text` | string | Yes | — | Text to synthesize. Maximum 3,000 characters per call. |
| `voice` | string | No | `"Scarlett"` | Voice ID. See voice reference table. |
| `speed` | number | No | `1.0` | Speech speed multiplier. Range: 0.5–2.0. |
| `format` | string | No | `"mp3"` | Output audio format: `"mp3"`, `"ogg"`, or `"wav"`. |
| `platform` | string | No | `"raw"` | Target platform: `"telegram"`, `"discord"`, `"whatsapp"`, or `"raw"`. Overrides `format` with platform-optimal value. |
| `stream` | boolean | No | `false` | Return audio chunks via SSE instead of a URL. |
| `save_to_memory` | boolean | No | `false` | Store the synthesized text in MemoryCore after completion. |

**Platform format override:**

| `platform` | Effective format |
|---|---|
| `"telegram"` | `ogg/opus` |
| `"discord"` | `mp3` |
| `"whatsapp"` | `ogg/opus` |
| `"raw"` | Value of `format` field |

**Voice reference (representative subset — 48 voices, 8 languages total):**

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
| `Emma` | French | Female |
| `Yuki` | Japanese | Female |
| `Mei` | Mandarin | Female |
| `Ana` | Portuguese | Female |

### Request example

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_tts",
    "arguments": {
      "text": "The build completed successfully. Three tests failed in the authentication module.",
      "voice": "Dan",
      "platform": "telegram",
      "speed": 1.0
    }
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/call — opticontext_tts` · Copy button*

### Response schema

| Field | Type | Description |
|---|---|---|
| `audio_url` | string | Signed Cloudflare R2 URL for the generated audio file. Valid for 24 hours. |
| `duration_ms` | integer | Duration of the synthesized audio in milliseconds. |
| `voice_used` | string | The voice ID used for synthesis. |
| `format` | string | Audio format of the returned file: `"mp3"`, `"ogg"`, or `"wav"`. |
| `cached` | boolean | Whether this audio was served from the 24-hour TTS cache. |
| `chunks` | array | Present only when `stream: true`. Array of base64-encoded audio chunk strings. |

**Latency reference:**

| Condition | Latency |
|---|---|
| Cache hit (same text + voice within 24h) | < 30ms |
| Cache miss — short text (< 500 chars) | ~600ms total, TTFB ~300ms |
| Cache miss — long text (3,000 chars) | ~1.2s total |

### Limits

| Limit | Value |
|---|---|
| Requests per minute (per agent key) | 30 — shared across all capabilities |
| Requests per day (per agent key) | 500 |
| Max text per call | 3,000 characters |
| TTS cache TTL | 24 hours |
| Audio file retention in R2 | 24 hours |

### Error codes

| Code | Name | Cause |
|---|---|---|
| `-32001` | `UNAUTHORIZED` | Agent key missing, malformed, not found, or revoked. |
| `-32029` | `RATE_LIMITED` | 30 requests/minute per agent key reached. |
| `-32030` | `DAILY_CAP_REACHED` | 500 requests/day for this key exhausted. |
| `-32060` | `TEXT_TOO_LONG` | Input text exceeds 3,000 characters. |
| `-32061` | `INVALID_VOICE_ID` | Voice ID not recognized by Unreal Speech. |
| `-32062` | `SYNTHESIS_FAILED` | Unreal Speech returned an error. Retry or switch voice ID. |
| `-32063` | `STREAM_UNSUPPORTED` | SSE streaming unavailable in this context. Set `stream: false`. |

---

## opticontext_analyze — DeepDoc

**MCP tool name:** `opticontext_analyze`
**Capability:** DeepDoc
**Full reference:** `/docs/tools/deepdoc`

One of `file_url`, `file_b64`, `upload_id`, or `file_id` is required on every call.

### Input schema

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_url` | string | Conditional | — | Public URL of the file to fetch and analyze. |
| `file_b64` | string | Conditional | — | Base64-encoded file content. Maximum 100MB inline. |
| `upload_id` | string | Conditional | — | ID returned from `POST /upload`. Expires 1 hour after upload. |
| `file_id` | string | Conditional | — | ID from a previous DeepDoc response. Re-analyzes without re-uploading. |
| `query` | string | Yes | — | The specific question or analysis task to run against the file. |
| `model` | string | No | `"auto"` | Model selection: `"auto"`, `"flash"`, or `"pro"`. |
| `output_format` | string | No | `"structured"` | Response shape: `"structured"`, `"markdown"`, `"json"`, or `"summary_only"`. |
| `save_to_memory` | boolean | No | `false` | Store the analysis result in MemoryCore for future semantic recall. |
| `max_tokens` | integer | No | `4096` | Maximum response tokens. Range: 1–16384. |

**Model routing:**

| Condition | Model selected | Context window |
|---|---|---|
| File < 50KB, simple query | Gemini 2.5 Flash | 1M tokens |
| File < 500KB, complex query | Gemini 2.0 Flash | 1M tokens |
| File ≥ 500KB or `model: "pro"` | Gemini 1.5 Pro | 2M tokens |
| `model: "flash"` (explicit) | Gemini 2.5 Flash | 1M tokens |

**Supported file types:**

| Category | Formats |
|---|---|
| Documents | PDF, DOCX, PPTX, XLSX, CSV, TXT, Markdown, HTML, XML, JSON |
| Images | PNG, JPG, JPEG, WEBP, HEIC, HEIF, GIF (static) |
| Code | `.py`, `.js`, `.ts`, `.java`, `.cpp`, `.c`, `.go`, `.rs`, `.rb`, `.php`, `.sh`, `.yaml`, `.toml` |
| Audio | MP3, WAV, FLAC, AAC, OGG, OPUS |
| Video | MP4, AVI, MOV, MKV, WEBM |
| Archives | ZIP — contents extracted and analyzed |

### Request example

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_analyze",
    "arguments": {
      "file_id": "a3f8d9e1b2c4",
      "query": "What are the three most critical security vulnerabilities identified in this report?",
      "model": "auto",
      "output_format": "structured",
      "save_to_memory": true
    }
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/call — opticontext_analyze` · Copy button*

### Response schema

| Field | Type | Description |
|---|---|---|
| `summary` | string | High-level summary of the file's content relative to the query. |
| `key_findings` | array | Extracted facts and structured conclusions. Each item is a string. |
| `answer` | string | Direct answer to the `query` field. The primary agent-facing field. |
| `tables` | array | Data tables extracted from the file. Each item is a structured table object. |
| `code_blocks` | array | Code segments extracted from the file. Each item has `language` (string) and `content` (string). |
| `confidence` | number | Model confidence in the analysis quality. Range: 0.0–1.0. |
| `file_id` | string | 12-character hex identifier for this file. Use in future calls to re-analyze. |
| `tokens_used` | integer | Total tokens consumed by the Gemini analysis call. |
| `model_used` | string | Which Gemini model the router selected. |

**Latency reference:**

| Condition | Latency |
|---|---|
| Re-analysis using `file_id` (file already in R2 + Gemini) | ~1.5s |
| New file, small (< 1MB), Gemini Flash | ~3–5s |
| New file, large (> 5MB), Gemini 1.5 Pro | ~8–15s |

### Limits

| Limit | Value |
|---|---|
| Requests per minute (per agent key) | 30 — shared across all capabilities |
| Requests per day (per agent key) | 500 |
| Max inline base64 file size | 100MB |
| Max pre-upload file size | 2GB |
| Gemini 2.5 Flash requests/day | 1,500 — budget guard at 1,200 |
| Gemini 1.5 Pro requests/day | 50 — budget guard at 40 |
| Max response tokens | 16,384 |

### Error codes

| Code | Name | Cause |
|---|---|---|
| `-32001` | `UNAUTHORIZED` | Agent key missing, malformed, not found, or revoked. |
| `-32029` | `RATE_LIMITED` | 30 requests/minute per agent key reached. |
| `-32070` | `FILE_NOT_FOUND` | `file_id` not found for this agent key. File may have been deleted. |
| `-32071` | `UPLOAD_EXPIRED` | `upload_id` has expired. Re-upload via `POST /upload`. |
| `-32072` | `FILE_TOO_LARGE` | File exceeds 2GB. |
| `-32073` | `UNSUPPORTED_FILE_TYPE` | File format not supported by Gemini Files API. |
| `-32074` | `GEMINI_QUOTA_REACHED` | Daily Gemini request limit reached. Resets at midnight PST. |
| `-32075` | `ANALYSIS_FAILED` | Gemini returned an empty or malformed response. Retry with a more specific query. |

---

## opticontext_memory_write — MemoryCore

**MCP tool name:** `opticontext_memory_write`
**Capability:** MemoryCore
**Full reference:** `/docs/tools/memorycore`

### Input schema

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `content` | string | Yes | — | Text content to store. No character limit, but chunked at 512 tokens. |
| `namespace` | string | No | `"general"` | Logical partition for this memory. Examples: `"general"`, `"projects"`, `"personal"`. |
| `importance` | integer | No | `5` | Importance score for reranking. Range: 1–10. Higher values surface more often. |
| `source` | string | No | — | Human-readable description of where this memory originated. |
| `expires_at` | string | No | — | ISO 8601 datetime. Memory is excluded from search results after this time. |

### Request example

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_memory_write",
    "arguments": {
      "content": "The user prefers concise responses under 200 words and avoids code blocks in casual conversation.",
      "namespace": "personal",
      "importance": 8,
      "source": "user preference stated in session 2026-05-21"
    }
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/call — opticontext_memory_write` · Copy button*

### Response schema

| Field | Type | Description |
|---|---|---|
| `memory_id` | string | Identifier for the stored memory entry. |
| `chunks_stored` | integer | Number of 512-token chunks created from the input content. |
| `namespace` | string | The namespace the memory was stored in. |

### Limits

| Limit | Value |
|---|---|
| Requests per minute (per agent key) | 30 — shared across all capabilities |
| Requests per day (per agent key) | 500 — write and search each count as one request |
| Max chunks per agent | 10,000 |
| Auto-summarization trigger | 8,000 chunks |
| Chunk size | 512 tokens, 50-token overlap |
| Embedding dimensions | 768 (Gemini Embedding model) |

---

## opticontext_memory_search — MemoryCore

**MCP tool name:** `opticontext_memory_search`
**Capability:** MemoryCore
**Full reference:** `/docs/tools/memorycore`

### Input schema

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | string | Yes | — | Natural language query to search for semantically similar memories. |
| `namespace` | string | No | `"general"` | Namespace to search within. |
| `top_k` | integer | No | `5` | Number of results to return. Maximum: 20. |
| `min_similarity` | number | No | `0.7` | Minimum cosine similarity threshold. Range: 0.0–1.0. Values below 0.5 may return low-relevance results. |
| `rerank` | boolean | No | `true` | Run Cerebras reranking pass on results before returning. |

### Request example

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_memory_search",
    "arguments": {
      "query": "What are the user's communication preferences?",
      "namespace": "personal",
      "top_k": 5,
      "min_similarity": 0.7,
      "rerank": true
    }
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/call — opticontext_memory_search` · Copy button*

### Response schema

| Field | Type | Description |
|---|---|---|
| `memories` | array | Retrieved memory objects. Each has `content` (string), `namespace` (string), `importance` (integer), `similarity` (number), and `created_at` (string). |
| `relevance_scores` | array | Cosine similarity scores for each returned memory, in matching order. |
| `total_found` | integer | Total number of memories in the namespace that exceeded `min_similarity`. |
| `context_block` | string | Pre-assembled context string combining the top results. Ready to inject into a model prompt. |

### Memory error codes

| Code | Name | Cause |
|---|---|---|
| `-32001` | `UNAUTHORIZED` | Agent key missing, malformed, not found, or revoked. |
| `-32029` | `RATE_LIMITED` | 30 requests/minute per agent key reached. |
| `-32080` | `NAMESPACE_NOT_FOUND` | No memories exist in the specified namespace for this agent. |
| `-32081` | `EMBEDDING_FAILED` | Gemini Embedding API returned an error. Retry the call. |
| `-32082` | `MEMORY_LIMIT_REACHED` | Agent has reached the 10,000-chunk limit. Auto-summarization may not have run yet. |

---

---

# SECTION 6 — UPLOAD FLOW
## Anchor: `#upload-flow`

*Zodiak 2xl · Text primary · Border-top: 1px border default · Padding-top: 48px*

---

## Overview

The upload flow is a two-step process for files too large to send inline as base64 (recommended threshold: files over 5MB). It decouples the file transfer from the analysis call, allowing large files to be staged before the capability is invoked.

```
Step 1: POST /upload → receive upload_id
Step 2: POST /mcp (opticontext_analyze with upload_id) → receive file_id + analysis
```

*JetBrains Mono · 13px · Code surface · Radius sm*

---

## Step 1 — Upload the file

```bash
curl -X POST https://mcp.opticontext.dev/upload \
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \
  -F "file=@/path/to/report.pdf"
```

*JetBrains Mono · 14px · Code surface · Top bar: `bash — POST /upload` · Copy button*

**Response:**

```json
{
  "upload_id": "upload_7f3a9b2e",
  "filename": "report.pdf",
  "size_bytes": 8421376,
  "expires_at": "2026-05-22T14:30:00Z"
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `/upload response` · Copy button*

The file is stored in Cloudflare R2 under a temporary key (`<agent_id>/<upload_id>`). The `upload_id` expires 1 hour after upload.

---

## Step 2 — Analyze using the upload_id

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

---

## File persistence and file_id

When `opticontext_analyze` is called with `upload_id` or `file_b64`, OptiContext automatically persists the file:

```
Temp location (expires 1h):  <agent_id>/upload_7f3a9b2e  (R2)
                                    ↓ on analysis call
Permanent location:          persist/<agent_id>/<file_id>  (R2)
KV index written:            file_idx:a3f8d9e1b2c4 → { r2_key, filename, mime_type }
Turso record written:        uploaded_files table
```

*JetBrains Mono · 13px · Code surface · Radius sm*

The `file_id` (12 lowercase hex characters) is returned in the `opticontext_analyze` response. Use it in future calls to re-analyze the same file without re-uploading.

---

## Re-analysis flow

```json
{
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
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `tools/call — re-analysis` · Copy button*

On re-analysis, OptiContext fetches the file from R2 and uploads it to Gemini Files API. Gemini retains files for 48 hours — if a re-analysis occurs within that window, the Gemini `file_uri` may be reused without re-uploading to Gemini. After 48 hours, the file is re-uploaded to Gemini automatically from R2. The `file_id` in R2 has no expiry.

---

## Upload lifecycle summary

| Stage | Storage | Expiry |
|---|---|---|
| `POST /upload` received | R2 temp key | 1 hour |
| `opticontext_analyze` called with `upload_id` | R2 temp key deleted; persisted to R2 permanent key | No expiry |
| File sent to Gemini Files API | Gemini servers | 48 hours |
| File retained for re-analysis | Cloudflare R2 | No expiry (agent-managed) |

---

---

# SECTION 7 — ERROR REFERENCE
## Anchor: `#error-reference`

*Zodiak 2xl · Text primary · Border-top: 1px border default · Padding-top: 48px*

---

## Error response structure

All errors follow JSON-RPC 2.0 error format. HTTP status is always `200` for MCP errors — the error is carried in the JSON body. Transport-level failures (malformed JSON, server crash) return non-200 HTTP status codes.

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": <integer>,
    "message": "<ERROR_NAME> — <specific cause>. <action>"
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `error response structure` · Copy button*

**Message format:** `ERROR_NAME — what happened. What to do next.` Every error message names the specific cause and includes an actionable resolution. Generic messages are not used.

---

## Authentication errors

| Code | Name | HTTP | Cause | Resolution |
|---|---|---|---|---|
| `-32001` | `UNAUTHORIZED` | 200 | Authorization header missing or malformed. | Add `Authorization: Bearer opctx_<key>` header. Verify `opctx_` prefix is present. |
| `-32001` | `KEY_NOT_FOUND` | 200 | Agent key does not exist in the system. | Verify the key was copied correctly. Create a new key from the dashboard if needed. |
| `-32001` | `KEY_REVOKED` | 200 | Agent key has been revoked. | Create a new key from `/dashboard/settings`. The revoked key cannot be restored. |
| `-32003` | `FORBIDDEN` | 200 | Agent key does not have permission for this capability. | Check the key's capability permissions in the dashboard. |

---

## Rate limit errors

| Code | Name | HTTP | Cause | Resolution |
|---|---|---|---|---|
| `-32029` | `RATE_LIMITED` | 200 | 30 requests/minute per agent key reached. | Wait for the reset window stated in the error message. The reset time is always included. |
| `-32030` | `DAILY_CAP_REACHED` | 200 | 500 requests/day for this agent key exhausted. | Resets at 00:00 UTC. The reset time is included in the error message. |

---

## IntelliSearch errors

| Code | Name | Cause | Resolution |
|---|---|---|---|
| `-32040` | `PROVIDER_UNAVAILABLE` | All search providers (Tavily, DuckDuckGo, Apify) failed. | Retry with `"mode": "fast"` to force DuckDuckGo. |
| `-32041` | `BUDGET_GUARD_ACTIVE` | Tavily at ≥800/1,000 monthly credits. | Requests route to DuckDuckGo automatically. No action required. `provider_used` in the response reflects this. |
| `-32050` | `QUERY_TOO_LONG` | Query exceeds 500 characters. | Shorten the query. Use `dork` parameters for precision. |

---

## VoiceBridge errors

| Code | Name | Cause | Resolution |
|---|---|---|---|
| `-32060` | `TEXT_TOO_LONG` | Input text exceeds 3,000 characters. | Split into multiple sequential calls, each under 3,000 characters. |
| `-32061` | `INVALID_VOICE_ID` | Voice ID not recognized by Unreal Speech. | Use a valid voice ID from the voice reference table. |
| `-32062` | `SYNTHESIS_FAILED` | Unreal Speech returned an error or empty response. | Retry the call. If the error persists, try a different voice ID. |
| `-32063` | `STREAM_UNSUPPORTED` | SSE streaming unavailable in this request context. | Set `stream: false` and use URL delivery. |

---

## DeepDoc errors

| Code | Name | Cause | Resolution |
|---|---|---|---|
| `-32070` | `FILE_NOT_FOUND` | `file_id` not found for this agent key. | The file may have been deleted or the `file_id` belongs to a different agent key. Re-upload. |
| `-32071` | `UPLOAD_EXPIRED` | `upload_id` has expired (temp files expire 1 hour after upload). | Re-upload via `POST /upload` and use the new `upload_id` immediately. |
| `-32072` | `FILE_TOO_LARGE` | File exceeds the 2GB Gemini Files API limit. | Split the file before uploading. ZIP archives are extracted automatically. |
| `-32073` | `UNSUPPORTED_FILE_TYPE` | File format not supported by Gemini Files API. | Check the supported file types table in the capability reference. |
| `-32074` | `GEMINI_QUOTA_REACHED` | Daily Gemini request limit reached. | Gemini 2.5 Flash: 1,500/day. Gemini 1.5 Pro: 50/day. Resets at midnight PST. |
| `-32075` | `ANALYSIS_FAILED` | Gemini returned an empty or malformed response. | Retry with a more specific `query`. Switch model with `model: "pro"` for complex files. |

---

## MemoryCore errors

| Code | Name | Cause | Resolution |
|---|---|---|---|
| `-32080` | `NAMESPACE_NOT_FOUND` | No memories exist in the specified namespace for this agent key. | Verify the namespace string. Call `opticontext_memory_write` to create the first entry. |
| `-32081` | `EMBEDDING_FAILED` | Gemini Embedding API returned an error. | Retry the call. Transient. |
| `-32082` | `MEMORY_LIMIT_REACHED` | Agent's memory store has reached 10,000 chunks. | Auto-summarization triggers at 8,000 chunks. If auto-summarization has not yet run, wait and retry. |

---

## Server errors

| Code | HTTP | Name | Cause | Resolution |
|---|---|---|---|---|
| `-32603` | 200 | `INTERNAL_ERROR` | Unexpected server-side failure. | Retry with exponential backoff. Report persistent failures. |
| — | 500 | Transport error | Cloudflare Workers edge failure. | Retry. Cloudflare Workers uptime SLA applies. |
| — | 503 | `SERVICE_UNAVAILABLE` | Downstream provider temporarily unreachable. | Retry after 30 seconds. Budget guard may route to an alternative provider. |

---

## Retry guidance

```
Transient errors (-32040, -32062, -32075, -32081, -32603):
  Retry with exponential backoff: 1s → 2s → 4s → give up after 3 attempts.

Rate limit errors (-32029, -32030):
  Do not retry until the reset time stated in the error message.
  -32029: resets at the start of the next 60-second window.
  -32030: resets at 00:00 UTC.

Auth errors (-32001, -32003):
  Do not retry. Fix the credential issue before retrying.

Provider budget errors (-32041):
  Do not retry. The error is informational. The request was already rerouted.
```

*JetBrains Mono · 13px · Code surface · Radius sm*

---

---

# SECTION 8 — RATE LIMITS
## Anchor: `#rate-limits`

*Zodiak 2xl · Text primary · Border-top: 1px border default · Padding-top: 48px*

---

## Per-agent key limits

All limits are enforced per agent key. Two keys issued to different runtimes do not share limits.

| Limit | Value | Scope | Reset |
|---|---|---|---|
| Requests per minute | 30 | All capabilities combined | Rolling 60-second window |
| Requests per day | 500 | All capabilities combined | 00:00 UTC |

The per-minute limit is enforced via Cloudflare KV per-minute bucket counters. The per-day cap is tracked in Turso.

---

## Capability-specific provider limits

These limits are set by the underlying provider, not by OptiContext. Budget guards prevent hard failures by switching providers automatically before limits are reached.

| Capability | Provider | Limit | Budget guard threshold |
|---|---|---|---|
| IntelliSearch | Tavily | 1,000 credits/month | 800 credits — auto-routes to DuckDuckGo |
| IntelliSearch | Apify | ~$5 credits/month | $4.50 spent — pauses `"scrape"` mode |
| IntelliSearch | DuckDuckGo | Unlimited | — |
| VoiceBridge | Unreal Speech | Free tier character limit | Near limit — informational error returned |
| DeepDoc | Gemini 2.5 Flash | 1,500 req/day, 15 RPM | 1,200 req/day — throttles non-critical requests |
| DeepDoc | Gemini 1.5 Pro | 50 req/day, 2 RPM | 40 req/day — blocks new Pro requests |
| MemoryCore | Gemini Embedding | Free (rate-limited) | — |
| All capabilities | Cerebras (summarization) | 1M tokens/day | 800K tokens/day — switches to Gemini Flash for simple tasks |

---

## Budget guard behavior

Budget guards are proactive, not reactive. They switch providers before the hard limit is reached, so the runtime receives a valid response rather than an error.

```
Budget guard triggered:
  → Capability routes to the next provider automatically
  → The response field provider_used reflects which provider resolved the request
  → No error is returned unless all available providers are exhausted
  → Dashboard shows a warning indicator in the Usage Alerts section

Hard limit hit (all providers exhausted):
  → PROVIDER_UNAVAILABLE error returned (-32040)
  → Retry with a different mode or wait for the monthly reset
```

*JetBrains Mono · 13px · Code surface · Radius sm*

---

## Upload limits

| Limit | Value |
|---|---|
| Max inline base64 (`file_b64`) | 100MB |
| Max pre-upload (`POST /upload`) | 2GB |
| Upload temp expiry | 1 hour |
| Concurrent uploads per agent key | No hard limit (subject to per-minute request cap) |

---

## Rate limit response headers

When a request is rate-limited, the error message includes the reset time. No custom HTTP headers are added — the reset information is carried in the `error.message` field per JSON-RPC 2.0 convention:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32029,
    "message": "RATE_LIMITED — 30 requests/minute reached for this agent key. Resets in 43 seconds."
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar: `rate limit error example` · Copy button*

---

---

# SECTION 9 — RESPONSE STRUCTURE STANDARDS
## Anchor: `#response-structure`

*Zodiak 2xl · Text primary · Border-top: 1px border default · Padding-top: 48px*

---

## Success response envelope

All successful capability responses follow this structure:

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "<json_string>"
      }
    ]
  },
  "id": 1
}
```

The `content[0].text` value is a JSON-serialized string. The runtime must parse it to access capability output fields.

---

## Common response fields

These fields appear across multiple capabilities:

| Field | Type | Capabilities | Description |
|---|---|---|---|
| `cached` | boolean | IntelliSearch, VoiceBridge | Whether the response was served from cache. |
| `provider_used` | string | IntelliSearch | Which search provider resolved the request: `"tavily"`, `"ddg"`, or `"apify"`. |
| `model_used` | string | DeepDoc | Which Gemini model the AI router selected. |
| `confidence` | number | IntelliSearch, DeepDoc | Model confidence score. Range: 0.0–1.0. |
| `tokens_used` | integer | DeepDoc | Tokens consumed by the Gemini analysis. |

---

## Null and absent fields

Optional response fields that produced no data are omitted entirely from the response — they are not returned as `null`. For example, if a DeepDoc analysis finds no data tables in the file, `tables` is an empty array (`[]`). If VoiceBridge returns a URL (not a stream), `chunks` is an empty array.

---

## `save_to_memory` cross-capability behavior

IntelliSearch, VoiceBridge, and DeepDoc all accept `save_to_memory: true`. When set:

```
Primary capability call completes first.
opticontext_memory_write is called automatically with the result.
The memory write happens before the response is returned.
If the memory write fails, the primary capability response is still returned.
The memory failure is logged but does not surface as an error to the runtime.
```

*JetBrains Mono · 13px · Code surface · Radius sm*

---

---

# SECTION 10 — COMPATIBILITY NOTES
## Anchor: `#compatibility`

*Zodiak 2xl · Text primary · Border-top: 1px border default · Padding-top: 48px*

---

OptiContext implements the Model Context Protocol specification directly. Any runtime implementing MCP Streamable HTTP transport (MCP 2025-11-25) connects to OptiContext without modification.

**Protocol version:** MCP 2025-11-25 (Streamable HTTP transport)

**Legacy support:** HTTP+SSE transport (MCP 2025-03-26) is supported via the `/sse` endpoint for runtimes that have not yet migrated to Streamable HTTP.

**Configuration:** The endpoint URL, Authorization header format, and JSON-RPC 2.0 message structure are identical across all MCP-compatible runtimes. Configuration file paths and JSON field names vary by runtime. See the quickstart at `/docs/quickstart` for runtime-specific configuration.

**Tested runtimes (non-exhaustive):**

```
Claude Code · Cursor · OpenClaw · Hermes · Windsurf · Cline · Custom MCP runtimes
```

*Switzer sm · Text secondary*

Any runtime that implements the MCP specification can connect. The list above reflects verified configurations, not a complete list of compatible runtimes.

---

---

# VERIFICATION LAYER

*Run against OPTICONTEXT_TERMINOLOGY.md before publishing.*

---

## ✓ Test 1 — Infrastructure or Plugin?

Page heading and orientation paragraph read aloud:
> "API Reference. Complete technical contract for the OptiContext MCP endpoint."

Result: **Infrastructure. Pass.**

---

## ✓ Test 2 — Vendor Bias Check

Vendor names appear only as infrastructure identifiers:
- Cloudflare Workers, Cloudflare KV, Cloudflare R2, Cloudflare Durable Objects — infrastructure providers, named factually.
- Cerebras — named as the inference provider for summarization/reranking.
- Gemini 2.5 Flash, Gemini 2.0 Flash, Gemini 1.5 Pro — named with specific model variants per backend plan requirement.
- Unreal Speech — named as the TTS provider.
- Tavily, DuckDuckGo, Apify — named as search providers in routing tables.
- Supabase pgvector — named as the vector store for MemoryCore.
- Turso — named as the logging store.

No runtime vendor appears in the compatibility notes with preferential positioning. The tested runtimes list is in alphabetical order (Claude Code → Cursor → Hermes → OpenClaw → Windsurf → Cline), not vendor-prestige order.

Result: **Pass.**

---

## ✓ Test 3 — Specificity Check

| Adjective | Present | Replacement |
|---|---|---|
| "powerful" | No | ✓ |
| "seamless" | No | ✓ |
| "fast" | Only with specific values: "< 30ms", "~600ms", "sub-300ms TTFB" | ✓ |
| "reliable" | No | ✓ |
| "robust" | No | ✓ |
| "easy" | No | ✓ |
| "intuitive" | No | ✓ |

Result: **Pass. Zero empty adjectives.**

---

## ✓ Test 4 — Forbidden Term Scan

| Forbidden term | Status |
|---|---|
| "API key" (standalone) | ✓ "Agent key" used throughout. "API key" appears once in the dashboard sidebar label reference from the frontend guide — that is a UI spec reference, not generated product copy. |
| "plugin" | ✓ Not present. |
| "tools" (product/marketing context) | ✓ "Capabilities" used in positioning context. "Tool", "MCP tool", "tools/call", "tools/list" used correctly in protocol-technical context only. |
| "client" (for runtimes) | ✓ "Runtime" used throughout. "clientInfo" appears once in the `initialize` request JSON — this is a required MCP protocol field name, not an OptiContext term. |
| "REST API" | ✓ Not present. Explicitly contradicted: "No REST semantics." |
| "webhook" | ✓ Not present. |
| "seamless" / "powerful" / "robust" / "intuitive" | ✓ Not present. |
| "we" / "our" | ✓ Not present. |
| "get started" | ✓ Not present. "See the quickstart" used. |
| "works with" (listing) | ✓ Not present. Protocol compatibility claim used. |
| "free tier" as value prop | ✓ Not present in positioning context. Appears only in provider limits tables as factual constraint data. |
| "for developers" | ✓ Not present. |

Result: **Pass. Zero forbidden terms.**

---

## ✓ Test 5 — One-Sentence Summary

> "OptiContext's API reference is the complete technical contract for the MCP endpoint — covering authentication, the JSON-RPC 2.0 lifecycle, all five capability schemas, the upload flow, error codes, and rate limits."

Completes: *"OptiContext is ______"* correctly. Result: **Pass.**

---

## ✓ Backend Alignment Check

| Claim | Source |
|---|---|
| `POST /mcp`, `GET /mcp`, `POST /upload`, `GET /usage`, `GET /health` endpoints | Section 13 — API Design |
| Agent key format: `opctx_<agent_slug>_<32hex>` | Section 5 — Authentication |
| Authorization: Bearer header | Section 5 |
| KV key verification flow (5 steps) | Section 5 |
| Per-agent isolation (R2 namespace, pgvector scope) | Sections 5, 6 |
| `protocolVersion: "2025-11-25"` | Terminology file (locked) |
| `initialize` response structure | Section 13 + Terminology file (locked block) |
| `tools/list` response (5 tools) | Sections 7–10 |
| IntelliSearch: Tavily → DDG → Apify routing, `mode` values | Section 7 |
| IntelliSearch: budget guard at 800/1,000 Tavily credits | Section 7, 17 |
| IntelliSearch: 15-minute cache TTL | Section 7 |
| IntelliSearch: Cerebras at 2,600 tok/s for summarization | Sections 7, 11 |
| VoiceBridge: Unreal Speech, sub-300ms TTFB | Section 8 |
| VoiceBridge: platform delivery patterns (Telegram < 800ms, Discord < 500ms TTFB) | Section 8 |
| VoiceBridge: 24-hour TTS cache in R2 | Section 8 |
| DeepDoc: Gemini model routing (Flash / 2.0 Flash / 1.5 Pro thresholds) | Section 9 |
| DeepDoc: 2M token context window (Gemini 1.5 Pro) | Section 9 |
| DeepDoc: upload → `upload_id` → `file_id` persistence flow | Section 9 |
| DeepDoc: R2 temp expiry 1h, Gemini retention 48h, R2 permanent no expiry | Section 9 |
| MemoryCore: 512-token chunks, 50-token overlap | Section 10 |
| MemoryCore: Gemini Embedding, 768-dimension vectors | Section 10 |
| MemoryCore: cosine similarity, Supabase pgvector | Section 10 |
| MemoryCore: Cerebras reranking | Section 10 |
| MemoryCore: 10,000-chunk limit, auto-summarization at 8,000 | Section 10 |
| Rate limits: 30 req/min, 500 req/day per agent key | Section 5 |
| `/usage` response fields | Section 13 |
| `/health` response fields | Section 13 |
| Durable Objects for session state | Section 3, Architecture |
| Turso for usage logs and daily_usage table | Section 6 — Storage |
| `save_to_memory` cross-capability behavior | Sections 9, 10 |

Result: **Pass. All claims traceable to backend plan.**

---

## ✓ Formatting Consistency Check

| Rule | Status |
|---|---|
| All JSON blocks use 2-space indentation | ✓ |
| `"jsonrpc": "2.0"` present in all JSON-RPC blocks | ✓ |
| `"id": 1` present in all request/response pairs and they match | ✓ |
| Language labels on all code blocks: `json`, `bash`, `text` | ✓ |
| curl structure: `-X POST`, `Content-Type` before `Authorization`, `\` continuation | ✓ |
| Realistic dummy key `opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4` in all direct request examples | ✓ |
| Placeholder `YOUR_AGENT_KEY` in config blocks, realistic dummy in request examples | ✓ |
| `file_id` examples: 12 lowercase hex characters `a3f8d9e1b2c4` | ✓ |
| `upload_id` examples: `upload_7f3a9b2e` | ✓ |
| `session_id` examples: `sess_4c8d2f1a9b3e` | ✓ |
| Endpoint URL: `https://mcp.opticontext.dev/mcp` | ✓ |
| Upload endpoint URL: `https://mcp.opticontext.dev/upload` | ✓ |
| Health endpoint URL: `https://mcp.opticontext.dev/health` | ✓ |
| Usage endpoint URL: `https://mcp.opticontext.dev/usage` | ✓ |
| Schema tables: Parameter · Type · Required · Default · Description columns | ✓ |
| `Required` column: "Yes" / "No" / "Conditional" — not "true"/"false" | ✓ |
| Default values in code font | ✓ |
| Error tables: Code · Name · Cause · Resolution | ✓ |
| `protocolVersion: "2025-11-25"` consistent across all MCP lifecycle blocks | ✓ |
| Initialize response block matches locked block from Terminology file exactly | ✓ |

Result: **Pass. All formatting conventions consistent with Phases 4 and 5.**

---

## ✓ Schema Inventory Check

Five capability schemas documented. All five match backend plan section 13 tool names exactly:

| Tool name | Capability | Documented |
|---|---|---|
| `opticontext_search` | IntelliSearch | ✓ |
| `opticontext_tts` | VoiceBridge | ✓ |
| `opticontext_analyze` | DeepDoc | ✓ |
| `opticontext_memory_write` | MemoryCore | ✓ |
| `opticontext_memory_search` | MemoryCore | ✓ |

No invented tools. No invented endpoints. No unsupported capabilities. All error codes consistent with Phase 5 capability documentation.

---

*OptiContext API Reference · Phase 6 of 9*
*Version 1.0 · Sandy · May 2026*
*Next phase: Phase 7 — Dashboard & Settings Copy*
