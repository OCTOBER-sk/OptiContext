# OptiContext API Reference

Complete reference for all HTTP endpoints and MCP tool schemas.

---

## Authentication

All agent endpoints require a Bearer token:

```
Authorization: Bearer opctx_<agent_id>_<random_hex>
```

### Admin endpoint authentication

Admin endpoints (`/admin/*`) use a two-tier auth model depending on environment:

**Production** (when `SUPABASE_JWT_SECRET` is configured):

```
Authorization: Bearer <supabase_access_token>
X-OptiContext-Admin: 1
```

The access token is obtained by signing in via the dashboard (Google OAuth via Supabase Auth). The token is verified server-side using HMAC-SHA256 with the Supabase JWT secret. `X-Admin-Secret` alone is rejected in production.

**Development** (when `SUPABASE_JWT_SECRET` is not configured):

```
X-Admin-Secret: <your_admin_secret>
X-OptiContext-Admin: 1
```

The `X-Admin-Secret` fallback is only active when `SUPABASE_JWT_SECRET` is not configured. Do not use it in production environments.

---

## HTTP Endpoints

### `GET /health`

Public. Returns server status.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-05-21T00:00:00.000Z",
  "uptime_seconds": 3600,
  "tools": ["opticontext_search", "opticontext_tts", "opticontext_analyze", "opticontext_memory_write", "opticontext_memory_search"]
}
```

---

### `POST /mcp`

MCP protocol endpoint — JSON-RPC 2.0. Send MCP messages here.

---

### `POST /upload`

Pre-upload a file to R2 for use in `opticontext_analyze`. Returns an `upload_id` valid for 24 hours.

**Request:** `multipart/form-data` with field `file`

**Response:**
```json
{
  "upload_id": "abc123.pdf",
  "filename": "report.pdf",
  "size_bytes": 1048576,
  "mime_type": "application/pdf",
  "expires_at": "2026-05-22T00:00:00.000Z"
}
```

---

### `GET /usage`

Returns usage statistics for the authenticated agent (30-day rolling).

**Response:**
```json
{
  "agent_id": "my-agent",
  "today_requests": 12,
  "monthly_requests": 340,
  "monthly_tokens": 1250000,
  "tool_breakdown": {
    "opticontext_search": { "count": 200, "tokens": 400000 }
  }
}
```

---

### `POST /admin/agents`

Create a new agent and generate an API key.

**Headers:** `X-Admin-Secret`

**Body:**
```json
{
  "agent_id": "my-agent",
  "display_name": "My Agent",
  "allowed_tools": ["intellisearch", "voicebridge", "deepdoc", "memorycore"],
  "tier": "standard",
  "requests_per_minute": 30,
  "daily_cap": 500
}
```

Note: `owner_email` is derived from the authenticated Supabase JWT and cannot be overridden in the request body.

**Response:**
```json
{
  "key": "opctx_my-agent_abc123...",
  "agent_id": "my-agent",
  "allowed_tools": ["intellisearch", "voicebridge", "deepdoc", "memorycore"],
  "warning": "Store this key securely. It will not be shown again."
}
```

---

### `GET /admin/agents`

List all registered agents.

**Headers:** `X-Admin-Secret`

---

### `POST /admin/agents/:agent_id/revoke`

Revoke all keys for an agent.

**Headers:** `X-Admin-Secret`

---

### `GET /admin/logs`

Fetch request logs from Turso.

**Headers:** `X-Admin-Secret`

**Query params:**
- `agent` — filter by agent_id
- `tool` — filter by tool name
- `status` — `success` or `error`
- `limit` — max results (default 100)

---

## MCP Tools

All tools follow JSON-RPC 2.0:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "<tool_name>",
    "arguments": { ... }
  }
}
```

---

### `opticontext_search`

Web search with AI-powered summarization and dork operators. See the
`opticontext_guide` tool (`topic: "search"`) for current operational
guidance.

