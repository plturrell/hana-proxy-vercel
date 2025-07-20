/**
 * Catalog Intelligence Engine
 * Uses xAI Grok API for predictive resource discovery and contextual awareness
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// xAI Grok configuration
const GROK_API_KEY = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, context } = req.query;

  try {
    switch (action) {
      case 'predict-resources':
        return await predictRelevantResources(req, res);
      case 'analyze-relationships':
        return await analyzeResourceRelationships(req, res);
      case 'personalize-experience':
        return await personalizeUserExperience(req, res);
      case 'suggest-workflows':
        return await suggestWorkflows(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Intelligence engine error:', error);
    return res.status(500).json({ 
      error: 'Intelligence processing failed',
      details: error.message 
    });
  }
}

/**
 * Predictive Intelligence: Surface relevant resources before users search
 */
async function predictRelevantResources(req, res) {
  const { userContext, currentTime, recentActivity } = req.body;

  // Gather contextual data
  const contextData = await gatherUserContext(userContext);
  
  // Use Grok to predict what user needs
  const grokPrompt = `
You are an AI assistant for a financial analytics platform. Based on the user context below, predict which resources they will likely need next.

User Context:
- Current time: ${currentTime || new Date().toISOString()}
- Recent activity: ${JSON.stringify(recentActivity || [])}
- User role: ${userContext?.role || 'Financial Analyst'}
- Portfolio focus: ${contextData.portfolioFocus || 'Mixed'}
- Current market conditions: ${contextData.marketConditions || 'Normal'}
- Recent calculations: ${JSON.stringify(contextData.recentCalculations || [])}

Available Resources:
- Data Products: FMP Market Data, Finhub Market Data, Perplexity AI Analysis, Unified Market Data
- Functions: Pearson Correlation, Sharpe Ratio, Value at Risk, Portfolio Optimization
- Agents: Risk Analysis, Performance Analytics, Scenario Modeling

Respond with a JSON object containing:
{
  "predictions": [
    {
      "resourceType": "data-product|function|agent",
      "resourceId": "specific-resource-id",
      "confidence": 0.95,
      "reasoning": "Why this resource is relevant now",
      "urgency": "high|medium|low",
      "suggestedAction": "what user should do"
    }
  ],
  "insights": [
    {
      "type": "market-opportunity|risk-alert|efficiency-gain",
      "message": "Brief insight message",
      "confidence": 0.85
    }
  ]
}
`;

  const predictions = await callGrokAPI(grokPrompt);
  
  // Store predictions for learning
  if (supabase && predictions) {
    await supabase
      .from('ai_predictions')
      .insert({
        user_context: userContext,
        predictions: predictions,
        created_at: new Date(),
        model: 'grok-4-0709'
      });
  }

  return res.json({
    success: true,
    predictions: predictions?.predictions || [],
    insights: predictions?.insights || [],
    confidence: calculateOverallConfidence(predictions),
    timestamp: new Date().toISOString()
  });
}

/**
 * Contextual Awareness: Show relationships between agents/functions/data
 */
async function analyzeResourceRelationships(req, res) {
  const { resourceId, resourceType } = req.body;

  // Get resource details from ORD registry
  const resourceDetails = await getResourceDetails(resourceId, resourceType);
  
  const grokPrompt = `
You are analyzing relationships in a financial analytics platform. Given the resource below, identify all meaningful connections to other resources.

Target Resource:
- Type: ${resourceType}
- ID: ${resourceId}
- Details: ${JSON.stringify(resourceDetails)}

Platform Resources:
- Data Products: Real-time market data (FMP, Finhub), AI analysis (Perplexity), unified aggregation
- Functions: Statistical (correlations), Risk (VaR), Performance (Sharpe), Optimization
- Agents: Autonomous analytics agents with blockchain consensus

Analyze and respond with JSON:
{
  "directDependencies": [
    {
      "resourceType": "data-product",
      "resourceId": "fmp-market-data",
      "relationship": "consumes",
      "strength": 0.95,
      "description": "Requires real-time market data for calculations"
    }
  ],
  "relatedWorkflows": [
    {
      "workflowName": "Risk Assessment Pipeline",
      "resources": ["risk-agent", "var-function", "market-data"],
      "confidence": 0.88,
      "description": "Common workflow using this resource"
    }
  ],
  "suggestedCombinations": [
    {
      "resources": ["sharpe-ratio", "var-calculation", "market-data"],
      "useCase": "Portfolio Risk-Return Analysis",
      "confidence": 0.92
    }
  ]
}
`;

  const relationships = await callGrokAPI(grokPrompt);

  return res.json({
    success: true,
    targetResource: { id: resourceId, type: resourceType },
    relationships: relationships || {},
    timestamp: new Date().toISOString()
  });
}

