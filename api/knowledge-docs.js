/**
 * Simple document list endpoint for Knowledge Base
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For now, return empty documents to test if endpoint works
    const mockDocuments = [];
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      // Try to get real documents
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data: documents, error } = await supabase
          .from('rag_documents')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (!error && documents) {
          return res.status(200).json({
            documents: documents.map(doc => ({
              id: doc.id,
              name: doc.filename || doc.name || 'Untitled',
              size: formatFileSize(doc.file_size || 0),
              chunks: 0, // Will be calculated later
              created_at: doc.created_at,
              metadata: doc.metadata || {}
            })),
            total: documents.length
          });
        }
      } catch (e) {
        console.error('Supabase error:', e);
      }
    }
    
    // Return empty list as fallback
    return res.status(200).json({
      documents: mockDocuments,
      total: 0,
      message: 'Knowledge base is ready'
    });
    
  } catch (error) {
    console.error('Knowledge docs error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}