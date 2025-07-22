-- Migration 003: Add Missing Indexes for Performance
-- Purpose: Create critical indexes for news table queries
-- Author: AI Assistant
-- Date: 2025-01-22

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Update search vectors for full-text search
UPDATE news_articles_partitioned 
SET search_vector = 
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(source, '')), 'C')
WHERE search_vector IS NULL;

-- Step 3: Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_news_fulltext_search 
    ON news_articles_partitioned 
    USING GIN (search_vector);

-- Partial index for recent articles
CREATE INDEX IF NOT EXISTS idx_news_fulltext_recent 
    ON news_articles_partitioned 
    USING GIN (search_vector)
    WHERE published_at > NOW() - INTERVAL '90 days';

-- Step 4: Create JSONB indexes for entity search
CREATE INDEX IF NOT EXISTS idx_news_entities_gin 
    ON news_articles_partitioned 
    USING GIN (entities);

CREATE INDEX IF NOT EXISTS idx_news_metadata_gin 
    ON news_articles_partitioned 
    USING GIN (metadata);

-- Step 5: Create array indexes for symbols and categories
CREATE INDEX IF NOT EXISTS idx_news_symbols_gin 
    ON news_articles_partitioned 
    USING GIN (symbols);

CREATE INDEX IF NOT EXISTS idx_news_categories_gin 
    ON news_articles_partitioned 
    USING GIN (categories);

CREATE INDEX IF NOT EXISTS idx_news_keywords_gin 
    ON news_articles_partitioned 
    USING GIN (keywords);

-- Step 6: Create trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_news_title_trgm 
    ON news_articles_partitioned 
    USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_news_source_trgm 
    ON news_articles_partitioned 
    USING GIN (source gin_trgm_ops);

-- Step 7: Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_news_source_published_sentiment 
    ON news_articles_partitioned (source, published_at DESC, sentiment_score);

CREATE INDEX IF NOT EXISTS idx_news_published_impact 
    ON news_articles_partitioned (published_at DESC, market_impact_score DESC)
    WHERE market_impact_score > 0.5;

-- Step 8: Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_news_high_relevance 
    ON news_articles_partitioned (relevance_score DESC, published_at DESC)
    WHERE relevance_score > 0.7;

CREATE INDEX IF NOT EXISTS idx_news_negative_sentiment 
    ON news_articles_partitioned (sentiment_score, published_at DESC)
    WHERE sentiment_score < -0.3;

CREATE INDEX IF NOT EXISTS idx_news_positive_sentiment 
    ON news_articles_partitioned (sentiment_score DESC, published_at DESC)
    WHERE sentiment_score > 0.3;

-- Step 9: Create covering index for API queries
CREATE INDEX IF NOT EXISTS idx_news_api_listing 
    ON news_articles_partitioned (
        published_at DESC,
        source,
        sentiment_score,
        market_impact_score
    ) INCLUDE (title, url);

-- Step 10: Create indexes on child partitions (template for automation)
DO $$
DECLARE
    partition_name TEXT;
BEGIN
    FOR partition_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'news_articles_y%'
    LOOP
        -- Create partition-specific indexes
        EXECUTE format('
            CREATE INDEX IF NOT EXISTS %I ON %I (published_at DESC);
            CREATE INDEX IF NOT EXISTS %I ON %I (article_id);
            CREATE INDEX IF NOT EXISTS %I ON %I USING GIN (search_vector);
        ', 
        partition_name || '_published_idx', partition_name,
        partition_name || '_article_idx', partition_name,
        partition_name || '_search_idx', partition_name
        );
    END LOOP;
END $$;

-- Step 11: Analyze tables to update statistics
ANALYZE news_articles_partitioned;