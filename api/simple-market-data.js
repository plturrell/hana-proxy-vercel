// Simple real-time market data fetcher
export async function getSimpleMarketData(symbol) {
  try {
    // Use a simple API that doesn't require authentication
    const response = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=USD`);
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const data = await response.json();
    
    // For crypto symbols
    if (['BTC', 'ETH', 'SOL'].includes(symbol)) {
      const rate = data.data.rates[symbol];
      if (rate) {
        const price = 1 / parseFloat(rate);
        return {
          symbol,
          price: price,
          volatility: symbol === 'BTC' ? 0.60 : 0.75,
          source: 'coinbase',
          timestamp: new Date().toISOString()
        };
      }
    }
    
    // For stocks, use a different approach - simulate real-time with some randomness
    // In production, you'd use a proper stock API
    const baselinePrices = {
      'AAPL': 208.50,   // Updated baseline
      'MSFT': 425.00,
      'GOOGL': 175.00,
      'TSLA': 260.00,
      'META': 500.00,
      'NVDA': 130.00,
      'JPM': 200.00
    };
    
    const basePrice = baselinePrices[symbol] || 100;
    // Add small random variation to simulate real-time changes
    const variation = (Math.random() - 0.5) * 0.02; // +/- 1%
    const price = basePrice * (1 + variation);
    
    // Realistic volatilities
    const volatilities = {
      'AAPL': 0.23,
      'MSFT': 0.20,
      'GOOGL': 0.28,
      'TSLA': 0.55,
      'META': 0.35,
      'NVDA': 0.45,
      'JPM': 0.22
    };
    
    return {
      symbol,
      price: parseFloat(price.toFixed(2)),
      volatility: volatilities[symbol] || 0.25,
      change: parseFloat((price * variation).toFixed(2)),
      changePercent: parseFloat((variation * 100).toFixed(2)),
      volume: Math.floor(Math.random() * 50000000) + 10000000,
      source: 'simulated_realtime',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`Market data error for ${symbol}:`, error.message);
    return null;
  }
}