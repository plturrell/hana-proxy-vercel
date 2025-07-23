/**
 * Market Data Collector Endpoint
 * Fetches market data from multiple sources and stores in Supabase
 * Designed to be called by cron jobs
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with correct project
const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Default symbols to track
const DEFAULT_SYMBOLS = {
  indices: ['SPY', 'QQQ', 'DIA', 'IWM', 'VTI'],
  stocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META'],
  crypto: ['BTC-USD', 'ETH-USD', 'BNB-USD'],
  forex: ['EURUSD', 'GBPUSD', 'USDJPY'],
  commodities: ['GC=F', 'CL=F', 'SI=F'] // Gold, Oil, Silver
};

export default async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader(corsHeaders).end();
  }

  const { method, query, body } = req;
  const action = query.action || body?.action || 'collect';
  
  try {
    switch (action) {
      case 'collect':
        return await collectMarketData(req, res);
        
      case 'status':
        return await getCollectionStatus(res);
        
      case 'historical':
        return await collectHistoricalData(req, res);
        
      case 'cleanup':
        return await cleanupOldData(res);
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Market data collector error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

async function collectMarketData(req, res) {
  const { symbols, sources = ['fmp', 'finnhub'], category = 'all' } = req.query || req.body || {};
  
  console.log('🔄 Collecting market data...');
  console.log(`Sources: ${sources.join(', ')}`);
  console.log(`Category: ${category}`);
  
  let targetSymbols = [];
  
  if (symbols) {
    targetSymbols = Array.isArray(symbols) ? symbols : [symbols];
  } else {
    // Use default symbols based on category
    switch (category) {
      case 'indices':
        targetSymbols = DEFAULT_SYMBOLS.indices;
        break;
      case 'stocks':
        targetSymbols = DEFAULT_SYMBOLS.stocks;
        break;
      case 'crypto':
        targetSymbols = DEFAULT_SYMBOLS.crypto;
        break;
      case 'all':
      default:
        targetSymbols = [
          ...DEFAULT_SYMBOLS.indices,
          ...DEFAULT_SYMBOLS.stocks,
          ...DEFAULT_SYMBOLS.crypto
        ];
    }
  }
  
  console.log(`Collecting data for ${targetSymbols.length} symbols`);
  
  const results = {
    collected: [],
    failed: [],
    duplicates: 0
  };
  
  // Collect from each source
  for (const source of sources) {
    for (const symbol of targetSymbols) {
      try {
        const data = await fetchFromSource(source, symbol);
        if (data) {
          // Check for duplicates before inserting
          const isDuplicate = await checkDuplicate(symbol, source, data.price);
          
          if (!isDuplicate) {
            await storeMarketData({
              symbol,
              source,
              price: data.price,
              change: data.change,
              change_percent: data.changePercent,
              volume: data.volume,
              high: data.high,
              low: data.low,
              open: data.open,
              previous_close: data.previousClose,
              timestamp: new Date().toISOString(),
              metadata: {
                market_cap: data.marketCap,
                pe_ratio: data.peRatio,
                dividend_yield: data.dividendYield
              }
            });
            
            results.collected.push({ symbol, source, price: data.price });
          } else {
            results.duplicates++;
          }
        }
      } catch (error) {
        console.error(`Failed to collect ${symbol} from ${source}:`, error.message);
        results.failed.push({ symbol, source, error: error.message });
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Log collection status
  await logCollectionStatus(results);
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    symbols: targetSymbols.length,
    collected: results.collected.length,
    failed: results.failed.length,
    duplicates: results.duplicates,
    details: results
  });
}

async function fetchFromSource(source, symbol) {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://hana-proxy-vercel-9hxhhmdqe-plturrells-projects.vercel.app';
    
  try {
    let response;
    
    switch (source) {
      case 'fmp':
        response = await fetch(`${baseUrl}/api/market-data-fmp?action=quote&symbol=${symbol}`);
        break;
        
      case 'finnhub':
        response = await fetch(`${baseUrl}/api/market-data-finhub?action=quote&symbol=${symbol}`);
        break;
        
      default:
        throw new Error(`Unknown source: ${source}`);
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || null;
    
  } catch (error) {
    console.error(`Error fetching ${symbol} from ${source}:`, error.message);
    return null;
  }
}

async function checkDuplicate(symbol, source, price) {
  // Check if we already have recent data (within last 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data } = await supabase
    .from('market_data')
    .select('price')
    .eq('symbol', symbol)
    .eq('source', source)
    .gte('timestamp', fiveMinutesAgo)
    .limit(1)
    .single();
    
  return data && Math.abs(data.price - price) < 0.01; // Same price within a penny
}

async function storeMarketData(data) {
  const { error } = await supabase
    .from('market_data')
    .insert(data);
    
  if (error) {
    console.error('Error storing market data:', error);
    throw error;
  }
}

async function getCollectionStatus(res) {
  try {
    // Get recent collection stats
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentData, count } = await supabase
      .from('market_data')
      .select('symbol, source, price, timestamp', { count: 'exact' })
      .gte('timestamp', oneHourAgo)
      .order('timestamp', { ascending: false })
      .limit(10);
      
    // Get unique symbols collected
    const { data: symbols } = await supabase
      .from('market_data')
      .select('symbol')
      .gte('timestamp', oneHourAgo);
      
    const uniqueSymbols = [...new Set(symbols?.map(s => s.symbol) || [])];
    
    // Get collection logs
    const { data: logs } = await supabase
      .from('market_data_collection_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    return res.status(200).json({
      status: 'active',
      dataPointsLastHour: count || 0,
      uniqueSymbols: uniqueSymbols.length,
      symbols: uniqueSymbols,
      recentCollections: recentData || [],
      recentLogs: logs || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    throw error;
  }
}

async function collectHistoricalData(req, res) {
  const { symbol, from, to } = req.query || req.body || {};
  
  if (!symbol || !from || !to) {
    return res.status(400).json({ 
      error: 'Symbol, from, and to dates required' 
    });
  }
  
  // This would fetch historical data from FMP/Finnhub
  // Implementation depends on your needs
  
  return res.status(200).json({
    message: 'Historical data collection not yet implemented',
    symbol,
    from,
    to
  });
}

async function cleanupOldData(res) {
  // Remove data older than 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const { error, count } = await supabase
    .from('market_data')
    .delete()
    .lt('timestamp', thirtyDaysAgo);
    
  if (error) {
    throw error;
  }
  
  return res.status(200).json({
    success: true,
    deleted: count || 0,
    message: `Cleaned up ${count || 0} old records`
  });
}

async function logCollectionStatus(results) {
  const log = {
    source: 'market_data_collector',
    symbols_requested: results.collected.length + results.failed.length,
    symbols_collected: results.collected.length,
    symbols_failed: results.failed.length,
    duplicates_skipped: results.duplicates,
    success_rate: results.collected.length / (results.collected.length + results.failed.length) * 100,
    sources: [...new Set(results.collected.map(r => r.source))],
    created_at: new Date().toISOString()
  };
  
  await supabase.from('market_data_collection_log').insert(log);
}