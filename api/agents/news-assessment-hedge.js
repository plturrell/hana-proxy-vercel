/**
 * News Assessment & Hedge Agent API Endpoint
 * RESTful interface for news-driven hedge recommendations and risk assessment
 */

import { IntelligentNewsAssessmentAgent } from '../../agents/news-assessment-hedge-agent-v2.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with error handling
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey
  });
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

let newsHedgeAgent = null;

async function initializeNewsHedgeAgent() {
  if (!newsHedgeAgent) {
    const agentData = {
      agent_id: 'finsight.risk.news_assessment_hedge',
      agent_name: 'News Assessment & Hedge Agent',
      agent_type: 'risk_management',
      voting_power: 120, // High voting power for risk management decisions
      connection_config: {
        goals: [
          'Assess portfolio impact of news events',
          'Generate optimal hedge recommendations',
          'Monitor hedge effectiveness in real-time',
          'Provide cost-benefit analysis for risk mitigation'
        ],
        personality: 'analytical'
      }
    };
    
    // Always create the agent instance
    newsHedgeAgent = new IntelligentNewsAssessmentAgent(agentData);
    
    try {
      // Try to initialize with database connections
      await newsHedgeAgent.initialize();
      console.log('📈 News Assessment & Hedge Agent initialized and ready');
    } catch (error) {
      console.error('Failed to fully initialize News Assessment & Hedge Agent:', error);
      console.log('📈 News Assessment & Hedge Agent running without database connection');
    }
  }
  
  return newsHedgeAgent;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Agent-ID');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check if Supabase is properly configured
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Database connection not configured',
        agent_id: 'finsight.risk.news_assessment_hedge',
        status: 'error'
      });
    }
    
    // Initialize agent if needed
    const agent = await initializeNewsHedgeAgent();

    const { action } = req.query;

    if (req.method === 'GET') {
      switch (action) {
        case 'status':
          return await handleStatusRequest(req, res, agent);
        case 'classifications':
          return await handleClassificationsRequest(req, res, agent);
        case 'hedge_instruments':
          return await handleHedgeInstrumentsRequest(req, res, agent);
        case 'active_recommendations':
          return await handleActiveRecommendationsRequest(req, res, agent);
        case 'news_log':
          return await handleNewsLogRequest(req, res, agent);
        case 'statistics':
          return await handleStatisticsRequest(req, res, agent);
        default:
          return await handleStatusRequest(req, res, agent);
      }
    }

    if (req.method === 'POST') {
      const { action } = req.body;
      
      switch (action) {
        case 'process_news':
          return await handleProcessNewsRequest(req, res, agent);
        case 'assess_impact':
          return await handleAssessImpactRequest(req, res, agent);
        case 'generate_hedges':
          return await handleGenerateHedgesRequest(req, res, agent);
        case 'validate_strategy':
          return await handleValidateStrategyRequest(req, res, agent);
        case 'calculate_scenarios':
          return await handleCalculateScenariosRequest(req, res, agent);
        case 'monitor_effectiveness':
          return await handleMonitorEffectivenessRequest(req, res, agent);
        default:
          return res.status(400).json({
            success: false,
            error: 'Unknown action',
            available_actions: ['process_news', 'assess_impact', 'generate_hedges', 'validate_strategy', 'calculate_scenarios', 'monitor_effectiveness']
          });
      }
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed_methods: ['GET', 'POST', 'OPTIONS']
    });

  } catch (error) {
    console.error('News Assessment & Hedge Agent error:', error);
    return res.status(500).json({
      success: false,
      error: 'News hedge agent error',
      details: error.message
    });
  }
}

/**
 * Handle status requests
 */
async function handleStatusRequest(req, res, agent) {
  try {
    const stats = await agent.getAgentStatistics();
    
    return res.json({
      success: true,
      agent_id: agent.id,
      agent_name: agent.name,
      status: 'active',
      uptime: process.uptime(),
      capabilities: agent.capabilities,
      hedge_categories: Object.keys(agent.hedgeInstruments),
      impact_classifications: Object.keys(agent.impactClassification),
      statistics: stats,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get status',
      details: error.message
    });
  }
}

/**
 * Handle impact classifications request
 */
async function handleClassificationsRequest(req, res, agent) {
  try {
    return res.json({
      success: true,
      impact_classification: agent.impactClassification,
      total_categories: Object.keys(agent.impactClassification).length,
      supported_events: Object.keys(agent.impactClassification).reduce((acc, category) => {
        return acc + Object.keys(agent.impactClassification[category]).length;
      }, 0),
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get classifications',
      details: error.message
    });
  }
}

/**
 * Handle hedge instruments request
 */
async function handleHedgeInstrumentsRequest(req, res, agent) {
  try {
    const { category } = req.query;
    
    let instruments = agent.hedgeInstruments;
    if (category && instruments[category]) {
      instruments = { [category]: instruments[category] };
    }

    return res.json({
      success: true,
      hedge_instruments: instruments,
      total_categories: Object.keys(agent.hedgeInstruments).length,
      filter_applied: category || 'none',
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get hedge instruments',
      details: error.message
    });
  }
}

/**
 * Handle active recommendations request
 */
