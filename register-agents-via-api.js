/**
 * Register Analytics Agents via API
 * Uses the deployed API endpoints to register agents
 */

import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.VERCEL_URL || 'https://hana-proxy-vercel.vercel.app';
const XAI_API_KEY = process.env.XAI_API_KEY || process.env.GROK_API_KEY;

// List of 32 analytics agents to register
const ANALYTICS_AGENTS = [
  {
    agent_id: 'agent-pearson-correlation',
    name: 'Pearson Correlation Calculator',
    type: 'analytics',
    description: 'Calculates Pearson correlation coefficient between two data series',
    capabilities: ['calculate_correlation', 'statistical_analysis', 'data_validation'],
    voting_power: 150,
    personality: 'analytical'
  },
  {
    agent_id: 'agent-value-at-risk',
    name: 'Value at Risk (VaR) Calculator',
    type: 'analytics',
    description: 'Calculates Value at Risk for portfolio risk assessment',
    capabilities: ['calculate_var', 'risk_assessment', 'portfolio_analysis'],
    voting_power: 200,
    personality: 'risk-aware'
  },
  {
    agent_id: 'agent-sharpe-ratio',
    name: 'Sharpe Ratio Calculator',
    type: 'analytics',
    description: 'Calculates Sharpe ratio for risk-adjusted performance',
    capabilities: ['calculate_sharpe', 'performance_analysis', 'risk_adjustment'],
    voting_power: 180,
    personality: 'performance-focused'
  },
  {
    agent_id: 'agent-portfolio-optimization',
    name: 'Portfolio Optimizer',
    type: 'analytics',
    description: 'Optimizes portfolio allocation using modern portfolio theory',
    capabilities: ['optimize_portfolio', 'asset_allocation', 'efficient_frontier'],
    voting_power: 250,
    personality: 'strategic'
  },
  {
    agent_id: 'agent-monte-carlo',
    name: 'Monte Carlo Simulator',
    type: 'analytics',
    description: 'Runs Monte Carlo simulations for risk and pricing analysis',
    capabilities: ['monte_carlo_simulation', 'scenario_analysis', 'probability_distribution'],
    voting_power: 220,
    personality: 'probabilistic'
  },
  {
    agent_id: 'agent-black-scholes',
    name: 'Black-Scholes Pricing Model',
    type: 'analytics',
    description: 'Calculates option prices using Black-Scholes model',
    capabilities: ['option_pricing', 'derivatives_valuation', 'greeks_calculation'],
    voting_power: 200,
    personality: 'quantitative'
  },
  {
    agent_id: 'agent-technical-indicators',
    name: 'Technical Indicators Analyzer',
    type: 'analytics',
    description: 'Calculates various technical indicators for market analysis',
    capabilities: ['calculate_indicators', 'trend_analysis', 'signal_generation'],
    voting_power: 160,
    personality: 'technical'
  },
  {
    agent_id: 'agent-risk-metrics',
    name: 'Risk Metrics Calculator',
    type: 'analytics',
    description: 'Comprehensive risk metrics including beta, volatility, drawdown',
    capabilities: ['calculate_risk_metrics', 'volatility_analysis', 'drawdown_analysis'],
    voting_power: 190,
    personality: 'risk-focused'
  },
  {
    agent_id: 'agent-covariance-matrix',
    name: 'Covariance Matrix Generator',
    type: 'analytics',
    description: 'Generates covariance matrices for portfolio analysis',
    capabilities: ['calculate_covariance', 'matrix_operations', 'correlation_analysis'],
    voting_power: 170,
    personality: 'mathematical'
  },
  {
    agent_id: 'agent-efficient-frontier',
    name: 'Efficient Frontier Calculator',
    type: 'analytics',
    description: 'Calculates efficient frontier for portfolio optimization',
    capabilities: ['calculate_frontier', 'optimization', 'risk_return_analysis'],
    voting_power: 210,
    personality: 'optimization-focused'
  },
  {
    agent_id: 'agent-factor-analysis',
    name: 'Factor Analysis Engine',
    type: 'analytics',
    description: 'Performs multi-factor analysis for portfolio attribution',
    capabilities: ['factor_decomposition', 'attribution_analysis', 'factor_exposure'],
    voting_power: 230,
    personality: 'analytical'
  },
  {
    agent_id: 'agent-stress-testing',
    name: 'Stress Testing Simulator',
    type: 'analytics',
    description: 'Runs stress tests and scenario analysis on portfolios',
    capabilities: ['stress_testing', 'scenario_simulation', 'tail_risk_analysis'],
    voting_power: 240,
    personality: 'conservative'
  },
  {
    agent_id: 'agent-liquidity-analysis',
    name: 'Liquidity Analyzer',
    type: 'analytics',
    description: 'Analyzes market liquidity and trading volume patterns',
    capabilities: ['liquidity_measurement', 'volume_analysis', 'market_impact'],
    voting_power: 160,
    personality: 'market-aware'
  },
  {
    agent_id: 'agent-sentiment-analysis',
    name: 'Market Sentiment Analyzer',
    type: 'analytics',
    description: 'Analyzes market sentiment from various data sources',
    capabilities: ['sentiment_scoring', 'text_analysis', 'market_psychology'],
    voting_power: 180,
    personality: 'perceptive'
  },
  {
    agent_id: 'agent-backtesting',
    name: 'Backtesting Engine',
    type: 'analytics',
    description: 'Performs historical backtesting of trading strategies',
    capabilities: ['strategy_backtesting', 'performance_evaluation', 'historical_simulation'],
    voting_power: 200,
    personality: 'empirical'
  },
  {
    agent_id: 'agent-arbitrage-detection',
    name: 'Arbitrage Opportunity Detector',
    type: 'analytics',
    description: 'Identifies arbitrage opportunities across markets',
    capabilities: ['arbitrage_detection', 'price_comparison', 'market_inefficiency'],
    voting_power: 190,
    personality: 'opportunistic'
  },
  {
    agent_id: 'agent-yield-curve',
    name: 'Yield Curve Analyzer',
    type: 'analytics',
    description: 'Analyzes yield curves and term structure of interest rates',
    capabilities: ['yield_curve_fitting', 'term_structure_analysis', 'rate_interpolation'],
    voting_power: 170,
    personality: 'fixed-income-focused'
  },
  {
    agent_id: 'agent-credit-risk',
    name: 'Credit Risk Assessor',
    type: 'analytics',
    description: 'Evaluates credit risk and probability of default',
    capabilities: ['credit_scoring', 'default_probability', 'credit_migration'],
    voting_power: 210,
    personality: 'credit-focused'
  },
  {
    agent_id: 'agent-market-maker',
    name: 'Market Making Strategy Optimizer',
    type: 'analytics',
    description: 'Optimizes market making strategies and bid-ask spreads',
    capabilities: ['spread_optimization', 'inventory_management', 'quote_generation'],
    voting_power: 220,
    personality: 'market-making'
  },
  {
    agent_id: 'agent-pairs-trading',
    name: 'Pairs Trading Analyzer',
    type: 'analytics',
    description: 'Identifies and analyzes pairs trading opportunities',
    capabilities: ['pair_identification', 'cointegration_testing', 'spread_trading'],
    voting_power: 180,
    personality: 'relative-value'
  },
  {
    agent_id: 'agent-copula-correlation',
    name: 'Copula Correlation Modeler',
    type: 'analytics',
    description: 'Models complex dependencies using copula functions',
    capabilities: ['copula_modeling', 'dependency_structure', 'tail_dependence'],
    voting_power: 240,
    personality: 'advanced-statistical'
  },
  {
    agent_id: 'agent-garch-volatility',
    name: 'GARCH Volatility Forecaster',
    type: 'analytics',
    description: 'Forecasts volatility using GARCH models',
    capabilities: ['volatility_forecasting', 'garch_modeling', 'conditional_heteroskedasticity'],
    voting_power: 220,
    personality: 'volatility-specialist'
  },
  {
    agent_id: 'agent-regime-switching',
    name: 'Regime Switching Detector',
    type: 'analytics',
    description: 'Detects market regime changes using statistical models',
    capabilities: ['regime_detection', 'markov_switching', 'state_identification'],
    voting_power: 230,
    personality: 'regime-aware'
  },
  {
    agent_id: 'agent-jump-diffusion',
    name: 'Jump Diffusion Modeler',
    type: 'analytics',
    description: 'Models asset prices with jump diffusion processes',
    capabilities: ['jump_modeling', 'levy_processes', 'tail_event_analysis'],
    voting_power: 210,
    personality: 'jump-aware'
  },
  {
    agent_id: 'agent-heston-model',
    name: 'Heston Stochastic Volatility',
    type: 'analytics',
    description: 'Implements Heston model for stochastic volatility',
    capabilities: ['stochastic_volatility', 'heston_calibration', 'volatility_smile'],
    voting_power: 250,
    personality: 'stochastic-specialist'
  },
  {
    agent_id: 'agent-hull-white',
    name: 'Hull-White Interest Rate Model',
    type: 'analytics',
    description: 'Models interest rates using Hull-White framework',
    capabilities: ['interest_rate_modeling', 'term_structure_dynamics', 'rate_calibration'],
    voting_power: 200,
    personality: 'rates-specialist'
  },
  {
    agent_id: 'agent-treynor-ratio',
    name: 'Treynor Ratio Calculator',
    type: 'analytics',
    description: 'Calculates Treynor ratio for systematic risk-adjusted returns',
    capabilities: ['calculate_treynor', 'systematic_risk_analysis', 'beta_adjustment'],
    voting_power: 170,
    personality: 'systematic-focused'
  },
  {
    agent_id: 'agent-sortino-ratio',
    name: 'Sortino Ratio Calculator',
    type: 'analytics',
    description: 'Calculates Sortino ratio focusing on downside deviation',
    capabilities: ['calculate_sortino', 'downside_risk_analysis', 'asymmetric_returns'],
    voting_power: 180,
    personality: 'downside-aware'
  },
  {
    agent_id: 'agent-information-ratio',
    name: 'Information Ratio Calculator',
    type: 'analytics',
    description: 'Measures active return relative to tracking error',
    capabilities: ['calculate_information_ratio', 'active_return_analysis', 'tracking_error'],
    voting_power: 190,
    personality: 'alpha-focused'
  },
  {
    agent_id: 'agent-maximum-drawdown',
    name: 'Maximum Drawdown Analyzer',
    type: 'analytics',
    description: 'Analyzes maximum drawdown and recovery periods',
    capabilities: ['drawdown_calculation', 'recovery_analysis', 'peak_trough_identification'],
    voting_power: 170,
    personality: 'drawdown-conscious'
  },
  {
    agent_id: 'agent-calmar-ratio',
    name: 'Calmar Ratio Calculator',
    type: 'analytics',
    description: 'Calculates Calmar ratio for drawdown-adjusted returns',
    capabilities: ['calculate_calmar', 'drawdown_adjusted_returns', 'risk_reward_ratio'],
    voting_power: 160,
    personality: 'drawdown-adjusted'
  },
  {
    agent_id: 'agent-omega-ratio',
    name: 'Omega Ratio Calculator',
    type: 'analytics',
    description: 'Calculates Omega ratio considering all moments of returns',
    capabilities: ['calculate_omega', 'probability_weighted_returns', 'threshold_analysis'],
    voting_power: 200,
    personality: 'comprehensive-risk'
  }
];

