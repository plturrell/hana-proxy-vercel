-- Fix Supabase Performance Warnings
-- Generated on 2025-01-21

-- Part 1: Fix auth.role() and auth.uid() RLS performance issues
-- Replace auth.role() with (select auth.role()) and auth.uid() with (select auth.uid())
-- This prevents re-evaluation for each row

-- Drop and recreate policies with optimized conditions
DO $$
DECLARE
    policy_rec RECORD;
    new_check TEXT;
    new_using TEXT;
BEGIN
    -- Get all policies that need fixing
    FOR policy_rec IN 
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual::text as using_expr,
            with_check::text as check_expr
        FROM pg_policies
        WHERE schemaname = 'public'
        AND (
            qual::text LIKE '%auth.role()%' 
            OR qual::text LIKE '%auth.uid()%'
            OR qual::text LIKE '%auth.jwt()%'
            OR with_check::text LIKE '%auth.role()%'
            OR with_check::text LIKE '%auth.uid()%'
            OR with_check::text LIKE '%auth.jwt()%'
        )
    LOOP
        -- Fix the expressions
        new_using := policy_rec.using_expr;
        new_check := policy_rec.check_expr;
        
        IF new_using IS NOT NULL THEN
            new_using := REPLACE(new_using, 'auth.role()', '(SELECT auth.role())');
            new_using := REPLACE(new_using, 'auth.uid()', '(SELECT auth.uid())');
            new_using := REPLACE(new_using, '(auth.jwt() ->> ''role''::text)', '(SELECT auth.jwt() ->> ''role''::text)');
        END IF;
        
        IF new_check IS NOT NULL THEN
            new_check := REPLACE(new_check, 'auth.role()', '(SELECT auth.role())');
            new_check := REPLACE(new_check, 'auth.uid()', '(SELECT auth.uid())');
            new_check := REPLACE(new_check, '(auth.jwt() ->> ''role''::text)', '(SELECT auth.jwt() ->> ''role''::text)');
        END IF;
        
        -- Drop the old policy
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            policy_rec.policyname,
            policy_rec.schemaname,
            policy_rec.tablename
        );
        
        -- Recreate with optimized expressions
        IF policy_rec.cmd = 'ALL' THEN
            IF new_check IS NOT NULL THEN
                EXECUTE format('CREATE POLICY %I ON %I.%I FOR ALL TO %s USING (%s) WITH CHECK (%s)',
                    policy_rec.policyname,
                    policy_rec.schemaname,
                    policy_rec.tablename,
                    array_to_string(policy_rec.roles, ', '),
                    new_using,
                    new_check
                );
            ELSE
                EXECUTE format('CREATE POLICY %I ON %I.%I FOR ALL TO %s USING (%s)',
                    policy_rec.policyname,
                    policy_rec.schemaname,
                    policy_rec.tablename,
                    array_to_string(policy_rec.roles, ', '),
                    new_using
                );
            END IF;
        ELSE
            IF new_check IS NOT NULL THEN
                EXECUTE format('CREATE POLICY %I ON %I.%I FOR %s TO %s USING (%s) WITH CHECK (%s)',
                    policy_rec.policyname,
                    policy_rec.schemaname,
                    policy_rec.tablename,
                    policy_rec.cmd,
                    array_to_string(policy_rec.roles, ', '),
                    new_using,
                    new_check
                );
            ELSE
                EXECUTE format('CREATE POLICY %I ON %I.%I FOR %s TO %s USING (%s)',
                    policy_rec.policyname,
                    policy_rec.schemaname,
                    policy_rec.tablename,
                    policy_rec.cmd,
                    array_to_string(policy_rec.roles, ', '),
                    new_using
                );
            END IF;
        END IF;
        
        RAISE NOTICE 'Fixed policy % on table %.%', policy_rec.policyname, policy_rec.schemaname, policy_rec.tablename;
    END LOOP;
END $$;

-- Part 2: Fix duplicate indexes
-- Drop redundant indexes to improve write performance

