/**
 * Portfolio Analytics Engine
 * Provides real-time portfolio valuation, risk metrics, and optimization
 * Integrates with market data and agent intelligence
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).json({}).setHeader(corsHeaders);
  }

  const { action = 'status', portfolioId, userId } = req.query || req.body || {};
  
  try {
    switch (action) {
      case 'update-valuations':
        return await updatePortfolioValuations(res);
        
      case 'calculate-risk':
        return await calculateRiskMetrics(req, res);
        
      case 'optimize':
        return await generateOptimizationSuggestions(req, res);
        
      case 'daily-report':
        return await generateDailyReport(res);
        
      case 'get-portfolio':
        return await getPortfolioDetails(req, res);
        
      case 'rebalance':
        return await getRebalancingSuggestions(req, res);
        
      case 'performance':
        return await getPerformanceMetrics(req, res);
        
      case 'health':
      case 'status':
        return res.status(200).json({ 
          status: 'active', 
          message: 'Portfolio Analytics Engine is running',
          timestamp: new Date().toISOString()
        });
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Portfolio analytics error:', error);
    return res.status(500).json({ 
      error: 'Analytics failed', 
      details: error.message 
    });
  }
}

async function updatePortfolioValuations(res) {
  console.log('💰 Updating portfolio valuations...');
  
  // Get all active portfolios
  const { data: portfolios, error: portfolioError } = await supabase
    .from('portfolios')
    .select('*')
    .eq('is_active', true);
  
  if (portfolioError) {
    console.error('Error fetching portfolios:', portfolioError);
    // Create sample portfolio if none exist
    const samplePortfolio = await createSamplePortfolio();
    if (samplePortfolio) {
      portfolios = [samplePortfolio];
    } else {
      return res.status(200).json({ 
        message: 'No active portfolios found',
        created_sample: false 
      });
    }
  }
  
  const results = {
    updated: 0,
    failed: 0,
    portfolios: []
  };
  
  for (const portfolio of portfolios || []) {
    try {
      const valuation = await calculatePortfolioValue(portfolio);
      
      // Store valuation history
      await supabase
        .from('portfolio_valuations')
        .insert({
          portfolio_id: portfolio.id,
          total_value: valuation.totalValue,
          total_cost: valuation.totalCost,
          total_return: valuation.totalReturn,
          return_percentage: valuation.returnPercentage,
          positions: valuation.positions,
          metadata: {
            market_value: valuation.marketValue,
            cash_value: valuation.cashValue,
            positions_count: valuation.positions.length
          }
        });
      
      results.updated++;
      results.portfolios.push({
        id: portfolio.id,
        name: portfolio.name,
        value: valuation.totalValue,
        return: valuation.returnPercentage
      });
      
    } catch (error) {
      console.error(`Failed to update portfolio ${portfolio.id}:`, error);
      results.failed++;
    }
  }
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    results
  });
}

async function calculatePortfolioValue(portfolio) {
  // Get portfolio positions
  const { data: positions } = await supabase
    .from('portfolio_positions')
    .select('*')
    .eq('portfolio_id', portfolio.id)
    .eq('is_active', true);
  
  let totalValue = 0;
  let totalCost = 0;
  const positionDetails = [];
  
  for (const position of positions || []) {
    // Get latest market price
    const marketPrice = await getLatestPrice(position.symbol);
    const currentValue = position.quantity * marketPrice;
    const costBasis = position.quantity * position.avg_price;
    
    totalValue += currentValue;
    totalCost += costBasis;
    
    positionDetails.push({
      symbol: position.symbol,
      quantity: position.quantity,
      avg_price: position.avg_price,
      current_price: marketPrice,
      current_value: currentValue,
      cost_basis: costBasis,
      gain_loss: currentValue - costBasis,
      gain_loss_pct: ((currentValue - costBasis) / costBasis) * 100
    });
  }
  
  // Add cash position
  const cashValue = portfolio.cash_balance || 0;
  totalValue += cashValue;
  
  return {
    totalValue,
    totalCost,
    totalReturn: totalValue - totalCost,
    returnPercentage: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    marketValue: totalValue - cashValue,
    cashValue,
    positions: positionDetails
  };
}

async function getLatestPrice(symbol) {
  // First try to get from market_data table
  const { data: marketData } = await supabase
    .from('market_data')
    .select('price')
    .eq('symbol', symbol)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();
  
  if (marketData) {
    return marketData.price;
  }
  
  // Fallback to calling market data API
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://hana-proxy-vercel-95h9zguqh-plturrells-projects.vercel.app';
    
  try {
    const response = await fetch(`${baseUrl}/api/market-data-unified?action=quote&symbol=${symbol}`);
    const result = await response.json();
    
    if (result.success && result.data?.price) {
      return result.data.price;
    }
  } catch (error) {
    console.error(`Failed to get price for ${symbol}:`, error);
  }
  
  // Return a default/last known price
  return 100; // Default fallback
}

async function calculateRiskMetrics(req, res) {
  console.log('📊 Calculating risk metrics...');
  
  const { portfolioId, period = '30d' } = req.query || req.body || {};
  
  // Get portfolio details
  const portfolio = portfolioId 
    ? await getPortfolioById(portfolioId)
    : await getDefaultPortfolio();
    
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio not found' });
  }
  
  // Calculate various risk metrics
  const metrics = {
    portfolio_id: portfolio.id,
    portfolio_name: portfolio.name,
    calculated_at: new Date().toISOString(),
    period,
    metrics: {}
  };
  
  // Get historical data for risk calculations
  const historicalData = await getHistoricalPortfolioData(portfolio.id, period);
  
  if (historicalData.length > 0) {
    // Calculate metrics
    metrics.metrics.sharpe_ratio = calculateSharpeRatio(historicalData);
    metrics.metrics.sortino_ratio = calculateSortinoRatio(historicalData);
    metrics.metrics.var_95 = calculateVaR(historicalData, 0.95);
    metrics.metrics.var_99 = calculateVaR(historicalData, 0.99);
    metrics.metrics.max_drawdown = calculateMaxDrawdown(historicalData);
    metrics.metrics.volatility = calculateVolatility(historicalData);
    metrics.metrics.beta = await calculateBeta(portfolio, historicalData);
  }
  
  // Store risk metrics
  await supabase
    .from('portfolio_risk_metrics')
    .insert({
      portfolio_id: portfolio.id,
      period,
      sharpe_ratio: metrics.metrics.sharpe_ratio,
      sortino_ratio: metrics.metrics.sortino_ratio,
      value_at_risk_95: metrics.metrics.var_95,
      value_at_risk_99: metrics.metrics.var_99,
      max_drawdown: metrics.metrics.max_drawdown,
      volatility: metrics.metrics.volatility,
      beta: metrics.metrics.beta,
      metadata: metrics
    });
  
  return res.status(200).json({
    success: true,
    metrics
  });
}

async function generateOptimizationSuggestions(req, res) {
  console.log('🎯 Generating portfolio optimization suggestions...');
  
  const { portfolioId, strategy = 'balanced' } = req.query || req.body || {};
  
  const portfolio = portfolioId 
    ? await getPortfolioById(portfolioId)
    : await getDefaultPortfolio();
    
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio not found' });
  }
  
  // Analyze current portfolio
  const currentAllocation = await getCurrentAllocation(portfolio.id);
  const targetAllocation = getTargetAllocation(strategy);
  
  // Generate rebalancing suggestions
  const suggestions = [];
  
  for (const [assetClass, targetPct] of Object.entries(targetAllocation)) {
    const currentPct = currentAllocation[assetClass] || 0;
    const difference = targetPct - currentPct;
    
    if (Math.abs(difference) > 2) { // 2% threshold
      suggestions.push({
        asset_class: assetClass,
        current_allocation: currentPct,
        target_allocation: targetPct,
        action: difference > 0 ? 'BUY' : 'SELL',
        adjustment_needed: Math.abs(difference),
        priority: Math.abs(difference) > 5 ? 'HIGH' : 'MEDIUM'
      });
    }
  }
  
  // Add specific security recommendations
  const securitySuggestions = await getSecurityRecommendations(portfolio, strategy);
  
  // Store optimization suggestions
  await supabase
    .from('portfolio_optimizations')
    .insert({
      portfolio_id: portfolio.id,
      strategy,
      suggestions: {
        rebalancing: suggestions,
        securities: securitySuggestions
      },
      metadata: {
        current_allocation: currentAllocation,
        target_allocation: targetAllocation
      }
    });
  
  return res.status(200).json({
    success: true,
    portfolio_id: portfolio.id,
    strategy,
    suggestions: {
      rebalancing: suggestions,
      securities: securitySuggestions
    },
    summary: {
      total_adjustments: suggestions.length,
      high_priority: suggestions.filter(s => s.priority === 'HIGH').length
    }
  });
}

async function generateDailyReport(res) {
  console.log('📈 Generating daily portfolio report...');
  
  // Get all active portfolios
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select('*')
    .eq('is_active', true);
  
  const reports = [];
  
  for (const portfolio of portfolios || []) {
    // Get today's performance
    const performance = await getDailyPerformance(portfolio.id);
    
    // Get risk metrics
    const { data: riskMetrics } = await supabase
      .from('portfolio_risk_metrics')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Get top movers
    const topMovers = await getTopMovers(portfolio.id);
    
    reports.push({
      portfolio_id: portfolio.id,
      portfolio_name: portfolio.name,
      date: new Date().toISOString().split('T')[0],
      performance: {
        daily_return: performance.dailyReturn,
        daily_return_pct: performance.dailyReturnPct,
        total_value: performance.totalValue,
        ytd_return: performance.ytdReturn
      },
      risk_metrics: {
        sharpe_ratio: riskMetrics?.sharpe_ratio,
        volatility: riskMetrics?.volatility,
        var_95: riskMetrics?.value_at_risk_95
      },
      top_gainers: topMovers.gainers,
      top_losers: topMovers.losers
    });
  }
  
  // Store daily report
  await supabase
    .from('portfolio_daily_reports')
    .insert({
      report_date: new Date().toISOString().split('T')[0],
      reports,
      summary: {
        total_portfolios: reports.length,
        average_daily_return: reports.reduce((sum, r) => sum + r.performance.daily_return_pct, 0) / reports.length
      }
    });
  
  return res.status(200).json({
    success: true,
    date: new Date().toISOString().split('T')[0],
    reports
  });
}

// Helper functions
async function createSamplePortfolio() {
  try {
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .insert({
        name: 'Sample Portfolio',
        description: 'Auto-generated sample portfolio',
        currency: 'USD',
        cash_balance: 10000,
        is_active: true,
        metadata: {
          created_by: 'system',
          purpose: 'demonstration'
        }
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Add sample positions
    const positions = [
      { symbol: 'AAPL', quantity: 50, avg_price: 180 },
      { symbol: 'MSFT', quantity: 30, avg_price: 320 },
      { symbol: 'SPY', quantity: 25, avg_price: 400 },
      { symbol: 'GOOGL', quantity: 10, avg_price: 120 }
    ];
    
    for (const pos of positions) {
      await supabase
        .from('portfolio_positions')
        .insert({
          portfolio_id: portfolio.id,
          ...pos,
          is_active: true
        });
    }
    
    return portfolio;
  } catch (error) {
    console.error('Failed to create sample portfolio:', error);
    return null;
  }
}

async function getPortfolioById(portfolioId) {
  const { data } = await supabase
    .from('portfolios')
    .select('*')
    .eq('id', portfolioId)
    .single();
  
  return data;
}

async function getDefaultPortfolio() {
  const { data } = await supabase
    .from('portfolios')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return data;
}

async function getHistoricalPortfolioData(portfolioId, period) {
  const days = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  }[period] || 30;
  
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  const { data } = await supabase
    .from('portfolio_valuations')
    .select('total_value, created_at')
    .eq('portfolio_id', portfolioId)
    .gte('created_at', since)
    .order('created_at', { ascending: true });
  
  return data || [];
}

function calculateSharpeRatio(data) {
  if (data.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i].total_value - data[i-1].total_value) / data[i-1].total_value);
  }
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
  
  return stdDev > 0 ? (avgReturn * 252) / (stdDev * Math.sqrt(252)) : 0; // Annualized
}

function calculateSortinoRatio(data) {
  if (data.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i].total_value - data[i-1].total_value) / data[i-1].total_value);
  }
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const downside = returns.filter(r => r < 0);
  
  if (downside.length === 0) return avgReturn > 0 ? 999 : 0;
  
  const downsideStdDev = Math.sqrt(downside.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downside.length);
  
  return downsideStdDev > 0 ? (avgReturn * 252) / (downsideStdDev * Math.sqrt(252)) : 0;
}

function calculateVaR(data, confidence) {
  if (data.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i].total_value - data[i-1].total_value) / data[i-1].total_value);
  }
  
  returns.sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * returns.length);
  
  return Math.abs(returns[index] || 0) * 100; // Percentage
}

function calculateMaxDrawdown(data) {
  if (data.length < 2) return 0;
  
  let maxDrawdown = 0;
  let peak = data[0].total_value;
  
  for (const point of data) {
    if (point.total_value > peak) {
      peak = point.total_value;
    }
    const drawdown = (peak - point.total_value) / peak;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }
  
  return maxDrawdown * 100; // Percentage
}

function calculateVolatility(data) {
  if (data.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i].total_value - data[i-1].total_value) / data[i-1].total_value);
  }
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  
  return Math.sqrt(variance * 252) * 100; // Annualized percentage
}

async function calculateBeta(portfolio, historicalData) {
  // Compare portfolio returns to market (SPY) returns
  // Simplified calculation
  return 1.0; // Placeholder
}

async function getCurrentAllocation(portfolioId) {
  const { data: positions } = await supabase
    .from('portfolio_positions')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .eq('is_active', true);
  
  const allocation = {
    stocks: 0,
    etfs: 0,
    crypto: 0,
    cash: 0
  };
  
  // Simplified allocation calculation
  let totalValue = 0;
  for (const position of positions || []) {
    const value = position.quantity * await getLatestPrice(position.symbol);
    totalValue += value;
    
    // Classify assets (simplified)
    if (position.symbol.includes('-USD')) {
      allocation.crypto += value;
    } else if (['SPY', 'QQQ', 'IWM', 'DIA', 'VTI'].includes(position.symbol)) {
      allocation.etfs += value;
    } else {
      allocation.stocks += value;
    }
  }
  
  // Convert to percentages
  for (const key in allocation) {
    allocation[key] = totalValue > 0 ? (allocation[key] / totalValue) * 100 : 0;
  }
  
  return allocation;
}

function getTargetAllocation(strategy) {
  const allocations = {
    conservative: { stocks: 30, etfs: 50, crypto: 0, cash: 20 },
    balanced: { stocks: 50, etfs: 30, crypto: 10, cash: 10 },
    aggressive: { stocks: 70, etfs: 20, crypto: 10, cash: 0 },
    crypto: { stocks: 20, etfs: 20, crypto: 50, cash: 10 }
  };
  
  return allocations[strategy] || allocations.balanced;
}

async function getSecurityRecommendations(portfolio, strategy) {
  // Placeholder for AI-driven recommendations
  return [
    {
      action: 'BUY',
      symbol: 'VTI',
      reason: 'Increase diversification with total market exposure',
      confidence: 0.85
    },
    {
      action: 'REDUCE',
      symbol: 'TSLA',
      reason: 'High volatility exceeds risk tolerance',
      confidence: 0.75
    }
  ];
}

async function getDailyPerformance(portfolioId) {
  const { data: today } = await supabase
    .from('portfolio_valuations')
    .select('total_value')
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const { data: previous } = await supabase
    .from('portfolio_valuations')
    .select('total_value')
    .eq('portfolio_id', portfolioId)
    .lt('created_at', yesterday.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  const todayValue = today?.total_value || 0;
  const previousValue = previous?.total_value || todayValue;
  
  return {
    totalValue: todayValue,
    dailyReturn: todayValue - previousValue,
    dailyReturnPct: previousValue > 0 ? ((todayValue - previousValue) / previousValue) * 100 : 0,
    ytdReturn: 0 // Placeholder
  };
}

async function getTopMovers(portfolioId) {
  const { data: positions } = await supabase
    .from('portfolio_positions')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .eq('is_active', true);
  
  const movers = [];
  
  for (const position of positions || []) {
    const currentPrice = await getLatestPrice(position.symbol);
    const changePercent = ((currentPrice - position.avg_price) / position.avg_price) * 100;
    
    movers.push({
      symbol: position.symbol,
      change_percent: changePercent,
      current_price: currentPrice,
      position_value: position.quantity * currentPrice
    });
  }
  
  movers.sort((a, b) => b.change_percent - a.change_percent);
  
  return {
    gainers: movers.slice(0, 3),
    losers: movers.slice(-3).reverse()
  };
}

async function getPortfolioDetails(req, res) {
  const { portfolioId } = req.query || req.body || {};
  
  const portfolio = portfolioId 
    ? await getPortfolioById(portfolioId)
    : await getDefaultPortfolio();
    
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio not found' });
  }
  
  const valuation = await calculatePortfolioValue(portfolio);
  
  return res.status(200).json({
    success: true,
    portfolio: {
      ...portfolio,
      valuation
    }
  });
}

async function getRebalancingSuggestions(req, res) {
  return await generateOptimizationSuggestions(req, res);
}

async function getPerformanceMetrics(req, res) {
  const { portfolioId, period = '30d' } = req.query || req.body || {};
  
  const portfolio = portfolioId 
    ? await getPortfolioById(portfolioId)
    : await getDefaultPortfolio();
    
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio not found' });
  }
  
  const historicalData = await getHistoricalPortfolioData(portfolio.id, period);
  const performance = await getDailyPerformance(portfolio.id);
  
  return res.status(200).json({
    success: true,
    portfolio_id: portfolio.id,
    period,
    metrics: {
      current_value: performance.totalValue,
      daily_return: performance.dailyReturnPct,
      period_return: calculatePeriodReturn(historicalData),
      volatility: calculateVolatility(historicalData),
      sharpe_ratio: calculateSharpeRatio(historicalData)
    }
  });
}

function calculatePeriodReturn(data) {
  if (data.length < 2) return 0;
  
  const start = data[0].total_value;
  const end = data[data.length - 1].total_value;
  
  return ((end - start) / start) * 100;
}