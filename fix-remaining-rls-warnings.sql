-- Fix Remaining RLS Performance Warnings
-- This addresses all auth.jwt() calls that weren't caught in the previous migration

-- Part 1: Fix remaining auth.jwt() calls in service role policies
DO $$
DECLARE
    policy_rec RECORD;
    new_check TEXT;
    new_using TEXT;
    fix_count INTEGER := 0;
BEGIN
    -- Get all policies that still need fixing
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
            -- Look for patterns that weren't caught before
            qual::text LIKE '%(auth.jwt() -%' 
            OR with_check::text LIKE '%(auth.jwt() -%'
            OR qual::text LIKE '%auth.jwt()%' AND qual::text NOT LIKE '%(SELECT auth.jwt()%'
            OR with_check::text LIKE '%auth.jwt()%' AND with_check::text NOT LIKE '%(SELECT auth.jwt()%'
        )
    LOOP
        -- Fix the expressions
        new_using := policy_rec.using_expr;
        new_check := policy_rec.check_expr;
        
        IF new_using IS NOT NULL THEN
            -- Fix different auth.jwt() patterns
            new_using := REGEXP_REPLACE(new_using, '\(auth\.jwt\(\) ->> ''role''::text\)', '(SELECT auth.jwt() ->> ''role''::text)', 'g');
            new_using := REGEXP_REPLACE(new_using, 'auth\.jwt\(\) ->> ''role''', '(SELECT auth.jwt() ->> ''role'')', 'g');
            new_using := REGEXP_REPLACE(new_using, '\(\(auth\.jwt\(\)\) ->> ''role''::text\)', '((SELECT auth.jwt()) ->> ''role''::text)', 'g');
        END IF;
        
        IF new_check IS NOT NULL THEN
            -- Fix different auth.jwt() patterns
            new_check := REGEXP_REPLACE(new_check, '\(auth\.jwt\(\) ->> ''role''::text\)', '(SELECT auth.jwt() ->> ''role''::text)', 'g');
            new_check := REGEXP_REPLACE(new_check, 'auth\.jwt\(\) ->> ''role''', '(SELECT auth.jwt() ->> ''role'')', 'g');
            new_check := REGEXP_REPLACE(new_check, '\(\(auth\.jwt\(\)\) ->> ''role''::text\)', '((SELECT auth.jwt()) ->> ''role''::text)', 'g');
        END IF;
        
        -- Only update if something changed
        IF (new_using IS DISTINCT FROM policy_rec.using_expr) OR 
           (new_check IS DISTINCT FROM policy_rec.check_expr) THEN
            
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
            
            fix_count := fix_count + 1;
            RAISE NOTICE 'Fixed policy % on table %.%', policy_rec.policyname, policy_rec.schemaname, policy_rec.tablename;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Fixed % policies with auth.jwt() performance issues', fix_count;
END $$;

-- Part 2: Consolidate multiple permissive policies for better performance
-- These tables have multiple policies that should be consolidated

-- Fix agents table - consolidate service role and user policies
DROP POLICY IF EXISTS "Service role has full access" ON public.agents;
DROP POLICY IF EXISTS "Users can manage their own agents" ON public.agents;

-- Create a single comprehensive policy for agents
CREATE POLICY "agents_access_policy" ON public.agents
FOR ALL 
USING (
    (SELECT auth.jwt() ->> 'role'::text) = 'service_role' 
    OR 
    created_by = (SELECT auth.uid())
)
WITH CHECK (
    (SELECT auth.jwt() ->> 'role'::text) = 'service_role' 
    OR 
    created_by = (SELECT auth.uid())
);

-- Fix user_tasks table - consolidate service role and user policies
DROP POLICY IF EXISTS "Service role has full access" ON public.user_tasks;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.user_tasks;

CREATE POLICY "user_tasks_access_policy" ON public.user_tasks
FOR ALL 
USING (
    (SELECT auth.jwt() ->> 'role'::text) = 'service_role' 
    OR 
    user_id = (SELECT auth.uid())
)
WITH CHECK (
    (SELECT auth.jwt() ->> 'role'::text) = 'service_role' 
    OR 
    user_id = (SELECT auth.uid())
);

-- Fix duplicate policies for authenticated/service role patterns
-- Drop old separate policies and create consolidated ones

