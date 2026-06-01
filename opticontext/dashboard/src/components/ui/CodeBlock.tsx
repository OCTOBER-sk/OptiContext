import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { TOOLTIPS, CONFIRMATIONS } from '../../lib/microcopy';

interface CodeBlockProps {
  code: string;
  label?: string;
  compact?: boolean;
  maxWidth?: string | number;
}

export function CodeBlock({ code, label, compact = false, maxWidth }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--code-surface)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 4,
        padding: label ? '0' : compact ? '10px 14px' : '16px 20px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: compact ? '0.75rem' : '0.875rem',
        lineHeight: 1.5,
        color: 'var(--code-text)',
        overflowX: 'auto',
        maxWidth: maxWidth || (compact ? '100%' : 780),
        width: '100%',
      }}
    >
      {label && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px 8px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.75rem',
              color: 'var(--code-muted)',
            }}
          >
            {label}
          </span>
          <button
            onClick={handleCopy}
            style={{
              background: 'rgba(28,28,26,0.8)',
              color: copied ? 'var(--code-accent)' : 'var(--code-text)',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              fontFamily: "'Switzer', sans-serif",
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              opacity: copied ? 1 : 0.7,
              transition: 'opacity 150ms ease, color 300ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = copied ? '1' : '0.7'; }}
            aria-label={TOOLTIPS.copyEndpointUrl}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? CONFIRMATIONS.copied : 'Copy'}
          </button>
        </div>
      )}
      {label ? (
        <pre style={{ margin: 0, padding: compact ? '10px 14px' : '14px 20px', whiteSpace: 'pre-wrap' }}>{code}</pre>
      ) : (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{code}</pre>
      )}
      {!label && (
        <button
          onClick={handleCopy}
          className="copy-button"
          aria-label={TOOLTIPS.copyEndpointUrl}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? CONFIRMATIONS.copied : 'Copy'}
        </button>
      )}
    </div>
  );
}
