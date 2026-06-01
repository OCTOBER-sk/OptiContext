import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingLabel?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const sizeMap: Record<Size, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

const variantMap: Record<Variant, string> = {
  primary:      'btn-primary',
  secondary:    'btn-secondary',
  ghost:        'btn-ghost',
  destructive:  'btn-destructive',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingLabel,
      icon,
      iconRight,
      fullWidth = false,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={[
          'btn',
          variantMap[variant],
          sizeMap[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <span style={{ opacity: 0.65 }}>{loadingLabel || children}</span>
        ) : icon ? (
          <span aria-hidden="true">{icon}</span>
        ) : null}
        {!loading && children}
        {!loading && iconRight && <span aria-hidden="true">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
