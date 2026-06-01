import { useState, useEffect, useCallback } from 'react';
import { api, type LogEntry } from '../lib/api';

export interface ActivityRow {
  id: string;
  time: string;
  fullTime: string;
  capability: string;
  mcpTool: string;
  agentKey: string;
  agentName: string;
  status: 'success' | 'error';
  errorCode?: string;
  latency: number | null;
}

export interface ActivityState {
  rows: ActivityRow[];
  loading: boolean;
  error: string | null;
}

const MCP_TOOL_TO_CAPABILITY: Record<string, string> = {
  opticontext_search: 'IntelliSearch',
  opticontext_tts: 'VoiceBridge',
  opticontext_analyze: 'DeepDoc',
  opticontext_memory_write: 'MemoryCore',
  opticontext_memory_search: 'MemoryCore',
};

function maskKey(agentId: string): string {
  if (agentId.length <= 3) return `opctx_█`;
  return `opctx_████\u2026${agentId.slice(-4)}`;
}

function formatRelativeTime(isoString: string): { text: string; full: string } {
  const time = new Date(isoString);
  const fullTime = time.toISOString();
  const diff = Date.now() - time.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return { text: 'Just now', full: fullTime };
  if (mins < 60) return { text: `${mins} min ago`, full: fullTime };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { text: `${hours} hr ago`, full: fullTime };
  const days = Math.floor(hours / 24);
  return { text: `${days} day${days > 1 ? 's' : ''} ago`, full: fullTime };
}

function mapRow(log: LogEntry & { id?: string | number }, index: number): ActivityRow {
  const time = formatRelativeTime(log.timestamp ?? '');
  return {
    id: String(log.id ?? index),
    time: time.text,
    fullTime: time.full,
    capability: MCP_TOOL_TO_CAPABILITY[log.tool_name] ?? log.tool_name,
    mcpTool: log.tool_name,
    agentKey: maskKey(log.agent_id),
    agentName: log.agent_id,
    status: log.success ? 'success' : 'error',
    errorCode: log.error_code,
    latency: log.latency_ms ?? null,
  };
}

export function useActivityData(agentId: string | null): ActivityState & { refetch: () => void } {
  const [state, setState] = useState<ActivityState>({
    rows: [],
    loading: true,
    error: null,
  });

  const fetchActivity = useCallback(async () => {
    if (!agentId) {
      setState({ rows: [], loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const logs = await api.getUserActivity(agentId, 10);
      const rows = logs.map((log, i) => mapRow(log, i));
      setState({ rows, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Activity data unavailable. Could not load recent capability calls.';
      setState((prev) => ({ rows: prev.rows, loading: false, error: message }));
    }
  }, [agentId]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  return { ...state, refetch: fetchActivity };
}
