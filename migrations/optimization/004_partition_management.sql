-- Migration 004: Implement Proper Partition Management
-- Purpose: Create automated partition management for news tables
-- Author: AI Assistant
-- Date: 2025-01-22

-- Step 1: Create partition management function
CREATE OR REPLACE FUNCTION manage_news_partitions()
RETURNS void AS $$
DECLARE
    start_date date;
    end_date date;
    partition_name text;
    table_exists boolean;
    row_count bigint;
BEGIN
    -- Create next 3 months of partitions
    FOR i IN 0..2 LOOP
        start_date := date_trunc('month', CURRENT_DATE + (i || ' month')::interval);
        end_date := start_date + interval '1 month';
        partition_name := 'news_articles_y' || to_char(start_date, 'YYYY') || 'm' || to_char(start_date, 'MM');
        
        -- Check if partition exists
        SELECT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = partition_name
        ) INTO table_exists;
        
        IF NOT table_exists THEN
            -- Create partition
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF news_articles_partitioned 
                 FOR VALUES FROM (%L) TO (%L)',
                partition_name, start_date, end_date
            );
            
            -- Create indexes on new partition
            EXECUTE format('CREATE INDEX %I ON %I (published_at DESC)', 
                partition_name || '_published_idx', partition_name);
            EXECUTE format('CREATE INDEX %I ON %I (article_id)', 
                partition_name || '_article_idx', partition_name);
            EXECUTE format('CREATE INDEX %I ON %I (source, published_at DESC)', 
                partition_name || '_source_idx', partition_name);
            
            RAISE NOTICE 'Created partition: %', partition_name;
        END IF;
    END LOOP;
    
    -- Clean up empty old partitions (older than 12 months)
    FOR partition_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'news_articles_y%'
        AND tablename < 'news_articles_y' || to_char(CURRENT_DATE - interval '12 months', 'YYYY') || 'm' || to_char(CURRENT_DATE - interval '12 months', 'MM')
    LOOP
        -- Check if partition is empty
        EXECUTE format('SELECT COUNT(*) FROM %I', partition_name) INTO row_count;
        
        IF row_count = 0 THEN
            EXECUTE format('DROP TABLE %I', partition_name);
            RAISE NOTICE 'Dropped empty partition: %', partition_name;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create function to migrate data to correct partitions
CREATE OR REPLACE FUNCTION redistribute_news_data()
RETURNS void AS $$
DECLARE
    rec RECORD;
    target_partition text;
    partition_exists boolean;
BEGIN
    -- Find articles in wrong partitions
    FOR rec IN 
        SELECT 
            n.id,
            n.article_id,
            n.published_at,
            pg_namespace.nspname || '.' || pg_class.relname as current_table
        FROM news_articles_partitioned n
        JOIN pg_class ON n.tableoid = pg_class.oid
        JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
        WHERE pg_class.relname LIKE 'news_articles_y%'
        AND (
            -- Article is in wrong partition
            pg_class.relname != 'news_articles_y' || to_char(n.published_at, 'YYYY') || 'm' || to_char(n.published_at, 'MM')
        )
    LOOP
        target_partition := 'news_articles_y' || to_char(rec.published_at, 'YYYY') || 'm' || to_char(rec.published_at, 'MM');
        
        -- Check if target partition exists
        SELECT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = target_partition
        ) INTO partition_exists;
        
        IF partition_exists THEN
            -- Move record to correct partition
            EXECUTE format('
                WITH deleted AS (
                    DELETE FROM ONLY %s WHERE id = %L RETURNING *
                )
                INSERT INTO %I SELECT * FROM deleted',
                rec.current_table, rec.id, target_partition
            );
            
            RAISE NOTICE 'Moved article % from % to %', rec.article_id, rec.current_table, target_partition;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger for automatic search vector updates
CREATE OR REPLACE FUNCTION update_news_search_vector()
RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.source, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER news_search_vector_update
    BEFORE INSERT OR UPDATE OF title, content, source
    ON news_articles_partitioned
    FOR EACH ROW
    EXECUTE FUNCTION update_news_search_vector();

-- Step 4: Create scheduled job for partition maintenance (if pg_cron is available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Schedule monthly partition creation
        PERFORM cron.schedule(
            'create_news_partitions',
            '0 0 1 * *',  -- First day of each month at midnight
            'SELECT manage_news_partitions()'
        );
        
        -- Schedule weekly data redistribution
        PERFORM cron.schedule(
            'redistribute_news_data',
            '0 2 * * 0',  -- Every Sunday at 2 AM
            'SELECT redistribute_news_data()'
        );
    END IF;
END $$;

-- Step 5: Create partition info view
CREATE OR REPLACE VIEW news_partition_info AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size,
    (SELECT count(*) FROM news_articles_partitioned WHERE tableoid = (schemaname||'.'||tablename)::regclass) as row_count,
    (SELECT min(published_at) FROM news_articles_partitioned WHERE tableoid = (schemaname||'.'||tablename)::regclass) as min_date,
    (SELECT max(published_at) FROM news_articles_partitioned WHERE tableoid = (schemaname||'.'||tablename)::regclass) as max_date
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename LIKE 'news_articles_y%'
ORDER BY tablename;

-- Step 6: Run initial partition management
SELECT manage_news_partitions();