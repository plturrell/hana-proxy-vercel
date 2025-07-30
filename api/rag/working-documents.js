const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://fnsbxaywhsxqppncqksu.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.0lPx_Jk1q2W_GYv4B-36OB2E0GeEJ-bUB-SN9iXcvlo'
);

// Format file size for display
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all documents with chunk count
    const { data: documents, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        file_type,
        file_size_bytes,
        metadata,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Documents fetch error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch documents',
        message: error.message 
      });
    }

    // Get chunk counts for each document
    const documentsWithCounts = await Promise.all(
      (documents || []).map(async (doc) => {
        try {
          const { data: chunks, error: chunkError } = await supabase
            .from('document_chunks')
            .select('id', { count: 'exact' })
            .eq('document_id', doc.id);

          const chunkCount = chunkError ? 0 : (chunks?.length || 0);

          return {
            id: doc.id,
            title: doc.title,
            fileType: doc.file_type,
            fileSize: formatFileSize(doc.file_size_bytes),
            fileSizeBytes: doc.file_size_bytes,
            chunkCount: chunkCount,
            uploadedAt: doc.created_at,
            metadata: doc.metadata || {},
            status: chunkCount > 0 ? 'processed' : 'pending'
          };
        } catch (err) {
          console.error('Error getting chunk count for document', doc.id, err);
          return {
            id: doc.id,
            title: doc.title,
            fileType: doc.file_type,
            fileSize: formatFileSize(doc.file_size_bytes),
            fileSizeBytes: doc.file_size_bytes,
            chunkCount: 0,
            uploadedAt: doc.created_at,
            metadata: doc.metadata || {},
            status: 'error'
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      documents: documentsWithCounts,
      total: documentsWithCounts.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Documents API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};