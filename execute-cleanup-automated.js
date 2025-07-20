#!/usr/bin/env node
/**
 * Automated A2A Registry Cleanup Execution
 * Uses Supabase REST API directly with proper authentication
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

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

async function executeCleanup() {
  console.log('🧹 AUTOMATED A2A REGISTRY CLEANUP');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Get current registry count
    console.log('\n📋 STEP 1: Analyzing current registry...');
    
    const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/a2a_agents?select=agent_id`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });
    
    if (!countResponse.ok) {
      throw new Error(`Failed to get count: ${countResponse.status} ${countResponse.statusText}`);
    }
    
    const agents = await countResponse.json();
    const totalCount = countResponse.headers.get('content-range')?.split('/')[1] || agents.length;
    
    console.log(`✅ Current registrations: ${totalCount}`);
    
    // Step 2: Check which are true agents
    console.log('\n📋 STEP 2: Identifying true autonomous agents...');
    
    const trueAgents = agents.filter(agent => TRUE_A2A_AGENTS.includes(agent.agent_id));
    const functionsToRemove = agents.filter(agent => !TRUE_A2A_AGENTS.includes(agent.agent_id));
    
    console.log(`📊 Registry status:`);
    console.log(`   Total registrations: ${agents.length}`);
    console.log(`   True autonomous agents found: ${trueAgents.length}/9`);
    console.log(`   Functions to remove: ${functionsToRemove.length}`);
    
    // Verify we have all 9 true agents
    if (trueAgents.length < 9) {
      console.log('\n⚠️  WARNING: Not all 9 true autonomous agents found!');
      console.log('Missing agents:');
      const foundIds = trueAgents.map(a => a.agent_id);
      TRUE_A2A_AGENTS.forEach(agentId => {
        if (!foundIds.includes(agentId)) {
          console.log(`   ❌ ${agentId}`);
        }
      });
      
      const proceed = process.argv.includes('--force');
      if (!proceed) {
        console.log('\n❌ Aborting cleanup. Use --force to proceed anyway.');
        return;
      }
    }
    
    // Step 3: Create backup data
    console.log('\n📋 STEP 3: Creating backup data...');
    const backupTimestamp = Date.now();
    const backupData = {
      timestamp: backupTimestamp,
      total_agents: agents.length,
      preserved_agents: trueAgents,
      removed_agents: functionsToRemove
    };
    
    console.log(`✅ Backup data prepared (${agents.length} total agents)`);
    
    // Step 4: Execute cleanup - delete functions
    console.log('\n📋 STEP 4: Executing cleanup...');
    
    let deletedCount = 0;
    
    // Delete each function individually to ensure safety
    for (const func of functionsToRemove) {
      try {
        const deleteResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/a2a_agents?agent_id=eq.${encodeURIComponent(func.agent_id)}`, 
          {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (deleteResponse.ok) {
          deletedCount++;
          if (deletedCount % 10 === 0) {
            console.log(`   Deleted ${deletedCount}/${functionsToRemove.length} functions...`);
          }
        } else {
          console.log(`   ⚠️ Failed to delete: ${func.agent_id}`);
        }
      } catch (error) {
        console.log(`   ❌ Error deleting ${func.agent_id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Cleanup executed: ${deletedCount} functions removed`);
    
    // Step 5: Verify final state
    console.log('\n📋 STEP 5: Verifying final state...');
    
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/a2a_agents?select=agent_id,agent_name`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const remainingAgents = await verifyResponse.json();
    
    console.log(`📊 Final registry state:`);
    console.log(`   Remaining agents: ${remainingAgents.length}`);
    
    if (remainingAgents.length === 9) {
      console.log('✅ SUCCESS: Exactly 9 agents preserved');
    } else if (remainingAgents.length < 9) {
      console.log('❌ ERROR: Missing autonomous agents');
    } else {
      console.log('⚠️  WARNING: Extra agents remain');
    }
    
    console.log('\n🤖 Remaining agents:');
    remainingAgents.forEach((agent, index) => {
      const isExpected = TRUE_A2A_AGENTS.includes(agent.agent_id);
      const status = isExpected ? '✅' : '⚠️ ';
      console.log(`   ${index + 1}. ${status} ${agent.agent_id}`);
    });
    
    // Save backup file
    console.log('\n💾 Saving backup file...');
    const fs = await import('fs');
    const backupFileName = `a2a_cleanup_backup_${backupTimestamp}.json`;
    await fs.promises.writeFile(backupFileName, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup saved: ${backupFileName}`);
    
    // Final summary
    console.log('\n🎯 CLEANUP SUMMARY:');
    console.log(`✅ Registry cleaned: ${totalCount} → ${remainingAgents.length} agents`);
    console.log(`✅ Functions removed: ${deletedCount}`);
    console.log(`✅ Autonomous agents preserved: ${remainingAgents.filter(a => TRUE_A2A_AGENTS.includes(a.agent_id)).length}/9`);
    console.log(`✅ Backup created: ${backupFileName}`);
    
    if (remainingAgents.length === 9 && remainingAgents.every(a => TRUE_A2A_AGENTS.includes(a.agent_id))) {
      console.log('\n🏆 CLEANUP COMPLETED SUCCESSFULLY!');
      console.log('The A2A registry now contains only true autonomous agents.');
    } else {
      console.log('\n⚠️  CLEANUP COMPLETED WITH WARNINGS');
      console.log('Please verify the results manually.');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    console.log('\nFalling back to manual SQL commands...');
    console.log('Please execute these in Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new');
    console.log('\n' + '-'.repeat(50));
    console.log(`DELETE FROM a2a_agents WHERE agent_id NOT IN (${TRUE_A2A_AGENTS.map(id => `'${id}'`).join(', ')});`);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  executeCleanup().then(() => {
    console.log('\n✅ Cleanup process completed.');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}