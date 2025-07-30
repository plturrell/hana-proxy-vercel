#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testIOSNewsFeed() {
  console.log('📱 Testing iOS News Feed Integration');
  console.log('='.repeat(50));

  // 1. Check current articles
  console.log('\n1️⃣ Current News Articles:');
  try {
    const { data: articles, count } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false })
      .limit(10);
    
    console.log(`✅ Found ${count} total articles`);
    console.log(`📰 Latest ${articles.length} articles:`);
    
    articles.forEach((article, i) => {
      console.log(`\n${i + 1}. ${article.title}`);
      console.log(`   Published: ${new Date(article.published_at).toLocaleString()}`);
      console.log(`   Source: ${article.source}`);
      console.log(`   Sentiment: ${article.sentiment_score || 'N/A'}`);
    });
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // 2. Insert a test article for iOS
  console.log('\n\n2️⃣ Inserting iOS Test Article:');
  const testArticle = {
    article_id: randomUUID(),
    title: 'Apple Announces Revolutionary AI Features for iOS 19',
    content: 'Apple unveiled groundbreaking AI capabilities that will transform how users interact with their devices. The new features include advanced natural language processing and real-time market analysis.',
    url: 'https://example.com/apple-ai-ios',
    source: 'TechCrunch',
    published_at: new Date().toISOString(),
    sentiment_score: 0.85,
    entities: JSON.stringify(['Apple', 'iOS', 'AI']),
    relevance_score: 0.9
  };

  let insertedId = null;
  try {
    const { data, error } = await supabase
      .from('news_articles')
      .insert([testArticle])
      .select();
    
    if (error) {
      console.log('❌ Failed to insert:', error.message);
    } else {
      insertedId = data[0].article_id;
      console.log('✅ Test article inserted successfully');
      console.log(`   ID: ${insertedId}`);
      console.log(`   Title: ${data[0].title}`);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // 3. Test real-time subscription
  console.log('\n\n3️⃣ Testing Real-time Subscription:');
  const channel = supabase
    .channel('ios-news-updates')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'news_articles' },
      (payload) => {
        console.log('📨 Real-time event:', payload.eventType);
        if (payload.new) {
          console.log('   New article:', payload.new.title);
        }
      }
    )
    .subscribe((status) => {
      console.log(`✅ Subscription status: ${status}`);
    });

  // Wait for subscription to establish
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. Insert another article to test real-time
  console.log('\n\n4️⃣ Testing Real-time Updates:');
  const realtimeTestArticle = {
    article_id: randomUUID(),
    title: 'BREAKING: Federal Reserve Announces Rate Decision',
    content: 'The Federal Reserve has announced its latest interest rate decision, impacting markets globally.',
    url: 'https://example.com/fed-decision',
    source: 'Reuters',
    published_at: new Date().toISOString(),
    sentiment_score: -0.2,
    entities: JSON.stringify(['Federal Reserve', 'Interest Rates']),
    relevance_score: 0.95
  };

  try {
    const { data, error } = await supabase
      .from('news_articles')
      .insert([realtimeTestArticle])
      .select();
    
    if (error) {
      console.log('❌ Failed to insert real-time test:', error.message);
    } else {
      console.log('✅ Real-time test article inserted');
      
      // Clean up after 3 seconds
      setTimeout(async () => {
        console.log('\n\n🧹 Cleaning up test articles...');
        
        const articlesToDelete = [insertedId, data[0].article_id].filter(id => id);
        
        for (const id of articlesToDelete) {
          const { error: deleteError } = await supabase
            .from('news_articles')
            .delete()
            .eq('article_id', id);
          
          if (!deleteError) {
            console.log(`✅ Deleted test article: ${id}`);
          }
        }
        
        channel.unsubscribe();
        console.log('\n✅ iOS News Feed test complete!');
        console.log('\n📱 The iOS app should now be able to:');
        console.log('   - Fetch news articles using getNewsArticles()');
        console.log('   - Subscribe to real-time updates');
        console.log('   - Display articles with title, source, and sentiment');
        process.exit(0);
      }, 3000);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
    process.exit(1);
  }
}

testIOSNewsFeed().catch(console.error);