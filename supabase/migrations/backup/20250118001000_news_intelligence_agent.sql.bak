-- Migration: Add News Intelligence Agent
-- Description: Set up database schema and registration for News Intelligence Agent
-- Date: 2025-01-18

-- Step 1: Enhance news_articles table if needed
ALTER TABLE news_articles 
ADD COLUMN IF NOT EXISTS entities JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sentiment JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS market_impact JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS processed_by TEXT,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- Create index for better query performance  
CREATE INDEX IF NOT EXISTS idx_news_articles_timestamp ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_entities ON news_articles USING GIN(entities);
-- Skip market_impact index - will create separately if needed

-- Step 2: Create daily summaries table
CREATE TABLE IF NOT EXISTS daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    summary_date DATE NOT NULL,
    summary_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_id, summary_date)
);

-- Step 3: Register News Intelligence Agent in A2A system
INSERT INTO a2a_agents (
    agent_id,
    agent_name,
    agent_type,
    description,
    status,
    capabilities,
    voting_power,
    connection_config,
    scheduled_tasks,
    voting_preferences,
    personality,
    goals,
    created_at,
    updated_at
) VALUES (
    'finsight.data.news_intelligence',
    'News Intelligence Agent',
    'data_product',
    'Processes financial news using Perplexity API and extracts actionable insights',
    'active',
    '["news_ingestion", "sentiment_analysis", "entity_extraction", "event_detection", "market_impact_assessment"]'::JSONB,
    100,
    '{
        "goals": [
            "Process real-time financial news",
            "Extract market-moving events",
            "Provide sentiment analysis",
            "Identify investment opportunities"
        ],
        "personality": "analytical",
        "auto_respond": true,
        "max_concurrent_tasks": 10,
        "processing_interval": 300000
    }'::JSONB,
    '[
        {
            "name": "periodic_news_fetch",
            "interval": "*/5 * * * *",
            "action": "fetchAndProcessNews",
            "enabled": true
        },
        {
            "name": "daily_summary",
            "interval": "0 9 * * *",
            "action": "generateDailySummary",
            "enabled": true
        }
    ]'::JSONB,
    '{
        "consensus_threshold": 0.7,
        "voting_weight": 1.0,
        "delegation_allowed": true
    }'::JSONB,
    'analytical',
    ARRAY['Maximize information extraction from news', 'Provide timely market intelligence', 'Support investment decision making'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (agent_id) DO UPDATE SET
    status = 'active',
    updated_at = CURRENT_TIMESTAMP;

-- Step 4: Register with ORD
INSERT INTO ord_analytics_resources (
    agent_id,
    resource_type,
    resource_name,
    resource_path,
    capabilities,
    requirements,
    metadata,
    created_at
) VALUES (
    'finsight.data.news_intelligence',
    'agent',
    'News Intelligence Agent',
    '/api/agents/news-intelligence',
    '{
        "input_types": ["news_query", "ticker_symbols", "date_range"],
        "output_types": ["news_articles", "sentiment_scores", "market_events"],
        "protocols": ["REST", "WebSocket", "A2A"],
        "discovery": ["ORD", "OpenAPI", "A2A"]
    }'::JSONB,
    '{
        "api_keys": ["PERPLEXITY_API_KEY"],
        "data_access": ["news_articles", "market_events"],
        "dependencies": ["perplexity_api", "supabase"]
    }'::JSONB,
    '{
        "category": "data_product",
        "version": "1.0.0",
        "documentation": "/docs/agents/news-intelligence",
        "performance": {
            "avg_response_time_ms": 500,
            "success_rate": 0.95,
            "throughput_per_minute": 100
        },
        "ord_compliance": {
            "version": "1.12",
            "compliant": true,
            "validation_date": "2025-01-18"
        }
    }'::JSONB,
    CURRENT_TIMESTAMP
) ON CONFLICT (agent_id) DO UPDATE SET
    metadata = ord_analytics_resources.metadata || 
    '{
        "last_updated": "2025-01-18",
        "ord_compliance": {
            "version": "1.12",
            "compliant": true,
            "validation_date": "2025-01-18"
        }
    }'::JSONB;

