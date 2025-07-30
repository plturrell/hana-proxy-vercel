/**
 * Preserve Functions Before Cleanup
 * Ensure all computational functions are available before removing from A2A registry
 */

import fetch from 'node-fetch';

const BASE_URL = 'https://hana-proxy-vercel.vercel.app';

// Functions we know work (have actual endpoints)
const WORKING_FUNCTIONS = [
  'pearson_correlation',
  'sharpe_ratio', 
  'value_at_risk'
];

// All computational functions currently in A2A registry that need to be preserved
const COMPUTATIONAL_FUNCTIONS_IN_REGISTRY = [
  'finsight.analytics.metric_correlations',
  'finsight.analytics.metric_correlation', 
  'finsight.analytics.pearson_correlation',
  'finsight.analytics.temporal_correlations',
  'finsight.analytics.correlation_matrix',
  'finsight.analytics.conditional_drawdown',
  'finsight.analytics.calmar_ratio',
  'finsight.analytics.omega_ratio', 
  'finsight.analytics.ulcer_index',
  'finsight.analytics.maximum_drawdown',
  'finsight.analytics.sortino_ratio',
  'finsight.analytics.treynor_ratio',
  'finsight.analytics.information_ratio',
  'finsight.analytics.hurst_exponent',
  'finsight.analytics.kelly_criterion',
  'finsight.analytics.expected_shortfall',
  'finsight.analytics.liquidity_calculator',
  'finsight.analytics.risk_metrics',
  'finsight.analytics.technical_indicators',
  'finsight.analytics.black_scholes',
  'finsight.analytics.monte_carlo',
  'finsight.analytics.portfolio_volatility',
  'finsight.analytics.sharpe_ratio',
  'finsight.analytics.value_at_risk',
  'finsight.financial.portfolio_risk_metrics',
  'finsight.financial.credit_risk_scoring',
  'finsight.analytics.portfolio_risk',
  'finsight.analytics.news_statistics',
  'finsight.financial.options_greeks',
  'finsight.financial.black_scholes',
  'finsight.financial.basel_ratios'
];

async function analyzeCurrentFunctionAvailability() {
  console.log('🔍 ANALYZING FUNCTION AVAILABILITY BEFORE CLEANUP');
  console.log('='.repeat(60));
  
  // Check what's currently working
  console.log('\n✅ WORKING FUNCTION ENDPOINTS:');
  for (const func of WORKING_FUNCTIONS) {
    try {
      const response = await fetch(`${BASE_URL}/api/functions/${func}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getTestData(func))
      });
      
      if (response.ok) {
        console.log(`  ✅ /api/functions/${func} - WORKING`);
      } else {
        console.log(`  ❌ /api/functions/${func} - ERROR: ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ /api/functions/${func} - ERROR: ${error.message}`);
    }
  }
  
  // Check A2A registry functions
  console.log('\n🔧 FUNCTIONS CURRENTLY IN A2A REGISTRY:');
  const response = await fetch(`${BASE_URL}/api/a2a-agent-registry?action=list`);
  const result = await response.json();
  
  if (result.success) {
    const agents = result.agents || [];
    const functionsInRegistry = agents.filter(agent => 
      COMPUTATIONAL_FUNCTIONS_IN_REGISTRY.includes(agent.agent_id)
    );
    
    console.log(`  📊 Found ${functionsInRegistry.length} computational functions in A2A registry`);
    
    functionsInRegistry.forEach(func => {
      const shortName = func.agent_id.split('.').pop();
      const hasEndpoint = WORKING_FUNCTIONS.includes(shortName);
      const status = hasEndpoint ? '✅ HAS ENDPOINT' : '❌ NO ENDPOINT';
      console.log(`  ${status} ${func.agent_name} (${shortName})`);
    });
  }
  
  console.log('\n🎯 PRESERVATION STRATEGY:');
  console.log('='.repeat(40));
  
  console.log('\n1. IMMEDIATE ACTIONS NEEDED:');
  console.log('   ✅ Keep 3 working function endpoints as-is');
  console.log('   🔧 Create function registry to catalog all 30+ functions');
  console.log('   📋 Document function parameters and outputs');
  console.log('   🔄 Test that agents can discover and call functions');
  
  console.log('\n2. CLEANUP STRATEGY:');
  console.log('   🤖 Keep 9 true autonomous agents in A2A registry');
  console.log('   🔧 Move computational functions to function registry');
  console.log('   🧠 Evaluate ML agents (anomaly_detection, thompson_sampling, etc.)');
  console.log('   📁 Evaluate data/NLP agents for autonomy');
  
  console.log('\n3. SAFE CLEANUP PROCESS:');
  console.log('   Step 1: Create comprehensive function registry');
  console.log('   Step 2: Test agent-function integration');
  console.log('   Step 3: Remove functions from A2A registry only after verification');
  console.log('   Step 4: Add news processing to remaining agents');
  
  console.log('\n⚠️  RISK MITIGATION:');
  console.log('   - Backup current registry state before cleanup');
  console.log('   - Implement function endpoints for missing functions');
  console.log('   - Test that agents can still access all needed functions');
  console.log('   - Gradual cleanup rather than mass deletion');
  
  return {
    workingFunctions: WORKING_FUNCTIONS.length,
    functionsInRegistry: COMPUTATIONAL_FUNCTIONS_IN_REGISTRY.length,
    needsImplementation: COMPUTATIONAL_FUNCTIONS_IN_REGISTRY.length - WORKING_FUNCTIONS.length
  };
}

function getTestData(functionName) {
  switch (functionName) {
    case 'pearson_correlation':
      return { x_values: [1, 2, 3], y_values: [2, 4, 6] };
    case 'sharpe_ratio':
      return { returns: [0.01, -0.02, 0.015], risk_free_rate: 0.02 };
    case 'value_at_risk':
      return { returns: [0.01, -0.02, 0.015, -0.01, 0.02], confidence_level: 0.95 };
    default:
      return {};
  }
}

// Run analysis
analyzeCurrentFunctionAvailability()
  .then(result => {
    console.log('\n📊 SUMMARY:');
    console.log(`  Working endpoints: ${result.workingFunctions}`);
    console.log(`  Functions in registry: ${result.functionsInRegistry}`);
    console.log(`  Need implementation: ${result.needsImplementation}`);
    console.log('\n✅ Analysis complete - ready for safe cleanup planning');
  })
  .catch(error => {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  });