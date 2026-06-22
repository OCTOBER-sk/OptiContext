import React from 'react';
import { CodeBlock } from '../../components/ui/CodeBlock';

const SECTIONS = [
  { id: 'authentication', label: 'Authentication' },
  { id: 'endpoints', label: 'Endpoints' },
  { id: 'mcp-lifecycle', label: 'MCP Lifecycle' },
  { id: 'transport', label: 'Transport' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'upload-flow', label: 'Upload Flow' },
  { id: 'error-reference', label: 'Error Reference' },
  { id: 'rate-limits', label: 'Rate Limits' },
];

function SectionHeading({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      style={{
        fontFamily: "'Zodiak', Georgia, serif",
        fontWeight: 400,
        fontSize: '1.75rem',
        color: 'var(--text-primary)',
        borderTop: '1px solid var(--border)',
        paddingTop: 48,
        marginBottom: 24,
        scrollMarginTop: 80,
      }}
    >
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: "'Zodiak', Georgia, serif",
        fontWeight: 400,
        fontSize: '1.125rem',
        color: 'var(--text-primary)',
        marginBottom: 12,
        marginTop: 24,
      }}
    >
      {children}
    </h3>
  );
}

function FlowBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre
      style={{
        background: 'var(--code-surface)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 4,
        padding: '12px 16px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.8125rem',
        lineHeight: 1.6,
        color: 'var(--code-text)',
        overflowX: 'auto',
        marginBottom: 24,
      }}
    >
      {children}
    </pre>
  );
}

function NoteBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'Switzer', Inter, system-ui, sans-serif",
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        borderLeft: '3px solid var(--border)',
        paddingLeft: 16,
        margin: '20px 0 32px',
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}

function InfoBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--code-surface)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 4,
        padding: '12px 16px',
        fontFamily: "'Switzer', Inter, system-ui, sans-serif",
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        marginBottom: 24,
      }}
    >
      {children}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 24 }}>
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeCell({ children, color }: { children: string; color?: string }) {
  return (
    <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: color || 'var(--accent)' }}>
      {children}
    </code>
  );
}

