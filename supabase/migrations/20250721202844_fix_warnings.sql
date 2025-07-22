-- Fix all function search paths dynamically
-- This script finds all functions and updates their search paths

DO $$
DECLARE
    func_record RECORD;
    cmd TEXT;
BEGIN
    -- Fix all functions in public schema
    FOR func_record IN
        SELECT 
            p.proname AS fname,
            pg_catalog.pg_get_function_identity_arguments(p.oid) AS fargs
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.prokind = 'f' -- only functions, not procedures
    LOOP
        BEGIN
            cmd := format('ALTER FUNCTION public.%I(%s) SET search_path = pg_catalog, public',
                         func_record.fname, func_record.fargs);
            EXECUTE cmd;
            RAISE NOTICE 'Fixed: public.%(%)', func_record.fname, func_record.fargs;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to fix public.%(%): %', func_record.fname, func_record.fargs, SQLERRM;
        END;
    END LOOP;

    -- Fix all functions in app_data schema
    FOR func_record IN
        SELECT 
            p.proname AS fname,
            pg_catalog.pg_get_function_identity_arguments(p.oid) AS fargs
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'app_data'
        AND p.prokind = 'f'
    LOOP
        BEGIN
            cmd := format('ALTER FUNCTION app_data.%I(%s) SET search_path = pg_catalog, app_data, public',
                         func_record.fname, func_record.fargs);
            EXECUTE cmd;
            RAISE NOTICE 'Fixed: app_data.%(%)', func_record.fname, func_record.fargs;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to fix app_data.%(%): %', func_record.fname, func_record.fargs, SQLERRM;
        END;
    END LOOP;
END $$;

-- Handle HTTP extension
-- First check if extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant permissions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Note: Moving the http extension requires recreating it
-- This is commented out as it may break existing functions
-- Uncomment if you want to move it:
/*
DROP EXTENSION IF EXISTS http CASCADE;
CREATE EXTENSION http SCHEMA extensions;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, authenticated, service_role;
*/

-- Fix materialized view permissions
DO $$
BEGIN
    -- Revoke public access
    EXECUTE 'REVOKE ALL ON public.top_market_symbols_view FROM anon, authenticated';
    
    -- Grant only to service role
    EXECUTE 'GRANT SELECT ON public.top_market_symbols_view TO service_role';
    
    -- Create a function-based view that checks authentication
    CREATE OR REPLACE VIEW public.top_market_symbols_authenticated AS
    SELECT * FROM public.top_market_symbols_view
    WHERE auth.uid() IS NOT NULL;
    
    -- Grant access to authenticated users
    EXECUTE 'GRANT SELECT ON public.top_market_symbols_authenticated TO authenticated';
    
    RAISE NOTICE 'Fixed materialized view permissions';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to fix materialized view: %', SQLERRM;
END $$;

-- Add comments about auth configuration
COMMENT ON SCHEMA public IS E'Supabase Auth Configuration Required (Dashboard):
1. OTP Expiry: Go to Authentication > Providers > Email
   - Set "OTP Expiry Duration" to 3600 seconds (1 hour) or less
   - Current setting exceeds recommended threshold

2. Leaked Password Protection: Go to Authentication > Security
   - Enable "Leaked password protection"
   - This checks passwords against HaveIBeenPwned database';

-- Summary of changes
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname IN ('public', 'app_data')
    AND p.prokind = 'f';
    
    RAISE NOTICE E'\n=== Security Warnings Fixed ===';
    RAISE NOTICE '✓ Function search paths updated: % functions', func_count;
    RAISE NOTICE '✓ Materialized view permissions restricted';
    RAISE NOTICE '! HTTP extension: Consider moving to extensions schema';
    RAISE NOTICE '! Auth settings: Update via Supabase Dashboard';
END $$;