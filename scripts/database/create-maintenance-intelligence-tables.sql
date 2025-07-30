-- System Maintenance and Financial Intelligence Tables
-- Run this in Supabase SQL editor

-- SYSTEM MAINTENANCE TABLES

-- 1. System maintenance log
CREATE TABLE IF NOT EXISTS system_maintenance_log (
  id BIGSERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  results JSONB NOT NULL,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_log_action ON system_maintenance_log(action, created_at DESC);
CREATE INDEX idx_maintenance_log_created ON system_maintenance_log(created_at DESC);

-- 2. Storage analysis log
CREATE TABLE IF NOT EXISTS storage_analysis_log (
  id BIGSERIAL PRIMARY KEY,
  analysis JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_storage_analysis_created ON storage_analysis_log(created_at DESC);

-- 3. System health checks
CREATE TABLE IF NOT EXISTS system_health_checks (
  id BIGSERIAL PRIMARY KEY,
  status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'unhealthy'
  components JSONB NOT NULL,
  issues TEXT[],
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_checks_status ON system_health_checks(status, created_at DESC);

-- 4. Maintenance reports
CREATE TABLE IF NOT EXISTS maintenance_reports (
  id BIGSERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  report JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_maintenance_reports_date ON maintenance_reports(report_date);

-- 5. Backup metadata
CREATE TABLE IF NOT EXISTS backup_metadata (
  id BIGSERIAL PRIMARY KEY,
  backup_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  size_mb DECIMAL(10, 2),
  location TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_backup_metadata_status ON backup_metadata(status, created_at DESC);

-- FINANCIAL INTELLIGENCE TABLES

-- 6. Sentiment analysis results
CREATE TABLE IF NOT EXISTS sentiment_analysis_results (
  id BIGSERIAL PRIMARY KEY,
  analysis_date TIMESTAMPTZ NOT NULL,
  results JSONB NOT NULL,
  signals JSONB DEFAULT '[]',
  article_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sentiment_analysis_date ON sentiment_analysis_results(analysis_date DESC);

-- 7. Anomaly detection results
CREATE TABLE IF NOT EXISTS anomaly_detection_results (
  id BIGSERIAL PRIMARY KEY,
  detection_time TIMESTAMPTZ NOT NULL,
  anomalies JSONB NOT NULL,
  alerts JSONB DEFAULT '[]',
  symbols_analyzed INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anomaly_detection_time ON anomaly_detection_results(detection_time DESC);

-- 8. Correlation analysis results
CREATE TABLE IF NOT EXISTS correlation_analysis_results (
  id BIGSERIAL PRIMARY KEY,
  analysis_date TIMESTAMPTZ NOT NULL,
  correlation_matrix JSONB NOT NULL,
  significant_correlations JSONB DEFAULT '[]',
  correlation_changes JSONB DEFAULT '[]',
  clusters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_correlation_analysis_date ON correlation_analysis_results(analysis_date DESC);

-- 9. Economic indicators
CREATE TABLE IF NOT EXISTS economic_indicators (
  id BIGSERIAL PRIMARY KEY,
  indicator_date TIMESTAMPTZ NOT NULL,
  indicators JSONB NOT NULL,
  outlook JSONB NOT NULL,
  composite_score DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_economic_indicators_date ON economic_indicators(indicator_date DESC);

-- 10. Market predictions
CREATE TABLE IF NOT EXISTS market_predictions (
  id BIGSERIAL PRIMARY KEY,
  prediction_date TIMESTAMPTZ NOT NULL,
  predictions JSONB NOT NULL,
  patterns_used INTEGER,
  market_conditions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_market_predictions_date ON market_predictions(prediction_date DESC);

-- 11. Risk analysis results
CREATE TABLE IF NOT EXISTS risk_analysis_results (
  id BIGSERIAL PRIMARY KEY,
  analysis_time TIMESTAMPTZ NOT NULL,
  risk_signals JSONB NOT NULL,
  recommendations JSONB DEFAULT '[]',
  overall_risk_score DECIMAL(3, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_analysis_time ON risk_analysis_results(analysis_time DESC);

-- 12. News impact analysis
CREATE TABLE IF NOT EXISTS news_impact_analysis (
  id BIGSERIAL PRIMARY KEY,
  analysis_time TIMESTAMPTZ NOT NULL,
  impact JSONB NOT NULL,
  momentum JSONB DEFAULT '{}',
  articles_analyzed INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_impact_time ON news_impact_analysis(analysis_time DESC);

-- 13. Sector rotation analysis
CREATE TABLE IF NOT EXISTS sector_rotation_analysis (
  id BIGSERIAL PRIMARY KEY,
  analysis_date TIMESTAMPTZ NOT NULL,
  rotation JSONB NOT NULL,
  recommendations JSONB DEFAULT '[]',
  sector_performance JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sector_rotation_date ON sector_rotation_analysis(analysis_date DESC);

-- 14. Intelligence reports
CREATE TABLE IF NOT EXISTS intelligence_reports (
  id BIGSERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  report JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_intelligence_reports_date ON intelligence_reports(report_date);

-- Create views for monitoring

-- System maintenance overview
CREATE OR REPLACE VIEW system_maintenance_overview AS
SELECT 
  action,
  COUNT(*) as execution_count,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
  AVG(duration_ms) as avg_duration_ms,
  MAX(created_at) as last_executed
FROM system_maintenance_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY action
ORDER BY last_executed DESC;

-- Financial intelligence summary
CREATE OR REPLACE VIEW financial_intelligence_summary AS
WITH latest_data AS (
  SELECT 
    'sentiment' as analysis_type,
    created_at,
    (results->>'overall_sentiment')::DECIMAL as score
  FROM sentiment_analysis_results
  ORDER BY created_at DESC
  LIMIT 1
  
  UNION ALL
  
  SELECT 
    'risk' as analysis_type,
    created_at,
    overall_risk_score as score
  FROM risk_analysis_results
  ORDER BY created_at DESC
  LIMIT 1
  
  UNION ALL
  
  SELECT 
    'economic' as analysis_type,
    created_at,
    composite_score as score
  FROM economic_indicators
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT * FROM latest_data;

-- Helper functions for maintenance

-- Function to get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE(table_name TEXT, size_mb DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))::TEXT as size_mb
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get index sizes
CREATE OR REPLACE FUNCTION get_index_sizes()
RETURNS TABLE(index_name TEXT, table_name TEXT, size_mb DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    indexname as index_name,
    tablename as table_name,
    pg_size_pretty(pg_relation_size(schemaname||'.'||indexname))::TEXT as size_mb
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE system_maintenance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_analysis_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_detection_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE correlation_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_impact_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_rotation_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Enable read access for all users" ON system_maintenance_log
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON storage_analysis_log
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON system_health_checks
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON maintenance_reports
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON backup_metadata
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON sentiment_analysis_results
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON anomaly_detection_results
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON correlation_analysis_results
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON economic_indicators
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON market_predictions
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON risk_analysis_results
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON news_impact_analysis
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON sector_rotation_analysis
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON intelligence_reports
  FOR SELECT USING (true);

-- Create policies for service role write access
CREATE POLICY "Enable insert for service role" ON system_maintenance_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON storage_analysis_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON system_health_checks
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON maintenance_reports
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON backup_metadata
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON sentiment_analysis_results
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON anomaly_detection_results
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON correlation_analysis_results
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON economic_indicators
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON market_predictions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON risk_analysis_results
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON news_impact_analysis
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON sector_rotation_analysis
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON intelligence_reports
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Add table comments
COMMENT ON TABLE system_maintenance_log IS 'Log of all system maintenance operations';
COMMENT ON TABLE storage_analysis_log IS 'Database storage analysis results';
COMMENT ON TABLE system_health_checks IS 'System health check results';
COMMENT ON TABLE maintenance_reports IS 'Daily maintenance reports';
COMMENT ON TABLE backup_metadata IS 'Backup operation metadata';
COMMENT ON TABLE sentiment_analysis_results IS 'Market sentiment analysis from news';
COMMENT ON TABLE anomaly_detection_results IS 'Detected market anomalies';
COMMENT ON TABLE correlation_analysis_results IS 'Asset correlation analysis';
COMMENT ON TABLE economic_indicators IS 'Calculated economic indicators';
COMMENT ON TABLE market_predictions IS 'Market prediction results';
COMMENT ON TABLE risk_analysis_results IS 'Risk signal detection results';
COMMENT ON TABLE news_impact_analysis IS 'News impact on market analysis';
COMMENT ON TABLE sector_rotation_analysis IS 'Sector rotation analysis';
COMMENT ON TABLE intelligence_reports IS 'Comprehensive financial intelligence reports';