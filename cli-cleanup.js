#!/usr/bin/env node
/**
 * CLI-based A2A Registry Cleanup using direct PostgreSQL connection
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;

// Load environment variables
dotenv.config();

// The 9 true autonomous agents that MUST be preserved
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

async function executeCliCleanup() {
  console.log('🧹 CLI A2A REGISTRY CLEANUP');
  console.log('='.repeat(60));
  
  // Database connection string from Supabase dashboard
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://postgres.fnsbxaywhsxqppncqksu:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env file');
    console.log('\nTo get your database URL:');
    console.log('1. Go to: https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/settings/database');
    console.log('2. Copy the "Connection string" under "Connection Pooling"');
    console.log('3. Add to .env file as: DATABASE_URL=your-connection-string');
    return;
  }
  
  const client = new Client({ connectionString });
  
  try {
    // Connect to database
    console.log('\n📋 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Step 1: Create backup
    console.log('\n📋 STEP 1: Creating backup...');
    const backupTable = `a2a_agents_backup_${Date.now()}`;
    await client.query(`CREATE TABLE ${backupTable} AS SELECT * FROM a2a_agents`);
    console.log(`✅ Backup created: ${backupTable}`);
    
    // Step 2: Count current registrations
    console.log('\n📋 STEP 2: Analyzing current registry...');
    
    const totalResult = await client.query('SELECT COUNT(*) FROM a2a_agents');
    const totalCount = parseInt(totalResult.rows[0].count);
    
    const trueAgentsResult = await client.query(
      `SELECT COUNT(*) FROM a2a_agents WHERE agent_id = ANY($1::text[])`,
      [TRUE_A2A_AGENTS]
    );
    const trueAgentsCount = parseInt(trueAgentsResult.rows[0].count);
    
    const functionsToRemove = totalCount - trueAgentsCount;
    
    console.log(`📊 Current registry status:`);
    console.log(`   Total registrations: ${totalCount}`);
    console.log(`   True autonomous agents found: ${trueAgentsCount}/9`);
    console.log(`   Functions to remove: ${functionsToRemove}`);
    
    // Verify we have all 9 true agents
    if (trueAgentsCount < 9) {
      console.log('\n⚠️  WARNING: Not all 9 true autonomous agents found!');
      
      // Find missing agents
      const existingAgentsResult = await client.query(
        `SELECT agent_id FROM a2a_agents WHERE agent_id = ANY($1::text[])`,
        [TRUE_A2A_AGENTS]
      );
      const existingIds = existingAgentsResult.rows.map(r => r.agent_id);
      
      console.log('Missing agents:');
      TRUE_A2A_AGENTS.forEach(agentId => {
        if (!existingIds.includes(agentId)) {
          console.log(`   ❌ ${agentId}`);
        }
      });
      
      if (!process.argv.includes('--force')) {
        console.log('\n❌ Aborting cleanup to prevent data loss.');
        console.log('Use --force flag to proceed anyway.');
        await client.end();
        return;
      }
    }
    
    // Step 3: Execute cleanup
    console.log('\n📋 STEP 3: Executing cleanup...');
    console.log('Removing functions from A2A registry...');
    
    const deleteResult = await client.query(
      `DELETE FROM a2a_agents WHERE agent_id != ALL($1::text[])`,
      [TRUE_A2A_AGENTS]
    );
    
    console.log(`✅ Cleanup executed: ${deleteResult.rowCount} entries removed`);
    
    // Step 4: Verify results
    console.log('\n📋 STEP 4: Verifying cleanup results...');
    
    const remainingResult = await client.query(
      `SELECT agent_id, agent_name, description FROM a2a_agents ORDER BY agent_id`
    );
    
    const remainingCount = remainingResult.rows.length;
    
    console.log(`📊 Final registry state:`);
    console.log(`   Remaining agents: ${remainingCount}`);
    
    if (remainingCount === 9) {
      console.log('✅ SUCCESS: Exactly 9 agents preserved');
    } else if (remainingCount < 9) {
      console.log('❌ ERROR: Missing autonomous agents');
    } else {
      console.log('⚠️  WARNING: Extra agents remain');
    }
    
    console.log('\n🤖 Remaining agents:');
    remainingResult.rows.forEach((agent, index) => {
      const isExpected = TRUE_A2A_AGENTS.includes(agent.agent_id);
      const status = isExpected ? '✅' : '⚠️ ';
      console.log(`   ${index + 1}. ${status} ${agent.agent_id}`);
      if (agent.agent_name) {
        console.log(`      Name: ${agent.agent_name}`);
      }
    });
    
    // Final summary
    console.log('\n🎯 CLEANUP SUMMARY:');
    console.log(`✅ Registry cleaned: ${totalCount} → ${remainingCount} agents`);
    console.log(`✅ Functions removed: ${functionsToRemove}`);
    console.log(`✅ Autonomous agents preserved: ${remainingResult.rows.filter(a => TRUE_A2A_AGENTS.includes(a.agent_id)).length}/9`);
    console.log(`✅ Backup table: ${backupTable}`);
    
    if (remainingCount === 9 && remainingResult.rows.every(a => TRUE_A2A_AGENTS.includes(a.agent_id))) {
      console.log('\n🏆 CLEANUP COMPLETED SUCCESSFULLY!');
      console.log('The A2A registry now contains only true autonomous agents.');
      console.log('Computational functions remain accessible via the function registry.');
    } else {
      console.log('\n⚠️  CLEANUP COMPLETED WITH WARNINGS');
      console.log('Please verify the results manually.');
      
      // Show rollback command
      console.log('\n🔄 To rollback if needed:');
      console.log(`INSERT INTO a2a_agents SELECT * FROM ${backupTable};`);
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    console.log('\nPlease check your database connection and try again.');
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed.');
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  executeCliCleanup().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}