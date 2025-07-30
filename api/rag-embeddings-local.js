const { pipeline } = require('@xenova/transformers');

// Cache for the embedding pipeline
let embeddingPipeline = null;

// Initialize the embedding model
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

// Generate embeddings locally
async function generateEmbedding(text) {
  try {
    const extractor = await initializeModel();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    
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
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    // Generate embedding locally
    const embedding = await generateEmbedding(text);
    
    if (!embedding) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate embedding'
      });
    }

    return res.status(200).json({
      success: true,
      embedding,
      dimensions: embedding.length,
      model: 'all-MiniLM-L6-v2'
    });

  } catch (error) {
    console.error('Embedding API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};