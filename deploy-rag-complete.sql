-- =====================================================
-- COMPLETE RAG SYSTEM DEPLOYMENT
-- Production-ready with all features
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop existing tables if needed (be careful in production!)
-- DROP TABLE IF EXISTS search_history CASCADE;
-- DROP TABLE IF EXISTS document_processing_status CASCADE;
-- DROP TABLE IF EXISTS document_chunks CASCADE;
-- DROP TABLE IF EXISTS documents CASCADE;

-- =====================================================
-- TABLES
-- =====================================================

-- Documents table
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

-- Document chunks table with vector embeddings
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

-- Processing status table
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

-- Search history for analytics
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

-- Vector similarity index (if not exists)
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

-- Search history analytics
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Vector similarity search
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

-- Hybrid search function (simplified for compatibility)
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
DROP POLICY IF EXISTS "Allow anonymous read documents" ON documents;
DROP POLICY IF EXISTS "Allow anonymous insert documents" ON documents;
DROP POLICY IF EXISTS "Allow anonymous update documents" ON documents;
DROP POLICY IF EXISTS "Allow anonymous delete documents" ON documents;

DROP POLICY IF EXISTS "Allow anonymous read chunks" ON document_chunks;
DROP POLICY IF EXISTS "Allow anonymous insert chunks" ON document_chunks;
DROP POLICY IF EXISTS "Allow anonymous update chunks" ON document_chunks;

DROP POLICY IF EXISTS "Allow anonymous read status" ON document_processing_status;
DROP POLICY IF EXISTS "Allow anonymous all status" ON document_processing_status;

DROP POLICY IF EXISTS "Allow anonymous insert search" ON search_history;

-- Create comprehensive policies
CREATE POLICY "Allow anonymous read documents" ON documents
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert documents" ON documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update documents" ON documents
    FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete documents" ON documents
    FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read chunks" ON document_chunks
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert chunks" ON document_chunks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update chunks" ON document_chunks
    FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read status" ON document_processing_status
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous all status" ON document_processing_status
    FOR ALL USING (true);

CREATE POLICY "Allow anonymous insert search" ON search_history
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert a sample document to verify everything works
INSERT INTO documents (title, file_type, file_size_bytes, metadata)
VALUES 
    ('RAG System Documentation', 'text/markdown', 2048, '{"category": "documentation", "version": "1.0"}'),
    ('Teaching System Guide', 'text/plain', 1536, '{"category": "guide", "topic": "education"}')
ON CONFLICT DO NOTHING;

-- Insert sample chunks (without embeddings for now)
INSERT INTO document_chunks (document_id, chunk_index, content, token_count, metadata)
SELECT 
    d.id,
    0,
    'The RAG (Retrieval-Augmented Generation) system enables intelligent document search and question answering by combining vector embeddings with traditional search methods.',
    50,
    '{"section": "introduction"}'
FROM documents d
WHERE d.title = 'RAG System Documentation'
AND NOT EXISTS (
    SELECT 1 FROM document_chunks dc WHERE dc.document_id = d.id AND dc.chunk_index = 0
);

INSERT INTO document_chunks (document_id, chunk_index, content, token_count, metadata)
SELECT 
    d.id,
    0,
    'The Teaching System provides AI-powered curriculum management and adaptive learning paths for financial education.',
    30,
    '{"section": "overview"}'
FROM documents d
WHERE d.title = 'Teaching System Guide'
AND NOT EXISTS (
    SELECT 1 FROM document_chunks dc WHERE dc.document_id = d.id AND dc.chunk_index = 0
);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check if everything was created successfully
DO $$
DECLARE
    doc_count INTEGER;
    chunk_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO doc_count FROM documents;
    SELECT COUNT(*) INTO chunk_count FROM document_chunks;
    
    RAISE NOTICE 'RAG System Deployment Complete!';
    RAISE NOTICE 'Documents: %', doc_count;
    RAISE NOTICE 'Chunks: %', chunk_count;
    RAISE NOTICE 'Vector extension: %', 
        CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') 
        THEN 'Installed' ELSE 'Not installed' END;
END $$;