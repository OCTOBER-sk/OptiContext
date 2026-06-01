import React from 'react';
import { Bell } from 'lucide-react';
import type { User } from 'firebase/auth';
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  user: User | null;
  action?: { label: string; onClick: () => void };
}

export function Header({ title, user, action }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      style={{
        height: 'var(--header-height)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-8)',
        background: 'var(--abyss)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}
      className="entry-header"
    >
      <h1 className="page-title entry-title">{title}</h1>

      <div className="flex items-center gap-3">
        {action && (
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={action.onClick}
            size="sm"
          >
            {action.label}
          </Button>
        )}

        <button
          className="btn-ghost"
          style={{ padding: '8px' }}
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        {user && (
          <button
            className="btn-ghost"
            style={{ padding: '4px', borderRadius: '50%' }}
            aria-label="User menu"
            onClick={() => navigate('/dashboard/settings')}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--surface-03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? 'User'}
                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <span className="font-display font-bold text-signal-text" style={{ fontSize: '0.875rem' }}>
                  {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                </span>
              )}
            </div>
          </button>
        )}
      </div>
    </header>
  );
}
