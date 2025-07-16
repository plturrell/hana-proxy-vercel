// Real-time market data service with multiple provider support
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Cache for market data (5 minute expiry)
const marketDataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Free market data providers (no API key required)
const FREE_PROVIDERS = {
  // Yahoo Finance (unofficial but reliable)
  yahoo: async (symbol) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const quote = data.chart?.result?.[0]?.meta;
      
      if (!quote) return null;
      
      // Calculate volatility from day's range
      const dayRange = (quote.regularMarketDayHigh - quote.regularMarketDayLow) / quote.regularMarketPrice;
      const annualizedVolatility = dayRange * Math.sqrt(252) * 0.5; // Rough estimate
      
      return {
        symbol: symbol,
        price: quote.regularMarketPrice,
        previousClose: quote.previousClose,
        change: quote.regularMarketPrice - quote.previousClose,
        changePercent: ((quote.regularMarketPrice - quote.previousClose) / quote.previousClose) * 100,
        volume: quote.regularMarketVolume,
        dayHigh: quote.regularMarketDayHigh,
        dayLow: quote.regularMarketDayLow,
        volatility: Math.max(0.15, Math.min(0.80, annualizedVolatility)), // Clamp between 15% and 80%
        timestamp: new Date().toISOString(),
        source: 'yahoo'
      };
    } catch (error) {
      console.log(`Yahoo Finance error for ${symbol}:`, error.message);
      return null;
    }
  },

  // Financial Modeling Prep (limited free tier)
  fmp: async (symbol) => {
    try {
      const url = `https://financialmodelingprep.com/api/v3/quote-short/${symbol}?apikey=demo`;
      const response = await fetch(url);
      
      if (!response.ok) return null;
      
      const data = await response.json();
      if (!data || data.length === 0) return null;
      
      const quote = data[0];
      
      return {
        symbol: symbol,
        price: quote.price,
        volume: quote.volume || 1000000,
        volatility: 0.25, // Default volatility
        timestamp: new Date().toISOString(),
        source: 'fmp'
      };
    } catch (error) {
      console.log(`FMP error for ${symbol}:`, error.message);
      return null;
    }
  },

  // Twelve Data (free tier available)
  twelve: async (symbol) => {
    try {
      const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=demo`;
      const response = await fetch(url);
      
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data.status === 'error') return null;
      
      return {
        symbol: symbol,
        price: parseFloat(data.close),
        previousClose: parseFloat(data.previous_close),
        change: parseFloat(data.change),
        changePercent: parseFloat(data.percent_change),
        volume: parseInt(data.volume),
        dayHigh: parseFloat(data.high),
        dayLow: parseFloat(data.low),
        volatility: Math.abs(parseFloat(data.percent_change)) / 100 * Math.sqrt(252) * 0.3,
        timestamp: new Date().toISOString(),
        source: 'twelve'
      };
    } catch (error) {
      console.log(`Twelve Data error for ${symbol}:`, error.message);
      return null;
    }
  }
};

// Get real-time market data with fallback
export async function getRealTimeMarketData(symbol) {
  // Check cache first
  const cacheKey = `market_${symbol}`;
  const cached = marketDataCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Returning cached data for ${symbol}`);
    return cached.data;
  }
  
  // Try each provider in order
  for (const [providerName, providerFunc] of Object.entries(FREE_PROVIDERS)) {
    console.log(`Trying ${providerName} for ${symbol}...`);
    const data = await providerFunc(symbol);
    
    if (data) {
      // Cache successful result
      marketDataCache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });
      
      console.log(`Successfully fetched ${symbol} from ${providerName}: $${data.price}`);
      return data;
    }
  }
  
  // If all providers fail, return null (caller should use fallback)
  console.log(`All providers failed for ${symbol}, returning null`);
  return null;
}

// Get historical price data for Monte Carlo
export async function getHistoricalPrices(symbol, days = 30) {
  try {
    // Calculate date range
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (days * 24 * 60 * 60);
    
    // Try Yahoo Finance historical data
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const quotes = data.chart?.result?.[0]?.indicators?.quote?.[0];
    const timestamps = data.chart?.result?.[0]?.timestamp;
    
    if (!quotes || !timestamps) return null;
    
    // Calculate daily returns
    const prices = quotes.close.filter(p => p !== null);
    const returns = [];
    
    for (let i = 1; i < prices.length; i++) {
      const dailyReturn = (prices[i] - prices[i-1]) / prices[i-1];
      returns.push(dailyReturn);
    }
    
    // Calculate statistics
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const annualizedVolatility = stdDev * Math.sqrt(252);
    
    return {
      prices: prices,
      returns: returns,
      meanReturn: mean,
      volatility: annualizedVolatility,
      lastPrice: prices[prices.length - 1],
      dataPoints: prices.length
    };
    
  } catch (error) {
    console.log(`Historical data error for ${symbol}:`, error.message);
    return null;
  }
}

