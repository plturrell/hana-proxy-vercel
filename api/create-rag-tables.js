const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
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
    console.log('🚀 Creating missing RAG tables...');
    
    // Create document_processing_status table manually
    const processingStatusSql = `
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
    `;

    // Create search_history table manually
    const searchHistorySql = `
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
    `;

    const results = [];

    // Try to create tables by inserting dummy data (this will create the table structure)
    try {
      // First check if tables exist
      let { data: statusTable, error: statusError } = await supabase
        .from('document_processing_status')
        .select('id')
        .limit(1);

      if (statusError && statusError.code === '42P01') {
        results.push({ table: 'document_processing_status', status: 'missing - need manual creation' });
      } else {
        results.push({ table: 'document_processing_status', status: 'exists' });
      }

      let { data: historyTable, error: historyError } = await supabase
        .from('search_history')
        .select('id')
        .limit(1);

      if (historyError && historyError.code === '42P01') {
        results.push({ table: 'search_history', status: 'missing - need manual creation' });
      } else {
        results.push({ table: 'search_history', status: 'exists' });
      }

    } catch (err) {
      results.push({ error: err.message });
    }

    // Also check existing tables
    const { data: documents } = await supabase
      .from('documents')
      .select('id')
      .limit(1);

    const { data: chunks } = await supabase
      .from('document_chunks')
      .select('id')
      .limit(1);

    return res.status(200).json({
      success: true,
      message: 'RAG table creation attempted',
      results: results,
      existingTables: {
        documents: documents ? 'exists' : 'missing',
        document_chunks: chunks ? 'exists' : 'missing'
      },
      instructions: {
        message: 'Missing tables need to be created manually in Supabase dashboard',
        sql: {
          document_processing_status: processingStatusSql,
          search_history: searchHistorySql
        }
      }
    });

  } catch (error) {
    console.error('RAG table creation error:', error);
    return res.status(500).json({
      error: 'Failed to create tables',
      message: error.message,
      suggestion: 'Tables need to be created manually in Supabase SQL editor'
    });
  }
};