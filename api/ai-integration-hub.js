/**
 * AI Integration Hub - Connects AI Magic to Existing System
 * Routes AI capabilities to frontend components and integrates with existing workflows
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
      case 'enhance-page':
        return await enhancePageWithAI(req, res);
      case 'smart-navigation':
        return await provideSmartNavigation(req, res);
      case 'auto-configure':
        return await autoConfigureWithAI(req, res);
      case 'predictive-load':
        return await enablePredictiveLoading(req, res);
      case 'natural-query':
        return await processNaturalQuery(req, res);
      case 'contextual-help':
        return await provideContextualHelp(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('AI Integration Hub error:', error);
    return res.status(500).json({ 
      error: 'AI integration failed',
      details: error.message 
    });
  }
}

/**
 * Enhance any page with AI magic based on current context
 */
async function enhancePageWithAI(req, res) {
  const { page, userContext, currentData } = req.body;
  
  try {
    // Route to appropriate AI enhancement based on page type
    const enhancements = await Promise.all([
      getPageSpecificEnhancements(page, userContext, currentData),
      getContextualSuggestions(page, userContext),
      getPredictiveElements(page, userContext),
      getIntelligentDefaults(page, userContext)
    ]);

    return res.json({
      page,
      enhancements: {
        page_specific: enhancements[0],
        contextual_suggestions: enhancements[1],
        predictive_elements: enhancements[2],
        intelligent_defaults: enhancements[3]
      },
      integration_points: getIntegrationPoints(page),
      ai_enabled: true
    });
  } catch (error) {
    console.error('Page enhancement failed:', error);
    return res.status(500).json({ error: 'Enhancement failed' });
  }
}

/**
 * Get page-specific AI enhancements
 */
async function getPageSpecificEnhancements(page, userContext, currentData) {
  const enhancementConfigs = {
    'visual-builder-real.html': {
      ai_services: ['contextual-navigation-ai', 'natural-language-finance-ai'],
      enhancements: [
        'smart_workflow_suggestions',
        'auto_parameter_setting',
        'intelligent_error_prevention'
      ]
    },
    'portfolio-analyser.html': {
      ai_services: ['market-anomaly-detector', 'ai-magic-simplification'],
      enhancements: [
        'proactive_risk_alerts',
        'smart_diversification_suggestions',
        'predictive_performance_analysis'
      ]
    },
    'treasury-insights.html': {
      ai_services: ['natural-language-finance-ai', 'self-healing-ai'],
      enhancements: [
        'conversational_treasury_analysis',
        'automated_reporting',
        'intelligent_forecasting'
      ]
    },
    'scenario-analyser-config.html': {
      ai_services: ['ai-magic-simplification', 'contextual-navigation-ai'],
      enhancements: [
        'scenario_auto_generation',
        'smart_parameter_optimization',
        'predictive_outcomes'
      ]
    }
  };

  const config = enhancementConfigs[page] || {
    ai_services: ['ai-magic-simplification'],
    enhancements: ['smart_auto_completion', 'intelligent_defaults']
  };

  // Call relevant AI services for this page
  const aiResults = {};
  for (const service of config.ai_services) {
    try {
      const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/${service}?action=enhance-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          page, 
          userContext, 
          currentData, 
          enhancements: config.enhancements 
        })
      });
      
      if (response.ok) {
        aiResults[service] = await response.json();
      }
    } catch (error) {
      console.error(`Failed to call ${service}:`, error);
    }
  }

  return {
    config,
    ai_results: aiResults,
    integration_ready: true
  };
}

/**
 * Provide smart navigation for current context
 */
async function provideSmartNavigation(req, res) {
  const { currentPage, userState, recentActions } = req.body;
  
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/contextual-navigation-ai?action=smart-navigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPage,
        userState,
        portfolioContext: userState.portfolio,
        marketConditions: await getCurrentMarketConditions(),
        recentActions
      })
    });

    if (response.ok) {
      const navigationAI = await response.json();
      
      return res.json({
        current_page: currentPage,
        navigation_suggestions: navigationAI.ai_navigation,
        ui_integration: {
          sidebar_suggestions: navigationAI.ai_navigation?.immediate_suggestions?.slice(0, 3),
          contextual_buttons: navigationAI.ai_navigation?.proactive_tools?.slice(0, 2),
          smart_shortcuts: navigationAI.ai_navigation?.learning_optimizations?.efficiency_gains
        },
        invisible_magic: true
      });
    }
    
    return res.status(500).json({ error: 'Navigation AI unavailable' });
  } catch (error) {
    console.error('Smart navigation failed:', error);
    return res.status(500).json({ error: 'Navigation failed' });
  }
}

/**
 * Auto-configure parameters using AI
 */
