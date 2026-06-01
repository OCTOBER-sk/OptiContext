import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label && (
          <label
            style={{
              fontFamily: "'Switzer', Inter, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {icon && (
            <span
              style={{
                position: 'absolute',
                left: 12,
                color: 'var(--text-muted)',
                display: 'flex',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={['input', error ? 'error' : '', className].join(' ')}
            style={icon ? { paddingLeft: 40 } : undefined}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.name}-error` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p
            id={`${props.name}-error`}
            style={{
              fontFamily: "'Switzer', Inter, system-ui, sans-serif",
              fontSize: '0.875rem',
              color: 'var(--error)',
              margin: 0,
            }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
