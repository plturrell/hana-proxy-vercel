/**
 * Live Compliance Test Suite
 * Tests A2A and ORD compliance against the deployed Vercel instance
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

// ========================================
// A2A COMPLIANCE TESTS
// ========================================

async function testA2AAgentCard() {
  console.log(`\n${colors.blue}🔍 A2A Test 1: Agent Card Discovery${colors.reset}`);
  
  try {
    const response = await fetch(`${BASE_URL}/.well-known/agent.json`);
    
    if (!response.ok) {
      console.log(`${colors.red}❌ Agent Card endpoint returned ${response.status}${colors.reset}`);
      return 0;
    }
    
    const agentCard = await response.json();
    console.log(`${colors.green}✅ Agent Card retrieved successfully${colors.reset}`);
    
    // Check required fields
    const checks = [
      { field: 'agents', exists: !!agentCard.agents, score: 25 },
      { field: 'version', exists: !!agentCard.version, score: 5 },
      { field: 'totalAgents', exists: !!agentCard.totalAgents, score: 5 }
    ];
    
    let score = 0;
    checks.forEach(check => {
      console.log(`  ${check.exists ? '✅' : '❌'} Has ${check.field}: ${check.exists}`);
      if (check.exists) score += check.score;
    });
    
    if (agentCard.agents && agentCard.agents.length > 0) {
      const agent = agentCard.agents[0];
      console.log(`  📊 First agent: ${agent.name}`);
      console.log(`  📊 Total agents: ${agentCard.totalAgents}`);
      
      // Check agent structure
      const agentChecks = [
        { field: 'id', exists: !!agent.id },
        { field: 'protocolVersion', exists: !!agent.protocolVersion },
        { field: 'capabilities', exists: !!agent.capabilities },
        { field: 'endpoints', exists: !!agent.endpoints },
        { field: 'authentication', exists: !!agent.authentication }
      ];
      
      let agentScore = 0;
      agentChecks.forEach(check => {
        if (check.exists) agentScore++;
      });
      
      if (agentScore === agentChecks.length) {
        score += 15; // Full agent structure bonus
        console.log(`  ${colors.green}✅ Agent structure complete${colors.reset}`);
      }
    }
    
    return score;
  } catch (error) {
    console.log(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
    return 0;
  }
}

async function testA2AJSONRPCMessage() {
  console.log(`\n${colors.blue}📨 A2A Test 2: JSON-RPC Message Handling${colors.reset}`);
  
  const message = {
    jsonrpc: '2.0',
    method: 'calculate',
    params: {
      x_values: [1, 2, 3, 4, 5],
      y_values: [2, 4, 6, 8, 10]
    },
    id: 'test-' + Date.now()
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/agent/agent-pearson-correlation/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      console.log(`${colors.red}❌ Message endpoint returned ${response.status}${colors.reset}`);
      return 0;
    }
    
    const result = await response.json();
    console.log(`${colors.green}✅ JSON-RPC message processed${colors.reset}`);
    
    let score = 0;
    
    // Check JSON-RPC compliance
    if (result.jsonrpc === '2.0') {
      score += 10;
      console.log(`  ✅ Valid JSON-RPC version`);
    }
    
    if (result.id === message.id) {
      score += 10;
      console.log(`  ✅ Matching request ID`);
    }
    
    if (result.result || result.error) {
      score += 10;
      console.log(`  ✅ Has result or error`);
      
      if (result.result?.taskId) {
        score += 10;
        console.log(`  ✅ Task created: ${result.result.taskId}`);
      }
    }
    
    return score;
  } catch (error) {
    console.log(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
    return 0;
  }
}

async function testA2ASSE() {
  console.log(`\n${colors.blue}📡 A2A Test 3: Server-Sent Events${colors.reset}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/agent/agent-monte-carlo/stream`);
    
    if (!response.ok) {
      console.log(`${colors.red}❌ SSE endpoint returned ${response.status}${colors.reset}`);
      return 0;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/event-stream')) {
      console.log(`${colors.green}✅ SSE endpoint configured correctly${colors.reset}`);
      console.log(`  ✅ Content-Type: ${contentType}`);
      return 10;
    } else {
      console.log(`${colors.red}❌ Incorrect content type: ${contentType}${colors.reset}`);
      return 0;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
    return 0;
  }
}

async function testA2ATaskManagement() {
  console.log(`\n${colors.blue}📋 A2A Test 4: Task Management${colors.reset}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/agent/agent-portfolio-optimization/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        message: {
          method: 'optimize',
          params: { assets: ['AAPL', 'MSFT'] }
        }
      })
    });
    
    if (!response.ok) {
      console.log(`${colors.red}❌ Task endpoint returned ${response.status}${colors.reset}`);
      return 0;
    }
    
    const task = await response.json();
    console.log(`${colors.green}✅ Task created successfully${colors.reset}`);
    
    let score = 0;
    
    if (task.id) {
      score += 5;
      console.log(`  ✅ Task ID: ${task.id}`);
    }
    
    if (task.status) {
      score += 5;
      console.log(`  ✅ Task status: ${task.status}`);
    }
    
    return score;
  } catch (error) {
    console.log(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
    return 0;
  }
}

// ========================================
// ORD COMPLIANCE TESTS
// ========================================

async function testORDConfiguration() {
  console.log(`\n${colors.blue}🔍 ORD Test 1: Configuration Endpoint${colors.reset}`);
  
  try {
    const response = await fetch(`${BASE_URL}/.well-known/open-resource-discovery/v1/configuration`);
    
    if (!response.ok) {
      console.log(`${colors.red}❌ ORD configuration endpoint returned ${response.status}${colors.reset}`);
      return 0;
    }
    
    const config = await response.json();
    console.log(`${colors.green}✅ ORD configuration retrieved${colors.reset}`);
    
    let score = 0;
    
    if (config.baseUrl) {
      score += 10;
      console.log(`  ✅ Base URL: ${config.baseUrl}`);
    }
    
    if (config.ordDocumentUrls && config.ordDocumentUrls.length > 0) {
      score += 10;
      console.log(`  ✅ Document URLs: ${config.ordDocumentUrls.length}`);
    }
    
    if (config.ordExtensions) {
      score += 5;
      console.log(`  ✅ Has extensions`);
    }
    
    return score;
  } catch (error) {
    console.log(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
    return 0;
  }
}

async function testORDDocument() {
  console.log(`\n${colors.blue}📄 ORD Test 2: Document Structure${colors.reset}`);
  
  try {
    const response = await fetch(`${BASE_URL}/open-resource-discovery/v1/documents/analytics-platform`);
    
    if (!response.ok) {
      console.log(`${colors.red}❌ ORD document endpoint returned ${response.status}${colors.reset}`);
      return 0;
    }
    
    const document = await response.json();
    console.log(`${colors.green}✅ ORD document retrieved${colors.reset}`);
    
    let score = 0;
    
    // Check required fields
    const requiredFields = ['openResourceDiscovery', 'perspective', 'systemInstance'];
    requiredFields.forEach(field => {
      if (document[field]) {
        score += 5;
        console.log(`  ✅ Has ${field}`);
      }
    });
    
    // Check resource types
    const resourceTypes = ['packages', 'capabilities', 'apiResources', 'eventResources', 'entityTypes'];
    resourceTypes.forEach(type => {
      if (document[type] && document[type].length > 0) {
        score += 5;
        console.log(`  ✅ ${type}: ${document[type].length} items`);
      }
    });
    
    // Verify we have 32 capabilities
    if (document.capabilities && document.capabilities.length === 32) {
      score += 10;
      console.log(`  ${colors.green}✅ All 32 analytics agents present${colors.reset}`);
    }
    
    return score;
  } catch (error) {
    console.log(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
    return 0;
  }
}

async function testORDOpenAPI() {
  console.log(`\n${colors.blue}🔌 ORD Test 3: OpenAPI Definitions${colors.reset}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/agent/agent-pearson-correlation/openapi.json`);
    
    if (!response.ok) {
      console.log(`${colors.red}❌ OpenAPI endpoint returned ${response.status}${colors.reset}`);
      return 0;
    }
    
    const openapi = await response.json();
    console.log(`${colors.green}✅ OpenAPI definition retrieved${colors.reset}`);
    
    let score = 0;
    
    if (openapi.openapi === '3.0.0') {
      score += 5;
      console.log(`  ✅ Valid OpenAPI version`);
    }
    
    if (openapi.info && openapi.paths) {
      score += 5;
      console.log(`  ✅ Has info and paths`);
    }
    
    if (openapi.info?.['x-a2a-compliant'] === true) {
      score += 5;
      console.log(`  ✅ A2A compliance marker present`);
    }
    
    if (openapi.info?.['x-ord-capability']) {
      score += 5;
      console.log(`  ✅ ORD capability reference present`);
    }
    
    return score;
  } catch (error) {
    console.log(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
    return 0;
  }
}

// ========================================
// MAIN TEST RUNNER
// ========================================

async function runComplianceTests() {
  console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.yellow}🚀 Live Compliance Test Suite${colors.reset}`);
  console.log(`${colors.yellow}📍 Testing: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}`);
  
  let totalScore = 0;
  const maxScore = 200; // 100 for A2A, 100 for ORD
  
  // Run A2A tests
  console.log(`\n${colors.blue}═══ A2A Protocol Compliance ═══${colors.reset}`);
  const a2aScores = {
    agentCard: await testA2AAgentCard(),
    jsonRpc: await testA2AJSONRPCMessage(),
    sse: await testA2ASSE(),
    tasks: await testA2ATaskManagement()
  };
  
  const a2aTotal = Object.values(a2aScores).reduce((sum, score) => sum + score, 0);
  totalScore += a2aTotal;
  
  // Run ORD tests
  console.log(`\n${colors.blue}═══ ORD v1 Compliance ═══${colors.reset}`);
  const ordScores = {
    configuration: await testORDConfiguration(),
    document: await testORDDocument(),
    openapi: await testORDOpenAPI()
  };
  
  const ordTotal = Object.values(ordScores).reduce((sum, score) => sum + score, 0);
  totalScore += ordTotal;
  
  // Summary
  console.log(`\n${colors.yellow}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.yellow}📊 Compliance Summary${colors.reset}`);
  console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}`);
  
  console.log(`\n${colors.blue}A2A Protocol:${colors.reset}`);
  console.log(`  Agent Discovery: ${a2aScores.agentCard}/50`);
  console.log(`  JSON-RPC: ${a2aScores.jsonRpc}/40`);
  console.log(`  Streaming: ${a2aScores.sse}/10`);
  console.log(`  Tasks: ${a2aScores.tasks}/10`);
  console.log(`  ${colors.yellow}Total: ${a2aTotal}/100 (${Math.round(a2aTotal)}%)${colors.reset}`);
  
  console.log(`\n${colors.blue}ORD v1:${colors.reset}`);
  console.log(`  Configuration: ${ordScores.configuration}/25`);
  console.log(`  Document: ${ordScores.document}/50`);
  console.log(`  OpenAPI: ${ordScores.openapi}/20`);
  console.log(`  ${colors.yellow}Total: ${ordTotal}/100 (${Math.round(ordTotal)}%)${colors.reset}`);
  
  const overallPercentage = Math.round((totalScore / maxScore) * 100);
  const color = overallPercentage === 100 ? colors.green : overallPercentage >= 80 ? colors.yellow : colors.red;
  
  console.log(`\n${colors.yellow}${'='.repeat(60)}${colors.reset}`);
  console.log(`${color}🎯 Overall Compliance: ${totalScore}/${maxScore} (${overallPercentage}%)${colors.reset}`);
  console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}`);
  
  if (overallPercentage === 100) {
    console.log(`\n${colors.green}✨ PERFECT COMPLIANCE ACHIEVED! ✨${colors.reset}`);
    console.log(`${colors.green}Both A2A and ORD standards are fully implemented.${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}📝 Areas for improvement:${colors.reset}`);
    if (a2aTotal < 100) {
      console.log(`  - A2A Protocol: ${100 - a2aTotal} points missing`);
    }
    if (ordTotal < 100) {
      console.log(`  - ORD v1: ${100 - ordTotal} points missing`);
    }
  }
}

// Run the tests
runComplianceTests()
  .then(() => console.log(`\n${colors.green}✅ Compliance test completed${colors.reset}`))
  .catch(error => console.error(`\n${colors.red}💥 Test suite error: ${error.message}${colors.reset}`));