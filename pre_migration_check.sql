-- Pre-Migration Analysis Script
-- Run this before starting migrations to understand current state

-- Check current news tables and sizes
SELECT 
    'Table Analysis' as check_type,
    tablename as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    n_live_tup as row_count,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public' 
AND tablename LIKE '%news%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check for duplicate data between tables
SELECT 
    'Duplicate Check' as check_type,
    COUNT(*) as articles_in_simple_table
FROM news_articles;

-- Check partitioned table
SELECT 
    'Partitioned Table Check' as check_type,
    COUNT(*) as articles_in_partitioned_table
FROM news_articles_partitioned;

-- Check foreign key references
SELECT 
    'Foreign Key References' as check_type,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'article_id'
AND table_name IN ('news_sentiment_analysis', 'news_market_impact', 'breaking_news_alerts', 'news_entity_extractions')
ORDER BY table_name;

-- Check existing indexes
SELECT 
    'Index Check' as check_type,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE '%news%'
ORDER BY tablename, indexname;

-- Check for data that would be affected
SELECT 
    'Data Age Distribution' as check_type,
    CASE 
        WHEN published_at > NOW() - INTERVAL '30 days' THEN '0-30 days'
        WHEN published_at > NOW() - INTERVAL '90 days' THEN '31-90 days'
        WHEN published_at > NOW() - INTERVAL '180 days' THEN '91-180 days'
        WHEN published_at > NOW() - INTERVAL '365 days' THEN '181-365 days'
        ELSE 'Over 1 year'
    END as age_bucket,
    COUNT(*) as article_count,
    AVG(relevance_score) as avg_relevance,
    AVG(CASE WHEN sentiment_score IS NOT NULL THEN 1 ELSE 0 END) as pct_with_sentiment
FROM news_articles
GROUP BY age_bucket
ORDER BY 
    CASE age_bucket
        WHEN '0-30 days' THEN 1
        WHEN '31-90 days' THEN 2
        WHEN '91-180 days' THEN 3
        WHEN '181-365 days' THEN 4
        ELSE 5
    END;