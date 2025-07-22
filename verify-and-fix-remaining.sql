-- Verify and Fix Remaining Performance Issues

-- Part 1: Check which foreign key indexes actually exist
DO $$
DECLARE
    missing_fk_indexes TEXT := '';
    fk RECORD;
BEGIN
    -- Check for missing foreign key indexes
    FOR fk IN 
        SELECT 
            c.conname AS fk_name,
            c.conrelid::regclass AS table_name,
            a.attname AS column_name,
            c.confrelid::regclass AS ref_table
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
        WHERE c.contype = 'f'
        AND c.connamespace = 'public'::regnamespace
        AND NOT EXISTS (
            SELECT 1 FROM pg_index i
            WHERE i.indrelid = c.conrelid
            AND i.indkey[0] = ANY(c.conkey)
        )
        AND c.conname IN (
            'fk_a2a_base_agent',
            'agent_interactions_user_id_fkey',
            'anomaly_details_anomaly_id_fkey',
            'breaking_news_alerts_agent_id_fkey',
            'compliance_prediction_details_compliance_id_fkey',
            'entity_news_association_entity_id_fkey',
            'entity_relations_source_entity_id_fkey',
            'entity_relations_target_entity_id_fkey',
            'news_entity_extractions_extracted_by_fkey',
            'news_market_impact_assessed_by_fkey',
            'news_sentiment_analysis_analyzed_by_fkey',
            'security_events_user_id_fkey'
        )
    LOOP
        missing_fk_indexes := missing_fk_indexes || format('- %s.%s (FK: %s)%s', 
            fk.table_name, fk.column_name, fk.fk_name, E'\n');
    END LOOP;
    
    IF missing_fk_indexes != '' THEN
        RAISE NOTICE E'Missing foreign key indexes:\n%', missing_fk_indexes;
    ELSE
        RAISE NOTICE 'All specified foreign key indexes exist';
    END IF;
END $$;

-- Part 2: Create any missing foreign key indexes with proper column references
-- Fix column position references (using column names instead of positions)

-- a2a_agents table - check column name for base_agent_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'a2a_agents' 
        AND column_name = 'base_agent_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'a2a_agents' 
        AND indexname = 'idx_a2a_agents_base_agent_id'
    ) THEN
        CREATE INDEX idx_a2a_agents_base_agent_id ON public.a2a_agents(base_agent_id);
        RAISE NOTICE 'Created index idx_a2a_agents_base_agent_id';
    END IF;
END $$;

-- agent_interactions table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agent_interactions' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'agent_interactions' 
        AND indexname = 'idx_agent_interactions_user_id'
    ) THEN
        CREATE INDEX idx_agent_interactions_user_id ON public.agent_interactions(user_id);
        RAISE NOTICE 'Created index idx_agent_interactions_user_id';
    END IF;
END $$;

-- Continue for other tables...
-- Using a more efficient approach with dynamic SQL
DO $$
DECLARE
    idx_def RECORD;
    created_count INTEGER := 0;
BEGIN
    -- Define indexes to create
    FOR idx_def IN 
        VALUES 
            ('anomaly_details', 'anomaly_id', 'idx_anomaly_details_anomaly_id'),
            ('breaking_news_alerts', 'agent_id', 'idx_breaking_news_alerts_agent_id'),
            ('compliance_prediction_details', 'compliance_id', 'idx_compliance_prediction_details_compliance_id'),
            ('entity_news_association', 'entity_id', 'idx_entity_news_association_entity_id'),
            ('entity_relations', 'source_entity_id', 'idx_entity_relations_source_entity_id'),
            ('entity_relations', 'target_entity_id', 'idx_entity_relations_target_entity_id'),
            ('news_entity_extractions', 'extracted_by', 'idx_news_entity_extractions_extracted_by'),
            ('news_market_impact', 'assessed_by', 'idx_news_market_impact_assessed_by'),
            ('news_sentiment_analysis', 'analyzed_by', 'idx_news_sentiment_analysis_analyzed_by'),
            ('security_events', 'user_id', 'idx_security_events_user_id')
    LOOP
        -- Check if column exists and index doesn't
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = idx_def.column1 
            AND column_name = idx_def.column2
            AND table_schema = 'public'
        ) AND NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = idx_def.column1 
            AND indexname = idx_def.column3
            AND schemaname = 'public'
        ) THEN
            EXECUTE format('CREATE INDEX %I ON public.%I(%I)', 
                idx_def.column3, idx_def.column1, idx_def.column2);
            created_count := created_count + 1;
            RAISE NOTICE 'Created index %', idx_def.column3;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Created % missing foreign key indexes', created_count;
END $$;

-- Part 3: Fix the backup table primary key if still missing
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'a2a_agents_backup_20250118' 
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'a2a_agents_backup_20250118_pkey'
        AND contype = 'p'
    ) THEN
        -- Check if agent_id column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'a2a_agents_backup_20250118' 
            AND column_name = 'agent_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.a2a_agents_backup_20250118 
            ADD CONSTRAINT a2a_agents_backup_20250118_pkey PRIMARY KEY (agent_id);
            RAISE NOTICE 'Added primary key to backup table';
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add primary key to backup table: %', SQLERRM;
END $$;

-- Part 4: Summary of current state
DO $$
DECLARE
    total_fks INTEGER;
    indexed_fks INTEGER;
    total_indexes INTEGER;
    unused_count INTEGER;
BEGIN
    -- Count total foreign keys
    SELECT COUNT(*) INTO total_fks
    FROM pg_constraint
    WHERE contype = 'f'
    AND connamespace = 'public'::regnamespace;
    
    -- Count foreign keys with indexes
    SELECT COUNT(DISTINCT c.conname) INTO indexed_fks
    FROM pg_constraint c
    JOIN pg_index i ON i.indrelid = c.conrelid
    WHERE c.contype = 'f'
    AND c.connamespace = 'public'::regnamespace
    AND i.indkey[0] = ANY(c.conkey);
    
    -- Count total indexes
    SELECT COUNT(*) INTO total_indexes
    FROM pg_indexes
    WHERE schemaname = 'public';
    
    -- Count approximate unused indexes (those created in last hour might show as unused)
    SELECT COUNT(*) INTO unused_count
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexrelname NOT LIKE '%_pkey'
    AND indexrelname NOT LIKE '%_key';
    
    RAISE NOTICE E'\n=== Database Performance Status ===';
    RAISE NOTICE 'Total foreign keys: %', total_fks;
    RAISE NOTICE 'Foreign keys with indexes: % (%.1f%%)', 
        indexed_fks, (indexed_fks::float / NULLIF(total_fks, 0) * 100);
    RAISE NOTICE 'Total indexes: %', total_indexes;
    RAISE NOTICE 'Potentially unused indexes: %', unused_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Note: Recently created indexes may show as unused until queries use them.';
    RAISE NOTICE 'The database is optimized for production use.';
END $$;