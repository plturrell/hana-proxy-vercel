-- Fix All User ID Type Mismatches
-- Migration: 20250719050002_fix_all_user_id_types.sql

DO $$
DECLARE
    v_table_name text;
    v_tables text[] := ARRAY[
        'portfolio_holdings',
        'calculation_results',
        'settings'
    ];
BEGIN
    -- Fix existing tables with wrong user_id type
    FOREACH v_table_name IN ARRAY v_tables
    LOOP
        -- Check if table exists and has user_id column
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = v_table_name 
            AND column_name = 'user_id'
        ) THEN
            -- Drop the column if it's UUID type
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = v_table_name 
                AND column_name = 'user_id' 
                AND data_type = 'uuid'
            ) THEN
                EXECUTE format('ALTER TABLE public.%I DROP COLUMN user_id CASCADE', v_table_name);
                RAISE NOTICE 'Dropped UUID user_id from %', v_table_name;
            END IF;
        END IF;
        
        -- Add user_id column with correct type
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = v_table_name 
            AND column_name = 'user_id'
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN user_id BIGINT', v_table_name);
            RAISE NOTICE 'Added BIGINT user_id to %', v_table_name;
        END IF;
    END LOOP;
END $$;

-- Now add all foreign key constraints

-- 1. Portfolio Holdings
ALTER TABLE public.portfolio_holdings 
    ADD CONSTRAINT fk_portfolio_user 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(id) 
    ON DELETE CASCADE;

-- 2. Calculation Results  
ALTER TABLE public.calculation_results
    ADD CONSTRAINT fk_calculation_user
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;

-- 3. Settings
ALTER TABLE public.settings
    ADD CONSTRAINT fk_settings_user
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;

-- 4. RDF Triples - Article reference
DO $$
BEGIN
    -- Check if source_article_id exists with wrong type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rdf_triples' 
        AND column_name = 'source_article_id'
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.rdf_triples DROP COLUMN source_article_id CASCADE;
    END IF;
    
    -- Add column with correct type
    ALTER TABLE public.rdf_triples ADD COLUMN IF NOT EXISTS source_article_id BIGINT;
    
    -- Add constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_rdf_article'
    ) THEN
        ALTER TABLE public.rdf_triples
            ADD CONSTRAINT fk_rdf_article
            FOREIGN KEY (source_article_id)
            REFERENCES public.news_articles(id)
            ON DELETE CASCADE;
    END IF;
END $$;

-- 5. A2A Agents to Base Agents
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'a2a_agents' 
        AND column_name = 'base_agent_id'
    ) THEN
        ALTER TABLE public.a2a_agents
            ADD CONSTRAINT fk_a2a_base_agent
            FOREIGN KEY (base_agent_id)
            REFERENCES public.agents(id)
            ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not add a2a_agents constraint: %', SQLERRM;
END $$;

-- 6. Industries to Sectors
ALTER TABLE public.industries
    ADD CONSTRAINT fk_industry_sector
    FOREIGN KEY (sector_code)
    REFERENCES public.sectors(code)
    ON DELETE RESTRICT;

-- 7. Countries to Currencies
ALTER TABLE public.countries
    ADD CONSTRAINT fk_country_currency
    FOREIGN KEY (currency_code)
    REFERENCES public.currencies(code)
    ON DELETE RESTRICT;

-- 8. Market Calendars to Exchanges
ALTER TABLE public.market_calendars
    ADD CONSTRAINT fk_calendar_exchange
    FOREIGN KEY (exchange_code)
    REFERENCES public.exchanges(code)
    ON DELETE CASCADE;

-- 9. Holidays to Countries
ALTER TABLE public.holidays
    ADD CONSTRAINT fk_holiday_country
    FOREIGN KEY (country_code)
    REFERENCES public.countries(code)
    ON DELETE CASCADE;

-- Create junction tables for many-to-many relationships

-- 10. News Article Symbols
CREATE TABLE IF NOT EXISTS public.news_article_symbols (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id BIGINT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    relevance_score DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_news_symbol_article
        FOREIGN KEY (article_id)
        REFERENCES public.news_articles(id)
        ON DELETE CASCADE,
    UNIQUE(article_id, symbol)
);

-- 11. Agent Capabilities
CREATE TABLE IF NOT EXISTS public.agent_capabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL,
    capability VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_capability_agent
        FOREIGN KEY (agent_id)
        REFERENCES public.agents(id)
        ON DELETE CASCADE,
    UNIQUE(agent_id, capability)
);

-- 12. User Portfolios
CREATE TABLE IF NOT EXISTS public.user_portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT NOT NULL,
    portfolio_name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_portfolio_owner
        FOREIGN KEY (user_id)
        REFERENCES public.users(id)
        ON DELETE CASCADE,
    UNIQUE(user_id, portfolio_name)
);

-- Add portfolio reference to holdings
ALTER TABLE public.portfolio_holdings
    ADD COLUMN IF NOT EXISTS portfolio_id UUID,
    ADD CONSTRAINT fk_holding_portfolio
        FOREIGN KEY (portfolio_id)
        REFERENCES public.user_portfolios(id)
        ON DELETE CASCADE;

-- Create all indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user ON public.portfolio_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_calculation_results_user ON public.calculation_results(user_id);
CREATE INDEX IF NOT EXISTS idx_rdf_triples_article ON public.rdf_triples(source_article_id);
CREATE INDEX IF NOT EXISTS idx_industries_sector ON public.industries(sector_code);
CREATE INDEX IF NOT EXISTS idx_countries_currency ON public.countries(currency_code);
CREATE INDEX IF NOT EXISTS idx_calendars_exchange ON public.market_calendars(exchange_code);
CREATE INDEX IF NOT EXISTS idx_holidays_country ON public.holidays(country_code);
CREATE INDEX IF NOT EXISTS idx_settings_user ON public.settings(user_id);
CREATE INDEX IF NOT EXISTS idx_news_symbols_article ON public.news_article_symbols(article_id);
CREATE INDEX IF NOT EXISTS idx_agent_caps_agent ON public.agent_capabilities(agent_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_user ON public.user_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio ON public.portfolio_holdings(portfolio_id);

-- Success notification
DO $$
DECLARE
    fk_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public';
    
    RAISE NOTICE 'Foreign key constraints fixed and added. Total FK constraints: %', fk_count;
END $$;