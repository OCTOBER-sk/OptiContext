import React from 'react';
import { Copy, Check } from 'lucide-react';
import { MCP_ENDPOINT } from '../../lib/runtime-config';

const JSON_CODE = `{
  "mcpServers": {
    "opticontext": {
      "url": "${MCP_ENDPOINT}",
      "transport": "streamable-http",
      "headers": {
        "Authorization": "Bearer <YOUR_API_KEY>"
      }
    }
  }
}`;

function colorize(code: string) {
  const parts: { text: string; color?: string }[] = [];
  const re = /("(?:\\.|[^"\\])*"|\S+|\s+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    const tok = m[0];
    if (/^\s/.test(tok)) {
      parts.push({ text: tok });
    } else if (/^"/.test(tok)) {
      const after = code.slice(re.lastIndex).trimStart();
      parts.push({ text: tok, color: after[0] === ':' ? '#5EC99A' : '#D4A76A' });
    } else if (/^(true|false|null)$/.test(tok)) {
      parts.push({ text: tok, color: '#5EC99A' });
    } else if (/^\d/.test(tok)) {
      parts.push({ text: tok, color: '#E8E4DC' });
    } else {
      parts.push({ text: tok, color: '#8A9BA8' });
    }
  }
  return parts;
}

const COLORED = colorize(JSON_CODE);

export function McpTerminal() {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 640,
        background: '#1C1C1A',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        overflow: 'hidden',
        textAlign: 'left',
      }}
    >
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
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#8A9BA8' }}>
          ~/.cursor/mcp.json
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: 4,
            padding: '4px 10px',
            color: copied ? '#5EC99A' : '#E8E4DC',
            fontFamily: "'Switzer', sans-serif",
            fontSize: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: copied ? 1 : 0.7,
            transition: 'opacity 150ms',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <pre
        style={{
          margin: 0,
          padding: '14px 20px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.8125rem',
          lineHeight: 1.6,
          whiteSpace: 'pre',
          overflowX: 'auto',
          textAlign: 'left',
        }}
      >
        {COLORED.map((p, i) => (
          <span key={i} style={p.color ? { color: p.color } : undefined}>{p.text}</span>
        ))}
      </pre>

      <div
        style={{
          padding: '8px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: "'Switzer', sans-serif",
          fontSize: '0.65rem',
          color: 'rgba(232, 228, 220, 0.35)',
        }}
      >
        <span>Cursor</span>
        <span>JSON-RPC 2.0 · Streamable HTTP</span>
      </div>
    </div>
  );
}
