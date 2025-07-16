-- A2A Agent Definition Schema for FinSight
-- Based on Agent-to-Agent Protocol Requirements

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

-- Create index for faster lookups
CREATE INDEX idx_a2a_agents_type ON app_data.a2a_agents(agent_type);
CREATE INDEX idx_a2a_agents_status ON app_data.a2a_agents(status);
CREATE INDEX idx_a2a_agents_function ON app_data.a2a_agents(function_name);

-- Insert all 35 agents with proper A2A metadata
INSERT INTO app_data.a2a_agents (agent_id, agent_name, agent_type, description, icon, function_name, capabilities, function_parameters) VALUES
-- Core Analytics Agents (1-9)
('finsight.analytics.pearson_correlation', 'Pearson Correlation Agent', 'analytics', 
 'Calculates statistical correlation between two data arrays using Pearson method', 'PCA',
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

('finsight.analytics.value_at_risk', 'Value at Risk Agent', 'analytics',
 'Calculates portfolio Value at Risk using historical simulation', 'VAR',
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

('finsight.ml.thompson_sampling', 'Thompson Sampling Agent', 'ml',
 'Updates Thompson Sampling parameters for multi-armed bandit optimization', 'TSA',
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

('finsight.financial.portfolio_risk', 'Portfolio Risk Agent', 'financial',
 'Comprehensive portfolio risk analysis including VaR, Sharpe ratio, and volatility', 'PRA',
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

-- Add remaining agents...
('finsight.analytics.trend_detection', 'Trend Detection Agent', 'analytics',
 'Detects trends in time series data using statistical methods', 'TDA',
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

('finsight.ml.anomaly_detection', 'Anomaly Detection Agent', 'ml',
 'Detects anomalies using Z-score based statistical methods', 'ADA',
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
 ]'::jsonb);

-- Add more agents following the same pattern...

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