/**
 * Enhance agent with AI for compliance
 */
async function enhanceAgentWithAI(agent) {
  console.log(`🤖 Enhancing ${agent.name}...`);
  
  // Generate enhanced metadata based on agent type
  const enhanced = {
    enhanced_description: `# ${agent.name}\n\n${agent.description}\n\n## Capabilities\n${agent.capabilities.map(c => `- ${c}`).join('\n')}\n\n## Integration\nThis agent is fully compliant with A2A protocol and ORD v1.12 standards.`,
    capabilities: agent.capabilities,
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { type: 'number' }, description: 'Input data array' },
        parameters: { 
          type: 'object',
          properties: {
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            window: { type: 'integer', minimum: 1 }
          }
        }
      },
      required: ['data']
    },
    outputSchema: {
      type: 'object',
      properties: {
        result: { type: 'number', description: 'Calculated result' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        metadata: { 
          type: 'object',
          properties: {
            calculatedAt: { type: 'string', format: 'date-time' },
            method: { type: 'string' },
            parameters: { type: 'object' }
          }
        }
      },
      required: ['result']
    },
    goals: [
      'accurate_calculations',
      'efficient_processing',
      'clear_communication',
      'collaborative_analysis'
    ],
    personality_traits: [agent.personality, 'precise', 'reliable'],
    collaboration_preferences: {
      preferred_partners: [],
      communication_style: 'formal',
      negotiation_approach: 'data-driven'
    },
    performance_metrics: {
      accuracy_threshold: 0.99,
      response_time_ms: 500,
      success_rate_target: 0.995
    },
    compliance_notes: 'Fully compliant with A2A and ORD standards'
  };
  
  // If XAI API is available, use it to further enhance
  if (XAI_API_KEY) {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${XAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: 'You are helping to enhance financial analytics agent metadata for A2A and ORD compliance. Return only the enhanced description as markdown.'
            },
            {
              role: 'user',
              content: `Enhance the description for this analytics agent to be more comprehensive and compliance-focused:\n\nAgent: ${agent.name}\nCurrent Description: ${agent.description}\nCapabilities: ${agent.capabilities.join(', ')}`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (response.ok) {
        const data = await response.json();
        enhanced.enhanced_description = data.choices[0].message.content;
      }
    } catch (error) {
      console.log(`  ⚠️ AI enhancement skipped: ${error.message}`);
    }
  }
  
  return enhanced;
}

