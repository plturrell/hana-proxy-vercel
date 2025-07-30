-- GraphQL Cache and Performance Tables
-- Run this in Supabase SQL editor

-- 1. GraphQL query logs
CREATE TABLE IF NOT EXISTS graphql_query_logs (
  id BIGSERIAL PRIMARY KEY,
  query_name VARCHAR(255),
  query_hash VARCHAR(64),
  query_text TEXT,
  variables JSONB DEFAULT '{}',
  execution_time INTEGER, -- milliseconds
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  user_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_query_logs_name ON graphql_query_logs(query_name, created_at DESC);
CREATE INDEX idx_query_logs_execution ON graphql_query_logs(execution_time DESC);
CREATE INDEX idx_query_logs_created ON graphql_query_logs(created_at DESC);

-- 2. GraphQL cache warming log
CREATE TABLE IF NOT EXISTS graphql_cache_warming_log (
  id BIGSERIAL PRIMARY KEY,
  warmed_count INTEGER NOT NULL,
  failed_count INTEGER NOT NULL,
  queries JSONB NOT NULL,
  total_cache_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cache_warming_created ON graphql_cache_warming_log(created_at DESC);

-- 3. GraphQL schema versions
CREATE TABLE IF NOT EXISTS graphql_schema_versions (
  id BIGSERIAL PRIMARY KEY,
  schema TEXT NOT NULL,
  tables TEXT[],
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schema_versions_active ON graphql_schema_versions(is_active, created_at DESC);

-- 4. GraphQL performance analysis
CREATE TABLE IF NOT EXISTS graphql_performance_analysis (
  id BIGSERIAL PRIMARY KEY,
  period VARCHAR(10) NOT NULL, -- '1h', '24h', '7d'
  analysis JSONB NOT NULL,
  suggestions JSONB DEFAULT '[]',
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performance_analysis_period ON graphql_performance_analysis(period, created_at DESC);

-- 5. GraphQL query patterns
CREATE TABLE IF NOT EXISTS graphql_query_patterns (
  id BIGSERIAL PRIMARY KEY,
  pattern_name VARCHAR(255) NOT NULL,
  pattern_hash VARCHAR(64) UNIQUE,
  query_template TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  avg_execution_time INTEGER,
  cache_hit_rate DECIMAL(5, 2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_query_patterns_usage ON graphql_query_patterns(usage_count DESC);
CREATE INDEX idx_query_patterns_hash ON graphql_query_patterns(pattern_hash);

-- 6. GraphQL cache entries (metadata only, actual cache in memory)
CREATE TABLE IF NOT EXISTS graphql_cache_metadata (
  cache_key VARCHAR(255) PRIMARY KEY,
  query_name VARCHAR(255),
  data_size INTEGER,
  hit_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cache_metadata_expires ON graphql_cache_metadata(expires_at);
CREATE INDEX idx_cache_metadata_accessed ON graphql_cache_metadata(last_accessed DESC);

-- Create views for monitoring
CREATE OR REPLACE VIEW graphql_query_stats_24h AS
SELECT 
  query_name,
  COUNT(*) as execution_count,
  AVG(execution_time) as avg_execution_time,
  MAX(execution_time) as max_execution_time,
  MIN(execution_time) as min_execution_time,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failure_count,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM graphql_query_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY query_name
ORDER BY execution_count DESC;

CREATE OR REPLACE VIEW graphql_slow_queries AS
SELECT 
  query_name,
  query_text,
  execution_time,
  variables,
  error_message,
  created_at
FROM graphql_query_logs
WHERE execution_time > 1000 -- queries slower than 1 second
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY execution_time DESC
LIMIT 100;

CREATE OR REPLACE VIEW graphql_cache_effectiveness AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  SUM(warmed_count) as queries_warmed,
  SUM(failed_count) as queries_failed,
  AVG(total_cache_size) as avg_cache_size,
  ROUND(100.0 * SUM(warmed_count) / (SUM(warmed_count) + SUM(failed_count)), 2) as success_rate
FROM graphql_cache_warming_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Function to analyze query complexity
CREATE OR REPLACE FUNCTION analyze_graphql_complexity(query_text TEXT)
RETURNS INTEGER AS $$
DECLARE
  complexity INTEGER := 0;
  depth INTEGER;
  field_count INTEGER;
BEGIN
  -- Simple complexity calculation based on query structure
  -- Count nested levels (depth)
  depth := LENGTH(query_text) - LENGTH(REPLACE(query_text, '{', ''));
  
  -- Count fields
  field_count := LENGTH(query_text) - LENGTH(REPLACE(query_text, E'\n', ''));
  
  -- Basic complexity formula
  complexity := depth * 10 + field_count;
  
  -- Penalize for certain operations
  IF query_text ILIKE '%__typename%' THEN
    complexity := complexity + 5;
  END IF;
  
  IF query_text ILIKE '%...%' THEN -- fragments
    complexity := complexity + 20;
  END IF;
  
  RETURN complexity;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE graphql_query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE graphql_cache_warming_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE graphql_schema_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE graphql_performance_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE graphql_query_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE graphql_cache_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Enable read access for all users" ON graphql_query_logs
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON graphql_cache_warming_log
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON graphql_schema_versions
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON graphql_performance_analysis
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON graphql_query_patterns
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON graphql_cache_metadata
  FOR SELECT USING (true);

-- Create policies for service role write access
CREATE POLICY "Enable insert for service role" ON graphql_query_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON graphql_cache_warming_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON graphql_schema_versions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON graphql_performance_analysis
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON graphql_query_patterns
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON graphql_cache_metadata
  FOR ALL USING (auth.role() = 'service_role');

-- Add table comments
COMMENT ON TABLE graphql_query_logs IS 'Logs of all GraphQL queries for performance analysis';
COMMENT ON TABLE graphql_cache_warming_log IS 'Results of cache warming operations';
COMMENT ON TABLE graphql_schema_versions IS 'GraphQL schema version history';
COMMENT ON TABLE graphql_performance_analysis IS 'Periodic performance analysis results';
COMMENT ON TABLE graphql_query_patterns IS 'Identified query patterns for optimization';
COMMENT ON TABLE graphql_cache_metadata IS 'Metadata about cached queries';