export default function ApiRef() {
  return (
    <div style={{ position: 'relative' }}>
      {/* Background — paper grain only */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Breadcrumb */}
        <p className="breadcrumb" style={{ marginBottom: 8 }}>
          Documentation  ›  API Reference
        </p>

        {/* Page Heading */}
        <h1
          style={{
            fontFamily: "'Zodiak', Georgia, serif",
            fontWeight: 400,
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          API Reference
        </h1>

        {/* Orientation Paragraph */}
        <p
          style={{
            fontFamily: "'Switzer', Inter, system-ui, sans-serif",
            fontWeight: 400,
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            marginTop: 8,
            maxWidth: 640,
            marginBottom: 0,
          }}
        >
          Complete technical contract for the OptiContext MCP endpoint.
          This document covers authentication, the MCP protocol lifecycle, all five
          capability schemas, the file upload flow, error codes, and rate limits.
        </p>

        {/* Protocol Note */}
        <NoteBlock>
          OptiContext implements the Model Context Protocol specification (MCP 2025-11-25)
          using Streamable HTTP transport. All capability calls are JSON-RPC 2.0 messages
          sent to a single endpoint. No REST semantics. No separate capability endpoints.
        </NoteBlock>

        {/* Endpoint Summary Table */}
        <DataTable
          headers={['Endpoint', 'Method', 'Auth required', 'Purpose']}
          rows={[
            ['/mcp', <CodeCell>POST</CodeCell>, 'Yes', 'All capability calls — MCP Streamable HTTP'],
            ['/mcp', <CodeCell>GET</CodeCell>, 'Yes', 'SSE stream initialization for streaming responses'],
            ['/upload', <CodeCell>POST</CodeCell>, 'Yes', 'Pre-upload files for DeepDoc'],
            ['/usage', <CodeCell>GET</CodeCell>, 'Yes', 'Usage stats for the authenticated agent key'],
            ['/health', <CodeCell>GET</CodeCell>, 'No', 'Server health check'],
          ]}
        />

        {/* Quick-nav tabs — sticky */}
        <div
          style={{
            position: 'sticky',
            top: 64,
            zIndex: 20,
            background: 'var(--base)',
            borderBottom: '1px solid var(--border)',
            marginBottom: 32,
            paddingTop: 4,
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="tab-bar" style={{ borderBottom: 'none', display: 'inline-flex' }}>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="tab-btn"
                style={{
                  display: 'inline-block',
                  padding: '10px 16px',
                  textDecoration: 'none',
                  fontFamily: "'Switzer', Inter, system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  borderBottom: '2px solid transparent',
                  transition: 'all 150ms ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 1 — AUTHENTICATION */}
        {/* ============================================================ */}
        <SectionHeading id="authentication">Authentication</SectionHeading>

        <SubHeading>Agent key format</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          Every agent authenticates with a long-lived agent key issued at key creation. Agent keys are not JWTs. They are opaque bearer credentials verified against edge KV on every request.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Format:</strong>
        </p>
        <div style={{ marginBottom: 8 }}>
          <CodeBlock code="opctx_<agent_slug>_<32_hex_characters>" label="agent key format" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Example:</strong>
        </p>
        <div style={{ marginBottom: 8 }}>
          <CodeBlock code="opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" label="example agent key" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          Agent keys are created from the dashboard at <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/dashboard/settings</code>. Each agent should use its own key. Keys are scoped per-agent — usage, rate limits, and permission checks are tracked individually.
        </p>

        <SubHeading>Authorization header</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          All requests to authenticated endpoints must include:
        </p>
        <div style={{ marginBottom: 8 }}>
          <CodeBlock
            code="Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4"
            label="authorization header"
          />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          The header must use the <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>Bearer</code> scheme. Other schemes are rejected with <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: 'var(--error)' }}>-32001 UNAUTHORIZED</code>.
        </p>

        <SubHeading>Key verification flow</SubHeading>
        <FlowBlock>{`Request arrives at the edge
  │
  ├─ [1] Extract Authorization header
  │       Missing or malformed → -32001 UNAUTHORIZED
  │
  ├─ [2] KV lookup: opctx_key:<key> → agent_id
  │       Not found    → -32001 KEY_NOT_FOUND
  │       Key revoked  → -32001 KEY_REVOKED
  │
  ├─ [3] Rate limit check: rate:<agent_id>:<minute_bucket>
  │       Over 30 req/min → -32029 RATE_LIMITED
  │
  ├─ [4] Permission check: agent allowed for this capability
  │       Not permitted → -32003 FORBIDDEN
  │
  └─ [5] Execute capability`}</FlowBlock>

        <SubHeading>Per-agent isolation</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          Each agent key is fully isolated:
        </p>
        <ul style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 24, paddingLeft: 20 }}>
          <li>Rate limits are tracked per key, per minute bucket</li>
          <li>Usage caps are tracked per key, per day</li>
          <li>File storage in edge storage is namespaced under <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>{'<agent_id>/'}</code></li>
          <li>MemoryCore embeddings are scoped to <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>agent_id</code> in vector database</li>
          <li>Revoking one key has no effect on any other key</li>
        </ul>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          Two runtimes using separate keys have no visibility into each other's usage, files, or memories.
        </p>

        <SubHeading>Key revocation</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          Revoke a key from the dashboard at <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/dashboard/settings</code>. Revocation takes effect within one edge KV propagation cycle — typically under 60 seconds globally. After revocation, any request using the revoked key receives <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: 'var(--error)' }}>-32001 KEY_REVOKED</code>.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          A revoked key cannot be reactivated. Create a new key if access needs to be restored.
        </p>

        {/* ============================================================ */}
        {/* SECTION 2 — ENDPOINTS */}
        {/* ============================================================ */}
        <SectionHeading id="endpoints">Endpoints</SectionHeading>

        <SubHeading>POST /mcp</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          The primary MCP endpoint. All capability calls are sent here as JSON-RPC 2.0 messages.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>URL:</strong>
        </p>
        <div style={{ marginBottom: 16 }}>
          <CodeBlock code="https://opticontext.opticontext.workers.dev/mcp" compact />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Required headers:</strong>
        </p>
        <DataTable
          headers={['Header', 'Value']}
          rows={[
            ['Content-Type', <CodeCell>application/json</CodeCell>],
            ['Authorization', <CodeCell>Bearer &lt;agent_key&gt;</CodeCell>],
            ['Mcp-Session-Id', <span style={{ color: 'var(--text-muted)' }}>Optional. Enables stateful agent session tracking.</span>],
          ]}
        />
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Body:</strong> JSON-RPC 2.0 message. See MCP Lifecycle section.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          <strong>Response:</strong> JSON-RPC 2.0 result or error object. HTTP 200 for all well-formed requests, including capability errors. HTTP 4xx/5xx for transport-layer failures only.
        </p>

        <SubHeading>GET /mcp</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          Opens an SSE stream for streaming capability responses (VoiceBridge <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>stream: true</code>, long-running DeepDoc analyses). The runtime sends the capability request via <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>POST /mcp</code> first. OptiContext upgrades the response to a chunked SSE stream when the capability requires it.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          <strong>Required headers:</strong> same as <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>POST /mcp</code>.
        </p>

        <SubHeading>POST /upload</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          Pre-upload endpoint for large files before calling <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>opticontext_analyze</code>. Accepts <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>multipart/form-data</code>. Returns an <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>upload_id</code> for use in a subsequent DeepDoc capability call.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>URL:</strong>
        </p>
        <div style={{ marginBottom: 16 }}>
          <CodeBlock code="https://opticontext.opticontext.workers.dev/upload" compact />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Required headers:</strong>
        </p>
        <DataTable
          headers={['Header', 'Value']}
          rows={[
            ['Authorization', <CodeCell>Bearer &lt;agent_key&gt;</CodeCell>],
            ['Content-Type', <CodeCell>multipart/form-data</CodeCell>],
          ]}
        />
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Body field:</strong>
        </p>
        <DataTable
          headers={['Field', 'Type', 'Description']}
          rows={[
            ['file', 'binary', 'The file to upload. Maximum 2GB.'],
          ]}
        />
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Response:</strong>
        </p>
        <div style={{ marginBottom: 24 }}>
          <CodeBlock code={`{
  "upload_id": "upload_7f3a9b2e",
  "filename": "report.pdf",
  "size_bytes": 8421376,
  "expires_at": "2026-05-22T14:30:00Z"
}`} label="/upload response" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          Upload IDs expire after 1 hour. Pass <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>upload_id</code> to <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>opticontext_analyze</code> before expiry.
        </p>

        <SubHeading>GET /usage</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          Returns usage statistics for the authenticated agent key.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>URL:</strong>
        </p>
        <div style={{ marginBottom: 16 }}>
          <CodeBlock code="https://opticontext.opticontext.workers.dev/usage" compact />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Required headers:</strong>
        </p>
        <DataTable
          headers={['Header', 'Value']}
          rows={[
            ['Authorization', <CodeCell>Bearer &lt;agent_key&gt;</CodeCell>],
          ]}
        />
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Response:</strong>
        </p>
        <div style={{ marginBottom: 24 }}>
          <CodeBlock code={`{
  "agent_id": "myagent",
  "today_requests": 47,
  "monthly_requests": 812,
  "tool_breakdown": {
    "intellisearch": 22,
    "voicebridge": 8,
    "deepdoc": 5,
    "memorycore_write": 7,
    "memorycore_search": 5
  },
  "daily_cap_remaining": 453,
  "reset_at": "2026-05-22T00:00:00Z"
}`} label="/usage response" />
        </div>

        <SubHeading>GET /health</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          Health check endpoint. No authentication required. Returns HTTP 200 when the edge server is operational.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>URL:</strong>
        </p>
        <div style={{ marginBottom: 16 }}>
          <CodeBlock code="https://opticontext.opticontext.workers.dev/health" compact />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Response:</strong>
        </p>
        <div style={{ marginBottom: 24 }}>
          <CodeBlock code={`{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-05-22T14:23:11Z"
}`} label="/health response" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
          The dashboard polls this endpoint every 60 seconds to maintain the status chip displayed in <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/dashboard</code>.
        </p>

        {/* ============================================================ */}
        {/* SECTION 3 — MCP LIFECYCLE */}
        {/* ============================================================ */}
        <SectionHeading id="mcp-lifecycle">MCP Lifecycle</SectionHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          Every MCP-compatible runtime that connects to OptiContext follows the same three-step lifecycle: <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>initialize</code> → <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>tools/list</code> → <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>tools/call</code>.
        </p>

        <SubHeading>Initialize</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          The runtime sends an <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>initialize</code> request on first connection to negotiate the protocol version and receive server metadata.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Request</strong>
        </p>
        <div style={{ marginBottom: 16 }}>
          <CodeBlock code={`{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "clientInfo": {
      "name": "my-agent",
      "version": "1.0.0"
    },
    "capabilities": {}
  },
  "id": 1
}`} label="initialize request" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Response</strong>
        </p>
        <div style={{ marginBottom: 16 }}>
          <CodeBlock code={`{
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
}`} label="initialize response" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          <strong><code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>protocolVersion</code>:</strong> OptiContext uses <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>2025-11-25</code> — the current stable MCP specification. If a runtime sends a different version, OptiContext responds with <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>2025-11-25</code> regardless. Older HTTP+SSE transport runtimes are supported via the legacy <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/sse</code> endpoint.
        </p>

        <SubHeading>tools/list</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          After initialization, the runtime requests the list of available MCP tools.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Request</strong>
        </p>
        <div style={{ marginBottom: 16 }}>
          <CodeBlock code={`{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "params": {},
  "id": 1
}`} label="tools/list request" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Response</strong>
        </p>
        <div style={{ marginBottom: 16 }}>
          <CodeBlock code={`{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "opticontext_search",
        "description": "Web search with AI-enhanced dorking and summarization. Returns structured, agent-ready results."
      },
      {
        "name": "opticontext_tts",
        "description": "Text to speech. Returns an audio URL or stream optimized for the target delivery platform."
      },
      {
        "name": "opticontext_analyze",
        "description": "File analysis with a 2M token context window. Handles any supported file type."
      },
      {
        "name": "opticontext_memory_write",
        "description": "Store content in persistent RAG memory with semantic search."
      },
      {
        "name": "opticontext_memory_search",
        "description": "Search persistent memory using semantic similarity. Returns ranked results with a context block."
      }
    ]
  },
  "id": 1
}`} label="tools/list response" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          The <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>tools/list</code> response reflects only the capabilities the calling agent key is permitted to use. If an agent key has <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>memorycore</code> disabled, <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>opticontext_memory_write</code> and <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>opticontext_memory_search</code> are absent from the list.
        </p>

        <SubHeading>tools/call</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          The runtime invokes a capability.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Request structure</strong>
        </p>
        <div style={{ marginBottom: 16 }}>
          <CodeBlock code={`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "<mcp_tool_name>",
    "arguments": {
      <capability_parameters>
    }
  },
  "id": 1
}`} label="tools/call structure" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Success response structure</strong>
        </p>
        <div style={{ marginBottom: 16 }}>
          <CodeBlock code={`{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "<json_string_of_capability_output>"
      }
    ]
  },
  "id": 1
}`} label="tools/call success response" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          The <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>content[0].text</code> field contains a JSON-serialized string of the capability output. The runtime parses this string to access individual response fields (<code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>summary</code>, <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>audio_url</code>, <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>memories</code>, etc.).
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Error response structure</strong>
        </p>
        <div style={{ marginBottom: 24 }}>
          <CodeBlock code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32029,
    "message": "RATE_LIMITED — 30 requests/minute reached for this agent key. Resets in 43 seconds."
  },
  "id": 1
}`} label="tools/call error response" />
        </div>

        <SubHeading>Session handling</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          OptiContext supports optional stateful sessions via the <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>Mcp-Session-Id</code> header. Sessions allow the edge server to maintain per-agent context across multiple requests in a single interaction.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Header:</strong>
        </p>
        <div style={{ marginBottom: 16 }}>
          <CodeBlock code="Mcp-Session-Id: sess_4c8d2f1a9b3e" label="session header" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          Sessions are tracked in Durable Objects. If no <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>Mcp-Session-Id</code> is provided, each request is treated as stateless. Session state does not affect capability behavior — it is used for logging context and session-level rate tracking only.
        </p>

        {/* ============================================================ */}
        {/* SECTION 4 — TRANSPORT */}
        {/* ============================================================ */}
        <SectionHeading id="transport">Transport</SectionHeading>

        <SubHeading>Streamable HTTP transport</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          OptiContext implements MCP Streamable HTTP transport — the current transport standard in the MCP 2025-11-25 specification. A single endpoint (<code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/mcp</code>) handles all MCP messages. The same endpoint handles both synchronous responses and SSE-streamed responses, negotiated per request.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Why Streamable HTTP:</strong>
        </p>
        <DataTable
          headers={['Property', 'Behavior']}
          rows={[
            ['Single endpoint', <span style={{ color: 'var(--text-secondary)' }}>POST /mcp for requests. GET /mcp for SSE stream initiation.</span>],
            ['Stateless by default', <span style={{ color: 'var(--text-secondary)' }}>Each request is independent. No persistent connection required.</span>],
            ['Horizontal scale', <span style={{ color: 'var(--text-secondary)' }}>edge computing platform handles concurrent requests without sticky sessions.</span>],
            ['Auth', <span style={{ color: 'var(--text-secondary)' }}>Standard HTTP Authorization: Bearer header. No handshake-level auth.</span>],
            ['Streaming', <span style={{ color: 'var(--text-secondary)' }}>SSE upgrade available when capabilities return chunked output.</span>],
          ]}
        />

        <SubHeading>JSON-RPC 2.0 message format</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          All messages sent to and received from <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/mcp</code> are JSON-RPC 2.0 objects.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Request envelope:</strong>
        </p>
        <DataTable
          headers={['Field', 'Type', 'Value']}
          rows={[
            ['jsonrpc', 'string', <span style={{ color: 'var(--text-secondary)' }}>Always "2.0"</span>],
            ['method', 'string', <span style={{ color: 'var(--text-secondary)' }}>"initialize", "tools/list", or "tools/call"</span>],
            ['params', 'object', <span style={{ color: 'var(--text-secondary)' }}>Method-specific parameters</span>],
            ['id', 'integer', <span style={{ color: 'var(--text-secondary)' }}>Request identifier. Must be echoed in the response.</span>],
          ]}
        />
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Response envelope (success):</strong>
        </p>
        <DataTable
          headers={['Field', 'Type', 'Value']}
          rows={[
            ['jsonrpc', 'string', <span style={{ color: 'var(--text-secondary)' }}>Always "2.0"</span>],
            ['result', 'object', <span style={{ color: 'var(--text-secondary)' }}>Method-specific result</span>],
            ['id', 'integer', <span style={{ color: 'var(--text-secondary)' }}>Echoed from the request</span>],
          ]}
        />
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Response envelope (error):</strong>
        </p>
        <DataTable
          headers={['Field', 'Type', 'Value']}
          rows={[
            ['jsonrpc', 'string', <span style={{ color: 'var(--text-secondary)' }}>Always "2.0"</span>],
            ['error', 'object', <span style={{ color: 'var(--text-secondary)' }}>Contains code (integer) and message (string)</span>],
            ['id', 'integer', <span style={{ color: 'var(--text-secondary)' }}>Echoed from the request</span>],
          ]}
        />

        <SubHeading>Request flow</SubHeading>
        <FlowBlock>{`Runtime sends: POST /mcp
  Headers: Content-Type: application/json
           Authorization: Bearer opctx_<key>
           Mcp-Session-Id: <optional>
  Body: JSON-RPC 2.0 message

