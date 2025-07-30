const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');
const fs = require('fs').promises;

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://fnsbxaywhsxqppncqksu.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.0lPx_Jk1q2W_GYv4B-36OB2E0GeEJ-bUB-SN9iXcvlo'
);

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
    maxDuration: 60,
  },
};

// Simple text chunking
function chunkText(text, maxChunkSize = 1000) {
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [text]; // Fallback to original text
}

// Generate embedding using HuggingFace API
async function generateEmbedding(text) {
  try {
    const response = await fetch('https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: text,
        options: { wait_for_model: true }
      })
    });

    if (response.ok) {
      const embedding = await response.json();
      if (Array.isArray(embedding) && embedding.length > 0) {
        // Pad to 1536 dimensions
        const paddedEmbedding = new Array(1536).fill(0);
        embedding.forEach((val, idx) => {
          if (idx < paddedEmbedding.length) {
            paddedEmbedding[idx] = val;
          }
        });
        return paddedEmbedding;
      }
    }
    
    return new Array(1536).fill(0); // Fallback zero vector
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return new Array(1536).fill(0);
  }
}

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

  const form = formidable({ 
    multiples: false,
    maxFileSize: 10 * 1024 * 1024 // 10MB limit
  });

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

    // Read file content (assuming text file for now)
    let fileContent;
    try {
      fileContent = await fs.readFile(file.filepath, 'utf-8');
    } catch (readError) {
      console.error('File read error:', readError);
      return res.status(400).json({ error: 'Could not read file content' });
    }

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        title: file.originalFilename || 'Untitled Document',
        file_type: file.mimetype || 'text/plain',
        file_size_bytes: file.size,
        metadata: { source: 'upload' }
      })
      .select()
      .single();

    if (docError) {
      console.error('Document creation error:', docError);
      return res.status(500).json({ error: 'Failed to create document record' });
    }

    // Log processing status (with error handling)
    try {
      await supabase
        .from('document_processing_status')
        .insert({
          document_id: document.id,
          status: 'processing',
          started_at: new Date().toISOString()
        });
    } catch (statusError) {
      console.log('Processing status logging skipped (table may not exist)');
    }

    // Chunk the content
    const textChunks = chunkText(fileContent);
    console.log(`Created ${textChunks.length} chunks for document ${document.id}`);

    // Process chunks with embeddings
    const processedChunks = [];
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const embedding = await generateEmbedding(chunk);
      
      processedChunks.push({
        document_id: document.id,
        chunk_index: i,
        content: chunk,
        embedding: `[${embedding.join(',')}]`, // PostgreSQL vector format
        token_count: Math.ceil(chunk.length / 4),
        metadata: { 
          position: i,
          total_chunks: textChunks.length
        }
      });
    }

    // Insert chunks
    const { error: chunkError } = await supabase
      .from('document_chunks')
      .insert(processedChunks);

    if (chunkError) {
      console.error('Chunk insertion error:', chunkError);
      return res.status(500).json({ error: 'Failed to store document chunks' });
    }

    // Update processing status
    try {
      await supabase
        .from('document_processing_status')
        .update({
          status: 'completed',
          chunks_processed: processedChunks.length,
          total_chunks: processedChunks.length,
          completed_at: new Date().toISOString()
        })
        .eq('document_id', document.id);
    } catch (statusError) {
      console.log('Processing status update skipped (table may not exist)');
    }

    // Clean up temp file
    await fs.unlink(file.filepath).catch(() => {});

    return res.status(200).json({
      success: true,
      documentId: document.id,
      title: document.title,
      chunksProcessed: processedChunks.length,
      fileSize: file.size,
      message: 'Document uploaded and processed successfully'
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message
    });
  }
};