/**
 * Natural Language Financial AI Interface
 * Converts complex financial operations into simple conversational interactions
 * Makes sophisticated analysis accessible through plain English
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// Conversation context cache
const conversationContext = new Map();
const userLearningProfiles = new Map();

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
      case 'natural-query':
        return await processNaturalLanguageQuery(req, res);
      case 'conversational-analysis':
        return await enableConversationalAnalysis(req, res);
      case 'explain-complex':
        return await explainComplexConcepts(req, res);
      case 'smart-suggestions':
        return await generateSmartSuggestions(req, res);
      case 'adaptive-interface':
        return await createAdaptiveInterface(req, res);
      case 'learning-assistant':
        return await enableLearningAssistant(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Natural Language AI error:', error);
    return res.status(500).json({ 
      error: 'Natural Language processing failed',
      details: error.message 
    });
  }
}

/**
 * Process Natural Language Financial Queries
 */
async function processNaturalLanguageQuery(req, res) {
  const { 
    query, 
    userId, 
    portfolioContext, 
    conversationHistory 
  } = req.body;
  
  const naturalLanguageResponse = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are a sophisticated financial AI assistant that converts natural language into executable financial operations. You understand:
- Portfolio analysis and risk management
- Market data analysis and trading strategies  
- Financial calculations and modeling
- Investment research and due diligence
- Regulatory compliance and reporting

Convert user queries into actionable financial operations with clear explanations.`
      },
      {
        role: 'user',
        content: `Process this natural language financial query:

User Query: "${query}"
User ID: ${userId}
Portfolio Context: ${JSON.stringify(portfolioContext)}
Conversation History: ${JSON.stringify(conversationHistory)}

Convert to executable operations:
{
  "query_understanding": {
    "primary_intent": "what user wants to accomplish",
    "financial_domain": "risk|portfolio|trading|research|compliance|analysis",
    "complexity_level": "beginner|intermediate|advanced",
    "urgency": "immediate|soon|planning",
    "scope": "single_stock|portfolio|market|sector"
  },
  "executable_operations": [
    {
      "operation": "specific financial operation to execute",
      "api_endpoint": "which API endpoint to call",
      "parameters": {
        "symbol": "AAPL",
        "analysis_type": "risk_analysis",
        "timeframe": "1Y",
        "confidence_level": 0.95
      },
      "data_requirements": "what data is needed",
      "execution_order": "sequence if multiple operations"
    }
  ],
  "plain_english_explanation": {
    "what_ill_do": "Simple explanation of what analysis will be performed",
    "why_its_relevant": "Why this analysis answers their question",
    "what_to_expect": "What kind of results they'll get",
    "estimated_time": "how long this will take"
  },
  "intelligent_defaults": {
    "parameters_set": "parameters I'm setting automatically",
    "assumptions_made": "assumptions based on their portfolio/history",
    "customization_options": "what they can adjust if needed"
  },
  "contextual_enhancements": [
    {
      "enhancement": "additional analysis that would be valuable",
      "reasoning": "why this would help them",
      "effort": "minimal|moderate|significant",
      "auto_include": "should I include this automatically?"
    }
  ],
  "follow_up_suggestions": [
    {
      "suggestion": "natural language suggestion for next analysis",
      "value": "what additional insight this would provide",
      "complexity": "how complex this would be to execute"
    }
  ],
  "learning_opportunities": {
    "concepts_to_explain": "financial concepts I could teach",
    "skill_building": "how this query helps build their expertise",
    "advanced_features": "more sophisticated analysis they might want"
  }
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2500
  });

  // Execute the operations automatically
  const executionResults = await executeFinancialOperations(naturalLanguageResponse);
  
  // Update conversation context
  await updateConversationContext(userId, query, naturalLanguageResponse, executionResults);

  return res.json({
    original_query: query,
    ai_understanding: naturalLanguageResponse || {},
    execution_results: executionResults,
    magic_factor: "Complex financial operations executed through simple conversation",
    timestamp: new Date().toISOString()
  });
}

/**
 * Enable Conversational Analysis (Back-and-forth financial discussion)
 */
async function enableConversationalAnalysis(req, res) {
  const { message, userId, analysisContext } = req.body;
  
  const conversationalResponse = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are a conversational financial analyst AI. Engage in natural dialogue about financial analysis, explaining complex concepts simply and asking clarifying questions when needed.`
      },
      {
        role: 'user',
        content: `Continue this financial conversation:

User Message: "${message}"
Analysis Context: ${JSON.stringify(analysisContext)}

Provide conversational response:
{
  "conversational_response": {
    "primary_response": "natural, conversational response to their message",
    "tone": "friendly|professional|educational|analytical",
    "complexity_level": "adjusted for user's apparent expertise",
    "engagement": "how to keep conversation productive"
  },
  "clarifying_questions": [
    {
      "question": "specific question to better understand their needs",
      "purpose": "why this question would help",
      "optional": "whether user must answer or if I can assume"
    }
  ],
  "analysis_insights": {
    "key_findings": "important insights from current analysis",
    "implications": "what these findings mean for user",
    "actionable_recommendations": "specific actions they could take",
    "risk_considerations": "risks they should be aware of"
  },
  "conversational_enhancements": {
    "analogies": "simple analogies to explain complex concepts",
    "examples": "concrete examples using their portfolio",
    "visualizations": "charts or graphs that would help explain",
    "progressive_disclosure": "how to reveal complexity gradually"
  },
  "next_conversation_steps": [
    {
      "direction": "natural next topic in conversation",
      "analysis_required": "analysis needed to support this direction",
      "user_benefit": "how this helps achieve their goals"
    }
  ]
}`
      }
    ],
    temperature: 0.4,
    max_tokens: 2000
  });

  return res.json({
    user_message: message,
    ai_response: conversationalResponse || {},
    conversation_quality: "Natural financial dialogue enabled",
    learning_mode: "Adaptive to user expertise level"
  });
}

/**
 * Explain Complex Financial Concepts in Plain English
 */
async function explainComplexConcepts(req, res) {
  const { concept, userLevel, specificContext } = req.body;
  
  const explanation = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are a financial education AI. Explain complex financial concepts in simple, relatable terms that anyone can understand, with practical examples.`
      },
      {
        role: 'user',
        content: `Explain this financial concept in simple terms:

Concept: ${concept}
User Level: ${userLevel}
Specific Context: ${JSON.stringify(specificContext)}

Provide clear explanation:
{
  "simple_explanation": {
    "core_concept": "what this concept is in simple words",
    "why_it_matters": "why this is important for investors",
    "real_world_analogy": "simple analogy that makes concept clear",
    "practical_application": "how they would use this in practice"
  },
  "progressive_understanding": {
    "basic_level": "explanation for beginners",
    "intermediate_level": "additional details for intermediate users",
    "advanced_level": "sophisticated nuances for experts",
    "current_recommended_level": "which level is right for this user"
  },
  "concrete_examples": [
    {
      "example": "specific example using real numbers",
      "context": "when this situation might occur",
      "outcome": "what the result would be",
      "lesson": "key learning from this example"
    }
  ],
  "interactive_learning": {
    "questions_to_ponder": "questions that deepen understanding",
    "scenarios_to_explore": "situations where they could apply this",
    "calculations_to_try": "simple calculations they can do",
    "further_reading": "next concepts to explore"
  },
  "common_misconceptions": [
    {
      "misconception": "common wrong understanding",
      "reality": "what's actually true",
      "clarification": "how to think about it correctly"
    }
  ],
  "personalized_relevance": {
    "portfolio_application": "how this applies to their specific portfolio",
    "risk_relevance": "how this affects their risk profile",
    "opportunity_identification": "opportunities this knowledge reveals",
    "decision_improvement": "how this improves their decision-making"
  }
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2500
  });

  return res.json({
    concept: concept,
    user_level: userLevel,
    ai_explanation: explanation || {},
    learning_approach: "Adaptive complexity with practical examples",
    mastery_tracking: "Understanding level adapted to user progress"
  });
}

/**
 * Generate Smart Suggestions Based on Context
 */
async function generateSmartSuggestions(req, res) {
  const { currentActivity, portfolioState, marketConditions } = req.body;
  
  const smartSuggestions = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are a proactive financial advisory AI. Generate intelligent suggestions that help users discover valuable analysis and opportunities they might not have considered.`
      },
      {
        role: 'user',
        content: `Generate smart suggestions for this user:

Current Activity: ${currentActivity}
Portfolio State: ${JSON.stringify(portfolioState)}
Market Conditions: ${JSON.stringify(marketConditions)}

Provide intelligent suggestions:
{
  "immediate_suggestions": [
    {
      "suggestion": "specific analysis or action to suggest",
      "reasoning": "why this would be valuable right now",
      "effort_level": "one_click|5_minutes|detailed_analysis",
      "value_proposition": "what insight or benefit they'll gain",
      "urgency": "time_sensitive|beneficial|educational"
    }
  ],
  "contextual_opportunities": [
    {
      "opportunity": "opportunity they might not have noticed",
      "discovery_method": "how AI identified this opportunity",
      "potential_impact": "quantified benefit if they act",
      "risk_level": "low|medium|high",
      "execution_complexity": "simple|moderate|complex"
    }
  ],
  "learning_suggestions": [
    {
      "topic": "financial concept they could benefit from learning",
      "relevance": "how this applies to their current situation",
      "learning_method": "interactive|guided|self_study",
      "time_investment": "time needed to learn this",
      "practical_application": "how they'd apply this knowledge"
    }
  ],
  "workflow_optimizations": [
    {
      "optimization": "way to improve their analysis workflow",
      "current_inefficiency": "what they're doing the hard way",
      "improved_approach": "easier/faster way to achieve same result",
      "automation_potential": "what can be automated",
      "time_savings": "how much time this saves"
    }
  ],
  "predictive_recommendations": [
    {
      "recommendation": "forward-looking recommendation",
      "prediction_basis": "what trends/patterns support this",
      "preparation_steps": "what they can do to prepare",
      "timing_considerations": "when to act on this",
      "success_metrics": "how to measure success"
    }
  ]
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2500
  });

  return res.json({
    activity_context: currentActivity,
    smart_suggestions: smartSuggestions || {},
    ai_intelligence: "Proactive discovery of valuable opportunities",
    personalization: "Tailored to user's specific situation and goals"
  });
}

/**
 * Create Adaptive Interface Based on User's Natural Language Patterns
 */
async function createAdaptiveInterface(req, res) {
  const { userCommunicationStyle, preferredComplexity, learningGoals } = req.body;
  
  const adaptiveInterface = await callGrokAPI({
    messages: [
      {
        role: 'system',
        content: `You are an adaptive interface AI. Design personalized interfaces that match each user's communication style and learning preferences.`
      },
      {
        role: 'user',
        content: `Design adaptive interface for this user:

Communication Style: ${userCommunicationStyle}
Preferred Complexity: ${preferredComplexity}
Learning Goals: ${JSON.stringify(learningGoals)}

Create personalized interface:
{
  "interface_personalization": {
    "language_style": "technical|conversational|simplified|academic",
    "information_density": "minimal|balanced|detailed|comprehensive",
    "explanation_depth": "basic|standard|detailed|expert",
    "interaction_pace": "quick|moderate|thorough|exploratory"
  },
  "adaptive_features": {
    "vocabulary_adjustment": "how to adjust financial terminology",
    "concept_introduction": "how to introduce new concepts",
    "progress_tracking": "how to track and adapt to learning progress",
    "difficulty_scaling": "how to gradually increase complexity"
  },
  "communication_preferences": {
    "response_format": "conversational|structured|visual|analytical",
    "explanation_style": "analogies|examples|formulas|scenarios",
    "feedback_approach": "encouraging|neutral|challenging|collaborative",
    "question_handling": "immediate_answers|guided_discovery|self_exploration"
  },
  "learning_optimization": {
    "knowledge_gaps": "areas where user needs support",
    "strength_areas": "areas where user is already strong",
    "interest_alignment": "how to align with user's interests",
    "motivation_factors": "what motivates this user to learn"
  },
  "interface_automation": {
    "auto_simplification": "when to automatically simplify explanations",
    "progressive_revelation": "how to reveal complexity gradually",
    "contextual_help": "when and how to offer assistance",
    "smart_defaults": "interface settings optimized for this user"
  }
}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });

  return res.json({
    user_profile: {
      communication_style: userCommunicationStyle,
      complexity_preference: preferredComplexity
    },
    adaptive_interface: adaptiveInterface || {},
    personalization_level: "Deep adaptation to individual preferences",
    continuous_learning: "Interface improves based on interaction patterns"
  });
}

/**
 * Helper Functions
 */

async function callGrokAPI(config) {
  if (!GROK_API_KEY) {
    console.error('Grok API key not configured - Natural Language AI unavailable');
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
    } catch {
      console.error('Failed to parse natural language response');
      return null;
    }
  } catch (error) {
    console.error('Natural Language API call failed:', error);
    return null;
  }
}

async function executeFinancialOperations(operations) {
  if (!operations?.executable_operations) {
    return { success: false, reason: 'No operations to execute' };
  }
  
  const results = [];
  
  for (const operation of operations.executable_operations) {
    try {
      console.log(`🔧 Executing: ${operation.operation}`);
      
      // Route to actual financial API endpoints based on operation type
      let result;
      switch (operation.operation) {
        case 'risk_analysis':
          result = await executeRiskAnalysis(operation.parameters);
          break;
        case 'portfolio_optimization':
          result = await executePortfolioOptimization(operation.parameters);
          break;
        case 'market_data_analysis':
          result = await executeMarketDataAnalysis(operation.parameters);
          break;
        case 'technical_indicators':
          result = await executeTechnicalIndicators(operation.parameters);
          break;
        default:
          // Fallback to existing API endpoints
          result = await executeGenericFinancialOperation(operation);
      }
      
      results.push({
        operation: operation.operation,
        status: 'completed',
        timestamp: new Date(),
        data: result
      });
    } catch (error) {
      console.error(`Failed to execute operation: ${operation.operation}`, error);
      results.push({
        operation: operation.operation,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  return {
    success: true,
    operations_executed: results.length,
    results: results
  };
}

// Real financial operation executors
async function executeRiskAnalysis(params) {
  const endpoint = `/api/functions/value_at_risk?symbol=${params.symbol}&confidence_level=${params.confidence_level}`;
  const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}${endpoint}`);
  return response.ok ? await response.json() : null;
}

async function executePortfolioOptimization(params) {
  const endpoint = `/api/functions/monte_carlo`;
  const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return response.ok ? await response.json() : null;
}

async function executeMarketDataAnalysis(params) {
  const endpoint = `/api/market-data-unified?symbol=${params.symbol}`;
  const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}${endpoint}`);
  return response.ok ? await response.json() : null;
}

async function executeTechnicalIndicators(params) {
  const endpoint = `/api/functions/technical_indicators`;
  const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return response.ok ? await response.json() : null;
}

async function executeGenericFinancialOperation(operation) {
  // Try to route to appropriate existing API endpoint
  if (operation.api_endpoint) {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}${operation.api_endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operation.parameters)
    });
    return response.ok ? await response.json() : null;
  }
  return null;
}

async function updateConversationContext(userId, query, aiResponse, executionResults) {
  if (!supabase) return;
  
  await supabase
    .from('conversation_context')
    .insert({
      user_id: userId,
      user_query: query,
      ai_response: aiResponse,
      execution_results: executionResults,
      created_at: new Date()
    });
}

/**
 * Export natural language functions
 */
export const NaturalLanguageFinanceAI = {
  processNaturalLanguageQuery,
  enableConversationalAnalysis,
  explainComplexConcepts,
  generateSmartSuggestions,
  createAdaptiveInterface
};