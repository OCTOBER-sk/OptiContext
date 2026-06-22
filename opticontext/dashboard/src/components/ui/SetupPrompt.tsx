import React, { useState, useMemo } from 'react';
import { Check, Copy } from 'lucide-react';
import {
  buildOnboarding,
  CLIENT_CONFIGS,
  CLIENT_NAMES,
  OnboardingPayload,
} from '../../lib/runtime-config';
import { CodeBlock } from './CodeBlock';
import { CONFIRMATIONS, TOOLTIPS } from '../../lib/microcopy';

interface SetupPromptProps {
  apiKey: string;
}

const STORAGE_KEY = 'opticontext-onboarding-client';

function loadStoredClient(): string {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && (CLIENT_NAMES as readonly string[]).includes(v)) return v;
  } catch {
    // localStorage may be unavailable in private mode
  }
  return 'OpenCode';
}

function storeClient(client: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, client);
  } catch {
    // ignore
  }
}

/**
 * Three-section onboarding display.
 *
 *   A. MCP Registration — endpoint, transport, auth, and the runtime's
 *      config snippet (with the API key substituted).
 *   B. Activation Prompt — the Universal Agent Activation Protocol.
 *   C. Persistent Instructions — runtime-specific storage guidance.
 *
 * The user picks the target MCP client via a dropdown. The default
 * is "OpenCode" and the choice is persisted in localStorage.
 */