Edge receives → Auth guard → Rate limiter → Tool dispatcher

For synchronous responses (search, memory, most DeepDoc):
  Returns: HTTP 200, JSON-RPC 2.0 result object

For streaming responses (VoiceBridge stream: true, large DeepDoc):
  Runtime first opens: GET /mcp with same headers
  OptiContext upgrades to SSE
  Streams chunked audio or analysis tokens as SSE events
  Closes stream when response is complete`}</FlowBlock>

        <SubHeading>Legacy transport</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          OptiContext maintains a <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/sse</code> endpoint for runtimes that have not yet migrated to Streamable HTTP transport. This endpoint uses the HTTP+SSE transport from the MCP 2025-03-26 specification. The primary transport path is Streamable HTTP via <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/mcp</code>. The <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/sse</code> endpoint receives no new capability features.
        </p>

        {/* ============================================================ */}
        {/* SECTION 5 — CAPABILITY REFERENCE */}
        {/* ============================================================ */}
        <SectionHeading id="capabilities">Capability Reference</SectionHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          The five MCP tools exposed by OptiContext. All tools are called via <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>POST /mcp</code> using the <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>tools/call</code> method.
        </p>

        {/* opticontext_search */}
        <div style={{ marginBottom: 48 }}>
          <h3
            style={{
              fontFamily: "'Zodiak', Georgia, serif",
              fontWeight: 400,
              fontSize: '1.375rem',
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            opticontext_search — IntelliSearch
          </h3>
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            MCP capability name: <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: 'var(--accent)' }}>opticontext_search</code> · Capability: IntelliSearch · Full reference: <a href="/docs/tools/intellisearch" style={{ color: 'var(--accent-text)' }}>/docs/tools/intellisearch</a>
          </p>

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Input schema
          </p>
          <DataTable
            headers={['Parameter', 'Type', 'Required', 'Default', 'Description']}
            rows={[
              ['query', <CodeCell>string</CodeCell>, 'Yes', <CodeCell color="var(--code-text)">—</CodeCell>, 'The search query in natural language. Maximum 500 characters.'],
              ['mode', <CodeCell>string</CodeCell>, 'No', <CodeCell color="var(--code-text)">"auto"</CodeCell>, 'Provider routing mode: "auto", "research", "fast", or "scrape".'],
              ['dork', <CodeCell>object</CodeCell>, 'No', <CodeCell color="var(--code-text)">—</CodeCell>, 'Advanced search operator parameters. See dork sub-schema.'],
              ['max_results', <CodeCell>integer</CodeCell>, 'No', <CodeCell color="var(--code-text)">5</CodeCell>, 'Maximum results to return. Range: 1–20.'],
              ['summarize', <CodeCell>boolean</CodeCell>, 'No', <CodeCell color="var(--code-text)">true</CodeCell>, 'Run AI summarization on raw results before returning.'],
              ['save_to_memory', <CodeCell>boolean</CodeCell>, 'No', <CodeCell color="var(--code-text)">false</CodeCell>, 'Store the result in MemoryCore after the search completes.'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Dork sub-schema
          </p>
          <DataTable
            headers={['Parameter', 'Type', 'Required', 'Default', 'Description']}
            rows={[
              ['site_filter', <CodeCell>string</CodeCell>, 'No', <CodeCell color="var(--code-text)">—</CodeCell>, 'Restrict results to a specific domain. Example: "github.com".'],
              ['file_type', <CodeCell>string</CodeCell>, 'No', <CodeCell color="var(--code-text)">—</CodeCell>, 'Filter by file extension. Example: "pdf".'],
              ['date_after', <CodeCell>string</CodeCell>, 'No', <CodeCell color="var(--code-text)">—</CodeCell>, 'Return results published after this date. Format: "YYYY-MM-DD".'],
              ['exclude_terms', <CodeCell>array</CodeCell>, 'No', <CodeCell color="var(--code-text)">—</CodeCell>, 'Terms to exclude. Each item is a string.'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Mode routing
          </p>
          <DataTable
            headers={['mode', 'Provider', 'Cost', 'When to use']}
            rows={[
              ['"auto"', 'Primary → fallback', 'Budget-managed', 'Default. Routes by query type and current budget state.'],
              ['"research"', 'Primary', '2 credits', 'Full page content extraction required.'],
              ['"fast"', 'Free provider', 'Free', 'Snippets sufficient. No quota.'],
              ['"scrape"', 'Structured data provider', 'Provider credits', 'Structured data extraction from specific URLs. Use sparingly.'],
            ]}
          />

          <div style={{ marginTop: 12, marginBottom: 16 }}>
            <CodeBlock code={`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_search",
    "arguments": {
      "query": "Python RAG implementation examples",
      "mode": "research",
      "dork": {
        "site_filter": "github.com",
        "file_type": "py",
        "date_after": "2025-01-01",
        "exclude_terms": ["tutorial", "beginner"]
      },
      "max_results": 5,
      "summarize": true
    }
  },
  "id": 1
}`} label="tools/call — opticontext_search" />
          </div>

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Response schema
          </p>
          <DataTable
            headers={['Field', 'Type', 'Description']}
            rows={[
              ['summary', 'string', 'AI-generated summary of the most relevant results.'],
              ['key_findings', 'array', 'Extracted factual findings. Each item is a string.'],
              ['sources', 'array', 'Source objects. Each has url (string) and title (string).'],
              ['confidence', 'number', 'Relevance confidence score. Range: 0.0–1.0.'],
              ['provider_used', 'string', 'Which provider resolved the query: "tavily", "ddg", or "apify".'],
              ['cached', 'boolean', 'Whether this result was served from the 15-minute cache.'],
              ['query_executed', 'string', 'The final dorked query string sent to the provider.'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Limits
          </p>
          <DataTable
            headers={['Limit', 'Value']}
            rows={[
              ['Requests per minute (per agent key)', '30 — shared across all capabilities'],
              ['Requests per day (per agent key)', '500'],
              ['Primary search credits per month', '1,000 — budget guard activates at 800'],
              ['Cache TTL', '15 minutes'],
              ['Max query length', '500 characters'],
              ['Max results per call', '20'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Error codes
          </p>
          <DataTable
            headers={['Code', 'Name', 'Cause']}
            rows={[
              ['-32001', 'UNAUTHORIZED', 'Agent key missing, malformed, not found, or revoked.'],
              ['-32029', 'RATE_LIMITED', '30 requests/minute per agent key reached.'],
              ['-32030', 'DAILY_CAP_REACHED', '500 requests/day for this key exhausted. Resets at 00:00 UTC.'],
              ['-32040', 'PROVIDER_UNAVAILABLE', 'All search providers failed. Retry with "mode": "fast".'],
              ['-32041', 'BUDGET_GUARD_ACTIVE', 'Primary search at ≥800/1,000 credits. Request automatically routes to fallback.'],
              ['-32050', 'QUERY_TOO_LONG', 'Query exceeds 500 characters.'],
            ]}
          />
        </div>

        {/* opticontext_tts */}
        <div style={{ marginBottom: 48 }}>
          <h3
            style={{
              fontFamily: "'Zodiak', Georgia, serif",
              fontWeight: 400,
              fontSize: '1.375rem',
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            opticontext_tts — VoiceBridge
          </h3>
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            MCP capability name: <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: 'var(--accent)' }}>opticontext_tts</code> · Capability: VoiceBridge · Full reference: <a href="/docs/tools/voicebridge" style={{ color: 'var(--accent-text)' }}>/docs/tools/voicebridge</a>
          </p>

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Input schema
          </p>
          <DataTable
            headers={['Parameter', 'Type', 'Required', 'Default', 'Description']}
            rows={[
              ['text', <CodeCell>string</CodeCell>, 'Yes', <CodeCell color="var(--code-text)">—</CodeCell>, 'Text to synthesize. Maximum 3,000 characters per call.'],
              ['voice', <CodeCell>string</CodeCell>, 'No', <CodeCell color="var(--code-text)">"Scarlett"</CodeCell>, 'Voice ID. See voice reference table.'],
              ['speed', <CodeCell>number</CodeCell>, 'No', <CodeCell color="var(--code-text)">1.0</CodeCell>, 'Speech speed multiplier. Range: 0.5–2.0.'],
              ['format', <CodeCell>string</CodeCell>, 'No', <CodeCell color="var(--code-text)">"mp3"</CodeCell>, 'Output audio format: "mp3", "ogg", or "wav".'],
              ['platform', <CodeCell>string</CodeCell>, 'No', <CodeCell color="var(--code-text)">"raw"</CodeCell>, 'Target platform: "telegram", "discord", "whatsapp", or "raw". Overrides format with platform-optimal value.'],
              ['stream', <CodeCell>boolean</CodeCell>, 'No', <CodeCell color="var(--code-text)">false</CodeCell>, 'Return audio chunks via SSE instead of a URL.'],
              ['save_to_memory', <CodeCell>boolean</CodeCell>, 'No', <CodeCell color="var(--code-text)">false</CodeCell>, 'Store the synthesized text in MemoryCore after completion.'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Platform format override
          </p>
          <DataTable
            headers={['platform', 'Effective format']}
            rows={[
              ['"telegram"', 'ogg/opus'],
              ['"discord"', 'mp3'],
              ['"whatsapp"', 'ogg/opus'],
              ['"raw"', 'Value of format field'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Voice reference (representative subset — 48 voices, 8 languages total)
          </p>
          <DataTable
            headers={['Voice ID', 'Language', 'Character']}
            rows={[
              ['Scarlett', 'English US', 'Female, warm'],
              ['Dan', 'English US', 'Male, clear'],
              ['Will', 'English US', 'Male, deep'],
              ['Liv', 'English UK', 'Female, British'],
              ['Harry', 'English UK', 'Male, British'],
              ['Priya', 'Hindi', 'Female'],
              ['Arjun', 'Hindi', 'Male'],
              ['Sofia', 'Spanish', 'Female'],
              ['Emma', 'French', 'Female'],
              ['Yuki', 'Japanese', 'Female'],
              ['Mei', 'Mandarin', 'Female'],
              ['Ana', 'Portuguese', 'Female'],
            ]}
          />

          <div style={{ marginTop: 12, marginBottom: 16 }}>
            <CodeBlock code={`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_tts",
    "arguments": {
      "text": "The build completed successfully. Three tests failed in the authentication module.",
      "voice": "Dan",
      "platform": "telegram",
      "speed": 1.0
    }
  },
  "id": 1
}`} label="tools/call — opticontext_tts" />
          </div>

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Response schema
          </p>
          <DataTable
            headers={['Field', 'Type', 'Description']}
            rows={[
              ['audio_url', 'string', 'Signed URL for the generated audio file. Valid for 24 hours.'],
              ['duration_ms', 'integer', 'Duration of the synthesized audio in milliseconds.'],
              ['voice_used', 'string', 'The voice ID used for synthesis.'],
              ['format', 'string', 'Audio format of the returned file: "mp3", "ogg", or "wav".'],
              ['cached', 'boolean', 'Whether this audio was served from the 24-hour TTS cache.'],
              ['chunks', 'array', 'Present only when stream: true. Array of base64-encoded audio chunk strings.'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Latency reference
          </p>
          <DataTable
            headers={['Condition', 'Latency']}
            rows={[
              ['Cache hit (same text + voice within 24h)', '< 30ms'],
              ['Cache miss — short text (< 500 chars)', '~600ms total, TTFB ~300ms'],
              ['Cache miss — long text (3,000 chars)', '~1.2s total'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Limits
          </p>
          <DataTable
            headers={['Limit', 'Value']}
            rows={[
              ['Requests per minute (per agent key)', '30 — shared across all capabilities'],
              ['Requests per day (per agent key)', '500'],
              ['Max text per call', '3,000 characters'],
              ['TTS cache TTL', '24 hours'],
              ['Audio file retention in R2', '24 hours'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Error codes
          </p>
          <DataTable
            headers={['Code', 'Name', 'Cause']}
            rows={[
              ['-32001', 'UNAUTHORIZED', 'Agent key missing, malformed, not found, or revoked.'],
              ['-32029', 'RATE_LIMITED', '30 requests/minute per agent key reached.'],
              ['-32030', 'DAILY_CAP_REACHED', '500 requests/day for this key exhausted.'],
              ['-32060', 'TEXT_TOO_LONG', 'Input text exceeds 3,000 characters.'],
              ['-32061', 'INVALID_VOICE_ID', 'Voice ID not recognized.'],
              ['-32062', 'SYNTHESIS_FAILED', 'TTS provider returned an error. Retry or switch voice ID.'],
              ['-32063', 'STREAM_UNSUPPORTED', 'SSE streaming unavailable in this context. Set stream: false.'],
            ]}
          />
        </div>

        {/* opticontext_analyze */}
        <div style={{ marginBottom: 48 }}>
          <h3
            style={{
              fontFamily: "'Zodiak', Georgia, serif",
              fontWeight: 400,
              fontSize: '1.375rem',
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            opticontext_analyze — DeepDoc
          </h3>
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            MCP capability name: <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: 'var(--accent)' }}>opticontext_analyze</code> · Capability: DeepDoc · Full reference: <a href="/docs/tools/deepdoc" style={{ color: 'var(--accent-text)' }}>/docs/tools/deepdoc</a>
          </p>
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 12 }}>
            One of <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>file_url</code>, <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>file_b64</code>, <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>upload_id</code>, or <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>file_id</code> is required on every call.
          </p>

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Input schema
          </p>
          <DataTable
            headers={['Parameter', 'Type', 'Required', 'Default', 'Description']}
            rows={[
              ['file_url', <CodeCell>string</CodeCell>, 'Conditional', <CodeCell color="var(--code-text)">—</CodeCell>, 'Public URL of the file to fetch and analyze.'],
              ['file_b64', <CodeCell>string</CodeCell>, 'Conditional', <CodeCell color="var(--code-text)">—</CodeCell>, 'Base64-encoded file content. Maximum 100MB inline.'],
              ['upload_id', <CodeCell>string</CodeCell>, 'Conditional', <CodeCell color="var(--code-text)">—</CodeCell>, 'ID returned from POST /upload. Expires 1 hour after upload.'],
              ['file_id', <CodeCell>string</CodeCell>, 'Conditional', <CodeCell color="var(--code-text)">—</CodeCell>, 'ID from a previous DeepDoc response. Re-analyzes without re-uploading.'],
              ['query', <CodeCell>string</CodeCell>, 'Yes', <CodeCell color="var(--code-text)">—</CodeCell>, 'The specific question or analysis task to run against the file.'],
              ['model', <CodeCell>string</CodeCell>, 'No', <CodeCell color="var(--code-text)">"auto"</CodeCell>, 'Model selection: "auto", "flash", or "pro".'],
              ['output_format', <CodeCell>string</CodeCell>, 'No', <CodeCell color="var(--code-text)">"structured"</CodeCell>, 'Response shape: "structured", "markdown", "json", or "summary_only".'],
              ['save_to_memory', <CodeCell>boolean</CodeCell>, 'No', <CodeCell color="var(--code-text)">false</CodeCell>, 'Store the analysis result in MemoryCore for future semantic recall.'],
              ['max_tokens', <CodeCell>integer</CodeCell>, 'No', <CodeCell color="var(--code-text)">4096</CodeCell>, 'Maximum response tokens. Range: 1–16384.'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Model routing
          </p>
          <DataTable
            headers={['Condition', 'Model selected', 'Context window']}
            rows={[
              ['File < 50KB, simple query', 'Fast model', '1M tokens'],
              ['File < 500KB, complex query', 'Balanced model', '1M tokens'],
              ['File ≥ 500KB or model: "pro"', 'Large-context model', '2M tokens'],
              ['model: "flash" (explicit)', 'Fast model', '1M tokens'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Supported file types
          </p>
          <DataTable
            headers={['Category', 'Formats']}
            rows={[
              ['Documents', 'PDF, DOCX, PPTX, XLSX, CSV, TXT, Markdown, HTML, XML, JSON'],
              ['Images', 'PNG, JPG, JPEG, WEBP, HEIC, HEIF, GIF (static)'],
              ['Code', '.py, .js, .ts, .java, .cpp, .c, .go, .rs, .rb, .php, .sh, .yaml, .toml'],
              ['Audio', 'MP3, WAV, FLAC, AAC, OGG, OPUS'],
              ['Video', 'MP4, AVI, MOV, MKV, WEBM'],
              ['Archives', 'ZIP — contents extracted and analyzed'],
            ]}
          />

          <div style={{ marginTop: 12, marginBottom: 16 }}>
            <CodeBlock code={`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_analyze",
    "arguments": {
      "file_id": "a3f8d9e1b2c4",
      "query": "What are the three most critical security vulnerabilities identified in this report?",
      "model": "auto",
      "output_format": "structured",
      "save_to_memory": true
    }
  },
  "id": 1
}`} label="tools/call — opticontext_analyze" />
          </div>

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Response schema
          </p>
          <DataTable
            headers={['Field', 'Type', 'Description']}
            rows={[
              ['summary', 'string', 'High-level summary of the file\'s content relative to the query.'],
              ['key_findings', 'array', 'Extracted facts and structured conclusions. Each item is a string.'],
              ['answer', 'string', 'Direct answer to the query field. The primary agent-facing field.'],
              ['tables', 'array', 'Data tables extracted from the file. Each item is a structured table object.'],
              ['code_blocks', 'array', 'Code segments extracted from the file. Each item has language (string) and content (string).'],
              ['confidence', 'number', 'Model confidence in the analysis quality. Range: 0.0–1.0.'],
              ['file_id', 'string', '12-character hex identifier for this file. Use in future calls to re-analyze.'],
              ['tokens_used', 'integer', 'Total tokens consumed by the analysis call.'],
              ['model_used', 'string', 'Which AI model the router selected.'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Latency reference
          </p>
          <DataTable
            headers={['Condition', 'Latency']}
            rows={[
              ['Re-analysis using file_id (file already in edge storage)', '~1.5s'],
              ['New file, small (< 1MB), fast model', '~3–5s'],
              ['New file, large (> 5MB), large-context model', '~8–15s'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Limits
          </p>
          <DataTable
            headers={['Limit', 'Value']}
            rows={[
              ['Requests per minute (per agent key)', '30 — shared across all capabilities'],
              ['Requests per day (per agent key)', '500'],
              ['Max inline base64 file size', '100MB'],
              ['Max pre-upload file size', '2GB'],
              ['Fast model requests/day', '1,500 — budget guard at 1,200'],
              ['Large-context model requests/day', '50 — budget guard at 40'],
              ['Max response tokens', '16,384'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Error codes
          </p>
          <DataTable
            headers={['Code', 'Name', 'Cause']}
            rows={[
              ['-32001', 'UNAUTHORIZED', 'Agent key missing, malformed, not found, or revoked.'],
              ['-32029', 'RATE_LIMITED', '30 requests/minute per agent key reached.'],
              ['-32070', 'FILE_NOT_FOUND', 'file_id not found for this agent key. File may have been deleted.'],
              ['-32071', 'UPLOAD_EXPIRED', 'upload_id has expired. Re-upload via POST /upload.'],
              ['-32072', 'FILE_TOO_LARGE', 'File exceeds 2GB.'],
              ['-32073', 'UNSUPPORTED_FILE_TYPE', 'File format not supported by the analysis API.'],
              ['-32074', 'ANALYSIS_QUOTA_REACHED', 'Daily analysis request limit reached. Resets at midnight.'],
              ['-32075', 'ANALYSIS_FAILED', 'The analysis service returned an empty or malformed response. Retry with a more specific query.'],
            ]}
          />
        </div>

        {/* opticontext_memory_write + opticontext_memory_search */}
        <div style={{ marginBottom: 48 }}>
          <h3
            style={{
              fontFamily: "'Zodiak', Georgia, serif",
              fontWeight: 400,
              fontSize: '1.375rem',
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            opticontext_memory_write — MemoryCore
          </h3>
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            MCP capability name: <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: 'var(--accent)' }}>opticontext_memory_write</code> · Capability: MemoryCore · Full reference: <a href="/docs/tools/memorycore" style={{ color: 'var(--accent-text)' }}>/docs/tools/memorycore</a>
          </p>

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Input schema
          </p>
          <DataTable
            headers={['Parameter', 'Type', 'Required', 'Default', 'Description']}
            rows={[
              ['content', <CodeCell>string</CodeCell>, 'Yes', <CodeCell color="var(--code-text)">—</CodeCell>, 'Text content to store. No character limit, but chunked at 512 tokens.'],
              ['namespace', <CodeCell>string</CodeCell>, 'No', <CodeCell color="var(--code-text)">"general"</CodeCell>, 'Logical partition for this memory. Examples: "general", "projects", "personal".'],
              ['importance', <CodeCell>integer</CodeCell>, 'No', <CodeCell color="var(--code-text)">5</CodeCell>, 'Importance score for reranking. Range: 1–10. Higher values surface more often.'],
              ['source', <CodeCell>string</CodeCell>, 'No', <CodeCell color="var(--code-text)">—</CodeCell>, 'Human-readable description of where this memory originated.'],
              ['expires_at', <CodeCell>string</CodeCell>, 'No', <CodeCell color="var(--code-text)">—</CodeCell>, 'ISO 8601 datetime. Memory is excluded from search results after this time.'],
            ]}
          />

          <div style={{ marginTop: 12, marginBottom: 16 }}>
            <CodeBlock code={`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_memory_write",
    "arguments": {
      "content": "The user prefers concise responses under 200 words and avoids code blocks in casual conversation.",
      "namespace": "personal",
      "importance": 8,
      "source": "user preference stated in session 2026-05-21"
    }
  },
  "id": 1
}`} label="tools/call — opticontext_memory_write" />
          </div>

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Response schema
          </p>
          <DataTable
            headers={['Field', 'Type', 'Description']}
            rows={[
              ['memory_id', 'string', 'Identifier for the stored memory entry.'],
              ['chunks_stored', 'integer', 'Number of 512-token chunks created from the input content.'],
              ['namespace', 'string', 'The namespace the memory was stored in.'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Limits
          </p>
          <DataTable
            headers={['Limit', 'Value']}
            rows={[
              ['Requests per minute (per agent key)', '30 — shared across all capabilities'],
              ['Requests per day (per agent key)', '500 — write and search each count as one request'],
              ['Max chunks per agent', '10,000'],
              ['Auto-summarization trigger', '8,000 chunks'],
              ['Chunk size', '512 tokens, 50-token overlap'],
              ['Embedding dimensions', '768 (AI Embedding model)'],
            ]}
          />
        </div>

        <div style={{ marginBottom: 48 }}>
          <h3
            style={{
              fontFamily: "'Zodiak', Georgia, serif",
              fontWeight: 400,
              fontSize: '1.375rem',
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            opticontext_memory_search — MemoryCore
          </h3>
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            MCP capability name: <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: 'var(--accent)' }}>opticontext_memory_search</code> · Capability: MemoryCore · Full reference: <a href="/docs/tools/memorycore" style={{ color: 'var(--accent-text)' }}>/docs/tools/memorycore</a>
          </p>

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Input schema
          </p>
          <DataTable
            headers={['Parameter', 'Type', 'Required', 'Default', 'Description']}
            rows={[
              ['query', <CodeCell>string</CodeCell>, 'Yes', <CodeCell color="var(--code-text)">—</CodeCell>, 'Natural language query to search for semantically similar memories.'],
              ['namespace', <CodeCell>string</CodeCell>, 'No', <CodeCell color="var(--code-text)">"general"</CodeCell>, 'Namespace to search within.'],
              ['top_k', <CodeCell>integer</CodeCell>, 'No', <CodeCell color="var(--code-text)">5</CodeCell>, 'Number of results to return. Maximum: 20.'],
              ['min_similarity', <CodeCell>number</CodeCell>, 'No', <CodeCell color="var(--code-text)">0.7</CodeCell>, 'Minimum cosine similarity threshold. Range: 0.0–1.0. Values below 0.5 may return low-relevance results.'],
              ['rerank', <CodeCell>boolean</CodeCell>, 'No', <CodeCell color="var(--code-text)">true</CodeCell>, 'Run AI reranking pass on results before returning.'],
            ]}
          />

          <div style={{ marginTop: 12, marginBottom: 16 }}>
            <CodeBlock code={`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_memory_search",
    "arguments": {
      "query": "What are the user's communication preferences?",
      "namespace": "personal",
      "top_k": 5,
      "min_similarity": 0.7,
      "rerank": true
    }
  },
  "id": 1
}`} label="tools/call — opticontext_memory_search" />
          </div>

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Response schema
          </p>
          <DataTable
            headers={['Field', 'Type', 'Description']}
            rows={[
              ['memories', 'array', 'Retrieved memory objects. Each has content, namespace, importance, similarity, and created_at.'],
              ['relevance_scores', 'array', 'Cosine similarity scores for each returned memory, in matching order.'],
              ['total_found', 'integer', 'Total number of memories in the namespace that exceeded min_similarity.'],
              ['context_block', 'string', 'Pre-assembled context string combining the top results. Ready to inject into a model prompt.'],
            ]}
          />

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Error codes
          </p>
          <DataTable
            headers={['Code', 'Name', 'Cause']}
            rows={[
              ['-32001', 'UNAUTHORIZED', 'Agent key missing, malformed, not found, or revoked.'],
              ['-32029', 'RATE_LIMITED', '30 requests/minute per agent key reached.'],
              ['-32080', 'NAMESPACE_NOT_FOUND', 'No memories exist in the specified namespace for this agent.'],
              ['-32081', 'EMBEDDING_FAILED', 'Embedding API returned an error. Retry the call.'],
              ['-32082', 'MEMORY_LIMIT_REACHED', 'Agent has reached the 10,000-chunk limit. Auto-summarization may not have run yet.'],
            ]}
          />
        </div>

        {/* ============================================================ */}
        {/* SECTION 6 — UPLOAD FLOW */}
        {/* ============================================================ */}
        <SectionHeading id="upload-flow">Upload Flow</SectionHeading>

        <SubHeading>Overview</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          The upload flow is a two-step process for files too large to send inline as base64 (recommended threshold: files over 5MB). It decouples the file transfer from the analysis call, allowing large files to be staged before the capability is invoked.
        </p>
        <FlowBlock>{`Step 1: POST /upload → receive upload_id
