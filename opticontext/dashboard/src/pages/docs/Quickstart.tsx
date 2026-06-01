import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { Badge } from '../../components/ui/Badge';
import { BUTTONS } from '../../lib/microcopy';
import { MCP_ENDPOINT, PROTOCOL_VERSION, CUSTOM_INIT_REQUEST, CUSTOM_INIT_RESPONSE, CURL_INIT } from '../../lib/runtime-config';

const CLIENTS = ['Claude Code', 'Cursor', 'OpenClaw', 'Custom MCP runtime'] as const;
type Client = typeof CLIENTS[number];

interface ClientConfig {
  filePaths: { path: string; note: string }[];
  configBlock: string;
  configLabel: string;
  verification: string;
}

const CLAUDE_CODE_CONFIG = `{
  "mcpServers": {
    "opticontext": {
      "type": "http",
      "url": "${MCP_ENDPOINT}",
      "headers": {
        "Authorization": "Bearer YOUR_AGENT_KEY"
      }
    }
  }
}`;

const CURSOR_CONFIG = `{
  "mcpServers": {
    "opticontext": {
      "url": "${MCP_ENDPOINT}",
      "transport": "streamable-http",
      "headers": {
        "Authorization": "Bearer YOUR_AGENT_KEY"
      }
    }
  }
}`;

const OPENCLAW_CONFIG = `{
  "mcp": {
    "servers": {
      "opticontext": {
        "url": "${MCP_ENDPOINT}",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer YOUR_AGENT_KEY"
        }
      }
    }
  }
}`;

const CUSTOM_MIN_CONFIG = `{
  "url": "${MCP_ENDPOINT}",
  "transport": "streamable-http",
  "headers": {
    "Authorization": "Bearer YOUR_AGENT_KEY"
  }
}`;

const CURL_TOOLS_LIST = `curl -X POST ${MCP_ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }'`;

const TOOLS_LIST_RESPONSE = `{
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
}`;

const CONFIGS: Record<Exclude<Client, 'Custom MCP runtime'>, ClientConfig> = {
  'Claude Code': {
    filePaths: [
      { path: '~/.claude/claude_code_config.json', note: 'Global config' },
      { path: '.claude/claude_code_config.json', note: 'Or project-level' },
    ],
    configBlock: CLAUDE_CODE_CONFIG,
    configLabel: 'claude_code_config.json',
    verification: 'After saving the config, restart Claude Code. Run /mcp in the Claude Code terminal — opticontext should appear in the connected servers list.',
  },
  Cursor: {
    filePaths: [
      { path: '~/.cursor/mcp.json', note: 'Global config — applies to all Cursor projects.' },
      { path: '.cursor/mcp.json', note: 'Or project-level — takes precedence over global if both exist.' },
    ],
    configBlock: CURSOR_CONFIG,
    configLabel: 'mcp.json',
    verification: 'After saving the config, reload the Cursor window. Go to Settings → MCP — opticontext should appear with a green status indicator.',
  },
  OpenClaw: {
    filePaths: [
      { path: '~/.openclaw/config.json', note: 'Global config' },
      { path: '.openclaw/agent.config.json', note: 'Or inside the agent\'s environment config' },
    ],
    configBlock: OPENCLAW_CONFIG,
    configLabel: 'agent.config.json',
    verification: 'Restart OpenClaw after saving. The opticontext server will appear in the active MCP connections list on startup.',
  },
};

const FIRST_CALL_PROMPT = `Search for the latest developments in MCP server implementations.`;

const FIRST_CALL_JSON = `{
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
}`;

const FULL_CURL_CALL = `curl -X POST ${MCP_ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \\
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
  }'`;

const SAMPLE_RESPONSE = `{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\\"summary\\":\\"Recent MCP server developments include...\\",\\"key_findings\\":[\\"Finding 1\\",\\"Finding 2\\"],\\"sources\\":[{\\"url\\":\\"https://...\\",\\"title\\":\\"...\\"}],\\"confidence\\":0.91,\\"provider_used\\":\\"primary\\"}"
      }
    ]
  },
  "id": 1
}`;

