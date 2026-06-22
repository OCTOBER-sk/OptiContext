# OptiContext — Terminology & Language Contract
## Phase 1 of 9 · Permanent Foundation Document

> **Status: LOCKED after approval.**
> This document is the single source of truth for all language decisions across
> the OptiContext platform. Every piece of content — landing page, docs, quickstart,
> API reference, dashboard, error messages, microcopy — must conform to this file.
>
> If a word, phrase, or convention is not in this document, it does not exist yet.
> Add it here first. Then use it.

---

## Table of Contents

1. [Core Product Vocabulary](#1-core-product-vocabulary)
2. [Forbidden Terms & Replacements](#2-forbidden-terms--replacements)
3. [Tone & Voice Rules](#3-tone--voice-rules)
4. [Compatibility Language Rules](#4-compatibility-language-rules)
5. [Example & Schema Style Rules](#5-example--schema-style-rules)
6. [Error Message Voice Rules](#6-error-message-voice-rules)
7. [Microcopy Voice Rules](#7-microcopy-voice-rules)
8. [The Positioning Test](#8-the-positioning-test)

---

## 1. Core Product Vocabulary

These are the locked terms for OptiContext. Use them exactly as written.
Do not paraphrase them. Do not vary them for stylistic interest.
Consistency is the product's credibility.

---

### Product Identity Terms

| Term | Usage | Notes |
|---|---|---|
| **OptiContext** | Always written as one word, capital O, capital C. | Never "Opti Context", "opticontext", "OPTICONTEXT" in prose. All-caps only in URLs and code identifiers. |
| **MCP context infrastructure** | Primary category descriptor. | Use when describing what OptiContext *is*. |
| **edge-native MCP infrastructure** | Secondary category descriptor. | Use when emphasizing deployment architecture. |
| **context infrastructure** | Shortened category form. | Acceptable in body text after full form has been used once. |
| **the MCP ecosystem** | Refers to the full set of MCP-compatible runtimes. | Not "the Claude ecosystem", not "the AI tools ecosystem." |
| **the agentic ecosystem** | Broader framing — all AI agent systems, MCP-native and beyond. | Use sparingly. Reserve for landing page and high-level positioning. |
| **context routing** | What OptiContext does to requests internally. | "Context routing for MCP runtimes." |
| **context delivery** | The outcome OptiContext provides. | "Fast, reliable context delivery at the edge." |

---

### Key Operational Terms

| Term | Definition | Do Not Say |
|---|---|---|
| **agent key** | The authentication credential issued per agent or runtime. Format: `opctx_<slug>_<32hex>` | "API key", "token", "access key", "secret key" |
| **capability** | One of the four functional primitives: IntelliSearch, VoiceBridge, DeepDoc, MemoryCore. | "tool", "feature", "plugin", "extension", "module" |
| **runtime** | Any MCP-compatible system that connects to OptiContext. | "client", "user", "app", "application", "integration" |
| **MCP endpoint** | `POST /mcp` — the single entry point for all capability calls. | "API endpoint" (acceptable in API reference only as secondary term), "webhook" |
| **namespace** | A logical partition within MemoryCore for organizing memories. | "folder", "bucket", "category", "tag" |
| **capability call** | A single invocation of one capability via the MCP endpoint. | "API call", "request", "tool call" (acceptable in technical MCP context only) |
| **agent session** | A stateful interaction tracked by `Mcp-Session-Id`. | "user session", "connection" |
| **budget guard** | Automatic provider-switching logic triggered before free tier limits. | "failover", "fallback only" (it is proactive, not reactive) |
| **per-agent isolation** | Each agent key is independent — revocable, trackable, scoped. | "per-user isolation", "sandboxing" |
| **the edge** | Cloudflare Workers' globally distributed compute layer. | "the cloud", "the server", "CDN" |

---

### Capability Names (Exact)

These four names are proper nouns. Always capitalized. Never modified with adjectives.

| Capability | Full Name | MCP Tool Name | Never Say |
|---|---|---|---|
| Search | **IntelliSearch** | `opticontext_search` | "search tool", "web search capability", "the search feature" |
| Voice | **VoiceBridge** | `opticontext_tts` | "TTS tool", "voice tool", "speech feature", "text-to-speech capability" |
| File analysis | **DeepDoc** | `opticontext_analyze` | "file tool", "document tool", "analysis feature", "the PDF thing" |
| Memory | **MemoryCore** | `opticontext_memory_write` / `opticontext_memory_search` | "memory tool", "memory feature", "RAG tool", "the memory thing" |

---

### Infrastructure Terms

| Term | Meaning | Notes |
|---|---|---|
| **Cloudflare Workers** | The compute runtime OptiContext runs on. | Spell out fully on first use per page. "Workers" acceptable after. |
| **Cloudflare KV** | Key-value store used for auth hot path and caching. | "CF KV" acceptable in technical docs. Never just "KV." |
| **Cloudflare R2** | Object storage for file uploads and TTS audio cache. | "CF R2" acceptable in technical docs. |
| **Supabase pgvector** | Vector store powering MemoryCore. | Do not say "Postgres" alone when referring to MemoryCore's storage. |
| **Cerebras** | Fast inference provider (Llama 4 Scout, Qwen3). Used for summarization and filtering. | Never describe as "the AI" or "the model." Always "Cerebras" or "Cerebras inference." |
| **Gemini** | Google's model used for DeepDoc and embeddings. | Refer to specific model variants in technical docs. "Gemini" alone acceptable in marketing. |
| **Unreal Speech** | TTS provider powering VoiceBridge. | Full name on first use per page. |
| **Streamable HTTP** | The MCP transport OptiContext uses. | Always "Streamable HTTP transport." Never just "HTTP." Never "REST." |
| **JSON-RPC 2.0** | The message format within MCP. | Always hyphenated. Always "2.0." |

---

### Spec & Protocol References

| Reference | Correct Form | Notes |
|---|---|---|
| MCP protocol version | MCP 2025-11-25 | This is the current stable spec. Use full date-string format. |
| MCP specification | "the Model Context Protocol specification" (full), "the MCP spec" (short) | Never "the MCP standard" — it is a specification, not a ratified standard. |
| Protocol compliance | "implements MCP Streamable HTTP transport" | Never "supports MCP", "MCP-enabled", "MCP-powered" — these are vague. |
| MCP initialize | `initialize` (code), "the MCP handshake" (prose) | Never "the greeting", "the connection step." |

---

## 2. Forbidden Terms & Replacements

These terms must not appear anywhere on the OptiContext platform.
Each has an approved replacement.

### Positioning Terms

| Forbidden | Why | Use Instead |
|---|---|---|
| "AI toolset" | Implies a collection of disconnected utilities. | "context infrastructure" |
| "MCP helper" | Implies a secondary, assistive role. | "MCP context infrastructure" |
| "developer utilities" | Implies personal scripts, not infrastructure. | "context capabilities" |
| "coding assistant plugin" | Wrong category entirely. | "MCP-compatible runtime integration" |
| "Claude plugin" | Vendor-locked, wrong category. | "MCP integration" |
| "Cursor extension" | Wrong. OptiContext is not an extension. | "MCP integration" |
| "AI wrapper" | Implies thin layer with no architecture. OptiContext has a full architecture. | "MCP infrastructure layer" |
| "tool collection" | Implies a menu of features, not a unified system. | "infrastructure capabilities" |
| "for developers" | Too narrow — agents themselves are callers, not just developers. | "for agents and the developers who build them" |
| "get started" (CTA) | Generic. Does not match OptiContext's precision voice. | "Get your agent key" or "Start the quickstart" |
| "powerful" | Empty adjective. | State the specific capability instead. |
| "seamless" | Empty adjective. | Describe the actual integration behavior. |
| "cutting-edge" | Marketing filler. | Name the specific technical advantage. |
| "robust" | Marketing filler. | Name the specific reliability property. |
| "intuitive" | Means nothing in technical infrastructure. | Remove entirely or describe the behavior. |
| "easy" | Condescending and imprecise. | "One configuration line", "under 5 minutes." Use specifics. |

### Technical Terms

| Forbidden | Why | Use Instead |
|---|---|---|
| "API key" (standalone) | Too generic — must be qualified. | "agent key" in product context; "API key" only in generic technical comparisons. |
| "tools" (for capabilities) | Correct MCP terminology, but "capabilities" is used for product positioning. | "capabilities" in marketing; "MCP tools" or "tool schemas" only in API reference/technical docs. |
| "client" (for runtimes) | Implies passive consumption. Runtimes are active callers. | "runtime" in product context; "MCP client" only in protocol-technical explanations. |
| "plugin" | Wrong architecture category. | "MCP integration", "runtime configuration" |
| "webhook" (for MCP endpoint) | Incorrect protocol reference. Webhooks are push; MCP is pull/request. | "MCP endpoint", "the `/mcp` endpoint" |
| "REST API" | OptiContext does not implement REST. It implements MCP over Streamable HTTP. | "MCP endpoint", "Streamable HTTP transport" |
| "microservice" (for OptiContext) | Underframes the product. | "infrastructure layer", "MCP server" |
| "the server" (generic) | Ambiguous in multi-service context. | "the OptiContext edge server", "the MCP endpoint" |
| "free tier" (as primary value prop) | Positions OptiContext as cheap, not capable. Cost is secondary. | Use "zero infrastructure cost" only in the trust block. Never in hero or capability descriptions. |

### Ecosystem Terms

| Forbidden | Why | Use Instead |
|---|---|---|
| "Claude-first" | Vendor bias. | Never use. |
| "for Claude" | Implies exclusivity. | "compatible with Claude Code and any MCP runtime" |
| "OpenAI-compatible" | Implies an OpenAI origin or dependency. OptiContext is protocol-native, not vendor-compatible. | "MCP-compatible" |
| "Anthropic ecosystem" | Vendor framing. | "the MCP ecosystem" |
| "supported clients" | "Clients" is discouraged; "supported" implies passive listing. | "compatible runtimes" |
| "works with" (plural, listing) | Too casual for infrastructure. | "compatible with" or "implements MCP, so any MCP-compatible runtime connects without modification" |

---

## 3. Tone & Voice Rules

OptiContext's voice is the voice of a well-built instrument.
It is precise, direct, and calm. It does not oversell. It does not over-explain.

### The Four Voice Properties

**1. Precise**
Every sentence says exactly one thing.
If a sentence could be cut in half without losing meaning, cut it.

Good: "IntelliSearch filters and summarizes results before returning them to your runtime."
Bad: "IntelliSearch is an incredibly powerful search capability that uses advanced AI to intelligently filter and summarize web search results so your agent gets clean, relevant information."

**2. Direct**
Lead with the fact. Not the context, not the framing, not the caveat.

Good: "Your runtime calls `POST /mcp` with a JSON-RPC 2.0 payload."
Bad: "In order to make a capability call, the first thing your runtime will need to do is send a request to the MCP endpoint."

**3. Calm**
No exclamation points in docs or dashboard copy. No hype language.
Confidence comes from accuracy, not from emphasis.

Good: "OptiContext is deployed on Cloudflare Workers across 300+ global points of presence."
Bad: "OptiContext is BLAZING FAST with 300+ global PoPs!!!"

**4. Grounded**
Make claims you can back up with specifics. If you can't name the number, don't make the claim.

Good: "Sub-5ms cold starts on Cloudflare Workers V8 isolates."
Bad: "Lightning-fast performance."

---

### Context-Specific Tone

| Context | Tone | Example |
|---|---|---|
| Landing page hero | Confident, declarative. Short sentences. | "Context infrastructure for every agent." |
| Landing page body | Explanatory but not verbose. 2–3 sentences max per point. | "IntelliSearch combines three search providers with AI-powered dorking..." |
| Docs | Technical, neutral, complete. No marketing language. | "The `/mcp` endpoint accepts POST requests with a JSON-RPC 2.0 payload." |
| Quickstart | Instructional, direct. Step → result. | "Add the following to your runtime's MCP configuration." |
| API reference | Contract language. Minimal prose. Tables and code blocks primary. | "Returns: `{ summary, key_findings[], answer, file_id, confidence }`" |
| Dashboard labels | Ultra-short. Noun phrases. No verbs unless action. | "Agent key", "Daily usage", "Last seen" |
| Error messages | Honest, specific, actionable. Never alarming. | "Rate limit reached for IntelliSearch. Resets in 47 seconds." |
| Microcopy | One phrase. Max 6 words. | "Copied.", "Key revoked.", "Saved." |
| Destructive actions | Specific and sober. State exactly what will be lost. | "Revoke this key? Any runtime using it will lose access immediately. This cannot be undone." |

---

### What OptiContext Never Says

- "We" (OptiContext is a product, not a company. Use "OptiContext" or passive voice.)
- "Our" (same reason)
- "Please" (in error messages or docs — it adds no information and softens technical precision)
- "Simply" or "just" (condescending in technical writing)
- "Note that" (weak preamble — lead with the fact instead)
- "In order to" (always replaceable with "To")
- "Leverage" (use "use")
- "Utilize" (use "use")
- "Prior to" (use "before")
- "At this time" (use "currently" or restructure)
- "Feel free to" (remove entirely — it adds nothing)

---

## 4. Compatibility Language Rules

This section governs every claim about ecosystem and runtime compatibility.
These rules are permanent and apply to landing copy, docs, quickstart, and any future content.

---

### The Core Compatibility Claim

**Approved primary compatibility statement:**
> "Any MCP-compatible runtime connects to OptiContext without modification."

This statement is accurate and defensible because:
- OptiContext implements Streamable HTTP, the current MCP transport spec
- Any runtime implementing the same spec can connect
- No runtime-specific adapter, SDK, or wrapper is required

**Never say:**
> "OptiContext works with [list]."

The list approach is always incomplete, always becomes outdated, and implies that unlisted runtimes do not work. The protocol claim is stronger and permanently accurate.

---

### Vendor Neutrality Rules

**Rule 1: No visual or textual hierarchy among runtimes.**
When listing compatible runtimes, always list them alphabetically or by adoption — never by vendor prestige.

Alphabetical order for the ecosystem section:
```
Amazon Q · Claude Code · Cline · Codex · Continue · Cursor ·
GitHub Copilot · Hermes · Kilo Code · OpenClaw · OpenCode ·
Windsurf · Zed · Custom MCP runtimes
```

**Rule 2: Anthropic products are not listed first.**
Claude Code is listed under C, not at position 1 because it is from Anthropic.

**Rule 3: OpenAI products are not listed first.**
Codex and Windsurf are listed by alphabetical name, not vendor.

**Rule 4: Do not use vendor brand colors or logos.**
The ecosystem section uses plain text chips only. No logos. No brand colors.
This enforces visual neutrality without needing to explain it.

**Rule 5: Do not compare runtimes.**
OptiContext does not have opinions about which runtime is better.
The compatibility section lists runtimes. It does not rank them.
Never include language like "most popular" or "recommended" for a specific runtime.

---

### Compatibility Claim Strength Levels

Use the correct strength level for the context:

| Level | Wording | When to Use |
|---|---|---|
| **Strong** | "Any MCP-compatible runtime connects without modification." | Landing page, docs home, quickstart intro |
| **Specific** | "Tested and verified with Claude Code, Cursor, Windsurf, OpenCode, Codex, OpenClaw, and Hermes." | Quickstart page, compatibility table |
| **Qualified** | "Compatible with any runtime implementing MCP Streamable HTTP transport (2025-11-25) or HTTP+SSE (2025-03-26)." | API reference, technical docs |
| **Hedged** | "Configuration paths and JSON field names vary per runtime. See the quickstart for runtime-specific setup." | Quickstart, troubleshooting |

Never upgrade the claim strength beyond what is supported.
"Any runtime" is only defensible because it is protocol-scoped ("MCP-compatible"), not universal.

---

### Overclaiming Rules

**Do not claim:**
- "Works with all AI agents" (too broad — some agents do not implement MCP)
- "Universal AI infrastructure" (too broad — not all AI systems use MCP)
- "Compatible with any AI system" (incorrect — only MCP-compatible systems)

**Do claim:**
- "Compatible with any MCP-compatible runtime"
- "Protocol-native — implements the MCP specification directly"
- "No vendor lock-in — the protocol is open"

---

### Protocol Neutrality Statement

When explaining why OptiContext works across runtimes, use this explanation:

> "OptiContext implements the Model Context Protocol specification directly.
> MCP is an open protocol — any runtime that implements it can connect to
> any compliant server without custom integration work. OptiContext is that server."

This statement:
- credits the protocol, not the product, for the compatibility
- is accurate and defensible
- does not claim ownership of MCP
- does not imply vendor affiliation

---

### Coding Agent Framing Rule

OptiContext is compatible with coding agents (Claude Code, Cursor, Windsurf, etc.)
but is not *for* coding agents specifically.

The correct framing:

> "OptiContext is context infrastructure for AI agents — coding agents, personal agents,
> orchestration systems, and any custom runtime that implements MCP."

The incorrect framing:

> "OptiContext gives your coding assistant search, memory, and voice."

The difference: the correct framing positions OptiContext as the layer below.
The incorrect framing positions it as a feature of another product.

---

## 5. Example & Schema Style Rules

All technical examples across the entire platform — quickstart, API reference, tool docs,
troubleshooting, dashboard — must follow these conventions exactly.
No exceptions.

---

### JSON Formatting

**Standard:**
- 2-space indentation (not 4, not tabs)
- Double quotes for all keys and string values
- No trailing commas
- One JSON value per line for objects with 3+ keys
- Inline format acceptable for objects with 1–2 keys: `{ "status": "ok" }`

**Example (correct):**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_search",
    "arguments": {
      "query": "latest MCP specification updates",
      "mode": "research"
    }
  },
  "id": 1
}
```

**Example (incorrect — do not do this):**
```json
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"opticontext_search","arguments":{"query":"latest MCP specification updates","mode":"research"}},"id":1}
```

---

### Endpoint Formatting

**Base URL (production):**
```
https://opticontext.opticontext.workers.dev/mcp
```

**Upload endpoint:**
```
https://opticontext.opticontext.workers.dev/upload
```

**Health endpoint:**
```
https://opticontext.opticontext.workers.dev/health
```

**Usage endpoint:**
```
https://opticontext.opticontext.workers.dev/usage
```

**Rules:**
- Always include the full URL in examples. Never use relative paths like `/mcp` alone in copy-ready snippets.
- Never use placeholder domains like `yourworker.workers.dev` in public-facing content.
- The subdomain is `opticontext.opticontext.workers.dev` — not `api.`, not `opticontext.`, not the raw worker URL.

---

### Placeholder Formatting

All placeholders in examples use `ALL_CAPS_WITH_UNDERSCORES` wrapped in the appropriate context.

| Placeholder | What It Represents | How to Write It |
|---|---|---|
| Agent key | The user's actual key | `YOUR_AGENT_KEY` |
| Session ID | Optional MCP session header value | `YOUR_SESSION_ID` |
| File ID | Returned from a previous DeepDoc call | `YOUR_FILE_ID` |
| Upload ID | Returned from POST /upload | `YOUR_UPLOAD_ID` |
| Namespace | MemoryCore namespace string | `YOUR_NAMESPACE` |
| Chat ID | Telegram chat ID | `YOUR_CHAT_ID` |
| Bot token | Telegram bot token | `YOUR_BOT_TOKEN` |
| Request ID | JSON-RPC request ID | `1` (always use the integer `1` in single examples) |

**Rule:** Placeholders in JSON strings use double quotes as normal:
```json
"Authorization": "Bearer YOUR_AGENT_KEY"
```

**Rule:** Placeholders in shell/curl examples use angle brackets:
```bash
-H "Authorization: Bearer <YOUR_AGENT_KEY>"
```

---

### Agent Key Format

The agent key format is locked. Every example that shows a key must use this pattern:

**Real format (from backend plan):**
```
opctx_<agent_slug>_<32_hex_characters>
```

**In examples, always use this realistic dummy:**
```
opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4
```

**Never use:**
- `sk-...` (OpenAI format)
- `Bearer token123`
- `your-api-key-here`
- Random strings without the `opctx_` prefix

The prefix `opctx_` is part of the key format in the backend. It must appear in every example.

---

### Auth Header Format

Always written exactly as:

```
Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4
```

In curl examples:
```bash
-H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4"
```

In JSON config blocks:
```json
"headers": {
  "Authorization": "Bearer YOUR_AGENT_KEY"
}
```

Note: config blocks always use the placeholder `YOUR_AGENT_KEY`. Direct request examples always use the realistic dummy `opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4`.

---

### Request/Response Example Structure

Every capability call example follows this structure:

**1. The request (what the runtime sends):**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "<mcp_tool_name>",
    "arguments": {
      <required_parameters>
    }
  },
  "id": 1
}
```

**2. A brief separator comment** (in docs only, never in code blocks):
*OptiContext processes the request at the edge and returns:*

**3. The response (what OptiContext returns):**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "<capability_output>"
      }
    ]
  },
  "id": 1
}
```

**Rules:**
- Always include `"jsonrpc": "2.0"` — never omit it
- Always include `"id"` in both request and response, and they must match
- The `"result"` block always has a `"content"` array per MCP spec
- `"content"` items always have a `"type"` field
- For text responses: `"type": "text"`
- For inline resource responses: `"type": "resource"`

---

### Schema Table Format

All parameter/schema tables use this exact column structure:

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|

**Rules:**
- `Parameter`: exact field name in code font (backticks in markdown)
- `Type`: use `string`, `integer`, `number`, `boolean`, `object`, `array` — lowercase, no quotes
- `Required`: `Yes` or `No` — never "true"/"false", never "✓"/"✗"
- `Default`: actual default value in code font, or `—` if none
- `Description`: one sentence. Not a paragraph. Not a list. One sentence.

**Example:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | string | Yes | — | The search query to execute. |
| `mode` | string | No | `"auto"` | Search mode: `"auto"`, `"research"`, `"fast"`, or `"scrape"`. |
| `max_results` | integer | No | `5` | Maximum number of results to return. Range: 1–20. |
| `save_to_memory` | boolean | No | `false` | Store the result in MemoryCore for future recall. |

---

### Code Block Language Labels

Every code block must have a language label. No unlabeled code blocks anywhere.

| Content type | Language label |
|---|---|
| JSON payload / schema | `json` |
| Shell / curl | `bash` |
| Config file (generic) | `json` |
| TypeScript / JS examples | `typescript` |
| Response example | `json` |
| Terminal output | `text` |
| MCP config (Claude Code) | `json` |
| MCP config (Cursor) | `json` |
| MCP config (Windsurf) | `json` |
| Inline file paths | `text` |
| Error response | `json` |

**Rule:** Never use `js` — always `javascript` or `typescript`. Never use `sh` — always `bash`.

---

### MCP Initialize Example

Every occurrence of the MCP initialize response on the platform uses this exact block:

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

This block is locked. Do not vary it between docs pages.

---

### Naming Conventions in Examples

**Agent slugs in examples:**
Use one of these three slugs in examples — do not invent new ones:
- `myagent` — generic, used in most examples
- `claudecode` — when showing Claude Code-specific context
- `hermes` — when showing personal agent context

**Namespace examples:**
Use one of these:
- `general` — the default namespace
- `projects` — project-specific memories
- `personal` — personal facts about a user

**File ID examples:**
Always 12 lowercase hex characters: `a3f8d9e1b2c4`

**Upload ID examples:**
Always use: `upload_7f3a9b2e`

**Session ID examples:**
Always use: `sess_4c8d2f1a9b3e`

---

### curl Example Structure

All curl examples follow this pattern:

```bash
curl -X POST https://opticontext.opticontext.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "opticontext_search",
      "arguments": {
        "query": "MCP Streamable HTTP specification"
      }
    },
    "id": 1
  }'