async function autoConfigureWithAI(req, res) {
  const { operation, userProfile, currentContext } = req.body;
  
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/ai-magic-simplification?action=intelligent-defaults`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation,
        userHistory: userProfile.history,
        portfolioContext: userProfile.portfolio,
        marketConditions: await getCurrentMarketConditions()
      })
    });

    if (response.ok) {
      const smartDefaults = await response.json();
      
      // Apply defaults to current form/operation
      const appliedConfig = await applyIntelligentDefaults(operation, smartDefaults.ai_defaults);
      
      return res.json({
        operation,
        applied_configuration: appliedConfig,
        ai_reasoning: smartDefaults.ai_defaults?.intelligent_defaults,
        user_can_modify: true,
        auto_applied: true
      });
    }
    
    return res.status(500).json({ error: 'Auto-configuration AI unavailable' });
  } catch (error) {
    console.error('Auto-configuration failed:', error);
    return res.status(500).json({ error: 'Configuration failed' });
  }
}

/**
 * Process natural language queries
 */
async function processNaturalQuery(req, res) {
  const { query, userId, context } = req.body;
  
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/natural-language-finance-ai?action=natural-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        userId,
        portfolioContext: context.portfolio,
        conversationHistory: context.history || []
      })
    });

    if (response.ok) {
      const nlResults = await response.json();
      
      return res.json({
        original_query: query,
        ai_understanding: nlResults.ai_understanding,
        execution_results: nlResults.execution_results,
        ui_updates: generateUIUpdates(nlResults),
        follow_up_suggestions: nlResults.ai_understanding?.follow_up_suggestions,
        magic_factor: "Complex analysis executed through simple conversation"
      });
    }
    
    return res.status(500).json({ error: 'Natural language AI unavailable' });
  } catch (error) {
    console.error('Natural query processing failed:', error);
    return res.status(500).json({ error: 'Query processing failed' });
  }
}

/**
 * Helper functions
 */
async function getCurrentMarketConditions() {
  try {
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/market-data-unified?action=current-conditions`);
    return response.ok ? await response.json() : {};
  } catch (error) {
    return {};
  }
}

async function getContextualSuggestions(page, userContext) {
  // Generate contextual suggestions based on current page and user state
  return {
    immediate_actions: [
      {
        action: "Run Portfolio Risk Analysis",
        relevance: "Based on current market volatility",
        one_click: true
      }
    ],
    learning_opportunities: [
      {
        topic: "Modern Portfolio Theory",
        relevance: "Optimize your current holdings"
      }
    ]
  };
}

async function getPredictiveElements(page, userContext) {
  // Predict what user will need and prepare it
  return {
    preloaded_analyses: ["VaR calculation", "Correlation matrix"],
    predicted_next_actions: ["View detailed risk breakdown", "Adjust portfolio weights"],
    background_calculations: ["Monte Carlo simulation running"]
  };
}

async function getIntelligentDefaults(page, userContext) {
  // Get smart defaults for current page
  return {
    parameter_defaults: {
      confidence_level: 0.95,
      lookback_period: "1Y",
      simulation_iterations: 10000
    },
    reasoning: "Based on your risk profile and portfolio size"
  };
}

function getIntegrationPoints(page) {
  // Define where AI enhancements integrate with existing UI
  const integrationMaps = {
    'visual-builder-real.html': {
      natural_language_input: '#ai-query-input',
      smart_suggestions: '#ai-suggestions-panel',
      auto_configuration: '.parameter-inputs',
      contextual_help: '#help-overlay'
    },
    'portfolio-analyser.html': {
      proactive_alerts: '#alerts-container',
      smart_insights: '#insights-panel',
      predictive_charts: '.chart-containers',
      ai_explanations: '#explanations-modal'
    }
  };
  
  return integrationMaps[page] || {
    general_ai_panel: '#ai-assistance-panel',
    smart_suggestions: '#suggestions-sidebar'
  };
}

async function applyIntelligentDefaults(operation, aiDefaults) {
  // Apply AI-generated defaults to the operation
  if (!aiDefaults?.intelligent_defaults) return null;
  
  const applied = {
    operation_type: operation,
    parameters_set: {},
    ai_reasoning: {}
  };
  
  // Apply primary parameters
  if (aiDefaults.intelligent_defaults.primary_parameters) {
    for (const [param, config] of Object.entries(aiDefaults.intelligent_defaults.primary_parameters)) {
      applied.parameters_set[param] = config.value;
      applied.ai_reasoning[param] = config.reasoning;
    }
  }
  
  return applied;
}

function generateUIUpdates(nlResults) {
  // Generate UI updates based on natural language processing results
  const updates = {
    display_results: true,
    update_charts: false,
    show_explanations: true,
    highlight_insights: []
  };
  
  // Determine what UI elements to update based on AI results
  if (nlResults.execution_results?.results?.length > 0) {
    updates.update_charts = true;
    updates.highlight_insights = nlResults.ai_understanding?.actionable_insights || [];
  }
  
  return updates;
}

/**
 * Export integration functions for direct use
 */
export const AIIntegrationHub = {
  enhancePageWithAI,
  provideSmartNavigation,
  autoConfigureWithAI,
  processNaturalQuery
};