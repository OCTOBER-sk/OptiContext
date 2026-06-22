import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { EMPTY_STATES, LOADING, BUTTONS, CONFIRMATIONS } from '../../lib/microcopy';

const DOC_SECTIONS = [
  {
    title: 'Authentication',
    desc: 'How OptiContext issues and validates agent keys. Agent key format, the KV-based auth fast path, dashboard authentication, per-agent permission scopes, and key lifecycle management.',
    link: '/docs/api-reference#authentication',
  },
  {
    title: 'Transport',
    desc: 'Streamable HTTP transport over a single /mcp endpoint. How POST and GET requests behave, session handling via Mcp-Session-Id, streaming upgrades for long responses, and backward compatibility with HTTP+SSE.',
    link: '/docs/api-reference#transport',
  },
  {
    title: 'IntelliSearch',
    desc: 'Web search with AI-enhanced dorking, multi-provider routing, and summarization. Covers the opticontext_search capability schema, search modes, dorking parameters, provider fallback order, result structure, and usage limits.',
    link: '/docs/tools/intellisearch',
  },
  {
    title: 'VoiceBridge',
    desc: 'TTS streaming across 48 voices and 8 languages. Covers the opticontext_tts capability schema, voice IDs, audio formats, platform delivery patterns for Telegram, Discord, and WhatsApp, and TTS cache behavior.',
    link: '/docs/tools/voicebridge',
  },
  {
    title: 'DeepDoc',
    desc: 'File analysis with a 2M token context window. Covers the opticontext_analyze capability schema, the pre-upload flow via POST /upload, supported file types, model routing logic, and the structured analysis output schema.',
    link: '/docs/tools/deepdoc',
  },
  {
    title: 'MemoryCore',
    desc: 'Persistent RAG memory with semantic search. Covers the opticontext_memory_write and opticontext_memory_search capability schemas, the namespace system, similarity search parameters, and auto-summarization behavior.',
    link: '/docs/tools/memorycore',
  },
  {
    title: 'API Reference',
    desc: 'Complete endpoint contract. Every route, every request field, every response field. Includes /mcp, /upload, /health, /usage, and admin endpoints. Error codes, rate limit headers, and JSON-RPC 2.0 message structure.',
    link: '/docs/api-reference',
  },
  {
    title: 'Limits',
    desc: 'Per-capability rate limits, daily and monthly caps, budget guard thresholds, and provider-level constraints. Includes reset schedules and fallback behavior when any limit is approached.',
    link: '/docs/api-reference#limits',
  },
];

const CAPABILITY_TABLE = [
  { capability: 'IntelliSearch', toolName: 'opticontext_search', returns: 'Search summary, sources, key findings' },
  { capability: 'VoiceBridge', toolName: 'opticontext_tts', returns: 'Audio URL or streaming chunks' },
  { capability: 'DeepDoc', toolName: 'opticontext_analyze', returns: 'Structured file analysis, file_id' },
  { capability: 'MemoryCore (write)', toolName: 'opticontext_memory_write', returns: 'memory_id, chunks_stored' },
  { capability: 'MemoryCore (read)', toolName: 'opticontext_memory_search', returns: 'Ranked memory entries, context block' },
];

function useCopy() {
  const [state, setState] = useState<'idle' | 'success'>('idle');
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setState('success');
    setTimeout(() => setState('idle'), 1500);
  };
  return { copy, state };
}

const CONFIG_JSON = JSON.stringify({
  mcpServers: {
    opticontext: {
      url: 'https://opticontext.opticontext.workers.dev/mcp',
      transport: 'streamable-http',
      headers: { Authorization: 'Bearer YOUR_AGENT_KEY' },
    },
  },
}, null, 2);

const INIT_JSON = JSON.stringify({
  jsonrpc: '2.0',
  result: {
    protocolVersion: '2025-11-25',
    serverInfo: {
      name: 'OptiContext',
      version: '1.0.0',
      description: 'Edge-native MCP context infrastructure',
    },
    capabilities: { tools: {}, logging: {} },
  },
  id: 1,
}, null, 2);

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
};

