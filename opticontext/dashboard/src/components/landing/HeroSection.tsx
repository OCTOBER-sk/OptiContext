import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, toAuthUser } from '../../lib/supabase';
import type { AuthUser } from '../../lib/supabase';
import { BUTTONS, CONFIRMATIONS } from '../../lib/microcopy';

export function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toAuthUser(session.user) : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 100) setScrolled(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-label="Hero"
    >
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsla(155, 40%, 92%, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          opacity: 0.5,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 1120,
          margin: '0 auto',
          padding: '0 clamp(1.5rem, 5vw, 6rem)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          className="hero-eyebrow"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 24,
            fontFamily: "'Switzer', Inter, system-ui, sans-serif",
            fontWeight: 500,
            fontSize: '0.8125rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--accent-text)',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
          Model Context Protocol Infrastructure
        </div>

        <h1
          className="hero-headline-line"
          style={{
            fontFamily: "'Zodiak', Georgia, serif",
            fontWeight: 400,
            fontSize: 'clamp(2.75rem, 7vw, 4rem)',
            lineHeight: 1.0,
            color: 'var(--text-primary)',
            maxWidth: 720,
            marginBottom: 24,
          }}
        >
          One key. Four capabilities.
          <br />
          One edge endpoint.
        </h1>

        <p
          className="hero-sub"
          style={{
            fontFamily: "'Switzer', Inter, system-ui, sans-serif",
            fontWeight: 400,
            fontSize: 'clamp(0.9375rem, 2.5vw, 1.125rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: 560,
            marginBottom: 32,
            padding: '0 clamp(0.5rem, 2vw, 0)',
          }}
        >
          OptiContext is a production MCP server deployed on a global edge network.
          Any MCP-compatible runtime connects without modification — and gains
          real-time web search, voice synthesis, file analysis, and persistent memory.
        </p>

        <div
          className="hero-cta"
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(user ? '/dashboard' : '/auth')}
          >
            Dashboard
          </button>
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => navigate('/docs')}
          >
            {BUTTONS.secondary.seeTheDocs}
          </button>
        </div>

        <div
          className="hero-trust"
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 24,
            fontFamily: "'Switzer', Inter, system-ui, sans-serif",
            fontWeight: 400,
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <span>Edge-deployed · 300+ PoPs</span>
          <span style={{ width: 1, height: 12, background: 'var(--border)' }} aria-hidden="true" />
          <span>Sub-5ms cold starts</span>
          <span style={{ width: 1, height: 12, background: 'var(--border)' }} aria-hidden="true" />
          <span>Zero infrastructure cost</span>
        </div>

        <div
          style={{
            marginTop: 48,
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <div className="code-block" style={{ maxWidth: 480, position: 'relative', textAlign: 'left' }}>
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
                onClick={() => {
                  navigator.clipboard.writeText(`{\n  "mcpServers": {\n    "opticontext": {\n      "url": "https://mcp.opticontext.dev/mcp",\n      "transport": "streamable-http",\n      "headers": {\n        "Authorization": "Bearer YOUR_AGENT_KEY"\n      }\n    }\n  }\n}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
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

      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: scrolled ? 0 : visible ? 1 : 0,
          transition: 'opacity 500ms ease',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5 8L10 13L15 8" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
        </svg>
      </div>
    </section>
  );
}
