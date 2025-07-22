-- Migration 008: Add Real-time Features and Analytics
-- Purpose: Enable real-time news monitoring and alerting capabilities
-- Author: AI Assistant
-- Date: 2025-01-22

-- Step 1: Create news velocity tracking table
CREATE TABLE IF NOT EXISTS news_velocity_live (
    time_bucket TIMESTAMPTZ NOT NULL,
    source VARCHAR(100) NOT NULL,
    article_count INTEGER DEFAULT 1,
    sentiment_sum DECIMAL(10,2) DEFAULT 0,
    sentiment_count INTEGER DEFAULT 0,
    impact_sum DECIMAL(10,2) DEFAULT 0,
    keywords TEXT[] DEFAULT '{}',
    symbols TEXT[] DEFAULT '{}',
    last_article_id TEXT,
    last_title TEXT,
    PRIMARY KEY (time_bucket, source)
);

-- Create index for real-time queries
CREATE INDEX idx_velocity_live_bucket ON news_velocity_live(time_bucket DESC);

-- Step 2: Create trigger for real-time velocity updates
CREATE OR REPLACE FUNCTION update_news_velocity_live()
RETURNS TRIGGER AS $$
BEGIN
    -- Update velocity for current hour
    INSERT INTO news_velocity_live (
        time_bucket,
        source,
        article_count,
        sentiment_sum,
        sentiment_count,
        impact_sum,
        keywords,
        symbols,
        last_article_id,
        last_title
    ) VALUES (
        date_trunc('hour', NEW.published_at),
        NEW.source,
        1,
        COALESCE(NEW.sentiment_score, 0),
        CASE WHEN NEW.sentiment_score IS NOT NULL THEN 1 ELSE 0 END,
        COALESCE(NEW.market_impact_score, 0),
        COALESCE(NEW.keywords, '{}'),
        COALESCE(NEW.symbols, '{}'),
        NEW.article_id,
        NEW.title
    )
    ON CONFLICT (time_bucket, source) DO UPDATE SET
        article_count = news_velocity_live.article_count + 1,
        sentiment_sum = news_velocity_live.sentiment_sum + COALESCE(NEW.sentiment_score, 0),
        sentiment_count = news_velocity_live.sentiment_count + 
            CASE WHEN NEW.sentiment_score IS NOT NULL THEN 1 ELSE 0 END,
        impact_sum = news_velocity_live.impact_sum + COALESCE(NEW.market_impact_score, 0),
        keywords = array_cat(news_velocity_live.keywords, COALESCE(NEW.keywords, '{}')),
        symbols = array_cat(news_velocity_live.symbols, COALESCE(NEW.symbols, '{}')),
        last_article_id = NEW.article_id,
        last_title = NEW.title;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on partitioned table
CREATE TRIGGER news_velocity_tracker
    AFTER INSERT ON news_articles_partitioned
    FOR EACH ROW
    EXECUTE FUNCTION update_news_velocity_live();

-- Step 3: Create real-time anomaly detection
CREATE TABLE IF NOT EXISTS news_anomalies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    anomaly_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    source VARCHAR(100),
    time_window TSTZRANGE,
    metrics JSONB,
    affected_symbols TEXT[],
    alert_sent BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

CREATE INDEX idx_anomalies_detected ON news_anomalies(detected_at DESC);
CREATE INDEX idx_anomalies_severity ON news_anomalies(severity, detected_at DESC);
CREATE INDEX idx_anomalies_unresolved ON news_anomalies(resolved_at) WHERE resolved_at IS NULL;

-- Step 4: Create anomaly detection function
CREATE OR REPLACE FUNCTION detect_news_anomalies()
RETURNS void AS $$
DECLARE
    v_current_hour TIMESTAMPTZ := date_trunc('hour', NOW());
    v_prev_hour TIMESTAMPTZ := v_current_hour - INTERVAL '1 hour';
    r RECORD;
