-- Exasol Production Schema Creation Script
-- For FinSight Experience iOS App Integration

-- Create app_data schema (if not exists from UDF deployment)
CREATE SCHEMA IF NOT EXISTS app_data;

-- Switch to app_data schema
OPEN SCHEMA app_data;

-- 1. Core Market Data Tables
CREATE TABLE IF NOT EXISTS market_data (
    symbol VARCHAR(10) NOT NULL,
    price DECIMAL(18,4) NOT NULL,
    volume BIGINT,
    timestamp TIMESTAMP NOT NULL,
    source VARCHAR(50),
    bid DECIMAL(18,4),
    ask DECIMAL(18,4),
    open_price DECIMAL(18,4),
    high_price DECIMAL(18,4),
    low_price DECIMAL(18,4),
    close_price DECIMAL(18,4),
    market_cap DECIMAL(20,2),
    pe_ratio DECIMAL(10,2),
    dividend_yield DECIMAL(6,4),
    beta DECIMAL(6,3),
    PRIMARY KEY (symbol, timestamp)
);

-- 2. News Articles Table
CREATE TABLE IF NOT EXISTS news_articles (
    article_id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(1000) NOT NULL,
    content CLOB,
    publish_date TIMESTAMP NOT NULL,
    source VARCHAR(100),
    author VARCHAR(200),
    category VARCHAR(50),
    tags VARCHAR(2000),
    url VARCHAR(500),
    sentiment_score DECIMAL(5,4),
    relevance_score DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Sentiment Analysis Results
CREATE TABLE IF NOT EXISTS sentiment_analysis (
    analysis_id VARCHAR(100) PRIMARY KEY,
    article_id VARCHAR(100) NOT NULL,
    sentiment_score DECIMAL(5,4) NOT NULL,
    positive_score DECIMAL(5,4),
    negative_score DECIMAL(5,4),
    neutral_score DECIMAL(5,4),
    confidence DECIMAL(5,4),
    analysis_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    algorithm_version VARCHAR(20),
    FOREIGN KEY (article_id) REFERENCES news_articles(article_id)
);

-- 4. User Interactions
CREATE TABLE IF NOT EXISTS user_interactions (
    interaction_id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    article_id VARCHAR(100),
    interaction_type VARCHAR(50) NOT NULL,
    interaction_value VARCHAR(500),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100),
    device_type VARCHAR(50),
    FOREIGN KEY (article_id) REFERENCES news_articles(article_id)
);

-- 5. Knowledge Graph Entities
CREATE TABLE IF NOT EXISTS knowledge_graph_entities (
    entity_uri VARCHAR(200) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_label VARCHAR(200) NOT NULL,
    properties CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Entity Relationships
CREATE TABLE IF NOT EXISTS entity_relationships (
    relationship_id VARCHAR(100) PRIMARY KEY,
    source_entity_uri VARCHAR(200) NOT NULL,
    target_entity_uri VARCHAR(200) NOT NULL,
    relationship_type VARCHAR(100) NOT NULL,
    weight DECIMAL(5,4),
    properties CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_entity_uri) REFERENCES knowledge_graph_entities(entity_uri),
    FOREIGN KEY (target_entity_uri) REFERENCES knowledge_graph_entities(entity_uri)
);

-- 7. Treasury Data
CREATE TABLE IF NOT EXISTS treasury_data (
    maturity VARCHAR(20) NOT NULL,
    rate DECIMAL(8,4) NOT NULL,
    date DATE NOT NULL,
    yield_1mo DECIMAL(8,4),
    yield_3mo DECIMAL(8,4),
    yield_6mo DECIMAL(8,4),
    yield_1yr DECIMAL(8,4),
    yield_2yr DECIMAL(8,4),
    yield_3yr DECIMAL(8,4),
    yield_5yr DECIMAL(8,4),
    yield_7yr DECIMAL(8,4),
    yield_10yr DECIMAL(8,4),
    yield_20yr DECIMAL(8,4),
    yield_30yr DECIMAL(8,4),
    PRIMARY KEY (maturity, date)
);

-- 8. Model Performance Metrics
CREATE TABLE IF NOT EXISTS model_performance_metrics (
    metric_id VARCHAR(100) PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(18,6) NOT NULL,
    evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dataset_size BIGINT,
    parameters CLOB,
    metadata CLOB
);

-- 9. Feature Store
CREATE TABLE IF NOT EXISTS feature_store (
    feature_id VARCHAR(100) PRIMARY KEY,
    feature_name VARCHAR(200) NOT NULL,
    feature_type VARCHAR(50) NOT NULL,
    feature_value CLOB NOT NULL,
    entity_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version VARCHAR(20),
    metadata CLOB
);

-- 10. Reinforcement Learning States
CREATE TABLE IF NOT EXISTS rl_states (
    state_id VARCHAR(100) PRIMARY KEY,
    algorithm_type VARCHAR(50) NOT NULL,
    arm_id VARCHAR(100),
    alpha_success DECIMAL(10,4),
    beta_failure DECIMAL(10,4),
    total_pulls BIGINT,
    total_rewards DECIMAL(18,6),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    context_features CLOB
);

