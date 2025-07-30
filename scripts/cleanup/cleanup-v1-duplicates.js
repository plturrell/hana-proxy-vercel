/**
 * Cleanup Script to Remove V1 Agent Duplicates
 * Safely removes v1 agents that have v2 versions
 */

const fs = require('fs');
const path = require('path');

const v1DuplicatesToRemove = [
  'a2a-protocol-manager.js',
  'api-gateway-agent.js', 
  'curriculum-learning-agent.js',
  'market-data-agent.js',
  'news-assessment-hedge-agent.js',
  'ord-registry-manager.js'
];

console.log('🗑️ Cleaning up V1 Agent Duplicates\n');

let removedCount = 0;

v1DuplicatesToRemove.forEach(filename => {
  const v1Path = path.join(__dirname, 'agents', filename);
  const v2Path = path.join(__dirname, 'agents', filename.replace('.js', '-v2.js'));
  
  try {
    // Check if v1 file exists
    if (fs.existsSync(v1Path)) {
      // Check if v2 version exists before removing v1
      if (fs.existsSync(v2Path)) {
        fs.unlinkSync(v1Path);
        console.log(`✅ Removed ${filename} (v2 version exists)`);
        removedCount++;
      } else {
        console.log(`⚠️ Skipped ${filename} (no v2 version found)`);
      }
    } else {
      console.log(`ℹ️ ${filename} does not exist (already removed)`);
    }
  } catch (error) {
    console.error(`❌ Error removing ${filename}: ${error.message}`);
  }
});

console.log(`\n📊 Summary: Removed ${removedCount} v1 duplicate agents`);

// List remaining agents
console.log('\n📁 Remaining agents:');
const agentsDir = path.join(__dirname, 'agents');
const remainingFiles = fs.readdirSync(agentsDir)
  .filter(file => file.endsWith('.js'))
  .sort();

remainingFiles.forEach(file => {
  console.log(`   ${file}`);
});

console.log('\n✅ Cleanup complete');