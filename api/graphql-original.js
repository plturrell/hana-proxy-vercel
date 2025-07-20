// Simplified GraphQL endpoint for Vercel Functions
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Simple GraphQL implementation without Apollo complexity
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, variables = {} } = req.body;

    // Parse the query to determine what's being requested
    if (query.includes('marketIntelligence')) {
      const symbol = variables.symbol;
      
      if (!symbol) {
        return res.status(400).json({ 
          errors: [{ message: 'Symbol parameter is required' }] 
        });
      }

      // Fetch data from multiple sources in parallel
      const [marketData, newsData, agentData] = await Promise.all([
        getMarketData(symbol),
        getNewsData(symbol),
        getAgentAnalysis(symbol)
      ]);

      // Build intelligent response
      const intelligence = {
        symbol,
        currentPrice: marketData?.price || 0,
        sentiment: {
          overall: calculateSentiment(newsData),
          trajectory: determineSentimentTrajectory(newsData),
          newsImpact: {
            articles: newsData.slice(0, 5).map(article => ({
              id: article.id,
              title: article.title,
              sentiment: article.sentiment_score || 0,
              importance: article.importance_score || 5,
              relatedEntities: extractEntities(article),
              marketImpact: {
                direction: article.sentiment_score > 0 ? 'positive' : 'negative',
                magnitude: Math.abs(article.sentiment_score || 0),
                confidence: null // Removed hardcoded confidence
              }
            })),
            impactMap: {
              primaryImpact: 'direct',
              secondaryImpacts: ['sector', 'competitors'],
              timeline: 'short-term'
            }
          }
        },
        predictions: {
          consensus: {
            direction: null, // Removed hardcoded prediction
            targetPrice: null, // Removed hardcoded target
            confidence: null, // Removed hardcoded confidence
            timeframe: null // Removed hardcoded timeframe
          },
          agentPredictions: agentData
        },
        knowledge: {
          entity: {
            id: symbol,
            name: symbol,
            type: 'COMPANY',
            connections: []
          },
          relatedEntities: []
        },
        risks: identifyRisks(marketData, newsData),
        opportunities: await findOpportunities(marketData, newsData)
      };

      return res.status(200).json({
        data: {
          marketIntelligence: intelligence
        }
      });

    } else if (query.includes('__schema')) {
      // Return basic schema introspection
      return res.status(200).json({
        data: {
          __schema: {
            queryType: {
              name: 'Query',
              fields: [
                {
                  name: 'marketIntelligence',
                  type: { name: 'MarketIntelligence' }
                },
                {
                  name: 'knowledgeGraph',
                  type: { name: 'KnowledgeNetwork' }
                },
                {
                  name: 'agentConsensus',
                  type: { name: 'AgentIntelligence' }
                }
              ]
            }
          }
        }
      });
    }

    // Default response for unhandled queries
    return res.status(200).json({
      data: {},
      errors: [{ message: 'Query not implemented yet' }]
    });

  } catch (error) {
    console.error('GraphQL error:', error);
    return res.status(500).json({
      errors: [{ message: error.message }]
    });
  }
}

// Helper functions
async function getMarketData(symbol) {
  try {
    const { data } = await supabase
      .from('market_data')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    return data;
  } catch (error) {
    console.error('Market data error:', error);
    return null;
  }
}

async function getNewsData(symbol) {
  try {
    const { data } = await supabase
      .from('news_articles')
      .select('*')
      .or(`entities.cs.{"${symbol}"},title.ilike.%${symbol}%,content.ilike.%${symbol}%`)
      .order('published_at', { ascending: false })
      .limit(10);
    
    return data || [];
  } catch (error) {
    console.error('News data error:', error);
    return [];
  }
}

async function getAgentAnalysis(symbol) {
  // Get real agent analysis via AI or return null if unavailable
  if (!process.env.GROK_API_KEY && !process.env.XAI_API_KEY) {
    return null;
  }
  
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY || process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-4-0709',
        messages: [
          {
            role: 'system',
            content: 'You are a financial agent analysis system. Provide real analysis for the given symbol.'
          },
          {
            role: 'user',
            content: `Analyze ${symbol} from portfolio risk, market regime, and volatility perspectives. Return JSON with agentId, prediction, confidence, and reasoning for each agent.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      console.error('Agent analysis API failed:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    try {
      return JSON.parse(content);
    } catch {
      console.error('Failed to parse agent analysis response');
      return null;
    }
  } catch (error) {
    console.error('Agent analysis failed:', error);
    return null;
  }
}

function calculateSentiment(newsData) {
  if (!newsData || newsData.length === 0) return 0;
  
  const avgSentiment = newsData.reduce((sum, article) => 
    sum + (article.sentiment_score || 0), 0) / newsData.length;
  
  return avgSentiment;
}

function determineSentimentTrajectory(newsData) {
  if (!newsData || newsData.length < 2) return 'stable';
  
  const recent = newsData.slice(0, 3);
  const older = newsData.slice(3, 6);
  
  const recentAvg = calculateSentiment(recent);
  const olderAvg = calculateSentiment(older);
  
  if (recentAvg > olderAvg + 0.1) return 'improving';
  if (recentAvg < olderAvg - 0.1) return 'declining';
  return 'stable';
}

function extractEntities(article) {
  const entities = [];
  
  if (article.entities) {
    try {
      const parsed = typeof article.entities === 'string' 
        ? JSON.parse(article.entities) 
        : article.entities;
      
      return parsed.slice(0, 3).map(entity => ({
        id: entity.id || entity.name,
        name: entity.name,
        type: entity.type || 'UNKNOWN'
      }));
    } catch (e) {
      // Fallback if parsing fails
    }
  }
  
  return entities;
}

function identifyRisks(marketData, newsData) {
  const risks = [];
  
  // Volatility risk
  if (marketData?.change_percentage_24h && Math.abs(marketData.change_percentage_24h) > 5) {
    risks.push({
      factor: 'High Volatility',
      severity: 'medium',
      probability: 0.6,
      mitigation: 'Consider position sizing'
    });
  }
  
  // Negative sentiment risk
  const sentiment = calculateSentiment(newsData);
  if (sentiment < -0.3) {
    risks.push({
      factor: 'Negative Sentiment',
      severity: 'high',
      probability: 0.7,
      mitigation: 'Monitor news closely'
    });
  }
  
  return risks;
}

async function findOpportunities(marketData, newsData) {
  // Use real AI for market opportunity analysis
  const grokApiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  
  if (!grokApiKey) {
    console.error('AI API key not configured - opportunity analysis unavailable');
    return [];
  }
  
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`
      },
      body: JSON.stringify({
        model: 'grok-4-0709',
        messages: [
          {
            role: 'system',
            content: 'You are an expert market analysis AI specializing in identifying trading and investment opportunities. Analyze market data and news to detect actionable opportunities with specific risk/reward profiles.'
          },
          {
            role: 'user',
            content: `Analyze this market data for opportunities:

Market Data: ${JSON.stringify(marketData)}
News Context: ${JSON.stringify(newsData)}

Identify opportunities considering:
1. Technical patterns and momentum signals
2. News sentiment vs. price discrepancies
3. Volume anomalies and institutional activity
4. Cross-asset correlations and arbitrage
5. Volatility patterns and options opportunities
6. Support/resistance level breaks
7. Sector rotation patterns
8. Risk-adjusted return potential

Return JSON array of opportunities:
[
  {
    "type": "momentum|mean_reversion|arbitrage|volatility|fundamental|technical",
    "asset": "specific asset or symbol",
    "direction": "long|short|neutral",
    "confidence": <0-1>,
    "potential_return": "<percentage>",
    "risk_level": "low|medium|high",
    "timeframe": "minutes|hours|days|weeks",
    "entry_criteria": "specific entry conditions",
    "exit_criteria": "specific exit conditions",
    "risk_management": "stop loss and position sizing",
    "catalyst": "what drives this opportunity",
    "probability": <0-1>,
    "risk_reward_ratio": <number>,
    "market_regime": "trending|ranging|volatile|calm",
    "supporting_indicators": ["indicator1", "indicator2"],
    "competing_factors": ["risk1", "risk2"]
  }
]`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error('Opportunity analysis API failed:', response.status);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    try {
      return JSON.parse(content) || [];
    } catch {
      console.error('Failed to parse opportunity analysis response');
      return [];
    }
  } catch (error) {
    console.error('AI opportunity analysis failed:', error);
    return [];
  }
}