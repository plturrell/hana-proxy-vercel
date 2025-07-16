-- A2A Agent Definition Schema for FinSight
-- Complete schema with all 35 agents based on Agent-to-Agent Protocol

-- Create agents table to store A2A agent metadata
CREATE TABLE IF NOT EXISTS app_data.a2a_agents (
    -- Core Agent Identity
    agent_id VARCHAR(255) PRIMARY KEY, -- Format: finsight.{category}.{function_name}
    agent_name VARCHAR(255) NOT NULL,
    agent_version VARCHAR(50) DEFAULT '1.0.0',
    
    -- A2A Protocol Fields
    protocol_version VARCHAR(50) DEFAULT 'A2A/1.0',
    agent_type VARCHAR(100) NOT NULL, -- analytics, financial, ml, nlp, data
    
    -- Agent Metadata
    description TEXT NOT NULL,
    icon VARCHAR(10), -- 2-3 letter abbreviation
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, maintenance
    
    -- Capabilities (JSON)
    capabilities JSONB NOT NULL DEFAULT '{}',
    /* Example capabilities structure:
    {
        "input_types": ["json-array", "numeric", "text"],
        "output_types": ["numeric", "json", "boolean"],
        "domains": ["statistical-analysis", "risk-assessment"],
        "protocols": ["REST", "JSON-RPC"],
        "authentication": ["api-key", "oauth2"]
    }
    */
    
    -- Connection Information
    endpoint_url VARCHAR(500),
    connection_config JSONB DEFAULT '{}',
    /* Example connection config:
    {
        "method": "POST",
        "headers": {"Content-Type": "application/json"},
        "auth_type": "bearer",
        "timeout": 30000
    }
    */
    
    -- Function Mapping
    function_name VARCHAR(255) NOT NULL, -- Supabase function name
    function_parameters JSONB DEFAULT '[]',
    /* Example parameters:
    [
        {"name": "x_values", "type": "array", "required": true},
        {"name": "y_values", "type": "array", "required": true}
    ]
    */
    
    -- Performance Metrics
    avg_response_time_ms INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    total_requests BIGINT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_a2a_agents_type ON app_data.a2a_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_a2a_agents_status ON app_data.a2a_agents(status);
CREATE INDEX IF NOT EXISTS idx_a2a_agents_function ON app_data.a2a_agents(function_name);

-- Clear existing agents
TRUNCATE TABLE app_data.a2a_agents;

-- Insert all 35 agents with proper A2A metadata
INSERT INTO app_data.a2a_agents (agent_id, agent_name, agent_type, description, icon, function_name, capabilities, function_parameters) VALUES

-- 1. Pearson Correlation Agent
('finsight.analytics.pearson_correlation', 'Pearson Correlation Agent', 'analytics', 
 'Calculates statistical correlation between two data arrays using Pearson method', 'PC',
 'calculate_pearson_correlation',
 '{
    "input_types": ["json-array"],
    "output_types": ["numeric"],
    "domains": ["statistical-analysis", "correlation"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "x_values", "type": "jsonb", "required": true, "description": "Array of X values"},
    {"name": "y_values", "type": "jsonb", "required": true, "description": "Array of Y values"}
 ]'::jsonb),

-- 2. Value at Risk Agent
('finsight.analytics.value_at_risk', 'Value at Risk Agent', 'analytics',
 'Calculates portfolio Value at Risk using historical simulation', 'VaR',
 'calculate_var',
 '{
    "input_types": ["json-array", "numeric"],
    "output_types": ["numeric"],
    "domains": ["risk-assessment", "portfolio-analysis"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "returns_json", "type": "jsonb", "required": true, "description": "Array of historical returns"},
    {"name": "confidence_level", "type": "double precision", "required": true, "description": "Confidence level (e.g., 0.95)"}
 ]'::jsonb),

-- 3. Thompson Sampling Agent
('finsight.ml.thompson_sampling', 'Thompson Sampling Agent', 'ml',
 'Updates Thompson Sampling parameters for multi-armed bandit optimization', 'TS',
 'update_thompson_sampling',
 '{
    "input_types": ["numeric", "boolean", "json"],
    "output_types": ["json"],
    "domains": ["reinforcement-learning", "optimization"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "arm_id", "type": "text", "required": true},
    {"name": "reward", "type": "numeric", "required": true},
    {"name": "context_json", "type": "jsonb", "required": false}
 ]'::jsonb),

-- 4. Sentiment Analysis Agent
('finsight.nlp.sentiment_analysis', 'Sentiment Analysis Agent', 'nlp',
 'Analyzes text sentiment using NLP techniques', 'SA',
 'calculate_sentiment_score',
 '{
    "input_types": ["text"],
    "output_types": ["json"],
    "domains": ["nlp", "sentiment-analysis", "text-processing"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "text_content", "type": "text", "required": true},
    {"name": "language", "type": "text", "required": false, "default": "en"}
 ]'::jsonb),

-- 5. Trend Detection Agent
('finsight.analytics.trend_detection', 'Trend Detection Agent', 'analytics',
 'Detects trends in time series data using statistical methods', 'TD',
 'detect_trend',
 '{
    "input_types": ["time-series", "json-array"],
    "output_types": ["trend-analysis", "json"],
    "domains": ["time-series-analysis", "trend-detection"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "time_series_data", "type": "jsonb", "required": true},
    {"name": "window_size", "type": "integer", "required": false, "default": 10}
 ]'::jsonb),

-- 6. Anomaly Detection Agent
('finsight.ml.anomaly_detection', 'Anomaly Detection Agent', 'ml',
 'Detects anomalies using Z-score based statistical methods', 'AD',
 'detect_anomaly',
 '{
    "input_types": ["numeric-array", "json"],
    "output_types": ["anomaly-report", "json"],
    "domains": ["anomaly-detection", "statistical-analysis"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "data_points", "type": "jsonb", "required": true},
    {"name": "threshold", "type": "double precision", "required": false, "default": 3.0}
 ]'::jsonb),

-- 7. LinUCB Bandit Agent
('finsight.ml.linucb_bandit', 'LinUCB Bandit Agent', 'ml',
 'Contextual bandit algorithm for decision making under uncertainty', 'LU',
 'linucb_select_action',
 '{
    "input_types": ["context-vector", "json"],
    "output_types": ["action-selection", "json"],
    "domains": ["reinforcement-learning", "contextual-bandits"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "context_vector", "type": "jsonb", "required": true},
    {"name": "available_actions", "type": "jsonb", "required": true},
    {"name": "alpha", "type": "double precision", "required": false, "default": 1.0}
 ]'::jsonb),

-- 8. Neural Bandit Decision Agent
('finsight.ml.neural_bandit', 'Neural Bandit Decision Agent', 'ml',
 'Neural network-based bandit for complex decision spaces', 'NB',
 'neural_bandit_decision',
 '{
    "input_types": ["feature-vector", "json"],
    "output_types": ["decision", "json"],
    "domains": ["deep-learning", "decision-making"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key", "oauth2"]
 }'::jsonb,
 '[
    {"name": "feature_vector", "type": "jsonb", "required": true},
    {"name": "model_id", "type": "text", "required": true},
    {"name": "exploration_rate", "type": "double precision", "required": false}
 ]'::jsonb),

-- 9. Collaborative Learning Agent
('finsight.ml.collaborative_learning', 'Collaborative Learning Agent', 'ml',
 'Federated learning for privacy-preserving model updates', 'CL',
 'collaborative_model_update',
 '{
    "input_types": ["model-update", "json"],
    "output_types": ["aggregated-model", "json"],
    "domains": ["federated-learning", "privacy-preserving-ml"],
    "protocols": ["REST", "gRPC"],
    "authentication": ["api-key", "mtls"]
 }'::jsonb,
 '[
    {"name": "local_gradients", "type": "jsonb", "required": true},
    {"name": "model_version", "type": "text", "required": true},
    {"name": "client_id", "type": "text", "required": true}
 ]'::jsonb),

