-- Additional ORD and A2A setup for Analytics Agents
-- This file should be run after create-analytics-agents.sql

-- Insert ORD resources for each analytics function
INSERT INTO ord_analytics_resources (agent_id, resource_type, resource_name, resource_path, capabilities, requirements, metadata) VALUES

-- Core Analytics Functions (1-9)
('agent-pearson-correlation', 'function', 'Pearson Correlation', 'app_data.calculate_pearson_correlation', 
 '{"correlation_analysis": true, "statistical_significance": true, "data_validation": true}'::jsonb,
 '{"x_values": "JSONB array", "y_values": "JSONB array", "min_samples": 2}'::jsonb,
 '{"category": "statistics", "complexity": "O(n)", "accuracy": "high"}'::jsonb),

('agent-value-at-risk', 'function', 'Value at Risk', 'app_data.calculate_var',
 '{"risk_calculation": true, "confidence_intervals": [0.95, 0.99], "historical_simulation": true}'::jsonb,
 '{"returns": "JSONB array", "confidence_level": "number", "time_horizon": "optional"}'::jsonb,
 '{"category": "risk", "complexity": "O(n log n)", "regulatory_approved": true}'::jsonb),

('agent-sharpe-ratio', 'function', 'Sharpe Ratio', 'app_data.calculate_sharpe_ratio',
 '{"performance_measurement": true, "risk_adjustment": true, "benchmark_comparison": true}'::jsonb,
 '{"returns": "JSONB array", "risk_free_rate": "number", "period": "optional"}'::jsonb,
 '{"category": "performance", "complexity": "O(n)", "industry_standard": true}'::jsonb),

('agent-portfolio-volatility', 'function', 'Portfolio Volatility', 'app_data.calculate_portfolio_volatility',
 '{"volatility_calculation": true, "covariance_matrix": true, "rolling_window": true}'::jsonb,
 '{"weights": "JSONB array", "returns": "JSONB matrix", "lookback": "optional"}'::jsonb,
 '{"category": "risk", "complexity": "O(n²)", "accuracy": "high"}'::jsonb),

('agent-portfolio-optimization', 'function', 'Portfolio Optimization', 'app_data.optimize_portfolio',
 '{"efficient_frontier": true, "mean_variance": true, "constraints": true}'::jsonb,
 '{"expected_returns": "JSONB array", "covariance": "JSONB matrix", "constraints": "optional"}'::jsonb,
 '{"category": "optimization", "complexity": "O(n³)", "solver": "quadratic_programming"}'::jsonb),

('agent-moving-average', 'function', 'Moving Averages', 'app_data.calculate_moving_average',
 '{"sma": true, "ema": true, "wma": true, "adaptive": true}'::jsonb,
 '{"prices": "JSONB array", "period": "number", "ma_type": "string"}'::jsonb,
 '{"category": "technical", "complexity": "O(n)", "real_time": true}'::jsonb),

('agent-rsi-calculator', 'function', 'RSI Calculator', 'app_data.calculate_rsi',
 '{"momentum_analysis": true, "overbought_oversold": true, "divergence": true}'::jsonb,
 '{"prices": "JSONB array", "period": "number", "smoothing": "optional"}'::jsonb,
 '{"category": "momentum", "complexity": "O(n)", "range": [0, 100]}'::jsonb),

('agent-macd-analyzer', 'function', 'MACD Analysis', 'app_data.calculate_macd',
 '{"trend_following": true, "signal_generation": true, "histogram": true}'::jsonb,
 '{"prices": "JSONB array", "fast": "number", "slow": "number", "signal": "number"}'::jsonb,
 '{"category": "trend", "complexity": "O(n)", "signals": ["bullish", "bearish"]}'::jsonb),

('agent-bollinger-bands', 'function', 'Bollinger Bands', 'app_data.calculate_bollinger_bands',
 '{"volatility_bands": true, "mean_reversion": true, "breakout_detection": true}'::jsonb,
 '{"prices": "JSONB array", "period": "number", "std_dev": "number"}'::jsonb,
 '{"category": "volatility", "complexity": "O(n)", "bands": ["upper", "middle", "lower"]}'::jsonb),

