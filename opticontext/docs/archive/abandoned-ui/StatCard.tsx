import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  label: string;
  metric?: string;
  subtext?: string;
  delta?: string;
  deltaDirection?: 'up' | 'down' | 'neutral';
  deltaColor?: 'signal' | 'red';
  sparkline?: React.ReactNode;
  sparklineData?: number[];
  icon?: React.ReactNode;
  chart?: React.ReactNode;
  delay?: number;
}

function SparklineInline({ data }: { data: number[] }) {
  const d = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={24}>
      <AreaChart data={d} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Area type="monotone" dataKey="v" stroke="#22C55E" strokeWidth={1.5} fill="none" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StatCard({ label, metric, subtext, delta, deltaDirection = 'up', deltaColor = 'signal', sparkline, sparklineData, icon, chart, delay = 0 }: StatCardProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  const deltaIcon =
    deltaDirection === 'up'  ? <ArrowUpRight size={12} /> :
    deltaDirection === 'down' ? <ArrowDownRight size={12} /> :
    <Minus size={12} />;

  return (
    <div
      className="card-metric"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity 400ms ease, transform 400ms cubic-bezier(0.16,1,0.3,1)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {metric && (
            <p
              style={{
                fontFamily: "'Geist', sans-serif",
                fontWeight: 700,
                fontSize: '2.4rem',
                color: 'var(--text-primary)',
                lineHeight: 1,
                margin: 0,
              }}
            >
              {metric}
            </p>
          )}
          {subtext && (
            <p
              style={{
                fontFamily: "'Geist', sans-serif",
                fontWeight: 400,
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: '4px 0 0',
              }}
            >
              {subtext}
            </p>
          )}
          {delta && (
            <p
              style={{
                fontFamily: "'Geist', sans-serif",
                fontWeight: 500,
                fontSize: '0.75rem',
                color: deltaColor === 'signal' ? 'var(--signal-text)' : 'var(--status-red)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                marginTop: metric || subtext ? 4 : 0,
              }}
            >
              {deltaIcon}
              {delta}
            </p>
          )}
        </div>
        {icon && (
          <span style={{ color: 'var(--signal-text)' }} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <p
        style={{
          fontFamily: "'Geist', sans-serif",
          fontWeight: 400,
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          margin: '8px 0 0',
        }}
      >
        {label}
      </p>
      {sparklineData && (
        <div style={{ marginTop: 8, height: 24 }}>
          <SparklineInline data={sparklineData} />
        </div>
      )}
      {sparkline && (
        <div style={{ marginTop: 8, height: 24 }}>{sparkline}</div>
      )}
      {chart && (
        <div style={{ marginTop: 8 }}>{chart}</div>
      )}
    </div>
  );
}
