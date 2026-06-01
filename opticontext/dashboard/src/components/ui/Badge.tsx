import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  error:   'badge-error',
  neutral: 'badge-neutral',
};

export function Badge({ variant = 'success', children, dot = false, className = '' }: BadgeProps) {
  return (
    <span className={['badge', variantClass[variant], className].join(' ')} role="status">
      {dot && (
        <span
          className="status-dot operational"
          style={{ width: 6, height: 6 }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