const ERROR_401 = `{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "UNAUTHORIZED — Agent key not found. Verify the key format: opctx_<slug>_<32hex>."
  },
  "id": 1
}`;

const ERROR_429 = `{
  "jsonrpc": "2.0",
  "error": {
    "code": -32029,
    "message": "RATE_LIMITED — 30 requests/minute reached for this agent key. Resets in 43 seconds."
  },
  "id": 1
}`;

const RESPONSE_FIELDS = [
  { field: 'summary', type: 'string', description: 'AI-generated summary of the most relevant search results.' },
  { field: 'key_findings', type: 'array', description: 'List of extracted factual findings from the search results.' },
  { field: 'sources', type: 'array', description: 'Source objects with url and title for each result used.' },
  { field: 'confidence', type: 'number', description: 'Relevance confidence score from 0.0 to 1.0.' },
  { field: 'provider_used', type: 'string', description: 'Which search provider resolved the query.' },
];

export default function Quickstart() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeClient, setActiveClient] = useState<Client>('Claude Code');
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  const isCustom = activeClient === 'Custom MCP runtime';

  const getConfigBlock = useMemo(() => {
    if (isCustom) return CUSTOM_MIN_CONFIG;
    return CONFIGS[activeClient as keyof typeof CONFIGS].configBlock;
  }, [activeClient, isCustom]);

