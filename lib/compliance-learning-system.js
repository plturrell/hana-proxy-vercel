/**
 * Compliance Learning System
 * Uses xAI/Grok to continuously learn from validation patterns
 * Improves compliance predictions and auto-fixes over time
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// Learning model cache
const learningCache = new Map();
let currentModel = null;

/**
 * Initialize learning system
 */
export async function initializeLearningSystem() {
  // Load existing model from database
  currentModel = await loadModel();
  
  // Start continuous learning loop
  setInterval(async () => {
    await performLearningCycle();
  }, 3600000); // Learn every hour
  
  // Initial learning cycle
  await performLearningCycle();
  
  return currentModel;
}

/**
 * Perform a learning cycle
 */
async function performLearningCycle() {
  console.log('🧠 Starting compliance learning cycle...');
  
  try {
    // 1. Gather recent data
    const recentData = await gatherRecentData();
    
    // 2. Analyze patterns with AI
    const patterns = await analyzePatterns(recentData);
    
    // 3. Update model
    const updatedModel = await updateModel(patterns);
    
    // 4. Validate improvements
    const validation = await validateModel(updatedModel);
    
    // 5. Deploy if improved
    if (validation.improved) {
      await deployModel(updatedModel);
      currentModel = updatedModel;
    }
    
    // 6. Generate insights report
    await generateInsightsReport(patterns, validation);
    
    console.log('✅ Learning cycle completed');
  } catch (error) {
    console.error('❌ Learning cycle failed:', error);
  }
}

/**
 * Gather recent compliance data
 */
async function gatherRecentData() {
  const data = {
    validations: [],
    predictions: [],
    autoFixes: [],
    failures: []
  };
  
  // Get recent validations
  const { data: validations } = await supabase
    .from('metadata_validations')
    .select('*')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1000);
  
  data.validations = validations || [];
  
  // Get predictions and their accuracy
  const { data: predictions } = await supabase
    .from('compliance_predictions')
    .select('*')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(500);
  
  data.predictions = predictions || [];
  
  // Get auto-fixes and their success rate
  const { data: autoFixes } = await supabase
    .from('compliance_auto_fixes')
    .select('*')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(500);
  
  data.autoFixes = autoFixes || [];
  
  return data;
}

/**
 * Analyze patterns with AI
 */
async function analyzePatterns(data) {
  const analysis = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are a machine learning engineer specializing in compliance patterns.
                  Analyze validation data to identify patterns and improve future predictions.`
      },
      {
        role: 'user',
        content: `Analyze this compliance data for patterns and improvements:

Validations: ${data.validations.length} records
Predictions: ${data.predictions.length} records
Auto-fixes: ${data.autoFixes.length} records

Sample data:
${JSON.stringify(data.validations.slice(0, 10), null, 2)}

Identify:
1. Common validation failure patterns
2. Successful auto-fix patterns
3. False positive predictions
4. Missing validation rules
5. Enum usage patterns
6. Resource type specific patterns

Return comprehensive analysis as JSON:
{
  "patterns": {
    "commonFailures": [
      {
        "pattern": "description",
        "frequency": 0.75,
        "resourceTypes": ["agent", "function"],
        "suggestedFix": "auto-fix approach"
      }
    ],
    "successfulFixes": [
      {
        "fixType": "enum_correction",
        "successRate": 0.95,
        "applicableTo": ["all"]
      }
    ],
    "falsePositives": [
      {
        "prediction": "what was predicted",
        "reality": "what actually happened",
        "adjustmentNeeded": "how to improve"
      }
    ],
    "enumPatterns": {
      "mostUsed": {},
      "neverUsed": {},
      "commonMistakes": {}
    }
  },
  "improvements": {
    "newRules": [
      {
        "rule": "new validation rule",
        "justification": "why needed",
        "expectedImpact": "high"
      }
    ],
    "adjustments": [
      {
        "current": "current behavior",
        "suggested": "improved behavior",
        "confidence": 0.9
      }
    ]
  },
  "modelUpdates": {
    "weights": {},
    "thresholds": {},
    "features": []
  },
  "confidence": 0.85
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 3000
  });
  
  return analysis || { patterns: {}, improvements: {}, confidence: 0 };
}

/**
 * Update the learning model
 */
async function updateModel(patterns) {
  const updatedModel = {
    version: (currentModel?.version || 0) + 1,
    timestamp: new Date().toISOString(),
    patterns: patterns.patterns,
    improvements: patterns.improvements,
    modelUpdates: patterns.modelUpdates,
    rules: await generateNewRules(patterns),
    thresholds: await optimizeThresholds(patterns),
    enumMappings: await updateEnumMappings(patterns)
  };
  
  // Apply model updates
  if (patterns.modelUpdates?.weights) {
    updatedModel.weights = {
      ...currentModel?.weights,
      ...patterns.modelUpdates.weights
    };
  }
  
  return updatedModel;
}

/**
 * Generate new validation rules based on patterns
 */
async function generateNewRules(patterns) {
  const rules = [];
  
  // Convert patterns to rules
  patterns.patterns?.commonFailures?.forEach(failure => {
    rules.push({
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pattern: failure.pattern,
      resourceTypes: failure.resourceTypes,
      condition: generateCondition(failure),
      action: failure.suggestedFix,
      confidence: failure.frequency
    });
  });
  
  // Add improvement-based rules
  patterns.improvements?.newRules?.forEach(rule => {
    rules.push({
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: rule.rule,
      justification: rule.justification,
      impact: rule.expectedImpact,
      enabled: true
    });
  });
  
  return rules;
}

/**
 * Optimize thresholds based on performance
 */
