-- Add unique constraints to prevent duplicate news articles
-- Run this in Supabase SQL editor

-- 1. Add unique constraint on URL (primary deduplication method)
ALTER TABLE news_articles_partitioned 
ADD CONSTRAINT unique_news_url UNIQUE (url);

-- 2. Add compound unique index on title + published_at (for near-duplicates)
CREATE UNIQUE INDEX idx_unique_title_published 
ON news_articles_partitioned (title, published_at);

-- 3. Add index on created_at for efficient duplicate checking
CREATE INDEX idx_news_created_at 
ON news_articles_partitioned (created_at DESC);

-- 4. Add content_hash to metadata for future similarity detection
-- Note: This would require a migration to add proper hash column
-- For now, we store it in metadata JSONB

-- 5. Create a function to clean existing duplicates (optional)
CREATE OR REPLACE FUNCTION clean_duplicate_news()
RETURNS void AS $$
BEGIN
  -- Delete duplicates keeping the oldest one
  DELETE FROM news_articles_partitioned a
  USING news_articles_partitioned b
  WHERE a.url = b.url 
    AND a.id > b.id;
    
  -- Delete title duplicates within same day
  DELETE FROM news_articles_partitioned a
  USING news_articles_partitioned b
  WHERE a.title = b.title 
    AND DATE(a.created_at) = DATE(b.created_at)
    AND a.id > b.id;
END;
$$ LANGUAGE plpgsql;

-- Run the cleanup (be careful in production!)
-- SELECT clean_duplicate_news();

-- View duplicate statistics
SELECT 
  'Duplicate URLs' as duplicate_type,
  COUNT(*) - COUNT(DISTINCT url) as duplicate_count
FROM news_articles_partitioned
UNION ALL
SELECT 
  'Duplicate Titles' as duplicate_type,
  COUNT(*) - COUNT(DISTINCT title) as duplicate_count
FROM news_articles_partitioned;