BEGIN
    -- Detect volume spikes
    FOR r IN 
        WITH hourly_avg AS (
            SELECT 
                source,
                AVG(article_count) as avg_count,
                STDDEV(article_count) as stddev_count
            FROM news_velocity_live
            WHERE time_bucket BETWEEN v_current_hour - INTERVAL '24 hours' AND v_prev_hour
            GROUP BY source
        ),
        current_hour AS (
            SELECT 
                source,
                article_count,
                sentiment_sum / NULLIF(sentiment_count, 0) as avg_sentiment
            FROM news_velocity_live
            WHERE time_bucket = v_current_hour
        )
        SELECT 
            c.source,
            c.article_count,
            h.avg_count,
            h.stddev_count,
            c.avg_sentiment,
            (c.article_count - h.avg_count) / NULLIF(h.stddev_count, 0) as z_score
        FROM current_hour c
        JOIN hourly_avg h ON c.source = h.source
        WHERE ABS((c.article_count - h.avg_count) / NULLIF(h.stddev_count, 0)) > 3
    LOOP
        INSERT INTO news_anomalies (
            anomaly_type,
            severity,
            source,
            time_window,
            metrics
        ) VALUES (
            CASE 
                WHEN r.z_score > 0 THEN 'volume_spike'
                ELSE 'volume_drop'
            END,
            CASE 
                WHEN ABS(r.z_score) > 5 THEN 'critical'
                WHEN ABS(r.z_score) > 4 THEN 'high'
                ELSE 'medium'
            END,
            r.source,
            tstzrange(v_current_hour, v_current_hour + INTERVAL '1 hour'),
            jsonb_build_object(
                'article_count', r.article_count,
                'expected_count', r.avg_count,
                'z_score', r.z_score,
                'avg_sentiment', r.avg_sentiment
            )
        );
    END LOOP;
    
    -- Detect sentiment shifts
    INSERT INTO news_anomalies (anomaly_type, severity, source, time_window, metrics, affected_symbols)
    WITH sentiment_shift AS (
        SELECT 
            v1.source,
            v1.sentiment_sum / NULLIF(v1.sentiment_count, 0) as current_sentiment,
            v2.sentiment_sum / NULLIF(v2.sentiment_count, 0) as prev_sentiment,
            v1.symbols
        FROM news_velocity_live v1
        JOIN news_velocity_live v2 ON v1.source = v2.source
        WHERE v1.time_bucket = v_current_hour
        AND v2.time_bucket = v_prev_hour
        AND v1.sentiment_count > 5  -- Minimum articles for reliability
    )
    SELECT 
        'sentiment_shift',
        CASE 
            WHEN ABS(current_sentiment - prev_sentiment) > 0.7 THEN 'high'
            WHEN ABS(current_sentiment - prev_sentiment) > 0.5 THEN 'medium'
            ELSE 'low'
        END,
        source,
        tstzrange(v_prev_hour, v_current_hour + INTERVAL '1 hour'),
        jsonb_build_object(
            'current_sentiment', current_sentiment,
            'previous_sentiment', prev_sentiment,
            'change', current_sentiment - prev_sentiment
        ),
        symbols
    FROM sentiment_shift
    WHERE ABS(current_sentiment - prev_sentiment) > 0.4;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create real-time alerting system
CREATE TABLE IF NOT EXISTS news_alert_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS news_alert_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id UUID REFERENCES news_alert_rules(id),
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    trigger_data JSONB,
    actions_taken JSONB,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT
);

-- Step 6: Create function to process alerts
CREATE OR REPLACE FUNCTION process_news_alerts()
RETURNS void AS $$
DECLARE
    rule RECORD;
    should_trigger BOOLEAN;
    trigger_data JSONB;
BEGIN
    FOR rule IN 
        SELECT * FROM news_alert_rules 
        WHERE enabled = TRUE
    LOOP
        should_trigger := FALSE;
        trigger_data := '{}'::JSONB;
        
        -- Check rule conditions based on type
        CASE rule.rule_type
            WHEN 'volume_threshold' THEN
                SELECT 
                    COUNT(*) > (rule.conditions->>'threshold')::INTEGER,
                    jsonb_build_object('article_count', COUNT(*))
                INTO should_trigger, trigger_data
                FROM news_articles_partitioned
                WHERE published_at > NOW() - ((rule.conditions->>'window_minutes')::INTEGER || ' minutes')::INTERVAL
                AND (rule.conditions->>'source' IS NULL OR source = rule.conditions->>'source');
                
            WHEN 'sentiment_threshold' THEN
                SELECT 
                    AVG(sentiment_score) < (rule.conditions->>'min_sentiment')::FLOAT 
                    OR AVG(sentiment_score) > (rule.conditions->>'max_sentiment')::FLOAT,
                    jsonb_build_object('avg_sentiment', AVG(sentiment_score))
                INTO should_trigger, trigger_data
                FROM news_articles_partitioned
                WHERE published_at > NOW() - ((rule.conditions->>'window_minutes')::INTEGER || ' minutes')::INTERVAL
                AND sentiment_score IS NOT NULL;
                
            WHEN 'keyword_detection' THEN
                SELECT 
                    COUNT(*) > 0,
                    jsonb_agg(jsonb_build_object('article_id', article_id, 'title', title))
                INTO should_trigger, trigger_data
                FROM news_articles_partitioned
                WHERE published_at > NOW() - ((rule.conditions->>'window_minutes')::INTEGER || ' minutes')::INTERVAL
                AND (
                    title ILIKE '%' || (rule.conditions->>'keyword') || '%'
                    OR content ILIKE '%' || (rule.conditions->>'keyword') || '%'
                );
        END CASE;
        
        -- Trigger alert if conditions met
        IF should_trigger THEN
            INSERT INTO news_alert_history (
                rule_id,
                trigger_data,
                actions_taken
            ) VALUES (
                rule.id,
                trigger_data,
                rule.actions
            );
            
            UPDATE news_alert_rules
            SET 
                last_triggered_at = NOW(),
                trigger_count = trigger_count + 1
            WHERE id = rule.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create real-time dashboard queries
