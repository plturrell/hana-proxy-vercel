/**
 * Market Data Fetcher - FMP and Finnhub Integration
 * Fetches real market data from Financial Modeling Prep and Finnhub
 */

import fetch from 'node-fetch';

export class MarketDataFetcher {
  constructor(apiKeys) {
    this.fmpKey = apiKeys.fmp;
    this.finnhubKey = apiKeys.finnhub;
    this.fmpBase = 'https://financialmodelingprep.com/api/v3';
    this.finnhubBase = 'https://finnhub.io/api/v1';
  }

  /**
   * Get current stock prices from FMP
   */
  async getCurrentPrices(symbols) {
    if (!this.fmpKey || this.fmpKey === 'YOUR_FMP_API_KEY') {
      throw new Error('Valid FMP API key required');
    }

    console.log(`📊 Fetching current prices for ${symbols.length} symbols from FMP...`);

    try {
      const symbolsStr = symbols.join(',');
      const response = await fetch(
        `${this.fmpBase}/quote/${symbolsStr}?apikey=${this.fmpKey}`
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`FMP API error ${response.status}: ${error}`);
      }

      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error('No price data returned from FMP');
      }

      console.log(`✅ FMP: Got prices for ${data.length} symbols`);

      return data.map(quote => ({
        symbol: quote.symbol,
        price: quote.price,
        change: quote.change,
        changesPercentage: quote.changesPercentage,
        dayLow: quote.dayLow,
        dayHigh: quote.dayHigh,
        volume: quote.volume,
        timestamp: new Date().toISOString(),
        source: 'fmp'
      }));

    } catch (error) {
      console.error('❌ FMP price fetch failed:', error.message);
      throw error;
    }
  }

  /**
   * Get company news from FMP
   */
  async getCompanyNews(symbols, limit = 20) {
    if (!this.fmpKey) {
      throw new Error('FMP API key required');
    }

    try {
      const symbolsStr = symbols.join(',');
      const response = await fetch(
        `${this.fmpBase}/stock_news?tickers=${symbolsStr}&limit=${limit}&apikey=${this.fmpKey}`
      );

      if (!response.ok) {
        throw new Error(`FMP news API error: ${response.status}`);
      }

      const news = await response.json();
      
      return news.map(article => ({
        title: article.title,
        summary: article.text,
        published_at: article.publishedDate,
        source: article.site || 'FMP',
        entities: article.tickers ? article.tickers.split(',') : [],
        url: article.url,
        confidence: 0.85,
        api_source: 'fmp'
      }));

    } catch (error) {
      console.error('FMP news fetch failed:', error.message);
      return [];
    }
  }

  /**
   * Get real-time market data from Finnhub
   */
  async getRealTimeData(symbols) {
    if (!this.finnhubKey || this.finnhubKey === 'YOUR_FINNHUB_API_KEY') {
      throw new Error('Valid Finnhub API key required');
    }

    console.log(`📈 Fetching real-time data from Finnhub...`);

    const results = [];

    for (const symbol of symbols) {
      try {
        const response = await fetch(
          `${this.finnhubBase}/quote?symbol=${symbol}&token=${this.finnhubKey}`
        );

        if (!response.ok) {
          console.log(`❌ Finnhub error for ${symbol}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        results.push({
          symbol,
          current: data.c,
          high: data.h,
          low: data.l,
          open: data.o,
          previousClose: data.pc,
          change: data.c - data.pc,
          changePercent: ((data.c - data.pc) / data.pc) * 100,
          timestamp: new Date(data.t * 1000).toISOString(),
          source: 'finnhub'
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`❌ Error fetching ${symbol} from Finnhub:`, error.message);
      }
    }

    console.log(`✅ Finnhub: Got data for ${results.length} symbols`);
    return results;
  }

  /**
   * Get company fundamentals from FMP
   */
  async getCompanyFundamentals(symbol) {
    if (!this.fmpKey) {
      throw new Error('FMP API key required');
    }

    try {
      const response = await fetch(
        `${this.fmpBase}/profile/${symbol}?apikey=${this.fmpKey}`
      );

      if (!response.ok) {
        throw new Error(`FMP fundamentals error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error(`No fundamental data for ${symbol}`);
      }

      const profile = data[0];
      
      return {
        symbol: profile.symbol,
        companyName: profile.companyName,
        sector: profile.sector,
        industry: profile.industry,
        marketCap: profile.mktCap,
        beta: profile.beta,
        pe: profile.pe,
        eps: profile.eps,
        revenue: profile.revenue,
        source: 'fmp'
      };

    } catch (error) {
      console.error(`Fundamentals fetch failed for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Get market news from Finnhub
   */
  async getMarketNews(category = 'general') {
    if (!this.finnhubKey) {
      throw new Error('Finnhub API key required');
    }

    try {
      const response = await fetch(
        `${this.finnhubBase}/news?category=${category}&token=${this.finnhubKey}`
      );

      if (!response.ok) {
        throw new Error(`Finnhub news error: ${response.status}`);
      }

      const news = await response.json();
      
      return news.slice(0, 10).map(article => ({
        title: article.headline,
        summary: article.summary,
        published_at: new Date(article.datetime * 1000).toISOString(),
        source: article.source,
        entities: [], // Finnhub doesn't provide entity extraction
        url: article.url,
        image: article.image,
        confidence: 0.8,
        api_source: 'finnhub'
      }));

    } catch (error) {
      console.error('Finnhub market news failed:', error.message);
      return [];
    }
  }

  /**
   * Check API status
   */
  getAPIStatus() {
    return {
      fmp: !!(this.fmpKey && this.fmpKey !== 'YOUR_FMP_API_KEY'),
      finnhub: !!(this.finnhubKey && this.finnhubKey !== 'YOUR_FINNHUB_API_KEY')
    };
  }

  /**
   * Test API connections
   */
  async testConnections() {
    const results = {
      fmp: { working: false, error: null },
      finnhub: { working: false, error: null }
    };

    // Test FMP
    if (this.fmpKey && this.fmpKey !== 'YOUR_FMP_API_KEY') {
      try {
        const response = await fetch(`${this.fmpBase}/quote/AAPL?apikey=${this.fmpKey}`);
        if (response.ok) {
          results.fmp.working = true;
        } else {
          results.fmp.error = `HTTP ${response.status}`;
        }
      } catch (error) {
        results.fmp.error = error.message;
      }
    } else {
      results.fmp.error = 'No API key configured';
    }

    // Test Finnhub
    if (this.finnhubKey && this.finnhubKey !== 'YOUR_FINNHUB_API_KEY') {
      try {
        const response = await fetch(`${this.finnhubBase}/quote?symbol=AAPL&token=${this.finnhubKey}`);
        if (response.ok) {
          results.finnhub.working = true;
        } else {
          results.finnhub.error = `HTTP ${response.status}`;
        }
      } catch (error) {
        results.finnhub.error = error.message;
      }
    } else {
      results.finnhub.error = 'No API key configured';
    }

    return results;
  }
}

/**
 * Create configured market data fetcher
 */
export function createMarketDataFetcher(env = process.env) {
  const apiKeys = {
    fmp: env.FMP_API_KEY || env.FINANCIAL_MODELING_PREP_API_KEY,
    finnhub: env.FINNHUB_API_KEY || env.FINHUB_API_KEY
  };

  return new MarketDataFetcher(apiKeys);
}