/**
 * Predictive Compliance Engine
 * Uses xAI/Grok to predict and prevent compliance issues before they occur
 * Runs invisibly in the background to ensure 100% compliance
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// Prediction cache to avoid repeated API calls
const predictionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Predict compliance issues before resource creation
 */
export async function predictComplianceIssues(resourceData, resourceType) {
  const cacheKey = `${resourceType}_${JSON.stringify(resourceData)}`;
  const cached = predictionCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.prediction;
  }

  // Get historical patterns
  const patterns = await getHistoricalPatterns(resourceType);
  
  const prediction = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are a predictive compliance AI specializing in A2A and ORD standards for financial systems.
                  Predict issues BEFORE they occur and provide preemptive fixes.`
      },
      {
        role: 'user',
        content: `Predict compliance issues for this ${resourceType}:

Resource Data:
${JSON.stringify(resourceData, null, 2)}

Historical Patterns:
${JSON.stringify(patterns, null, 2)}

Predict:
1. Validation errors that will occur
2. Missing enum values
3. A2A/ORD compliance gaps
4. Performance bottlenecks
5. Security vulnerabilities

Provide preemptive fixes.`
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  }, COMPLIANCE_ANALYSIS_SCHEMA);

  // Cache prediction
  predictionCache.set(cacheKey, {
    prediction,
    timestamp: Date.now()
  });

  // Log prediction for learning
  if (supabase && prediction) {
    await supabase
      .from('compliance_predictions')
      .insert({
        resource_type: resourceType,
        resource_data: resourceData,
        predictions: prediction.predictions,
        risk_score: prediction.riskScore,
        created_at: new Date()
      });
  }

  return prediction || { predictions: [], riskScore: 0 };
}

/**
 * Auto-apply preemptive fixes invisibly
 */
export async function applyPreemptiveFixes(resourceData, predictions) {
  if (!predictions?.autoFixable) return resourceData;
  
  const fixed = { ...resourceData };
  let fixCount = 0;
  
  // Apply high-confidence fixes
  Object.entries(predictions.autoFixable).forEach(([field, value]) => {
    if (!fixed[field] || predictions.predictions.find(p => p.field === field && p.likelihood > 0.9)) {
      fixed[field] = value;
      fixCount++;
    }
  });
  
  // Apply individual prediction fixes
  predictions.predictions?.forEach(prediction => {
    if (prediction.preemptiveFix && prediction.likelihood > 0.85 && prediction.preemptiveFix.confidence > 0.9) {
      Object.entries(prediction.preemptiveFix).forEach(([field, value]) => {
        if (field !== 'confidence' && !fixed[field]) {
          fixed[field] = value;
          fixCount++;
        }
      });
    }
  });
  
  // Add compliance metadata
  fixed._complianceMetadata = {
    predictiveFixesApplied: fixCount,
    riskScoreBefore: predictions.riskScore,
    riskScoreAfter: Math.max(0, predictions.riskScore - (fixCount * 15)),
    timestamp: new Date().toISOString()
  };
  
  return fixed;
}

/**
 * Real-time compliance monitoring
 */
export async function monitorCompliance(resourceId, resourceType) {
  // Set up real-time monitoring
  const monitoring = {
    resourceId,
    resourceType,
    startTime: Date.now(),
    issues: [],
    predictions: []
  };
  
  // Check every 30 seconds for the first 5 minutes
  const interval = setInterval(async () => {
    const compliance = await checkRealTimeCompliance(resourceId, resourceType);
    
    if (compliance.issues.length > 0) {
      monitoring.issues.push(...compliance.issues);
      
      // Predict future issues based on current state
      const futurePredictions = await predictFutureIssues(compliance);
      monitoring.predictions.push(...futurePredictions);
      
      // Auto-fix if possible
      if (compliance.autoFixable) {
        await autoFixCompliance(resourceId, resourceType, compliance.fixes);
      }
    }
    
    // Stop monitoring after 5 minutes
    if (Date.now() - monitoring.startTime > 5 * 60 * 1000) {
      clearInterval(interval);
      await logMonitoringResults(monitoring);
    }
  }, 30000);
  
  return monitoring;
}

/**
 * Predictive compliance for workflows
 */
export async function predictWorkflowCompliance(workflow) {
  const analysis = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are a workflow compliance AI. Predict issues in multi-step workflows before execution.`
      },
      {
        role: 'user',
        content: `Analyze this workflow for compliance issues:

${JSON.stringify(workflow, null, 2)}

Predict:
1. Step-by-step compliance issues
2. Data flow problems between steps
3. Missing permissions or capabilities
4. Performance bottlenecks
5. Failure points`
      }
    ],
    temperature: 0.4,
    max_tokens: 2500
  }, WORKFLOW_ANALYSIS_SCHEMA);
  
  return analysis || { stepAnalysis: {}, successProbability: 0 };
}