-- ML & Reinforcement Learning Functions (10-18)
('agent-monte-carlo', 'function', 'Monte Carlo Simulation', 'app_data.monte_carlo_simulation',
 '{"scenario_generation": true, "risk_simulation": true, "option_pricing": true}'::jsonb,
 '{"parameters": "JSONB object", "iterations": "number", "time_steps": "number"}'::jsonb,
 '{"category": "simulation", "complexity": "O(n*m)", "parallel": true}'::jsonb),

('agent-black-scholes', 'function', 'Black-Scholes Pricing', 'app_data.black_scholes_option_price',
 '{"option_pricing": true, "greeks": true, "implied_volatility": true}'::jsonb,
 '{"spot": "number", "strike": "number", "rate": "number", "time": "number", "volatility": "number"}'::jsonb,
 '{"category": "derivatives", "complexity": "O(1)", "model": "analytical"}'::jsonb),

('agent-bond-duration', 'function', 'Bond Duration', 'app_data.calculate_bond_duration',
 '{"macaulay_duration": true, "modified_duration": true, "effective_duration": true}'::jsonb,
 '{"cash_flows": "JSONB array", "yield": "number", "frequency": "number"}'::jsonb,
 '{"category": "fixed_income", "complexity": "O(n)", "precision": "high"}'::jsonb),

('agent-bond-convexity', 'function', 'Bond Convexity', 'app_data.calculate_bond_convexity',
 '{"convexity": true, "second_order_risk": true, "price_sensitivity": true}'::jsonb,
 '{"cash_flows": "JSONB array", "yield": "number", "frequency": "number"}'::jsonb,
 '{"category": "fixed_income", "complexity": "O(n)", "order": "second"}'::jsonb),

('agent-sortino-ratio', 'function', 'Sortino Ratio', 'app_data.calculate_sortino_ratio',
 '{"downside_risk": true, "target_return": true, "asymmetric_risk": true}'::jsonb,
 '{"returns": "JSONB array", "target": "number", "risk_free": "number"}'::jsonb,
 '{"category": "performance", "complexity": "O(n)", "focus": "downside"}'::jsonb),

('agent-treynor-ratio', 'function', 'Treynor Ratio', 'app_data.calculate_treynor_ratio',
 '{"systematic_risk": true, "beta_adjustment": true, "market_risk": true}'::jsonb,
 '{"returns": "JSONB array", "market_returns": "JSONB array", "risk_free": "number"}'::jsonb,
 '{"category": "performance", "complexity": "O(n)", "risk_measure": "beta"}'::jsonb),

('agent-information-ratio', 'function', 'Information Ratio', 'app_data.calculate_information_ratio',
 '{"active_return": true, "tracking_error": true, "consistency": true}'::jsonb,
 '{"portfolio_returns": "JSONB array", "benchmark_returns": "JSONB array"}'::jsonb,
 '{"category": "performance", "complexity": "O(n)", "focus": "active_management"}'::jsonb),

('agent-jensen-alpha', 'function', 'Jensen Alpha', 'app_data.calculate_jensen_alpha',
 '{"excess_return": true, "capm_alpha": true, "skill_measurement": true}'::jsonb,
 '{"returns": "JSONB array", "market_returns": "JSONB array", "risk_free": "number", "beta": "number"}'::jsonb,
 '{"category": "performance", "complexity": "O(n)", "model": "CAPM"}'::jsonb),

('agent-var-historical', 'function', 'Historical VaR', 'app_data.calculate_historical_var',
 '{"empirical_distribution": true, "backtesting": true, "stress_scenarios": true}'::jsonb,
 '{"returns": "JSONB array", "confidence": "number", "horizon": "number"}'::jsonb,
 '{"category": "risk", "complexity": "O(n log n)", "method": "historical"}'::jsonb),

-- Advanced Analytics Functions (19-32)
('agent-copula-correlation', 'function', 'Copula Correlation', 'app_data.copula_correlation',
 '{"dependency_modeling": true, "tail_dependence": true, "multivariate": true}'::jsonb,
 '{"data": "JSONB matrix", "copula_type": "string", "parameters": "JSONB"}'::jsonb,
 '{"category": "correlation", "complexity": "O(n²)", "advanced": true}'::jsonb),

