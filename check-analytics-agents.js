// Check if the 32 analytics agents exist in the database
const BASE_URL = 'https://hana-proxy-vercel-1hjwde39b-plturrells-projects.vercel.app';

async function checkAnalyticsAgents() {
  try {
    console.log('🔍 Checking for Analytics Agents...\n');
    
    // First check registry stats
    const statsResponse = await fetch(`${BASE_URL}/api/a2a-blockchain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'get_registry_stats'
      })
    });
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('Current Registry Stats:');
      console.log(`Total Agents: ${stats.stats.total_agents}`);
      console.log(`Agent Types:`, stats.stats.agent_type_distribution);
      console.log('');
    }
    
    // Try to discover analytics agents
    const discoverResponse = await fetch(`${BASE_URL}/api/a2a-blockchain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'discover_agents',
        type: 'analytics',
        limit: 50
      })
    });
    
    if (discoverResponse.ok) {
      const data = await discoverResponse.json();
      console.log(`Found ${data.agents?.length || 0} analytics agents`);
      
      if (data.agents && data.agents.length > 0) {
        console.log('\nAnalytics Agents:');
        data.agents.forEach((agent, index) => {
          console.log(`${index + 1}. ${agent.name} (${agent.agent_id})`);
        });
      }
    }
    
    // Expected analytics agents
    const expectedAgents = [
      'pearson-correlation', 'value-at-risk', 'sharpe-ratio', 'portfolio-volatility',
      'portfolio-optimization', 'moving-average', 'rsi-calculator', 'macd-analyzer',
      'bollinger-bands', 'monte-carlo', 'black-scholes', 'bond-duration',
      'bond-convexity', 'sortino-ratio', 'treynor-ratio', 'information-ratio',
      'jensen-alpha', 'var-historical', 'copula-correlation', 'garch-volatility',
      'cointegration', 'granger-causality', 'regime-switching', 'jump-diffusion',
      'heston-model', 'vasicek-model', 'nelson-siegel', 'credit-migration',
      'merton-model', 'hull-white', 'factor-analysis', 'liquidity-metrics'
    ];
    
    console.log(`\n📊 Expected: 32 analytics agents`);
    console.log(`📊 Found: ${data.agents?.length || 0} analytics agents`);
    
    if ((data.agents?.length || 0) < 32) {
      console.log('\n⚠️  Missing analytics agents! Run create-analytics-agents.sql to create them.');
    } else {
      console.log('\n✅ All analytics agents present!');
    }
    
  } catch (error) {
    console.error('Error checking agents:', error);
  }
}

checkAnalyticsAgents();