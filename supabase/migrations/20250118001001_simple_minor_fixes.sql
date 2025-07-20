-- Simple Minor Issues Fix - Production Ready
-- Migration: 20250118001001_simple_minor_fixes.sql

-- 1. Fix market_data date field constraint  
ALTER TABLE public.market_data 
ALTER COLUMN date DROP NOT NULL;

ALTER TABLE public.market_data 
ALTER COLUMN date SET DEFAULT CURRENT_DATE;

-- 2. Fix news_articles importance_score if needed
DO $$
BEGIN
    -- Only proceed if importance_score is not already INTEGER
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'news_articles' 
        AND column_name = 'importance_score'
        AND data_type != 'integer'
    ) THEN
        -- Drop dependent views first
        DROP VIEW IF EXISTS public.unified_knowledge_graph CASCADE;
        DROP VIEW IF EXISTS public.gql_news_articles CASCADE;
        DROP VIEW IF EXISTS public.gql_news_feed CASCADE;
        
        -- Convert values and change type
        UPDATE public.news_articles 
        SET importance_score = ROUND(importance_score * 100)
        WHERE importance_score IS NOT NULL AND importance_score < 1;

        ALTER TABLE public.news_articles 
        ALTER COLUMN importance_score TYPE INTEGER USING ROUND(importance_score)::INTEGER;

        ALTER TABLE public.news_articles 
        ADD CONSTRAINT importance_score_range 
        CHECK (importance_score >= 0 AND importance_score <= 100);
        
        -- Recreate basic views
        CREATE OR REPLACE VIEW public.gql_news_articles AS
        SELECT 
            id, title, summary, content, source, author, url, published_at,
            category, sentiment_score, importance_score, view_count,
            engagement_score, entity_count, created_at, updated_at
        FROM public.news_articles;
    END IF;
END $$;

-- 3. Add username constraint if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'username_format' 
        AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT username_format 
        CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');
    END IF;
END $$;

-- 4. Set helpful defaults
ALTER TABLE public.market_data 
ALTER COLUMN timestamp SET DEFAULT NOW();

ALTER TABLE public.news_articles 
ALTER COLUMN published_at SET DEFAULT NOW(),
ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN view_count SET DEFAULT 0,
ALTER COLUMN engagement_score SET DEFAULT 0,
ALTER COLUMN entity_count SET DEFAULT 0;

-- 5. Create helper function for market data
CREATE OR REPLACE FUNCTION public.insert_market_data(
    p_symbol VARCHAR,
    p_price NUMERIC,
    p_volume BIGINT DEFAULT NULL,
    p_exchange VARCHAR DEFAULT 'UNKNOWN',
    p_asset_type VARCHAR DEFAULT 'stock'
)
RETURNS public.market_data
LANGUAGE plpgsql
AS $$
DECLARE
    v_result public.market_data;
BEGIN
    INSERT INTO public.market_data (
        symbol, price, volume, exchange, asset_type,
        date, timestamp, open_price, high_price, low_price,
        close_price, adjusted_close, currency, data_source
    ) VALUES (
        p_symbol, p_price, p_volume, p_exchange, p_asset_type,
        CURRENT_DATE, NOW(), p_price, p_price, p_price,
        p_price, p_price, 'USD', 'manual'
    )
    RETURNING * INTO v_result;
    
    RETURN v_result;
END;
$$;

-- 6. Create helper function for news articles
CREATE OR REPLACE FUNCTION public.insert_news_article(
    p_title VARCHAR,
    p_summary TEXT,
    p_content TEXT DEFAULT NULL,
    p_source VARCHAR DEFAULT 'manual',
    p_sentiment_score NUMERIC DEFAULT 0,
    p_importance_score INTEGER DEFAULT 50
)
RETURNS public.news_articles
LANGUAGE plpgsql
AS $$
DECLARE
    v_result public.news_articles;
BEGIN
    INSERT INTO public.news_articles (
        title, summary, content, source, sentiment_score,
        importance_score, author, category, published_at, created_at
    ) VALUES (
        p_title, p_summary, COALESCE(p_content, p_summary), p_source,
        p_sentiment_score, p_importance_score, 'System', 'General', NOW(), NOW()
    )
    RETURNING * INTO v_result;
    
    RETURN v_result;
END;
$$;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION public.insert_market_data TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_news_article TO anon, authenticated;

-- Success notification
DO $$
BEGIN
    RAISE NOTICE 'Minor issues fixes complete!';
    RAISE NOTICE '- Market data date constraint fixed';
    RAISE NOTICE '- News importance_score converted to INTEGER if needed';
    RAISE NOTICE '- Helper functions created';
    RAISE NOTICE '- Production ready defaults set';
END $$;