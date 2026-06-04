import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const RUNTIMES = [
  'Amazon Q',
  'Claude Code',
  'Cline',
  'Codex',
  'Continue',
  'Cursor',
  'GitHub Copilot',
  'Hermes',
  'Kilo Code',
  'OpenClaw',
  'OpenCode',
  'Windsurf',
  'Zed',
  'Custom MCP runtimes',
];

export function EcosystemSection() {
  const { ref, revealed } = useScrollReveal();

  return (
    <section
      ref={ref}
      style={{
        padding: '96px 0',
        background: 'var(--base)',
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
      }}
      aria-label="Ecosystem compatibility"
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
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            color: 'var(--text-primary)',
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Compatible with any MCP-compatible runtime
        </h2>

        <p
          style={{
            fontFamily: "'Switzer', Inter, system-ui, sans-serif",
            fontWeight: 400,
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: 560,
            margin: '0 auto 48px',
            textAlign: 'center',
          }}
        >
          OptiContext implements the Model Context Protocol specification directly.
          MCP is an open protocol — any runtime that implements it connects
          to any compliant server without custom integration work.
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 32,
          }}
        >
          {RUNTIMES.map((runtime, i) => (
            <span
              key={runtime}
              style={{
                fontFamily: "'Switzer', Inter, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '6px 12px',
                whiteSpace: 'nowrap',
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0)' : 'translateY(4px)',
                transition: `opacity 300ms ease ${Math.min(i, 13) * 30}ms, transform 300ms ease ${Math.min(i, 13) * 30}ms`,
              }}
            >
              {runtime}
            </span>
          ))}
        </div>

        <p
          style={{
            fontFamily: "'Switzer', Inter, system-ui, sans-serif",
            fontWeight: 400,
            fontSize: '1rem',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: 24,
          }}
        >
          If your runtime implements MCP Streamable HTTP transport (2025-11-25),
          it connects to OptiContext without modification.
        </p>
      </div>
    </section>
  );
}
