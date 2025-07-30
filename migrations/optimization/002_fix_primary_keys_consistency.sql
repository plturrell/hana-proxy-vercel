-- Migration 002: Fix Primary Key Consistency
-- Purpose: Standardize article_id references across all news tables
-- Author: AI Assistant
-- Date: 2025-01-22

-- Step 1: Drop existing constraints (if any)
ALTER TABLE news_sentiment_analysis 
    DROP CONSTRAINT IF EXISTS fk_sentiment_article;
ALTER TABLE news_market_impact 
    DROP CONSTRAINT IF EXISTS fk_impact_article;
ALTER TABLE breaking_news_alerts 
    DROP CONSTRAINT IF EXISTS fk_alerts_article;
ALTER TABLE news_entity_extractions 
    DROP CONSTRAINT IF EXISTS fk_extractions_article;

-- Step 2: Standardize article_id column types to TEXT
ALTER TABLE news_sentiment_analysis 
    ALTER COLUMN article_id TYPE TEXT USING article_id::TEXT;

ALTER TABLE news_market_impact 
    ALTER COLUMN article_id TYPE TEXT USING article_id::TEXT;

ALTER TABLE breaking_news_alerts 
    ALTER COLUMN article_id TYPE TEXT USING article_id::TEXT;

ALTER TABLE news_entity_extractions 
    ALTER COLUMN article_id TYPE TEXT USING article_id::TEXT;

-- Step 3: Add proper indexes on article_id
CREATE INDEX IF NOT EXISTS idx_news_sentiment_article_id 
    ON news_sentiment_analysis(article_id);
CREATE INDEX IF NOT EXISTS idx_news_impact_article_id 
    ON news_market_impact(article_id);
CREATE INDEX IF NOT EXISTS idx_breaking_alerts_article_id 
    ON breaking_news_alerts(article_id);
CREATE INDEX IF NOT EXISTS idx_entity_extract_article_id 
    ON news_entity_extractions(article_id);

-- Step 4: Add foreign key constraints
ALTER TABLE news_sentiment_analysis 
    ADD CONSTRAINT fk_sentiment_article 
    FOREIGN KEY (article_id) 
    REFERENCES news_articles_partitioned(article_id)
    ON DELETE CASCADE;

ALTER TABLE news_market_impact 
    ADD CONSTRAINT fk_impact_article 
    FOREIGN KEY (article_id) 
    REFERENCES news_articles_partitioned(article_id)
    ON DELETE CASCADE;

ALTER TABLE breaking_news_alerts 
    ADD CONSTRAINT fk_alerts_article 
    FOREIGN KEY (article_id) 
    REFERENCES news_articles_partitioned(article_id)
    ON DELETE CASCADE;

ALTER TABLE news_entity_extractions 
    ADD CONSTRAINT fk_extractions_article 
    FOREIGN KEY (article_id) 
    REFERENCES news_articles_partitioned(article_id)
    ON DELETE CASCADE;

-- Step 5: Fix entity_news_association table
ALTER TABLE entity_news_association 
    ADD COLUMN IF NOT EXISTS article_id_text TEXT;

UPDATE entity_news_association 
SET article_id_text = (
    SELECT article_id::TEXT 
    FROM news_articles_old 
    WHERE news_articles_old.article_id::TEXT = entity_news_association.article_id::TEXT
    LIMIT 1
)
WHERE article_id_text IS NULL;

-- Step 6: Add check constraints for data quality
ALTER TABLE news_sentiment_analysis
    ADD CONSTRAINT chk_sentiment_scores CHECK (
        overall_sentiment BETWEEN -1 AND 1 AND
        market_sentiment BETWEEN -1 AND 1 AND
        investor_sentiment BETWEEN -1 AND 1
    );

ALTER TABLE news_market_impact
    ADD CONSTRAINT chk_impact_scores CHECK (
        overall_impact_score BETWEEN 0 AND 100 AND
        impact_probability BETWEEN 0 AND 1
    );