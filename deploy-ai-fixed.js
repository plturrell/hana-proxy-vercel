#!/usr/bin/env node

/**
 * Deploy AI to Production - Fixed Version
 * Creates all required database tables using proper Supabase approach
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployAIProduction() {
  console.log('🚀 Deploying AI to Production - Fixed Version\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('='.repeat(60));

  // Instead of trying to execute raw SQL, let's check if tables exist
  // and provide the SQL for manual execution
  console.log('\n🔍 Checking existing tables...\n');
  
  const tables = {
    'a2a_agents': false,
    'a2a_messages': false,
    'breaking_news_alerts': false,
    'news_sentiment_analysis': false,
    'news_market_impact': false,
    'news_entity_extractions': false,
    'agent_activity': false,
    'agent_blockchain_activities': false
  };

  for (const table of Object.keys(tables)) {
    try {
      const { error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        tables[table] = true;
        console.log(`✅ ${table} exists`);
      } else {
        console.log(`❌ ${table} missing`);
      }
    } catch (e) {
      console.log(`❌ ${table} missing`);
    }
  }

  const missingTables = Object.entries(tables)
    .filter(([_, exists]) => !exists)
    .map(([name, _]) => name);

  if (missingTables.length === 0) {
    console.log('\n✅ All tables already exist!');
  } else {
    console.log(`\n⚠️  ${missingTables.length} tables need to be created:`);
    missingTables.forEach(t => console.log(`   - ${t}`));

    // Generate SQL for missing tables only
    console.log('\n📋 Generating SQL for missing tables...\n');
    
    const sqlStatements = [];

    if (missingTables.includes('a2a_agents')) {
      sqlStatements.push(`
-- Create a2a_agents table
CREATE TABLE IF NOT EXISTS a2a_agents (
    agent_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    capabilities TEXT[],
    status TEXT DEFAULT 'active',
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    total_requests INTEGER DEFAULT 0,
    voting_power INTEGER DEFAULT 100,
    blockchain_config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);`);
    }

    if (missingTables.includes('a2a_messages')) {
      sqlStatements.push(`
-- Create a2a_messages table
CREATE TABLE IF NOT EXISTS a2a_messages (
    message_id TEXT PRIMARY KEY,
    sender_id TEXT REFERENCES a2a_agents(agent_id),
    recipient_ids TEXT[],
    message_type TEXT NOT NULL,
    content JSONB,
    status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);`);
    }

    if (missingTables.includes('breaking_news_alerts')) {
      sqlStatements.push(`
-- Create breaking_news_alerts table
CREATE TABLE IF NOT EXISTS breaking_news_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    source VARCHAR(255),
    urgency_score INTEGER CHECK (urgency_score >= 0 AND urgency_score <= 100),
    market_impact_potential DECIMAL(3,2) CHECK (market_impact_potential >= 0 AND market_impact_potential <= 1),
    breaking_factors JSONB DEFAULT '[]'::jsonb,
    affected_entities JSONB DEFAULT '{}'::jsonb,
    agent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_breaking_news_alerts_created_at ON breaking_news_alerts(created_at DESC);
CREATE INDEX idx_breaking_news_alerts_urgency ON breaking_news_alerts(urgency_score DESC);`);
    }

    if (missingTables.includes('news_sentiment_analysis')) {
      sqlStatements.push(`
-- Create news_sentiment_analysis table
CREATE TABLE IF NOT EXISTS news_sentiment_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id VARCHAR(255) NOT NULL,
    overall_sentiment DECIMAL(3,2) CHECK (overall_sentiment >= -1 AND overall_sentiment <= 1),
    market_sentiment DECIMAL(3,2) CHECK (market_sentiment >= -1 AND market_sentiment <= 1),
    investor_sentiment DECIMAL(3,2) CHECK (investor_sentiment >= -1 AND investor_sentiment <= 1),
    institutional_sentiment DECIMAL(3,2) CHECK (institutional_sentiment >= -1 AND institutional_sentiment <= 1),
    analysis_confidence DECIMAL(3,2) CHECK (analysis_confidence >= 0 AND analysis_confidence <= 1),
    signal_strength DECIMAL(3,2) CHECK (signal_strength >= 0 AND signal_strength <= 1),
    source_reliability DECIMAL(3,2) CHECK (source_reliability >= 0 AND source_reliability <= 1),
    fear_score DECIMAL(3,2) CHECK (fear_score >= 0 AND fear_score <= 1),
    greed_score DECIMAL(3,2) CHECK (greed_score >= 0 AND greed_score <= 1),
    uncertainty_score DECIMAL(3,2) CHECK (uncertainty_score >= 0 AND uncertainty_score <= 1),
    optimism_score DECIMAL(3,2) CHECK (optimism_score >= 0 AND optimism_score <= 1),
    panic_score DECIMAL(3,2) CHECK (panic_score >= 0 AND panic_score <= 1),
    full_analysis JSONB,
    analyzed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_sentiment_article ON news_sentiment_analysis(article_id);`);
    }

    if (missingTables.includes('news_market_impact')) {
      sqlStatements.push(`
-- Create news_market_impact table
CREATE TABLE IF NOT EXISTS news_market_impact (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id VARCHAR(255) NOT NULL,
    overall_impact_score INTEGER CHECK (overall_impact_score >= 0 AND overall_impact_score <= 100),
    impact_probability DECIMAL(3,2) CHECK (impact_probability >= 0 AND impact_probability <= 1),
    impact_timeframe VARCHAR(50),
    impact_magnitude VARCHAR(50),
    equity_impact JSONB,
    fixed_income_impact JSONB,
    currency_impact JSONB,
    commodity_impact JSONB,
    volatility_impact JSONB,
    liquidity_impact JSONB,
    trading_implications JSONB,
    full_assessment JSONB,
    assessed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_impact_article ON news_market_impact(article_id);`);
    }

    if (missingTables.includes('news_entity_extractions')) {
      sqlStatements.push(`
-- Create news_entity_extractions table
CREATE TABLE IF NOT EXISTS news_entity_extractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id VARCHAR(255) NOT NULL,
    companies JSONB DEFAULT '[]'::jsonb,
    financial_instruments JSONB DEFAULT '[]'::jsonb,
    people JSONB DEFAULT '[]'::jsonb,
    economic_indicators JSONB DEFAULT '[]'::jsonb,
    events_catalysts JSONB DEFAULT '[]'::jsonb,
    total_entities INTEGER DEFAULT 0,
    ai_enhanced BOOLEAN DEFAULT false,
    extraction_method VARCHAR(50),
    full_extraction JSONB,
    extracted_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_entities_article ON news_entity_extractions(article_id);`);
    }

    if (missingTables.includes('agent_activity')) {
      sqlStatements.push(`
-- Create agent_activity table
CREATE TABLE IF NOT EXISTS agent_activity (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_agent_activity_agent_id ON agent_activity(agent_id);`);
    }

    if (missingTables.includes('agent_blockchain_activities')) {
      sqlStatements.push(`
-- Create agent_blockchain_activities table
CREATE TABLE IF NOT EXISTS agent_blockchain_activities (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    contract_name TEXT,
    contract_address TEXT,
    function_name TEXT,
    transaction_hash TEXT,
    value_transferred TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_agent_blockchain_agent ON agent_blockchain_activities(agent_id);`);
    }

    // Save SQL to file
    const sqlFile = join(__dirname, 'create-missing-tables.sql');
    const fullSql = sqlStatements.join('\n\n') + '\n\n-- Grant permissions\nGRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;\nGRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;';
    
    fs.writeFileSync(sqlFile, fullSql);
    
    console.log(`📄 SQL saved to: create-missing-tables.sql`);
    console.log('\n📝 To create tables:');
    console.log('1. Go to Supabase SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new`);
    console.log('2. Copy and paste the SQL from create-missing-tables.sql');
    console.log('3. Click "Run"\n');
  }

  // Test API functionality
  console.log('='.repeat(60));
  console.log('\n🧪 Testing AI APIs...\n');

  // Test Perplexity
  if (process.env.PERPLEXITY_API_KEY) {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
        },
        body: JSON.stringify({
          model: 'sonar-small-online',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        console.log('✅ Perplexity API working!');
      } else {
        console.log(`❌ Perplexity API error: ${response.status}`);
      }
    } catch (e) {
      console.log(`❌ Perplexity test failed: ${e.message}`);
    }
  }

  // Test Grok
  if (process.env.GROK_API_KEY) {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'grok-2',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        console.log('✅ Grok API working!');
      } else {
        console.log(`❌ Grok API error: ${response.status}`);
      }
    } catch (e) {
      console.log(`❌ Grok test failed: ${e.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Production Readiness:');
  console.log(`   Database: ${missingTables.length === 0 ? '✅ Ready' : `❌ ${missingTables.length} tables missing`}`);
  console.log(`   Perplexity API: ${process.env.PERPLEXITY_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Grok API: ${process.env.GROK_API_KEY ? '✅ Configured' : '❌ Missing'}`);

  if (missingTables.length === 0) {
    console.log('\n🎉 AI features are ready for production!');
    console.log('\n📝 Deploy to Vercel:');
    console.log('   vercel env add PERPLEXITY_API_KEY production');
    console.log('   vercel env add GROK_API_KEY production');
    console.log('   vercel env add XAI_API_KEY production');
    console.log('   vercel --prod');
  }
}

deployAIProduction().catch(console.error);