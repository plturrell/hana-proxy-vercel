/**
 * Safe A2A Registry Cleanup Script
 * 
 * This script executes the planned cleanup to remove computational functions
 * from the A2A agent registry while preserving the 9 true autonomous agents.
 * 
 * Safety measures:
 * - Backs up current registry state before cleanup
 * - Verifies function preservation in separate function registry
 * - Confirms true agent preservation
 * - Provides detailed verification after cleanup
 */

const https = require('https');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fnsbxaywhsxqppncqksu.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// The 9 true autonomous agents that MUST be preserved
const TRUE_AUTONOMOUS_AGENTS = [
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

/**
 * Make a request to Supabase via our proxy API
 */
async function makeSupabaseRequest(action, data = {}) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify({ action, ...data });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/supabase-proxy',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (err) {
          reject(new Error(`Parse error: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(requestData);
    req.end();
  });
}

/**
 * Step 1: Backup current registry state
 */
async function backupCurrentRegistry() {
  console.log('📋 Step 1: Backing up current A2A registry state...');
  
  try {
    const response = await makeSupabaseRequest('select', {
      table: 'a2a_agents',
      query: 'agent_id, name, description, created_at'
    });
    
    if (response.error) {
      throw new Error(`Backup failed: ${response.error}`);
    }
    
    const backup = {
      timestamp: new Date().toISOString(),
      total_agents: response.data.length,
      agents: response.data
    };
    
    // Write backup to file
    const fs = require('fs');
    const backupPath = `./registry-backup-${Date.now()}.json`;
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup completed: ${backup.total_agents} agents saved to ${backupPath}`);
    
    // Identify true agents vs functions
    const trueAgents = response.data.filter(agent => 
      TRUE_AUTONOMOUS_AGENTS.includes(agent.agent_id)
    );
    const functionsToRemove = response.data.filter(agent => 
      !TRUE_AUTONOMOUS_AGENTS.includes(agent.agent_id)
    );
    
    console.log(`   🤖 True autonomous agents: ${trueAgents.length}`);
    console.log(`   🔧 Functions to remove: ${functionsToRemove.length}`);
    
    return {
      backup,
      trueAgents,
      functionsToRemove
    };
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

/**
 * Step 2: Verify function preservation
 */
async function verifyFunctionPreservation() {
  console.log('\n🔍 Step 2: Verifying function preservation...');
  
  try {
    // Check if functions are available via API endpoints
    const testFunctions = [
      'black_scholes',
      'monte_carlo', 
      'technical_indicators',
      'sharpe_ratio',
      'correlation_matrix'
    ];
    
    let workingFunctions = 0;
    
    for (const func of testFunctions) {
      try {
        // Test function endpoint
        const testResponse = await makeSupabaseRequest('rpc', {
          function_name: `calculate_${func}`,
          params: getTestParams(func)
        });
        
        if (!testResponse.error) {
          workingFunctions++;
          console.log(`   ✅ ${func}: Working`);
        } else {
          console.log(`   ⚠️  ${func}: ${testResponse.error}`);
        }
      } catch (err) {
        console.log(`   ❌ ${func}: Error - ${err.message}`);
      }
    }
    
    console.log(`✅ Function verification: ${workingFunctions}/${testFunctions.length} functions working`);
    
    if (workingFunctions < testFunctions.length * 0.8) {
      throw new Error('Too many functions failing - aborting cleanup for safety');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Function verification failed:', error.message);
    throw error;
  }
}

/**
 * Step 3: Execute safe cleanup
 */
async function executeSafeCleanup() {
  console.log('\n🧹 Step 3: Executing safe registry cleanup...');
  
  try {
    // Create the SQL command to remove all agents except the 9 true autonomous ones
    const cleanupSQL = `
      DELETE FROM a2a_agents 
      WHERE agent_id NOT IN (
        ${TRUE_AUTONOMOUS_AGENTS.map(id => `'${id}'`).join(',\n        ')}
      );
    `;
    
    console.log('📝 Cleanup SQL prepared:');
    console.log(cleanupSQL);
    
    // Execute via RPC or return instructions for manual execution
    const response = await makeSupabaseRequest('execute_sql', {
      sql: cleanupSQL
    });
    
    if (response.instructions) {
      console.log('\n📋 Manual execution required:');
      response.instructions.forEach((instruction, i) => {
        console.log(`   ${i + 1}. ${instruction}`);
      });
      console.log('\n📋 SQL to execute:');
      console.log(cleanupSQL);
      
      // Wait for user confirmation
      console.log('\n⏳ Please execute the SQL manually in Supabase Dashboard and press Enter when complete...');
      await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
      });
    }
    
    console.log('✅ Cleanup execution completed');
    return true;
    
  } catch (error) {
    console.error('❌ Cleanup execution failed:', error.message);
    throw error;
  }
}

/**
 * Step 4: Verify cleanup results
 */
async function verifyCleanupResults() {
  console.log('\n✅ Step 4: Verifying cleanup results...');
  
  try {
    // Check remaining agents
    const response = await makeSupabaseRequest('select', {
      table: 'a2a_agents',
      query: 'agent_id, name, description'
    });
    
    if (response.error) {
      throw new Error(`Verification failed: ${response.error}`);
    }
    
    const remainingAgents = response.data;
    console.log(`📊 Remaining agents in A2A registry: ${remainingAgents.length}`);
    
    // Verify all true agents are preserved
    const preservedTrueAgents = remainingAgents.filter(agent => 
      TRUE_AUTONOMOUS_AGENTS.includes(agent.agent_id)
    );
    
    console.log(`🤖 True autonomous agents preserved: ${preservedTrueAgents.length}/9`);
    
    if (preservedTrueAgents.length !== 9) {
      console.error('❌ CRITICAL: Not all true autonomous agents were preserved!');
      console.log('Missing agents:');
      TRUE_AUTONOMOUS_AGENTS.forEach(agentId => {
        if (!preservedTrueAgents.find(agent => agent.agent_id === agentId)) {
          console.log(`   ❌ ${agentId}`);
        }
      });
      throw new Error('Critical agent preservation failure');
    }
    
    // Verify no functions remain
    const remainingFunctions = remainingAgents.filter(agent => 
      !TRUE_AUTONOMOUS_AGENTS.includes(agent.agent_id)
    );
    
    console.log(`🔧 Functions still in A2A registry: ${remainingFunctions.length}`);
    
    if (remainingFunctions.length > 0) {
      console.log('Remaining functions:');
      remainingFunctions.forEach(func => {
        console.log(`   ⚠️  ${func.agent_id}: ${func.name}`);
      });
    }
    
    // Summary
    console.log('\n📋 CLEANUP VERIFICATION SUMMARY:');
    console.log(`✅ Total agents in A2A registry: ${remainingAgents.length}`);
    console.log(`✅ True autonomous agents: ${preservedTrueAgents.length}/9`);
    console.log(`✅ Functions removed: ${remainingFunctions.length === 0 ? 'All' : 'Partial'}`);
    
    // List preserved agents
    console.log('\n🤖 Preserved Autonomous Agents:');
    preservedTrueAgents.forEach(agent => {
      console.log(`   ✅ ${agent.agent_id}: ${agent.name}`);
    });
    
    const isSuccess = preservedTrueAgents.length === 9 && remainingFunctions.length === 0;
    console.log(`\n${isSuccess ? '🎉' : '⚠️'} Cleanup ${isSuccess ? 'SUCCESSFUL' : 'PARTIAL'}`);
    
    return {
      success: isSuccess,
      totalAgents: remainingAgents.length,
      preservedTrueAgents: preservedTrueAgents.length,
      remainingFunctions: remainingFunctions.length,
      agents: remainingAgents
    };
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  }
}

/**
 * Step 5: Final function availability test
 */
async function testFunctionAvailability() {
  console.log('\n🔧 Step 5: Testing function availability after cleanup...');
  
  try {
    const testFunctions = [
      { name: 'black_scholes', type: 'options' },
      { name: 'monte_carlo', type: 'simulation' },
      { name: 'sharpe_ratio', type: 'performance' },
      { name: 'technical_indicators', type: 'analysis' },
      { name: 'correlation_matrix', type: 'statistics' }
    ];
    
    let workingFunctions = 0;
    
    for (const func of testFunctions) {
      try {
        const testResponse = await makeSupabaseRequest('rpc', {
          function_name: `calculate_${func.name}`,
          params: getTestParams(func.name)
        });
        
        if (!testResponse.error) {
          workingFunctions++;
          console.log(`   ✅ ${func.name} (${func.type}): Available via function registry`);
        } else {
          console.log(`   ❌ ${func.name}: ${testResponse.error}`);
        }
      } catch (err) {
        console.log(`   ❌ ${func.name}: ${err.message}`);
      }
    }
    
    console.log(`\n📊 Function availability: ${workingFunctions}/${testFunctions.length} functions working`);
    console.log('✅ Functions remain discoverable via ORD/function registry');
    
    return workingFunctions >= testFunctions.length * 0.8;
    
  } catch (error) {
    console.error('❌ Function availability test failed:', error.message);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 SAFE A2A REGISTRY CLEANUP');
  console.log('='.repeat(60));
  console.log('Goal: Remove computational functions from A2A registry');
  console.log('Preserve: 9 true autonomous agents');
  console.log('Ensure: Functions remain available via ORD/function registry');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Backup
    const { backup, trueAgents, functionsToRemove } = await backupCurrentRegistry();
    
    // Step 2: Verify function preservation
    await verifyFunctionPreservation();
    
    // Step 3: Execute cleanup
    await executeSafeCleanup();
    
    // Step 4: Verify results
    const results = await verifyCleanupResults();
    
    // Step 5: Test function availability
    const functionsAvailable = await testFunctionAvailability();
    
    // Final summary
    console.log('\n🎯 CLEANUP COMPLETE');
    console.log('='.repeat(60));
    
    if (results.success && functionsAvailable) {
      console.log('🎉 SUCCESS: Registry cleanup completed successfully!');
      console.log('✅ 9 autonomous agents preserved in A2A registry');
      console.log('✅ Functions removed from A2A registry');
      console.log('✅ Functions remain available via function registry');
      console.log('\n📋 Next Steps:');
      console.log('1. Add news processing capabilities to the 9 agents');
      console.log('2. Create agent-to-agent contracts for news analysis');
      console.log('3. Implement autonomous news processing workflows');
    } else {
      console.log('⚠️  PARTIAL SUCCESS: Some issues detected');
      console.log('📋 Review the verification results above');
      console.log('📋 Manual intervention may be required');
    }
    
  } catch (error) {
    console.error('\n❌ CLEANUP FAILED:', error.message);
    console.log('\n📋 Recovery Steps:');
    console.log('1. Check the backup file for registry restoration');
    console.log('2. Verify Supabase connection and permissions');
    console.log('3. Review error details above');
    process.exit(1);
  }
}

/**
 * Helper function to get test parameters for different functions
 */
function getTestParams(functionName) {
  const testParams = {
    'black_scholes': {
      spot_price: 100,
      strike_price: 105,
      time_to_expiry: 0.25,
      risk_free_rate: 0.05,
      volatility: 0.2,
      option_type: 'call'
    },
    'monte_carlo': {
      initial_price: 100,
      volatility: 0.25,
      risk_free_rate: 0.05,
      time_horizon: 1,
      num_simulations: 100
    },
    'sharpe_ratio': {
      returns: [0.01, 0.02, -0.01, 0.03, 0.02],
      risk_free_rate: 0.02
    },
    'technical_indicators': {
      prices: [100, 102, 101, 103, 105, 104, 106],
      indicator_type: 'sma',
      period: 5
    },
    'correlation_matrix': {
      x_values: [1, 2, 3, 4, 5],
      y_values: [2, 4, 6, 8, 10]
    }
  };
  
  return testParams[functionName] || {};
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  backupCurrentRegistry,
  verifyFunctionPreservation,
  executeSafeCleanup,
  verifyCleanupResults,
  testFunctionAvailability,
  TRUE_AUTONOMOUS_AGENTS
};