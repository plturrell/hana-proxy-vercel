/**
 * Audit All Analytics Agents
 * Classify each as True A2A Agent vs Computational Utility
 */

import fetch from 'node-fetch';

const BASE_URL = 'https://hana-proxy-vercel.vercel.app';

// A2A Agent Classification Criteria
const A2A_CRITERIA = {
  AUTONOMY: 'Can make independent decisions without human intervention',
  GOALS: 'Has specific objectives it actively pursues',
  PERSONALITY: 'Exhibits consistent behavioral patterns',
  CONTRACTS: 'Can negotiate and form agreements with other agents',
  STATE_MANAGEMENT: 'Maintains context and memory between interactions',
  LEARNING: 'Adapts behavior based on experience',
  COMMUNICATION: 'Initiates communication with other agents'
};

// Classification function
function classifyAgent(agent) {
  const id = agent.agent_id;
  const name = agent.agent_name;
  const capabilities = agent.capabilities;
  const config = agent.connection_config;
  
  let score = 0;
  let reasoning = [];
  
  // Check for autonomy indicators
  if (id.includes('detection') || id.includes('optimization') || id.includes('decision')) {
    score += 2;
    reasoning.push('Shows decision-making capability');
  }
  
  // Check for goals
  if (config.goals && config.goals.length > 0) {
    score += 2;
    reasoning.push(`Has defined goals: ${config.goals.join(', ')}`);
  }
  
  // Check for personality
  if (config.personality && config.personality !== 'collaborative') {
    score += 1;
    reasoning.push(`Has distinct personality: ${config.personality}`);
  }
  
  // Check for learning/adaptation
  if (id.includes('learning') || id.includes('adaptive') || id.includes('neural')) {
    score += 2;
    reasoning.push('Shows learning/adaptation capability');
  }
  
  // Check for strategic behavior
  if (id.includes('strategy') || id.includes('regime') || id.includes('portfolio')) {
    score += 1;
    reasoning.push('Involves strategic decision-making');
  }
  
  // Pure mathematical functions (negative score)
  if (id.includes('ratio') || id.includes('correlation') || id.includes('index') || 
      name.includes('Calculator') || name.includes('Analyzer') && !id.includes('regime')) {
    score -= 2;
    reasoning.push('Appears to be pure mathematical calculation');
  }
  
  // Determine classification
  let classification;
  if (score >= 3) {
    classification = 'TRUE_A2A_AGENT';
  } else if (score >= 1) {
    classification = 'BORDERLINE';
  } else {
    classification = 'COMPUTATIONAL_UTILITY';
  }
  
  return {
    agent_id: id,
    name: name,
    classification: classification,
    score: score,
    reasoning: reasoning,
    capabilities: Array.isArray(capabilities) ? capabilities : 
                  (capabilities && capabilities.domains ? capabilities.domains : []),
    goals: config.goals || [],
    personality: config.personality || 'none'
  };
}

async function auditAllAnalyticsAgents() {
  console.log('🔍 Auditing All Analytics Agents');
  console.log('='.repeat(60));
  
  try {
    // Get all agents
    const response = await fetch(`${BASE_URL}/api/a2a-agent-registry?action=list`);
    const result = await response.json();
    
    if (!result.success) {
      console.log('❌ Failed to get agents:', result.error);
      return;
    }
    
    // Filter analytics agents
    const analyticsAgents = result.agents.filter(agent => 
      agent.agent_id.startsWith('finsight.analytics')
    );
    
    console.log(`📊 Found ${analyticsAgents.length} analytics agents\n`);
    
    // Classify each agent
    const classifications = analyticsAgents.map(classifyAgent);
    
    // Group by classification
    const trueAgents = classifications.filter(c => c.classification === 'TRUE_A2A_AGENT');
    const borderline = classifications.filter(c => c.classification === 'BORDERLINE');
    const utilities = classifications.filter(c => c.classification === 'COMPUTATIONAL_UTILITY');
    
    // Report results
    console.log('🤖 TRUE A2A AGENTS:');
    console.log('='.repeat(30));
    trueAgents.forEach(agent => {
      console.log(`✅ ${agent.name}`);
      console.log(`   ID: ${agent.agent_id}`);
      console.log(`   Score: ${agent.score}`);
      console.log(`   Goals: ${agent.goals.join(', ') || 'none'}`);
      console.log(`   Personality: ${agent.personality}`);
      console.log(`   Reasoning: ${agent.reasoning.join('; ')}`);
      console.log('');
    });
    
    console.log('⚠️  BORDERLINE CASES:');
    console.log('='.repeat(30));
    borderline.forEach(agent => {
      console.log(`⚠️  ${agent.name}`);
      console.log(`   ID: ${agent.agent_id}`);
      console.log(`   Score: ${agent.score}`);
      console.log(`   Reasoning: ${agent.reasoning.join('; ')}`);
      console.log('');
    });
    
    console.log('🔧 COMPUTATIONAL UTILITIES:');
    console.log('='.repeat(30));
    utilities.forEach(agent => {
      console.log(`🔧 ${agent.name}`);
      console.log(`   ID: ${agent.agent_id}`);
      console.log(`   Score: ${agent.score}`);
      console.log(`   Reasoning: ${agent.reasoning.join('; ')}`);
      console.log('');
    });
    
    console.log('📊 SUMMARY:');
    console.log('='.repeat(30));
    console.log(`True A2A Agents: ${trueAgents.length}`);
    console.log(`Borderline Cases: ${borderline.length}`);
    console.log(`Computational Utilities: ${utilities.length}`);
    console.log(`Total Analyzed: ${classifications.length}`);
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('='.repeat(30));
    console.log('1. Keep only TRUE A2A AGENTS in the A2A registry');
    console.log('2. Move COMPUTATIONAL UTILITIES to a separate function registry');
    console.log('3. Evaluate BORDERLINE cases individually');
    console.log('4. Add contracts and negotiation capabilities to true agents');
    console.log('5. Implement agent-to-agent discovery and communication');
    
    // Export results for further processing
    return {
      trueAgents,
      borderline,
      utilities,
      total: classifications.length
    };
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
  }
}

// Run the audit
auditAllAnalyticsAgents()
  .then(results => {
    if (results) {
      console.log('\n✅ Audit completed successfully');
    }
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });