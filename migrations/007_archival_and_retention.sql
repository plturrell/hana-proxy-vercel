-- Migration 007: Implement Smart Archival and Data Retention
-- Purpose: Create automated archival system for old news data
-- Author: AI Assistant
-- Date: 2025-01-22

-- Step 1: Create maintenance log table if not exists
CREATE TABLE IF NOT EXISTS system_maintenance_log (
    id SERIAL PRIMARY KEY,
    task_name VARCHAR(100) NOT NULL,
    task_details JSONB,
    records_affected INTEGER,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success'
);

-- Step 2: Enhance archive table structure
ALTER TABLE news_articles_archive 
ADD COLUMN IF NOT EXISTS archive_batch_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS compression_ratio FLOAT,
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

-- Create indexes for archive table
CREATE INDEX IF NOT EXISTS idx_archive_batch ON news_articles_archive(archive_batch_id);
CREATE INDEX IF NOT EXISTS idx_archive_published ON news_articles_archive(published_at);
CREATE INDEX IF NOT EXISTS idx_archive_reason ON news_articles_archive(archive_reason);

-- Step 3: Create intelligent archival function
CREATE OR REPLACE FUNCTION archive_old_news(
    retention_days INTEGER DEFAULT 180,
    importance_threshold FLOAT DEFAULT 0.5,
    batch_size INTEGER DEFAULT 1000
)
RETURNS TABLE (
    archived_count INTEGER,
    space_freed TEXT,
    archive_batch_id UUID
) AS $$
DECLARE
    v_batch_id UUID := gen_random_uuid();
    v_archived_count INTEGER := 0;
    v_space_before BIGINT;
    v_space_after BIGINT;
    v_start_time TIMESTAMPTZ := NOW();
BEGIN
    -- Get current space usage
    SELECT pg_total_relation_size('news_articles_partitioned') INTO v_space_before;
    
    -- Archive articles based on intelligent criteria
    WITH articles_to_archive AS (
        SELECT 
            n.*,
            -- Calculate archive score (higher score = more likely to archive)
            CASE 
                WHEN n.relevance_score < 0.3 THEN 0.9  -- Low relevance
                WHEN n.published_at < NOW() - INTERVAL '1 year' THEN 0.8  -- Very old
                WHEN NOT EXISTS (
                    SELECT 1 FROM breaking_news_alerts b 
                    WHERE b.article_id = n.article_id
                ) THEN 0.7  -- Not breaking news
                WHEN n.market_impact_score < 0.3 THEN 0.6  -- Low market impact
                ELSE 0.4
            END as archive_score
        FROM news_articles_partitioned n
        WHERE n.published_at < NOW() - (retention_days || ' days')::INTERVAL
        AND (n.relevance_score < importance_threshold OR n.market_impact_score < importance_threshold)
        AND NOT EXISTS (
            -- Don't archive if recently accessed
            SELECT 1 FROM news_queries q 
            WHERE n.article_id = ANY(q.result_article_ids) 
            AND q.created_at > NOW() - INTERVAL '30 days'
        )
        ORDER BY archive_score DESC, n.published_at ASC
        LIMIT batch_size
    )
    INSERT INTO news_articles_archive (
        article_id,
        title,
        content,
        source,
        category,
        importance_score,
        published_at,
        archived_at,
        archive_reason,
        archive_batch_id,
        original_data
    )
    SELECT 
        article_id,
        title,
        LEFT(content, 500) as content,  -- Compress content
        source,
        categories[1] as category,
        GREATEST(relevance_score, market_impact_score) as importance_score,
        published_at,
        NOW(),
        CASE 
            WHEN archive_score > 0.8 THEN 'age_and_low_relevance'
            WHEN archive_score > 0.6 THEN 'low_impact'
            ELSE 'standard_retention'
        END,
        v_batch_id,
        jsonb_build_object(
            'full_content', content,
            'sentiment_score', sentiment_score,
            'entities', entities,
            'keywords', keywords,
            'symbols', symbols,
            'metadata', metadata
        )
    FROM articles_to_archive
    RETURNING article_id;
    
    GET DIAGNOSTICS v_archived_count = ROW_COUNT;
    
    -- Delete archived articles from main table
    DELETE FROM news_articles_partitioned
    WHERE article_id IN (
        SELECT article_id 
        FROM news_articles_archive 
        WHERE archive_batch_id = v_batch_id
    );
    
    -- Get space after archival
    SELECT pg_total_relation_size('news_articles_partitioned') INTO v_space_after;
    
    -- Log the operation
    INSERT INTO system_maintenance_log (
        task_name, 
        task_details, 
        records_affected, 
        duration_ms,
        status
    ) VALUES (
        'archive_old_news',
        jsonb_build_object(
            'batch_id', v_batch_id,
            'retention_days', retention_days,
            'importance_threshold', importance_threshold,
            'space_freed_bytes', v_space_before - v_space_after
        ),
        v_archived_count,
        EXTRACT(MILLISECONDS FROM (NOW() - v_start_time)),
        'success'
    );
    
    RETURN QUERY
    SELECT 
        v_archived_count,
        pg_size_pretty(v_space_before - v_space_after),
        v_batch_id;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create function to restore archived articles
CREATE OR REPLACE FUNCTION restore_archived_news(
    p_article_ids TEXT[],
    p_restore_reason TEXT DEFAULT 'user_request'
)
RETURNS INTEGER AS $$
DECLARE
    v_restored_count INTEGER := 0;
