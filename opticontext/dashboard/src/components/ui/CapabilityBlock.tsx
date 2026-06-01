import React from 'react';
import { StatusChip } from './StatusChip';

interface TelemetryLine {
  label: string;
  value: React.ReactNode;
  tooltip?: string;
}

interface CapabilityBlockProps {
  name: string;
  count: number;
  status: 'active' | 'no-activity' | 'rate-limited' | 'budget-guard' | 'quota-warning';
  telemetry: TelemetryLine[];
  description?: string;
  statusTooltip?: string;
  children?: React.ReactNode;
}

export function CapabilityBlock({
  name,
  count,
  status,
  telemetry,
  description,
  statusTooltip,
  children,
}: CapabilityBlockProps) {
  return (
    <div
      style={{
        background: 'var(--raised)',
        borderTop: '2px solid var(--border-accent)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h3 style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: '1.75rem', color: 'var(--text-primary)', margin: 0 }}>
          {name}
        </h3>
        <StatusChip status={status} tooltip={statusTooltip} />
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
        <span style={{ fontFamily: "'Zodiak', Georgia, serif", fontWeight: 400, fontSize: '2.25rem', color: 'var(--text-primary)', lineHeight: 1 }}>
          {count}
        </span>
        <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          calls today
        </span>
      </div>

      {description && status === 'no-activity' && (
        <p style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 280, margin: '0 0 12px', lineHeight: 1.5 }}>
          {description}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {telemetry.map((line) => (
          <div key={line.label} title={line.tooltip} style={{ cursor: line.tooltip ? 'help' : 'default' }}>
            <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 1 }}>
              {line.label}
            </span>
            <span style={{ fontFamily: "'Switzer', Inter, system-ui, sans-serif", fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {line.value}
            </span>
          </div>
        ))}
      </div>

      {children}
    </div>
  );
}
