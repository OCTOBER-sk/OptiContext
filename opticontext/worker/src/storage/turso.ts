import { getEnv } from "../context";

export interface AgentRequestLog {
  agent_id: string;
  tool_name: string;
  timestamp?: string;
  latency_ms: number;
  tokens_used: number;
  provider_used?: string;
  success: boolean | number;
  error_code?: string;
  request_body?: string;
  response_summary?: string;
}

export interface DailyUsage {
  agent_id: string;
  date: string;
  tool_name: string;
  count: number;
  tokens_total: number;
}

export interface AgentRegistry {
  agent_id: string;
  display_name: string;
  owner_email?: string;
  tier: string;
  allowed_tools: string;
  settings?: string;
  created_at?: string;
  revoked: number;
  last_used?: string | null;
}

export interface UploadedFileRecord {
  file_id: string;
  agent_id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  r2_key: string;
  gemini_file_uri?: string;
  gemini_expires_at?: string;
  created_at?: string;
}

interface TursoColumn {
  name: string;
  type: string;
}

interface TursoRow {
  type: string;
  value: string | number | null;
}

interface TursoStmtResult {
  cols: TursoColumn[];
  rows: TursoRow[][];
  affected_row_count: number;
  last_insert_rowid?: string;
}

interface TursoPipelineResponseItem {
  type: string;
  response?: {
    type: string;
    result: TursoStmtResult;
  };
  error?: {
    message: string;
    code: string;
  };
}

