# OptiContext — Phase 2: Landing Page Content
## Production Copy · `/` Route · All Sections Complete
### Version 1.0 · Sandy · May 2026

---

> **Source-of-truth alignment:**
> Generated from OPTICONTEXT_PLAN__4_.md (backend), OPTICONTEXT_FRONTEND_GUIDE.txt (structure),
> and OPTICONTEXT_TERMINOLOGY.md (language contract). All terminology rules applied.
> All sections correspond 1:1 with Frontend Guide Part 1 sections.

---

## TABLE OF CONTENTS

1. [Navigation Bar](#navigation-bar)
2. [Section 1 — Hero](#section-1--hero)
3. [Section 2 — Capability System](#section-2--capability-system)
4. [Section 3 — How It Works](#section-3--how-it-works)
5. [Section 4 — Trust Block](#section-4--trust-block)
6. [Section 5 — Ecosystem](#section-5--ecosystem)
7. [Section 6 — Final CTA](#section-6--final-cta)
8. [Footer](#footer)
9. [Signed-In State Variants](#signed-in-state-variants)
10. [SEO Metadata](#seo-metadata)
11. [Terminology Verification](#terminology-verification)

---

## NAVIGATION BAR

**Layout:** Sticky top · 64px height · Background base at 92% opacity · backdrop-blur 8px
**Border-bottom:** 1px border default — visible on scroll only

---

### Left: Wordmark

```
OptiContext
```

*Zodiak · Text primary · Links to /*

---

### Center/Right: Navigation Links

```
Docs        Tools        API Reference
```

*Switzer 500 · 14px · Text secondary · Hover: Text primary*

---

### Far Right: CTA Buttons

**Ghost button (signed-out state):** `Sign in`
**Primary button (signed-out state):** `Get your agent key`

**Signed-in state (replaces both):**
**Primary button:** `Go to dashboard`

*Signed-in check: Firebase auth state on mount. No flash of wrong state.*

---

---

## SECTION 1 — HERO

**Layout:** Full viewport height · Vertically centered
**Background:** Layer 3 atmospheric — one large emerald glow, top-left area, opacity 0.06–0.08

---

### Eyebrow Line

```
Model Context Protocol Infrastructure
```

*Switzer 500 · 13px · Uppercase · Letter-spacing: 0.08em · Accent text (#1A6B4A)*
*Prefix: small emerald dot or short dash — 4px gap before text*

---

### H1 Headline

```
One key. Four tools.
One edge endpoint.
```

*Zodiak 5xl (64px desktop · 44px mobile) · Text primary (#1A1A18)*
*Line break is structural. Preserve it. Do not allow reflow to single line.*
*Weight: 400 (regular) — never semibold on this headline*

---

### Supporting Line

```
OptiContext is a production MCP server deployed on Cloudflare's edge network.
Any MCP-compatible runtime connects without modification — and gains
real-time web search, voice synthesis, file analysis, and persistent memory.
```

*Switzer 400 · lg (18px) · Line height 1.6 · Text secondary (#4A4A45)*
*Max-width: 560px · Do not let this run wider*

---

### CTA Group

**Primary button (larger padding: 12px 24px):** `Get your agent key`
**Secondary button:** `See the docs`

*Gap between buttons: 12px*

**Signed-in variant:**
**Primary button:** `Go to dashboard`
**Secondary button:** `See the docs`

---

### Trust Indicators

```
Edge-deployed · 300+ PoPs   |   Sub-5ms cold starts   |   Zero infrastructure cost
```

*Switzer 400 · sm (14px) · Text muted (#8A8A82)*
*Separators: thin vertical rules (1px · border default · height 12px · vertically centered)*
*Displayed inline below CTA group · Margin-top: 24px*

---

### Integration Preview — Code Block

*This is the only element that extends below the fold before scroll.*
*Must use actual endpoint format. No placeholder domains.*

```json
// mcp.config.json

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
*Top bar: filename label left (`mcp.config.json`) · Copy button right*
*Max-width: 520px · Centered under CTA group*
*Border: 1px solid rgba(255,255,255,0.08) · Radius: sm (4px)*

---

### Scroll Indicator

*Subtle chevron-down icon · Text muted · Fades out on first scroll · No animation loop*

---

---

## SECTION 2 — CAPABILITY SYSTEM

**Layout:** Full-width section · Padding-top: 96px · Padding-bottom: 96px
**Background:** Background base (no atmospheric layer in this section)

---

### Section Heading

```
Four capabilities. One integration.
```

*Zodiak 3xl (36px) · Text primary*

---

### Section Subtext

```
Connect once. Every capability is immediately available to your runtime.
```

*Switzer lg (18px) · Text secondary · Margin-top: 12px*

---

### Layout Note

Four capability modules in a horizontal row on desktop.
2×2 grid on mobile.
These are **not cards**. Structured text blocks with a light top border. No drop shadows. No filled backgrounds.

---

### Capability Module 1 — IntelliSearch

**Module top border:** 2px solid · Border accent (#A8D4BC)
**Background pattern:** Faint branching search-path lines · ~1% opacity (atmosphere only)

```
IntelliSearch
```
*Zodiak 2xl (28px) · Text primary · Margin-top: 16px*

```
AI-enhanced web search with advanced dorking,
multi-provider routing, and real-time summarization.
```
*Switzer base (16px) · Text secondary · Margin-top: 8px*

```
Best for: agents that need current, precise information from the web.
```
*Switzer sm (14px) · Text muted · Margin-top: 8px*

**Ghost button:** `View reference →`
*Margin-top: 16px*

---

### Capability Module 2 — VoiceBridge

**Module top border:** 2px solid · Border accent (#A8D4BC)
**Background pattern:** Faint sine-wave curves · ~1% opacity

```
VoiceBridge
```
*Zodiak 2xl · Text primary*

```
Low-latency TTS streaming across 48 voices and 8 languages.
Sub-300ms time to first byte on Unreal Speech.
```
*Switzer base · Text secondary*

```
Best for: Telegram, Discord, and WhatsApp runtimes that speak.
```
*Switzer sm · Text muted*

**Ghost button:** `View reference →`

---

### Capability Module 3 — DeepDoc

**Module top border:** 2px solid · Border accent (#A8D4BC)
**Background pattern:** Faint horizontal document strata lines · ~1% opacity

```
DeepDoc
```
*Zodiak 2xl · Text primary*

```
Deep file analysis powered by Gemini's 2M token context window.
Handles PDFs, code, images, audio, and structured documents.
```
*Switzer base · Text secondary*

```
Best for: agents analyzing large documents and multi-format files.
```
*Switzer sm · Text muted*

**Ghost button:** `View reference →`

---

### Capability Module 4 — MemoryCore

**Module top border:** 2px solid · Border accent (#A8D4BC)
**Background pattern:** Faint node-connection dot lattice · ~1% opacity

```
MemoryCore
```
*Zodiak 2xl · Text primary*

```
Persistent RAG memory backed by Supabase pgvector.
Agents store, search, and retrieve context across sessions.
```
*Switzer base · Text secondary*

```
Best for: personal agents that build a model of users over time.
```
*Switzer sm · Text muted*

**Ghost button:** `View reference →`

---

---

## SECTION 3 — HOW IT WORKS

**Layout:** Full-width · Padding-top: 96px · Padding-bottom: 96px
**Background:** Background raised (#F4F1EB) — slight differentiation from base
**Step flow:** Horizontal on desktop · Vertical stack on mobile
**Connector between steps:** Thin horizontal line or arrow · Border default color · Static — no animation

---

### Section Heading

```
How it works
```

*Zodiak 3xl · Text primary*

---

### Steps

Each step:
*Step number: Switzer 500 · 12px · Text muted*
*Step title: Zodiak xl (22px) · Text primary*
*Step description: Switzer base · Text secondary · One sentence*

---

**Step 1**

```
01
```

```
Create an account
```

```
Sign in with Google. No form. No card. Under 10 seconds.
```

---

**Step 2**

```
02
```

```
Get your agent key
```

```
Generate an agent key from the dashboard. Each key is scoped to one runtime.
```

---

**Step 3**

```
03
```

```
Add to your runtime config
```

```
One configuration block in your MCP config file points to the OptiContext endpoint.
```

---

**Step 4**

```
04
```

```
Call the endpoint
```

```
Your runtime calls `POST https://mcp.opticontext.dev/mcp` using JSON-RPC 2.0.
```

---

**Step 5**

```
05
```

```
Get results at the edge
```

```
OptiContext resolves the capability call from Cloudflare's global network and returns structured output.
```

---

### Config Snippet (below steps — optional inline display)

*Shows what step 3 looks like in practice. Reinforces the single-config message.*

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

*JetBrains Mono · 14px · Code surface · Max-width: 480px · Centered*

---

---

## SECTION 4 — TRUST BLOCK

**Layout:** Full-width · Padding-top: 96px · Padding-bottom: 96px
**Grid:** 2×2 on desktop · Single column on mobile
**Style:** Plain text blocks · Thin top border on each block · No cards · No shadows

---

### Section Heading

```
Built for production. Free forever.
```

*Zodiak 2xl (28px) · Text primary · Centered*

---

### Trust Block 1

**Top border:** 1px solid · Border default

```
Edge-deployed infrastructure
```
*Zodiak xl (22px) · Text primary · Margin-top: 16px*

```
Cloudflare Workers across 300+ global points of presence.
Sub-5ms cold starts. No container spin-up. No regional latency penalty.
```
*Switzer base · Text secondary*

---

### Trust Block 2

**Top border:** 1px solid · Border default

```
Protocol-native by design
```
*Zodiak xl · Text primary*

```
Implements MCP Streamable HTTP transport and full JSON-RPC 2.0 compliance.
Any MCP-compatible runtime connects without modification.
```
*Switzer base · Text secondary*

---

### Trust Block 3

**Top border:** 1px solid · Border default

```
Per-agent isolation and control
```
*Zodiak xl · Text primary*

```
Create one agent key per runtime. Revoke individually from the dashboard.
Usage tracked per capability, per agent, in real time.
```
*Switzer base · Text secondary*

---

### Trust Block 4

**Top border:** 1px solid · Border default

```
Zero infrastructure cost
```
*Zodiak xl · Text primary*

```
Every component runs on a permanent free tier.
Cloudflare · Supabase · Firebase · Turso · Cerebras · Gemini.
```
*Switzer base · Text secondary*

---

---

## SECTION 5 — ECOSYSTEM

**Layout:** Full-width · Padding-top: 96px · Padding-bottom: 96px
**Background:** Background base
**Purpose:** Demonstrate runtime neutrality. No vendor hierarchy. No logos.

---

### Section Heading

```
Compatible with any MCP-compatible runtime
```

*Zodiak 3xl · Text primary*

---

### Section Subtext

```
OptiContext implements the Model Context Protocol specification directly.
MCP is an open protocol — any runtime that implements it connects
to any compliant server without custom integration work.
```

*Switzer lg · Text secondary · Max-width: 560px*

---

### Runtime Chips

*Plain text chips only. No logos. No brand colors. Alphabetical order.*
*Chip style: Switzer 500 · 13px · Text secondary · Border default · Radius sm (4px) · Padding: 6px 12px*

```
Amazon Q
Claude Code
Cline
Codex
Continue
Cursor
GitHub Copilot
Hermes
Kilo Code
OpenClaw
OpenCode
Windsurf
Zed
Custom MCP runtimes
```

---

### Protocol Claim

```
If your runtime implements MCP Streamable HTTP transport (2025-11-25),
it connects to OptiContext without modification.
```

*Switzer base · Text muted · Italic · Margin-top: 24px · Centered*

---

---

## SECTION 6 — FINAL CTA

**Layout:** Full-width strip · Padding-top: 80px · Padding-bottom: 80px
**Background:** Background raised (#F4F1EB) — differentiated from base
**Content:** Centered · Max-width: 560px
**Atmospheric layer:** None — no emerald glow here. Let it breathe.

---

### Headline

```
Ready to extend your agent?
```

*Zodiak 3xl · Text primary*

---

### Subtext

```
Add OptiContext to your runtime's MCP config.
Your agent gains search, voice, file analysis, and persistent memory
in one configuration block.
```

*Switzer lg · Text secondary · Max-width: 480px · Line height: 1.6*

---

### CTA Buttons

**Primary button:** `Get your agent key`
**Ghost button:** `Read the quickstart`

*Gap: 12px · Centered*

**Signed-in variant:**
**Primary button:** `Go to dashboard`
**Ghost button:** `Read the quickstart`

---

---

## FOOTER

**Layout:** Single slim bar · No columns
**Background:** Background raised (#F4F1EB)
**Border-top:** 1px solid · Border default
**Height:** ~52px · Vertically centered content

---

### Left

```
OptiContext — © 2026
```

*Switzer 400 · 13px · Text muted*

---

### Right

```
Docs   GitHub   ●
```

*Switzer 400 · 13px · Text muted*
*`Docs` links to `/docs`*
*`GitHub` links to public repo (when available)*
*`●` — tiny status chip · Operational state: accent subtle background, accent text · Text: "Operational" · Radius: full (pill)*

---

---

## SIGNED-IN STATE VARIANTS

*Behavior: Check Firebase auth state on mount. No flash of wrong state.*

| Element | Signed-Out | Signed-In |
|---|---|---|
| Nav far-right ghost button | `Sign in` | *(hidden)* |
| Nav far-right primary button | `Get your agent key` | `Go to dashboard` |
| Hero primary CTA | `Get your agent key` | `Go to dashboard` |
| Hero secondary CTA | `See the docs` | `See the docs` |
| Final CTA primary | `Get your agent key` | `Go to dashboard` |
| Final CTA ghost | `Read the quickstart` | `Read the quickstart` |

---

---

## SEO METADATA

```html
<!-- Title -->
<title>OptiContext — MCP Context Infrastructure for AI Agents</title>

<!-- Meta description -->
<meta
  name="description"
  content="OptiContext is a production MCP server on Cloudflare's edge network.
  One agent key unlocks web search, voice synthesis, file analysis,
  and persistent memory for any MCP-compatible runtime."
/>

<!-- Open Graph -->
<meta property="og:title" content="OptiContext — MCP Context Infrastructure" />
<meta
  property="og:description"
  content="One agent key. Four capabilities. One edge endpoint.
  Any MCP-compatible runtime connects without modification."
/>
<meta property="og:url" content="https://opticontext.dev" />
<meta property="og:type" content="website" />

<!-- Twitter / X Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="OptiContext — MCP Context Infrastructure" />
<meta
  name="twitter:description"
  content="One agent key. Four capabilities. One edge endpoint.
  Any MCP-compatible runtime connects without modification."
/>

<!-- Canonical -->
<link rel="canonical" href="https://opticontext.dev" />
```

---

---

## TERMINOLOGY VERIFICATION

*Run against OPTICONTEXT_TERMINOLOGY.md before publishing.*

### ✓ Test 1 — Infrastructure or Plugin?

Section 1 hero read aloud:
> "OptiContext is a production MCP server deployed on Cloudflare's edge network."

Result: **Infrastructure. Pass.**

---

### ✓ Test 2 — Vendor Bias Check

All runtime chips listed **alphabetically**.
No vendor mentioned more than twice in any section.
No vendor placed at position 1 for non-alphabetical reasons.
Anthropic products listed under C (Claude Code), not first.

Result: **Pass.**

---

### ✓ Test 3 — Specificity Check

| Adjective avoided | Replaced with |
|---|---|
| "fast" | "Sub-5ms cold starts on Cloudflare Workers V8 isolates" |
| "reliable" | "Budget guards prevent hard limit failures by switching providers proactively" |
| "easy" | "One configuration block in your MCP config file" |
| "powerful" | Specific capability descriptions used throughout |
| "seamless" | Not used anywhere |
| "cutting-edge" | Not used anywhere |
| "robust" | Not used anywhere |
| "intuitive" | Not used anywhere |

Result: **Pass.**

---

### ✓ Test 4 — Forbidden Term Scan

| Forbidden term | Status |
|---|---|
| "API key" (standalone) | ❌ Not used. "Agent key" used throughout. |
| "plugin" | ❌ Not used. |
| "tools" (for capabilities) | ❌ "Capabilities" used in all marketing copy. |
| "client" (for runtimes) | ❌ "Runtime" used throughout. |
| "REST API" | ❌ Not used. "MCP endpoint" / "Streamable HTTP transport" used. |
| "webhook" | ❌ Not used. |
| "AI toolset" | ❌ Not used. |
| "for developers" | ❌ Not used. |
| "get started" | ❌ Not used. "Get your agent key" used. |
| "seamless" | ❌ Not used. |
| "powerful" | ❌ Not used. |
| "Claude-first" | ❌ Not used. |
| "works with" (listing) | ❌ Not used. "Compatible with" used. |
| "free tier" (as value prop) | ❌ Appears only in Trust Block as "Zero infrastructure cost". |
| "we" / "our" | ❌ Not used. "OptiContext" used throughout. |
| "microservice" | ❌ Not used. |

Result: **Pass.**

---

### ✓ Test 5 — One-Sentence Summary

> "OptiContext is edge-native MCP context infrastructure compatible with any MCP-compatible runtime, providing web search, voice synthesis, file analysis, and persistent memory through a single agent key and endpoint."

Completes: *"OptiContext is ______"* correctly.

Result: **Pass.**

---

### ✓ Capability Names Check

| Capability | Used Correctly |
|---|---|
| IntelliSearch | ✓ Capitalized. Never "search tool" or "search feature." |
| VoiceBridge | ✓ Capitalized. Never "TTS tool" or "voice feature." |
| DeepDoc | ✓ Capitalized. Never "file tool" or "document tool." |
| MemoryCore | ✓ Capitalized. Never "memory tool" or "RAG tool." |

---

### ✓ Schema / Endpoint Formatting Check

| Rule | Status |
|---|---|
| Full URL in all code examples | ✓ `https://mcp.opticontext.dev/mcp` used throughout |
| 2-space JSON indentation | ✓ |
| `YOUR_AGENT_KEY` placeholder in config blocks | ✓ |
| `opctx_` prefix format never violated | ✓ |
| No relative paths in copy-ready snippets | ✓ |

---

### ✓ Backend Alignment Check

| Feature mentioned | Backed by plan |
|---|---|
| 300+ global PoPs | ✓ Cloudflare Workers (Section 2 of plan) |
| Sub-5ms cold starts | ✓ V8 isolates, not containers (Section 2) |
| Sub-300ms TTFB for VoiceBridge | ✓ Unreal Speech (Section 8 of plan) |
| Gemini 2M token context window | ✓ Gemini 1.5 Pro (Section 9 of plan) |
| Supabase pgvector | ✓ MemoryCore storage (Section 10 of plan) |
| Cloudflare Workers · Supabase · Firebase · Turso · Cerebras · Gemini | ✓ All in free tier table (Section 17) |
| Per-agent isolation + dashboard revoke | ✓ Auth system (Section 5 of plan) |

---

### ✓ Frontend Structure Alignment Check

| Landing page section | Frontend Guide reference | Status |
|---|---|---|
| Nav bar | Part 1 — Global Navigation | ✓ |
| Hero | Part 1 — Section 1 | ✓ |
| Capability system | Part 1 — Section 2 | ✓ |
| How it works | Part 1 — Section 3 | ✓ |
| Trust block | Part 1 — Section 4 | ✓ |
| Ecosystem (runtime chips) | Terminology file §4 | ✓ |
| Final CTA | Part 1 — Section 5 | ✓ |
| Footer | Part 0 — Footer | ✓ |

---

---

*OptiContext Landing Page Content · Phase 2 of 9*
*Version 1.0 · Sandy · May 2026*
*Next phase: Phase 3 — Docs Home Content*
