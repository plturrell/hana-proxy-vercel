const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');
const fs = require('fs').promises;
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ multiples: true });

  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.document;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read file content
    const fileContent = await fs.readFile(file.filepath, 'utf-8');
    const metadata = fields.metadata ? JSON.parse(fields.metadata) : {};

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        title: file.originalFilename || 'Untitled',
        file_type: file.mimetype,
        file_size_bytes: file.size,
        metadata: metadata,
        source_url: metadata.source_url || null
      })
      .select()
      .single();

    if (docError) {
      console.error('Document creation error:', docError);
      return res.status(500).json({ error: 'Failed to create document record' });
    }

    // Simple chunking (split by paragraphs for now)
    const chunks = fileContent
      .split(/\n\n+/)
      .filter(chunk => chunk.trim().length > 0)
      .map((content, index) => ({
        document_id: document.id,
        chunk_index: index,
        content: content.trim(),
        token_count: Math.ceil(content.length / 4), // Rough estimate
        metadata: { position: index }
      }));

    // Insert chunks
    if (chunks.length > 0) {
      const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert(chunks);

      if (chunkError) {
        console.error('Chunk insertion error:', chunkError);
        // Don't fail completely, document is created
      }
    }

    // Update processing status
    await supabase
      .from('document_processing_status')
      .insert({
        document_id: document.id,
        status: 'completed',
        chunks_processed: chunks.length,
        total_chunks: chunks.length,
        completed_at: new Date().toISOString()
      });

    // Clean up temp file
    await fs.unlink(file.filepath).catch(() => {});

    return res.status(200).json({
      success: true,
      documentId: document.id,
      chunksProcessed: chunks.length,
      message: 'Document processed successfully'
    });

  } catch (error) {
    console.error('RAG processing error:', error);
    return res.status(500).json({
      success: false,
      error: 'Processing failed',
      message: error.message
    });
  }
};