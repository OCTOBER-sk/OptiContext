import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_BASE || "https://opticontext.yourworker.workers.dev";

async function getAuthToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

async function fetchApi(
  path: string,
  options: RequestInit = {},
  isAdmin = false,
): Promise<unknown> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string> | undefined),
  };

  if (isAdmin) {
    headers["X-OptiContext-Admin"] = "1";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    let errMsg: string;
    try {
      const parsed = JSON.parse(text) as { error?: string; message?: string };
      errMsg = parsed.message ?? parsed.error ?? `HTTP ${response.status}`;
    } catch {
      errMsg = `HTTP ${response.status}: ${text.slice(0, 200)}`;
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export interface AgentSummary {
  agent_id: string;
  display_name: string;
  allowed_tools: string[];
  tier: string;
  created_at: string;
  revoked: number;
  last_used?: string | null;
}

export interface LogEntry {
  id?: string;
  agent_id: string;
  tool_name: string;
  timestamp: string;
  latency_ms: number;
  success: boolean | number;
  error_code?: string;
  tokens_used: number;
}

export const api = {
  async getHealth(): Promise<{ status: string; version: string; uptime_seconds: number }> {
    const response = await fetch(`${API_BASE}/health`);
    return response.json() as Promise<{ status: string; version: string; uptime_seconds: number }>;
  },

  async getUsage(agentId: string): Promise<{
    today_requests: number;
    monthly_requests: number;
    monthly_tokens: number;
    tool_breakdown: Record<string, { count: number; tokens: number }>;
    provider_breakdown: { provider: string; count: number }[];
    key_status: { created_at: string; last_used: string | null; revoked: boolean } | null;
  }> {
    return fetchApi(`/usage?agent_id=${encodeURIComponent(agentId)}`, {}, true) as Promise<{
      today_requests: number;
      monthly_requests: number;
      monthly_tokens: number;
      tool_breakdown: Record<string, { count: number; tokens: number }>;
      provider_breakdown: { provider: string; count: number }[];
      key_status: { created_at: string; last_used: string | null; revoked: boolean } | null;
    }>;
  },

  async createAgent(data: {
    agent_id: string;
    display_name: string;
    owner_email?: string;
    allowed_tools?: string[];
    tier?: string;
    requests_per_minute?: number;
    daily_cap?: number;
  }): Promise<{ key: string; agent_id: string; display_name: string; allowed_tools: string[] }> {
    return fetchApi(
      "/admin/agents",
      { method: "POST", body: JSON.stringify(data) },
      true,
    ) as Promise<{ key: string; agent_id: string; display_name: string; allowed_tools: string[] }>;
  },

  async listAgents(): Promise<AgentSummary[]> {
    const result = await fetchApi("/admin/agents", {}, true) as { agents: AgentSummary[] };
    return result.agents ?? [];
  },

  async revokeAgent(agentId: string): Promise<void> {
    await fetchApi(`/admin/agents/${agentId}/revoke`, { method: "POST" }, true);
  },

  async renameAgent(agentId: string, displayName: string): Promise<void> {
    await fetchApi(
      `/admin/agents/${agentId}/rename`,
      { method: "POST", body: JSON.stringify({ display_name: displayName }) },
      true,
    );
  },

  async getLogs(params?: {
    agent?: string;
    tool?: string;
    status?: string;
    limit?: number;
  }): Promise<LogEntry[]> {
    const query = new URLSearchParams();
    if (params?.agent) query.set("agent", params.agent);
    if (params?.tool) query.set("tool", params.tool);
    if (params?.status) query.set("status", params.status);
    if (params?.limit) query.set("limit", params.limit.toString());

    const result = await fetchApi(`/admin/logs?${query.toString()}`, {}, true) as {
      logs: LogEntry[];
    };
    return result.logs ?? [];
  },

  async getUserActivity(agentId: string, limit = 10): Promise<LogEntry[]> {
    const result = await fetchApi(
      `/usage/activity?agent_id=${encodeURIComponent(agentId)}&limit=${limit}`,
      {},
      true,
    ) as { logs: LogEntry[] };
    return result.logs ?? [];
  },
};
