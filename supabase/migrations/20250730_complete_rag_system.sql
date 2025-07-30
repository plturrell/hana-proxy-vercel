-- =====================================================
-- COMPLETE RAG SYSTEM - ALL TABLES AND FUNCTIONS
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Documents table (if not exists)
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    source_url TEXT,
    file_type TEXT,
    file_size_bytes BIGINT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks table with vector embeddings (if not exists)
CREATE TABLE IF NOT EXISTS document_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    token_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    content_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    UNIQUE(document_id, chunk_index)
);

-- Processing status table (MISSING - NOW ADDED)
CREATE TABLE IF NOT EXISTS document_processing_status (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT REFERENCES documents(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    chunks_processed INTEGER DEFAULT 0,
    total_chunks INTEGER,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search history for analytics (MISSING - NOW ADDED)
CREATE TABLE IF NOT EXISTS search_history (
    id BIGSERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    query_embedding vector(1536),
    results_count INTEGER,
    search_type TEXT CHECK (search_type IN ('vector', 'hybrid', 'fulltext')),
    response_time_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Vector similarity index
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chunks_embedding') THEN
        CREATE INDEX idx_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    END IF;
END $$;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_chunks_content_tsv ON document_chunks USING gin(content_tsv);

-- Metadata filtering
CREATE INDEX IF NOT EXISTS idx_chunks_metadata ON document_chunks USING gin(metadata);

-- Document lookups
CREATE INDEX IF NOT EXISTS idx_chunks_document ON document_chunks(document_id);

-- Processing status index
CREATE INDEX IF NOT EXISTS idx_processing_status_document ON document_processing_status(document_id);

-- Search history analytics
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Vector similarity search function
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
        dc.embedding IS NOT NULL
        AND 1 - (dc.embedding <=> query_embedding) > match_threshold
        AND (filter_metadata = '{}' OR dc.metadata @> filter_metadata)
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Hybrid search function
CREATE OR REPLACE FUNCTION hybrid_search(
    query_text TEXT,
    query_embedding vector(1536),
    match_count INT DEFAULT 10
) RETURNS TABLE (
    id BIGINT,
    document_id BIGINT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE sql STABLE AS $$
    WITH vector_results AS (
        SELECT 
            dc.id,
            dc.document_id,
            dc.content,
            dc.metadata,
            1 - (dc.embedding <=> query_embedding) AS similarity
        FROM document_chunks dc
        WHERE dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> query_embedding
        LIMIT match_count
    ),
    text_results AS (
        SELECT 
            dc.id,
            dc.document_id,
            dc.content,
            dc.metadata,
            ts_rank(dc.content_tsv, plainto_tsquery('english', query_text)) AS rank
        FROM document_chunks dc
        WHERE dc.content_tsv @@ plainto_tsquery('english', query_text)
        ORDER BY rank DESC
        LIMIT match_count
    )
    SELECT DISTINCT ON (id)
        id,
        document_id,
        content,
        metadata,
        COALESCE(similarity, rank::FLOAT / 10) AS similarity
    FROM (
        SELECT * FROM vector_results
        UNION ALL
        SELECT id, document_id, content, metadata, rank::FLOAT / 10 AS similarity FROM text_results
    ) combined
    ORDER BY id, similarity DESC
    LIMIT match_count;
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_processing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous access documents" ON documents;
DROP POLICY IF EXISTS "Allow anonymous access chunks" ON document_chunks;
DROP POLICY IF EXISTS "Allow anonymous access status" ON document_processing_status;
DROP POLICY IF EXISTS "Allow anonymous access search" ON search_history;

-- Create permissive policies for all operations
CREATE POLICY "Allow anonymous access documents" ON documents FOR ALL USING (true);
CREATE POLICY "Allow anonymous access chunks" ON document_chunks FOR ALL USING (true);
CREATE POLICY "Allow anonymous access status" ON document_processing_status FOR ALL USING (true);
CREATE POLICY "Allow anonymous access search" ON search_history FOR ALL USING (true);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Add some test data to verify everything works
INSERT INTO documents (title, file_type, file_size_bytes, metadata)
VALUES 
    ('RAG System Test Document', 'text/plain', 1024, '{"category": "test", "version": "1.0"}')
ON CONFLICT DO NOTHING;

-- Verify tables exist
DO $$
DECLARE
    doc_count INTEGER;
    chunk_count INTEGER;
    status_count INTEGER;
    search_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO doc_count FROM documents;
    SELECT COUNT(*) INTO chunk_count FROM document_chunks;
    SELECT COUNT(*) INTO status_count FROM document_processing_status;
    SELECT COUNT(*) INTO search_count FROM search_history;
    
    RAISE NOTICE 'RAG System Migration Complete!';
    RAISE NOTICE 'Documents table: % rows', doc_count;
    RAISE NOTICE 'Chunks table: % rows', chunk_count;
    RAISE NOTICE 'Processing status table: % rows', status_count;
    RAISE NOTICE 'Search history table: % rows', search_count;
    RAISE NOTICE 'Vector extension: %', 
        CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') 
        THEN 'Installed' ELSE 'Not installed' END;
END $$;