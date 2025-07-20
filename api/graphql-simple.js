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
                confidence: 0.7
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
            direction: 'bullish',
            targetPrice: marketData?.price * 1.1 || 0,
            confidence: 0.75,
            timeframe: '3 months'
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
        opportunities: findOpportunities(marketData, newsData)
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
  // Simulate agent analysis for now
  const agents = ['Portfolio Risk Agent', 'Market Regime Detector', 'GARCH Volatility Forecaster'];
  
  return agents.map(agentId => ({
    agentId,
    prediction: 'bullish',
    confidence: 0.7 + Math.random() * 0.2,
    reasoning: `Based on current market conditions and ${symbol} fundamentals`
  }));
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

function findOpportunities(marketData, newsData) {
  const opportunities = [];
  
  // Positive momentum
  if (marketData?.change_percentage_24h > 2) {
    opportunities.push({
      type: 'momentum',
      potential: 'high',
      confidence: 0.65,
      timeframe: 'short-term'
    });
  }
  
  // Positive sentiment
  const sentiment = calculateSentiment(newsData);
  if (sentiment > 0.3) {
    opportunities.push({
      type: 'sentiment',
      potential: 'medium',
      confidence: 0.7,
      timeframe: 'medium-term'
    });
  }
  
  return opportunities;
}