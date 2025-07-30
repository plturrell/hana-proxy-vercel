import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function checkExistingAgents() {
  console.log('🔍 CHECKING FOR EXISTING AGENTS');
  console.log('================================\n');

  // Check agent-related tables
  const { data: tables } = await supabase.rpc('sql_safe', {
    query_text: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%agent%' OR table_name = 'a2a_registry') ORDER BY table_name"
  });

  console.log('📋 Agent-related tables:');
  tables?.[0]?.result?.forEach(t => console.log('  -', t.table_name));

  // Check a2a_agents table
  console.log('\n🤖 Checking a2a_agents table:');
  const { data: a2aAgents, error: a2aError } = await supabase
    .from('a2a_agents')
    .select('*')
    .order('name');

  if (!a2aError && a2aAgents && a2aAgents.length > 0) {
    console.log(`\nFound ${a2aAgents.length} agents in A2A Registry:\n`);
    
    // Group agents by type
    const agentsByType = {};
    a2aAgents.forEach(agent => {
      const type = agent.type || 'unknown';
      if (!agentsByType[type]) agentsByType[type] = [];
      agentsByType[type].push(agent);
    });

    // Display agents by type
    Object.entries(agentsByType).forEach(([type, agents]) => {
      console.log(`\n${type.toUpperCase()} AGENTS:`);
      agents.forEach(agent => {
        console.log(`  🤖 ${agent.name}`);
        if (agent.metadata?.capabilities) {
          console.log(`     Capabilities: ${agent.metadata.capabilities.join(', ')}`);
        }
        if (agent.address) {
          console.log(`     Blockchain: ${agent.address}`);
        }
      });
    });

    // Look for news and market data agents
    console.log('\n📊 RELEVANT AGENTS FOR NEWS & MARKET ANALYSIS:');
    
    const relevantAgents = a2aAgents.filter(agent => {
      if (!agent.name) return false;
      const name = agent.name.toLowerCase();
      return name.includes('news') ||
        name.includes('market') ||
        name.includes('sentiment') ||
        name.includes('analysis') ||
        name.includes('regime') ||
        name.includes('volatility') ||
        agent.metadata?.capabilities?.some(cap => 
          cap.toLowerCase().includes('news') || 
          cap.toLowerCase().includes('market') ||
          cap.toLowerCase().includes('sentiment')
        );
    });

    if (relevantAgents.length > 0) {
      relevantAgents.forEach(agent => {
        console.log(`\n  ✅ ${agent.name} (${agent.type})`);
        console.log(`     ID: ${agent.id}`);
        console.log(`     Capabilities: ${agent.metadata?.capabilities?.join(', ') || 'none'}`);
        console.log(`     Status: ${agent.status}`);
      });
    } else {
      console.log('  ❌ No specific news or market analysis agents found');
      console.log('  💡 We should create or configure agents for:');
      console.log('     - News Sentiment Analysis');
      console.log('     - Market Data Technical Analysis');
      console.log('     - Risk Assessment from News Events');
    }
  } else {
    console.log('  ❌ No agents found in A2A Registry');
  }
}

checkExistingAgents().catch(console.error);