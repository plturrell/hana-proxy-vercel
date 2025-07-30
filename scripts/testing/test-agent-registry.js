/**
 * Test script for A2A Agent Registry
 * Demonstrates agent registration and blockchain onboarding
 */

const BASE_URL = process.env.VERCEL_URL || 'https://hana-proxy-vercel-isssoeffh-plturrells-projects.vercel.app';

// Helper function for API calls
async function callAPI(action, data) {
  try {
    const response = await fetch(`${BASE_URL}/api/a2a-blockchain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data })
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('Response body:', responseText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
    }
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error(`Error calling ${action}:`, error);
    throw error;
  }
}

// Test flow
async function testAgentRegistry() {
  console.log('🧪 Testing A2A Agent Registry...\n');
  
  try {
    // 1. Register a new agent
    console.log('1️⃣ Registering new agent...');
    const registerResult = await callAPI('register_agent', {
      name: 'Test Data Analyst',
      type: 'analyst',
      description: 'Specialized in financial data analysis',
      capabilities: ['data_analysis', 'financial_modeling', 'report_generation'],
      metadata: {
        expertise: 'quantitative analysis',
        languages: ['Python', 'R', 'SQL']
      }
    });
    
    console.log('✅ Registration result:', JSON.stringify(registerResult, null, 2));
    const agentId = registerResult.agent?.agent_id;
    
    if (!agentId) {
      throw new Error('No agent ID returned from registration');
    }
    
    // 2. Onboard agent to blockchain
    console.log('\n2️⃣ Onboarding agent to blockchain...');
    const onboardResult = await callAPI('onboard_to_blockchain', {
      agent_id: agentId,
      initial_stake: '250'
    });
    
    console.log('✅ Blockchain onboarding result:', JSON.stringify(onboardResult, null, 2));
    
    // 3. Discover agents
    console.log('\n3️⃣ Discovering agents...');
    const discoverResult = await callAPI('discover_agents', {
      type: 'analyst',
      blockchain_only: true,
      limit: 5
    });
    
    console.log('✅ Discovered agents:', JSON.stringify(discoverResult, null, 2));
    
    // 4. Get agent details
    console.log('\n4️⃣ Getting agent details...');
    const detailsResult = await callAPI('get_agent_details', {
      agent_id: agentId
    });
    
    console.log('✅ Agent details:', JSON.stringify(detailsResult, null, 2));
    
    // 5. Verify agent blockchain identity
    console.log('\n5️⃣ Verifying blockchain identity...');
    const verifyResult = await callAPI('verify_agent', {
      agent_id: agentId
    });
    
    console.log('✅ Verification result:', JSON.stringify(verifyResult, null, 2));
    
    // 6. Update agent capabilities
    console.log('\n6️⃣ Adding blockchain capabilities...');
    const updateResult = await callAPI('update_capabilities', {
      agent_id: agentId,
      add_capabilities: ['blockchain_analytics', 'smart_contract_auditing']
    });
    
    console.log('✅ Updated capabilities:', JSON.stringify(updateResult, null, 2));
    
    // 7. Get registry statistics
    console.log('\n7️⃣ Getting registry statistics...');
    const statsResult = await callAPI('get_registry_stats', {});
    
    console.log('✅ Registry statistics:', JSON.stringify(statsResult, null, 2));
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`- Agent registered: ${agentId}`);
    console.log(`- Blockchain ID: ${onboardResult.blockchain_details?.blockchain_id}`);
    console.log(`- Wallet address: ${onboardResult.blockchain_details?.wallet_address}`);
    console.log(`- Total agents in registry: ${statsResult.stats?.total_agents || 0}`);
    console.log(`- Blockchain-enabled agents: ${statsResult.stats?.blockchain_enabled || 0}`);
    
    console.log('\n✅ All tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
console.log('🚀 A2A Agent Registry Test Script');
console.log(`📍 Target: ${BASE_URL}`);
console.log('='.repeat(50));

testAgentRegistry()
  .then(() => {
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });