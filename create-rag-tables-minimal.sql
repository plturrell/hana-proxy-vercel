-- Create RAG tables for document storage
-- Run this in Supabase SQL Editor if tables don't exist

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create rag_documents table
CREATE TABLE IF NOT EXISTS rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rag_chunks table
CREATE TABLE IF NOT EXISTS rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rag_chunks_document ON rag_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding ON rag_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create RLS policies
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for now (adjust as needed)
CREATE POLICY "Allow public read access" ON rag_documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON rag_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON rag_documents FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON rag_chunks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON rag_chunks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON rag_chunks FOR DELETE USING (true);

-- Create function to get RAG statistics
CREATE OR REPLACE FUNCTION get_rag_statistics()
RETURNS TABLE (
  total_documents BIGINT,
  total_chunks BIGINT,
  avg_chunks_per_document NUMERIC,
  total_embeddings BIGINT,
  storage_used_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT d.id)::BIGINT as total_documents,
    COUNT(c.id)::BIGINT as total_chunks,
    CASE 
      WHEN COUNT(DISTINCT d.id) > 0 THEN ROUND(COUNT(c.id)::NUMERIC / COUNT(DISTINCT d.id)::NUMERIC, 2)
      ELSE 0
    END as avg_chunks_per_document,
    COUNT(c.embedding)::BIGINT as total_embeddings,
    ROUND(SUM(d.file_size)::NUMERIC / 1048576, 2) as storage_used_mb
  FROM rag_documents d
  LEFT JOIN rag_chunks c ON d.id = c.document_id;
END;
$$ LANGUAGE plpgsql;