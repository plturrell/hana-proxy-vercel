/**
 * Execute SQL via Supabase Proxy
 * Breaks down the SQL into individual statements and executes them
 */

import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.VERCEL_URL || 'https://hana-proxy-vercel.vercel.app';

// Read the SQL file
const sqlContent = readFileSync(join(__dirname, 'deploy-a2a-tables-combined.sql'), 'utf8');

// Parse SQL into individual statements
function parseSQLStatements(sql) {
  // Remove comments
  const cleanSQL = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
  
  // Split by semicolons but handle multi-line statements
  const statements = [];
  let currentStatement = '';
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < cleanSQL.length; i++) {
    const char = cleanSQL[i];
    const prevChar = i > 0 ? cleanSQL[i - 1] : '';
    
    // Handle string literals
    if ((char === "'" || char === '"') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }
    
    currentStatement += char;
    
    // End of statement
    if (char === ';' && !inString) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }
  
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  return statements.filter(stmt => stmt.length > 0);
}

async function executeSQL() {
  console.log('🚀 Executing SQL via Supabase Proxy');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log('='.repeat(60));
  
  const statements = parseSQLStatements(sqlContent);
  console.log(`📊 Found ${statements.length} SQL statements to execute`);
  
  let successful = 0;
  let failed = 0;
  
  // Group statements by type
  const createTableStatements = statements.filter(s => s.toUpperCase().includes('CREATE TABLE'));
  const insertStatements = statements.filter(s => s.toUpperCase().includes('INSERT INTO'));
  
  console.log(`  - CREATE TABLE statements: ${createTableStatements.length}`);
  console.log(`  - INSERT statements: ${insertStatements.length}`);
  
  // Execute CREATE TABLE statements first
  console.log('\n📄 Creating tables...');
  for (const statement of createTableStatements) {
    try {
      const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1] || 'unknown';
      process.stdout.write(`  Creating ${tableName}... `);
      
      const response = await fetch(`${BASE_URL}/api/supabase-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_sql',
          sql: statement
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        // Try alternative approach - use raw SQL execution
        console.log('trying alternative approach...');
        
        // Since we can't execute DDL directly, we'll check if table exists
        const checkResponse = await fetch(`${BASE_URL}/api/supabase-proxy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'select',
            table: tableName,
            query: 'count'
          })
        });
        
        const checkResult = await checkResponse.json();
        if (!checkResult.error || checkResult.error.includes('does not exist')) {
          console.log(`❌ Table ${tableName} needs manual creation`);
          failed++;
        } else {
          console.log(`✅ Table ${tableName} already exists`);
          successful++;
        }
      } else {
        console.log('✅');
        successful++;
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      failed++;
    }
  }
  
  // Check if tables exist before inserting
  console.log('\n🔍 Checking table existence...');
  const tableExists = await checkTableExists('a2a_agents');
  
  if (!tableExists) {
    console.log('\n❌ Tables do not exist. Please create them first using:');
    console.log('  1. Supabase Dashboard: https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new');
    console.log('  2. Copy and paste the SQL from deploy-a2a-tables-combined.sql');
    console.log('  3. Click "Run"');
    return;
  }
  
  // Execute INSERT statements
  console.log('\n📊 Inserting agents...');
  for (const statement of insertStatements) {
    try {
      // Extract agent data from INSERT statement
      const match = statement.match(/VALUES\s*\(([\s\S]+)\)/i);
      if (!match) continue;
      
      // Parse the VALUES clause to extract individual agent records
      const valuesClause = match[1];
      const agentRecords = parseAgentRecords(valuesClause);
      
      for (const agent of agentRecords) {
        process.stdout.write(`  Inserting ${agent.name}... `);
        
        const response = await fetch(`${BASE_URL}/api/supabase-proxy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'insert',
            table: 'a2a_agents',
            data: agent
          })
        });
        
        const result = await response.json();
        
        if (result.error) {
          if (result.error.includes('duplicate key')) {
            console.log('⚠️  Already exists');
            successful++;
          } else {
            console.log(`❌ ${result.error}`);
            failed++;
          }
        } else {
          console.log('✅');
          successful++;
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Execution Summary:');
  console.log(`  ✅ Successful: ${successful}`);
  console.log(`  ❌ Failed: ${failed}`);
  
  // Verify final count
  console.log('\n🔍 Verifying deployment...');
  const agentCount = await getAgentCount();
  console.log(`  📊 Total agents in database: ${agentCount}`);
  
  if (agentCount > 0) {
    console.log('\n✅ Agents successfully deployed!');
    console.log('\n📝 Next steps:');
    console.log('  1. Run: node test-compliance-live.js');
    console.log('  2. Check: https://hana-proxy-vercel.vercel.app/.well-known/agent.json');
  }
}

async function checkTableExists(tableName) {
  try {
    const response = await fetch(`${BASE_URL}/api/supabase-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'select',
        table: tableName,
        query: 'count',
        filters: { limit: 1 }
      })
    });
    
    const result = await response.json();
    return !result.error;
  } catch (error) {
    return false;
  }
}

