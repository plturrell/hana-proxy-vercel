#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateTestNews() {
  console.log('📰 Populating test news for iOS app...');
  
  const testArticles = [
    {
      article_id: randomUUID(),
      title: 'Apple Vision Pro Transforms Financial Analysis',
      content: 'Apple\'s Vision Pro headset is revolutionizing how financial professionals analyze market data with immersive 3D visualizations and AI-powered insights. Major investment banks are adopting the technology for trading floors.',
      url: 'https://example.com/apple-vision-pro-finance',
      source: 'TechCrunch',
      published_at: new Date().toISOString(),
      sentiment_score: 0.9,
      entities: JSON.stringify(['Apple', 'Vision Pro', 'AI', 'Finance']),
      relevance_score: 0.95
    },
    {
      article_id: randomUUID(),
      title: 'Federal Reserve Holds Interest Rates Steady',
      content: 'The Federal Reserve announced today that it will maintain current interest rates, citing steady economic growth and controlled inflation. Markets responded positively to the news.',
      url: 'https://example.com/fed-rates-steady',
      source: 'Reuters',
      published_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      sentiment_score: 0.3,
      entities: JSON.stringify(['Federal Reserve', 'Interest Rates', 'Economy']),
      relevance_score: 0.85
    },
    {
      article_id: randomUUID(),
      title: 'Bitcoin Surges Past $50,000 on ETF Approval',
      content: 'Bitcoin prices soared past $50,000 following the SEC\'s approval of multiple spot Bitcoin ETFs. Institutional investors are increasing their cryptocurrency allocations.',
      url: 'https://example.com/bitcoin-etf-surge',
      source: 'Bloomberg',
      published_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      sentiment_score: 0.8,
      entities: JSON.stringify(['Bitcoin', 'ETF', 'SEC', 'Cryptocurrency']),
      relevance_score: 0.9
    },
    {
      article_id: randomUUID(),
      title: 'AI Startups Raise Record $10B in Q1 2025',
      content: 'Artificial intelligence startups have raised a record-breaking $10 billion in the first quarter of 2025, with fintech AI companies leading the funding rounds.',
      url: 'https://example.com/ai-funding-record',
      source: 'Financial Times',
      published_at: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      sentiment_score: 0.85,
      entities: JSON.stringify(['AI', 'Startups', 'Funding', 'FinTech']),
      relevance_score: 0.88
    }
  ];

  console.log(`\n📝 Inserting ${testArticles.length} test articles...`);
  
  for (const article of testArticles) {
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .insert([article])
        .select();
      
      if (error) {
        console.log(`❌ Failed to insert "${article.title}": ${error.message}`);
      } else {
        console.log(`✅ Inserted: ${article.title}`);
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  // Verify articles
  console.log('\n📊 Verifying articles in database...');
  try {
    const { data: articles, count } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false })
      .limit(10);
    
    console.log(`\n✅ Total articles in database: ${count}`);
    console.log('\n📰 Latest articles:');
    articles.forEach((article, i) => {
      console.log(`${i + 1}. ${article.title}`);
      console.log(`   Sentiment: ${article.sentiment_score || 'N/A'}`);
      console.log(`   Published: ${new Date(article.published_at).toLocaleString()}`);
    });
  } catch (err) {
    console.log('❌ Error fetching articles:', err.message);
  }

  console.log('\n✅ Test news population complete!');
  console.log('\n📱 The iOS app should now be able to fetch these articles.');
}

populateTestNews();