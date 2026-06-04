export const MCP_ENDPOINT = "https://mcp.opticontext.dev/mcp";
export const PROTOCOL_VERSION = "2025-11-25";
export const SERVER_NAME = "OptiContext";
export const SERVER_VERSION = "1.0.0";

export interface ClientConfig {
  file: string;
  code: string;
}

export const CLIENT_CONFIGS: Record<string, ClientConfig> = {
  OpenClaw: {
    file: "~/.openclaw/config.json",
    code: `{
  "mcp": {
    "servers": {
      "opticontext": {
        "url": "${MCP_ENDPOINT}",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer <YOUR_API_KEY>"
        }
      }
    }
  }
}`,
  },
  Hermes: {
    file: "~/.hermes/config.yml",
    code: `mcp_servers:
  opticontext:
    url: "${MCP_ENDPOINT}"
    headers:
      Authorization: "Bearer <YOUR_API_KEY>"
    timeout: 180`,
  },
  OpenCode: {
    file: "~/.opencode/opencode_config.json",
    code: `{
  "mcp": {
    "opticontext": {
      "type": "remote",
      "url": "${MCP_ENDPOINT}",
      "headers": {
        "Authorization": "Bearer <YOUR_API_KEY>"
      },
      "enabled": true
    }
  }
}`,
  },
  "Claude Code": {
    file: "~/.claude/claude_code_config.json",
    code: `{
  "mcpServers": {
    "opticontext": {
      "type": "http",
      "url": "${MCP_ENDPOINT}",
      "headers": {
        "Authorization": "Bearer <YOUR_API_KEY>"
      }
    }
  }
}`,
  },
  Cursor: {
    file: "~/.cursor/mcp.json",
    code: `{
  "mcpServers": {
    "opticontext": {
      "url": "${MCP_ENDPOINT}",
      "transport": "streamable-http",
      "headers": {
        "Authorization": "Bearer <YOUR_API_KEY>"
      }
    }
  }
}`,
  },
  Antigravity: {
    file: "~/.antigravity/mcp.json",
    code: `{
  "mcpServers": {
    "opticontext": {
      "serverUrl": "${MCP_ENDPOINT}",
      "headers": {
        "Authorization": "Bearer <YOUR_API_KEY>"
      }
    }
  }
}`,
  },
  Custom: {
    file: "mcp.config.json",
    code: `{
  "server": "${MCP_ENDPOINT}",
  "headers": {
    "Authorization": "Bearer <YOUR_API_KEY>"
  }
}`,
  },
};

export const CLIENT_NAMES = Object.keys(CLIENT_CONFIGS);

export const CUSTOM_INIT_REQUEST = `{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "${PROTOCOL_VERSION}",
    "capabilities": {},
    "clientInfo": {
      "name": "your-runtime-name",
      "version": "1.0.0"
    }
  },
  "id": 1
}`;

export const CUSTOM_INIT_RESPONSE = `{
  "jsonrpc": "2.0",
  "result": {
    "protocolVersion": "${PROTOCOL_VERSION}",
    "serverInfo": {
      "name": "${SERVER_NAME}",
      "version": "${SERVER_VERSION}",
      "description": "Edge-native MCP context infrastructure"
    },
    "capabilities": {
      "tools": {},
      "logging": {}
    }
  },
  "id": 1
}`;

export const CURL_INIT = `curl -X POST ${MCP_ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \\
  -d '{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "${PROTOCOL_VERSION}",
    "capabilities": {},
    "clientInfo": {
      "name": "my-custom-agent",
      "version": "1.0.0"
    }
  },
  "id": 1
}'`;

export function generateSetupPrompt(apiKey: string): string {
  return `# OptiContext MCP — Agent Onboarding

You are connected to OptiContext, an MCP platform providing web search, text-to-speech, file analysis, and cross-session memory through 5 MCP tools.

## Step 1 — Learn capabilities
Call \`opticontext_guide\` with \`{"topic": "all"}\` now. This returns a compact capability guide you must reference before every OptiContext call.

## Step 2 — Save for future sessions
Store the returned guide in your persistent instructions file:
- Claude Code → ~/.claude/instructions.md
- Cursor → .cursor/rules/opticontext.mdc
- OpenCode → ~/.opencode/instructions.md
- OpenClaw → system_prompt in config

## Step 3 — Confirm
After saving, respond with exactly:
✅ OptiContext active. I can now: search the web, generate speech, analyze files, and manage persistent memory.

## Credentials
API Key: ${apiKey}
MCP Server: ${MCP_ENDPOINT}
Protocol: MCP Streamable HTTP / JSON-RPC 2.0

Never guess which tool to use — always consult the saved guide first. Re-call opticontext_guide whenever tool behavior is unclear.`;
}
