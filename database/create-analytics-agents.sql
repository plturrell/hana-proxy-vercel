-- Create A2A Agents for each of the 32 Analytics Functions
-- These agents correspond to the functions in supabase-migration

-- Ensure a2a_agents table exists
CREATE TABLE IF NOT EXISTS a2a_agents (
    agent_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    capabilities TEXT[],
    status TEXT DEFAULT 'active',
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    total_requests INTEGER DEFAULT 0,
    voting_power INTEGER DEFAULT 100,
    blockchain_config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_tasks JSONB DEFAULT '[]',
    voting_preferences JSONB DEFAULT '{}',
    personality TEXT DEFAULT 'professional',
    goals TEXT[] DEFAULT ARRAY[]::TEXT[],
    last_active TIMESTAMPTZ DEFAULT NOW(),
    performance_score DECIMAL(5,2) DEFAULT 100.00,
    autonomy_enabled BOOLEAN DEFAULT true
);

-- Create ORD (Object Resource Discovery) table for analytics resources
CREATE TABLE IF NOT EXISTS ord_analytics_resources (
    resource_id TEXT PRIMARY KEY DEFAULT 'ord_' || gen_random_uuid()::text,
    agent_id TEXT REFERENCES a2a_agents(agent_id),
    resource_type TEXT NOT NULL, -- 'function', 'dataset', 'model', 'api', 'computation'
    resource_name TEXT NOT NULL,
    resource_path TEXT, -- e.g., 'app_data.calculate_pearson_correlation'
    capabilities JSONB, -- what this resource can do
    requirements JSONB, -- input requirements
    metadata JSONB,
    status TEXT DEFAULT 'available', -- 'available', 'busy', 'maintenance', 'deprecated'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create A2A communication table for agent interactions
CREATE TABLE IF NOT EXISTS a2a_analytics_communications (
    communication_id TEXT PRIMARY KEY DEFAULT 'a2a_' || gen_random_uuid()::text,
    sender_agent_id TEXT REFERENCES a2a_agents(agent_id),
    receiver_agent_id TEXT REFERENCES a2a_agents(agent_id),
    message_type TEXT NOT NULL, -- 'request', 'response', 'broadcast', 'negotiation'
    protocol TEXT DEFAULT 'analytics_v1', -- communication protocol version
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'sent', -- 'sent', 'received', 'acknowledged', 'processed'
    priority INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    received_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ
);

-- Create PRDORD table for production orders
CREATE TABLE IF NOT EXISTS prdord_analytics (
    order_id TEXT PRIMARY KEY,
    agent_id TEXT REFERENCES a2a_agents(agent_id),
    function_name TEXT NOT NULL,
    priority INTEGER DEFAULT 5,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    result JSONB,
    execution_time_ms INTEGER,
    input_parameters JSONB,
    requester_id TEXT,
    error_message TEXT
);

-- Insert the 32 Analytics Agents
INSERT INTO a2a_agents (agent_id, name, type, description, capabilities, voting_power, personality, goals) VALUES

-- Core Analytics Functions (1-9)
('agent-pearson-correlation', 'Pearson Correlation Calculator', 'analytics', 
 'Calculates Pearson correlation coefficient between two data series', 
 ARRAY['calculate_correlation', 'statistical_analysis', 'data_validation'],
 150, 'analytical', ARRAY['accurate_correlation_analysis', 'data_quality_assurance']),

('agent-value-at-risk', 'Value at Risk Calculator', 'analytics',
 'Calculates VaR for portfolio risk assessment',
 ARRAY['calculate_var', 'risk_assessment', 'confidence_intervals'],
 200, 'risk-aware', ARRAY['portfolio_risk_management', 'loss_prevention']),

('agent-sharpe-ratio', 'Sharpe Ratio Analyzer', 'analytics',
 'Calculates risk-adjusted returns using Sharpe ratio',
 ARRAY['calculate_sharpe', 'performance_analysis', 'risk_adjustment'],
 180, 'performance-focused', ARRAY['optimize_risk_return', 'performance_measurement']),

('agent-portfolio-volatility', 'Portfolio Volatility Tracker', 'analytics',
 'Calculates portfolio volatility and standard deviation',
 ARRAY['calculate_volatility', 'risk_measurement', 'variance_analysis'],
 170, 'precise', ARRAY['volatility_monitoring', 'risk_tracking']),

('agent-portfolio-optimization', 'Portfolio Optimizer', 'analytics',
 'Optimizes portfolio weights for maximum Sharpe ratio',
 ARRAY['optimize_portfolio', 'weight_calculation', 'efficient_frontier'],
 250, 'optimization-driven', ARRAY['maximize_returns', 'minimize_risk']),

('agent-moving-average', 'Moving Average Calculator', 'analytics',
 'Calculates various moving averages (SMA, EMA, WMA)',
 ARRAY['calculate_ma', 'trend_analysis', 'signal_generation'],
 120, 'trend-following', ARRAY['identify_trends', 'smooth_data']),

('agent-rsi-calculator', 'RSI Momentum Analyzer', 'analytics',
 'Calculates Relative Strength Index for momentum analysis',
 ARRAY['calculate_rsi', 'momentum_analysis', 'overbought_oversold'],
 130, 'momentum-based', ARRAY['identify_reversals', 'momentum_tracking']),

('agent-macd-analyzer', 'MACD Signal Generator', 'analytics',
 'Calculates MACD for trend and momentum signals',
 ARRAY['calculate_macd', 'signal_generation', 'divergence_detection'],
 140, 'signal-focused', ARRAY['generate_signals', 'trend_confirmation']),

('agent-bollinger-bands', 'Bollinger Bands Calculator', 'analytics',
 'Calculates Bollinger Bands for volatility analysis',
 ARRAY['calculate_bollinger', 'volatility_bands', 'mean_reversion'],
 135, 'volatility-aware', ARRAY['identify_breakouts', 'volatility_analysis']),

-- ML & Reinforcement Learning Functions (10-18)
('agent-monte-carlo', 'Monte Carlo Simulator', 'analytics',
 'Runs Monte Carlo simulations for risk analysis',
 ARRAY['monte_carlo_simulation', 'scenario_analysis', 'probability_distribution'],
 220, 'simulation-expert', ARRAY['scenario_modeling', 'uncertainty_quantification']),

('agent-black-scholes', 'Black-Scholes Pricer', 'analytics',
 'Calculates option prices using Black-Scholes model',
 ARRAY['option_pricing', 'greeks_calculation', 'implied_volatility'],
 240, 'derivatives-specialist', ARRAY['accurate_pricing', 'risk_hedging']),

('agent-bond-duration', 'Bond Duration Calculator', 'analytics',
 'Calculates Macaulay and Modified duration for bonds',
 ARRAY['calculate_duration', 'interest_rate_risk', 'bond_analysis'],
 160, 'fixed-income-expert', ARRAY['duration_matching', 'rate_risk_management']),

('agent-bond-convexity', 'Bond Convexity Analyzer', 'analytics',
 'Calculates bond convexity for advanced risk analysis',
 ARRAY['calculate_convexity', 'second_order_risk', 'bond_analytics'],
 165, 'precision-focused', ARRAY['convexity_analysis', 'risk_refinement']),

('agent-sortino-ratio', 'Sortino Ratio Calculator', 'analytics',
 'Calculates downside risk-adjusted returns',
 ARRAY['calculate_sortino', 'downside_risk', 'performance_metrics'],
 175, 'downside-aware', ARRAY['minimize_downside', 'asymmetric_risk']),

('agent-treynor-ratio', 'Treynor Ratio Analyzer', 'analytics',
 'Calculates systematic risk-adjusted returns',
 ARRAY['calculate_treynor', 'beta_adjustment', 'capm_analysis'],
 170, 'systematic-focused', ARRAY['beta_performance', 'market_risk']),

('agent-information-ratio', 'Information Ratio Calculator', 'analytics',
 'Measures active management performance',
 ARRAY['calculate_ir', 'active_return', 'tracking_error'],
 185, 'alpha-seeking', ARRAY['beat_benchmark', 'consistent_alpha']),

('agent-jensen-alpha', 'Jensen Alpha Analyzer', 'analytics',
 'Calculates risk-adjusted excess returns',
 ARRAY['calculate_alpha', 'capm_alpha', 'performance_attribution'],
 190, 'alpha-hunter', ARRAY['generate_alpha', 'outperform_market']),

('agent-var-historical', 'Historical VaR Calculator', 'analytics',
 'Calculates VaR using historical simulation',
 ARRAY['historical_var', 'empirical_distribution', 'backtesting'],
 195, 'historical-analyst', ARRAY['empirical_risk', 'data_driven_var']),

-- Advanced Analytics Functions (19-32)
('agent-copula-correlation', 'Copula Correlation Modeler', 'analytics',
 'Models dependency using copula functions',
 ARRAY['copula_modeling', 'tail_dependence', 'multivariate_analysis'],
 260, 'correlation-expert', ARRAY['complex_dependencies', 'tail_risk_modeling']),

('agent-garch-volatility', 'GARCH Volatility Forecaster', 'analytics',
 'Forecasts volatility using GARCH models',
 ARRAY['garch_modeling', 'volatility_forecast', 'heteroskedasticity'],
 270, 'volatility-forecaster', ARRAY['dynamic_volatility', 'variance_clustering']),

('agent-cointegration', 'Cointegration Tester', 'analytics',
 'Tests for cointegration between time series',
 ARRAY['cointegration_test', 'pairs_trading', 'long_run_equilibrium'],
 230, 'pairs-specialist', ARRAY['find_relationships', 'statistical_arbitrage']),

('agent-granger-causality', 'Granger Causality Analyzer', 'analytics',
 'Tests for Granger causality between variables',
 ARRAY['causality_test', 'lead_lag_analysis', 'predictive_power'],
 235, 'causality-detective', ARRAY['identify_drivers', 'predictive_relationships']),

('agent-regime-switching', 'Regime Switching Detector', 'analytics',
 'Identifies market regime changes',
 ARRAY['regime_detection', 'markov_switching', 'state_identification'],
 280, 'regime-aware', ARRAY['adapt_to_regimes', 'dynamic_strategies']),

('agent-jump-diffusion', 'Jump Diffusion Modeler', 'analytics',
 'Models asset prices with jump components',
 ARRAY['jump_modeling', 'levy_processes', 'tail_events'],
 275, 'jump-specialist', ARRAY['extreme_events', 'discontinuous_moves']),

('agent-heston-model', 'Heston Stochastic Volatility', 'analytics',
 'Implements Heston stochastic volatility model',
 ARRAY['stochastic_vol', 'option_pricing_advanced', 'vol_surface'],
 290, 'stochastic-expert', ARRAY['volatility_smile', 'advanced_derivatives']),

('agent-vasicek-model', 'Vasicek Interest Rate Model', 'analytics',
 'Models interest rates using Vasicek model',
 ARRAY['interest_rate_modeling', 'mean_reversion', 'term_structure'],
 265, 'rates-modeler', ARRAY['yield_curve_dynamics', 'rate_forecasting']),

('agent-nelson-siegel', 'Nelson-Siegel Yield Curve', 'analytics',
 'Fits yield curves using Nelson-Siegel model',
 ARRAY['yield_curve_fitting', 'term_structure_modeling', 'curve_dynamics'],
 255, 'curve-specialist', ARRAY['smooth_curves', 'term_structure_analysis']),

('agent-credit-migration', 'Credit Migration Analyzer', 'analytics',
 'Analyzes credit rating migrations',
 ARRAY['credit_analysis', 'transition_matrices', 'default_probability'],
 245, 'credit-analyst', ARRAY['credit_risk_assessment', 'migration_tracking']),

('agent-merton-model', 'Merton Structural Model', 'analytics',
 'Implements Merton model for credit risk',
 ARRAY['structural_credit', 'default_modeling', 'equity_credit_link'],
 285, 'credit-modeler', ARRAY['default_prediction', 'structural_analysis']),

('agent-hull-white', 'Hull-White Interest Rate Model', 'analytics',
 'Advanced interest rate modeling with Hull-White',
 ARRAY['hull_white_model', 'calibration', 'derivative_pricing'],
 295, 'calibration-expert', ARRAY['model_calibration', 'exotic_pricing']),

('agent-factor-analysis', 'Multi-Factor Risk Analyzer', 'analytics',
 'Performs multi-factor risk decomposition',
 ARRAY['factor_analysis', 'risk_decomposition', 'attribution_analysis'],
 300, 'factor-specialist', ARRAY['factor_exposure', 'risk_attribution']),

('agent-liquidity-metrics', 'Liquidity Risk Analyzer', 'analytics',
 'Calculates comprehensive liquidity metrics',
 ARRAY['liquidity_analysis', 'market_impact', 'funding_risk'],
 310, 'liquidity-guardian', ARRAY['liquidity_management', 'funding_optimization'])

ON CONFLICT (agent_id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    description = EXCLUDED.description,
    capabilities = EXCLUDED.capabilities,
    voting_power = EXCLUDED.voting_power,
    personality = EXCLUDED.personality,
    goals = EXCLUDED.goals,
    updated_at = NOW();

-- Create production orders for each analytics function
INSERT INTO prdord_analytics (order_id, agent_id, function_name, priority) VALUES
('PRDORD-001', 'agent-pearson-correlation', 'calculate_pearson_correlation', 8),
('PRDORD-002', 'agent-value-at-risk', 'calculate_var', 10),
('PRDORD-003', 'agent-sharpe-ratio', 'calculate_sharpe_ratio', 9),
('PRDORD-004', 'agent-portfolio-volatility', 'calculate_portfolio_volatility', 8),
('PRDORD-005', 'agent-portfolio-optimization', 'optimize_portfolio', 10),
('PRDORD-006', 'agent-moving-average', 'calculate_moving_average', 6),
('PRDORD-007', 'agent-rsi-calculator', 'calculate_rsi', 7),
('PRDORD-008', 'agent-macd-analyzer', 'calculate_macd', 7),
('PRDORD-009', 'agent-bollinger-bands', 'calculate_bollinger_bands', 7),
('PRDORD-010', 'agent-monte-carlo', 'monte_carlo_simulation', 9),
('PRDORD-011', 'agent-black-scholes', 'black_scholes_option_price', 10),
('PRDORD-012', 'agent-bond-duration', 'calculate_bond_duration', 8),
('PRDORD-013', 'agent-bond-convexity', 'calculate_bond_convexity', 8),
('PRDORD-014', 'agent-sortino-ratio', 'calculate_sortino_ratio', 9),
('PRDORD-015', 'agent-treynor-ratio', 'calculate_treynor_ratio', 8),
('PRDORD-016', 'agent-information-ratio', 'calculate_information_ratio', 9),
('PRDORD-017', 'agent-jensen-alpha', 'calculate_jensen_alpha', 9),
('PRDORD-018', 'agent-var-historical', 'calculate_historical_var', 10),
('PRDORD-019', 'agent-copula-correlation', 'copula_correlation', 10),
('PRDORD-020', 'agent-garch-volatility', 'garch_volatility_forecast', 10),
('PRDORD-021', 'agent-cointegration', 'test_cointegration', 9),
('PRDORD-022', 'agent-granger-causality', 'granger_causality_test', 9),
('PRDORD-023', 'agent-regime-switching', 'regime_switching_model', 10),
('PRDORD-024', 'agent-jump-diffusion', 'jump_diffusion_model', 10),
('PRDORD-025', 'agent-heston-model', 'heston_model', 10),
('PRDORD-026', 'agent-vasicek-model', 'vasicek_model', 9),
('PRDORD-027', 'agent-nelson-siegel', 'nelson_siegel_svensson', 9),
('PRDORD-028', 'agent-credit-migration', 'credit_migration_matrix', 9),
('PRDORD-029', 'agent-merton-model', 'merton_model', 10),
('PRDORD-030', 'agent-hull-white', 'hull_white_model', 10),
('PRDORD-031', 'agent-factor-analysis', 'factor_analysis', 10),
('PRDORD-032', 'agent-liquidity-metrics', 'liquidity_metrics', 10)
ON CONFLICT (order_id) DO UPDATE SET
    agent_id = EXCLUDED.agent_id,
    function_name = EXCLUDED.function_name,
    priority = EXCLUDED.priority;

-- Verify the creation
SELECT COUNT(*) as analytics_agent_count 
FROM a2a_agents 
WHERE type = 'analytics';

SELECT COUNT(*) as prdord_count 
FROM prdord_analytics;