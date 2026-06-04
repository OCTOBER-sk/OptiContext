# ⚡ OptiContext — Production-Grade MCP Server

One API key, one endpoint, four superpowers for any AI agent.

## What is OptiContext?

OptiContext is a blazing-fast, multi-tool MCP server deployed on Cloudflare's edge network. It gives AI agents — Claude Code, Cursor, OpenClaw, Hermes, Antigravity, and any custom agent — a **single API key** that unlocks:

- **🔍 IntelliSearch** — Web search with AI dorking + summarization (Tavily, DDG, Apify, Cerebras)
- **🔊 VoiceBridge** — Real-time TTS streaming (48 voices, sub-300ms TTFB)
- **📄 DeepDoc** — Deep file analysis using Gemini's 2M token context window
- **🧠 MemoryCore** — Persistent RAG memory with semantic search (Supabase pgvector)

All tools, one endpoint, zero cost.

## Architecture

```
AI Agent → MCP (Streamable HTTP) → Cloudflare Worker
  ├─ IntelliSearch → Tavily / DDG / Apify + Cerebras
  ├─ VoiceBridge   → Unreal Speech + R2 cache
  ├─ DeepDoc       → Gemini 2M ctx + R2 buffer
  └─ MemoryCore    → Gemini Embed + Supabase pgvector
```

## Quick Start

```bash
git clone <repo>
cd opticontext

# Setup
chmod +x scripts/setup.sh
./scripts/setup.sh

# Deploy worker
cd worker
wrangler deploy
```

## Tech Stack

- **Runtime**: Cloudflare Workers (300+ PoPs, sub-5ms cold starts)
- **AI**: Cerebras (2,600 tok/s), Gemini 2.5 Flash/1.5 Pro
- **Search**: Tavily, DuckDuckGo, Apify
- **Voice**: Unreal Speech (48 voices, 8 languages)
- **Storage**: CF KV, CF R2, Turso (libSQL), Supabase (pgvector)
- **Auth**: Supabase Auth Google OAuth (dashboard), KV-based API keys (hot path)
- **Dashboard**: React + Vite + Tailwind on Cloudflare Pages
- **Total monthly cost**: $0

## License

MIT
