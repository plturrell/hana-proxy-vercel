/**
 * AI-Enhanced Metadata Validation Service
 * Uses xAI/Grok for intelligent compliance validation and auto-remediation
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// xAI/Grok configuration
const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// Cache for AI insights to reduce API calls
const aiCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'validate-with-ai':
        return await validateWithAI(req, res);
      case 'auto-remediate':
        return await autoRemediate(req, res);
      case 'predict-compliance':
        return await predictCompliance(req, res);
      case 'learn-patterns':
        return await learnFromPatterns(req, res);
      case 'suggest-enum-evolution':
        return await suggestEnumEvolution(req, res);
      case 'bulk-auto-fix':
        return await bulkAutoFix(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('AI validation error:', error);
    return res.status(500).json({ 
      error: 'AI validation failed',
      details: error.message 
    });
  }
}

/**
 * Validate resource with AI intelligence
 */
async function validateWithAI(req, res) {
  const { resource, resourceType } = req.body;
  
  // Get traditional validation first
  const basicValidation = await performBasicValidation(resource, resourceType);
  
  // Enhance with AI insights
  const aiEnhancement = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are an expert in A2A (Agent-to-Agent) and ORD (Open Resource Discovery) compliance for financial systems. 
                  Analyze resources for compliance issues and suggest optimal enum values based on context and best practices.`
      },
      {
        role: 'user',
        content: `Analyze this ${resourceType} for compliance:

Resource Data:
${JSON.stringify(resource, null, 2)}

Basic Validation Results:
${JSON.stringify(basicValidation, null, 2)}

Please provide:
1. Additional compliance insights beyond basic validation
2. Optimal enum value suggestions based on resource context
3. Potential future compliance issues
4. Industry-specific recommendations

Return as JSON with structure:
{
  "insights": [
    {
      "type": "warning|error|suggestion",
      "field": "field_name",
      "message": "detailed message",
      "severity": "high|medium|low"
    }
  ],
  "enumSuggestions": {
    "field_name": {
      "suggestedValue": "value",
      "reasoning": "why this value is optimal",
      "confidence": 0.95
    }
  },
  "futureCompliance": [
    {
      "issue": "potential future issue",
      "timeline": "when this might become a problem",
      "recommendation": "preventive action"
    }
  ],
  "industryRecommendations": [
    "specific recommendations for financial services"
  ],
  "complianceScore": 95,
  "autoFixable": true
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });

  // Combine basic and AI validation
  const combinedResult = {
    ...basicValidation,
    aiInsights: aiEnhancement?.insights || [],
    enumSuggestions: aiEnhancement?.enumSuggestions || {},
    futureCompliance: aiEnhancement?.futureCompliance || [],
    industryRecommendations: aiEnhancement?.industryRecommendations || [],
    overallScore: Math.round((basicValidation.score + (aiEnhancement?.complianceScore || 0)) / 2),
    autoFixable: aiEnhancement?.autoFixable || false
  };

  // Store AI validation results
  if (supabase && resource.id) {
    await supabase
      .from('ai_validation_history')
      .insert({
        resource_id: resource.id,
        resource_type: resourceType,
        validation_result: combinedResult,
        ai_insights: aiEnhancement,
        created_at: new Date()
      });
  }

  return res.json({
    success: true,
    validation: combinedResult,
    aiPowered: true
  });
}

/**
 * Auto-remediate compliance issues invisibly
 */
