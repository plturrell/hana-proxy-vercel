-- Minimal RAG tables for teaching system
-- Run this in Supabase SQL editor

-- Create documents table if it doesn't exist
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

-- Create document_chunks table if it doesn't exist
CREATE TABLE IF NOT EXISTS document_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    token_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, chunk_index)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for testing)
CREATE POLICY "Allow anonymous read documents" ON documents
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert documents" ON documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read chunks" ON document_chunks
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert chunks" ON document_chunks
    FOR INSERT WITH CHECK (true);

-- Create processing status table (optional but helpful)
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

-- Insert a test document
INSERT INTO documents (title, file_type, file_size_bytes, metadata)
VALUES ('Sample Teaching Document', 'text/plain', 1024, '{"test": true}')
ON CONFLICT DO NOTHING;