async function handleActiveRecommendationsRequest(req, res, agent) {
  try {
    const recommendations = Array.from(agent.activeRecommendations.entries()).map(([id, rec]) => ({
      recommendation_id: id,
      ...rec
    }));

    return res.json({
      success: true,
      active_recommendations: recommendations,
      total_active: recommendations.length,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get active recommendations',
      details: error.message
    });
  }
}

/**
 * Handle news log request
 */
async function handleNewsLogRequest(req, res, agent) {
  try {
    const { limit = 50, category } = req.query;
    
    let newsLog = agent.newsEventLog;
    
    if (category) {
      newsLog = newsLog.filter(event => 
        event.classification && event.classification.primary_category === category
      );
    }
    
    // Sort by timestamp (most recent first) and limit
    newsLog = newsLog
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    return res.json({
      success: true,
      news_events: newsLog,
      total_returned: newsLog.length,
      filters_applied: { category: category || 'none', limit: parseInt(limit) },
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get news log',
      details: error.message
    });
  }
}

/**
 * Handle statistics request
 */
async function handleStatisticsRequest(req, res, agent) {
  try {
    const stats = await agent.getAgentStatistics();
    
    return res.json({
      success: true,
      statistics: stats,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      details: error.message
    });
  }
}

/**
 * Handle process news request
 */
async function handleProcessNewsRequest(req, res, agent) {
  try {
    const { news_event } = req.body;

    if (!news_event || !news_event.headline) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: news_event with headline'
      });
    }

    const analysis = await agent.processNewsEvent(news_event);

    return res.json({
      success: true,
      analysis: analysis,
      recommendations_generated: analysis.hedge_recommendations.length,
      confidence_score: analysis.confidence_score,
      urgency_level: analysis.urgency_level,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'News processing failed',
      details: error.message
    });
  }
}

/**
 * Handle assess impact request
 */
async function handleAssessImpactRequest(req, res, agent) {
  try {
    const { news_event, portfolio_override } = req.body;

    if (!news_event) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: news_event'
      });
    }

    // Classify the news event
    const classification = agent.classifyNewsEvent(news_event);
    
    // Assess portfolio impact
    const impact = await agent.assessPortfolioImpact(news_event, classification);

    return res.json({
      success: true,
      classification: classification,
      impact_assessment: impact,
      affected_assets: classification.affected_assets,
      total_var_change: impact.total_portfolio_var_change,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Impact assessment failed',
      details: error.message
    });
  }
}

/**
 * Handle generate hedges request
 */
async function handleGenerateHedgesRequest(req, res, agent) {
  try {
    const { impact_assessment, scenarios, constraints } = req.body;

    if (!impact_assessment) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: impact_assessment'
      });
    }

    const hedgeRecommendations = await agent.generateHedgeRecommendations(
      impact_assessment, 
      scenarios || {}
    );

    return res.json({
      success: true,
      hedge_recommendations: hedgeRecommendations,
      total_recommendations: hedgeRecommendations.length,
      best_cost_benefit_ratio: hedgeRecommendations.length > 0 ? hedgeRecommendations[0].cost_benefit_ratio : 0,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Hedge generation failed',
      details: error.message
    });
  }
}

/**
 * Handle validate strategy request
 */
async function handleValidateStrategyRequest(req, res, agent) {
  try {
    const { hedge_recommendations } = req.body;

    if (!hedge_recommendations || !Array.isArray(hedge_recommendations)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: hedge_recommendations (array)'
      });
    }

    const validation = await agent.validateHedgeStrategies(hedge_recommendations);

    return res.json({
      success: true,
      validation: validation,
      compliant: validation.cfa_compliant && validation.treasury_compliant,
      issues_found: validation.regulatory_issues.length,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Strategy validation failed',
      details: error.message
    });
  }
}

/**
 * Handle calculate scenarios request
 */
async function handleCalculateScenariosRequest(req, res, agent) {
  try {
    const { news_event, custom_parameters } = req.body;

    if (!news_event) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: news_event'
      });
    }

    const classification = agent.classifyNewsEvent(news_event);
    const scenarios = agent.generateEventScenarios(news_event, classification);

    return res.json({
      success: true,
      scenarios: scenarios,
      classification: classification,
      scenario_count: Object.keys(scenarios).length,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Scenario calculation failed',
      details: error.message
    });
  }
}

/**
 * Handle monitor effectiveness request
 */
async function handleMonitorEffectivenessRequest(req, res, agent) {
  try {
    const { recommendation_id, current_market_data } = req.body;

    if (!recommendation_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: recommendation_id'
      });
    }

    // For now, return mock effectiveness monitoring
    const effectiveness = {
      recommendation_id: recommendation_id,
      current_hedge_ratio: 0.85,
      target_hedge_ratio: 0.80,
      hedge_pnl: 45000,
      underlying_pnl: -52000,
      effectiveness_ratio: 0.87,
      status: 'performing_well',
      adjustments_needed: false,
      next_review_date: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    };

    return res.json({
      success: true,
      effectiveness_monitoring: effectiveness,
      performing_as_expected: effectiveness.effectiveness_ratio > 0.8,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Effectiveness monitoring failed',
      details: error.message
    });
  }
}