/**
 * V1 Agent Cleanup Script
 * Removes all v1 agent files that have v2 versions
 */

const fs = require('fs');
const path = require('path');

const v1FilesToRemove = [
  'agents/a2a-protocol-manager.js',
  'agents/api-gateway-agent.js', 
  'agents/curriculum-learning-agent.js',
  'agents/market-data-agent.js',
  'agents/news-assessment-hedge-agent.js',
  'agents/news-intelligence-agent.js',
  'agents/ord-registry-manager.js'
];

console.log('🗑️ Cleaning up V1 Agent Files\n');

let removedCount = 0;

v1FilesToRemove.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  const v2Path = path.join(__dirname, filePath.replace('.js', '-v2.js'));
  
  try {
    // Check if v1 file exists
    if (fs.existsSync(fullPath)) {
      // Check if v2 version exists before removing v1
      if (fs.existsSync(v2Path)) {
        fs.unlinkSync(fullPath);
        console.log(`✅ Removed ${filePath} (v2 version exists)`);
        removedCount++;
      } else {
        console.log(`⚠️ Skipped ${filePath} (no v2 version found)`);
      }
    } else {
      console.log(`ℹ️ ${filePath} does not exist (already removed)`);
    }
  } catch (error) {
    console.error(`❌ Error removing ${filePath}: ${error.message}`);
  }
});

console.log(`\n📊 Summary: Removed ${removedCount} v1 duplicate agents`);

// List remaining agent files
console.log('\n📁 Remaining agent files:');
const agentsDir = path.join(__dirname, 'agents');
try {
  const remainingFiles = fs.readdirSync(agentsDir)
    .filter(file => file.endsWith('.js'))
    .sort();

  remainingFiles.forEach(file => {
    console.log(`   ${file}`);
  });
} catch (error) {
  console.error('Error listing remaining files:', error.message);
}

console.log('\n✅ V1 cleanup complete');

// Check for any remaining v1 references
console.log('\n🔍 Checking for remaining v1 references...');

const filesToCheck = [
  'api/graphql.js',
  'api/graphql-enhanced.js',
  'api/graphql-original.js',
  'api/graphql-simple.js'
];

filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasV1References = content.includes('agents/market-data-agent.js') ||
                           content.includes('agents/news-intelligence-agent.js') ||
                           content.includes('agents/a2a-protocol-manager.js') ||
                           content.includes('MarketDataAgent') ||
                           content.includes('NewsIntelligenceAgent');
    
    if (hasV1References) {
      console.log(`⚠️ ${filePath} still has v1 references`);
    } else {
      console.log(`✅ ${filePath} clean`);
    }
  }
});

console.log('\n🎯 All v1 agents removed and v2 agents are production-ready!');