-- Add Deep Research Reports table
CREATE TABLE IF NOT EXISTS deep_research_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol VARCHAR(255),
    report_type VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    sources_count INTEGER DEFAULT 0,
    citations JSONB DEFAULT '[]'::jsonb,
    search_context JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_deep_research_symbol ON deep_research_reports(symbol);
CREATE INDEX IF NOT EXISTS idx_deep_research_type ON deep_research_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_deep_research_created ON deep_research_reports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE deep_research_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Enable read access for all users" ON deep_research_reports
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON deep_research_reports
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON deep_research_reports TO postgres, anon, authenticated, service_role;