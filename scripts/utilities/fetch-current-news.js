/**
 * Fetch REAL current financial news with actual dates
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const FMP_API_KEY = process.env.FMP_API_KEY || process.env.FINANCIAL_MODELING_PREP_API_KEY;

async function fetchCurrentNews() {
  console.log('📡 Fetching REAL current financial news...\n');
  console.log('Today\'s date:', new Date().toISOString().split('T')[0]);
  console.log('='.repeat(60) + '\n');
  
  if (!FMP_API_KEY || FMP_API_KEY === 'YOUR_FMP_API_KEY') {
    console.log('❌ No valid FMP API key found');
    console.log('FMP_API_KEY:', FMP_API_KEY);
    
    // Try a free news API
    console.log('\n🔄 Trying free financial news API...');
    
    try {
      // Try NewsAPI for business/financial news
      const response = await fetch(`https://newsapi.org/v2/everything?q=Apple OR Microsoft OR Tesla OR NVIDIA&category=business&language=en&sortBy=publishedAt&pageSize=5&apiKey=demo`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ NewsAPI response received');
        
        if (data.articles && data.articles.length > 0) {
          console.log(`\n📰 Found ${data.articles.length} current articles:\n`);
          
          data.articles.slice(0, 3).forEach((article, i) => {
            const publishedDate = new Date(article.publishedAt);
            const hoursAgo = Math.round((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60));
            
            console.log(`${i + 1}. ${article.title}`);
            console.log(`   Source: ${article.source.name}`);
            console.log(`   Published: ${publishedDate.toLocaleDateString()} (${hoursAgo} hours ago)`);
            console.log(`   Description: ${article.description?.substring(0, 100)}...`);
            console.log('');
          });
          
          return data.articles.slice(0, 3);
        }
      } else {
        console.log('❌ NewsAPI failed:', response.status);
      }
    } catch (error) {
      console.log('❌ NewsAPI error:', error.message);
    }
    
    return null;
  }
  
  // Use FMP API for real financial news
  try {
    console.log('🔄 Fetching from Financial Modeling Prep...');
    
    const response = await fetch(`https://financialmodelingprep.com/api/v3/stock_news?tickers=AAPL,MSFT,GOOGL,NVDA,TSLA,META,AMZN&limit=10&apikey=${FMP_API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`);
    }
    
    const news = await response.json();
    
    if (news && news.length > 0) {
      console.log(`✅ Found ${news.length} current articles from FMP:\n`);
      
      news.slice(0, 5).forEach((article, i) => {
        const publishedDate = new Date(article.publishedDate);
        const hoursAgo = Math.round((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60));
        
        console.log(`${i + 1}. ${article.title}`);
        console.log(`   Source: ${article.site}`);
        console.log(`   Published: ${publishedDate.toLocaleDateString()} (${hoursAgo} hours ago)`);
        console.log(`   Tickers: ${article.tickers || 'N/A'}`);
        console.log(`   Text: ${article.text?.substring(0, 150)}...`);
        console.log('');
      });
      
      return news.slice(0, 3);
    } else {
      console.log('❌ No news data returned from FMP');
      return null;
    }
    
  } catch (error) {
    console.log('❌ FMP API error:', error.message);
    return null;
  }
}

async function checkNewsDate() {
  console.log('🕐 Checking news recency...\n');
  
  const news = await fetchCurrentNews();
  
  if (news && news.length > 0) {
    console.log('\n📅 NEWS DATE ANALYSIS:');
    console.log('='.repeat(40));
    
    news.forEach((article, i) => {
      const publishedDate = new Date(article.publishedAt || article.publishedDate);
      const now = new Date();
      const diffHours = Math.round((now - publishedDate) / (1000 * 60 * 60));
      const diffDays = Math.round(diffHours / 24);
      
      console.log(`\nArticle ${i + 1}:`);
      console.log(`  Published: ${publishedDate.toISOString()}`);
      console.log(`  Age: ${diffDays} days, ${diffHours % 24} hours ago`);
      console.log(`  Current? ${diffDays < 7 ? '✅ Recent' : '❌ Old'}`);
    });
    
    const avgAge = news.reduce((sum, article) => {
      const publishedDate = new Date(article.publishedAt || article.publishedDate);
      const ageHours = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);
      return sum + ageHours;
    }, 0) / news.length;
    
    console.log(`\n📊 Average news age: ${Math.round(avgAge)} hours (${Math.round(avgAge/24)} days)`);
    console.log(`📊 News freshness: ${avgAge < 168 ? '✅ Fresh (< 1 week)' : '❌ Stale (> 1 week)'}`);
    
  } else {
    console.log('❌ No current news could be fetched');
    console.log('\n💡 To get real news:');
    console.log('1. Set FMP_API_KEY in .env file');
    console.log('2. Or configure another news API');
    console.log('3. Ensure API key has sufficient quota');
  }
}

checkNewsDate().catch(console.error);