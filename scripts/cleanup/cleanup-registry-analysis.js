/**
 * Registry Cleanup Analysis
 * Identify true A2A agents vs computational functions
 */

import fetch from 'node-fetch';

const BASE_URL = 'https://hana-proxy-vercel.vercel.app';

async function analyzeRegistry() {
  console.log('🔍 ANALYZING A2A REGISTRY FOR CLEANUP');
  console.log('='.repeat(60));
  
  const response = await fetch(`${BASE_URL}/api/a2a-agent-registry?action=list`);
  const result = await response.json();
  
  if (!result.success) {
    console.log('❌ Failed to get registry data');
    return;
  }
  
  const agents = result.agents || [];
  console.log(`📊 Total registrations: ${agents.length}`);
  
  // Categorize agents
  const categories = {
    trueAgents: [],
    computationalFunctions: [],
    mlAgents: [],
    dataAgents: [],
    nlpAgents: [],
    testAgents: [],
    unclear: []
  };
  
  agents.forEach(agent => {
    const id = agent.agent_id;
    const name = agent.agent_name;
    const description = agent.description;
    const personality = agent.connection_config?.personality;
    const goals = agent.connection_config?.goals || [];
    const votingPower = agent.connection_config?.voting_power || 0;
    
    // Classify based on patterns
    if (id.includes('test_agent')) {
      categories.testAgents.push({ id, name, reason: 'Test agent' });
    }
    else if (id.startsWith('finsight.ml.')) {
      categories.mlAgents.push({ id, name, reason: 'ML/algorithm agent', autonomous: hasAutonomyIndicators(agent) });
    }
    else if (id.startsWith('finsight.data.')) {
      categories.dataAgents.push({ id, name, reason: 'Data management agent', autonomous: hasAutonomyIndicators(agent) });
    }
    else if (id.startsWith('finsight.nlp.')) {
      categories.nlpAgents.push({ id, name, reason: 'NLP processing agent', autonomous: hasAutonomyIndicators(agent) });
    }
    else if (isComputationalFunction(agent)) {
      categories.computationalFunctions.push({ 
        id, 
        name, 
        reason: 'Pure calculation function',
        functionType: getFunctionType(name)
      });
    }
    else if (isTrueAgent(agent)) {
      categories.trueAgents.push({ 
        id, 
        name, 
        reason: 'Has autonomy indicators',
        personality: personality || 'none',
        goals: goals.join(', '),
        votingPower
      });
    }
    else {
      categories.unclear.push({ id, name, reason: 'Unclear classification' });
    }
  });
  
  // Display results
  console.log('\n🤖 TRUE AUTONOMOUS AGENTS:');
  console.log('-'.repeat(40));
  categories.trueAgents.forEach(agent => {
    console.log(`  ✅ ${agent.name}`);
    console.log(`     ID: ${agent.id}`);
    console.log(`     Personality: ${agent.personality}`);
    console.log(`     Goals: ${agent.goals}`);
    console.log(`     Voting Power: ${agent.votingPower}`);
    console.log('');
  });
  
  console.log('🔧 COMPUTATIONAL FUNCTIONS (TO REMOVE):');
  console.log('-'.repeat(40));
  const functionsByType = {};
  categories.computationalFunctions.forEach(func => {
    if (!functionsByType[func.functionType]) {
      functionsByType[func.functionType] = [];
    }
    functionsByType[func.functionType].push(func);
  });
  
  Object.entries(functionsByType).forEach(([type, functions]) => {
    console.log(`\n  📊 ${type}:`);
    functions.forEach(func => {
      console.log(`    🗑️  ${func.name} (${func.id})`);
    });
  });
  
  console.log('\n🧠 ML/ALGORITHM AGENTS:');
  console.log('-'.repeat(40));
  categories.mlAgents.forEach(agent => {
    const status = agent.autonomous ? '✅ Keep' : '🔄 Evaluate';
    console.log(`  ${status} ${agent.name} (${agent.id})`);
  });
  
  console.log('\n📁 DATA/NLP AGENTS:');
  console.log('-'.repeat(40));
  [...categories.dataAgents, ...categories.nlpAgents].forEach(agent => {
    const status = agent.autonomous ? '✅ Keep' : '🔄 Evaluate';
    console.log(`  ${status} ${agent.name} (${agent.id})`);
  });
  
  if (categories.testAgents.length > 0) {
    console.log('\n🧪 TEST AGENTS (TO REMOVE):');
    console.log('-'.repeat(40));
    categories.testAgents.forEach(agent => {
      console.log(`  🗑️  ${agent.name} (${agent.id})`);
    });
  }
  
  if (categories.unclear.length > 0) {
    console.log('\n❓ UNCLEAR CLASSIFICATION:');
    console.log('-'.repeat(40));
    categories.unclear.forEach(agent => {
      console.log(`  ❓ ${agent.name} (${agent.id})`);
    });
  }
  
  // Summary
  console.log('\n📊 CLEANUP SUMMARY:');
  console.log('='.repeat(40));
  console.log(`Total Registrations: ${agents.length}`);
  console.log(`True Autonomous Agents: ${categories.trueAgents.length} (KEEP)`);
  console.log(`Computational Functions: ${categories.computationalFunctions.length} (REMOVE)`);
  console.log(`ML Agents: ${categories.mlAgents.length} (EVALUATE)`);
  console.log(`Data/NLP Agents: ${categories.dataAgents.length + categories.nlpAgents.length} (EVALUATE)`);
  console.log(`Test Agents: ${categories.testAgents.length} (REMOVE)`);
  console.log(`Unclear: ${categories.unclear.length}`);
  
  const toRemove = categories.computationalFunctions.length + categories.testAgents.length;
  const toEvaluate = categories.mlAgents.length + categories.dataAgents.length + categories.nlpAgents.length;
  
  console.log(`\n🎯 RECOMMENDED ACTIONS:`);
  console.log(`  ✅ Keep: ${categories.trueAgents.length} true autonomous agents`);
  console.log(`  🗑️  Remove: ${toRemove} computational functions and test agents`);
  console.log(`  🔄 Evaluate: ${toEvaluate} ML/data agents for autonomy`);
  
  return {
    total: agents.length,
    trueAgents: categories.trueAgents,
    toRemove: [...categories.computationalFunctions, ...categories.testAgents],
    toEvaluate: [...categories.mlAgents, ...categories.dataAgents, ...categories.nlpAgents],
    unclear: categories.unclear
  };
}

