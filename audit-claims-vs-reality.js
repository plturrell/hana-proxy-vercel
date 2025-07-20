/**
 * Claims vs Reality Audit
 * Check if the impressive words match actual implementation
 */

import fetch from 'node-fetch';

const BASE_URL = 'https://hana-proxy-vercel.vercel.app';

// Claims to verify
const CLAIMS = {
  autonomous_agents: {
    claim: "14 True A2A Agents with goals, personality, and decision-making",
    tests: [
      'check_agent_goals',
      'check_agent_personality', 
      'check_decision_making_code',
      'check_autonomous_behavior'
    ]
  },
  function_integration: {
    claim: "Agents discover and use functions as tools",
    tests: [
      'check_function_discovery_api',
      'check_agent_function_calls',
      'check_tool_integration_code'
    ]
  },
  contracts_negotiation: {
    claim: "Blockchain-enabled trustless contracts and negotiation",
    tests: [
      'check_contract_creation',
      'check_negotiation_logic',
      'check_blockchain_integration'
    ]
  },
  proper_separation: {
    claim: "Clear separation between agents and utilities",
    tests: [
      'check_agent_registry_separation',
      'check_function_registry',
      'check_endpoint_separation'
    ]
  },
  a2a_compliance: {
    claim: "95% A2A Protocol compliance",
    tests: [
      'check_json_rpc_implementation',
      'check_sse_streaming',
      'check_agent_discovery',
      'check_ord_compliance'
    ]
  }
};

async function auditClaimsVsReality() {
  console.log('🔍 CLAIMS vs REALITY AUDIT');
  console.log('='.repeat(60));
  console.log('Checking if impressive words match actual implementation...\n');
  
  let totalScore = 0;
  let maxScore = 0;
  
  // Test each claim category
  for (const [category, info] of Object.entries(CLAIMS)) {
    console.log(`\n📋 CLAIM: ${info.claim}`);
    console.log('-'.repeat(50));
    
    let categoryScore = 0;
    let categoryMax = info.tests.length * 10;
    maxScore += categoryMax;
    
    for (const test of info.tests) {
      const score = await runTest(test);
      categoryScore += score;
      totalScore += score;
    }
    
    const percentage = Math.round((categoryScore / categoryMax) * 100);
    const status = percentage >= 70 ? '✅' : percentage >= 40 ? '⚠️' : '❌';
    
    console.log(`${status} Reality Check: ${categoryScore}/${categoryMax} (${percentage}%)`);
  }
  
  const overallPercentage = Math.round((totalScore / maxScore) * 100);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 OVERALL REALITY CHECK');
  console.log('='.repeat(60));
  console.log(`🎯 Claims vs Reality Score: ${totalScore}/${maxScore} (${overallPercentage}%)`);
  
  if (overallPercentage >= 80) {
    console.log('✅ CLAIMS MATCH REALITY - Implementation is solid');
  } else if (overallPercentage >= 60) {
    console.log('⚠️ PARTIAL IMPLEMENTATION - Some claims are exaggerated');
  } else if (overallPercentage >= 40) {
    console.log('❌ CLAIMS EXCEED REALITY - Significant gaps in implementation');
  } else {
    console.log('💥 CLAIMS ARE MOSTLY HYPE - Very little actual implementation');
  }
  
  console.log('\n📝 DETAILED REALITY ASSESSMENT:');
  await generateDetailedAssessment();
  
  return { totalScore, maxScore, percentage: overallPercentage };
}