export default function DocsHome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const { copy: copyConfig, state: configState } = useCopy();
  const { copy: copyInit, state: initState } = useCopy();
  const { ref: orientationRef, revealed: orientationRevealed } = useScrollReveal();
  const { ref: sectionsRef, revealed: sectionsRevealed } = useScrollReveal();
  const { ref: tableRef, revealed: tableRevealed } = useScrollReveal();
  const { ref: handshakeRef, revealed: handshakeRevealed } = useScrollReveal();

  const filteredSections = searchQuery.length >= 2
    ? DOC_SECTIONS.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : DOC_SECTIONS;

  return (
    <div>
      {/* ── Page Header ── */}
      <motion.div {...fadeUp}>
        <p className="breadcrumb" style={{ marginBottom: 8 }}>Documentation</p>
        <h1 className="page-h1" style={{ marginBottom: 8, fontSize: 'clamp(1.75rem, 4vw, 2.25rem)' }}>
          OptiContext Documentation
        </h1>
        <p className="page-desc">
          A production MCP server. One endpoint, four capabilities, one agent key.
        </p>
      </motion.div>

      {/* ── Search Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number], delay: 0.05 }}
        style={{ position: 'relative', marginBottom: 12 }}
      >
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Search documentation..."
          className="input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{ padding: '12px 16px 12px 42px', background: 'var(--raised)' }}
          aria-label="Search documentation"
        />
        <span
          style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: "'Switzer', sans-serif",
            fontWeight: 400,
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            padding: '2px 6px',
            border: '1px solid var(--border)',
            borderRadius: 4,
            display: searchFocused ? 'none' : 'block',
          }}
        >
          ⌘K
        </span>
        {searchFocused && searchQuery.length === 1 && (
          <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
            {EMPTY_STATES.searchTooShort}
          </p>
        )}
        {searchFocused && searchQuery.length >= 2 && (
          <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', margin: '6px 0 0' }}>
            {LOADING.searching}
          </p>
        )}
      </motion.div>
      {searchQuery.length < 2 && <div style={{ marginBottom: 28 }} />}

      {/* ── Start Here Block ── */}
      <div style={{ marginBottom: 48 }}>
        <p className="section-label" style={{ marginBottom: 16 }}>Start here</p>

        <div
          className="docs-start-link"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/docs/quickstart')}
        >
          <div>
            <h3
              style={{
                fontFamily: "'Zodiak', Georgia, serif",
                fontWeight: 400,
                fontSize: '1.375rem',
                color: 'var(--text-primary)',
                margin: '0 0 4px',
              }}
            >
              Quickstart guide
            </h3>
            <p
              style={{
                fontFamily: "'Switzer', sans-serif",
                fontWeight: 400,
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              Go from zero to first capability call in under 5 minutes.
            </p>
          </div>
          <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '8px 16px' }}>
            {BUTTONS.primary.startQuickstart} {'\u2192'}
          </button>
        </div>

        <div style={{ height: 1, background: 'var(--border)' }} />

        <div
          className="docs-start-link"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/docs/api-reference')}
        >
          <div>
            <h3
              style={{
                fontFamily: "'Zodiak', Georgia, serif",
                fontWeight: 400,
                fontSize: '1.375rem',
                color: 'var(--text-primary)',
                margin: '0 0 4px',
              }}
            >
              API reference
            </h3>
            <p
              style={{
                fontFamily: "'Switzer', sans-serif",
                fontWeight: 400,
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              Full endpoint contract, capability schemas, and error codes.
            </p>
          </div>
          <button className="btn btn-ghost" style={{ flexShrink: 0, padding: '8px 16px' }}>
            {BUTTONS.secondary.viewApiReference} {'\u2192'}
          </button>
        </div>
      </div>

      {/* ── Section Index ── */}
      <div ref={sectionsRef} style={{
        marginBottom: 64,
        opacity: sectionsRevealed ? 1 : 0,
        transform: sectionsRevealed ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
      }}>
        <p className="section-label" style={{ marginBottom: 16 }}>Documentation</p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {searchQuery.length >= 2 && filteredSections.length === 0 ? (
            <p style={{ fontFamily: "'Switzer', sans-serif", fontSize: '1rem', color: 'var(--text-muted)', padding: '24px 0' }}>
              {EMPTY_STATES.noDocsResults}
            </p>
          ) : (
            filteredSections.map((section, i) => (
              <div
                key={section.title}
                style={{
                  borderBottom: i < filteredSections.length - 1 ? '1px solid var(--border)' : 'none',
                  opacity: sectionsRevealed ? 1 : 0,
                  transform: sectionsRevealed ? 'translateY(0)' : 'translateY(8px)',
                  transition: `opacity 400ms ease ${Math.min(i, 5) * 60}ms, transform 400ms ease ${Math.min(i, 5) * 60}ms`,
                }}
              >
                <div
                  style={{ padding: '20px 0', cursor: 'pointer' }}
                  onClick={() => navigate(section.link)}
                >
                  <h3
                    style={{
                      fontFamily: "'Zodiak', Georgia, serif",
                      fontWeight: 400,
                      fontSize: '1.375rem',
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                    }}
                  >
                    {section.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Switzer', sans-serif",
                      fontWeight: 400,
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      margin: 0,
                    }}
                  >
                    {section.desc}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── What is OptiContext — Orientation Block ── */}
      <div ref={orientationRef} style={{
        marginTop: 16,
        opacity: orientationRevealed ? 1 : 0,
        transform: orientationRevealed ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
      }}>
        <h2
          style={{
            fontFamily: "'Zodiak', Georgia, serif",
            fontWeight: 400,
            fontSize: '1.75rem',
            color: 'var(--text-primary)',
            marginBottom: 24,
          }}
        >
          What is OptiContext
        </h2>

        <div
          style={{
            fontFamily: "'Switzer', sans-serif",
            fontWeight: 400,
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: 680,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <p style={{ margin: 0 }}>
            OptiContext is an MCP server deployed on a global edge network.
            It implements Streamable HTTP transport as defined in the Model Context Protocol specification
            and exposes four capabilities — IntelliSearch, VoiceBridge, DeepDoc, and MemoryCore —
            through a single endpoint at https://opticontext.opticontext.workers.dev/mcp.
          </p>

          <p style={{ margin: 0 }}>
            Any MCP-compatible runtime connects by adding one configuration block
            pointing to the OptiContext MCP endpoint. Authentication uses a Bearer token
            in the Authorization header — one agent key per runtime, issued from the dashboard.
            No SDK. No vendor-specific wrapper. Protocol-native.
          </p>

          <p style={{ margin: 0 }}>
            OptiContext is not a vendor-specific product. It does not require a specific runtime,
            a specific agent framework, or a specific AI provider. It is runtime-agnostic by design —
            the MCP specification is an open protocol, and any compliant runtime connects without modification.
          </p>

          <p style={{ margin: 0 }}>
            If this is your first time here: start with the Quickstart.
            If you are integrating a specific capability: go directly to that capability's reference page.
            If you need the full endpoint contract: see the API Reference.
          </p>
        </div>

        {/* Orientation Code Block */}
        <div style={{ marginTop: 32, maxWidth: 560 }}>
          <div className="code-block" style={{ position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.75rem',
                  color: 'var(--code-muted)',
                }}
              >
                mcp.config.json
              </span>
              <button
                className="copy-button"
                style={{ position: 'static', opacity: 1 }}
                onClick={() => copyConfig(CONFIG_JSON)}
                aria-label="Copy config"
              >
                {configState === 'success' ? CONFIRMATIONS.copied : 'Copy'}
              </button>
            </div>
            <pre style={{ margin: 0, overflow: 'auto' }}>
              <code>
                <span style={{ color: 'var(--code-muted)' }}>{'// Minimal runtime configuration — connects to all four capabilities'}</span>{'\n'}
                {'\n'}
                <span style={{ color: 'var(--code-muted)' }}>{'{'}</span>{'\n'}
                <span style={{ color: 'var(--code-muted)' }}>{'  "mcpServers": {'}</span>{'\n'}
                <span style={{ color: 'var(--code-muted)' }}>{'    "opticontext": {'}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'      "url"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': '}</span>
                <span style={{ color: 'var(--code-string)' }}>{'"https://opticontext.opticontext.workers.dev/mcp"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{','}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'      "transport"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': '}</span>
                <span style={{ color: 'var(--code-string)' }}>{'"streamable-http"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{','}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'      "headers"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': {'}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'        "Authorization"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': '}</span>
                <span style={{ color: 'var(--code-string)' }}>{'"Bearer YOUR_AGENT_KEY"'}</span>{'\n'}
                <span style={{ color: 'var(--code-text)' }}>{'      }'}</span>{'\n'}
                <span style={{ color: 'var(--code-muted)' }}>{'    }'}</span>{'\n'}
                <span style={{ color: 'var(--code-muted)' }}>{'  }'}</span>{'\n'}
                <span style={{ color: 'var(--code-muted)' }}>{'}'}</span>
              </code>
            </pre>
          </div>
          <p
            style={{
              fontFamily: "'Switzer', sans-serif",
              fontWeight: 400,
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              marginTop: 8,
            }}
          >
            Replace YOUR_AGENT_KEY with the key generated from your dashboard.
            The endpoint and transport field do not change.
          </p>
        </div>

        {/* ── Capability Summary Table ── */}
        <div ref={tableRef} style={{
          marginTop: 40,
          opacity: tableRevealed ? 1 : 0,
          transform: tableRevealed ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 400ms ease, transform 400ms ease',
        }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Capability</th>
                <th>MCP Tool Name</th>
                <th>What it returns</th>
              </tr>
            </thead>
            <tbody>
              {CAPABILITY_TABLE.map((row) => (
                <tr key={row.capability}>
                  <td>{row.capability}</td>
                  <td>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.8125rem',
                      color: 'var(--text-primary)',
                    }}>
                      {row.toolName}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{row.returns}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── MCP Handshake Reference ── */}
        <div ref={handshakeRef} style={{
          marginTop: 40,
          opacity: handshakeRevealed ? 1 : 0,
          transform: handshakeRevealed ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 400ms ease, transform 400ms ease',
        }}>
          <h3
            style={{
              fontFamily: "'Zodiak', Georgia, serif",
              fontWeight: 400,
              fontSize: '1.375rem',
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            The MCP handshake
          </h3>
          <p
            style={{
              fontFamily: "'Switzer', sans-serif",
              fontWeight: 400,
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: 16,
            }}
          >
            When your runtime first connects, it sends an initialize request.
            OptiContext responds with its server identity, protocol version, and declared capabilities.
          </p>

          <div className="code-block" style={{ position: 'relative', maxWidth: 560 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.75rem',
                  color: 'var(--code-muted)',
                }}
              >
                initialize response
              </span>
              <button
                className="copy-button"
                style={{ position: 'static', opacity: 1 }}
                onClick={() => copyInit(INIT_JSON)}
                aria-label="Copy initialize response"
              >
                {initState === 'success' ? CONFIRMATIONS.copied : 'Copy'}
              </button>
            </div>
            <pre style={{ margin: 0, overflow: 'auto' }}>
              <code>
                <span style={{ color: 'var(--code-muted)' }}>{'// initialize response from OptiContext'}</span>{'\n'}
                {'\n'}
                <span style={{ color: 'var(--code-muted)' }}>{'{'}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'  "jsonrpc"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': '}</span>
                <span style={{ color: 'var(--code-string)' }}>{'"2.0"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{','}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'  "result"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': {'}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'    "protocolVersion"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': '}</span>
                <span style={{ color: 'var(--code-string)' }}>{'"2025-11-25"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{','}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'    "serverInfo"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': {'}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'      "name"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': '}</span>
                <span style={{ color: 'var(--code-string)' }}>{'"OptiContext"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{','}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'      "version"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': '}</span>
                <span style={{ color: 'var(--code-string)' }}>{'"1.0.0"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{','}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'      "description"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': '}</span>
                <span style={{ color: 'var(--code-string)' }}>{'"Edge-native MCP context infrastructure"'}</span>{'\n'}
                <span style={{ color: 'var(--code-text)' }}>{'    },'}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'    "capabilities"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': {'}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'      "tools"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': {},'}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'      "logging"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': {}'}</span>{'\n'}
                <span style={{ color: 'var(--code-text)' }}>{'    }'}</span>{'\n'}
                <span style={{ color: 'var(--code-text)' }}>{'  },'}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'  "id"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': '}</span>
                <span style={{ color: 'var(--code-string)' }}>{'1'}</span>{'\n'}
                <span style={{ color: 'var(--code-muted)' }}>{'}'}</span>
              </code>
            </pre>
          </div>

          <p
            style={{
              fontFamily: "'Switzer', sans-serif",
              fontWeight: 400,
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginTop: 12,
            }}
          >
            After the handshake, your runtime may call tools/list to enumerate
            available capabilities, then proceed with tools/call for each capability invocation.
          </p>
        </div>
      </div>
    </div>
  );
}
