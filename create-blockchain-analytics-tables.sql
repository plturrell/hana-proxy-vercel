-- Blockchain Monitoring and User Analytics Tables
-- Run this in Supabase SQL editor

-- BLOCKCHAIN MONITORING TABLES

-- 1. Blockchain monitoring log
CREATE TABLE IF NOT EXISTS blockchain_monitoring_log (
  id BIGSERIAL PRIMARY KEY,
  monitoring_type VARCHAR(50) NOT NULL,
  results JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blockchain_monitoring_type ON blockchain_monitoring_log(monitoring_type, created_at DESC);

-- 2. Smart contract monitoring
CREATE TABLE IF NOT EXISTS smart_contract_monitoring (
  id BIGSERIAL PRIMARY KEY,
  contracts JSONB NOT NULL,
  events JSONB DEFAULT '[]',
  vulnerabilities JSONB DEFAULT '[]',
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_smart_contract_monitoring_created ON smart_contract_monitoring(created_at DESC);

-- 3. Gas price analysis
CREATE TABLE IF NOT EXISTS gas_price_analysis (
  id BIGSERIAL PRIMARY KEY,
  analysis JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gas_price_analysis_created ON gas_price_analysis(created_at DESC);

-- 4. DeFi protocol metrics
CREATE TABLE IF NOT EXISTS defi_protocol_metrics (
  id BIGSERIAL PRIMARY KEY,
  metrics JSONB NOT NULL,
  health_score DECIMAL(3, 2),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_defi_metrics_created ON defi_protocol_metrics(created_at DESC);

-- 5. Tracked wallets
CREATE TABLE IF NOT EXISTS tracked_wallets (
  id BIGSERIAL PRIMARY KEY,
  address VARCHAR(255) NOT NULL,
  chain VARCHAR(50) NOT NULL,
  label VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_tracked_wallets_address ON tracked_wallets(address, chain);

-- 6. Wallet tracking results
CREATE TABLE IF NOT EXISTS wallet_tracking_results (
  id BIGSERIAL PRIMARY KEY,
  tracking JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_tracking_created ON wallet_tracking_results(created_at DESC);

-- 7. Contract event monitoring
CREATE TABLE IF NOT EXISTS contract_event_monitoring (
  id BIGSERIAL PRIMARY KEY,
  monitoring JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contract_event_monitoring_created ON contract_event_monitoring(created_at DESC);

-- 8. Blockchain health checks
CREATE TABLE IF NOT EXISTS blockchain_health_checks (
  id BIGSERIAL PRIMARY KEY,
  health_status JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blockchain_health_created ON blockchain_health_checks(created_at DESC);

-- 9. Blockchain analytics reports
CREATE TABLE IF NOT EXISTS blockchain_analytics_reports (
  id BIGSERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  report JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_blockchain_reports_date ON blockchain_analytics_reports(report_date);

-- USER ANALYTICS TABLES

-- 10. User behavior events
CREATE TABLE IF NOT EXISTS user_behavior_events (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  device_info JSONB DEFAULT '{}',
  location JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_behavior_user ON user_behavior_events(user_id, timestamp DESC);
CREATE INDEX idx_user_behavior_event ON user_behavior_events(event_type, timestamp DESC);
CREATE INDEX idx_user_behavior_session ON user_behavior_events(session_id, timestamp DESC);

-- 11. User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255),
  activity_level VARCHAR(20), -- 'high', 'medium', 'low'
  portfolio_value DECIMAL(20, 2),
  growth_rate DECIMAL(5, 2),
  is_active BOOLEAN DEFAULT true,
  last_personalization_update TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. User personalization
CREATE TABLE IF NOT EXISTS user_personalization (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES user_profiles(user_id),
  profile JSONB NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_personalization_user ON user_personalization(user_id, last_updated DESC);

-- 13. User pattern analysis
CREATE TABLE IF NOT EXISTS user_pattern_analysis (
  id BIGSERIAL PRIMARY KEY,
  analysis_date TIMESTAMPTZ NOT NULL,
  analysis JSONB NOT NULL,
  user_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pattern_analysis_date ON user_pattern_analysis(analysis_date DESC);

-- 14. Engagement metrics
CREATE TABLE IF NOT EXISTS engagement_metrics (
  id BIGSERIAL PRIMARY KEY,
  metrics JSONB NOT NULL,
  engagement_score DECIMAL(3, 2),
  calculated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_engagement_metrics_created ON engagement_metrics(created_at DESC);

-- 15. User segmentation
CREATE TABLE IF NOT EXISTS user_segmentation (
  id BIGSERIAL PRIMARY KEY,
  segments JSONB NOT NULL,
  insights JSONB DEFAULT '[]',
  total_users INTEGER,
  segmented_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_segmentation_created ON user_segmentation(created_at DESC);

-- 16. Feature usage analysis
CREATE TABLE IF NOT EXISTS feature_usage_analysis (
  id BIGSERIAL PRIMARY KEY,
  analysis JSONB NOT NULL,
  recommendations JSONB DEFAULT '[]',
  analyzed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feature_usage_created ON feature_usage_analysis(created_at DESC);

-- 17. Conversion funnel analysis
CREATE TABLE IF NOT EXISTS conversion_funnel_analysis (
  id BIGSERIAL PRIMARY KEY,
  analysis JSONB NOT NULL,
  analyzed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_funnel_analysis_created ON conversion_funnel_analysis(created_at DESC);

-- 18. User journey maps
CREATE TABLE IF NOT EXISTS user_journey_maps (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  journey JSONB NOT NULL,
  insights JSONB DEFAULT '[]',
  period_days INTEGER,
  mapped_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journey_maps_user ON user_journey_maps(user_id, created_at DESC);

-- 19. User recommendations
CREATE TABLE IF NOT EXISTS user_recommendations (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  recommendations JSONB NOT NULL,
  scores JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_recommendations_user ON user_recommendations(user_id, created_at DESC);

-- 20. A/B tests
CREATE TABLE IF NOT EXISTS ab_tests (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'active', 'completed', 'paused'
  variants JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ab_tests_status ON ab_tests(status, created_at DESC);

-- 21. A/B test analysis
CREATE TABLE IF NOT EXISTS ab_test_analysis (
  id BIGSERIAL PRIMARY KEY,
  analysis JSONB NOT NULL,
  analyzed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ab_test_analysis_created ON ab_test_analysis(created_at DESC);

-- 22. Retention analysis
CREATE TABLE IF NOT EXISTS retention_analysis (
  id BIGSERIAL PRIMARY KEY,
  analysis JSONB NOT NULL,
  strategies JSONB DEFAULT '[]',
  analyzed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_retention_analysis_created ON retention_analysis(created_at DESC);

-- 23. Analytics reports
CREATE TABLE IF NOT EXISTS analytics_reports (
  id BIGSERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  report JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_analytics_reports_date ON analytics_reports(report_date);

-- Create views for monitoring

-- Blockchain overview
CREATE OR REPLACE VIEW blockchain_monitoring_overview AS
SELECT 
  monitoring_type,
  COUNT(*) as check_count,
  MAX(timestamp) as last_checked
FROM blockchain_monitoring_log
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY monitoring_type;

-- User analytics overview
CREATE OR REPLACE VIEW user_analytics_overview AS
WITH daily_stats AS (
  SELECT 
    COUNT(DISTINCT user_id) as daily_active_users,
    COUNT(*) as total_events
  FROM user_behavior_events
  WHERE timestamp > NOW() - INTERVAL '24 hours'
)
SELECT 
  daily_active_users,
  total_events,
  (SELECT engagement_score FROM engagement_metrics ORDER BY created_at DESC LIMIT 1) as latest_engagement_score,
  (SELECT COUNT(*) FROM user_profiles WHERE is_active = true) as total_active_users
FROM daily_stats;

-- Enable Row Level Security (same pattern for all tables)
ALTER TABLE blockchain_monitoring_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_contract_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE gas_price_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE defi_protocol_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_tracking_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_event_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_personalization ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pattern_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_segmentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnel_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journey_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;

-- Create read access policies (for all tables)
CREATE POLICY "Enable read access for all users" ON blockchain_monitoring_log FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON smart_contract_monitoring FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON gas_price_analysis FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON defi_protocol_metrics FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON tracked_wallets FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON wallet_tracking_results FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON contract_event_monitoring FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON blockchain_health_checks FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON blockchain_analytics_reports FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON user_behavior_events FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON user_personalization FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON user_pattern_analysis FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON engagement_metrics FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON user_segmentation FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON feature_usage_analysis FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON conversion_funnel_analysis FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON user_journey_maps FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON user_recommendations FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON ab_tests FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON ab_test_analysis FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON retention_analysis FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON analytics_reports FOR SELECT USING (true);

-- Create service role write access policies
CREATE POLICY "Enable insert for service role" ON blockchain_monitoring_log FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON smart_contract_monitoring FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON gas_price_analysis FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON defi_protocol_metrics FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable all operations for service role" ON tracked_wallets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON wallet_tracking_results FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON contract_event_monitoring FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON blockchain_health_checks FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON blockchain_analytics_reports FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON user_behavior_events FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable all operations for service role" ON user_profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable all operations for service role" ON user_personalization FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON user_pattern_analysis FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON engagement_metrics FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON user_segmentation FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON feature_usage_analysis FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON conversion_funnel_analysis FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON user_journey_maps FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON user_recommendations FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable all operations for service role" ON ab_tests FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON ab_test_analysis FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON retention_analysis FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable insert for service role" ON analytics_reports FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Add table comments
COMMENT ON TABLE blockchain_monitoring_log IS 'General blockchain monitoring activities';
COMMENT ON TABLE smart_contract_monitoring IS 'Smart contract status and events';
COMMENT ON TABLE gas_price_analysis IS 'Gas price trends and predictions';
COMMENT ON TABLE defi_protocol_metrics IS 'DeFi protocol TVL and health metrics';
COMMENT ON TABLE tracked_wallets IS 'Wallets being monitored for activity';
COMMENT ON TABLE wallet_tracking_results IS 'Results of wallet monitoring';
COMMENT ON TABLE contract_event_monitoring IS 'Smart contract event logs';
COMMENT ON TABLE blockchain_health_checks IS 'Blockchain network health status';
COMMENT ON TABLE blockchain_analytics_reports IS 'Comprehensive blockchain reports';
COMMENT ON TABLE user_behavior_events IS 'All user interaction events';
COMMENT ON TABLE user_profiles IS 'User profile information';
COMMENT ON TABLE user_personalization IS 'Personalized user preferences';
COMMENT ON TABLE user_pattern_analysis IS 'User behavior pattern analysis';
COMMENT ON TABLE engagement_metrics IS 'User engagement metrics';
COMMENT ON TABLE user_segmentation IS 'User segment definitions';
COMMENT ON TABLE feature_usage_analysis IS 'Feature adoption and usage';
COMMENT ON TABLE conversion_funnel_analysis IS 'Conversion funnel metrics';
COMMENT ON TABLE user_journey_maps IS 'Individual user journey tracking';
COMMENT ON TABLE user_recommendations IS 'Personalized recommendations';
COMMENT ON TABLE ab_tests IS 'A/B test configurations';
COMMENT ON TABLE ab_test_analysis IS 'A/B test results analysis';
COMMENT ON TABLE retention_analysis IS 'User retention metrics';
COMMENT ON TABLE analytics_reports IS 'Comprehensive analytics reports';