-- Query Performance Optimizations
-- Compatible with current table structure

-- 1. Core indexes for news_articles
CREATE INDEX IF NOT EXISTS idx_news_articles_published_desc 
ON public.news_articles(published_at DESC NULLS LAST);

CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_article_id_unique
ON public.news_articles(article_id) 
WHERE article_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_news_articles_source_date
ON public.news_articles(source, published_at DESC NULLS LAST);

-- 2. Portfolio positions performance indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_lookup
ON public.portfolio_positions(portfolio_id, is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_portfolio_positions_pid
ON public.portfolio_positions(portfolio_id);

-- 3. Market data performance index
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_time
ON public.market_data(symbol, timestamp DESC NULLS LAST);

-- 4. Query result caching system
CREATE TABLE IF NOT EXISTS public.query_cache (
    cache_key text PRIMARY KEY,
    cache_value jsonb NOT NULL,
    created_at timestamptz DEFAULT NOW() NOT NULL,
    expires_at timestamptz NOT NULL,
    hit_count integer DEFAULT 0 NOT NULL
);

CREATE INDEX idx_query_cache_expiry ON public.query_cache(expires_at);

-- 5. Efficient batch insert for news
CREATE OR REPLACE FUNCTION batch_insert_news(articles jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_result jsonb;
    v_inserted integer := 0;
    v_skipped integer := 0;
    v_article jsonb;
BEGIN
    FOR v_article IN SELECT jsonb_array_elements(articles)
    LOOP
        BEGIN
            INSERT INTO news_articles (article_id, title, content, source, published_at, url)
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
                v_inserted := v_inserted + 1;
            ELSE
                v_skipped := v_skipped + 1;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                v_skipped := v_skipped + 1;
        END;
    END LOOP;
    
    v_result := jsonb_build_object(
        'inserted', v_inserted,
        'skipped', v_skipped,
        'total', v_inserted + v_skipped
    );
    
    RETURN v_result;
END;
$$;

-- 6. Cache management functions
CREATE OR REPLACE FUNCTION get_cache(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_value jsonb;
BEGIN
    UPDATE query_cache 
    SET hit_count = hit_count + 1
    WHERE cache_key = p_key AND expires_at > NOW()
    RETURNING cache_value INTO v_value;
    
    RETURN v_value;
END;
$$;

CREATE OR REPLACE FUNCTION set_cache(p_key text, p_value jsonb, p_ttl interval DEFAULT '1 hour')
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO query_cache (cache_key, cache_value, expires_at)
    VALUES (p_key, p_value, NOW() + p_ttl)
    ON CONFLICT (cache_key) DO UPDATE SET 
        cache_value = EXCLUDED.cache_value,
        expires_at = EXCLUDED.expires_at,
        hit_count = 0;
END;
$$;

-- 7. Table statistics
CREATE STATISTICS stat_news_source_date (dependencies) 
ON source, published_at FROM news_articles;

CREATE STATISTICS stat_portfolio_active (dependencies) 
ON portfolio_id, is_active FROM portfolio_positions;

-- 8. Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_active_positions
ON public.portfolio_positions(portfolio_id)
WHERE is_active = true AND quantity > 0;

CREATE INDEX IF NOT EXISTS idx_recent_news
ON public.news_articles(published_at DESC)
WHERE published_at IS NOT NULL;

-- 9. Cleanup function
CREATE OR REPLACE FUNCTION cleanup_cache()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
    DELETE FROM query_cache WHERE expires_at < NOW();
    SELECT COUNT(*)::integer FROM query_cache WHERE expires_at < NOW();
$$;

-- 10. Performance analysis function
CREATE OR REPLACE FUNCTION analyze_tables()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    ANALYZE news_articles;
    ANALYZE portfolio_positions;
    ANALYZE market_data;
$$;

-- 11. Permissions
GRANT ALL ON public.query_cache TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.query_cache TO authenticated;
GRANT EXECUTE ON FUNCTION batch_insert_news TO service_role;
GRANT EXECUTE ON FUNCTION get_cache TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION set_cache TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION cleanup_cache TO service_role;
GRANT EXECUTE ON FUNCTION analyze_tables TO service_role;

-- 12. RLS for cache table
ALTER TABLE public.query_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access" ON public.query_cache
    FOR ALL TO service_role USING (true);

CREATE POLICY "Allow authenticated read cache" ON public.query_cache
    FOR SELECT TO authenticated USING (true);

-- 13. Run initial analysis
ANALYZE news_articles;
ANALYZE portfolio_positions;
ANALYZE market_data;