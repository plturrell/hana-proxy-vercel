-- Create missing AI tables for production

-- 2. News Intelligence Tables
CREATE TABLE IF NOT EXISTS breaking_news_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    source VARCHAR(255),
    urgency_score INTEGER CHECK (urgency_score >= 0 AND urgency_score <= 100),
    market_impact_potential DECIMAL(3,2) CHECK (market_impact_potential >= 0 AND market_impact_potential <= 1),
    breaking_factors JSONB DEFAULT '[]'::jsonb,
    affected_entities JSONB DEFAULT '{}'::jsonb,
    agent_id TEXT REFERENCES a2a_agents(agent_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_sentiment_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id VARCHAR(255) NOT NULL,
    overall_sentiment DECIMAL(3,2) CHECK (overall_sentiment >= -1 AND overall_sentiment <= 1),
    market_sentiment DECIMAL(3,2) CHECK (market_sentiment >= -1 AND market_sentiment <= 1),
    investor_sentiment DECIMAL(3,2) CHECK (investor_sentiment >= -1 AND investor_sentiment <= 1),
    institutional_sentiment DECIMAL(3,2) CHECK (institutional_sentiment >= -1 AND institutional_sentiment <= 1),
    analysis_confidence DECIMAL(3,2) CHECK (analysis_confidence >= 0 AND analysis_confidence <= 1),
    signal_strength DECIMAL(3,2) CHECK (signal_strength >= 0 AND signal_strength <= 1),
    source_reliability DECIMAL(3,2) CHECK (source_reliability >= 0 AND source_reliability <= 1),
    fear_score DECIMAL(3,2) CHECK (fear_score >= 0 AND fear_score <= 1),
    greed_score DECIMAL(3,2) CHECK (greed_score >= 0 AND greed_score <= 1),
    uncertainty_score DECIMAL(3,2) CHECK (uncertainty_score >= 0 AND uncertainty_score <= 1),
    optimism_score DECIMAL(3,2) CHECK (optimism_score >= 0 AND optimism_score <= 1),
    panic_score DECIMAL(3,2) CHECK (panic_score >= 0 AND panic_score <= 1),
    full_analysis JSONB,
    analyzed_by TEXT REFERENCES a2a_agents(agent_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_market_impact (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id VARCHAR(255) NOT NULL,
    overall_impact_score INTEGER CHECK (overall_impact_score >= 0 AND overall_impact_score <= 100),
    impact_probability DECIMAL(3,2) CHECK (impact_probability >= 0 AND impact_probability <= 1),
    impact_timeframe VARCHAR(50),
    impact_magnitude VARCHAR(50),
    equity_impact JSONB,
    fixed_income_impact JSONB,
    currency_impact JSONB,
    commodity_impact JSONB,
    volatility_impact JSONB,
    liquidity_impact JSONB,
    trading_implications JSONB,
    full_assessment JSONB,
    assessed_by TEXT REFERENCES a2a_agents(agent_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_entity_extractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id VARCHAR(255) NOT NULL,
    companies JSONB DEFAULT '[]'::jsonb,
    financial_instruments JSONB DEFAULT '[]'::jsonb,
    people JSONB DEFAULT '[]'::jsonb,
    economic_indicators JSONB DEFAULT '[]'::jsonb,
    events_catalysts JSONB DEFAULT '[]'::jsonb,
    total_entities INTEGER DEFAULT 0,
    ai_enhanced BOOLEAN DEFAULT false,
    extraction_method VARCHAR(50),
    full_extraction JSONB,
    extracted_by TEXT REFERENCES a2a_agents(agent_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_breaking_news_alerts_created_at ON breaking_news_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_breaking_news_alerts_urgency ON breaking_news_alerts(urgency_score DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_article ON news_sentiment_analysis(article_id);
CREATE INDEX IF NOT EXISTS idx_impact_article ON news_market_impact(article_id);
CREATE INDEX IF NOT EXISTS idx_entities_article ON news_entity_extractions(article_id);

-- Enable Row Level Security
ALTER TABLE breaking_news_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_market_impact ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_entity_extractions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Enable read access for all users" ON breaking_news_alerts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON breaking_news_alerts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON news_sentiment_analysis
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON news_sentiment_analysis
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON news_market_impact
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON news_market_impact
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON news_entity_extractions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON news_entity_extractions
    FOR INSERT WITH CHECK (true);

-- Grant Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;