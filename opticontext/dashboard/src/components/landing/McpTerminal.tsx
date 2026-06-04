import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { CLIENT_CONFIGS } from '../../lib/runtime-config';

/* Cursor is the most common MCP client — show it first */
const DEMO_CONFIG = CLIENT_CONFIGS['Cursor'];

export function McpTerminal() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(DEMO_CONFIG.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="code-block" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'left' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          paddingBottom: 10,
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
          {DEMO_CONFIG.file}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: 4,
            padding: '4px 10px',
            color: copied ? '#5EC99A' : 'var(--code-text)',
            fontFamily: "'Switzer', sans-serif",
            fontSize: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'color 150ms',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <pre
        style={{
          margin: 0,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.8125rem',
          lineHeight: 1.65,
          color: 'var(--code-text)',
          whiteSpace: 'pre',
          overflowX: 'auto',
          textAlign: 'left',
        }}
      >
{`{
  "mcpServers": {
    "opticontext": {
      "url": "https://mcp.opticontext.dev/mcp",
      "transport": "streamable-http",
      "headers": {
        "Authorization": "Bearer <YOUR_API_KEY>"
      }
    }
  }
}`}
      </pre>

      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: "'Switzer', sans-serif",
          fontSize: '0.65rem',
          color: 'rgba(232, 228, 220, 0.4)',
        }}
      >
        <span>Cursor · MCP</span>
        <span>JSON-RPC 2.0 · Streamable HTTP</span>
      </div>
    </div>
  );
}
