-- Add GraphQL Subscriptions and Real-time Features
-- Migration: 20250719050003_add_graphql_subscriptions.sql

-- 1. Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_data;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_articles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio_holdings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.a2a_agents;

-- 2. Create trigger functions for real-time updates

-- Market data update trigger
CREATE OR REPLACE FUNCTION public.notify_market_update()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify(
        'market_update',
        json_build_object(
            'operation', TG_OP,
            'symbol', NEW.symbol,
            'price', NEW.price,
            'change_pct', NEW.change_pct,
            'volume', NEW.volume,
            'timestamp', NEW.timestamp
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER market_data_notify
AFTER INSERT OR UPDATE ON public.market_data
FOR EACH ROW EXECUTE FUNCTION public.notify_market_update();

-- News article trigger
CREATE OR REPLACE FUNCTION public.notify_news_update()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify(
        'news_update',
        json_build_object(
            'operation', TG_OP,
            'id', NEW.id,
            'title', NEW.title,
            'symbols', NEW.symbols,
            'sentiment_score', NEW.sentiment_score,
            'published_at', NEW.published_at
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER news_articles_notify
AFTER INSERT ON public.news_articles
FOR EACH ROW EXECUTE FUNCTION public.notify_news_update();

-- Price alert trigger
CREATE OR REPLACE FUNCTION public.notify_price_alert()
RETURNS trigger AS $$
BEGIN
    IF NEW.triggered_at IS NOT NULL AND OLD.triggered_at IS NULL THEN
        PERFORM pg_notify(
            'price_alert',
            json_build_object(
                'user_id', NEW.user_id,
                'symbol', NEW.symbol,
                'alert_type', NEW.alert_type,
                'threshold_value', NEW.threshold_value,
                'triggered_at', NEW.triggered_at
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER price_alerts_notify
AFTER UPDATE ON public.price_alerts
FOR EACH ROW EXECUTE FUNCTION public.notify_price_alert();

-- 3. Create subscription views for GraphQL

-- Real-time market ticker
CREATE OR REPLACE VIEW public.gql_market_ticker AS
SELECT 
    symbol,
    price,
    change_pct,
    volume,
    timestamp,
    NOW() as server_time
FROM public.market_data
WHERE timestamp >= NOW() - INTERVAL '1 minute'
ORDER BY timestamp DESC;

-- Real-time news feed
CREATE OR REPLACE VIEW public.gql_news_feed AS
SELECT 
    id,
    title,
    summary,
    symbols,
    sentiment_score,
    published_at,
    created_at
FROM public.news_articles
WHERE created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

-- Active price alerts
CREATE OR REPLACE VIEW public.gql_active_alerts AS
SELECT 
    pa.*,
    md.price as current_price,
    CASE 
        WHEN pa.alert_type = 'above' AND md.price > pa.threshold_value THEN true
        WHEN pa.alert_type = 'below' AND md.price < pa.threshold_value THEN true
        ELSE false
    END as should_trigger
FROM public.price_alerts pa
LEFT JOIN public.market_data md ON pa.symbol = md.symbol
WHERE pa.is_active = true
    AND pa.triggered_at IS NULL;

-- 4. Create GraphQL subscription functions

-- Subscribe to market updates by symbol
CREATE OR REPLACE FUNCTION public.gql_subscribe_market(p_symbols text[])
RETURNS SETOF public.market_data
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM public.market_data
    WHERE symbol = ANY(p_symbols)
        AND timestamp >= NOW() - INTERVAL '1 second'
    ORDER BY timestamp DESC;
$$;

-- Subscribe to news by symbols
CREATE OR REPLACE FUNCTION public.gql_subscribe_news(p_symbols text[] DEFAULT NULL)
RETURNS SETOF public.news_articles
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM public.news_articles
    WHERE (p_symbols IS NULL OR symbols && p_symbols)
        AND created_at >= NOW() - INTERVAL '1 second'
    ORDER BY created_at DESC;
$$;

-- 5. Create WebSocket channel configuration
CREATE TABLE IF NOT EXISTS public.websocket_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_name VARCHAR(255) UNIQUE NOT NULL,
    channel_type VARCHAR(50) NOT NULL,
    configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.websocket_channels (channel_name, channel_type, configuration) VALUES
('market:all', 'broadcast', '{"description": "All market updates"}'),
('market:crypto', 'broadcast', '{"filter": {"asset_type": "crypto"}}'),
('market:stocks', 'broadcast', '{"filter": {"asset_type": "stock"}}'),
('news:all', 'broadcast', '{"description": "All news updates"}'),
('alerts:user', 'presence', '{"description": "User-specific alerts"}')
ON CONFLICT (channel_name) DO NOTHING;

-- 6. Create real-time aggregation functions

-- Real-time volume aggregation
CREATE OR REPLACE FUNCTION public.gql_realtime_volume(p_interval interval DEFAULT '5 minutes')
RETURNS TABLE(
    symbol text,
    total_volume bigint,
    trade_count bigint,
    avg_price numeric,
    time_bucket timestamp
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        symbol,
        SUM(volume)::bigint as total_volume,
        COUNT(*)::bigint as trade_count,
        AVG(price) as avg_price,
        date_trunc('minute', timestamp) as time_bucket
    FROM public.market_data
    WHERE timestamp >= NOW() - p_interval
    GROUP BY symbol, date_trunc('minute', timestamp)
    ORDER BY time_bucket DESC;
$$;

-- 7. Grant permissions for subscriptions
GRANT EXECUTE ON FUNCTION public.gql_subscribe_market TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gql_subscribe_news TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gql_realtime_volume TO anon, authenticated;
GRANT SELECT ON public.gql_market_ticker TO anon, authenticated;
GRANT SELECT ON public.gql_news_feed TO anon, authenticated;
GRANT SELECT ON public.gql_active_alerts TO authenticated;

-- 8. Create GraphQL subscription comments
COMMENT ON FUNCTION public.gql_subscribe_market IS 'Subscribe to real-time market updates for specific symbols';
COMMENT ON FUNCTION public.gql_subscribe_news IS 'Subscribe to real-time news updates';
COMMENT ON FUNCTION public.gql_realtime_volume IS 'Get real-time volume aggregations';
COMMENT ON VIEW public.gql_market_ticker IS 'Real-time market ticker data';
COMMENT ON VIEW public.gql_news_feed IS 'Real-time news feed';
COMMENT ON VIEW public.gql_active_alerts IS 'Active price alerts with current market prices';

-- Success notification
DO $$
BEGIN
    RAISE NOTICE 'GraphQL subscriptions and real-time features enabled successfully';
END $$;