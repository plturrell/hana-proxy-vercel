-- Add Triggers and SQL Testing Function
-- Migration: 20250119080003_add_triggers_and_sql_function.sql

-- 1. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 2. Add updated_at triggers to key tables
DO $$
BEGIN
    -- Users table trigger
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_users_updated_at'
        AND event_object_table = 'users'
    ) THEN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON public.users
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    -- Portfolio holdings trigger (if table exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'portfolio_holdings' 
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_portfolio_holdings_updated_at'
        AND event_object_table = 'portfolio_holdings'
    ) THEN
        CREATE TRIGGER update_portfolio_holdings_updated_at
            BEFORE UPDATE ON public.portfolio_holdings
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    -- News articles trigger
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_news_articles_updated_at'
        AND event_object_table = 'news_articles'
    ) THEN
        CREATE TRIGGER update_news_articles_updated_at
            BEFORE UPDATE ON public.news_articles
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    -- Market data trigger
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_market_data_updated_at'
        AND event_object_table = 'market_data'
    ) THEN
        CREATE TRIGGER update_market_data_updated_at
            BEFORE UPDATE ON public.market_data
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- 3. Create real-time notification triggers
CREATE OR REPLACE FUNCTION public.notify_market_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Send notification for real-time market data updates
    PERFORM pg_notify(
        'market_update',
        json_build_object(
            'symbol', NEW.symbol,
            'price', NEW.price,
            'timestamp', NEW.timestamp,
            'change', CASE 
                WHEN OLD IS NOT NULL THEN NEW.price - OLD.price 
                ELSE 0 
            END
        )::text
    );
    
    RETURN NEW;
END;
$$;

-- Add market data notification trigger
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'market_data_notify_trigger'
        AND event_object_table = 'market_data'
    ) THEN
        CREATE TRIGGER market_data_notify_trigger
            AFTER INSERT OR UPDATE ON public.market_data
            FOR EACH ROW
            EXECUTE FUNCTION public.notify_market_update();
    END IF;
END $$;

-- 4. Create news notification trigger
CREATE OR REPLACE FUNCTION public.notify_news_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Send notification for new news articles
    PERFORM pg_notify(
        'news_update',
        json_build_object(
            'id', NEW.id,
            'title', NEW.title,
            'category', NEW.category,
            'importance_score', NEW.importance_score,
            'published_at', NEW.published_at
        )::text
    );
    
    RETURN NEW;
END;
$$;

-- Add news notification trigger
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'news_articles_notify_trigger'
        AND event_object_table = 'news_articles'
    ) THEN
        CREATE TRIGGER news_articles_notify_trigger
            AFTER INSERT ON public.news_articles
            FOR EACH ROW
            EXECUTE FUNCTION public.notify_news_update();
    END IF;
END $$;

-- 5. Create SQL execution function for testing (with proper security)
CREATE OR REPLACE FUNCTION public.sql(
    query_text TEXT
)
RETURNS TABLE (result JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    result_array JSONB := '[]'::JSONB;
    row_data JSONB;
BEGIN
    -- Security: Only allow SELECT statements
    IF query_text !~* '^\s*SELECT' THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed';
    END IF;
    
    -- Security: Block dangerous keywords
    IF query_text ~* '(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)' THEN
        RAISE EXCEPTION 'Query contains forbidden keywords';
    END IF;
    
    -- Execute the query and collect results
    FOR rec IN EXECUTE query_text LOOP
        row_data := to_jsonb(rec);
        result_array := result_array || row_data;
    END LOOP;
    
    RETURN QUERY SELECT result_array;
END;
$$;

-- 6. Create database performance analysis function
CREATE OR REPLACE FUNCTION public.analyze_database_performance()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT,
    table_size TEXT,
    index_count INTEGER,
    performance_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        COALESCE(s.n_tup_ins + s.n_tup_upd + s.n_tup_del, 0) as row_count,
        pg_size_pretty(pg_total_relation_size(c.oid))::TEXT as table_size,
        (
            SELECT COUNT(*)::INTEGER
            FROM pg_indexes 
            WHERE tablename = t.table_name 
            AND schemaname = 'public'
        ) as index_count,
        CASE 
            WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name AND schemaname = 'public') >= 3 
            THEN 95
            WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name AND schemaname = 'public') >= 1 
            THEN 75
            ELSE 50
        END as performance_score
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.sql TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.analyze_database_performance TO anon, authenticated;

-- Success notification
DO $$
BEGIN
    RAISE NOTICE 'Database triggers and testing functions added successfully!';
    RAISE NOTICE '- Auto-update triggers: users, portfolio_holdings, news_articles, market_data';
    RAISE NOTICE '- Real-time notifications: market_update, news_update triggers';
    RAISE NOTICE '- SQL testing function: public.sql() with security restrictions';
    RAISE NOTICE '- Performance analysis: public.analyze_database_performance()';
    RAISE NOTICE '- All triggers respect existing table structure';
END $$;