-- 11. News Market Correlations
CREATE TABLE IF NOT EXISTS news_market_correlations (
    correlation_id VARCHAR(100) PRIMARY KEY,
    article_id VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    correlation_score DECIMAL(5,4),
    price_impact DECIMAL(10,4),
    volume_impact DECIMAL(10,4),
    time_lag_minutes INT,
    confidence DECIMAL(5,4),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES news_articles(article_id)
);

-- 12. Data Quality Metrics
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    metric_id VARCHAR(100) PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(18,6),
    threshold_value DECIMAL(18,6),
    status VARCHAR(20),
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details CLOB
);

-- 13. API Configuration
CREATE TABLE IF NOT EXISTS api_configuration (
    config_id VARCHAR(100) PRIMARY KEY,
    api_name VARCHAR(100) NOT NULL,
    endpoint_url VARCHAR(500),
    api_key VARCHAR(500),
    rate_limit INT,
    timeout_seconds INT,
    retry_count INT,
    enabled BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id VARCHAR(100) PRIMARY KEY,
    preferences CLOB NOT NULL,
    notification_settings CLOB,
    watchlist CLOB,
    risk_tolerance VARCHAR(20),
    investment_horizon VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Cache Metadata
CREATE TABLE IF NOT EXISTS cache_metadata (
    cache_key VARCHAR(200) PRIMARY KEY,
    cache_value CLOB,
    expiry_time TIMESTAMP,
    hit_count BIGINT DEFAULT 0,
    miss_count BIGINT DEFAULT 0,
    last_accessed TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_news_articles_publish_date ON news_articles(publish_date);
CREATE INDEX IF NOT EXISTS idx_news_articles_source ON news_articles(source);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_article ON sentiment_analysis(article_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON user_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_entity_relationships_source ON entity_relationships(source_entity_uri);
CREATE INDEX IF NOT EXISTS idx_entity_relationships_target ON entity_relationships(target_entity_uri);
CREATE INDEX IF NOT EXISTS idx_treasury_data_date ON treasury_data(date);
CREATE INDEX IF NOT EXISTS idx_model_performance_model ON model_performance_metrics(model_name);
CREATE INDEX IF NOT EXISTS idx_feature_store_entity ON feature_store(entity_id);
CREATE INDEX IF NOT EXISTS idx_rl_states_algorithm ON rl_states(algorithm_type);
CREATE INDEX IF NOT EXISTS idx_correlations_article ON news_market_correlations(article_id);
CREATE INDEX IF NOT EXISTS idx_correlations_symbol ON news_market_correlations(symbol);

-- Create views for common queries
CREATE OR REPLACE VIEW v_latest_market_data AS
SELECT 
    symbol,
    price,
    volume,
    timestamp,
    source,
    bid,
    ask,
    market_cap,
    pe_ratio
FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY timestamp DESC) as rn
    FROM market_data
) t
WHERE rn = 1;

CREATE OR REPLACE VIEW v_news_sentiment_summary AS
SELECT 
    n.article_id,
    n.title,
    n.publish_date,
    n.source,
    s.sentiment_score,
    s.confidence,
    CASE 
        WHEN s.sentiment_score > 0.6 THEN 'Positive'
        WHEN s.sentiment_score < -0.6 THEN 'Negative'
        ELSE 'Neutral'
    END as sentiment_category
FROM news_articles n
LEFT JOIN sentiment_analysis s ON n.article_id = s.article_id;

CREATE OR REPLACE VIEW v_treasury_yield_curve AS
SELECT 
    date,
    yield_1mo as "1M",
    yield_3mo as "3M",
    yield_6mo as "6M",
    yield_1yr as "1Y",
    yield_2yr as "2Y",
    yield_3yr as "3Y",
    yield_5yr as "5Y",
    yield_7yr as "7Y",
    yield_10yr as "10Y",
    yield_20yr as "20Y",
    yield_30yr as "30Y"
FROM treasury_data
WHERE date = (SELECT MAX(date) FROM treasury_data);

-- Grant permissions (adjust as needed)
-- GRANT SELECT ON ALL TABLES IN SCHEMA app_data TO readonly_user;
-- GRANT ALL ON SCHEMA app_data TO app_user;

-- Insert initial configuration data
INSERT INTO api_configuration (config_id, api_name, endpoint_url, rate_limit, timeout_seconds, retry_count)
VALUES 
    ('FMP_API', 'Financial Modeling Prep', 'https://financialmodelingprep.com/api/v3/', 300, 30, 3),
    ('NEWS_API', 'News API', 'https://newsapi.org/v2/', 500, 20, 3),
    ('ALPHA_VANTAGE', 'Alpha Vantage', 'https://www.alphavantage.co/query', 5, 30, 3);

-- Success message
SELECT 'Production schema created successfully!' as status;