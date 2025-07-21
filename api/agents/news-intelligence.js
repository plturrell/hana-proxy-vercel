/**
 * News Intelligence Agent API Endpoint
 * RESTful interface for the News Intelligence Agent
 */

import { IntelligentNewsIntelligenceAgent } from '../../agents/news-intelligence-agent-v2.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with error handling
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey
  });
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Global agent instance
let newsAgent = null;

async function initializeAgent() {
  if (!newsAgent) {
    try {
      const agentData = {
        agent_id: 'finsight.data.news_intelligence',
        agent_name: 'News Intelligence Agent',
        agent_type: 'data_product',
        voting_power: 75,
        connection_config: {
          goals: [
            'Process real-time financial news',
            'Extract market-moving events',
            'Provide sentiment analysis',
            'Identify investment opportunities'
          ],
          personality: 'analytical'
        }
      };
      
      newsAgent = new IntelligentNewsIntelligenceAgent(agentData);
      await newsAgent.initialize();
      
      console.log('🔵 News Intelligence Agent initialized and ready');
    } catch (error) {
      console.error('Failed to initialize News Intelligence Agent:', error);
      // Create a minimal agent object for status responses
      newsAgent = {
        id: 'finsight.data.news_intelligence',
        name: 'News Intelligence Agent',
        capabilities: ['news_processing', 'sentiment_analysis', 'entity_extraction', 'relevance_scoring'],
        lastProcessedTime: null,
        perplexityApiKey: process.env.PERPLEXITY_API_KEY
      };
    }
  }
  
  return newsAgent;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query, body } = req;
  
  try {
    // Check if Supabase is properly configured
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Database connection not configured',
        agent_id: 'finsight.data.news_intelligence',
        status: 'error'
      });
    }
    
    // Initialize agent if needed
    const agent = await initializeAgent();
    
    switch (method) {
      case 'GET':
        return await handleGetRequest(agent, query, res);
      
      case 'POST':
        return await handlePostRequest(agent, body, res);
      
      default:
        return res.status(405).json({
          error: 'Method not allowed',
          allowed_methods: ['GET', 'POST']
        });
    }
    
  } catch (error) {
    console.error('News Intelligence Agent API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function handleGetRequest(agent, query, res) {
  const { action, ...params } = query;
  
  switch (action) {
    case 'status':
      return getAgentStatus(agent, res);
    
    case 'recent':
      return getRecentNews(agent, params, res);
    
    case 'search':
      return searchNews(agent, params, res);
    
    case 'summary':
      return getDailySummary(agent, params, res);
    
    case 'metrics':
      return getPerformanceMetrics(agent, res);
    
    default:
      return res.status(400).json({
        error: 'Invalid action',
        available_actions: ['status', 'recent', 'search', 'summary', 'metrics']
      });
  }
}

async function handlePostRequest(agent, body, res) {
  const { action, ...params } = body;
  
  switch (action) {
    case 'process':
      return triggerNewsProcessing(agent, params, res);
    
    case 'analyze':
      return analyzeSpecificNews(agent, params, res);
    
    case 'subscribe':
      return subscribeToUpdates(agent, params, res);
    
    case 'unsubscribe':
      return unsubscribeFromUpdates(agent, params, res);
    
    default:
      return res.status(400).json({
        error: 'Invalid action',
        available_actions: ['process', 'analyze', 'subscribe', 'unsubscribe']
      });
  }
}

async function getAgentStatus(agent, res) {
  return res.json({
    success: true,
    agent_id: agent.id,
    agent_name: agent.name,
    status: 'active',
    last_processed: agent.lastProcessedTime,
    capabilities: agent.capabilities,
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    connections: {
      supabase: !!supabase,
      perplexity: !!agent.perplexityApiKey
    },
    timestamp: new Date()
  });
}

async function getRecentNews(agent, params, res) {
  const { 
    limit = 20, 
    category, 
    hours = 24,
    impact_level 
  } = params;
  
  let query = supabase
    .from('news_articles')
    .select('*')
    .gte('published_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
    .order('published_at', { ascending: false })
    .limit(limit);
  
  if (category) {
    query = query.eq('category', category);
  }
  
  if (impact_level) {
    query = query.eq('market_impact->level', impact_level);
  }
  
  const { data: articles, error } = await query;
  
  if (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch recent news',
      details: error.message
    });
  }
  
  return res.json({
    success: true,
    data: {
      articles,
      count: articles.length,
      timeframe_hours: hours,
      filters: { category, impact_level }
    }
  });
}