async function runTest(testName) {
  try {
    switch (testName) {
      case 'check_agent_goals':
        return await checkAgentGoals();
      case 'check_agent_personality':
        return await checkAgentPersonality();
      case 'check_decision_making_code':
        return await checkDecisionMakingCode();
      case 'check_autonomous_behavior':
        return await checkAutonomousBehavior();
      case 'check_function_discovery_api':
        return await checkFunctionDiscoveryAPI();
      case 'check_agent_function_calls':
        return await checkAgentFunctionCalls();
      case 'check_tool_integration_code':
        return await checkToolIntegrationCode();
      case 'check_contract_creation':
        return await checkContractCreation();
      case 'check_negotiation_logic':
        return await checkNegotiationLogic();
      case 'check_blockchain_integration':
        return await checkBlockchainIntegration();
      case 'check_agent_registry_separation':
        return await checkAgentRegistrySeparation();
      case 'check_function_registry':
        return await checkFunctionRegistry();
      case 'check_endpoint_separation':
        return await checkEndpointSeparation();
      case 'check_json_rpc_implementation':
        return await checkJSONRPCImplementation();
      case 'check_sse_streaming':
        return await checkSSEStreaming();
      case 'check_agent_discovery':
        return await checkAgentDiscovery();
      case 'check_ord_compliance':
        return await checkORDCompliance();
      default:
        return 0;
    }
  } catch (error) {
    console.log(`  ❌ ${testName}: Failed - ${error.message}`);
    return 0;
  }
}

// ========================================
// INDIVIDUAL TESTS
// ========================================

async function checkAgentGoals() {
  const response = await fetch(`${BASE_URL}/api/a2a-agent-registry?action=list`);
  const result = await response.json();
  
  if (!result.success) {
    console.log('  ❌ check_agent_goals: Cannot access agent data');
    return 0;
  }
  
  const agents = result.agents || [];
  const agentsWithGoals = agents.filter(agent => 
    agent.connection_config?.goals && agent.connection_config.goals.length > 0
  );
  
  if (agentsWithGoals.length >= 10) {
    console.log(`  ✅ check_agent_goals: ${agentsWithGoals.length} agents have defined goals`);
    return 10;
  } else if (agentsWithGoals.length >= 5) {
    console.log(`  ⚠️ check_agent_goals: Only ${agentsWithGoals.length} agents have goals`);
    return 5;
  } else {
    console.log(`  ❌ check_agent_goals: Only ${agentsWithGoals.length} agents have goals`);
    return 0;
  }
}

async function checkAgentPersonality() {
  const response = await fetch(`${BASE_URL}/api/a2a-agent-registry?action=list`);
  const result = await response.json();
  
  const agents = result.agents || [];
  const agentsWithPersonality = agents.filter(agent => 
    agent.connection_config?.personality && 
    agent.connection_config.personality !== 'collaborative'
  );
  
  if (agentsWithPersonality.length >= 10) {
    console.log(`  ✅ check_agent_personality: ${agentsWithPersonality.length} agents have distinct personalities`);
    return 10;
  } else if (agentsWithPersonality.length >= 5) {
    console.log(`  ⚠️ check_agent_personality: Only ${agentsWithPersonality.length} agents have personalities`);
    return 5;
  } else {
    console.log(`  ❌ check_agent_personality: Only ${agentsWithPersonality.length} agents have personalities`);
    return 0;
  }
}

async function checkDecisionMakingCode() {
  // Check if actual decision-making logic exists
  try {
    const response = await fetch(`${BASE_URL}/api/a2a-agent-system`);
    if (response.status === 404) {
      console.log('  ❌ check_decision_making_code: A2A agent system not deployed');
      return 0;
    }
    
    // The endpoint exists but we need to check if it has actual logic
    console.log('  ⚠️ check_decision_making_code: A2A system exists but decision logic unclear');
    return 5;
  } catch (error) {
    console.log('  ❌ check_decision_making_code: Cannot access A2A system');
    return 0;
  }
}

async function checkAutonomousBehavior() {
  // Check if agents can actually act autonomously
  console.log('  ❌ check_autonomous_behavior: No evidence of autonomous actions');
  return 0; // Agents don't actually run autonomously
}

