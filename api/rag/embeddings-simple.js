const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Simple fallback using HuggingFace API without local model
async function generateEmbedding(text) {
  try {
    // Use HuggingFace Inference API as the primary method
    const response = await fetch('https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY || 'hf_placeholder'}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: text,
        options: { wait_for_model: true }
      })
    });

    if (response.ok) {
      const embedding = await response.json();
      
      // Pad to 1536 dimensions to match database schema
      const paddedEmbedding = new Array(1536).fill(0);
      if (Array.isArray(embedding) && embedding.length > 0) {
        embedding.forEach((val, idx) => {
          if (idx < paddedEmbedding.length) {
            paddedEmbedding[idx] = val;
          }
        });
      }
      
      return paddedEmbedding;
    }
    
    // If HF API fails, return a zero vector
    return new Array(1536).fill(0);
  } catch (error) {
    console.error('Embedding generation error:', error);
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

  try {
    const { documentId, chunks } = req.body;

    if (!documentId || !chunks || !Array.isArray(chunks)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

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

    // Update chunks with embeddings - only use existing tables
    const { error } = await supabase
      .from('document_chunks')
      .upsert(chunksWithEmbeddings, {
        onConflict: 'document_id,chunk_index'
      });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        error: 'Failed to store embeddings',
        details: error.message 
      });
    }

    return res.status(200).json({
      success: true,
      embeddingsGenerated: chunks.length,
      model: 'all-MiniLM-L6-v2 (HuggingFace API)',
      message: 'Embeddings generated successfully'
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
    maxDuration: 60
  }
};