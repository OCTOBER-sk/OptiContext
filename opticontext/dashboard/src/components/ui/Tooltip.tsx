import React, { useRef, useState } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), 300);
  };
  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 100);
  };

  const positionStyles: Record<string, React.CSSProperties> = {
    top:    { bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' },
    bottom: { top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' },
    left:   { right: 'calc(100% + 6px)', top: '50%', transform: 'translateY(-50%)' },
    right:  { left: 'calc(100% + 6px)', top: '50%', transform: 'translateY(-50%)' },
  };

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            ...positionStyles[position],
            background: 'var(--text-primary)',
            borderRadius: '4px',
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontFamily: "'Switzer', Inter, system-ui, sans-serif",
            color: 'var(--text-inverse)',
            maxWidth: 220,
            whiteSpace: 'nowrap',
            zIndex: 9000,
            pointerEvents: 'none',
            animation: 'fadeIn 150ms ease both',
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