/**
 * Personalize User Experience based on behavior patterns
 */
async function personalizeUserExperience(req, res) {
  const { userId, sessionData, preferences } = req.body;

  // Get user's historical behavior
  const userBehavior = await getUserBehaviorPattern(userId);
  
  const grokPrompt = `
Personalize the catalog experience for this financial professional based on their behavior patterns.

User Profile:
- ID: ${userId}
- Session Data: ${JSON.stringify(sessionData)}
- Preferences: ${JSON.stringify(preferences)}
- Historical Behavior: ${JSON.stringify(userBehavior)}

Create a personalized experience with JSON response:
{
  "personalizedSections": [
    {
      "sectionId": "recommended-for-you",
      "title": "Recommended for You",
      "resources": [
        {
          "resourceId": "risk-analysis-agent",
          "priority": 1,
          "reasoning": "Used frequently during market volatility"
        }
      ]
    }
  ],
  "adaptiveFilters": [
    {
      "filterId": "frequently-used",
      "label": "Your Favorites",
      "resources": ["list-of-resource-ids"]
    }
  ],
  "smartPrompts": [
    {
      "trigger": "morning-routine",
      "message": "Ready to analyze overnight market movements?",
      "suggestedActions": ["check-portfolio-risk", "review-news-sentiment"]
    }
  ],
  "learningPath": {
    "currentLevel": "advanced",
    "suggestedResources": ["advanced-options-modeling", "regime-switching-analysis"],
    "reasoning": "Based on your sophisticated usage patterns"
  }
}
`;

  const personalization = await callGrokAPI(grokPrompt);

  // Store personalization for refinement
  if (supabase && personalization) {
    await supabase
      .from('user_personalizations')
      .upsert({
        user_id: userId,
        personalization_data: personalization,
        updated_at: new Date()
      });
  }

  return res.json({
    success: true,
    personalization: personalization || {},
    timestamp: new Date().toISOString()
  });
}

/**
 * Suggest intelligent workflows based on current context
 */
async function suggestWorkflows(req, res) {
  const { currentResources, userGoal, marketContext } = req.body;

  const grokPrompt = `
Suggest intelligent workflows for financial analysis based on current context.

Context:
- Current Resources: ${JSON.stringify(currentResources)}
- User Goal: ${userGoal}
- Market Context: ${JSON.stringify(marketContext)}

Available Platform Capabilities:
- Real-time data from multiple sources
- 30+ statistical and risk functions
- Autonomous agents with blockchain consensus
- AI-powered analysis

Suggest optimal workflows with JSON:
{
  "workflows": [
    {
      "id": "comprehensive-risk-assessment",
      "name": "Comprehensive Risk Assessment",
      "description": "End-to-end risk analysis workflow",
      "steps": [
        {
          "step": 1,
          "action": "Gather market data",
          "resources": ["unified-market-data"],
          "estimated_time": "30 seconds"
        },
        {
          "step": 2,
          "action": "Calculate VaR metrics",
          "resources": ["var-function", "risk-agent"],
          "estimated_time": "2 minutes"
        }
      ],
      "expectedOutcome": "Complete risk profile with recommendations",
      "confidence": 0.94
    }
  ],
  "automationOpportunities": [
    {
      "workflow": "daily-risk-monitoring",
      "description": "Automate daily risk checks",
      "resources": ["risk-agent", "market-data", "alert-system"],
      "potentialTimeSaving": "15 minutes daily"
    }
  ]
}
`;

  const workflows = await callGrokAPI(grokPrompt);

  return res.json({
    success: true,
    workflows: workflows?.workflows || [],
    automationOpportunities: workflows?.automationOpportunities || [],
    timestamp: new Date().toISOString()
  });
}

/**
 * Call xAI Grok API
 */
async function callGrokAPI(prompt) {
  if (!GROK_API_KEY) {
    console.error('Grok API key not configured - AI intelligence unavailable');
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
        messages: [
          {
            role: 'system',
            content: 'You are a financial analytics AI assistant. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'grok-4-0709',
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse Grok response as JSON:', content);
      return null;
    }
  } catch (error) {
    console.error('Grok API call failed:', error);
    return null;
  }
}

/**
 * Helper functions
 */
async function gatherUserContext(userContext) {
  const defaultContext = {
    portfolioFocus: 'Mixed',
    marketConditions: 'Normal',
    recentCalculations: []
  };

  if (!supabase) return defaultContext;

  try {
    // Get recent user activity
    const { data: recentActivity } = await supabase
      .from('prdord_analytics')
      .select('function_name, created_at')
      .eq('requester_id', userContext?.userId || 'api')
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      ...defaultContext,
      recentCalculations: recentActivity || []
    };
  } catch (error) {
    console.error('Error gathering user context:', error);
    return defaultContext;
  }
}

async function getResourceDetails(resourceId, resourceType) {
  // Fetch from ORD registry
  try {
    let endpoint;
    switch (resourceType) {
      case 'data-product':
        endpoint = '/open-resource-discovery/v1/documents/data-products';
        break;
      case 'function':
        endpoint = '/open-resource-discovery/v1/documents/function-registry';
        break;
      case 'agent':
        endpoint = '/open-resource-discovery/v1/documents/analytics-platform';
        break;
      default:
        return {};
    }

    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}${endpoint}`);
    const data = await response.json();
    
    // Find specific resource
    const resources = data.dataProducts || data.apiResources || data.capabilities || [];
    return resources.find(r => r.ordId?.includes(resourceId) || r.title?.includes(resourceId)) || {};
  } catch (error) {
    console.error('Error fetching resource details:', error);
    return {};
  }
}

async function getUserBehaviorPattern(userId) {
  if (!supabase || !userId) return {};

  try {
    const { data: behavior } = await supabase
      .from('user_activity_log')
      .select('action, resource_type, timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(100);

    return {
      totalActions: behavior?.length || 0,
      frequentResources: extractFrequentResources(behavior || []),
      preferredTimeOfDay: extractPreferredTime(behavior || []),
      usagePatterns: extractUsagePatterns(behavior || [])
    };
  } catch (error) {
    console.error('Error getting user behavior:', error);
    return {};
  }
}

function extractFrequentResources(behavior) {
  const frequency = {};
  behavior.forEach(action => {
    const key = `${action.resource_type}:${action.action}`;
    frequency[key] = (frequency[key] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([resource, count]) => ({ resource, count }));
}

function extractPreferredTime(behavior) {
  const hours = behavior.map(b => new Date(b.timestamp).getHours());
  const hourCounts = {};
  hours.forEach(hour => {
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const peakHour = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)[0];
  
  return peakHour ? { hour: parseInt(peakHour[0]), count: peakHour[1] } : null;
}

function extractUsagePatterns(behavior) {
  return {
    sessionLength: behavior.length > 0 ? 'medium' : 'short',
    explorationLevel: behavior.filter(b => b.action.includes('explore')).length > 5 ? 'high' : 'medium',
    focusAreas: behavior.map(b => b.resource_type).filter((v, i, a) => a.indexOf(v) === i)
  };
}

function calculateOverallConfidence(predictions) {
  if (!predictions?.predictions?.length) return 0;
  
  const avgConfidence = predictions.predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.predictions.length;
  return Math.round(avgConfidence * 100) / 100;
}

