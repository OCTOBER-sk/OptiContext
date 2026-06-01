import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'metric' | 'api-key' | 'danger';
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({
  children,
  variant = 'default',
  interactive = false,
  className = '',
  style,
  onClick,
}: CardProps) {
  const base =
    variant === 'metric'  ? 'card-metric' :
    variant === 'api-key' ? 'card-api-key' :
    variant === 'danger'  ? 'danger-zone' :
    'card';

  const interactiveClass = interactive ? 'card-interactive cursor-pointer' : '';

  return (
    <div
      className={[base, interactiveClass, className].join(' ')}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      {children}
    </div>
  );
}
