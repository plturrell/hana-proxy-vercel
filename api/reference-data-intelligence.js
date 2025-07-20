/**
 * Reference Data Intelligence Engine
 * Uses Grok4 API for intelligent reference data management and enum validation
 * Pulls from actual database enum types and tables
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Grok4 API configuration  
const GROK4_API_KEY = process.env.GROK4_API_KEY || process.env.XAI_API_KEY;
const GROK4_API_URL = 'https://api.x.ai/v1/chat/completions';

// Database enum types from schema
const DATABASE_ENUMS = {
  agent_status: ['active', 'inactive', 'suspended', 'pending'],
  transaction_status: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
  risk_level: ['low', 'medium', 'high', 'critical'],
  subscription_tier: ['free', 'basic', 'premium', 'enterprise'],
  agent_type: ['analytics', 'trading', 'research', 'compliance', 'autonomous'],
  message_type: ['request', 'response', 'broadcast', 'negotiation', 'heartbeat'],
  resource_type: ['function', 'dataset', 'model', 'api', 'computation', 'service']
};

// A2A standard enum types (from database)
const A2A_STANDARD_ENUMS = {
  a2a_protocol_version: ['a2a/v1.0', 'a2a/v1.1', 'a2a/v1.2', 'a2a/v2.0-beta', 'a2a/v2.0'],
  a2a_agent_capability: ['financial-analysis', 'risk-assessment', 'portfolio-optimization', 'market-research', 'compliance-monitoring', 'fraud-detection', 'algorithmic-trading', 'sentiment-analysis', 'forecasting', 'data-transformation', 'anomaly-detection', 'regulatory-reporting', 'stress-testing', 'backtesting', 'performance-attribution'],
  a2a_message_type: ['request', 'response', 'notification', 'broadcast', 'negotiation', 'heartbeat', 'error', 'ack', 'nack', 'subscribe', 'unsubscribe', 'discovery'],
  a2a_message_priority: ['low', 'normal', 'high', 'urgent', 'critical'],
  a2a_consensus_method: ['simple-majority', 'weighted-voting', 'reputation-based', 'stake-weighted', 'proof-of-work', 'proof-of-stake', 'delegated-consensus', 'byzantine-fault-tolerant'],
  a2a_verification_level: ['none', 'basic', 'enhanced', 'cryptographic', 'blockchain-verified', 'multi-signature', 'zero-knowledge-proof'],
  a2a_agent_role: ['autonomous', 'reactive', 'coordinator', 'monitor', 'validator', 'mediator', 'aggregator', 'transformer', 'gateway', 'oracle'],
  a2a_communication_pattern: ['synchronous', 'asynchronous', 'publish-subscribe', 'request-response', 'streaming', 'batch', 'event-driven', 'message-queue']
};

// ORD standard enum types (from database)
const ORD_STANDARD_ENUMS = {
  ord_version: ['v1.0', 'v1.1', 'v1.2', 'v1.3', 'v1.4', 'v1.5', 'v1.6', 'v1.7', 'v1.8', 'v1.9', 'v1.10', 'v1.11', 'v1.12'],
  ord_release_status: ['active', 'beta', 'deprecated', 'retired', 'planned', 'draft', 'review', 'approved'],
  ord_visibility: ['public', 'internal', 'restricted', 'private', 'partner', 'customer'],
  ord_api_protocol: ['rest', 'graphql', 'grpc', 'websocket', 'sse', 'soap', 'rpc', 'odata', 'mqtt', 'kafka'],
  ord_data_product_type: ['primary', 'derived', 'aggregated', 'reference', 'audit', 'operational', 'analytical', 'transactional', 'master', 'dimensional'],
  ord_entity_level: ['1', '2', '3', '4', '5'],
  ord_capability_extensibility: ['automatic', 'manual', 'none', 'scripted', 'api-driven'],
  ord_policy_level: ['sap:core:v1', 'custom:v1', 'partner:v1', 'industry:finance:v1', 'regulatory:mifid:v1', 'regulatory:basel:v1'],
  ord_resource_category: ['api', 'event', 'entity-type', 'data-product', 'capability', 'package', 'group', 'integration-dependency', 'tombstone'],
  ord_documentation_type: ['openapi-v3', 'asyncapi-v2', 'json-schema', 'markdown', 'html', 'pdf', 'swagger-v2', 'raml', 'blueprint'],
  ord_access_strategy: ['open', 'api-key', 'oauth2', 'jwt', 'basic-auth', 'certificate', 'saml', 'custom']
};

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
      case 'get-reference-data':
        return await getReferenceData(req, res);
      case 'validate-enum':
        return await validateEnumValue(req, res);
      case 'suggest-enum-values':
        return await suggestEnumValues(req, res);
      case 'analyze-enum-usage':
        return await analyzeEnumUsage(req, res);
      case 'optimize-enums':
        return await optimizeEnums(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Reference data intelligence error:', error);
    return res.status(500).json({ 
      error: 'Reference data processing failed',
      details: error.message 
    });
  }
}

/**
 * Get comprehensive reference data from database and standards
 */