-- Step 5: Create RLS policies for news agent
-- Allow news agent to insert/update news articles
CREATE POLICY "news_agent_write_articles" ON news_articles
    FOR ALL
    USING (auth.jwt() ->> 'agent_id' = 'finsight.data.news_intelligence')
    WITH CHECK (auth.jwt() ->> 'agent_id' = 'finsight.data.news_intelligence');

-- Allow all authenticated agents to read news
CREATE POLICY "agents_read_news" ON news_articles
    FOR SELECT
    USING (auth.jwt() ->> 'agent_id' IS NOT NULL);

-- Step 6: Create subscription relationships
CREATE TABLE IF NOT EXISTS agent_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_agent_id TEXT NOT NULL,
    publisher_agent_id TEXT NOT NULL,
    subscription_type TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subscriber_agent_id, publisher_agent_id, subscription_type)
);

-- Subscribe analytics agents to news updates
INSERT INTO agent_subscriptions (subscriber_agent_id, publisher_agent_id, subscription_type, filters)
VALUES 
    ('finsight.analytics.regime_detection', 'finsight.data.news_intelligence', 'news_update', '{"impact_level": ["high", "medium"]}'),
    ('finsight.analytics.portfolio_rebalancing', 'finsight.data.news_intelligence', 'news_update', '{"categories": ["company_earnings", "economic_indicators"]}'),
    ('finsight.analytics.stress_testing', 'finsight.data.news_intelligence', 'news_update', '{"impact_level": ["high"]}')
ON CONFLICT DO NOTHING;

-- Step 7: Create workflow association
INSERT INTO bpmn_workflows (
    workflow_id,
    workflow_name,
    workflow_file,
    associated_agents,
    trigger_type,
    enabled,
    created_at
) VALUES (
    'news-processing-workflow',
    'News Processing Workflow',
    '/workflows/news-processing-workflow.bpmn',
    '["finsight.data.news_intelligence"]'::JSONB,
    'timer',
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (workflow_id) DO UPDATE SET
    enabled = true,
    updated_at = CURRENT_TIMESTAMP;

-- Step 8: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON news_articles TO authenticated;
GRANT SELECT ON daily_summaries TO authenticated;
GRANT SELECT ON agent_subscriptions TO authenticated;

-- Step 9: Create helper functions for news processing
CREATE OR REPLACE FUNCTION get_high_impact_news(
    p_hours INTEGER DEFAULT 24
) RETURNS TABLE (
    id UUID,
    title TEXT,
    category TEXT,
    sentiment JSONB,
    market_impact JSONB,
    entities JSONB,
    published_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        na.id,
        na.title,
        na.category,
        na.sentiment,
        na.market_impact,
        na.entities,
        na.published_at
    FROM news_articles na
    WHERE 
        na.published_at > CURRENT_TIMESTAMP - INTERVAL '1 hour' * p_hours
        AND (na.market_impact->>'score')::float > 0.7
    ORDER BY na.published_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create monitoring view
CREATE OR REPLACE VIEW v_news_agent_performance AS
SELECT 
    DATE(processed_at) as processing_date,
    COUNT(*) as articles_processed,
    AVG((sentiment->>'confidence')::float) as avg_sentiment_confidence,
    COUNT(CASE WHEN (market_impact->>'level') = 'high' THEN 1 END) as high_impact_count,
    COUNT(DISTINCT category) as categories_covered
FROM news_articles
WHERE processed_by = 'finsight.data.news_intelligence'
    AND processed_at IS NOT NULL
GROUP BY DATE(processed_at)
ORDER BY processing_date DESC;

-- Final verification
DO $$
DECLARE
    agent_count INTEGER;
    resource_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO agent_count 
    FROM a2a_agents 
    WHERE agent_id = 'finsight.data.news_intelligence';
    
    SELECT COUNT(*) INTO resource_count 
    FROM ord_analytics_resources 
    WHERE agent_id = 'finsight.data.news_intelligence';
    
    RAISE NOTICE 'News Intelligence Agent Registration Complete';
    RAISE NOTICE 'A2A Registration: %', CASE WHEN agent_count > 0 THEN 'SUCCESS' ELSE 'FAILED' END;
    RAISE NOTICE 'ORD Registration: %', CASE WHEN resource_count > 0 THEN 'SUCCESS' ELSE 'FAILED' END;
END $$;