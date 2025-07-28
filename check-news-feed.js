#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ No Supabase key found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNewsFeed() {
  console.log('🔍 Checking Supabase News Feed Connection');
  console.log('URL:', supabaseUrl);
  console.log('='.repeat(50));

  // Test basic connection
  try {
    const { data, error } = await supabase
      .from('news_articles')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Connected to Supabase');
    console.log(`📊 Total news articles: ${data}`);
  } catch (err) {
    console.log('❌ Error:', err.message);
    return;
  }

  // Get recent articles
  try {
    const { data: articles, error } = await supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(3);
    
    if (error) {
      console.log('❌ Failed to fetch articles:', error.message);
    } else if (articles && articles.length > 0) {
      console.log(`\n📰 Recent ${articles.length} articles:`);
      articles.forEach((article, i) => {
        console.log(`\n${i + 1}. ${article.title || 'No title'}`);
        console.log(`   Published: ${article.published_at}`);
        console.log(`   Source: ${article.source || 'Unknown'}`);
      });
    } else {
      console.log('\n📰 No articles found in database');
    }
  } catch (err) {
    console.log('❌ Error fetching articles:', err.message);
  }
}

checkNewsFeed();