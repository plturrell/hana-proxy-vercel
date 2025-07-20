import fetch from 'node-fetch';

const BASE_URL = 'https://hana-proxy-vercel.vercel.app';

async function testAgent(endpoint, name) {
  console.log(`\nTesting ${name}...`);
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}?action=status`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ ${name} is working!`);
      console.log(`   Agent ID: ${data.agent_id}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Capabilities: ${data.capabilities?.length || 0} capabilities`);
    } else {
      console.log(`❌ ${name} failed:`, data.error || 'Unknown error');
    }
  } catch (error) {
    console.log(`❌ ${name} error:`, error.message);
  }
}

async function testAllAgents() {
  console.log('Testing all 5 new agents...');
  console.log('===========================');
  
  const agents = [
    { endpoint: '/api/agents/news-intelligence', name: 'News Intelligence Agent' },
    { endpoint: '/api/agents/market-data', name: 'Market Data Agent' },
    { endpoint: '/api/agents/a2a-protocol-manager', name: 'A2A Protocol Manager' },
    { endpoint: '/api/agents/ord-registry-manager', name: 'ORD Registry Manager' },
    { endpoint: '/api/agents/api-gateway', name: 'API Gateway Agent' }
  ];
  
  for (const agent of agents) {
    await testAgent(agent.endpoint, agent.name);
  }
  
  console.log('\n===========================');
  console.log('Agent testing complete!');
}

testAllAgents().catch(console.error);