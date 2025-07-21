// Enhanced GraphQL endpoint that uses existing News and Market Data agents + Deep Research
import { createClient } from '@supabase/supabase-js';
import { IntelligentNewsIntelligenceAgent } from '../agents/news-intelligence-agent-v2.js';
import { IntelligentMarketDataAgent } from '../agents/market-data-agent-v2.js';
import { MARKET_ANALYSIS_SCHEMA, callGrokStructured } from '../lib/grok-structured-schemas.js';
import { storeMarketAnalysis, storeNewsAnalysis } from '../lib/ai-to-database-mapper.js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// Initialize agents
let newsAgent;
let marketAgent;

async function initializeAgents() {
  if (!newsAgent) {
    newsAgent = new IntelligentNewsIntelligenceAgent({
      id: 'news-intelligence-001',
      name: 'News Intelligence Agent',
      metadata: { capabilities: ['sentiment_analysis', 'entity_extraction'] }
    });
  }
  
  if (!marketAgent) {
    marketAgent = new IntelligentMarketDataAgent({
      id: 'market-data-001',
      name: 'Market Data Agent',
      metadata: { capabilities: ['real_time_quotes', 'technical_analysis'] }
    });
  }
}

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
    await initializeAgents();
    const { query, variables = {} } = req.body;

    // Handle marketIntelligence query
    if (query.includes('marketIntelligence')) {
      const symbol = variables.symbol;
      
      if (!symbol) {
        return res.status(400).json({ 
          errors: [{ message: 'Symbol parameter is required' }] 
        });
      }

      // Get data from agents and deep research in parallel
      const [marketData, newsAnalysis, technicalAnalysis, deepResearch] = await Promise.all([
        getEnhancedMarketData(symbol),
        getNewsAnalysis(symbol),
        getTechnicalAnalysis(symbol),
        getDeepResearchSummary(symbol)
      ]);

      // Build comprehensive intelligence response
      const intelligence = {
        symbol,
        currentPrice: marketData?.price || 0,
        priceChange: marketData?.change_amount || 0,
        percentageChange: marketData?.change_percent || 0,
        volume: marketData?.volume || 0,
        
        // Technical indicators from market data
        technical: technicalAnalysis,
        
        // News sentiment and analysis
        sentiment: {
          overall: newsAnalysis?.overallSentiment || 0,
          trajectory: newsAnalysis?.sentimentTrend || 'stable',
          newsImpact: {
            articles: newsAnalysis?.articles || [],
            impactMap: newsAnalysis?.impactMap || {
              primaryImpact: 'neutral',
              secondaryImpacts: [],
              timeline: 'short-term'
            }
          }
        },
        
        // AI-powered predictions combining both data sources
        predictions: {
          consensus: combineAnalyses(marketData, newsAnalysis, technicalAnalysis),
          agentPredictions: [
            {
              agentId: 'news-intelligence-001',
              prediction: newsAnalysis?.prediction || 'neutral',
              confidence: newsAnalysis?.confidence || 0.5,
              reasoning: newsAnalysis?.reasoning || 'Insufficient news data'
            },
            {
              agentId: 'market-data-001',
              prediction: technicalAnalysis?.prediction || 'neutral',
              confidence: technicalAnalysis?.confidence || 0.5,
              reasoning: technicalAnalysis?.reasoning || 'Insufficient market data'
            }
          ]
        },
        
        // Risk assessment from both news and technical
        risks: identifyRisks(marketData, newsAnalysis, technicalAnalysis),
        
        // Opportunities based on combined analysis
        opportunities: await findOpportunities(symbol, marketData, newsAnalysis, technicalAnalysis),
        
        // Deep research insights (multi-source institutional analysis)
        deepResearch: deepResearch
      };

      return res.status(200).json({
        data: {
          marketIntelligence: intelligence
        }
      });
    }

    // Handle deepResearch query
    if (query.includes('deepResearch')) {
      const { symbol, type } = variables;
      
      if (!symbol) {
        return res.status(400).json({ 
          errors: [{ message: 'Symbol parameter is required' }] 
        });
      }

      const researchType = type || 'company-research';
      const deepResearch = await performDeepResearch(symbol, researchType);

      return res.status(200).json({
        data: {
          deepResearch
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

// Enhanced market data with technical analysis
async function getEnhancedMarketData(symbol) {
  try {
    // Get latest market data from database
    const { data } = await supabase
      .from('market_data')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(20); // Get more data for technical analysis

    if (!data || data.length === 0) return null;

    const latest = data[0];
    const prices = data.map(d => d.price);
    
    // Calculate technical indicators
    latest.sma20 = prices.length >= 20 ? prices.reduce((a, b) => a + b) / prices.length : null;
    latest.rsi = calculateRSI(prices);
    latest.volatility = calculateVolatility(prices);
    
    return latest;
  } catch (error) {
    console.error('Market data error:', error);
    return null;
  }
}

// Get news analysis from news agent
async function getNewsAnalysis(symbol) {
  try {
    // Get news articles from database - search both NVIDIA and NVDA for comprehensive results
    const searchTerms = symbol === 'NVDA' ? ['NVDA', 'NVIDIA'] : [symbol];
    let { data: articles } = await supabase
      .from('news_articles')
      .select('*')
      .or(searchTerms.map(term => `title.ilike.%${term}%,content.ilike.%${term}%`).join(','))
      .order('published_at', { ascending: false })
      .limit(10);

    if (!articles || articles.length === 0) {
      return { overallSentiment: 0, sentimentTrend: 'stable', articles: [] };
    }

    // Analyze sentiment
    const sentiments = articles.map(a => a.sentiment_score || 0).filter(s => s !== 0);
    const overallSentiment = sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : 0;
    
    // Determine trend
    const recentSentiment = sentiments.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const olderSentiment = sentiments.slice(3, 6).reduce((a, b) => a + b, 0) / 3;
    const sentimentTrend = recentSentiment > olderSentiment + 0.1 ? 'improving' :
                          recentSentiment < olderSentiment - 0.1 ? 'declining' : 'stable';

    // Process articles for insights
    const processedArticles = articles.slice(0, 5).map(article => ({
      id: article.article_id,
      title: article.title,
      sentiment: article.sentiment_score || 0,
      importance: calculateImportance(article),
      publishedAt: article.published_at,
      source: article.source,
      keyInsights: extractKeyInsights(article),
      marketImpact: assessMarketImpact(article)
    }));

    // Generate prediction based on news
    const prediction = overallSentiment > 0.3 ? 'bullish' :
                      overallSentiment < -0.3 ? 'bearish' : 'neutral';
    
    const confidence = Math.min(0.9, Math.abs(overallSentiment) + 0.3);

    return {
      overallSentiment,
      sentimentTrend,
      articles: processedArticles,
      prediction,
      confidence,
      reasoning: `Based on ${articles.length} recent news articles with ${sentimentTrend} sentiment trend`,
      impactMap: {
        primaryImpact: prediction,
        secondaryImpacts: identifySecondaryImpacts(articles),
        timeline: determineImpactTimeline(articles)
      }
    };
  } catch (error) {
    console.error('News analysis error:', error);
    return null;
  }
}

// Technical analysis from market data
async function getTechnicalAnalysis(symbol) {
  try {
    const { data } = await supabase
      .from('market_data')
      .select('price, volume, timestamp')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (!data || data.length < 10) return null;

    const prices = data.map(d => d.price);
    const volumes = data.map(d => d.volume);
    
    // Calculate indicators
    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);
    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);
    const volumeTrend = analyzeVolumeTrend(volumes);
    
    // Generate technical prediction
    let signals = 0;
    if (prices[0] > sma20) signals++;
    if (sma20 > sma50) signals++;
    if (rsi > 30 && rsi < 70) signals++;
    if (macd.signal > 0) signals++;
    if (volumeTrend === 'increasing') signals++;
    
    const prediction = signals >= 4 ? 'bullish' : signals <= 1 ? 'bearish' : 'neutral';
    const confidence = Math.min(0.85, signals * 0.17);
    
    return {
      indicators: {
        price: prices[0],
        sma20,
        sma50,
        rsi,
        macd: macd.value,
        macdSignal: macd.signal,
        volumeTrend
      },
      prediction,
      confidence,
      reasoning: `Technical indicators show ${signals}/5 bullish signals`,
      support: calculateSupport(prices),
      resistance: calculateResistance(prices)
    };
  } catch (error) {
    console.error('Technical analysis error:', error);
    return null;
  }
}

// Combine analyses from different sources
function combineAnalyses(marketData, newsAnalysis, technicalAnalysis) {
  const predictions = [];
  let totalConfidence = 0;
  
  if (newsAnalysis?.prediction) {
    predictions.push({ source: 'news', prediction: newsAnalysis.prediction, weight: newsAnalysis.confidence });
    totalConfidence += newsAnalysis.confidence;
  }
  
  if (technicalAnalysis?.prediction) {
    predictions.push({ source: 'technical', prediction: technicalAnalysis.prediction, weight: technicalAnalysis.confidence });
    totalConfidence += technicalAnalysis.confidence;
  }
  
  if (predictions.length === 0) {
    return { direction: null, confidence: null, timeframe: null };
  }
  
  // Weight predictions by confidence
  let bullishScore = 0;
  let bearishScore = 0;
  
  predictions.forEach(p => {
    if (p.prediction === 'bullish') bullishScore += p.weight;
    else if (p.prediction === 'bearish') bearishScore += p.weight;
  });
  
  const direction = bullishScore > bearishScore ? 'bullish' : 
                   bearishScore > bullishScore ? 'bearish' : 'neutral';
  
  const confidence = totalConfidence / predictions.length;
  
  return {
    direction,
    targetPrice: calculateTargetPrice(marketData?.price, direction, confidence),
    confidence,
    timeframe: '1-4 weeks'
  };
}

// Risk identification from multiple sources
function identifyRisks(marketData, newsAnalysis, technicalAnalysis) {
  const risks = [];
  
  // Volatility risk
  if (technicalAnalysis?.indicators?.rsi > 70) {
    risks.push({
      factor: 'Overbought Conditions',
      severity: 'medium',
      probability: 0.7,
      mitigation: 'Consider taking profits or tight stop-loss'
    });
  }
  
  if (technicalAnalysis?.indicators?.rsi < 30) {
    risks.push({
      factor: 'Oversold Conditions',
      severity: 'medium',
      probability: 0.7,
      mitigation: 'Potential bounce, but wait for confirmation'
    });
  }
  
  // News-based risks
  if (newsAnalysis?.overallSentiment < -0.5) {
    risks.push({
      factor: 'Negative News Sentiment',
      severity: 'high',
      probability: 0.8,
      mitigation: 'Monitor news closely for sentiment shift'
    });
  }
  
  // Market structure risks
  if (marketData?.price < technicalAnalysis?.indicators?.sma50) {
    risks.push({
      factor: 'Below Key Moving Average',
      severity: 'medium',
      probability: 0.6,
      mitigation: 'Wait for price to reclaim MA before entering'
    });
  }
  
  return risks;
}

// Find opportunities using Grok AI
async function findOpportunities(symbol, marketData, newsAnalysis, technicalAnalysis) {
  const grokApiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  
  if (!grokApiKey) {
    // Return basic opportunities without AI
    return generateBasicOpportunities(marketData, newsAnalysis, technicalAnalysis);
  }
  
  try {
    const prompt = `Analyze this comprehensive market data for ${symbol} and identify specific trading opportunities:

Market Data:
- Current Price: $${marketData?.price}
- Change: ${marketData?.change_percent}%
- RSI: ${technicalAnalysis?.indicators?.rsi}
- Price vs SMA20: ${marketData?.price > technicalAnalysis?.indicators?.sma20 ? 'Above' : 'Below'}
- Volume Trend: ${technicalAnalysis?.indicators?.volumeTrend}

News Analysis:
- Overall Sentiment: ${newsAnalysis?.overallSentiment}
- Sentiment Trend: ${newsAnalysis?.sentimentTrend}
- Recent Headlines: ${newsAnalysis?.articles?.slice(0, 3).map(a => a.title).join('; ')}

Technical Analysis:
- Prediction: ${technicalAnalysis?.prediction}
- Support: $${technicalAnalysis?.support}
- Resistance: $${technicalAnalysis?.resistance}

Identify opportunities with specific entry/exit points, risk/reward ratios, and catalysts.`;

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
            content: 'You are an expert trading analyst. Provide specific, actionable opportunities based on the data provided. Return as JSON array.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      try {
        return JSON.parse(content);
      } catch {
        return generateBasicOpportunities(marketData, newsAnalysis, technicalAnalysis);
      }
    }
  } catch (error) {
    console.error('AI opportunity analysis failed:', error);
  }
  
  return generateBasicOpportunities(marketData, newsAnalysis, technicalAnalysis);
}

// Helper functions for technical analysis
function calculateSMA(prices, period) {
  if (prices.length < period) return null;
  const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
  return sum / period;
}

function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const difference = prices[i - 1] - prices[i];
    if (difference > 0) gains += difference;
    else losses -= difference;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  
  return 100 - (100 / (1 + rs));
}

function calculateMACD(prices) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  const signal = calculateEMA([macd], 9);
  
  return { value: macd, signal };
}

function calculateEMA(prices, period) {
  if (prices.length < period) return prices[0];
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

function calculateVolatility(prices) {
  if (prices.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i - 1] - prices[i]) / prices[i]);
  }
  
  const mean = returns.reduce((a, b) => a + b) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

function analyzeVolumeTrend(volumes) {
  if (volumes.length < 5) return 'stable';
  
  const recent = volumes.slice(0, 3).reduce((a, b) => a + b) / 3;
  const older = volumes.slice(3, 6).reduce((a, b) => a + b) / 3;
  
  return recent > older * 1.2 ? 'increasing' : 
         recent < older * 0.8 ? 'decreasing' : 'stable';
}

function calculateSupport(prices) {
  return Math.min(...prices.slice(0, 20));
}

function calculateResistance(prices) {
  return Math.max(...prices.slice(0, 20));
}

function calculateImportance(article) {
  let score = 5;
  
  if (article.relevance_score) score = article.relevance_score;
  if (Math.abs(article.sentiment_score) > 0.7) score += 2;
  if (article.source?.toLowerCase().includes('reuters') || 
      article.source?.toLowerCase().includes('bloomberg')) score += 1;
  
  return Math.min(10, score);
}

