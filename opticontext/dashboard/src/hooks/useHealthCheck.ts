import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';

export type HealthStatus = 'operational' | 'degraded' | 'reconnecting' | 'incident' | 'checking';

export interface HealthState {
  status: HealthStatus;
  lastChecked: Date | null;
}

export function useHealthCheck(): HealthState {
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const mountedRef = useRef(true);
  const failedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const check = async () => {
      try {
        const health = await api.getHealth();
        if (!mountedRef.current) return;
        failedRef.current = false;
        setStatus(health.status === 'ok' || health.status === 'healthy' ? 'operational' : 'degraded');
        setLastChecked(new Date());
      } catch {
        if (!mountedRef.current) return;
        if (failedRef.current) {
          setStatus('incident');
        } else {
          setStatus('reconnecting');
          failedRef.current = true;
        }
        setLastChecked(new Date());
      }
    };
    check();
    const interval = window.setInterval(check, 60000);
    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
    };
  }, []);

  return { status, lastChecked };
}
