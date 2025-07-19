/**
 * Test A2A Standard Protocol Implementation
 * Verifies compliance with Google Cloud A2A standard
 */

const BASE_URL = 'https://hana-proxy-vercel-1hjwde39b-plturrells-projects.vercel.app';

// Test 1: Agent Discovery via Agent Card
async function testAgentDiscovery() {
  console.log('\n🔍 Test 1: Agent Discovery');
  
  try {
    const response = await fetch(`${BASE_URL}/.well-known/agent.json`);
    if (!response.ok) {
      console.log('❌ Agent Card endpoint not found');
      return false;
    }
    
    const agentCard = await response.json();
    console.log('✅ Agent Card retrieved');
    console.log(`  - Total agents: ${agentCard.agents?.length || 0}`);
    console.log(`  - Version: ${agentCard.version}`);
    
    // Check first agent structure
    if (agentCard.agents && agentCard.agents[0]) {
      const agent = agentCard.agents[0];
      console.log(`  - Sample agent: ${agent.name}`);
      console.log(`  - Capabilities: ${agent.capabilities.join(', ')}`);
      console.log(`  - Endpoints: ${Object.keys(agent.endpoints).join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Agent discovery failed:', error.message);
    return false;
  }
}

// Test 2: JSON-RPC Message Format
async function testJSONRPCMessage() {
  console.log('\n📨 Test 2: JSON-RPC Message Format');
  
  const message = {
    jsonrpc: '2.0',
    method: 'calculate',
    params: {
      function: 'correlation',
      x_values: [1, 2, 3, 4, 5],
      y_values: [2, 4, 6, 8, 10]
    },
    id: 'test-123'
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/agent/agent-pearson-correlation/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      console.log('❌ Message endpoint not implemented');
      return false;
    }
    
    const result = await response.json();
    console.log('✅ JSON-RPC message processed');
    console.log(`  - Response has jsonrpc: ${result.jsonrpc === '2.0'}`);
    console.log(`  - Response has matching id: ${result.id === message.id}`);
    console.log(`  - Response has result or error: ${!!(result.result || result.error)}`);
    
    return true;
  } catch (error) {
    console.log('❌ JSON-RPC test failed:', error.message);
    return false;
  }
}

// Test 3: Task Management
async function testTaskManagement() {
  console.log('\n📋 Test 3: Task Management');
  
  try {
    // Create task
    const createResponse = await fetch(`${BASE_URL}/api/agent/agent-portfolio-optimization/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        function: 'optimize_portfolio',
        parameters: {
          assets: ['AAPL', 'GOOGL', 'MSFT'],
          target_return: 0.15
        }
      })
    });
    
    if (!createResponse.ok) {
      console.log('❌ Task creation endpoint not implemented');
      return false;
    }
    
    const task = await createResponse.json();
    console.log('✅ Task created');
    console.log(`  - Task ID: ${task.task_id}`);
    console.log(`  - Status: ${task.status}`);
    
    // Check task status
    const statusResponse = await fetch(`${BASE_URL}/api/agent/agent-portfolio-optimization/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'status',
        task_id: task.task_id
      })
    });
    
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('✅ Task status retrieved');
      console.log(`  - Current status: ${status.status}`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Task management test failed:', error.message);
    return false;
  }
}

// Test 4: Server-Sent Events (Streaming)
async function testStreaming() {
  console.log('\n📡 Test 4: Server-Sent Events');
  
  // Note: Full SSE test requires EventSource which isn't available in Node.js
  // This is a basic connectivity test
  
  try {
    const response = await fetch(`${BASE_URL}/api/agent/agent-monte-carlo/stream`);
    
    if (!response.ok) {
      console.log('❌ Streaming endpoint not implemented');
      return false;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/event-stream')) {
      console.log('✅ SSE endpoint configured correctly');
      console.log(`  - Content-Type: ${contentType}`);
      return true;
    } else {
      console.log('❌ Incorrect content type for SSE');
      return false;
    }
  } catch (error) {
    console.log('❌ Streaming test failed:', error.message);
    return false;
  }
}

// Test 5: Inter-Agent Communication
async function testInterAgentComms() {
  console.log('\n🤝 Test 5: Inter-Agent Communication');
  
  try {
    // Test negotiation between agents
    const negotiation = {
      jsonrpc: '2.0',
      method: 'negotiate',
      params: {
        proposal: 'collaboration',
        target_agent: 'agent-value-at-risk',
        terms: {
          service: 'portfolio_analysis',
          compensation: 'reciprocal'
        }
      },
      id: 'neg-456'
    };
    
    const response = await fetch(`${BASE_URL}/api/agent/agent-portfolio-optimization/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(negotiation)
    });
    
    if (!response.ok) {
      console.log('❌ Inter-agent communication not implemented');
      return false;
    }
    
    const result = await response.json();
    console.log('✅ Inter-agent negotiation initiated');
    console.log(`  - Negotiation ID: ${result.result?.negotiation_id}`);
    console.log(`  - Status: ${result.result?.status}`);
    
    return true;
  } catch (error) {
    console.log('❌ Inter-agent communication test failed:', error.message);
    return false;
  }
}

// Compliance Summary
async function runComplianceTests() {
  console.log('🔍 A2A Standard Protocol Compliance Test');
  console.log('📍 Testing against Google Cloud A2A Standard');
  console.log('='.repeat(50));
  
  const tests = [
    { name: 'Agent Discovery', fn: testAgentDiscovery },
    { name: 'JSON-RPC Messages', fn: testJSONRPCMessage },
    { name: 'Task Management', fn: testTaskManagement },
    { name: 'Streaming (SSE)', fn: testStreaming },
    { name: 'Inter-Agent Comms', fn: testInterAgentComms }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const passed = await test.fn();
    results.push({ name: test.name, passed });
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Compliance Summary:');
  
  let passed = 0;
  results.forEach(result => {
    console.log(`  ${result.passed ? '✅' : '❌'} ${result.name}`);
    if (result.passed) passed++;
  });
  
  const score = Math.round((passed / tests.length) * 100);
  console.log(`\n🎯 Compliance Score: ${score}%`);
  
  if (score < 100) {
    console.log('\n📝 Recommendations:');
    if (!results[0].passed) console.log('  - Implement /.well-known/agent.json endpoint');
    if (!results[1].passed) console.log('  - Add JSON-RPC 2.0 message handling');
    if (!results[2].passed) console.log('  - Implement task lifecycle management');
    if (!results[3].passed) console.log('  - Add Server-Sent Events support');
    if (!results[4].passed) console.log('  - Enable inter-agent negotiations');
  }
}

// Run tests
runComplianceTests()
  .then(() => console.log('\n✨ Compliance test completed'))
  .catch(error => console.error('\n💥 Test suite error:', error));