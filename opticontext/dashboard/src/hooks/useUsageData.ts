import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface CapabilityUsage {
  name: string;
  count: number;
  status: 'active' | 'no-activity' | 'rate-limited' | 'budget-guard' | 'quota-warning';
  telemetry: { label: string; value: string; tooltip?: string }[];
  description?: string;
  statusTooltip?: string;
}

export interface UsageState {
  capabilities: CapabilityUsage[];
  totalToday: number;
  totalMonth: number;
  dailyCapPercent: number;
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

const CAPABILITY_CONFIGS: Record<string, { description: string }> = {
  IntelliSearch: {
    description: 'IntelliSearch routes web search queries through multiple providers with automatic fallback before any provider\'s monthly credit limit is reached.',
  },
  VoiceBridge: {
    description: 'VoiceBridge streams synthesized audio across 48 voices and 8 languages. Repeated synthesis requests are served from cache, bypassing the provider entirely.',
  },
  DeepDoc: {
    description: 'DeepDoc uploads files for analysis and routes through the appropriate model based on file complexity. The 2M token context window handles entire codebases and multi-format documents.',
  },
  MemoryCore: {
    description: 'MemoryCore stores and retrieves context using semantic embeddings. Each agent key has an isolated memory store partitioned by namespace. Memories persist across agent sessions.',
  },
};

export function useUsageData(agentId: string | null): UsageState & { refetch: () => void } {
  const [state, setState] = useState<UsageState>({
    capabilities: [],
    totalToday: 0,
    totalMonth: 0,
    dailyCapPercent: 0,
    loading: true,
    error: null,
  });

  const fetchUsage = useCallback(async () => {
    if (!agentId) {
      setState((prev) => ({ ...prev, loading: false, error: null, capabilities: [] }));
      return;
    }
    try {
      const data = await api.getUsage(agentId);
      const toolBreakdown = data.tool_breakdown ?? {};

      const capAggregate: Record<string, { count: number; tokens: number }> = {};
      for (const [toolName, toolData] of Object.entries(toolBreakdown)) {
        const capName = MCP_TOOL_TO_CAPABILITY[toolName];
        if (!capName) continue;
        const count = typeof toolData === 'number' ? toolData : (toolData?.count ?? 0);
        if (!capAggregate[capName]) capAggregate[capName] = { count: 0, tokens: 0 };
        capAggregate[capName].count += count;
        const toolTokens = typeof toolData === 'object' ? (toolData?.tokens ?? 0) : 0;
        capAggregate[capName].tokens += toolTokens;
      }

      const DEFAULT_DAILY_CAP = 500;

      const capabilities = Object.entries(CAPABILITY_CONFIGS).map(([name, cfg]) => {
        const agg = capAggregate[name] ?? { count: 0, tokens: 0 };
        const count = agg.count;

        let status: CapabilityUsage['status'] = count === 0 ? 'no-activity' : 'active';

        const telemetry: { label: string; value: string; tooltip?: string }[] = [];

        if (count > 0 && agg.tokens > 0) {
          telemetry.push({ label: 'Tokens used', value: agg.tokens.toLocaleString(), tooltip: 'Total token consumption for this capability across all calls today' });
        }

        let statusTooltip: string | undefined;
        if (status === 'active') statusTooltip = 'This capability received calls in the last 24 hours';
        else if (status === 'no-activity') statusTooltip = 'No capability calls today';

        return { name, count, status, telemetry, description: cfg.description, statusTooltip };
      });

      const today = data.today_requests ?? capabilities.reduce((s, c) => s + c.count, 0);
      const month = data.monthly_requests ?? today;
      const capPercent = Math.min(100, Math.round((today / DEFAULT_DAILY_CAP) * 100));

      setState({ capabilities, totalToday: today, totalMonth: month, dailyCapPercent: capPercent, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Usage data unavailable';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [agentId]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  return { ...state, refetch: fetchUsage };
}
