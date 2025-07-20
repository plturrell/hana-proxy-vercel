/**
 * Market Data Agent API Endpoint
 * RESTful interface for real-time market data ingestion and processing
 */

import { MarketDataAgent } from '../../agents/market-data-agent.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

let marketDataInstance = null;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Agent-ID');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize Market Data Agent if needed
    if (!marketDataInstance) {
      const agentData = {
        agent_id: 'finsight.data.market_ingestion',
        agent_name: 'Market Data Agent',
        agent_type: 'data_product',
        voting_power: 75
      };
      
      try {
        marketDataInstance = new MarketDataAgent(agentData);
        await marketDataInstance.initialize();
      } catch (initError) {
        console.error('Failed to initialize Market Data Agent:', initError);
        // Create minimal fallback agent
        marketDataInstance = {
          capabilities: ['real_time_quotes', 'historical_data', 'market_subscriptions'],
          symbolSubscriptions: new Map(),
          dataCache: new Map(),
          symbolMetadata: new Map(),
          getIngestionStatistics: async () => ({
            subscriptions: { active_subscriptions: 0, total_subscriptions: 0 },
            performance: { success_rate: 0, avg_latency_ms: 0, error_rate: 1 }
          }),
          fetchRealTimeQuote: async (symbol) => {
            throw new Error('Agent initialization failed - service unavailable');
          },
          fetchHistoricalData: async (symbol, options) => {
            throw new Error('Agent initialization failed - service unavailable');
          },
          subscribeToSymbol: async (symbol, config) => {
            throw new Error('Agent initialization failed - service unavailable');
          },
          processQuoteUpdate: async (symbol, data) => {
            throw new Error('Agent initialization failed - service unavailable');
          },
          refreshSymbolData: async () => {
            throw new Error('Agent initialization failed - service unavailable');
          },
          validateMarketData: async (data) => ({
            valid: false,
            errors: ['Agent initialization failed']
          })
        };
      }
    }

    const { action } = req.query;

    if (req.method === 'GET') {
      switch (action) {
        case 'status':
          return await handleStatusRequest(req, res);
        case 'symbols':
          return await handleSymbolsRequest(req, res);
        case 'quotes':
          return await handleQuotesRequest(req, res);
        case 'history':
          return await handleHistoryRequest(req, res);
        case 'subscriptions':
          return await handleSubscriptionsRequest(req, res);
        case 'health':
          return await handleHealthRequest(req, res);
        case 'statistics':
          return await handleStatisticsRequest(req, res);
        default:
          return await handleStatusRequest(req, res);
      }
    }

    if (req.method === 'POST') {
      const { action } = req.body;
      
      switch (action) {
        case 'subscribe':
          return await handleSubscribe(req, res);
        case 'unsubscribe':
          return await handleUnsubscribe(req, res);
        case 'process_quote':
          return await handleProcessQuote(req, res);
        case 'refresh_symbols':
          return await handleRefreshSymbols(req, res);
        case 'validate_data':
          return await handleValidateData(req, res);
        case 'clear_cache':
          return await handleClearCache(req, res);
        default:
          return res.status(400).json({
            success: false,
            error: 'Unknown action',
            available_actions: ['subscribe', 'unsubscribe', 'process_quote', 'refresh_symbols', 'validate_data', 'clear_cache']
          });
      }
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed_methods: ['GET', 'POST', 'OPTIONS']
    });

  } catch (error) {
    console.error('Market Data Agent error:', error);
    return res.status(500).json({
      success: false,
      error: 'Market data agent error',
      details: error.message
    });
  }
}

/**
 * Handle status requests
 */
async function handleStatusRequest(req, res) {
  try {
    const stats = await marketDataInstance.getIngestionStatistics();
    
    return res.json({
      success: true,
      agent_id: 'finsight.data.market_ingestion',
      status: 'active',
      uptime: process.uptime(),
      ingestion_statistics: stats,
      capabilities: marketDataInstance.capabilities,
      subscribed_symbols: marketDataInstance.symbolSubscriptions.size,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get status',
      details: error.message
    });
  }
}

/**
 * Handle symbols overview requests
 */
async function handleSymbolsRequest(req, res) {
  try {
    const { category, active_only = 'true' } = req.query;
    
    const symbols = Array.from(marketDataInstance.symbolSubscriptions.entries())
      .filter(([symbol, config]) => {
        if (category && config.category !== category) return false;
        if (active_only === 'true' && !config.active) return false;
        return true;
      })
      .map(([symbol, config]) => ({
        symbol,
        category: config.category,
        source: config.source,
        active: config.active,
        last_update: config.last_update ? new Date(config.last_update) : null,
        update_frequency: config.update_frequency,
        subscription_time: config.subscription_time ? new Date(config.subscription_time) : null
      }));

    return res.json({
      success: true,
      total_symbols: marketDataInstance.symbolSubscriptions.size,
      filtered_count: symbols.length,
      symbols: symbols,
      filters_applied: { category, active_only },
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get symbols',
      details: error.message
    });
  }
}

/**
 * Handle real-time quotes requests
 */
async function handleQuotesRequest(req, res) {
  try {
    const { symbols, include_metadata = 'false' } = req.query;
    
    if (!symbols) {
      return res.status(400).json({
        success: false,
        error: 'Missing symbols parameter'
      });
    }

    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
    const quotes = [];

    for (const symbol of symbolList) {
      try {
        const quote = await marketDataInstance.fetchRealTimeQuote(symbol);
        if (quote) {
          quotes.push({
            symbol,
            price: quote.price,
            change: quote.change,
            change_percent: quote.change_percent,
            volume: quote.volume,
            timestamp: quote.timestamp,
            ...(include_metadata === 'true' && {
              metadata: quote.metadata
            })
          });
        }
      } catch (error) {
        quotes.push({
          symbol,
          error: error.message,
          timestamp: new Date()
        });
      }
    }

    return res.json({
      success: true,
      quotes: quotes,
      requested_symbols: symbolList,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get quotes',
      details: error.message
    });
  }
}

