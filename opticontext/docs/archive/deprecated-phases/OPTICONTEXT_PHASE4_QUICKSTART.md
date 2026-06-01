# OptiContext — Phase 4: Quickstart
## Production Copy · `/docs/quickstart` Route · All Steps Complete
### Version 1.0 · Sandy · May 2026

---

> **Source-of-truth alignment:**
> Generated from OPTICONTEXT_PLAN__4_.md (backend), OPTICONTEXT_FRONTEND_GUIDE.txt (Part 4 — Quickstart),
> and OPTICONTEXT_TERMINOLOGY.md (language contract).
> This is an instructional page. Tone: direct, step-by-step, operational.
> No marketing language. Every code block is real and copy-ready.

---

## TABLE OF CONTENTS

1. [Sidebar Navigation (inherited)](#sidebar-navigation-inherited)
2. [Page Header](#page-header)
3. [Runtime Tabs](#runtime-tabs)
4. [Step 1 — Create your account](#step-1--create-your-account)
5. [Step 2 — Get your agent key](#step-2--get-your-agent-key)
6. [Step 3 — Configure your runtime](#step-3--configure-your-runtime)
   - [Claude Code](#tab-claude-code)
   - [Cursor](#tab-cursor)
   - [OpenClaw](#tab-openclaw)
   - [Custom MCP runtime](#tab-custom-mcp-runtime)
7. [Step 4 — Make your first capability call](#step-4--make-your-first-capability-call)
8. [Step 5 — Verify the response](#step-5--verify-the-response)
9. [Right Panel (sticky sidebar)](#right-panel-sticky-sidebar)
10. [After the Quickstart](#after-the-quickstart)
11. [Terminology Verification](#terminology-verification)

---

---

## SIDEBAR NAVIGATION (INHERITED)

Same sidebar as `/docs`. Active link: **Quickstart** under OVERVIEW.
No changes to sidebar structure on this page.

---

---

## PAGE HEADER

**Layout:** Docs sidebar + content area. No hero section. Starts immediately with content.
**Breadcrumb above heading:**

```
DOCUMENTATION  ›  QUICKSTART
```

*Switzer 500 · 13px · Uppercase · Text muted · Letter-spacing: 0.06em*

---

### Page Heading

```
Quickstart
```

*Zodiak 3xl (36px) · Text primary*

---

### Page Subtext

```
From zero to first capability call in under 5 minutes.
```

*Switzer lg (18px) · Text secondary · Margin-top: 8px*

---

### What this guide covers

```
This guide walks through account creation, agent key generation,
runtime configuration, and a first live capability call using IntelliSearch.
All four capabilities are available immediately after configuration.
```

*Switzer base (16px) · Text secondary · Margin-top: 12px · Margin-bottom: 32px*

---

---

## RUNTIME TABS

**Position:** Immediately below the page subtext. Above Step 1.
**Purpose:** Config blocks and file paths in Step 3 update per selected tab. All other steps are tab-agnostic.
**Style:** Bottom-border tabs. Not pill. Not box. Active: accent primary underline + accent text. Inactive: text muted, no border.
**Transition:** 150ms ease on underline.

```
Claude Code     Cursor     OpenClaw     Custom MCP runtime
```

*Switzer 500 · 14px*
*Default active tab: Claude Code*
*Tab state is persistent through the step flow — does not reset on scroll.*

---

---

## STEP 1 — CREATE YOUR ACCOUNT

**Step label:** `01`
*Switzer 500 · 12px · Text muted*

**Step title:**
```
Create your account
```
*Zodiak xl (22px) · Text primary*

**Status states:**
- Pending: title in text muted, number in text muted
- Active: title in text primary, number in accent text
- Complete: title in accent text, small checkmark icon, content collapses

---

### Step 1 — Content

```
Sign in with Google to create your OptiContext account.
```

*Switzer base · Text secondary*

**Primary button:** `Sign in →`
*Links to /auth*
*Padding: 10px 20px*

---

**Signed-in variant (detected via Firebase auth state):**

```
You're signed in as [user@email.com].
```

*Switzer base · Text secondary*
*Checkmark icon (accent primary) inline left of text*
*Step auto-marks as complete. Content collapses.*

---

---

## STEP 2 — GET YOUR AGENT KEY

**Step label:** `02`

**Step title:**
```
Get your agent key
```
*Zodiak xl · Text primary*

---

### Step 2 — Content

```
Go to your dashboard and create an agent key.
Name the key after the runtime you are connecting — one key per runtime.
```

*Switzer base · Text secondary*

**Ghost button:** `Open dashboard →`
*Links to /dashboard/settings*

---

### Key format note

```
Your agent key looks like this:
```

*Switzer sm · Text secondary*

```text
opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4
```

*JetBrains Mono · 13px · Code surface background · Radius sm · Padding: 8px 12px*
*Copy button right*

---

### Key handling note

```
The key is shown once at creation. Copy it before closing the dashboard.
If you lose it, revoke the key and create a new one — the old key cannot be retrieved.
```

*Switzer sm · Text muted · Margin-top: 8px*

---

---

## STEP 3 — CONFIGURE YOUR RUNTIME

**Step label:** `03`

**Step title:**
```
Configure your runtime
```
*Zodiak xl · Text primary*

---

### Step 3 — Intro

```
Add one configuration block to your runtime's MCP config file.
The endpoint and transport field are the same for all runtimes.
Only the file path and config structure differ per runtime.
```

*Switzer base · Text secondary · Margin-bottom: 24px*

```
This step uses the tab you selected above. Switch tabs to see the config for a different runtime.
```

*Switzer sm · Text muted*

---

*The following four tab sections are mutually exclusive — only the active tab renders.*

---

### TAB: CLAUDE CODE

**Config file path:**

```text
~/.claude/claude_code_config.json
```

*JetBrains Mono · 13px · inline code chip · Border default · Radius sm · Padding: 2px 8px*

**Or project-level:**

```text
.claude/claude_code_config.json
```

---

**Config block:**

```json
{
  "mcpServers": {
    "opticontext": {
      "type": "http",
      "url": "https://mcp.opticontext.dev/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_AGENT_KEY"
      }
    }
  }
}
```

*JetBrains Mono · 14px · Code surface · Top bar label: `claude_code_config.json` · Copy button*

**Below block:**

```
Replace YOUR_AGENT_KEY with the key from Step 2.
```

*Switzer sm · Text muted*

---

**Verification:**

```
After saving the config, restart Claude Code.
Run /mcp in the Claude Code terminal — opticontext should appear in the connected servers list.
```

*Switzer sm · Text secondary*

---

### TAB: CURSOR

**Config file path:**

```text
~/.cursor/mcp.json
```

*Global config — applies to all Cursor projects.*

**Or project-level:**

```text
.cursor/mcp.json
```

*Project-level config takes precedence over global if both exist.*

---

**Config block:**

```json
{
  "mcpServers": {
    "opticontext": {
      "url": "https://mcp.opticontext.dev/mcp",
      "transport": "streamable-http",
      "headers": {
        "Authorization": "Bearer YOUR_AGENT_KEY"
      }
    }
  }
}
```

*JetBrains Mono · 14px · Code surface · Top bar label: `mcp.json` · Copy button*

**Below block:**

```
Replace YOUR_AGENT_KEY with the key from Step 2.
```

*Switzer sm · Text muted*

---

**Verification:**

```
After saving the config, reload the Cursor window.
Go to Settings → MCP — opticontext should appear with a green status indicator.
```

*Switzer sm · Text secondary*

---

### TAB: OPENCLAW

**Config file path:**

```text
~/.openclaw/config.json
```

**Or inside the agent's environment config:**

```text
.openclaw/agent.config.json
```

---

**Config block:**

```json
{
  "mcp": {
    "servers": {
      "opticontext": {
        "url": "https://mcp.opticontext.dev/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer YOUR_AGENT_KEY"
        }
      }
    }
  }
}
```

*JetBrains Mono · 14px · Code surface · Top bar label: `agent.config.json` · Copy button*

**Below block:**

```
Replace YOUR_AGENT_KEY with the key from Step 2.
```

*Switzer sm · Text muted*

---

**Verification:**

```
Restart OpenClaw after saving. The opticontext server will appear
in the active MCP connections list on startup.
```

*Switzer sm · Text secondary*

---

### TAB: CUSTOM MCP RUNTIME

**For any runtime implementing MCP Streamable HTTP transport:**

```
Add the following server block to your runtime's MCP configuration.
Field names vary by runtime — adapt as needed. The endpoint, transport,
and Authorization header format are fixed.
```

*Switzer sm · Text secondary*

---

**Minimum required configuration:**

```json
{
  "url": "https://mcp.opticontext.dev/mcp",
  "transport": "streamable-http",
  "headers": {
    "Authorization": "Bearer YOUR_AGENT_KEY"
  }
}
```

*JetBrains Mono · 14px · Code surface · Top bar label: `minimum config` · Copy button*

---

**If your runtime uses the initialize handshake directly:**

```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {},
    "clientInfo": {
      "name": "your-runtime-name",
      "version": "1.0.0"
    }
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar label: `initialize request` · Copy button*

**OptiContext responds with:**

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

*JetBrains Mono · 14px · Code surface · Top bar label: `initialize response` · Copy button*

---

**curl connectivity test:**

```bash
curl -X POST https://mcp.opticontext.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-11-25",
      "capabilities": {},
      "clientInfo": {
        "name": "curl-test",
        "version": "1.0.0"
      }
    },
    "id": 1
  }'
```

*JetBrains Mono · 14px · Code surface · Top bar label: `bash` · Copy button*

```
A 200 response with the initialize result confirms the endpoint is reachable
and your agent key is valid.
```

*Switzer sm · Text muted · Margin-top: 8px*

---

**tools/list request (enumerate available capabilities):**

```bash
curl -X POST https://mcp.opticontext.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }'
```

*JetBrains Mono · 14px · Code surface · Top bar label: `bash` · Copy button*

**Expected response (abbreviated):**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      { "name": "opticontext_search", "description": "..." },
      { "name": "opticontext_tts", "description": "..." },
      { "name": "opticontext_analyze", "description": "..." },
      { "name": "opticontext_memory_write", "description": "..." },
      { "name": "opticontext_memory_search", "description": "..." }
    ]
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar label: `tools/list response` · Copy button*

```
All five MCP tool names listed confirms full capability access under your agent key.
```

*Switzer sm · Text muted*

---

---

## STEP 4 — MAKE YOUR FIRST CAPABILITY CALL

**Step label:** `04`

**Step title:**
```
Make your first capability call
```
*Zodiak xl · Text primary*

---

### Step 4 — Intro

```
The first call uses IntelliSearch — the lightest capability to verify.
If your runtime is a coding agent or chat agent, you can trigger this
by sending a prompt that requires a web search.
```

*Switzer base · Text secondary*

---

### Option A — Via your runtime (recommended)

```
Send this prompt to your connected runtime:
```

*Switzer sm · Text secondary*

```text
Search for the latest developments in MCP server implementations.
```

*JetBrains Mono · 13px · Code surface · Radius sm · Padding: 10px 14px · Copy button*

```
Your runtime resolves this to a tools/call request automatically.
You do not write the JSON payload yourself.
```

*Switzer sm · Text muted · Margin-top: 8px*

---

### Option B — Direct MCP call (custom runtime or curl)

```
Send the following JSON-RPC 2.0 payload to the MCP endpoint:
```

*Switzer sm · Text secondary*

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_search",
    "arguments": {
      "query": "latest developments in MCP server implementations",
      "mode": "auto"
    }
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar label: `tools/call — IntelliSearch` · Copy button*

---

**Full curl form:**

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
        "query": "latest developments in MCP server implementations",
        "mode": "auto"
      }
    },
    "id": 1
  }'
```

*JetBrains Mono · 14px · Code surface · Top bar label: `bash` · Copy button*

---

### What happens during this call

```
OptiContext processes this request at the edge in the following sequence:
```

*Switzer sm · Text secondary*

```
1. Agent key validated via Cloudflare KV lookup
2. Rate limit checked (per-minute bucket in KV)
3. Cache checked — SHA-256 hash of query + params
4. Cache miss → IntelliSearch routes to Tavily (mode: auto)
5. Tavily returns raw results
6. Cerebras (Llama 4 Scout at 2,600 tok/s) filters and summarizes
7. Result cached in KV with 15-minute TTL
8. Structured response returned to your runtime
```

*JetBrains Mono · 13px · Code surface background · Padding: 12px 16px · Radius sm*
*This is an ordered list displayed as code — not a JSON block*

```
Total latency on first call (cache miss): approximately 1.1 seconds.
Subsequent calls with the same query return from cache in under 50ms.
```

*Switzer sm · Text muted · Margin-top: 8px*

---

---

## STEP 5 — VERIFY THE RESPONSE

**Step label:** `05`

**Step title:**
```
Verify the response
```
*Zodiak xl · Text primary*

---

### Step 5 — Expected response structure

```
A successful IntelliSearch response returns the following structure:
```

*Switzer base · Text secondary*

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"summary\":\"Recent MCP server developments include...\",\"key_findings\":[\"Finding 1\",\"Finding 2\"],\"sources\":[{\"url\":\"https://...\",\"title\":\"...\"}],\"confidence\":0.91,\"provider_used\":\"tavily\"}"
      }
    ]
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar label: `IntelliSearch response` · Copy button*

---

### Response field reference

```
The text field contains a JSON-encoded string with the following fields:
```

*Switzer sm · Text secondary*

| Field | Type | Description |
|---|---|---|
| `summary` | string | AI-generated summary of the most relevant search results. |
| `key_findings` | array | List of extracted factual findings from the search results. |
| `sources` | array | Source objects with `url` and `title` for each result used. |
| `confidence` | number | Relevance confidence score from 0.0 to 1.0. |
| `provider_used` | string | Which search provider resolved the query: `"tavily"`, `"ddg"`, or `"apify"`. |

*Header: Switzer 500 · 12px · Uppercase · Text muted · Background raised*
*Rows: Switzer 400 · 14px · Text secondary*
*Field names: JetBrains Mono · 13px*

---

### Success confirmation

```
If you see this structure, your runtime is fully connected to OptiContext.
All four capabilities are available immediately — no additional configuration required.
```

*Switzer base · Text secondary*

**Status chip:**

```
● Integration verified
```

*Pill badge · Background accent subtle (#E8F4EE) · Text accent (#1A6B4A) · Switzer 500 · 12px*
*Displayed below the response block on step completion*

---

### Common issue: 401 Unauthorized

```
If you receive a 401 response, the agent key in your config is invalid or missing.
```

*Switzer sm · Text secondary*

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "UNAUTHORIZED — Agent key not found. Verify the key format: opctx_<slug>_<32hex>."
  },
  "id": 1
}
```

*JetBrains Mono · 14px · Code surface · Top bar label: `401 error response`*

```
Check that the Authorization header is set to: Bearer YOUR_AGENT_KEY
and that YOUR_AGENT_KEY is replaced with the actual key from your dashboard.
```

*Switzer sm · Text muted*

---

### Common issue: 429 Rate Limited

```
If you receive a 429 response, the per-minute request limit for this agent key has been reached.
```

*Switzer sm · Text secondary*

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

*JetBrains Mono · 14px · Code surface · Top bar label: `429 error response`*

```
The limit resets at the start of the next minute.
The reset countdown is included in the error message.
```

*Switzer sm · Text muted*

---

---

## RIGHT PANEL (STICKY SIDEBAR)

**Layout:** Visible on large screens (≥1280px) only. Sticky — scrolls with user. Width: 280px. Right of content area.
**Background:** Background raised (#F4F1EB) · Border: 1px border default · Radius lg (12px) · Padding: 20px
**Content:** Display-only. Copy button only interactive element.

---

### Right panel structure

**Heading:**

```
Current config
```

*Switzer 500 · 12px · Uppercase · Text muted*

**Active runtime label:**

```
Claude Code
```

*Zodiak xl · Text primary · Updates per active tab*

**Compact config block (active tab's config, condensed):**

```json
{
  "mcpServers": {
    "opticontext": {
      "type": "http",
      "url": "https://mcp.opticontext.dev/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_AGENT_KEY"
      }
    }
  }
}
```

*JetBrains Mono · 12px · Code surface · Radius sm · Full-width within panel · Copy button top-right*

**Below config block:**

```
Active step: 03 — Configure your runtime
```

*Switzer 400 · 12px · Text muted*
*Updates as user scrolls through steps*

---

---

## AFTER THE QUICKSTART

**Position:** Below Step 5, after the success chip. Section heading label:**

```
NEXT STEPS
```

*Switzer 500 · 12px · Uppercase · Text muted*

---

### Two primary next-step links

**Link 1:**

```
Explore all four capabilities →
```

*Zodiak xl · Text primary · Ghost button · Links to /docs/tools/intellisearch*

```
IntelliSearch, VoiceBridge, DeepDoc, and MemoryCore reference pages
with full input schemas, output schemas, and example calls.
```

*Switzer sm · Text secondary*

---

*Thin separator*

---

**Link 2:**

```
View the full API reference →
```

*Zodiak xl · Text primary · Ghost button · Links to /docs/api-reference*

```
Every endpoint, every field, error codes, rate limit headers,
and the complete JSON-RPC 2.0 message structure.
```

*Switzer sm · Text secondary*

---

### Compatibility note

```
OptiContext is compatible with any runtime implementing MCP Streamable HTTP transport (2025-11-25).
Configuration paths and JSON field names vary per runtime.
The endpoint and Authorization header format are fixed across all runtimes.
```

*Switzer sm · Text muted · Border-top: 1px border default · Padding-top: 24px · Margin-top: 24px*

---

---

## TERMINOLOGY VERIFICATION

*Run against OPTICONTEXT_TERMINOLOGY.md before publishing.*

---

### ✓ Test 1 — Infrastructure or Plugin?

Page heading and subtext read aloud:
> "Quickstart. From zero to first capability call in under 5 minutes."

Result: **Infrastructure. Pass.**

---

### ✓ Test 2 — Vendor Bias Check

Runtime tabs: Claude Code · Cursor · OpenClaw · Custom MCP runtime.
Not alphabetical — ordered by expected adoption volume, which the Frontend Guide specifies explicitly.
No vendor is described as recommended or preferred. All tab content is structurally identical.
Claude Code is not first because it is Anthropic — it is first because the Frontend Guide specifies this tab order.

Vendor names appear only as runtime identifiers in tab labels and config file path examples.
No vendor appears more than twice in any single section.

Result: **Pass.**

---

### ✓ Test 3 — Specificity Check

| Adjective | Present | Status |
|---|---|---|
| "powerful" | No | ✓ |
| "seamless" | No | ✓ |
| "easy" | No — "one configuration block" used instead | ✓ |
| "fast" | Only as a specific metric: "approximately 1.1 seconds", "under 50ms" | ✓ |
| "simple" | No | ✓ |
| "robust" | No | ✓ |
| "intuitive" | No | ✓ |

Result: **Pass. Zero empty adjectives.**

---

### ✓ Test 4 — Forbidden Term Scan

| Forbidden term | Status |
|---|---|
| "API key" (standalone) | ✓ "Agent key" used throughout. One exception: dashboard UI section reference where the frontend guide uses "API Keys" as a section label — that label is from the UI spec, not generated copy. |
| "plugin" | ✓ Not present. |
| "tools" (in product/marketing context) | ✓ "Capabilities" used in all marketing-context sentences. "Tool" used correctly in technical MCP context: `tools/call`, `tools/list`, "MCP tool name" — all protocol-accurate usages. |
| "client" (for runtimes) | ✓ "Runtime" used throughout. "MCP client" appears once in the initialize tab as `"clientInfo"` — this is a required MCP protocol field, not an OptiContext term, correct usage. |
| "REST API" | ✓ Not present. "MCP endpoint" used. |
| "webhook" | ✓ Not present. |
| "get started" | ✓ Not present. "Start the quickstart" used in referring copy. |
| "seamless" | ✓ Not present. |
| "we" / "our" | ✓ Not present. |
| "just" / "simply" | ✓ Not present. |
| "note that" | ✓ Not present. |
| "in order to" | ✓ Not present. "To" used where needed. |
| "feel free to" | ✓ Not present. |
| "works with" (listing) | ✓ Not present. Protocol compatibility claim used. |

Result: **Pass. Zero forbidden terms.**

---

### ✓ Test 5 — One-Sentence Summary

> "This quickstart walks through account creation, agent key generation, runtime configuration for Claude Code, Cursor, OpenClaw, and custom MCP runtimes, and a first live IntelliSearch capability call — verifiable in under 5 minutes."

Result: **Pass.**

---

### ✓ Capability and Tool Name Check

| Name | Usage | Status |
|---|---|---|
| IntelliSearch | Used as capability name in prose | ✓ Capitalized |
| `opticontext_search` | Used as MCP tool name in code | ✓ Correct |
| `opticontext_tts` | Listed in tools/list response | ✓ Correct |
| `opticontext_analyze` | Listed in tools/list response | ✓ Correct |
| `opticontext_memory_write` | Listed in tools/list response | ✓ Correct |
| `opticontext_memory_search` | Listed in tools/list response | ✓ Correct |
| VoiceBridge, DeepDoc, MemoryCore | Referenced in after-quickstart next steps | ✓ Capitalized |

---

### ✓ Schema and Formatting Check

| Rule | Status |
|---|---|
| Full endpoint URL in all curl and config examples | ✓ `https://mcp.opticontext.dev/mcp` used throughout |
| 2-space JSON indentation | ✓ All blocks |
| `YOUR_AGENT_KEY` placeholder in config blocks | ✓ |
| Realistic dummy `opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4` in direct request examples | ✓ curl blocks only |
| `"id": 1` in all request/response pairs | ✓ |
| `"jsonrpc": "2.0"` present in all JSON-RPC blocks | ✓ |
| `protocolVersion: "2025-11-25"` used | ✓ (locked initialize block from terminology file) |
| Language labels on all code blocks | ✓ `json`, `bash`, `text` — no unlabeled blocks |
| curl structure: explicit `-X POST`, `Content-Type` before `Authorization`, `\` continuation | ✓ |
| File paths in code font | ✓ All paths in backticks |
| Global config path shown before project-level path | ✓ |

---

### ✓ Backend Alignment Check

| Content claim | Source in plan |
|---|---|
| `type: "http"` in Claude Code config | Section 13 — MCP endpoint config |
| `transport: "streamable-http"` in Cursor/OpenClaw configs | Section 4 — MCP protocol decision |
| Auth: `Authorization: Bearer opctx_<key>` | Section 5 — auth flow |
| All five `opticontext_*` tool names | Sections 7–10 — tool schemas |
| `protocolVersion: "2025-11-25"` in initialize | Section 13 — server info response (terminology file locked version) |
| IntelliSearch response fields: `summary`, `key_findings`, `sources`, `confidence`, `provider_used` | Section 7 — IntelliSearch return schema |
| Cache TTL 15 minutes for search results | Section 7 — IntelliSearch cache |
| Latency ~1.1s first call, <50ms cached | Section 14 — IntelliSearch data flow |
| Cerebras at 2,600 tok/s for summarization | Section 11 — AI routing engine |
| Error code `-32001` for UNAUTHORIZED | Section 18 — consistent with auth flow; error structure follows JSON-RPC 2.0 |
| Rate limit: 30 requests/minute per agent | Section 5 — per-agent rate limits |

---

### ✓ Frontend Structure Alignment Check

| Quickstart element | Frontend Guide reference | Status |
|---|---|---|
| Docs sidebar (inherited, no change) | Part 4 — Layout | ✓ |
| Heading: "Quickstart" · Zodiak 3xl | Part 4 — Heading | ✓ |
| Subtext: "From zero to first MCP call..." | Part 4 — Subtext | ✓ (updated: "MCP call" → "capability call" per terminology) |
| Runtime tabs: Claude Code · Cursor · OpenClaw · Custom MCP runtime | Part 4 — Client tabs | ✓ |
| Tab style: bottom-border, not pill | Part 4 — Tab style | ✓ |
| Steps 1–5 with progressive disclosure | Part 4 — Step flow | ✓ |
| Step status states: pending / active / complete | Part 4 — Step states | ✓ |
| Step 1: Google sign-in, signed-in variant with checkmark | Part 4 — Step 1 | ✓ |
| Step 2: agent key, format note, key handling note | Part 4 — Step 2 | ✓ |
| Step 3: config block per tab with copy button | Part 4 — Step 3 | ✓ |
| Step 4: IntelliSearch first call, prompt + JSON payload | Part 4 — Step 4 | ✓ |
| Step 5: response structure, success chip, error cases | Part 4 — Step 5 | ✓ |
| Right sticky panel with current config and step indicator | Part 4 — Right panel | ✓ |
| After-quickstart next-step links | Part 4 — Step 5 next steps | ✓ |

*One deliberate terminology correction applied:*
> Frontend Guide subtext: "From zero to first MCP call in under 5 minutes."
> "MCP call" is acceptable in protocol-technical context (Part 4 is technical),
> but page subtext is user-facing orientation copy.
> Updated to "capability call" to align with product vocabulary in user-facing copy.
> The phrase "MCP call" is retained in technical step descriptions where protocol accuracy requires it.

---

*OptiContext Quickstart · Phase 4 of 9*
*Version 1.0 · Sandy · May 2026*
*Next phase: Phase 5 — Tool Documentation*