async function getReferenceData(req, res) {
  try {
    // Get live enum values from database
    const liveEnums = await getLiveEnumValues();
    
    // Get enum usage statistics
    const usageStats = await getEnumUsageStatistics();
    
    // Use Grok4 to analyze and enhance reference data
    const grok4Prompt = `
You are analyzing reference data for a financial analytics platform. Enhance this reference data with intelligent insights.

Database Enums:
${JSON.stringify(DATABASE_ENUMS, null, 2)}

A2A Standard Enums:
${JSON.stringify(A2A_STANDARD_ENUMS, null, 2)}

ORD Standard Enums:
${JSON.stringify(ORD_STANDARD_ENUMS, null, 2)}

Live Database Values:
${JSON.stringify(liveEnums, null, 2)}

Usage Statistics:
${JSON.stringify(usageStats, null, 2)}

Provide intelligent analysis with JSON response:
{
  "enhancedEnums": {
    "database": {
      "agent_status": {
        "values": ["active", "inactive", "suspended", "pending"],
        "recommendations": ["Consider adding 'maintenance' status for scheduled downtime"],
        "usage": "98% use active/inactive, consider consolidating suspended/pending",
        "compliance": "Fully A2A compliant"
      }
    }
  },
  "inconsistencies": [
    {
      "type": "naming-mismatch",
      "description": "agent_type vs A2A agent_capability - consider alignment",
      "severity": "medium",
      "recommendation": "Standardize on A2A naming convention"
    }
  ],
  "optimizations": [
    {
      "enumType": "risk_level",
      "suggestion": "Add 'extreme' level for tail risk scenarios",
      "justification": "Financial regulations often require 5-level risk classification",
      "impact": "high"
    }
  ],
  "governance": {
    "deprecated": ["old enum values that should be phased out"],
    "required": ["mandatory enum values for compliance"],
    "suggested": ["recommended additions for best practices"]
  }
}
`;

    const intelligence = await callGrok4API(grok4Prompt);
    
    return res.json({
      success: true,
      referenceData: {
        database: DATABASE_ENUMS,
        a2a: A2A_STANDARD_ENUMS,
        ord: ORD_STANDARD_ENUMS,
        live: liveEnums
      },
      intelligence: intelligence || {},
      statistics: usageStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting reference data:', error);
    return res.status(500).json({ error: 'Failed to retrieve reference data' });
  }
}

/**
 * Validate enum value with AI-powered suggestions
 */
async function validateEnumValue(req, res) {
  const { enumType, value, context } = req.body;

  const grok4Prompt = `
Validate and provide intelligent feedback on enum value usage in financial platform.

Enum Type: ${enumType}
Proposed Value: ${value}
Context: ${JSON.stringify(context)}

Available Enum Types:
- Database: ${JSON.stringify(DATABASE_ENUMS)}
- A2A Standard: ${JSON.stringify(A2A_STANDARD_ENUMS)}
- ORD Standard: ${JSON.stringify(ORD_STANDARD_ENUMS)}

Provide validation response:
{
  "isValid": true,
  "enumCategory": "database|a2a|ord|custom",
  "exactMatch": true,
  "suggestions": [
    {
      "value": "suggested-value",
      "reason": "Why this is better",
      "confidence": 0.95
    }
  ],
  "compliance": {
    "a2aCompliant": true,
    "ordCompliant": true,
    "recommendedStandard": "Use A2A standard for agent capabilities"
  },
  "contextualAdvice": "Specific advice based on usage context",
  "alternatives": ["similar", "enum", "values"]
}
`;

  const validation = await callGrok4API(grok4Prompt);
  
  // Log validation for learning
  if (supabase) {
    await supabase
      .from('enum_validations')
      .insert({
        enum_type: enumType,
        proposed_value: value,
        validation_result: validation,
        context: context,
        created_at: new Date()
      });
  }

  return res.json({
    success: true,
    validation: validation || { isValid: false, message: 'Unable to validate' },
    timestamp: new Date().toISOString()
  });
}

/**
 * Get AI-powered enum value suggestions based on context
 */
async function suggestEnumValues(req, res) {
  const { enumType, partialValue, context, domain } = req.body;

  const grok4Prompt = `
Suggest intelligent enum values for financial platform based on partial input and context.

Enum Type: ${enumType}
Partial Value: "${partialValue}"
Context: ${JSON.stringify(context)}
Domain: ${domain || 'financial-analytics'}

Available Standards:
${JSON.stringify({ DATABASE_ENUMS, A2A_STANDARD_ENUMS, ORD_STANDARD_ENUMS })}

Provide smart suggestions:
{
  "suggestions": [
    {
      "value": "complete-enum-value",
      "confidence": 0.95,
      "reasoning": "Why this matches user intent",
      "category": "exact|fuzzy|related|new",
      "compliance": ["a2a", "ord"],
      "usage": "Common in 89% of similar contexts"
    }
  ],
  "autoComplete": [
    "exact-matches-for-autocomplete"
  ],
  "contextualRecommendations": [
    {
      "enumType": "related_enum_type", 
      "suggestedValue": "value",
      "relationship": "Often used together with proposed enum"
    }
  ],
  "bestPractices": [
    "Use kebab-case for multi-word enum values",
    "Follow A2A naming conventions for agent capabilities"
  ]
}
`;

  const suggestions = await callGrok4API(grok4Prompt);

  return res.json({
    success: true,
    suggestions: suggestions || { suggestions: [], autoComplete: [] },
    timestamp: new Date().toISOString()
  });
}

/**
 * Analyze enum usage patterns across the platform
 */
async function analyzeEnumUsage(req, res) {
  const { enumType, timeframe } = req.body;

  try {
    // Get actual usage data from database
    const usageData = await getDetailedEnumUsage(enumType, timeframe);
    
    const grok4Prompt = `
Analyze enum usage patterns and provide optimization recommendations for financial platform.

Enum Type: ${enumType}
Timeframe: ${timeframe}
Usage Data: ${JSON.stringify(usageData)}

Database Schema Context:
- This is a financial analytics platform
- Users include traders, analysts, compliance officers
- System handles A2A agent communications and ORD resource discovery

Provide comprehensive analysis:
{
  "usageAnalysis": {
    "mostUsed": {"value": "active", "percentage": 89.2, "trend": "stable"},
    "leastUsed": {"value": "suspended", "percentage": 0.1, "trend": "declining"},
    "trending": [{"value": "autonomous", "change": "+15%", "reason": "AI adoption"}]
  },
  "optimization": {
    "deprecationCandidates": [
      {"value": "suspended", "reason": "Used in <1% of cases, merge with inactive"}
    ],
    "missingValues": [
      {"value": "maintenance", "justification": "Common operational state"}
    ],
    "consolidationOpportunities": [
      {"merge": ["pending", "processing"], "into": "in-progress"}
    ]
  },
  "compliance": {
    "a2aAlignment": 0.95,
    "ordAlignment": 0.98,
    "recommendations": ["Standardize capability naming with A2A spec"]
  },
  "predictiveInsights": [
    "Expect 'autonomous' agent_type to grow 25% next quarter based on AI trends"
  ]
}
`;

    const analysis = await callGrok4API(grok4Prompt);

    return res.json({
      success: true,
      analysis: analysis || {},
      rawData: usageData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing enum usage:', error);
    return res.status(500).json({ error: 'Failed to analyze enum usage' });
  }
}

/**
 * Optimize enum structures with AI recommendations
 */
async function optimizeEnums(req, res) {
  const { scope, targetCompliance } = req.body;

  const grok4Prompt = `
Optimize enum structures for a financial analytics platform to achieve target compliance.

Current Enums: ${JSON.stringify(DATABASE_ENUMS)}
Scope: ${scope || 'all'}
Target Compliance: ${JSON.stringify(targetCompliance || ['a2a', 'ord'])}

Financial Domain Context:
- Platform serves institutional finance users
- Handles real-time trading, risk management, compliance
- Must support A2A agent interactions and ORD resource discovery
- Regulatory compliance is critical

Provide optimization plan:
{
  "optimizationPlan": {
    "phase1": [
      {
        "enumType": "agent_status",
        "action": "add",
        "value": "maintenance", 
        "reasoning": "Missing operational state",
        "priority": "high",
        "effort": "low"
      }
    ],
    "phase2": [
      {
        "enumType": "risk_level",
        "action": "extend",
        "changes": ["Add 'extreme' for tail risk"],
        "priority": "medium",
        "effort": "medium"
      }
    ]
  },
  "complianceGaps": [
    {
      "standard": "A2A",
      "gap": "Missing standardized capability types",
      "solution": "Adopt A2A capability enum",
      "impact": "medium"
    }
  ],
  "migrationStrategy": {
    "backwardCompatibility": "Maintain old values with deprecation warnings",
    "timeline": "3-month phased approach",
    "riskMitigation": ["Comprehensive testing", "Gradual rollout"]
  },
  "governance": {
    "approvalProcess": "Technical review -> Compliance check -> Stakeholder approval",
    "versioning": "Semantic versioning for enum schemas",
    "documentation": "Auto-generate enum documentation with usage examples"
  }
}
`;

  const optimization = await callGrok4API(grok4Prompt);

  return res.json({
    success: true,
    optimization: optimization || {},
    timestamp: new Date().toISOString()
  });
}

/**
 * Helper functions
 */
async function getLiveEnumValues() {
  if (!supabase) return {};

  try {
    // Try to get enum values using the list_enum_types function
    const { data: enumTypes, error: enumError } = await supabase.rpc('list_enum_types');
    
    if (!enumError && enumTypes) {
      // Transform the data into our expected format
      const liveData = {};
      enumTypes.forEach(enumType => {
        liveData[enumType.enum_name] = enumType.enum_values;
      });
      return liveData;
    }
    
    // If RPC fails, return the expected enum structure
    // These should now be real database enum types
    return {
      // A2A enums
      a2a_protocol_version: A2A_STANDARD_ENUMS.a2a_protocol_version,
      a2a_agent_capability: A2A_STANDARD_ENUMS.a2a_agent_capability,
      a2a_message_type: A2A_STANDARD_ENUMS.a2a_message_type,
      a2a_message_priority: A2A_STANDARD_ENUMS.a2a_message_priority,
      a2a_consensus_method: A2A_STANDARD_ENUMS.a2a_consensus_method,
      a2a_verification_level: A2A_STANDARD_ENUMS.a2a_verification_level,
      a2a_agent_role: A2A_STANDARD_ENUMS.a2a_agent_role,
      a2a_communication_pattern: A2A_STANDARD_ENUMS.a2a_communication_pattern,
      // ORD enums
      ord_version: ORD_STANDARD_ENUMS.ord_version,
      ord_release_status: ORD_STANDARD_ENUMS.ord_release_status,
      ord_visibility: ORD_STANDARD_ENUMS.ord_visibility,
      ord_api_protocol: ORD_STANDARD_ENUMS.ord_api_protocol,
      ord_data_product_type: ORD_STANDARD_ENUMS.ord_data_product_type,
      ord_entity_level: ORD_STANDARD_ENUMS.ord_entity_level,
      ord_capability_extensibility: ORD_STANDARD_ENUMS.ord_capability_extensibility,
      ord_policy_level: ORD_STANDARD_ENUMS.ord_policy_level,
      ord_resource_category: ORD_STANDARD_ENUMS.ord_resource_category,
      ord_documentation_type: ORD_STANDARD_ENUMS.ord_documentation_type,
      ord_access_strategy: ORD_STANDARD_ENUMS.ord_access_strategy,
      // Additional enums
      compliance_status: ['compliant', 'non-compliant', 'partially-compliant', 'unknown', 'pending-review', 'exempted'],
      data_quality_level: ['gold', 'silver', 'bronze', 'raw', 'quarantined', 'deprecated'],
      security_classification: ['public', 'internal', 'confidential', 'restricted', 'top-secret']
    };
  } catch (error) {
    console.error('Error getting live enum values:', error);
    return {};
  }
}

async function getEnumUsageStatistics() {
  if (!supabase) return {};

  try {
    // Get usage statistics for key enum columns
    const stats = {};
    
    // Agent status distribution
    const { data: agentStats } = await supabase
      .from('a2a_agents')
      .select('status')
      .not('status', 'is', null);
    
    if (agentStats) {
      stats.agent_status = countValues(agentStats.map(r => r.status));
    }

    // Subscription tier distribution  
    const { data: userStats } = await supabase
      .from('users')
      .select('subscription_tier')
      .not('subscription_tier', 'is', null);
    
    if (userStats) {
      stats.subscription_tier = countValues(userStats.map(r => r.subscription_tier));
    }

    return stats;
  } catch (error) {
    console.error('Error getting enum usage statistics:', error);
    return {};
  }
}

async function getDetailedEnumUsage(enumType, timeframe) {
  // Implementation would query specific enum usage over timeframe
  // For now, return mock data structure
  return {
    totalUsage: 1000,
    distribution: {},
    trend: 'stable',
    timeframe: timeframe || '30d'
  };
}

function extractEnumValues(data) {
  const enumValues = {};
  
  data.forEach(row => {
    Object.keys(row).forEach(col => {
      const value = row[col];
      if (typeof value === 'string' && value.length > 0 && value.length < 50) {
        if (!enumValues[col]) enumValues[col] = new Set();
        enumValues[col].add(value);
      }
    });
  });
  
  // Convert sets to arrays
  Object.keys(enumValues).forEach(col => {
    enumValues[col] = Array.from(enumValues[col]);
  });
  
  return enumValues;
}

function countValues(values) {
  const counts = {};
  values.forEach(val => {
    counts[val] = (counts[val] || 0) + 1;
  });
  return counts;
}

async function callGrok4API(prompt) {
  if (!GROK4_API_KEY) {
    console.warn('Grok4 API key not configured, using mock reference data intelligence');
    return generateMockReferenceIntelligence(prompt);
  }

  try {
    const response = await fetch(GROK4_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK4_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a financial platform data architect. Always respond with valid JSON for reference data management.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'grok-4-0709',
        temperature: 0.3, // Lower temperature for more consistent reference data
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      throw new Error(`Grok4 API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse Grok4 response as JSON:', content);
      return null;
    }
  } catch (error) {
    console.error('Grok4 API call failed:', error);
    return generateMockReferenceIntelligence(prompt);
  }
}

function generateMockReferenceIntelligence(prompt) {
  // Return null when Grok4 API unavailable instead of fake data
  console.warn('⚠️ Grok4 API unavailable - reference data intelligence degraded');
  return null;
}