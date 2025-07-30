const fs = require('fs');
const path = require('path');

const agentsDir = path.join(__dirname, 'agents');
const v2Agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('-v2.js'));

console.log('V2 AGENT COMPLIANCE REPORT');
console.log('==========================\n');

const results = [];

v2Agents.forEach(agentFile => {
  const filePath = path.join(agentsDir, agentFile);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const result = {
    name: agentFile,
    intelligence: null,
    hasA2ARegistration: false,
    hasORDRegistration: false,
    hasMathematicalClient: false,
    hasPerplexity: false,
    hasGrok: false,
    hasSimplifyOutput: false,
    hasErrorHandling: false,
    extendsA2AAgent: false,
    issues: []
  };
  
  // Check intelligence rating
  const intelligenceMatch = content.match(/Intelligence\s+Rating:\s*(\d+)\/100/i);
  if (intelligenceMatch) {
    result.intelligence = parseInt(intelligenceMatch[1]);
    if (result.intelligence < 88 || result.intelligence > 95) {
      result.issues.push(`Intelligence rating ${result.intelligence} outside range 88-95`);
    }
  } else {
    result.issues.push('No intelligence rating found');
  }
  
  // Check required methods
  result.hasA2ARegistration = /async\s+registerWithA2A\s*\(/.test(content);
  result.hasORDRegistration = /async\s+registerWithORD\s*\(/.test(content);
  result.hasSimplifyOutput = /simplify\w*Output\s*\(/.test(content);
  
  // Check integrations
  result.hasMathematicalClient = /mathematicalClient|MathematicalClient/.test(content);
  result.hasPerplexity = /perplexityClient|PERPLEXITY_API_KEY/.test(content);
  result.hasGrok = /grokClient|GROK_API_KEY|XAI_API_KEY/.test(content);
  
  // Check structure
  result.extendsA2AAgent = /extends\s+A2AAgent/.test(content);
  result.hasErrorHandling = /try\s*{[\s\S]*?}\s*catch/.test(content);
  
  // Add to issues
  if (!result.hasA2ARegistration) result.issues.push('Missing registerWithA2A method');
  if (!result.hasORDRegistration) result.issues.push('Missing registerWithORD method');
  if (!result.hasSimplifyOutput) result.issues.push('Missing simplifyOutput method');
  if (!result.hasMathematicalClient) result.issues.push('Missing mathematical client integration');
  if (!result.hasPerplexity) result.issues.push('Missing Perplexity AI integration');
  if (!result.hasGrok) result.issues.push('Missing Grok AI integration');
  if (!result.extendsA2AAgent) result.issues.push('Does not extend A2AAgent');
  if (!result.hasErrorHandling) result.issues.push('No error handling found');
  
  results.push(result);
});

// Print summary
console.log(`Total v2 agents: ${v2Agents.length}`);
console.log(`Fully compliant: ${results.filter(r => r.issues.length === 0).length}`);
console.log(`Average intelligence: ${(results.reduce((sum, r) => sum + (r.intelligence || 0), 0) / results.filter(r => r.intelligence).length).toFixed(1)}\n`);

// Print table
console.log('Agent                           | Int | A2A | ORD | Math | Perp | Grok | Simp | Issues');
console.log('--------------------------------|-----|-----|-----|------|------|------|------|-------');

results.forEach(r => {
  const name = r.name.padEnd(30);
  const int = r.intelligence ? r.intelligence.toString().padStart(3) : '---';
  const a2a = r.hasA2ARegistration ? ' ✓ ' : ' ✗ ';
  const ord = r.hasORDRegistration ? ' ✓ ' : ' ✗ ';
  const math = r.hasMathematicalClient ? '  ✓  ' : '  ✗  ';
  const perp = r.hasPerplexity ? '  ✓  ' : '  ✗  ';
  const grok = r.hasGrok ? '  ✓  ' : '  ✗  ';
  const simp = r.hasSimplifyOutput ? '  ✓  ' : '  ✗  ';
  const issues = r.issues.length;
  
  console.log(`${name} | ${int} | ${a2a} | ${ord} | ${math} | ${perp} | ${grok} | ${simp} | ${issues}`);
});

// Print detailed issues
console.log('\n\nDETAILED ISSUES:');
console.log('================\n');

results.forEach(r => {
  if (r.issues.length > 0) {
    console.log(`${r.name}:`);
    r.issues.forEach(issue => console.log(`  - ${issue}`));
    console.log('');
  }
});

// Print compliant agents
const compliant = results.filter(r => r.issues.length === 0);
if (compliant.length > 0) {
  console.log('\nFULLY COMPLIANT AGENTS:');
  console.log('======================');
  compliant.forEach(r => console.log(`✓ ${r.name} (Intelligence: ${r.intelligence}/100)`));
}