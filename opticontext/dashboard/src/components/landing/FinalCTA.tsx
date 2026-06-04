import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { supabase, toAuthUser } from '../../lib/supabase';
import type { AuthUser } from '../../lib/supabase';
import { BUTTONS } from '../../lib/microcopy';

export function FinalCTA() {
  const navigate = useNavigate();
  const { ref, revealed } = useScrollReveal();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toAuthUser(session.user) : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <section
      ref={ref}
      style={{
        padding: '80px 0',
        background: 'var(--raised)',
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
      }}
      aria-label="Get started"
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '0 clamp(1.5rem, 5vw, 6rem)',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: "'Zodiak', Georgia, serif",
            fontWeight: 400,
            fontSize: '2.25rem',
            color: 'var(--text-primary)',
            marginBottom: 16,
          }}
        >
          Ready to extend your agent?
        </h2>
        <p
          style={{
            fontFamily: "'Switzer', Inter, system-ui, sans-serif",
            fontWeight: 400,
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: 480,
            margin: '0 auto 40px',
          }}
        >
          Add OptiContext to your runtime's MCP config.
          Your agent gains search, voice, file analysis, and persistent memory
          in one configuration block.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(user ? '/dashboard' : '/auth')}
          >
            {user ? BUTTONS.primary.goToDashboard : BUTTONS.primary.getAgentKey}
          </button>
          <button
            className="btn btn-ghost btn-lg"
            onClick={() => navigate('/docs/quickstart')}
          >
            {BUTTONS.secondary.readTheQuickstart}
          </button>
        </div>
      </div>
    </section>
  );
}
