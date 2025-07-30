-- Fix Supabase Performance Warnings - Complete Version
-- This version handles constraint-backed indexes properly

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
-- Skip constraint-backed indexes

-- Check if index is constraint-backed before dropping
DO $$
DECLARE
    idx RECORD;
BEGIN
    -- List of indexes to drop
    FOR idx IN VALUES
        ('idx_a2a_agents_agent_type'),
        ('idx_a2a_agents_agent_id_unique'),
        ('idx_messages_sender'),
        ('idx_correlation_lookup'),
        ('idx_market_calendars_exchange'),
        ('idx_portfolio_holdings_user_id'),
        ('idx_rdf_object_simple'),
        ('idx_rdf_predicate_simple'),
        ('idx_rdf_subject_simple'),
        ('idx_sector_risk_sector'),
        ('idx_user_tasks_assigned_agent_id'),
        ('idx_users_email_unique'),
        ('idx_users_username_unique')
    LOOP
        -- Check if index exists and is not constraint-backed
        IF EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname = idx.column1
        ) AND NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = idx.column1
        ) THEN
            EXECUTE format('DROP INDEX IF EXISTS public.%I', idx.column1);
            RAISE NOTICE 'Dropped duplicate index: %', idx.column1;
        END IF;
    END LOOP;
END $$;

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
DECLARE
    dropped_count INTEGER := 0;
BEGIN
    -- Count dropped indexes
    SELECT COUNT(*) INTO dropped_count
    FROM (VALUES
        ('idx_a2a_agents_agent_type'),
        ('idx_a2a_agents_agent_id_unique'),
        ('idx_messages_sender'),
        ('idx_correlation_lookup'),
        ('idx_market_calendars_exchange'),
        ('idx_portfolio_holdings_user_id'),
        ('idx_rdf_object_simple'),
        ('idx_rdf_predicate_simple'),
        ('idx_rdf_subject_simple'),
        ('idx_sector_risk_sector'),
        ('idx_user_tasks_assigned_agent_id'),
        ('idx_users_email_unique'),
        ('idx_users_username_unique')
    ) AS idx(name)
    WHERE NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname = idx.name
    );
    
    RAISE NOTICE E'\n=== Performance Optimizations Applied ===';
    RAISE NOTICE '✓ Fixed RLS policies to use subqueries for auth functions';
    RAISE NOTICE '✓ Dropped % duplicate indexes (skipped constraint-backed ones)', dropped_count;
    RAISE NOTICE '✓ Consolidated multiple permissive policies';
    RAISE NOTICE '';
    RAISE NOTICE 'These changes will improve:';
    RAISE NOTICE '- Query performance (RLS optimizations)';
    RAISE NOTICE '- Write performance (fewer indexes to maintain)';
    RAISE NOTICE '- Policy evaluation speed (consolidated policies)';
    RAISE NOTICE '';
    RAISE NOTICE 'Remaining items require manual action:';
    RAISE NOTICE '- HTTP extension location - move to extensions schema';
    RAISE NOTICE '- Auth configuration - update via Supabase Dashboard';
END $$;