Step 2: POST /mcp (opticontext_analyze with upload_id) → receive file_id + analysis`}</FlowBlock>

        <SubHeading>Step 1 — Upload the file</SubHeading>
        <div style={{ marginBottom: 16 }}>
          <CodeBlock code={`curl -X POST https://opticontext.opticontext.workers.dev/upload \\
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \\
  -F "file=@/path/to/report.pdf"`} label="bash — POST /upload" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          <strong>Response:</strong>
        </p>
        <div style={{ marginBottom: 16 }}>
          <CodeBlock code={`{
  "upload_id": "upload_7f3a9b2e",
  "filename": "report.pdf",
  "size_bytes": 8421376,
  "expires_at": "2026-05-22T14:30:00Z"
}`} label="/upload response" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          The file is stored in edge storage under a temporary key (<code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>{'<agent_id>/<upload_id>'}</code>). The <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>upload_id</code> expires 24 hours after upload. Uploaded files are automatically cleaned up after expiry.
        </p>

        <SubHeading>Step 2 — Analyze using the upload_id</SubHeading>
        <div style={{ marginBottom: 24 }}>
          <CodeBlock code={`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_analyze",
    "arguments": {
      "upload_id": "upload_7f3a9b2e",
      "query": "Summarize the key financial findings and flag any anomalies."
    }
  },
  "id": 1
}`} label="tools/call — opticontext_analyze" />
        </div>

        <SubHeading>File persistence and file_id</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          When <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>opticontext_analyze</code> is called with <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>upload_id</code> or <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>file_b64</code>, OptiContext automatically persists the file:
        </p>
        <FlowBlock>{`Temp location (expires 24h):  <agent_id>/upload_7f3a9b2e  (R2)
                                    ↓ on analysis call