async function autoRemediate(req, res) {
  const { resource, resourceType, silent = true } = req.body;
  
  // Get AI suggestions for remediation
  const aiRemediation = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are an AI compliance fixer. Analyze the resource and provide exact fixes for all compliance issues.
                  Be conservative - only suggest fixes you're highly confident about (>90% confidence).`
      },
      {
        role: 'user',
        content: `Auto-fix compliance issues for this ${resourceType}:

${JSON.stringify(resource, null, 2)}

Return JSON with structure:
{
  "fixes": {
    "field_name": {
      "currentValue": "current",
      "fixedValue": "fixed",
      "confidence": 0.95,
      "reasoning": "why this fix is correct"
    }
  },
  "unfixableIssues": [
    {
      "field": "field_name",
      "issue": "why it can't be auto-fixed",
      "requiresHuman": true
    }
  ],
  "summary": {
    "totalIssues": 5,
    "autoFixed": 4,
    "requiresReview": 1
  }
}`
      }
    ],
    temperature: 0.2, // Lower temperature for more consistent fixes
    max_tokens: 1500
  });

  if (!aiRemediation) {
    return res.json({
      success: false,
      error: 'AI remediation unavailable'
    });
  }

  // Apply fixes to resource
  const fixedResource = { ...resource };
  const appliedFixes = [];
  
  Object.entries(aiRemediation.fixes || {}).forEach(([field, fix]) => {
    if (fix.confidence >= 0.9) {
      fixedResource[field] = fix.fixedValue;
      appliedFixes.push({
        field,
        oldValue: fix.currentValue,
        newValue: fix.fixedValue,
        confidence: fix.confidence
      });
    }
  });

  // Mark as AI-remediated
  fixedResource._metadata = {
    ...fixedResource._metadata,
    aiRemediated: true,
    remediationTimestamp: new Date().toISOString(),
    appliedFixes: appliedFixes.length
  };

  // Store remediation history
  if (supabase) {
    await supabase
      .from('ai_remediation_log')
      .insert({
        resource_id: resource.id || 'unknown',
        resource_type: resourceType,
        original_resource: resource,
        fixed_resource: fixedResource,
        fixes_applied: appliedFixes,
        ai_confidence: aiRemediation.summary?.autoFixed || 0,
        created_at: new Date()
      });
  }

  return res.json({
    success: true,
    original: silent ? undefined : resource,
    fixed: fixedResource,
    summary: aiRemediation.summary,
    appliedFixes: silent ? appliedFixes.length : appliedFixes,
    unfixableIssues: aiRemediation.unfixableIssues || []
  });
}

/**
 * Predict compliance issues before resource creation
 */
