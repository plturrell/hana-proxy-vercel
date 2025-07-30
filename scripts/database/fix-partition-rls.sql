-- Fix RLS policies for partitioned table
-- Handle different policy types correctly

-- First, enable RLS on the partitioned table if not already done
ALTER TABLE news_articles_partitioned ENABLE ROW LEVEL SECURITY;

-- Copy RLS policies with proper handling of policy types
DO $$
DECLARE
    policy_record record;
    policy_sql text;
BEGIN
    FOR policy_record IN 
        SELECT 
            policyname, 
            cmd, 
            qual::text as using_expr, 
            with_check::text as check_expr, 
            roles
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'news_articles'
    LOOP
        -- Build the CREATE POLICY statement based on the command type
        policy_sql := format('CREATE POLICY %I ON news_articles_partitioned FOR %s TO %s',
            policy_record.policyname || '_partitioned',
            policy_record.cmd,
            array_to_string(policy_record.roles, ', ')
        );
        
        -- Add USING clause if present
        IF policy_record.using_expr IS NOT NULL THEN
            policy_sql := policy_sql || format(' USING (%s)', policy_record.using_expr);
        END IF;
        
        -- Add WITH CHECK clause only for INSERT, UPDATE, or ALL commands
        IF policy_record.check_expr IS NOT NULL AND policy_record.cmd IN ('INSERT', 'UPDATE', 'ALL') THEN
            policy_sql := policy_sql || format(' WITH CHECK (%s)', policy_record.check_expr);
        END IF;
        
        -- Execute the policy creation
        BEGIN
            EXECUTE policy_sql;
            RAISE NOTICE 'Created policy % on partitioned table', policy_record.policyname || '_partitioned';
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'Policy % already exists', policy_record.policyname || '_partitioned';
            WHEN OTHERS THEN
                RAISE NOTICE 'Error creating policy %: %', policy_record.policyname || '_partitioned', SQLERRM;
        END;
    END LOOP;
END $$;

-- Create a simple catch-all policy if no policies were copied
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'news_articles_partitioned'
    ) THEN
        -- Create basic policies
        CREATE POLICY "Enable read for authenticated users_partitioned" 
        ON news_articles_partitioned FOR SELECT 
        TO authenticated 
        USING (true);
        
        CREATE POLICY "Enable write for service role_partitioned" 
        ON news_articles_partitioned FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
        
        RAISE NOTICE 'Created default policies for partitioned table';
    END IF;
END $$;

-- Verify partitioning setup
DO $$
DECLARE
    partition_count integer;
    policy_count integer;
BEGIN
    -- Count partitions
    SELECT COUNT(*) INTO partition_count
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' 
    AND c.relispartition 
    AND c.relname LIKE 'news_articles_%';
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' 
    AND tablename = 'news_articles_partitioned';
    
    RAISE NOTICE E'\n=== Partitioning Status ===';
    RAISE NOTICE 'Partitions created: %', partition_count;
    RAISE NOTICE 'RLS policies created: %', policy_count;
    RAISE NOTICE 'Setup complete. Ready for data migration.';
    RAISE NOTICE '';
    RAISE NOTICE 'To migrate data: SELECT * FROM migrate_to_partitioned_table();';
END $$;