| Argument | Type | Default | Description |
|---|---|---|---|
| `query` | string | **required** | Natural language search query |
| `mode` | string | `"auto"` | `auto`, `research`, `fast`, `scrape` |
| `dork` | object | `{}` | `site_filter`, `file_type`, `date_after`, `exclude_terms` |
| `max_results` | integer | `5` | Max results (up to 50) |
| `summarize` | boolean | `true` | Apply AI summarization to raw results |

---

### `opticontext_tts`

Convert text to natural speech.

| Argument | Type | Default | Description |
|---|---|---|---|
| `text` | string | **required** | Text to synthesize (max 30,000 chars) |
| `voice` | string | `"Scarlett"` | Voice ID — see `opticontext_guide` for the full list |
| `speed` | number | `1.0` | Speed multiplier (0.25–4.0) |
| `format` | string | `"mp3"` | `mp3`, `ogg`, `wav`, `aac`, `flac` |
| `platform` | string | `"raw"` | `telegram`, `discord`, `whatsapp`, `raw` |
| `stream` | boolean | `false` | Return base64 chunks vs URL |

---

### `opticontext_analyze`

Deep file analysis (PDF, images, code, audio, video, documents).

One of `file_url`, `file_b64`, `upload_id`, or `file_id` is required.

| Argument | Type | Default | Description |
|---|---|---|---|
| `query` | string | **required** | Analysis task / question |
| `file_url` | string | — | Public URL of file |
| `file_b64` | string | — | Base64 encoded file |
| `upload_id` | string | — | ID from POST /upload |
| `model` | string | `"auto"` | `auto`, `flash`, `pro` |
| `output_format` | string | `"structured"` | `structured`, `markdown`, `summary_only` |
| `save_to_memory` | boolean | `false` | Store analysis in MemoryCore |

---

### `opticontext_memory_write`

Store information in persistent vector memory.

| Argument | Type | Default | Description |
|---|---|---|---|
| `content` | string | **required** | Text to remember |
| `namespace` | string | `"general"` | Memory namespace |
| `importance` | integer | `5` | Importance score (1-10) |
| `source` | string | `"agent"` | Source label |
| `expires_at` | datetime | — | ISO 8601 expiry |

---

### `opticontext_memory_search`

Semantic search over stored memories.

| Argument | Type | Default | Description |
|---|---|---|---|
| `query` | string | **required** | What to search for |
| `namespace` | string | `"general"` | Namespace to search |
| `top_k` | integer | `5` | Max results |
| `min_similarity` | number | `0.7` | Min cosine similarity (0-1) |
| `rerank` | boolean | `false` | Apply AI reranking to results |

---

## Error Codes

Tool-level errors are returned as a structured JSON object in the response
`content` (with `isError: true`). The `error` field is a stable,
platform-level code; the `message` is a sanitized, user-facing description;
the `retry_hint` (when present) is a short suggested next step.

| Code | Meaning |
|---|---|
| `SEARCH_UNAVAILABLE` | Web search temporarily unavailable. Retry. |
| `SEARCH_QUALITY_INSUFFICIENT` | Search returned no reliable sources. Retry with `mode: "research"` or refine the query. |
| `RATE_LIMITED` | Search is rate-limited. Wait and retry. |
| `QUOTA_EXCEEDED` | Daily quota for the capability exhausted. Resets at 00:00 UTC. |
| `TTS_UNAVAILABLE` | Speech synthesis temporarily unavailable. Retry. |
| `ANALYZE_UNAVAILABLE` | File analysis temporarily unavailable. Retry. |
| `MEMORY_UNAVAILABLE` | Memory service temporarily unavailable. Retry. |
| `INVALID_PARAMS` | Request parameters invalid. Check the tool schema. |
| `INTERNAL_ERROR` | Unexpected server error. Retry, contact support if persistent. |

JSON-RPC transport-level errors use the standard JSON-RPC 2.0 codes:

| Code | HTTP | Meaning |
|---|---|---|
| `-32700` | 400 | Parse error |
| `-32600` | 400 | Invalid Request |
| `-32601` | 404 | Method not found |
| `-32602` | 400 | Invalid params |
| `-32603` | 500 | Internal error |
| `-32001` | 401/403 | Auth or permission error |
| `-32002` | 429 | Tool execution timed out or rate-limited |
