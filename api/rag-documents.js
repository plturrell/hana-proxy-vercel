const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://fnsbxaywhsxqppncqksu.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.0lPx_Jk1q2W_GYv4B-36OB2E0GeEJ-bUB-SN9iXcvlo'
);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Fetch documents from database
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(200).json({
        success: false,
        documents: [],
        total: 0,
        error: error.message
      });
    }

    // Format documents for display
    const formattedDocs = (documents || []).map(doc => ({
      id: doc.id,
      title: doc.title || 'Untitled',
      fileType: doc.file_type || 'unknown',
      fileSize: doc.file_size_bytes ? formatFileSize(doc.file_size_bytes) : '0 B',
      uploadedAt: doc.created_at,
      status: 'processed'
    }));

    return res.status(200).json({
      success: true,
      documents: formattedDocs,
      total: formattedDocs.length
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}