CREATE OR REPLACE FUNCTION get_news_velocity_dashboard(
    lookback_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    source VARCHAR(100),
    total_articles BIGINT,
    avg_sentiment FLOAT,
    trending_keywords TEXT[],
    velocity_trend VARCHAR(20),
    last_update TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH source_stats AS (
        SELECT 
            v.source,
            SUM(v.article_count) as total_articles,
            SUM(v.sentiment_sum) / NULLIF(SUM(v.sentiment_count), 0) as avg_sentiment,
            array_agg(DISTINCT unnest(v.keywords)) FILTER (WHERE v.keywords IS NOT NULL) as all_keywords,
            MAX(v.time_bucket) as last_update,
            -- Calculate trend
            SUM(CASE WHEN v.time_bucket > NOW() - INTERVAL '1 hour' THEN v.article_count ELSE 0 END) as recent_count,
            SUM(v.article_count)::FLOAT / lookback_hours as hourly_average
        FROM news_velocity_live v
        WHERE v.time_bucket > NOW() - (lookback_hours || ' hours')::INTERVAL
        GROUP BY v.source
    )
    SELECT 
        source,
        total_articles,
        avg_sentiment,
        all_keywords[1:10] as trending_keywords,
        CASE 
            WHEN recent_count > hourly_average * 2 THEN 'surge'
            WHEN recent_count > hourly_average * 1.5 THEN 'increasing'
            WHEN recent_count < hourly_average * 0.5 THEN 'decreasing'
            ELSE 'stable'
        END as velocity_trend,
        last_update
    FROM source_stats
    ORDER BY total_articles DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create WebSocket notification function
CREATE OR REPLACE FUNCTION notify_news_update()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
BEGIN
    payload := jsonb_build_object(
        'action', TG_OP,
        'article_id', NEW.article_id,
        'title', NEW.title,
        'source', NEW.source,
        'sentiment', NEW.sentiment_score,
        'impact', NEW.market_impact_score,
        'symbols', NEW.symbols,
        'published_at', NEW.published_at
    );
    
    -- Send notification to listening clients
    PERFORM pg_notify('news_updates', payload::TEXT);
    
    -- Send high-impact notifications on separate channel
    IF NEW.market_impact_score > 0.8 OR 
       NEW.urgency_score > 80 OR
       EXISTS (SELECT 1 FROM breaking_news_alerts WHERE article_id = NEW.article_id) THEN
        PERFORM pg_notify('breaking_news', payload::TEXT);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create notification trigger
CREATE TRIGGER news_update_notify
    AFTER INSERT ON news_articles_partitioned
    FOR EACH ROW
    EXECUTE FUNCTION notify_news_update();

-- Step 9: Schedule anomaly detection (if pg_cron available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Run anomaly detection every 5 minutes
        PERFORM cron.schedule(
            'detect_news_anomalies',
            '*/5 * * * *',
            'SELECT detect_news_anomalies()'
        );
        
        -- Process alerts every minute
        PERFORM cron.schedule(
            'process_news_alerts',
            '* * * * *',
            'SELECT process_news_alerts()'
        );
    END IF;
END $$;

-- Step 10: Create cleanup function for old velocity data
CREATE OR REPLACE FUNCTION cleanup_old_velocity_data()
RETURNS void AS $$
BEGIN
    DELETE FROM news_velocity_live
    WHERE time_bucket < NOW() - INTERVAL '7 days';
    
    DELETE FROM news_anomalies
    WHERE detected_at < NOW() - INTERVAL '30 days'
    AND resolved_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;