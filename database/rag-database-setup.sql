-- =====================================================
-- RAG SYSTEM DATABASE SETUP
-- Complete schema for production RAG with Grok-4
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For full-text search

-- =====================================================
-- TABLES
-- =====================================================

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    source_url TEXT,
    file_type TEXT,
    file_size_bytes BIGINT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Document chunks table with optimized schema
CREATE TABLE IF NOT EXISTS document_chunks (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    document_id BIGINT REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    token_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Add full-text search
    content_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    UNIQUE(document_id, chunk_index)
);

-- Processing status table
CREATE TABLE IF NOT EXISTS document_processing_status (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    document_id BIGINT REFERENCES documents(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    chunks_processed INTEGER DEFAULT 0,
    total_chunks INTEGER,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search history for analytics
CREATE TABLE IF NOT EXISTS search_history (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    query TEXT NOT NULL,
    query_embedding vector(1536),
    results_count INTEGER,
    search_type TEXT CHECK (search_type IN ('vector', 'hybrid', 'fulltext')),
    response_time_ms INTEGER,
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- HNSW index for vector similarity (best performance)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding 
ON document_chunks USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 128);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_chunks_content_tsv 
ON document_chunks USING gin(content_tsv);

-- Metadata filtering
CREATE INDEX IF NOT EXISTS idx_chunks_metadata 
ON document_chunks USING gin(metadata);

-- Document lookups
CREATE INDEX IF NOT EXISTS idx_chunks_document 
ON document_chunks(document_id);

-- Search history analytics
CREATE INDEX IF NOT EXISTS idx_search_history_created 
ON search_history(created_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Vector similarity search with metadata filtering
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    filter_metadata JSONB DEFAULT '{}'
) RETURNS TABLE (
    id BIGINT,
    document_id BIGINT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE sql STABLE AS $$
    SELECT 
        dc.id,
        dc.document_id,
        dc.content,
        dc.metadata,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE 
        1 - (dc.embedding <=> query_embedding) > match_threshold
        AND (filter_metadata = '{}' OR dc.metadata @> filter_metadata)
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Hybrid search combining vector and full-text
CREATE OR REPLACE FUNCTION hybrid_search(
    query_text TEXT,
    query_embedding vector(1536),
    match_count INT DEFAULT 10,
    rrf_k INT DEFAULT 60
) RETURNS TABLE (
    id BIGINT,
    document_id BIGINT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT,
    rank_score FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH vector_search AS (
        SELECT 
            dc.id,
            dc.document_id,
            1 - (dc.embedding <=> query_embedding) AS similarity,
            ROW_NUMBER() OVER (ORDER BY dc.embedding <=> query_embedding) AS rank
        FROM document_chunks dc
        ORDER BY dc.embedding <=> query_embedding
        LIMIT match_count * 2
    ),
    text_search AS (
        SELECT 
            dc.id,
            dc.document_id,
            ts_rank_cd(dc.content_tsv, query) AS relevance,
            ROW_NUMBER() OVER (ORDER BY ts_rank_cd(dc.content_tsv, query) DESC) AS rank
        FROM document_chunks dc, plainto_tsquery('english', query_text) query
        WHERE dc.content_tsv @@ query
        LIMIT match_count * 2
    ),
    combined AS (
        SELECT 
            COALESCE(v.id, t.id) AS id,
            COALESCE(v.document_id, t.document_id) AS document_id,
            COALESCE(v.similarity, 0) AS similarity,
            1.0 / (rrf_k + COALESCE(v.rank, match_count * 2)) + 
            1.0 / (rrf_k + COALESCE(t.rank, match_count * 2)) AS rrf_score
        FROM vector_search v
        FULL OUTER JOIN text_search t ON v.id = t.id
    )
    SELECT 
        c.id,
        c.document_id,
        dc.content,
        dc.metadata,
        c.similarity,
        c.rrf_score AS rank_score
    FROM combined c
    JOIN document_chunks dc ON dc.id = c.id
    ORDER BY c.rrf_score DESC
    LIMIT match_count;
END;
$$;

-- Get RAG system statistics
CREATE OR REPLACE FUNCTION get_rag_statistics()
RETURNS TABLE (
    total_documents BIGINT,
    total_chunks BIGINT,
    avg_chunks_per_document NUMERIC,
    total_embeddings BIGINT,
    storage_used_mb NUMERIC,
    total_searches BIGINT,
    avg_search_time_ms NUMERIC
)
LANGUAGE sql STABLE AS $$
    SELECT 
        COUNT(DISTINCT d.id) AS total_documents,
        COUNT(dc.id) AS total_chunks,
        AVG(chunk_counts.count)::NUMERIC AS avg_chunks_per_document,
        COUNT(dc.embedding) AS total_embeddings,
        (pg_relation_size('document_chunks') / 1024.0 / 1024.0)::NUMERIC AS storage_used_mb,
        COUNT(DISTINCT sh.id) AS total_searches,
        AVG(sh.response_time_ms)::NUMERIC AS avg_search_time_ms
    FROM documents d
    LEFT JOIN document_chunks dc ON d.id = dc.document_id
    LEFT JOIN (
        SELECT document_id, COUNT(*) as count 
        FROM document_chunks 
        GROUP BY document_id
    ) chunk_counts ON d.id = chunk_counts.document_id
    LEFT JOIN search_history sh ON TRUE
    GROUP BY pg_relation_size('document_chunks');
$$;

-- Update document processing status
CREATE OR REPLACE FUNCTION update_processing_status(
    p_document_id BIGINT,
    p_status TEXT,
    p_chunks_processed INTEGER DEFAULT NULL,
    p_total_chunks INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO document_processing_status (
        document_id, 
        status, 
        chunks_processed, 
        total_chunks, 
        error_message,
        started_at,
        completed_at
    ) VALUES (
        p_document_id,
        p_status,
        p_chunks_processed,
        p_total_chunks,
        p_error_message,
        CASE WHEN p_status = 'processing' THEN NOW() ELSE NULL END,
        CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE NULL END
    )
    ON CONFLICT (document_id) DO UPDATE SET
        status = EXCLUDED.status,
        chunks_processed = COALESCE(EXCLUDED.chunks_processed, document_processing_status.chunks_processed),
        total_chunks = COALESCE(EXCLUDED.total_chunks, document_processing_status.total_chunks),
        error_message = EXCLUDED.error_message,
        started_at = COALESCE(EXCLUDED.started_at, document_processing_status.started_at),
        completed_at = COALESCE(EXCLUDED.completed_at, document_processing_status.completed_at);
END;
$$ LANGUAGE plpgsql;

-- Log search query for analytics
CREATE OR REPLACE FUNCTION log_search(
    p_query TEXT,
    p_query_embedding vector(1536),
    p_results_count INTEGER,
    p_search_type TEXT,
    p_response_time_ms INTEGER,
    p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO search_history (
        query,
        query_embedding,
        results_count,
        search_type,
        response_time_ms,
        user_id,
        metadata
    ) VALUES (
        p_query,
        p_query_embedding,
        p_results_count,
        p_search_type,
        p_response_time_ms,
        auth.uid(),
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_processing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Document policies
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE USING (auth.uid() = owner_id);

-- Chunk policies (inherit from document)
CREATE POLICY "Users can view chunks of accessible documents" ON document_chunks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = document_chunks.document_id 
            AND (d.owner_id = auth.uid() OR d.owner_id IS NULL)
        )
    );

-- Processing status policies
CREATE POLICY "Users can view status of own documents" ON document_processing_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE d.id = document_processing_status.document_id 
            AND (d.owner_id = auth.uid() OR d.owner_id IS NULL)
        )
    );

-- Search history policies
CREATE POLICY "Users can view own search history" ON search_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history" ON search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO authenticated;
GRANT SELECT ON document_chunks TO authenticated;
GRANT SELECT ON document_processing_status TO authenticated;
GRANT SELECT, INSERT ON search_history TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;