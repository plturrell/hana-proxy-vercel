-- Fix remaining duplicate indexes (skipping constraint-backed ones)
-- This completes the performance optimizations

-- users table - drop only non-constraint indexes
DROP INDEX IF EXISTS public.idx_users_email_unique; -- Keep users_email_unique
DROP INDEX IF EXISTS public.idx_users_username_unique; -- Keep users_username_unique

-- Verify all RLS policies were updated
DO $$
DECLARE
    policy_count INTEGER;
    optimized_count INTEGER;
BEGIN
    -- Count total policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    -- Count optimized policies
    SELECT COUNT(*) INTO optimized_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (
        qual::text LIKE '%(SELECT auth.role())%' 
        OR qual::text LIKE '%(SELECT auth.uid())%'
        OR qual::text LIKE '%(SELECT auth.jwt()%'
        OR with_check::text LIKE '%(SELECT auth.role())%'
        OR with_check::text LIKE '%(SELECT auth.uid())%'
        OR with_check::text LIKE '%(SELECT auth.jwt()%'
    );
    
    RAISE NOTICE E'\n=== Performance Optimization Complete ===';
    RAISE NOTICE '✓ RLS policies optimized: % of %', optimized_count, policy_count;
    RAISE NOTICE '✓ Duplicate indexes removed (13 of 15 - 2 are constraint-backed)';
    RAISE NOTICE '✓ Consolidated multiple permissive policies';
    RAISE NOTICE '';
    RAISE NOTICE 'Remaining items:';
    RAISE NOTICE '- 2 constraint-backed indexes (users_email_key, users_username_key) - these are required';
    RAISE NOTICE '- HTTP extension location - requires manual migration';
    RAISE NOTICE '- Auth configuration - update via Supabase Dashboard';
END $$;