async function searchNews(agent, params, res) {
  const {
    query: searchQuery,
    tickers,
    companies,
    date_start,
    date_end,
    sentiment,
    limit = 50
  } = params;
  
  let queryBuilder = supabase
    .from('news_articles')
    .select('*');
  
  // Text search in title and summary
  if (searchQuery) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%`
    );
  }
  
  // Filter by tickers
  if (tickers) {
    const tickerArray = Array.isArray(tickers) ? tickers : [tickers];
    queryBuilder = queryBuilder.overlaps('entities->tickers', tickerArray);
  }
  
  // Filter by companies
  if (companies) {
    const companyArray = Array.isArray(companies) ? companies : [companies];
    queryBuilder = queryBuilder.overlaps('entities->companies', companyArray);
  }
  
  // Date range filters
  if (date_start) {
    queryBuilder = queryBuilder.gte('timestamp', date_start);
  }
  
  if (date_end) {
    queryBuilder = queryBuilder.lte('timestamp', date_end);
  }
  
  // Sentiment filter
  if (sentiment) {
    queryBuilder = queryBuilder.eq('sentiment->label', sentiment);
  }
  
  const { data: articles, error } = await queryBuilder
    .order('timestamp', { ascending: false })
    .limit(limit);
  
  if (error) {
    return res.status(500).json({
      success: false,
      error: 'Search failed',
      details: error.message
    });
  }
  
  return res.json({
    success: true,
    data: {
      articles,
      count: articles.length,
      search_params: params
    }
  });
}

async function getDailySummary(agent, params, res) {
  const { date = new Date().toISOString().split('T')[0] } = params;
  
  const { data: summary, error } = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('agent_id', agent.id)
    .eq('summary_date', date)
    .single();
  
  if (error && error.code !== 'PGRST116') { // Not found error
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch summary',
      details: error.message
    });
  }
  
  if (!summary) {
    return res.status(404).json({
      success: false,
      error: 'No summary available for this date',
      date
    });
  }
  
  return res.json({
    success: true,
    data: summary
  });
}

async function getPerformanceMetrics(agent, res) {
  // Get performance data from the monitoring view
  const { data: metrics, error } = await supabase
    .from('v_news_agent_performance')
    .select('*')
    .limit(30)
    .order('processing_date', { ascending: false });
  
  if (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics',
      details: error.message
    });
  }
  
  // Calculate aggregate metrics
  const totalArticles = metrics.reduce((sum, day) => sum + day.articles_processed, 0);
  const avgConfidence = metrics.reduce((sum, day) => sum + day.avg_sentiment_confidence, 0) / metrics.length;
  const totalHighImpact = metrics.reduce((sum, day) => sum + day.high_impact_count, 0);
  
  return res.json({
    success: true,
    data: {
      daily_metrics: metrics,
      aggregates: {
        total_articles_30_days: totalArticles,
        avg_sentiment_confidence: avgConfidence,
        total_high_impact_articles: totalHighImpact,
        avg_articles_per_day: totalArticles / metrics.length
      }
    }
  });
}

async function triggerNewsProcessing(agent, params, res) {
  const { categories = agent.newsCategories } = params;
  
  try {
    // Trigger immediate news processing
    await agent.fetchAndProcessNews();
    
    return res.json({
      success: true,
      message: 'News processing triggered successfully',
      categories_processed: categories
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'News processing failed',
      details: error.message
    });
  }
}

async function analyzeSpecificNews(agent, params, res) {
  const { articles } = params;
  
  if (!articles || !Array.isArray(articles)) {
    return res.status(400).json({
      success: false,
      error: 'Articles array is required'
    });
  }
  
  try {
    const processedArticles = [];
    
    for (const article of articles) {
      const processed = await agent.processNewsArticle(article);
      if (processed) {
        processedArticles.push(processed);
      }
    }
    
    return res.json({
      success: true,
      data: {
        processed_articles: processedArticles,
        count: processedArticles.length
      }
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Analysis failed',
      details: error.message
    });
  }
}

async function subscribeToUpdates(agent, params, res) {
  const { subscriber_agent_id, filters = {} } = params;
  
  if (!subscriber_agent_id) {
    return res.status(400).json({
      success: false,
      error: 'subscriber_agent_id is required'
    });
  }
  
  try {
    const { data, error } = await supabase
      .from('agent_subscriptions')
      .insert({
        subscriber_agent_id,
        publisher_agent_id: agent.id,
        subscription_type: 'news_update',
        filters,
        active: true
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          success: false,
          error: 'Subscription already exists'
        });
      }
      throw error;
    }
    
    return res.json({
      success: true,
      message: 'Subscription created successfully',
      subscription: data
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Subscription failed',
      details: error.message
    });
  }
}

async function unsubscribeFromUpdates(agent, params, res) {
  const { subscriber_agent_id } = params;
  
  if (!subscriber_agent_id) {
    return res.status(400).json({
      success: false,
      error: 'subscriber_agent_id is required'
    });
  }
  
  try {
    const { error } = await supabase
      .from('agent_subscriptions')
      .delete()
      .eq('subscriber_agent_id', subscriber_agent_id)
      .eq('publisher_agent_id', agent.id)
      .eq('subscription_type', 'news_update');
    
    if (error) {
      throw error;
    }
    
    return res.json({
      success: true,
      message: 'Unsubscribed successfully'
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Unsubscribe failed',
      details: error.message
    });
  }
}