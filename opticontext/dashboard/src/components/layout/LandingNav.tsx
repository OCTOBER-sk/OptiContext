import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { BUTTONS } from '../../lib/microcopy';

const NAV_LINKS = [
  { to: '/docs', label: 'Docs' },
  { to: '/docs/tools/intellisearch', label: 'Tools' },
  { to: '/docs/api-reference', label: 'API Reference' },
  { to: '/dashboard', label: 'Dashboard' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(1.5rem, 5vw, 6rem)',
        background: scrolled ? 'rgba(250, 248, 244, 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 200ms ease',
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <span
          style={{
            fontFamily: "'Zodiak', Georgia, serif",
            fontWeight: 400,
            fontSize: '1.125rem',
            color: 'var(--text-primary)',
          }}
        >
          OptiContext
        </span>
      </Link>

      <div className="landing-nav-links" style={{ gap: 32 }}>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              fontFamily: "'Switzer', Inter, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'color 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="landing-nav-actions" style={{ gap: 12 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate(user ? '/dashboard' : '/auth')}
        >
              {user ? BUTTONS.primary.goToDashboard : BUTTONS.primary.getAgentKey}
        </button>
      </div>

      <button
        className="landing-nav-toggle icon-btn"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--base)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 32,
            zIndex: 100,
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              style={{
                fontFamily: "'Zodiak', Georgia, serif",
                fontWeight: 400,
                fontSize: '1.5rem',
                color: 'var(--text-primary)',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: 200 }}
              onClick={() => { setMobileOpen(false); navigate(user ? '/dashboard' : '/auth'); }}
            >
          {user ? BUTTONS.primary.goToDashboard : BUTTONS.primary.getAgentKey}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
