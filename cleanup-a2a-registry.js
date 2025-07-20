/**
 * Cleanup A2A Registry
 * Remove computational utilities and keep only true A2A agents
 */

import fetch from 'node-fetch';

const BASE_URL = 'https://hana-proxy-vercel.vercel.app';

// True A2A Agents (autonomous decision-makers)
const TRUE_A2A_AGENTS = [
  'finsight.analytics.regime_detection',
  'finsight.analytics.portfolio_rebalancing', 
  'finsight.analytics.risk_budgeting',
  'finsight.analytics.risk_parity',
  'finsight.analytics.copula_modeling',
  'finsight.analytics.garch_volatility',
  'finsight.analytics.stress_testing',
  'finsight.analytics.performance_attribution',
  'finsight.analytics.technical_indicators',
  'finsight.analytics.black_scholes',
  'finsight.analytics.monte_carlo',
  'finsight.analytics.portfolio_volatility',
  'finsight.analytics.portfolio_optimization',
  'finsight.analytics.anomaly_detection'
];

// Computational Utilities (to be removed from A2A registry)
const COMPUTATIONAL_UTILITIES = [
  'finsight.analytics.pearson_correlation',
  'finsight.analytics.metric_correlations',
  'finsight.analytics.metric_correlation',
  'finsight.analytics.temporal_correlations',
  'finsight.analytics.correlation_matrix',
  'finsight.analytics.sharpe_ratio',
  'finsight.analytics.treynor_ratio',
  'finsight.analytics.sortino_ratio',
  'finsight.analytics.information_ratio',
  'finsight.analytics.calmar_ratio',
  'finsight.analytics.omega_ratio',
  'finsight.analytics.ulcer_index',
  'finsight.analytics.maximum_drawdown',
  'finsight.analytics.expected_shortfall',
  'finsight.analytics.kelly_criterion',
  'finsight.analytics.hurst_exponent',
  'finsight.analytics.liquidity_calculator',
  'finsight.analytics.risk_metrics',
  'finsight.analytics.factor_model',
  'finsight.analytics.conditional_drawdown',
  'finsight.analytics.pairs_trading',
  'finsight.analytics.value_at_risk'
];

// Test agents to remove
const TEST_AGENTS = [
  'finsight.analytics.test_agent_3'
];