-- 10. Adaptive Cache Agent
('finsight.data.adaptive_cache', 'Adaptive Cache Agent', 'data',
 'Intelligent caching with ML-based eviction policies', 'AC',
 'adaptive_cache_get',
 '{
    "input_types": ["cache-key", "query"],
    "output_types": ["cached-result", "json"],
    "domains": ["caching", "performance-optimization"],
    "protocols": ["REST", "Redis-protocol"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "cache_key", "type": "text", "required": true},
    {"name": "query_context", "type": "jsonb", "required": false},
    {"name": "ttl", "type": "integer", "required": false}
 ]'::jsonb),

-- 11. Model Performance Agent
('finsight.ml.model_performance', 'Model Performance Agent', 'ml',
 'Tracks and analyzes ML model performance metrics', 'MP',
 'track_model_performance',
 '{
    "input_types": ["predictions", "actuals", "json"],
    "output_types": ["metrics", "json"],
    "domains": ["model-monitoring", "mlops"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "model_id", "type": "text", "required": true},
    {"name": "predictions", "type": "jsonb", "required": true},
    {"name": "actuals", "type": "jsonb", "required": true}
 ]'::jsonb),

-- 12. Feature Importance Agent
('finsight.ml.feature_importance', 'Feature Importance Agent', 'ml',
 'Calculates feature importance using SHAP values', 'FI',
 'calculate_feature_importance',
 '{
    "input_types": ["model", "dataset", "json"],
    "output_types": ["importance-scores", "json"],
    "domains": ["explainable-ai", "feature-engineering"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "model_id", "type": "text", "required": true},
    {"name": "features", "type": "jsonb", "required": true},
    {"name": "method", "type": "text", "required": false, "default": "shap"}
 ]'::jsonb),

-- 13. Synthetic Data Generator Agent
('finsight.data.synthetic_generator', 'Synthetic Data Generator Agent', 'data',
 'Generates synthetic financial data preserving statistical properties', 'SG',
 'generate_synthetic_data',
 '{
    "input_types": ["schema", "statistics", "json"],
    "output_types": ["synthetic-data", "json"],
    "domains": ["data-generation", "privacy"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "data_schema", "type": "jsonb", "required": true},
    {"name": "num_records", "type": "integer", "required": true},
    {"name": "preserve_correlations", "type": "boolean", "required": false}
 ]'::jsonb),

-- 14. Knowledge Graph Agent
('finsight.data.knowledge_graph', 'Knowledge Graph Agent', 'data',
 'Builds and queries financial knowledge graphs', 'KG',
 'query_knowledge_graph',
 '{
    "input_types": ["sparql", "cypher", "json"],
    "output_types": ["graph-results", "json"],
    "domains": ["knowledge-graphs", "semantic-search"],
    "protocols": ["REST", "GraphQL"],
    "authentication": ["api-key", "oauth2"]
 }'::jsonb,
 '[
    {"name": "query", "type": "text", "required": true},
    {"name": "graph_name", "type": "text", "required": true},
    {"name": "limit", "type": "integer", "required": false}
 ]'::jsonb),

-- 15. Entity Materialization Agent
('finsight.data.entity_materialization', 'Entity Materialization Agent', 'data',
 'Materializes entities from streaming data', 'EM',
 'materialize_entities',
 '{
    "input_types": ["stream", "entity-definition", "json"],
    "output_types": ["materialized-entities", "json"],
    "domains": ["stream-processing", "entity-resolution"],
    "protocols": ["REST", "Kafka"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "entity_type", "type": "text", "required": true},
    {"name": "time_window", "type": "interval", "required": true},
    {"name": "aggregations", "type": "jsonb", "required": true}
 ]'::jsonb),

-- 16. Temporal Correlation Agent
('finsight.analytics.temporal_correlation', 'Temporal Correlation Agent', 'analytics',
 'Analyzes time-lagged correlations between variables', 'TC',
 'calculate_temporal_correlations',
 '{
    "input_types": ["time-series", "json"],
    "output_types": ["correlation-matrix", "json"],
    "domains": ["time-series-analysis", "correlation"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "series_a", "type": "jsonb", "required": true},
    {"name": "series_b", "type": "jsonb", "required": true},
    {"name": "max_lag", "type": "integer", "required": false, "default": 10}
 ]'::jsonb),

-- 17. SWIFT Query Agent
('finsight.financial.swift_query', 'SWIFT Query Agent', 'financial',
 'Queries and analyzes SWIFT transaction messages', 'SQ',
 'query_swift_messages',
 '{
    "input_types": ["swift-criteria", "json"],
    "output_types": ["transactions", "json"],
    "domains": ["swift", "transaction-analysis"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key", "swift-auth"]
 }'::jsonb,
 '[
    {"name": "message_types", "type": "jsonb", "required": true},
    {"name": "date_range", "type": "jsonb", "required": true},
    {"name": "counterparties", "type": "jsonb", "required": false}
 ]'::jsonb),

-- 18. Entity Evolution Agent
('finsight.analytics.entity_evolution', 'Entity Evolution Agent', 'analytics',
 'Tracks entity changes and evolution over time', 'EE',
 'track_entity_evolution',
 '{
    "input_types": ["entity-id", "time-range", "json"],
    "output_types": ["evolution-timeline", "json"],
    "domains": ["entity-tracking", "temporal-analysis"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "entity_id", "type": "text", "required": true},
    {"name": "start_date", "type": "date", "required": true},
    {"name": "end_date", "type": "date", "required": true}
 ]'::jsonb),

-- 19. Metric Correlation Matrix Agent
('finsight.analytics.metric_correlation', 'Metric Correlation Matrix Agent', 'analytics',
 'Creates comprehensive correlation matrices for multiple metrics', 'MC',
 'calculate_metric_correlations',
 '{
    "input_types": ["metrics-data", "json"],
    "output_types": ["correlation-matrix", "json"],
    "domains": ["correlation-analysis", "metrics"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "metrics", "type": "jsonb", "required": true},
    {"name": "correlation_method", "type": "text", "required": false, "default": "pearson"},
    {"name": "handle_missing", "type": "text", "required": false}
 ]'::jsonb),

-- 20. Portfolio Risk Agent
('finsight.financial.portfolio_risk', 'Portfolio Risk Agent', 'financial',
 'Comprehensive portfolio risk analysis including VaR, Sharpe ratio, and volatility', 'PR',
 'calculate_portfolio_risk',
 '{
    "input_types": ["portfolio-data", "json"],
    "output_types": ["risk-metrics", "json"],
    "domains": ["portfolio-analysis", "risk-assessment"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key", "oauth2"]
 }'::jsonb,
 '[
    {"name": "holdings_json", "type": "jsonb", "required": true},
    {"name": "returns_json", "type": "jsonb", "required": true},
    {"name": "benchmark_returns", "type": "jsonb", "required": false}
 ]'::jsonb),

-- 21. Basel III Ratios Agent
('finsight.financial.basel_ratios', 'Basel III Ratios Agent', 'financial',
 'Calculates regulatory capital ratios per Basel III requirements', 'BR',
 'calculate_basel_ratios',
 '{
    "input_types": ["balance-sheet", "json"],
    "output_types": ["basel-ratios", "json"],
    "domains": ["regulatory-compliance", "capital-adequacy"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key", "regulatory-auth"]
 }'::jsonb,
 '[
    {"name": "tier1_capital", "type": "numeric", "required": true},
    {"name": "tier2_capital", "type": "numeric", "required": true},
    {"name": "risk_weighted_assets", "type": "numeric", "required": true}
 ]'::jsonb),

-- 22. Options Greeks Agent
('finsight.financial.options_greeks', 'Options Greeks Agent', 'financial',
 'Calculates options Greeks (Delta, Gamma, Theta, Vega, Rho)', 'OG',
 'calculate_options_greeks',
 '{
    "input_types": ["option-parameters", "json"],
    "output_types": ["greeks", "json"],
    "domains": ["derivatives", "options-pricing"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "spot_price", "type": "numeric", "required": true},
    {"name": "strike_price", "type": "numeric", "required": true},
    {"name": "time_to_maturity", "type": "numeric", "required": true},
    {"name": "volatility", "type": "numeric", "required": true},
    {"name": "risk_free_rate", "type": "numeric", "required": true}
 ]'::jsonb),

-- 23. Yield Curve Construction Agent
('finsight.financial.yield_curve', 'Yield Curve Construction Agent', 'financial',
 'Constructs and analyzes yield curves using various methods', 'YC',
 'construct_yield_curve',
 '{
    "input_types": ["bond-data", "json"],
    "output_types": ["yield-curve", "json"],
    "domains": ["fixed-income", "yield-analysis"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "bond_prices", "type": "jsonb", "required": true},
    {"name": "maturities", "type": "jsonb", "required": true},
    {"name": "method", "type": "text", "required": false, "default": "nelson-siegel"}
 ]'::jsonb),

-- 24. Credit Risk Scoring Agent
('finsight.financial.credit_risk', 'Credit Risk Scoring Agent', 'financial',
 'ML-based credit risk scoring using multiple models', 'CR',
 'calculate_credit_score',
 '{
    "input_types": ["borrower-data", "json"],
    "output_types": ["credit-score", "risk-rating", "json"],
    "domains": ["credit-risk", "scoring"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key", "pci-compliant"]
 }'::jsonb,
 '[
    {"name": "financial_data", "type": "jsonb", "required": true},
    {"name": "credit_history", "type": "jsonb", "required": true},
    {"name": "model_type", "type": "text", "required": false}
 ]'::jsonb),

-- 25. Stress Test Scenario Agent
('finsight.financial.stress_test', 'Stress Test Scenario Agent', 'financial',
 'Runs regulatory stress test scenarios', 'ST',
 'run_stress_test',
 '{
    "input_types": ["portfolio", "scenario", "json"],
    "output_types": ["stress-results", "json"],
    "domains": ["stress-testing", "risk-management"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key", "regulatory-auth"]
 }'::jsonb,
 '[
    {"name": "portfolio_data", "type": "jsonb", "required": true},
    {"name": "scenario_name", "type": "text", "required": true},
    {"name": "shock_parameters", "type": "jsonb", "required": true}
 ]'::jsonb),

-- 26. News Content Processing Agent
('finsight.nlp.news_processor', 'News Content Processing Agent', 'nlp',
 'Processes and analyzes financial news content', 'NP',
 'process_news_content',
 '{
    "input_types": ["news-article", "text", "json"],
    "output_types": ["processed-news", "entities", "json"],
    "domains": ["news-analysis", "entity-extraction"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "content", "type": "text", "required": true},
    {"name": "source", "type": "text", "required": true},
    {"name": "extract_entities", "type": "boolean", "required": false}
 ]'::jsonb),

-- 27. News Loading Status Agent
('finsight.data.news_loader', 'News Loading Status Agent', 'data',
 'Monitors and reports news data loading status', 'NL',
 'get_news_loading_status',
 '{
    "input_types": ["source-id", "date-range", "json"],
    "output_types": ["loading-status", "json"],
    "domains": ["data-loading", "monitoring"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "source_id", "type": "text", "required": false},
    {"name": "start_date", "type": "date", "required": false},
    {"name": "end_date", "type": "date", "required": false}
 ]'::jsonb),

-- 28. News Cleanup Agent
('finsight.data.news_cleanup', 'News Cleanup Agent', 'data',
 'Cleans up and archives old news data', 'NC',
 'cleanup_news_data',
 '{
    "input_types": ["cleanup-criteria", "json"],
    "output_types": ["cleanup-report", "json"],
    "domains": ["data-maintenance", "archival"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key", "admin"]
 }'::jsonb,
 '[
    {"name": "days_to_keep", "type": "integer", "required": true},
    {"name": "archive_location", "type": "text", "required": false},
    {"name": "dry_run", "type": "boolean", "required": false}
 ]'::jsonb),

-- 29. News Statistics Agent
('finsight.analytics.news_stats', 'News Statistics Agent', 'analytics',
 'Generates statistics on news coverage and sentiment', 'NS',
 'calculate_news_statistics',
 '{
    "input_types": ["date-range", "filters", "json"],
    "output_types": ["statistics", "json"],
    "domains": ["news-analytics", "statistics"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "start_date", "type": "date", "required": true},
    {"name": "end_date", "type": "date", "required": true},
    {"name": "entity_filters", "type": "jsonb", "required": false}
 ]'::jsonb),

-- 30. Data Sufficiency Agent
('finsight.data.sufficiency', 'Data Sufficiency Agent', 'data',
 'Evaluates data sufficiency for analysis tasks', 'DS',
 'check_data_sufficiency',
 '{
    "input_types": ["analysis-type", "data-requirements", "json"],
    "output_types": ["sufficiency-report", "json"],
    "domains": ["data-quality", "validation"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "analysis_type", "type": "text", "required": true},
    {"name": "required_fields", "type": "jsonb", "required": true},
    {"name": "minimum_records", "type": "integer", "required": false}
 ]'::jsonb),

-- 31. Feature Availability Matrix Agent
('finsight.data.feature_matrix', 'Feature Availability Matrix Agent', 'data',
 'Creates feature availability matrices for ML pipelines', 'FM',
 'generate_feature_matrix',
 '{
    "input_types": ["dataset-id", "feature-list", "json"],
    "output_types": ["availability-matrix", "json"],
    "domains": ["feature-engineering", "data-availability"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "dataset_id", "type": "text", "required": true},
    {"name": "features", "type": "jsonb", "required": true},
    {"name": "time_range", "type": "jsonb", "required": false}
 ]'::jsonb),

-- 32. Monte Carlo Simulation Agent
('finsight.analytics.monte_carlo', 'Monte Carlo Simulation Agent', 'analytics',
 'Runs Monte Carlo simulations for financial modeling', 'MCS',
 'monte_carlo_simulation',
 '{
    "input_types": ["simulation-parameters", "json"],
    "output_types": ["simulation-results", "json"],
    "domains": ["simulation", "risk-modeling"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "initial_value", "type": "double precision", "required": true},
    {"name": "drift", "type": "double precision", "required": true},
    {"name": "volatility", "type": "double precision", "required": true},
    {"name": "time_horizon", "type": "double precision", "required": true},
    {"name": "num_simulations", "type": "integer", "required": true}
 ]'::jsonb),

-- 33. Exponential Moving Average Agent
('finsight.analytics.ema', 'Exponential Moving Average Agent', 'analytics',
 'Calculates exponential moving averages for time series', 'EMA',
 'calculate_ema',
 '{
    "input_types": ["time-series", "json"],
    "output_types": ["ema-series", "json"],
    "domains": ["technical-analysis", "time-series"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "values_json", "type": "jsonb", "required": true},
    {"name": "period", "type": "integer", "required": true}
 ]'::jsonb),

-- 34. Beta Calculation Agent
('finsight.financial.beta', 'Beta Calculation Agent', 'financial',
 'Calculates market beta for securities', 'BCA',
 'calculate_beta',
 '{
    "input_types": ["returns-data", "json"],
    "output_types": ["beta-value", "numeric"],
    "domains": ["market-analysis", "risk-metrics"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "stock_returns", "type": "jsonb", "required": true},
    {"name": "market_returns", "type": "jsonb", "required": true}
 ]'::jsonb),

-- 35. Financial Ratios Agent
('finsight.financial.ratios', 'Financial Ratios Agent', 'financial',
 'Calculates comprehensive financial ratios', 'FR',
 'calculate_financial_ratios',
 '{
    "input_types": ["financial-statements", "json"],
    "output_types": ["financial-ratios", "json"],
    "domains": ["fundamental-analysis", "financial-metrics"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
 }'::jsonb,
 '[
    {"name": "financial_data", "type": "jsonb", "required": true}
 ]'::jsonb);

