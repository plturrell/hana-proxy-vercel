const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://fnsbxaywhsxqppncqksu.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.0lPx_Jk1q2W_GYv4B-36OB2E0GeEJ-bUB-SN9iXcvlo'
);

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

// Generate answer using Grok-4
async function generateAnswer(question, context) {
  try {
    const grokEndpoint = process.env.GROK_API_ENDPOINT || 'https://api.x.ai/v1';
    const grokApiKey = process.env.GROK_API_KEY || 'xai-test-key';

    const response = await fetch(`${grokEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`
      },
      body: JSON.stringify({
        model: 'grok-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert financial assistant helping with curriculum and learning. Answer based on the provided context.'
          },
          {
            role: 'user',
            content: `Context:\n${context}\n\nQuestion: ${question}\n\nProvide a helpful and accurate answer based on the context.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Grok answer generation failed:', error);
    // Fallback to simple response
    return `Based on the available information: ${context.substring(0, 200)}...`;
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
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    let results = [];
    let searchMethod = 'vector';

    if (queryEmbedding) {
      // Try vector similarity search
      try {
        const { data: chunks, error } = await supabase.rpc('search_documents', {
          query_embedding: queryEmbedding,
          similarity_threshold: 0.5,
          match_count: 5
        });

        if (!error && chunks && chunks.length > 0) {
          results = chunks;
        } else {
          searchMethod = 'fallback';
        }
      } catch (vectorError) {
        console.error('Vector search failed:', vectorError);
        searchMethod = 'fallback';
      }
    } else {
      searchMethod = 'fallback';
    }

    // Fallback to text search if vector search fails
    if (searchMethod === 'fallback') {
      try {
        const { data: chunks, error } = await supabase
          .from('document_chunks')
          .select('*, documents(title, file_type)')
          .textSearch('content', query)
          .limit(5);

        if (!error && chunks) {
          results = chunks.map(chunk => ({
            ...chunk,
            similarity: 0.5,
            document_title: chunk.documents?.title || 'Unknown'
          }));
        }
      } catch (textError) {
        console.error('Text search failed:', textError);
      }
    }

    // If still no results, try basic search
    if (results.length === 0) {
      try {
        const { data: chunks, error } = await supabase
          .from('document_chunks')
          .select('*, documents(title, file_type)')
          .ilike('content', `%${query}%`)
          .limit(5);

        if (!error && chunks) {
          results = chunks.map(chunk => ({
            ...chunk,
            similarity: 0.3,
            document_title: chunk.documents?.title || 'Unknown'
          }));
        }
      } catch (basicError) {
        console.error('Basic search failed:', basicError);
      }
    }

    // Generate answer
    let answer = 'No relevant information found.';
    if (results.length > 0) {
      const context = results
        .map(r => r.content)
        .join('\n\n');
      
      answer = await generateAnswer(query, context);
    }

    return res.status(200).json({
      success: true,
      query,
      answer,
      sources: results.map(r => ({
        content: r.content,
        documentTitle: r.document_title || r.documents?.title || 'Unknown',
        similarity: r.similarity || 0,
        chunkIndex: r.chunk_index
      })),
      searchMethod,
      totalResults: results.length
    });

  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};