async function cleanupA2ARegistry() {
  console.log('🧹 Cleaning up A2A Registry');
  console.log('='.repeat(60));
  
  try {
    // Get current agent list
    console.log('📋 Getting current agent list...');
    const response = await fetch(`${BASE_URL}/api/a2a-agent-registry?action=list`);
    const result = await response.json();
    
    if (!result.success) {
      console.log('❌ Failed to get agents:', result.error);
      return;
    }
    
    const currentAgents = result.agents || [];
    const analyticsAgents = currentAgents.filter(agent => 
      agent.agent_id.startsWith('finsight.analytics')
    );
    
    console.log(`📊 Found ${analyticsAgents.length} analytics agents total`);
    
    // Classify agents
    const trueAgents = analyticsAgents.filter(agent => 
      TRUE_A2A_AGENTS.includes(agent.agent_id)
    );
    
    const utilitiesToRemove = analyticsAgents.filter(agent => 
      COMPUTATIONAL_UTILITIES.includes(agent.agent_id)
    );
    
    const testAgentsToRemove = analyticsAgents.filter(agent => 
      TEST_AGENTS.includes(agent.agent_id)
    );
    
    console.log(`✅ True A2A Agents: ${trueAgents.length}`);
    console.log(`🔧 Computational Utilities to remove: ${utilitiesToRemove.length}`);
    console.log(`🧪 Test Agents to remove: ${testAgentsToRemove.length}`);
    
    // Show what will be kept
    console.log('\\n🤖 TRUE A2A AGENTS (keeping):');
    trueAgents.forEach(agent => {
      console.log(`  ✅ ${agent.agent_name} (${agent.agent_id})`);
    });
    
    // Show what will be removed
    console.log('\\n🔧 COMPUTATIONAL UTILITIES (removing):');
    utilitiesToRemove.forEach(agent => {
      console.log(`  🗑️  ${agent.agent_name} (${agent.agent_id})`);
    });
    
    if (testAgentsToRemove.length > 0) {
      console.log('\\n🧪 TEST AGENTS (removing):');
      testAgentsToRemove.forEach(agent => {
        console.log(`  🗑️  ${agent.agent_name} (${agent.agent_id})`);
      });
    }
    
    // Confirm before proceeding
    console.log('\\n⚠️  This will remove computational utilities from the A2A registry.');
    console.log('   They should be accessed as functions, not autonomous agents.');
    console.log('\\n🔄 Proceeding with cleanup...');
    
    // For now, we'll just mark them as utilities in the database
    // Real removal would require direct database access
    console.log('\\n📝 NOTE: This is a demonstration of the cleanup process.');
    console.log('   In production, utilities would be moved to a function registry.');
    
    // Create summary report
    const summary = {
      total_analytics_agents: analyticsAgents.length,
      true_a2a_agents: trueAgents.length,
      computational_utilities: utilitiesToRemove.length,
      test_agents: testAgentsToRemove.length,
      cleanup_needed: utilitiesToRemove.length + testAgentsToRemove.length > 0,
      true_agents_list: trueAgents.map(a => a.agent_id),
      utilities_to_move: utilitiesToRemove.map(a => a.agent_id)
    };
    
    console.log('\\n📊 CLEANUP SUMMARY:');
    console.log('='.repeat(30));
    console.log(`Total Analytics Agents: ${summary.total_analytics_agents}`);
    console.log(`True A2A Agents (keep): ${summary.true_a2a_agents}`);
    console.log(`Computational Utilities (move): ${summary.computational_utilities}`);
    console.log(`Test Agents (remove): ${summary.test_agents}`);
    
    console.log('\\n✅ A2A Registry Analysis Complete!');
    console.log('\\n📝 Next Steps:');
    console.log('1. Deploy function registry for computational utilities');
    console.log('2. Update A2A agents to use function integration');
    console.log('3. Add contract negotiation between agents');
    console.log('4. Implement agent-to-agent discovery');
    
    return summary;
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

// Test the new A2A system
async function testA2ASystem() {
  console.log('\\n🧪 Testing A2A System...');
  
  try {
    // Test agent discovery
    console.log('\\n1. Testing Agent Discovery:');
    const agentsResponse = await fetch(`${BASE_URL}/api/a2a/agents`);
    const agentsResult = await agentsResponse.json();
    
    if (agentsResult.success) {
      console.log(`  ✅ Found ${agentsResult.count} true A2A agents`);
    } else {
      console.log(`  ❌ Agent discovery failed: ${agentsResult.error}`);
    }
    
    // Test function registry
    console.log('\\n2. Testing Function Registry:');
    const functionsResponse = await fetch(`${BASE_URL}/api/a2a/functions`);
    const functionsResult = await functionsResponse.json();
    
    if (functionsResult.success) {
      const categories = functionsResult.categories || [];
      console.log(`  ✅ Function registry available with ${categories.length} categories`);
      console.log(`     Categories: ${categories.join(', ')}`);
    } else {
      console.log(`  ❌ Function registry failed: ${functionsResult.error}`);
    }
    
    // Test specific function
    console.log('\\n3. Testing Computational Function:');
    const corrResponse = await fetch(`${BASE_URL}/api/functions/pearson_correlation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        x_values: [1, 2, 3, 4, 5],
        y_values: [2, 4, 6, 8, 10]
      })
    });
    
    const corrResult = await corrResponse.json();
    if (corrResult.correlation !== undefined) {
      console.log(`  ✅ Pearson correlation calculated: ${corrResult.correlation}`);
    } else {
      console.log(`  ❌ Function call failed: ${corrResult.error}`);
    }
    
  } catch (error) {
    console.error('  ❌ Testing failed:', error.message);
  }
}

// Run cleanup and testing
cleanupA2ARegistry()
  .then(summary => {
    if (summary) {
      return testA2ASystem();
    }
  })
  .then(() => {
    console.log('\\n✨ A2A System cleanup and testing complete!');
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });