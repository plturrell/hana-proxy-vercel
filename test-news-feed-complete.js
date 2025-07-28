#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewsFeedComplete() {
  console.log('🔍 Testing Complete News Feed System');
  console.log('='.repeat(50));

  // 1. Check current news articles
  console.log('\n1️⃣ Current News Articles in Supabase:');
  try {
    const { data: articles, error, count } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.log('❌ Error fetching articles:', error.message);
    } else {
      console.log(`✅ Found ${count} total articles`);
      console.log(`📰 Showing latest ${articles.length} articles:`);
      
      articles.forEach((article, i) => {
        console.log(`\n${i + 1}. ${article.title}`);
        console.log(`   ID: ${article.article_id}`);
        console.log(`   Published: ${new Date(article.published_at).toLocaleString()}`);
        console.log(`   Source: ${article.source}`);
        console.log(`   Category: ${article.category || 'N/A'}`);
      });
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // 2. Test news entities
  console.log('\n\n2️⃣ News Entities:');
  try {
    const { data: entities, error } = await supabase
      .from('news_entities')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Error fetching entities:', error.message);
    } else {
      console.log(`✅ Found ${entities.length} entities`);
      entities.forEach(entity => {
        console.log(`   - ${entity.entity_name} (${entity.entity_type})`);
      });
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // 3. Test sentiment analysis
  console.log('\n\n3️⃣ News Sentiments:');
  try {
    const { data: sentiments, error } = await supabase
      .from('news_sentiments')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Error fetching sentiments:', error.message);
    } else {
      console.log(`✅ Found ${sentiments.length} sentiment records`);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // 4. Test API endpoint (if available)
  console.log('\n\n4️⃣ Testing News API Endpoint:');
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/news-intelligence-verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ News API endpoint working');
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ News API endpoint error:', response.status, response.statusText);
    }
  } catch (err) {
    console.log('⚠️  News API endpoint not available or error:', err.message);
  }

  // 5. Test real-time subscription capability
  console.log('\n\n5️⃣ Testing Real-time Subscription:');
  const channel = supabase
    .channel('news-updates')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'news_articles' },
      (payload) => {
        console.log('📨 New article received:', payload.new.title);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to news updates');
      } else {
        console.log('⚠️  Subscription status:', status);
      }
    });

  // Wait a moment for subscription
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 6. Insert test article to verify real-time
  console.log('\n\n6️⃣ Testing Article Insertion:');
  const testArticle = {
    article_id: `ios-test-${Date.now()}`,
    title: 'iOS App News Feed Test Article',
    content: 'This article verifies the news feed is working correctly for the iOS app.',
    source: 'iOS Test',
    url: 'https://example.com/ios-test',
    published_at: new Date().toISOString(),
    category: 'Technology',
    author: 'iOS App Tester'
  };

  try {
    const { data, error } = await supabase
      .from('news_articles')
      .insert([testArticle])
      .select();
    
    if (error) {
      console.log('❌ Failed to insert test article:', error.message);
    } else {
      console.log('✅ Test article inserted:', data[0].article_id);
      
      // Clean up after 3 seconds
      setTimeout(async () => {
        const { error: deleteError } = await supabase
          .from('news_articles')
          .delete()
          .eq('article_id', testArticle.article_id);
        
        if (!deleteError) {
          console.log('🧹 Test article cleaned up');
        }
        
        // Unsubscribe and exit
        channel.unsubscribe();
        process.exit(0);
      }, 3000);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
    process.exit(1);
  }
}

testNewsFeedComplete().catch(console.error);