Permanent location:          persist/<agent_id>/<file_id>  (R2)
KV index written:            file_idx:a3f8d9e1b2c4 → { r2_key, filename, mime_type }
Turso record written:        uploaded_files table`}</FlowBlock>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          The <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>file_id</code> (12 lowercase hex characters) is returned in the <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>opticontext_analyze</code> response. Use it in future calls to re-analyze the same file without re-uploading.
        </p>

        <SubHeading>Re-analysis flow</SubHeading>
        <div style={{ marginBottom: 16 }}>
          <CodeBlock code={`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_analyze",
    "arguments": {
      "file_id": "a3f8d9e1b2c4",
      "query": "List all functions that interact with the database layer.",
      "model": "pro"
    }
  },
  "id": 1
}`} label="tools/call — re-analysis" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          On re-analysis, OptiContext fetches the file from edge storage and uploads it to the analysis API. The analysis service retains files for 48 hours — if a re-analysis occurs within that window, the file may be reused without re-uploading. After 48 hours, the file is re-uploaded automatically from edge storage. The <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>file_id</code> in edge storage has no expiry.
        </p>

        <SubHeading>Upload lifecycle summary</SubHeading>
        <DataTable
          headers={['Stage', 'Storage', 'Expiry']}
          rows={[
            ['POST /upload received', 'Edge storage temp key', '1 hour'],
            ['opticontext_analyze called with upload_id', 'Edge storage temp key deleted; persisted to permanent key', 'No expiry'],
            ['File sent to analysis API', 'Analysis service servers', '48 hours'],
            ['File retained for re-analysis', 'Edge storage', 'No expiry (agent-managed)'],
          ]}
        />

        {/* ============================================================ */}
        {/* SECTION 7 — ERROR REFERENCE */}
        {/* ============================================================ */}
        <SectionHeading id="error-reference">Error Reference</SectionHeading>

        <SubHeading>Error response structure</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          All errors follow JSON-RPC 2.0 error format. HTTP status is always <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>200</code> for MCP errors — the error is carried in the JSON body. Transport-level failures (malformed JSON, server crash) return non-200 HTTP status codes.
        </p>
        <div style={{ marginBottom: 12 }}>
          <CodeBlock code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": <integer>,
    "message": "<ERROR_NAME> — <specific cause>. <action>"
  },
  "id": 1
}`} label="error response structure" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          <strong>Message format:</strong> <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>ERROR_NAME — what happened. What to do next.</code> Every error message names the specific cause and includes an actionable resolution. Generic messages are not used.
        </p>

        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Authentication errors
        </p>
        <DataTable
          headers={['Code', 'Name', 'HTTP', 'Cause', 'Resolution']}
          rows={[
            ['-32001', 'UNAUTHORIZED', '200', 'Authorization header missing or malformed.', 'Add Authorization: Bearer opctx_<key> header. Verify opctx_ prefix is present.'],
            ['-32001', 'KEY_NOT_FOUND', '200', 'Agent key does not exist in the system.', 'Verify the key was copied correctly. Create a new key from the dashboard if needed.'],
            ['-32001', 'KEY_REVOKED', '200', 'Agent key has been revoked.', 'Create a new key from /dashboard/settings. The revoked key cannot be restored.'],
            ['-32003', 'FORBIDDEN', '200', 'Agent key does not have permission for this capability.', 'Check the key\'s capability permissions in the dashboard.'],
          ]}
        />

        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 24, marginBottom: 8 }}>
          Rate limit errors
        </p>
        <DataTable
          headers={['Code', 'Name', 'HTTP', 'Cause', 'Resolution']}
          rows={[
            ['-32029', 'RATE_LIMITED', '200', '30 requests/minute per agent key reached.', 'Wait for the reset window stated in the error message. The reset time is always included.'],
            ['-32030', 'DAILY_CAP_REACHED', '200', '500 requests/day for this agent key exhausted.', 'Resets at 00:00 UTC. The reset time is included in the error message.'],
          ]}
        />

        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 24, marginBottom: 8 }}>
          IntelliSearch errors
        </p>
        <DataTable
          headers={['Code', 'Name', 'Cause', 'Resolution']}
          rows={[
            ['-32040', 'PROVIDER_UNAVAILABLE', 'All search providers failed.', 'Retry with "mode": "fast" to use the free provider.'],
            ['-32041', 'BUDGET_GUARD_ACTIVE', 'Primary search at ≥800/1,000 monthly credits.', 'Requests route to fallback provider automatically. No action required. provider_used in the response reflects this.'],
            ['-32050', 'QUERY_TOO_LONG', 'Query exceeds 500 characters.', 'Shorten the query. Use dork parameters for precision.'],
          ]}
        />

        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 24, marginBottom: 8 }}>
          VoiceBridge errors
        </p>
        <DataTable
          headers={['Code', 'Name', 'Cause', 'Resolution']}
          rows={[
            ['-32060', 'TEXT_TOO_LONG', 'Input text exceeds 3,000 characters.', 'Split into multiple sequential calls, each under 3,000 characters.'],
            ['-32061', 'INVALID_VOICE_ID', 'Voice ID not recognized.', 'Use a valid voice ID from the voice reference table.'],
            ['-32062', 'SYNTHESIS_FAILED', 'TTS provider returned an error or empty response.', 'Retry the call. If the error persists, try a different voice ID.'],
            ['-32063', 'STREAM_UNSUPPORTED', 'SSE streaming unavailable in this request context.', 'Set stream: false and use URL delivery.'],
          ]}
        />

        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 24, marginBottom: 8 }}>
          DeepDoc errors
        </p>
        <DataTable
          headers={['Code', 'Name', 'Cause', 'Resolution']}
          rows={[
            ['-32070', 'FILE_NOT_FOUND', 'file_id not found for this agent key.', 'The file may have been deleted or the file_id belongs to a different agent key. Re-upload.'],
            ['-32071', 'UPLOAD_EXPIRED', 'upload_id has expired (temp files expire 1 hour after upload).', 'Re-upload via POST /upload and use the new upload_id immediately.'],
            ['-32072', 'FILE_TOO_LARGE', 'File exceeds the 2GB analysis API limit.', 'Split the file before uploading. ZIP archives are extracted automatically.'],
            ['-32073', 'UNSUPPORTED_FILE_TYPE', 'File format not supported by the analysis API.', 'Check the supported file types table in the capability reference.'],
            ['-32074', 'ANALYSIS_QUOTA_REACHED', 'Daily analysis request limit reached.', 'Fast model: 1,500/day. Large-context model: 50/day. Resets at midnight.'],
            ['-32075', 'ANALYSIS_FAILED', 'Analysis service returned an empty or malformed response.', 'Retry with a more specific query. Switch model with model: "pro" for complex files.'],
          ]}
        />

        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 24, marginBottom: 8 }}>
          MemoryCore errors
        </p>
        <DataTable
          headers={['Code', 'Name', 'Cause', 'Resolution']}
          rows={[
            ['-32080', 'NAMESPACE_NOT_FOUND', 'No memories exist in the specified namespace for this agent key.', 'Verify the namespace string. Call opticontext_memory_write to create the first entry.'],
            ['-32081', 'EMBEDDING_FAILED', 'Embedding API returned an error.', 'Retry the call. Transient.'],
            ['-32082', 'MEMORY_LIMIT_REACHED', 'Agent\'s memory store has reached 10,000 chunks.', 'Auto-summarization triggers at 8,000 chunks. If auto-summarization has not yet run, wait and retry.'],
          ]}
        />

        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 24, marginBottom: 8 }}>
          Server errors
        </p>
        <DataTable
          headers={['Code', 'HTTP', 'Name', 'Cause', 'Resolution']}
          rows={[
            ['-32603', '200', 'INTERNAL_ERROR', 'Unexpected server-side failure.', 'Retry with exponential backoff. Report persistent failures.'],
            ['—', '500', 'Transport error', 'Edge platform failure.', 'Retry. Platform uptime SLA applies.'],
            ['—', '503', 'SERVICE_UNAVAILABLE', 'Downstream provider temporarily unreachable.', 'Retry after 30 seconds. Budget guard may route to an alternative provider.'],
          ]}
        />

        <SubHeading>Retry guidance</SubHeading>
        <FlowBlock>{`Transient errors (-32040, -32062, -32075, -32081, -32603):
  Retry with exponential backoff: 1s → 2s → 4s → give up after 3 attempts.

Rate limit errors (-32029, -32030):
  Do not retry until the reset time stated in the error message.
  -32029: resets at the start of the next 60-second window.
  -32030: resets at 00:00 UTC.

Auth errors (-32001, -32003):
  Do not retry. Fix the credential issue before retrying.

Provider budget errors (-32041):
  Do not retry. The error is informational. The request was already rerouted.`}</FlowBlock>

        {/* ============================================================ */}
        {/* SECTION 8 — RATE LIMITS */}
        {/* ============================================================ */}
        <SectionHeading id="rate-limits">Rate Limits</SectionHeading>

        <SubHeading>Per-agent key limits</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          All limits are enforced per agent key. Two keys issued to different runtimes do not share limits.
        </p>
        <DataTable
          headers={['Limit', 'Value', 'Scope', 'Reset']}
          rows={[
            ['Requests per minute', '30', 'All capabilities combined', 'Rolling 60-second window'],
            ['Requests per day', '500', 'All capabilities combined', '00:00 UTC'],
          ]}
        />
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          The per-minute limit is enforced via edge KV per-minute bucket counters. The per-day cap is tracked in Turso.
        </p>

        <SubHeading>Capability-specific provider limits</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          These limits are set by the underlying provider, not by OptiContext. Budget guards prevent hard failures by switching providers automatically before limits are reached.
        </p>
        <DataTable
          headers={['Capability', 'Provider', 'Limit', 'Budget guard threshold']}
          rows={[
            ['IntelliSearch', 'Primary search', '1,000 credits/month', '800 credits — auto-routes to fallback'],
            ['IntelliSearch', 'Structured data', '~$5 credits/month', '$4.50 spent — pauses "scrape" mode'],
            ['IntelliSearch', 'Free search', 'Unlimited', '—'],
            ['VoiceBridge', 'TTS provider', 'Free tier character limit', 'Near limit — informational error returned'],
            ['DeepDoc', 'Fast model', '1,500 req/day, 15 RPM', '1,200 req/day — throttles non-critical requests'],
            ['DeepDoc', 'Large-context model', '50 req/day, 2 RPM', '40 req/day — blocks new requests'],
            ['MemoryCore', 'Embedding model', 'Free (rate-limited)', '—'],
            ['All capabilities', 'AI summarization', '1M tokens/day', '800K tokens/day — switches to simpler model'],
          ]}
        />

        <SubHeading>Budget guard behavior</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          Budget guards are proactive, not reactive. They switch providers before the hard limit is reached, so the runtime receives a valid response rather than an error.
        </p>
        <FlowBlock>{`Budget guard triggered:
  → Capability routes to the next provider automatically
  → The response field provider_used reflects which provider resolved the request
  → No error is returned unless all available providers are exhausted
  → Dashboard shows a warning indicator in the Usage Alerts section

Hard limit hit (all providers exhausted):
  → PROVIDER_UNAVAILABLE error returned (-32040)
  → Retry with a different mode or wait for the monthly reset`}</FlowBlock>

        <SubHeading>Upload limits</SubHeading>
        <DataTable
          headers={['Limit', 'Value']}
          rows={[
            ['Max inline base64 (file_b64)', '100MB'],
            ['Max pre-upload (POST /upload)', '2GB'],
            ['Upload temp expiry', '24 hours'],
            ['Body size limit (JSON-RPC)', '1MB (413 if exceeded)'],
          ]}
        />

        <SubHeading>Rate limit response headers</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          When a request is rate-limited, the error message includes the reset time. No custom HTTP headers are added — the reset information is carried in the <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>error.message</code> field per JSON-RPC 2.0 convention:
        </p>
        <div style={{ marginBottom: 24 }}>
          <CodeBlock code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32029,
    "message": "RATE_LIMITED — 30 requests/minute reached for this agent key. Resets in 43 seconds."
  },
  "id": 1
}`} label="rate limit error example" />
        </div>

        {/* ============================================================ */}
        {/* SECTION 9 — RESPONSE STRUCTURE */}
        {/* ============================================================ */}
        <SectionHeading id="response-structure">Response Structure Standards</SectionHeading>

        <SubHeading>Success response envelope</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          All successful capability responses follow this structure:
        </p>
        <div style={{ marginBottom: 16 }}>
          <CodeBlock code={`{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "<json_string>"
      }
    ]
  },
  "id": 1
}`} label="success response envelope" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          The <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>content[0].text</code> value is a JSON-serialized string. The runtime must parse it to access capability output fields.
        </p>

        <SubHeading>Common response fields</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          These fields appear across multiple capabilities:
        </p>
        <DataTable
          headers={['Field', 'Type', 'Capabilities', 'Description']}
          rows={[
            ['cached', 'boolean', 'IntelliSearch, VoiceBridge', 'Whether the response was served from cache.'],
            ['provider_used', 'string', 'IntelliSearch', 'Which search provider resolved the request.'],
            ['model_used', 'string', 'DeepDoc', 'Which AI model the router selected.'],
            ['confidence', 'number', 'IntelliSearch, DeepDoc', 'Model confidence score. Range: 0.0–1.0.'],
            ['tokens_used', 'integer', 'DeepDoc', 'Tokens consumed by the AI analysis.'],
          ]}
        />

        <SubHeading>Null and absent fields</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          Optional response fields that produced no data are omitted entirely from the response — they are not returned as <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>null</code>. For example, if a DeepDoc analysis finds no data tables in the file, <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>tables</code> is an empty array (<code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>[]</code>). If VoiceBridge returns a URL (not a stream), <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>chunks</code> is an empty array.
        </p>

        <SubHeading>save_to_memory cross-capability behavior</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          IntelliSearch, VoiceBridge, and DeepDoc all accept <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>save_to_memory: true</code>. When set:
        </p>
        <FlowBlock>{`Primary capability call completes first.
