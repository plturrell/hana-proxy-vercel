import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Comprehensive Agent QA Evaluator using Grok/xAI
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, agent_id, evaluation_type = 'full_audit' } = req.body;

    switch (action) {
      case 'evaluate_agent':
        const evaluation = await evaluateAgent(agent_id, evaluation_type);
        return res.status(200).json(evaluation);

      case 'get_agent_summary':
        const summary = await getAgentEvaluationSummary(agent_id);
        return res.status(200).json(summary);

      case 'get_recommendations':
        const recommendations = await getAgentRecommendations(agent_id);
        return res.status(200).json(recommendations);

      case 'evaluate_all_agents':
        const batchResults = await evaluateAllAgents();
        return res.status(200).json(batchResults);

      case 'get_backlog':
        const backlog = await getEnhancementBacklog();
        return res.status(200).json(backlog);

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }

  } catch (error) {
    console.error('Agent QA Evaluator error:', error);
    return res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Core function to evaluate agent using GPT-4
async function evaluateAgent(agentId, evaluationType = 'full_audit') {
  try {
    // 1. Get current agent data
    const agentData = await getAgentImplementationData(agentId);
    const displayData = await getAgentDisplayData(agentId);

    // 2. Create Grok evaluation prompt
    const evaluationPrompt = createEvaluationPrompt(agentData, displayData, evaluationType);

    // 3. Call Grok for evaluation
    const grokResponse = await callGrokEvaluator(evaluationPrompt);

    // 4. Parse and structure the response
    const structuredEvaluation = parseGrokResponse(grokResponse);

    // 5. Store evaluation in database
    const evaluationId = await storeEvaluation(agentId, structuredEvaluation, evaluationPrompt, grokResponse);

    // 6. Generate and store recommendations
    const recommendations = await generateRecommendations(evaluationId, agentId, structuredEvaluation);

    // 7. Update backlog with enhancements
    await updateEnhancementBacklog(agentId, recommendations);

    return {
      success: true,
      evaluation_id: evaluationId,
      agent_id: agentId,
      overall_rating: structuredEvaluation.overall_rating,
      recommendations_count: recommendations.length,
      evaluation: structuredEvaluation,
      recommendations: recommendations
    };

  } catch (error) {
    console.error(`Error evaluating agent ${agentId}:`, error);
    throw error;
  }
}

// Get agent implementation data from database
async function getAgentImplementationData(agentId) {
  // Try to get from A2A agents table first
  const { data: agentCard, error } = await supabase
    .from('a2a_agents')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (error) {
    // Fallback to mock data if no database
    const mockAgentData = {
      agent_id: agentId,
      agent_name: agentId.split('.').pop().replace(/_/g, ' '),
      description: `Financial agent for ${agentId.split('.').pop()}`,
      status: 'active',
      capabilities: ['calculation', 'analysis', 'reporting'],
      model_parameters: {},
      expected_inputs: ['symbol', 'timeframe'],
      expected_outputs: ['result', 'confidence']
    };
    console.log(`Using mock data for ${agentId}: ${error.message}`);
    return {
      agent_card: mockAgentData,
      performance_metrics: [],
      function_name: agentId.split('.').pop(),
      agent_id: agentId
    };
  }

  // Also try to get function performance metrics
  const functionName = agentId.split('.').pop();
  const { data: metrics } = await supabase
    .from('function_performance_metrics')
    .select('*')
    .eq('function_name', functionName)
    .order('recorded_at', { ascending: false })
    .limit(10);

  return {
    agent_card: agentCard,
    performance_metrics: metrics || [],
    function_name: functionName,
    agent_id: agentId
  };
}

// Get agent display data from UI
async function getAgentDisplayData(agentId) {
  // This would typically fetch from the UI definition or scrape the live page
  // For now, we'll simulate with the data we know is displayed
  
  const friendlyNames = {
    'finsight.analytics.pearson_correlation': 'Portfolio Correlation',
    'finsight.analytics.value_at_risk': 'Risk Calculator',
    'finsight.ml.thompson_sampling': 'Smart Sampling',
    'finsight.nlp.sentiment_analysis': 'Market Sentiment',
    // ... add all mappings
  };

  const descriptions = {
    'finsight.analytics.pearson_correlation': 'Discover hidden relationships between your investments with intelligent correlation analysis.',
    'finsight.analytics.value_at_risk': 'Calculate your maximum potential loss with precision and confidence.',
    // ... add all descriptions
  };

  return {
    display_name: friendlyNames[agentId] || 'Unknown Agent',
    display_description: descriptions[agentId] || 'Agent description not found',
    ui_capabilities: ['Real-time analysis', 'Interactive results', 'API integration'],
    mathematical_formulas: getDisplayedFormulas(agentId),
    process_flow: getDisplayedProcessFlow(agentId)
  };
}

// Create comprehensive evaluation prompt for Grok
function createEvaluationPrompt(agentData, displayData, evaluationType) {
  return `You are an expert financial technology evaluator. Analyze this AI agent implementation and provide a comprehensive assessment.

AGENT DETAILS:
- Agent ID: ${agentData.agent_id}
- Function Name: ${agentData.function_name}
- Display Name: ${displayData.display_name}

IMPLEMENTATION DATA:
${JSON.stringify(agentData.agent_card, null, 2)}

DISPLAY DATA:
${JSON.stringify(displayData, null, 2)}

PERFORMANCE METRICS:
${JSON.stringify(agentData.performance_metrics, null, 2)}

EVALUATION REQUIREMENTS:
Please provide a detailed evaluation in the following JSON format:

{
  "overall_rating": <integer 0-100>,
  "display_accuracy_rating": <integer 0-100>,
  "implementation_quality_rating": <integer 0-100>,
  "documentation_rating": <integer 0-100>,
  "user_experience_rating": <integer 0-100>,
  
  "analysis": {
    "strengths": [<array of strength descriptions>],
    "weaknesses": [<array of weakness descriptions>],
    "discrepancies": [<array of display vs implementation gaps>],
    "performance_assessment": "<assessment of metrics and reliability>"
  },
  
  "recommendations": [
    {
      "type": "<critical|enhancement|optimization|ui_improvement>",
      "priority": <1-10>,
      "title": "<recommendation title>",
      "description": "<detailed description>",
      "implementation": "<suggested implementation approach>",
      "effort": "<hours|days|weeks>",
      "impact": "<high|medium|low>",
      "benefit": "<expected benefit description>"
    }
  ],
  
  "enhancements": [
    {
      "feature_title": "<enhancement title>",
      "description": "<detailed description>",
      "business_value": "<business justification>",
      "priority_score": <1-100>,
      "complexity": <1-10>
    }
  ]
}

EVALUATION CRITERIA:
1. Display Accuracy (25%): Does the UI accurately represent what the agent actually does?
2. Implementation Quality (25%): Is the underlying implementation robust and well-designed?
3. Documentation (20%): Are the descriptions, formulas, and process flows accurate and helpful?
4. User Experience (20%): Is the interface intuitive and educational?
5. Performance (10%): Based on metrics, how well does the agent perform?

Focus on:
- Accuracy of mathematical formulas shown vs actual implementation
- Clarity and correctness of process flow descriptions
- Alignment between display name/description and actual capabilities
- Performance metrics and reliability indicators
- User educational value and ease of understanding
- Technical implementation quality and error handling

Be thorough and specific in your analysis.`;
}

// Call Grok for evaluation using existing edge function
async function callGrokEvaluator(prompt) {
  try {
    // Use your existing grok-credit-analysis edge function
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/grok-credit-analysis`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'agent_evaluation',
        evaluation_prompt: prompt,
        agent_context: 'financial_ai_system',
        evaluation_type: 'comprehensive_qa_audit'
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle the response structure from your existing Grok function
    if (result.success) {
      return result.evaluation || result.analysis || result;
    } else {
      throw new Error(result.error || 'Grok evaluation failed');
    }
  } catch (error) {
    console.error('Grok API error:', error);
    
    // Fallback evaluation if Grok is unavailable
    return {
      overall_rating: 75,
      display_accuracy_rating: 75,
      implementation_quality_rating: 75,
      documentation_rating: 75,
      user_experience_rating: 75,
      analysis: {
        strengths: ['Agent appears functional'],
        weaknesses: ['Unable to perform full AI evaluation - Grok unavailable'],
        discrepancies: ['Manual review required'],
        performance_assessment: 'Grok evaluation service unavailable - using fallback ratings'
      },
      recommendations: [{
        type: 'manual_review',
        priority: 8,
        title: 'Manual evaluation required',
        description: 'Grok AI evaluation was unavailable - manual review recommended',
        implementation: 'Schedule manual code review',
        effort: 'hours',
        impact: 'medium',
        benefit: 'Ensure agent quality through human review'
      }],
      enhancements: []
    };
  }
}

// Parse and structure Grok response
function parseGrokResponse(grokResponse) {
  // Validate and structure the response
  const evaluation = {
    overall_rating: grokResponse.overall_rating || 0,
    display_accuracy_rating: grokResponse.display_accuracy_rating || 0,
    implementation_quality_rating: grokResponse.implementation_quality_rating || 0,
    documentation_rating: grokResponse.documentation_rating || 0,
    user_experience_rating: grokResponse.user_experience_rating || 0,
    
    strengths: grokResponse.analysis?.strengths || [],
    weaknesses: grokResponse.analysis?.weaknesses || [],
    discrepancies: grokResponse.analysis?.discrepancies || [],
    performance_assessment: grokResponse.analysis?.performance_assessment || '',
    
    raw_analysis: grokResponse.analysis || {},
    recommendations: grokResponse.recommendations || [],
    enhancements: grokResponse.enhancements || []
  };

  return evaluation;
}

// Store evaluation in database
async function storeEvaluation(agentId, evaluation, prompt, rawResponse) {
  const { data, error } = await supabase
    .from('agent_evaluations')
    .insert({
      agent_id: agentId,
      evaluation_type: 'grok_full_audit',
      overall_rating: evaluation.overall_rating,
      display_accuracy_rating: evaluation.display_accuracy_rating,
      implementation_quality_rating: evaluation.implementation_quality_rating,
      documentation_rating: evaluation.documentation_rating,
      user_experience_rating: evaluation.user_experience_rating,
      
      display_vs_implementation_analysis: evaluation.performance_assessment,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      discrepancies: evaluation.discrepancies,
      
      full_grok_response: rawResponse,
      evaluation_prompt: prompt,
      grok_model_version: 'grok-beta'
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to store evaluation: ${error.message}`);
  return data.id;
}

// Generate and store recommendations
async function generateRecommendations(evaluationId, agentId, evaluation) {
  const recommendations = [];

  for (const rec of evaluation.recommendations) {
    const priority = calculatePriority(rec.impact, rec.effort, evaluation.overall_rating);
    
    const { data, error } = await supabase
      .from('agent_recommendations')
      .insert({
        evaluation_id: evaluationId,
        agent_id: agentId,
        recommendation_type: rec.type,
        priority_score: priority,
        impact_level: rec.impact,
        effort_estimate: rec.effort,
        title: rec.title,
        description: rec.description,
        suggested_implementation: rec.implementation,
        expected_benefit: rec.benefit
      })
      .select()
      .single();

    if (!error) {
      recommendations.push(data);
    }
  }

  return recommendations;
}

// Update enhancement backlog
async function updateEnhancementBacklog(agentId, recommendations) {
  // Convert high-impact recommendations to backlog items
  const backlogItems = recommendations
    .filter(rec => rec.impact_level === 'high' && rec.priority_score >= 7)
    .map(rec => ({
      agent_id: agentId,
      feature_title: rec.title,
      feature_description: rec.description,
      business_value: rec.expected_benefit,
      priority_score: rec.priority_score * 10, // Scale to 100
      business_impact: rec.impact_level === 'high' ? 8 : rec.impact_level === 'medium' ? 5 : 2,
      technical_complexity: rec.effort_estimate === 'hours' ? 3 : rec.effort_estimate === 'days' ? 6 : 9,
      source: 'gpt4_recommendation',
      source_reference_id: rec.id
    }));

  if (backlogItems.length > 0) {
    const { error } = await supabase
      .from('agent_enhancement_backlog')
      .insert(backlogItems);

    if (error) {
      console.error('Failed to update backlog:', error);
    }
  }
}

// Helper functions
function calculatePriority(impact, effort, rating) {
  const impactScore = impact === 'high' ? 8 : impact === 'medium' ? 5 : 2;
  const effortScore = effort === 'hours' ? 8 : effort === 'days' ? 5 : 2;
  const ratingScore = rating < 50 ? 9 : rating < 70 ? 6 : rating < 85 ? 4 : 2;
  
  return Math.min(10, Math.max(1, Math.round((impactScore + effortScore + ratingScore) / 3)));
}

function getDisplayedFormulas(agentId) {
  // Return the mathematical formulas currently displayed for this agent
  const formulas = {
    'finsight.analytics.pearson_correlation': 'ρ = Σ(Xi - X̄)(Yi - Ȳ) / √[Σ(Xi - X̄)²] × √[Σ(Yi - Ȳ)²]',
    'finsight.analytics.value_at_risk': 'VaRα = μ - σ × Φ⁻¹(α)',
    // ... add all formulas
  };
  return formulas[agentId] || 'No formula displayed';
}

function getDisplayedProcessFlow(agentId) {
  // Return the process flow currently displayed for this agent
  const flows = {
    'finsight.analytics.pearson_correlation': ['Data Input', 'Preprocessing', 'Calculate', 'Analyze', 'Output'],
    'finsight.analytics.value_at_risk': ['Portfolio Data', 'Risk Factors', 'Simulation', 'VaR Calculation', 'Report'],
    // ... add all flows
  };
  return flows[agentId] || ['Input', 'Process', 'Output'];
}

// Get agent evaluation summary
async function getAgentEvaluationSummary(agentId) {
  const { data, error } = await supabase
    .rpc('get_agent_evaluation_summary', { p_agent_id: agentId });

  if (error) throw new Error(`Failed to get evaluation summary: ${error.message}`);
  return data[0] || {};
}

// Get agent recommendations
async function getAgentRecommendations(agentId) {
  const { data, error } = await supabase
    .from('agent_recommendations')
    .select('*')
    .eq('agent_id', agentId)
    .eq('status', 'open')
    .order('priority_score', { ascending: false });

  if (error) throw new Error(`Failed to get recommendations: ${error.message}`);
  return data;
}

// Evaluate all agents (batch processing)
async function evaluateAllAgents() {
  // Get all agent IDs - try multiple approaches
  let agents = [];
  
  // Try A2A agents table first
  const { data: agentData, error } = await supabase
    .from('a2a_agents')
    .select('agent_id')
    .limit(10);

  if (!error && agentData) {
    agents = agentData;
  } else {
    // Fallback to predefined list of agents
    agents = [
      { agent_id: 'finsight.analytics.pearson_correlation' },
      { agent_id: 'finsight.analytics.value_at_risk' },
      { agent_id: 'finsight.ml.thompson_sampling' },
      { agent_id: 'finsight.nlp.sentiment_analysis' },
      { agent_id: 'finsight.treasury.black_scholes' }
    ];
    console.log('Using fallback agent list:', error?.message);
  }

  const results = [];
  for (const agent of agents.slice(0, 5)) { // Limit to 5 for demo
    try {
      const evaluation = await evaluateAgent(agent.agent_id, 'quick_audit');
      results.push(evaluation);
      
      // Add delay to respect Grok API limits
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      results.push({
        agent_id: agent.agent_id,
        error: error.message,
        success: false
      });
    }
  }

  return {
    total_evaluated: results.length,
    successful: results.filter(r => r.success).length,
    results: results
  };
}

// Get enhancement backlog
async function getEnhancementBacklog() {
  const { data, error } = await supabase
    .from('agent_enhancement_backlog')
    .select('*')
    .order('priority_score', { ascending: false })
    .limit(50);

  if (error) throw new Error(`Failed to get backlog: ${error.message}`);
  return data;
}