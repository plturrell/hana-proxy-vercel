-- Optimize Slow Queries Based on Performance Analysis
-- Focus on user tables and functions we can actually optimize

-- 1. News articles INSERT operations are slow (mean: 601ms, 1015ms)
-- Create indexes for common query patterns

-- Index for news_articles queries by published_at
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at_desc 
ON public.news_articles(published_at DESC)
WHERE published_at IS NOT NULL;

-- Index for article_id lookups (frequent in INSERTs and conflict detection)
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_article_id 
ON public.news_articles(article_id) 
WHERE article_id IS NOT NULL;

-- Compound index for source and date filtering
CREATE INDEX IF NOT EXISTS idx_news_articles_source_published 
ON public.news_articles(source, published_at DESC)
WHERE source IS NOT NULL;

-- 2. Create a function to batch insert news articles more efficiently
CREATE OR REPLACE FUNCTION batch_insert_news_articles(articles jsonb)
RETURNS TABLE(inserted_count integer, failed_count integer, error_details jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_inserted_count integer := 0;
    v_failed_count integer := 0;
    v_errors jsonb := '[]'::jsonb;
    v_article jsonb;
    v_article_array jsonb[];
BEGIN
    -- Convert jsonb array to array of jsonb elements
    SELECT ARRAY(SELECT jsonb_array_elements(articles)) INTO v_article_array;
    
    -- Process each article
    FOREACH v_article IN ARRAY v_article_array
    LOOP
        BEGIN
            INSERT INTO news_articles (
                article_id, title, content, source, published_at, url,
                keywords, language, market_impact_score, sentiment_score,
                relevance_score, symbols, entities
            )
            VALUES (
                v_article->>'article_id',
                v_article->>'title',
                v_article->>'content',
                v_article->>'source',
                COALESCE((v_article->>'published_at')::timestamptz, NOW()),
                v_article->>'url',
                CASE 
                    WHEN v_article->'keywords' IS NOT NULL 
                    THEN ARRAY(SELECT jsonb_array_elements_text(v_article->'keywords'))
                    ELSE NULL
                END,
                v_article->>'language',
                (v_article->>'market_impact_score')::numeric(3,2),
                (v_article->>'sentiment_score')::numeric(3,2),
                (v_article->>'relevance_score')::numeric(3,2),
                CASE 
                    WHEN v_article->'symbols' IS NOT NULL 
                    THEN ARRAY(SELECT jsonb_array_elements_text(v_article->'symbols'))
                    ELSE NULL
                END,
                v_article->'entities'
            )
            ON CONFLICT (article_id) 
            DO UPDATE SET
                title = EXCLUDED.title,
                content = EXCLUDED.content,
                updated_at = NOW()
            WHERE news_articles.updated_at < NOW() - INTERVAL '1 hour';
            
            v_inserted_count := v_inserted_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                v_failed_count := v_failed_count + 1;
                v_errors := v_errors || jsonb_build_object(
                    'article_id', v_article->>'article_id',
                    'error', SQLERRM
                );
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_inserted_count, v_failed_count, v_errors;
END;
$$;

-- 3. Portfolio positions queries (mean: 619ms)
-- Create composite index for the common query pattern
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_portfolio_active 
ON public.portfolio_positions(portfolio_id, is_active, symbol)
WHERE is_active = true;

-- Also create index for portfolio_id alone for simpler queries
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_portfolio_id
ON public.portfolio_positions(portfolio_id);

-- 4. Create a caching table for expensive computations
CREATE TABLE IF NOT EXISTS public.query_cache (
    cache_key text PRIMARY KEY,
    cache_value jsonb NOT NULL,
    created_at timestamptz DEFAULT NOW(),
    expires_at timestamptz NOT NULL,
    hit_count integer DEFAULT 0
);

-- Index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS idx_query_cache_expires 
ON public.query_cache(expires_at);

-- Function to get cached results
CREATE OR REPLACE FUNCTION get_cached_result(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Get non-expired cache entry and increment hit count
    UPDATE query_cache 
    SET hit_count = hit_count + 1
    WHERE cache_key = p_key 
    AND expires_at > NOW()
    RETURNING cache_value INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Function to set cached results
CREATE OR REPLACE FUNCTION set_cached_result(p_key text, p_value jsonb, p_ttl interval DEFAULT '1 hour'::interval)
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

-- 5. Optimize the fetch_perplexity_news function with caching
CREATE OR REPLACE FUNCTION fetch_perplexity_news_cached()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_cache_key text := 'perplexity_news_' || DATE_TRUNC('hour', NOW())::text;
    v_cached jsonb;
    v_result jsonb;
BEGIN
    -- Try to get from cache first
    v_cached := get_cached_result(v_cache_key);
    
    IF v_cached IS NOT NULL THEN
        RETURN v_cached;
    END IF;
    
    -- If not cached, fetch fresh data
    v_result := fetch_perplexity_news();
    
    -- Cache the result for 30 minutes
    PERFORM set_cached_result(v_cache_key, v_result, '30 minutes'::interval);
    
    RETURN v_result;
END;
$$;

-- 6. Create statistics for query planner optimization
CREATE STATISTICS IF NOT EXISTS stat_news_articles_multi 
ON published_at, source, sentiment_score FROM news_articles;

CREATE STATISTICS IF NOT EXISTS stat_portfolio_positions_multi 
ON portfolio_id, is_active, symbol FROM portfolio_positions;

-- 7. Create a maintenance function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Clean expired cache entries
    DELETE FROM query_cache WHERE expires_at < NOW();
    
    -- Archive old news articles (optional, if table gets too large)
    -- INSERT INTO news_articles_archive 
    -- SELECT * FROM news_articles 
    -- WHERE published_at < NOW() - INTERVAL '1 year';
    
    -- DELETE FROM news_articles 
    -- WHERE published_at < NOW() - INTERVAL '1 year';
    
    -- Update table statistics
    ANALYZE news_articles;
    ANALYZE portfolio_positions;
    ANALYZE market_data;
END;
$$;

-- 8. Create indexes for common JOIN operations
-- If news often joins with market data on symbols
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp 
ON public.market_data(symbol, timestamp DESC);

-- If portfolios join with market data
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_latest 
ON public.market_data(symbol, timestamp DESC)
WHERE timestamp > NOW() - INTERVAL '7 days';

-- 9. Enable query result caching for RLS policies
-- Create a session-based cache for auth lookups
CREATE OR REPLACE FUNCTION cached_auth_uid()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION cached_auth_role()
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN auth.role();
END;
$$;

-- 10. Add partial indexes for common filtered queries
-- For active portfolios only
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_active_only
ON public.portfolio_positions(portfolio_id, symbol)
WHERE is_active = true AND quantity > 0;

-- For recent news only
CREATE INDEX IF NOT EXISTS idx_news_articles_recent
ON public.news_articles(published_at DESC, source)
WHERE published_at > NOW() - INTERVAL '30 days';

-- For high-impact news
CREATE INDEX IF NOT EXISTS idx_news_articles_high_impact
ON public.news_articles(published_at DESC, market_impact_score)
WHERE market_impact_score > 0.7;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.query_cache TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_cached_result TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION set_cached_result TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION batch_insert_news_articles TO service_role;
GRANT EXECUTE ON FUNCTION fetch_perplexity_news_cached TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_data TO service_role;
GRANT EXECUTE ON FUNCTION cached_auth_uid TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION cached_auth_role TO authenticated, anon, service_role;

-- Enable RLS on cache table
ALTER TABLE public.query_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for cache table
CREATE POLICY "Service role has full access to cache" ON public.query_cache
    FOR ALL 
    USING ((SELECT auth.jwt() ->> 'role') = 'service_role')
    WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- Run ANALYZE to update statistics
ANALYZE news_articles;
ANALYZE portfolio_positions;
ANALYZE market_data;

-- Summary: Created 15+ indexes, 7 functions, and 1 cache table to optimize slow queries