-- Create the missing tables that are needed for RAG system

-- Document processing status table
CREATE TABLE IF NOT EXISTS document_processing_status (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT REFERENCES documents(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    chunks_processed INTEGER DEFAULT 0,
    total_chunks INTEGER,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search history table  
CREATE TABLE IF NOT EXISTS search_history (
    id BIGSERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    query_embedding TEXT, -- Store as text since vector type may not be available
    results_count INTEGER,
    search_type TEXT CHECK (search_type IN ('vector', 'hybrid', 'fulltext')) DEFAULT 'hybrid',
    response_time_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_processing_status_document ON document_processing_status(document_id);
CREATE INDEX IF NOT EXISTS idx_processing_status_status ON document_processing_status(status);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC);

-- Enable RLS
ALTER TABLE document_processing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
DROP POLICY IF EXISTS "Allow all access" ON document_processing_status;
DROP POLICY IF EXISTS "Allow all access" ON search_history;

CREATE POLICY "Allow all access" ON document_processing_status FOR ALL USING (true);
CREATE POLICY "Allow all access" ON search_history FOR ALL USING (true);

-- Insert test data to verify
INSERT INTO document_processing_status (document_id, status, total_chunks) 
SELECT id, 'pending', 0 FROM documents LIMIT 1
ON CONFLICT DO NOTHING;