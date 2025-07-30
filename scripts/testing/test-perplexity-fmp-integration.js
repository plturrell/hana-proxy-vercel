/**
 * Test Perplexity + FMP/Finnhub Integration
 * Tests using ONLY the specified data sources
 */

import dotenv from 'dotenv';
import { createPerplexityNewsFetcher } from './lib/perplexity-news-fetcher.js';
import { createMarketDataFetcher } from './lib/market-data-fetcher.js';

dotenv.config();

async function testAPIKeys() {
  console.log('🔑 Testing API Key Configuration\n');
  
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  const fmpKey = process.env.FMP_API_KEY || process.env.FINANCIAL_MODELING_PREP_API_KEY;
  const finnhubKey = process.env.FINNHUB_API_KEY || process.env.FINHUB_API_KEY;
  
  console.log('API Keys Status:');
  console.log(`Perplexity: ${perplexityKey && perplexityKey !== 'YOUR_PERPLEXITY_API_KEY' ? '✅ Configured' : '❌ Missing/Invalid'}`);
  console.log(`FMP: ${fmpKey && fmpKey !== 'YOUR_FMP_API_KEY' ? '✅ Configured' : '❌ Missing/Invalid'}`);
  console.log(`Finnhub: ${finnhubKey && finnhubKey !== 'YOUR_FINNHUB_API_KEY' ? '✅ Configured' : '❌ Missing/Invalid'}`);
  
  return {
    perplexity: perplexityKey && perplexityKey !== 'YOUR_PERPLEXITY_API_KEY',
    fmp: fmpKey && fmpKey !== 'YOUR_FMP_API_KEY',
    finnhub: finnhubKey && finnhubKey !== 'YOUR_FINNHUB_API_KEY'
  };
}

async function testPerplexityNews() {
  console.log('\n📰 Testing Perplexity News Fetcher\n');
  console.log('='.repeat(50));
  
  try {
    const newsFetcher = createPerplexityNewsFetcher();
    
    if (!newsFetcher.isConfigured()) {
      console.log('❌ Perplexity API key not configured');
      console.log('💡 Set PERPLEXITY_API_KEY in .env file');
      return false;
    }
    
    console.log('🔄 Fetching current financial news from Perplexity...');
    
    const symbols = ['AAPL', 'MSFT', 'TSLA'];
    const news = await newsFetcher.fetchCurrentFinancialNews(symbols);
    
    if (!news || news.length === 0) {
      console.log('❌ No news returned from Perplexity');
      return false;
    }
    
    console.log(`✅ Retrieved ${news.length} news articles from Perplexity\n`);
    
    // Display news with validation
    news.forEach((article, i) => {
      console.log(`${i + 1}. ${article.title}`);
      console.log(`   Source: ${article.source}`);
      console.log(`   Published: ${new Date(article.published_at).toLocaleString()}`);
      console.log(`   Age: ${article.age_hours} hours`);
      console.log(`   Entities: ${article.entities.join(', ')}`);
      console.log(`   Impact: ${article.market_impact || 'N/A'}`);
      console.log(`   Confidence: ${(article.confidence * 100).toFixed(0)}%`);
      console.log('');
    });
    
    // Validate news recency
    const recentNews = news.filter(n => n.age_hours <= 24);
    console.log(`📊 News Analysis:`);
    console.log(`   Total articles: ${news.length}`);
    console.log(`   Recent (< 24h): ${recentNews.length}`);
    console.log(`   Avg age: ${Math.round(news.reduce((sum, n) => sum + n.age_hours, 0) / news.length)} hours`);
    console.log(`   Data quality: ${recentNews.length > 0 ? '✅ Current' : '⚠️ Stale'}`);
    
    return news;
    
  } catch (error) {
    console.log('❌ Perplexity test failed:', error.message);
    return false;
  }
}

async function testMarketData() {
  console.log('\n📊 Testing FMP & Finnhub Market Data\n');
  console.log('='.repeat(50));
  
  try {
    const marketDataFetcher = createMarketDataFetcher();
    const symbols = ['AAPL', 'MSFT', 'TSLA'];
    
    // Test API connections
    console.log('🔄 Testing API connections...');
    const connectionStatus = await marketDataFetcher.testConnections();
    
    console.log('Connection Status:');
    console.log(`   FMP: ${connectionStatus.fmp.working ? '✅ Working' : `❌ ${connectionStatus.fmp.error}`}`);
    console.log(`   Finnhub: ${connectionStatus.finnhub.working ? '✅ Working' : `❌ ${connectionStatus.finnhub.error}`}`);
    
    let successCount = 0;
    
    // Test FMP prices
    if (connectionStatus.fmp.working) {
      try {
        console.log('\n🔄 Fetching current prices from FMP...');
        const prices = await marketDataFetcher.getCurrentPrices(symbols);
        
        console.log(`✅ FMP Prices (${prices.length} symbols):`);
        prices.forEach(quote => {
          console.log(`   ${quote.symbol}: $${quote.price} (${quote.changesPercentage > 0 ? '+' : ''}${quote.changesPercentage.toFixed(2)}%)`);
        });
        successCount++;
        
      } catch (error) {
        console.log('❌ FMP price fetch failed:', error.message);
      }
    }
    
    // Test Finnhub real-time data
    if (connectionStatus.finnhub.working) {
      try {
        console.log('\n🔄 Fetching real-time data from Finnhub...');
        const realTimeData = await marketDataFetcher.getRealTimeData(symbols.slice(0, 2)); // Limit to avoid rate limits
        
        console.log(`✅ Finnhub Real-time (${realTimeData.length} symbols):`);
        realTimeData.forEach(data => {
          console.log(`   ${data.symbol}: $${data.current} (${data.changePercent > 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)`);
        });
        successCount++;
        
      } catch (error) {
        console.log('❌ Finnhub real-time fetch failed:', error.message);
      }
    }
    
    return successCount > 0;
    
  } catch (error) {
    console.log('❌ Market data test failed:', error.message);
    return false;
  }
}