async function predictCompliance(req, res) {
  const { resourceDraft, resourceType } = req.body;
  
  // Get historical issues for context
  const historicalIssues = await getHistoricalValidationErrors(resourceType);
  
  const prediction = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are a predictive compliance AI. Analyze draft resources and predict compliance issues before they occur.
                  Use historical patterns to improve predictions.`
      },
      {
        role: 'user',
        content: `Predict compliance issues for this draft ${resourceType}:

Draft Resource:
${JSON.stringify(resourceDraft, null, 2)}

Historical Issues in Similar Resources:
${JSON.stringify(historicalIssues, null, 2)}

Predict:
1. Likely validation errors
2. Missing required fields
3. Enum values that might be invalid
4. A2A/ORD compliance risks
5. Suggested corrections before submission

Return JSON:
{
  "predictedIssues": [
    {
      "field": "field_name",
      "issue": "predicted issue",
      "likelihood": 0.85,
      "severity": "high|medium|low",
      "prevention": "how to prevent this"
    }
  ],
  "missingFields": [
    {
      "field": "field_name",
      "required": true,
      "suggestedValue": "value",
      "reason": "why this field is needed"
    }
  ],
  "enumRisks": [
    {
      "field": "field_name",
      "currentValue": "value",
      "risk": "why this might be invalid",
      "alternatives": ["valid1", "valid2"]
    }
  ],
  "preemptiveFixes": {
    "field_name": "suggested_value"
  },
  "complianceRiskScore": 75,
  "readyForCreation": false,
  "aiRecommendation": "Overall recommendation"
}`
      }
    ],
    temperature: 0.4,
    max_tokens: 2000
  });

  // Cache prediction for quick re-validation
  const cacheKey = `predict_${resourceType}_${JSON.stringify(resourceDraft)}`;
  aiCache.set(cacheKey, {
    prediction,
    timestamp: Date.now()
  });

  return res.json({
    success: true,
    prediction: prediction || { predictedIssues: [], complianceRiskScore: 0 },
    readyForCreation: prediction?.readyForCreation || false,
    timestamp: new Date().toISOString()
  });
}

/**
 * Learn from validation patterns to improve future validations
 */
async function learnFromPatterns(req, res) {
  const { timeframe = '30d' } = req.query;
  
  // Get recent validation history
  const validationHistory = await supabase
    .from('metadata_validations')
    .select('*')
    .gte('created_at', getTimeframeDate(timeframe))
    .order('created_at', { ascending: false })
    .limit(1000);

  if (!validationHistory.data) {
    return res.json({
      success: false,
      error: 'No validation history available'
    });
  }

  const patterns = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are a pattern recognition AI. Analyze validation history to identify patterns and improve future validations.`
      },
      {
        role: 'user',
        content: `Analyze these validation results and identify patterns:

${JSON.stringify(validationHistory.data, null, 2)}

Identify:
1. Common validation errors by resource type
2. Frequently missing fields
3. Enum values that are often wrong
4. Patterns in successful vs failed validations
5. Suggestions for better default values
6. Emerging compliance trends

Return JSON:
{
  "patterns": {
    "commonErrors": [
      {
        "resourceType": "agent",
        "field": "field_name",
        "errorFrequency": 0.75,
        "typicalError": "missing enum value",
        "suggestedDefault": "value"
      }
    ],
    "missingFieldPatterns": {
      "agent": ["field1", "field2"],
      "dataProduct": ["field3"]
    },
    "enumMismatches": [
      {
        "enumType": "a2a_protocol_version",
        "commonMistakes": ["v1.0", "1.0"],
        "correctFormat": "a2a/v1.0"
      }
    ],
    "successPatterns": [
      "Resources with X field tend to pass validation"
    ],
    "emergingTrends": [
      "Increasing use of 'autonomous' agent role"
    ]
  },
  "recommendations": {
    "defaultUpdates": {
      "field_name": "new_default_value"
    },
    "validationRuleChanges": [
      "Consider making field X optional"
    ],
    "enumEvolution": [
      "Add new enum value Y based on usage"
    ]
  },
  "learningConfidence": 0.85
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2500
  });

  // Store learned patterns
  if (patterns && supabase) {
    await supabase
      .from('ai_learning_patterns')
      .insert({
        pattern_type: 'validation',
        patterns: patterns.patterns,
        recommendations: patterns.recommendations,
        confidence: patterns.learningConfidence || 0,
        timeframe,
        created_at: new Date()
      });

    // Update default mappings based on patterns
    if (patterns.recommendations?.defaultUpdates) {
      await updateDefaultMappings(patterns.recommendations.defaultUpdates);
    }
  }

  return res.json({
    success: true,
    patterns: patterns?.patterns || {},
    recommendations: patterns?.recommendations || {},
    confidence: patterns?.learningConfidence || 0,
    applied: !!patterns?.recommendations?.defaultUpdates
  });
}

/**
 * Suggest enum evolution based on usage
 */
async function suggestEnumEvolution(req, res) {
  const { enumType } = req.query;
  
  // Get enum usage analytics
  const usageData = await supabase
    .from('enum_usage_analytics')
    .select('*')
    .eq(enumType ? 'enum_type_name' : '', enumType)
    .order('usage_count', { ascending: false })
    .limit(500);

  // Get validation failures related to enums
  const validationFailures = await supabase
    .from('metadata_validations')
    .select('validation_errors')
    .not('validation_errors', 'is', null)
    .limit(500);

  const evolution = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are an enum evolution AI. Analyze usage patterns and suggest new enum values or deprecations.`
      },
      {
        role: 'user',
        content: `Analyze enum usage and suggest evolution:

Current Usage:
${JSON.stringify(usageData.data, null, 2)}

Validation Failures:
${JSON.stringify(validationFailures.data, null, 2)}

${enumType ? `Focus on enum type: ${enumType}` : 'Analyze all enum types'}

Suggest:
1. New enum values based on failed validations
2. Deprecated values with low/no usage
3. Industry trends requiring new values
4. Enum consolidation opportunities

Return JSON:
{
  "suggestions": {
    "newValues": [
      {
        "enumType": "a2a_agent_capability",
        "value": "quantum-computing",
        "reasoning": "5 validation failures trying to use this",
        "usageEvidence": ["attempted 5 times in last week"],
        "confidence": 0.92
      }
    ],
    "deprecations": [
      {
        "enumType": "ord_release_status",
        "value": "planned",
        "reasoning": "Never used in 6 months",
        "migrateTo": "draft",
        "confidence": 0.88
      }
    ],
    "consolidations": [
      {
        "enumType": "a2a_verification_level",
        "merge": ["basic", "enhanced"],
        "into": "standard",
        "reasoning": "Usage patterns show no distinction"
      }
    ],
    "industryAlignments": [
      {
        "standard": "ISO-20022",
        "requiredValues": ["swift-compatible", "iso20022-compliant"],
        "enumType": "ord_api_protocol"
      }
    ]
  },
  "migrationSQL": "-- Generated SQL for enum updates",
  "impact": {
    "affectedResources": 150,
    "breakingChanges": false,
    "migrationComplexity": "low"
  },
  "autoApplyConfidence": 0.85
}`
      }
    ],
    temperature: 0.4,
    max_tokens: 2000
  });

  // Auto-generate migration if confidence is high
  if (evolution?.autoApplyConfidence > 0.9 && evolution?.migrationSQL) {
    const migrationPath = await generateEnumMigration(evolution);
    evolution.migrationGenerated = true;
    evolution.migrationPath = migrationPath;
  }

  return res.json({
    success: true,
    evolution: evolution?.suggestions || {},
    impact: evolution?.impact || {},
    migrationReady: evolution?.migrationGenerated || false,
    confidence: evolution?.autoApplyConfidence || 0
  });
}

