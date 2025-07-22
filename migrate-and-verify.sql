-- Migrate data to partitioned table and verify

-- Step 1: Migrate existing data
SELECT migrate_news_to_partitioned();

-- Step 2: Verify migration
DO $$
DECLARE
    original_count bigint;
    partitioned_count bigint;
    partition_info record;
BEGIN
    SELECT COUNT(*) INTO original_count FROM news_articles;
    SELECT COUNT(*) INTO partitioned_count FROM news_articles_partitioned;
    
    RAISE NOTICE E'\n=== Migration Status ===';
    RAISE NOTICE 'Original table rows: %', original_count;
    RAISE NOTICE 'Partitioned table rows: %', partitioned_count;
    RAISE NOTICE '';
    
    -- Show data distribution across partitions
    RAISE NOTICE 'Data distribution by partition:';
    FOR partition_info IN 
        SELECT 
            c.relname as partition_name,
            pg_size_pretty(pg_relation_size(c.oid)) as size,
            s.n_live_tup as row_count
        FROM pg_class c
        JOIN pg_inherits i ON c.oid = i.inhrelid
        JOIN pg_stat_user_tables s ON c.oid = s.relid
        WHERE i.inhparent = 'news_articles_partitioned'::regclass
        ORDER BY c.relname
    LOOP
        IF partition_info.row_count > 0 THEN
            RAISE NOTICE '  %: % rows (%)', 
                partition_info.partition_name, 
                partition_info.row_count, 
                partition_info.size;
        END IF;
    END LOOP;
END $$;

-- Step 3: Test partitioned table performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM news_articles_partitioned 
WHERE published_at >= '2025-07-01' 
AND published_at < '2025-08-01';

-- Step 4: Create helper functions for switching tables
CREATE OR REPLACE FUNCTION switch_to_partitioned_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Rename tables to swap them
    ALTER TABLE news_articles RENAME TO news_articles_old;
    ALTER TABLE news_articles_partitioned RENAME TO news_articles;
    
    -- Update any dependent objects
    -- Note: Views, functions, etc. may need to be recreated
    
    RAISE NOTICE 'Switched to partitioned table. Old table is now news_articles_old';
END;
$$;

-- Step 5: Rollback function (if needed)
CREATE OR REPLACE FUNCTION rollback_to_original_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Rename back
    ALTER TABLE news_articles RENAME TO news_articles_partitioned;
    ALTER TABLE news_articles_old RENAME TO news_articles;
    
    RAISE NOTICE 'Rolled back to original table';
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION switch_to_partitioned_table TO postgres;
GRANT EXECUTE ON FUNCTION rollback_to_original_table TO postgres;

-- Summary
DO $$
BEGIN
    RAISE NOTICE E'\n=== Next Steps ===';
    RAISE NOTICE '1. Verify all data is migrated correctly';
    RAISE NOTICE '2. Test your application with news_articles_partitioned';
    RAISE NOTICE '3. When ready, run: SELECT switch_to_partitioned_table();';
    RAISE NOTICE '4. Set up scheduled job for: SELECT maintain_partitions();';
    RAISE NOTICE '';
    RAISE NOTICE 'Rollback available with: SELECT rollback_to_original_table();';
END $$;