import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { generateSetupPrompt } from '../../lib/runtime-config';

interface SetupPromptProps {
  apiKey: string;
}

export default function SetupPrompt({ apiKey }: SetupPromptProps) {
  const [copied, setCopied] = useState(false);

  const promptText = generateSetupPrompt(apiKey);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(promptText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{
      background: 'var(--sunken)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '12px 16px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        <h3 style={{
          fontFamily: "'Zodiak', Georgia, serif",
          fontWeight: 400,
          fontSize: '0.875rem',
          color: '#1A1A18',
          margin: 0,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          Agent setup
        </h3>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'block',
          minWidth: 0,
        }}>
          {promptText.split('\n').slice(0, 3).join(' ').substring(0, 90)}…
        </span>
      </div>
      <button
        onClick={handleCopy}
        className="icon-btn"
        aria-label="Copy setup prompt"
        title="Copy setup prompt"
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}