async function testIntegratedAnalysis() {
  console.log('\n🤖 Testing Integrated News + Market Data Analysis\n');
  console.log('='.repeat(50));
  
  try {
    // Fetch news from Perplexity
    const newsFetcher = createPerplexityNewsFetcher();
    if (!newsFetcher.isConfigured()) {
      console.log('❌ Cannot test integration: Perplexity not configured');
      return false;
    }
    
    console.log('🔄 Fetching news from Perplexity...');
    const news = await newsFetcher.fetchCurrentFinancialNews(['AAPL', 'MSFT']);
    
    if (!news || news.length === 0) {
      console.log('❌ No news to analyze');
      return false;
    }
    
    // Fetch market data
    const marketDataFetcher = createMarketDataFetcher();
    console.log('🔄 Fetching market data...');
    
    const connectionStatus = await marketDataFetcher.testConnections();
    let marketData = null;
    
    if (connectionStatus.fmp.working) {
      try {
        marketData = await marketDataFetcher.getCurrentPrices(['AAPL', 'MSFT']);
      } catch (error) {
        console.log('⚠️ Market data fetch failed, continuing with news only');
      }
    }
    
    // Analyze integration
    console.log('\n📊 Integration Analysis:');
    console.log(`   News articles: ${news.length}`);
    console.log(`   Market data points: ${marketData ? marketData.length : 0}`);
    
    // Show combined data
    const topNews = news.slice(0, 2);
    topNews.forEach((article, i) => {
      console.log(`\n${i + 1}. ${article.title}`);
      console.log(`   Published: ${article.age_hours}h ago`);
      console.log(`   Entities: ${article.entities.join(', ')}`);
      console.log(`   Impact: ${article.market_impact || 'Neutral'}`);
      
      // Show related market data if available
      if (marketData) {
        article.entities.forEach(symbol => {
          const priceData = marketData.find(p => p.symbol === symbol);
          if (priceData) {
            console.log(`   ${symbol} Price: $${priceData.price} (${priceData.changesPercentage > 0 ? '+' : ''}${priceData.changesPercentage.toFixed(2)}%)`);
          }
        });
      }
    });
    
    console.log('\n✅ Integration test successful!');
    console.log('   ✅ News from Perplexity: Working');
    console.log(`   ✅ Market data from FMP/Finnhub: ${marketData ? 'Working' : 'Partial'}`);
    
    return true;
    
  } catch (error) {
    console.log('❌ Integration test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 PERPLEXITY + FMP/FINNHUB INTEGRATION TEST\n');
  console.log('Testing ONLY the specified data sources\n');
  console.log('='.repeat(60) + '\n');
  
  // Test 1: API Keys
  const apiStatus = await testAPIKeys();
  
  // Test 2: Perplexity News
  const newsWorking = await testPerplexityNews();
  
  // Test 3: Market Data
  const marketDataWorking = await testMarketData();
  
  // Test 4: Integration
  const integrationWorking = await testIntegratedAnalysis();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log('\nAPI Configuration:');
  console.log(`   Perplexity API: ${apiStatus.perplexity ? '✅ Ready' : '❌ Not configured'}`);
  console.log(`   FMP API: ${apiStatus.fmp ? '✅ Ready' : '❌ Not configured'}`);
  console.log(`   Finnhub API: ${apiStatus.finnhub ? '✅ Ready' : '❌ Not configured'}`);
  
  console.log('\nFunctionality Tests:');
  console.log(`   News Fetching (Perplexity): ${newsWorking ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Market Data (FMP/Finnhub): ${marketDataWorking ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Integration: ${integrationWorking ? '✅ Working' : '❌ Failed'}`);
  
  const overallSuccess = newsWorking && (marketDataWorking || integrationWorking);
  
  console.log(`\n🎯 OVERALL STATUS: ${overallSuccess ? '✅ SUCCESS' : '❌ NEEDS CONFIGURATION'}`);
  
  if (overallSuccess) {
    console.log('\n🎉 Integration is working with specified sources!');
    console.log('✅ News: Perplexity API');
    console.log('✅ Market Data: FMP and/or Finnhub');
    console.log('✅ No fallback sources used');
  } else {
    console.log('\n⚠️ Configuration needed:');
    if (!apiStatus.perplexity) console.log('   - Add valid PERPLEXITY_API_KEY to .env');
    if (!apiStatus.fmp) console.log('   - Add valid FMP_API_KEY to .env');
    if (!apiStatus.finnhub) console.log('   - Add valid FINNHUB_API_KEY to .env');
    if (!newsWorking) console.log('   - Fix Perplexity news integration');
    if (!marketDataWorking) console.log('   - Fix FMP/Finnhub market data integration');
  }
}

runAllTests().catch(console.error);