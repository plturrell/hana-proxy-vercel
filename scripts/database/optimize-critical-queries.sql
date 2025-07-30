-- Critical Query Optimizations Only
-- Focus on the highest impact optimizations

-- 1. Cache timezone data (13.9% of total query time)
CREATE TABLE IF NOT EXISTS cached_timezones (
    name text PRIMARY KEY,
    cached_at timestamptz DEFAULT NOW()
);

INSERT INTO cached_timezones (name)
SELECT name FROM pg_timezone_names
ON CONFLICT (name) DO NOTHING;

-- 2. Add critical index for a2a_agents (has index advisor suggestion)
CREATE INDEX IF NOT EXISTS idx_a2a_agents_agent_name 
ON public.a2a_agents(agent_name);

-- 3. Optimize news_articles indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_unique_article_id
ON public.news_articles(article_id)
WHERE article_id IS NOT NULL;

-- 4. Create simple cache table info
CREATE TABLE IF NOT EXISTS table_cache_info (
    cache_key text PRIMARY KEY,
    cache_data jsonb,
    created_at timestamptz DEFAULT NOW()
);

-- 5. Simple monitoring function
CREATE OR REPLACE FUNCTION check_optimization_status()
RETURNS TABLE(
    optimization text,
    status text
)
LANGUAGE sql
AS $$
    SELECT 'Timezone cache'::text, 
           CASE WHEN EXISTS (SELECT 1 FROM cached_timezones LIMIT 1) 
                THEN 'Active' ELSE 'Not Active' END
    UNION ALL
    SELECT 'A2A agents index'::text,
           CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_a2a_agents_agent_name')
                THEN 'Created' ELSE 'Not Created' END
    UNION ALL
    SELECT 'News articles index'::text,
           CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_news_unique_article_id')
                THEN 'Created' ELSE 'Not Created' END;
$$;

-- 6. Grant permissions
GRANT SELECT ON cached_timezones TO authenticated, service_role;
GRANT ALL ON table_cache_info TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_optimization_status() TO authenticated, service_role;

-- 7. Enable RLS
ALTER TABLE cached_timezones ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_cache_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read for all" ON cached_timezones FOR SELECT USING (true);
CREATE POLICY "All for authenticated" ON table_cache_info FOR ALL TO authenticated USING (true);

-- 8. Analyze critical tables
ANALYZE a2a_agents;
ANALYZE news_articles;

-- Summary
SELECT * FROM check_optimization_status();