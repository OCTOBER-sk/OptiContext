import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const SIDEBAR_SECTIONS = [
  {
    label: 'Overview',
    links: [
      { to: '/docs', label: 'Introduction', end: true },
      { to: '/docs/quickstart', label: 'Quickstart', end: false },
    ],
  },
  {
    label: 'Capabilities',
    links: [
      { to: '/docs/tools/intellisearch', label: 'IntelliSearch', end: false },
      { to: '/docs/tools/voicebridge', label: 'VoiceBridge', end: false },
      { to: '/docs/tools/deepdoc', label: 'DeepDoc', end: false },
      { to: '/docs/tools/memorycore', label: 'MemoryCore', end: false },
    ],
  },
  {
    label: 'Reference',
    links: [
      { to: '/docs/api-reference', label: 'API Reference', end: false },
      { to: '/docs/api-reference#authentication', label: 'Authentication', end: false },
      { to: '/docs/api-reference#transport', label: 'Transport', end: false },
      { to: '/docs/api-reference#error-reference', label: 'Error Codes', end: false },
      { to: '/docs/troubleshooting', label: 'Troubleshooting', end: false },
      { to: '/docs/api-reference#rate-limits', label: 'Rate Limits', end: false },
    ],
  },
];

function DocsPageFooter() {
  const { ref, revealed } = useScrollReveal();

  return (
    <footer
      ref={ref}
      style={{
        background: 'var(--raised)',
        borderTop: '1px solid var(--border)',
        opacity: revealed ? 1 : 0,
        transition: 'opacity 400ms ease',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '16px clamp(1.5rem, 5vw, 6rem)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: "'Switzer', sans-serif",
          fontWeight: 400,
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>OptiContext — &copy; {new Date().getFullYear()}</span>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <a href="/docs" style={{ color: 'inherit', textDecoration: 'none' }}>Docs</a>
          <a href="https://github.com" style={{ color: 'inherit', textDecoration: 'none' }}>GitHub</a>
          <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
            Operational
          </span>
        </div>
      </div>
    </footer>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 24 }} aria-label="Documentation">
      {SIDEBAR_SECTIONS.map((section) => (
        <div key={section.label}>
          <p
            style={{
              fontFamily: "'Switzer', sans-serif",
              fontWeight: 600,
              fontSize: '0.6875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              padding: '0 20px',
              marginBottom: 8,
            }}
          >
            {section.label}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {section.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onNavigate}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 20px',
                  minHeight: 36,
                  fontFamily: "'Switzer', sans-serif",
                  fontWeight: 400,
                  fontSize: '0.875rem',
                  color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-subtle)' : 'transparent',
                  textDecoration: 'none',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  borderRadius: '0 4px 4px 0',
                  transition: 'color 150ms ease, background 150ms ease, border 150ms ease',
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function DocsLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ display: 'flex', flex: 1 }}>
        <aside className={['docs-sidebar', mobileOpen ? 'mobile-open' : ''].join(' ')}>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </aside>
        {mobileOpen && (
          <button
            aria-label="Close docs navigation"
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: '64px 0 0 260px', zIndex: 70, background: 'rgba(26,26,24,0.16)', border: 'none' }}
          />
        )}
        <main
          id="main-content"
          className="bg-grid-layer"
          style={{
            flex: 1,
            padding: '48px clamp(2rem, 5vw, 4rem)',
            maxWidth: 980,
          }}
        >
          <button className="btn btn-secondary mobile-docs-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            Docs navigation
          </button>
          <Outlet />
        </main>
      </div>
      <DocsPageFooter />
    </div>
  );
}
