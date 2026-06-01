-- Supabase (Postgres + pgvector) Schema for OptiContext
-- Run this in: Supabase Dashboard → SQL Editor

-- ─────────────────────────────────────────────────────────────────────────────
-- Enable pgvector extension (required for VECTOR type)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- Agent profiles table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_profiles (
    agent_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    owner_email TEXT,
    allowed_tools TEXT[] NOT NULL DEFAULT '{}',
    tier TEXT NOT NULL DEFAULT 'standard',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Memory embeddings table (pgvector)
-- NOTE: Gemini gemini-embedding-2 produces 3072-dimensional vectors.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memory_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    content_text TEXT NOT NULL,
    embedding VECTOR(3072),
    metadata JSONB DEFAULT '{}',
    importance_score INTEGER NOT NULL DEFAULT 5,
    namespace TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_memory_embeddings_agent
    ON memory_embeddings(agent_id, namespace);

-- IVFFlat index for fast approximate nearest-neighbor search
-- lists = 100 is good for up to ~1M rows; increase for larger datasets
-- DROP INDEX IF EXISTS idx_memory_embeddings_ivfflat;
-- CREATE INDEX IF NOT EXISTS idx_memory_embeddings_ivfflat
--     ON memory_embeddings
--     USING ivfflat (embedding vector_cosine_ops)
--     WITH (lists = 100);
-- NOTE: ivfflat index on VECTOR(3072) is large. Add after data is populated.

-- ─────────────────────────────────────────────────────────────────────────────
-- Memory entries table (plain text storage, no embeddings)
-- Used for browsing recent memories without a vector query
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memory_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    namespace TEXT NOT NULL DEFAULT 'general',
    content TEXT NOT NULL,
    source_tool TEXT,
    importance_score INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_memory_entries_agent
    ON memory_entries(agent_id, namespace);

-- ─────────────────────────────────────────────────────────────────────────────
-- match_memories: Semantic similarity search via pgvector cosine distance.
-- Called by supabase.ts via POST /rest/v1/rpc/match_memories
--
-- Returns the top `match_count` memory embeddings for a given agent and
-- namespace that exceed the `match_threshold` cosine similarity score.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION match_memories(
    query_embedding VECTOR(3072),
    match_count INTEGER DEFAULT 5,
    match_threshold FLOAT DEFAULT 0.7,
    p_agent_id TEXT DEFAULT NULL,
    p_namespace TEXT DEFAULT 'general'
)
RETURNS TABLE (
    id UUID,
    agent_id TEXT,
    content_text TEXT,
    embedding VECTOR(768),
    metadata JSONB,
    importance_score INTEGER,
    namespace TEXT,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        me.id,
        me.agent_id,
        me.content_text,
        me.embedding,
        me.metadata,
        me.importance_score,
        me.namespace,
        me.created_at,
        me.expires_at,
        1 - (me.embedding <=> query_embedding) AS similarity
    FROM memory_embeddings me
    WHERE
        (p_agent_id IS NULL OR me.agent_id = p_agent_id)
        AND (me.namespace = p_namespace)
        AND (me.expires_at IS NULL OR me.expires_at > NOW())
        AND me.embedding IS NOT NULL
        AND 1 - (me.embedding <=> query_embedding) >= match_threshold
    ORDER BY me.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permission to the anon and authenticated roles
GRANT EXECUTE ON FUNCTION match_memories TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: auto-update updated_at on agent_profiles
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_agent_profiles_updated_at ON agent_profiles;
CREATE TRIGGER set_agent_profiles_updated_at
    BEFORE UPDATE ON agent_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security (RLS)
-- Enable for each table and add policies if you want per-user data isolation.
-- For the service_role key used by the worker, RLS is bypassed automatically.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (worker uses service_role)
CREATE POLICY "service_role_all" ON agent_profiles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON memory_embeddings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON memory_entries
    FOR ALL TO service_role USING (true) WITH CHECK (true);
