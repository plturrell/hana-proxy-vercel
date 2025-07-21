/**
 * Grok Portfolio Impact Analysis with Function Calling
 * Uses X.AI's function calling to connect news events to actual portfolio positions
 * and calculate real financial impact
 */

import { createClient } from '@supabase/supabase-js';
import { createPerplexityNewsFetcher } from '../lib/perplexity-news-fetcher.js';
import { createMarketDataFetcher } from '../lib/market-data-fetcher.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// Function definitions for Grok to call
const portfolioFunctions = [
  {
    name: "get_portfolio_positions",
    description: "Get current portfolio positions for a user",
    parameters: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "The user ID to get portfolio for"
        },
        include_cash: {
          type: "boolean",
          description: "Whether to include cash positions"
        }
      },
      required: ["user_id"]
    }
  },
  {
    name: "calculate_position_exposure",
    description: "Calculate exposure of positions to specific companies or sectors",
    parameters: {
      type: "object",
      properties: {
        positions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              symbol: { type: "string" },
              quantity: { type: "number" },
              current_price: { type: "number" }
            }
          }
        },
        affected_entities: {
          type: "array",
          items: { type: "string" },
          description: "Companies or sectors affected by news"
        }
      },
      required: ["positions", "affected_entities"]
    }
  },
  {
    name: "get_security_correlations",
    description: "Get correlation data between securities",
    parameters: {
      type: "object",
      properties: {
        primary_symbol: {
          type: "string",
          description: "The main security symbol"
        },
        related_symbols: {
          type: "array",
          items: { type: "string" },
          description: "Symbols to check correlation with"
        },
        timeframe: {
          type: "string",
          enum: ["1M", "3M", "6M", "1Y"],
          description: "Timeframe for correlation calculation"
        }
      },
      required: ["primary_symbol", "related_symbols"]
    }
  },
  {
    name: "calculate_dollar_impact",
    description: "Calculate actual dollar impact on portfolio value",
    parameters: {
      type: "object",
      properties: {
        positions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              symbol: { type: "string" },
              quantity: { type: "number" },
              current_price: { type: "number" },
              impact_percentage: { type: "number" }
            }
          }
        },
        confidence_level: {
          type: "number",
          description: "Confidence in the impact assessment (0-1)"
        }
      },
      required: ["positions"]
    }
  },
  {
    name: "get_sector_exposure",
    description: "Get portfolio exposure to specific sectors",
    parameters: {
      type: "object",
      properties: {
        portfolio_id: {
          type: "string",
          description: "Portfolio identifier"
        },
        sectors: {
          type: "array",
          items: { type: "string" },
          description: "Sectors to analyze exposure for"
        }
      },
      required: ["portfolio_id", "sectors"]
    }
  },
  {
    name: "store_impact_analysis",
    description: "Store the impact analysis results in database",
    parameters: {
      type: "object",
      properties: {
        analysis: {
          type: "object",
          properties: {
            news_id: { type: "string" },
            portfolio_id: { type: "string" },
            total_impact: { type: "number" },
            affected_positions: { type: "array" },
            recommendations: { type: "array" },
            confidence: { type: "number" }
          }
        }
      },
      required: ["analysis"]
    }
  }
];