opticontext_memory_write is called automatically with the result.
The memory write happens before the response is returned.
If the memory write fails, the primary capability response is still returned.
The memory failure is logged but does not surface as an error to the runtime.`}</FlowBlock>

        {/* ============================================================ */}
        {/* SECTION 10 — COMPATIBILITY */}
        {/* ============================================================ */}
        <SectionHeading id="compatibility">Compatibility Notes</SectionHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          OptiContext implements the Model Context Protocol specification directly. Any runtime implementing MCP Streamable HTTP transport (MCP 2025-11-25) connects to OptiContext without modification.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          <strong>Protocol version:</strong> MCP 2025-11-25 (Streamable HTTP transport)
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          <strong>Legacy support:</strong> HTTP+SSE transport (MCP 2025-03-26) is supported via the <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/sse</code> endpoint for runtimes that have not yet migrated to Streamable HTTP.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          <strong>Configuration:</strong> The endpoint URL, Authorization header format, and JSON-RPC 2.0 message structure are identical across all MCP-compatible runtimes. Configuration file paths and JSON field names vary by runtime. See the quickstart at <a href="/docs/quickstart" style={{ color: 'var(--accent-text)' }}>/docs/quickstart</a> for runtime-specific configuration.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          <strong>Tested runtimes (non-exhaustive):</strong>
        </p>
        <FlowBlock>{`Claude Code · Cursor · OpenClaw · Hermes · Windsurf · Cline · Custom MCP runtimes`}</FlowBlock>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          Any runtime that implements the MCP specification can connect. The list above reflects verified configurations, not a complete list of compatible runtimes.
        </p>
      </div>
    </div>
  );
}
