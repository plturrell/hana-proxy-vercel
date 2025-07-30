const { createClient } = require('@supabase/supabase-js');
const { pipeline, env } = require('@xenova/transformers');

// Configure Transformers.js to use local models
env.localURL = '/models/';
env.allowRemoteModels = true; // Fallback to HF if needed

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize the embedding pipeline
let embeddingPipeline = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    // Use a small, fast embedding model that works well for documents
    // all-MiniLM-L6-v2 is 90MB and produces 384-dimensional embeddings
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true // Use quantized model for smaller size
    });
  }
  return embeddingPipeline;
}

// Generate embeddings locally using Transformers.js
async function generateEmbedding(text) {
  try {
    const pipe = await getEmbeddingPipeline();
    
    // Generate embeddings
    const output = await pipe(text, { 
      pooling: 'mean', 
      normalize: true 
    });
    
    // Convert to array and ensure it's the right dimension
    const embedding = Array.from(output.data);
    
    // Pad to 1536 dimensions to match our database schema
    // In production, you'd want to use the native dimension (384)
    const paddedEmbedding = new Array(1536).fill(0);
    embedding.forEach((val, idx) => {
      if (idx < paddedEmbedding.length) {
        paddedEmbedding[idx] = val;
      }
    });
    
    return paddedEmbedding;
  } catch (error) {
    console.error('Local embedding generation error:', error);
    // Return a zero vector as fallback
    return new Array(1536).fill(0);
  }
}

module.exports = async function handler(req, res) {
  // Set longer timeout for model loading
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
    const { documentId, chunks } = req.body;

    if (!documentId || !chunks || !Array.isArray(chunks)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Pre-load the model
    await getEmbeddingPipeline();

    // Generate embeddings for all chunks
    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async (chunk) => {
        const embedding = await generateEmbedding(chunk.content);
        return {
          ...chunk,
          embedding: `[${embedding.join(',')}]` // Format for PostgreSQL vector type
        };
      })
    );

    // Update chunks with embeddings
    const { error } = await supabase
      .from('document_chunks')
      .upsert(chunksWithEmbeddings, {
        onConflict: 'document_id,chunk_index'
      });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to store embeddings' });
    }

    // Update processing status
    await supabase
      .from('document_processing_status')
      .update({
        status: 'completed',
        chunks_processed: chunks.length,
        completed_at: new Date().toISOString()
      })
      .eq('document_id', documentId);

    return res.status(200).json({
      success: true,
      embeddingsGenerated: chunks.length,
      model: 'all-MiniLM-L6-v2',
      message: 'Embeddings generated locally'
    });

  } catch (error) {
    console.error('Embeddings API error:', error);
    return res.status(500).json({
      error: 'Processing failed',
      message: error.message
    });
  }
};

// Export config for Vercel
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    // Increase timeout for model loading
    maxDuration: 60
  }
};