```

**Rules:**
- Always `curl -X POST` (explicit method)
- `Content-Type` header always before `Authorization` header
- Use `\` line continuation for readability — never one-liner curl in docs
- `-d` flag with single quotes wrapping the JSON body
- Body JSON uses same 2-space indent rules as above

---

### File Path Conventions

When showing config file paths in quickstart or docs, format as:

- Absolute path: `~/.cursor/mcp.json`
- Project-relative path: `.cursor/mcp.json` (relative paths never start with `/`)
- Code font always for paths: never write a file path without backticks

When showing both global and project-level configs, show global first.

---

### Response Field Reference Format

When documenting a response field in prose (not in a table), format as:

> The response includes `summary` (string), `key_findings` (array of strings),
> and `confidence` (number, 0.0–1.0).

Never describe response fields in pure prose without naming the field in code font.

---

## 6. Error Message Voice Rules

Error messages are where infrastructure trust is built or destroyed.
A bad error message — vague, alarmist, or unhelpful — breaks trust faster than a bug.

### The Error Message Formula

Every error message must answer three questions:

1. **What happened?** (specific, not generic)
2. **Why did it happen?** (one sentence, cause only)
3. **What should the runtime do next?** (actionable)

**Good:**
> `RATE_LIMITED` — IntelliSearch daily limit reached (500/500 requests).
> Resets at 00:00 UTC. Use `DuckDuckGo` fallback mode by setting `"mode": "fast"` for the remaining session.

**Bad:**
> `Error: Too many requests. Please try again later.`

---

### Error Message Tone Rules

- Never use "Sorry" — it implies fault and adds no information
- Never use "Unfortunately" — same reason
- Never use "Oops" — undignified for infrastructure
- Never use "Something went wrong" — this is the most useless error message possible
- Never use exclamation points in error messages
- Always name the specific capability or endpoint that errored
- Always include the error code in the message, not just in metadata
- For rate limit errors: always include the reset time or a way to calculate it
- For auth errors: always specify whether it is the key format, key existence, or key status

---

### Error Message Length

- Dashboard UI error chips: max 12 words
- Dashboard expanded error: max 3 sentences
- API error response `message` field: max 2 sentences
- Docs troubleshooting section: as long as needed

---

## 7. Microcopy Voice Rules

Microcopy is the shortest text on the platform. It does not explain. It confirms.

### Rules

**Confirmations:** Past tense, no punctuation except period.
- "Copied." not "Copied!" not "Copied to clipboard."
- "Saved." not "Settings saved!" not "Your settings have been saved."
- "Key created." not "New key created successfully!"
- "Key revoked." not "The key has been revoked."

**Loading states:** Present progressive, no punctuation.
- "Loading usage data" not "Loading..." not "Please wait..."
- "Connecting to OptiContext" not "Authenticating..."
- "Generating key" not "Please wait while your key is generated."

**Empty states:** One sentence. Descriptive. Includes next action.
- "No agent keys yet. Create your first key to start using OptiContext."
- "No recent activity. Capability calls will appear here after your first request."
- "No results. Try a different search term."

**Destructive action confirmations:** Specific. Sober. No softening language.
- "Revoke this key? Any runtime using it loses access immediately. This cannot be undone."
- Not: "Are you sure you want to revoke this key?"

**Button labels:** Imperative verb + noun. Never gerund ("-ing").
- "Create key" not "Creating a key"
- "Copy config" not "Copying config"
- "Revoke" not "Revoking"
- "Save" not "Saving changes"

**Placeholder text in inputs:** Describes the expected value, not an instruction.
- `opctx_myagent_...` (shows format) not "Enter your agent key here"
- `my-coding-agent` (shows format) not "Give your key a name"
- `general` (shows default) not "Enter namespace"

**Tooltip text:** One sentence. No period if it is a fragment.
- "Daily requests across all capabilities"
- "Time since this key last made a capability call"
- "Reset daily at 00:00 UTC"

---

## 8. The Positioning Test

Before any piece of content is finalized, run it through this test.

### Test 1: Infrastructure or Plugin?

Read the headline and first sentence aloud.

Ask: "Does this sound like infrastructure or like a plugin for another product?"

- If it sounds like infrastructure: pass.
- If it sounds like a plugin: rewrite.

### Test 2: Vendor Bias Check

Scan the section for vendor names.

Ask: "Is any single vendor mentioned more than twice in this section?"
Ask: "Is any vendor placed first in a list for non-alphabetical reasons?"
Ask: "Does any sentence imply this is primarily for users of one vendor's products?"

- If any answer is yes: rewrite.

### Test 3: Specificity Check

Scan for any of these: powerful, fast, reliable, seamless, easy, robust, intuitive, best.

For each adjective found: replace it with the specific technical fact it is trying to claim.

- "Fast" → "Sub-5ms cold starts on Cloudflare Workers V8 isolates"
- "Reliable" → "Budget guards prevent hard limit failures by switching providers proactively"
- "Easy" → "One configuration entry in your runtime's MCP config"

If you cannot find the specific fact: remove the adjective.

### Test 4: Forbidden Term Scan

Run a text search for every term in Section 2's forbidden list.

Each hit is a required fix before publishing.

### Test 5: The One-Sentence Summary

After writing any section, summarize it in one sentence.

That sentence should be able to complete this phrase:
> "OptiContext is ______"

If the summary produces something like:
> "OptiContext is a useful tool for coding"

The section needs to be rewritten.

If it produces:
> "OptiContext is edge-native context infrastructure compatible with any MCP runtime"

The section is aligned.

---

## Document Status

| Section | Status |
|---|---|
| Core Product Vocabulary | LOCKED |
| Forbidden Terms | LOCKED |
| Tone & Voice Rules | LOCKED |
| Compatibility Language Rules | LOCKED |
| Example & Schema Style Rules | LOCKED |
| Error Message Voice | LOCKED |
| Microcopy Voice | LOCKED |
| Positioning Test | LOCKED |

---

*OptiContext Terminology & Language Contract v1.0*
*Phase 1 of 9 · Sandy · May 2026*
*This document must be reviewed before any content phase (2–9) is started.*
*Changes to this document require explicit approval and must be propagated to all downstream content.*
