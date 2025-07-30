-- Get column information for all news tables
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
    'breaking_news_alerts',
    'news_sentiment_analysis', 
    'news_market_impact',
    'news_entity_extractions',
    'news_queries',
    'news_article_symbols',
    'news_articles_archive',
    'news_hedge_analyses',
    'news_entity_mentions'
)
ORDER BY table_name, ordinal_position;