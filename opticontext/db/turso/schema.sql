-- Turso (libSQL) Schema for OptiContext
-- Tables: agent_requests, daily_usage, agent_registry, api_keys, uploaded_files
-- Safe to run repeatedly — all DDL is idempotent.

CREATE TABLE IF NOT EXISTS agent_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    owner_email TEXT,
    tool_name TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    latency_ms INTEGER NOT NULL DEFAULT 0,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    provider_used TEXT,
    success INTEGER NOT NULL DEFAULT 1,
    error_code TEXT,
    request_body TEXT,
    response_summary TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_requests_agent ON agent_requests(agent_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_requests_owner ON agent_requests(owner_email, timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_requests_tool ON agent_requests(tool_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_requests_timestamp ON agent_requests(timestamp);

CREATE TABLE IF NOT EXISTS daily_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    owner_email TEXT,
    date TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    tokens_total INTEGER NOT NULL DEFAULT 0,
    UNIQUE(agent_id, date, tool_name)
);

CREATE TABLE IF NOT EXISTS agent_registry (
    agent_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    owner_email TEXT,
    tier TEXT NOT NULL DEFAULT 'standard',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    allowed_tools TEXT NOT NULL DEFAULT '[]',
    settings TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS api_keys (
    key_hash TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    owner_email TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_used TEXT,
    revoked INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (agent_id) REFERENCES agent_registry(agent_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_agent ON api_keys(agent_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_agent_date ON daily_usage(agent_id, date);

CREATE TABLE IF NOT EXISTS uploaded_files (
    file_id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    owner_email TEXT,
    filename TEXT NOT NULL DEFAULT 'unknown',
    mime_type TEXT NOT NULL DEFAULT 'text/plain',
    file_size INTEGER NOT NULL DEFAULT 0,
    r2_key TEXT NOT NULL,
    gemini_file_uri TEXT,
    gemini_expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_agent ON uploaded_files(agent_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_gemini ON uploaded_files(gemini_file_uri);