/**
 * Bulk auto-fix resources with AI
 */
async function bulkAutoFix(req, res) {
  const { resourceType, resourceIds, dryRun = false } = req.body;
  
  if (!resourceIds || !Array.isArray(resourceIds)) {
    return res.status(400).json({ error: 'resourceIds array required' });
  }

  const results = {
    processed: 0,
    fixed: 0,
    failed: 0,
    details: []
  };

  // Process in batches to avoid overwhelming the AI
  const batchSize = 10;
  for (let i = 0; i < resourceIds.length; i += batchSize) {
    const batch = resourceIds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (resourceId) => {
      try {
        // Get resource
        const { data: resource } = await supabase
          .from(getTableForResourceType(resourceType))
          .select('*')
          .eq('id', resourceId)
          .single();

        if (!resource) {
          return { id: resourceId, status: 'not_found' };
        }

        // Auto-remediate
        const remediationResult = await autoRemediateResource(resource, resourceType);
        
        if (!dryRun && remediationResult.fixed) {
          // Apply fixes
          await supabase
            .from(getTableForResourceType(resourceType))
            .update(remediationResult.fixed)
            .eq('id', resourceId);
        }

        return {
          id: resourceId,
          status: 'fixed',
          fixes: remediationResult.appliedFixes,
          confidence: remediationResult.confidence
        };

      } catch (error) {
        return {
          id: resourceId,
          status: 'error',
          error: error.message
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach(result => {
      results.processed++;
      if (result.status === 'fixed') results.fixed++;
      else results.failed++;
      results.details.push(result);
    });
  }

  return res.json({
    success: true,
    dryRun,
    results,
    summary: `Fixed ${results.fixed}/${results.processed} resources`
  });
}

/**
 * Helper functions
 */

async function callGrokAPI(config) {
  if (!GROK_API_KEY) {
    console.warn('Grok API key not configured');
    return null;
  }

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
    } catch (parseError) {
      console.error('Failed to parse Grok response:', content);
      return null;
    }
  } catch (error) {
    console.error('Grok API call failed:', error);
    return null;
  }
}

async function performBasicValidation(resource, resourceType) {
  // Simplified basic validation
  const errors = [];
  const warnings = [];
  
  // Check required fields based on type
  const requiredFields = {
    agent: ['agent_id', 'protocol_version', 'capabilities'],
    'data-product': ['ordId', 'title', 'releaseStatus', 'visibility'],
    function: ['ordId', 'title', 'apiProtocol']
  };

  const required = requiredFields[resourceType] || [];
  required.forEach(field => {
    if (!resource[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, 100 - (errors.length * 10))
  };
}

async function getHistoricalValidationErrors(resourceType) {
  if (!supabase) return [];
  
  const { data } = await supabase
    .from('metadata_validations')
    .select('validation_errors, resource_id')
    .eq('resource_type', resourceType)
    .not('validation_errors', 'is', null)
    .limit(100);

  return data || [];
}

async function autoRemediateResource(resource, resourceType) {
  // Real auto-remediation using AI
  if (!GROK_API_KEY) {
    return null;
  }
  
  const remediation = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: 'You are an AI compliance remediation engine. Fix compliance issues automatically.'
      },
      {
        role: 'user',
        content: `Auto-remediate this ${resourceType}: ${JSON.stringify(resource)}`
      }
    ],
    temperature: 0.2,
    max_tokens: 500
  });
  
  return remediation || null;
}

function getTableForResourceType(resourceType) {
  const mapping = {
    'agent': 'a2a_agents',
    'data-product': 'data_products',
    'function': 'functions'
  };
  return mapping[resourceType] || resourceType;
}

function getTimeframeDate(timeframe) {
  const now = new Date();
  const match = timeframe.match(/(\d+)([dhm])/);
  if (!match) return now;
  
  const [, value, unit] = match;
  const ms = {
    d: 86400000,
    h: 3600000,
    m: 60000
  }[unit] || 86400000;
  
  return new Date(now - (parseInt(value) * ms)).toISOString();
}

async function updateDefaultMappings(updates) {
  // Store updated defaults for future use
  if (!supabase) return;
  
  await supabase
    .from('ai_default_mappings')
    .upsert({
      mapping_type: 'validation_defaults',
      mappings: updates,
      updated_at: new Date()
    });
}

async function generateEnumMigration(evolution) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
  const filename = `${timestamp}_ai_enum_evolution.sql`;
  
  // In production, this would write to the migrations folder
  // For now, just return the path
  return `/supabase/migrations/${filename}`;
}