-- Create function to get all agents
CREATE OR REPLACE FUNCTION app_data.get_all_a2a_agents()
RETURNS TABLE(
    agent_id VARCHAR,
    agent_name VARCHAR,
    agent_type VARCHAR,
    icon VARCHAR,
    status VARCHAR,
    description TEXT,
    capabilities JSONB,
    function_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.agent_id,
        a.agent_name,
        a.agent_type,
        a.icon,
        a.status,
        a.description,
        a.capabilities,
        a.function_name
    FROM app_data.a2a_agents a
    WHERE a.status = 'active'
    ORDER BY a.agent_type, a.agent_name;
END;
$$ LANGUAGE plpgsql;

-- Create function to get agent card (full A2A metadata)
CREATE OR REPLACE FUNCTION app_data.get_agent_card(p_agent_id VARCHAR)
RETURNS JSONB AS $$
DECLARE
    agent_record RECORD;
    agent_card JSONB;
BEGIN
    SELECT * INTO agent_record
    FROM app_data.a2a_agents
    WHERE agent_id = p_agent_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Build complete A2A agent card
    agent_card := jsonb_build_object(
        'agent_id', agent_record.agent_id,
        'agent_name', agent_record.agent_name,
        'agent_version', agent_record.agent_version,
        'protocol_version', agent_record.protocol_version,
        'description', agent_record.description,
        'icon', agent_record.icon,
        'status', agent_record.status,
        'type', agent_record.agent_type,
        'capabilities', agent_record.capabilities,
        'connection', jsonb_build_object(
            'endpoint', COALESCE(agent_record.endpoint_url, '/api/supabase-proxy'),
            'config', agent_record.connection_config,
            'function_name', agent_record.function_name,
            'parameters', agent_record.function_parameters
        ),
        'metrics', jsonb_build_object(
            'avg_response_time_ms', agent_record.avg_response_time_ms,
            'success_rate', agent_record.success_rate,
            'total_requests', agent_record.total_requests
        ),
        'timestamps', jsonb_build_object(
            'created_at', agent_record.created_at,
            'updated_at', agent_record.updated_at,
            'last_active_at', agent_record.last_active_at
        )
    );
    
    RETURN agent_card;
END;
$$ LANGUAGE plpgsql;

-- Create function to discover agents by capability
CREATE OR REPLACE FUNCTION app_data.discover_agents(p_capability VARCHAR)
RETURNS TABLE(agent_id VARCHAR, agent_name VARCHAR, capabilities JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT a.agent_id, a.agent_name, a.capabilities
    FROM app_data.a2a_agents a
    WHERE a.status = 'active'
    AND (
        a.capabilities->'domains' ? p_capability OR
        a.capabilities->'input_types' ? p_capability OR
        a.capabilities->'output_types' ? p_capability
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to connect two agents
CREATE OR REPLACE FUNCTION app_data.connect_agents(
    p_source_agent_id VARCHAR,
    p_target_agent_id VARCHAR,
    p_connection_type VARCHAR DEFAULT 'data-flow'
)
RETURNS JSONB AS $$
DECLARE
    source_agent RECORD;
    target_agent RECORD;
    connection_id UUID;
BEGIN
    -- Get source agent
    SELECT * INTO source_agent FROM app_data.a2a_agents WHERE agent_id = p_source_agent_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Source agent not found');
    END IF;
    
    -- Get target agent
    SELECT * INTO target_agent FROM app_data.a2a_agents WHERE agent_id = p_target_agent_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Target agent not found');
    END IF;
    
    -- Generate connection ID
    connection_id := gen_random_uuid();
    
    -- Return connection details
    RETURN jsonb_build_object(
        'connection_id', connection_id,
        'source', jsonb_build_object(
            'agent_id', source_agent.agent_id,
            'output_types', source_agent.capabilities->'output_types'
        ),
        'target', jsonb_build_object(
            'agent_id', target_agent.agent_id,
            'input_types', target_agent.capabilities->'input_types'
        ),
        'connection_type', p_connection_type,
        'status', 'connected',
        'created_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Update trigger for timestamps
CREATE OR REPLACE FUNCTION app_data.update_agent_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_a2a_agents_timestamp
BEFORE UPDATE ON app_data.a2a_agents
FOR EACH ROW
EXECUTE FUNCTION app_data.update_agent_timestamp();

-- Create view for agent network visualization
CREATE OR REPLACE VIEW app_data.agent_network AS
SELECT 
    a.agent_id,
    a.agent_name,
    a.agent_type,
    a.icon,
    a.status,
    a.capabilities->'domains' as domains,
    a.capabilities->'protocols' as protocols,
    a.avg_response_time_ms,
    a.success_rate
FROM app_data.a2a_agents a
WHERE a.status = 'active';

-- Grant permissions
GRANT SELECT ON app_data.a2a_agents TO authenticated;
GRANT SELECT ON app_data.agent_network TO authenticated;
GRANT EXECUTE ON FUNCTION app_data.get_agent_card TO authenticated;
GRANT EXECUTE ON FUNCTION app_data.discover_agents TO authenticated;
GRANT EXECUTE ON FUNCTION app_data.connect_agents TO authenticated;