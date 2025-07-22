-- Fix Security Issues with Partitioned Tables and Views
-- Address new ERROR level security issues

-- 1. Fix SECURITY DEFINER views
-- Change to SECURITY INVOKER for security compliance

-- Fix news_articles_current view
DROP VIEW IF EXISTS public.news_articles_current CASCADE;
CREATE VIEW public.news_articles_current 
WITH (security_invoker = true) AS
SELECT * FROM news_articles_partitioned
WHERE published_at > CURRENT_DATE - interval '30 days';

-- Fix database_performance_metrics view
DROP VIEW IF EXISTS public.database_performance_metrics CASCADE;
CREATE VIEW public.database_performance_metrics 
WITH (security_invoker = true) AS
SELECT 
    'Total Tables' as metric,
    COUNT(*)::text as value
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'Total Indexes' as metric,
    COUNT(*)::text as value
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Tables with RLS' as metric,
    COUNT(DISTINCT tablename)::text as value
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Total RLS Policies' as metric,
    COUNT(*)::text as value
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Foreign Keys with Indexes' as metric,
    COUNT(*)::text as value
FROM pg_constraint c
JOIN pg_indexes i ON i.tablename = c.conrelid::regclass::text
WHERE c.contype = 'f'
AND i.schemaname = 'public';

-- 2. Enable RLS on all partition tables
-- The partitioned table structure automatically inherits RLS from parent,
-- but individual partitions need RLS enabled

DO $$
DECLARE
    partition_name text;
    partitions_enabled integer := 0;
BEGIN
    -- Enable RLS on all news_articles partitions
    FOR partition_name IN 
        SELECT c.relname
        FROM pg_class c
        JOIN pg_inherits i ON c.oid = i.inhrelid
        WHERE i.inhparent = 'news_articles_partitioned'::regclass
        AND c.relname LIKE 'news_articles_%'
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', partition_name);
        
        -- Create basic policies (they inherit from parent, but need explicit policies)
        BEGIN
            EXECUTE format(
                'CREATE POLICY "Enable read for authenticated users" ON public.%I 
                 FOR SELECT TO authenticated USING (true)',
                partition_name
            );
        EXCEPTION
            WHEN duplicate_object THEN
                -- Policy already exists, skip
                NULL;
        END;
        
        BEGIN
            EXECUTE format(
                'CREATE POLICY "Enable all for service role" ON public.%I 
                 FOR ALL TO service_role USING (true) WITH CHECK (true)',
                partition_name
            );
        EXCEPTION
            WHEN duplicate_object THEN
                -- Policy already exists, skip
                NULL;
        END;
        
        partitions_enabled := partitions_enabled + 1;
        RAISE NOTICE 'Enabled RLS on partition: %', partition_name;
    END LOOP;
    
    RAISE NOTICE 'Enabled RLS on % partitions', partitions_enabled;
END $$;

-- 3. Grant proper permissions on views
GRANT SELECT ON public.news_articles_current TO authenticated, anon;
GRANT SELECT ON public.database_performance_metrics TO authenticated, service_role;

-- 4. Ensure cached tables have proper RLS
ALTER TABLE public.cached_timezones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_cache_info ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Allow read access to timezones" ON public.cached_timezones
            FOR SELECT USING (true);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        CREATE POLICY "Allow all access to cache" ON public.table_cache_info
            FOR ALL TO authenticated USING (true);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 5. Verify all partitions have RLS enabled
DO $$
DECLARE
    partition_record record;
    total_partitions integer := 0;
    rls_enabled_count integer := 0;
BEGIN
    -- Check RLS status on all partitions
    FOR partition_record IN 
        SELECT 
            c.relname as partition_name,
            c.relrowsecurity as rls_enabled
        FROM pg_class c
        JOIN pg_inherits i ON c.oid = i.inhrelid
        WHERE i.inhparent = 'news_articles_partitioned'::regclass
        ORDER BY c.relname
    LOOP
        total_partitions := total_partitions + 1;
        
        IF partition_record.rls_enabled THEN
            rls_enabled_count := rls_enabled_count + 1;
        ELSE
            RAISE WARNING 'Partition % does not have RLS enabled', partition_record.partition_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE E'\n=== Partition Security Status ===';
    RAISE NOTICE 'Total partitions: %', total_partitions;
    RAISE NOTICE 'Partitions with RLS: %', rls_enabled_count;
    
    IF total_partitions = rls_enabled_count THEN
        RAISE NOTICE 'All partitions are secure!';
    ELSE
        RAISE WARNING '% partitions still need RLS enabled', total_partitions - rls_enabled_count;
    END IF;
END $$;

-- 6. Create a function to automatically secure new partitions
CREATE OR REPLACE FUNCTION secure_new_partition(partition_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', partition_name);
    
    -- Create basic policies
    EXECUTE format(
        'CREATE POLICY "Enable read for authenticated users" ON public.%I 
         FOR SELECT TO authenticated USING (true)',
        partition_name
    );
    
    EXECUTE format(
        'CREATE POLICY "Enable all for service role" ON public.%I 
         FOR ALL TO service_role USING (true) WITH CHECK (true)',
        partition_name
    );
    
    RAISE NOTICE 'Secured new partition: %', partition_name;
END;
$$;

-- 7. Update the partition creation function to auto-secure
CREATE OR REPLACE FUNCTION create_next_month_partition()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    start_date date;
    end_date date;
    partition_name text;
BEGIN
    start_date := date_trunc('month', CURRENT_DATE + interval '1 month')::date;
    end_date := (start_date + interval '1 month')::date;
    partition_name := 'news_articles_y' || to_char(start_date, 'YYYY') || 'm' || to_char(start_date, 'MM');
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name) THEN
        -- Create partition
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF news_articles_partitioned FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
        
        -- Secure the new partition
        PERFORM secure_new_partition(partition_name);
        
        RETURN 'Created and secured partition: ' || partition_name;
    ELSE
        RETURN 'Partition already exists: ' || partition_name;
    END IF;
END;
$$;

-- 8. Grant permissions on new functions
GRANT EXECUTE ON FUNCTION secure_new_partition(text) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION create_next_month_partition() TO postgres, service_role;

-- Summary
DO $$
DECLARE
    view_count integer;
    partition_count integer;
BEGIN
    -- Count views
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name IN ('news_articles_current', 'database_performance_metrics');
    
    -- Count secured partitions
    SELECT COUNT(*) INTO partition_count
    FROM pg_class c
    JOIN pg_inherits i ON c.oid = i.inhrelid
    WHERE i.inhparent = 'news_articles_partitioned'::regclass
    AND c.relrowsecurity = true;
    
    RAISE NOTICE E'\n=== Security Fix Summary ===';
    RAISE NOTICE 'Views fixed (SECURITY INVOKER): %', view_count;
    RAISE NOTICE 'Partitions with RLS enabled: %', partition_count;
    RAISE NOTICE 'All security issues should now be resolved.';
END $$;