/**
 * Handle historical data requests
 */
async function handleHistoryRequest(req, res) {
  try {
    const { symbol, period = '1d', interval = '1m' } = req.query;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Missing symbol parameter'
      });
    }

    const history = await marketDataInstance.fetchHistoricalData(symbol.toUpperCase(), {
      period,
      interval
    });

    return res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      period,
      interval,
      data_points: history?.length || 0,
      history: history || [],
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get historical data',
      details: error.message
    });
  }
}

/**
 * Handle subscriptions overview requests
 */
async function handleSubscriptionsRequest(req, res) {
  try {
    const subscriptions = Array.from(marketDataInstance.symbolSubscriptions.entries())
      .map(([symbol, config]) => ({
        symbol,
        active: config.active,
        category: config.category,
        source: config.source,
        update_frequency: config.update_frequency,
        last_update: config.last_update ? new Date(config.last_update) : null,
        error_count: config.error_count || 0,
        success_count: config.success_count || 0
      }))
      .sort((a, b) => b.success_count - a.success_count);

    return res.json({
      success: true,
      total_subscriptions: subscriptions.length,
      active_subscriptions: subscriptions.filter(s => s.active).length,
      subscriptions: subscriptions,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get subscriptions',
      details: error.message
    });
  }
}

/**
 * Handle health check requests
 */
async function handleHealthRequest(req, res) {
  try {
    const stats = await marketDataInstance.getIngestionStatistics();
    const isHealthy = stats.performance.success_rate > 0.95 && stats.subscriptions.active_subscriptions > 0;

    return res.json({
      success: true,
      healthy: isHealthy,
      health_score: isHealthy ? 1.0 : 0.5,
      details: {
        success_rate: stats.performance.success_rate,
        active_subscriptions: stats.subscriptions.active_subscriptions,
        avg_latency: stats.performance.avg_latency_ms,
        error_rate: stats.performance.error_rate
      },
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get health status',
      details: error.message
    });
  }
}

/**
 * Handle statistics requests
 */
async function handleStatisticsRequest(req, res) {
  try {
    const stats = await marketDataInstance.getIngestionStatistics();
    
    return res.json({
      success: true,
      statistics: stats,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      details: error.message
    });
  }
}

/**
 * Handle symbol subscription
 */
async function handleSubscribe(req, res) {
  try {
    const { symbols, category = 'equity', source = 'finhub', update_frequency = 'real_time' } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid symbols array'
      });
    }

    const results = [];
    for (const symbol of symbols) {
      try {
        await marketDataInstance.subscribeToSymbol(symbol.toUpperCase(), {
          category,
          source,
          update_frequency
        });
        results.push({ symbol: symbol.toUpperCase(), status: 'subscribed' });
      } catch (error) {
        results.push({ symbol: symbol.toUpperCase(), status: 'error', error: error.message });
      }
    }

    return res.json({
      success: true,
      message: 'Subscription processing completed',
      results: results,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process subscriptions',
      details: error.message
    });
  }
}

/**
 * Handle symbol unsubscription
 */
async function handleUnsubscribe(req, res) {
  try {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid symbols array'
      });
    }

    const results = [];
    for (const symbol of symbols) {
      const removed = marketDataInstance.symbolSubscriptions.delete(symbol.toUpperCase());
      results.push({ 
        symbol: symbol.toUpperCase(), 
        status: removed ? 'unsubscribed' : 'not_found' 
      });
    }

    return res.json({
      success: true,
      message: 'Unsubscription processing completed',
      results: results,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process unsubscriptions',
      details: error.message
    });
  }
}

/**
 * Handle quote processing
 */
async function handleProcessQuote(req, res) {
  try {
    const { symbol, quote_data } = req.body;

    if (!symbol || !quote_data) {
      return res.status(400).json({
        success: false,
        error: 'Missing symbol or quote_data'
      });
    }

    await marketDataInstance.processQuoteUpdate(symbol.toUpperCase(), quote_data);

    return res.json({
      success: true,
      message: 'Quote processed successfully',
      symbol: symbol.toUpperCase(),
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process quote',
      details: error.message
    });
  }
}

/**
 * Handle symbol refresh
 */
async function handleRefreshSymbols(req, res) {
  try {
    await marketDataInstance.refreshSymbolData();

    return res.json({
      success: true,
      message: 'Symbol data refreshed successfully',
      total_symbols: marketDataInstance.symbolSubscriptions.size,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to refresh symbols',
      details: error.message
    });
  }
}

/**
 * Handle data validation
 */
async function handleValidateData(req, res) {
  try {
    const { symbol, data } = req.body;

    if (!symbol || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing symbol or data'
      });
    }

    const validation = await marketDataInstance.validateMarketData(data);

    return res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      validation: validation,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to validate data',
      details: error.message
    });
  }
}

/**
 * Handle cache clearing
 */
async function handleClearCache(req, res) {
  try {
    const { cache_type = 'all' } = req.body;

    let cleared = [];

    if (cache_type === 'all' || cache_type === 'quotes') {
      marketDataInstance.dataCache.clear();
      cleared.push('quotes');
    }

    if (cache_type === 'all' || cache_type === 'symbols') {
      marketDataInstance.symbolMetadata.clear();
      cleared.push('symbols');
    }

    return res.json({
      success: true,
      message: 'Cache cleared successfully',
      cleared_caches: cleared,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      details: error.message
    });
  }
}