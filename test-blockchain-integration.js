/**
 * Test Blockchain Integration with A2A Agents
 * Tests the new blockchain capabilities in the deployed system
 */

const BASE_URL = 'https://hana-proxy-vercel-4uxy5fskc-plturrells-projects.vercel.app';

async function testBlockchainIntegration() {
  console.log('🔗 Testing Blockchain Integration with A2A Agents');
  console.log('================================================\n');

  try {
    // Test 1: Initialize blockchain for all agents
    console.log('Test 1: Initialize Blockchain Capabilities');
    console.log('------------------------------------------');
    
    const initResponse = await fetch(`${BASE_URL}/api/a2a-grok-autonomy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'initialize_blockchain' })
    });
    
    const initResult = await initResponse.json();
    
    if (initResult.success) {
      console.log('✅ Blockchain initialization successful');
      console.log(`   • Agents initialized: ${initResult.result.initialized || 0}`);
      console.log(`   • Total agents: ${initResult.result.total || 0}`);
    } else {
      console.log('⚠️ Blockchain initialization completed with warnings');
      console.log(`   • Error: ${initResult.result?.error || 'Unknown'}`);
    }

    // Test 2: Execute blockchain action for a specific agent
    console.log('\nTest 2: Execute Blockchain Action');
    console.log('----------------------------------');
    
    // Get first active agent
    const agentsResponse = await fetch(`${BASE_URL}/api/supabase-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'fetch',
        table: 'a2a_agents',
        filters: { status: 'active' },
        limit: 1
      })
    });
    
    const agentsData = await agentsResponse.json();
    
    if (agentsData.success && agentsData.data.length > 0) {
      const testAgent = agentsData.data[0];
      console.log(`   Testing with agent: ${testAgent.name} (${testAgent.agent_id})`);
      
      // Execute check balance action
      const actionResponse = await fetch(`${BASE_URL}/api/a2a-grok-autonomy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_blockchain_action',
          agentId: testAgent.agent_id,
          blockchainAction: 'check_balance'
        })
      });
      
      const actionResult = await actionResponse.json();
      
      if (actionResult.success) {
        console.log('✅ Blockchain action executed successfully');
        console.log(`   • Action: ${actionResult.action}`);
        console.log(`   • Address: ${actionResult.result.address}`);
        console.log(`   • Balance: ${actionResult.result.balance}`);
        console.log(`   • Network: ${actionResult.result.network}`);
      } else {
        console.log('❌ Blockchain action failed');
        console.log(`   • Error: ${actionResult.error}`);
      }
      
      // Test 3: Get agent blockchain status
      console.log('\nTest 3: Agent Blockchain Status');
      console.log('--------------------------------');
      
      const statusResponse = await fetch(`${BASE_URL}/api/a2a-grok-autonomy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_agent_blockchain_status',
          agentId: testAgent.agent_id
        })
      });
      
      const statusResult = await statusResponse.json();
      
      if (statusResult.success) {
        console.log('✅ Agent blockchain status retrieved');
        console.log(`   • Name: ${statusResult.agent.name}`);
        console.log(`   • Blockchain enabled: ${statusResult.agent.blockchain_enabled}`);
        console.log(`   • Wallet address: ${statusResult.agent.wallet_address || 'Not set'}`);
        console.log(`   • Network: ${statusResult.agent.network || 'Not set'}`);
        console.log(`   • Capabilities: ${statusResult.agent.capabilities.join(', ')}`);
        console.log(`   • Recent activities: ${statusResult.recent_activities.length}`);
      } else {
        console.log('❌ Failed to get agent blockchain status');
        console.log(`   • Error: ${statusResult.error}`);
      }
    } else {
      console.log('⚠️ No active agents found for testing');
    }

    // Test 4: Monitor blockchain events
    console.log('\nTest 4: Monitor Blockchain Events');
    console.log('----------------------------------');
    
    const eventsResponse = await fetch(`${BASE_URL}/api/a2a-grok-autonomy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'monitor_blockchain_events' })
    });
    
    const eventsResult = await eventsResponse.json();
    
    if (eventsResult.success) {
      console.log('✅ Blockchain events monitoring active');
      console.log(`   • Total events: ${eventsResult.summary.total_events}`);
      console.log(`   • Recent activities: ${eventsResult.summary.recent_activities}`);
      
      if (eventsResult.activities.length > 0) {
        console.log('   • Recent blockchain activities:');
        eventsResult.activities.slice(0, 3).forEach(activity => {
          console.log(`     - ${activity.activity_type} (${activity.status})`);
        });
      }
    } else {
      console.log('❌ Failed to monitor blockchain events');
    }

    // Test 5: Execute escrow creation
    console.log('\nTest 5: Create Escrow');
    console.log('---------------------');
    
    if (agentsData.success && agentsData.data.length > 0) {
      const testAgent = agentsData.data[0];
      
      const escrowResponse = await fetch(`${BASE_URL}/api/a2a-grok-autonomy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_blockchain_action',
          agentId: testAgent.agent_id,
          blockchainAction: 'create_escrow',
          params: {
            taskId: 'test_task_123',
            amount: '5 ETH',
            description: 'Test escrow for blockchain integration'
          }
        })
      });
      
      const escrowResult = await escrowResponse.json();
      
      if (escrowResult.success) {
        console.log('✅ Escrow created successfully');
        console.log(`   • Escrow ID: ${escrowResult.result.escrow_id}`);
        console.log(`   • Amount: ${escrowResult.result.amount}`);
        console.log(`   • Transaction: ${escrowResult.result.tx_hash}`);
      } else {
        console.log('❌ Escrow creation failed');
        console.log(`   • Error: ${escrowResult.error}`);
      }
    }

    console.log('\n🎉 BLOCKCHAIN INTEGRATION TEST COMPLETE!');
    console.log('=========================================');
    
    return {
      success: true,
      message: 'All blockchain integration tests completed',
      endpoint: `${BASE_URL}/api/a2a-grok-autonomy`
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run tests
if (require.main === module) {
  testBlockchainIntegration()
    .then(result => {
      if (result.success) {
        console.log(`\n✅ Success: ${result.message}`);
        console.log(`🔗 API Endpoint: ${result.endpoint}`);
      } else {
        console.log(`\n❌ Failed: ${result.error}`);
      }
    })
    .catch(error => {
      console.error('Test execution failed:', error);
    });
}

module.exports = { testBlockchainIntegration };