// Function implementations
async function executeFunction(functionName, args) {
  switch (functionName) {
    case "get_portfolio_positions":
      return await getPortfolioPositions(args);
    case "calculate_position_exposure":
      return await calculatePositionExposure(args);
    case "get_security_correlations":
      return await getSecurityCorrelations(args);
    case "calculate_dollar_impact":
      return await calculateDollarImpact(args);
    case "get_sector_exposure":
      return await getSectorExposure(args);
    case "store_impact_analysis":
      return await storeImpactAnalysis(args);
    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}

async function getPortfolioPositions({ user_id, portfolio_id, include_cash = false }) {
  try {
    // Build query based on what's provided
    let query = supabase.from('portfolio_positions').select('*');
    
    if (portfolio_id) {
      query = query.eq('portfolio_id', portfolio_id);
    } else if (user_id) {
      // First get portfolio for user
      const { data: portfolio } = await supabase
        .from('portfolios')
        .select('portfolio_id')
        .eq('user_id', user_id)
        .single();
      
      if (portfolio) {
        query = query.eq('portfolio_id', portfolio.portfolio_id);
      }
    }
    
    const { data: positions, error } = await query;
    if (error) throw error;

    // Get current prices
    const symbols = positions.map(p => p.symbol);
    const { data: prices } = await supabase
      .from('market_data')
      .select('symbol, current_price, change_percent')
      .in('symbol', symbols)
      .order('timestamp', { ascending: false })
      .limit(symbols.length);

    // Combine position and price data
    const enrichedPositions = positions.map(pos => {
      const priceData = prices?.find(p => p.symbol === pos.symbol) || {};
      return {
        ...pos,
        current_price: priceData.current_price || pos.purchase_price,
        change_percent: priceData.change_percent || 0,
        market_value: pos.quantity * (priceData.current_price || pos.purchase_price)
      };
    });

    return {
      success: true,
      positions: enrichedPositions,
      total_value: enrichedPositions.reduce((sum, p) => sum + p.market_value, 0),
      position_count: enrichedPositions.length
    };
  } catch (error) {
    console.error('Error getting portfolio positions:', error);
    return {
      success: false,
      error: error.message,
      positions: []
    };
  }
}

async function calculatePositionExposure({ positions, affected_entities }) {
  const exposures = [];
  
  for (const position of positions) {
    // Direct exposure - position is directly mentioned
    const directExposure = affected_entities.includes(position.symbol);
    
    // Sector exposure - position is in same sector
    const { data: securityInfo } = await supabase
      .from('securities')
      .select('sector, industry')
      .eq('symbol', position.symbol)
      .single();
    
    const sectorExposure = affected_entities.some(entity => 
      securityInfo && (
        entity.toLowerCase() === securityInfo.sector?.toLowerCase() ||
        entity.toLowerCase() === securityInfo.industry?.toLowerCase()
      )
    );
    
    // Calculate exposure score
    let exposureScore = 0;
    if (directExposure) exposureScore = 1.0;
    else if (sectorExposure) exposureScore = 0.5;
    
    // Get correlation-based exposure
    if (!directExposure && affected_entities.length > 0) {
      const correlations = await getSecurityCorrelations({
        primary_symbol: position.symbol,
        related_symbols: affected_entities.filter(e => e.match(/^[A-Z]+$/))
      });
      
      if (correlations.success && correlations.correlations.length > 0) {
        const maxCorrelation = Math.max(...correlations.correlations.map(c => Math.abs(c.correlation)));
        exposureScore = Math.max(exposureScore, maxCorrelation * 0.7);
      }
    }
    
    exposures.push({
      symbol: position.symbol,
      exposure_type: directExposure ? 'direct' : sectorExposure ? 'sector' : 'correlation',
      exposure_score: exposureScore,
      position_value: position.quantity * position.current_price,
      potential_impact: exposureScore * position.quantity * position.current_price
    });
  }
  
  return {
    success: true,
    exposures,
    total_exposed_value: exposures.reduce((sum, e) => sum + e.potential_impact, 0),
    high_exposure_positions: exposures.filter(e => e.exposure_score > 0.7)
  };
}

async function getSecurityCorrelations({ primary_symbol, related_symbols, timeframe = "3M" }) {
  try {
    // In production, this would calculate real correlations from historical data
    // For now, return mock correlations
    const correlations = related_symbols.map(symbol => ({
      symbol,
      correlation: symbol === primary_symbol ? 1.0 : Math.random() * 0.6 + 0.2,
      timeframe
    }));
    
    return {
      success: true,
      primary_symbol,
      correlations,
      calculation_date: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      correlations: []
    };
  }
}

async function calculateDollarImpact({ positions, confidence_level = 0.7 }) {
  const impacts = positions.map(pos => {
    const currentValue = pos.quantity * pos.current_price;
    const impactDollars = currentValue * (pos.impact_percentage / 100);
    
    return {
      symbol: pos.symbol,
      current_value: currentValue,
      impact_dollars: impactDollars,
      impact_percentage: pos.impact_percentage,
      adjusted_impact: impactDollars * confidence_level
    };
  });
  
  return {
    success: true,
    position_impacts: impacts,
    total_impact: impacts.reduce((sum, i) => sum + i.impact_dollars, 0),
    adjusted_total_impact: impacts.reduce((sum, i) => sum + i.adjusted_impact, 0),
    confidence_level,
    calculation_timestamp: new Date().toISOString()
  };
}

async function getSectorExposure({ portfolio_id, sectors }) {
  try {
    const { data: positions } = await supabase
      .from('portfolio_positions')
      .select('symbol, quantity, current_price')
      .eq('portfolio_id', portfolio_id);
    
    const sectorExposures = {};
    
    for (const position of positions || []) {
      const { data: security } = await supabase
        .from('securities')
        .select('sector, industry')
        .eq('symbol', position.symbol)
        .single();
      
      if (security && sectors.includes(security.sector)) {
        if (!sectorExposures[security.sector]) {
          sectorExposures[security.sector] = {
            value: 0,
            positions: []
          };
        }
        
        const positionValue = position.quantity * position.current_price;
        sectorExposures[security.sector].value += positionValue;
        sectorExposures[security.sector].positions.push({
          symbol: position.symbol,
          value: positionValue
        });
      }
    }
    
    return {
      success: true,
      sector_exposures: sectorExposures,
      total_exposure: Object.values(sectorExposures).reduce((sum, s) => sum + s.value, 0)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      sector_exposures: {}
    };
  }
}

async function storeImpactAnalysis({ analysis }) {
  try {
    const { data, error } = await supabase
      .from('portfolio_impact_analysis')
      .insert({
        ...analysis,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      analysis_id: data.id,
      stored_at: data.created_at
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Main handler
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET request to fetch current news
  if (req.method === 'GET') {
    return await handleFetchCurrentNews(req, res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { news_data, portfolio_id, user_id, fetch_current_news } = req.body;

  // If fetch_current_news is true, get real news and analyze automatically
  if (fetch_current_news) {
    return await handleAutoAnalyzeCurrentNews(req, res, { portfolio_id, user_id });
  }

  if (!news_data || (!portfolio_id && !user_id)) {
    return res.status(400).json({ 
      error: 'Missing required parameters',
      required: ['news_data', 'portfolio_id or user_id'] 
    });
  }

  if (!GROK_API_KEY) {
    return res.status(500).json({ 
      error: 'Grok API key not configured',
      message: 'Set GROK_API_KEY or XAI_API_KEY environment variable'
    });
  }

  try {
    // Call Grok with function calling enabled
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-4-0709',
        messages: [
          {
            role: 'system',
            content: `You are a portfolio impact analyst. Analyze how news events affect specific portfolio positions.
            Use the provided functions to:
            1. Get actual portfolio positions
            2. Calculate exposure to affected companies/sectors
            3. Determine dollar impact on portfolio
            4. Generate specific recommendations

            Always provide position-specific analysis, not generic advice.`
          },
          {
            role: 'user',
            content: `Analyze the impact of this news on the portfolio:

News: ${JSON.stringify(news_data, null, 2)}
User ID: ${user_id || 'from portfolio'}
Portfolio ID: ${portfolio_id || 'from user'}

Steps:
1. Extract affected companies and sectors from the news
2. Get portfolio positions
3. Calculate exposure of each position
4. Determine dollar impact
5. Generate position-specific recommendations`
          }
        ],
        functions: portfolioFunctions,
        function_call: "auto",
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${error}`);
    }

    const completion = await response.json();
    
    // Process function calls
    const functionCalls = [];
    let finalAnalysis = null;
    
    for (const choice of completion.choices) {
      if (choice.message.function_call) {
        const functionName = choice.message.function_call.name;
        const functionArgs = JSON.parse(choice.message.function_call.arguments);
        
        // Execute the function
        const result = await executeFunction(functionName, functionArgs);
        functionCalls.push({
          function: functionName,
          args: functionArgs,
          result
        });
      }
      
      if (choice.message.content) {
        try {
          finalAnalysis = JSON.parse(choice.message.content);
        } catch {
          finalAnalysis = { analysis: choice.message.content };
        }
      }
    }

    // Return comprehensive analysis
    return res.json({
      success: true,
      news_analyzed: {
        title: news_data.title,
        summary: news_data.summary,
        entities_mentioned: news_data.entities || []
      },
      portfolio_impact: finalAnalysis,
      function_calls: functionCalls,
      recommendations: finalAnalysis?.recommendations || [],
      total_dollar_impact: finalAnalysis?.total_impact || 0,
      affected_positions: finalAnalysis?.affected_positions || [],
      confidence_score: finalAnalysis?.confidence || 0,
      analysis_timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Portfolio impact analysis error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed',
      details: error.message,
      fallback: 'Use news-intelligence-verify endpoint for basic analysis'
    });
  }
}

/**
 * Handle fetching current news
 */
async function handleFetchCurrentNews(req, res) {
  try {
    const newsFetcher = createPerplexityNewsFetcher();
    const marketDataFetcher = createMarketDataFetcher();
    const { symbols } = req.query;
    
    const portfolioSymbols = symbols ? symbols.split(',') : ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'META', 'AMZN'];
    
    // Check API status first
    if (!newsFetcher.isConfigured()) {
      return res.status(400).json({
        error: 'Perplexity API key not configured',
        message: 'Set PERPLEXITY_API_KEY in environment variables'
      });
    }
    
    const currentNews = await newsFetcher.fetchCurrentFinancialNews(portfolioSymbols);
    const marketDataStatus = await marketDataFetcher.testConnections();
    
    return res.json({
      success: true,
      news_count: currentNews.length,
      current_news: currentNews,
      api_status: {
        perplexity: newsFetcher.isConfigured(),
        market_data: marketDataStatus
      },
      symbols_searched: portfolioSymbols,
      fetch_timestamp: new Date().toISOString(),
      news_source: 'perplexity',
      market_data_sources: ['fmp', 'finnhub'],
      avg_age_hours: currentNews.length > 0 ? 
        Math.round(currentNews.reduce((sum, n) => sum + n.age_hours, 0) / currentNews.length) : 0
    });
  } catch (error) {
    console.error('Error fetching current news:', error);
    return res.status(500).json({
      error: 'Failed to fetch current news',
      details: error.message
    });
  }
}

/**
 * Handle auto-analyze current news
 */
async function handleAutoAnalyzeCurrentNews(req, res, { portfolio_id, user_id }) {
  try {
    console.log('🔄 Auto-analyzing current news for portfolio impact...');
    
    // Fetch real current news from Perplexity
    const newsFetcher = createPerplexityNewsFetcher();
    const marketDataFetcher = createMarketDataFetcher();
    
    if (!newsFetcher.isConfigured()) {
      return res.status(400).json({
        error: 'Perplexity API key not configured',
        message: 'Set PERPLEXITY_API_KEY in environment variables'
      });
    }
    
    const currentNews = await newsFetcher.fetchCurrentFinancialNews();
    
    if (!currentNews || currentNews.length === 0) {
      return res.json({
        success: false,
        error: 'No current news found',
        recommendation: 'Check Perplexity API key or try again later',
        api_status: {
          perplexity: newsFetcher.isConfigured(),
          market_data: await marketDataFetcher.testConnections()
        }
      });
    }
    
    console.log(`✅ Found ${currentNews.length} current news articles`);
    
    // Analyze impact of the most relevant/recent news
    const topNews = currentNews.slice(0, 3); // Analyze top 3 most recent
    const allAnalyses = [];
    
    for (const newsItem of topNews) {
      console.log(`🤖 Analyzing: ${newsItem.title}`);
      
      // Call Grok with function calling for this news item
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'grok-4-0709',
          messages: [
            {
              role: 'system',
              content: `You are analyzing REAL current financial news for portfolio impact. This news is ${newsItem.age_hours} hours old.
              
              Portfolio: ${portfolio_id || user_id}
              News validation: Published ${newsItem.age_hours}h ago, Source: ${newsItem.source}, Confidence: ${newsItem.confidence}`
            },
            {
              role: 'user',
              content: `Analyze this REAL current news impact:

Title: ${newsItem.title}
Summary: ${newsItem.summary}
Published: ${newsItem.published_at} (${newsItem.age_hours} hours ago)
Source: ${newsItem.source}
Entities: ${newsItem.entities.join(', ')}

Calculate portfolio impact and provide realistic estimates based on news age and relevance.`
            }
          ],
          functions: portfolioFunctions,
          function_call: "auto",
          temperature: 0.3,
          max_tokens: 1500
        })
      });

      if (response.ok) {
        const completion = await response.json();
        
        // Process function calls
        const functionCalls = [];
        let analysis = null;
        
        for (const choice of completion.choices) {
          if (choice.message.function_call) {
            const functionName = choice.message.function_call.name;
            const functionArgs = JSON.parse(choice.message.function_call.arguments);
            
            // Execute the function
            const result = await executeFunction(functionName, functionArgs);
            functionCalls.push({
              function: functionName,
              args: functionArgs,
              result
            });
          }
          
          if (choice.message.content) {
            try {
              analysis = JSON.parse(choice.message.content);
            } catch {
              analysis = { analysis: choice.message.content };
            }
          }
        }
        
        allAnalyses.push({
          news_item: newsItem,
          analysis,
          function_calls: functionCalls
        });
      }
    }
    
    // Combine all analyses
    const totalImpact = allAnalyses.reduce((sum, a) => sum + (a.analysis?.total_impact || 0), 0);
    const avgConfidence = allAnalyses.reduce((sum, a) => sum + (a.analysis?.confidence || 0), 0) / allAnalyses.length;
    
    return res.json({
      success: true,
      real_news_analysis: true,
      news_analyzed: currentNews.length,
      analyses: allAnalyses,
      combined_impact: {
        total_dollar_impact: totalImpact,
        avg_confidence: avgConfidence,
        news_recency: `${Math.min(...currentNews.map(n => n.age_hours))} - ${Math.max(...currentNews.map(n => n.age_hours))} hours old`
      },
      news_source: 'perplexity',
      market_data_sources: ['fmp', 'finnhub'],
      analysis_timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Auto-analysis error:', error);
    return res.status(500).json({
      error: 'Auto-analysis failed',
      details: error.message
    });
  }
}