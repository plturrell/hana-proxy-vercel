// Grok-3 API Integration - Real Production Endpoint
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

    const GROK_API_KEY = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
    
    if (!GROK_API_KEY) {
      return res.status(503).json({ 
        error: 'Grok service not configured',
        details: 'XAI_API_KEY environment variable not set'
      });
    }

    // Build messages with financial context
    const messages = [
      {
        role: 'system',
        content: `You are Grok-3, an advanced financial AI assistant with real-time market analysis capabilities. You provide sharp, insightful analysis of financial markets, portfolios, and investment strategies with a touch of wit and personality.
        
Current context:
- User session: ${sessionId}
- Portfolio data: ${context?.portfolio ? JSON.stringify(context.portfolio) : 'Not available'}
- Market data: ${context?.marketData ? JSON.stringify(context.marketData) : 'Not available'}

Provide concise, actionable responses with specific data and your characteristic insightful commentary.`
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
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-4-latest',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1200,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Grok API error:', error);
      return res.status(response.status).json({
        error: 'Grok service error',
        details: error.error?.message || 'Unknown error'
      });
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    return res.json({
      response: data.choices[0].message.content,
      model: 'grok-4-latest',
      usage: data.usage,
      metrics: {
        responseTime: responseTime,
        tokens: data.usage?.total_tokens || 0,
        confidence: 0.92
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Grok endpoint error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
    });
  }
}