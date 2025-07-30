const { createClient } = require('@supabase/supabase-js');

// Direct configuration to avoid environment issues
const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.0lPx_Jk1q2W_GYv4B-36OB2E0GeEJ-bUB-SN9iXcvlo'
);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test database connection
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
      .limit(10);

    const { data: chunks, error: chunkError } = await supabase
      .from('document_chunks')  
      .select('*')
      .limit(10);

    // Test if missing tables exist
    let processingStatus = null;
    let searchHistory = null;
    
    try {
      const { data: ps } = await supabase
        .from('document_processing_status')
        .select('*')
        .limit(1);
      processingStatus = 'exists';
    } catch (err) {
      processingStatus = 'missing: ' + err.message;
    }

    try {
      const { data: sh } = await supabase
        .from('search_history')
        .select('*')
        .limit(1);
      searchHistory = 'exists';
    } catch (err) {
      searchHistory = 'missing: ' + err.message;
    }

    return res.status(200).json({
      success: true,
      message: 'RAG System Status Check',
      timestamp: new Date().toISOString(),
      tables: {
        documents: {
          status: docError ? 'error: ' + docError.message : 'exists',
          count: documents?.length || 0,
          sample: documents?.[0] || null
        },
        document_chunks: {
          status: chunkError ? 'error: ' + chunkError.message : 'exists', 
          count: chunks?.length || 0,
          sample: chunks?.[0] || null
        },
        document_processing_status: {
          status: processingStatus
        },
        search_history: {
          status: searchHistory
        }
      },
      environment: {
        supabaseUrl: process.env.SUPABASE_URL ? 'configured' : 'missing',
        supabaseKey: process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing',
        vercelUrl: process.env.VERCEL_URL || 'local'
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