-- Migration 001: Consolidate News Tables
-- Purpose: Merge duplicate news systems into single partitioned structure
-- Author: AI Assistant
-- Date: 2025-01-22

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS news_articles_backup AS 
SELECT * FROM news_articles;

-- Step 2: Ensure partitioned table has all necessary columns
ALTER TABLE news_articles_partitioned 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS search_vector tsvector,
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Step 3: Migrate data from simple table to partitioned table
INSERT INTO news_articles_partitioned (
    article_id, 
    title, 
    content, 
    url, 
    source,
    published_at, 
    sentiment_score, 
    entities,
    relevance_score,
    created_at,
    metadata
)
SELECT 
    COALESCE(article_id::text, gen_random_uuid()::text),
    title,
    content,
    url,
    source,
    COALESCE(published_at, created_at, NOW()),
    sentiment_score,
    entities,
    relevance_score,
    created_at,
    jsonb_build_object(
        'migrated_from', 'news_articles',
        'migration_date', NOW(),
        'processed_at', processed_at
    )
FROM news_articles
WHERE NOT EXISTS (
    SELECT 1 FROM news_articles_partitioned np
    WHERE np.article_id = news_articles.article_id::text
);

-- Step 4: Create view for backward compatibility
DROP VIEW IF EXISTS news_articles_view;
CREATE VIEW news_articles_view AS 
SELECT 
    article_id::uuid as article_id,
    title,
    content,
    url,
    source,
    published_at,
    sentiment_score,
    entities,
    relevance_score,
    (metadata->>'processed_at')::timestamptz as processed_at,
    created_at
FROM news_articles_partitioned;

-- Step 5: Rename tables
ALTER TABLE news_articles RENAME TO news_articles_old;
ALTER VIEW news_articles_view RENAME TO news_articles;

-- Step 6: Update sequences if needed
DO $$
DECLARE
    max_id BIGINT;
BEGIN
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM news_articles_partitioned;
    PERFORM setval('news_articles_partitioned_id_seq', max_id + 1, false);
END $$;

-- Step 7: Add comment for documentation
COMMENT ON TABLE news_articles_partitioned IS 'Main news storage table, partitioned by published_at month';
COMMENT ON VIEW news_articles IS 'Compatibility view for legacy news_articles table access';