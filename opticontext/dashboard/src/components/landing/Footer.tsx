import React from 'react';

export function Footer() {
  return (
    <footer
      style={{
        background: 'var(--raised)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div
        className="landing-footer-inner"
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '16px clamp(1.5rem, 5vw, 6rem)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: "'Switzer', Inter, system-ui, sans-serif",
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
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            Operational
          </span>
        </div>
      </div>
    </footer>
  );
}
