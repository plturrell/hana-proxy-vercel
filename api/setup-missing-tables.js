const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const results = [];

    // Create document_processing_status table
    try {
      const { data, error } = await supabase
        .from('document_processing_status')
        .insert({
          document_id: 999999,
          status: 'test',
          chunks_processed: 0,
          total_chunks: 0,
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select();

      if (!error) {
        // Delete test record
        await supabase
          .from('document_processing_status')
          .delete()
          .eq('document_id', 999999);
        
        results.push({ table: 'document_processing_status', status: 'exists' });
      }
    } catch (err) {
      if (err.message.includes('relation') && err.message.includes('does not exist')) {
        results.push({ table: 'document_processing_status', status: 'missing - needs manual creation' });
      } else {
        results.push({ table: 'document_processing_status', status: 'exists' });
      }
    }

    // Create search_history table
    try {
      const { data, error } = await supabase
        .from('search_history')
        .insert({
          query: 'test query',
          results_count: 0,
          search_type: 'hybrid',
          response_time_ms: 100,
          created_at: new Date().toISOString()
        })
        .select();

      if (!error) {
        // Delete test record
        await supabase
          .from('search_history')
          .delete()
          .eq('query', 'test query');
        
        results.push({ table: 'search_history', status: 'exists' });
      }
    } catch (err) {
      if (err.message.includes('relation') && err.message.includes('does not exist')) {
        results.push({ table: 'search_history', status: 'missing - needs manual creation' });
      } else {
        results.push({ table: 'search_history', status: 'exists' });
      }
    }

    // Check existing tables
    const { data: documents } = await supabase.from('documents').select('id').limit(1);
    const { data: chunks } = await supabase.from('document_chunks').select('id').limit(1);

    return res.status(200).json({
      success: true,
      message: 'Database table status check complete',
      results: [
        { table: 'documents', status: 'exists', accessible: !!documents },
        { table: 'document_chunks', status: 'exists', accessible: !!chunks },
        ...results
      ],
      instructions: {
        missingTables: results.filter(r => r.status.includes('missing')).map(r => r.table),
        sqlToExecute: `
-- Execute this SQL in Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS document_processing_status (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT,
    status TEXT DEFAULT 'pending',
    chunks_processed INTEGER DEFAULT 0,
    total_chunks INTEGER,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_history (
    id BIGSERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    query_embedding TEXT,
    results_count INTEGER,
    search_type TEXT DEFAULT 'hybrid',
    response_time_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE document_processing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all access" ON document_processing_status FOR ALL USING (true);
CREATE POLICY "Allow all access" ON search_history FOR ALL USING (true);
        `
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};