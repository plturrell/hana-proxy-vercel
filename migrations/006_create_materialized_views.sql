-- Migration 006: Create Materialized Views for Performance
-- Purpose: Add materialized views for common queries and analytics
-- Author: AI Assistant
-- Date: 2025-01-22

-- Step 1: Create trending topics materialized view
DROP MATERIALIZED VIEW IF EXISTS trending_news_topics CASCADE;
CREATE MATERIALIZED VIEW trending_news_topics AS
WITH topic_stats AS (
    SELECT 
        unnest(keywords) as topic,
        COUNT(*) as article_count,
        AVG(sentiment_score) as avg_sentiment,
        AVG(market_impact_score) as avg_impact,
        STDDEV(sentiment_score) as sentiment_volatility,
        array_agg(DISTINCT source) as sources,
        array_agg(article_id ORDER BY published_at DESC) as recent_articles
    FROM news_articles_partitioned
    WHERE published_at > NOW() - INTERVAL '7 days'
    AND keywords IS NOT NULL
    GROUP BY topic
)
SELECT 
    topic,
    article_count,
    avg_sentiment,
    avg_impact,
    sentiment_volatility,
    sources,
    recent_articles[1:5] as top_5_articles,
    CASE 
        WHEN article_count > 10 AND avg_impact > 0.7 THEN 'hot'
        WHEN article_count > 5 AND avg_impact > 0.5 THEN 'rising'
        WHEN article_count > 3 THEN 'emerging'
        ELSE 'niche'
    END as trend_status
FROM topic_stats
WHERE article_count >= 2
ORDER BY article_count DESC, avg_impact DESC;

CREATE INDEX idx_trending_topics_status ON trending_news_topics(trend_status);
CREATE INDEX idx_trending_topics_count ON trending_news_topics(article_count DESC);

-- Step 2: Create market impact summary view
DROP MATERIALIZED VIEW IF EXISTS news_market_impact_summary CASCADE;
CREATE MATERIALIZED VIEW news_market_impact_summary AS
WITH daily_stats AS (
    SELECT 
        DATE(published_at) as news_date,
        source,
        COUNT(*) as total_articles,
        COUNT(CASE WHEN market_impact_score > 0.7 THEN 1 END) as high_impact_count,
        COUNT(CASE WHEN market_impact_score BETWEEN 0.3 AND 0.7 THEN 1 END) as medium_impact_count,
        AVG(sentiment_score) as avg_sentiment,
        STDDEV(sentiment_score) as sentiment_stddev,
        AVG(market_impact_score) as avg_impact,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY sentiment_score) as median_sentiment,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY market_impact_score) as p95_impact
    FROM news_articles_partitioned
    WHERE published_at > NOW() - INTERVAL '30 days'
    GROUP BY DATE(published_at), source
),
symbol_impacts AS (
    SELECT 
        DATE(published_at) as news_date,
        unnest(symbols) as symbol,
        COUNT(*) as mention_count,
        AVG(sentiment_score) as symbol_sentiment,
        AVG(market_impact_score) as symbol_impact
    FROM news_articles_partitioned
    WHERE published_at > NOW() - INTERVAL '30 days'
    AND symbols IS NOT NULL
    GROUP BY DATE(published_at), unnest(symbols)
)
SELECT 
    d.news_date,
    d.source,
    d.total_articles,
    d.high_impact_count,
    d.medium_impact_count,
    d.avg_sentiment,
    d.sentiment_stddev,
    d.avg_impact,
    d.median_sentiment,
    d.p95_impact,
    jsonb_agg(DISTINCT jsonb_build_object(
        'symbol', s.symbol,
        'mentions', s.mention_count,
        'sentiment', s.symbol_sentiment,
        'impact', s.symbol_impact
    )) FILTER (WHERE s.symbol IS NOT NULL) as symbol_impacts
FROM daily_stats d
LEFT JOIN symbol_impacts s ON d.news_date = s.news_date
GROUP BY d.news_date, d.source, d.total_articles, d.high_impact_count, 
         d.medium_impact_count, d.avg_sentiment, d.sentiment_stddev, 
         d.avg_impact, d.median_sentiment, d.p95_impact;

