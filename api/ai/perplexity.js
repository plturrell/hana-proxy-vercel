// Perplexity API Integration - Real Production Endpoint
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
    
    if (!PERPLEXITY_API_KEY) {
      return res.status(503).json({ 
        error: 'Perplexity service not configured',
        details: 'PERPLEXITY_API_KEY environment variable not set'
      });
    }

    // Build messages with real-time market context
    const messages = [
      {
        role: 'system',
        content: `You are a Perplexity AI assistant specialized in real-time financial market analysis and news research. You have access to current market data and can provide up-to-date information about financial markets, news, and economic trends.
        
Current context:
- User session: ${sessionId}
- Portfolio data: ${context?.portfolio ? JSON.stringify(context.portfolio) : 'Not available'}
- Market data: ${context?.marketData ? JSON.stringify(context.marketData) : 'Not available'}

Focus on providing real-time market insights, news analysis, and data-driven responses with sources when possible.`
      }
    ];

    // Add conversation history if available
    if (context?.history && Array.isArray(context.history)) {
      messages.push(...context.history.slice(-10)); // Last 10 messages for context
    }

    messages.push({
      role: 'user',
      content: message
    });

    const startTime = Date.now();
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: messages,
        temperature: 0.2,
        max_tokens: 1000,
        return_citations: true,
        search_domain_filter: ["wsj.com", "bloomberg.com", "reuters.com", "ft.com", "cnbc.com"],
        search_recency_filter: "month"
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Perplexity API error:', error);
      return res.status(response.status).json({
        error: 'Perplexity service error',
        details: error.error?.message || 'Unknown error'
      });
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    return res.json({
      response: data.choices[0].message.content,
      model: 'llama-3.1-sonar-large-128k-online',
      citations: data.citations || [],
      usage: data.usage,
      metrics: {
        responseTime: responseTime,
        tokens: data.usage?.total_tokens || 0,
        confidence: 0.88,
        sources: data.citations?.length || 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Perplexity endpoint error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
    });
  }
}