async function query(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<Record<string, unknown>[]> {
  const env = getEnv();
  const dbUrl = env.TURSO_DB_URL;
  const authToken = env.TURSO_AUTH_TOKEN;

  if (!dbUrl || !authToken) {
    console.warn("[Turso] Not configured — skipping query");
    return [];
  }

  const url = `${dbUrl}/v2/pipeline`;
  const args = params.map((p) => {
    if (p === null) return { type: "null" };
    if (typeof p === "number") return { type: "integer", value: String(p) };
    return { type: "text", value: String(p) };
  });

  const body = {
    requests: [
      { type: "execute", stmt: { sql, args } },
      { type: "close" },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Turso query failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { results: TursoPipelineResponseItem[] };
  const firstResult = data.results?.[0];
  if (firstResult?.error) {
    throw new Error(`Turso query error: ${firstResult.error.message} (code: ${firstResult.error.code})`);
  }
  const stmtResult = firstResult?.response?.result;
  if (!stmtResult) return [];

  const cols = stmtResult.cols.map((c) => c.name);
  return stmtResult.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    row.forEach((cell, i) => {
      obj[cols[i]] = cell.value ?? null;
    });
    return obj;
  });
}

/** Like query() but returns the affected_row_count from the statement result. */
async function execute(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<number> {
  const env = getEnv();
  const dbUrl = env.TURSO_DB_URL;
  const authToken = env.TURSO_AUTH_TOKEN;

  if (!dbUrl || !authToken) {
    console.warn("[Turso] Not configured — skipping execute");
    return 0;
  }

  const url = `${dbUrl}/v2/pipeline`;
  const args = params.map((p) => {
    if (p === null) return { type: "null" };
    if (typeof p === "number") return { type: "integer", value: String(p) };
    return { type: "text", value: String(p) };
  });

  const body = {
    requests: [
      { type: "execute", stmt: { sql, args } },
      { type: "close" },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Turso execute failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { results: TursoPipelineResponseItem[] };
  const firstResult = data.results?.[0];
  if (firstResult?.error) {
    throw new Error(`Turso execute error: ${firstResult.error.message} (code: ${firstResult.error.code})`);
  }
  return firstResult?.response?.result?.affected_row_count ?? 0;
}

export const turso = {
  async logRequest(log: AgentRequestLog): Promise<void> {
    try {
      await query(
        `INSERT INTO agent_requests
         (agent_id, tool_name, timestamp, latency_ms, tokens_used, provider_used, success, error_code)
         VALUES (?, ?, datetime('now'), ?, ?, ?, ?, ?)`,
        [
          log.agent_id,
          log.tool_name,
          log.latency_ms,
          log.tokens_used,
          log.provider_used ?? null,
          log.success ? 1 : 0,
          log.error_code ?? null,
        ],
      );

      await query(
        `INSERT INTO daily_usage (agent_id, date, tool_name, count, tokens_total)
         VALUES (?, date('now'), ?, 1, ?)
         ON CONFLICT(agent_id, date, tool_name)
         DO UPDATE SET count = count + 1, tokens_total = tokens_total + ?`,
        [log.agent_id, log.tool_name, log.tokens_used, log.tokens_used],
      );
    } catch (err) {
      console.error("[Turso] Log write failed:", err);
    }
  },

  async getUsageStats(
    agent_id: string,
    days: number = 30,
  ): Promise<DailyUsage[]> {
    const rows = await query(
      `SELECT * FROM daily_usage
       WHERE agent_id = ? AND date >= date('now', '-' || ? || ' days')
       ORDER BY date DESC`,
      [agent_id, days],
    );
    return rows as unknown as DailyUsage[];
  },

  async getRecentRequests(
    agent_id: string,
    limit: number = 100,
  ): Promise<AgentRequestLog[]> {
    const rows = await query(
      `SELECT * FROM agent_requests
       WHERE agent_id = ?
       ORDER BY timestamp DESC LIMIT ?`,
      [agent_id, limit],
    );
    return rows as unknown as AgentRequestLog[];
  },

  async getAllRequests(options: {
    agent?: string;
    tool?: string;
    status?: string;
    limit?: number;
    owner_email?: string;
  }): Promise<AgentRequestLog[]> {
    const conditions: string[] = [];
    const params: (string | number | null)[] = [];

    // If owner_email is provided, join with agent_registry to filter by user
    if (options.owner_email && options.owner_email.trim() !== "") {
      const agentConditions: string[] = ["(reg.owner_email = ? OR reg.owner_email = '' OR reg.owner_email IS NULL)"];
      params.push(options.owner_email);
      if (options.agent) {
        agentConditions.push("ar_logs.agent_id = ?");
        params.push(options.agent);
      }
      if (options.tool) {
        agentConditions.push("ar_logs.tool_name = ?");
        params.push(options.tool);
      }
      if (options.status === "success") {
        agentConditions.push("ar_logs.success = 1");
      } else if (options.status === "error") {
        agentConditions.push("ar_logs.success = 0");
      }
      params.push(options.limit ?? 100);

      const sql = `SELECT ar_logs.* FROM agent_requests ar_logs
        JOIN agent_registry reg ON ar_logs.agent_id = reg.agent_id
        WHERE ${agentConditions.join(" AND ")}
        ORDER BY ar_logs.timestamp DESC LIMIT ?`;
      const rows = await query(sql, params);
      return rows as unknown as AgentRequestLog[];
    }

    if (options.agent) {
      conditions.push("agent_id = ?");
      params.push(options.agent);
    }
    if (options.tool) {
      conditions.push("tool_name = ?");
      params.push(options.tool);
    }
    if (options.status === "success") {
      conditions.push("success = 1");
    } else if (options.status === "error") {
      conditions.push("success = 0");
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(options.limit ?? 100);

    const rows = await query(
      `SELECT * FROM agent_requests ${where} ORDER BY timestamp DESC LIMIT ?`,
      params,
    );
    return rows as unknown as AgentRequestLog[];
  },

  async getRegisteredAgents(owner_email?: string): Promise<AgentRegistry[]> {
    if (!owner_email || owner_email.trim() === "") return [];

    const sql = `SELECT ar.*, COALESCE(MAX(ak.revoked), 0) as revoked, MAX(ak.last_used) as last_used
         FROM agent_registry ar
         LEFT JOIN api_keys ak ON ar.agent_id = ak.agent_id
         WHERE ar.owner_email = ?
         GROUP BY ar.agent_id
         ORDER BY ar.created_at DESC`;
    const rows = await query(sql, [owner_email]);
    return rows as unknown as AgentRegistry[];
  },

  async agentBelongsToOwner(agent_id: string, owner_email: string): Promise<boolean> {
    if (!owner_email || owner_email.trim() === "") return false;
    const rows = await query(
      `SELECT 1 FROM agent_registry WHERE agent_id = ? AND owner_email = ?`,
      [agent_id, owner_email],
    );
    return rows.length > 0;
  },

  async getAgentOwner(agent_id: string): Promise<string | null> {
    const rows = await query(
      `SELECT owner_email FROM agent_registry WHERE agent_id = ?`,
      [agent_id],
    );
    if (rows.length === 0) return null;
    const val = rows[0].owner_email;
    return val != null ? String(val) : null;
  },

  async registerAgent(
    agent_id: string,
    display_name: string,
    owner_email: string,
    allowed_tools: string[],
  ): Promise<void> {
    await query(
      `INSERT INTO agent_registry (agent_id, display_name, owner_email, allowed_tools)
       VALUES (?, ?, ?, ?)`,
      [agent_id, display_name, owner_email, JSON.stringify(allowed_tools)],
    );
  },

  async renameAgent(
    agent_id: string,
    display_name: string,
    owner_email: string,
  ): Promise<boolean> {
    const affected = await execute(
      `UPDATE agent_registry SET display_name = ? WHERE agent_id = ? AND owner_email = ?`,
      [display_name, agent_id, owner_email],
    );
    if (affected === 0) {
      throw new Error(`renameAgent: no matching agent found for agent_id=${agent_id} owner=${owner_email}`);
    }
    return true;
  },

  async storeKeyHash(
    key_hash: string,
    agent_id: string,
  ): Promise<void> {
    await query(
      `INSERT INTO api_keys (key_hash, agent_id) VALUES (?, ?)`,
      [key_hash, agent_id],
    );
  },

  async lookupKeyHash(
    key_hash: string,
  ): Promise<{ agent_id: string; allowed_tools: string[]; tier: string; owner_email?: string } | null> {
    const rows = await query(
      `SELECT ak.agent_id, ar.allowed_tools, ar.tier, ar.owner_email
       FROM api_keys ak
       JOIN agent_registry ar ON ak.agent_id = ar.agent_id
       WHERE ak.key_hash = ? AND ak.revoked = 0`,
      [key_hash],
    );
    if (rows.length === 0) return null;
    try {
      const allowed = JSON.parse(String(rows[0].allowed_tools));
      return {
        agent_id: String(rows[0].agent_id),
        allowed_tools: Array.isArray(allowed) ? allowed : [],
        tier: String(rows[0].tier ?? "standard"),
        owner_email: rows[0].owner_email ? String(rows[0].owner_email) : undefined,
      };
    } catch {
      return null;
    }
  },

  async revokeKey(agent_id: string): Promise<number> {
    await query(
      `UPDATE api_keys SET revoked = 1 WHERE agent_id = ? AND revoked = 0`,
      [agent_id],
    );
    // Count affected rows to confirm revocation
    const check = await query(
      `SELECT COUNT(*) as n FROM api_keys WHERE agent_id = ? AND revoked = 1`,
      [agent_id],
    );
    const revokedCount = Number(check[0]?.n ?? 0);

    if (revokedCount === 0) {
      // No api_keys rows existed at all, or all were already revoked.
      // getRegisteredAgents uses COALESCE(MAX(ak.revoked), 0), so an agent
      // with zero api_keys rows shows as non-revoked — no sentinel needed.
      return 0;
    }

    return revokedCount;
  },

  async storeFileRecord(
    record: UploadedFileRecord,
  ): Promise<void> {
    await query(
      `INSERT INTO uploaded_files (file_id, agent_id, filename, mime_type, file_size, r2_key, gemini_file_uri, gemini_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.file_id,
        record.agent_id,
        record.filename,
        record.mime_type,
        record.file_size,
        record.r2_key,
        record.gemini_file_uri ?? null,
        record.gemini_expires_at ?? null,
      ],
    );
  },

  async updateFileGeminiUri(
    file_id: string,
    agent_id: string,
    gemini_file_uri: string,
    gemini_expires_at: string,
  ): Promise<void> {
    await query(
      `UPDATE uploaded_files SET gemini_file_uri = ?, gemini_expires_at = ? WHERE file_id = ? AND agent_id = ?`,
      [gemini_file_uri, gemini_expires_at, file_id, agent_id],
    );
  },

  async getFileRecord(
    file_id: string,
    agent_id: string,
  ): Promise<UploadedFileRecord | null> {
    const rows = await query(
      `SELECT * FROM uploaded_files WHERE file_id = ? AND agent_id = ?`,
      [file_id, agent_id],
    );
    if (rows.length === 0) return null;
    return rows[0] as unknown as UploadedFileRecord;
  },

  async updateKeyLastUsed(key_hash: string): Promise<void> {
    await query(
      `UPDATE api_keys SET last_used = datetime('now') WHERE key_hash = ?`,
      [key_hash],
    );
  },

  async getProviderBreakdown(
    agent_id: string,
    days: number = 30,
  ): Promise<{ provider: string; count: number }[]> {
    const rows = await query(
      `SELECT provider_used as provider, COUNT(*) as count
       FROM agent_requests
       WHERE agent_id = ? AND provider_used IS NOT NULL
         AND timestamp >= datetime('now', '-' || ? || ' days')
       GROUP BY provider_used
       ORDER BY count DESC`,
      [agent_id, days],
    );
    return rows.map((r) => ({
      provider: String(r.provider ?? "unknown"),
      count: Number(r.count),
    }));
  },

  async getAgentKeyInfo(
    agent_id: string,
  ): Promise<{ key_hash: string; created_at: string; last_used: string | null; revoked: number } | null> {
    const rows = await query(
      `SELECT key_hash, created_at, last_used, revoked
       FROM api_keys
       WHERE agent_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [agent_id],
    );
    if (rows.length === 0) return null;
    return {
      key_hash: String(rows[0].key_hash),
      created_at: String(rows[0].created_at),
      last_used: rows[0].last_used ? String(rows[0].last_used) : null,
      revoked: Number(rows[0].revoked),
    };
  },
};
