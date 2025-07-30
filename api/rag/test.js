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
      message: 'RAG system is operational',
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        vercel: process.env.VERCEL ? 'true' : 'false',
        supabase: process.env.SUPABASE_URL ? 'configured' : 'not configured',
        grok4: (process.env.GROK4_API_KEY || process.env.XAI_API_KEY) ? 'configured' : 'not configured'
      }
    };

    // Test dependencies
    try {
      const { createClient } = require('@supabase/supabase-js');
      testData.dependencies = { supabase: 'available' };
    } catch (error) {
      testData.dependencies = { supabase: 'error: ' + error.message };
    }

    return res.status(200).json(testData);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};