const getRightPanelStep = () => {
    const stepLabels = [
      'Create your account',
      'Get your agent key',
      'Configure your runtime',
      'Make your first capability call',
      'Verify the response',
    ];
    const label = String(activeStep + 1).padStart(2, '0');
    return `${label} — ${stepLabels[activeStep]}`;
  };

  const renderStepContent = (i: number) => {
    switch (i) {
      case 0: return renderStep1();
      case 1: return renderStep2();
      case 2: return renderStep3();
      case 3: return renderStep4();
      case 4: return renderStep5();
      default: return null;
    }
  };

  const renderStep1 = () => (
    <div>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
        Sign in with Google to create your OptiContext account.
      </p>
      {user ? (
        <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '1rem', color: 'var(--accent)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={14} />
          You're signed in as {user.email}.
        </p>
      ) : (
          <button onClick={() => navigate('/auth')} className="btn btn-primary" style={{ padding: '10px 20px' }}>
            {BUTTONS.primary.getAgentKey} {'\u2192'}
          </button>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
        Go to your dashboard and create an agent key.
        Name the key after the runtime you are connecting — one key per runtime.
      </p>
        <button onClick={() => navigate('/dashboard/settings')} className="btn btn-ghost" style={{ padding: '10px 20px', paddingLeft: 0, marginBottom: 20 }}>
          {BUTTONS.secondary.goToSettings} {'\u2192'}
        </button>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
        Your agent key looks like this:
      </p>
      <div style={{ maxWidth: 520 }}>
        <CodeBlock code="opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" />
      </div>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 8 }}>
        The key is shown once at creation. Copy it before closing the dashboard.
        If you lose it, revoke the key and create a new one — the old key cannot be retrieved.
      </p>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 16 }}>
        After creating a key, copy the setup prompt from the dashboard and paste it into your
        agent's chat. The agent will call <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: 'var(--code-accent)' }}>opticontext_guide</code> to self-learn
        OptiContext's capabilities and save them for future sessions.
      </p>
    </div>
  );

  const renderStep3 = () => {
    if (isCustom) return renderCustomMcpStep();
    const cfg = CONFIGS[activeClient as keyof typeof CONFIGS];
    return (
      <div>
        <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
          Add one configuration block to your runtime's MCP config file.
          The endpoint and transport field are the same for all runtimes.
          Only the file path and config structure differ per runtime.
        </p>
        <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 24 }}>
          This step uses the tab you selected above. Switch tabs to see the config for a different runtime.
        </p>

        {cfg.filePaths.map((fp, idx) => (
          <div key={idx} style={{ marginBottom: idx < cfg.filePaths.length - 1 ? 8 : 20 }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.8125rem',
                color: 'var(--code-text)',
                background: 'var(--code-surface)',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid var(--border)',
              }}
            >
              {fp.path}
            </span>
            <span style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: 8 }}>
              {fp.note}
            </span>
          </div>
        ))}

        <div style={{ maxWidth: 600, marginBottom: 16 }}>
          <CodeBlock code={cfg.configBlock} label={cfg.configLabel} />
        </div>

        <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          Replace YOUR_AGENT_KEY with the key from Step 2.
        </p>

        <div
          style={{
            background: 'var(--accent-subtle)',
            borderLeft: '3px solid var(--accent)',
            borderRadius: '0 8px 8px 0',
            padding: '12px 16px',
            maxWidth: 600,
          }}
        >
          <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
            {cfg.verification}
          </p>
        </div>
      </div>
    );
  };

  const renderCustomMcpStep = () => (
    <div>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
        Add one configuration block to your runtime's MCP config file.
        The endpoint and transport field are the same for all runtimes.
        Only the file path and config structure differ per runtime.
      </p>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 24 }}>
        This step uses the tab you selected above. Switch tabs to see the config for a different runtime.
      </p>

      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
        For any runtime implementing MCP Streamable HTTP transport:
      </p>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
        Add the following server block to your runtime's MCP configuration.
        Field names vary by runtime — adapt as needed. The endpoint, transport,
        and Authorization header format are fixed.
      </p>

      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
        Minimum required configuration
      </p>
      <div style={{ maxWidth: 520, marginBottom: 32 }}>
        <CodeBlock code={CUSTOM_MIN_CONFIG} label="minimum config" />
      </div>

      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
        If your runtime uses the initialize handshake directly
      </p>
      <div style={{ maxWidth: 560, marginBottom: 12 }}>
        <CodeBlock code={CUSTOM_INIT_REQUEST} label="initialize request" />
      </div>
      <div style={{ maxWidth: 560, marginBottom: 32 }}>
        <CodeBlock code={CUSTOM_INIT_RESPONSE} label="initialize response" />
      </div>

      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
        curl connectivity test
      </p>
      <div style={{ maxWidth: 620, marginBottom: 8 }}>
        <CodeBlock code={CURL_INIT} label="bash" />
      </div>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 32 }}>
        A 200 response with the initialize result confirms the endpoint is reachable
        and your agent key is valid.
      </p>

      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
        tools/list request (enumerate available capabilities)
      </p>
      <div style={{ maxWidth: 620, marginBottom: 12 }}>
        <CodeBlock code={CURL_TOOLS_LIST} label="bash" />
      </div>
      <div style={{ maxWidth: 560, marginBottom: 8 }}>
        <CodeBlock code={TOOLS_LIST_RESPONSE} label="tools/list response" />
      </div>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        All five MCP capability names listed confirms full capability access under your agent key.
      </p>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
        The first call uses IntelliSearch — the lightest capability to verify.
        If your runtime is a coding agent or chat agent, you can trigger this
        by sending a prompt that requires a web search.
      </p>

      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
        Option A — Via your runtime (recommended)
      </p>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
        Send this prompt to your connected runtime:
      </p>
      <div
        style={{
          maxWidth: 560,
          marginBottom: 8,
          background: 'var(--code-surface)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 4,
          padding: '10px 14px',
          position: 'relative',
        }}
      >
        <pre style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: 'var(--code-text)' }}>{FIRST_CALL_PROMPT}</pre>
      </div>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 28 }}>
        Your runtime resolves this to a tools/call request automatically.
        You do not write the JSON payload yourself.
      </p>

      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
        Option B — Direct MCP call (custom runtime or curl)
      </p>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
        Send the following JSON-RPC 2.0 payload to the MCP endpoint:
      </p>
      <div style={{ maxWidth: 560, marginBottom: 24 }}>
        <CodeBlock code={FIRST_CALL_JSON} label="tools/call — IntelliSearch" />
      </div>

      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
        Full curl form
      </p>
      <div style={{ maxWidth: 620, marginBottom: 32 }}>
        <CodeBlock code={FULL_CURL_CALL} label="bash" />
      </div>

      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 500 }}>
        What happens during this call
      </p>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
        OptiContext processes this request at the edge in the following sequence:
      </p>
      <div
        style={{
          background: 'var(--code-surface)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 4,
          padding: '12px 16px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.8125rem',
          color: 'var(--code-text)',
          lineHeight: 1.6,
          maxWidth: 600,
          marginBottom: 8,
        }}
      >
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`1. Agent key validated via edge KV lookup
2. Rate limit checked (per-minute bucket in edge KV)
3. Cache checked — SHA-256 hash of query + params
4. Cache miss → IntelliSearch routes to the primary provider
5. Primary provider returns raw results
6. AI summarization pass filters and summarizes results
7. Result cached in edge KV with 15-minute TTL
8. Structured response returned to your runtime`}</pre>
      </div>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 8 }}>
        Total latency on first call (cache miss): approximately 1.1 seconds.
        Subsequent calls with the same query return from cache in under 50ms.
      </p>
    </div>
  );

  const renderStep5 = () => (
    <div>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
        A successful IntelliSearch response returns the following structure:
      </p>
      <div style={{ maxWidth: 620, marginBottom: 24 }}>
        <CodeBlock code={SAMPLE_RESPONSE} label="IntelliSearch response" />
      </div>

      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
        The text field contains a JSON-encoded string with the following fields:
      </p>

      <div style={{ maxWidth: 620, marginBottom: 32, overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {RESPONSE_FIELDS.map((rf) => (
              <tr key={rf.field}>
                <td><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>{rf.field}</span></td>
                <td><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>{rf.type}</span></td>
                <td>{rf.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
        If you see this structure, your runtime is fully connected to OptiContext.
        All four capabilities are available immediately — no additional configuration required.
      </p>

      <Badge variant="success" dot>
        Integration verified
      </Badge>

      <div style={{ borderBottom: '1px solid var(--border)', margin: '32px 0' }} />

      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 500 }}>
        Common issue: 401 Unauthorized
      </p>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
        If you receive a 401 response, the agent key in your config is invalid or missing.
      </p>
      <div style={{ maxWidth: 560, marginBottom: 8 }}>
        <CodeBlock code={ERROR_401} label="401 error response" />
      </div>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 32 }}>
        Check that the Authorization header is set to: Bearer YOUR_AGENT_KEY
        and that YOUR_AGENT_KEY is replaced with the actual key from your dashboard.
      </p>

      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 500 }}>
        Common issue: 429 Rate Limited
      </p>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
        If you receive a 429 response, the per-minute request limit for this agent key has been reached.
      </p>
      <div style={{ maxWidth: 560, marginBottom: 8 }}>
        <CodeBlock code={ERROR_429} label="429 error response" />
      </div>
      <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        The limit resets at the start of the next minute.
        The reset countdown is included in the error message.
      </p>
    </div>
  );

  return (
    <div className="quickstart-page">
      <div className="quickstart-content">
        <p className="breadcrumb" style={{ marginBottom: 8 }}>
          Documentation <span style={{ color: 'var(--text-muted)' }}>›</span> Quickstart
        </p>

        <h1
          style={{
            fontFamily: "'Zodiak', serif",
            fontWeight: 400,
            fontSize: '2.25rem',
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          Quickstart
        </h1>

        <p
          style={{
            fontFamily: "'Switzer', sans-serif",
            fontWeight: 400,
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            marginTop: 8,
          }}
        >
          From zero to first capability call in under 5 minutes.
        </p>

        <p
          style={{
            fontFamily: "'Switzer', sans-serif",
            fontWeight: 400,
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            marginTop: 12,
            marginBottom: 32,
          }}
        >
           This guide walks through account creation, agent key generation,
          runtime configuration, and a first live capability call using IntelliSearch.
          All four capabilities are available immediately after configuration.
        </p>

        <div className="tab-bar" style={{ marginBottom: 48, overflowX: 'auto' }}>
          {CLIENTS.map((client) => (
            <button
              key={client}
              className={['tab-btn', activeClient === client ? 'active' : ''].join(' ')}
              onClick={() => setActiveClient(client)}
            >
              {client}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const isActive = activeStep === i;
            const isComplete = i < activeStep || (i === 0 && !!user);

            const stepLabels = [
              'Create your account',
              'Get your agent key',
              'Configure your runtime',
              'Make your first capability call',
              'Verify the response',
            ];

            return (
              <div
                key={i}
                style={{
                  borderLeft: '2px solid',
                  borderColor: isComplete || isActive ? 'var(--accent)' : 'var(--border)',
                  padding: '0 0 36px 24px',
                  marginLeft: 12,
                  position: 'relative',
                  borderBottom: i === 4 ? 'none' : 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: -10,
                    top: 0,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: isComplete ? 'var(--accent)' : isActive ? 'var(--base)' : 'var(--raised)',
                    border: '2px solid',
                    borderColor: isComplete || isActive ? 'var(--accent)' : 'var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-hidden="true"
                >
                  {isComplete && <Check size={12} style={{ color: 'var(--text-inverse)' }} />}
                </div>

                <button
                  onClick={() => setActiveStep(i)}
                  style={{
                    display: 'block',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    textAlign: 'left',
                    cursor: 'pointer',
                    marginBottom: isActive ? 16 : 0,
                    width: '100%',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontFamily: "'Switzer', sans-serif",
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      color: isComplete ? 'var(--accent)' : isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      marginBottom: 4,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: "'Zodiak', serif",
                      fontWeight: 400,
                      fontSize: '1.375rem',
                      color: isComplete ? 'var(--accent)' : isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {stepLabels[i]}
                  </span>
                </button>

                {isActive && (
                  <div className="anim-fade-in">
                    {renderStepContent(i)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 48 }}>
          <p className="section-label" style={{ marginBottom: 24 }}>NEXT STEPS</p>

          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24, marginBottom: 4 }}>
            <button onClick={() => navigate('/docs/tools/intellisearch')} className="btn btn-ghost" style={{ padding: '8px 0', display: 'block', marginBottom: 4 }}>
              <span style={{ fontFamily: "'Zodiak', serif", fontSize: '1.375rem', color: 'var(--text-primary)' }}>
                Explore all four capabilities →
              </span>
            </button>
            <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              IntelliSearch, VoiceBridge, DeepDoc, and MemoryCore reference pages
              with full input schemas, output schemas, and example calls.
            </p>
          </div>

          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24, marginBottom: 24 }}>
            <button onClick={() => navigate('/docs/api-reference')} className="btn btn-ghost" style={{ padding: '8px 0', display: 'block', marginBottom: 4 }}>
              <span style={{ fontFamily: "'Zodiak', serif", fontSize: '1.375rem', color: 'var(--text-primary)' }}>
                View the full API reference →
              </span>
            </button>
            <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              Every endpoint, every field, error codes, rate limit headers,
              and the complete JSON-RPC 2.0 message structure.
            </p>
          </div>

          <p
            style={{
              fontFamily: "'Switzer', sans-serif",
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border)',
              paddingTop: 24,
            }}
          >
            OptiContext is compatible with any runtime implementing MCP Streamable HTTP transport ({PROTOCOL_VERSION}).
            Configuration paths and JSON field names vary per runtime.
            The endpoint and Authorization header format are fixed across all runtimes.
          </p>
        </div>
      </div>

      <aside
        className="quickstart-panel"
        aria-label="Current config summary"
        style={{
          width: 280,
          flexShrink: 0,
          position: 'sticky',
          top: 88,
          background: 'var(--raised)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <p className="section-label" style={{ marginBottom: 12 }}>Current config</p>

        <h2
          style={{
            fontFamily: "'Zodiak', serif",
            fontSize: '1.375rem',
            fontWeight: 400,
            color: 'var(--text-primary)',
            marginBottom: 16,
          }}
        >
          {activeClient}
        </h2>

        <div style={{ marginBottom: 16 }}>
          <CodeBlock code={getConfigBlock} compact />
        </div>

        <p
          style={{
            fontFamily: "'Switzer', sans-serif",
            fontWeight: 400,
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            margin: 0,
          }}
        >
          Active step: {getRightPanelStep()}
        </p>
      </aside>
    </div>
  );
}
