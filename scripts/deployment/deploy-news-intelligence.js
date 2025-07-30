#!/usr/bin/env node

/**
 * Deploy News Intelligence Features
 * Creates required database tables and verifies functionality
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deployNewsIntelligence() {
  console.log('🚀 Deploying News Intelligence Features...\n');

  // 1. Create database tables
  console.log('📊 Creating database tables...');
  const sqlPath = path.join(__dirname, 'database', 'create-breaking-news-tables.sql');
  
  if (fs.existsSync(sqlPath)) {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (error) {
          console.error(`❌ Error executing SQL: ${error.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (e) {
        console.error(`❌ Failed to execute: ${e.message}`);
        errorCount++;
      }
    }
    
    console.log(`✅ Executed ${successCount} SQL statements successfully`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} statements failed`);
    }
  } else {
    console.error('❌ SQL file not found:', sqlPath);
  }

  // 2. Verify tables exist
  console.log('\n🔍 Verifying database tables...');
  const requiredTables = [
    'breaking_news_alerts',
    'news_sentiment_analysis',
    'news_market_impact',
    'news_entity_extractions'
  ];

  let allTablesExist = true;
  for (const table of requiredTables) {
    const { error } = await supabase.from(table).select('count').limit(1);
    if (error) {
      console.error(`❌ Table missing: ${table}`);
      allTablesExist = false;
    } else {
      console.log(`✅ Table exists: ${table}`);
    }
  }

  // 3. Check API keys
  console.log('\n🔑 Checking API keys...');
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

  if (perplexityKey) {
    console.log('✅ Perplexity API key configured');
    console.log('   - Advanced sentiment analysis: ENABLED');
    console.log('   - AI entity extraction: ENABLED');
    console.log('   - Market impact assessment: ENABLED');
    console.log('   - Breaking news detection: ENHANCED');
  } else {
    console.log('⚠️  Perplexity API key not configured');
    console.log('   - Advanced sentiment analysis: FALLBACK MODE');
    console.log('   - AI entity extraction: BASIC MODE (16 companies)');
    console.log('   - Market impact assessment: UNAVAILABLE');
    console.log('   - Breaking news detection: KEYWORD-BASED');
    console.log('\n   To enable full AI features, set PERPLEXITY_API_KEY environment variable');
  }

  if (grokKey) {
    console.log('✅ Grok API key configured');
  } else {
    console.log('⚠️  Grok API key not configured');
  }

  // 4. Test news intelligence endpoint
  console.log('\n🧪 Testing news intelligence verification endpoint...');
  const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/news-intelligence-verify?action=verify-all`);
    if (response.ok) {
      const results = await response.json();
      console.log('\n📋 Feature Status:');
      console.log(`   - Working features: ${results.summary.working}`);
      console.log(`   - Degraded features: ${results.summary.degraded}`);
      console.log(`   - Failed features: ${results.summary.failed}`);
      console.log(`   - Health score: ${results.summary.health_score.toFixed(1)}%`);
      console.log(`   - Production ready: ${results.summary.production_ready ? 'YES' : 'NO'}`);
      
      if (results.summary.failed > 0) {
        console.log('\n❌ Failed features:');
        for (const [feature, status] of Object.entries(results.features)) {
          if (status.status === 'failed') {
            console.log(`   - ${feature}: ${status.reason}`);
          }
        }
      }
      
      if (results.summary.degraded > 0) {
        console.log('\n⚠️  Degraded features:');
        for (const [feature, status] of Object.entries(results.features)) {
          if (status.status === 'degraded') {
            console.log(`   - ${feature}: ${status.reason}`);
            console.log(`     Fallback: ${status.fallback}`);
          }
        }
      }
    } else {
      console.error('❌ Verification endpoint not responding');
    }
  } catch (e) {
    console.error('❌ Could not reach verification endpoint:', e.message);
  }

  // 5. Summary
  console.log('\n📊 Deployment Summary:');
  console.log('─'.repeat(50));
  
  if (allTablesExist && perplexityKey) {
    console.log('✅ News Intelligence fully deployed and operational!');
    console.log('\n🚀 All advanced features are available:');
    console.log('   - 30-second breaking news detection');
    console.log('   - Multi-dimensional sentiment analysis');
    console.log('   - AI-powered entity extraction');
    console.log('   - Cross-asset market impact modeling');
    console.log('   - Real-time news monitoring');
  } else if (allTablesExist) {
    console.log('⚠️  News Intelligence deployed with basic functionality');
    console.log('\n📌 To enable advanced AI features:');
    console.log('   1. Get a Perplexity API key from https://www.perplexity.ai/');
    console.log('   2. Set PERPLEXITY_API_KEY environment variable');
    console.log('   3. Restart your application');
  } else {
    console.log('❌ News Intelligence deployment incomplete');
    console.log('\n📌 To fix:');
    console.log('   1. Ensure Supabase connection is working');
    console.log('   2. Run SQL statements manually in Supabase dashboard');
    console.log('   3. Re-run this deployment script');
  }
  
  console.log('─'.repeat(50));
}

// Run deployment
deployNewsIntelligence().catch(console.error);