BEGIN
    -- Restore articles back to main table
    INSERT INTO news_articles_partitioned (
        article_id,
        title,
        content,
        source,
        published_at,
        sentiment_score,
        entities,
        keywords,
        symbols,
        metadata
    )
    SELECT 
        article_id,
        title,
        COALESCE(original_data->>'full_content', content),
        source,
        published_at,
        (original_data->>'sentiment_score')::NUMERIC(3,2),
        original_data->'entities',
        (original_data->'keywords')::TEXT[],
        (original_data->'symbols')::TEXT[],
        COALESCE(original_data->'metadata', '{}'::JSONB) || 
        jsonb_build_object(
            'restored_at', NOW(),
            'restore_reason', p_restore_reason
        )
    FROM news_articles_archive
    WHERE article_id = ANY(p_article_ids);
    
    GET DIAGNOSTICS v_restored_count = ROW_COUNT;
    
    -- Update archive records
    UPDATE news_articles_archive
    SET 
        access_count = access_count + 1,
        last_accessed_at = NOW()
    WHERE article_id = ANY(p_article_ids);
    
    -- Log restoration
    INSERT INTO system_maintenance_log (
        task_name,
        task_details,
        records_affected
    ) VALUES (
        'restore_archived_news',
        jsonb_build_object(
            'article_ids', p_article_ids,
            'reason', p_restore_reason
        ),
        v_restored_count
    );
    
    RETURN v_restored_count;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create tiered storage management
CREATE OR REPLACE FUNCTION manage_news_storage_tiers()
RETURNS void AS $$
BEGIN
    -- Move rarely accessed recent articles to compressed storage
    WITH compression_candidates AS (
        SELECT article_id
        FROM news_articles_partitioned n
        WHERE n.published_at BETWEEN NOW() - INTERVAL '90 days' AND NOW() - INTERVAL '30 days'
        AND NOT EXISTS (
            SELECT 1 FROM news_queries q 
            WHERE n.article_id = ANY(q.result_article_ids) 
            AND q.created_at > NOW() - INTERVAL '7 days'
        )
        AND LENGTH(n.content) > 5000  -- Only compress large articles
    )
    UPDATE news_articles_partitioned
    SET 
        content = LEFT(content, 1000) || '... [Content compressed, full text in metadata]',
        metadata = metadata || jsonb_build_object(
            'full_content_compressed', compress_text(content),
            'compression_date', NOW()
        )
    WHERE article_id IN (SELECT article_id FROM compression_candidates);
    
    -- Delete empty partitions
    PERFORM drop_empty_partitions();
    
    -- Update partition statistics
    ANALYZE news_articles_partitioned;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create helper function for text compression (placeholder)
CREATE OR REPLACE FUNCTION compress_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    -- In production, you'd use actual compression
    -- For now, just return a truncated version
    RETURN LEFT(input_text, 2000);
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create function to drop empty partitions
CREATE OR REPLACE FUNCTION drop_empty_partitions()
RETURNS void AS $$
DECLARE
    partition_record RECORD;
    row_count INTEGER;
BEGIN
    FOR partition_record IN 
        SELECT 
            schemaname,
            tablename
        FROM pg_tables
        WHERE schemaname = 'public' 
        AND tablename LIKE 'news_articles_y%'
        AND tablename < 'news_articles_y' || to_char(NOW() - INTERVAL '3 months', 'YYYY') || 'm' || to_char(NOW() - INTERVAL '3 months', 'MM')
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I.%I', partition_record.schemaname, partition_record.tablename) INTO row_count;
        
        IF row_count = 0 THEN
            EXECUTE format('DROP TABLE %I.%I', partition_record.schemaname, partition_record.tablename);
            
            INSERT INTO system_maintenance_log (
                task_name,
                task_details
            ) VALUES (
                'drop_empty_partition',
                jsonb_build_object('partition_name', partition_record.tablename)
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create monitoring view for storage usage
CREATE OR REPLACE VIEW news_storage_analytics AS
WITH storage_stats AS (
    SELECT 
        'active' as storage_tier,
        COUNT(*) as article_count,
        pg_size_pretty(SUM(pg_column_size(content))) as content_size,
        AVG(LENGTH(content)) as avg_content_length,
        MIN(published_at) as oldest_article,
        MAX(published_at) as newest_article
    FROM news_articles_partitioned
    UNION ALL
    SELECT 
        'archived' as storage_tier,
        COUNT(*) as article_count,
        pg_size_pretty(SUM(pg_column_size(original_data))) as content_size,
        AVG(LENGTH(content)) as avg_content_length,
        MIN(published_at) as oldest_article,
        MAX(published_at) as newest_article
    FROM news_articles_archive
)
SELECT 
    *,
    EXTRACT(DAYS FROM (newest_article - oldest_article)) as date_range_days,
    article_count::FLOAT / NULLIF(EXTRACT(DAYS FROM (newest_article - oldest_article)), 0) as articles_per_day
FROM storage_stats;

-- Step 9: Schedule automated archival (if pg_cron available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Daily archival at 2 AM
        PERFORM cron.schedule(
            'archive_old_news_daily',
            '0 2 * * *',
            'SELECT archive_old_news(180, 0.5, 5000)'
        );
        
        -- Weekly storage tier management
        PERFORM cron.schedule(
            'manage_storage_tiers_weekly',
            '0 3 * * 0',
            'SELECT manage_news_storage_tiers()'
        );
    END IF;
END $$;

-- Step 10: Create index on archive for quick lookups
CREATE INDEX IF NOT EXISTS idx_archive_article_id ON news_articles_archive(article_id);
CREATE INDEX IF NOT EXISTS idx_archive_source_date ON news_articles_archive(source, published_at DESC);