function hasAutonomyIndicators(agent) {
  const config = agent.connection_config || {};
  const hasGoals = config.goals && config.goals.length > 0;
  const hasPersonality = config.personality && config.personality !== 'none';
  const hasVotingPower = config.voting_power > 0;
  const hasWallet = config.wallet_address;
  
  return hasGoals || hasPersonality || hasVotingPower || hasWallet;
}

function isTrueAgent(agent) {
  const autonomyIndicators = hasAutonomyIndicators(agent);
  const description = agent.description.toLowerCase();
  
  // Look for strategic/decision-making language
  const strategicKeywords = [
    'optimizes', 'identifies', 'manages', 'conducts', 'analyzes sources',
    'forecasts', 'detects anomalies', 'implements', 'optimizer', 'framework',
    'detector', 'modeler', 'engine', 'allocator', 'simulator'
  ];
  
  const hasStrategicLanguage = strategicKeywords.some(keyword => 
    description.includes(keyword)
  );
  
  // Exclude pure calculators
  const calculatorKeywords = ['calculates', 'measures', 'calculator', 'generates'];
  const isPureCalculator = calculatorKeywords.some(keyword => 
    description.includes(keyword) && !hasStrategicLanguage
  );
  
  return autonomyIndicators && hasStrategicLanguage && !isPureCalculator;
}

function isComputationalFunction(agent) {
  const description = agent.description.toLowerCase();
  const name = agent.agent_name.toLowerCase();
  
  const functionKeywords = [
    'calculates', 'calculator', 'measures', 'generates', 'computes',
    'ratio', 'correlation', 'index', 'metrics', 'indicators'
  ];
  
  const isFunctionBased = functionKeywords.some(keyword => 
    description.includes(keyword) || name.includes(keyword)
  );
  
  // Also check if it lacks autonomy indicators
  const lacksAutonomy = !hasAutonomyIndicators(agent);
  
  return isFunctionBased && lacksAutonomy;
}

function getFunctionType(name) {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('ratio') || lowerName.includes('sharpe') || lowerName.includes('treynor') || lowerName.includes('sortino') || lowerName.includes('information') || lowerName.includes('calmar') || lowerName.includes('omega')) {
    return 'Performance Ratios';
  }
  if (lowerName.includes('correlation') || lowerName.includes('matrix')) {
    return 'Statistical Functions';
  }
  if (lowerName.includes('risk') || lowerName.includes('var') || lowerName.includes('drawdown') || lowerName.includes('volatility') || lowerName.includes('ulcer')) {
    return 'Risk Metrics';
  }
  if (lowerName.includes('technical') || lowerName.includes('indicators')) {
    return 'Technical Analysis';
  }
  if (lowerName.includes('liquidity') || lowerName.includes('metrics')) {
    return 'Financial Metrics';
  }
  if (lowerName.includes('kelly') || lowerName.includes('hurst') || lowerName.includes('black') || lowerName.includes('monte')) {
    return 'Advanced Analytics';
  }
  
  return 'General Functions';
}

// Run analysis
analyzeRegistry()
  .then(result => {
    console.log('\n✅ Registry analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  });