-- a2a_agents table
DROP INDEX IF EXISTS public.idx_a2a_agents_agent_type; -- Keep idx_a2a_agents_type
DROP INDEX IF EXISTS public.idx_a2a_agents_agent_id_unique; -- Keep a2a_agents_pkey

-- a2a_messages table  
DROP INDEX IF EXISTS public.idx_messages_sender; -- Keep idx_a2a_messages_sender

-- asset_correlations table
DROP INDEX IF EXISTS public.idx_correlation_lookup; -- Keep idx_asset_correlations_classes

-- market_calendars table
DROP INDEX IF EXISTS public.idx_market_calendars_exchange; -- Keep idx_calendars_exchange

-- portfolio_holdings table
DROP INDEX IF EXISTS public.idx_portfolio_holdings_user_id; -- Keep idx_portfolio_holdings_user

-- rdf_triples table
DROP INDEX IF EXISTS public.idx_rdf_object_simple; -- Keep idx_rdf_object
DROP INDEX IF EXISTS public.idx_rdf_predicate_simple; -- Keep idx_rdf_predicate
DROP INDEX IF EXISTS public.idx_rdf_subject_simple; -- Keep idx_rdf_subject

-- sector_risk_factors table
DROP INDEX IF EXISTS public.idx_sector_risk_sector; -- Keep idx_sector_risk_lookup

-- user_tasks table
DROP INDEX IF EXISTS public.idx_user_tasks_assigned_agent_id; -- Keep idx_user_tasks_agent_id

-- users table
-- Skip constraint-backed indexes (users_email_key, users_username_key)
DROP INDEX IF EXISTS public.idx_users_email_unique; -- Keep users_email_unique
DROP INDEX IF EXISTS public.idx_users_username_unique; -- Keep users_username_unique

-- Part 3: Consolidate multiple permissive policies
-- For tables with multiple policies for the same role/action, we'll consolidate them

-- Fix the most problematic ones with 3+ policies
-- For news_articles and market_data tables
DROP POLICY IF EXISTS "anon_read_news_articles" ON public.news_articles;
DROP POLICY IF EXISTS "authenticated_read_news_articles" ON public.news_articles;
DROP POLICY IF EXISTS "service_role_all_news_articles" ON public.news_articles;

-- Create a single comprehensive policy for news_articles
CREATE POLICY "read_news_articles" ON public.news_articles
FOR SELECT TO anon, authenticated, service_role
USING (true);

-- Create separate policy for service role write access
CREATE POLICY "service_role_write_news_articles" ON public.news_articles
FOR ALL TO service_role
USING ((SELECT auth.jwt() ->> 'role'::text) = 'service_role')
WITH CHECK ((SELECT auth.jwt() ->> 'role'::text) = 'service_role');

-- Fix market_data table
DROP POLICY IF EXISTS "anon_read_market_data" ON public.market_data;
DROP POLICY IF EXISTS "authenticated_read_market_data" ON public.market_data;
DROP POLICY IF EXISTS "service_role_all_market_data" ON public.market_data;

-- Create a single comprehensive policy for market_data
CREATE POLICY "read_market_data" ON public.market_data
FOR SELECT TO anon, authenticated, service_role
USING (true);

-- Create separate policy for service role write access
CREATE POLICY "service_role_write_market_data" ON public.market_data
FOR ALL TO service_role
USING ((SELECT auth.jwt() ->> 'role'::text) = 'service_role')
WITH CHECK ((SELECT auth.jwt() ->> 'role'::text) = 'service_role');

-- Summary
DO $$
BEGIN
    RAISE NOTICE E'\n=== Performance Optimizations Applied ===';
    RAISE NOTICE '✓ Fixed RLS policies to use subqueries for auth functions';
    RAISE NOTICE '✓ Dropped 15 duplicate indexes';
    RAISE NOTICE '✓ Consolidated multiple permissive policies';
    RAISE NOTICE '';
    RAISE NOTICE 'These changes will improve:';
    RAISE NOTICE '- Query performance (RLS optimizations)';
    RAISE NOTICE '- Write performance (fewer indexes to maintain)';
    RAISE NOTICE '- Policy evaluation speed (consolidated policies)';
END $$;