CREATE INDEX idx_market_impact_date ON news_market_impact_summary(news_date DESC);
CREATE INDEX idx_market_impact_source ON news_market_impact_summary(source, news_date DESC);

-- Step 3: Create source reliability metrics
DROP MATERIALIZED VIEW IF EXISTS news_source_metrics CASCADE;
CREATE MATERIALIZED VIEW news_source_metrics AS
WITH source_stats AS (
    SELECT 
        source,
        COUNT(*) as total_articles,
        AVG(relevance_score) as avg_relevance,
        STDDEV(relevance_score) as relevance_consistency,
        AVG(CASE WHEN market_impact_score > 0.5 THEN 1 ELSE 0 END) as high_impact_ratio,
        COUNT(DISTINCT DATE(published_at)) as active_days,
        MIN(published_at) as first_article,
        MAX(published_at) as latest_article,
        AVG(LENGTH(content)) as avg_content_length,
        COUNT(DISTINCT unnest(keywords)) as unique_keywords_covered
    FROM news_articles_partitioned
    WHERE published_at > NOW() - INTERVAL '90 days'
    GROUP BY source
),
sentiment_accuracy AS (
    SELECT 
        n.source,
        CORR(n.sentiment_score, m.actual_market_move) as sentiment_accuracy
    FROM news_articles_partitioned n
    JOIN (
        -- This would join with actual market data
        -- Placeholder for demonstration
        SELECT article_id, 0.0 as actual_market_move
        FROM news_articles_partitioned
    ) m ON n.article_id = m.article_id
    WHERE n.published_at > NOW() - INTERVAL '90 days'
    GROUP BY n.source
)
SELECT 
    s.*,
    COALESCE(sa.sentiment_accuracy, 0) as sentiment_accuracy,
    CASE 
        WHEN s.total_articles > 100 AND s.avg_relevance > 0.7 THEN 'premium'
        WHEN s.total_articles > 50 AND s.avg_relevance > 0.5 THEN 'reliable'
        WHEN s.total_articles > 20 THEN 'standard'
        ELSE 'emerging'
    END as source_tier,
    s.total_articles::FLOAT / NULLIF(s.active_days, 0) as articles_per_day
FROM source_stats s
LEFT JOIN sentiment_accuracy sa ON s.source = sa.source
WHERE s.total_articles >= 5;

CREATE INDEX idx_source_metrics_tier ON news_source_metrics(source_tier);
CREATE INDEX idx_source_metrics_relevance ON news_source_metrics(avg_relevance DESC);

-- Step 4: Create entity mention tracking
DROP MATERIALIZED VIEW IF EXISTS news_entity_mentions CASCADE;
CREATE MATERIALIZED VIEW news_entity_mentions AS
WITH entity_extraction AS (
    SELECT 
        published_at,
        article_id,
        sentiment_score,
        market_impact_score,
        jsonb_array_elements(entities) as entity
    FROM news_articles_partitioned
    WHERE published_at > NOW() - INTERVAL '30 days'
    AND entities IS NOT NULL
)
SELECT 
    entity->>'name' as entity_name,
    entity->>'type' as entity_type,
    COUNT(*) as mention_count,
    COUNT(DISTINCT DATE(published_at)) as days_mentioned,
    AVG(sentiment_score) as avg_sentiment,
    STDDEV(sentiment_score) as sentiment_volatility,
    AVG(market_impact_score) as avg_impact,
    array_agg(DISTINCT article_id) FILTER (WHERE market_impact_score > 0.7) as high_impact_articles,
    MIN(published_at) as first_mention,
    MAX(published_at) as last_mention,
    CASE 
        WHEN COUNT(*) > 50 THEN 'high_visibility'
        WHEN COUNT(*) > 20 THEN 'moderate_visibility'
        WHEN COUNT(*) > 10 THEN 'emerging'
        ELSE 'low_visibility'
    END as visibility_tier
FROM entity_extraction
GROUP BY entity->>'name', entity->>'type'
HAVING COUNT(*) >= 3;

CREATE INDEX idx_entity_mentions_name ON news_entity_mentions(entity_name);
CREATE INDEX idx_entity_mentions_type ON news_entity_mentions(entity_type);
CREATE INDEX idx_entity_mentions_visibility ON news_entity_mentions(visibility_tier, mention_count DESC);

