import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Copy, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { AuthUser } from '../../lib/supabase';
import { Tooltip } from '../../components/ui/Tooltip';
import { InlineConfirm } from '../../components/ui/InlineConfirm';
import { StatusChip } from '../../components/ui/StatusChip';
import { Skeleton } from '../../components/ui/Skeleton';
import { useApiKeys } from '../../hooks/useApiKeys';
import { VALIDATION } from '../../lib/validation';
import SetupPrompt from '../../components/ui/SetupPrompt';
import { BUTTONS, LOADING, CONFIRMATIONS, EMPTY_STATES, TOOLTIPS, OPERATIONAL } from '../../lib/microcopy';

interface SettingsProps {
  user: AuthUser | null;
}

function maskAgentId(agentId: string): string {
  const reveal = Math.min(5, Math.floor(agentId.length / 2));
  const prefix = agentId.slice(0, reveal);
  const suffix = agentId.slice(-reveal);
  return `opctx_${prefix}_${'\u2588'.repeat(24)}${suffix}`;
}

export default function Settings({ user }: SettingsProps) {
  const navigate = useNavigate();
  const userEmail = user?.email ?? 'user@example.com';

  const { keys, loading: keysLoading, createKey: apiCreateKey, revokeKey: apiRevokeKey, renameKey: apiRenameKey } = useApiKeys();

  const [newKeyName, setNewKeyName] = useState('');
  const [keyNameError, setKeyNameError] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [newKeyCopied, setNewKeyCopied] = useState(false);
  const [dismissedReveal, setDismissedReveal] = useState(false);
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeError, setRevokeError] = useState('');
  const [revokeConfirmed, setRevokeConfirmed] = useState<string | null>(null);
  const [renamingKeyId, setRenamingKeyId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState('');
  const [renameSaved, setRenameSaved] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);
  const [generatingText, setGeneratingText] = useState(false);
  const [threshold, setThreshold] = useState('80');
  const [thresholdError, setThresholdError] = useState('');
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [webhookError, setWebhookError] = useState('');
  const [comingSoonMsg, setComingSoonMsg] = useState(false);

  const showComingSoon = () => {
    setComingSoonMsg(true);
    window.setTimeout(() => setComingSoonMsg(false), 3000);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    window.setTimeout(() => setCopiedKeyId(null), 1500);
  };

  const validateKeyName = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return VALIDATION.keyName.empty;
    if (trimmed.length > 48) return VALIDATION.keyName.tooLong;
    if (!/^[a-z0-9_-]+$/.test(trimmed)) return VALIDATION.keyName.invalidChars;
    if (keys.some((k) => k.display_name === trimmed || k.agent_id === trimmed)) return VALIDATION.keyName.duplicate;
    return '';
  };

  const createKey = async () => {
    const error = validateKeyName(newKeyName);
    setKeyNameError(error);
    if (error) return;

    setCreatingKey(true);
    setGeneratingText(true);

    try {
      const result = await apiCreateKey(newKeyName.trim());
      setNewKeyName('');
      setKeyNameError('');
      setNewlyCreatedKey(result.key);
      setNewKeyCopied(false);
      setDismissedReveal(false);
      setCreatingKey(false);
      setGeneratingText(false);
    } catch (err) {
      setKeyNameError(err instanceof Error ? err.message : 'Failed to create key');
      setCreatingKey(false);
      setGeneratingText(false);
    }
  };

  const validateRename = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return VALIDATION.inlineRename.empty;
    if (trimmed.length > 48) return VALIDATION.inlineRename.tooLong;
    if (!/^[a-z0-9_-]+$/.test(trimmed)) return VALIDATION.inlineRename.invalidChars;
    if (keys.some((k) => k.display_name === trimmed)) return VALIDATION.inlineRename.duplicate;
    return '';
  };

  const startRename = (agentId: string, currentName: string) => {
    setRenamingKeyId(agentId);
    setRenameValue(currentName);
    setRenameError('');
  };

  const saveRename = async (agentId: string) => {
    const trimmed = renameValue.trim();
    const error = validateRename(renameValue);
    if (error) { setRenameError(error); return; }
    if (!trimmed || trimmed.length > 48) return;
    try {
      await apiRenameKey(agentId, trimmed);
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Failed to rename');
      return;
    }
    setRenamingKeyId(null);
    setRenameValue('');
    setRenameSaved(agentId);
    window.setTimeout(() => setRenameSaved(null), 1500);
  };

  const cancelRename = () => {
    setRenamingKeyId(null);
    setRenameValue('');
    setRenameError('');
  };

  const handleRevoke = async (agentId: string) => {
    setRevokeLoading(true);
    setRevokeError('');
    try {
      await apiRevokeKey(agentId);
      setRevokeLoading(false);
      setRevokeKeyId(null);
      setRevokeConfirmed(agentId);
      window.setTimeout(() => setRevokeConfirmed(null), 3000);
    } catch (err) {
      setRevokeError(err instanceof Error ? err.message : OPERATIONAL.revokeFailed);
      setRevokeLoading(false);
    }
  };

  const handleSaveThreshold = () => {
    setThresholdError('');
    showComingSoon();
  };

  const handleSaveWebhook = () => {
    setWebhookError('');
    showComingSoon();
  };

  const handleTestMessage = () => {
    showComingSoon();
  };

  const nonRevokedKeys = keys.filter((k) => !k.revoked);

  return (
    <div>
      <h1 style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', color: 'var(--text-primary)', marginBottom: 32 }}>
        Settings
      </h1>

      <section style={{ marginBottom: 0 }}>
        <h2 style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: '1.75rem', color: 'var(--text-primary)', paddingTop: 32, borderTop: '1px solid var(--border)', margin: 0 }}>
          Agent Keys
        </h2>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '1rem', color: 'var(--text-secondary)', marginTop: 6, marginBottom: 24 }}>
          Each runtime should use its own agent key. Revoke individually if a key is compromised.
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }} className="settings-inline-form">
          <div style={{ flex: 1, maxWidth: 280 }}>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => { setNewKeyName(e.target.value); setKeyNameError(''); }}
              placeholder="e.g. claude-code-local"
              className={'input' + (keyNameError ? ' error' : '')}
              onKeyDown={(e) => e.key === 'Enter' && createKey()}
              disabled={creatingKey}
              aria-invalid={!!keyNameError}
              style={{ maxWidth: 280 }}
            />
            {keyNameError && (
              <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--error)', marginTop: 6, margin: '6px 0 0' }}>
                {keyNameError}
              </p>
            )}
          </div>
          <button onClick={createKey} className="btn btn-primary" disabled={creatingKey} style={{ opacity: creatingKey ? 0.65 : 1 }}>
            {generatingText ? 'Generating key' : BUTTONS.primary.createKey}
          </button>
        </div>

        {newlyCreatedKey && !dismissedReveal && (
          <div style={{ marginBottom: 20, padding: '14px 18px', background: 'var(--sunken)', border: '1px solid var(--border-accent)', borderRadius: 8 }}>
            <h3 style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: '1.375rem', color: 'var(--text-primary)', margin: '0 0 8px' }}>
              {CONFIRMATIONS.keyCreated}
            </h3>
            <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '1rem', color: 'var(--warning)', margin: '0 0 12px', fontWeight: 500 }}>
              {OPERATIONAL.keyRevealWarning}
            </p>
            <code style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.875rem', color: 'var(--text-primary)', background: 'var(--base)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', wordBreak: 'break-all', marginBottom: 12 }}>
              {newlyCreatedKey}
            </code>
            <SetupPrompt apiKey={newlyCreatedKey} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                onClick={() => { copyToClipboard(newlyCreatedKey, 'newly-created'); setNewKeyCopied(true); }}
                className="btn btn-primary"
                style={{ fontSize: '0.875rem', padding: '10px 20px' }}
              >
                {newKeyCopied ? CONFIRMATIONS.copied : BUTTONS.primary.copyKeyRevealed}
              </button>
              <button onClick={() => setDismissedReveal(true)} className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
                {BUTTONS.ghost.dismissKeyReveal}
              </button>
            </div>
          </div>
        )}

        {nonRevokedKeys.length >= 10 && (
          <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--warning)', margin: 0 }}>
              {OPERATIONAL.maxKeysReached}
            </p>
          </div>
        )}

        {keysLoading ? (
          <div>
            <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              {LOADING.keys}
            </p>
            {[1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                <Skeleton width="120px" height="0.875rem" />
                <Skeleton width="200px" height="0.875rem" />
                <Skeleton width="80px" height="0.875rem" />
                <Skeleton width="80px" height="0.875rem" />
                <Skeleton width="60px" height="0.875rem" />
              </div>
            ))}
          </div>
        ) : nonRevokedKeys.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key</th>
                  <th>Created</th>
                  <th>Last used</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {nonRevokedKeys.map((key) => (
                  <React.Fragment key={key.agent_id}>
                    <tr>
                      <td style={{ fontWeight: 500 }}>
                        {renamingKeyId === key.agent_id ? (
                          <div>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <input
                                className={'input' + (renameError ? ' error' : '')}
                                value={renameValue}
                                onChange={(e) => { setRenameValue(e.target.value); setRenameError(''); }}
                                style={{ maxWidth: 200, fontSize: '0.875rem', padding: '6px 10px' }}
                                onKeyDown={(e) => e.key === 'Enter' && saveRename(key.agent_id)}
                                autoFocus
                                aria-invalid={!!renameError}
                              />
                              <Tooltip content="Confirm">
                                <button onClick={() => saveRename(key.agent_id)} className="icon-btn" aria-label="Confirm rename">
                                  <Check size={14} style={{ color: 'var(--accent)' }} />
                                </button>
                              </Tooltip>
                              <Tooltip content="Cancel">
                                <button onClick={cancelRename} className="icon-btn" aria-label="Cancel rename">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </button>
                              </Tooltip>
                            </div>
                            {renameError && (
                              <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.8125rem', color: 'var(--error)', margin: '4px 0 0' }}>
                                {renameError}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span style={key.revoked ? { textDecoration: 'line-through', opacity: 0.5 } : {}}>
                            {key.display_name}
                          </span>
                        )}
                        {renameSaved === key.agent_id && (
                          <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: 8, animation: 'fadeIn 200ms ease both' }}>
                            {CONFIRMATIONS.saved}
                          </span>
                        )}
                      </td>
                      <td>
                        {key.revoked ? (
                          <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 500, fontSize: '0.75rem', color: 'var(--error)' }}>
                            Revoked
                          </span>
                        ) : (
                          <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: 'var(--text-muted)' }} title={TOOLTIPS.fullKeyNotRecoverable}>
                            {maskAgentId(key.agent_id)}
                          </code>
                        )}
                      </td>
                      <td>
                        <span title={key.created_at} style={{ color: 'var(--text-secondary)', cursor: 'help' }}>
                          {key.created_at ? new Date(key.created_at).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {key.last_used ?? '—'}
                      </td>
                      <td>
                        {key.revoked ? (
                          <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 500, fontSize: '0.75rem', color: 'var(--error)' }}>
                            Revoked
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <Tooltip content="Copy key name">
                              <button
                                onClick={() => copyToClipboard(key.display_name, `name-${key.agent_id}`)}
                                className="icon-btn"
                                aria-label="Copy key name"
                                style={{ width: 32, height: 32 }}
                              >
                                {copiedKeyId === `name-${key.agent_id}` ? <Check size={13} style={{ color: 'var(--accent)' }} /> : <Copy size={13} />}
                              </button>
                            </Tooltip>
                            <Tooltip content="Rename key">
                              <button
                                onClick={() => startRename(key.agent_id, key.display_name)}
                                className="icon-btn"
                                aria-label="Rename key"
                                style={{ width: 32, height: 32 }}
                              >
                                <Pencil size={13} />
                              </button>
                            </Tooltip>
                            <Tooltip content="Revoke key">
                              <button
                                onClick={() => { setRevokeKeyId(revokeKeyId === key.agent_id ? null : key.agent_id); setRevokeError(''); }}
                                className="icon-btn"
                                aria-label="Revoke key"
                                style={{ width: 32, height: 32 }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                              >
                                <Trash2 size={13} />
                              </button>
                            </Tooltip>
                          </div>
                        )}
                      </td>
                    </tr>
                    {revokeKeyId === key.agent_id && (
                      <tr>
                        <td colSpan={5} style={{ padding: 0 }}>
                          <InlineConfirm
                            open={true}
                            title={`Revoke ${key.display_name}?`}
                            description="Any runtime using this key loses access immediately. This cannot be undone. The key cannot be restored."
                            confirmLabel={BUTTONS.destructive.revoke}
                            loadingLabel={LOADING.revoking}
                            onConfirm={() => handleRevoke(key.agent_id)}
                            onCancel={() => { setRevokeKeyId(null); setRevokeError(''); }}
                            loading={revokeLoading}
                            error={revokeError}
                            destructive
                            onRetry={revokeError ? () => handleRevoke(key.agent_id) : undefined}
                          />
                        </td>
                      </tr>
                    )}
                    {revokeConfirmed === key.agent_id && (
                      <tr>
                        <td colSpan={5} style={{ padding: '4px 12px' }}>
                          <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', animation: 'fadeIn 200ms ease both' }}>
                            {CONFIRMATIONS.keyRevoked}
                          </span>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '1rem', color: 'var(--text-muted)' }}>
              {EMPTY_STATES.noKeysSettings}
            </p>
          </div>
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: '1.75rem', color: 'var(--text-primary)', paddingTop: 32, borderTop: '1px solid var(--border)', margin: 0 }}>
          Usage Alerts
        </h2>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '1rem', color: 'var(--text-secondary)', marginTop: 6, marginBottom: 20 }}>
          Receive a Telegram message before reaching the daily capability limit.
        </p>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 8, display: 'block' }}>
            Alert when daily usage reaches
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="number"
              value={threshold}
              onChange={(e) => { setThreshold(e.target.value); setThresholdError(''); }}
              min={50}
              max={95}
              className={'input' + (thresholdError ? ' error' : '')}
              style={{ width: 72, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '1rem', padding: '10px 14px' }}
            />
            <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              % of daily limit
            </span>
            <button onClick={handleSaveThreshold} className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
              Save threshold
            </button>
          </div>
          {thresholdError && (
            <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--error)', marginTop: 6 }}>
              {thresholdError}
            </p>
          )}
          {comingSoonMsg && (
            <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 6, animation: 'fadeIn 200ms ease both' }}>
              Coming soon — usage alerts will be available in a future update.
            </p>
          )}
        </div>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {OPERATIONAL.alertsContext}
        </p>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: '1.75rem', color: 'var(--text-primary)', paddingTop: 32, borderTop: '1px solid var(--border)', margin: 0 }}>
          Telegram Alerts
        </h2>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '1rem', color: 'var(--text-secondary)', marginTop: 6, marginBottom: 4 }}>
          Connect a Telegram bot to receive usage alerts and budget guard notifications.
        </p>
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          {EMPTY_STATES.noTelegram}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480, marginBottom: 16 }}>
          <div>
            <label style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
              Telegram Bot Token
            </label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="1234567890:AAAA..."
              className="input"
            />
          </div>
          <div>
            <label style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
              Chat ID
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="-100123456789"
              className="input"
              style={{ maxWidth: 240 }}
            />
            <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 6 }}>
              Negative IDs indicate a group or channel. Positive IDs indicate a direct chat.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <button onClick={handleSaveWebhook} className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
            Save webhook
          </button>
          {comingSoonMsg && (
            <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)', animation: 'fadeIn 200ms ease both' }}>
              Coming soon — Telegram alerts will be available in a future update.
            </span>
          )}
          <button
            onClick={handleTestMessage}
            className="btn btn-ghost"
            style={{ fontSize: '0.875rem' }}
          >
            Send test message
          </button>
        </div>

        {webhookError && (
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--error)', marginBottom: 8 }}>
            {webhookError}
          </p>
        )}
        <Link to="/docs/troubleshooting" style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', marginTop: 8 }}>
          How to set up a Telegram bot →
        </Link>
      </section>

      <section style={{ marginTop: 40, marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: '1.75rem', color: 'var(--text-primary)', paddingTop: 32, borderTop: '1px solid var(--border)', margin: 0 }}>
          Account
        </h2>

        <div style={{ marginTop: 20 }}>
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
            Email
          </p>
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
            {userEmail}
          </p>
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 16, marginBottom: 4 }}>
            Sign-in method
          </p>
          <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '1rem', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.58l7.98-5.99z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.99C6.51 42.62 14.62 48 24 48z"/></svg>
            Google
          </p>

          <button
            onClick={async () => { await supabase.auth.signOut(); navigate('/'); }}
            className="btn btn-ghost"
            style={{ marginTop: 24, padding: '8px 12px', fontSize: '0.875rem' }}
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}