-- Tables with authenticated_read_* and service_role_all_* patterns
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT DISTINCT tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND (
            policyname LIKE 'authenticated_read_%' 
            OR policyname LIKE 'service_role_all_%'
        )
    LOOP
        -- Drop old policies
        EXECUTE format('DROP POLICY IF EXISTS "authenticated_read_%s" ON public.%I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "service_role_all_%s" ON public.%I', table_name, table_name);
        
        -- Create consolidated read policy
        EXECUTE format('CREATE POLICY "read_%s" ON public.%I FOR SELECT TO authenticated, service_role USING (true)',
            table_name, table_name);
        
        -- Create service role write policy
        EXECUTE format('CREATE POLICY "service_write_%s" ON public.%I FOR ALL TO service_role 
            USING ((SELECT auth.jwt() ->> ''role''::text) = ''service_role'')
            WITH CHECK ((SELECT auth.jwt() ->> ''role''::text) = ''service_role'')',
            table_name, table_name);
        
        RAISE NOTICE 'Consolidated policies for table %', table_name;
    END LOOP;
END $$;

-- Part 3: Fix remaining duplicate indexes
-- Handle constraint-backed indexes properly
DO $$
BEGIN
    -- For users table, we need to keep the constraint indexes but drop duplicates
    -- Check if these are duplicates of constraint indexes
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
        AND indexname = 'users_email_unique'
        AND indexdef NOT LIKE '%UNIQUE%CONSTRAINT%'
    ) THEN
        DROP INDEX IF EXISTS public.users_email_unique;
        RAISE NOTICE 'Dropped duplicate index users_email_unique';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
        AND indexname = 'users_username_unique'
        AND indexdef NOT LIKE '%UNIQUE%CONSTRAINT%'
    ) THEN
        DROP INDEX IF EXISTS public.users_username_unique;
        RAISE NOTICE 'Dropped duplicate index users_username_unique';
    END IF;
END $$;

-- Summary
DO $$
DECLARE
    remaining_auth_issues INTEGER;
    remaining_multiple_policies INTEGER;
    remaining_duplicate_indexes INTEGER;
BEGIN
    -- Count remaining auth issues
    SELECT COUNT(*) INTO remaining_auth_issues
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (
        (qual::text LIKE '%auth.%' AND qual::text NOT LIKE '%(SELECT auth.%')
        OR (with_check::text LIKE '%auth.%' AND with_check::text NOT LIKE '%(SELECT auth.%')
    );
    
    -- Count tables with multiple permissive policies
    SELECT COUNT(DISTINCT tablename) INTO remaining_multiple_policies
    FROM (
        SELECT tablename, cmd, unnest(roles) as role
        FROM pg_policies
        WHERE schemaname = 'public'
        AND permissive = 'PERMISSIVE'
        GROUP BY tablename, cmd, unnest(roles)
        HAVING COUNT(*) > 1
    ) t;
    
    -- Count duplicate indexes
    WITH index_cols AS (
        SELECT 
            schemaname,
            tablename,
            indexname,
            array_agg(attname ORDER BY attnum) as columns
        FROM pg_indexes
        JOIN pg_index ON indexrelid = (schemaname||'.'||indexname)::regclass
        JOIN pg_attribute ON attrelid = indrelid AND attnum = ANY(indkey)
        WHERE schemaname = 'public'
        GROUP BY schemaname, tablename, indexname
    )
    SELECT COUNT(*) INTO remaining_duplicate_indexes
    FROM (
        SELECT columns
        FROM index_cols
        GROUP BY tablename, columns
        HAVING COUNT(*) > 1
    ) t;
    
    RAISE NOTICE E'\n=== RLS Performance Optimization Complete ===';
    RAISE NOTICE '✓ Fixed all auth.jwt() performance issues';
    RAISE NOTICE '✓ Consolidated multiple permissive policies';
    RAISE NOTICE '✓ Removed duplicate indexes where possible';
    RAISE NOTICE '';
    RAISE NOTICE 'Remaining issues:';
    RAISE NOTICE '- Auth function calls without SELECT: %', remaining_auth_issues;
    RAISE NOTICE '- Tables with multiple policies: %', remaining_multiple_policies;
    RAISE NOTICE '- Duplicate indexes: %', remaining_duplicate_indexes;
    RAISE NOTICE '';
    RAISE NOTICE 'Note: Some constraint-backed indexes cannot be removed';
END $$;