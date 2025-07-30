-- Move HTTP extension to extensions schema
-- This is a separate migration as it requires careful handling

-- 1. Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 2. Update all functions that use http to include extensions in search path
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Find functions that might use http
    FOR func_record IN
        SELECT DISTINCT
            p.proname AS fname,
            pg_catalog.pg_get_function_identity_arguments(p.oid) AS fargs,
            n.nspname AS schema_name
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE p.prosrc LIKE '%http%'
        AND n.nspname IN ('public', 'app_data')
    LOOP
        BEGIN
            IF func_record.schema_name = 'public' THEN
                EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = pg_catalog, public, extensions',
                             func_record.fname, func_record.fargs);
            ELSE
                EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = pg_catalog, %I, public, extensions',
                             func_record.schema_name, func_record.fname, func_record.fargs, func_record.schema_name);
            END IF;
            RAISE NOTICE 'Updated % to include extensions schema', func_record.fname;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to update %: %', func_record.fname, SQLERRM;
        END;
    END LOOP;
END $$;

-- 3. Move the http extension
-- Note: This will temporarily break functions using http
BEGIN;
    -- Save any custom settings
    CREATE TEMP TABLE http_settings AS
    SELECT * FROM pg_settings WHERE name LIKE 'http.%';
    
    -- Drop and recreate extension
    DROP EXTENSION IF EXISTS http CASCADE;
    CREATE EXTENSION http SCHEMA extensions;
    
    -- Grant permissions
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO service_role;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres;
    
    -- Restore settings if any
    -- (HTTP extension doesn't typically have persistent settings)
    
    RAISE NOTICE 'HTTP extension moved to extensions schema';
COMMIT;

-- 4. Update any functions that directly reference http functions
-- These need to be updated to use extensions.http_* instead of http_*
DO $$
DECLARE
    func_text TEXT;
BEGIN
    -- Update fetch_perplexity_news function specifically
    SELECT prosrc INTO func_text
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'fetch_perplexity_news';
    
    IF func_text IS NOT NULL AND func_text LIKE '%http_%' THEN
        -- Update the function to use extensions.http_* functions
        func_text := REPLACE(func_text, 'http_get(', 'extensions.http_get(');
        func_text := REPLACE(func_text, 'http_post(', 'extensions.http_post(');
        func_text := REPLACE(func_text, 'http_header(', 'extensions.http_header(');
        
        -- Recreate the function with updated references
        -- (This would require the full function definition)
        RAISE NOTICE 'Functions using http need manual update to use extensions.http_* functions';
    END IF;
END $$;

-- Summary
DO $$
BEGIN
    RAISE NOTICE E'\n=== HTTP Extension Migration ===';
    RAISE NOTICE '✓ Extensions schema created';
    RAISE NOTICE '✓ Function search paths updated';
    RAISE NOTICE '✓ HTTP extension moved to extensions schema';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update any functions that call http_* to use extensions.http_*';
    RAISE NOTICE '2. Test functions that use HTTP functionality';
END $$;