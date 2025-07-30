const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Simple query endpoint using only existing tables
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
    const { query, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const startTime = Date.now();

    // Simple full-text search on document_chunks
    const { data: searchResults, error } = await supabase
      .from('document_chunks')
      .select(`
        id,
        document_id,
        content,
        metadata,
        documents!inner (
          id,
          title,
          file_type
        )
      `)
      .textSearch('content', query)
      .limit(limit);

    if (error) {
      console.error('Search error:', error);
      return res.status(500).json({ 
        error: 'Search failed',
        message: error.message 
      });
    }

    // Format results
    const sources = (searchResults || []).map(result => ({
      id: result.id,
      documentId: result.document_id,
      title: result.documents?.title || 'Unknown Document',
      content: result.content.substring(0, 200) + '...',
      fileType: result.documents?.file_type || 'unknown',
      similarity: 0.75 // Mock similarity score
    }));

    // Generate simple answer using Grok-4
    let answer = 'No relevant information found.';
    if (searchResults && searchResults.length > 0) {
      try {
        const context = searchResults
          .map(r => r.content)
          .join('\n\n---\n\n');
        
        const grokApiKey = process.env.GROK4_API_KEY || process.env.XAI_API_KEY;
        if (grokApiKey) {
          const response = await fetch('https://api.x.ai/v1/chat/completions', {
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
                  content: 'You are a helpful financial assistant. Answer based on the provided context.'
                },
                {
                  role: 'user',
                  content: `Context:\n${context}\n\nQuestion: ${query}`
                }
              ],
              temperature: 0.3,
              max_tokens: 300
            })
          });

          if (response.ok) {
            const data = await response.json();
            answer = data.choices[0].message.content;
          }
        } else {
          answer = `Based on the available documents, I found ${searchResults.length} relevant sections. The information covers: ${searchResults.map(r => r.content.substring(0, 100)).join('; ')}...`;
        }
      } catch (grokError) {
        console.error('Grok API error:', grokError);
        answer = `Found ${searchResults.length} relevant documents but could not generate AI response.`;
      }
    }

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      answer,
      sources,
      searchType: 'fulltext',
      resultsCount: sources.length,
      responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Query API error:', error);
    return res.status(500).json({
      error: 'Query failed',
      message: error.message
    });
  }
};