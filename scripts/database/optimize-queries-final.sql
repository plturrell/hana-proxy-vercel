-- Optimize Slow Queries - Final Version
-- Focus on proven optimizations that will work

-- 1. News articles indexes for fast lookups and inserts
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at_desc 
ON public.news_articles(published_at DESC)
WHERE published_at IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_article_id 
ON public.news_articles(article_id) 
WHERE article_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_news_articles_source_published 
ON public.news_articles(source, published_at DESC)
WHERE source IS NOT NULL;

-- 2. Portfolio positions indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_portfolio_active 
ON public.portfolio_positions(portfolio_id, is_active, symbol)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_portfolio_positions_portfolio_id
ON public.portfolio_positions(portfolio_id);

-- 3. Market data index (without NOW() function)
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp_desc
ON public.market_data(symbol, timestamp DESC);

-- 4. Cache table for expensive queries
CREATE TABLE IF NOT EXISTS public.query_cache (
    cache_key text PRIMARY KEY,
    cache_value jsonb NOT NULL,
    created_at timestamptz DEFAULT NOW(),
    expires_at timestamptz NOT NULL,
    hit_count integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_query_cache_expires 
ON public.query_cache(expires_at);

-- 5. Batch insert function for news articles
CREATE OR REPLACE FUNCTION batch_insert_news_articles(articles jsonb)
RETURNS TABLE(inserted_count integer, failed_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_inserted_count integer := 0;
    v_failed_count integer := 0;
    v_article jsonb;
BEGIN
    FOR v_article IN SELECT jsonb_array_elements(articles)
    LOOP
        BEGIN
            INSERT INTO news_articles (
                article_id, title, content, source, published_at, url
            )
            VALUES (
                v_article->>'article_id',
                v_article->>'title',
                v_article->>'content',
                v_article->>'source',
                COALESCE((v_article->>'published_at')::timestamptz, NOW()),
                v_article->>'url'
            )
            ON CONFLICT (article_id) DO NOTHING;
            
            IF FOUND THEN
                v_inserted_count := v_inserted_count + 1;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                v_failed_count := v_failed_count + 1;
                RAISE NOTICE 'Failed to insert article %: %', v_article->>'article_id', SQLERRM;
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_inserted_count, v_failed_count;
END;
$$;

-- 6. Cache helper functions
CREATE OR REPLACE FUNCTION get_cached_result(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_result jsonb;
BEGIN
    DELETE FROM query_cache WHERE expires_at < NOW();
    
    UPDATE query_cache 
    SET hit_count = hit_count + 1
    WHERE cache_key = p_key 
    AND expires_at > NOW()
    RETURNING cache_value INTO v_result;
    
    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION set_cached_result(
    p_key text, 
    p_value jsonb, 
    p_ttl interval DEFAULT '1 hour'::interval
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO query_cache (cache_key, cache_value, expires_at)
    VALUES (p_key, p_value, NOW() + p_ttl)
    ON CONFLICT (cache_key) 
    DO UPDATE SET 
        cache_value = EXCLUDED.cache_value,
        expires_at = EXCLUDED.expires_at,
        created_at = NOW(),
        hit_count = 0;
END;
$$;

-- 7. Optimized auth functions with STABLE marking
CREATE OR REPLACE FUNCTION cached_auth_uid()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION cached_auth_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT auth.role();
$$;

-- 8. Create multi-column statistics for better query plans
CREATE STATISTICS IF NOT EXISTS stat_news_articles_source_date
(dependencies, ndistinct) 
ON source, published_at FROM news_articles;

CREATE STATISTICS IF NOT EXISTS stat_portfolio_positions_portfolio_active
(dependencies, ndistinct) 
ON portfolio_id, is_active FROM portfolio_positions;

-- 9. Partial indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_active_only
ON public.portfolio_positions(portfolio_id, symbol)
WHERE is_active = true AND quantity > 0;

CREATE INDEX IF NOT EXISTS idx_news_articles_recent_30d
ON public.news_articles(source, published_at DESC)
WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_news_articles_high_impact
ON public.news_articles(published_at DESC, market_impact_score)
WHERE market_impact_score > 0.7;

-- 10. Maintenance function
CREATE OR REPLACE FUNCTION cleanup_old_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted integer;
BEGIN
    DELETE FROM query_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- 11. Function to analyze slow tables
CREATE OR REPLACE FUNCTION analyze_slow_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    ANALYZE news_articles;
    ANALYZE portfolio_positions;
    ANALYZE market_data;
    ANALYZE query_cache;
END;
$$;

-- 12. Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.query_cache TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_cached_result TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION set_cached_result TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION batch_insert_news_articles TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_cache TO service_role;
GRANT EXECUTE ON FUNCTION analyze_slow_tables TO service_role;
GRANT EXECUTE ON FUNCTION cached_auth_uid TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION cached_auth_role TO authenticated, anon, service_role;

-- 13. Enable RLS on cache table
ALTER TABLE public.query_cache ENABLE ROW LEVEL SECURITY;

-- Simple RLS policy for cache
CREATE POLICY "Service role manages cache" ON public.query_cache
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 14. Create view for monitoring query performance
CREATE OR REPLACE VIEW query_performance_stats AS
SELECT 
    rolname,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time,
    LEFT(query, 100) as query_start
FROM pg_stat_statements
WHERE mean_time > 10  -- Focus on queries taking more than 10ms
ORDER BY mean_time DESC
LIMIT 20;

GRANT SELECT ON query_performance_stats TO authenticated;

-- Run ANALYZE on key tables
ANALYZE news_articles;
ANALYZE portfolio_positions;
ANALYZE market_data;

-- Summary of optimizations:
-- 1. Created 10 targeted indexes for slow queries
-- 2. Added query result caching system
-- 3. Created batch insert function for news
-- 4. Added multi-column statistics for query planner
-- 5. Created maintenance functions
-- 6. Added performance monitoring view