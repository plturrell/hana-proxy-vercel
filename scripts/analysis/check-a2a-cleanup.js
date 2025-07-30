import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function checkA2ACleanupStatus() {
  console.log('🔍 A2A REGISTRY CLEANUP STATUS CHECK');
  console.log('=====================================\n');

  const { data, count, error } = await supabase
    .from('a2a_agents')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('📊 Current Status:');
  console.log(`Total entries in a2a_agents: ${count}`);
  console.log('');

  // Analyze the data
  const autonomousAgents = data.filter(a => 
    a.agent_type === 'autonomous' || 
    (a.function_name === null && a.endpoint_url !== null)
  );

  const functions = data.filter(a => a.function_name !== null);

  console.log(`Autonomous agents: ${autonomousAgents.length}`);
  console.log(`Function entries: ${functions.length}`);

  // Expected autonomous agents
  const expectedAgents = [
    'analyzeData',
    'testModel',
    'fetchInfo',
    'modelControl',
    'searchData',
    'teachModel',
    'deployModel',
    'monitorPerformance',
    'customQuery'
  ];

  if (count === 9) {
    console.log('\n✅ CLEANUP SUCCESSFULLY COMPLETED!');
    console.log('Only 9 autonomous agents remain in the registry.\n');
    
    console.log('Remaining agents:');
    data.forEach(agent => {
      console.log(`  - ${agent.agent_name} (${agent.agent_type})`);
    });
  } else {
    console.log('\n❌ Cleanup NOT completed.');
    console.log(`Expected: 9 agents`);
    console.log(`Found: ${count} entries\n`);
    
    // Show breakdown
    console.log('Breakdown by agent_type:');
    const types = {};
    data.forEach(a => {
      types[a.agent_type] = (types[a.agent_type] || 0) + 1;
    });
    Object.entries(types).forEach(([type, cnt]) => {
      console.log(`  - ${type}: ${cnt}`);
    });

    // Check which expected agents are missing
    console.log('\nExpected agents status:');
    expectedAgents.forEach(name => {
      const found = data.find(a => a.agent_name === name || a.agent_id === name);
      console.log(`  - ${name}: ${found ? '✅ Found' : '❌ Missing'}`);
    });
  }

  // Show sample entries
  if (count > 0) {
    console.log('\nSample entries (first 5):');
    data.slice(0, 5).forEach(agent => {
      console.log(`  - ${agent.agent_name}: type=${agent.agent_type}, function=${agent.function_name || 'none'}`);
    });
  }
}

checkA2ACleanupStatus().catch(console.error);