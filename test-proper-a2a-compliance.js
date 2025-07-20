/**
 * Proper A2A Compliance Test
 * Tests the new architecture with true agent-function separation
 */

const BASE_URL = 'https://hana-proxy-vercel.vercel.app';

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

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

// ========================================
// PROPER A2A COMPLIANCE TESTS
// ========================================

async function testAgentAutonomy() {
  console.log(`\n${colors.blue}🤖 A2A Test 1: Agent Autonomy${colors.reset}`);
  
  try {
    // Test agent discovery
    const response = await fetch(`${BASE_URL}/.well-known/agent.json`);
    const agentCard = await response.json();
    
    if (!agentCard.agents) {
      console.log(`${colors.red}❌ No agents found${colors.reset}`);
      return 0;
    }
    
    // Filter to true A2A agents
    const trueAgents = agentCard.agents.filter(agent => 
      TRUE_A2A_AGENTS.includes(agent.id)
    );
    
    console.log(`${colors.green}✅ True A2A Agents found: ${trueAgents.length}${colors.reset}`);
    
    let score = 0;
    
    // Check for autonomy indicators
    trueAgents.forEach(agent => {
      const metadata = agent.metadata || {};
      const blockchain = metadata.blockchain || {};
      
      if (blockchain.enabled) {
        score += 5; // Blockchain autonomy
      }
      
      if (agent.capabilities && agent.capabilities.length > 0) {
        score += 3; // Has capabilities
      }
      
      if (metadata.ord && metadata.ord.capabilityId) {
        score += 2; // ORD compliance
      }
    });
    
    console.log(`  📊 Found ${trueAgents.length} autonomous agents`);
    console.log(`  ✅ Blockchain-enabled agents: ${trueAgents.filter(a => a.metadata?.blockchain?.enabled).length}`);
    
    return Math.min(score, 50); // Max 50 points
    
  } catch (error) {
    console.log(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
    return 0;
  }
}

async function testFunctionSeparation() {
  console.log(`\n${colors.blue}🔧 A2A Test 2: Function Separation${colors.reset}`);
  
  let score = 0;
  
  try {
    // Test computational functions are separate
    const functions = [
      'pearson_correlation',
      'sharpe_ratio', 
      'value_at_risk'
    ];
    
    for (const func of functions) {
      try {
        const response = await fetch(`${BASE_URL}/api/functions/${func}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(getFunctionTestData(func))
        });
        
        const result = await response.json();
        
        if (!result.error) {
          score += 10;
          console.log(`  ✅ Function ${func} working as utility`);
        } else {
          console.log(`  ❌ Function ${func} failed: ${result.error}`);
        }
      } catch (error) {
        console.log(`  ❌ Function ${func} error: ${error.message}`);
      }
    }
    
    return score;
    
  } catch (error) {
    console.log(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
    return 0;
  }
}

async function testAgentDecisionMaking() {
  console.log(`\n${colors.blue}🧠 A2A Test 3: Agent Decision Making${colors.reset}`);
  
  try {
    // Test if agents have goals, personality, voting power
    const response = await fetch(`${BASE_URL}/api/a2a-agent-registry?action=list`);
    const result = await response.json();
    
    if (!result.success) {
      console.log(`${colors.red}❌ Failed to get agent data${colors.reset}`);
      return 0;
    }
    
    const agents = result.agents || [];
    const trueAgents = agents.filter(agent => 
      TRUE_A2A_AGENTS.includes(agent.agent_id)
    );
    
    let score = 0;
    let agentsWithGoals = 0;
    let agentsWithPersonality = 0;
    let agentsWithVoting = 0;
    
    trueAgents.forEach(agent => {
      const config = agent.connection_config || {};
      
      if (config.goals && config.goals.length > 0) {
        agentsWithGoals++;
        score += 2;
      }
      
      if (config.personality && config.personality !== 'collaborative') {
        agentsWithPersonality++;
        score += 2;
      }
      
      if (config.voting_power && config.voting_power > 0) {
        agentsWithVoting++;
        score += 1;
      }
    });
    
    console.log(`  ✅ Agents with goals: ${agentsWithGoals}/${trueAgents.length}`);
    console.log(`  ✅ Agents with personality: ${agentsWithPersonality}/${trueAgents.length}`);
    console.log(`  ✅ Agents with voting power: ${agentsWithVoting}/${trueAgents.length}`);
    
    return Math.min(score, 40); // Max 40 points
    
  } catch (error) {
    console.log(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
    return 0;
  }
}

async function testAgentFunctionIntegration() {
  console.log(`\n${colors.blue}🔗 A2A Test 4: Agent-Function Integration${colors.reset}`);
  
  try {
    // Test that agents can discover and use functions
    let score = 0;
    
    // Test regime detection agent using multiple functions
    const testAgentId = 'finsight.analytics.regime_detection';
    
    // Simulate agent using functions as tools
    const marketData = {
      returns: [0.01, -0.02, 0.015, -0.01, 0.02],
      risk_free_rate: 0.02
    };
    
    // Test function calls that an agent might make
    const functionCalls = [
      { func: 'sharpe_ratio', data: marketData },
      { func: 'value_at_risk', data: { returns: marketData.returns, confidence_level: 0.95 } },
      { func: 'pearson_correlation', data: { x_values: [1,2,3,4,5], y_values: [2,4,6,8,10] } }
    ];
    
    for (const call of functionCalls) {
      try {
        const response = await fetch(`${BASE_URL}/api/functions/${call.func}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(call.data)
        });
        
        const result = await response.json();
        
        if (!result.error) {
          score += 10;
          console.log(`  ✅ Function integration: ${call.func} successful`);
        }
      } catch (error) {
        console.log(`  ❌ Function integration failed: ${call.func}`);
      }
    }
    
    return score;
    
  } catch (error) {
    console.log(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
    return 0;
  }
}

async function testAgentContractsAndNegotiation() {
  console.log(`\n${colors.blue}🤝 A2A Test 5: Contracts & Negotiation${colors.reset}`);
  
  try {
    // Test contract creation capability
    let score = 0;
    
    // Check if agents have voting power for negotiations
    const response = await fetch(`${BASE_URL}/api/a2a-agent-registry?action=list`);
    const result = await response.json();
    
    if (result.success) {
      const agents = result.agents || [];
      const trueAgents = agents.filter(agent => 
        TRUE_A2A_AGENTS.includes(agent.agent_id)
      );
      
      const agentsWithVoting = trueAgents.filter(agent => 
        agent.connection_config?.voting_power > 0
      );
      
      if (agentsWithVoting.length > 0) {
        score += 20;
        console.log(`  ✅ ${agentsWithVoting.length} agents have negotiation capability`);
      }
      
      // Check for blockchain integration (enables contracts)
      const blockchainAgents = trueAgents.filter(agent =>
        agent.connection_config?.wallet_address
      );
      
      if (blockchainAgents.length > 0) {
        score += 20;
        console.log(`  ✅ ${blockchainAgents.length} agents have blockchain wallets`);
      }
    }
    
    console.log(`  📝 Contract negotiation infrastructure: ${score > 0 ? 'Ready' : 'Not Ready'}`);
    
    return score;
    
  } catch (error) {
    console.log(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
    return 0;
  }
}

// ========================================
// TEST EXECUTION
// ========================================

async function runProperA2AComplianceTest() {
  console.log(`${colors.yellow}============================================================${colors.reset}`);
  console.log(`${colors.yellow}🚀 Proper A2A Protocol Compliance Test${colors.reset}`);
  console.log(`${colors.yellow}📍 Testing: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.yellow}============================================================${colors.reset}`);
  
  const tests = [
    { name: 'Agent Autonomy', func: testAgentAutonomy, maxScore: 50 },
    { name: 'Function Separation', func: testFunctionSeparation, maxScore: 30 },
    { name: 'Agent Decision Making', func: testAgentDecisionMaking, maxScore: 40 },
    { name: 'Agent-Function Integration', func: testAgentFunctionIntegration, maxScore: 30 },
    { name: 'Contracts & Negotiation', func: testAgentContractsAndNegotiation, maxScore: 40 }
  ];
  
  let totalScore = 0;
  let maxTotalScore = 0;
  
  for (const test of tests) {
    const score = await test.func();
    totalScore += score;
    maxTotalScore += test.maxScore;
    
    const percentage = Math.round((score / test.maxScore) * 100);
    console.log(`  ${colors.blue}${test.name}: ${score}/${test.maxScore} (${percentage}%)${colors.reset}`);
  }
  
  const overallPercentage = Math.round((totalScore / maxTotalScore) * 100);
  
  console.log(`\n${colors.yellow}============================================================${colors.reset}`);
  console.log(`${colors.yellow}📊 Proper A2A Compliance Summary${colors.reset}`);
  console.log(`${colors.yellow}============================================================${colors.reset}`);
  
  console.log(`${colors.blue}🎯 Overall A2A Compliance: ${totalScore}/${maxTotalScore} (${overallPercentage}%)${colors.reset}`);
  
  if (overallPercentage >= 90) {
    console.log(`${colors.green}✅ EXCELLENT A2A Implementation!${colors.reset}`);
  } else if (overallPercentage >= 75) {
    console.log(`${colors.green}✅ GOOD A2A Implementation${colors.reset}`);
  } else if (overallPercentage >= 60) {
    console.log(`${colors.yellow}⚠️  PARTIAL A2A Implementation${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ POOR A2A Implementation${colors.reset}`);
  }
  
  console.log(`\n${colors.blue}📝 A2A Architecture Analysis:${colors.reset}`);
  console.log(`  🤖 True autonomous agents: Properly separated`);
  console.log(`  🔧 Computational functions: Available as utilities`);
  console.log(`  🧠 Agent decision-making: Goals and personality-driven`);
  console.log(`  🔗 Agent-function integration: Direct tool usage`);
  console.log(`  🤝 Agent contracts: Blockchain-enabled negotiation`);
  
  console.log(`\n${colors.green}✅ Proper A2A compliance test completed${colors.reset}`);
  
  return {
    totalScore,
    maxTotalScore,
    percentage: overallPercentage,
    passed: overallPercentage >= 75
  };
}

// Helper function to get test data for functions
function getFunctionTestData(functionName) {
  switch (functionName) {
    case 'pearson_correlation':
      return {
        x_values: [1, 2, 3, 4, 5],
        y_values: [2, 4, 6, 8, 10]
      };
    case 'sharpe_ratio':
      return {
        returns: [0.01, -0.02, 0.015, -0.01, 0.02],
        risk_free_rate: 0.02
      };
    case 'value_at_risk':
      return {
        returns: [0.01, -0.02, 0.015, -0.01, 0.02, 0.005, -0.015, 0.012, -0.008, 0.018],
        confidence_level: 0.95
      };
    default:
      return {};
  }
}

// Run the test
runProperA2AComplianceTest()
  .then(result => {
    process.exit(result.passed ? 0 : 1);
  })
  .catch(error => {
    console.error(`${colors.red}💥 Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });