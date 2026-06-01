import { useState, useEffect, useCallback } from 'react';
import { api, type AgentSummary } from '../lib/api';

export interface KeyEntry {
  agent_id: string;
  display_name: string;
  allowed_tools: string[];
  tier: string;
  created_at: string;
  last_used: string | null;
  revoked: boolean;
}

export interface ApiKeysState {
  keys: KeyEntry[];
  loading: boolean;
  error: string | null;
}

export function useApiKeys(): ApiKeysState & {
  refetch: () => void;
  createKey: (name: string) => Promise<{ key: string; agent_id: string }>;
  revokeKey: (agentId: string) => Promise<boolean>;
  renameKey: (agentId: string, newName: string) => Promise<boolean>;
} {
  const [state, setState] = useState<ApiKeysState>({
    keys: [],
    loading: true,
    error: null,
  });

  const fetchKeys = useCallback(async () => {
    try {
      const agents = await api.listAgents();
      const keys: KeyEntry[] = agents.map((a: AgentSummary) => ({
        agent_id: a.agent_id,
        display_name: a.display_name,
        allowed_tools: a.allowed_tools,
        tier: a.tier,
        created_at: a.created_at,
        last_used: a.last_used ?? null,
        revoked: Number(a.revoked) === 1,
      }));
      setState({ keys, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load keys';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const createKey = useCallback(async (name: string): Promise<{ key: string; agent_id: string }> => {
    const result = await api.createAgent({
      agent_id: name.trim(),
      display_name: name.trim(),
    });
    await fetchKeys();
    return { key: result.key, agent_id: result.agent_id };
  }, [fetchKeys]);

  const revokeKey = useCallback(async (agentId: string): Promise<boolean> => {
    await api.revokeAgent(agentId);
    await fetchKeys();
    return true;
  }, [fetchKeys]);

  const renameKey = useCallback(async (agentId: string, newName: string): Promise<boolean> => {
    await api.renameAgent(agentId, newName);
    await fetchKeys();
    return true;
  }, [fetchKeys]);

  return { ...state, refetch: fetchKeys, createKey, revokeKey, renameKey };
}
