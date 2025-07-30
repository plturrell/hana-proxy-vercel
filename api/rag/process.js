const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');
const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const config = {
  api: {
    bodyParser: false,
    maxDuration: 60, // 60 seconds for large PDFs
  },
};

// Intelligent chunking strategy
function intelligentChunking(text, maxChunkSize = 1500, overlap = 200) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const chunks = [];
  let currentChunk = '';
  let currentSize = 0;

  for (const sentence of sentences) {
    const sentenceSize = sentence.trim().length;
    
    if (currentSize + sentenceSize > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      
      // Add overlap by including last few sentences
      const overlapText = currentChunk.split(/[.!?]+/).slice(-2).join('. ');
      currentChunk = overlapText + ' ' + sentence;
      currentSize = currentChunk.length;
    } else {
      currentChunk += ' ' + sentence;
      currentSize += sentenceSize;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Extract text from PDF
async function extractPDFText(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract PDF content');
  }
}

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

    // Process file based on type
    let fileContent;
    const fileBuffer = await fs.readFile(file.filepath);
    
    if (file.mimetype === 'application/pdf') {
      // Extract text from PDF
      fileContent = await extractPDFText(fileBuffer);
    } else {
      // Read as text for other file types
      fileContent = fileBuffer.toString('utf-8');
    }

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

    // Update processing status to processing
    await supabase
      .from('document_processing_status')
      .insert({
        document_id: document.id,
        status: 'processing',
        started_at: new Date().toISOString()
      });

    // Intelligent chunking with overlap
    const textChunks = intelligentChunking(fileContent);
    const chunks = textChunks.map((content, index) => ({
      document_id: document.id,
      chunk_index: index,
      content: content,
      token_count: Math.ceil(content.length / 4), // Rough estimate
      metadata: { 
        position: index,
        total_chunks: textChunks.length,
        has_overlap: index > 0
      }
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

    // Generate embeddings using local Hugging Face model
    try {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/rag/embeddings-local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          chunks: chunks
        })
      });

      if (!response.ok) {
        console.error('Local embedding generation failed');
        // Don't fail the whole process, embeddings can be generated later
      } else {
        const data = await response.json();
        console.log(`Generated ${data.embeddingsGenerated} embeddings using ${data.model}`);
      }
    } catch (error) {
      console.error('Local embedding API error:', error);
    }

    // Update processing status
    await supabase
      .from('document_processing_status')
      .update({
        status: 'completed',
        chunks_processed: chunks.length,
        total_chunks: chunks.length,
        completed_at: new Date().toISOString()
      })
      .eq('document_id', document.id);

    // Clean up temp file
    await fs.unlink(file.filepath).catch(() => {});

    return res.status(200).json({
      success: true,
      documentId: document.id,
      chunksProcessed: chunks.length,
      message: 'Document processed successfully',
      embeddingsQueued: true
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