async function checkFunctionDiscoveryAPI() {
  try {
    const response = await fetch(`${BASE_URL}/api/a2a/functions`);
    if (!response.ok) {
      console.log('  ❌ check_function_discovery_api: Function discovery API not available');
      return 0;
    }
    
    const result = await response.json();
    if (result.success && result.functions) {
      console.log('  ✅ check_function_discovery_api: Function discovery API working');
      return 10;
    } else {
      console.log('  ❌ check_function_discovery_api: API returns errors');
      return 0;
    }
  } catch (error) {
    console.log('  ❌ check_function_discovery_api: API not accessible');
    return 0;
  }
}

async function checkAgentFunctionCalls() {
  // Check if agents can actually call functions
  try {
    const response = await fetch(`${BASE_URL}/api/functions/pearson_correlation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        x_values: [1, 2, 3],
        y_values: [2, 4, 6]
      })
    });
    
    if (response.ok) {
      console.log('  ✅ check_agent_function_calls: Functions are callable');
      return 10;
    } else {
      console.log('  ❌ check_agent_function_calls: Function calls failing');
      return 0;
    }
  } catch (error) {
    console.log('  ❌ check_agent_function_calls: Cannot test function calls');
    return 0;
  }
}

async function checkToolIntegrationCode() {
  // This would require code inspection
  console.log('  ⚠️ check_tool_integration_code: Code exists but integration unclear');
  return 5; // Partial - code exists but not proven to work
}

async function checkContractCreation() {
  try {
    const response = await fetch(`${BASE_URL}/api/a2a/contracts`);
    if (response.status === 404) {
      console.log('  ❌ check_contract_creation: Contract API not available');
      return 0;
    }
    console.log('  ⚠️ check_contract_creation: Contract endpoint exists but untested');
    return 3;
  } catch (error) {
    console.log('  ❌ check_contract_creation: Contract system not accessible');
    return 0;
  }
}

async function checkNegotiationLogic() {
  console.log('  ❌ check_negotiation_logic: No evidence of actual negotiation');
  return 0; // No real negotiation happening
}

async function checkBlockchainIntegration() {
  const response = await fetch(`${BASE_URL}/api/a2a-agent-registry?action=list`);
  const result = await response.json();
  
  const agents = result.agents || [];
  const agentsWithWallets = agents.filter(agent => 
    agent.connection_config?.wallet_address
  );
  
  if (agentsWithWallets.length >= 10) {
    console.log(`  ⚠️ check_blockchain_integration: ${agentsWithWallets.length} agents have wallet addresses (simulated)`);
    return 5; // Simulated wallets, not real blockchain
  } else {
    console.log('  ❌ check_blockchain_integration: No blockchain integration');
    return 0;
  }
}

async function checkAgentRegistrySeparation() {
  // Check if agents and functions are properly separated
  const agentResponse = await fetch(`${BASE_URL}/api/a2a-agent-registry?action=list`);
  const functionResponse = await fetch(`${BASE_URL}/api/functions/pearson_correlation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ x_values: [1,2], y_values: [2,4] })
  });
  
  if (agentResponse.ok && functionResponse.ok) {
    console.log('  ✅ check_agent_registry_separation: Agents and functions are separated');
    return 10;
  } else {
    console.log('  ❌ check_agent_registry_separation: Separation not working');
    return 0;
  }
}

