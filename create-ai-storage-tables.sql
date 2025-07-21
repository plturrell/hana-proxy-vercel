-- AI Storage Tables for Structured Outputs
-- These tables store the results from AI analysis using structured outputs

-- Market Predictions Table
CREATE TABLE IF NOT EXISTS market_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  agent_id VARCHAR(100) NOT NULL,
  prediction_type VARCHAR(50) NOT NULL,
  prediction_data JSONB NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  accuracy_score DECIMAL(3,2), -- Tracked post-facto
  FOREIGN KEY (agent_id) REFERENCES a2a_agents(agent_id)
);

CREATE INDEX idx_market_predictions_symbol ON market_predictions(symbol);
CREATE INDEX idx_market_predictions_created ON market_predictions(created_at DESC);
CREATE INDEX idx_market_predictions_confidence ON market_predictions(confidence DESC);

-- Compliance Predictions Table
CREATE TABLE IF NOT EXISTS compliance_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  agent_id VARCHAR(100) NOT NULL,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  ready_for_creation BOOLEAN DEFAULT FALSE,
  critical_issues INTEGER DEFAULT 0,
  ai_recommendation TEXT,
  predictions JSONB NOT NULL,
  auto_fixable JSONB,
  fixes_applied JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  FOREIGN KEY (agent_id) REFERENCES a2a_agents(agent_id)
);

CREATE INDEX idx_compliance_predictions_resource ON compliance_predictions(resource_id);
CREATE INDEX idx_compliance_predictions_risk ON compliance_predictions(risk_score DESC);

-- Compliance Prediction Details (normalized)
CREATE TABLE IF NOT EXISTS compliance_prediction_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_id UUID NOT NULL,
  field VARCHAR(100),
  issue TEXT NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  likelihood DECIMAL(3,2) CHECK (likelihood >= 0 AND likelihood <= 1),
  impact TEXT,
  preemptive_fix JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (compliance_id) REFERENCES compliance_predictions(id) ON DELETE CASCADE
);

CREATE INDEX idx_compliance_details_compliance ON compliance_prediction_details(compliance_id);
CREATE INDEX idx_compliance_details_severity ON compliance_prediction_details(severity);

-- AI Analysis Log (audit trail)
CREATE TABLE IF NOT EXISTS ai_analysis_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255), -- Can be symbol, agent_id, resource_id, etc.
  agent_id VARCHAR(100) NOT NULL,
  ai_model VARCHAR(50) DEFAULT 'grok-4-0709',
  ai_response JSONB NOT NULL,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (agent_id) REFERENCES a2a_agents(agent_id)
);

CREATE INDEX idx_ai_analysis_log_type ON ai_analysis_log(analysis_type);
CREATE INDEX idx_ai_analysis_log_entity ON ai_analysis_log(entity_id);
CREATE INDEX idx_ai_analysis_log_created ON ai_analysis_log(created_at DESC);

-- Market Anomalies Table
CREATE TABLE IF NOT EXISTS market_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  agent_id VARCHAR(100) NOT NULL,
  anomaly_count INTEGER DEFAULT 0,
  overall_risk VARCHAR(20) CHECK (overall_risk IN ('low', 'medium', 'high', 'extreme')),
  black_swan_probability DECIMAL(3,2) CHECK (black_swan_probability >= 0 AND black_swan_probability <= 1),
  pattern_summary JSONB,
  volume_profile JSONB,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  FOREIGN KEY (agent_id) REFERENCES a2a_agents(agent_id)
);

CREATE INDEX idx_market_anomalies_symbol ON market_anomalies(symbol);
CREATE INDEX idx_market_anomalies_risk ON market_anomalies(overall_risk);
CREATE INDEX idx_market_anomalies_detected ON market_anomalies(detected_at DESC);

-- Anomaly Details Table
CREATE TABLE IF NOT EXISTS anomaly_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_id UUID NOT NULL,
  type VARCHAR(50) CHECK (type IN ('price', 'volume', 'pattern', 'statistical', 'regime', 'microstructure')),
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  description TEXT,
  current_value DECIMAL(20,8),
  expected_range DECIMAL(20,8)[],
  z_score DECIMAL(10,4),
  trading_implications JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (anomaly_id) REFERENCES market_anomalies(id) ON DELETE CASCADE
);

CREATE INDEX idx_anomaly_details_anomaly ON anomaly_details(anomaly_id);
CREATE INDEX idx_anomaly_details_type ON anomaly_details(type);
CREATE INDEX idx_anomaly_details_severity ON anomaly_details(severity);

-- AI Recommendations Table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID, -- Can reference various tables
  source_type VARCHAR(50) NOT NULL, -- 'anomaly', 'prediction', 'analysis'
  action VARCHAR(100) NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT,
  timeframe VARCHAR(50),
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acted_on_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_recommendations_source ON ai_recommendations(source_id, source_type);
CREATE INDEX idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX idx_ai_recommendations_priority ON ai_recommendations(priority DESC);

-- Technical Indicators Storage
CREATE TABLE IF NOT EXISTS technical_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  agent_id VARCHAR(100) NOT NULL,
  indicators JSONB NOT NULL, -- Stores RSI, SMA, MACD, etc.
  trend VARCHAR(50),
  signal_strength DECIMAL(3,2),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (agent_id) REFERENCES a2a_agents(agent_id)
);

CREATE INDEX idx_technical_indicators_symbol ON technical_indicators(symbol, timestamp DESC);

-- Market Risks Table
CREATE TABLE IF NOT EXISTS market_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  agent_id VARCHAR(100) NOT NULL,
  risk_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  mitigation_strategy TEXT,
  probability DECIMAL(3,2),
  potential_impact DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  FOREIGN KEY (agent_id) REFERENCES a2a_agents(agent_id)
);

CREATE INDEX idx_market_risks_symbol ON market_risks(symbol);
CREATE INDEX idx_market_risks_severity ON market_risks(severity);

-- Create a view for easy access to latest predictions
CREATE OR REPLACE VIEW latest_market_predictions AS
SELECT DISTINCT ON (symbol)
  symbol,
  prediction_data,
  confidence,
  reasoning,
  created_at
FROM market_predictions
ORDER BY symbol, created_at DESC;

-- Create a view for compliance status
CREATE OR REPLACE VIEW compliance_status AS
SELECT 
  resource_id,
  resource_type,
  risk_score,
  ready_for_creation,
  critical_issues,
  created_at,
  CASE 
    WHEN risk_score < 30 THEN 'low_risk'
    WHEN risk_score < 70 THEN 'medium_risk'
    ELSE 'high_risk'
  END as risk_category
FROM compliance_predictions
WHERE resolved_at IS NULL
ORDER BY risk_score DESC;

-- Function to get AI analysis history
CREATE OR REPLACE FUNCTION get_ai_analysis_history(
  p_entity_id VARCHAR,
  p_analysis_type VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  analysis_type VARCHAR,
  ai_response JSONB,
  created_at TIMESTAMPTZ,
  agent_id VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.analysis_type,
    al.ai_response,
    al.created_at,
    al.agent_id
  FROM ai_analysis_log al
  WHERE al.entity_id = p_entity_id
    AND (p_analysis_type IS NULL OR al.analysis_type = p_analysis_type)
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies if needed
ALTER TABLE market_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_anomalies ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;