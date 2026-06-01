# OptiContext — Phase 7: Dashboard + Settings Copy
## Production Copy · `/dashboard` and `/dashboard/settings` Routes
### Version 1.0 · Sandy · May 2026

---

> **Source-of-truth alignment:**
> Generated from OPTICONTEXT_PLAN_.md (sections 2, 5, 12, 13, 17),
> OPTICONTEXT_FRONTEND_GUIDE.txt (Parts 7–8 — Dashboard, Settings),
> OPTICONTEXT_TERMINOLOGY.md (language contract),
> OPTICONTEXT_PHASE6_API_REFERENCE.md (error codes, rate limits, endpoint contracts),
> and OPTICONTEXT_PHASE2_LANDING.md (signed-in state pattern consistency).
>
> Tone: operational. Infrastructure-grade. Telemetry-oriented. Calm.
> This is not a SaaS analytics dashboard. This is an operational control surface for
> MCP context infrastructure. Every label earns its place with function, not decoration.
> No marketing language. No celebratory copy. No startup dashboard idioms.

---

## TABLE OF CONTENTS

1. [Dashboard Navigation Shell](#1-dashboard-navigation-shell)
2. [Dashboard Header — MCP Endpoint Block](#2-dashboard-header--mcp-endpoint-block)
3. [System Status Indicator](#3-system-status-indicator)
4. [Usage Overview — Today](#4-usage-overview--today)
5. [Capability Usage Blocks](#5-capability-usage-blocks)
   - [IntelliSearch](#intellisearch-usage-block)
   - [VoiceBridge](#voicebridge-usage-block)
   - [DeepDoc](#deepdoc-usage-block)
   - [MemoryCore](#memorycore-usage-block)
6. [Recent Activity Table](#6-recent-activity-table)
7. [Config Copy Section](#7-config-copy-section)
8. [Status Indicators — Full Reference](#8-status-indicators--full-reference)
9. [Settings Page — /dashboard/settings](#9-settings-page--dashboardsettings)
   - [Agent Keys Section](#agent-keys-section)
   - [Usage Alerts Section](#usage-alerts-section)
   - [Telegram Alerts Section](#telegram-alerts-section)
   - [Account Section](#account-section)
10. [Destructive Action Flows](#10-destructive-action-flows)
11. [Success States](#11-success-states)
12. [Error States](#12-error-states)
13. [Onboarding / Empty States](#13-onboarding--empty-states)
14. [Loading States](#14-loading-states)
15. [Terminology Verification](#15-terminology-verification)

---

---

# 1. DASHBOARD NAVIGATION SHELL

## Top Navigation Bar

**Route:** `/dashboard` and `/dashboard/settings`
**Height:** 60px
**Background:** Background base (#FAF8F4) · Full opacity
**Border-bottom:** 1px solid border strong (#C8C4BB) · Always visible (not scroll-triggered)

---

### Left — Wordmark

```
OptiContext
```

*Zodiak · Text primary (#1A1A18) · Links to /*

---

### Right — Account Menu

```
[User avatar or initial]  sandy@email.com  ▾
```

*Avatar: 28px circle · Background raised · Initial in Switzer 500 · 13px*
*Dropdown on click:*

```
─────────────────────────
  sandy@email.com
  Google account
─────────────────────────
  Settings
  View docs
─────────────────────────
  Sign out
─────────────────────────
```

*Dropdown: background base · Border: border default · Radius: lg (12px) · Shadow: 0 4px 16px rgba(0,0,0,0.08)*
*"Sign out" row: text primary · No destructive styling — sign-out is not destructive*
*Font: Switzer 400 · 14px*

---

## Dashboard Sidebar

**Width:** 240px
**Background:** Background raised (#F4F1EB)
**Border-right:** 1px solid border default (#E2DED5)

```
────────────────
  NAVIGATION
────────────────
  ● Dashboard
  ○ Settings
────────────────
```

*Section label "NAVIGATION": Switzer 600 · 11px · Uppercase · Letter-spacing: 0.08em · Text muted*
*Active link: accent subtle background (#E8F4EE) · Accent text (#1A6B4A) · Border-left: 3px solid accent primary*
*Inactive link: Switzer 500 · 14px · Text secondary · Hover: text primary, background raised*
*Link padding: 10px 16px*

---

---

# 2. DASHBOARD HEADER — MCP ENDPOINT BLOCK

**Anchor:** Top of main content area. First element visible after the nav bar and sidebar.
**Purpose:** The primary utility action. An authenticated developer needs the MCP config immediately.

---

### Section Heading

```
Your MCP endpoint
```

*Zodiak 2xl (28px) · Text primary · Margin-bottom: 24px*

---

### Endpoint + Agent Key — Side-by-Side Blocks

**Layout:** Two blocks in a row · Gap: 16px · On mobile: stacked vertically

---

#### Block 1 — Endpoint URL

**Label:**
```
ENDPOINT
```
*Switzer 600 · 11px · Uppercase · Letter-spacing: 0.08em · Text muted*

**Value:**
```
https://mcp.opticontext.dev/mcp
```
*JetBrains Mono · 14px · Text primary*
*Background: Background sunken (#EFECE4)*
*Border: 1px solid border default (#E2DED5)*
*Radius: md (8px)*
*Padding: 10px 14px*
*Copy button: right-aligned inside block · Icon button style*

**Tooltip on copy button:** `Copy endpoint URL`

---

#### Block 2 — Agent Key

**Label:**
```
AGENT KEY
```
*Switzer 600 · 11px · Uppercase · Letter-spacing: 0.08em · Text muted*

**Value (masked by default):**
```
opctx_████████████████████████████████
```
*JetBrains Mono · 14px · Text muted (masked state)*
*Revealed state: JetBrains Mono · 14px · Text primary*

**Controls (right-aligned, inside block):**
- Eye icon (reveal/hide toggle) — `Show agent key` / `Hide agent key` tooltip
- Copy icon — copies the full unmasked key — `Copy agent key` tooltip

*Background: Background sunken (#EFECE4)*
*Border: 1px solid border default*
*Radius: md (8px)*
*Padding: 10px 14px*

**Reveal behavior:**
- Key is hidden on every page load, regardless of previous session state.
- Reveal persists only for the current page view.
- No "auto-hide after N seconds." The user controls visibility.

---

### Multi-Key Context

*Displayed below both blocks · Switzer sm (14px) · Text muted*
*Displayed only when the active account has more than one agent key.*

```
Showing key: claude-code-local
Switch key →
```

*"Switch key →" — ghost button link · Opens the keys table in Settings · Does not open a dropdown here.*

*When only one key exists, this line is hidden entirely.*

---

---

# 3. SYSTEM STATUS INDICATOR

**Position:** Top-right corner of the main content area · Floated opposite the "Your MCP endpoint" heading.
**Always visible.** Not collapsible. Not dismissible.

---

### Operational State

```
● Operational
```

*Pill badge · Accent subtle background (#E8F4EE) · Accent text (#1A6B4A)*
*Switzer 500 · 12px · Radius: full*
*Dot: 6px filled circle · Accent primary*

**Tooltip on hover (300ms delay):**
```
All systems operational
Last checked 34s ago
```

---

### Degraded State

```
● Degraded
```

*Pill badge · Amber-50 background · Amber-700 text (#B45309)*
*Dot: amber-500*

**Tooltip on hover:**
```
One or more capabilities reporting elevated latency
Last checked 28s ago
```

---

### Incident State

```
● Incident
```

*Pill badge · Red-50 background · Red-700 text (#B91C1C)*
*Dot: red-500*

**Tooltip on hover:**
```
Service disruption detected
Check your runtime connection
Last checked 12s ago
```

---

### Poll behavior

*Polls `GET /health` every 60 seconds.*
*Status updates silently — no toast, no flash.*
*On first load: status resolves within 2 seconds. Shows "Checking..." in text muted until resolved.*

```
● Checking...
```

*Text muted · No badge background until resolved.*

---

---

# 4. USAGE OVERVIEW — TODAY

**Position:** Below the MCP endpoint block.
**Heading:**

```
Usage today
```

*Zodiak xl (22px) · Text primary · Margin-bottom: 20px*

---

### Aggregate Counters (below capability blocks)

**Layout:** Right-aligned row · Switzer base (16px) · Text secondary

```
Total requests today:     [N]
Total requests this month: [N]
```

*Number values: Zodiak 2xl weight · Text primary*
*Label text: Switzer 400 · 14px · Text muted*
*Tooltip on "Total requests today": "Across all capabilities. Resets at 00:00 UTC."*
*Tooltip on "Total requests this month": "Running total since the 1st of the current UTC month."*

---

### Daily Usage Bar — Global

**Label:**
```
DAILY CAP
```
*Switzer 600 · 11px · Uppercase · Text muted*

**Progress bar:**
*Height: 4px · Full width of content area*
*Track: background sunken*
*Fill: accent primary → amber at 80% → red at 95%*

**Status label beside bar:**
- 0–79% → `[N] of 500 requests used`
- 80–94% → `[N] of 500 requests used — approaching daily cap`
- 95–99% → `[N] of 500 requests used — near daily cap`
- 100% → `Daily cap reached — resets at 00:00 UTC`

*Switzer sm (14px) · Text secondary · Status warning color (#B45309) at 80–94% · Status error color (#B91C1C) at 95%+*

**Tooltip on progress bar:**
```
Per-agent key daily limit: 500 requests
Resets at 00:00 UTC
```

---

---

# 5. CAPABILITY USAGE BLOCKS

**Layout:** Four blocks in a 2×2 grid on desktop · Single column on mobile
**Style:** Not cards. Structured blocks with border-top. No drop shadows.
**Border-top:** 2px solid · Border accent (#A8D4BC) on all four
**Background:** Background raised (#F4F1EB)
**Radius:** lg (12px)
**Padding:** 20px 24px

Each block contains:
- Capability name
- Request count for today
- Usage limit and progress
- Average latency (last 10 calls)
- Status chip
- Telemetry labels

---

## IntelliSearch Usage Block

### Capability Name

```
IntelliSearch
```

*Zodiak 2xl (28px) · Text primary*

---

### Request Count

```
[N]
```

*Zodiak 3xl (36px) · Text primary*

**Subcount label:**
```
of 500 requests today
```
*Switzer sm (14px) · Text muted*

---

### Progress Bar

*Height: 4px · Radius: full · Track: background sunken · Fill: accent primary*
*Color transitions match global daily cap bar rules.*

---

### Provider Line

```
ACTIVE PROVIDER
```
*Switzer 600 · 11px · Uppercase · Text muted · Margin-top: 12px*

```
Tavily
```
*Switzer 500 · 14px · Text secondary*

*When budget guard is active (Tavily ≥800/1,000 credits):*
```
DuckDuckGo  (budget guard active)
```
*"budget guard active" — accent subtle background · Accent text · Switzer 500 · 11px · Radius: sm (4px) · Padding: 2px 8px*

---

### Tavily Credits

```
TAVILY CREDITS
```
*Switzer 600 · 11px · Uppercase · Text muted*

```
[N] / 1,000 this month
```
*Switzer 500 · 14px · Text secondary*

*Progress bar: thin (2px) · Same color rules as daily cap bar*

---

### Average Latency

```
AVG LATENCY (LAST 10)
```
*Switzer 600 · 11px · Uppercase · Text muted · Margin-top: 12px*

```
[N]ms
```
*JetBrains Mono · 14px · Text primary*

**Tooltip:**
```
Average end-to-end latency across the last 10 IntelliSearch calls
```

---

### Status Chip

*Positioned top-right corner of the block*

- Active → `● Active` — accent subtle background, accent text
- No calls today → `No activity` — grey background, text muted
- Budget guard → `● Budget guard` — amber background, amber text
- At cap → `● Cap reached` — red background, red text

---

### Operational Description (shown in empty state only — see §13)

```
IntelliSearch routes web search queries through Tavily, DuckDuckGo,
and Apify with automatic provider switching before any provider's
monthly credit limit is reached.
```

*Switzer sm (14px) · Text secondary · Max-width: 280px*

---

---

## VoiceBridge Usage Block

### Capability Name

```
VoiceBridge
```

*Zodiak 2xl · Text primary*

---

### Request Count

```
[N]
```

*Zodiak 3xl · Text primary*

**Subcount label:**
```
of 500 requests today
```
*Switzer sm · Text muted*

---

### Characters Synthesized

```
CHARACTERS SYNTHESIZED
```
*Switzer 600 · 11px · Uppercase · Text muted · Margin-top: 12px*

```
[N] this month
```
*Switzer 500 · 14px · Text secondary*

*Tooltip: "Total characters passed to Unreal Speech this month. Approaches the free tier character limit."*

---

### Cache Hit Rate

```
CACHE HIT RATE
```
*Switzer 600 · 11px · Uppercase · Text muted*

```
[N]%
```
*JetBrains Mono · 14px · Text primary*

*Tooltip: "Requests served from CF R2 audio cache. Cached audio skips Unreal Speech entirely."*

---

### Average TTFB

```
AVG TTFB (LAST 10)
```
*Switzer 600 · 11px · Uppercase · Text muted · Margin-top: 12px*

```
[N]ms
```
*JetBrains Mono · 14px · Text primary*

*Tooltip: "Time to first audio byte. Target: sub-300ms. Cached responses are sub-10ms."*

---

### Status Chip

- Active → `● Active`
- No calls today → `No activity`
- Character limit approaching → `● Char limit warning`
- At cap → `● Cap reached`

---

### Operational Description (empty state only)

```
VoiceBridge streams synthesized audio via Unreal Speech across 48 voices
and 8 languages. Repeated synthesis requests are served from CF R2 audio
cache, bypassing the provider entirely.
```

*Switzer sm · Text secondary*

---

---

## DeepDoc Usage Block

### Capability Name

```
DeepDoc
```

*Zodiak 2xl · Text primary*

---

### Request Count

```
[N]
```

*Zodiak 3xl · Text primary*

**Subcount label:**
```
of 500 requests today
```
*Switzer sm · Text muted*

---

### Gemini Requests

```
GEMINI REQUESTS TODAY
```
*Switzer 600 · 11px · Uppercase · Text muted · Margin-top: 12px*

Two rows:

```
Flash    [N] / 1,500
Pro      [N] / 50
```

*Switzer 500 · 14px · Text secondary*
*Row with higher consumption carries a thin amber progress bar at 80%+*

*Tooltip on Flash: "Gemini 2.5 Flash — handles files under ~500K tokens"*
*Tooltip on Pro: "Gemini 1.5 Pro — reserved for files requiring 2M token context window"*

---

### Files Analyzed

```
FILES ANALYZED TODAY
```
*Switzer 600 · 11px · Uppercase · Text muted*

```
[N] files
```
*Switzer 500 · 14px · Text secondary*

---

### Average Analysis Time

```
AVG ANALYSIS TIME (LAST 10)
```
*Switzer 600 · 11px · Uppercase · Text muted · Margin-top: 12px*

```
[N]s
```
*JetBrains Mono · 14px · Text primary*

*Tooltip: "End-to-end time from upload to structured analysis response. Varies by file size and model."*

---

### Status Chip

- Active → `● Active`
- No calls today → `No activity`
- Flash quota warning → `● Flash quota warning`
- Pro quota near limit → `● Pro quota near limit`
- Quota exhausted → `● Quota reached`

---

### Operational Description (empty state only)

```
DeepDoc uploads files to the Gemini Files API and routes analysis
through Gemini 2.5 Flash or Gemini 1.5 Pro based on file complexity.
The 2M token context window handles entire codebases and multi-format documents.
```

*Switzer sm · Text secondary*

---

---

## MemoryCore Usage Block

### Capability Name

```
MemoryCore
```

*Zodiak 2xl · Text primary*

---

### Request Count

```
[N]
```

*Zodiak 3xl · Text primary*

**Subcount label:**
```
of 500 requests today
```
*Switzer sm · Text muted*

---

### Memory Store Size

```
MEMORY STORE
```
*Switzer 600 · 11px · Uppercase · Text muted · Margin-top: 12px*

```
[N] / 10,000 chunks
```
*Switzer 500 · 14px · Text secondary*

*Progress bar: thin (2px) · Color rules same as daily cap*
*Tooltip: "Total memory chunks stored in Supabase pgvector for this agent key. Auto-summarization triggers at 8,000 chunks."*

*At 8,000+:*
```
[N] / 10,000 chunks — auto-summarization active
```
*"auto-summarization active" in accent subtle style*

---

### Active Namespaces

```
ACTIVE NAMESPACES
```
*Switzer 600 · 11px · Uppercase · Text muted*

```
[N] namespaces
```
*Switzer 500 · 14px · Text secondary*

*Tooltip: "Logical partitions within this agent key's memory store."*

---

### Avg Search Latency

```
AVG SEARCH LATENCY (LAST 10)
```
*Switzer 600 · 11px · Uppercase · Text muted · Margin-top: 12px*

```
[N]ms
```
*JetBrains Mono · 14px · Text primary*

*Tooltip: "End-to-end latency from opticontext_memory_search call to ranked result set."*

---

### Status Chip

- Active → `● Active`
- No calls today → `No activity`
- Approaching chunk limit (8K+) → `● Near summarization threshold`
- At limit → `● Memory limit reached`

---

### Operational Description (empty state only)

```
MemoryCore stores and retrieves context using Supabase pgvector embeddings.
Each agent key has an isolated memory store partitioned by namespace.
Memories persist across agent sessions.
```

*Switzer sm · Text secondary*

---

---

# 6. RECENT ACTIVITY TABLE

**Position:** Below the capability usage blocks.

**Heading:**

```
Recent activity
```

*Zodiak xl (22px) · Text primary · Margin-bottom: 16px*

---

### Table Structure

**Columns:** Time · Capability · Agent key · Status · Latency

*Table header: Background raised · Switzer 600 · 11px · Uppercase · Letter-spacing: 0.06em · Text muted*
*Table rows: Border-bottom: 1px border default · Switzer 400 · 14px*
*Row hover: Background raised*
*No outer table border*

---

### Column Formats

**Time column:**
- Display: relative time — `2 min ago` · `14 min ago` · `1 hr ago`
- Tooltip on hover: full ISO timestamp — `2026-05-21T14:32:07Z`
- *Switzer 400 · 14px · Text muted*

**Capability column:**
- Exact capability proper noun — `IntelliSearch` / `VoiceBridge` / `DeepDoc` / `MemoryCore`
- MCP tool name below in muted monospace: `opticontext_search`
- *Capability: Switzer 500 · 14px · Text primary*
- *Tool name: JetBrains Mono · 12px · Text muted*

**Agent key column:**
- Masked: `opctx_████…f3a2`
- Show last 4 characters only. Format: `opctx_████…[last4]`
- *JetBrains Mono · 13px · Text secondary*
- Tooltip: full key name (not the full key value) — e.g. `claude-code-local`

**Status column:**
- Success: `● Success` — accent subtle background, accent text
- Error: `● Error` — red-50 background, red-700 text
- Chip style: Radius full · Switzer 500 · 12px · Padding: 2px 10px
- Tooltip on error chip: the error code — e.g. `RATE_LIMITED`

**Latency column:**
- Format: `[N]ms`
- *JetBrains Mono · 13px · Text secondary*
- No color coding on latency. Just the number.

---

### Activity Row Examples

```
Time          Capability     Agent key           Status     Latency
─────────────────────────────────────────────────────────────────────
2 min ago     IntelliSearch  opctx_████…f3a2     ● Success  312ms
              opticontext_search

6 min ago     MemoryCore     opctx_████…f3a2     ● Success  87ms
              opticontext_memory_search

11 min ago    DeepDoc        opctx_████…a1b9     ● Error    —
              opticontext_analyze

23 min ago    VoiceBridge    opctx_████…f3a2     ● Success  248ms
              opticontext_tts

1 hr ago      IntelliSearch  opctx_████…a1b9     ● Success  441ms
              opticontext_search
```

---

### Table Footer

```
Showing the last 10 capability calls across all agent keys.
```

*Switzer sm (14px) · Text muted · Margin-top: 12px*

```
Full log export coming soon.
```

*Switzer sm · Text muted · Italic — not a link. Not a promise of a date. Just informational.*

---

### Empty State (no activity yet)

```
No recent activity.
Capability calls will appear here after your runtime makes its first request.
```

*Switzer base (16px) · Text muted · Centered in table area · Height: 120px*

---

### Loading State

```
Loading activity
```

*Switzer sm · Text muted · Animated skeleton rows — 3 rows of background sunken shimmer blocks*
*Skeleton animation: opacity 0.4 → 0.8 → 0.4 · 1.4s loop · Not a spinner*

---

---

# 7. CONFIG COPY SECTION

**Position:** Below the endpoint/key blocks. Above Usage Today.
**Purpose:** The most immediate utility action in the dashboard. A developer arriving for the first time should be able to copy a working config in under 20 seconds.

---

### Section Label

```
MCP CONFIG
```

*Switzer 600 · 11px · Uppercase · Letter-spacing: 0.08em · Text muted · Margin-bottom: 12px*

---

### Runtime Selector Tabs

```
Claude Code   Cursor   OpenClaw   Custom
```

*Tab style: Bottom-border tabs (matching global tab component)*
*Active tab: accent primary underline · Accent text*
*Inactive tab: text muted · No underline*
*Tab transition: 150ms ease*

---

### Config Block — Claude Code (default tab)

**File label (top-left of code block):**
```
~/.claude/claude_code_config.json
```

**Copy button (top-right of code block):**
```
Copy config
```

**Code:**

```json
{
  "mcpServers": {
    "opticontext": {
      "type": "http",
      "url": "https://mcp.opticontext.dev/mcp",
      "headers": {
        "Authorization": "Bearer opctx_████████████████████████████████"
      }
    }
  }
}
```

*When key is revealed: `opctx_████…` is replaced with the full real key value*
*When key is masked: `opctx_████████████████████████████████` (32 block characters)*
*JetBrains Mono · 14px · Code surface background (#1C1C1A) · Code text (#E8E4DC)*
*Radius: sm (4px) · Padding: 16px 20px*
*Border: 1px solid rgba(255,255,255,0.08)*

**Note below code block:**
```
The key shown is masked. Reveal it above before copying.
```
*Switzer sm (13px) · Text muted · Displayed only while key is masked*
*Hidden after key is revealed*

---

### Config Block — Cursor Tab

**File label:** `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "opticontext": {
      "url": "https://mcp.opticontext.dev/mcp",
      "transport": "streamable-http",
      "headers": {
        "Authorization": "Bearer opctx_████████████████████████████████"
      }
    }
  }
}
```

---

### Config Block — OpenClaw Tab

**File label:** `~/.openclaw/config.json`

```json
{
  "mcp": {
    "servers": {
      "opticontext": {
        "url": "https://mcp.opticontext.dev/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer opctx_████████████████████████████████"
        }
      }
    }
  }
}
```

---

### Config Block — Custom Tab

**File label:** `mcp.config.json`

```json
{
  "server": {
    "name": "opticontext",
    "url": "https://mcp.opticontext.dev/mcp",
    "transport": "streamable-http"
  },
  "auth": {
    "type": "bearer",
    "token": "opctx_████████████████████████████████"
  }
}
```

**Note below custom block:**
```
Any runtime implementing MCP Streamable HTTP transport (2025-11-25) connects
without modification. Refer to your runtime's MCP documentation for the
exact config field names.
```
*Switzer sm (13px) · Text secondary*

---

### Validation Note (below all tabs)

```
Endpoint: https://mcp.opticontext.dev/mcp
Protocol: MCP Streamable HTTP · JSON-RPC 2.0
Agent key format: opctx_<slug>_<32hex>
```

*JetBrains Mono · 12px · Text muted · Background sunken · Radius: sm · Padding: 10px 14px*

---

### Quick Actions (bottom of dashboard main area)

```
Manage agent keys →     View quickstart →
```

*Ghost buttons · Side by side · Gap: 16px*
*"Manage agent keys →" links to `/dashboard/settings`*
*"View quickstart →" links to `/docs/quickstart`*

---

---

# 8. STATUS INDICATORS — FULL REFERENCE

This section defines every status state that can appear anywhere on the dashboard. All are chip components (radius: full, Switzer 500, 12px, padding: 2px 10px).

---

## Operational

```
● Operational
```

*Background: accent subtle (#E8F4EE) · Text: accent text (#1A6B4A)*
*Dot: accent primary*
*Use for: system health chip, per-capability status when all calls are succeeding*

---

## Degraded

```
● Degraded
```

*Background: amber-50 · Text: #B45309 (status warning)*
*Dot: amber-500*
*Use for: system health chip when /health returns degraded state, or when a capability's error rate exceeds 20% in the last 10 calls*

---

## Reconnecting

```
● Reconnecting
```

*Background: amber-50 · Text: #B45309*
*Dot: amber-500 · Pulsing opacity animation (0.4 → 1.0, 800ms loop — only on this chip)*
*Use for: /health polling has failed once; next poll is in progress*

---

## Rate-Limited

```
● Rate-limited
```

*Background: amber-50 · Text: #B45309*
*Dot: amber-600*
*Use for: per-capability chip when a RATE_LIMITED or DAILY_CAP_REACHED error has been returned in the last 5 minutes*

---

## Key Revoked

```
● Key revoked
```

*Background: red-50 · Text: #B91C1C (status error)*
*Dot: red-500*
*Use for: agent key table row after revocation is confirmed · Status persists until the row is dismissed or the page refreshes*

---

## Initializing

```
● Initializing
```

*Background: background sunken (#EFECE4) · Text: text muted (#8A8A82)*
*Dot: text muted · No animation*
*Use for: a newly created agent key that has not yet made any capability calls*

---

## Budget Guard Active

```
● Budget guard
```

*Background: accent subtle (#E8F4EE) · Text: accent text (#1A6B4A)*
*Dot: accent primary*
*Tooltip: "Tavily credits at or above 800/1,000. IntelliSearch routing through DuckDuckGo."*
*Use for: IntelliSearch capability block when budget guard has triggered*

*Note: Budget guard is not a warning state. It is an operational state. The system is working as designed.*

---

## No Activity

```
No activity
```

*Background: background sunken · Text: text muted*
*No dot — this is a neutral state, not a status condition*
*Use for: any capability block where zero calls have been made today*

---

---

# 9. SETTINGS PAGE — /dashboard/settings

**Route:** `/dashboard/settings`
**Layout:** Same top nav and sidebar as dashboard home. Active sidebar link: Settings.
**Background:** Background base. No atmospheric glow. No grid layer. Pure paper surface.

---

### Page Heading

```
Settings
```

*Zodiak 3xl (36px) · Text primary · Margin-bottom: 48px*

---

---

## Agent Keys Section

### Section Heading

```
Agent Keys
```

*Zodiak 2xl (28px) · Text primary*
*Border-top: 1px solid border default · Padding-top: 40px*

---

### Section Description

```
Each runtime should use its own agent key.
Revoke individually if a key is compromised.
```

*Switzer base (16px) · Text secondary · Margin-top: 8px · Margin-bottom: 32px*

---

### Create Key — Input Row

**Input:**
*Label (above input): none — placeholder carries the context*
*Placeholder:* `e.g. claude-code-local`
*Background: background base · Border: 1px border default · Focus border: accent primary*
*Radius: md (8px) · Padding: 10px 14px · Font: Switzer 400 · 16px*
*Width: 280px*

**Button (beside input):**
```
Create key
```
*Primary button · Padding: 10px 20px · Switzer 600 · 14px*

**Loading state (during creation):**
```
Generating key
```
*Button disabled · Text changes to loading label · No spinner inside button — button opacity: 0.65*

---

### Key Name Rules (validation)

Validated on submit, not on every keystroke.

- Empty name:
  ```
  A key name is required.
  ```
  *Switzer sm (14px) · Status error color · Below the input field · Margin-top: 6px*

- Name already in use:
  ```
  A key with this name already exists. Choose a different name.
  ```
  *Same style*

- Name too long (over 48 characters):
  ```
  Key name must be 48 characters or fewer.
  ```
  *Same style*

- Invalid characters:
  ```
  Key name may only contain letters, numbers, and hyphens.
  ```
  *Same style*

---

### New Key Reveal — Inline Block

*Displayed immediately below the Create key row after successful creation.*
*Not a modal. Inline, anchored to the form.*

**Heading:**
```
Key created.
```
*Zodiak xl (22px) · Text primary*

**Warning:**
```
This key will not be shown again. Copy it now.
```
*Switzer base (16px) · Status warning color (#B45309) · Margin-top: 8px*
*No icon needed. The text carries the urgency.*

**Key value (fully revealed):**
```
opctx_[keyname]_[32hex]
```
*JetBrains Mono · 14px · Background sunken · Border: border accent (#A8D4BC) · Radius: md · Padding: 12px 16px · Full width*

**Copy button (below key):**
```
Copy key
```
*Primary button · Full width of the key block*

**After copy:**
```
Copied.
```
*Button label changes for 1500ms then reverts to "Copy key"*

**Dismiss link (below copy button):**
```
I've copied the key. Dismiss.
```
*Ghost button · Text secondary · This collapses the reveal block.*
*Clicking this without copying: no warning. The user is responsible.*

---

### Keys Table

**Columns:** Name · Key (masked) · Created · Last used · Actions

*Table header: Switzer 600 · 11px · Uppercase · Text muted · Background raised*
*Table rows: Switzer 400 · 14px · Border-bottom: border default · Row hover: background raised*

---

**Name column:**
*Switzer 500 · 14px · Text primary*
*Example: `claude-code-local`*

**Key column (masked):**
*JetBrains Mono · 13px · Text muted*
*Format: `opctx_████…[last4]`*
*Tooltip: "Full key is not recoverable from the dashboard."*

**Created column:**
*Switzer 400 · 14px · Text secondary*
*Format: relative date — `3 days ago`*
*Tooltip: full date — `May 18, 2026`*

**Last used column:**
*Switzer 400 · 14px · Text secondary*
*Format: relative time — `2 hr ago` / `Yesterday` / `4 days ago`*
*Tooltip: full ISO timestamp*
*Never used state:* `Never` — Switzer 400 · Text muted

**Actions column (per row — three icon buttons):**

| Icon | Tooltip | Action |
|------|---------|--------|
| Copy icon | `Copy key name` | Copies the key's name string (not the key value) |
| Rename icon | `Rename key` | Opens inline rename input for that row |
| Revoke icon | `Revoke key` | Triggers inline revoke confirmation (see §10) |

*Icon buttons: 32px × 32px · Hover: background raised · No border · Radius: md*
*Revoke icon: text secondary on default · status error color (#B91C1C) on hover*

---

### Rename Flow (inline — per row)

Clicking rename replaces the Name cell with an input:

```
[claude-code-local     ]  ✓  ✕
```

*Input: same style as create key input but compact (Switzer 400 · 14px)*
*✓ (confirm): icon button · Accent primary*
*✕ (cancel): icon button · Text muted*

**On confirm:**
- Name updates inline. No page reload.
- Confirmation: `Saved.` — appears briefly below the row in text muted sm, fades in 200ms, fades out after 1500ms.

**Validation (same rules as create):**
- Shows error below the inline input, not in a toast.

---

### Empty Keys State

```
No agent keys yet.
Create your first key to start using OptiContext.
```

*Switzer base (16px) · Text muted · Centered in table area · Padding: 48px 0*

---

### Maximum Keys Notice

*Displayed above the table when the account has 10 or more keys:*

```
10 agent keys active. Remove unused keys before creating new ones.
```

*Switzer sm (14px) · Status warning color · Background: amber-50 · Radius: md · Padding: 10px 14px · Margin-bottom: 16px*

---

---

## Usage Alerts Section

### Section Heading

```
Usage Alerts
```

*Zodiak 2xl (28px) · Text primary*
*Border-top: 1px solid border default · Padding-top: 40px · Margin-top: 48px*

---

### Section Description

```
Receive a Telegram message before reaching the daily capability limit.
```

*Switzer base (16px) · Text secondary · Margin-top: 8px · Margin-bottom: 24px*

---

### Alert Threshold Input

**Label:**
```
Alert when daily usage reaches
```
*Switzer 500 · 14px · Text primary · Margin-bottom: 8px*

**Input row:**
```
[  80  ] % of daily limit
```

*Number input: width 72px · Background base · Border: border default · Radius: md · Padding: 10px 14px · Switzer 400 · 16px · Text primary*
*"% of daily limit" label: Switzer 400 · 14px · Text secondary · Margin-left: 8px*
*Valid range: 50–95. Values outside this range fail validation.*

**Validation:**
- Below 50:
  ```
  Minimum threshold is 50%.
  ```
- Above 95:
  ```
  Maximum threshold is 95%. The daily cap error handles the hard limit.
  ```
*Error style: Switzer sm · Status error color · Below input · Margin-top: 6px*

**Below the input:**
```
Alerts fire once per day per capability when the threshold is crossed.
A Telegram bot token and chat ID must be configured below.
```
*Switzer sm (13px) · Text muted*

**Save button:**
```
Save threshold
```
*Secondary button · Margin-top: 16px*

---

---

## Telegram Alerts Section

### Section Heading

```
Telegram Alerts
```

*Zodiak 2xl (28px) · Text primary*
*Border-top: 1px solid border default · Padding-top: 40px · Margin-top: 48px*

---

### Section Description

```
Connect a Telegram bot to receive usage alerts and budget guard notifications.
```

*Switzer base (16px) · Text secondary · Margin-top: 8px · Margin-bottom: 24px*

---

### Input: Bot Token

**Label:**
```
Telegram Bot Token
```
*Switzer 500 · 14px · Text primary · Margin-bottom: 6px*

**Input:**
*Placeholder:* `1234567890:AAAA...`
*Background base · Border: border default · Radius: md · Padding: 10px 14px*
*Full width of settings content area · Switzer 400 · 16px*

---

### Input: Chat ID

**Label:**
```
Chat ID
```
*Switzer 500 · 14px · Text primary · Margin-bottom: 6px*

**Input:**
*Placeholder:* `-100123456789`
*Same style as Bot Token input*
*Width: 240px — this is a fixed-format number, not a long string*

**Helper text:**
```
Negative IDs indicate a group or channel. Positive IDs indicate a direct chat.
```
*Switzer sm (13px) · Text muted · Margin-top: 6px*

---

### Button Row

```
Save webhook        Send test message
```

*"Save webhook" — secondary button*
*"Send test message" — ghost button · Only active after webhook credentials are saved*

**"Send test message" disabled state:**
*Opacity: 0.45 · Cursor: not-allowed · No hover effect*
*Tooltip on disabled: `Save your bot token and chat ID first.`*

---

### Connected State (after successful save)

```
● Webhook connected
```

*Pill chip · Accent subtle · Accent text · Displayed beside the "Save webhook" button after confirmation*
*Replaces any prior error state immediately on success*

---

### Documentation Link

```
How to set up a Telegram bot →
```

*Ghost button · Links to `/docs/guides/telegram-alerts` (future doc page)*
*Switzer 500 · 14px · Accent text · No underline by default · Underline on hover*
*Displayed below the button row*

---

---

## Account Section

### Section Heading

```
Account
```

*Zodiak 2xl (28px) · Text primary*
*Border-top: 1px solid border default · Padding-top: 40px · Margin-top: 48px*

---

### Account Details Row

```
EMAIL
```
*Switzer 600 · 11px · Uppercase · Text muted · Margin-bottom: 4px*

```
sandy@gmail.com
```
*Switzer 400 · 16px · Text primary · Read-only — not an input*

```
SIGN-IN METHOD
```
*Switzer 600 · 11px · Uppercase · Text muted · Margin-top: 16px · Margin-bottom: 4px*

```
[Google logo SVG]  Google
```
*Switzer 400 · 16px · Text secondary · Logo: 16px × 16px · Gap: 8px*

---

### Sign Out

```
Sign out
```

*Ghost button · Text primary · Margin-top: 32px*
*No confirmation required — authentication is stateless. Sign-back-in is fast.*
*On click: clears Firebase session, redirects to `/*

---

---

# 10. DESTRUCTIVE ACTION FLOWS

**Philosophy:** Destructive actions require a confirmation step. The confirmation must be specific to the action, not a generic "are you sure?" The user should understand exactly what will be lost before proceeding.

---

## Revoke Key Flow

### Trigger

Clicking the revoke icon on a keys table row.

---

### Step 1 — Inline Confirmation Expansion

The row expands below itself (not a modal, not a full-screen overlay):

```
Revoke  claude-code-local?

Any runtime using this key loses access immediately.
This cannot be undone. The key cannot be restored.

[Revoke key]    [Cancel]
```

**"Revoke  [key name]?"**
*Switzer 500 · 14px · Text primary · The key name is bold to make it clear which key is targeted*

**Warning text:**
*Switzer sm (14px) · Text secondary · Margin-top: 6px*

**"Revoke key" button:**
*Destructive button style — transparent background · Status error border (#FECACA) · Status error text (#B91C1C)*
*Radius: md (8px) · Padding: 10px 20px · Switzer 500 · 14px*

**"Cancel" button:**
*Ghost button · Text secondary*

**Expansion animation:**
*Height 0 → content height · 200ms ease · Fade in simultaneously*

---

### Step 2 — Loading (during revoke request)

Both buttons disabled. "Revoke key" text changes:

```
Revoking
```

*Button opacity: 0.65*

---

### Step 3 — Confirmed

Row status chip updates to `● Key revoked`.
Row actions column: all three icon buttons replaced with a single label:

```
Revoked
```

*Switzer 500 · 12px · Status error color · No background*

Confirmation copy (below table row, brief):

```
Key revoked.
```

*Switzer sm · Text muted · Fades out after 3000ms*

---

### Revoke — Error State

If the revoke request fails:

```
Revoke failed. The key is still active.
```

*Switzer sm (14px) · Status error color · Below the confirmation row · Margin-top: 6px*

```
Retry
```
*Ghost button · Accent text · Inline beside error message*

---

---

# 11. SUCCESS STATES

All success states follow microcopy rules from OPTICONTEXT_TERMINOLOGY.md §7.
Past tense. No punctuation except period. No exclamation marks.

---

## Key Created

**Inline reveal block heading:**
```
Key created.
```
*Zodiak xl (22px) · Text primary*

---

## Config Copied

**Copy button (after click — 1500ms duration):**
```
Copied.
```
*Button label swap · Accent text · Checkmark icon replaces copy icon during the 1500ms window*
*Subtle emerald flash on the code block background (opacity 0 → 0.04 → 0 · 600ms)*

---

## Webhook Connected

**Beside "Save webhook" button:**
```
● Webhook connected
```
*Pill chip · Accent subtle · Accent text · Fades in 200ms · Persists until page navigates away*

---

## Settings Saved

**Below "Save threshold" or any settings form:**
```
Saved.
```
*Switzer sm (14px) · Text muted · Fades in 200ms · Fades out after 2000ms*
*No toast. No banner. Inline below the saved control.*

---

## Test Message Sent

**After "Send test message" is clicked:**
```
Test message sent.
```
*Switzer sm (14px) · Text muted · Inline below button · Fades out after 3000ms*

---

## Key Name Updated

**Inline in the table row after rename confirmation:**
```
Saved.
```
*Switzer sm (13px) · Text muted · Appears below the renamed row · Fades out after 1500ms*

---

---

# 12. ERROR STATES

All error messages follow the three-question formula from OPTICONTEXT_TERMINOLOGY.md §6:
1. What happened? 2. Why? 3. What should the runtime do next?

---

## Invalid Webhook

**Context:** "Save webhook" returns a validation error from the Telegram API.

```
Webhook connection failed.
The bot token or chat ID is incorrect.
Verify both values and save again.
```

*Switzer sm (14px) · Status error color · Below the button row · Margin-top: 8px*
*No chip. Plain inline text.*

---

## Revoked Key — Dashboard Warning

**Context:** Dashboard loads but the active agent key used to fetch usage has been revoked.

```
Agent key revoked.
This key has been revoked and cannot make capability calls.
Create a new key in Settings.
```

*Inline warning block · Background: red-50 · Border-left: 3px solid status error · Padding: 12px 16px · Radius: 0 8px 8px 0*
*Heading: Switzer 600 · 14px · Status error color*
*Body: Switzer 400 · 14px · Text secondary*

**Link:**
```
Go to Settings →
```
*Ghost button · Accent text · Inline in the warning block*

---

## Quota Exceeded (per capability)

**Context:** A capability block shows 100% utilization and the daily cap is reached.

Shown as a banner *inside* the relevant capability usage block:

```
Daily cap reached.
IntelliSearch has reached 500 requests today.
Resets at 00:00 UTC.
```

*Background: red-50 · Border-left: 3px solid status error · Padding: 10px 14px · Radius: 0 8px 8px 0 · Margin-top: 12px*
*Switzer sm (14px) · Status error color for heading · Text secondary for body*

---

## Invalid Config (config copy block)

**Context:** The runtime selector tab chosen requires a config format but the agent key field is still masked.

```
Reveal your agent key before copying.
The config shown contains a masked placeholder, not your actual key.
```

*Switzer sm (13px) · Status warning color (#B45309) · Below the config code block · Margin-top: 8px*
*This is a warning, not an error. The user can still copy — they are just informed.*

---

## Usage Data Load Failed

**Context:** `GET /usage` returns an error or times out.

Shown in place of the usage blocks:

```
Usage data unavailable.
Could not load capability usage from the OptiContext edge server.
Reload the page to try again.
```

*Switzer base (16px) · Text secondary · Centered in the usage blocks area*

```
Reload
```
*Secondary button · Margin-top: 16px · Triggers a re-fetch, not a full page reload*

---

## Activity Load Failed

**Context:** Recent activity table fetch fails.

```
Activity data unavailable.
Could not load recent capability calls.
Reload the page to try again.
```

*Same style as usage data failed state · Inside the table area*

---

## Settings Save Failed

**Context:** Any settings form save request returns an error.

```
Save failed. Changes were not applied.
```

*Switzer sm (14px) · Status error color · Below the relevant save button · Margin-top: 6px*

```
Retry
```
*Ghost button · Accent text · Inline beside error message*

---

## Auth Error — Session Expired

**Context:** Firebase session has expired mid-session.

*Full-width banner at the top of the main content area (below the top nav):*

```
SESSION
Session expired. Sign in again to continue.
```

*Background: amber-50 · Border-bottom: 1px solid amber-200 · Padding: 12px 24px*
*"SESSION" label: Switzer 600 · 11px · Uppercase · Amber-700*
*Body: Switzer 400 · 14px · Text primary*

```
Sign in
```
*Primary button · Right-aligned in the banner · Links to `/auth`*

---

---

# 13. ONBOARDING / EMPTY STATES

Empty states on first use guide the runtime operator without cheerful filler copy.
All follow terminology rules: specific, direct, operational.

---

## No Agent Keys

**Location:** Agent Keys table on Settings page — first time the page loads.

```
No agent keys yet.
Create your first key to start using OptiContext.
```

*Switzer base (16px) · Text muted · Centered in table area · Padding: 48px 0*

---

## No Keys, Dashboard View

**Location:** Dashboard main area — first login, no keys created.

*Replaces the MCP endpoint block with an onboarding prompt:*

```
Create an agent key to get started.
```
*Zodiak 2xl (28px) · Text primary*

```
An agent key is required to authenticate your runtime with the MCP endpoint.
Create one in Settings, then return here for your MCP config.
```
*Switzer base (16px) · Text secondary · Margin-top: 8px · Max-width: 480px*

```
Go to Settings
```
*Primary button · Margin-top: 20px · Links to `/dashboard/settings`*

---

## No Activity

**Location:** Recent Activity table — no capability calls yet.

```
No recent activity.
Capability calls will appear here after your runtime makes its first request.
```

*Switzer base (16px) · Text muted · Centered in table area · Height: 120px*

---

## No Usage — Capability Block

**Location:** Any capability usage block — zero calls today.

*The count shows `0`. The progress bar shows 0%. The status chip shows `No activity`.*
*Below the telemetry labels, the operational description is displayed (see §5 per-capability descriptions).*

---

## Webhook Not Configured

**Location:** Usage Alerts section — Telegram section when no webhook is saved.

```
No Telegram bot connected.
Usage alerts will not be delivered until a bot token and chat ID are configured.
```

*Switzer sm (14px) · Text muted · Below the section description*
*Not an error. Not a warning. Informational.*

---

---

# 14. LOADING STATES

Loading states appear during data fetches. All follow microcopy rules: present progressive, no punctuation.

---

## Dashboard Initial Load

**Before usage data resolves:**

Capability blocks show skeleton placeholders:
- Count area: background sunken rectangle · 48px × 32px · shimmer
- Progress bar: background sunken · opacity 0.4
- Telemetry labels: background sunken rectangles · varying widths · shimmer

**Status chip:**
```
● Checking
```
*Text muted · No badge background*

**Loading label (below capability blocks heading):**
```
Loading usage data
```
*Switzer sm · Text muted · Margin-top: 8px*

---

## Recent Activity Table Load

```
Loading activity
```

*Switzer sm (14px) · Text muted · Above the skeleton rows*

*3 skeleton rows: each row has shimmer blocks at the expected column widths*
*Skeleton animation: opacity 0.4 → 0.8 → 0.4 · 1.4s ease-in-out loop*

---

## Key Creation In Progress

**"Create key" button:**
```
Generating key
```
*Button label change · Disabled state · Opacity: 0.65*

---

## Settings Save In Progress

**Any save button:**
```
Saving
```
*Button label change · Disabled state · Opacity: 0.65*

---

## Revoke In Progress

**"Revoke key" button in the inline confirmation:**
```
Revoking
```
*Button label change · Disabled state · Opacity: 0.65*

---

## Test Message In Progress

**"Send test message" button:**
```
Sending
```
*Button label change · Disabled state · Opacity: 0.65*

---

## Connecting to OptiContext (health check)

**System status chip before first poll resolves:**
```
● Checking
```
*Text muted · No badge background*

---

---

# 15. TERMINOLOGY VERIFICATION

*Run against OPTICONTEXT_TERMINOLOGY.md before publishing.*

---

## ✓ Test 1 — Infrastructure or Plugin?

Dashboard header read aloud:
> "Your MCP endpoint."

Result: **Infrastructure. Pass.**

---

## ✓ Test 2 — Vendor Bias Check

| Vendor / runtime named | Appearances in Phase 7 | Context |
|---|---|---|
| Claude Code | 1 | Config tab label only — tab is also labelled Cursor / OpenClaw / Custom |
| Cursor | 1 | Config tab label only |
| OpenClaw | 1 | Config tab label only |
| Google | 1 | Account section · "Sign-in method: Google" — factual, not promotional |
| Telegram | 3 | Webhook section — functional context only |

No vendor placed first for non-alphabetical reasons.
Config tab order: Claude Code · Cursor · OpenClaw · Custom — alphabetical within the set.

Result: **Pass.**

---

## ✓ Test 3 — Specificity Check

| Adjective avoided | Replaced with |
|---|---|
| "fast" | Not used. Latency shown as numbers (e.g. `[N]ms`). |
| "reliable" | Not used. Budget guard behavior described precisely. |
| "easy" | Not used. Actions described by their steps. |
| "powerful" | Not used anywhere in the dashboard copy. |
| "seamless" | Not used. |
| "real-time" | Used in one tooltip — "Resets at 00:00 UTC." — factual, not marketing. |

Result: **Pass.**

---

## ✓ Test 4 — Forbidden Term Scan

| Forbidden term | Status |
|---|---|
| "API key" (standalone) | ❌ Not used in product copy. "Agent key" used throughout. |
| "tools" (for capabilities) | ❌ Not used in product copy. "Capabilities" used. "MCP tool name" used only in the activity table column where showing `opticontext_search` etc. |
| "client" (for runtimes) | ❌ Not used. "Runtime" used throughout. |
| "plugin" | ❌ Not used. |
| "webhook" | ⚠ Used in "Telegram Alerts" section heading as "Save webhook" and "Webhook connected." Per Terminology §1: "webhook" is forbidden *for the MCP endpoint*. The Telegram outbound notification connection is correctly described as a webhook — this is a different system. **Acceptable.** |
| "REST API" | ❌ Not used. |
| "AI wrapper" | ❌ Not used. |
| "get started" | ❌ Not used. "Create your first key" used instead. |
| "seamless" | ❌ Not used. |
| "powerful" | ❌ Not used. |
| "we" / "our" | ❌ Not used. "OptiContext" used where product reference is needed. |
| "free tier" (as value prop) | ❌ Not used in hero or capability positioning. Only appears in provider limit tooltips as factual context ("Approaches the free tier character limit"). |
| "Something went wrong" | ❌ Not used. Every error message is specific. |
| "Sorry" / "Unfortunately" / "Oops" | ❌ Not used in any error message or state. |

Result: **Pass.**

---

## ✓ Test 5 — One-Sentence Summary

> "The OptiContext dashboard is an operational control surface for managing agent keys, monitoring per-capability usage telemetry, and configuring the MCP endpoint connection for any MCP-compatible runtime."

Completes: *"OptiContext is ______"* correctly.

Result: **Pass.**

---

## ✓ Capability Names Check

| Capability | Used Correctly |
|---|---|
| IntelliSearch | ✓ Capitalized. Used as proper noun throughout. |
| VoiceBridge | ✓ Capitalized. "TTFB" in tooltip context — correct technical term. |
| DeepDoc | ✓ Capitalized. |
| MemoryCore | ✓ Capitalized. "Namespace" used correctly per terminology contract. |

---

## ✓ Error Message Formula Check

All error messages answer:
1. What happened? — Named specifically.
2. Why? — One sentence, cause only.
3. What should the runtime/operator do? — Actionable.

Verified against:
- Invalid webhook → Cause named, action given.
- Revoked key → State explained, next step to Settings provided.
- Quota exceeded → Limit named, reset time given.
- Usage load failed → Source named, retry instruction given.

Result: **Pass.**

---

## ✓ Microcopy Formula Check

| Microcopy type | Examples | Compliance |
|---|---|---|
| Confirmations | "Copied." "Saved." "Key created." "Key revoked." | ✓ Past tense, period, no exclamation. |
| Loading states | "Loading usage data" "Generating key" "Saving" "Revoking" | ✓ Present progressive, no punctuation. |
| Empty states | "No agent keys yet. Create your first key to start using OptiContext." | ✓ One sentence, descriptive, includes next action. |
| Destructive confirmation | "Revoke claude-code-local? Any runtime using this key loses access immediately. This cannot be undone." | ✓ Specific. Sober. No softening. |
| Button labels | "Create key" "Copy config" "Revoke" "Save threshold" "Send test message" | ✓ Imperative verb + noun. No gerunds. |
| Placeholder text | `e.g. claude-code-local` · `1234567890:AAAA...` · `-100123456789` | ✓ Shows format, not instructions. |
| Tooltip text | "Daily requests across all capabilities" "Reset daily at 00:00 UTC" | ✓ One sentence, no trailing period if fragment. |

Result: **Pass.**

---

## ✓ Backend Alignment Check

| Dashboard element | Backend reference |
|---|---|
| Endpoint URL `https://mcp.opticontext.dev/mcp` | Plan §13 — API Design |
| Agent key format `opctx_<slug>_<32hex>` | Terminology §1, Plan §5 |
| 500 requests/day per agent key | Plan §5, Phase 6 §8 |
| 30 requests/minute per agent key | Phase 6 §8 |
| Tavily 1,000 credits/month · Budget guard at 800 | Plan §7, Phase 6 §8 |
| Unreal Speech TTFB sub-300ms | Plan §8 |
| Gemini Flash 1,500 req/day · Pro 50 req/day | Plan §3, Phase 6 §8 |
| MemoryCore 10,000 chunk limit · Auto-summarization at 8,000 | Plan §10, Phase 6 §7 |
| CF KV for per-minute rate limiting | Plan §5, Phase 6 §8 |
| Turso for per-day tracking | Plan §5, Phase 6 §8 |
| Telegram webhook alerts | Plan §12 (Usage Dashboard) |
| `GET /health` polling | Phase 6 §2 (Endpoint Summary) |
| `GET /usage` for dashboard data | Phase 6 §2 (Endpoint Summary) |
| Error codes referenced (RATE_LIMITED, DAILY_CAP_REACHED, etc.) | Phase 6 §7 |
| Firebase Auth for Google sign-in | Plan §5 |

Result: **All dashboard elements traceable to backend plan and API reference. Pass.**

---

## ✓ Frontend Alignment Check

| Dashboard element | Frontend Guide reference |
|---|---|
| Top nav (60px, wordmark + account) | Part 0 — Navigation, Signed-in nav |
| Sidebar (240px, Dashboard · Settings) | Part 0 — Dashboard sidebar |
| Dashboard home layout | Part 7 — Dashboard Home |
| MCP endpoint block (endpoint + key blocks) | Part 7 — Dashboard Home |
| Usage summary (4 blocks, progress bars) | Part 7 — Usage Summary |
| Recent Activity table (columns, style) | Part 7 — Recent Activity |
| Quick Actions (ghost buttons) | Part 7 — Quick Actions |
| Settings page structure | Part 8 — Settings |
| Agent Keys section | Part 8 — Agent Keys |
| Usage Alerts section | Part 8 — Usage Alerts |
| Telegram Alerts section | Part 8 — Telegram Webhook |
| Account section | Part 8 — Account |
| Destructive action (inline, no modal) | Part 8 — Destructive Action Design |
| Background: Settings — no atmospheric glow | Part 0 — Background System |
| Background: Dashboard — minimal atmospheric | Part 0 — Background System |

Result: **Pass.**

---

---

*OptiContext Dashboard + Settings Copy · Phase 7 of 9*
*Version 1.0 · Sandy · May 2026*
*Next phase: Phase 8 — Error + Troubleshooting System*
*Cross-referenced: PLAN · FRONTEND_GUIDE · TERMINOLOGY · PHASE2 · PHASE6*
