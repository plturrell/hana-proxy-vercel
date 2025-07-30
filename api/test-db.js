const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const result = {
      env: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      },
      timestamp: new Date().toISOString()
    };

    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      // Try to query a simple table
      const { data, error } = await supabase
        .from('documents')
        .select('count')
        .limit(1);

      result.database = {
        connected: !error,
        error: error?.message || null,
        hasDocumentsTable: !error
      };
    } else {
      result.database = {
        connected: false,
        error: 'Missing environment variables'
      };
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(200).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};