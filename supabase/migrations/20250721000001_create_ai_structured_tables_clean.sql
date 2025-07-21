-- AI Storage Tables for X.AI Structured Outputs
-- Clean migration that checks for existing objects

-- Drop existing views if they exist
DROP VIEW IF EXISTS latest_market_predictions CASCADE;
DROP VIEW IF EXISTS active_anomalies CASCADE;
DROP TYPE IF EXISTS compliance_status CASCADE;

-- Create market predictions table
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
  accuracy_score DECIMAL(3,2)
);

-- Create compliance predictions table
CREATE TABLE IF NOT EXISTS compliance_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50) NOT NULL DEFAULT 'agent',
  agent_id VARCHAR(100) NOT NULL,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  ready_for_creation BOOLEAN DEFAULT FALSE,
  critical_issues INTEGER DEFAULT 0,
  ai_recommendation TEXT,
  predictions JSONB NOT NULL,
  auto_fixable JSONB,
  fixes_applied JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create AI analysis log table
CREATE TABLE IF NOT EXISTS ai_analysis_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255),
  agent_id VARCHAR(100) NOT NULL,
  ai_model VARCHAR(50) DEFAULT 'grok-4-0709',
  ai_response JSONB NOT NULL,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create market anomalies table
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
  resolved_at TIMESTAMPTZ
);

-- Create remaining tables only if they don't exist
DO $$ 
BEGIN
  -- compliance_prediction_details
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'compliance_prediction_details') THEN
    CREATE TABLE compliance_prediction_details (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      compliance_id UUID NOT NULL REFERENCES compliance_predictions(id) ON DELETE CASCADE,
      field VARCHAR(100),
      issue TEXT NOT NULL,
      severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      likelihood DECIMAL(3,2) CHECK (likelihood >= 0 AND likelihood <= 1),
      impact TEXT,
      preemptive_fix JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- anomaly_details
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'anomaly_details') THEN
    CREATE TABLE anomaly_details (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      anomaly_id UUID NOT NULL REFERENCES market_anomalies(id) ON DELETE CASCADE,
      type VARCHAR(50) CHECK (type IN ('price', 'volume', 'pattern', 'statistical', 'regime', 'microstructure')),
      severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
      confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
      description TEXT,
      current_value DECIMAL(20,8),
      expected_range DECIMAL(20,8)[],
      z_score DECIMAL(10,4),
      trading_implications JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- ai_recommendations
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'ai_recommendations') THEN
    CREATE TABLE ai_recommendations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id UUID,
      source_type VARCHAR(50) NOT NULL,
      action VARCHAR(100) NOT NULL,
      confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
      reasoning TEXT,
      timeframe VARCHAR(50),
      priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      acted_on_at TIMESTAMPTZ
    );
  END IF;

  -- technical_indicators
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'technical_indicators') THEN
    CREATE TABLE technical_indicators (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      symbol VARCHAR(10) NOT NULL,
      agent_id VARCHAR(100) NOT NULL,
      indicators JSONB NOT NULL,
      trend VARCHAR(50),
      signal_strength DECIMAL(3,2),
      timestamp TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- market_risks
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'market_risks') THEN
    CREATE TABLE market_risks (
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
      expires_at TIMESTAMPTZ
    );
  END IF;

  -- ai_results
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'ai_results') THEN
    CREATE TABLE ai_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      result_type VARCHAR(50) NOT NULL,
      entity_id VARCHAR(255),
      agent_id VARCHAR(100) NOT NULL,
      result_data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- agent_performance_log
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'agent_performance_log') THEN
    CREATE TABLE agent_performance_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id VARCHAR(100) NOT NULL,
      analysis_type VARCHAR(50) NOT NULL,
      confidence_score DECIMAL(3,2),
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  -- Additional logging tables
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'compliance_fixes_log') THEN
    CREATE TABLE compliance_fixes_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_id VARCHAR(255) NOT NULL,
      fixes_applied JSONB NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'ai_compliance_log') THEN
    CREATE TABLE ai_compliance_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      request_path VARCHAR(500) NOT NULL,
      original_compliance INTEGER,
      enhanced_compliance INTEGER,
      ai_fixes_applied INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'ai_learning_data') THEN
    CREATE TABLE ai_learning_data (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      original_data JSONB NOT NULL,
      fixed_data JSONB NOT NULL,
      fixes_applied INTEGER,
      registration_success BOOLEAN,
      patterns JSONB,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_market_predictions_symbol ON market_predictions(symbol);
CREATE INDEX IF NOT EXISTS idx_market_predictions_created ON market_predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_predictions_confidence ON market_predictions(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_predictions_resource ON compliance_predictions(resource_id);
CREATE INDEX IF NOT EXISTS idx_compliance_predictions_risk ON compliance_predictions(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_log_type ON ai_analysis_log(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_log_entity ON ai_analysis_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_log_created ON ai_analysis_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_results_type ON ai_results(result_type);
CREATE INDEX IF NOT EXISTS idx_agent_performance_agent ON agent_performance_log(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_type ON agent_performance_log(analysis_type);

-- Create views
CREATE OR REPLACE VIEW latest_market_predictions AS
SELECT DISTINCT ON (symbol)
  symbol,
  prediction_data,
  confidence,
  reasoning,
  created_at
FROM market_predictions
ORDER BY symbol, created_at DESC;

CREATE OR REPLACE VIEW compliance_status_view AS
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

CREATE OR REPLACE VIEW active_anomalies AS
SELECT 
  ma.id,
  ma.symbol,
  ma.agent_id,
  ma.anomaly_count,
  ma.overall_risk,
  ma.black_swan_probability,
  ma.detected_at,
  COUNT(ad.id) as detail_count,
  MAX(ad.severity) as max_severity
FROM market_anomalies ma
LEFT JOIN anomaly_details ad ON ma.id = ad.anomaly_id
WHERE ma.resolved_at IS NULL
GROUP BY ma.id, ma.symbol, ma.agent_id, ma.anomaly_count, 
         ma.overall_risk, ma.black_swan_probability, ma.detected_at
ORDER BY ma.detected_at DESC;

-- Enable RLS only if not already enabled
DO $$
BEGIN
  -- Check and enable RLS for each table
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_policies p ON t.tablename = p.tablename
    WHERE t.tablename = 'market_predictions'
  ) THEN
    ALTER TABLE market_predictions ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_policies p ON t.tablename = p.tablename
    WHERE t.tablename = 'compliance_predictions'
  ) THEN
    ALTER TABLE compliance_predictions ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_policies p ON t.tablename = p.tablename
    WHERE t.tablename = 'ai_analysis_log'
  ) THEN
    ALTER TABLE ai_analysis_log ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_policies p ON t.tablename = p.tablename
    WHERE t.tablename = 'market_anomalies'
  ) THEN
    ALTER TABLE market_anomalies ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_policies p ON t.tablename = p.tablename
    WHERE t.tablename = 'ai_results'
  ) THEN
    ALTER TABLE ai_results ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_policies p ON t.tablename = p.tablename
    WHERE t.tablename = 'agent_performance_log'
  ) THEN
    ALTER TABLE agent_performance_log ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies only if they don't exist
