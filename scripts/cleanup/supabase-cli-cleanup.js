#!/usr/bin/env node
/**
 * Supabase CLI Cleanup using Supabase client
 * Direct cleanup without REST API
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

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

async function executeSupabaseCleanup() {
  console.log('🧹 SUPABASE CLI A2A REGISTRY CLEANUP');
  console.log('='.repeat(60));
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase configuration');
    return;
  }
  
  // Create Supabase client with service role for admin operations
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Step 1: Get current agents
    console.log('\n📋 STEP 1: Analyzing current registry...');
    
    const { data: allAgents, error: fetchError } = await supabase
      .from('a2a_agents')
      .select('agent_id, agent_name');
    
    if (fetchError) {
      console.error('❌ Failed to fetch agents:', fetchError);
      
      // Try with RPC if direct query fails
      console.log('\n🔄 Trying alternative approach...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_agent_count');
      
      if (rpcError) {
        console.error('❌ Alternative approach also failed:', rpcError);
        console.log('\n📝 Please use manual SQL cleanup instead.');
        return;
      }
    }
    
    if (!allAgents) {
      console.error('❌ No agent data retrieved');
      return;
    }
    
    const totalCount = allAgents.length;
    const trueAgents = allAgents.filter(a => TRUE_A2A_AGENTS.includes(a.agent_id));
    const functionsToRemove = allAgents.filter(a => !TRUE_A2A_AGENTS.includes(a.agent_id));
    
    console.log(`📊 Current registry status:`);
    console.log(`   Total registrations: ${totalCount}`);
    console.log(`   True autonomous agents found: ${trueAgents.length}/9`);
    console.log(`   Functions to remove: ${functionsToRemove.length}`);
    
    if (functionsToRemove.length === 0) {
      console.log('\n✅ Registry is already clean! No functions to remove.');
      return;
    }
    
    // Show what will be removed
    console.log('\n📋 Functions to be removed:');
    functionsToRemove.slice(0, 10).forEach((func, i) => {
      console.log(`   ${i + 1}. ${func.agent_id}`);
    });
    if (functionsToRemove.length > 10) {
      console.log(`   ... and ${functionsToRemove.length - 10} more`);
    }
    
    // Step 2: Create backup record
    console.log('\n📋 STEP 2: Recording backup information...');
    const backupInfo = {
      timestamp: new Date().toISOString(),
      total_before: totalCount,
      agents_preserved: trueAgents.length,
      functions_removed: functionsToRemove.length,
      removed_ids: functionsToRemove.map(f => f.agent_id)
    };
    
    // Save backup to file
    const fs = await import('fs');
    const backupFile = `a2a_cleanup_backup_${Date.now()}.json`;
    await fs.promises.writeFile(backupFile, JSON.stringify(backupInfo, null, 2));
    console.log(`✅ Backup saved: ${backupFile}`);
    
    // Step 3: Execute cleanup
    console.log('\n📋 STEP 3: Executing cleanup...');
    console.log('Removing functions in batches...');
    
    let deletedCount = 0;
    const batchSize = 10;
    
    // Delete in batches to avoid timeout
    for (let i = 0; i < functionsToRemove.length; i += batchSize) {
      const batch = functionsToRemove.slice(i, i + batchSize);
      const batchIds = batch.map(f => f.agent_id);
      
      const { error: deleteError } = await supabase
        .from('a2a_agents')
        .delete()
        .in('agent_id', batchIds);
      
      if (deleteError) {
        console.error(`❌ Failed to delete batch ${i/batchSize + 1}:`, deleteError);
      } else {
        deletedCount += batch.length;
        console.log(`   Deleted ${deletedCount}/${functionsToRemove.length} functions...`);
      }
    }
    
    console.log(`✅ Cleanup executed: ${deletedCount} functions removed`);
    
    // Step 4: Verify results
    console.log('\n📋 STEP 4: Verifying cleanup results...');
    
    const { data: remainingAgents, error: verifyError } = await supabase
      .from('a2a_agents')
      .select('agent_id, agent_name')
      .order('agent_id');
    
    if (verifyError) {
      console.error('❌ Failed to verify results:', verifyError);
      return;
    }
    
    const remainingCount = remainingAgents?.length || 0;
    
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
    remainingAgents?.forEach((agent, index) => {
      const isExpected = TRUE_A2A_AGENTS.includes(agent.agent_id);
      const status = isExpected ? '✅' : '⚠️ ';
      console.log(`   ${index + 1}. ${status} ${agent.agent_id}`);
    });
    
    // Final summary
    console.log('\n🎯 CLEANUP SUMMARY:');
    console.log(`✅ Registry cleaned: ${totalCount} → ${remainingCount} agents`);
    console.log(`✅ Functions removed: ${deletedCount}`);
    console.log(`✅ Autonomous agents preserved: ${remainingAgents?.filter(a => TRUE_A2A_AGENTS.includes(a.agent_id)).length || 0}/9`);
    console.log(`✅ Backup saved: ${backupFile}`);
    
    if (remainingCount === 9 && remainingAgents?.every(a => TRUE_A2A_AGENTS.includes(a.agent_id))) {
      console.log('\n🏆 CLEANUP COMPLETED SUCCESSFULLY!');
      console.log('The A2A registry now contains only true autonomous agents.');
      console.log('Computational functions remain accessible via the function registry.');
    } else {
      console.log('\n⚠️  CLEANUP COMPLETED WITH WARNINGS');
      console.log('Please verify the results in Supabase Dashboard.');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    console.log('\nFalling back to manual SQL approach.');
    console.log('Execute the following SQL in Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new');
    console.log('\n' + '-'.repeat(50));
    console.log(`DELETE FROM a2a_agents WHERE agent_id NOT IN (${TRUE_A2A_AGENTS.map(id => `'${id}'`).join(', ')});`);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  executeSupabaseCleanup().then(() => {
    console.log('\n✅ Cleanup process completed.');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}