import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Plus } from 'lucide-react';
import type { AuthUser } from '../../lib/supabase';
import { StatusChip } from '../../components/ui/StatusChip';
import { CapabilityBlock } from '../../components/ui/CapabilityBlock';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tooltip } from '../../components/ui/Tooltip';
import { useUsageData } from '../../hooks/useUsageData';
import { useActivityData } from '../../hooks/useActivityData';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import { useApiKeys } from '../../hooks/useApiKeys';
import { CONFIRMATIONS, LOADING, EMPTY_STATES, TOOLTIPS, OPERATIONAL, BUTTONS } from '../../lib/microcopy';
import { VALIDATION } from '../../lib/validation';
import SetupPrompt from '../../components/ui/SetupPrompt';
import { MCP_ENDPOINT, CLIENT_CONFIGS } from '../../lib/runtime-config';

interface DashboardHomeProps {
  user: AuthUser | null;
}

export default function DashboardHome({ user }: DashboardHomeProps) {
  const [activeClient, setActiveClient] = useState<string>('OpenClaw');
  const [configCopied, setConfigCopied] = useState(false);

  const { status: healthStatus, lastChecked } = useHealthCheck();
  const { keys, loading: keysLoading, createKey: apiCreateKey } = useApiKeys();
  const nonRevokedKeys = keys.filter((k) => !k.revoked);
  const selectedKey = keys.length > 0 ? keys.find((k) => !k.revoked) ?? null : null;
  const selectedAgentId = selectedKey?.agent_id ?? null;
  const { capabilities, totalToday, totalMonth, loading: usageLoading, error: usageError, refetch: refetchUsage } = useUsageData(selectedAgentId);
  const { rows: activityRows, loading: activityLoading, error: activityError, refetch: refetchActivity } = useActivityData(selectedAgentId);

  const [inlineKeyName, setInlineKeyName] = useState('');
  const [inlineKeyError, setInlineKeyError] = useState('');
  const [creatingInlineKey, setCreatingInlineKey] = useState(false);
  const [generatingText, setGeneratingText] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [newlyCreatedAgentId, setNewlyCreatedAgentId] = useState<string | null>(null);
  const [newKeyCopied, setNewKeyCopied] = useState(false);
  const [showRevealOverlay, setShowRevealOverlay] = useState(false);

  const PLACEHOLDER_EXAMPLES = ['openclaw', 'hermes', 'antigravity', 'opencode', 'claude-code', 'cursor'];

  const validateKeyName = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return VALIDATION.keyName.empty;
    if (trimmed.length > 48) return VALIDATION.keyName.tooLong;
    if (!/^[a-z0-9_-]+$/.test(trimmed)) return VALIDATION.keyName.invalidChars;
    if (keys.some((k) => k.display_name === trimmed || k.agent_id === trimmed)) return VALIDATION.keyName.duplicate;
    return '';
  };

  const createInlineKey = async () => {
    const error = validateKeyName(inlineKeyName);
    setInlineKeyError(error);
    if (error) return;
    setCreatingInlineKey(true);
    setGeneratingText(true);
    try {
      const result = await apiCreateKey(inlineKeyName.trim());
      setInlineKeyName('');
      setInlineKeyError('');
      setNewlyCreatedKey(result.key);
      setNewlyCreatedAgentId(result.agent_id);
      setNewKeyCopied(false);
      setShowRevealOverlay(true);
      setCreatingInlineKey(false);
      setGeneratingText(false);
    } catch (err) {
      setInlineKeyError(err instanceof Error ? err.message : 'Failed to create key');
      setCreatingInlineKey(false);
      setGeneratingText(false);
    }
  };

  const maskedKey = selectedKey
    ? `opctx_${selectedKey.agent_id.slice(0, Math.min(5, selectedKey.agent_id.length - 4))}_${'\u2588'.repeat(24)}${selectedKey.agent_id.length > 4 ? selectedKey.agent_id.slice(-4) : selectedKey.agent_id}`
    : '';

  const copyToClipboard = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    window.setTimeout(() => setter(false), 1500);
  };

  const getConfigCode = (client: string) => {
    const cfg = CLIENT_CONFIGS[client];
    if (!cfg) return '';
    return cfg.code;
  };

  const currentConfig = getConfigCode(activeClient);

  const getHealthTooltip = (): string => {
    if (!lastChecked) return '';
    const seconds = Math.floor((Date.now() - lastChecked.getTime()) / 1000);
    if (healthStatus === 'operational') return TOOLTIPS.statusOperational.replace('[N]', String(seconds));
    if (healthStatus === 'degraded') return TOOLTIPS.statusDegraded.replace('[N]', String(seconds));
    if (healthStatus === 'reconnecting') return `Connection interrupted. Next poll in progress.\nLast checked ${seconds}s ago`;
    if (healthStatus === 'incident') return TOOLTIPS.statusIncident.replace('[N]', String(seconds));
    return `Last checked ${seconds}s ago`;
  };
  const healthTooltip = getHealthTooltip();

  const hasKeys = !keysLoading && nonRevokedKeys.length > 0;
  const hasKeysLoading = keysLoading;

  return (
    <div className="dashboard-home">
      {hasKeysLoading ? (
        <div>
          <h1 style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: '1.75rem', color: 'var(--text-primary)', margin: '0 0 8px' }}>
            {LOADING.keys}
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }} className="dashboard-copy-grid">
            {[1, 2].map((i) => (
              <div key={i} style={{ background: 'var(--sunken)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
                <Skeleton height="0.6875rem" width="30%" />
                <div style={{ marginTop: 4 }}><Skeleton height="0.875rem" width="80%" /></div>
              </div>
            ))}
          </div>
        </div>
      ) : !hasKeys && !showRevealOverlay ? (
        <div>
          <h1 style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: '1.75rem', color: 'var(--text-primary)', margin: '0 0 8px' }}>
            {EMPTY_STATES.noKeysDashboard}
          </h1>
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '1rem', color: 'var(--text-secondary)', margin: '0 0 24px', maxWidth: 480 }}>
            {EMPTY_STATES.noKeysDashboardBody}
          </p>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 24 }}>
            <div style={{ flex: 1, maxWidth: 280 }}>
              <input
                type="text"
                value={inlineKeyName}
                onChange={(e) => { setInlineKeyName(e.target.value); setInlineKeyError(''); }}
                placeholder={`e.g. ${PLACEHOLDER_EXAMPLES[0]}`}
                className={'input' + (inlineKeyError ? ' error' : '')}
                onKeyDown={(e) => e.key === 'Enter' && createInlineKey()}
                disabled={creatingInlineKey}
                aria-invalid={!!inlineKeyError}
              />
              {inlineKeyError && (
                <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--error)', marginTop: 6, margin: '6px 0 0' }}>
                  {inlineKeyError}
                </p>
              )}
            </div>
            <button onClick={createInlineKey} className="btn btn-primary" disabled={creatingInlineKey} style={{ opacity: creatingInlineKey ? 0.65 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} />
              {generatingText ? 'Generating key' : BUTTONS.primary.createKey}
            </button>
          </div>

          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Need more keys later? Visit <Link to="/dashboard/settings" style={{ color: 'var(--accent)' }}>Settings</Link>
          </p>
        </div>

      ) : showRevealOverlay && newlyCreatedKey ? (
        <div>
          <h1 style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: '1.75rem', color: 'var(--text-primary)', margin: '0 0 8px' }}>
            {CONFIRMATIONS.keyCreated}
          </h1>
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '1rem', color: 'var(--warning)', margin: '0 0 16px', fontWeight: 500 }}>
            {OPERATIONAL.keyRevealWarning}
          </p>
          <code style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.875rem', color: 'var(--text-primary)', background: 'var(--sunken)', border: '1px solid var(--border-accent)', borderRadius: 8, padding: '12px 16px', wordBreak: 'break-all', marginBottom: 16, maxWidth: 560 }}>
            {newlyCreatedKey}
          </code>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 32 }}>
            <button
              onClick={() => { navigator.clipboard.writeText(newlyCreatedKey); setNewKeyCopied(true); window.setTimeout(() => setNewKeyCopied(false), 1500); }}
              className="btn btn-primary"
              style={{ fontSize: '0.875rem', padding: '10px 20px' }}
            >
              {newKeyCopied ? CONFIRMATIONS.copied : BUTTONS.primary.copyKeyRevealed}
            </button>
            <button
              onClick={() => { setShowRevealOverlay(false); setNewlyCreatedKey(null); }}
              className="btn btn-secondary"
              style={{ fontSize: '0.875rem' }}
            >
              Continue to dashboard
            </button>
          </div>

          {newlyCreatedAgentId && <SetupPrompt apiKey={newlyCreatedKey} />}
        </div>
      ) : (
      <>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
          <h1 style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', color: 'var(--text-primary)', margin: 0 }}>
            Your MCP endpoint
          </h1>
          <Tooltip content={healthTooltip}>
            <span style={{ marginTop: 6 }}>
              <StatusChip status={healthStatus} />
            </span>
          </Tooltip>
        </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 10 }} className="dashboard-copy-grid">
          <div style={{ background: 'var(--sunken)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                Endpoint
              </span>
              <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.875rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {MCP_ENDPOINT}
              </code>
            </div>
            <button
              onClick={() => copyToClipboard(MCP_ENDPOINT, setConfigCopied)}
              className="icon-btn"
              aria-label={TOOLTIPS.copyEndpointUrl}
              title={TOOLTIPS.copyEndpointUrl}
              style={{ flexShrink: 0, width: 28, height: 28 }}
            >
              {configCopied ? <Check size={13} style={{ color: 'var(--accent)' }} /> : <Copy size={13} />}
            </button>
          </div>

          <div style={{ background: 'var(--sunken)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                Agent key
              </span>
              <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.875rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                {maskedKey}
              </code>
            </div>
            <button
              className="icon-btn"
              aria-label={TOOLTIPS.fullKeyNotRecoverable}
              title={TOOLTIPS.fullKeyNotRecoverable}
              style={{ flexShrink: 0, width: 28, height: 28, opacity: 0.35, cursor: 'not-allowed' }}
              disabled
            >
              <Copy size={13} />
            </button>
          </div>
        </div>

        <div style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 14, display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          Showing key: <strong style={{ color: 'var(--text-primary)' }}>{selectedKey?.display_name ?? selectedKey?.agent_id ?? '—'}</strong>
          <Tooltip content={TOOLTIPS.switchKey}>
            <Link to="/dashboard/settings" style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", color: 'var(--accent)', textDecoration: 'none', marginLeft: 2 }}>
              Switch key →
            </Link>
          </Tooltip>
        </div>

        {selectedKey && (
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
            <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Need the full key? Create a new one in Settings — keys are shown only at creation time.
            </span>
            <Link to="/dashboard/settings" className="btn btn-ghost" style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
              Create key →
            </Link>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
          Runtime Configuration
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 8, borderBottom: '1px solid var(--border)' }}>
          {Object.keys(CLIENT_CONFIGS).map((client) => (
            <button
              key={client}
              onClick={() => setActiveClient(client)}
              className={'tab-btn' + (activeClient === client ? ' active' : '')}
            >
              {client}
            </button>
          ))}
        </div>
        <div
          style={{
            position: 'relative',
            background: 'var(--code-surface)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px 8px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: 'var(--code-muted)' }}>
              {CLIENT_CONFIGS[activeClient]?.file ?? 'config.json'}
            </span>
            <button
              onClick={() => copyToClipboard(currentConfig, setConfigCopied)}
              style={{
                background: 'rgba(28,28,26,0.8)',
                color: configCopied ? 'var(--code-accent)' : 'var(--code-text)',
                border: 'none',
                borderRadius: 4,
                padding: '4px 8px',
                fontFamily: "'Switzer', sans-serif",
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                opacity: configCopied ? 1 : 0.7,
                transition: 'opacity 150ms',
              }}
              aria-label="Copy MCP config"
            >
              {configCopied ? <Check size={12} /> : <Copy size={12} />}
              {configCopied ? CONFIRMATIONS.copied : BUTTONS.config.copyConfig}
            </button>
          </div>
          <pre style={{ margin: 0, padding: '12px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--code-text)', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {currentConfig}
          </pre>
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Replace <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>&lt;YOUR_API_KEY&gt;</code> with the key shown at creation time. Create a new key in Settings if you no longer have it.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
          After connecting, call <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>opticontext_guide</code> with <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>topic:"all"</code> to discover available capabilities and operational constraints.
        </p>
      </div>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: '1.375rem', color: 'var(--text-primary)', margin: '0 0 14px' }}>
          Usage today
        </h2>

        {usageError && (
          <div style={{ padding: '24px 0' }}>
            <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
              {OPERATIONAL.usageUnavailable}
            </p>
            <button onClick={refetchUsage} className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
              {BUTTONS.ghost.retry}
            </button>
          </div>
        )}

        {usageLoading && !usageError && (
          <div>
            <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              {LOADING.usageData}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }} className="usage-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ background: 'var(--raised)', borderRadius: 12, padding: '20px 24px' }}>
                  <Skeleton height="1rem" width="40%" />
                  <div style={{ marginTop: 8, marginBottom: 12 }}>
                    <Skeleton height="2rem" width="30%" />
                  </div>
                  <Skeleton height="0.75rem" width="50%" />
                  <div style={{ marginTop: 4 }}>
                    <Skeleton height="4px" width="100%" borderRadius="2px" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!usageLoading && !usageError && capabilities.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }} className="usage-grid">
              {capabilities.map((cap) => (
                <CapabilityBlock
                  key={cap.name}
                  name={cap.name}
                  count={cap.count}
                  status={cap.status}
                  telemetry={cap.telemetry}
                  description={cap.description}
                  statusTooltip={cap.statusTooltip}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, marginTop: 10 }}>
                  <Tooltip content={TOOLTIPS.totalRequestsToday}>
                    <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Total requests today: <strong style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: '1.125rem', color: 'var(--text-primary)' }}>{totalToday.toLocaleString()}</strong>
                    </span>
                  </Tooltip>
                  <Tooltip content={TOOLTIPS.totalRequestsMonth}>
                    <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Total requests this month: <strong style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: '1.125rem', color: 'var(--text-primary)' }}>{totalMonth.toLocaleString()}</strong>
                    </span>
                  </Tooltip>
            </div>
          </>
        )}
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: '1.375rem', color: 'var(--text-primary)', margin: '0 0 10px' }}>
          Recent activity
        </h2>

        {activityError && (
          <div style={{ padding: '24px 0' }}>
            <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
              {OPERATIONAL.activityUnavailable}
            </p>
            <button onClick={refetchActivity} className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
              {BUTTONS.ghost.retry}
            </button>
          </div>
        )}

        {activityLoading && !activityError && (
          <div>
            <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              {LOADING.activity}
            </p>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                <Skeleton width="80px" height="0.875rem" />
                <Skeleton width="120px" height="0.875rem" />
                <Skeleton width="100px" height="0.875rem" />
                <Skeleton width="60px" height="0.875rem" />
                <Skeleton width="50px" height="0.875rem" />
              </div>
            ))}
          </div>
        )}

        {!activityLoading && !activityError && activityRows.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Capability</th>
                  <th>Agent key</th>
                  <th>Status</th>
                  <th>Latency</th>
                </tr>
              </thead>
              <tbody>
                {activityRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span title={row.fullTime} style={{ cursor: 'help', color: 'var(--text-muted)' }}>
                        {row.time}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {row.capability}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {row.mcpTool}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: 'var(--text-secondary)' }} title={row.agentName}>
                        {row.agentKey}
                      </code>
                    </td>
                    <td>
                      <StatusChip
                        status={row.status === 'success' ? 'active' : 'incident'}
                        label={row.status === 'success' ? 'Success' : 'Error'}
                        tooltip={row.errorCode}
                      />
                    </td>
                    <td>
                      <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {row.latency !== null ? `${row.latency}ms` : '—'}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!activityLoading && !activityError && activityRows.length === 0 && (
          <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '1rem', color: 'var(--text-muted)' }}>
              {EMPTY_STATES.noActivity}
            </p>
          </div>
        )}

        {!activityLoading && activityRows.length > 0 && (
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Showing the last 10 capability calls across all agent keys.
          </p>
        )}
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
          {EMPTY_STATES.logExport}
        </p>
      </section>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/dashboard/settings" className="btn btn-ghost" style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 500, fontSize: '0.875rem', color: 'var(--accent)', textDecoration: 'none', padding: '8px 16px' }}>
          {BUTTONS.secondary.manageAgentKeys} {'\u2192'}
        </Link>
        <Link to="/docs/quickstart" className="btn btn-ghost" style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 500, fontSize: '0.875rem', color: 'var(--accent)', textDecoration: 'none', padding: '8px 16px' }}>
          {BUTTONS.secondary.viewQuickstart} {'\u2192'}
        </Link>
      </div>
      </>
      )}
    </div>
  );
}
