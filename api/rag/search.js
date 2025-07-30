const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Generate embedding for search query using Grok-4
async function generateQueryEmbedding(query) {
  try {
    const grokApiKey = process.env.GROK4_API_KEY || process.env.XAI_API_KEY;
    const grokEndpoint = process.env.GROK4_ENDPOINT || 'https://api.x.ai/v1';
    
    if (!grokApiKey) {
      console.error('Grok-4 API key not configured');
      return null;
    }

    const response = await fetch(`${grokEndpoint}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grokApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-embedding',
        input: query,
        encoding_format: 'float'
      })
    });

    if (!response.ok) {
      throw new Error(`Grok-4 API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Query embedding error:', error);
    return null;
  }
}

// Generate AI answer using Grok-4
async function generateAnswer(query, context) {
  try {
    const grokApiKey = process.env.GROK4_API_KEY || process.env.XAI_API_KEY;
    const grokEndpoint = process.env.GROK4_ENDPOINT || 'https://api.x.ai/v1';
    
    if (!grokApiKey) {
      console.error('Grok-4 API key not configured');
      return 'Unable to generate answer - AI service not configured.';
    }

    const response = await fetch(`${grokEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grokApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert financial assistant that answers questions based on the provided context. Be precise and cite specific information from the context. If the context doesn\'t contain relevant information, say so clearly.'
          },
          {
            role: 'user',
            content: `Context:\n${context}\n\nQuestion: ${query}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "text" }
      })
    });

    if (!response.ok) {
      throw new Error(`Grok-4 API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Answer generation error:', error);
    return 'Unable to generate answer at this time. Please check your Grok-4 configuration.';
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
    const { query, searchType = 'hybrid', limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const startTime = Date.now();

    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query);
    
    let searchResults = [];

    if (searchType === 'hybrid' && queryEmbedding) {
      // Hybrid search using the database function
      const { data, error } = await supabase.rpc('hybrid_search', {
        query_text: query,
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_count: limit
      });

      if (!error && data) {
        searchResults = data;
      }
    } else if (searchType === 'vector' && queryEmbedding) {
      // Vector-only search
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: 0.7,
        match_count: limit
      });

      if (!error && data) {
        searchResults = data;
      }
    } else {
      // Fallback to full-text search
      const { data, error } = await supabase
        .from('document_chunks')
        .select('id, document_id, content, metadata')
        .textSearch('content', query)
        .limit(limit);

      if (!error && data) {
        searchResults = data.map(r => ({ ...r, similarity: 0.5 }));
      }
    }

    // Get document titles
    const documentIds = [...new Set(searchResults.map(r => r.document_id))];
    const { data: documents } = await supabase
      .from('documents')
      .select('id, title')
      .in('id', documentIds);

    const docTitles = documents?.reduce((acc, doc) => {
      acc[doc.id] = doc.title;
      return acc;
    }, {}) || {};

    // Format sources
    const sources = searchResults.map(result => ({
      id: result.id,
      documentId: result.document_id,
      title: docTitles[result.document_id] || 'Unknown',
      content: result.content.substring(0, 200) + '...',
      similarity: result.similarity || result.rank_score || 0
    }));

    // Generate AI answer if we have results
    let answer = 'No relevant information found.';
    if (searchResults.length > 0) {
      const context = searchResults
        .map(r => r.content)
        .join('\n\n---\n\n');
      
      answer = await generateAnswer(query, context);
    }

    const responseTime = Date.now() - startTime;

    // Log search for analytics
    await supabase
      .from('search_history')
      .insert({
        query,
        query_embedding: queryEmbedding ? `[${queryEmbedding.join(',')}]` : null,
        results_count: searchResults.length,
        search_type: searchType,
        response_time_ms: responseTime
      });

    return res.status(200).json({
      success: true,
      answer,
      sources,
      relevance: sources.length > 0 ? sources[0].similarity : 0,
      responseTime,
      searchType
    });

  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
};