async function optimizeThresholds(patterns) {
  const thresholds = {
    autoFixConfidence: 0.9, // Default
    predictionLikelihood: 0.85,
    enumSuggestionConfidence: 0.8
  };
  
  // Adjust based on success rates
  if (patterns.patterns?.successfulFixes) {
    const avgSuccessRate = patterns.patterns.successfulFixes.reduce(
      (sum, fix) => sum + fix.successRate, 0
    ) / patterns.patterns.successfulFixes.length;
    
    if (avgSuccessRate > 0.95) {
      thresholds.autoFixConfidence = 0.85; // Lower threshold if very successful
    } else if (avgSuccessRate < 0.8) {
      thresholds.autoFixConfidence = 0.95; // Raise threshold if less successful
    }
  }
  
  return thresholds;
}

/**
 * Update enum mappings based on usage
 */
async function updateEnumMappings(patterns) {
  const mappings = {};
  
  if (patterns.patterns?.enumPatterns) {
    // Remove never-used enums from suggestions
    Object.entries(patterns.patterns.enumPatterns.neverUsed || {}).forEach(([enumType, values]) => {
      mappings[enumType] = {
        exclude: values,
        reason: 'Never used in practice'
      };
    });
    
    // Add common mistake corrections
    Object.entries(patterns.patterns.enumPatterns.commonMistakes || {}).forEach(([mistake, correction]) => {
      mappings[`correct_${mistake}`] = correction;
    });
  }
  
  return mappings;
}

/**
 * Validate the updated model
 */
async function validateModel(updatedModel) {
  // Test on recent data
  const testData = await supabase
    .from('metadata_validations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  
  let improved = 0;
  let degraded = 0;
  
  // Compare predictions
  for (const record of testData.data || []) {
    const oldPrediction = await predictWithModel(record, currentModel);
    const newPrediction = await predictWithModel(record, updatedModel);
    
    if (newPrediction.accuracy > oldPrediction.accuracy) {
      improved++;
    } else if (newPrediction.accuracy < oldPrediction.accuracy) {
      degraded++;
    }
  }
  
  const validation = {
    improved: improved > degraded,
    improvementRate: improved / (testData.data?.length || 1),
    degradationRate: degraded / (testData.data?.length || 1),
    recommendation: improved > degraded ? 'deploy' : 'reject'
  };
  
  return validation;
}

/**
 * Deploy the new model
 */
async function deployModel(model) {
  // Save to database
  await supabase
    .from('compliance_models')
    .insert({
      version: model.version,
      model_data: model,
      deployed_at: new Date(),
      status: 'active'
    });
  
  // Mark previous as inactive
  await supabase
    .from('compliance_models')
    .update({ status: 'inactive' })
    .lt('version', model.version);
  
  // Update cache
  learningCache.set('current_model', model);
  
  console.log(`🚀 Deployed model version ${model.version}`);
}

/**
 * Generate insights report
 */
async function generateInsightsReport(patterns, validation) {
  const insights = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are a compliance insights analyst. Generate executive insights from learning patterns.`
      },
      {
        role: 'user',
        content: `Generate insights report from these patterns:

${JSON.stringify(patterns, null, 2)}

Validation results:
${JSON.stringify(validation, null, 2)}

Create an executive summary with:
1. Key findings
2. Improvement areas
3. Risk trends
4. Recommendations
5. Metrics

Return as JSON:
{
  "executiveSummary": "Brief overview",
  "keyFindings": ["finding1", "finding2"],
  "improvements": {
    "achieved": ["improvement1"],
    "opportunities": ["opportunity1"]
  },
  "riskTrends": {
    "increasing": [],
    "decreasing": []
  },
  "recommendations": ["rec1", "rec2"],
  "metrics": {
    "complianceRate": 0.95,
    "autoFixSuccess": 0.88,
    "predictionAccuracy": 0.92
  }
}`
      }
    ],
    temperature: 0.4,
    max_tokens: 1500
  });
  
  if (insights && supabase) {
    await supabase
      .from('compliance_insights')
      .insert({
        report_date: new Date(),
        insights: insights,
        patterns: patterns,
        model_version: currentModel?.version || 0
      });
  }
  
  return insights;
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

async function loadModel() {
  const cached = learningCache.get('current_model');
  if (cached) return cached;
  
  const { data } = await supabase
    .from('compliance_models')
    .select('*')
    .eq('status', 'active')
    .order('version', { ascending: false })
    .limit(1)
    .single();
  
  if (data) {
    learningCache.set('current_model', data.model_data);
    return data.model_data;
  }
  
  return {
    version: 0,
    rules: [],
    thresholds: {
      autoFixConfidence: 0.9,
      predictionLikelihood: 0.85
    }
  };
}

async function predictWithModel(data, model) {
  // Real prediction using AI model
  if (!GROK_API_KEY || !model) {
    return null;
  }
  
  const prediction = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: 'You are a compliance prediction model. Analyze the data and predict compliance accuracy.'
      },
      {
        role: 'user',
        content: `Predict compliance for: ${JSON.stringify(data)}\nUsing model: ${JSON.stringify(model)}`
      }
    ],
    temperature: 0.2,
    max_tokens: 200
  });
  
  return prediction || null;
}

function generateCondition(failure) {
  // Generate rule condition from failure pattern
  return {
    type: 'pattern_match',
    pattern: failure.pattern,
    threshold: failure.frequency
  };
}

/**
 * Public API for learning system
 */
export default {
  initializeLearningSystem,
  performLearningCycle,
  getCurrentModel: () => currentModel,
  getInsights: async () => {
    const { data } = await supabase
      .from('compliance_insights')
      .select('*')
      .order('report_date', { ascending: false })
      .limit(1)
      .single();
    return data;
  }
};