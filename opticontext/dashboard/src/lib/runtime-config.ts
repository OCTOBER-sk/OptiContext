/**
 * Runtime configuration for OptiContext MCP clients.
 *
 * The exported constants and templates are the *single source of truth* for
 * what the dashboard tells users about MCP registration, persistent
 * instructions, and the live endpoint. The two are intentionally separate:
 *
 *   - CLIENT_CONFIGS  → MCP server registration (URL, transport, auth header)
 *                       Files where the runtime stores its MCP server list.
 *   - INSTRUCTIONS    → Persistent agent instructions (the setup prompt itself,
 *                       which the agent runtime reads on every session).
 *
 * If you change MCP_ENDPOINT, every registration snippet updates
 * automatically. The setup prompt is hand-written and lives below.
 */

export const MCP_ENDPOINT = "https://opticontext.opticontext.workers.dev/mcp";
export const PROTOCOL_VERSION = "2025-11-25";
export const SERVER_NAME = "OptiContext";
export const SERVER_VERSION = "1.0.0";

export interface ClientConfig {
  /** Human-readable name of the runtime. */
  name: string;
  /** File the runtime reads to discover MCP servers. */
  file: string;
  /** Config snippet. Uses ${MCP_ENDPOINT} and a placeholder for the API key. */
  code: string;
  /**
   * If supported, the file where the agent's persistent instructions are stored.
   * `null` means the runtime has no native instructions file; the agent's
   * "memory" or "system prompt config" is the alternative.
   */
  instructionsFile: string | null;
}