// Proper Monte Carlo simulation with real data
export async function monteCarloSimulation(params) {
  const {
    symbol,
    currentPrice,
    volatility,
    riskFreeRate = 0.045,
    timeHorizon = 252, // days
    numSimulations = 10000,
    confidenceLevel = 0.95
  } = params;
  
  console.log(`Running Monte Carlo simulation for ${symbol}`);
  console.log(`Price: $${currentPrice}, Volatility: ${volatility}, Simulations: ${numSimulations}`);
  
  // Time increment
  const dt = 1 / 252; // Daily steps
  const sqrtDt = Math.sqrt(dt);
  
  // Arrays to store final values
  const finalValues = [];
  const paths = [];
  
  // Run simulations
  for (let sim = 0; sim < numSimulations; sim++) {
    let price = currentPrice;
    const path = [price];
    
    // Simulate price path
    for (let t = 0; t < timeHorizon; t++) {
      // Generate random normal variable (Box-Muller transform)
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      // Geometric Brownian Motion
      const drift = (riskFreeRate - 0.5 * volatility * volatility) * dt;
      const diffusion = volatility * sqrtDt * z;
      
      price = price * Math.exp(drift + diffusion);
      path.push(price);
    }
    
    finalValues.push(price);
    
    // Store some paths for visualization (every 100th simulation)
    if (sim % 100 === 0) {
      paths.push(path);
    }
  }
  
  // Sort final values for percentile calculations
  finalValues.sort((a, b) => a - b);
  
  // Calculate statistics
  const mean = finalValues.reduce((a, b) => a + b, 0) / numSimulations;
  const median = finalValues[Math.floor(numSimulations / 2)];
  
  // Value at Risk (VaR) and Conditional VaR
  const varIndex = Math.floor((1 - confidenceLevel) * numSimulations);
  const var95 = currentPrice - finalValues[varIndex];
  
  // Expected Shortfall (CVaR)
  let cvar = 0;
  for (let i = 0; i <= varIndex; i++) {
    cvar += (currentPrice - finalValues[i]);
  }
  cvar = cvar / (varIndex + 1);
  
  // Probability of profit
  const profitableScenarios = finalValues.filter(v => v > currentPrice).length;
  const probabilityOfProfit = profitableScenarios / numSimulations;
  
  // Percentiles
  const percentiles = {
    p5: finalValues[Math.floor(0.05 * numSimulations)],
    p25: finalValues[Math.floor(0.25 * numSimulations)],
    p50: median,
    p75: finalValues[Math.floor(0.75 * numSimulations)],
    p95: finalValues[Math.floor(0.95 * numSimulations)]
  };
  
  return {
    symbol: symbol,
    currentPrice: currentPrice,
    simulationParams: {
      volatility: volatility,
      riskFreeRate: riskFreeRate,
      timeHorizon: timeHorizon,
      numSimulations: numSimulations
    },
    results: {
      meanPrice: mean,
      medianPrice: median,
      valueAtRisk95: var95,
      conditionalVaR95: cvar,
      probabilityOfProfit: probabilityOfProfit,
      percentiles: percentiles,
      maxPrice: finalValues[numSimulations - 1],
      minPrice: finalValues[0]
    },
    samplePaths: paths,
    timestamp: new Date().toISOString()
  };
}

// Options pricing with Monte Carlo
export async function monteCarloOptionPrice(params) {
  const {
    symbol,
    spotPrice,
    strikePrice,
    volatility,
    riskFreeRate = 0.045,
    timeToExpiry, // in years
    optionType = 'call',
    numSimulations = 50000
  } = params;
  
  const timeSteps = Math.floor(timeToExpiry * 252); // Daily steps
  const dt = timeToExpiry / timeSteps;
  const sqrtDt = Math.sqrt(dt);
  
  let payoffSum = 0;
  
  for (let sim = 0; sim < numSimulations; sim++) {
    let price = spotPrice;
    
    // Simulate to expiry
    for (let t = 0; t < timeSteps; t++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      const drift = (riskFreeRate - 0.5 * volatility * volatility) * dt;
      const diffusion = volatility * sqrtDt * z;
      
      price = price * Math.exp(drift + diffusion);
    }
    
    // Calculate payoff
    let payoff = 0;
    if (optionType === 'call') {
      payoff = Math.max(price - strikePrice, 0);
    } else if (optionType === 'put') {
      payoff = Math.max(strikePrice - price, 0);
    }
    
    payoffSum += payoff;
  }
  
  // Discount to present value
  const optionPrice = (payoffSum / numSimulations) * Math.exp(-riskFreeRate * timeToExpiry);
  
  return {
    optionPrice: optionPrice,
    parameters: {
      spotPrice: spotPrice,
      strikePrice: strikePrice,
      volatility: volatility,
      riskFreeRate: riskFreeRate,
      timeToExpiry: timeToExpiry,
      optionType: optionType
    },
    simulations: numSimulations,
    method: 'Monte Carlo'
  };
}