function extractKeyInsights(article) {
  // Extract key insights from article content
  const insights = [];
  
  if (article.entities) {
    try {
      const entities = typeof article.entities === 'string' ? 
        JSON.parse(article.entities) : article.entities;
      
      if (entities.length > 0) {
        insights.push(`Mentions: ${entities.slice(0, 3).map(e => e.name || e).join(', ')}`);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  if (article.sentiment_score > 0.5) {
    insights.push('Positive sentiment detected');
  } else if (article.sentiment_score < -0.5) {
    insights.push('Negative sentiment detected');
  }
  
  return insights;
}

function assessMarketImpact(article) {
  const sentiment = article.sentiment_score || 0;
  const importance = calculateImportance(article);
  
  return {
    direction: sentiment > 0 ? 'positive' : sentiment < 0 ? 'negative' : 'neutral',
    magnitude: Math.abs(sentiment) * (importance / 10),
    confidence: Math.min(0.9, importance / 10)
  };
}

function identifySecondaryImpacts(articles) {
  const impacts = new Set();
  
  articles.forEach(article => {
    if (article.content?.toLowerCase().includes('sector')) impacts.add('sector');
    if (article.content?.toLowerCase().includes('competitor')) impacts.add('competitors');
    if (article.content?.toLowerCase().includes('regulation')) impacts.add('regulatory');
    if (article.content?.toLowerCase().includes('supply chain')) impacts.add('supply_chain');
  });
  
  return Array.from(impacts);
}

function determineImpactTimeline(articles) {
  const hasEarnings = articles.some(a => 
    a.content?.toLowerCase().includes('earnings') || 
    a.content?.toLowerCase().includes('quarterly')
  );
  
  const hasRegulatory = articles.some(a => 
    a.content?.toLowerCase().includes('regulation') || 
    a.content?.toLowerCase().includes('investigation')
  );
  
  if (hasEarnings) return 'short-term';
  if (hasRegulatory) return 'long-term';
  return 'medium-term';
}

function calculateTargetPrice(currentPrice, direction, confidence) {
  if (!currentPrice || !direction) return null;
  
  const movePercent = confidence * 0.1; // Max 10% move
  
  if (direction === 'bullish') {
    return currentPrice * (1 + movePercent);
  } else if (direction === 'bearish') {
    return currentPrice * (1 - movePercent);
  }
  
  return currentPrice;
}

function generateBasicOpportunities(marketData, newsAnalysis, technicalAnalysis) {
  const opportunities = [];
  
  // Basic sentiment-based opportunity
  if (newsAnalysis?.overallSentiment > 0.3) {
    opportunities.push({
      type: 'sentiment',
      asset: marketData?.symbol || 'Unknown',
      direction: 'long',
      confidence: 0.6,
      potential_return: '3-8%',
      risk_level: 'medium',
      timeframe: '1-2 weeks',
      entry_criteria: 'Positive news sentiment above 0.3',
      exit_criteria: 'Take profits on sentiment reversal',
      catalyst: 'Positive news coverage'
    });
  }
  
  // Technical opportunity
  if (technicalAnalysis?.prediction === 'bullish') {
    opportunities.push({
      type: 'technical',
      asset: marketData?.symbol || 'Unknown',
      direction: 'long',
      confidence: technicalAnalysis.confidence || 0.5,
      potential_return: '4-10%',
      risk_level: 'medium',
      timeframe: '1-3 weeks',
      entry_criteria: technicalAnalysis.reasoning || 'Technical signals confirm bullish trend',
      exit_criteria: `Stop loss below support levels`,
      catalyst: 'Technical momentum'
    });
  }
  
  return opportunities;
}

// Deep Research Functions for Production Integration

/**
 * Get deep research summary for GraphQL marketIntelligence query
 */
async function getDeepResearchSummary(symbol) {
  try {
    // Check if we have recent deep research for this symbol
    const { data: existingResearch } = await supabase
      .from('deep_research_reports')
      .select('*')
      .eq('symbol', symbol)
      .eq('report_type', 'company_research')
      .order('created_at', { ascending: false })
      .limit(1);

    // If we have research from last 24 hours, use it
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (existingResearch && existingResearch.length > 0) {
      const research = existingResearch[0];
      if (new Date(research.created_at) > oneDayAgo) {
        return {
          summary: research.content.substring(0, 500) + '...',
          sources_analyzed: research.sources_count,
          research_depth: 'institutional_grade',
          last_updated: research.created_at,
          full_report_available: true,
          report_id: research.id
        };
      }
    }

    // Generate new deep research if needed and API key available
    if (PERPLEXITY_API_KEY) {
      const deepResearch = await performDeepResearch(symbol, 'company-research');
      return {
        summary: deepResearch.analysis?.substring(0, 500) + '...' || 'Analysis in progress',
        sources_analyzed: deepResearch.metadata?.sources_analyzed || 0,
        research_depth: 'institutional_grade',
        last_updated: new Date().toISOString(),
        full_report_available: true,
        report_id: deepResearch.report_id
      };
    }

    return {
      summary: 'Deep research requires Perplexity API key for institutional-grade analysis',
      sources_analyzed: 0,
      research_depth: 'basic',
      last_updated: null,
      full_report_available: false
    };

  } catch (error) {
    console.error('Deep research summary error:', error);
    return {
      summary: 'Deep research temporarily unavailable',
      sources_analyzed: 0,
      research_depth: 'basic',
      last_updated: null,
      full_report_available: false
    };
  }
}

/**
 * Perform deep research using Perplexity's sonar-deep-research model
 */
async function performDeepResearch(symbol, researchType) {
  if (!PERPLEXITY_API_KEY) {
    return {
      error: 'Deep research requires Perplexity API key',
      analysis: null,
      metadata: { sources_analyzed: 0 }
    };
  }

  try {
    let prompt;
    switch (researchType) {
      case 'company-research':
        prompt = `Conduct comprehensive institutional-grade research on ${symbol} including: financial performance analysis, competitive positioning, management evaluation, growth prospects, risk assessment, recent developments, analyst opinions, and investment outlook. Provide detailed analysis with supporting data.`;
        break;
      case 'risk-assessment':
        prompt = `Perform comprehensive risk assessment for ${symbol} investment. Analyze financial risks, operational risks, regulatory risks, competitive threats, market risks, ESG factors, and provide detailed risk mitigation strategies.`;
        break;
      case 'competitive-intelligence':
        prompt = `Conduct competitive intelligence analysis for ${symbol}. Research main competitors, market share, competitive advantages/disadvantages, strategic positioning, and emerging threats.`;
        break;
      default:
        prompt = `Analyze ${symbol} from multiple perspectives including fundamentals, technicals, market position, and investment outlook.`;
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-deep-research',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        reasoning_effort: 'high',
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Store in database for future use
    const { data: insertedReport, error } = await supabase
      .from('deep_research_reports')
      .insert({
        symbol,
        report_type: researchType,
        content: analysis,
        sources_count: data.citations?.length || 0,
        citations: data.citations || [],
        search_context: data.search_results || [],
        metadata: {
          sources_analyzed: data.citations?.length || 0,
          search_context_size: data.usage?.search_context_size || 'high',
          reasoning_tokens: data.usage?.reasoning_tokens || 0,
          research_depth: 'exhaustive'
        }
      })
      .select()
      .single();

    return {
      symbol,
      report_type: researchType,
      analysis,
      metadata: {
        sources_analyzed: data.citations?.length || 0,
        search_context_size: data.usage?.search_context_size || 'high',
        reasoning_tokens: data.usage?.reasoning_tokens || 0,
        research_depth: 'exhaustive'
      },
      citations: data.citations || [],
      report_id: insertedReport?.id,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Deep research error:', error);
    return {
      error: error.message,
      analysis: null,
      metadata: { sources_analyzed: 0 }
    };
  }
}