('agent-garch-volatility', 'function', 'GARCH Volatility', 'app_data.garch_volatility_forecast',
 '{"volatility_forecast": true, "clustering": true, "arch_effects": true}'::jsonb,
 '{"returns": "JSONB array", "p": "number", "q": "number", "horizon": "number"}'::jsonb,
 '{"category": "volatility", "complexity": "O(n*k)", "model": "GARCH"}'::jsonb),

('agent-cointegration', 'function', 'Cointegration Test', 'app_data.test_cointegration',
 '{"johansen_test": true, "engle_granger": true, "pairs_trading": true}'::jsonb,
 '{"series1": "JSONB array", "series2": "JSONB array", "test_type": "string"}'::jsonb,
 '{"category": "econometrics", "complexity": "O(n²)", "statistical": true}'::jsonb),

('agent-granger-causality', 'function', 'Granger Causality', 'app_data.granger_causality_test',
 '{"causality_test": true, "lag_selection": true, "p_values": true}'::jsonb,
 '{"x": "JSONB array", "y": "JSONB array", "max_lag": "number"}'::jsonb,
 '{"category": "econometrics", "complexity": "O(n*k²)", "directional": true}'::jsonb),

('agent-regime-switching', 'function', 'Regime Switching', 'app_data.regime_switching_model',
 '{"markov_switching": true, "state_detection": true, "transition_matrix": true}'::jsonb,
 '{"data": "JSONB array", "n_states": "number", "switching_variance": "boolean"}'::jsonb,
 '{"category": "regime", "complexity": "O(n*k²)", "model": "Markov"}'::jsonb),

('agent-jump-diffusion', 'function', 'Jump Diffusion', 'app_data.jump_diffusion_model',
 '{"jump_modeling": true, "merton_jumps": true, "levy_process": true}'::jsonb,
 '{"prices": "JSONB array", "drift": "number", "volatility": "number", "jump_params": "JSONB"}'::jsonb,
 '{"category": "stochastic", "complexity": "O(n)", "discontinuous": true}'::jsonb),

('agent-heston-model', 'function', 'Heston Model', 'app_data.heston_model',
 '{"stochastic_volatility": true, "smile_modeling": true, "option_pricing": true}'::jsonb,
 '{"spot": "number", "strike": "number", "params": "JSONB", "maturity": "number"}'::jsonb,
 '{"category": "derivatives", "complexity": "O(n²)", "stochastic_vol": true}'::jsonb),

('agent-vasicek-model', 'function', 'Vasicek Model', 'app_data.vasicek_model',
 '{"interest_rate": true, "mean_reversion": true, "term_structure": true}'::jsonb,
 '{"initial_rate": "number", "parameters": "JSONB", "time_points": "JSONB array"}'::jsonb,
 '{"category": "rates", "complexity": "O(n)", "model": "equilibrium"}'::jsonb),

('agent-nelson-siegel', 'function', 'Nelson-Siegel-Svensson', 'app_data.nelson_siegel_svensson',
 '{"yield_curve": true, "curve_fitting": true, "extrapolation": true}'::jsonb,
 '{"maturities": "JSONB array", "yields": "JSONB array", "params": "optional"}'::jsonb,
 '{"category": "rates", "complexity": "O(n)", "parametric": true}'::jsonb),

('agent-credit-migration', 'function', 'Credit Migration', 'app_data.credit_migration_matrix',
 '{"transition_matrix": true, "default_probability": true, "rating_dynamics": true}'::jsonb,
 '{"ratings_history": "JSONB matrix", "time_horizon": "number", "method": "string"}'::jsonb,
 '{"category": "credit", "complexity": "O(n²)", "regulatory": true}'::jsonb),

('agent-merton-model', 'function', 'Merton Model', 'app_data.merton_model',
 '{"credit_risk": true, "default_probability": true, "distance_to_default": true}'::jsonb,
 '{"equity": "number", "debt": "number", "volatility": "number", "rate": "number"}'::jsonb,
 '{"category": "credit", "complexity": "O(1)", "structural": true}'::jsonb),

('agent-hull-white', 'function', 'Hull-White Model', 'app_data.hull_white_model',
 '{"interest_rate": true, "calibration": true, "tree_building": true}'::jsonb,
 '{"curve": "JSONB array", "volatility": "JSONB", "mean_reversion": "number"}'::jsonb,
 '{"category": "rates", "complexity": "O(n²)", "arbitrage_free": true}'::jsonb),

('agent-factor-analysis', 'function', 'Factor Analysis', 'app_data.factor_analysis',
 '{"risk_decomposition": true, "factor_loadings": true, "pca": true}'::jsonb,
 '{"returns": "JSONB matrix", "n_factors": "number", "method": "string"}'::jsonb,
 '{"category": "risk", "complexity": "O(n³)", "multivariate": true}'::jsonb),

('agent-liquidity-metrics', 'function', 'Liquidity Metrics', 'app_data.liquidity_metrics',
 '{"bid_ask_spread": true, "market_impact": true, "liquidity_risk": true}'::jsonb,
 '{"prices": "JSONB", "volumes": "JSONB", "order_book": "optional"}'::jsonb,
 '{"category": "liquidity", "complexity": "O(n)", "real_time": true}'::jsonb)

ON CONFLICT (resource_id) DO NOTHING;  -- Skip if already exists

-- Create A2A communication protocols between analytics agents
INSERT INTO a2a_analytics_communications (sender_agent_id, receiver_agent_id, message_type, payload) VALUES
-- Portfolio optimizer can request data from other agents
('agent-portfolio-optimization', 'agent-pearson-correlation', 'request', 
 '{"request": "correlation_matrix", "assets": ["AAPL", "GOOGL", "MSFT"], "period": "1Y"}'::jsonb),
('agent-portfolio-optimization', 'agent-value-at-risk', 'request',
 '{"request": "portfolio_var", "confidence": 0.95, "horizon": 1}'::jsonb),
-- Risk agents communicate with each other
('agent-value-at-risk', 'agent-monte-carlo', 'request',
 '{"request": "simulation_params", "scenarios": 10000, "distribution": "normal"}'::jsonb),
('agent-var-historical', 'agent-value-at-risk', 'response',
 '{"response": "historical_data", "lookback": 252, "confidence": [0.95, 0.99]}'::jsonb);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ord_resources_agent ON ord_analytics_resources(agent_id);
CREATE INDEX IF NOT EXISTS idx_ord_resources_type ON ord_analytics_resources(resource_type, status);
CREATE INDEX IF NOT EXISTS idx_a2a_comms_agents ON a2a_analytics_communications(sender_agent_id, receiver_agent_id);
CREATE INDEX IF NOT EXISTS idx_a2a_comms_status ON a2a_analytics_communications(status, created_at);

-- Create views for easy monitoring
CREATE OR REPLACE VIEW analytics_agent_status AS
SELECT 
    a.agent_id,
    a.name,
    a.status as agent_status,
    COUNT(DISTINCT o.resource_id) as available_resources,
    COUNT(DISTINCT p.order_id) as pending_orders,
    COUNT(DISTINCT c.communication_id) as active_communications
FROM a2a_agents a
LEFT JOIN ord_analytics_resources o ON a.agent_id = o.agent_id
LEFT JOIN prdord_analytics p ON a.agent_id = p.agent_id AND p.status = 'pending'
LEFT JOIN a2a_analytics_communications c ON (a.agent_id = c.sender_agent_id OR a.agent_id = c.receiver_agent_id) 
    AND c.status IN ('sent', 'received')
WHERE a.type = 'analytics'
GROUP BY a.agent_id, a.name, a.status;

-- Verify complete setup
SELECT 
    'Analytics Agents' as component, 
    COUNT(*) as count 
FROM a2a_agents 
WHERE type = 'analytics'
UNION ALL
SELECT 
    'ORD Resources' as component, 
    COUNT(*) as count 
FROM ord_analytics_resources
UNION ALL
SELECT 
    'Production Orders' as component, 
    COUNT(*) as count 
FROM prdord_analytics
UNION ALL
SELECT 
    'A2A Communications' as component, 
    COUNT(*) as count 
FROM a2a_analytics_communications;