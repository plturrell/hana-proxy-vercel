#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNewsSchema() {
  console.log('🔍 Checking News Articles Table Schema');
  console.log('='.repeat(50));

  // Get table info using raw SQL query through Supabase
  try {
    // First, let's see what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%news%');
    
    if (tablesError) {
      console.log('Error fetching tables:', tablesError.message);
    } else {
      console.log('\n📋 News-related tables:');
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    }
  } catch (err) {
    console.log('Note: Direct schema query not available');
  }

  // Try to get a sample article to see its structure
  console.log('\n📰 Sample article structure:');
  try {
    const { data: articles, error } = await supabase
      .from('news_articles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else if (articles && articles.length > 0) {
      console.log('✅ Article columns:');
      Object.keys(articles[0]).forEach(key => {
        const value = articles[0][key];
        const type = value === null ? 'null' : typeof value;
        console.log(`   - ${key}: ${type}`);
      });
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test minimal article insertion
  console.log('\n\n📝 Testing minimal article insertion:');
  const minimalArticle = {
    article_id: `test-minimal-${Date.now()}`,
    title: 'Minimal Test Article',
    source: 'Test',
    url: 'https://example.com/test',
    published_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('news_articles')
      .insert([minimalArticle])
      .select();
    
    if (error) {
      console.log('❌ Failed:', error.message);
      console.log('   Details:', error.details);
    } else {
      console.log('✅ Success! Article inserted:', data[0].article_id);
      
      // Clean up
      await supabase
        .from('news_articles')
        .delete()
        .eq('article_id', minimalArticle.article_id);
      console.log('🧹 Cleaned up test article');
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkNewsSchema();