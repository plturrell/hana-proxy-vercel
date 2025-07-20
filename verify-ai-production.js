#!/usr/bin/env node

/**
 * Verify AI Production Status
 * Checks what's blocking AI features from working
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env') });

console.log('🔍 AI Production Verification\n');
console.log('='.repeat(50));

// 1. Check environment variables
console.log('\n1️⃣ Environment Variables:');
const envVars = {
  'PERPLEXITY_API_KEY': process.env.PERPLEXITY_API_KEY,
  'GROK_API_KEY': process.env.GROK_API_KEY,
  'XAI_API_KEY': process.env.XAI_API_KEY,
  'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
  'SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  'SUPABASE_SERVICE_KEY': process.env.SUPABASE_SERVICE_KEY
};

for (const [key, value] of Object.entries(envVars)) {
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
  }
}

// 2. Test Perplexity API
console.log('\n2️⃣ Testing Perplexity API:');
if (process.env.PERPLEXITY_API_KEY) {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: 'Test: Is this API working?'
          }
        ],
        temperature: 0.2,
        max_tokens: 50
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Perplexity API is working!');
      console.log('   Response:', data.choices[0].message.content.substring(0, 50) + '...');
    } else {
      const error = await response.text();
      console.log(`❌ Perplexity API error: ${response.status} - ${error.substring(0, 100)}`);
    }
  } catch (error) {
    console.log(`❌ Perplexity API connection failed: ${error.message}`);
  }
} else {
  console.log('⚠️  Skipping - No API key');
}

// 3. Test Grok API
console.log('\n3️⃣ Testing Grok/xAI API:');
const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
if (grokKey) {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokKey}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'user',
            content: 'Test: Is this API working?'
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Grok API is working!');
      console.log('   Response:', data.choices[0].message.content.substring(0, 50) + '...');
    } else {
      const error = await response.text();
      console.log(`❌ Grok API error: ${response.status} - ${error.substring(0, 100)}`);
    }
  } catch (error) {
    console.log(`❌ Grok API connection failed: ${error.message}`);
  }
} else {
  console.log('⚠️  Skipping - No API key');
}

// 4. Check Supabase tables
console.log('\n4️⃣ Checking Supabase Database:');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const tablesToCheck = [
    'breaking_news_alerts',
    'news_sentiment_analysis',
    'news_market_impact',
    'news_entity_extractions',
    'a2a_agents',
    'a2a_messages'
  ];

  for (const table of tablesToCheck) {
    try {
      const { error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Exists (${count} rows)`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
} else {
  console.log('❌ Supabase not configured');
}

// 5. Summary and recommendations
console.log('\n' + '='.repeat(50));
console.log('📊 SUMMARY:\n');

const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;
const hasGrok = !!(process.env.GROK_API_KEY || process.env.XAI_API_KEY);
const hasSupabase = !!(supabaseUrl && supabaseKey);

if (hasPerplexity && hasGrok && hasSupabase) {
  console.log('✅ All AI services are configured!');
  console.log('\n🚀 AI Features should be working. If not:');
  console.log('   1. Check if database tables are created (run DEPLOY_NOW.sql)');
  console.log('   2. Verify API endpoints are using the correct keys');
  console.log('   3. Check server logs for any runtime errors');
} else {
  console.log('❌ Missing critical configuration:');
  if (!hasPerplexity) console.log('   - Perplexity API key needed for news intelligence');
  if (!hasGrok) console.log('   - Grok API key needed for AI automation');
  if (!hasSupabase) console.log('   - Supabase configuration needed for data storage');
  
  console.log('\n📝 To fix:');
  console.log('   1. Ensure .env file has all required keys');
  console.log('   2. Restart the server to load environment variables');
  console.log('   3. Deploy database schema if needed');
}

console.log('\n🔗 Test the API directly:');
console.log('   curl http://localhost:3000/api/news-intelligence-verify?action=verify-all');

process.exit(0);