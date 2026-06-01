import { getEnv } from "../context";
import { logger } from "../utils/logger";

interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string; code: string } | null;
}

async function fetchSupabase<T>(
  path: string,
  options: RequestInit = {},
): Promise<SupabaseResponse<T>> {
  const env = getEnv();
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    return {
      data: null,
      error: { message: "Supabase not configured", code: "CONFIG" },
    };
  }

  try {
    const response = await fetch(`${url}/rest/v1/${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=representation",
        ...(options.headers as Record<string, string> | undefined),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        data: null,
        error: { message: text, code: response.status.toString() },
      };
    }

    const data = await response.json();
    return { data: data as T, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : "Unknown error",
        code: "FETCH_ERROR",
      },
    };
  }
}

export interface AgentProfile {
  agent_id: string;
  display_name: string;
  owner_email?: string;
  allowed_tools: string[];
  tier: string;
  settings: Record<string, unknown>;
}

export interface MemoryEmbedding {
  id?: string;
  agent_id: string;
  content_text: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  importance_score: number;
  namespace: string;
  created_at?: string;
  expires_at?: string | null;
}

export interface MemoryEntry {
  id?: string;
  agent_id: string;
  namespace: string;
  content: string;
  source_tool?: string;
  importance_score: number;
  created_at?: string;
  expires_at?: string | null;
}

export const supabase = {
  async getAgentProfile(agent_id: string): Promise<AgentProfile | null> {
    const result = await fetchSupabase<AgentProfile[]>(
      `agent_profiles?agent_id=eq.${encodeURIComponent(agent_id)}&select=*`,
    );
    if (result.error || !result.data || result.data.length === 0) return null;
    return result.data[0];
  },

  async upsertAgentProfile(profile: AgentProfile): Promise<boolean> {
    const result = await fetchSupabase("agent_profiles", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(profile),
    });
    return !result.error;
  },

  async insertMemoryEmbedding(
    embedding: Omit<MemoryEmbedding, "id" | "created_at">,
  ): Promise<string | null> {
    // pgvector REST API expects vector as string: "[0.1,0.2,...]"
    const body = {
      ...embedding,
      embedding: embedding.embedding ? `[${embedding.embedding.join(',')}]` : undefined,
    };
    const result = await fetchSupabase<MemoryEmbedding[]>(
      "memory_embeddings",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
    if (result.error) {
      logger.error("[Supabase] insertMemoryEmbedding failed", {
        error: result.error.message,
        code: result.error.code,
        agent_id: embedding.agent_id,
        namespace: embedding.namespace,
      });
      return null;
    }
    if (!result.data || result.data.length === 0) {
      logger.warn("[Supabase] insertMemoryEmbedding returned empty data", {
        agent_id: embedding.agent_id,
        namespace: embedding.namespace,
      });
      return null;
    }
    return result.data[0].id ?? null;
  },

  async searchMemoryEmbeddings(
    agent_id: string,
    queryEmbedding: number[],
    namespace: string = "general",
    top_k: number = 5,
    min_similarity: number = 0.7,
  ): Promise<MemoryEmbedding[]> {
    // pgvector REST API expects vector as string: "[0.1,0.2,...]"
    const rpcBody = {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_count: top_k,
      match_threshold: min_similarity,
      p_agent_id: agent_id,
      p_namespace: namespace,
    };

    const result = await fetchSupabase<MemoryEmbedding[]>(
      "rpc/match_memories",
      {
        method: "POST",
        body: JSON.stringify(rpcBody),
      },
    );

    return result.data ?? [];
  },

  async insertMemoryEntry(
    entry: Omit<MemoryEntry, "id" | "created_at">,
  ): Promise<string | null> {
    const result = await fetchSupabase<MemoryEntry[]>(
      "memory_entries",
      {
        method: "POST",
        body: JSON.stringify(entry),
      },
    );
    if (result.error) {
      logger.error("[Supabase] insertMemoryEntry failed", {
        error: result.error.message,
        code: result.error.code,
        agent_id: entry.agent_id,
        namespace: entry.namespace,
      });
      return null;
    }
    if (!result.data || result.data.length === 0) {
      logger.warn("[Supabase] insertMemoryEntry returned empty data", {
        agent_id: entry.agent_id,
        namespace: entry.namespace,
      });
      return null;
    }
    return result.data[0].id ?? null;
  },

  async searchMemoryEntries(
    agent_id: string,
    namespace: string = "general",
    limit: number = 20,
  ): Promise<MemoryEntry[]> {
    const result = await fetchSupabase<MemoryEntry[]>(
      `memory_entries?agent_id=eq.${encodeURIComponent(agent_id)}&namespace=eq.${encodeURIComponent(namespace)}&order=created_at.desc&limit=${limit}&select=*`,
    );
    return result.data ?? [];
  },
};
