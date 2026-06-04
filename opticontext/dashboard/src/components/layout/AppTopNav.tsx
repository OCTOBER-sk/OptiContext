import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Settings2, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { AuthUser } from '../../lib/supabase';

interface AppTopNavProps {
  user: AuthUser | null;
}

export function AppTopNav({ user }: AppTopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header
      style={{
        height: 60,
        background: 'var(--base)',
        borderBottom: '1px solid var(--border-strong)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 clamp(1.5rem, 5vw, 6rem)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      <NavLink to="/dashboard" end style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
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
      </NavLink>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {user && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              style={{ padding: 2, borderRadius: '50%' }}
              aria-label="User menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--sunken)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? 'User'}
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 600, fontSize: '0.875rem', color: 'var(--accent)' }}>
                    {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                  </span>
                )}
              </div>
            </button>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 8,
                  background: 'var(--raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '4px 0',
                  minWidth: 180,
                  zIndex: 1000,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{ padding: '8px 16px 6px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                  <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {user.displayName ?? 'User'}
                  </p>
                  <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {user.email}
                  </p>
                </div>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    fontFamily: "'Switzer', Inter, system-ui, sans-serif",
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'background 150ms',
                    border: 'none',
                    background: 'none',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onClick={() => { setMenuOpen(false); navigate('/dashboard/settings'); }}
                >
                  <Settings2 size={15} />
                  Settings
                </button>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    fontFamily: "'Switzer', Inter, system-ui, sans-serif",
                    fontSize: '0.875rem',
                    color: 'var(--error)',
                    cursor: 'pointer',
                    transition: 'background 150ms',
                    border: 'none',
                    background: 'none',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onClick={handleSignOut}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
