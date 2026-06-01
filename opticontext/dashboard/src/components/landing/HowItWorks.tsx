import React, { useState } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const STEPS = [
  { number: '01', title: 'Create an account', text: 'Sign in with Google. No form. No card. Under 10 seconds.' },
  { number: '02', title: 'Get your agent key', text: 'Generate an agent key from the dashboard. Each key is scoped to one runtime.' },
  { number: '03', title: 'Add to your runtime config', text: 'One configuration block in your MCP config file points to the OptiContext endpoint.' },
  { number: '04', title: 'Call the endpoint', text: 'Your agent calls POST https://mcp.opticontext.dev/mcp using JSON-RPC 2.0.' },
  { number: '05', title: 'Get results at the edge', text: 'OptiContext resolves the capability call from Cloudflare\'s global network and returns structured output.' },
];

export function HowItWorks() {
  const { ref, revealed } = useScrollReveal();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`{
  "mcpServers": {
    "opticontext": {
      "url": "https://mcp.opticontext.dev/mcp",
      "transport": "streamable-http",
      "headers": {
        "Authorization": "Bearer YOUR_AGENT_KEY"
      }
    }
  }
}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section
      ref={ref}
      style={{
        padding: '96px 0',
        background: 'var(--raised)',
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
      }}
      aria-label="How it works"
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '0 clamp(1.5rem, 5vw, 6rem)',
        }}
      >
        <h2
          style={{
            fontFamily: "'Zodiak', Georgia, serif",
            fontWeight: 400,
            fontSize: '2.25rem',
            color: 'var(--text-primary)',
            textAlign: 'center',
            marginBottom: 64,
          }}
        >
          How it works
        </h2>

        <div
          className="how-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 24,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 'calc(10% + 20px)',
              right: 'calc(10% + 20px)',
              height: 1,
              borderTop: '1px solid var(--border)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
            className="max-lg:hidden"
          />

          {STEPS.map((s, i) => (
            <div
              key={s.number}
              style={{
                position: 'relative',
                zIndex: 1,
                textAlign: 'center',
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0)' : 'translateY(8px)',
                transition: `opacity 400ms ease ${Math.min(i, 5) * 60}ms, transform 400ms ease ${Math.min(i, 5) * 60}ms`,
              }}
            >
              <p
                style={{
                  fontFamily: "'Switzer', Inter, system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: 12,
                }}
              >
                {s.number}
              </p>
              <h3
                style={{
                  fontFamily: "'Zodiak', Georgia, serif",
                  fontWeight: 400,
                  fontSize: '1.375rem',
                  color: 'var(--text-primary)',
                  marginBottom: 8,
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontFamily: "'Switzer', Inter, system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: '0 auto',
                  maxWidth: 200,
                }}
              >
                {s.text}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 64,
            display: 'flex',
            justifyContent: 'center',
            opacity: revealed ? 1 : 0,
            transition: 'opacity 400ms ease 400ms',
          }}
        >
          <div className="code-block" style={{ maxWidth: 480, position: 'relative' }}>
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
                onClick={handleCopy}
                aria-label="Copy config"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre style={{ margin: 0, overflow: 'auto', textAlign: 'left' }}>
              <code>
                <span style={{ color: 'var(--code-muted)' }}>{'{'}</span>{'\n'}
                <span style={{ color: 'var(--code-muted)' }}>{'  "mcpServers": {'}</span>{'\n'}
                <span style={{ color: 'var(--code-muted)' }}>{'    "opticontext": {'}</span>{'\n'}
                <span style={{ color: 'var(--code-accent)' }}>{'      "url"'}</span>
                <span style={{ color: 'var(--code-text)' }}>{': '}</span>
                <span style={{ color: 'var(--code-string)' }}>{'"https://mcp.opticontext.dev/mcp"'}</span>
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
        </div>
      </div>
    </section>
  );
}
