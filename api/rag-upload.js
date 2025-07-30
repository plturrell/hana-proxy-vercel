const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://fnsbxaywhsxqppncqksu.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.0lPx_Jk1q2W_GYv4B-36OB2E0GeEJ-bUB-SN9iXcvlo'
);

// Chunk text with overlap
function chunkText(text, maxChunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + maxChunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push({
      content: chunk,
      start,
      end
    });
    
    start = end - overlap;
    if (start >= text.length - overlap) break;
  }
  
  return chunks;
}

// Extract text from different file types
async function extractText(filepath, mimeType) {
  try {
    if (mimeType === 'application/pdf') {
      const dataBuffer = await fs.readFile(filepath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (mimeType === 'text/plain' || mimeType.startsWith('text/')) {
      return await fs.readFile(filepath, 'utf-8');
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Text extraction failed:', error);
    throw error;
  }
}

// Generate embeddings using local Transformers.js
const { pipeline } = require('@xenova/transformers');
let embeddingPipeline = null;

async function initializeModel() {
  if (!embeddingPipeline) {
    console.log('Initializing local embedding model...');
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true
    });
    console.log('Embedding model initialized');
  }
  return embeddingPipeline;
}

async function generateEmbedding(text) {
  try {
    const extractor = await initializeModel();
    const output = await extractor(text.substring(0, 512), { pooling: 'mean', normalize: true });
    
    // Convert to array and pad to 1536 dimensions
    const embedding = Array.from(output.data);
    const padded = new Array(1536).fill(0);
    embedding.forEach((val, idx) => {
      if (idx < 1536) padded[idx] = val;
    });
    
    return padded;
  } catch (error) {
    console.error('Local embedding generation failed:', error);
    return null;
  }
}

// Process uploaded file
async function processFile(file) {
  const { filepath, originalFilename, mimetype, size } = file;
  
  try {
    // Extract text from file
    const text = await extractText(filepath, mimetype);
    
    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        title: originalFilename,
        content: text,
        file_type: mimetype,
        file_size_bytes: size,
        metadata: {
          uploadedAt: new Date().toISOString(),
          processingVersion: '1.0'
        }
      })
      .select()
      .single();

    if (docError) {
      throw new Error(`Document creation failed: ${docError.message}`);
    }

    // Chunk the document
    const chunks = chunkText(text);
    const chunkRecords = [];

    // Process chunks with embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk.content);
      
      chunkRecords.push({
        document_id: document.id,
        content: chunk.content,
        chunk_index: i,
        embedding: embedding,
        metadata: {
          start: chunk.start,
          end: chunk.end,
          hasEmbedding: !!embedding
        }
      });
    }

    // Insert chunks
    const { error: chunkError } = await supabase
      .from('document_chunks')
      .insert(chunkRecords);

    if (chunkError) {
      console.error('Chunk insertion failed:', chunkError);
      // Don't fail completely - document is still created
    }

    return {
      success: true,
      document: {
        id: document.id,
        title: document.title,
        chunksCreated: chunkRecords.length,
        fileSize: size,
        fileType: mimetype
      }
    };

  } catch (error) {
    throw error;
  } finally {
    // Clean up uploaded file
    try {
      await fs.unlink(filepath);
    } catch (err) {
      console.error('Failed to delete temp file:', err);
    }
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

  try {
    // Parse multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      allowEmptyFiles: false,
      multiples: false
    });

    const [fields, files] = await form.parse(req);
    
    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Process the file
    const result = await processFile(file);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('Upload API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};