/**
 * Register agent via API
 */
async function registerAgentViaAPI(agent, enhanced) {
  console.log(`📝 Registering ${agent.name}...`);
  
  try {
    // First, try to register
    const registerResponse = await fetch(`${BASE_URL}/api/compliance-unified`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'register',
        agent_id: agent.agent_id,
        name: agent.name,
        type: agent.type,
        description: enhanced.enhanced_description,
        capabilities: agent.capabilities,
        goals: enhanced.goals,
        personality: agent.personality,
        voting_power: agent.voting_power,
        metadata: {
          inputSchema: enhanced.inputSchema,
          outputSchema: enhanced.outputSchema,
          collaboration_preferences: enhanced.collaboration_preferences,
          performance_metrics: enhanced.performance_metrics,
          ord: {
            namespace: `urn:finsight:analytics:capability:${agent.agent_id}:v1`,
            package: agent.agent_id.includes('advanced') || 
                    ['copula', 'garch', 'regime', 'jump', 'heston', 'hull'].some(term => agent.agent_id.includes(term)) ? 
              'urn:finsight:analytics:package:advanced-analytics:v1' : 
              'urn:finsight:analytics:package:core-analytics:v1'
          }
        }
      })
    });
    
    const registerResult = await registerResponse.json();
    
    if (registerResult.success || registerResult.error?.includes('already exists')) {
      console.log(`  ✅ Registration successful`);
      
      // Then onboard to blockchain
      const onboardResponse = await fetch(`${BASE_URL}/api/compliance-unified`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'onboard',
          agent_id: agent.agent_id
        })
      });
      
      const onboardResult = await onboardResponse.json();
      if (onboardResult.success) {
        console.log(`  ✅ Onboarded to blockchain`);
      } else {
        console.log(`  ⚠️ Onboarding issue: ${onboardResult.error}`);
      }
      
      return true;
    } else {
      console.log(`  ❌ Registration failed: ${registerResult.error}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Main registration process
 */
async function runRegistration() {
  console.log('🚀 Starting Agent Registration Process');
  console.log(`📍 Registering ${ANALYTICS_AGENTS.length} analytics agents`);
  console.log(`🌐 Target: ${BASE_URL}`);
  console.log('='.repeat(60));
  
  let successful = 0;
  let failed = 0;
  
  for (const agent of ANALYTICS_AGENTS) {
    console.log(`\n[${successful + failed + 1}/${ANALYTICS_AGENTS.length}] ${agent.name}`);
    
    // Enhance agent metadata
    const enhanced = await enhanceAgentWithAI(agent);
    
    // Register via API
    const success = await registerAgentViaAPI(agent, enhanced);
    
    if (success) {
      successful++;
    } else {
      failed++;
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Registration Summary:');
  console.log(`  ✅ Successful: ${successful}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Success Rate: ${Math.round((successful / ANALYTICS_AGENTS.length) * 100)}%`);
  console.log('\n✨ Registration Process Complete');
  
  // Run compliance test
  console.log('\n🔍 Running compliance verification...');
  const { exec } = await import('child_process');
  exec('node test-compliance-live.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running compliance test: ${error}`);
      return;
    }
    console.log(stdout);
  });
}

// Run the registration
runRegistration()
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });