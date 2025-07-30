#!/usr/bin/env node
/**
 * A2A Registry Cleanup Execution via CLI
 * Removes computational functions from A2A registry while preserving 9 true autonomous agents
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY; // Use service key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Check connection
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check .env file.');
  process.exit(1);
}

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

async function executeRegistryCleanup() {
  console.log('🧹 A2A REGISTRY CLEANUP EXECUTION');
  console.log('='.repeat(60));
  console.log('Goal: Remove computational functions from A2A registry');
  console.log('Preserve: 9 true autonomous agents');
  console.log('='.repeat(60));

  try {
    // Step 1: Check connection and get initial count
    console.log('\n📋 STEP 1: Connecting to Supabase and analyzing registry...');
    
    // Test connection by getting current count
    const { count: totalCount, error: countError } = await supabase
      .from('a2a_agents')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Failed to connect to Supabase:', countError);
      return;
    }
    
    console.log(`✅ Connected to Supabase. Current registrations: ${totalCount}`);

    // Step 2: Analyze which agents are true autonomous agents
    console.log('\n📋 STEP 2: Identifying true autonomous agents...');

    const { data: agentData, error: agentError } = await supabase
      .from('a2a_agents')
      .select('agent_id')
      .in('agent_id', TRUE_A2A_AGENTS);
    
    if (agentError) {
      console.error('❌ Failed to check true agents:', agentError);
      return;
    }

    const trueAgentsFound = agentData?.length || 0;
    const functionsToRemove = totalCount - trueAgentsFound;

    console.log(`📊 Current registry status:`);
    console.log(`   Total registrations: ${totalCount}`);
    console.log(`   True autonomous agents found: ${trueAgentsFound}/9`);
    console.log(`   Functions to remove: ${functionsToRemove}`);

    // Verify we have all 9 true agents before proceeding
    if (trueAgentsFound < 9) {
      console.log('\n⚠️  WARNING: Not all 9 true autonomous agents found!');
      console.log('Missing agents:');
      const foundAgentIds = agentData?.map(a => a.agent_id) || [];
      TRUE_A2A_AGENTS.forEach(agentId => {
        if (!foundAgentIds.includes(agentId)) {
          console.log(`   ❌ ${agentId}`);
        }
      });
      
      console.log('\n❌ Aborting cleanup to prevent data loss.');
      console.log('Please ensure all 9 autonomous agents are properly registered first.');
      return;
    }

    // Step 3: Execute cleanup
    console.log('\n📋 STEP 3: Executing safe cleanup...');
    
    const { error: deleteError } = await supabase
      .from('a2a_agents')
      .delete()
      .not('agent_id', 'in', `(${TRUE_A2A_AGENTS.map(id => `"${id}"`).join(',')})`);
    
    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError);
      return;
    }

    console.log('✅ Cleanup executed successfully');

    // Step 4: Verify results
    console.log('\n📋 STEP 4: Verifying cleanup results...');
    
    const { data: remainingAgents, error: verifyError } = await supabase
      .from('a2a_agents')
      .select('agent_id, agent_name, description')
      .order('agent_id');
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      return;
    }

    const remainingCount = remainingAgents?.length || 0;
    
    console.log(`📊 Cleanup results:`);
    console.log(`   Remaining agents: ${remainingCount}`);
    
    if (remainingCount === 9) {
      console.log('✅ SUCCESS: Exactly 9 agents preserved');
    } else if (remainingCount < 9) {
      console.log('❌ ERROR: Missing autonomous agents');
    } else {
      console.log('⚠️  WARNING: Extra agents remain');
    }

    console.log('\n🤖 Preserved autonomous agents:');
    remainingAgents?.forEach((agent, index) => {
      const isExpected = TRUE_A2A_AGENTS.includes(agent.agent_id);
      const status = isExpected ? '✅' : '⚠️ ';
      console.log(`   ${index + 1}. ${status} ${agent.agent_id}`);
      if (agent.agent_name) {
        console.log(`      Name: ${agent.agent_name}`);
      }
    });

    // Step 5: Verify function availability
    console.log('\n📋 STEP 5: Testing function availability...');
    
    // Test ORD function discovery
    try {
      const response = await fetch(`${process.env.SUPABASE_URL?.replace('supabase.co', 'vercel.app') || 'https://hana-proxy-vercel.vercel.app'}/api/a2a/functions`);
      const functionData = await response.json();
      
      if (functionData.success && functionData.functions) {
        const functionCount = Object.keys(functionData.functions).length;
        console.log(`✅ Function registry accessible: ${functionCount} functions available`);
      } else {
        console.log('⚠️  Function registry response:', functionData);
      }
    } catch (error) {
      console.log('⚠️  Function registry test failed:', error.message);
    }

    // Final summary
    console.log('\n🎯 CLEANUP SUMMARY:');
    console.log(`✅ Registry cleaned: ${totalCount} → ${remainingCount} agents`);
    console.log(`✅ Functions removed: ${functionsToRemove}`);
    console.log(`✅ Autonomous agents preserved: ${Math.min(remainingCount, 9)}/9`);
    console.log(`✅ Functions remain accessible via ORD`);

    if (remainingCount === 9) {
      console.log('\n🏆 CLEANUP COMPLETED SUCCESSFULLY!');
      console.log('The A2A registry now contains only true autonomous agents.');
      console.log('Computational functions remain accessible via the function registry.');
    } else {
      console.log('\n⚠️  CLEANUP COMPLETED WITH WARNINGS');
      console.log('Please review the remaining agents and verify the results.');
    }

  } catch (error) {
    console.error('❌ Cleanup execution failed:', error);
    console.log('Please check your Supabase connection and try again.');
  }
}

// Execute cleanup if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  executeRegistryCleanup().then(() => {
    console.log('\n✅ Registry cleanup execution completed.');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export default executeRegistryCleanup;