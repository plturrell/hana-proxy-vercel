-- =========================================================================
-- NEWS SCHEMA: TABLE DESCRIPTIONS & CLEANUP
-- =========================================================================
-- Financial news processing system with AI-enhanced analysis
-- Total tables: 31 (7 active, 24 empty)
-- Action: Add descriptions + Clean up empty tables
-- =========================================================================

-- CORE STORAGE TABLES
-- -------------------------------------------------------------------------
COMMENT ON TABLE news_articles IS 
'Legacy news articles table maintained for backward compatibility. Contains basic news data with sentiment scoring and entity extraction capabilities.';

COMMENT ON TABLE news_articles_partitioned IS 
'Main partitioned news storage table optimized for high-volume processing. Features AI-enhanced content analysis, multi-dimensional sentiment scoring, market impact assessment, and automated entity extraction across monthly partitions.';

-- ANALYSIS TABLES (AI-READY)
-- -------------------------------------------------------------------------
COMMENT ON TABLE news_sentiment_analysis IS 
'Advanced sentiment analysis results with granular scoring across market dimensions (overall, investor, institutional) and psychological indicators (fear, greed, optimism, panic).';

COMMENT ON TABLE news_market_impact IS 
'Market impact assessment engine analyzing news effects across asset classes (equity, fixed income, currency, commodity) with probability scoring and timeframe predictions.';

COMMENT ON TABLE breaking_news_alerts IS 
'Real-time breaking news detection system with urgency scoring and market impact potential for automated trading and alert systems.';

COMMENT ON TABLE news_entity_extractions IS 
'AI-powered entity extraction results identifying companies, financial instruments, people, economic indicators, and market catalysts with confidence scoring.';

-- SUPPORT TABLES
-- -------------------------------------------------------------------------
COMMENT ON TABLE news_loading_status_log IS 
'System monitoring table tracking news ingestion performance, source health, processing rates, and predictive confidence metrics across all news sources.';

COMMENT ON TABLE entity_news_association IS 
'Many-to-many relationship table linking extracted entities to news articles with relevance scoring and contextual mention tracking.';

COMMENT ON TABLE news_sources IS 
'News source management with reliability scoring, API configuration, rate limiting, and categorical classification for source quality weighting.';

COMMENT ON TABLE news_event_classifications IS 
'Event categorization system classifying news into structured event types (earnings, mergers, regulatory) with impact weighting and asset correlation.';

COMMENT ON TABLE news_queries IS 
'User search query tracking and analytics for news content discovery, storing search patterns and user behavior for recommendation optimization.';

COMMENT ON TABLE news_article_symbols IS 
'Junction table linking news articles to financial symbols/tickers with relevance scoring for symbol-based news filtering and impact analysis.';

COMMENT ON TABLE news_articles_archive IS 
'Long-term archival storage for historical news articles with compressed content and metadata preservation for compliance and analytical purposes.';

COMMENT ON TABLE news_hedge_analyses IS 
'Hedge fund and institutional analysis extracted from news content, tracking investment strategies, position changes, and market sentiment indicators.';

COMMENT ON TABLE news_entity_mentions IS 
'Entity mention frequency tracking across news articles with sentiment correlation and trending detection for relationship analysis.';

-- ACTIVE PARTITION TABLES
-- -------------------------------------------------------------------------
COMMENT ON TABLE news_articles_y2025m07 IS 
'July 2025 partition of the main news table. Active partition containing current month news data with full AI processing capabilities.';

-- =========================================================================
-- CLEANUP: REMOVE EMPTY PARTITION TABLES
-- =========================================================================
-- The following tables have 0 rows and should be removed to clean up schema
-- This will save ~640KB of storage and reduce maintenance overhead

-- Remove empty 2024 partitions
DROP TABLE IF EXISTS news_articles_y2024m08;
DROP TABLE IF EXISTS news_articles_y2024m09;
DROP TABLE IF EXISTS news_articles_y2024m10;
DROP TABLE IF EXISTS news_articles_y2024m11;
DROP TABLE IF EXISTS news_articles_y2024m12;

-- Remove empty 2025 partitions (except active July)
DROP TABLE IF EXISTS news_articles_y2025m01;
DROP TABLE IF EXISTS news_articles_y2025m02;
DROP TABLE IF EXISTS news_articles_y2025m03;
DROP TABLE IF EXISTS news_articles_y2025m04;
DROP TABLE IF EXISTS news_articles_y2025m05;
DROP TABLE IF EXISTS news_articles_y2025m06;
DROP TABLE IF EXISTS news_articles_y2025m08;
DROP TABLE IF EXISTS news_articles_y2025m09;
DROP TABLE IF EXISTS news_articles_y2025m10;

-- Remove default partition
DROP TABLE IF EXISTS news_articles_default;

-- =========================================================================
-- VERIFICATION & FINAL STATUS
-- =========================================================================

-- Check remaining tables
SELECT 
    'After Cleanup' as status,
    COUNT(*) as total_news_tables,
    SUM(CASE WHEN obj_description(oid) IS NOT NULL THEN 1 ELSE 0 END) as tables_with_descriptions
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
AND c.relname LIKE 'news%'
AND c.relkind = 'r';

-- Show table descriptions
SELECT 
    c.relname as table_name,
    CASE 
        WHEN obj_description(c.oid) IS NOT NULL THEN '✅ Has Description'
        ELSE '❌ Missing Description'
    END as description_status,
    LEFT(obj_description(c.oid), 80) || '...' as description_preview
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
AND c.relname LIKE 'news%'
AND c.relkind = 'r'
ORDER BY c.relname;

-- Final count verification
SELECT 
    'Final Schema Status' as summary,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_name LIKE 'news%') as remaining_tables,
    (SELECT COUNT(*) FROM news_articles_partitioned) as articles_in_main_table;