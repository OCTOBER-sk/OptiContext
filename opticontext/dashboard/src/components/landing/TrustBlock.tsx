import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const TRUST_POINTS = [
  {
    title: 'Edge-deployed infrastructure',
    text: 'Deployed across 300+ global points of presence.\nSub-5ms cold starts. No container spin-up. No regional latency penalty.',
  },
  {
    title: 'Protocol-native by design',
    text: 'Implements MCP Streamable HTTP transport and full JSON-RPC 2.0 compliance.\nAny MCP-compatible runtime connects without modification.',
  },
  {
    title: 'Per-agent isolation and control',
    text: 'Create one agent key per runtime. Revoke individually from the dashboard.\nUsage tracked per capability, per agent, in real time.',
  },
  {
    title: 'Zero infrastructure cost',
    text: 'Every component runs on a permanent free tier.\nNo credit card required. No usage-based billing.',
  },
];

export function TrustBlock() {
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
      aria-label="Trust"
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
            fontSize: 'clamp(1.5rem, 4vw, 1.75rem)',
            color: 'var(--text-primary)',
            textAlign: 'center',
            marginBottom: 'clamp(2rem, 5vw, 4rem)',
          }}
        >
          Built for production. Free forever.
        </h2>

        <div
          className="trust-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 32,
          }}
        >
          {TRUST_POINTS.map((point, i) => (
            <div
              key={point.title}
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: 24,
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0)' : 'translateY(8px)',
                transition: `opacity 400ms ease ${Math.min(i, 5) * 60}ms, transform 400ms ease ${Math.min(i, 5) * 60}ms`,
              }}
            >
              <h3
                style={{
                  fontFamily: "'Zodiak', Georgia, serif",
                  fontWeight: 400,
                  fontSize: '1.375rem',
                  color: 'var(--text-primary)',
                  marginBottom: 8,
                }}
              >
                {point.title}
              </h3>
              <p
                style={{
                  fontFamily: "'Switzer', Inter, system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                  whiteSpace: 'pre-line',
                }}
              >
                {point.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
