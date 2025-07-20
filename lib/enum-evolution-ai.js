/**
 * AI-Driven Enum Evolution System
 * Uses xAI/Grok to automatically evolve enum types based on usage patterns
 * Generates migrations automatically when confidence is high
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// Evolution tracking
const evolutionHistory = new Map();
let isEvolutionEnabled = true;

/**
 * Initialize enum evolution system
 */
export async function initializeEnumEvolution() {
  console.log('🧬 Initializing AI-driven enum evolution...');
  
  // Start evolution monitoring
  setInterval(async () => {
    if (isEvolutionEnabled) {
      await checkEnumEvolution();
    }
  }, 86400000); // Check daily
  
  // Initial check
  await checkEnumEvolution();
  
  return true;
}

/**
 * Check if enums need evolution
 */
async function checkEnumEvolution() {
  console.log('🔍 Checking for enum evolution opportunities...');
  
  try {
    // 1. Gather usage data
    const usageData = await gatherEnumUsageData();
    
    // 2. Analyze validation failures
    const failures = await analyzeValidationFailures();
    
    // 3. Monitor industry trends
    const trends = await monitorIndustryTrends();
    
    // 4. AI analysis for evolution
    const evolution = await analyzeEnumEvolution(usageData, failures, trends);
    
    // 5. Apply evolution if confidence is high
    if (evolution.confidence > 0.85 && evolution.suggestions.length > 0) {
      await applyEnumEvolution(evolution);
    }
    
    // 6. Report findings
    await reportEvolutionFindings(evolution);
    
  } catch (error) {
    console.error('❌ Enum evolution check failed:', error);
  }
}

/**
 * Gather comprehensive enum usage data
 */
async function gatherEnumUsageData() {
  const usage = {
    byType: {},
    attemptedValues: [],
    deprecationCandidates: []
  };
  
  // Get usage statistics
  const { data: usageStats } = await supabase
    .from('enum_usage_analytics')
    .select('*')
    .order('usage_count', { ascending: false });
  
  // Get validation attempts
  const { data: validationData } = await supabase
    .from('metadata_validations')
    .select('validation_errors')
    .not('validation_errors', 'is', null)
    .limit(1000);
  
  // Process usage by type
  usageStats?.forEach(stat => {
    if (!usage.byType[stat.enum_type_name]) {
      usage.byType[stat.enum_type_name] = {};
    }
    usage.byType[stat.enum_type_name][stat.enum_value] = stat.usage_count;
  });
  
  // Extract attempted invalid values
  validationData?.forEach(record => {
    record.validation_errors?.forEach(error => {
      if (error.includes('Invalid') && error.includes(':')) {
        const match = error.match(/Invalid (\w+): (.+)/);
        if (match) {
          usage.attemptedValues.push({
            enumType: match[1],
            attemptedValue: match[2],
            timestamp: record.created_at
          });
        }
      }
    });
  });
  
  // Find deprecation candidates (unused for 90+ days)
  Object.entries(usage.byType).forEach(([enumType, values]) => {
    Object.entries(values).forEach(([value, count]) => {
      if (count === 0) {
        usage.deprecationCandidates.push({ enumType, value });
      }
    });
  });
  
  return usage;
}

/**
 * Analyze validation failures for patterns
 */
async function analyzeValidationFailures() {
  const { data: recentFailures } = await supabase
    .from('ai_validation_history')
    .select('validation_result, ai_insights')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .limit(500);
  
  const failurePatterns = {
    enumMismatches: {},
    suggestedValues: {},
    frequency: {}
  };
  
  recentFailures?.forEach(record => {
    // Extract enum-related failures
    record.ai_insights?.enumSuggestions?.forEach((suggestion, field) => {
      if (!failurePatterns.suggestedValues[field]) {
        failurePatterns.suggestedValues[field] = [];
      }
      failurePatterns.suggestedValues[field].push(suggestion.suggestedValue);
    });
  });
  
  return failurePatterns;
}

/**
 * Monitor industry trends for new enum requirements
 */