export default function SetupPrompt({ apiKey }: SetupPromptProps) {
  const [client, setClient] = useState<string>(loadStoredClient);
  const [copied, setCopied] = useState<string | null>(null);

  const onboarding: OnboardingPayload = useMemo(
    () => buildOnboarding(client, apiKey),
    [client, apiKey],
  );

  const onClientChange = (next: string) => {
    setClient(next);
    storeClient(next);
  };

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback to legacy execCommand path
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const fullOnboardingText = [
    `# ${onboarding.serverName} MCP — Onboarding`,
    '',
    `Server: ${onboarding.endpoint}`,
    `Client: ${onboarding.registration.client}`,
    `Config file: ${onboarding.registration.file}`,
    '',
    '## MCP Registration',
    '',
    onboarding.registration.code,
    '',
    '## Activation Prompt',
    '',
    onboarding.setupPrompt,
    ...(onboarding.instructionsHint
      ? ['', '## Persistent Instructions', '', onboarding.instructionsHint]
      : []),
  ].join('\n');

  return (
    <div
      data-testid="setup-prompt"
      style={{
        background: 'var(--sunken)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '16px 20px',
        marginBottom: 16,
      }}
    >
      {/* Header row: title + client selector + master copy */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 auto', minWidth: 0 }}>
          <h3
            style={{
              fontFamily: "'Zodiak', Georgia, serif",
              fontWeight: 400,
              fontSize: '1.125rem',
              color: 'var(--text-primary)',
              margin: 0,
              whiteSpace: 'nowrap',
            }}
          >
            Agent setup
          </h3>
          <select
            value={client}
            onChange={(e) => onClientChange(e.target.value)}
            aria-label="MCP client runtime"
            style={{
              fontFamily: "'Switzer', Inter, sans-serif",
              fontSize: '0.8125rem',
              color: 'var(--text-primary)',
              background: 'var(--base)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            {CLIENT_NAMES.map((name) => (
              <option key={name} value={name}>
                {name} — {CLIENT_CONFIGS[name].file}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => copyText('all', fullOnboardingText)}
          className="btn btn-primary"
          style={{ fontSize: '0.8125rem', padding: '8px 16px' }}
          aria-label="Copy all onboarding text"
        >
          {copied === 'all' ? <Check size={12} /> : <Copy size={12} />}
          <span style={{ marginLeft: 6 }}>
            {copied === 'all' ? CONFIRMATIONS.copied : 'Copy all'}
          </span>
        </button>
      </div>

      {/* Section A — MCP Registration */}
      <Section
        label="A · MCP Registration"
        caption="Drop this into your runtime's MCP config. The API key is already substituted."
        onCopy={() => copyText('registration', onboarding.registration.code)}
        copied={copied === 'registration'}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '4px 12px',
            fontFamily: "'Switzer', Inter, sans-serif",
            fontSize: '0.8125rem',
            color: 'var(--text-primary)',
            marginBottom: 10,
          }}
        >
          <FieldLabel>Server URL</FieldLabel>
          <FieldValue>{onboarding.endpoint}</FieldValue>
          <FieldLabel>Transport</FieldLabel>
          <FieldValue>Streamable HTTP (JSON-RPC 2.0)</FieldValue>
          <FieldLabel>Auth</FieldLabel>
          <FieldValue>Authorization: Bearer &lt;api key&gt;</FieldValue>
          <FieldLabel>Config file</FieldLabel>
          <FieldValue>
            <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {onboarding.registration.file}
            </code>
          </FieldValue>
        </div>
        <CodeBlock
          code={onboarding.registration.code}
          label={`${onboarding.registration.client} config`}
          compact
        />
      </Section>

      {/* Section B — Activation Prompt */}
      <Section
        label="B · Activation Prompt"
        caption="Paste this to the agent. It is the canonical activation protocol and supersedes any guide the agent has cached."
        onCopy={() => copyText('prompt', onboarding.setupPrompt)}
        copied={copied === 'prompt'}
      >
        <CodeBlock code={onboarding.setupPrompt} label="Universal Agent Activation Protocol" />
      </Section>

      {/* Section C — Persistent Instructions */}
      <Section
        label="C · Persistent Instructions"
        caption={
          onboarding.instructionsHint
            ? 'After the agent activates, save the activation protocol at the file below so future sessions load it automatically.'
            : 'This runtime does not have a native persistent-instructions file. Configure the agent\u2019s system prompt field instead.'
        }
        onCopy={
          onboarding.instructionsHint
            ? () => copyText('instructions', onboarding.instructionsHint as string)
            : undefined
        }
        copied={copied === 'instructions'}
      >
        {onboarding.instructionsHint ? (
          <div
            style={{
              fontFamily: "'Switzer', Inter, sans-serif",
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              background: 'var(--base)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '12px 14px',
            }}
          >
            {onboarding.instructionsHint}
          </div>
        ) : (
          <div
            style={{
              fontFamily: "'Switzer', Inter, sans-serif",
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              background: 'var(--base)',
              border: '1px dashed var(--border)',
              borderRadius: 4,
              padding: '12px 14px',
            }}
          >
            No native instructions file for {onboarding.registration.client}. Paste the activation
            prompt into the runtime&rsquo;s system_prompt field (OpenClaw) or equivalent configuration
            location.
          </div>
        )}
      </Section>

      <p
        style={{
          fontFamily: "'Switzer', Inter, sans-serif",
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          margin: '12px 0 0',
        }}
        title={TOOLTIPS.fullKeyNotRecoverable}
      >
        Your full API key is shown above this card. It is substituted into the registration snippet.
        Copy the key separately if you need it for a different runtime.
      </p>
    </div>
  );
}

interface SectionProps {
  label: string;
  caption: string;
  onCopy?: () => void;
  copied?: boolean;
  children: React.ReactNode;
}

function Section({ label, caption, onCopy, copied, children }: SectionProps) {
  return (
    <section
      style={{
        background: 'var(--base)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '12px 14px',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <h4
          style={{
            fontFamily: "'Switzer', Inter, sans-serif",
            fontWeight: 600,
            fontSize: '0.6875rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            margin: 0,
          }}
        >
          {label}
        </h4>
        {onCopy && (
          <button
            onClick={onCopy}
            className="btn btn-ghost"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            aria-label={`Copy ${label}`}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            <span style={{ marginLeft: 4 }}>
              {copied ? CONFIRMATIONS.copied : 'Copy'}
            </span>
          </button>
        )}
      </div>
      <p
        style={{
          fontFamily: "'Switzer', Inter, sans-serif",
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          margin: '0 0 10px',
        }}
      >
        {caption}
      </p>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "'Switzer', Inter, sans-serif",
        fontSize: '0.6875rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        paddingTop: 2,
      }}
    >
      {children}
    </span>
  );
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.8125rem',
        color: 'var(--text-primary)',
        wordBreak: 'break-all',
      }}
    >
      {children}
    </span>
  );
}
