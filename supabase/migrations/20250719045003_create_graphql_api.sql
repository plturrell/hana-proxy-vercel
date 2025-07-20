-- Create GraphQL API using Public Schema
-- Migration: 20250719045003_create_graphql_api.sql

-- Create API views in public schema with gql_ prefix for GraphQL exposure

-- 1. GraphQL Users View
CREATE OR REPLACE VIEW public.gql_users AS
SELECT 
    id,
    user_id,
    username,
    email,
    full_name,
    avatar_url,
    bio,
    user_type,
    subscription_tier,
    created_at,
    updated_at
FROM public.users;

-- 2. GraphQL Market Data View
CREATE OR REPLACE VIEW public.gql_market_data AS
SELECT 
    id,
    symbol,
    exchange,
    price,
    volume,
    asset_type,
    market_cap,
    change_pct,
    timestamp,
    created_at
FROM public.market_data
WHERE timestamp >= NOW() - INTERVAL '7 days';

-- 3. GraphQL News Articles View
CREATE OR REPLACE VIEW public.gql_news_articles AS
SELECT 
    id,
    title,
    summary,
    author,
    source,
    url,
    sentiment_score,
    relevance_score,
    symbols,
    published_at,
    created_at
FROM public.news_articles
WHERE published_at >= NOW() - INTERVAL '30 days';

-- 4. GraphQL Agents View
CREATE OR REPLACE VIEW public.gql_agents AS
SELECT 
    agent_id,
    agent_name,
    agent_type,
    status,
    capabilities,
    performance_score,
    created_at
FROM public.a2a_agents
WHERE status IN ('active', 'idle');

-- 5. GraphQL Reference Data Views
CREATE OR REPLACE VIEW public.gql_currencies AS
SELECT code, name, symbol, decimal_places FROM public.currencies;

CREATE OR REPLACE VIEW public.gql_exchanges AS
SELECT code, name, country, timezone, market_hours FROM public.exchanges;

CREATE OR REPLACE VIEW public.gql_sectors AS
SELECT code, name, description FROM public.sectors;

CREATE OR REPLACE VIEW public.gql_countries AS
SELECT code, name, continent, currency_code, market_status FROM public.countries;

-- 6. GraphQL Aggregated Views

-- Market Summary
CREATE OR REPLACE VIEW public.gql_market_summary AS
SELECT 
    exchange,
    COUNT(DISTINCT symbol) as total_symbols,
    AVG(price)::numeric(10,2) as avg_price,
    SUM(volume)::bigint as total_volume,
    AVG(change_pct)::numeric(5,2) as avg_change_pct,
    MAX(timestamp) as last_update
FROM public.market_data
WHERE timestamp >= NOW() - INTERVAL '1 day'
GROUP BY exchange;

-- Trending Symbols
CREATE OR REPLACE VIEW public.gql_trending_symbols AS
WITH symbol_mentions AS (
    SELECT 
        unnest(symbols) as symbol,
        sentiment_score,
        market_impact_score
    FROM public.news_articles
    WHERE published_at >= NOW() - INTERVAL '24 hours'
        AND symbols IS NOT NULL
        AND array_length(symbols, 1) > 0
)
SELECT 
    symbol,
    COUNT(*) as mention_count,
    AVG(sentiment_score)::numeric(3,2) as avg_sentiment,
    AVG(market_impact_score)::numeric(3,2) as avg_impact
FROM symbol_mentions
GROUP BY symbol
ORDER BY mention_count DESC
LIMIT 20;

-- 7. GraphQL Functions

-- Get market stats
CREATE OR REPLACE FUNCTION public.gql_get_market_stats(p_symbol text)
RETURNS TABLE(
    symbol text,
    price numeric,
    change numeric,
    change_percent numeric,
    volume bigint,
    market_cap numeric
) 
LANGUAGE sql
STABLE
AS $$
    SELECT 
        symbol::text,
        price,
        price_change as change,
        change_pct as change_percent,
        volume::bigint,
        market_cap
    FROM public.market_data
    WHERE symbol = p_symbol
    ORDER BY timestamp DESC
    LIMIT 1;
$$;

-- Search news
CREATE OR REPLACE FUNCTION public.gql_search_news(
    p_query text DEFAULT NULL,
    p_limit integer DEFAULT 10
)
RETURNS SETOF public.gql_news_articles
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM public.gql_news_articles
    WHERE 
        p_query IS NULL OR 
        title ILIKE '%' || p_query || '%' OR 
        summary ILIKE '%' || p_query || '%'
    ORDER BY published_at DESC
    LIMIT p_limit;
$$;

-- Get agents by type
CREATE OR REPLACE FUNCTION public.gql_get_agents_by_type(p_type text)
RETURNS SETOF public.gql_agents
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM public.gql_agents
    WHERE agent_type = p_type;
$$;

-- 8. Note: RLS is inherited from underlying tables through views
-- Views automatically respect the RLS policies of their source tables

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gql_market_symbol ON public.market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_gql_market_ts ON public.market_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gql_news_pub ON public.news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_gql_news_sym ON public.news_articles USING gin(symbols);

-- 11. Add comments for documentation
COMMENT ON VIEW public.gql_users IS 'User profiles accessible via GraphQL';
COMMENT ON VIEW public.gql_market_data IS 'Market data for financial instruments';
COMMENT ON VIEW public.gql_news_articles IS 'Financial news with sentiment analysis';
COMMENT ON VIEW public.gql_agents IS 'Autonomous financial agents';
COMMENT ON VIEW public.gql_market_summary IS 'Aggregated market statistics by exchange';
COMMENT ON VIEW public.gql_trending_symbols IS 'Most mentioned symbols in recent news';
COMMENT ON FUNCTION public.gql_get_market_stats IS 'Get current market stats for a symbol';
COMMENT ON FUNCTION public.gql_search_news IS 'Search news articles by query';
COMMENT ON FUNCTION public.gql_get_agents_by_type IS 'Find agents by type';

-- 12. Grant permissions
GRANT SELECT ON public.gql_users TO anon, authenticated;
GRANT SELECT ON public.gql_market_data TO anon, authenticated;
GRANT SELECT ON public.gql_news_articles TO anon, authenticated;
GRANT SELECT ON public.gql_agents TO anon, authenticated;
GRANT SELECT ON public.gql_currencies TO anon, authenticated;
GRANT SELECT ON public.gql_exchanges TO anon, authenticated;
GRANT SELECT ON public.gql_sectors TO anon, authenticated;
GRANT SELECT ON public.gql_countries TO anon, authenticated;
GRANT SELECT ON public.gql_market_summary TO anon, authenticated;
GRANT SELECT ON public.gql_trending_symbols TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.gql_get_market_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gql_search_news TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gql_get_agents_by_type TO anon, authenticated;

-- Success notification
DO $$
DECLARE
    view_count integer;
    func_count integer;
BEGIN
    SELECT COUNT(*) INTO view_count 
    FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name LIKE 'gql_%';
    
    SELECT COUNT(*) INTO func_count
    FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name LIKE 'gql_%';
    
    RAISE NOTICE 'GraphQL API created successfully with % views and % functions', view_count, func_count;
END $$;