-- Agent Health Monitoring Tables
-- Run this in Supabase SQL editor

-- 1. Agent health metrics (individual checks)
CREATE TABLE IF NOT EXISTS agent_health_metrics (
  id BIGSERIAL PRIMARY KEY,
  agent_id VARCHAR(50) NOT NULL,
  agent_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'healthy', 'unhealthy', 'degraded'
  response_time INTEGER, -- milliseconds
  status_code INTEGER,
  error_message TEXT,
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_agent_health_metrics_agent_id ON agent_health_metrics(agent_id, created_at DESC);
CREATE INDEX idx_agent_health_metrics_status ON agent_health_metrics(status, created_at DESC);
CREATE INDEX idx_agent_health_metrics_created_at ON agent_health_metrics(created_at DESC);

-- 2. Agent health snapshots (overall system health)
CREATE TABLE IF NOT EXISTS agent_health_snapshots (
  id BIGSERIAL PRIMARY KEY,
  healthy_count INTEGER NOT NULL,
  unhealthy_count INTEGER NOT NULL,
  degraded_count INTEGER NOT NULL,
  overall_health INTEGER NOT NULL, -- percentage
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_health_snapshots_created_at ON agent_health_snapshots(created_at DESC);

-- 3. Agent alerts
CREATE TABLE IF NOT EXISTS agent_alerts (
  id BIGSERIAL PRIMARY KEY,
  severity VARCHAR(20) NOT NULL, -- 'critical', 'warning', 'info'
  type VARCHAR(50) NOT NULL, -- 'agent_down', 'performance_degradation', 'system_health_low'
  message TEXT NOT NULL,
  agents TEXT[], -- array of affected agent IDs
  health_score INTEGER,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_alerts_severity ON agent_alerts(severity, created_at DESC);
CREATE INDEX idx_agent_alerts_resolved ON agent_alerts(resolved_at NULLS FIRST, created_at DESC);

-- 4. Agent configuration
CREATE TABLE IF NOT EXISTS agent_configurations (
  agent_id VARCHAR(50) PRIMARY KEY,
  agent_name VARCHAR(100) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  is_critical BOOLEAN DEFAULT false,
  health_check_config JSONB DEFAULT '{}',
  performance_thresholds JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default agent configurations
INSERT INTO agent_configurations (agent_id, agent_name, endpoint, is_critical, health_check_config) VALUES
  ('news-intelligence', 'News Intelligence Agent', '/api/agents/news-intelligence', true, '{"action": "health"}'),
  ('market-data', 'Market Data Agent', '/api/agents/market-data', true, '{"action": "health"}'),
  ('curriculum-learning', 'Curriculum Learning Agent', '/api/agents/curriculum-learning', false, '{"action": "health"}'),
  ('news-assessment-hedge', 'News Assessment Hedge Agent', '/api/agents/news-assessment-hedge', true, '{"action": "health"}'),
  ('a2a-protocol-manager', 'A2A Protocol Manager', '/api/agents/a2a-protocol-manager', false, '{"action": "health"}'),
  ('ord-registry-manager', 'ORD Registry Manager', '/api/agents/ord-registry-manager', false, '{"action": "health"}'),
  ('api-gateway', 'API Gateway Agent', '/api/agents/api-gateway', true, '{"action": "health"}'),
  ('orchestrator', 'Function Orchestrator', '/api/functions/orchestrator', true, '{"method": "GET"}')
ON CONFLICT (agent_id) DO UPDATE SET updated_at = NOW();

-- 5. Agent performance benchmarks
CREATE TABLE IF NOT EXISTS agent_performance_benchmarks (
  id BIGSERIAL PRIMARY KEY,
  agent_id VARCHAR(50) NOT NULL,
  metric_name VARCHAR(50) NOT NULL, -- 'response_time', 'success_rate', 'throughput'
  benchmark_value DECIMAL(10, 2) NOT NULL,
  threshold_warning DECIMAL(10, 2),
  threshold_critical DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create view for latest agent status
CREATE OR REPLACE VIEW latest_agent_status AS
SELECT DISTINCT ON (agent_id)
  agent_id,
  agent_name,
  status,
  response_time,
  status_code,
  error_message,
  is_critical,
  created_at
FROM agent_health_metrics
ORDER BY agent_id, created_at DESC;

-- Create view for agent uptime (last 24 hours)
CREATE OR REPLACE VIEW agent_uptime_24h AS
SELECT 
  agent_id,
  agent_name,
  COUNT(*) as total_checks,
  SUM(CASE WHEN status = 'healthy' THEN 1 ELSE 0 END) as healthy_checks,
  ROUND(100.0 * SUM(CASE WHEN status = 'healthy' THEN 1 ELSE 0 END) / COUNT(*), 2) as uptime_percentage,
  AVG(response_time) as avg_response_time,
  MAX(response_time) as max_response_time,
  MIN(response_time) as min_response_time
FROM agent_health_metrics
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY agent_id, agent_name;

-- Enable Row Level Security
ALTER TABLE agent_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_benchmarks ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Enable read access for all users" ON agent_health_metrics
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON agent_health_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON agent_alerts
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON agent_configurations
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON agent_performance_benchmarks
  FOR SELECT USING (true);

-- Create policies for service role write access
CREATE POLICY "Enable insert for service role" ON agent_health_metrics
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON agent_health_snapshots
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON agent_alerts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON agent_configurations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON agent_performance_benchmarks
  FOR ALL USING (auth.role() = 'service_role');

-- Add table comments
COMMENT ON TABLE agent_health_metrics IS 'Individual health check results for each agent';
COMMENT ON TABLE agent_health_snapshots IS 'Overall system health snapshots';
COMMENT ON TABLE agent_alerts IS 'Alerts triggered by agent health issues';
COMMENT ON TABLE agent_configurations IS 'Configuration for each monitored agent';
COMMENT ON TABLE agent_performance_benchmarks IS 'Performance benchmarks and thresholds for agents';