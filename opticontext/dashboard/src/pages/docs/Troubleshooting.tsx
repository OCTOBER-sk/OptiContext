import React from 'react';
import { CodeBlock } from '../../components/ui/CodeBlock';

const SECTIONS = [
  { id: 'authentication', label: 'Authentication' },
  { id: 'rate-limits', label: 'Rate Limits' },
  { id: 'intellisearch', label: 'IntelliSearch' },
  { id: 'voicebridge', label: 'VoiceBridge' },
  { id: 'deepdoc', label: 'DeepDoc' },
  { id: 'memorycore', label: 'MemoryCore' },
  { id: 'connectivity', label: 'Connectivity' },
  { id: 'retry', label: 'Retry Guidance' },
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

function ErrorBlock({
  what,
  why,
  resolution,
  code,
  codeLabel,
  separator,
}: {
  what: string;
  why: React.ReactNode;
  resolution: React.ReactNode;
  code?: string;
  codeLabel?: string;
  separator?: boolean;
}) {
  return (
    <div style={{ marginBottom: separator ? 24 : 0 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          <strong>What happened:</strong> {what}
        </p>
        <div style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          <strong>Why it happened:</strong> {why}
        </div>
        <div style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: separator ? 16 : 0, lineHeight: 1.6 }}>
          <strong>Resolution:</strong> {resolution}
        </div>
      </div>
      {code && (
        <div style={{ marginBottom: separator ? 32 : 0 }}>
          <CodeBlock code={code} label={codeLabel || 'error response'} />
        </div>
      )}
      {separator && (
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />
      )}
    </div>
  );
}

export default function Troubleshooting() {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p className="breadcrumb" style={{ marginBottom: 8 }}>
          Documentation  {'>'}  Troubleshooting
        </p>

        <h1
          style={{
            fontFamily: "'Zodiak', Georgia, serif",
            fontWeight: 400,
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          Troubleshooting
        </h1>

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
          This page covers every error code OptiContext returns, with causes and resolution steps.
          All errors follow the JSON-RPC 2.0 error object format.
          HTTP status is 200 for all well-formed requests — errors are carried in the response body,
          not in the HTTP layer.
        </p>

        <NoteBlock>
          Every error message answers three questions: what happened, why it happened, and what to do next.
          No generic messages. No exclamation marks. No filler.
        </NoteBlock>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
            <strong>Error response structure</strong>
          </p>
          <CodeBlock code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "ERROR_NAME — specific cause. Actionable resolution."
  },
  "id": 1
}`} label="error response structure" />
        </div>

        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
          The <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>error.message</code> field always follows this format: <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>ERROR_NAME — what happened. What to do next.</code>
          <br /><code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>code</code> is a negative integer. <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>id</code> matches the <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>id</code> of the original request. If the request <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>id</code> cannot be determined (malformed JSON), the response <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>id</code> is <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>null</code>.
        </p>

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
        {/* AUTHENTICATION ERRORS */}
        {/* ============================================================ */}
        <SectionHeading id="authentication">Authentication Errors</SectionHeading>

        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          Authentication is verified on every request by the edge node auth guard. The KV lookup is in-path — no secondary network call. Failures are returned immediately before any capability logic executes.
        </p>

        <SubHeading>UNAUTHORIZED — -32001</SubHeading>
        <ErrorBlock
          what="The Authorization header is missing, uses the wrong scheme, or is structurally malformed."
          why={
            <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
              <li>The header was not included in the request.</li>
              <li>The header uses a scheme other than <CodeCell>Bearer</CodeCell> (e.g. <CodeCell>Basic</CodeCell>, <CodeCell>Token</CodeCell>).</li>
              <li>The key value contains whitespace or invalid characters.</li>
              <li>The <CodeCell>opctx_</CodeCell> prefix is absent — the key string starts with the wrong prefix.</li>
            </ul>
          }
          resolution={
            <span>
              Verify the header is present and correctly formatted:
              <div style={{ marginTop: 8, marginBottom: 8 }}>
                <CodeBlock code="Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" compact />
              </div>
              Check that <CodeCell>Bearer</CodeCell> is capitalized exactly as shown. There is exactly one space between <CodeCell>Bearer</CodeCell> and the key value. The key begins with <CodeCell>opctx_</CodeCell>. No newlines or trailing spaces are included in the header value.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "UNAUTHORIZED — Authorization header missing or malformed. Add Authorization: Bearer opctx_<key> to the request."
  },
  "id": 1
}`}
          codeLabel="UNAUTHORIZED error"
          separator
        />

        <SubHeading>KEY_NOT_FOUND — -32001</SubHeading>
        <ErrorBlock
          what="The agent key in the Authorization header is not recognized by OptiContext."
          why={
            <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
              <li>The key was copied incorrectly — a character is missing, duplicated, or transposed.</li>
              <li>The key belongs to a different account.</li>
              <li>The key was created in the dashboard but the browser window was closed before copying the full value.</li>
              <li>The key has already been revoked (see KEY_REVOKED below).</li>
            </ul>
          }
          resolution={
            <ol style={{ margin: '4px 0', paddingLeft: 20 }}>
              <li>Open <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/dashboard/settings</code> and verify the key name you intended to use is listed.</li>
              <li>Agent keys cannot be recovered from the dashboard after the creation reveal — only the masked suffix is shown. If the full key was not copied at creation, revoke it and create a new one.</li>
              <li>Re-copy the key from the creation reveal on the new key.</li>
            </ol>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "KEY_NOT_FOUND — No agent key matching this credential exists. Verify the key was copied correctly or create a new key at /dashboard/settings."
  },
  "id": 1
}`}
          codeLabel="KEY_NOT_FOUND error"
          separator
        />

        <SubHeading>KEY_REVOKED — -32001</SubHeading>
        <ErrorBlock
          what="The agent key in the request has been revoked."
          why="The key was revoked from /dashboard/settings. Revoked keys cannot make capability calls. Revocation propagates to all edge nodes within one KV propagation cycle — typically under 60 seconds globally."
          resolution={
            <span>
              Create a new agent key from <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/dashboard/settings</code>.
              Update the runtime configuration to use the new key.
              The revoked key cannot be reactivated.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "KEY_REVOKED — This agent key has been revoked and cannot make capability calls. Create a new key at /dashboard/settings."
  },
  "id": 1
}`}
          codeLabel="KEY_REVOKED error"
          separator
        />

        <SubHeading>FORBIDDEN — -32003</SubHeading>
        <ErrorBlock
          what="The agent key exists and is valid, but does not have permission to call the requested capability."
          why="The key was created with a restricted capability set that excludes the capability being called. The tools/list response will not include the restricted capability's MCP capability name."
          resolution={
            <span>
              Check the key's capability permissions in <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/dashboard/settings</code>.
              If the capability is required, create a new key with the correct permissions, or expand the current key's scope.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32003,
    "message": "FORBIDDEN — This agent key does not have permission for the requested capability. Review key permissions at /dashboard/settings."
  },
  "id": 1
}`}
          codeLabel="FORBIDDEN error"
        />

        {/* ============================================================ */}
        {/* RATE LIMIT ERRORS */}
        {/* ============================================================ */}
        <SectionHeading id="rate-limits">Rate Limit Errors</SectionHeading>

        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          Rate limits are enforced per agent key. Two keys issued to different runtimes do not share rate limits. All limits apply across all capabilities combined.
        </p>

        <SubHeading>RATE_LIMITED — -32029</SubHeading>
        <ErrorBlock
          what="The per-minute request limit for this agent key has been reached."
          why="More than 30 requests were sent using this agent key within the current 60-second window. The limit resets on a rolling 60-second window — not at the top of each clock minute."
          resolution={
            <span>
              Wait for the reset window. The <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>error.message</code> field includes the number of seconds remaining.
              Do not retry immediately. Implement exponential backoff: 1s → 2s → 4s, maximum 3 attempts.
              If this limit is reached consistently, consider using separate agent keys for separate runtimes to distribute load across independent rate limit buckets.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32029,
    "message": "RATE_LIMITED — 30 requests/minute reached for this agent key. Resets in 43 seconds."
  },
  "id": null
}`}
          codeLabel="RATE_LIMITED error"
          separator
        />

        <SubHeading>DAILY_CAP_REACHED — -32030</SubHeading>
        <ErrorBlock
          what="The per-day request cap for this agent key has been reached."
          why="500 requests have been made using this agent key on the current UTC day. The cap applies across all capabilities combined."
          resolution={
            <span>
              The cap resets at 00:00 UTC. Do not retry before then — retries will continue to fail until the reset.
              For higher-volume workloads, distribute requests across multiple agent keys. Each key has an independent daily cap.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32030,
    "message": "DAILY_CAP_REACHED — 500 requests/day exhausted for this agent key. Resets at 00:00 UTC. Time remaining: 4h 17m."
  },
  "id": null
}`}
          codeLabel="DAILY_CAP_REACHED error"
        />

        {/* ============================================================ */}
        {/* INTELLISEARCH ERRORS */}
        {/* ============================================================ */}
        <SectionHeading id="intellisearch">IntelliSearch Errors</SectionHeading>

        <SubHeading>PROVIDER_UNAVAILABLE — -32040</SubHeading>
        <ErrorBlock
          what="IntelliSearch attempted to route the query through all available search providers and all failed to return a valid response."
          why={
            <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
              <li>All three providers returned errors or empty results simultaneously (rare).</li>
              <li>The free search provider's rate jitter was active at the exact moment of the request.</li>
              <li>The query contained characters or patterns that all providers rejected.</li>
            </ul>
          }
          resolution={
            <span>
              Retry with <CodeCell>"mode": "fast"</CodeCell> to force the free search provider directly:
              <div style={{ marginTop: 8, marginBottom: 8 }}>
                <CodeBlock code={`{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "opticontext_search",
    "arguments": {
      "query": "your query",
      "mode": "fast"
    }
  },
  "id": 1
}`} label="retry with mode fast" />
              </div>
              If retries continue to fail, the query may contain characters that providers are rejecting. Shorten or simplify the query string.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32040,
    "message": "PROVIDER_UNAVAILABLE — All search providers failed to return results. Retry with mode: fast to use the fallback provider."
  },
  "id": 1
}`}
          codeLabel="PROVIDER_UNAVAILABLE error"
          separator
        />

        <SubHeading>BUDGET_GUARD_ACTIVE — -32041</SubHeading>
        <ErrorBlock
          what="Primary search credits have reached or exceeded 800 of 1,000. IntelliSearch routed the request through the fallback provider automatically."
          why="This is an informational response, not a failure. The budget guard is proactive — it switches providers before the hard limit is reached so the runtime receives a valid response rather than an error. The provider_used field in the response will show the fallback provider."
          resolution="No action required. The request was fulfilled. The provider_used field indicates which provider resolved it."
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32041,
    "message": "BUDGET_GUARD_ACTIVE — Primary search credits at 847/1000 for this month. Request routed to fallback provider. No action required."
  },
  "id": 1
}`}
          codeLabel="BUDGET_GUARD_ACTIVE"
          separator
        />

        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6, padding: '8px 14px', background: 'var(--raised)', borderRadius: 4, borderLeft: '3px solid var(--accent)' }}>
          <strong>Note:</strong> <CodeCell>-32041</CodeCell> is returned alongside a valid result. The <CodeCell>result</CodeCell> field is populated. The <CodeCell>error</CodeCell> field is informational only. Runtimes that treat any <CodeCell>error</CodeCell> field as a failure condition should check for <CodeCell>-32041</CodeCell> specifically and handle it as a warning, not a failure.
        </p>

        <SubHeading>QUERY_TOO_LONG — -32050</SubHeading>
        <ErrorBlock
          what="The query parameter exceeds 500 characters."
          why="The query string passed in arguments.query is longer than the 500-character limit."
          resolution={
            <span>
              Shorten the query string to 500 characters or fewer. For complex queries, use the <CodeCell>dork</CodeCell> parameter to specify precision via <CodeCell>site_filter</CodeCell>, <CodeCell>file_type</CodeCell>, <CodeCell>date_after</CodeCell>, or <CodeCell>exclude_terms</CodeCell> rather than encoding all constraints into the query string.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32050,
    "message": "QUERY_TOO_LONG — query exceeds 500 characters (received 612). Shorten the query or use the dork parameter for precision."
  },
  "id": 1
}`}
          codeLabel="QUERY_TOO_LONG error"
        />

        {/* ============================================================ */}
        {/* VOICEBRIDGE ERRORS */}
        {/* ============================================================ */}
        <SectionHeading id="voicebridge">VoiceBridge Errors</SectionHeading>

        <SubHeading>TEXT_TOO_LONG — -32060</SubHeading>
        <ErrorBlock
          what="The text parameter exceeds 3,000 characters."
          why="VoiceBridge enforces a per-call character limit at the API boundary."
          resolution={
            <span>
              Split the text into sequential capability calls, each under 3,000 characters. Split at natural sentence boundaries to avoid mid-sentence audio cuts. The runtime can chain the resulting <CodeCell>audio_url</CodeCell> values for sequential playback.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32060,
    "message": "TEXT_TOO_LONG — input text is 3,847 characters. VoiceBridge maximum is 3,000 characters per call. Split the text into sequential calls."
  },
  "id": 1
}`}
          codeLabel="TEXT_TOO_LONG error"
          separator
        />

        <SubHeading>INVALID_VOICE_ID — -32061</SubHeading>
        <ErrorBlock
          what="The voice parameter contains a voice ID that the TTS provider does not recognize."
          why="The voice ID string does not match any entry in the voice roster. Voice IDs are case-sensitive."
          resolution={
            <span>
              Use a valid voice ID from the voice reference table at <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/docs/tools/voicebridge</code>. The default voice <CodeCell>"Scarlett"</CodeCell> is always valid.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32061,
    "message": "INVALID_VOICE_ID — voice ID \"Scarlet\" is not recognized. Check the voice reference table at /docs/tools/voicebridge. Voice IDs are case-sensitive."
  },
  "id": 1
}`}
          codeLabel="INVALID_VOICE_ID error"
          separator
        />

        <SubHeading>SYNTHESIS_FAILED — -32062</SubHeading>
        <ErrorBlock
          what="The TTS provider returned an error or an empty response."
          why="This is a transient provider error. The TTS provider may have returned an error code, a timeout, or an empty audio payload. The cause is typically a transient provider outage or throttling."
          resolution={
            <span>
              Retry the call. Transient. Use exponential backoff: 1s → 2s → 4s, maximum 3 attempts.
              If the error persists across retries, try a different voice ID — specific voices can occasionally enter a degraded state at the provider level.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32062,
    "message": "SYNTHESIS_FAILED — TTS provider returned an error for this request. Retry with exponential backoff. If persistent, try a different voice ID."
  },
  "id": 1
}`}
          codeLabel="SYNTHESIS_FAILED error"
          separator
        />

        <SubHeading>STREAM_UNSUPPORTED — -32063</SubHeading>
        <ErrorBlock
          what="SSE streaming was requested (stream: true) but the current request context does not support it."
          why="Streaming via SSE requires the runtime to open a GET /mcp SSE connection before the POST /mcp call. If the GET /mcp connection is absent, the stream cannot be delivered."
          resolution={
            <span>
              Set <CodeCell>stream: false</CodeCell> in the capability arguments. VoiceBridge will return a signed edge storage audio URL instead of a stream. Alternatively, configure your runtime to open a <CodeCell>GET /mcp</CodeCell> SSE connection before streaming capability calls.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32063,
    "message": "STREAM_UNSUPPORTED — SSE streaming requires an open GET /mcp connection. Set stream: false to receive an audio URL instead."
  },
  "id": 1
}`}
          codeLabel="STREAM_UNSUPPORTED error"
        />

        {/* ============================================================ */}
        {/* DEEPDOC ERRORS */}
        {/* ============================================================ */}
        <SectionHeading id="deepdoc">DeepDoc Errors</SectionHeading>

        <SubHeading>FILE_NOT_FOUND — -32070</SubHeading>
        <ErrorBlock
          what="The file_id passed to opticontext_analyze was not found for this agent key."
          why={
            <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
              <li>The <CodeCell>file_id</CodeCell> was generated by a different agent key. File storage in edge storage is namespaced under <CodeCell>{'<agent_id>/'}</CodeCell> — cross-key file access is not permitted.</li>
              <li>The file was deleted or expired.</li>
              <li>The <CodeCell>file_id</CodeCell> value was truncated or malformed when passed to the capability.</li>
            </ul>
          }
          resolution={
            <span>
              Verify the <CodeCell>file_id</CodeCell> was returned by a previous DeepDoc call made with the same agent key.
              Re-upload the file via <CodeCell>POST /upload</CodeCell> or pass it inline via <CodeCell>file_b64</CodeCell> to generate a fresh reference.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32070,
    "message": "FILE_NOT_FOUND — file_id a3f8d9e1b2c4 not found for this agent key. Re-upload via POST /upload or pass the file inline using file_b64."
  },
  "id": 1
}`}
          codeLabel="FILE_NOT_FOUND error"
          separator
        />

        <SubHeading>UPLOAD_EXPIRED — -32071</SubHeading>
        <ErrorBlock
          what="The upload_id passed to opticontext_analyze has expired."
          why="Files uploaded via POST /upload are stored temporarily in edge storage with a 1-hour TTL. The upload_id upload_7f3a9b2e was not used within that window."
          resolution={
            <span>
              Re-upload the file via <CodeCell>POST /upload</CodeCell> and use the new <CodeCell>upload_id</CodeCell> immediately. The <CodeCell>expires_at</CodeCell> field in the <CodeCell>/upload</CodeCell> response indicates the exact expiry time.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32071,
    "message": "UPLOAD_EXPIRED — upload_id upload_7f3a9b2e has expired (1-hour TTL). Re-upload via POST /upload and use the new upload_id within 1 hour."
  },
  "id": 1
}`}
          codeLabel="UPLOAD_EXPIRED error"
          separator
        />

        <SubHeading>FILE_TOO_LARGE — -32072</SubHeading>
        <ErrorBlock
          what="The file exceeds the 2GB analysis API limit."
          why="The file analysis API enforces a 2GB per-file limit. The uploaded file exceeded this size."
          resolution={
            <span>
              Split the file before uploading. ZIP archives passed to DeepDoc are extracted automatically — split the archive's contents into multiple smaller ZIPs if the total content exceeds 2GB. For structured documents, extract the sections relevant to the query rather than uploading the full corpus.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32072,
    "message": "FILE_TOO_LARGE — file size 2.4GB exceeds the 2GB limit. Split the file before uploading. ZIP archives are extracted automatically."
  },
  "id": 1
}`}
          codeLabel="FILE_TOO_LARGE error"
          separator
        />

        <SubHeading>UNSUPPORTED_FILE_TYPE — -32073</SubHeading>
        <ErrorBlock
          what="The file format is not supported by the analysis API."
          why="The uploaded file's MIME type or extension is not in the list of supported formats."
          resolution={
            <span>
              Convert the file to a supported format before uploading. For proprietary binary formats, export to PDF or plain text before passing to DeepDoc.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32073,
    "message": "UNSUPPORTED_FILE_TYPE — file type .numbers is not supported. Convert to PDF, XLSX, or CSV before uploading. See /docs/tools/deepdoc for the full list."
  },
  "id": 1
}`}
          codeLabel="UNSUPPORTED_FILE_TYPE error"
          separator
        />

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            <strong>Supported file types</strong>
          </p>
          <DataTable
            headers={['Category', 'Formats']}
            rows={[
              ['Documents', 'PDF, DOCX, TXT, Markdown'],
              ['Code', 'All text-based source files'],
              ['Spreadsheets', 'XLSX, CSV'],
              ['Images', 'PNG, JPEG, WEBP, GIF, HEIC'],
              ['Audio', 'MP3, WAV, OGG, FLAC, AAC'],
              ['Video', 'MP4, MOV, AVI, MKV'],
              ['Archives', 'ZIP (extracted automatically)'],
            ]}
          />
        </div>

        <SubHeading>ANALYSIS_QUOTA_REACHED — -32074</SubHeading>
        <ErrorBlock
          what="The daily analysis request limit has been reached for the model tier being used."
          why="DeepDoc routes requests to the fast model (1,500 req/day) or the large-context model (50 req/day) based on file complexity. The budget guard threshold for the fast model is 1,200 req/day; for the large-context model it is 40 req/day. If both thresholds are exceeded, the error is returned."
          resolution={
            <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
              <li>For fast model quota: the limit resets at midnight. Use a more specific query to stay within the fast model tier.</li>
              <li>For large-context model quota: set <CodeCell>"model": "flash"</CodeCell> explicitly to force the fast model for the remainder of the day.</li>
              <li>Monitor analysis usage in the DeepDoc block on the dashboard.</li>
            </ul>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32074,
    "message": "ANALYSIS_QUOTA_REACHED — Fast model daily limit reached (1,500/1,500). Resets at midnight. Large-context model quota: 43/50 remaining."
  },
  "id": 1
}`}
          codeLabel="ANALYSIS_QUOTA_REACHED error"
          separator
        />

        <SubHeading>ANALYSIS_FAILED — -32075</SubHeading>
        <ErrorBlock
          what="The analysis service returned an empty, truncated, or malformed response."
          why="Transient provider behavior. Possible causes: the file's content density exceeded what the model could process coherently within the response window, or a transient API error occurred."
          resolution={
            <span>
              Retry with exponential backoff. If the error persists:
              <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                <li>Narrow the <CodeCell>query</CodeCell> parameter to a more specific question — a tightly scoped query reduces the response surface and often succeeds where a broad query fails.</li>
                <li>Switch model tier: set <CodeCell>"model": "pro"</CodeCell> for large or complex files that the fast model handles inconsistently.</li>
              </ul>
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32075,
    "message": "ANALYSIS_FAILED — Analysis service returned an empty response. Retry with a more specific query, or set model: pro for complex files."
  },
  "id": 1
}`}
          codeLabel="ANALYSIS_FAILED error"
        />



        {/* ============================================================ */}
        {/* UPLOAD TROUBLESHOOTING */}
        {/* ============================================================ */}
        <SectionHeading id="upload">Upload Troubleshooting</SectionHeading>

        <SubHeading>Inline vs. pre-upload: when to use each</SubHeading>
        <DataTable
          headers={['Method', 'Field', 'Max size', 'When to use']}
          rows={[
            ['Inline base64', <span><CodeCell>file_b64</CodeCell> in <CodeCell>opticontext_analyze</CodeCell></span>, '100MB', 'Files under 100MB, single call'],
            ['Pre-upload', <span><CodeCell>POST /upload</CodeCell> &rarr; <CodeCell>upload_id</CodeCell> in <CodeCell>opticontext_analyze</CodeCell></span>, '2GB', 'Files over 100MB, or when upload and analysis happen at different times'],
          ]}
        />

        <SubHeading>Upload request fails with HTTP 413</SubHeading>
        <ErrorBlock
          what="The upload request body exceeded edge node's request size limit."
          why="Edge nodes enforce a maximum request body size. Large files must be sent as multipart/form-data to POST /upload — not as base64 in the JSON-RPC body."
          resolution={
            <span>
              Use <CodeCell>POST /upload</CodeCell> with <CodeCell>Content-Type: multipart/form-data</CodeCell> for files over 100MB.
              Do not base64-encode large files and embed them in <CodeCell>file_b64</CodeCell> — this inflates the size by ~33% and will exceed the inline limit.
              <div style={{ marginTop: 8, marginBottom: 8 }}>
                <CodeBlock code={`curl -X POST https://mcp.opticontext.dev/upload \\
  -H "Authorization: Bearer opctx_myagent_a3f8d9e1b2c4f6a8d0e2b4c6f8a0d2e4" \\
  -F "file=@/path/to/large_report.pdf"`} label="bash" />
              </div>
            </span>
          }
          separator
        />

        <SubHeading>upload_id expires before use</SubHeading>
        <ErrorBlock
          what="The upload_id returned by POST /upload was not passed to opticontext_analyze within 1 hour."
          why="Files uploaded via POST /upload are stored temporarily in edge storage with a 1-hour TTL."
          resolution={
            <span>
              Re-upload the file. The <CodeCell>/upload</CodeCell> response includes <CodeCell>expires_at</CodeCell> — build the <CodeCell>opticontext_analyze</CodeCell> call immediately after the upload completes, not deferred.
            </span>
          }
          separator
        />

        <SubHeading>File appears to upload but analysis returns FILE_NOT_FOUND</SubHeading>
        <ErrorBlock
          what="The upload_id was passed correctly but opticontext_analyze cannot locate the file."
          why="The opticontext_analyze call used a different agent key from the one used for the POST /upload. Upload storage is namespaced per agent key."
          resolution={
            <span>
              Ensure both the <CodeCell>POST /upload</CodeCell> request and the <CodeCell>opticontext_analyze</CodeCell> capability call use the same agent key in the <CodeCell>Authorization</CodeCell> header.
            </span>
          }
          separator
        />

        <SubHeading>ZIP extraction behavior</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          ZIP archives passed to DeepDoc are extracted automatically before analysis. The extracted contents are analyzed as a single combined context. The <CodeCell>query</CodeCell> parameter applies across all extracted files.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          If the ZIP contains unsupported file types, those files are skipped silently. The <CodeCell>key_findings</CodeCell> and <CodeCell>summary</CodeCell> in the response will reflect only the contents that the analysis service could process.
        </p>

        {/* ============================================================ */}
        {/* MEMORYCORE ERRORS */}
        {/* ============================================================ */}
        <SectionHeading id="memorycore">MemoryCore Errors</SectionHeading>

        <SubHeading>NAMESPACE_NOT_FOUND — -32080</SubHeading>
        <ErrorBlock
          what="No memories exist in the specified namespace for this agent key."
          why="The namespace string passed to opticontext_memory_search does not match any existing namespace in this agent key's memory store. Namespaces are created implicitly on the first opticontext_memory_write call that uses them."
          resolution={
            <span>
              Verify the namespace string exactly — namespaces are case-sensitive. Call <CodeCell>opticontext_memory_write</CodeCell> with the intended namespace to create it before searching.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32080,
    "message": "NAMESPACE_NOT_FOUND — namespace \"Projects\" does not exist for this agent key. Namespaces are case-sensitive. Write to the namespace first using opticontext_memory_write."
  },
  "id": 1
}`}
          codeLabel="NAMESPACE_NOT_FOUND error"
          separator
        />

        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-warning)', marginBottom: 24, lineHeight: 1.6, padding: '8px 14px', background: 'var(--raised)', borderRadius: 4, borderLeft: '3px solid var(--warning)' }}>
          <strong>Common cause:</strong> <CodeCell>"projects"</CodeCell> and <CodeCell>"Projects"</CodeCell> are different namespaces. Standardize to lowercase in your runtime configuration.
        </p>

        <SubHeading>EMBEDDING_FAILED — -32081</SubHeading>
        <ErrorBlock
          what="The Embedding API returned an error while generating a vector for the memory content."
          why="Transient Embedding API error — typically a brief provider unavailability or a rate jitter on the embedding endpoint."
          resolution={
            <span>
              Retry the call. Transient. Use exponential backoff: 1s → 2s → 4s, maximum 3 attempts. Embedding errors are rare and almost always resolve on the first retry.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32081,
    "message": "EMBEDDING_FAILED — Embedding API returned an error. Retry with exponential backoff."
  },
  "id": 1
}`}
          codeLabel="EMBEDDING_FAILED error"
          separator
        />

        <SubHeading>MEMORY_LIMIT_REACHED — -32082</SubHeading>
        <ErrorBlock
          what="The agent key's memory store has reached the 10,000-chunk limit."
          why="Each opticontext_memory_write call stores 1-N chunks (depending on content length and the 512-token chunker). The agent key's total chunk count across all namespaces has reached 10,000. Auto-summarization triggers automatically at 8,000 chunks. If it has not yet reduced the count below 10,000, the store is temporarily at capacity."
          resolution={
            <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
              <li>Wait for the auto-summarization cycle to complete. It runs asynchronously and typically completes within 5 minutes of crossing the 8,000-chunk threshold.</li>
              <li>If auto-summarization has already run and the limit is still reached, the memory store is saturated. Delete unused namespaces to free space, or archive old memories externally before writing new ones.</li>
              <li>Monitor the memory store size in the MemoryCore block on the dashboard.</li>
            </ul>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32082,
    "message": "MEMORY_LIMIT_REACHED — memory store is at 10,000 chunks. Auto-summarization runs at 8,000 chunks and may still be in progress. Retry in 5 minutes."
  },
  "id": 1
}`}
          codeLabel="MEMORY_LIMIT_REACHED error"
          separator
        />

        <SubHeading>Memory search returns no results</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          <strong>What happened:</strong> <CodeCell>opticontext_memory_search</CodeCell> returned an empty <CodeCell>memories</CodeCell> array for a query that should match stored content.
        </p>
        <DataTable
          headers={['Cause', 'Resolution']}
          rows={[
            ['Wrong namespace', 'The memories were stored under a different namespace. Check the namespace used in the original opticontext_memory_write call.'],
            ['top_k too low', 'Increase top_k from the default of 5 to a higher value.'],
            ['min_score threshold too high', 'Lower min_score from the default of 0.7. Try 0.5 for a wider match.'],
            ['Query phrasing mismatch', 'The stored content was phrased differently from the search query. Rephrase the query closer to how the content was written. Semantic similarity, not keyword matching.'],
            ['Memory not yet committed', 'The opticontext_memory_write call may be in-flight. Wait 1-2 seconds and retry.'],
          ]}
        />

        {/* ============================================================ */}
        {/* RUNTIME COMPATIBILITY ERRORS */}
        {/* ============================================================ */}
        <SectionHeading id="runtime">Runtime Compatibility</SectionHeading>

        <SubHeading>Runtime returns "server not found" or fails to connect</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          <strong>What happened:</strong> The runtime cannot reach the MCP endpoint.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          <strong>Diagnostic steps:</strong>
        </p>
        <ol style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 24, paddingLeft: 20 }}>
          <li>Verify the endpoint URL is exactly <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>https://mcp.opticontext.dev/mcp</code> — no trailing slash, no path variation.</li>
          <li>Check the transport is set to <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>streamable-http</code>. HTTP+SSE runtimes should use the <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/sse</code> endpoint instead.</li>
          <li>Confirm the <CodeCell>Authorization</CodeCell> header is present in the runtime config.</li>
        </ol>

        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          <strong>Runtime-specific config paths:</strong>
        </p>
        <DataTable
          headers={['Runtime', 'Config file path']}
          rows={[
            ['Claude Code', <span><CodeCell color="var(--code-text)">~/.claude/claude_code_config.json</CodeCell> or <CodeCell color="var(--code-text)">.claude/claude_code_config.json</CodeCell></span>],
            ['Cursor', <span><CodeCell color="var(--code-text)">.cursor/mcp.json</CodeCell> or <CodeCell color="var(--code-text)">~/.cursor/mcp.json</CodeCell></span>],
            ['Windsurf', <CodeCell color="var(--code-text)">.windsurf/mcp.json</CodeCell>],
            ['OpenCode', <span><CodeCell color="var(--code-text)">~/.opencode/config.json</CodeCell> (MCP block)</span>],
            ['Custom runtime', 'See your runtime\'s MCP documentation'],
          ]}
        />

        <SubHeading>Runtime connects but tools/list returns empty</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          <strong>What happened:</strong> The MCP handshake completed but no tools are returned.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          <strong>Possible causes:</strong>
        </p>
        <ul style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 12, paddingLeft: 20 }}>
          <li>The <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>initialize</code> request was sent with a <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>protocolVersion</code> that does not match <CodeCell>2025-11-25</CodeCell>. OptiContext responds with <CodeCell>2025-11-25</CodeCell> regardless, but some runtimes reject the mismatch before calling <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>tools/list</code>.</li>
          <li>The agent key was issued with all capabilities disabled. The <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>tools/list</code> response reflects only capabilities the key is permitted to use.</li>
        </ul>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          <strong>Resolution:</strong> Check the <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>initialize</code> request your runtime sends. The <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>protocolVersion</code> in the <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>initialize</code> params should be <CodeCell>"2025-11-25"</CodeCell>. Verify the agent key has at least one capability enabled in <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/dashboard/settings</code>.
        </p>

        <SubHeading>Runtime uses HTTP+SSE transport (older spec)</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          OptiContext supports both transport versions:
        </p>
        <DataTable
          headers={['Transport', 'Endpoint', 'MCP spec version']}
          rows={[
            ['Streamable HTTP (current)', <CodeCell color="var(--code-text)">POST https://mcp.opticontext.dev/mcp</CodeCell>, 'MCP 2025-11-25'],
            ['HTTP+SSE (legacy)', <CodeCell color="var(--code-text)">GET https://mcp.opticontext.dev/sse</CodeCell>, 'MCP 2025-03-26'],
          ]}
        />
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          Runtimes using HTTP+SSE should point to the <CodeCell>/sse</CodeCell> endpoint. All capabilities are available on both transports. If your runtime only supports the older spec, no capability degradation applies — OptiContext maintains both endpoints.
        </p>

        <SubHeading>JSON-RPC parse error — -32700</SubHeading>
        <ErrorBlock
          what="The request body could not be parsed as valid JSON."
          why="The JSON payload is malformed. Common causes: unescaped special characters in string values, trailing commas in JSON objects, or incorrect Content-Type header."
          resolution={
            <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
              <li>Ensure <CodeCell>Content-Type: application/json</CodeCell> is present in the request headers.</li>
              <li>Validate the JSON body before sending. Online validators or <CodeCell>jq</CodeCell> can identify syntax errors.</li>
              <li>All string values must use double quotes. Single-quoted strings are not valid JSON.</li>
            </ul>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32700,
    "message": "PARSE_ERROR — Request body is not valid JSON. Verify Content-Type: application/json and validate the request body."
  },
  "id": null
}`}
          codeLabel="PARSE_ERROR"
          separator
        />

        <SubHeading>Invalid method — -32601</SubHeading>
        <ErrorBlock
          what="The method field in the JSON-RPC request does not correspond to a supported MCP method."
          why="The runtime sent a method name that OptiContext does not implement. Valid methods are: initialize, tools/list, tools/call."
          resolution={
            <span>
              Verify the <CodeCell>method</CodeCell> field in the request body. Check for typos or capitalization issues.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32601,
    "message": "METHOD_NOT_FOUND — \"tool/call\" is not a supported method. Valid methods: initialize, tools/list, tools/call."
  },
  "id": 1
}`}
          codeLabel="METHOD_NOT_FOUND"
          separator
        />

        <SubHeading>Invalid params — -32602</SubHeading>
        <ErrorBlock
          what="The params field is structurally valid JSON but contains missing required fields or incorrect types."
          why="A required parameter is absent (e.g. query for opticontext_search), a parameter value is the wrong type (e.g. an integer where a string is required), or a parameter value is outside the valid range."
          resolution={
            <span>
              Check the input schema for the capability in the capability documentation at <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/docs/tools/[capability]</code>. Every required parameter must be present. Types must match exactly.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "INVALID_PARAMS — opticontext_search requires a query parameter (string). Received: undefined."
  },
  "id": 1
}`}
          codeLabel="INVALID_PARAMS"
        />

        {/* ============================================================ */}
        {/* CONNECTIVITY TROUBLESHOOTING */}
        {/* ============================================================ */}
        <SectionHeading id="connectivity">Connectivity Troubleshooting</SectionHeading>

        <SubHeading>Health check</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          Before diagnosing request failures, verify the OptiContext edge server is reachable:
        </p>
        <div style={{ marginBottom: 12 }}>
          <CodeBlock code="curl https://mcp.opticontext.dev/health" label="bash" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          Expected response:
        </p>
        <div style={{ marginBottom: 24 }}>
          <CodeBlock code={`{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-05-22T14:23:11Z"
}`} label="/health response" />
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          <CodeCell>/health</CodeCell> requires no authentication. If this request fails, the failure is at the network or edge layer — not at the capability or auth layer. Check for DNS resolution failures, firewall rules blocking <CodeCell>mcp.opticontext.dev</CodeCell>, or local network restrictions.
        </p>

        <SubHeading>INTERNAL_ERROR — -32603</SubHeading>
        <ErrorBlock
          what="An unexpected error occurred on the OptiContext edge server during capability execution."
          why="An unhandled exception at the server layer — not at the provider layer. This is the OptiContext equivalent of a 500 error, carried in the JSON-RPC error body."
          resolution={
            <span>
              Retry with exponential backoff: 1s → 2s → 4s, maximum 3 attempts.
              If the error persists across all retries, the issue may be a provider-side outage. Check the dashboard status chip and the <CodeCell>/health</CodeCell> endpoint.
            </span>
          }
          code={`{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "INTERNAL_ERROR — An unexpected error occurred. Retry with exponential backoff. If the error persists, check /health."
  },
  "id": 1
}`}
          codeLabel="INTERNAL_ERROR"
          separator
        />

        <SubHeading>HTTP 503 — SERVICE_UNAVAILABLE</SubHeading>
        <ErrorBlock
          what="The HTTP response is 503 — a transport-layer failure before the JSON-RPC body is reached."
          why="A downstream provider is temporarily unreachable and OptiContext could not construct a valid JSON-RPC error response."
          resolution={
            <span>
              Retry after 30 seconds. The budget guard may have already rerouted subsequent requests to an alternative provider. HTTP 503 errors are transport-layer — they are distinct from JSON-RPC errors, which always return HTTP 200.
            </span>
          }
          separator
        />

        <SubHeading>High latency on first request (cold path)</SubHeading>
        <ErrorBlock
          what="The first request after a period of inactivity has higher latency than typical."
          why="Edge nodes use V8 isolates, not containers — cold start times are under 5ms. Elevated latency on a first request is almost always from a downstream provider: the primary search provider's initial response, the analysis service's first inference, or the speech synthesis service's first synthesis are the usual contributors, not the edge itself."
          resolution={
            <span>
              No configuration change needed. Subsequent requests within the same session will be faster due to in-memory state and KV caching. If consistent high latency is observed across many requests, the issue is at the provider level — check the status page for each capability or use <CodeCell>mode: "fast"</CodeCell> for IntelliSearch to route through the fallback search provider directly.
            </span>
          }
        />

        {/* ============================================================ */}
        {/* RETRY GUIDANCE */}
        {/* ============================================================ */}
        <SectionHeading id="retry">Retry Guidance</SectionHeading>

        <SubHeading>Retry decision matrix</SubHeading>
        <DataTable
          headers={['Error code', 'Name', 'Retry?', 'Strategy']}
          rows={[
            [<CodeCell color="var(--code-text)">-32001</CodeCell>, <CodeCell>UNAUTHORIZED</CodeCell>, 'No', 'Fix the credential before retrying.'],
            [<CodeCell color="var(--code-text)">-32001</CodeCell>, <CodeCell>KEY_NOT_FOUND</CodeCell>, 'No', 'Verify or recreate the key before retrying.'],
            [<CodeCell color="var(--code-text)">-32001</CodeCell>, <CodeCell>KEY_REVOKED</CodeCell>, 'No', 'Create a new key. The revoked key will never succeed.'],
            [<CodeCell color="var(--code-text)">-32003</CodeCell>, <CodeCell>FORBIDDEN</CodeCell>, 'No', 'Fix the key permissions before retrying.'],
            [<CodeCell color="var(--code-text)">-32029</CodeCell>, <CodeCell>RATE_LIMITED</CodeCell>, 'After reset', 'Wait for the reset time stated in the error. Do not retry before then.'],
            [<CodeCell color="var(--code-text)">-32030</CodeCell>, <CodeCell>DAILY_CAP_REACHED</CodeCell>, 'After 00:00 UTC', 'Do not retry until the daily cap resets.'],
            [<CodeCell color="var(--code-text)">-32040</CodeCell>, <CodeCell>PROVIDER_UNAVAILABLE</CodeCell>, 'Yes', 'Retry with mode: "fast" to route through the fallback search provider.'],
            [<CodeCell color="var(--code-text)">-32041</CodeCell>, <CodeCell>BUDGET_GUARD_ACTIVE</CodeCell>, 'No retry needed', 'The request already succeeded. Handle as a warning.'],
            [<CodeCell color="var(--code-text)">-32050</CodeCell>, <CodeCell>QUERY_TOO_LONG</CodeCell>, 'After fix', 'Shorten the query, then retry.'],
            [<CodeCell color="var(--code-text)">-32060</CodeCell>, <CodeCell>TEXT_TOO_LONG</CodeCell>, 'After fix', 'Split the text, then retry each chunk.'],
            [<CodeCell color="var(--code-text)">-32061</CodeCell>, <CodeCell>INVALID_VOICE_ID</CodeCell>, 'After fix', 'Correct the voice ID, then retry.'],
            [<CodeCell color="var(--code-text)">-32062</CodeCell>, <CodeCell>SYNTHESIS_FAILED</CodeCell>, 'Yes (transient)', 'Exponential backoff.'],
            [<CodeCell color="var(--code-text)">-32063</CodeCell>, <CodeCell>STREAM_UNSUPPORTED</CodeCell>, 'After fix', 'Set stream: false, then retry.'],
            [<CodeCell color="var(--code-text)">-32070</CodeCell>, <CodeCell>FILE_NOT_FOUND</CodeCell>, 'After fix', 'Re-upload the file, then retry.'],
            [<CodeCell color="var(--code-text)">-32071</CodeCell>, <CodeCell>UPLOAD_EXPIRED</CodeCell>, 'After fix', 'Re-upload, then retry immediately.'],
            [<CodeCell color="var(--code-text)">-32072</CodeCell>, <CodeCell>FILE_TOO_LARGE</CodeCell>, 'After fix', 'Split the file, then retry.'],
            [<CodeCell color="var(--code-text)">-32073</CodeCell>, <CodeCell>UNSUPPORTED_FILE_TYPE</CodeCell>, 'After fix', 'Convert the file format, then retry.'],
            [<CodeCell color="var(--code-text)">-32074</CodeCell>, <CodeCell>GEMINI_QUOTA_REACHED</CodeCell>, 'After reset', 'Wait for midnight PST. Use model: "flash" to avoid Pro quota.'],
            [<CodeCell color="var(--code-text)">-32075</CodeCell>, <CodeCell>ANALYSIS_FAILED</CodeCell>, 'Yes (transient)', 'Exponential backoff. Narrow the query.'],
            [<CodeCell color="var(--code-text)">-32080</CodeCell>, <CodeCell>NAMESPACE_NOT_FOUND</CodeCell>, 'After fix', 'Write to the namespace first.'],
            [<CodeCell color="var(--code-text)">-32081</CodeCell>, <CodeCell>EMBEDDING_FAILED</CodeCell>, 'Yes (transient)', 'Exponential backoff.'],
            [<CodeCell color="var(--code-text)">-32082</CodeCell>, <CodeCell>MEMORY_LIMIT_REACHED</CodeCell>, 'After 5 min', 'Wait for auto-summarization to complete.'],
            [<CodeCell color="var(--code-text)">-32603</CodeCell>, <CodeCell>INTERNAL_ERROR</CodeCell>, 'Yes (transient)', 'Exponential backoff.'],
            [<CodeCell color="var(--code-text)">-32700</CodeCell>, <CodeCell>PARSE_ERROR</CodeCell>, 'After fix', 'Validate the JSON body before retrying.'],
            [<CodeCell color="var(--code-text)">-32601</CodeCell>, <CodeCell>METHOD_NOT_FOUND</CodeCell>, 'After fix', 'Correct the method name before retrying.'],
            [<CodeCell color="var(--code-text)">-32602</CodeCell>, <CodeCell>INVALID_PARAMS</CodeCell>, 'After fix', 'Check the input schema and correct params before retrying.'],
          ]}
        />

        <SubHeading>Exponential backoff implementation</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          For errors marked as transient (<CodeCell>-32040</CodeCell>, <CodeCell>-32062</CodeCell>, <CodeCell>-32075</CodeCell>, <CodeCell>-32081</CodeCell>, <CodeCell>-32603</CodeCell>):
        </p>
        <FlowBlock>{`Attempt 1: immediate
Attempt 2: wait 1 second
Attempt 3: wait 2 seconds
Attempt 4: wait 4 seconds
Give up after attempt 4.`}</FlowBlock>

        <div style={{ marginBottom: 24 }}>
          <CodeBlock code={`async function callWithBackoff(
  callFn: () => Promise<Response>,
  maxAttempts = 4
): Promise<Response> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await callFn();
    const body = await response.json();

    if (!body.error) return body;

    const transient = [-32040, -32062, -32075, -32081, -32603];
    if (!transient.includes(body.error.code)) throw body.error;

    if (attempt < maxAttempts - 1) {
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error("Max retry attempts reached.");
}`} label="typescript" />
        </div>

        <SubHeading>Rate limit retry timing</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          For <CodeCell>-32029</CodeCell> (<CodeCell>RATE_LIMITED</CodeCell>), the <CodeCell>error.message</CodeCell> field includes the remaining seconds until reset:
        </p>
        <FlowBlock>{`RATE_LIMITED — 30 requests/minute reached. Resets in 43 seconds.`}</FlowBlock>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          Parse the seconds value from the message or wait the full 60 seconds as a conservative fallback. Do not use exponential backoff for rate limit errors — backing off further wastes more time. Wait the exact reset window.
        </p>

        {/* ============================================================ */}
        {/* RECOVERY FLOWS */}
        {/* ============================================================ */}
        <SectionHeading id="recovery">Recovery Flows</SectionHeading>

        <SubHeading>Compromised agent key</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          An agent key may be compromised if it appears in a public repository, is included in a shared file, or is observed making unexpected capability calls in the dashboard.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          <strong>Recovery steps:</strong>
        </p>
        <ol style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 24, paddingLeft: 20 }}>
          <li>Open <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>/dashboard/settings</code>.</li>
          <li>Identify the compromised key in the agent keys list.</li>
          <li>Click revoke. Confirm the inline confirmation prompt.</li>
          <li>Revocation propagates within 60 seconds globally.</li>
          <li>Create a new agent key.</li>
          <li>Update all runtimes using the compromised key with the new key value.</li>
          <li>Verify no unexpected activity appears in Recent Activity after the revoke.</li>
        </ol>

        <SubHeading>Primary search credits exhausted mid-month</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          The primary search provider issues 1,000 credits/month on the free tier. The budget guard switches IntelliSearch to the fallback provider at 800 credits, but if credits reach 1,000 before the month resets, <CodeCell>mode: "auto"</CodeCell> and <CodeCell>mode: "research"</CodeCell> will route exclusively through the fallback for the remainder of the month.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-warning)', marginBottom: 12, lineHeight: 1.6, padding: '8px 14px', background: 'var(--raised)', borderRadius: 4, borderLeft: '3px solid var(--warning)' }}>
          <strong>Impact:</strong> The fallback provider does not support <CodeCell>dork</CodeCell> parameters. Dorking calls sent with <CodeCell>mode: "research"</CodeCell> after credits are exhausted will receive results without the dork operators applied.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          <strong>Recovery steps:</strong>
        </p>
        <ol style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 24, paddingLeft: 20 }}>
          <li>Switch to <CodeCell>mode: "fast"</CodeCell> explicitly to acknowledge fallback routing.</li>
          <li>Monitor the primary search credits counter in the IntelliSearch block on the dashboard.</li>
          <li>Credits reset on the calendar month boundary (not a rolling 30 days).</li>
        </ol>

        <SubHeading>Large-context model quota near exhaustion (50 req/day)</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          The large-context model has a strict 50 req/day limit. The budget guard blocks new requests at 40/day.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          <strong>Recovery steps:</strong>
        </p>
        <ol style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 24, paddingLeft: 20 }}>
          <li>Set <CodeCell>"model": "flash"</CodeCell> explicitly on all <CodeCell>opticontext_analyze</CodeCell> calls for the remainder of the day.</li>
          <li>Use the fast model for files under 500K tokens — it handles the majority of production DeepDoc use cases.</li>
          <li>Large-context model quota resets at midnight.</li>
        </ol>

        <SubHeading>MemoryCore approaching storage limit</SubHeading>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          Auto-summarization triggers at 8,000 chunks and runs asynchronously. If the chunk count grows faster than auto-summarization can reduce it, the 10,000-chunk hard limit may be approached.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          <strong>Recovery steps:</strong>
        </p>
        <ol style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 24, paddingLeft: 20 }}>
          <li>Monitor the MemoryCore block on the dashboard — the chunk counter and "auto-summarization active" indicator are displayed there.</li>
          <li>If write failures begin (<CodeCell>-32082</CodeCell>), wait 5 minutes for the auto-summarization cycle to complete.</li>
          <li>If the limit is consistently hit, consider splitting memory usage across multiple agent keys with different namespaces, or compressing old memories externally before writing.</li>
        </ol>

        {/* ============================================================ */}
        {/* FULL ERROR CODE INDEX */}
        {/* ============================================================ */}
        <SectionHeading id="error-index">Full Error Code Index</SectionHeading>

        <DataTable
          headers={['Code', 'Name', 'Category', 'Retryable']}
          rows={[
            [<CodeCell color="var(--code-text)">-32001</CodeCell>, <CodeCell>UNAUTHORIZED</CodeCell>, 'Authentication', 'No'],
            [<CodeCell color="var(--code-text)">-32001</CodeCell>, <CodeCell>KEY_NOT_FOUND</CodeCell>, 'Authentication', 'No'],
            [<CodeCell color="var(--code-text)">-32001</CodeCell>, <CodeCell>KEY_REVOKED</CodeCell>, 'Authentication', 'No'],
            [<CodeCell color="var(--code-text)">-32003</CodeCell>, <CodeCell>FORBIDDEN</CodeCell>, 'Authentication', 'No'],
            [<CodeCell color="var(--code-text)">-32029</CodeCell>, <CodeCell>RATE_LIMITED</CodeCell>, 'Rate limits', 'After reset'],
            [<CodeCell color="var(--code-text)">-32030</CodeCell>, <CodeCell>DAILY_CAP_REACHED</CodeCell>, 'Rate limits', 'After 00:00 UTC'],
            [<CodeCell color="var(--code-text)">-32040</CodeCell>, <CodeCell>PROVIDER_UNAVAILABLE</CodeCell>, 'IntelliSearch', 'Yes'],
            [<CodeCell color="var(--code-text)">-32041</CodeCell>, <CodeCell>BUDGET_GUARD_ACTIVE</CodeCell>, 'IntelliSearch', 'Informational'],
            [<CodeCell color="var(--code-text)">-32050</CodeCell>, <CodeCell>QUERY_TOO_LONG</CodeCell>, 'IntelliSearch', 'After fix'],
            [<CodeCell color="var(--code-text)">-32060</CodeCell>, <CodeCell>TEXT_TOO_LONG</CodeCell>, 'VoiceBridge', 'After fix'],
            [<CodeCell color="var(--code-text)">-32061</CodeCell>, <CodeCell>INVALID_VOICE_ID</CodeCell>, 'VoiceBridge', 'After fix'],
            [<CodeCell color="var(--code-text)">-32062</CodeCell>, <CodeCell>SYNTHESIS_FAILED</CodeCell>, 'VoiceBridge', 'Yes (transient)'],
            [<CodeCell color="var(--code-text)">-32063</CodeCell>, <CodeCell>STREAM_UNSUPPORTED</CodeCell>, 'VoiceBridge', 'After fix'],
            [<CodeCell color="var(--code-text)">-32070</CodeCell>, <CodeCell>FILE_NOT_FOUND</CodeCell>, 'DeepDoc', 'After fix'],
            [<CodeCell color="var(--code-text)">-32071</CodeCell>, <CodeCell>UPLOAD_EXPIRED</CodeCell>, 'DeepDoc', 'After fix'],
            [<CodeCell color="var(--code-text)">-32072</CodeCell>, <CodeCell>FILE_TOO_LARGE</CodeCell>, 'DeepDoc', 'After fix'],
            [<CodeCell color="var(--code-text)">-32073</CodeCell>, <CodeCell>UNSUPPORTED_FILE_TYPE</CodeCell>, 'DeepDoc', 'After fix'],
            [<CodeCell color="var(--code-text)">-32074</CodeCell>, <CodeCell>ANALYSIS_QUOTA_REACHED</CodeCell>, 'DeepDoc', 'After midnight'],
            [<CodeCell color="var(--code-text)">-32075</CodeCell>, <CodeCell>ANALYSIS_FAILED</CodeCell>, 'DeepDoc', 'Yes (transient)'],
            [<CodeCell color="var(--code-text)">-32080</CodeCell>, <CodeCell>NAMESPACE_NOT_FOUND</CodeCell>, 'MemoryCore', 'After fix'],
            [<CodeCell color="var(--code-text)">-32081</CodeCell>, <CodeCell>EMBEDDING_FAILED</CodeCell>, 'MemoryCore', 'Yes (transient)'],
            [<CodeCell color="var(--code-text)">-32082</CodeCell>, <CodeCell>MEMORY_LIMIT_REACHED</CodeCell>, 'MemoryCore', 'After summarization'],
            [<CodeCell color="var(--code-text)">-32603</CodeCell>, <CodeCell>INTERNAL_ERROR</CodeCell>, 'Server', 'Yes (transient)'],
            [<CodeCell color="var(--code-text)">-32700</CodeCell>, <CodeCell>PARSE_ERROR</CodeCell>, 'Protocol', 'After fix'],
            [<CodeCell color="var(--code-text)">-32601</CodeCell>, <CodeCell>METHOD_NOT_FOUND</CodeCell>, 'Protocol', 'After fix'],
            [<CodeCell color="var(--code-text)">-32602</CodeCell>, <CodeCell>INVALID_PARAMS</CodeCell>, 'Protocol', 'After fix'],
          ]}
        />

      </div>
    </div>
  );
}
