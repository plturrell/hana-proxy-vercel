/**
 * Register All 32 Analytics Agents
 * Registers all 32 agents with A2A and ORD compliance
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const BASE_URL = 'https://hana-proxy-vercel.vercel.app';

// Complete list of 32 analytics agents with proper naming convention
const agents = [
  { agent_id: 'finsight.analytics.pearson_correlation', name: 'Pearson Correlation Calculator', description: 'Calculates Pearson correlation coefficient between two data series', capabilities: ['calculate_correlation', 'statistical_analysis', 'data_validation'], voting_power: 150, personality: 'analytical', goals: ['accurate_correlation_analysis', 'data_quality_assurance'] },
  { agent_id: 'finsight.analytics.value_at_risk', name: 'Value at Risk Calculator', description: 'Calculates VaR for portfolio risk assessment', capabilities: ['calculate_var', 'risk_assessment', 'confidence_intervals'], voting_power: 200, personality: 'risk-aware', goals: ['portfolio_risk_management', 'loss_prevention'] },
  { agent_id: 'finsight.analytics.sharpe_ratio', name: 'Sharpe Ratio Analyzer', description: 'Calculates risk-adjusted returns using Sharpe ratio', capabilities: ['calculate_sharpe', 'performance_analysis', 'risk_adjustment'], voting_power: 180, personality: 'performance-focused', goals: ['optimize_risk_return', 'performance_measurement'] },
  { agent_id: 'finsight.analytics.portfolio_volatility', name: 'Portfolio Volatility Tracker', description: 'Calculates portfolio volatility and standard deviation', capabilities: ['calculate_volatility', 'risk_measurement', 'variance_analysis'], voting_power: 170, personality: 'precise', goals: ['volatility_monitoring', 'risk_tracking'] },
  { agent_id: 'finsight.analytics.portfolio_optimization', name: 'Portfolio Optimizer', description: 'Optimizes portfolio weights for maximum Sharpe ratio', capabilities: ['optimize_portfolio', 'allocation_analysis', 'efficiency_frontier'], voting_power: 250, personality: 'strategic', goals: ['maximize_sharpe_ratio', 'optimal_allocation'] },
  { agent_id: 'finsight.analytics.monte_carlo', name: 'Monte Carlo Simulator', description: 'Runs Monte Carlo simulations for risk analysis', capabilities: ['monte_carlo_simulation', 'risk_modeling', 'scenario_analysis'], voting_power: 220, personality: 'probabilistic', goals: ['comprehensive_risk_analysis', 'scenario_planning'] },
  { agent_id: 'finsight.analytics.black_scholes', name: 'Black-Scholes Option Pricer', description: 'Calculates option prices using Black-Scholes model', capabilities: ['option_pricing', 'greeks_calculation', 'volatility_analysis'], voting_power: 200, personality: 'quantitative', goals: ['accurate_pricing', 'derivatives_analysis'] },
  { agent_id: 'finsight.analytics.technical_indicators', name: 'Technical Indicators Suite', description: 'Calculates various technical indicators', capabilities: ['calculate_indicators', 'trend_analysis', 'signal_generation'], voting_power: 160, personality: 'technical', goals: ['market_analysis', 'trading_signals'] },
  { agent_id: 'finsight.analytics.risk_metrics', name: 'Risk Metrics Calculator', description: 'Comprehensive risk metrics calculation', capabilities: ['risk_calculation', 'beta_analysis', 'drawdown_analysis'], voting_power: 190, personality: 'risk-focused', goals: ['risk_quantification', 'portfolio_protection'] },
  { agent_id: 'finsight.analytics.liquidity_calculator', name: 'Liquidity Metrics Analyzer', description: 'Calculates liquidity ratios and metrics', capabilities: ['liquidity_analysis', 'ratio_calculation', 'cash_flow_analysis'], voting_power: 140, personality: 'analytical', goals: ['liquidity_monitoring', 'solvency_assessment'] },
  { agent_id: 'finsight.analytics.performance_attribution', name: 'Performance Attribution Engine', description: 'Analyzes sources of portfolio performance', capabilities: ['attribution_analysis', 'factor_decomposition', 'benchmark_comparison'], voting_power: 210, personality: 'detail-oriented', goals: ['performance_explanation', 'value_identification'] },
  { agent_id: 'finsight.analytics.stress_testing', name: 'Stress Testing Framework', description: 'Conducts portfolio stress tests', capabilities: ['stress_testing', 'scenario_modeling', 'tail_risk_analysis'], voting_power: 230, personality: 'conservative', goals: ['risk_identification', 'resilience_testing'] },
  { agent_id: 'finsight.analytics.expected_shortfall', name: 'Expected Shortfall Calculator', description: 'Calculates conditional VaR and expected shortfall', capabilities: ['calculate_es', 'tail_risk', 'coherent_risk_measure'], voting_power: 190, personality: 'prudent', goals: ['tail_risk_management', 'regulatory_compliance'] },
  { agent_id: 'finsight.analytics.correlation_matrix', name: 'Correlation Matrix Generator', description: 'Generates correlation matrices for portfolios', capabilities: ['matrix_generation', 'correlation_analysis', 'dependency_modeling'], voting_power: 160, personality: 'systematic', goals: ['correlation_tracking', 'diversification_analysis'] },
  { agent_id: 'finsight.analytics.factor_model', name: 'Multi-Factor Model Analyzer', description: 'Implements multi-factor models for returns', capabilities: ['factor_modeling', 'regression_analysis', 'factor_exposure'], voting_power: 220, personality: 'quantitative', goals: ['factor_identification', 'return_decomposition'] },
  { agent_id: 'finsight.analytics.garch_volatility', name: 'GARCH Volatility Forecaster', description: 'Forecasts volatility using GARCH models', capabilities: ['volatility_forecasting', 'garch_modeling', 'heteroskedasticity_analysis'], voting_power: 200, personality: 'forward-looking', goals: ['volatility_prediction', 'risk_forecasting'] },
  { agent_id: 'finsight.analytics.copula_modeling', name: 'Copula Dependency Modeler', description: 'Models complex dependencies using copulas', capabilities: ['copula_modeling', 'tail_dependence', 'joint_distribution'], voting_power: 240, personality: 'sophisticated', goals: ['dependency_capture', 'tail_correlation'] },
  { agent_id: 'finsight.analytics.regime_detection', name: 'Market Regime Detector', description: 'Identifies market regime changes', capabilities: ['regime_detection', 'state_identification', 'transition_analysis'], voting_power: 210, personality: 'adaptive', goals: ['regime_identification', 'strategy_adjustment'] },
  { agent_id: 'finsight.analytics.pairs_trading', name: 'Pairs Trading Analyzer', description: 'Identifies and analyzes pairs trading opportunities', capabilities: ['cointegration_testing', 'spread_analysis', 'mean_reversion'], voting_power: 180, personality: 'opportunistic', goals: ['arbitrage_identification', 'market_neutral_strategies'] },
  { agent_id: 'finsight.analytics.portfolio_rebalancing', name: 'Portfolio Rebalancing Optimizer', description: 'Optimizes portfolio rebalancing strategies', capabilities: ['rebalancing_optimization', 'transaction_cost_analysis', 'timing_optimization'], voting_power: 190, personality: 'efficient', goals: ['cost_minimization', 'target_maintenance'] },
  { agent_id: 'finsight.analytics.kelly_criterion', name: 'Kelly Criterion Calculator', description: 'Calculates optimal position sizing using Kelly Criterion', capabilities: ['position_sizing', 'bankroll_management', 'growth_optimization'], voting_power: 170, personality: 'mathematical', goals: ['optimal_growth', 'risk_control'] },
  { agent_id: 'finsight.analytics.hurst_exponent', name: 'Hurst Exponent Analyzer', description: 'Calculates Hurst exponent for time series', capabilities: ['persistence_analysis', 'fractal_dimension', 'mean_reversion_testing'], voting_power: 160, personality: 'analytical', goals: ['market_characterization', 'predictability_assessment'] },
  { agent_id: 'finsight.analytics.information_ratio', name: 'Information Ratio Calculator', description: 'Measures risk-adjusted active returns', capabilities: ['active_return_analysis', 'tracking_error', 'skill_measurement'], voting_power: 180, personality: 'performance-driven', goals: ['alpha_generation', 'manager_evaluation'] },
  { agent_id: 'finsight.analytics.treynor_ratio', name: 'Treynor Ratio Analyzer', description: 'Calculates systematic risk-adjusted returns', capabilities: ['systematic_risk_adjustment', 'beta_normalization', 'capm_analysis'], voting_power: 170, personality: 'systematic', goals: ['market_risk_adjustment', 'performance_ranking'] },
  { agent_id: 'finsight.analytics.sortino_ratio', name: 'Sortino Ratio Calculator', description: 'Measures downside risk-adjusted returns', capabilities: ['downside_deviation', 'asymmetric_risk', 'target_return_analysis'], voting_power: 180, personality: 'downside-focused', goals: ['downside_protection', 'upside_preservation'] },
  { agent_id: 'finsight.analytics.maximum_drawdown', name: 'Maximum Drawdown Analyzer', description: 'Analyzes maximum portfolio drawdowns', capabilities: ['drawdown_calculation', 'recovery_analysis', 'underwater_periods'], voting_power: 190, personality: 'risk-averse', goals: ['loss_limitation', 'capital_preservation'] },
  { agent_id: 'finsight.analytics.ulcer_index', name: 'Ulcer Index Calculator', description: 'Measures downside volatility and stress', capabilities: ['ulcer_calculation', 'pain_index', 'drawdown_deviation'], voting_power: 160, personality: 'conservative', goals: ['stress_measurement', 'investor_comfort'] },
  { agent_id: 'finsight.analytics.omega_ratio', name: 'Omega Ratio Analyzer', description: 'Calculates probability-weighted risk-return ratio', capabilities: ['omega_calculation', 'threshold_analysis', 'distribution_analysis'], voting_power: 200, personality: 'comprehensive', goals: ['holistic_performance', 'threshold_optimization'] },
  { agent_id: 'finsight.analytics.calmar_ratio', name: 'Calmar Ratio Calculator', description: 'Measures return over maximum drawdown', capabilities: ['calmar_calculation', 'drawdown_adjusted_return', 'risk_efficiency'], voting_power: 170, personality: 'pragmatic', goals: ['drawdown_awareness', 'consistent_returns'] },
  { agent_id: 'finsight.analytics.risk_parity', name: 'Risk Parity Allocator', description: 'Implements risk parity portfolio allocation', capabilities: ['risk_parity_allocation', 'risk_contribution', 'leverage_optimization'], voting_power: 220, personality: 'balanced', goals: ['risk_equalization', 'diversification_maximization'] },
  { agent_id: 'finsight.analytics.conditional_drawdown', name: 'Conditional Drawdown Analyzer', description: 'Calculates conditional drawdown at risk', capabilities: ['cdar_calculation', 'conditional_risk', 'scenario_drawdown'], voting_power: 190, personality: 'scenario-focused', goals: ['conditional_protection', 'tail_drawdown_management'] },
  { agent_id: 'finsight.analytics.risk_budgeting', name: 'Risk Budget Optimizer', description: 'Optimizes portfolio risk budgets', capabilities: ['risk_budgeting', 'allocation_optimization', 'constraint_handling'], voting_power: 210, personality: 'strategic', goals: ['risk_allocation', 'budget_optimization'] }
];

async function registerAgent(agent) {
  try {
    console.log(`📝 Registering ${agent.name}...`);
    
    const wallet_address = `0x${crypto.randomBytes(20).toString('hex')}`;
    
    const response = await fetch(`${BASE_URL}/api/a2a-agent-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'register',
        agent_id: agent.agent_id,
        name: agent.name,
        type: 'analytics',
        description: agent.description,
        capabilities: agent.capabilities,
        goals: agent.goals,
        personality: agent.personality,
        voting_power: agent.voting_power
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${agent.name} registered successfully`);
      return true;
    } else {
      if (result.error && result.error.includes('duplicate key')) {
        console.log(`⚠️  ${agent.name} already exists`);
        return true;
      } else {
        console.log(`❌ ${agent.name} registration failed: ${result.error}`);
        return false;
      }
    }
  } catch (error) {
    console.log(`❌ ${agent.name} registration error: ${error.message}`);
    return false;
  }
}

async function onboardAgent(agent_id) {
  try {
    const response = await fetch(`${BASE_URL}/api/a2a-agent-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'onboard',
        agent_id: agent_id
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`🚀 ${agent_id} onboarded to blockchain`);
      return true;
    } else {
      console.log(`⚠️  ${agent_id} onboarding failed: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${agent_id} onboarding error: ${error.message}`);
    return false;
  }
}

async function registerAllAgents() {
  console.log('🚀 Registering All 32 Analytics Agents');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log('='.repeat(60));
  
  let registered = 0;
  let onboarded = 0;
  let failed = 0;
  
  // Step 1: Register all agents
  console.log('\n📝 Step 1: Agent Registration');
  for (const agent of agents) {
    const success = await registerAgent(agent);
    if (success) {
      registered++;
    } else {
      failed++;
    }
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Step 2: Onboard all agents to blockchain
  console.log('\n🚀 Step 2: Blockchain Onboarding');
  for (const agent of agents) {
    const success = await onboardAgent(agent.agent_id);
    if (success) {
      onboarded++;
    }
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Registration Summary:');
  console.log(`  ✅ Registered: ${registered}/${agents.length}`);
  console.log(`  🚀 Onboarded: ${onboarded}/${agents.length}`);
  console.log(`  ❌ Failed: ${failed}`);
  
  // Step 3: Verify final count
  console.log('\n🔍 Verifying final agent count...');
  try {
    const response = await fetch(`${BASE_URL}/.well-known/agent.json`);
    const agentData = await response.json();
    console.log(`  📊 Total agents now: ${agentData.totalAgents || 0}`);
    
    if (agentData.totalAgents === 32) {
      console.log('  🎯 Perfect! All 32 agents are now registered and active');
      console.log('\n✅ Next step: Run compliance test for 100% ORD compliance');
      console.log('  📋 Command: node test-compliance-live.js');
    } else {
      console.log(`  ⚠️  Expected 32 agents, but found ${agentData.totalAgents}`);
    }
  } catch (error) {
    console.log(`  ❌ Could not verify agent count: ${error.message}`);
  }
  
  console.log('\n✨ Registration process complete!');
}

// Run the registration
registerAllAgents()
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });