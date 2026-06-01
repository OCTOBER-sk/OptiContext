# Connecting Your Agent to OptiContext

## Quick Start

Any agent that supports the MCP (Model Context Protocol) can connect to OptiContext in minutes.

### Step 1: Get Your API Key

```bash
# Create a new agent key via the dashboard
# Or use the CLI tool:
cd opticontext/scripts
npx tsx create-agent.ts
```

### Step 2: Configure Your Agent

#### Claude Code (`.claude/settings.json`)

```json
{
  "mcpServers": {
    "opticontext": {
      "type": "http",
      "url": "https://opticontext.yourworker.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer opctx_claudecode_<your_key>"
      }
    }
  }
}
```

#### Cursor

```json
{
  "mcpServers": {
    "opticontext": {
      "type": "http",
      "url": "https://opticontext.yourworker.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer opctx_cursor_<your_key>"
      }
    }
  }
}
```

#### Custom Agent (JavaScript)

```typescript
const response = await fetch("https://opticontext.yourworker.workers.dev/mcp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer opctx_myagent_<your_key>"
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "opticontext_search",
      arguments: { query: "latest AI news 2026" }
    }
  })
});
```

### Step 3: List Available Tools

```bash
curl -X POST https://opticontext.yourworker.workers.dev/mcp \
  -H "Authorization: Bearer opctx_<key>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Available Tools

| Tool Name | Description |
|---|---|
| `opticontext_search` | Web search with AI dorking + summarization |
| `opticontext_tts` | Text-to-speech (48 voices, streaming) |
| `opticontext_analyze` | Deep file analysis (PDF, code, images, audio) |
| `opticontext_memory_write` | Store persistent agent memory |
| `opticontext_memory_search` | Semantic memory search |
| `opticontext_guide` | Capabilities guide — call this first to self-orient |

## Rate Limits

- Standard tier: 30 requests/minute, 500 requests/day
- Dimensions: configurable per agent

## Health Check

```bash
curl https://opticontext.yourworker.workers.dev/health
```