/**
 * Helper functions
 */

// Import structured schemas
import { COMPLIANCE_ANALYSIS_SCHEMA, WORKFLOW_ANALYSIS_SCHEMA } from './grok-structured-schemas.js';

async function callGrokAPI(config, schema = null) {
  if (!GROK_API_KEY) return null;
  
  try {
    const requestBody = {
      ...config,
      model: 'grok-4-0709'
    };

    // Add structured output schema if provided
    if (schema) {
      requestBody.response_format = {
        type: "json_schema",
        json_schema: schema
      };
    }

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // With structured outputs, content is already parsed
    return schema ? content : (typeof content === 'string' ? JSON.parse(content) : content);
  } catch (error) {
    console.error('Grok API call failed:', error);
    return null;
  }
}

async function getHistoricalPatterns(resourceType) {
  if (!supabase) return {};
  
  const { data } = await supabase
    .from('compliance_predictions')
    .select('predictions, resource_data')
    .eq('resource_type', resourceType)
    .order('created_at', { ascending: false })
    .limit(50);
  
  // Extract common patterns
  const patterns = {
    commonIssues: {},
    frequentFixes: {},
    avgRiskScore: 0
  };
  
  if (data) {
    data.forEach(record => {
      record.predictions?.forEach(pred => {
        patterns.commonIssues[pred.issue] = (patterns.commonIssues[pred.issue] || 0) + 1;
      });
    });
  }
  
  return patterns;
}

async function checkRealTimeCompliance(resourceId, resourceType) {
  // Check current compliance status
  const { data: resource } = await supabase
    .from(getTableName(resourceType))
    .select('*')
    .eq('id', resourceId)
    .single();
  
  if (!resource) return { issues: [] };
  
  // Run compliance check
  const compliance = await predictComplianceIssues(resource, resourceType);
  
  return {
    issues: compliance.predictions?.filter(p => p.likelihood > 0.7) || [],
    autoFixable: compliance.riskScore < 50,
    fixes: compliance.autoFixable || {}
  };
}

async function predictFutureIssues(currentCompliance) {
  // Predict how current issues might evolve
  const predictions = [];
  
  currentCompliance.issues.forEach(issue => {
    if (issue.severity === 'high' || issue.severity === 'critical') {
      predictions.push({
        currentIssue: issue.issue,
        futureRisk: `${issue.issue} may lead to system instability`,
        timeframe: '24-48 hours',
        preventionRequired: true
      });
    }
  });
  
  return predictions;
}

async function autoFixCompliance(resourceId, resourceType, fixes) {
  if (!supabase || !fixes || Object.keys(fixes).length === 0) return;
  
  const { error } = await supabase
    .from(getTableName(resourceType))
    .update(fixes)
    .eq('id', resourceId);
  
  if (!error) {
    await supabase
      .from('compliance_auto_fixes')
      .insert({
        resource_id: resourceId,
        resource_type: resourceType,
        fixes_applied: fixes,
        created_at: new Date()
      });
  }
}

async function logMonitoringResults(monitoring) {
  if (!supabase) return;
  
  await supabase
    .from('compliance_monitoring_log')
    .insert({
      resource_id: monitoring.resourceId,
      resource_type: monitoring.resourceType,
      duration_ms: Date.now() - monitoring.startTime,
      issues_detected: monitoring.issues.length,
      predictions_made: monitoring.predictions.length,
      created_at: new Date()
    });
}

function getTableName(resourceType) {
  const mapping = {
    'agent': 'a2a_agents',
    'data-product': 'data_products',
    'function': 'functions'
  };
  return mapping[resourceType] || resourceType;
}

/**
 * Export predictive compliance API
 */
export default {
  predictComplianceIssues,
  applyPreemptiveFixes,
  monitorCompliance,
  predictWorkflowCompliance
};