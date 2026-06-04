import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { CLIENT_CONFIGS, CLIENT_NAMES } from '../../lib/runtime-config';

/* ── Simple JSON syntax highlighter (no external dep) ── */
function highlightJson(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < text.length) {
    const ch = text[i];

    // String
    if (ch === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') {
        if (text[j] === '\\') j += 2; else j++;
      }
      const str = text.slice(i, j + 1);
      const isKey = text[j + 1] === ':' || text[j + 1]?.trim() === ':';
      out.push(
        <span
          key={key++}
          style={{
            color: isKey ? '#5EC99A' : '#D4A76A',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {str}
        </span>
      );
      i = j + 1;
      continue;
    }

    // Number / boolean / null
    if (/[0-9\-]/.test(ch) || text.slice(i, i + 4) === 'true' || text.slice(i, i + 5) === 'false' || text.slice(i, i + 4) === 'null') {
      const m = text.slice(i).match(/^(true|false|null|[\-0-9]+(?:\.?[0-9]+)?)/);
      if (m) {
        out.push(
          <span key={key++} style={{ color: '#E8E4DC', fontFamily: "'JetBrains Mono', monospace" }}>{m[0]}</span>
        );
        i += m[0].length;
        continue;
      }
    }

    // Punctuation / whitespace — raw
    out.push(
      <span key={key++} style={{ color: '#8A9BA8', fontFamily: "'JetBrains Mono', monospace" }}>{ch}</span>
    );
    i++;
  }
  return out;
}

/* ── Component ── */
export function McpTerminal() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const names = CLIENT_NAMES;
  const currentName = names[idx];
  const currentCfg = CLIENT_CONFIGS[currentName];

  const next = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setIdx((i) => (i + 1) % names.length);
      setVisible(true);
    }, 400); // half of the transition duration
  }, [names.length]);

  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentCfg.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 640,
        background: 'var(--code-surface)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        overflow: 'hidden',
        fontFamily: "'Switzer', Inter, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px 10px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.15)',
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            color: 'var(--code-muted)',
            transition: 'opacity 400ms ease',
            opacity: visible ? 1 : 0.3,
          }}
        >
          {currentCfg.file}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: 'rgba(28,28,26,0.8)',
            color: copied ? '#5EC99A' : 'var(--code-text)',
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
            transition: 'opacity 150ms, color 150ms',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Code body */}
      <div
        style={{
          position: 'relative',
          minHeight: 260,
          maxHeight: 320,
          overflow: 'auto',
        }}
      >
        <pre
          style={{
            margin: 0,
            padding: '16px 20px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.8125rem',
            lineHeight: 1.65,
            color: 'var(--code-text)',
            whiteSpace: 'pre',
            transition: 'opacity 400ms ease, transform 400ms ease',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(6px)',
          }}
        >
          {highlightJson(currentCfg.code)}
        </pre>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.1)',
          fontSize: '0.65rem',
          color: 'rgba(232, 228, 220, 0.45)',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={{ transition: 'opacity 400ms', opacity: visible ? 1 : 0.3 }}>
          {currentName}
        </span>
        <span>MCP · JSON-RPC 2.0 · Streamable HTTP</span>
      </div>
    </div>
  );
}
