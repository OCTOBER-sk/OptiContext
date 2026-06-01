import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, action?: ToastItem['action']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} style={{ color: 'var(--success)' }} />,
  error:   <XCircle    size={16} style={{ color: 'var(--error)' }} />,
  warning: <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />,
  info:    <Info       size={16} style={{ color: 'var(--neutral)' }} />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(
    (message: string, type: ToastType = 'success', action?: ToastItem['action']) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message, action }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 9999,
        }}
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'var(--raised)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontFamily: "'Switzer', Inter, system-ui, sans-serif",
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              minWidth: 280,
              maxWidth: 400,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}
            role="alert"
          >
            {iconMap[t.type]}
            <span style={{ flex: 1 }}>{t.message}</span>
            {t.action && (
              <button
                onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                style={{
                  fontFamily: "'Switzer', Inter, system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  color: 'var(--accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 4,
                display: 'flex',
              }}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
