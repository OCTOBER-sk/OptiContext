import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { BUTTONS } from '../../lib/microcopy';

const CAPABILITIES = [
  {
    name: 'IntelliSearch',
    desc: 'AI-enhanced web search with advanced dorking,\nmulti-provider routing, and real-time summarization.',
    bestFor: 'agents that need current, precise information from the web.',
    docLink: '/docs/tools/intellisearch',
    pattern: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 L30 40 L50 25 L80 45' stroke='%231A6B4A' stroke-width='0.5' fill='none' opacity='0.02'/%3E%3Cpath d='M80 45 L100 20 L130 35 L160 30' stroke='%231A6B4A' stroke-width='0.5' fill='none' opacity='0.02'/%3E%3Cpath d='M80 45 L90 70 L120 80' stroke='%231A6B4A' stroke-width='0.5' fill='none' opacity='0.02'/%3E%3C/svg%3E")`,
  },
  {
    name: 'VoiceBridge',
    desc: 'Low-latency TTS streaming across 48 voices and 8 languages.\nSub-300ms time to first byte.',
    bestFor: 'Telegram, Discord, and WhatsApp runtimes that speak.',
    docLink: '/docs/tools/voicebridge',
    pattern: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q25 30 50 50 T100 50 T150 50 T200 50' stroke='%23C8C4BB' stroke-width='0.5' fill='none' opacity='0.02'/%3E%3Cpath d='M0 100 Q25 80 50 100 T100 100 T150 100 T200 100' stroke='%23C8C4BB' stroke-width='0.5' fill='none' opacity='0.015'/%3E%3Cpath d='M0 150 Q25 130 50 150 T100 150 T150 150 T200 150' stroke='%23C8C4BB' stroke-width='0.5' fill='none' opacity='0.02'/%3E%3C/svg%3E")`,
  },
  {
    name: 'DeepDoc',
    desc: 'Deep file analysis with a 2M token context window.\nHandles PDFs, code, images, audio, and structured documents.',
    bestFor: 'agents analyzing large documents and multi-format files.',
    docLink: '/docs/tools/deepdoc',
    pattern: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='40' x2='200' y2='40' stroke='%23C8C4BB' stroke-width='0.5' opacity='0.02'/%3E%3Cline x1='0' y1='80' x2='200' y2='80' stroke='%23C8C4BB' stroke-width='0.5' opacity='0.02'/%3E%3Cline x1='0' y1='120' x2='200' y2='120' stroke='%23C8C4BB' stroke-width='0.5' opacity='0.02'/%3E%3Cline x1='0' y1='160' x2='200' y2='160' stroke='%23C8C4BB' stroke-width='0.5' opacity='0.02'/%3E%3Crect x='20' y='10' width='160' height='20' rx='2' fill='%23C8C4BB' opacity='0.015'/%3E%3C/svg%3E")`,
  },
  {
    name: 'MemoryCore',
    desc: 'Persistent RAG memory with semantic search.\nAgents store, search, and retrieve context across sessions.',
    bestFor: 'personal agents that build a model of users over time.',
    docLink: '/docs/tools/memorycore',
    pattern: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='2' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='100' cy='30' r='2' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='170' cy='30' r='2' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='65' cy='100' r='2' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='140' cy='100' r='2' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='30' cy='170' r='2' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='100' cy='170' r='2' fill='%231A6B4A' opacity='0.025'/%3E%3Ccircle cx='170' cy='170' r='2' fill='%231A6B4A' opacity='0.025'/%3E%3Cline x1='30' y1='30' x2='100' y2='30' stroke='%231A6B4A' stroke-width='0.3' opacity='0.015'/%3E%3Cline x1='100' y1='30' x2='170' y2='30' stroke='%231A6B4A' stroke-width='0.3' opacity='0.015'/%3E%3Cline x1='30' y1='30' x2='65' y2='100' stroke='%231A6B4A' stroke-width='0.3' opacity='0.015'/%3E%3Cline x1='170' y1='30' x2='140' y2='100' stroke='%231A6B4A' stroke-width='0.3' opacity='0.015'/%3E%3Cline x1='65' y1='100' x2='140' y2='100' stroke='%231A6B4A' stroke-width='0.3' opacity='0.015'/%3E%3Cline x1='65' y1='100' x2='100' y2='170' stroke='%231A6B4A' stroke-width='0.3' opacity='0.015'/%3E%3Cline x1='140' y1='100' x2='170' y2='170' stroke='%231A6B4A' stroke-width='0.3' opacity='0.015'/%3E%3C/svg%3E")`,
  },
];

export function CapabilitySection() {
  const navigate = useNavigate();
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
      aria-label="Capabilities"
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
            marginBottom: 8,
          }}
        >
          Four capabilities. One integration.
        </h2>
        <p
          style={{
            fontFamily: "'Switzer', Inter, system-ui, sans-serif",
            fontWeight: 400,
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            maxWidth: 480,
            margin: '0 auto 64px',
          }}
        >
          Connect once. Every capability is immediately available to your runtime.
        </p>

        <div
          className="landing-tools-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 24,
          }}
        >
          {CAPABILITIES.map((cap, i) => (
            <div
              key={cap.name}
              style={{
                borderTop: '2px solid var(--border-accent)',
                padding: '28px 0 0',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0)' : 'translateY(8px)',
                transition: `opacity 400ms ease ${Math.min(i, 5) * 60}ms, transform 400ms ease ${Math.min(i, 5) * 60}ms`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 200,
                  height: 200,
                  backgroundImage: cap.pattern,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right top',
                  pointerEvents: 'none',
                  opacity: 0.4,
                }}
              />
              <h3
                style={{
                  fontFamily: "'Zodiak', Georgia, serif",
                  fontWeight: 400,
                  fontSize: '1.75rem',
                  color: 'var(--text-primary)',
                  marginBottom: 12,
                }}
              >
                {cap.name}
              </h3>
              <p
                style={{
                  fontFamily: "'Switzer', Inter, system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: 16,
                  flex: 1,
                  whiteSpace: 'pre-line',
                }}
              >
                {cap.desc}
              </p>
              <p
                style={{
                  fontFamily: "'Switzer', Inter, system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  marginBottom: 20,
                }}
              >
                Best for: {cap.bestFor}
              </p>
              <button
                onClick={() => navigate(cap.docLink)}
                className="btn btn-ghost"
                style={{ paddingLeft: 0, alignSelf: 'flex-start' }}
              >
                {BUTTONS.ghost.viewReference}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
