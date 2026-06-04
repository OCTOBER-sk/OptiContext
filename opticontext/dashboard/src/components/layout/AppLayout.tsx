import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import type { AuthUser } from '../../lib/supabase';
import { AppTopNav } from './AppTopNav';

interface AppLayoutProps {
  user: AuthUser | null;
}

const SIDEBAR_LINKS = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/dashboard/settings', label: 'Settings', end: false },
  { to: '/docs', label: 'Documentation', end: false },
  { to: '/docs/quickstart', label: 'Quickstart', end: false },
];

const DOC_SIDEBAR_LINKS = [
  { to: '/docs/api-reference#authentication', label: 'Authentication' },
  { to: '/docs/api-reference#transport', label: 'Transport' },
  { to: '/docs/tools/intellisearch', label: 'IntelliSearch' },
  { to: '/docs/tools/voicebridge', label: 'VoiceBridge' },
  { to: '/docs/tools/deepdoc', label: 'DeepDoc' },
  { to: '/docs/tools/memorycore', label: 'MemoryCore' },
  { to: '/docs/api-reference', label: 'API Reference' },
  { to: '/docs/api-reference#limits', label: 'Limits' },
  { to: '/docs/troubleshooting', label: 'Troubleshooting' },
];

const linkBaseStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontFamily: "'Switzer', sans-serif",
  fontWeight: 500,
  fontSize: '0.875rem',
  textDecoration: 'none',
  borderLeft: '3px solid transparent',
  transition: 'all 150ms ease',
};

export function AppLayout({ user }: AppLayoutProps) {
  return (
    <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--base)' }}>
      <AppTopNav user={user} />
      <div className="app-body" style={{ display: 'flex', flex: 1 }}>
        <aside className="dash-sidebar">
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }} aria-label="Dashboard navigation">
            <span style={{
              fontFamily: "'Switzer', Inter, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              padding: '10px 20px 6px',
              display: 'block',
            }}>
              Navigation
            </span>
            {SIDEBAR_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                style={({ isActive }) => ({
                  ...linkBaseStyle,
                  padding: '10px 20px',
                  minHeight: 44,
                  fontSize: '0.875rem',
                  color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-subtle)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                })}
              >
                {link.label}
              </NavLink>
            ))}

            <div style={{ height: 1, background: 'var(--border)', margin: '6px 20px' }} />

            <span style={{
              fontFamily: "'Switzer', Inter, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              padding: '2px 20px 4px',
              display: 'block',
            }}>
              Docs
            </span>
            {DOC_SIDEBAR_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={false}
                style={({ isActive }) => ({
                  ...linkBaseStyle,
                  padding: '6px 20px 6px 28px',
                  minHeight: 32,
                  fontSize: '0.8125rem',
                  color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                  background: isActive ? 'var(--accent-subtle)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main
          id="main-content"
          className="bg-grid-layer"
          style={{
            flex: 1,
            padding: '32px clamp(1.5rem, 5vw, 6rem)',
            maxWidth: 1120,
            width: '100%',
          }}
        >
          <Outlet />
        </main>
      </div>
      <nav className="mobile-dashboard-nav" aria-label="Dashboard navigation">
        {SIDEBAR_LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end}>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
