#!/usr/bin/env node

/**
 * V2 Agent Compliance Analyzer
 * Checks all v2 agents for consistency, compliance, and production readiness
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

// Define compliance criteria
const COMPLIANCE_CHECKS = {
  intelligenceRating: {
    pattern: /Intelligence\s+Rating:\s*(\d+)\/100/i,
    range: { min: 88, max: 95 },
    description: 'Intelligence rating consistency (88-95/100)'
  },
  a2aRegistration: {
    pattern: /async\s+registerWithA2A\s*\(/,
    required: true,
    description: 'A2A protocol registration method'
  },
  ordRegistration: {
    pattern: /async\s+registerWithORD\s*\(/,
    required: true,
    description: 'ORD registry registration method'
  },
  mathematicalClient: {
    pattern: /mathematicalClient|MathematicalClient/,
    required: true,
    description: 'Mathematical function integration'
  },
  perplexityIntegration: {
    pattern: /perplexityClient|PERPLEXITY_API_KEY/,
    required: true,
    description: 'Perplexity AI integration'
  },
  grokIntegration: {
    pattern: /grokClient|GROK_API_KEY|XAI_API_KEY/,
    required: true,
    description: 'Grok AI integration'
  },
  simplifyOutput: {
    pattern: /simplify\w*Output\s*\(/,
    required: true,
    description: 'Output simplification methods'
  },
  errorHandling: {
    pattern: /try\s*{[\s\S]*?}\s*catch\s*\([\s\S]*?\)\s*{/,
    required: true,
    description: 'Production-ready error handling'
  },
  supabaseIntegration: {
    pattern: /supabase|SUPABASE_URL/i,
    required: true,
    description: 'Supabase database integration'
  },
  a2aAgentExtension: {
    pattern: /extends\s+A2AAgent|class\s+\w+\s+extends\s+A2AAgent/,
    required: true,
    description: 'Extends A2AAgent base class'
  },
  asyncMethods: {
    pattern: /async\s+\w+\s*\([^)]*\)\s*{/g,
    minCount: 5,
    description: 'Sufficient async methods for production'
  },
  workflowCompliance: {
    pattern: /workflow|processDefinition|BPMN/i,
    required: true,
    description: 'BPMN workflow compliance'
  }
};

// Analyze a single agent file
async function analyzeAgent(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const fileName = filePath.split('/').pop();
  
  const results = {
    fileName,
    compliant: true,
    issues: [],
    features: {},
    intelligenceRating: null,
    lineCount: content.split('\n').length
  };

  // Check each compliance requirement
  for (const [check, criteria] of Object.entries(COMPLIANCE_CHECKS)) {
    const matches = content.match(criteria.pattern);
    
    if (criteria.required && !matches) {
      results.compliant = false;
      results.issues.push(`Missing: ${criteria.description}`);
      results.features[check] = false;
    } else if (criteria.minCount && (!matches || matches.length < criteria.minCount)) {
      results.compliant = false;
      results.issues.push(`Insufficient: ${criteria.description} (found ${matches ? matches.length : 0}, need ${criteria.minCount})`);
      results.features[check] = false;
    } else if (criteria.range && matches) {
      const value = parseInt(matches[1]);
      if (value < criteria.range.min || value > criteria.range.max) {
        results.compliant = false;
        results.issues.push(`Out of range: ${criteria.description} (found ${value}, expected ${criteria.range.min}-${criteria.range.max})`);
      }
      results.intelligenceRating = value;
      results.features[check] = true;
    } else {
      results.features[check] = !!matches;
    }
  }

  // Additional checks for consistency
  
  // Check for proper imports
  const hasProperImports = /import\s+{[^}]*A2AAgent[^}]*}\s+from/i.test(content);
  if (!hasProperImports) {
    results.issues.push('Missing proper A2AAgent import');
    results.compliant = false;
  }

  // Check for production patterns
  const hasConsoleError = /console\.error\(/g.test(content);
  const hasConsoleLog = /console\.log\(/g.test(content);
  const hasDebugMode = /debug|DEBUG/i.test(content);
  
  if (!hasConsoleError) {
    results.issues.push('No console.error for production error logging');
  }
  
  // Check for sensitive data handling
  const hasEnvVars = /process\.env\./g.test(content);
  if (!hasEnvVars) {
    results.issues.push('No environment variable usage detected');
  }

  // Extract key methods
  const methodMatches = content.matchAll(/async\s+(\w+)\s*\([^)]*\)\s*{/g);
  results.methods = Array.from(methodMatches).map(m => m[1]);

  // Check for mathematical functions
  const mathFunctions = content.match(/mathematicalClient\.\w+/g) || [];
  results.mathFunctions = [...new Set(mathFunctions.map(f => f.split('.')[1]))];

  return results;
}

// Generate compliance report
async function generateReport() {
  const agentsDir = '/Users/apple/projects/finsightexperience_perplexity/hana-proxy-vercel/agents';
  const files = await readdir(agentsDir);
  const v2Agents = files.filter(f => f.endsWith('-v2.js'));
  
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('                    V2 AGENT COMPLIANCE ANALYSIS REPORT                ');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`\nAnalyzing ${v2Agents.length} v2 agents...\n`);

  const results = [];
  
  for (const agent of v2Agents) {
    const filePath = join(agentsDir, agent);
    const analysis = await analyzeAgent(filePath);
    results.push(analysis);
  }

  // Summary statistics
  const compliantAgents = results.filter(r => r.compliant);
  const intelligenceRatings = results.filter(r => r.intelligenceRating).map(r => r.intelligenceRating);
  const avgIntelligence = intelligenceRatings.reduce((a, b) => a + b, 0) / intelligenceRatings.length;

  console.log('SUMMARY STATISTICS');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log(`Total v2 Agents: ${v2Agents.length}`);
  console.log(`Fully Compliant: ${compliantAgents.length} (${(compliantAgents.length / v2Agents.length * 100).toFixed(1)}%)`);
  console.log(`Average Intelligence Rating: ${avgIntelligence.toFixed(1)}/100`);
  console.log(`Intelligence Range: ${Math.min(...intelligenceRatings)} - ${Math.max(...intelligenceRatings)}`);

  // Feature compliance matrix
  console.log('\n\nFEATURE COMPLIANCE MATRIX');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('Agent Name                      | A2A | ORD | Math | Perp | Grok | Simp | Work |');
  console.log('────────────────────────────────┼─────┼─────┼──────┼──────┼──────┼──────┼──────┤');
  
  for (const result of results) {
    const name = result.fileName.padEnd(30);
    const a2a = result.features.a2aRegistration ? ' ✓ ' : ' ✗ ';
    const ord = result.features.ordRegistration ? ' ✓ ' : ' ✗ ';
    const math = result.features.mathematicalClient ? ' ✓  ' : ' ✗  ';
    const perp = result.features.perplexityIntegration ? ' ✓  ' : ' ✗  ';
    const grok = result.features.grokIntegration ? ' ✓  ' : ' ✗  ';
    const simp = result.features.simplifyOutput ? ' ✓  ' : ' ✗  ';
    const work = result.features.workflowCompliance ? ' ✓  ' : ' ✗  ';
    
    console.log(`${name} │ ${a2a} │ ${ord} │ ${math} │ ${perp} │ ${grok} │ ${simp} │ ${work} │`);
  }

  // Detailed agent analysis
  console.log('\n\nDETAILED AGENT ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════════════');
  
  for (const result of results) {
    console.log(`\n${result.fileName}`);
    console.log('─────────────────────────────────────────────────────────────────────');
    console.log(`Status: ${result.compliant ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}`);
    console.log(`Intelligence Rating: ${result.intelligenceRating || 'NOT FOUND'}/100`);
    console.log(`Lines of Code: ${result.lineCount}`);
    console.log(`Async Methods: ${result.methods.length}`);
    
    if (result.mathFunctions.length > 0) {
      console.log(`Mathematical Functions: ${result.mathFunctions.join(', ')}`);
    }
    
    if (result.issues.length > 0) {
      console.log('\nIssues Found:');
      result.issues.forEach(issue => console.log(`  • ${issue}`));
    }
    
    console.log('\nKey Methods:');
    result.methods.slice(0, 8).forEach(method => console.log(`  • ${method}()`));
    if (result.methods.length > 8) {
      console.log(`  ... and ${result.methods.length - 8} more`);
    }
  }

  // Production readiness assessment
  console.log('\n\nPRODUCTION READINESS ASSESSMENT');
  console.log('═══════════════════════════════════════════════════════════════════════');
  
  const productionReady = results.filter(r => 
    r.compliant && 
    r.features.errorHandling && 
    r.features.supabaseIntegration &&
    r.methods.length >= 5
  );
  
  console.log(`\nProduction Ready: ${productionReady.length}/${v2Agents.length} agents`);
  console.log('\nProduction Ready Agents:');
  productionReady.forEach(agent => {
    console.log(`  ✓ ${agent.fileName} (Intelligence: ${agent.intelligenceRating}/100)`);
  });
  
  console.log('\nAgents Requiring Fixes:');
  results.filter(r => !productionReady.includes(r)).forEach(agent => {
    console.log(`  ✗ ${agent.fileName} - ${agent.issues.length} issues`);
  });

  // Consistency analysis
  console.log('\n\nCONSISTENCY ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════════════');
  
  // Check for consistent patterns
  const allMethods = new Set();
  results.forEach(r => r.methods.forEach(m => allMethods.add(m)));
  
  const commonMethods = Array.from(allMethods).filter(method => 
    results.filter(r => r.methods.includes(method)).length >= v2Agents.length * 0.6
  );
  
  console.log('\nCommon Methods Across Agents (60%+ coverage):');
  commonMethods.forEach(method => {
    const coverage = results.filter(r => r.methods.includes(method)).length;
    console.log(`  • ${method}() - found in ${coverage}/${v2Agents.length} agents`);
  });

  // Final recommendations
  console.log('\n\nFINAL RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════════════════════');
  
  if (compliantAgents.length === v2Agents.length) {
    console.log('✓ ALL AGENTS ARE FULLY COMPLIANT - Ready for production deployment');
  } else {
    console.log('⚠ COMPLIANCE ISSUES DETECTED - Fix required before deployment');
    console.log('\nPriority Fixes:');
    
    const criticalIssues = new Map();
    results.filter(r => !r.compliant).forEach(r => {
      r.issues.forEach(issue => {
        if (!criticalIssues.has(issue)) {
          criticalIssues.set(issue, []);
        }
        criticalIssues.get(issue).push(r.fileName);
      });
    });
    
    Array.from(criticalIssues.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([issue, agents]) => {
        console.log(`\n  ${issue}:`);
        agents.forEach(agent => console.log(`    - ${agent}`));
      });
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('                         END OF ANALYSIS REPORT                        ');
  console.log('═══════════════════════════════════════════════════════════════════════');
}

// Run the analysis
generateReport().catch(console.error);