-- Step 5: Create news velocity tracking
DROP MATERIALIZED VIEW IF EXISTS news_velocity CASCADE;
CREATE MATERIALIZED VIEW news_velocity AS
WITH hourly_stats AS (
    SELECT 
        date_trunc('hour', published_at) as hour_bucket,
        source,
        COUNT(*) as article_count,
        AVG(sentiment_score) as avg_sentiment,
        AVG(market_impact_score) as avg_impact,
        array_agg(DISTINCT unnest(keywords)) as keywords,
        array_agg(DISTINCT unnest(symbols)) as symbols
    FROM news_articles_partitioned
    WHERE published_at > NOW() - INTERVAL '7 days'
    GROUP BY date_trunc('hour', published_at), source
),
velocity_calc AS (
    SELECT 
        hour_bucket,
        source,
        article_count,
        avg_sentiment,
        avg_impact,
        keywords,
        symbols,
        article_count - LAG(article_count, 1, 0) OVER (PARTITION BY source ORDER BY hour_bucket) as article_delta,
        avg_sentiment - LAG(avg_sentiment, 1, 0) OVER (PARTITION BY source ORDER BY hour_bucket) as sentiment_delta
    FROM hourly_stats
)
SELECT 
    *,
    CASE 
        WHEN article_delta > 10 THEN 'surge'
        WHEN article_delta > 5 THEN 'increase'
        WHEN article_delta < -5 THEN 'decrease'
        ELSE 'stable'
    END as velocity_status,
    CASE 
        WHEN ABS(sentiment_delta) > 0.5 THEN 'high_volatility'
        WHEN ABS(sentiment_delta) > 0.2 THEN 'moderate_volatility'
        ELSE 'stable_sentiment'
    END as sentiment_volatility
FROM velocity_calc;

CREATE INDEX idx_velocity_hour ON news_velocity(hour_bucket DESC);
CREATE INDEX idx_velocity_status ON news_velocity(velocity_status, hour_bucket DESC);

-- Step 6: Create refresh function for all materialized views
CREATE OR REPLACE FUNCTION refresh_news_materialized_views()
RETURNS void AS $$
BEGIN
    -- Refresh in dependency order
    REFRESH MATERIALIZED VIEW CONCURRENTLY trending_news_topics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY news_market_impact_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY news_source_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY news_entity_mentions;
    REFRESH MATERIALIZED VIEW CONCURRENTLY news_velocity;
    
    -- Update refresh timestamp
    INSERT INTO system_maintenance_log (task_name, completed_at)
    VALUES ('refresh_news_materialized_views', NOW());
END;
$$ LANGUAGE plpgsql;

-- Step 7: Schedule automatic refresh (if pg_cron is available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Refresh trending topics every hour
        PERFORM cron.schedule(
            'refresh_trending_topics',
            '0 * * * *',
            'REFRESH MATERIALIZED VIEW CONCURRENTLY trending_news_topics'
        );
        
        -- Refresh other views every 4 hours
        PERFORM cron.schedule(
            'refresh_news_views',
            '0 */4 * * *',
            'SELECT refresh_news_materialized_views()'
        );
    END IF;
END $$;

-- Step 8: Create helper view for view dependencies
CREATE OR REPLACE VIEW news_view_refresh_status AS
SELECT 
    schemaname,
    matviewname,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size,
    last_refresh.max_completed as last_refreshed,
    CASE 
        WHEN last_refresh.max_completed IS NULL THEN 'never'
        WHEN last_refresh.max_completed < NOW() - INTERVAL '1 day' THEN 'stale'
        WHEN last_refresh.max_completed < NOW() - INTERVAL '4 hours' THEN 'aging'
        ELSE 'fresh'
    END as status
FROM pg_matviews
LEFT JOIN (
    SELECT 
        task_name,
        MAX(completed_at) as max_completed
    FROM system_maintenance_log
    WHERE task_name LIKE '%' || matviewname || '%'
    GROUP BY task_name
) last_refresh ON true
WHERE schemaname = 'public' 
AND matviewname LIKE '%news%'
ORDER BY matviewname;