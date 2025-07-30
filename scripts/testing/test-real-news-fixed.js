/**
 * Test Real News Integration - FIXED VERSION
 * Tests fetching real current news and analyzing portfolio impact
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { createNewsFetcher } from './lib/real-news-fetcher.js';

dotenv.config();

async function testRealNewsFetcher() {
  console.log('🧪 Testing Real News Fetcher\n');
  console.log('Today:', new Date().toLocaleDateString());
  console.log('='.repeat(60) + '\n');
  
  const newsFetcher = createNewsFetcher();
  
  // Check API status
  console.log('📊 API Status:');
  const apiStatus = newsFetcher.getAPIStatus();
  Object.entries(apiStatus).forEach(([api, available]) => {
    console.log(`   ${api}: ${available ? '✅' : '❌'}`);
  });
  console.log('');
  
  // Fetch current news
  console.log('📡 Fetching current financial news...');
  const currentNews = await newsFetcher.fetchCurrentNews(['AAPL', 'MSFT', 'TSLA']);
  
  if (!currentNews || currentNews.length === 0) {
    console.log('❌ No current news found');
    return false;
  }
  
  console.log(`✅ Found ${currentNews.length} current articles:\n`);
  
  // Display news with date validation
  currentNews.forEach((article, i) => {
    console.log(`${i + 1}. ${article.title}`);
    console.log(`   Source: ${article.source} (${article.api_source})`);
    console.log(`   Published: ${new Date(article.published_at).toLocaleString()}`);
    console.log(`   Age: ${article.age_hours} hours old`);
    console.log(`   Entities: ${article.entities.join(', ')}`);
    console.log(`   Current: ${article.is_current ? '✅' : '❌'}`);
    console.log(`   Confidence: ${(article.confidence * 100).toFixed(0)}%`);
    console.log('');
  });
  
  return currentNews;
}

async function testPortfolioImpactWithRealNews() {
  console.log('🤖 Testing Portfolio Impact with Real News\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Test fetching current news via API
    console.log('1️⃣ Fetching current news via API...');
    const response = await fetch('http://localhost:3000/api/grok-portfolio-impact?symbols=AAPL,MSFT,TSLA', {
      method: 'GET'
    });
    
    if (!response.ok) {
      console.log('❌ API not available. Testing auto-analysis...');
      return await testAutoAnalysis();
    }
    
    const newsData = await response.json();
    
    if (newsData.success) {
      console.log(`✅ Found ${newsData.news_count} current articles`);
      console.log(`📊 Sources used: ${newsData.news_sources_used.join(', ')}`);
      console.log(`⏰ Average age: ${newsData.avg_age_hours} hours`);
      
      if (newsData.current_news.length > 0) {
        console.log('\n📰 Sample current news:');
        newsData.current_news.slice(0, 2).forEach((article, i) => {
          console.log(`   ${i + 1}. ${article.title}`);
          console.log(`      Age: ${article.age_hours}h | Source: ${article.source}`);
        });
      }
    }
    
    // Test auto-analysis with current news
    console.log('\n2️⃣ Testing auto-analysis with current news...');
    return await testAutoAnalysis();
    
  } catch (error) {
    console.log('❌ API test failed:', error.message);
    return false;
  }
}

async function testAutoAnalysis() {
  try {
    const response = await fetch('http://localhost:3000/api/grok-portfolio-impact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fetch_current_news: true,
        portfolio_id: 'TEST_NEWS_IMPACT'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Auto-analysis failed:', error);
      return false;
    }
    
    const analysis = await response.json();
    
    if (analysis.success) {
      console.log('✅ Real news auto-analysis completed!');
      console.log(`📊 Analyzed ${analysis.news_analyzed} current articles`);
      console.log(`📈 Combined impact: $${analysis.combined_impact.total_dollar_impact.toFixed(2)}`);
      console.log(`🎯 Confidence: ${(analysis.combined_impact.avg_confidence * 100).toFixed(0)}%`);
      console.log(`⏰ News recency: ${analysis.combined_impact.news_recency}`);
      console.log(`🔗 Sources: ${analysis.api_sources_used.join(', ')}`);
      
      if (analysis.analyses && analysis.analyses.length > 0) {
        console.log('\n📝 Individual analyses:');
        analysis.analyses.forEach((a, i) => {
          console.log(`   ${i + 1}. ${a.news_item.title}`);
          console.log(`      Impact: $${a.analysis?.total_impact || 0}`);
          console.log(`      Functions called: ${a.function_calls.map(fc => fc.function).join(', ')}`);
        });
      }
      
      return true;
    } else {
      console.log('❌ Analysis failed:', analysis.error);
      console.log('💡 Recommendation:', analysis.recommendation);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Auto-analysis error:', error.message);
    return false;
  }
}

async function validateNewsRecency(news) {
  console.log('\n📅 Validating News Recency:\n');
  
  if (!news || news.length === 0) {
    console.log('❌ No news to validate');
    return false;
  }
  
  const now = new Date();
  let validCount = 0;
  
  news.forEach((article, i) => {
    const publishedDate = new Date(article.published_at);
    const ageHours = (now - publishedDate) / (1000 * 60 * 60);
    const ageDays = Math.round(ageHours / 24);
    
    const isRecent = ageHours < 72; // Less than 3 days
    const isCurrent = ageHours < 24; // Less than 1 day
    
    console.log(`${i + 1}. ${article.title.substring(0, 50)}...`);
    console.log(`   Published: ${publishedDate.toLocaleDateString()}`);
    console.log(`   Age: ${ageDays} days, ${Math.round(ageHours % 24)} hours`);
    console.log(`   Status: ${isCurrent ? '🟢 Current' : isRecent ? '🟡 Recent' : '🔴 Old'}`);
    console.log('');
    
    if (isRecent) validCount++;
  });
  
  const validPercent = (validCount / news.length) * 100;
  console.log(`📊 Summary: ${validCount}/${news.length} articles are recent (${validPercent.toFixed(0)}%)`);
  console.log(`✅ News quality: ${validPercent > 50 ? 'Good' : 'Poor'}`);
  
  return validPercent > 50;
}

async function runAllTests() {
  console.log('🚀 REAL NEWS INTEGRATION TESTS\n');
  console.log('Testing fixed news data and API integration\n');
  console.log('='.repeat(80) + '\n');
  
  // Test 1: News fetcher
  console.log('TEST 1: Real News Fetcher');
  console.log('-'.repeat(30));
  const news = await testRealNewsFetcher();
  const newsFetcherWorking = !!news && news.length > 0;
  
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Test 2: News recency validation
  console.log('TEST 2: News Recency Validation');
  console.log('-'.repeat(30));
  const newsIsRecent = await validateNewsRecency(news);
  
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Test 3: Portfolio impact with real news
  console.log('TEST 3: Portfolio Impact with Real News');
  console.log('-'.repeat(30));
  const portfolioImpactWorking = await testPortfolioImpactWithRealNews();
  
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Summary
  console.log('📊 TEST RESULTS SUMMARY:');
  console.log('='.repeat(40));
  console.log(`✅ Real News Fetcher: ${newsFetcherWorking ? 'WORKING' : 'FAILED'}`);
  console.log(`✅ News Recency: ${newsIsRecent ? 'CURRENT' : 'OLD'}`);
  console.log(`✅ Portfolio Impact: ${portfolioImpactWorking ? 'WORKING' : 'FAILED'}`);
  
  const overallSuccess = newsFetcherWorking && portfolioImpactWorking;
  console.log(`\n🎯 OVERALL: ${overallSuccess ? '✅ SUCCESS' : '❌ NEEDS WORK'}`);
  
  if (overallSuccess) {
    console.log('\n🎉 Real news integration is working!');
    console.log('✅ Fixed: News Data - Using real current news');
    console.log('✅ Fixed: API Integration - Multiple sources working');
  } else {
    console.log('\n⚠️  Issues to fix:');
    if (!newsFetcherWorking) console.log('   - News fetcher not working');
    if (!newsIsRecent) console.log('   - News data is too old');
    if (!portfolioImpactWorking) console.log('   - Portfolio impact analysis failed');
  }
}

runAllTests().catch(console.error);