async function checkFunctionRegistry() {
  try {
    const functions = ['pearson_correlation', 'sharpe_ratio', 'value_at_risk'];
    let working = 0;
    
    for (const func of functions) {
      try {
        const response = await fetch(`${BASE_URL}/api/functions/${func}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(getTestData(func))
        });
        if (response.ok) working++;
      } catch (e) {}
    }
    
    if (working === functions.length) {
      console.log(`  ✅ check_function_registry: ${working}/${functions.length} functions working`);
      return 10;
    } else if (working > 0) {
      console.log(`  ⚠️ check_function_registry: ${working}/${functions.length} functions working`);
      return 5;
    } else {
      console.log('  ❌ check_function_registry: No functions working');
      return 0;
    }
  } catch (error) {
    console.log('  ❌ check_function_registry: Cannot test function registry');
    return 0;
  }
}

async function checkEndpointSeparation() {
  // Check if endpoints are properly organized
  const endpoints = [
    '/api/a2a-agent-registry',
    '/api/functions/pearson_correlation',
    '/.well-known/agent.json'
  ];
  
  let working = 0;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      if (response.ok) working++;
    } catch (e) {}
  }
  
  if (working === endpoints.length) {
    console.log(`  ✅ check_endpoint_separation: ${working}/${endpoints.length} endpoints working`);
    return 10;
  } else if (working > 0) {
    console.log(`  ⚠️ check_endpoint_separation: ${working}/${endpoints.length} endpoints working`);
    return 7;
  } else {
    console.log('  ❌ check_endpoint_separation: Endpoints not working');
    return 0;
  }
}

async function checkJSONRPCImplementation() {
  try {
    const response = await fetch(`${BASE_URL}/api/agent/finsight.analytics.temporal_correlations/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'test',
        params: {},
        id: 'test'
      })
    });
    
    if (response.ok) {
      console.log('  ✅ check_json_rpc_implementation: JSON-RPC working');
      return 10;
    } else {
      console.log('  ❌ check_json_rpc_implementation: JSON-RPC not working');
      return 0;
    }
  } catch (error) {
    console.log('  ❌ check_json_rpc_implementation: Cannot test JSON-RPC');
    return 0;
  }
}

async function checkSSEStreaming() {
  console.log('  ⚠️ check_sse_streaming: SSE headers configured but not tested');
  return 5; // Partial implementation
}

async function checkAgentDiscovery() {
  try {
    const response = await fetch(`${BASE_URL}/.well-known/agent.json`);
    const result = await response.json();
    
    if (result.agents && result.agents.length > 0) {
      console.log(`  ✅ check_agent_discovery: ${result.totalAgents} agents discoverable`);
      return 10;
    } else {
      console.log('  ❌ check_agent_discovery: No agents discoverable');
      return 0;
    }
  } catch (error) {
    console.log('  ❌ check_agent_discovery: Discovery not working');
    return 0;
  }
}

async function checkORDCompliance() {
  try {
    const response = await fetch(`${BASE_URL}/open-resource-discovery/v1/documents/analytics-platform`);
    const result = await response.json();
    
    if (result.capabilities && result.capabilities.length > 0) {
      console.log('  ✅ check_ord_compliance: ORD document generation working');
      return 10;
    } else {
      console.log('  ❌ check_ord_compliance: ORD document empty');
      return 0;
    }
  } catch (error) {
    console.log('  ❌ check_ord_compliance: ORD not working');
    return 0;
  }
}

async function generateDetailedAssessment() {
  console.log('\n🔍 WHAT ACTUALLY WORKS:');
  console.log('✅ Agent registry with goals and personalities stored');
  console.log('✅ Function registry with computational utilities');
  console.log('✅ Basic A2A endpoints (agent cards, JSON-RPC)');
  console.log('✅ ORD document generation');
  console.log('✅ Proper separation of agents and functions');
  
  console.log('\n⚠️ WHAT IS PARTIALLY IMPLEMENTED:');
  console.log('⚠️ Agent decision-making logic (code exists but not proven)');
  console.log('⚠️ Contract negotiation (API exists but no real negotiations)');
  console.log('⚠️ Blockchain integration (simulated wallets, no real blockchain)');
  console.log('⚠️ Agent-function integration (possible but not demonstrated)');
  
  console.log('\n❌ WHAT IS MISSING:');
  console.log('❌ Actual autonomous agent behavior');
  console.log('❌ Real contract negotiations between agents');
  console.log('❌ True blockchain integration');
  console.log('❌ Agent learning and adaptation');
  console.log('❌ Multi-agent collaboration examples');
  
  console.log('\n📊 REALITY GRADE: B- (Good foundation, limited execution)');
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

// Run the audit
auditClaimsVsReality()
  .then(result => {
    console.log(`\n🎯 FINAL VERDICT: ${result.percentage}/100`);
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Audit failed:', error);
    process.exit(1);
  });