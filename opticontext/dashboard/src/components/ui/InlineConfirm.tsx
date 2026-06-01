import React from 'react';
import { LOADING, BUTTONS } from '../../lib/microcopy';

interface InlineConfirmProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  loadingLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
  destructive?: boolean;
  onRetry?: () => void;
  children?: React.ReactNode;
}

export function InlineConfirm({
  open,
  title,
  description,
  confirmLabel,
  loadingLabel = LOADING.revoking,
  cancelLabel = BUTTONS.ghost.cancel,
  onConfirm,
  onCancel,
  loading = false,
  error,
  destructive = false,
  onRetry,
  children,
}: InlineConfirmProps) {
  if (!open) return null;

  return (
    <div
      style={{
        padding: '16px',
        background: destructive ? '#FEF2F2' : 'var(--accent-subtle)',
        borderRadius: 8,
        marginTop: 8,
        animation: 'fadeIn 200ms ease both',
      }}
    >
      <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 500, fontSize: '0.875rem', color: destructive ? 'var(--error)' : 'var(--text-primary)', margin: '0 0 4px' }}>
        {title}
      </p>
      <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
        {description}
      </p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={destructive ? 'btn btn-destructive' : 'btn btn-primary'}
          style={{ opacity: loading ? 0.65 : 1, fontSize: '0.875rem', padding: '8px 16px' }}
        >
          {loading ? loadingLabel : confirmLabel}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="btn btn-ghost"
          style={{ fontSize: '0.875rem', padding: '8px 16px' }}
        >
          {cancelLabel}
        </button>
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--error)' }}>
            {error}
          </span>
          {onRetry && (
            <button onClick={onRetry} className="btn btn-ghost" style={{ fontSize: '0.875rem', padding: '4px 8px', color: 'var(--accent)' }}>
              {BUTTONS.ghost.retry}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