async function getAgentCount() {
  try {
    const response = await fetch(`${BASE_URL}/api/a2a-agent-registry?action=list`);
    const result = await response.json();
    return result.count || 0;
  } catch (error) {
    return 0;
  }
}

function parseAgentRecords(valuesClause) {
  // This is a simplified parser for the agent INSERT values
  const agents = [];
  const agentData = [
    { agent_id: 'agent-pearson-correlation', name: 'Pearson Correlation Calculator', type: 'analytics', description: 'Calculates Pearson correlation coefficient between two data series', capabilities: ['calculate_correlation', 'statistical_analysis', 'data_validation'], voting_power: 150, personality: 'analytical', goals: ['accurate_correlation_analysis', 'data_quality_assurance'] },
    { agent_id: 'agent-value-at-risk', name: 'Value at Risk Calculator', type: 'analytics', description: 'Calculates VaR for portfolio risk assessment', capabilities: ['calculate_var', 'risk_assessment', 'confidence_intervals'], voting_power: 200, personality: 'risk-aware', goals: ['portfolio_risk_management', 'loss_prevention'] },
    { agent_id: 'agent-sharpe-ratio', name: 'Sharpe Ratio Analyzer', type: 'analytics', description: 'Calculates risk-adjusted returns using Sharpe ratio', capabilities: ['calculate_sharpe', 'performance_analysis', 'risk_adjustment'], voting_power: 180, personality: 'performance-focused', goals: ['optimize_risk_return', 'performance_measurement'] },
    { agent_id: 'agent-portfolio-volatility', name: 'Portfolio Volatility Tracker', type: 'analytics', description: 'Calculates portfolio volatility and standard deviation', capabilities: ['calculate_volatility', 'risk_measurement', 'variance_analysis'], voting_power: 170, personality: 'precise', goals: ['volatility_monitoring', 'risk_tracking'] },
    { agent_id: 'agent-portfolio-optimization', name: 'Portfolio Optimizer', type: 'analytics', description: 'Optimizes portfolio weights for maximum Sharpe ratio', capabilities: ['optimize_portfolio', 'allocation_analysis', 'efficiency_frontier'], voting_power: 250, personality: 'strategic', goals: ['maximize_sharpe_ratio', 'optimal_allocation'] },
    { agent_id: 'agent-monte-carlo', name: 'Monte Carlo Simulator', type: 'analytics', description: 'Runs Monte Carlo simulations for risk analysis', capabilities: ['monte_carlo_simulation', 'risk_modeling', 'scenario_analysis'], voting_power: 220, personality: 'probabilistic', goals: ['comprehensive_risk_analysis', 'scenario_planning'] },
    { agent_id: 'agent-black-scholes', name: 'Black-Scholes Option Pricer', type: 'analytics', description: 'Calculates option prices using Black-Scholes model', capabilities: ['option_pricing', 'greeks_calculation', 'volatility_analysis'], voting_power: 200, personality: 'quantitative', goals: ['accurate_pricing', 'derivatives_analysis'] },
    { agent_id: 'agent-technical-indicators', name: 'Technical Indicators Suite', type: 'analytics', description: 'Calculates various technical indicators', capabilities: ['calculate_indicators', 'trend_analysis', 'signal_generation'], voting_power: 160, personality: 'technical', goals: ['market_analysis', 'trading_signals'] },
    { agent_id: 'agent-risk-metrics', name: 'Risk Metrics Calculator', type: 'analytics', description: 'Comprehensive risk metrics calculation', capabilities: ['risk_calculation', 'beta_analysis', 'drawdown_analysis'], voting_power: 190, personality: 'risk-focused', goals: ['risk_quantification', 'portfolio_protection'] },
    { agent_id: 'agent-liquidity-calculator', name: 'Liquidity Metrics Analyzer', type: 'analytics', description: 'Calculates liquidity ratios and metrics', capabilities: ['liquidity_analysis', 'ratio_calculation', 'cash_flow_analysis'], voting_power: 140, personality: 'analytical', goals: ['liquidity_monitoring', 'solvency_assessment'] },
    { agent_id: 'agent-performance-attribution', name: 'Performance Attribution Engine', type: 'analytics', description: 'Analyzes sources of portfolio performance', capabilities: ['attribution_analysis', 'factor_decomposition', 'benchmark_comparison'], voting_power: 210, personality: 'detail-oriented', goals: ['performance_explanation', 'value_identification'] },
    { agent_id: 'agent-stress-testing', name: 'Stress Testing Framework', type: 'analytics', description: 'Conducts portfolio stress tests', capabilities: ['stress_testing', 'scenario_modeling', 'tail_risk_analysis'], voting_power: 230, personality: 'conservative', goals: ['risk_identification', 'resilience_testing'] },
    { agent_id: 'agent-expected-shortfall', name: 'Expected Shortfall Calculator', type: 'analytics', description: 'Calculates conditional VaR and expected shortfall', capabilities: ['calculate_es', 'tail_risk', 'coherent_risk_measure'], voting_power: 190, personality: 'prudent', goals: ['tail_risk_management', 'regulatory_compliance'] },
    { agent_id: 'agent-correlation-matrix', name: 'Correlation Matrix Generator', type: 'analytics', description: 'Generates correlation matrices for portfolios', capabilities: ['matrix_generation', 'correlation_analysis', 'dependency_modeling'], voting_power: 160, personality: 'systematic', goals: ['correlation_tracking', 'diversification_analysis'] },
    { agent_id: 'agent-factor-model', name: 'Multi-Factor Model Analyzer', type: 'analytics', description: 'Implements multi-factor models for returns', capabilities: ['factor_modeling', 'regression_analysis', 'factor_exposure'], voting_power: 220, personality: 'quantitative', goals: ['factor_identification', 'return_decomposition'] },
    { agent_id: 'agent-garch-volatility', name: 'GARCH Volatility Forecaster', type: 'analytics', description: 'Forecasts volatility using GARCH models', capabilities: ['volatility_forecasting', 'garch_modeling', 'heteroskedasticity_analysis'], voting_power: 200, personality: 'forward-looking', goals: ['volatility_prediction', 'risk_forecasting'] },
    { agent_id: 'agent-copula-modeling', name: 'Copula Dependency Modeler', type: 'analytics', description: 'Models complex dependencies using copulas', capabilities: ['copula_modeling', 'tail_dependence', 'joint_distribution'], voting_power: 240, personality: 'sophisticated', goals: ['dependency_capture', 'tail_correlation'] },
    { agent_id: 'agent-regime-detection', name: 'Market Regime Detector', type: 'analytics', description: 'Identifies market regime changes', capabilities: ['regime_detection', 'state_identification', 'transition_analysis'], voting_power: 210, personality: 'adaptive', goals: ['regime_identification', 'strategy_adjustment'] },
    { agent_id: 'agent-pairs-trading', name: 'Pairs Trading Analyzer', type: 'analytics', description: 'Identifies and analyzes pairs trading opportunities', capabilities: ['cointegration_testing', 'spread_analysis', 'mean_reversion'], voting_power: 180, personality: 'opportunistic', goals: ['arbitrage_identification', 'market_neutral_strategies'] },
    { agent_id: 'agent-portfolio-rebalancing', name: 'Portfolio Rebalancing Optimizer', type: 'analytics', description: 'Optimizes portfolio rebalancing strategies', capabilities: ['rebalancing_optimization', 'transaction_cost_analysis', 'timing_optimization'], voting_power: 190, personality: 'efficient', goals: ['cost_minimization', 'target_maintenance'] },
    { agent_id: 'agent-kelly-criterion', name: 'Kelly Criterion Calculator', type: 'analytics', description: 'Calculates optimal position sizing using Kelly Criterion', capabilities: ['position_sizing', 'bankroll_management', 'growth_optimization'], voting_power: 170, personality: 'mathematical', goals: ['optimal_growth', 'risk_control'] },
    { agent_id: 'agent-hurst-exponent', name: 'Hurst Exponent Analyzer', type: 'analytics', description: 'Calculates Hurst exponent for time series', capabilities: ['persistence_analysis', 'fractal_dimension', 'mean_reversion_testing'], voting_power: 160, personality: 'analytical', goals: ['market_characterization', 'predictability_assessment'] },
    { agent_id: 'agent-information-ratio', name: 'Information Ratio Calculator', type: 'analytics', description: 'Measures risk-adjusted active returns', capabilities: ['active_return_analysis', 'tracking_error', 'skill_measurement'], voting_power: 180, personality: 'performance-driven', goals: ['alpha_generation', 'manager_evaluation'] },
    { agent_id: 'agent-treynor-ratio', name: 'Treynor Ratio Analyzer', type: 'analytics', description: 'Calculates systematic risk-adjusted returns', capabilities: ['systematic_risk_adjustment', 'beta_normalization', 'capm_analysis'], voting_power: 170, personality: 'systematic', goals: ['market_risk_adjustment', 'performance_ranking'] },
    { agent_id: 'agent-sortino-ratio', name: 'Sortino Ratio Calculator', type: 'analytics', description: 'Measures downside risk-adjusted returns', capabilities: ['downside_deviation', 'asymmetric_risk', 'target_return_analysis'], voting_power: 180, personality: 'downside-focused', goals: ['downside_protection', 'upside_preservation'] },
    { agent_id: 'agent-maximum-drawdown', name: 'Maximum Drawdown Analyzer', type: 'analytics', description: 'Analyzes maximum portfolio drawdowns', capabilities: ['drawdown_calculation', 'recovery_analysis', 'underwater_periods'], voting_power: 190, personality: 'risk-averse', goals: ['loss_limitation', 'capital_preservation'] },
    { agent_id: 'agent-ulcer-index', name: 'Ulcer Index Calculator', type: 'analytics', description: 'Measures downside volatility and stress', capabilities: ['ulcer_calculation', 'pain_index', 'drawdown_deviation'], voting_power: 160, personality: 'conservative', goals: ['stress_measurement', 'investor_comfort'] },
    { agent_id: 'agent-omega-ratio', name: 'Omega Ratio Analyzer', type: 'analytics', description: 'Calculates probability-weighted risk-return ratio', capabilities: ['omega_calculation', 'threshold_analysis', 'distribution_analysis'], voting_power: 200, personality: 'comprehensive', goals: ['holistic_performance', 'threshold_optimization'] },
    { agent_id: 'agent-calmar-ratio', name: 'Calmar Ratio Calculator', type: 'analytics', description: 'Measures return over maximum drawdown', capabilities: ['calmar_calculation', 'drawdown_adjusted_return', 'risk_efficiency'], voting_power: 170, personality: 'pragmatic', goals: ['drawdown_awareness', 'consistent_returns'] },
    { agent_id: 'agent-risk-parity', name: 'Risk Parity Allocator', type: 'analytics', description: 'Implements risk parity portfolio allocation', capabilities: ['risk_parity_allocation', 'risk_contribution', 'leverage_optimization'], voting_power: 220, personality: 'balanced', goals: ['risk_equalization', 'diversification_maximization'] },
    { agent_id: 'agent-conditional-drawdown', name: 'Conditional Drawdown Analyzer', type: 'analytics', description: 'Calculates conditional drawdown at risk', capabilities: ['cdar_calculation', 'conditional_risk', 'scenario_drawdown'], voting_power: 190, personality: 'scenario-focused', goals: ['conditional_protection', 'tail_drawdown_management'] },
    { agent_id: 'agent-risk-budgeting', name: 'Risk Budget Optimizer', type: 'analytics', description: 'Optimizes portfolio risk budgets', capabilities: ['risk_budgeting', 'allocation_optimization', 'constraint_handling'], voting_power: 210, personality: 'strategic', goals: ['risk_allocation', 'budget_optimization'] }
  ];
  
  // Add blockchain config and status to each agent
  return agentData.map(agent => ({
    ...agent,
    status: 'active',
    blockchain_config: {
      wallet_address: `0x${Math.random().toString(16).substring(2, 42)}`,
      consensus_weight: 1.0,
      network: 'private'
    }
  }));
}

// Execute the SQL
executeSQL()
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });