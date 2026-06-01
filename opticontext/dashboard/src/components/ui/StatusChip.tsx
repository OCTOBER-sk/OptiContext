import React from 'react';

type StatusType =
  | 'operational'
  | 'degraded'
  | 'reconnecting'
  | 'incident'
  | 'checking'
  | 'active'
  | 'no-activity'
  | 'rate-limited'
  | 'key-revoked'
  | 'initializing'
  | 'budget-guard'
  | 'cap-reached'
  | 'webhook-connected'
  | 'quota-warning'
  | 'near-summarization';

interface StatusChipProps {
  status: StatusType;
  label?: string;
  className?: string;
  tooltip?: string;
}

const chipConfig: Record<StatusType, { bg: string; text: string; dot: string; hasDot: boolean; animate?: boolean }> = {
  operational:   { bg: '#E8F4EE', text: '#1A6B4A', dot: '#1A6B4A', hasDot: true },
  degraded:      { bg: '#FFFBEB', text: '#B45309', dot: '#D97706', hasDot: true },
  reconnecting:  { bg: '#FFFBEB', text: '#B45309', dot: '#D97706', hasDot: true, animate: true },
  incident:      { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444', hasDot: true },
  checking:      { bg: 'transparent', text: '#8A8A82', dot: '#8A8A82', hasDot: true },
  active:        { bg: '#E8F4EE', text: '#1A6B4A', dot: '#1A6B4A', hasDot: true },
  'no-activity': { bg: '#EFECE4', text: '#8A8A82', dot: '#8A8A82', hasDot: false },
  'rate-limited':{ bg: '#FFFBEB', text: '#B45309', dot: '#D97706', hasDot: true },
  'key-revoked': { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444', hasDot: true },
  initializing:  { bg: '#EFECE4', text: '#8A8A82', dot: '#8A8A82', hasDot: true },
  'budget-guard':{ bg: '#E8F4EE', text: '#1A6B4A', dot: '#1A6B4A', hasDot: true },
  'cap-reached': { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444', hasDot: true },
  'webhook-connected': { bg: '#E8F4EE', text: '#1A6B4A', dot: '#1A6B4A', hasDot: true },
  'quota-warning': { bg: '#FFFBEB', text: '#B45309', dot: '#D97706', hasDot: true },
  'near-summarization': { bg: '#E8F4EE', text: '#1A6B4A', dot: '#1A6B4A', hasDot: true },
};

const defaultLabels: Record<StatusType, string> = {
  operational:      'Operational',
  degraded:         'Degraded',
  reconnecting:     'Reconnecting',
  incident:         'Incident',
  checking:         'Checking',
  active:           'Active',
  'no-activity':    'No activity',
  'rate-limited':   'Rate-limited',
  'key-revoked':    'Key revoked',
  initializing:     'Initializing',
  'budget-guard':   'Budget guard',
  'cap-reached':    'Cap reached',
  'webhook-connected': 'Webhook connected',
  'quota-warning':  'Quota warning',
  'near-summarization': 'Near summarization threshold',
};

export function StatusChip({ status, label, className = '', tooltip }: StatusChipProps) {
  const cfg = chipConfig[status];
  const displayLabel = label ?? defaultLabels[status];

  return (
    <span
      className={className}
      role="status"
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        borderRadius: 9999,
        background: cfg.bg,
        color: cfg.text,
        fontFamily: "'Switzer', Inter, system-ui, sans-serif",
        fontWeight: 500,
        fontSize: '0.75rem',
        whiteSpace: 'nowrap',
        cursor: tooltip ? 'help' : 'default',
      }}
    >
      {cfg.hasDot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: cfg.dot,
            display: 'inline-block',
            flexShrink: 0,
            ...(cfg.animate
              ? { animation: 'pulse-dot 800ms ease-in-out infinite' }
              : {}),
          }}
        />
      )}
      {displayLabel}
    </span>
  );
}
