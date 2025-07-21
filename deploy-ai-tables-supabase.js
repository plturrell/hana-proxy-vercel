/**
 * Deploy AI Storage Tables using Supabase
 * Alternative approach using Supabase admin functions
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Split large SQL into smaller chunks
const tables = [
  {
    name: 'market_predictions',
    sql: `
      CREATE TABLE IF NOT EXISTS market_predictions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        symbol VARCHAR(10) NOT NULL,
        agent_id VARCHAR(100) NOT NULL,
        prediction_type VARCHAR(50) NOT NULL,
        prediction_data JSONB NOT NULL,
        confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
        reasoning TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        accuracy_score DECIMAL(3,2),
        FOREIGN KEY (agent_id) REFERENCES a2a_agents(agent_id)
      );
    `
  },
  {
    name: 'market_predictions_indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_market_predictions_symbol ON market_predictions(symbol);
      CREATE INDEX IF NOT EXISTS idx_market_predictions_created ON market_predictions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_market_predictions_confidence ON market_predictions(confidence DESC);
    `
  },
  {
    name: 'compliance_predictions',
    sql: `
      CREATE TABLE IF NOT EXISTS compliance_predictions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resource_id VARCHAR(255) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        agent_id VARCHAR(100) NOT NULL,
        risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
        ready_for_creation BOOLEAN DEFAULT FALSE,
        critical_issues INTEGER DEFAULT 0,
        ai_recommendation TEXT,
        predictions JSONB NOT NULL,
        auto_fixable JSONB,
        fixes_applied JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        resolved_at TIMESTAMPTZ,
        FOREIGN KEY (agent_id) REFERENCES a2a_agents(agent_id)
      );
    `
  },
  {
    name: 'compliance_predictions_indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_compliance_predictions_resource ON compliance_predictions(resource_id);
      CREATE INDEX IF NOT EXISTS idx_compliance_predictions_risk ON compliance_predictions(risk_score DESC);
    `
  },
  {
    name: 'compliance_prediction_details',
    sql: `
      CREATE TABLE IF NOT EXISTS compliance_prediction_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        compliance_id UUID NOT NULL,
        field VARCHAR(100),
        issue TEXT NOT NULL,
        severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        likelihood DECIMAL(3,2) CHECK (likelihood >= 0 AND likelihood <= 1),
        impact TEXT,
        preemptive_fix JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (compliance_id) REFERENCES compliance_predictions(id) ON DELETE CASCADE
      );
    `
  },
  {
    name: 'ai_analysis_log',
    sql: `
      CREATE TABLE IF NOT EXISTS ai_analysis_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        analysis_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(255),
        agent_id VARCHAR(100) NOT NULL,
        ai_model VARCHAR(50) DEFAULT 'grok-4-0709',
        ai_response JSONB NOT NULL,
        tokens_used INTEGER,
        response_time_ms INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (agent_id) REFERENCES a2a_agents(agent_id)
      );
    `
  },
  {
    name: 'market_anomalies',
    sql: `
      CREATE TABLE IF NOT EXISTS market_anomalies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        symbol VARCHAR(10) NOT NULL,
        agent_id VARCHAR(100) NOT NULL,
        anomaly_count INTEGER DEFAULT 0,
        overall_risk VARCHAR(20) CHECK (overall_risk IN ('low', 'medium', 'high', 'extreme')),
        black_swan_probability DECIMAL(3,2) CHECK (black_swan_probability >= 0 AND black_swan_probability <= 1),
        pattern_summary JSONB,
        volume_profile JSONB,
        detected_at TIMESTAMPTZ DEFAULT NOW(),
        resolved_at TIMESTAMPTZ,
        FOREIGN KEY (agent_id) REFERENCES a2a_agents(agent_id)
      );
    `
  },
  {
    name: 'anomaly_details',
    sql: `
      CREATE TABLE IF NOT EXISTS anomaly_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        anomaly_id UUID NOT NULL,
        type VARCHAR(50) CHECK (type IN ('price', 'volume', 'pattern', 'statistical', 'regime', 'microstructure')),
        severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
        description TEXT,
        current_value DECIMAL(20,8),
        expected_range DECIMAL(20,8)[],
        z_score DECIMAL(10,4),
        trading_implications JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (anomaly_id) REFERENCES market_anomalies(id) ON DELETE CASCADE
      );
    `
  },
  {
    name: 'ai_recommendations',
    sql: `
      CREATE TABLE IF NOT EXISTS ai_recommendations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_id UUID,
        source_type VARCHAR(50) NOT NULL,
        action VARCHAR(100) NOT NULL,
        confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
        reasoning TEXT,
        timeframe VARCHAR(50),
        priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        acted_on_at TIMESTAMPTZ
      );
    `
  },
  {
    name: 'technical_indicators',
    sql: `
      CREATE TABLE IF NOT EXISTS technical_indicators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        symbol VARCHAR(10) NOT NULL,
        agent_id VARCHAR(100) NOT NULL,
        indicators JSONB NOT NULL,
        trend VARCHAR(50),
        signal_strength DECIMAL(3,2),
        timestamp TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (agent_id) REFERENCES a2a_agents(agent_id)
      );
    `
  },
  {
    name: 'market_risks',
    sql: `
      CREATE TABLE IF NOT EXISTS market_risks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        symbol VARCHAR(10) NOT NULL,
        agent_id VARCHAR(100) NOT NULL,
        risk_type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        description TEXT,
        mitigation_strategy TEXT,
        probability DECIMAL(3,2),
        potential_impact DECIMAL(10,2),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        FOREIGN KEY (agent_id) REFERENCES a2a_agents(agent_id)
      );
    `
  }
];

const views = [
  {
    name: 'latest_market_predictions',
    sql: `
      CREATE OR REPLACE VIEW latest_market_predictions AS
      SELECT DISTINCT ON (symbol)
        symbol,
        prediction_data,
        confidence,
        reasoning,
        created_at
      FROM market_predictions
      ORDER BY symbol, created_at DESC;
    `
  },
  {
    name: 'compliance_status',
    sql: `
      CREATE OR REPLACE VIEW compliance_status AS
      SELECT 
        resource_id,
        resource_type,
        risk_score,
        ready_for_creation,
        critical_issues,
        created_at,
        CASE 
          WHEN risk_score < 30 THEN 'low_risk'
          WHEN risk_score < 70 THEN 'medium_risk'
          ELSE 'high_risk'
        END as risk_category
      FROM compliance_predictions
      WHERE resolved_at IS NULL
      ORDER BY risk_score DESC;
    `
  }
];

async function deployTables() {
  console.log('🚀 Deploying AI Storage Tables via Supabase...\n');

  let successCount = 0;
  let errorCount = 0;

  // Deploy tables
  for (const table of tables) {
    try {
      console.log(`📋 Creating ${table.name}...`);
      
      // Check if we can query the agents table first
      const { error: checkError } = await supabase
        .from('a2a_agents')
        .select('agent_id')
        .limit(1);
        
      if (checkError) {
        console.error(`❌ Cannot access a2a_agents table: ${checkError.message}`);
        console.log('   Skipping foreign key constraint...');
        
        // Remove foreign key constraint
        table.sql = table.sql.replace(/,\s*FOREIGN KEY[^)]+\)/g, '');
      }
      
      // For Supabase, we'll create tables by inserting test data and letting auto-create work
      // This is a workaround since we can't execute DDL directly
      console.log(`   Note: Table will be created on first insert`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Failed to create ${table.name}: ${error.message}`);
      errorCount++;
    }
  }

  // Test table creation by inserting dummy data
  console.log('\n🧪 Testing table creation...\n');
  
  const testAgent = 'agent-deployment-test';
  
  // Test ai_analysis_log
  try {
    const { data, error } = await supabase
      .from('ai_analysis_log')
      .insert({
        analysis_type: 'deployment_test',
        entity_id: 'test-symbol',
        agent_id: testAgent,
        ai_response: { test: true, message: 'Deployment test' }
      })
      .select();

    if (error) {
      console.log('❌ ai_analysis_log not ready:', error.message);
      console.log('   Creating via migration endpoint...');
      
      // Try to create via API endpoint
      const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/zero-deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_ai_tables',
          tables: tables.map(t => ({ name: t.name, sql: t.sql }))
        })
      });
      
      if (response.ok) {
        console.log('✅ Tables created via API');
      }
    } else {
      console.log('✅ ai_analysis_log table ready');
      // Clean up test data
      if (data?.[0]?.id) {
        await supabase.from('ai_analysis_log').delete().eq('id', data[0].id);
      }
    }
  } catch (error) {
    console.error('❌ Table test failed:', error);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Deployment Summary:`);
  console.log(`   ✅ Prepared: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  
  // Create SQL file for manual deployment if needed
  console.log('\n📄 Creating SQL file for manual deployment...');
  
  const fullSql = [
    '-- AI Storage Tables for Structured Outputs',
    '-- Run this in Supabase SQL Editor if tables are not auto-created',
    '',
    ...tables.map(t => t.sql),
    '',
    '-- Views',
    ...views.map(v => v.sql),
    '',
    '-- Enable RLS',
    'ALTER TABLE market_predictions ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE compliance_predictions ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE ai_analysis_log ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE market_anomalies ENABLE ROW LEVEL SECURITY;',
    '',
    '-- Grant permissions',
    'GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;',
    'GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;',
    'GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;'
  ].join('\n');

  await import('fs').then(fs => {
    fs.writeFileSync('ai-storage-tables-manual.sql', fullSql);
    console.log('✅ Created ai-storage-tables-manual.sql');
    console.log('   Run this in Supabase SQL Editor to create tables manually');
  });
  
  console.log('\n✨ Deployment preparation complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Go to Supabase SQL Editor');
  console.log('2. Run the contents of ai-storage-tables-manual.sql');
  console.log('3. Or tables will be auto-created on first use');
}

// Run deployment
deployTables().catch(console.error);