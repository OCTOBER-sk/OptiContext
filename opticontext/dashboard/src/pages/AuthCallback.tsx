import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';

function go(path: string) {
  window.location.replace(path);
}

export default function AuthCallback() {
  useEffect(() => {
    let cancelled = false;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') || urlParams.get('error_code')) {
      if (!cancelled) go('/auth');
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session) {
        go('/dashboard');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session) {
        go('/dashboard');
      }
    });

    const timeout = setTimeout(() => {
      if (!cancelled) go('/auth');
    }, 15000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--base)',
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: "'Switzer', Inter, system-ui, sans-serif",
          fontWeight: 400,
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
        }}
      >
        Completing sign in...
      </span>
    </div>
  );
}
