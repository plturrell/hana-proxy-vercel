#!/usr/bin/env node
/**
 * Automated A2A Registry Cleanup
 * Direct execution using Supabase JavaScript client
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Force use correct keys
const SUPABASE_URL = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NjUxMjMsImV4cCI6MjA1MDU0MTEyM30.xY2FxBZmUgDW4mfKBTQYnJfJGYZeRHHIJhpb9iLXYEE';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk2NTEyMywiZXhwIjoyMDUwNTQxMTIzfQ.Kt9IU_wM7qO0B5cD6gJO8YS3mzgQoXm9vLgJj2hNnJY';

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

async function executeAutomaticCleanup() {
  console.log('🤖 AUTOMATED A2A REGISTRY CLEANUP');
  console.log('='.repeat(60));
  console.log('Starting automatic cleanup process...\n');

  // Try service key first, then anon key
  let supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    }
  });

  try {
    // Step 1: Get current agents using a different approach
    console.log('📋 STEP 1: Fetching current registry...');
    
    // Try direct REST API call
    const response = await fetch(`${SUPABASE_URL}/rest/v1/a2a_agents`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const allAgents = await response.json();
    const totalCount = allAgents.length;

    if (totalCount === 0) {
      console.log('❌ No agents found in registry. Database may be empty.');
      return;
    }

    const trueAgents = allAgents.filter(a => TRUE_A2A_AGENTS.includes(a.agent_id));
    const functionsToRemove = allAgents.filter(a => !TRUE_A2A_AGENTS.includes(a.agent_id));

    console.log(`✅ Found ${totalCount} total registrations`);
    console.log(`   True autonomous agents: ${trueAgents.length}/9`);
    console.log(`   Functions to remove: ${functionsToRemove.length}`);

    if (functionsToRemove.length === 0) {
      console.log('\n✅ Registry is already clean! No cleanup needed.');
      return;
    }

    // Show what will be deleted
    console.log('\n📋 Functions to be removed:');
    functionsToRemove.slice(0, 5).forEach((f, i) => {
      console.log(`   ${i+1}. ${f.agent_id}`);
    });
    if (functionsToRemove.length > 5) {
      console.log(`   ... and ${functionsToRemove.length - 5} more`);
    }

    // Step 2: Save backup
    console.log('\n📋 STEP 2: Creating backup...');
    const fs = await import('fs');
    const backupData = {
      timestamp: new Date().toISOString(),
      total_before: totalCount,
      true_agents: trueAgents,
      removed_functions: functionsToRemove
    };
    const backupFile = `backup_${Date.now()}.json`;
    await fs.promises.writeFile(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup saved: ${backupFile}`);

    // Step 3: Execute deletion
    console.log('\n📋 STEP 3: Executing cleanup...');
    console.log(`Deleting ${functionsToRemove.length} functions...`);

    // Delete all non-agent entries
    const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/a2a_agents`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        agent_id: { not: { in: TRUE_A2A_AGENTS } }
      })
    });

    if (!deleteResponse.ok) {
      // Try alternative deletion method
      console.log('🔄 Trying alternative deletion method...');
      
      let deletedCount = 0;
      for (const func of functionsToRemove) {
        const delResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/a2a_agents?agent_id=eq.${encodeURIComponent(func.agent_id)}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (delResponse.ok) {
          deletedCount++;
          if (deletedCount % 10 === 0) {
            console.log(`   Deleted ${deletedCount}/${functionsToRemove.length}...`);
          }
        }
      }
      console.log(`✅ Deleted ${deletedCount} functions`);
    } else {
      console.log(`✅ Cleanup executed successfully`);
    }

    // Step 4: Verify results
    console.log('\n📋 STEP 4: Verifying results...');
    
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/a2a_agents`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const remainingAgents = await verifyResponse.json();
    const remainingCount = remainingAgents.length;

    console.log(`\n📊 Final state:`);
    console.log(`   Remaining agents: ${remainingCount}`);
    
    if (remainingCount === 9) {
      console.log('   ✅ SUCCESS: Exactly 9 agents preserved');
    } else {
      console.log(`   ⚠️  WARNING: Expected 9 agents, found ${remainingCount}`);
    }

    console.log('\n🤖 Remaining agents:');
    remainingAgents.forEach((agent, i) => {
      const expected = TRUE_A2A_AGENTS.includes(agent.agent_id);
      console.log(`   ${i+1}. ${expected ? '✅' : '❌'} ${agent.agent_id}`);
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 CLEANUP SUMMARY:');
    console.log(`   Registry cleaned: ${totalCount} → ${remainingCount} agents`);
    console.log(`   Functions removed: ${functionsToRemove.length}`);
    console.log(`   Success: ${remainingCount === 9 ? 'YES ✅' : 'PARTIAL ⚠️'}`);
    console.log(`   Backup: ${backupFile}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    console.log('\nDebugging information:');
    console.log('SUPABASE_URL:', SUPABASE_URL);
    console.log('Using service key:', SUPABASE_SERVICE_KEY ? 'Yes' : 'No');
    
    // Provide manual fallback
    console.log('\n📝 Manual cleanup SQL:');
    console.log('-'.repeat(50));
    console.log('DELETE FROM a2a_agents WHERE agent_id NOT IN (');
    TRUE_A2A_AGENTS.forEach(agent => {
      console.log(`  '${agent}',`);
    });
    console.log(');');
  }
}

// Execute immediately
console.log('🚀 Starting automated cleanup...\n');
executeAutomaticCleanup().then(() => {
  console.log('\n✅ Automated cleanup process completed.');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});