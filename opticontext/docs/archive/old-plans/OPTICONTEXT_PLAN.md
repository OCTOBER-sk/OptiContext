# ⚡ OptiContext — Production-Grade MCP Server
### Complete Build Plan · v1.0 · Date: 21-05-2026
### Author: Sandy | Stack: 100% Free Tier | Deployed on: Cloudflare Workers

---

> **What is OptiContext?**
> OptiContext is a blazing-fast, multi-tool MCP server deployed on Cloudflare's edge network.
> It gives AI agents — OpenClaw, Hermes, Antigravity, Claude Code, and any future agent — a
> **single API key** that unlocks: intelligent web search with dorking, real-time TTS voice,
> deep file analysis, and persistent RAG memory. All tools, one endpoint, zero cost.

---

## Table of Contents

1. [Vision & Problem Statement](#1-vision--problem-statement)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack & Free Tier Limits](#3-technology-stack--free-tier-limits)
4. [MCP Protocol Decision](#4-mcp-protocol-decision)
5. [Authentication System](#5-authentication-system)
6. [Storage Architecture](#6-storage-architecture)
7. [Tool 1 — IntelliSearch (Web Search + Dorking)](#7-tool-1--intellisearch-web-search--dorking)
8. [Tool 2 — VoiceBridge (TTS Streaming)](#8-tool-2--voicebridge-tts-streaming)
9. [Tool 3 — DeepDoc (File Analysis Engine)](#9-tool-3--deepdoc-file-analysis-engine)
10. [Tool 4 — MemoryCore (RAG Memory for Agents)](#10-tool-4--memorycore-rag-memory-for-agents)
11. [AI Routing Engine (Cerebras ↔ Gemini)](#11-ai-routing-engine-cerebras--gemini)
12. [Usage Dashboard](#12-usage-dashboard)
13. [API Design & Endpoint Reference](#13-api-design--endpoint-reference)
14. [Data Flow Diagrams](#14-data-flow-diagrams)
15. [Project Folder Structure](#15-project-folder-structure)
16. [Phased Roadmap](#16-phased-roadmap)
17. [Free Tier Limit Summary](#17-free-tier-limit-summary)
18. [Risk Register](#18-risk-register)
19. [Glossary](#19-glossary)

---

## 1. Vision & Problem Statement

### The Problem

Modern AI agents — whether coding assistants like Antigravity and Claude Code, or
personal agents like OpenClaw and Hermes — constantly hit the same walls:

- **Context choking**: Large files crash agent context windows, analysis fails silently.
- **No visual understanding**: Agents can't read screenshots, diagrams, charts, or process images at all.
- **Stale knowledge**: Agents hallucinate because they lack real-time web access with precise results.
- **No voice**: Telegram/Discord/WhatsApp bots can't respond in natural voice without complex pipelines.
- **No memory**: Every conversation starts from zero — agents don't remember past sessions.
- **API key chaos**: Every tool requires its own key, its own integration, its own maintenance.

### The Solution

OptiContext collapses all of this into one production MCP server:

```
One API key → One endpoint → Four superpowers
```

Any agent that speaks MCP can call OptiContext and immediately unlock:
- Real-time web search with AI-enhanced dorking and summarization
- Low-latency voice synthesis streaming ready for Telegram/Discord/WhatsApp
- Deep file analysis including images, audio, and video using Gemini's 2M token context window
- Persistent RAG memory so agents remember across sessions

### Design Principles

- **Edge-first**: Deployed on Cloudflare Workers — 300+ global PoPs, sub-5ms cold starts.
- **Free forever**: Every component is on a permanent free tier.
- **Agent-agnostic**: Works with any agent that supports MCP (Claude Code, Cursor, custom agents, etc.).
- **Speed obsessed**: Cerebras at 2,600 tok/s for fast tasks; Gemini for deep work.
- **No vendor lock-in**: Every provider can be swapped in the routing config.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI AGENTS (Callers)                             │
│   OpenClaw · Hermes · Antigravity · Claude Code · Cursor · Custom       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ MCP (Streamable HTTP · JSON-RPC 2.0)
                                │ Authorization: Bearer opctx_<agent_key>
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              CLOUDFLARE WORKERS — OptiContext Edge Server                │
│                                                                         │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐   │
│   │  Auth Guard  │   │  Rate Limiter│   │    MCP Router            │   │
│   │  Firebase    │   │  CF KV Store │   │  (Tool Dispatcher)       │   │
│   │  JWT Verify  │   │  Per-agent   │   │                          │   │
│   └──────────────┘   └──────────────┘   └──────────────────────────┘   │
│                                                  │                      │
│              ┌───────────────────────────────────┤                      │
│              │                 │                 │            │         │
│              ▼                 ▼                 ▼            ▼         │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ ┌──────────┐   │
│   │ IntelliSearch│  │ VoiceBridge  │  │  DeepDoc     │ │MemoryCor │   │
│   │ Tool 1       │  │ Tool 2       │  │  Tool 3      │ │ Tool 4   │   │
│   └──────────────┘  └──────────────┘  └──────────────┘ └──────────┘   │
│         │                  │                 │               │          │
└─────────┼──────────────────┼─────────────────┼───────────────┼──────────┘
          │                  │                 │               │
          ▼                  ▼                 ▼               ▼
   ┌─────────────┐   ┌────────────┐   ┌────────────────┐ ┌──────────────┐
   │ Tavily API  │   │ Unreal     │   │ Gemini Files   │ │ Supabase     │
   │ DDG Search  │   │ Speech     │   │ API (2M ctx)   │ │ pgvector     │
   │ Apify       │   │ (300ms TTB)│   │ CF R2 (storage)│ │ (embeddings) │
   │ Cerebras AI │   │            │   │                │ │ Gemini embed │
   └─────────────┘   └────────────┘   └────────────────┘ └──────────────┘
          │
   ┌──────────────────────────────────────────────────────────────────────┐
   │                     STORAGE LAYER                                    │
   │  CF KV: API keys, rate limits, hot cache (100K reads/day free)       │
   │  Turso: Agent logs, usage metrics, audit trail (500M rows/month)     │
   │  Supabase: User auth, pgvector for RAG, agent memories              │
   │  Firebase: Auth tokens, real-time usage events                       │
   │  CF R2: Uploaded files buffer, TTS audio cache (10GB free)          │
   └──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack & Free Tier Limits

### Compute & Hosting

| Service | Role | Free Tier |
|---|---|---|
| **Cloudflare Workers** | MCP server runtime | 100K req/day, 10ms CPU/req |
| **Cloudflare Pages** | Dashboard frontend | Unlimited static hosting |
| **Cloudflare Durable Objects** | Per-agent session state | 100K req/day (SQLite backed, free) |

### AI Models

| Service | Role | Free Tier |
|---|---|---|
| **Cerebras (Llama 4 Scout / Qwen3 32B)** | Fast summarization, filtering, routing | **1M tokens/day**, 2,600 tok/s, no credit card |
| **Gemini 2.5 Flash / 2.0 Flash** | Deep file analysis, large context | 15 RPM, 1,500 req/day, 1M token context |
| **Gemini 1.5 Pro** | Ultra-deep analysis (2M token window) | 2 RPM, 50 req/day |
| **Gemini Embedding** | RAG vector embeddings | Free via AI Studio |

### Search Providers

| Service | Role | Free Tier |
|---|---|---|
| **Tavily** | AI-optimized search + content extraction | **1,000 credits/month** (basic search = 1 credit) |
| **DuckDuckGo** | Fallback search, no API key needed | **Unlimited** (rate-limited by IP) |
| **Apify** | Deep scraping, structured data extraction | **$5/month credits** (~5,000 simple pages) |

### Voice

| Service | Role | Free Tier |
|---|---|---|
| **Unreal Speech** | TTS streaming, 48 voices, 8 languages | Free tier (character-limited), **sub-300ms TTFB** |

### Storage

| Service | Role | Free Tier |
|---|---|---|
| **Cloudflare KV** | API keys, rate limits, hot cache | 100K reads/day, 1K writes/day, 1GB |
| **Cloudflare R2** | File uploads buffer, TTS audio cache | 10GB/month storage free |
| **Turso (libSQL)** | Agent usage logs, metrics, audit | **9GB, 500 databases, 500M rows read/month** |
| **Supabase (Postgres + pgvector)** | Auth tables, RAG vector store | 500MB DB, 50K MAU, free pgvector |
| **Firebase Auth** | Agent JWT issuance, token management | 10K verifications/month free |

---

## 4. MCP Protocol Decision

### Why Streamable HTTP (Not SSE, Not stdio)

After evaluating all three MCP transports against the project requirements, the answer is clear:

**OptiContext uses Streamable HTTP — the current MCP specification standard (2025-11-25).**

#### Decision Rationale

| Factor | stdio | SSE (deprecated) | Streamable HTTP ✅ |
|---|---|---|---|
| Remote access | ❌ Local only | ✅ | ✅ |
| Cloudflare Workers compatible | ❌ | Partial | ✅ Native |
| Stateless (scales horizontally) | N/A | ❌ Persistent conn | ✅ |
| Load balancer friendly | N/A | ❌ Sticky sessions | ✅ |
| Single endpoint | N/A | ❌ Two endpoints | ✅ `/mcp` handles all |
| Streaming responses | N/A | ✅ | ✅ (optional SSE when needed) |
| Auth headers | N/A | Complex | ✅ Standard HTTP Bearer |
| Current MCP spec | — | ❌ Deprecated Mar 2025 | ✅ Active spec |
| Cloudflare SDK support | — | Legacy | ✅ `createMcpHandler` native |

#### How It Works

```
POST /mcp  ← Agent sends JSON-RPC 2.0 messages here
GET  /mcp  ← Agent polls / opens SSE stream for streaming responses

All communication flows through ONE endpoint.
```

For streaming responses (e.g., TTS audio chunks, long file analysis), the server upgrades
to SSE within the same endpoint. For simple tool calls (search queries), it returns a
standard HTTP JSON response. The agent client auto-negotiates.

#### Backward Compatibility

OptiContext will maintain a legacy `/sse` endpoint for any agent still running the
old HTTP+SSE transport, but the primary path is Streamable HTTP.

---

## 5. Authentication System

### Model: One Master API Key Per Agent

Each agent (OpenClaw, Hermes, Antigravity, Claude Code, etc.) gets one unique API key
issued at registration. This key unlocks all tools that the agent is permitted to use.

### Key Format

```
opctx_<agent_slug>_<random_32_hex>

Examples:
opctx_openclaw_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4
opctx_hermes_b5c7d9f1a3e5b7d9f1a3e5b7d9f1a3e5
opctx_antigravity_c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1
opctx_claudecode_d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2
```

### Key Lifecycle

```
1. Admin registers agent → Firebase Auth creates account
2. Supabase stores agent profile (name, allowed_tools, tier)
3. API key generated (crypto.randomBytes(16).toString('hex'))
4. Key stored in Cloudflare KV: opctx_key:<key> → agent_id
5. Key metadata stored in Turso: agent_id, created_at, last_used, status
6. Key given to agent operator (one time, never stored in plaintext again)
```

### Authentication Flow (Per Request)

```
Agent Request
     │
     ▼
CF Worker receives: Authorization: Bearer opctx_openclaw_<key>
     │
     ▼
[1] KV Lookup: GET opctx_key:<key>
     │  Hit → agent_id (sub-millisecond at edge)
     │  Miss → 401 Unauthorized
     ▼
[2] Rate Limit Check (KV): GET rate:<agent_id>:<minute_bucket>
     │  Under limit → proceed
     │  Over limit → 429 Too Many Requests
     ▼
[3] Tool Permission Check (KV cache / Supabase)
     │  Agent allowed for this tool? → proceed
     │  Not allowed → 403 Forbidden
     ▼
[4] Log Request Start (Turso async write, non-blocking)
     ▼
[5] Execute Tool
     ▼
[6] Log Response (Turso async write)
     ▼
Return Result
```

### Firebase Auth Role

Firebase Auth is used for the **dashboard login** (human operators managing their agents).
It is NOT in the hot path of agent requests — that uses the KV-based API key system for speed.

```
Dashboard Access:
  Human → Firebase Auth (email/Google login) → JWT
  JWT → Cloudflare Pages → Admin dashboard
  Dashboard → Supabase Admin APIs → Agent management
```

### Per-Agent Tool Permissions

Each agent key has a permissions bitmask stored in KV and Supabase:

```json
{
  "agent_id": "openclaw",
  "key_hash": "sha256(<key>)",
  "allowed_tools": ["intellisearch", "voicebridge", "deepdoc", "memorycore"],
  "tier": "standard",
  "rate_limits": {
    "requests_per_minute": 30,
    "daily_cap": 500
  },
  "created_at": "2026-05-21T00:00:00Z",
  "status": "active"
}
```

---

## 6. Storage Architecture

OptiContext uses each storage service for what it is best at — not one-size-fits-all.

### Storage Responsibility Map

```
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare KV — Hot Path Cache (Edge, Sub-ms)               │
│                                                             │
│  • API key → agent_id mapping (auth fast path)              │
│  • Per-agent rate limit counters (TTL = 60s buckets)        │
│  • Search result cache (TTL = 15 minutes, saves Tavily cred)│
│  • Agent permission bitfields (TTL = 1 hour)                │
│  • TTS audio cache (TTL = 24h, saves repeat synthesis)      │
│                                                             │
│  Limits: 100K reads/day · 1K writes/day · 1GB total        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Turso (libSQL Edge) — Relational Logs & Metrics             │
│                                                             │
│  Table: agent_requests                                      │
│    id, agent_id, tool_name, timestamp, latency_ms,         │
│    tokens_used, provider_used, success, error_code          │
│                                                             │
│  Table: daily_usage                                         │
│    agent_id, date, tool_name, count, tokens_total           │
│                                                             │
│  Table: agent_registry                                      │
│    agent_id, display_name, owner_email, tier, created_at   │
│                                                             │
│  Table: api_keys                                            │
│    key_hash, agent_id, created_at, last_used, revoked      │
│                                                             │
│  Table: uploaded_files                                      │
│    file_id, agent_id, filename, mime_type, file_size,      │
│    r2_key, gemini_file_uri, gemini_expires_at, created_at  │
│                                                             │
│  INDEX: idx_uploaded_files_agent(agent_id)                  │
│  INDEX: idx_uploaded_files_gemini(gemini_file_uri)          │
│                                                             │
│  Limits: 9GB storage · 500 databases · 500M rows/month     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Supabase (Postgres + pgvector) — Auth & RAG                 │
│                                                             │
│  Table: agent_profiles                                      │
│    agent_id, display_name, allowed_tools, tier, settings   │
│                                                             │
│  Table: memory_embeddings (pgvector)                        │
│    id, agent_id, content_text, embedding vector(768),      │
│    metadata jsonb, created_at, namespace                    │
│    INDEX: ivfflat (embedding vector_cosine_ops)             │
│                                                             │
│  Table: memory_entries                                      │
│    id, agent_id, namespace, content, source_tool,          │
│    importance_score, created_at, expires_at                 │
│                                                             │
│  Limits: 500MB DB · 50K MAU · pgvector free                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Firebase Auth — Human Operator Authentication               │
│                                                             │
│  • Dashboard login (email + Google OAuth)                   │
│  • JWT issuance for admin dashboard                         │
│  • NOT used in agent request hot path                       │
│                                                             │
│  Limits: 10K verifications/month free                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Cloudflare R2 — File & Audio Object Storage                 │
│                                                             │
│  Bucket: opticontext-files                                  │
│    • Temp uploads (via /upload endpoint)                    │
│    • Persisted files (after DeepDoc analysis)               │
│    • Path: files/<agent_id>/<upload_id> or persist/<agent_id>/<file_id>│
│                                                             │
│  Bucket: opticontext-tts                                    │
│    • Generated TTS audio (MP3/WAV chunks)                   │
│    • Cached for 24h to avoid re-synthesis                   │
│    • Path: tts/<hash_of_text_and_voice>.mp3                 │
│                                                             │
│  Limits: 10GB/month free                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Tool 1 — IntelliSearch (Web Search + Dorking)

### What It Does

IntelliSearch gives agents access to the entire web with precision. It combines three
search providers (Tavily, DDG, Apify) with AI-powered Google dorking to narrow results,
then uses Cerebras (2,600 tok/s) to summarize and filter the output before sending it
back — so agents receive clean, signal-only data, not noise.

### Architecture

```
Agent calls: opticontext_search(query, mode, dork_params)
     │
     ▼
[1] CACHE CHECK — CF KV: GET search_cache:<sha256(query+params)>
     │  HIT → return cached result (saves Tavily credits)
     │  MISS → continue
     ▼
[2] DORK BUILDER — construct precision search query
     │  Input: agent's natural query + dork_params
     │  Output: "site:github.com filetype:py langchain rag <query>"
     ▼
[3] PROVIDER ROUTER — select search provider
     │
     ├─ mode="research"  → Tavily (AI-optimized, returns clean content)
     ├─ mode="scrape"    → Apify (deep structured data extraction)
     ├─ mode="fast"      → DDG (free, no key, instant)
     └─ mode="auto"      → Try Tavily → fallback DDG → fallback Apify
     ▼
[4] MULTI-SOURCE FETCH (parallel if auto mode)
     │  Tavily: returns structured JSON with extracted content
     │  DDG: returns URLs + snippets
     │  Apify: runs Actor, returns structured data
     ▼
[5] AI FILTER — Cerebras (Llama 4 Scout @ 2,600 tok/s)
     │  Prompt: "Given this query: <query>
     │           Filter and summarize these results.
     │           Remove: ads, nav links, cookie notices, off-topic content.
     │           Return: top 5 relevant facts, source URLs, confidence score."
     │  Speed: ~0.3s for a 500-token response
     ▼
[6] CACHE WRITE — CF KV with TTL 15 min (saves future credits)
     ▼
Return: { summary, facts[], sources[], confidence, provider_used }
```

### Google Dorking Integration

The dork builder translates agent intent into precision queries:

```
Agent intent: "find Python RAG examples on GitHub"

Auto-generated dork:
  site:github.com filetype:py "retrieval augmented generation" OR "RAG" -tutorial

Agent intent: "latest CVE for log4j"

Auto-generated dork:
  site:nvd.nist.gov OR site:cve.mitre.org "log4j" after:2025-01-01

Agent intent: "competitor pricing page"

Auto-generated dork:
  site:<competitor.com> inurl:pricing OR inurl:plans
```

Dork parameters exposed in MCP tool schema:
- `site_filter`: restrict to domain(s)
- `file_type`: filetype: operator
- `date_after` / `date_before`: temporal filtering
- `exclude_terms`: NOT operator terms
- `include_phrases`: exact match phrases
- `search_in`: url / title / body

### Provider Strategy & Budget Management

```
Priority:      Tavily (quality) → DDG (free fallback) → Apify (scraping)

Budget rules:
  Tavily:  1,000 credits/month
    Basic search = 1 credit
    Advanced (with content) = 2 credits
    Budget guard: pause Tavily at 800 credits, switch to DDG
    Reset: monthly

  DDG:     Unlimited (Bing-backed, no key required)
    Rate limited by IP — CF Workers IPs are shared; use delay jitter
    Best for: fast facts, current news, general queries

  Apify:   $5/month credits
    Reserve for: deep scraping, LinkedIn, structured data extraction
    Simple HTML pages: ~$0.001/page → ~5,000 pages/month
    Budget guard: pause at $4.50 spent
```

### MCP Tool Schema

```json
{
  "name": "opticontext_search",
  "description": "Intelligent web search with AI dorking and summarization. Returns clean, filtered, agent-ready results.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The search query in natural language"
      },
      "mode": {
        "type": "string",
        "enum": ["auto", "research", "fast", "scrape"],
        "default": "auto",
        "description": "Search mode: auto=smart routing, research=Tavily deep, fast=DDG instant, scrape=Apify structured"
      },
      "dork": {
        "type": "object",
        "description": "Optional dorking parameters for precision",
        "properties": {
          "site_filter": { "type": "string" },
          "file_type": { "type": "string" },
          "date_after": { "type": "string", "format": "date" },
          "exclude_terms": { "type": "array", "items": { "type": "string" } }
        }
      },
      "max_results": {
        "type": "integer",
        "default": 5,
        "maximum": 20
      },
      "summarize": {
        "type": "boolean",
        "default": true,
        "description": "Run Cerebras AI filter on results"
      }
    },
    "required": ["query"]
  }
}
```

---

## 8. Tool 2 — VoiceBridge (TTS Streaming)

### What It Does

VoiceBridge converts any text into natural-sounding speech using Unreal Speech, with
real-time streaming delivery. Built for Hermes and OpenClaw's Telegram/Discord/WhatsApp
integrations. Sub-300ms Time-to-First-Byte means voice responses feel instant.

### Architecture

```
Agent calls: opticontext_tts(text, voice, format, stream)
     │
     ▼
[1] CACHE CHECK — CF KV: GET tts_cache:<sha256(text+voice)>
     │  HIT → return R2 signed URL (avoid re-synthesis, save credits)
     │  MISS → continue
     ▼
[2] TEXT PREPROCESSING
     │  • Strip markdown formatting
     │  • Handle code blocks (say "code block" placeholder)
     │  • Normalize numbers, abbreviations
     │  • Split long text into chunks (max 3,000 chars per API call)
     ▼
[3] UNREAL SPEECH API CALL
     │  Endpoint: POST https://api.v7.unrealspeech.com/stream
     │  Headers: Authorization: Bearer <UNREAL_SPEECH_KEY>
     │  Body: { text, voiceId, speed, pitch, bitrate }
     │  Streaming: Yes (chunked audio delivery)
     │  TTFB: ~300ms
     ▼
[4] STREAM HANDLING
     │  • For Telegram/Discord: Stream audio chunks → Buffer → Send as voice message
     │  • For web dashboard: Stream directly to response body
     │  • For agents: Return base64 chunks or R2 URL
     ▼
[5] CACHE WRITE
     │  • Save to CF R2: tts/<hash>.mp3
     │  • Store R2 URL in CF KV with TTL = 24h
     ▼
Return: { audio_url, duration_ms, voice_used, cached, chunks[] }
```

### Voice Selection

```
Available voices via Unreal Speech (48 voices, 8 languages):

English US:   Scarlett (female, warm), Dan (male, clear), Will (male, deep)
English UK:   Liv (female, british), Harry (male, british)
Hindi:        Priya (female), Arjun (male)
Spanish:      Sofia, Miguel
French:       Emma, Pierre
Japanese:     Yuki, Kenji
Mandarin:     Mei, Wei
Portuguese:   Ana, Rafael
```

### Platform Delivery Patterns

```
Telegram (via python-telegram-bot / Hermes/OpenClaw):
  1. Agent calls opticontext_tts(text, voice="Scarlett", format="ogg")
  2. OptiContext returns R2 signed URL
  3. Agent downloads audio → sends as Telegram voice message
  Latency target: < 800ms end-to-end

Discord (via discord.py / Hermes):
  1. Agent calls opticontext_tts(text, voice="Dan", format="mp3")
  2. OptiContext streams chunks back
  3. Agent joins voice channel → plays audio stream
  Latency target: < 500ms to first audio chunk

WhatsApp (via WhatsApp Business API / Hermes):
  1. Agent calls opticontext_tts(text, voice="Scarlett", format="ogg/opus")
  2. OptiContext returns R2 URL + duration
  3. Agent sends as WhatsApp audio message
  Latency target: < 1s
```

### MCP Tool Schema

```json
{
  "name": "opticontext_tts",
  "description": "Convert text to natural speech. Returns streaming audio or a URL. Built for Telegram, Discord, and WhatsApp voice messages.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "Text to synthesize (max 3,000 chars per call)",
        "maxLength": 3000
      },
      "voice": {
        "type": "string",
        "default": "Scarlett",
        "description": "Voice ID (Scarlett, Dan, Will, Liv, Priya, etc.)"
      },
      "speed": {
        "type": "number",
        "default": 1.0,
        "minimum": 0.5,
        "maximum": 2.0,
        "description": "Speech speed multiplier"
      },
      "format": {
        "type": "string",
        "enum": ["mp3", "ogg", "wav"],
        "default": "mp3"
      },
      "platform": {
        "type": "string",
        "enum": ["telegram", "discord", "whatsapp", "raw"],
        "default": "raw",
        "description": "Target platform for format optimization"
      },
      "stream": {
        "type": "boolean",
        "default": false,
        "description": "Stream audio chunks vs return URL"
      }
    },
    "required": ["text"]
  }
}
```

---

## 9. Tool 3 — DeepDoc (File Analysis Engine)

### What It Does

DeepDoc lets agents upload any file and get a deep, intelligent analysis using Gemini's
massive context window (up to 2M tokens for Gemini 1.5 Pro). Agents no longer choke on
large PDFs, codebases, spreadsheets, or audio files — DeepDoc handles it all.
**Images: extract text (OCR), describe diagrams, analyze screenshots, read charts and graphs.**

### Supported File Types (All Gemini-Supported Formats)

```
Documents:     PDF, DOCX, PPTX, XLSX, CSV, TXT, Markdown, HTML, XML, JSON
Images:        PNG, JPG, JPEG, WEBP, HEIC, HEIF, GIF (static)
Code:          .py, .js, .ts, .java, .cpp, .c, .go, .rs, .rb, .php, .sh, .yaml, .toml
Audio:         MP3, WAV, FLAC, AAC, OGG, OPUS (transcription + analysis)
Video:         MP4, AVI, MOV, MKV, WEBM (frame + audio analysis)
Archives:      ZIP (unpack + analyze contents)

Max file size: 2GB via Gemini Files API (100MB inline)
File retention: 48h on Gemini servers → use R2 for longer persistence
```

### Architecture

```
Agent calls: opticontext_analyze(file_url | file_b64 | upload_id | file_id, query, model)
     │
     ▼
[1] FILE INTAKE
     │  Option A: file_url — fetch from remote URL (no persistence)
     │  Option B: file_b64 — decode inline base64 (persisted automatically)
     │  Option C: upload_id — read from R2 temp, delete temp (persisted)
     │  Option D: file_id   — look up from KV index → fetch from R2 persist
     ▼
[1.5] PERSISTENCE (only for file_b64 and upload_id)
     │  Generate file_id (12 hex chars via crypto.randomHex)
     │  Copy to R2: persist/<agent_id>/<file_id>
     │  Write KV index: file_idx:<file_id> → { r2_key, filename, ... }
     │  Write Turso: uploaded_files table record (best-effort)
     │  return file_id in response so agent can re-analyze without re-upload
     ▼
[2] FILE UPLOAD TO GEMINI FILES API
     │  POST https://generativelanguage.googleapis.com/upload/v1beta/files
     │  Returns: file_uri (used in subsequent Gemini calls)
     │  Gemini retains file for 48h — reusable within window
     ▼
[3] MODEL ROUTING (AI Router decides)
     │  File size < 50KB + simple query → Gemini 2.5 Flash (fast, cheap)
     │  File size < 500KB + complex query → Gemini 2.0 Flash (balanced)
     │  File size > 500KB OR very complex → Gemini 1.5 Pro (2M ctx, deep)
     ▼
[4] STRUCTURED ANALYSIS PROMPT
     │  System: "You are a precise document analyst. Given the uploaded file
     │           and the agent's query, provide a structured analysis.
     │           Format: { summary, key_findings[], answer_to_query,
     │                     data_tables[], code_blocks[], confidence }"
     │  User: <file_uri OR inline_data> + agent's query
     ▼
[5] RESPONSE PROCESSING
     │  Parse Gemini structured JSON output
     │  Truncate to agent-friendly size (< 8K tokens by default)
     │  Include source references (page numbers, timestamps)
     ▼
[6] OPTIONAL: STORE IN MEMORYCORE
     │  If save_to_memory=true → embed analysis → store in Supabase pgvector
     │  Agent can recall this file analysis in future sessions
     ▼
Return: { summary, key_findings, answer, tables, confidence, file_id, tokens_used }
```

### Pre-Upload Flow (for large files)

```
1. Agent calls: POST /upload (multipart form data)
2. OptiContext receives file → stores in CF R2 (temp key: <agent_id>/<upload_id>)
3. Returns: upload_id (use in opticontext_analyze as upload_id)
4. Agent calls opticontext_analyze(upload_id, query) → file is moved from
   temp location to persist/<agent_id>/<file_id>, temp key deleted
5. Agent receives file_id in response — can re-analyze without re-uploading

Upload endpoint: POST https://opticontext.yourworker.workers.dev/upload
Headers: Authorization: Bearer opctx_<key>
Body: multipart/form-data with file field
Response: { upload_id, filename, size_bytes, expires_at }
```

### MCP Tool Schema

```json
{
  "name": "opticontext_analyze",
  "description": "Deep file analysis using Gemini's 2M token context window. Handles PDF, images, code, audio, video, spreadsheets and more.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "file_url": {
        "type": "string",
        "description": "Public URL of the file to analyze"
      },
      "file_b64": {
        "type": "string",
        "description": "Base64 encoded file (for files < 100MB)"
      },
      "upload_id": {
        "type": "string",
        "description": "ID from /upload endpoint (for pre-uploaded files)"
      },
      "file_id": {
        "type": "string",
        "description": "File ID from a previous analysis (re-analyze without re-uploading)"
      },
      "query": {
        "type": "string",
        "description": "Specific question or analysis task for the file"
      },
      "model": {
        "type": "string",
        "enum": ["auto", "flash", "pro"],
        "default": "auto",
        "description": "auto=AI routes based on file size/complexity"
      },
      "output_format": {
        "type": "string",
        "enum": ["structured", "markdown", "json", "summary_only"],
        "default": "structured"
      },
      "save_to_memory": {
        "type": "boolean",
        "default": false,
        "description": "Store this analysis in MemoryCore for future recall"
      },
      "max_tokens": {
        "type": "integer",
        "default": 4096,
        "maximum": 16384
      }
    },
    "oneOf": [
      { "required": ["file_url", "query"] },
      { "required": ["file_b64", "query"] },
      { "required": ["upload_id", "query"] },
      { "required": ["file_id", "query"] }
    ]
  }
}
```

---

## 10. Tool 4 — MemoryCore (RAG Memory for Agents)

### What It Does

MemoryCore gives every agent a persistent, searchable memory. Agents can store
facts, past conversation summaries, task outputs, and document analyses —
then retrieve them semantically across sessions. Powered by Supabase pgvector
with Gemini embeddings. Zero additional cost.

### Architecture

```
WRITE FLOW:
Agent calls: opticontext_memory_write(content, namespace, importance)
     │
     ▼
[1] CONTENT CHUNKING
     │  Split long text into 512-token chunks with 50-token overlap
     ▼
[2] EMBEDDING GENERATION
     │  POST to Gemini Embedding API (gemini-embedding-2 model)
     │  Returns: float[768] vector per chunk
     ▼
[3] STORE IN SUPABASE
     │  INSERT INTO memory_embeddings
     │    (agent_id, namespace, content_text, embedding, metadata, importance_score)
     ▼
Return: { memory_id, chunks_stored, namespace }


READ FLOW:
Agent calls: opticontext_memory_search(query, namespace, top_k)
     │
     ▼
[1] QUERY EMBEDDING
     │  Embed the query → float[768]
     ▼
[2] VECTOR SIMILARITY SEARCH
     │  SELECT content_text, 1 - (embedding <=> query_vector) AS similarity
     │  FROM memory_embeddings
     │  WHERE agent_id = <agent_id> AND namespace = <namespace>
     │  ORDER BY similarity DESC LIMIT top_k
     ▼
[3] OPTIONAL RERANKING
     │  Use Cerebras to rerank results by relevance to query
     │  (cheap: fast Llama4Scout, ~100 tokens per rerank)
     ▼
[4] CONTEXT ASSEMBLY
     │  Build clean context block from top results
     │  Include source metadata (when stored, what tool created it)
     ▼
Return: { memories[], relevance_scores[], total_found, context_block }
```

### Namespace System

Namespaces let agents organize memory by project, topic, or purpose:

```
openclaw:personal        — Personal facts about the user
openclaw:projects        — Project-specific memories
openclaw:web_research    — Saved search results
hermes:conversations     — Saved conversation summaries
antigravity:codebase     — Codebase analysis results
claudecode:sessions      — Session-specific context
```

### Memory Management

```
Write triggers: save_to_memory=true on any tool call
Retention: No expiry by default (agents manage their own memory)
Max memories per agent: 10,000 chunks (free tier Supabase limit)
Auto-summarization: At 8,000 chunks, run Cerebras summarization pass
                    to compress old memories and free space
```

### MCP Tool Schemas

```json
{
  "name": "opticontext_memory_write",
  "description": "Store information in your persistent memory for future recall across sessions.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "content": { "type": "string", "description": "Text content to remember" },
      "namespace": { "type": "string", "default": "general" },
      "importance": { "type": "integer", "minimum": 1, "maximum": 10, "default": 5 },
      "source": { "type": "string", "description": "Where this memory came from" },
      "expires_at": { "type": "string", "format": "date-time" }
    },
    "required": ["content"]
  }
}
```

```json
{
  "name": "opticontext_memory_search",
  "description": "Search your persistent memory using semantic similarity.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "What to search for" },
      "namespace": { "type": "string", "default": "general" },
      "top_k": { "type": "integer", "default": 5, "maximum": 20 },
      "min_similarity": { "type": "number", "default": 0.7, "minimum": 0, "maximum": 1 },
      "rerank": { "type": "boolean", "default": true }
    },
    "required": ["query"]
  }
}
```

---

## 11. AI Routing Engine (Cerebras ↔ Gemini)

### Design Philosophy

Each AI provider is used exactly where it wins. The router decides automatically.

### Routing Decision Table

```
┌────────────────────────────────────┬──────────────────┬────────────────┐
│ Task Type                          │ Routed To        │ Why            │
├────────────────────────────────────┼──────────────────┼────────────────┤
│ Search result filter/summarize     │ Cerebras         │ Speed (2600/s) │
│ Rate limit rerank                  │ Cerebras         │ Cheap + fast   │
│ TTS text preprocessing             │ Cerebras         │ Latency-crit   │
│ Simple query answering (< 8K ctx)  │ Cerebras         │ 1M tok/day     │
│ Dork query generation              │ Cerebras         │ Instant        │
├────────────────────────────────────┼──────────────────┼────────────────┤
│ File analysis (any size)           │ Gemini           │ Native files   │
│ Large context analysis (> 8K)      │ Gemini           │ 2M ctx window  │
│ Multi-modal (image/video/audio)    │ Gemini           │ Only option    │
│ Embedding generation (RAG)         │ Gemini Embed     │ Best free      │
│ Complex reasoning + files          │ Gemini 1.5 Pro   │ Deepest model  │
└────────────────────────────────────┴──────────────────┴────────────────┘
```

### Router Code Logic

```typescript
function routeToProvider(task: TaskMetadata): "cerebras" | "gemini" {
  // Any file → Gemini (it's the only one that handles files)
  if (task.hasFile) return "gemini";

  // Multimodal → Gemini
  if (task.isMultimodal) return "gemini";

  // Large context → Gemini
  if (task.estimatedContextTokens > 8000) return "gemini";

  // Speed-critical path → Cerebras
  if (task.requiresLowLatency) return "cerebras";

  // Default: Cerebras (fast, generous free tier, good enough)
  return "cerebras";
}

function routeGeminiModel(contextSize: number): GeminiModel {
  if (contextSize < 50000)  return "gemini-2.5-flash";  // 15 RPM
  if (contextSize < 500000) return "gemini-2.0-flash";  // 15 RPM
  return "gemini-1.5-pro";                              // 2 RPM
}
```

### Budget Guards

```
Cerebras:  1M tokens/day free
  Guard: at 800K tokens/day → switch to Gemini Flash for simple tasks
  Alert: log to Turso + notify via dashboard

Gemini Flash: 1,500 req/day, 15 RPM
  Guard: at 1,200 req/day → throttle non-critical requests
  Guard: at 14 RPM → add 4s delay between requests

Gemini 1.5 Pro: 50 req/day, 2 RPM
  Reserve: only for files > 500KB or explicitly requested
  Guard: at 40 req/day → block new Pro requests until next day
```

---

## 12. Usage Dashboard

### Overview

The usage dashboard is a Cloudflare Pages web app (React + Tailwind) with Firebase Auth
login. It gives human operators (agent owners) full visibility into their agent activity.

### Dashboard Features

```
[HOME]
  ├── Total requests today / this month
  ├── Requests by tool (pie chart)
  ├── Provider usage (Tavily / DDG / Apify / Cerebras / Gemini)
  └── API key status (active / revoked / expiring)

[AGENTS]
  ├── List of all registered agents
  ├── Per-agent: key, allowed tools, request count, last seen
  ├── Create new agent → generate new API key
  ├── Revoke agent key
  └── Edit agent permissions (tool access)

[ANALYTICS]
  ├── Hourly/daily/monthly request timeline
  ├── Latency percentiles (P50/P90/P99 per tool)
  ├── Error rate by tool
  ├── Token usage by provider
  └── Free tier usage % (with warning at 80%)

[LOGS]
  ├── Real-time request log (last 100 requests)
  ├── Filter by: agent, tool, status, date
  ├── Expandable log entries with full request/response
  └── Export to CSV

[SETTINGS]
  ├── Budget guards (set custom alert thresholds)
  ├── Provider priority order
  ├── Default voice for VoiceBridge
  └── Webhook URL for alerts (Telegram / Discord)
```

### Dashboard Stack

```
Frontend:  React + Vite + Tailwind CSS (Cloudflare Pages, free)
Charts:    Recharts (open source)
Auth:      Firebase Auth (Google + Email)
Data:      Fetch from Cloudflare Workers API → reads Turso + KV
Hosting:   Cloudflare Pages (unlimited static hosting, free)
```

---

## 13. API Design & Endpoint Reference

### Base URL

```
https://opticontext.<your-subdomain>.workers.dev
```

Or with a custom domain on Cloudflare:
```
https://api.opticontext.dev
```

### Core MCP Endpoint

```
POST /mcp
GET  /mcp  (for streaming/SSE initialization)

Headers:
  Content-Type: application/json
  Authorization: Bearer opctx_<agent_key>
  Mcp-Session-Id: <session_id>  (optional, for stateful sessions)

Body: Standard JSON-RPC 2.0 MCP message
```

### MCP Tool Calls (via /mcp endpoint)

```
Tool: opticontext_search        → IntelliSearch
Tool: opticontext_tts           → VoiceBridge
Tool: opticontext_analyze       → DeepDoc
Tool: opticontext_memory_write  → MemoryCore write
Tool: opticontext_memory_search → MemoryCore search
```

### REST Utility Endpoints (non-MCP)

```
POST /upload                    → Pre-upload file for DeepDoc
  Request: multipart/form-data
  Response: { upload_id, expires_at }

GET  /health                    → Server health check
  Response: { status, version, timestamp }

GET  /usage                     → Current agent's usage stats
  Headers: Authorization: Bearer opctx_<key>
  Response: { today_requests, monthly_requests, tool_breakdown }

POST /admin/agents              → Create new agent (admin only)
POST /admin/agents/:id/revoke   → Revoke agent key (admin only)
GET  /admin/logs                → Fetch request logs (admin only)
```

### MCP Server Info Response

When an agent connects and requests `initialize`, OptiContext returns:

```json
{
  "protocolVersion": "2025-11-25",
  "serverInfo": {
    "name": "OptiContext",
    "version": "1.0.0"
  },
  "capabilities": {
    "tools": {},
    "logging": {}
  }
}
```

---

## 14. Data Flow Diagrams

### IntelliSearch Full Flow

```
[Agent]  →  POST /mcp (opticontext_search, query="langchain rag examples")
  │
  ↓
[CF Worker]
  ├─ Auth: KV lookup opctx_key:<key> → agent_id="antigravity"  (~0ms edge)
  ├─ Rate: KV check rate:antigravity:20260521T1430 → 5/30 ok
  ├─ Cache: KV check search_cache:<sha256> → MISS
  ├─ Dork: build "site:github.com langchain RAG retrieval augmented"
  ├─ Tavily: POST api.tavily.com/search → 3 results with content (~800ms)
  ├─ Cerebras: filter+summarize → clean response  (~300ms)
  ├─ KV write: cache result, TTL 15min
  └─ Turso: async log (non-blocking)
  ↓
[Agent]  ←  JSON-RPC result: { summary, facts, sources }
  Total latency: ~1.1s
```

### VoiceBridge Full Flow

```
[Agent]  →  POST /mcp (opticontext_tts, text="Hello from Hermes", voice="Scarlett")
  │
  ↓
[CF Worker]
  ├─ Auth: KV lookup → agent_id="hermes"
  ├─ Cache: KV check tts_cache:<sha256("Hello from Hermes"+"Scarlett")> → MISS
  ├─ Unreal Speech: POST api.v7.unrealspeech.com/stream → audio stream
  │    TTFB: ~300ms
  │    Full MP3: ~600ms for short text
  ├─ R2 write: tts/<hash>.mp3
  ├─ KV write: tts_cache:<hash> → R2 URL, TTL 24h
  └─ Turso: async log
  ↓
[Agent]  ←  { audio_url: "https://r2.opticontext.dev/tts/<hash>.mp3", duration_ms: 1200 }
  Total latency: ~650ms (first time) / ~30ms (cached)
```

### DeepDoc Full Flow

```
[Agent]  →  POST /mcp (opticontext_analyze, file_b64="...", query="summarize key findings")
  │
  ↓
[CF Worker]
  ├─ Auth: KV lookup → agent_id="claudecode"
  ├─ Decode file_b64 or read from R2 (upload_id) or fetch URL (file_url)
  ├─ If file_b64 or upload_id: persist to R2 persist/<agent_id>/<file_id>
  │    → KV index: file_idx:<file_id> → { r2_key, filename, mime_type }
  │    → Turso: uploaded_files table (best-effort)
  ├─ Gemini Files API: upload file → file_uri="files/xyz..."  (~2s for 10MB PDF)
  ├─ AI Router: file_size=8MB → route to gemini-2.5-flash
  ├─ Gemini API: generateContent with file_uri + query  (~3s)
  ├─ Parse response → structured JSON
  ├─ If save_to_memory: → embed + Supabase pgvector write
  └─ Turso: async log
  ↓
[Agent]  ←  { summary, key_findings[], answer, file_id, confidence }
  Total latency: ~5s (cold), ~1.5s (file already uploaded to Gemini)
  Re-analyze: use file_id → KV lookup → R2 fetch → Gemini → response
```

---

## 15. Project Folder Structure

```
opticontext/
├── worker/                         # Cloudflare Workers source
│   ├── src/
│   │   ├── index.ts                # Entry point, route handler
│   │   ├── mcp/
│   │   │   ├── server.ts           # MCP Streamable HTTP handler
│   │   │   ├── router.ts           # Tool dispatcher
│   │   │   └── schemas.ts          # All tool JSON schemas
│   │   ├── tools/
│   │   │   ├── intellisearch.ts    # Tool 1: Search logic
│   │   │   ├── voicebridge.ts      # Tool 2: TTS logic
│   │   │   ├── deepdoc.ts          # Tool 3: File analysis
│   │   │   └── memorycore.ts       # Tool 4: RAG memory
│   │   ├── ai/
│   │   │   ├── router.ts           # Cerebras ↔ Gemini routing
│   │   │   ├── cerebras.ts         # Cerebras API client
│   │   │   └── gemini.ts           # Gemini API client
│   │   ├── search/
│   │   │   ├── tavily.ts           # Tavily search client
│   │   │   ├── ddg.ts              # DuckDuckGo client
│   │   │   ├── apify.ts            # Apify scraping client
│   │   │   └── dorking.ts          # Dork query builder
│   │   ├── auth/
│   │   │   ├── verify.ts           # API key verification
│   │   │   ├── ratelimit.ts        # Rate limiting (KV)
│   │   │   └── permissions.ts      # Tool permission checks
│   │   ├── storage/
│   │   │   ├── kv.ts               # CF KV operations
│   │   │   ├── r2.ts               # CF R2 operations
│   │   │   ├── turso.ts            # Turso logging
│   │   │   └── supabase.ts         # Supabase / pgvector
│   │   └── utils/
│   │       ├── logger.ts           # Structured logging
│   │       ├── errors.ts           # Error types
│   │       └── crypto.ts           # SHA-256 hashing, randomHex generator
│   ├── wrangler.toml               # CF Workers config
│   └── package.json
│
├── dashboard/                      # Cloudflare Pages frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Agents.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── Logs.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/
│   │   │   ├── Charts/
│   │   │   ├── AgentCard.tsx
│   │   │   └── LogTable.tsx
│   │   └── lib/
│   │       ├── firebase.ts         # Firebase Auth config
│   │       └── api.ts              # Dashboard API client
│   ├── public/
│   └── package.json
│
├── db/
│   ├── turso/
│   │   └── schema.sql              # Turso table definitions
│   └── supabase/
│       └── schema.sql              # Supabase + pgvector schema
│
├── scripts/
│   ├── setup.sh                    # One-time setup script
│   ├── create-agent.ts             # CLI to create new agent keys
│   └── seed-kv.ts                  # Seed KV with initial config
│
├── docs/
│   ├── OPTICONTEXT_PLAN.md         # This file
│   ├── AGENT_INTEGRATION.md        # How to connect your agent
│   └── API_REFERENCE.md            # Full API documentation
│
└── README.md
```

---

## 16. Phased Roadmap

### Phase 0 — Foundation (Week 1–2)

**Goal**: Working skeleton with auth, one tool, deployed on Cloudflare.

```
[ ] Set up Cloudflare Workers project with Wrangler
[ ] Configure CF KV namespaces (api_keys, rate_limits, cache)
[ ] Configure CF R2 buckets (files, tts)
[ ] Set up Turso database + schema (agent_registry, api_keys, logs)
[ ] Set up Supabase project + pgvector extension enabled
[ ] Set up Firebase Auth (for dashboard login)
[ ] Implement MCP Streamable HTTP server skeleton
[ ] Implement auth middleware (KV key lookup)
[ ] Implement rate limiter (KV per-minute buckets)
[ ] Deploy basic /health endpoint
[ ] Generate first API key for testing
[ ] Test with Claude Code as MCP client
```

**Milestone**: Claude Code can connect and receives a "Hello from OptiContext" tool response.

---

### Phase 1 — IntelliSearch (Week 3–4)

**Goal**: Web search working end-to-end with all three providers.

```
[ ] Build Tavily client + budget guard
[ ] Build DDG client (no API key)
[ ] Build Apify client + budget guard
[ ] Build dork query builder (5+ dork types)
[ ] Build provider router (auto/research/fast/scrape)
[ ] Build Cerebras client for summarization
[ ] Build search result cache (CF KV, TTL 15m)
[ ] Write opticontext_search MCP tool
[ ] Test with OpenClaw and Antigravity
[ ] Monitor Tavily credit usage in Turso
```

**Milestone**: Any agent can search the web and get clean, AI-filtered results in < 2s.

---

### Phase 2 — VoiceBridge (Week 5–6)

**Goal**: TTS working with Telegram and Discord delivery.

```
[ ] Build Unreal Speech streaming client
[ ] Build text preprocessor (strip markdown, normalize)
[ ] Build TTS cache (CF KV + R2)
[ ] Write opticontext_tts MCP tool
[ ] Test Telegram voice message delivery (with Hermes)
[ ] Test Discord audio stream delivery
[ ] Test WhatsApp voice message delivery
[ ] Optimize for sub-800ms end-to-end on Telegram
```

**Milestone**: Hermes can respond in voice on Telegram in under 1 second.

---

### Phase 3 — DeepDoc (Week 7–9)

**Goal**: File analysis working for all supported file types.

```
[ ] Build Gemini Files API upload client
[ ] Build R2 → Gemini pipeline for large files
[ ] Build /upload REST endpoint (multipart)
[ ] Implement model routing (Flash / Pro based on size)
[ ] Build structured analysis prompt system
[ ] Write opticontext_analyze MCP tool
[ ] Test with PDF, DOCX, Python code, images, audio
[ ] Test with Claude Code for codebase analysis
[ ] Handle error cases (file too large, unsupported type)
```

**Milestone**: Claude Code can upload a 50MB PDF codebase and get a structured analysis.

---

### Phase 4 — MemoryCore (Week 10–11)

**Goal**: Persistent RAG memory working for all agents.

```
[ ] Enable pgvector extension in Supabase
[ ] Build Gemini Embedding client
[ ] Build chunker (512 tokens, 50 overlap)
[ ] Build HNSW index on memory_embeddings table
[ ] Write opticontext_memory_write MCP tool
[ ] Write opticontext_memory_search MCP tool
[ ] Build auto-summarization trigger (at 8K chunks)
[ ] Implement namespace system
[ ] Test with OpenClaw (store user facts across sessions)
[ ] Test with Antigravity (store codebase context)
```

**Milestone**: OpenClaw remembers user name and preferences across Telegram sessions.

---

### Phase 5 — Dashboard (Week 12–13)

**Goal**: Full usage dashboard live on Cloudflare Pages.

```
[ ] Build React app skeleton (Vite + Tailwind)
[ ] Integrate Firebase Auth (Google login)
[ ] Build Dashboard home (request charts)
[ ] Build Agents page (create/revoke keys)
[ ] Build Analytics page (latency, tokens, budget)
[ ] Build Logs page (real-time log viewer)
[ ] Build Settings page (thresholds, webhooks)
[ ] Deploy to Cloudflare Pages
[ ] Set up Telegram webhook alerts for budget warnings
```

**Milestone**: One-click agent key creation and full usage visibility from the dashboard.

---

### Phase 6 — Hardening & Scale (Week 14–16)

**Goal**: Production-hardened, battle-tested, documented.

```
[ ] Implement exponential backoff on all external API calls
[ ] Add request deduplication (idempotency keys)
[ ] Add structured error codes and messages
[ ] Implement graceful degradation (if Tavily down → DDG)
[ ] Write AGENT_INTEGRATION.md guide
[ ] Write API_REFERENCE.md
[ ] Load test: 50 concurrent agent requests
[ ] Set up Cloudflare Analytics for edge metrics
[ ] Final free tier budget audit (ensure all under limits)
[ ] Public launch
```

---

## 17. Free Tier Limit Summary

```
┌──────────────────────────────┬─────────────────────┬──────────────────────┐
│ Service                      │ Free Limit           │ Usage Strategy       │
├──────────────────────────────┼─────────────────────┼──────────────────────┤
│ CF Workers                   │ 100K req/day         │ MCP server           │
│ CF KV reads                  │ 100K/day             │ Hot cache + auth     │
│ CF KV writes                 │ 1K/day               │ Async, batched       │
│ CF R2 storage                │ 10GB/month           │ Files + TTS cache    │
│ CF Durable Objects           │ 100K req/day         │ Session state        │
│ Cloudflare Pages             │ Unlimited            │ Dashboard            │
├──────────────────────────────┼─────────────────────┼──────────────────────┤
│ Cerebras (Llama 4 Scout)     │ 1M tokens/day        │ Fast tasks (2600/s)  │
│ Gemini 2.5 Flash             │ 1,500 req/day        │ Medium analysis      │
│ Gemini 1.5 Pro               │ 50 req/day           │ Deep file analysis   │
│ Gemini Embedding             │ Free (rate-limited)  │ RAG embeddings       │
├──────────────────────────────┼─────────────────────┼──────────────────────┤
│ Tavily                       │ 1,000 credits/month  │ Quality search       │
│ DuckDuckGo                   │ Unlimited            │ Free fallback        │
│ Apify                        │ $5 credits/month     │ Deep scraping only   │
├──────────────────────────────┼─────────────────────┼──────────────────────┤
│ Unreal Speech                │ Free tier (chars)    │ TTS with caching     │
├──────────────────────────────┼─────────────────────┼──────────────────────┤
│ Turso                        │ 9GB, 500M rows/month │ Logs + metrics       │
│ Supabase                     │ 500MB, 50K MAU       │ Auth + pgvector RAG  │
│ Firebase Auth                │ 10K verif/month      │ Dashboard login only │
└──────────────────────────────┴─────────────────────┴──────────────────────┘

TOTAL MONTHLY COST: $0
```

---

## 18. Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Tavily credits exhausted mid-month | Medium | Medium | Budget guard at 800/1000 credits, auto-fallback to DDG |
| Gemini RPM limit hit during peak | Medium | High | Request queue + exponential backoff + Flash↔Pro switching |
| CF KV write limit (1K/day) exceeded | Low | High | Batch writes, aggregate logs before writing, use Turso for non-hot data |
| Unreal Speech free tier character limit | Medium | Medium | TTS cache in R2 (same text = same audio, skip synthesis) |
| Supabase 500MB pgvector storage full | Low | Medium | Memory summarization + compression before limit |
| Apify $5 credits used early | High | Low | Reserve only for explicit scrape mode; DDG covers most needs |
| Cold start latency on CF Workers | Low | Low | Workers use V8 isolates (< 5ms cold start, not containers) |
| Agent key leaked/compromised | Low | High | Immediate revoke via dashboard; rotating keys on schedule |

---

## 19. Glossary

| Term | Definition |
|---|---|
| **MCP** | Model Context Protocol — standard for AI agent ↔ tool server communication |
| **Streamable HTTP** | Current MCP transport standard (March 2025) — single endpoint, HTTP POST/GET |
| **JSON-RPC 2.0** | The message format used inside MCP protocol |
| **CF KV** | Cloudflare Key-Value store — global, low-latency, eventually consistent |
| **CF R2** | Cloudflare's S3-compatible object storage — zero egress fees |
| **Durable Objects** | Cloudflare's stateful edge compute — per-session state |
| **pgvector** | PostgreSQL extension for vector similarity search — powers MemoryCore |
| **RAG** | Retrieval Augmented Generation — search memory before generating response |
| **Dorking** | Using advanced search operators to get precise results |
| **TTFB** | Time To First Byte — how fast streaming audio starts playing |
| **Turso / libSQL** | SQLite-compatible edge database with global replication |
| **Cerebras WSE-3** | Wafer-Scale Engine chip — delivers 2,600 tok/s inference |
| **Tool schema** | JSON Schema defining an MCP tool's input parameters |
| **Namespace** | Logical partition within MemoryCore (e.g., "projects", "personal") |
| **Budget guard** | Automatic threshold check that switches providers before free tier runs out |

---

*OptiContext Plan v1.0 · Generated: 21 May 2026 · Sandy*
*Stack: Cloudflare Workers · Turso · Supabase · Firebase · Cerebras · Gemini · Unreal Speech*
*Total monthly infrastructure cost: $0*
