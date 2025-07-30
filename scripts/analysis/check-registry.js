// Check current agent registry status
const BASE_URL = 'https://hana-proxy-vercel-1hjwde39b-plturrells-projects.vercel.app';

async function checkRegistry() {
  try {
    console.log('🔍 Checking A2A Agent Registry...\n');
    
    // Get registry statistics
    const response = await fetch(`${BASE_URL}/api/a2a-blockchain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'get_registry_stats'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Error:', error);
      return;
    }
    
    const data = await response.json();
    console.log('Registry Statistics:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n📊 Summary:');
      console.log(`Total Agents: ${data.stats.total_agents}`);
      console.log(`Active Agents: ${data.stats.active_agents}`);
      console.log(`Blockchain Enabled: ${data.stats.blockchain_enabled}`);
      console.log(`Agent Types:`, data.stats.agent_type_distribution);
      
      // If there are agents, let's discover them
      if (data.stats.total_agents > 0) {
        console.log('\n🤖 Discovering all agents...');
        
        const discoverResponse = await fetch(`${BASE_URL}/api/a2a-blockchain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'discover_agents',
            limit: 50
          })
        });
        
        if (discoverResponse.ok) {
          const agents = await discoverResponse.json();
          console.log(`\nFound ${agents.agents.length} agents:`);
          agents.agents.forEach((agent, index) => {
            console.log(`\n${index + 1}. ${agent.name} (${agent.agent_id})`);
            console.log(`   Type: ${agent.type}`);
            console.log(`   Status: ${agent.status}`);
            console.log(`   Blockchain: ${agent.blockchain_enabled ? 'Yes' : 'No'}`);
            console.log(`   Capabilities: ${agent.capabilities.join(', ')}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Failed to check registry:', error);
  }
}

checkRegistry();