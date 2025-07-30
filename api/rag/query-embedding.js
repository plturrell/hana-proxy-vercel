const { pipeline, env } = require('@xenova/transformers');

// Configure Transformers.js
env.localURL = '/models/';
env.allowRemoteModels = true;

// Initialize the embedding pipeline
let embeddingPipeline = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true
    });
  }
  return embeddingPipeline;
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
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query text is required' });
    }

    // Generate embedding
    const pipe = await getEmbeddingPipeline();
    const output = await pipe(query, { 
      pooling: 'mean', 
      normalize: true 
    });
    
    // Convert to array
    const embedding = Array.from(output.data);
    
    // Pad to 1536 dimensions to match database schema
    const paddedEmbedding = new Array(1536).fill(0);
    embedding.forEach((val, idx) => {
      if (idx < paddedEmbedding.length) {
        paddedEmbedding[idx] = val;
      }
    });

    return res.status(200).json({
      success: true,
      embedding: paddedEmbedding,
      model: 'all-MiniLM-L6-v2',
      dimensions: {
        original: embedding.length,
        padded: paddedEmbedding.length
      }
    });

  } catch (error) {
    console.error('Query embedding error:', error);
    return res.status(500).json({
      error: 'Failed to generate embedding',
      message: error.message
    });
  }
};

// Export config for Vercel
module.exports.config = {
  api: {
    maxDuration: 30
  }
};