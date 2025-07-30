module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test basic functionality
    const testData = {
      success: true,
      message: 'Simple test endpoint working',
      timestamp: new Date().toISOString(),
      method: req.method,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        supabaseUrl: process.env.SUPABASE_URL ? 'configured' : 'missing',
        vercelUrl: process.env.VERCEL_URL || 'local'
      }
    };

    // Test Supabase connection
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        'https://fnsbxaywhsxqppncqksu.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.0lPx_Jk1q2W_GYv4B-36OB2E0GeEJ-bUB-SN9iXcvlo'
      );

      const { data, error } = await supabase
        .from('documents')
        .select('id')
        .limit(1);

      testData.database = {
        connection: 'success',
        documentsTable: error ? 'error: ' + error.message : 'accessible',
        sampleCount: data?.length || 0
      };
    } catch (dbError) {
      testData.database = {
        connection: 'failed',
        error: dbError.message
      };
    }

    return res.status(200).json(testData);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};