export const CLIENT_CONFIGS: Record<string, ClientConfig> = {
  OpenClaw: {
    name: "OpenClaw",
    file: "~/.openclaw/config.json",
    instructionsFile: null, // OpenClaw uses a system_prompt field, not a file
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
    name: "Hermes",
    file: "~/.hermes/config.yml",
    instructionsFile: null,
    code: `mcp_servers:
  opticontext:
    url: "${MCP_ENDPOINT}"
    headers:
      Authorization: "Bearer <YOUR_API_KEY>"
    timeout: 180`,
  },
  OpenCode: {
    name: "OpenCode",
    file: "~/.opencode/opencode_config.json",
    instructionsFile: "~/.opencode/instructions.md",
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
    name: "Claude Code",
    file: "~/.claude/claude_code_config.json",
    instructionsFile: "~/.claude/instructions.md",
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
    name: "Cursor",
    file: "~/.cursor/mcp.json",
    instructionsFile: ".cursor/rules/opticontext.mdc",
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
    name: "AntiGravity",
    file: "~/.antigravity/mcp.json",
    instructionsFile: null,
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
    name: "Custom",
    file: "mcp.config.json",
    instructionsFile: null,
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

/**
 * The setup prompt. This is the *agent-side* onboarding text — it does
 * NOT configure the MCP server. It is read by the agent runtime and
 * teaches the agent how to use OptiContext safely.
 *
 * Conventions:
 *   - No provider/vendor names. OptiContext exposes capabilities, not
 *     implementation details. Provider names are server-side telemetry only.
 *   - `tools/list` is the source of truth for capability exposure.
 *   - Capability map is built at runtime, not assumed from docs.
 *   - Success requires evidence, not assertions.
 */
export const SETUP_PROMPT = `# OptiContext MCP — Universal Agent Activation Protocol

You are connecting to OptiContext, a remote MCP platform that provides capabilities such as:

* Information retrieval
* Developer research
* File analysis
* Persistent memory
* Audio generation
* Context retrieval

Available capabilities may change over time.

Never assume a capability exists until it has been verified through MCP discovery.

---

# PRINCIPLE

Use evidence-based verification.

Do not assume:

* connectivity
* authentication
* tool exposure
* capability availability
* configuration correctness

Verify everything.

---

# MCP CONNECTION

Use the MCP server already configured in your runtime.

Connection requirements:

* MCP Streamable HTTP
* JSON-RPC 2.0
* Bearer token authentication

If the configured endpoint is unreachable, stop immediately and report the exact failure.

Do not guess alternate URLs.

---

# ACTIVATION FLOW

## STEP 1 — Connectivity Verification

Verify:

* DNS resolution
* HTTPS/TLS validity
* endpoint reachability

If verification fails:

* stop
* report the exact error
* do not continue

---

## STEP 2 — Capability Guide

Call:

\`opticontext_guide\`

with:

\`\`\`json
{
  "topic": "limits"
}
\`\`\`

Review:

* limits
* quotas
* usage constraints
* operational guidance

---

## STEP 3 — Full Capability Guide

Call:

\`opticontext_guide\`

with:

\`\`\`json
{
  "topic": "all"
}
\`\`\`

Treat the returned guide as the authoritative reference for OptiContext behavior.

If guide retrieval fails:

* stop
* report failure

Do not continue.

---

## STEP 4 — Tool Discovery

Call:

\`tools/list\`

Inspect the returned tool inventory.

Treat \`tools/list\` as the source of truth.

Do not rely on:

* documentation
* assumptions
* previous sessions
* cached knowledge

Only trust the current MCP response.

---

## STEP 5 — Capability Inventory

Create an internal capability map.

Examples:

* search
* developer search
* memory
* file analysis
* audio generation
* future capabilities

Only include capabilities that actually exist in the discovered tool list.

---

## STEP 6 — Functional Verification

Execute at least one successful non-guide tool call.

Recommended order:

1. memory search
2. search
3. developer search (if available)
4. file analysis
5. audio generation

The goal is to verify that actual tool execution works.

Guide retrieval alone is not sufficient verification.

---

## STEP 7 — Optional Capability Verification

If additional tools are exposed:

* verify them individually
* update your internal capability map

Do not advertise capabilities that have not been verified.

---

# FAILURE HANDLING

Classify failures accurately.

Examples:

* DNS failure
* TLS failure
* authentication failure
* authorization failure
* rate limit
* transport failure
* invalid parameters
* capability unavailable
* provider unavailable
* internal service error

Report platform-level failures only.

Do not speculate about internal implementation details.

---

# OPERATING RULES

Always:

* consult the guide when uncertain
* use discovered capabilities
* respect platform limits
* surface warnings returned by OptiContext
* prefer verified capabilities over assumptions

Never:

* invent capabilities
* invent tool parameters
* fabricate successful verification
* expose internal implementation assumptions
* continue after failed activation

---

# MEMORY GUIDELINES

When memory capabilities are available:

Use memory for:

* long-running projects
* recurring workflows
* persistent preferences
* project context
* important decisions

Do not store transient or low-value information.

---

# FILE ANALYSIS GUIDELINES

When file-analysis capabilities are available:

Prefer file analysis for:

* documentation
* specifications
* codebases
* PDFs
* structured files

Do not use generic search when direct file analysis is more appropriate.

---

# DEVELOPER RESEARCH GUIDELINES

When developer-research capabilities are available:

Prefer them for:

* package discovery
* dependency lookup
* API references
* official documentation
* compatibility questions
* implementation examples

Use general search only when developer-focused retrieval is unavailable or unsuitable.

---

# SUCCESS CRITERIA

Only declare activation successful when:

1. Connectivity verified
2. Limits guide retrieved
3. Full guide retrieved
4. Tool inventory discovered
5. Capability map created
6. At least one non-guide tool call succeeds

---

# SUCCESS RESPONSE

If activation succeeds, respond:

✅ OptiContext active. Verified capabilities loaded and ready for use.

Optionally list verified capabilities discovered through \`tools/list\`.

Do not list capabilities that were not discovered.

---

# FINAL RULE

Trust runtime evidence over assumptions.

\`tools/list\` is authoritative.

Verified behavior is authoritative.

Documentation is guidance, not proof.
`;

/**
 * Build the registration snippet for a given client + API key.
 * Pure: callers should not modify the returned string.
 */
export function buildRegistrationSnippet(clientName: string, apiKey: string): string {
  const cfg = CLIENT_CONFIGS[clientName];
  if (!cfg) {
    throw new Error(`Unknown MCP client: ${clientName}`);
  }
  // Replace the placeholder exactly once. The user pastes their real key.
  return cfg.code.replace(/<YOUR_API_KEY>/g, apiKey);
}

/**
 * Build the per-client persistent-instructions guidance.
 * Returns null if the runtime has no native instructions file.
 */
export function buildInstructionsGuidance(clientName: string): string | null {
  const cfg = CLIENT_CONFIGS[clientName];
  if (!cfg) {
    throw new Error(`Unknown MCP client: ${clientName}`);
  }
  if (!cfg.instructionsFile) {
    return null;
  }
  return `After activation, persist the OptiContext guide at \`${cfg.instructionsFile}\` so future sessions load it automatically.`;
}

/**
 * Compose the full onboarding payload. Used by the dashboard "Agent setup" card.
 * Returns the agent-side prompt + the registration snippet + the per-client
 * instructions guidance (if any). All three are returned separately so the UI
 * can render them as distinct sections.
 */
export interface OnboardingPayload {
  setupPrompt: string;
  registration: { client: string; file: string; code: string; apiKey: string };
  instructionsHint: string | null;
  endpoint: string;
  serverName: string;
  serverVersion: string;
}

export function buildOnboarding(clientName: string, apiKey: string): OnboardingPayload {
  const cfg = CLIENT_CONFIGS[clientName];
  if (!cfg) {
    throw new Error(`Unknown MCP client: ${clientName}`);
  }
  return {
    setupPrompt: SETUP_PROMPT,
    registration: {
      client: cfg.name,
      file: cfg.file,
      code: buildRegistrationSnippet(clientName, apiKey),
      apiKey,
    },
    instructionsHint: buildInstructionsGuidance(clientName),
    endpoint: MCP_ENDPOINT,
    serverName: SERVER_NAME,
    serverVersion: SERVER_VERSION,
  };
}

/**
 * Backwards-compatible: legacy single-string prompt used by the
 * `SetupPrompt` UI component. Includes only the agent-side activation
 * prompt; the dashboard should also render the registration snippet
 * and instructions hint as separate UI sections.
 */
export function generateSetupPrompt(_apiKey: string): string {
  return SETUP_PROMPT;
}