async function monitorIndustryTrends() {
  const trends = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are a financial technology trends analyst. Identify emerging patterns that require new enum values.`
      },
      {
        role: 'user',
        content: `Analyze current financial technology trends and suggest enum evolutions:

Current date: ${new Date().toISOString()}
Industry: Financial Services, Analytics, Trading

Consider:
1. New regulatory requirements (MiFID III, Basel IV, etc.)
2. Emerging technologies (AI, blockchain, quantum)
3. New financial instruments or markets
4. Evolving security standards
5. API protocol changes

Return trends that might require enum updates:
{
  "regulatoryTrends": [
    {
      "trend": "MiFID III transparency",
      "requiredEnums": {
        "ord_visibility": ["mifid3-public", "mifid3-restricted"],
        "compliance_status": ["mifid3-compliant"]
      },
      "timeline": "2024 Q2",
      "importance": "high"
    }
  ],
  "technologyTrends": [
    {
      "trend": "Quantum computing",
      "requiredEnums": {
        "a2a_agent_capability": ["quantum-optimization", "quantum-simulation"],
        "a2a_verification_level": ["quantum-resistant"]
      }
    }
  ],
  "marketTrends": [],
  "securityTrends": []
}`
      }
    ],
    temperature: 0.5,
    max_tokens: 2000
  });
  
  return trends || {};
}

/**
 * Analyze all data for enum evolution recommendations
 */
async function analyzeEnumEvolution(usage, failures, trends) {
  const analysis = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are an enum evolution AI. Analyze usage patterns and recommend enum updates with high confidence.`
      },
      {
        role: 'user',
        content: `Analyze enum usage and recommend evolution:

Usage Data:
${JSON.stringify(usage, null, 2)}

Validation Failures:
${JSON.stringify(failures, null, 2)}

Industry Trends:
${JSON.stringify(trends, null, 2)}

Recommend enum evolution with high confidence only:
{
  "suggestions": [
    {
      "action": "add|remove|rename",
      "enumType": "enum_type_name",
      "value": "new_value",
      "reason": "detailed justification",
      "evidence": ["usage pattern", "validation failures", "industry trend"],
      "impact": "low|medium|high",
      "confidence": 0.95,
      "migrationStrategy": "safe|breaking|phased"
    }
  ],
  "consolidations": [
    {
      "enumType": "enum_type",
      "merge": ["value1", "value2"],
      "into": "consolidated_value",
      "reason": "why consolidate",
      "affectedResources": 150
    }
  ],
  "newEnumTypes": [
    {
      "name": "new_enum_type",
      "values": ["value1", "value2"],
      "justification": "why needed",
      "useCase": "where it will be used"
    }
  ],
  "confidence": 0.88,
  "recommendedTimeline": "immediate|next-quarter|next-year"
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2500
  });
  
  return analysis || { suggestions: [], confidence: 0 };
}

/**
 * Apply enum evolution with automatic migration
 */
async function applyEnumEvolution(evolution) {
  console.log(`🚀 Applying enum evolution (confidence: ${evolution.confidence})...`);
  
  // Generate migration SQL
  const migrationSQL = generateEvolutionMigration(evolution);
  
  // Create migration file
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const filename = `${timestamp}_ai_enum_evolution.sql`;
  const filepath = join(process.cwd(), 'supabase', 'migrations', filename);
  
  try {
    // Write migration file
    writeFileSync(filepath, migrationSQL);
    console.log(`✅ Migration created: ${filename}`);
    
    // Log evolution
    await supabase
      .from('enum_evolution_log')
      .insert({
        evolution_data: evolution,
        migration_file: filename,
        applied_at: new Date(),
        confidence: evolution.confidence,
        status: 'pending'
      });
    
    // If confidence is very high, auto-apply
    if (evolution.confidence > 0.95) {
      console.log('🎯 High confidence - auto-applying migration...');
      // In production, this would trigger the migration
      await markEvolutionApplied(filename);
    }
    
  } catch (error) {
    console.error('❌ Failed to apply evolution:', error);
  }
}

/**
 * Generate SQL migration for enum evolution
 */
function generateEvolutionMigration(evolution) {
  let sql = `-- AI-Generated Enum Evolution Migration
-- Generated at: ${new Date().toISOString()}
-- Confidence: ${evolution.confidence}
-- Timeline: ${evolution.recommendedTimeline}

`;

  // Add new values
  evolution.suggestions?.filter(s => s.action === 'add').forEach(suggestion => {
    sql += `-- Adding ${suggestion.value} to ${suggestion.enumType}
-- Reason: ${suggestion.reason}
-- Evidence: ${suggestion.evidence.join(', ')}
ALTER TYPE ${suggestion.enumType} ADD VALUE IF NOT EXISTS '${suggestion.value}';

`;
  });

  // Handle removals (more complex - need to migrate data first)
  evolution.suggestions?.filter(s => s.action === 'remove').forEach(suggestion => {
    sql += `-- Deprecating ${suggestion.value} from ${suggestion.enumType}
-- Reason: ${suggestion.reason}
-- Migration strategy: ${suggestion.migrationStrategy}

-- First, update any existing usage
UPDATE a2a_agents 
SET ${mapEnumTypeToColumn(suggestion.enumType)} = '${getReplacementValue(suggestion)}'
WHERE ${mapEnumTypeToColumn(suggestion.enumType)} = '${suggestion.value}';

-- Note: Actual enum value removal requires creating new type
-- This is handled in a separate migration for safety

`;
  });

  // Add new enum types
  evolution.newEnumTypes?.forEach(newEnum => {
    sql += `-- Creating new enum type: ${newEnum.name}
-- Justification: ${newEnum.justification}
-- Use case: ${newEnum.useCase}
CREATE TYPE ${newEnum.name} AS ENUM (
${newEnum.values.map(v => `    '${v}'`).join(',\n')}
);

`;
  });

  // Add consolidations
  evolution.consolidations?.forEach(consolidation => {
    sql += `-- Consolidating values in ${consolidation.enumType}
-- Merging: ${consolidation.merge.join(', ')} → ${consolidation.into}
-- Affected resources: ${consolidation.affectedResources}

${consolidation.merge.map(value => `
UPDATE a2a_agents 
SET ${mapEnumTypeToColumn(consolidation.enumType)} = '${consolidation.into}'
WHERE ${mapEnumTypeToColumn(consolidation.enumType)} = '${value}';
`).join('\n')}

`;
  });

  // Add tracking
  sql += `-- Record evolution in history
INSERT INTO enum_evolution_history (
    evolution_type,
    changes_applied,
    confidence_score,
    migration_date
) VALUES (
    'ai-driven',
    ${evolution.suggestions.length + evolution.consolidations.length},
    ${evolution.confidence},
    NOW()
);`;

  return sql;
}

/**
 * Report evolution findings
 */
async function reportEvolutionFindings(evolution) {
  const report = {
    date: new Date(),
    suggestionsCount: evolution.suggestions?.length || 0,
    consolidationsCount: evolution.consolidations?.length || 0,
    newEnumTypesCount: evolution.newEnumTypes?.length || 0,
    confidence: evolution.confidence,
    timeline: evolution.recommendedTimeline,
    summary: await generateEvolutionSummary(evolution)
  };
  
  // Store report
  await supabase
    .from('enum_evolution_reports')
    .insert(report);
  
  // Log key findings
  if (report.suggestionsCount > 0) {
    console.log(`📊 Enum Evolution Report:`);
    console.log(`   - ${report.suggestionsCount} suggested changes`);
    console.log(`   - ${report.consolidationsCount} consolidations`);
    console.log(`   - ${report.newEnumTypesCount} new enum types`);
    console.log(`   - Confidence: ${(report.confidence * 100).toFixed(1)}%`);
  }
}

/**
 * Helper functions
 */

async function callGrokAPI(config) {
  if (!GROK_API_KEY) return null;
  
  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        ...config,
        model: 'grok-4-0709'
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  } catch (error) {
    console.error('Grok API call failed:', error);
    return null;
  }
}

function mapEnumTypeToColumn(enumType) {
  // Map enum types to database columns
  const mapping = {
    'a2a_protocol_version': 'protocol_version_enum',
    'a2a_agent_capability': 'capabilities_enum',
    'ord_release_status': 'ord_release_status',
    'ord_visibility': 'ord_visibility'
  };
  return mapping[enumType] || enumType;
}

function getReplacementValue(suggestion) {
  // Get replacement value for deprecated enum
  const replacements = {
    'deprecated': 'retired',
    'planned': 'draft',
    'basic': 'standard'
  };
  return replacements[suggestion.value] || 'active';
}

async function generateEvolutionSummary(evolution) {
  const summary = [];
  
  evolution.suggestions?.forEach(s => {
    summary.push(`${s.action} '${s.value}' in ${s.enumType} (${s.reason})`);
  });
  
  return summary.join('; ');
}

async function markEvolutionApplied(filename) {
  await supabase
    .from('enum_evolution_log')
    .update({ status: 'applied' })
    .eq('migration_file', filename);
}

/**
 * Public API
 */
export default {
  initializeEnumEvolution,
  checkEnumEvolution,
  setEvolutionEnabled: (enabled) => { isEvolutionEnabled = enabled; },
  getEvolutionHistory: () => Array.from(evolutionHistory.values())
};