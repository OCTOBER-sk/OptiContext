# OptiContext — Phase 3: Docs Home Content
## Production Copy · `/docs` Route · All Sections Complete
### Version 1.0 · Sandy · May 2026

---

> **Source-of-truth alignment:**
> Generated from OPTICONTEXT_PLAN__4_.md (backend), OPTICONTEXT_FRONTEND_GUIDE.txt (Part 3 — Docs Home),
> and OPTICONTEXT_TERMINOLOGY.md (language contract).
> This is not a marketing page. It is the documentation entry layer.
> Tone: technical, neutral, complete. Orientation over promotion.

---

## TABLE OF CONTENTS

1. [Sidebar Navigation](#sidebar-navigation)
2. [Page Header](#page-header)
3. [Search Bar](#search-bar)
4. [Start Here Block](#start-here-block)
5. [Section Index — Authentication](#section-index--authentication)
6. [Section Index — Transport](#section-index--transport)
7. [Section Index — IntelliSearch](#section-index--intellisearch)
8. [Section Index — VoiceBridge](#section-index--voicebridge)
9. [Section Index — DeepDoc](#section-index--deepdoc)
10. [Section Index — MemoryCore](#section-index--memorycore)
11. [Section Index — API Reference](#section-index--api-reference)
12. [Section Index — Limits](#section-index--limits)
13. [What Is OptiContext — Orientation Block](#what-is-opticontext--orientation-block)
14. [SEO Metadata](#seo-metadata)
15. [Terminology Verification](#terminology-verification)

---

---

## SIDEBAR NAVIGATION

**Layout:** 260px fixed left panel · Background raised (#F4F1EB) · Border-right: 1px border default
**Font:** Section labels — Switzer 600 · 11px · Uppercase · Letter-spacing: 0.06em · Text muted
**Font:** Links — Switzer 400 · 14px · Text secondary
**Active link:** 3px left border accent primary · Background accent subtle · Text accent · Radius: 0 4px 4px 0 (right side only)
**Hover link:** Text primary · No background change

---

### Sidebar Structure

```
OVERVIEW
  Introduction              → /docs
  Quickstart                → /docs/quickstart

CAPABILITIES
  IntelliSearch             → /docs/tools/intellisearch
  VoiceBridge               → /docs/tools/voicebridge
  DeepDoc                   → /docs/tools/deepdoc
  MemoryCore                → /docs/tools/memorycore

REFERENCE
  API Reference             → /docs/api-reference
  Authentication            → /docs/api-reference#authentication
  Transport                 → /docs/api-reference#transport
  Error Codes               → /docs/api-reference#errors
  Rate Limits               → /docs/api-reference#limits
```

*Section label copy:*
- `OVERVIEW` — not "Getting Started", not "Guides"
- `CAPABILITIES` — not "Tools", not "Features", not "Modules"
- `REFERENCE` — not "API Docs", not "Technical Reference"

*Active page: `/docs` sets "Introduction" as active link.*

---

---

## PAGE HEADER

**Layout:** No top hero. Starts immediately with content. No full-viewport section.
**Top of content area — stacked vertically, tight spacing.**

---

### Breadcrumb

```
DOCUMENTATION
```

*Switzer 500 · 13px · Uppercase · Letter-spacing: 0.06em · Text muted*
*Static — no link. This is the root docs page.*

---

### Page Heading

```
OptiContext Documentation
```

*Zodiak 3xl (36px) · Text primary · Margin-top: 8px*

---

### One-Line Descriptor

```
A production MCP server. One endpoint, four capabilities, one agent key.
```

*Switzer lg (18px) · Text secondary · Margin-top: 12px*
*This replaces the frontend guide's "four tools" with "four capabilities" per terminology contract.*

---

---

## SEARCH BAR

**Position:** Immediately below the one-line descriptor. Before any content sections.
**This is the highest-priority UI element on this page.**

---

### Visual Spec

```
[ 🔍  Search documentation...                              ⌘K ]
```

*Full width of content area*
*Background: background raised (#F4F1EB)*
*Border: 1px solid border default (#E2DED5)*
*Radius: md (8px)*
*Padding: 12px 16px*
*Font: Switzer 400 · 16px · Text muted (placeholder)*
*Magnifier icon: left, 16px, text muted*
*Keyboard shortcut: right-aligned, Switzer 400, 12px, text muted, `⌘K`*
*Focus state: border switches to accent primary (#1A6B4A) · Subtle bloom (box-shadow: 0 0 0 3px accent-subtle)*
*Margin-top: 24px · Margin-bottom: 40px*

---

---

## START HERE BLOCK

**Label:** `START HERE`
*Switzer 500 · 12px · Uppercase · Letter-spacing: 0.06em · Text muted*
*Margin-bottom: 16px*

Two entry points. Presented as clean text blocks with a ghost button each.
No cards. No boxes. Thin separator between entries.

---

### Entry 1 — Quickstart Guide

```
Quickstart guide
```
*Zodiak xl (22px) · Text primary · Links to /docs/quickstart*

```
Go from zero to first capability call in under 5 minutes.
```
*Switzer sm (14px) · Text secondary*

**Ghost button:** `Start the quickstart →`
*Links to /docs/quickstart*

---

*Thin separator: 1px solid border default*

---

### Entry 2 — API Reference

```
API reference
```
*Zodiak xl (22px) · Text primary · Links to /docs/api-reference*

```
Full endpoint contract, capability schemas, and error codes.
```
*Switzer sm (14px) · Text secondary*

**Ghost button:** `View API reference →`
*Links to /docs/api-reference*

---

*Section separator: margin-top 48px*

---

---

## SECTION INDEX — AUTHENTICATION

*Section heading label (above this group):*

```
DOCUMENTATION
```
*Switzer 500 · 12px · Uppercase · Text muted · Margin-bottom: 16px*

---

```
Authentication
```
*Zodiak xl (22px) · Text primary · Clickable — links to /docs/api-reference#authentication*

```
How OptiContext issues and validates agent keys.
Agent key format, the KV-based auth fast path, Firebase Auth for the dashboard,
per-agent permission scopes, and key lifecycle management.
```
*Switzer sm (14px) · Text secondary*

*Thin separator below*

---

---

## SECTION INDEX — TRANSPORT

```
Transport
```
*Zodiak xl · Text primary · Links to /docs/api-reference#transport*

```
Streamable HTTP transport over a single /mcp endpoint.
How POST and GET requests behave, session handling via Mcp-Session-Id,
streaming upgrades for long responses, and backward compatibility with HTTP+SSE.
```
*Switzer sm · Text secondary*

*Thin separator below*

---

---

## SECTION INDEX — INTELLISEARCH

```
IntelliSearch
```
*Zodiak xl · Text primary · Links to /docs/tools/intellisearch*

```
Web search with AI-enhanced dorking, multi-provider routing, and Cerebras summarization.
Covers the opticontext_search tool schema, search modes, dorking parameters,
provider fallback order, result structure, and usage limits.
```
*Switzer sm · Text secondary*

*Thin separator below*

---

---

## SECTION INDEX — VOICEBRIDGE

```
VoiceBridge
```
*Zodiak xl · Text primary · Links to /docs/tools/voicebridge*

```
TTS streaming across 48 voices and 8 languages via Unreal Speech.
Covers the opticontext_tts tool schema, voice IDs, audio formats,
platform delivery patterns for Telegram, Discord, and WhatsApp, and TTS cache behavior.
```
*Switzer sm · Text secondary*

*Thin separator below*

---

---

## SECTION INDEX — DEEPDOC

```
DeepDoc
```
*Zodiak xl · Text primary · Links to /docs/tools/deepdoc*

```
File analysis via Gemini's 2M token context window.
Covers the opticontext_analyze tool schema, the pre-upload flow via POST /upload,
supported file types, model routing logic, and the structured analysis output schema.
```
*Switzer sm · Text secondary*

*Thin separator below*

---

---

## SECTION INDEX — MEMORYCORE

```
MemoryCore
```
*Zodiak xl · Text primary · Links to /docs/tools/memorycore*

```
Persistent RAG memory backed by Supabase pgvector and Gemini embeddings.
Covers the opticontext_memory_write and opticontext_memory_search tool schemas,
the namespace system, similarity search parameters, and auto-summarization behavior.
```
*Switzer sm · Text secondary*

*Thin separator below*

---

---

## SECTION INDEX — API REFERENCE

```
API Reference
```
*Zodiak xl · Text primary · Links to /docs/api-reference*

```
Complete endpoint contract. Every route, every request field, every response field.
Includes /mcp, /upload, /health, /usage, and admin endpoints.
Error codes, rate limit headers, and JSON-RPC 2.0 message structure.
```
*Switzer sm · Text secondary*

*Thin separator below*

---

---

## SECTION INDEX — LIMITS

```
Limits
```
*Zodiak xl · Text primary · Links to /docs/api-reference#limits*

```
Per-capability rate limits, daily and monthly caps, budget guard thresholds,
and provider-level constraints. Includes reset schedules and fallback behavior
when any limit is approached.
```
*Switzer sm · Text secondary*

*Thin separator below*

---

---

## WHAT IS OPTICONTEXT — ORIENTATION BLOCK

**Position:** Below the section index. This block is the grounding context for first-time readers.
**Purpose:** Establish what OptiContext is, what it is not, and how it fits into the MCP ecosystem.
**Tone:** Technical, neutral, declarative. No promotional language.

---

### Block Heading

```
What is OptiContext
```

*Zodiak 2xl (28px) · Text primary*

---

### Body Text

*Switzer base (16px) · Text secondary · Line height 1.6 · Max-width: 680px*

---

**Paragraph 1 — What it is**

```
OptiContext is an MCP server deployed on Cloudflare Workers.
It implements Streamable HTTP transport as defined in the Model Context Protocol specification
and exposes four capabilities — IntelliSearch, VoiceBridge, DeepDoc, and MemoryCore —
through a single endpoint at https://mcp.opticontext.dev/mcp.
```

---

**Paragraph 2 — How it is accessed**

```
Any MCP-compatible runtime connects by adding one configuration block
pointing to the OptiContext MCP endpoint. Authentication uses a Bearer token
in the Authorization header — one agent key per runtime, issued from the dashboard.
No SDK. No vendor-specific wrapper. Protocol-native.
```

---

**Paragraph 3 — What it is not**

```
OptiContext is not a vendor-specific product. It does not require a specific runtime,
a specific agent framework, or a specific AI provider. It is runtime-agnostic by design —
the MCP specification is an open protocol, and any compliant runtime connects without modification.
```

---

**Paragraph 4 — Where to start**

```
If this is your first time here: start with the Quickstart.
If you are integrating a specific capability: go directly to that capability's reference page.
If you need the full endpoint contract: see the API Reference.
```

---

### Orientation Code Block

*A minimal, complete example of what "connected" looks like.*
*This is the only code block on the docs home page.*

```json
// Minimal runtime configuration — connects to all four capabilities

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

*JetBrains Mono · 14px · Code surface background (#1C1C1A)*
*Top bar label: `mcp.config.json` · Copy button top-right*
*Below block, Switzer sm · Text muted:*

```
Replace YOUR_AGENT_KEY with the key generated from your dashboard.
The endpoint and transport field do not change.
```

---

### Capability Summary Table

*A quick-reference table. Not for marketing — for orientation.*
*Table style: no outer border, rows only, background raised header.*

```
Capability          MCP Tool Name                   What it returns
─────────────────────────────────────────────────────────────────────────────
IntelliSearch       opticontext_search              Search summary, sources, key findings
VoiceBridge         opticontext_tts                 Audio URL or streaming chunks
DeepDoc             opticontext_analyze             Structured file analysis, file_id
MemoryCore (write)  opticontext_memory_write        memory_id, chunks_stored
MemoryCore (read)   opticontext_memory_search       Ranked memory entries, context block
```

*Header row: Switzer 500 · 12px · Uppercase · Text muted · Background raised*
*Data rows: Switzer 400 · 14px · Text secondary*
*MCP tool names: JetBrains Mono · 13px · Text primary*
*Thin bottom border on each row*

---

### MCP Handshake Reference (Collapsed by default on mobile)

*A brief note on the initialize flow. Not a full explainer — that lives in Transport docs.*

---

```
The MCP handshake
```
*Zodiak xl · Text primary*

```
When your runtime first connects, it sends an initialize request.
OptiContext responds with its server identity, protocol version, and declared capabilities.
```
*Switzer sm · Text secondary*

```json
// initialize response from OptiContext

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

*JetBrains Mono · 14px · Code surface*
*Top bar label: `initialize response` · Copy button*

```
After the handshake, your runtime may call tools/list to enumerate
available capabilities, then proceed with tools/call for each capability invocation.
```
*Switzer sm · Text secondary*

---

---

## SEO METADATA

```html
<!-- Title -->
<title>Documentation — OptiContext</title>

<!-- Meta description -->
<meta
  name="description"
  content="OptiContext documentation. A production MCP server with
  four capabilities — IntelliSearch, VoiceBridge, DeepDoc, and MemoryCore —
  on one endpoint. Quickstart, API reference, and capability schemas."
/>

<!-- Open Graph -->
<meta property="og:title" content="OptiContext Documentation" />
<meta
  property="og:description"
  content="MCP context infrastructure documentation.
  One endpoint. Four capabilities. Full reference for any MCP-compatible runtime."
/>
<meta property="og:url" content="https://opticontext.dev/docs" />
<meta property="og:type" content="website" />

<!-- Canonical -->
<link rel="canonical" href="https://opticontext.dev/docs" />

<!-- No index on internal hash anchors — canonical handles deduplication -->
```

---

---

## TERMINOLOGY VERIFICATION

*Run against OPTICONTEXT_TERMINOLOGY.md before publishing.*

---

### ✓ Test 1 — Infrastructure or Plugin?

Page heading and descriptor read aloud:
> "OptiContext Documentation. A production MCP server. One endpoint, four capabilities, one agent key."

Result: **Infrastructure. Pass.**

---

### ✓ Test 2 — Vendor Bias Check

Vendor names in page:
- Cloudflare Workers: mentioned once in orientation block (infrastructure fact)
- Supabase pgvector: mentioned once in MemoryCore section index (architecture fact)
- Gemini: mentioned once in DeepDoc and MemoryCore section indices (architecture fact)
- Unreal Speech: mentioned once in VoiceBridge section index (architecture fact)
- Cerebras: mentioned once in IntelliSearch section index (architecture fact)
- Firebase Auth: mentioned once in Auth section index (architecture fact)

No vendor mentioned more than once in any single section. No vendor placed first for non-alphabetical reasons.
Sidebar runtime list not present on this page (lives on landing and quickstart).

Result: **Pass.**

---

### ✓ Test 3 — Specificity Check

| Marketing adjective | Appears in page | Status |
|---|---|---|
| "powerful" | No | ✓ |
| "seamless" | No | ✓ |
| "fast" | No — "sub-5ms" not claimed on this page | ✓ |
| "easy" | No | ✓ |
| "robust" | No | ✓ |
| "intuitive" | No | ✓ |
| "cutting-edge" | No | ✓ |
| "best" | No | ✓ |

Result: **Pass. Zero empty adjectives.**

---

### ✓ Test 4 — Forbidden Term Scan

| Forbidden term | Status |
|---|---|
| "tools" (for capabilities in marketing context) | ✓ "Capabilities" used throughout marketing copy. "Tool" and "tool schema" used only in technical context (MCP tool names, capability table). |
| "API key" (standalone) | ✓ "Agent key" used throughout. |
| "plugin" | ✓ Not present. |
| "client" (for runtimes) | ✓ "Runtime" used throughout. "MCP client" not used on this page. |
| "REST API" | ✓ Not used. "MCP endpoint" and "Streamable HTTP transport" used. |
| "webhook" | ✓ Not used. |
| "for developers" | ✓ Not used. |
| "get started" | ✓ Not used. "Start the quickstart" used. |
| "we" / "our" | ✓ Not used. "OptiContext" used in all places. |
| "works with" (plural listing) | ✓ Not used. Compatibility claim uses protocol framing. |
| "Claude-first" | ✓ Not present. |
| "free tier" (as value prop) | ✓ Not used on this page. |
| "simply" / "just" | ✓ Not used. |
| "note that" | ✓ Not used. |
| "in order to" | ✓ Not used. "To" used where needed. |
| "leverage" / "utilize" | ✓ Not used. |
| "feel free to" | ✓ Not used. |

Result: **Pass. Zero forbidden terms.**

---

### ✓ Test 5 — One-Sentence Summary

> "OptiContext is a production MCP server implementing Streamable HTTP transport that exposes four protocol-native capabilities through a single endpoint, accessible to any MCP-compatible runtime via one agent key."

Completes: *"OptiContext is ______"* correctly.

Result: **Pass.**

---

### ✓ Capability Names Check

| Name | Used correctly |
|---|---|
| IntelliSearch | ✓ Capitalized. `opticontext_search` used for MCP tool name. Never "search tool" or "search feature." |
| VoiceBridge | ✓ Capitalized. `opticontext_tts` used for MCP tool name. Never "TTS tool." |
| DeepDoc | ✓ Capitalized. `opticontext_analyze` used for MCP tool name. Never "file tool." |
| MemoryCore | ✓ Capitalized. `opticontext_memory_write` / `opticontext_memory_search` used. Never "memory tool." |

---

### ✓ Schema and Endpoint Formatting Check

| Rule | Status |
|---|---|
| Full URL in all code examples | ✓ `https://mcp.opticontext.dev/mcp` used |
| 2-space JSON indentation | ✓ |
| `YOUR_AGENT_KEY` placeholder in config blocks | ✓ |
| Realistic dummy key (`opctx_myagent_...`) not used in config blocks | ✓ (config blocks use placeholder; direct request examples use dummy) |
| No relative paths in copy-ready snippets | ✓ |
| `protocolVersion` matches spec: `2025-11-25` | ✓ |
| All MCP tool names use correct `opticontext_` prefix | ✓ |

---

### ✓ Tone Consistency Check

| Section | Tone target | Result |
|---|---|---|
| Page header | Neutral, declarative | ✓ |
| Search bar | UI microcopy — placeholder only | ✓ |
| Start here block | Instructional, direct | ✓ |
| Section index entries | Technical, neutral, complete | ✓ |
| Orientation block | Technical, neutral, no marketing language | ✓ |
| Capability table | Reference — minimal prose | ✓ |
| MCP handshake block | Technical — contract language | ✓ |

Result: **Pass. Zero marketing language on a documentation page.**

---

### ✓ Backend Alignment Check

| Content claim | Backed by plan |
|---|---|
| Single endpoint `POST /mcp` | ✓ Section 13 of plan |
| Streamable HTTP transport | ✓ Section 4 of plan |
| `protocolVersion: "2025-11-25"` | ✓ Section 13 of plan (initialize response) |
| Five MCP tool names (`opticontext_search`, `opticontext_tts`, `opticontext_analyze`, `opticontext_memory_write`, `opticontext_memory_search`) | ✓ Sections 7–10 of plan |
| Firebase Auth for dashboard, KV for agent auth hot path | ✓ Section 5 of plan |
| Supabase pgvector for MemoryCore | ✓ Section 10 of plan |
| Gemini 2M token context window for DeepDoc | ✓ Section 9 of plan |
| Unreal Speech, 48 voices, 8 languages | ✓ Section 8 of plan |
| Cerebras for IntelliSearch summarization | ✓ Section 7 of plan |
| `/upload` pre-upload endpoint | ✓ Section 9 + Section 13 of plan |

---

### ✓ Frontend Structure Alignment Check

| Docs home element | Frontend Guide reference | Status |
|---|---|---|
| Sidebar structure and labels | Part 3 — Sidebar Content | ✓ (CAPABILITIES label used instead of TOOLS to match terminology contract) |
| Breadcrumb: DOCUMENTATION | Part 3 — Top of content area | ✓ |
| Heading: OptiContext Documentation | Part 3 — Heading | ✓ |
| One-line descriptor | Part 3 — Descriptor | ✓ (updated: "four tools" → "four capabilities" per terminology) |
| Search bar as highest-priority element | Part 3 — Search box | ✓ |
| Start here block with ghost buttons | Part 3 — Start here | ✓ |
| Section index with thin separators, no cards | Part 3 — Documentation sections | ✓ |
| No top hero section | Part 3 — Layout note | ✓ |

*One deliberate terminology correction applied:*
> Frontend Guide says "four tools" in the one-line descriptor.
> Terminology contract forbids "tools" in product/marketing context — "capabilities" required.
> Descriptor updated to "four capabilities" — this is the correct form per the language contract.

---

*OptiContext Docs Home Content · Phase 3 of 9*
*Version 1.0 · Sandy · May 2026*
*Next phase: Phase 4 — Quickstart*
