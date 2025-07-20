#!/usr/bin/env node
/**
 * Simple A2A Registry Cleanup using direct database access
 */

import dotenv from 'dotenv';
import pkg from 'pg';

const { Client } = pkg;

// Load environment variables
dotenv.config();

// Database connection using raw PostgreSQL client
const connectionString = `postgresql://postgres.fnsbxaywhsxqppncqksu:${process.env.SUPABASE_DB_PASSWORD || 'your-db-password'}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;

const TRUE_A2A_AGENTS = [
  'finsight.analytics.regime_detection',
  'finsight.analytics.portfolio_rebalancing', 
  'finsight.analytics.risk_budgeting',
  'finsight.analytics.risk_parity',
  'finsight.analytics.copula_modeling',
  'finsight.analytics.garch_volatility',
  'finsight.analytics.stress_testing',
  'finsight.analytics.performance_attribution',
  'finsight.analytics.portfolio_optimization'
];

async function simpleCleanup() {
  console.log('🧹 SIMPLE A2A REGISTRY CLEANUP');
  console.log('='.repeat(50));
  
  // Since we can't connect directly to Supabase, let's create a script
  // that generates the exact SQL commands to run manually
  
  console.log('\n📋 STEP 1: Backup current registry');
  console.log('Run this SQL in Supabase Dashboard:');
  console.log('-'.repeat(30));
  console.log(`CREATE TABLE a2a_agents_backup_${Date.now()} AS SELECT * FROM a2a_agents;`);
  
  console.log('\n📋 STEP 2: Count current registrations');
  console.log('Run this SQL to see current state:');
  console.log('-'.repeat(30));
  console.log(`
SELECT 
  'Total registrations' as description,
  COUNT(*) as count
FROM a2a_agents
UNION ALL
SELECT 
  'True autonomous agents' as description,
  COUNT(*) as count
FROM a2a_agents 
WHERE agent_id IN (
  ${TRUE_A2A_AGENTS.map(id => `'${id}'`).join(',\n  ')}
)
UNION ALL
SELECT 
  'Functions to remove' as description,
  COUNT(*) as count
FROM a2a_agents 
WHERE agent_id NOT IN (
  ${TRUE_A2A_AGENTS.map(id => `'${id}'`).join(',\n  ')}
);`);

  console.log('\n📋 STEP 3: Execute cleanup');
  console.log('Run this SQL to remove functions from A2A registry:');
  console.log('-'.repeat(30));
  console.log(`
DELETE FROM a2a_agents 
WHERE agent_id NOT IN (
  ${TRUE_A2A_AGENTS.map(id => `'${id}'`).join(',\n  ')}
);`);

  console.log('\n📋 STEP 4: Verify cleanup');
  console.log('Run this SQL to verify results:');
  console.log('-'.repeat(30));
  console.log(`
-- Should show exactly 9 agents
SELECT COUNT(*) as remaining_agents FROM a2a_agents;

-- List remaining agents
SELECT agent_id, agent_name, description 
FROM a2a_agents 
ORDER BY agent_id;

-- Verify no functions remain
SELECT 
  CASE 
    WHEN COUNT(*) = 9 THEN 'SUCCESS: Exactly 9 agents preserved'
    WHEN COUNT(*) < 9 THEN 'ERROR: Missing autonomous agents'
    WHEN COUNT(*) > 9 THEN 'WARNING: Extra agents remain'
  END as cleanup_status,
  COUNT(*) as agent_count
FROM a2a_agents;`);

  console.log('\n🎯 MANUAL EXECUTION REQUIRED');
  console.log('Please execute the above SQL commands in Supabase Dashboard:');
  console.log('URL: https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new');
  
  console.log('\n✅ The 9 autonomous agents to preserve:');
  TRUE_A2A_AGENTS.forEach((agentId, index) => {
    console.log(`   ${index + 1}. ${agentId}`);
  });
  
  console.log('\n🔐 Expected result:');
  console.log('✅ A2A registry: 9 true autonomous agents');
  console.log('✅ Functions: Available via ORD/function registry');
  console.log('✅ Clear separation: Agents vs Functions');
}

simpleCleanup();