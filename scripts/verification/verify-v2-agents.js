/**
 * Verification Script for V2 Agents
 * Checks that all v2 agents have proper mathClient configuration
 */

const fs = require('fs');
const path = require('path');

const v2Agents = [
  'market-data-agent-v2.js',
  'news-assessment-hedge-agent-v2.js',
  'data-quality-agent-v2.js',
  'client-learning-agent-v2.js',
  'a2a-protocol-manager-v2.js',
  'api-gateway-agent-v2.js',
  'curriculum-learning-agent-v2.js',
  'ord-registry-manager-v2.js'
];

console.log('🔍 Verifying V2 Agent Math Client Configuration\n');

let allValid = true;

v2Agents.forEach(agentFile => {
  const filePath = path.join(__dirname, 'agents', agentFile);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for proper mathClient configuration
    const hasMathClient = content.includes('const mathClient = {');
    const hasBaseUrl = content.includes('baseUrl: process.env.VERCEL_URL');
    const hasCalculateEndpoint = content.includes('/api/functions/calculate');
    const hasErrorHandling = content.includes('if (!response.ok)');
    const hasStatusCheck = content.includes("if (result.status === 'error')");
    const hasBatchSupport = content.includes('async callBatch(requests)');
    
    const isValid = hasMathClient && hasBaseUrl && hasCalculateEndpoint && 
                   hasErrorHandling && hasStatusCheck && hasBatchSupport;
    
    if (isValid) {
      console.log(`✅ ${agentFile}`);
      console.log(`   - Math client: ${hasMathClient ? '✓' : '✗'}`);
      console.log(`   - Base URL config: ${hasBaseUrl ? '✓' : '✗'}`);
      console.log(`   - Calculate endpoint: ${hasCalculateEndpoint ? '✓' : '✗'}`);
      console.log(`   - Error handling: ${hasErrorHandling ? '✓' : '✗'}`);
      console.log(`   - Status checking: ${hasStatusCheck ? '✓' : '✗'}`);
      console.log(`   - Batch support: ${hasBatchSupport ? '✓' : '✗'}`);
    } else {
      console.log(`❌ ${agentFile} - Missing components`);
      allValid = false;
    }
    
    // Check intelligence rating
    const intelligenceMatch = content.match(/Intelligence Rating: (\d+)\/100/);
    if (intelligenceMatch) {
      console.log(`   - Intelligence: ${intelligenceMatch[1]}/100`);
    }
    
    console.log('');
    
  } catch (error) {
    console.error(`❌ Error reading ${agentFile}: ${error.message}`);
    allValid = false;
  }
});

console.log('📊 Summary:');
console.log('==========');
console.log(`Total agents checked: ${v2Agents.length}`);
console.log(`Status: ${allValid ? '✅ All agents properly configured' : '❌ Some agents need fixes'}`);

// Check if orchestrator exists
const orchestratorPath = path.join(__dirname, 'api/functions/orchestrator.js');
if (fs.existsSync(orchestratorPath)) {
  console.log('\n✅ Function orchestrator exists at api/functions/orchestrator.js');
} else {
  console.log('\n❌ Function orchestrator not found!');
}

// Check if calculate endpoint exists
const calculatePath = path.join(__dirname, 'api/functions/calculate.js');
if (fs.existsSync(calculatePath)) {
  console.log('✅ Calculate endpoint exists at api/functions/calculate.js');
} else {
  console.log('❌ Calculate endpoint not found!');
}

process.exit(allValid ? 0 : 1);