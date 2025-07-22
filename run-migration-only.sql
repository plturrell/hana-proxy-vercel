-- Simple migration execution
SELECT * FROM migrate_news_to_partitioned();

-- Basic verification
SELECT 
    'Original table' as table_name,
    COUNT(*) as row_count
FROM news_articles
UNION ALL
SELECT 
    'Partitioned table' as table_name,
    COUNT(*) as row_count
FROM news_articles_partitioned;

-- Check partition distribution
SELECT 
    inhrelid::regclass as partition_name,
    pg_size_pretty(pg_relation_size(inhrelid)) as size
FROM pg_inherits
WHERE inhparent = 'news_articles_partitioned'::regclass
ORDER BY inhrelid::regclass::text;