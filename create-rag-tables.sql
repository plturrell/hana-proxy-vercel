-- RAG System Database Schema
-- Create all required tables for the RAG pipeline

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks with vector embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- Grok embeddings are 1536 dimensions
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for efficient vector search
  CONSTRAINT unique_document_chunk UNIQUE(document_id, chunk_index)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_document_chunks_content_fts ON document_chunks 
USING GIN (to_tsvector('english', content));

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_metadata jsonb DEFAULT '{}'
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function for hybrid search (combining vector and full-text)
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text text,
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  rrf_k int DEFAULT 60
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_search AS (
    SELECT
      document_chunks.id,
      document_chunks.document_id,
      document_chunks.content,
      document_chunks.metadata,
      1 - (document_chunks.embedding <=> query_embedding) AS similarity,
      ROW_NUMBER() OVER (ORDER BY document_chunks.embedding <=> query_embedding) AS rank
    FROM document_chunks
    ORDER BY document_chunks.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  keyword_search AS (
    SELECT
      document_chunks.id,
      document_chunks.document_id,
      document_chunks.content,
      document_chunks.metadata,
      ts_rank_cd(to_tsvector('english', content), plainto_tsquery('english', query_text)) AS similarity,
      ROW_NUMBER() OVER (ORDER BY ts_rank_cd(to_tsvector('english', content), plainto_tsquery('english', query_text)) DESC) AS rank
    FROM document_chunks
    WHERE to_tsvector('english', content) @@ plainto_tsquery('english', query_text)
    ORDER BY ts_rank_cd(to_tsvector('english', content), plainto_tsquery('english', query_text)) DESC
    LIMIT match_count * 2
  )
  SELECT
    COALESCE(vector_search.id, keyword_search.id) AS id,
    COALESCE(vector_search.document_id, keyword_search.document_id) AS document_id,
    COALESCE(vector_search.content, keyword_search.content) AS content,
    COALESCE(vector_search.metadata, keyword_search.metadata) AS metadata,
    COALESCE(vector_search.similarity, keyword_search.similarity) AS similarity
  FROM vector_search
  FULL OUTER JOIN keyword_search ON vector_search.id = keyword_search.id
  ORDER BY (
    CASE 
      WHEN vector_search.rank IS NULL THEN 0
      ELSE 1.0 / (rrf_k + vector_search.rank)
    END +
    CASE 
      WHEN keyword_search.rank IS NULL THEN 0
      ELSE 1.0 / (rrf_k + keyword_search.rank)
    END
  ) DESC
  LIMIT match_count;
END;
$$;

-- Function to get RAG system statistics
CREATE OR REPLACE FUNCTION get_rag_statistics()
RETURNS TABLE (
  total_documents bigint,
  total_chunks bigint,
  avg_chunks_per_document numeric,
  total_embeddings bigint,
  storage_used_mb numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM documents) AS total_documents,
    (SELECT COUNT(*) FROM document_chunks) AS total_chunks,
    (SELECT ROUND(AVG(chunk_count), 2) FROM (
      SELECT COUNT(*) as chunk_count 
      FROM document_chunks 
      GROUP BY document_id
    ) AS chunk_counts) AS avg_chunks_per_document,
    (SELECT COUNT(*) FROM document_chunks WHERE embedding IS NOT NULL) AS total_embeddings,
    (SELECT ROUND(
      (pg_total_relation_size('documents') + pg_total_relation_size('document_chunks'))::numeric / (1024*1024), 
      2
    )) AS storage_used_mb;
END;
$$;

-- Add Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read documents" ON documents
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to insert documents" ON documents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to read chunks" ON document_chunks
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated users to insert chunks" ON document_chunks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Sample data for testing (optional)
-- INSERT INTO documents (title, source_url) VALUES 
-- ('Sample Document', 'https://example.com/sample.pdf');