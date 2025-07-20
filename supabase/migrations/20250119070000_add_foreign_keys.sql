-- Add Essential Foreign Key Constraints
-- Migration: 20250119070000_add_foreign_keys.sql

-- Add foreign keys for existing tables that reference users
DO $$
BEGIN
    -- portfolio_holdings -> users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_holdings') THEN
        ALTER TABLE public.portfolio_holdings 
        ADD CONSTRAINT fk_portfolio_holdings_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- agents -> users (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents') THEN
        ALTER TABLE public.agents 
        ADD CONSTRAINT fk_agents_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- user_tasks -> users (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_tasks') THEN
        ALTER TABLE public.user_tasks 
        ADD CONSTRAINT fk_user_tasks_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- price_alerts -> users (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'price_alerts') THEN
        ALTER TABLE public.price_alerts 
        ADD CONSTRAINT fk_price_alerts_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- notifications -> users (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE public.notifications 
        ADD CONSTRAINT fk_notifications_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- session_states -> users (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_states') THEN
        ALTER TABLE public.session_states 
        ADD CONSTRAINT fk_session_states_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- news_article_symbols -> news_articles (if both exist)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'news_article_symbols') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'news_articles') THEN
        ALTER TABLE public.news_article_symbols 
        ADD CONSTRAINT fk_news_article_symbols_news_article_id 
        FOREIGN KEY (news_article_id) REFERENCES public.news_articles(id) ON DELETE CASCADE;
    END IF;

    -- agent_capabilities -> agents (if both exist)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_capabilities') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents') THEN
        ALTER TABLE public.agent_capabilities 
        ADD CONSTRAINT fk_agent_capabilities_agent_id 
        FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;
    END IF;

    -- user_portfolios -> users (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_portfolios') THEN
        ALTER TABLE public.user_portfolios 
        ADD CONSTRAINT fk_user_portfolios_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- agent_interactions -> users (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_interactions') THEN
        ALTER TABLE public.agent_interactions 
        ADD CONSTRAINT fk_agent_interactions_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- process_executions -> users (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'process_executions') THEN
        ALTER TABLE public.process_executions 
        ADD CONSTRAINT fk_process_executions_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- audit_logs -> users (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        ALTER TABLE public.audit_logs 
        ADD CONSTRAINT fk_audit_logs_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- security_events -> users (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_events') THEN
        ALTER TABLE public.security_events 
        ADD CONSTRAINT fk_security_events_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- api_usage -> users (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_usage') THEN
        ALTER TABLE public.api_usage 
        ADD CONSTRAINT fk_api_usage_user_id 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    RAISE NOTICE 'Foreign key constraints added successfully!';
    
EXCEPTION 
    WHEN duplicate_object THEN
        RAISE NOTICE 'Some foreign key constraints already exist, skipping duplicates';
    WHEN OTHERS THEN
        RAISE NOTICE 'Some foreign key constraints could not be added: %', SQLERRM;
END $$;

-- Verify foreign key count
DO $$
DECLARE
    fk_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public';
    
    RAISE NOTICE 'Total foreign key constraints: %', fk_count;
END $$;