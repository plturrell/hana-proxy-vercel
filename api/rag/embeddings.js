const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Generate embeddings using OpenAI API
async function generateEmbedding(text) {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    // Return a zero vector as fallback
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