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

**Production** (when `FIREBASE_PROJECT_ID` is configured):

```
Authorization: Bearer <firebase_id_token>
X-OptiContext-Admin: 1
```

Obtain a Firebase ID token by signing in via the dashboard (Google OAuth). The token is verified server-side against Google public certs. `X-Admin-Secret` alone is rejected in production.

**Development** (when `FIREBASE_PROJECT_ID` is not configured):

```
X-Admin-Secret: <your_admin_secret>
X-OptiContext-Admin: 1
```

The `X-Admin-Secret` fallback is only active when Firebase is not configured. Do not use it in production environments.

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

Note: `owner_email` is derived from the authenticated Firebase JWT and cannot be overridden in the request body.

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

Web search with AI dorking and Cerebras summarization.

| Argument | Type | Default | Description |
|---|---|---|---|
| `query` | string | **required** | Natural language search query |
| `mode` | string | `"auto"` | `auto`, `research`, `fast`, `scrape` |
| `dork` | object | `{}` | `site_filter`, `file_type`, `date_after`, `exclude_terms` |
| `max_results` | integer | `5` | Max results (up to 20) |
| `summarize` | boolean | `true` | Run Cerebras AI summarization |

---

### `opticontext_tts`

Convert text to natural speech via Unreal Speech.

| Argument | Type | Default | Description |
|---|---|---|---|
| `text` | string | **required** | Text to synthesize (max 3,000 chars) |
| `voice` | string | `"Scarlett"` | Voice ID: Scarlett, Dan, Will, Liv, Priya |
| `speed` | number | `1.0` | Speed multiplier (0.5–2.0) |
| `format` | string | `"mp3"` | `mp3`, `ogg`, `wav` |
| `platform` | string | `"raw"` | `telegram`, `discord`, `whatsapp`, `raw` |
| `stream` | boolean | `false` | Return base64 chunks vs URL |

---

### `opticontext_analyze`

Deep file analysis using Gemini.

One of `file_url`, `file_b64`, or `upload_id` is required.

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
| `rerank` | boolean | `true` | Apply Cerebras reranking |

---

## Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `AUTH_ERROR` | 401 | Missing/invalid API key |
| `RATE_LIMIT_ERROR` | 429 | Rate limit exceeded |
| `PERMISSION_ERROR` | 403 | Tool not allowed for agent |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `PROVIDER_ERROR` | 502 | Upstream provider failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
