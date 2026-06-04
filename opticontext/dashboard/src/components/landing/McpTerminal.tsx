import React, { useState } from 'react';

interface ToolDef {
  name: string;
  description: string;
  config: object;
  badge?: string;
}

const TOOLS: ToolDef[] = [
  {
    name: "opticontext_search",
    description: "Web search with 4 modes (auto/research/fast/scrape), AI summarization, Google dork support, and multi-provider fallback.",
    badge: "Web Search",
    config: {
      name: "opticontext_search",
      arguments: {
        query: "natural language search query",
        mode: "auto",
        max_results: 5,
        summarize: true,
        dork: {
          site_filter: "github.com",
          file_type: "pdf",
          date_after: "2025-01-01",
          date_before: "2025-06-01",
          exclude_terms: ["sponsored", "ad"],
          include_phrases: ["security advisory"],
          search_in: "url"
        }
      }
    }
  },
  {
    name: "opticontext_tts",
    description: "Text-to-speech via Unreal Speech — 48 voices, 5 audio formats, 4 platform optimizations, streaming support. Auto-chunks text over 2,900 chars.",
    badge: "Voice Synthesis",
    config: {
      name: "opticontext_tts",
      arguments: {
        text: "string up to 30,000 chars",
        voice: "Scarlett",
        speed: 1.0,
        format: "mp3",
        platform: "raw",
        stream: false
      }
    }
  },
  {
    name: "opticontext_analyze",
    description: "Deep file analysis via Gemini 2M-token context window — 4 intake methods, 40+ formats, 3 output modes. One-shot or re-analyze with file_id.",
    badge: "File Analysis",
    config: {
      name: "opticontext_analyze",
      arguments: {
        query: "Your analysis question",
        file_url: "https://arxiv.org/pdf/2401.12345.pdf",
        mime_type: "application/pdf",
        model: "auto",
        output_format: "structured",
        save_to_memory: false,
        max_tokens: 4096
      }
    }
  },
  {
    name: "opticontext_memory_write",
    description: "Persistent vector memory — namespaced, importance-scored (1-10), auto-summmarized above 8K chars. Embedded via Gemini embedding-2 (768d).",
    badge: "Memory",
    config: {
      name: "opticontext_memory_write",
      arguments: {
        content: "Fact to remember across sessions",
        namespace: "general",
        importance: 5,
        source: "user"
      }
    }
  },
  {
    name: "opticontext_memory_search",
    description: "Semantic similarity search across stored memories — cosine similarity, AI rerank, namespace-scoped retrieval with configurable thresholds.",
    badge: "Memory",
    config: {
      name: "opticontext_memory_search",
      arguments: {
        query: "What were the user's preferences?",
        namespace: "general",
        top_k: 5,
        min_similarity: 0.5,
        rerank: false
      }
    }
  },
  {
    name: "opticontext_guide",
    description: "Self-orientation guide — returns a compact capability reference. Call first on connect to discover tools, constraints, and best practices.",
    badge: "Guide",
    config: {
      name: "opticontext_guide",
      arguments: {
        topic: "all"
      }
    }
  },
];

function ToolCard({ tool, defaultOpen }: { tool: ToolDef; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--code-text)',
          fontFamily: "'Switzer', Inter, system-ui, sans-serif",
          fontSize: '0.875rem',
          textAlign: 'left',
          transition: 'background 150ms',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <code style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.8125rem',
            color: 'var(--code-accent)',
            whiteSpace: 'nowrap',
          }}>
            {tool.name}
          </code>
          {tool.badge && (
            <span style={{
              fontFamily: "'Switzer', Inter, system-ui, sans-serif",
              fontSize: '0.625rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'rgba(94, 201, 154, 0.7)',
              background: 'rgba(94, 201, 154, 0.08)',
              padding: '2px 8px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
            }}>
              {tool.badge}
            </span>
          )}
        </div>
        <span style={{
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 200ms',
          opacity: 0.4,
          flexShrink: 0,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 20px 16px' }}>
          <p style={{
            fontFamily: "'Switzer', Inter, system-ui, sans-serif",
            fontSize: '0.8125rem',
            color: 'rgba(232, 228, 220, 0.65)',
            lineHeight: 1.5,
            margin: '0 0 12px',
          }}>
            {tool.description}
          </p>
          <pre style={{
            margin: 0,
            padding: '12px 16px',
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 6,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            lineHeight: 1.6,
            color: 'var(--code-text)',
            overflowX: 'auto',
            whiteSpace: 'pre',
          }}>
{JSON.stringify(tool.config, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export function McpTerminal() {
  return (
    <div style={{
      width: '100%',
      maxWidth: 680,
      background: 'var(--code-surface)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      overflow: 'hidden',
      fontFamily: "'Switzer', Inter, system-ui, sans-serif",
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: 'var(--code-accent)' }}>
            MCP Tools
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#34D399',
          }} />
          <span style={{
            fontSize: '0.65rem',
            color: 'rgba(232, 228, 220, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            6 tools
          </span>
        </div>
      </div>

      <div>
        {TOOLS.map((tool, i) => (
          <ToolCard key={tool.name} tool={tool} defaultOpen={i === 0} />
        ))}
      </div>

      <div style={{
        padding: '10px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.1)',
        fontFamily: "'Switzer', Inter, system-ui, sans-serif",
        fontSize: '0.6875rem',
        color: 'rgba(232, 228, 220, 0.45)',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 4,
      }}>
        <span>Endpoint: /mcp · Streamable HTTP</span>
        <span>Protocol: JSON-RPC 2.0 · MCP 2025-11-25</span>
      </div>
    </div>
  );
}