DO $$
BEGIN
  -- Policies for market_predictions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'market_predictions' 
    AND policyname = 'service_role_all_market_predictions'
  ) THEN
    CREATE POLICY service_role_all_market_predictions ON market_predictions
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'market_predictions' 
    AND policyname = 'authenticated_read_market_predictions'
  ) THEN
    CREATE POLICY authenticated_read_market_predictions ON market_predictions
      FOR SELECT TO authenticated USING (true);
  END IF;

  -- Policies for compliance_predictions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'compliance_predictions' 
    AND policyname = 'service_role_all_compliance_predictions'
  ) THEN
    CREATE POLICY service_role_all_compliance_predictions ON compliance_predictions
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'compliance_predictions' 
    AND policyname = 'authenticated_read_compliance_predictions'
  ) THEN
    CREATE POLICY authenticated_read_compliance_predictions ON compliance_predictions
      FOR SELECT TO authenticated USING (true);
  END IF;

  -- Policies for ai_analysis_log
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_analysis_log' 
    AND policyname = 'service_role_all_ai_analysis_log'
  ) THEN
    CREATE POLICY service_role_all_ai_analysis_log ON ai_analysis_log
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_analysis_log' 
    AND policyname = 'authenticated_read_ai_analysis_log'
  ) THEN
    CREATE POLICY authenticated_read_ai_analysis_log ON ai_analysis_log
      FOR SELECT TO authenticated USING (true);
  END IF;

  -- Policies for market_anomalies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'market_anomalies' 
    AND policyname = 'service_role_all_market_anomalies'
  ) THEN
    CREATE POLICY service_role_all_market_anomalies ON market_anomalies
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'market_anomalies' 
    AND policyname = 'authenticated_read_market_anomalies'
  ) THEN
    CREATE POLICY authenticated_read_market_anomalies ON market_anomalies
      FOR SELECT TO authenticated USING (true);
  END IF;

  -- Policies for ai_results
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_results' 
    AND policyname = 'service_role_all_ai_results'
  ) THEN
    CREATE POLICY service_role_all_ai_results ON ai_results
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- Policies for agent_performance_log
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_performance_log' 
    AND policyname = 'service_role_all_agent_performance_log'
  ) THEN
    CREATE POLICY service_role_all_agent_performance_log ON agent_performance_log
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;