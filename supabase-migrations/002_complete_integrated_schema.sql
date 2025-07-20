-- Complete Integrated Supabase Schema
-- This creates all tables with proper relationships and foreign keys
-- No orphan tables or broken dependencies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Drop existing tables in correct dependency order (if they exist)
DROP TABLE IF EXISTS a2a_analytics_communications CASCADE;
DROP TABLE IF EXISTS ord_analytics_resources CASCADE;
DROP TABLE IF EXISTS prdord_analytics CASCADE;
DROP TABLE IF EXISTS api_usage CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS process_executions CASCADE;
DROP TABLE IF EXISTS agent_interactions CASCADE;
DROP TABLE IF EXISTS correlation_matrix CASCADE;
DROP TABLE IF EXISTS volatility_surface CASCADE;
DROP TABLE IF EXISTS yield_curve CASCADE;
DROP TABLE IF EXISTS risk_parameters CASCADE;
DROP TABLE IF EXISTS calculation_results CASCADE;
DROP TABLE IF EXISTS economic_indicators CASCADE;
DROP TABLE IF EXISTS forex_rates CASCADE;
DROP TABLE IF EXISTS bond_data CASCADE;
DROP TABLE IF EXISTS portfolio_holdings CASCADE;
DROP TABLE IF EXISTS market_data CASCADE;
DROP TABLE IF EXISTS price_alerts CASCADE;
DROP TABLE IF EXISTS session_states CASCADE;
DROP TABLE IF EXISTS user_tasks CASCADE;
DROP TABLE IF EXISTS rdf_triples CASCADE;
DROP TABLE IF EXISTS knowledge_graph_entities CASCADE;
DROP TABLE IF EXISTS news_queries CASCADE;
DROP TABLE IF EXISTS news_articles CASCADE;
DROP TABLE IF EXISTS a2a_agents CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Custom types for better data integrity
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'enterprise');
CREATE TYPE agent_type AS ENUM ('analytics', 'trading', 'research', 'compliance', 'autonomous');
CREATE TYPE message_type AS ENUM ('request', 'response', 'broadcast', 'negotiation', 'heartbeat');
CREATE TYPE resource_type AS ENUM ('function', 'dataset', 'model', 'api', 'computation', 'service');

-- 1. CORE USER MANAGEMENT
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    encrypted_email TEXT,
    avatar_url TEXT,
    full_name TEXT,
    username TEXT UNIQUE,
    bio TEXT,
    metadata JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    feature_flags JSONB DEFAULT '{}',
    subscription_tier subscription_tier DEFAULT 'free',
    risk_score DECIMAL(5,2) DEFAULT 0.0,
    kyc_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    api_key_hash TEXT,
    rate_limit_tier INTEGER DEFAULT 1,
    storage_quota_mb INTEGER DEFAULT 100,
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    failed_login_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Search capabilities
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(full_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(username, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(bio, '')), 'C')
    ) STORED,
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_risk_score CHECK (risk_score >= 0 AND risk_score <= 100),
    CONSTRAINT valid_rate_limit CHECK (rate_limit_tier > 0)
);

-- 2. NEWS & KNOWLEDGE SYSTEM
CREATE TABLE news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    url TEXT UNIQUE,
    source TEXT NOT NULL,
    author TEXT,
    published_at TIMESTAMPTZ,
    category TEXT,
    sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
    relevance_score DECIMAL(3,2), -- 0.0 to 1.0
    market_impact_score DECIMAL(3,2), -- 0.0 to 1.0
    symbols TEXT[], -- Related stock symbols
    entities JSONB DEFAULT '[]', -- Extracted entities
    keywords TEXT[],
    language VARCHAR(10) DEFAULT 'en',
    embedding vector(1536), -- For semantic search
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search capabilities
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'C')
    ) STORED,
    
    -- Constraints
    CONSTRAINT valid_sentiment CHECK (sentiment_score >= -1.0 AND sentiment_score <= 1.0),
    CONSTRAINT valid_relevance CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0),
    CONSTRAINT valid_impact CHECK (market_impact_score >= 0.0 AND market_impact_score <= 1.0)
);

CREATE TABLE news_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    results_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_results_count CHECK (results_count >= 0),
    CONSTRAINT valid_execution_time CHECK (execution_time_ms >= 0)
);

CREATE TABLE knowledge_graph_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id TEXT UNIQUE NOT NULL,
    entity_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    properties JSONB DEFAULT '{}',
    confidence DECIMAL(3,2) DEFAULT 1.0,
    source_articles UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_confidence CHECK (confidence >= 0.0 AND confidence <= 1.0)
);

CREATE TABLE rdf_triples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject TEXT NOT NULL,
    predicate TEXT NOT NULL,
    object TEXT NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 1.0,
    source_article_id UUID REFERENCES news_articles(id) ON DELETE SET NULL,
    extraction_method TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint for triples
    UNIQUE(subject, predicate, object),
    
    -- Constraints
    CONSTRAINT valid_triple_confidence CHECK (confidence >= 0.0 AND confidence <= 1.0)
);

-- 3. AGENTS SYSTEM
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type agent_type NOT NULL,
    status agent_status DEFAULT 'pending',
    capabilities JSONB DEFAULT '[]',
    configuration JSONB DEFAULT '{}',
    secrets JSONB DEFAULT '{}', -- Encrypted in application
    ai_model TEXT DEFAULT 'gpt-4-turbo-preview',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4096,
    performance_metrics JSONB DEFAULT '{}',
    resource_limits JSONB DEFAULT '{
        "cpu_limit": 1.0,
        "memory_limit_mb": 512,
        "storage_limit_mb": 100,
        "requests_per_minute": 60
    }',
    total_tokens_used BIGINT DEFAULT 0,
    total_requests BIGINT DEFAULT 0,
    total_errors BIGINT DEFAULT 0,
    average_response_time_ms DECIMAL(10,2),
    version INTEGER DEFAULT 1,
    parent_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,
    suspended_reason TEXT,
    
    -- Unique constraint
    CONSTRAINT unique_agent_name_per_user UNIQUE(user_id, name),
    
    -- Constraints
    CONSTRAINT valid_temperature CHECK (temperature >= 0.0 AND temperature <= 2.0),
    CONSTRAINT valid_max_tokens CHECK (max_tokens > 0),
    CONSTRAINT valid_version CHECK (version > 0)
);

-- A2A (Agent-to-Agent) System Tables
CREATE TABLE a2a_agents (
    agent_id TEXT PRIMARY KEY,
    base_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type agent_type NOT NULL,
    description TEXT,
    capabilities TEXT[],
    status agent_status DEFAULT 'active',
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    total_requests INTEGER DEFAULT 0,
    voting_power INTEGER DEFAULT 100,
    blockchain_config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_tasks JSONB DEFAULT '[]',
    voting_preferences JSONB DEFAULT '{}',
    personality TEXT DEFAULT 'professional',
    goals TEXT[] DEFAULT ARRAY[]::TEXT[],
    last_active TIMESTAMPTZ DEFAULT NOW(),
    performance_score DECIMAL(5,2) DEFAULT 100.00,
    autonomy_enabled BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT valid_success_rate CHECK (success_rate >= 0.0 AND success_rate <= 100.0),
    CONSTRAINT valid_voting_power CHECK (voting_power >= 0),
    CONSTRAINT valid_performance_score CHECK (performance_score >= 0.0 AND performance_score <= 100.0)
);

CREATE TABLE agent_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    to_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    a2a_from_agent_id TEXT REFERENCES a2a_agents(agent_id) ON DELETE SET NULL,
    a2a_to_agent_id TEXT REFERENCES a2a_agents(agent_id) ON DELETE SET NULL,
    interaction_type TEXT NOT NULL,
    request_payload JSONB,
    response_payload JSONB,
    status transaction_status DEFAULT 'pending',
    error_message TEXT,
    duration_ms INTEGER,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT different_agents CHECK (from_agent_id != to_agent_id),
    CONSTRAINT valid_duration CHECK (duration_ms >= 0),
    CONSTRAINT valid_tokens CHECK (tokens_used >= 0)
);

-- 4. MARKET DATA SYSTEM
CREATE TABLE market_data (
    id UUID DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    asset_type TEXT NOT NULL, -- 'stock', 'bond', 'forex', 'commodity', 'crypto'
    price DECIMAL(20,8) NOT NULL,
    bid DECIMAL(20,8),
    ask DECIMAL(20,8),
    volume BIGINT,
    market_cap DECIMAL(20,2),
    change_24h DECIMAL(10,4),
    change_percentage_24h DECIMAL(8,4),
    high_24h DECIMAL(20,8),
    low_24h DECIMAL(20,8),
    open_24h DECIMAL(20,8),
    vwap DECIMAL(20,8),
    exchange TEXT,
    currency VARCHAR(3) DEFAULT 'USD',
    metadata JSONB DEFAULT '{}',
    source TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (symbol, timestamp),
    
    -- Constraints
    CONSTRAINT valid_price CHECK (price > 0),
    CONSTRAINT valid_volume CHECK (volume >= 0),
    CONSTRAINT valid_currency CHECK (length(currency) = 3)
);

CREATE TABLE portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    quantity DECIMAL(18,6) NOT NULL,
    avg_cost DECIMAL(18,6) NOT NULL,
    current_price DECIMAL(18,6),
    market_value DECIMAL(20,2),
    unrealized_pnl DECIMAL(20,2),
    sector TEXT,
    asset_class TEXT,
    weight DECIMAL(8,4), -- Portfolio weight percentage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT unique_user_symbol UNIQUE(user_id, symbol),
    
    -- Constraints
    CONSTRAINT valid_quantity CHECK (quantity != 0),
    CONSTRAINT valid_avg_cost CHECK (avg_cost > 0),
    CONSTRAINT valid_weight CHECK (weight >= 0 AND weight <= 100)
);

CREATE TABLE bond_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL UNIQUE,
    cusip VARCHAR(12),
    issuer TEXT,
    coupon_rate DECIMAL(8,4),
    yield_to_maturity DECIMAL(8,4),
    duration DECIMAL(8,4),
    convexity DECIMAL(10,6),
    face_value DECIMAL(18,2) DEFAULT 1000,
    current_price DECIMAL(8,4),
    maturity_date DATE,
    issue_date DATE,
    credit_rating TEXT,
    sector TEXT,
    callable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_coupon_rate CHECK (coupon_rate >= 0),
    CONSTRAINT valid_yield CHECK (yield_to_maturity >= 0),
    CONSTRAINT valid_duration CHECK (duration >= 0),
    CONSTRAINT valid_face_value CHECK (face_value > 0),
    CONSTRAINT valid_price CHECK (current_price > 0),
    CONSTRAINT valid_dates CHECK (maturity_date > issue_date)
);

CREATE TABLE forex_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency VARCHAR(3) NOT NULL,
    quote_currency VARCHAR(3) NOT NULL,
    spot_rate DECIMAL(12,6) NOT NULL,
    bid DECIMAL(12,6),
    ask DECIMAL(12,6),
    high_24h DECIMAL(12,6),
    low_24h DECIMAL(12,6),
    change_24h DECIMAL(8,4),
    volatility DECIMAL(8,4),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    source TEXT DEFAULT 'live_feed',
    
    -- Unique constraint
    CONSTRAINT unique_currency_pair_time UNIQUE(base_currency, quote_currency, timestamp),
    
    -- Constraints
    CONSTRAINT valid_currencies CHECK (base_currency != quote_currency),
    CONSTRAINT valid_spot_rate CHECK (spot_rate > 0),
    CONSTRAINT different_currencies CHECK (base_currency != quote_currency)
);

CREATE TABLE economic_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator_name TEXT NOT NULL,
    indicator_code TEXT NOT NULL,
    value DECIMAL(12,6) NOT NULL,
    period_type TEXT, -- 'daily', 'monthly', 'quarterly', 'annual'
    period_date DATE NOT NULL,
    country VARCHAR(3) DEFAULT 'US',
    unit TEXT,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT unique_indicator_period UNIQUE(indicator_code, period_date, country)
);

CREATE TABLE yield_curve (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curve_date DATE NOT NULL,
    maturity_months INTEGER NOT NULL,
    yield_rate DECIMAL(8,4) NOT NULL,
    curve_type TEXT DEFAULT 'treasury',
    country VARCHAR(3) DEFAULT 'US',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT unique_curve_maturity_date UNIQUE(curve_date, maturity_months, curve_type, country),
    
    -- Constraints
    CONSTRAINT valid_maturity CHECK (maturity_months > 0),
    CONSTRAINT valid_yield_rate CHECK (yield_rate >= 0)
);

CREATE TABLE volatility_surface (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    strike_price DECIMAL(12,4) NOT NULL,
    expiry_date DATE NOT NULL,
    volatility DECIMAL(8,4) NOT NULL,
    option_type VARCHAR(4), -- 'call', 'put'
    delta DECIMAL(8,4),
    gamma DECIMAL(8,4),
    vega DECIMAL(8,4),
    theta DECIMAL(8,4),
    trade_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT unique_option_surface UNIQUE(symbol, strike_price, expiry_date, option_type, trade_date),
    
    -- Constraints
    CONSTRAINT valid_strike CHECK (strike_price > 0),
    CONSTRAINT valid_volatility CHECK (volatility > 0),
    CONSTRAINT valid_option_type CHECK (option_type IN ('call', 'put'))
);

CREATE TABLE correlation_matrix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset1 TEXT NOT NULL,
    asset2 TEXT NOT NULL,
    correlation DECIMAL(8,6) NOT NULL,
    lookback_days INTEGER DEFAULT 252,
    calculation_date DATE DEFAULT CURRENT_DATE,
    data_source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT unique_correlation_pair_date UNIQUE(asset1, asset2, calculation_date, lookback_days),
    
    -- Constraints
    CONSTRAINT valid_correlation CHECK (correlation >= -1.0 AND correlation <= 1.0),
    CONSTRAINT valid_lookback CHECK (lookback_days > 0),
    CONSTRAINT different_assets CHECK (asset1 != asset2)
);

-- 5. USER MANAGEMENT EXTENSIONS
CREATE TABLE user_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status transaction_status DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    due_date TIMESTAMPTZ,
    assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 10)
);

CREATE TABLE session_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    state_data JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT unique_user_session UNIQUE(user_id, session_id),
    
    -- Constraints
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    condition_type TEXT NOT NULL, -- 'above', 'below', 'percent_change'
    target_value DECIMAL(20,8) NOT NULL,
    current_value DECIMAL(20,8),
    triggered BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_condition CHECK (condition_type IN ('above', 'below', 'percent_change')),
    CONSTRAINT valid_target CHECK (target_value > 0)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 5,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    failed_attempts INTEGER DEFAULT 0,
    last_error TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 10),
    CONSTRAINT valid_failed_attempts CHECK (failed_attempts >= 0)
);

-- 6. PROCESS EXECUTION & MONITORING
CREATE TABLE process_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_name TEXT NOT NULL,
    process_version TEXT,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    input_data JSONB,
    output_data JSONB,
    status transaction_status DEFAULT 'pending',
    error_message TEXT,
    error_stack TEXT,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_ms INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN end_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (end_time - start_time)) * 1000
            ELSE NULL
        END
    ) STORED,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE calculation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calculation_type TEXT NOT NULL,
    input_parameters JSONB NOT NULL,
    result_value DECIMAL(18,6),
    result_data JSONB,
    portfolio_id UUID REFERENCES portfolio_holdings(id) ON DELETE SET NULL,
    symbol TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    execution_id UUID REFERENCES process_executions(id) ON DELETE SET NULL,
    calculation_date TIMESTAMPTZ DEFAULT NOW(),
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_execution_time CHECK (execution_time_ms >= 0)
);

CREATE TABLE risk_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parameter_name TEXT NOT NULL,
    parameter_value DECIMAL(12,6) NOT NULL,
    parameter_type TEXT,
    asset_class TEXT,
    sector TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    effective_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (expiry_date IS NULL OR expiry_date > effective_date)
);

-- 7. AUDIT & SECURITY
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    country_code CHAR(2),
    request_id UUID,
    session_id UUID,
    request_body JSONB,
    response_status INTEGER,
    response_body JSONB,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_response_status CHECK (response_status >= 100 AND response_status < 600),
    CONSTRAINT valid_duration CHECK (duration_ms >= 0)
);

CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    severity risk_level NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    ip_address INET,
    details JSONB NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_resolution CHECK (
        (resolved = FALSE AND resolved_by IS NULL AND resolved_at IS NULL) OR
        (resolved = TRUE AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL)
    )
);

CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    duration_ms INTEGER,
    tokens_used INTEGER,
    cost_usd DECIMAL(10,6),
    rate_limit_remaining INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_status_code CHECK (status_code >= 100 AND status_code < 600),
    CONSTRAINT valid_request_size CHECK (request_size_bytes >= 0),
    CONSTRAINT valid_response_size CHECK (response_size_bytes >= 0),
    CONSTRAINT valid_api_duration CHECK (duration_ms >= 0),
    CONSTRAINT valid_tokens_used CHECK (tokens_used >= 0),
    CONSTRAINT valid_cost CHECK (cost_usd >= 0)
);

-- 8. A2A SYSTEM EXTENSIONS
CREATE TABLE ord_analytics_resources (
    resource_id TEXT PRIMARY KEY DEFAULT 'ord_' || gen_random_uuid()::text,
    agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id) ON DELETE CASCADE,
    resource_type resource_type NOT NULL,
    resource_name TEXT NOT NULL,
    resource_path TEXT,
    capabilities JSONB,
    requirements JSONB,
    metadata JSONB,
    status agent_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE a2a_analytics_communications (
    communication_id TEXT PRIMARY KEY DEFAULT 'a2a_' || gen_random_uuid()::text,
    sender_agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id) ON DELETE CASCADE,
    receiver_agent_id TEXT REFERENCES a2a_agents(agent_id) ON DELETE SET NULL,
    message_type message_type NOT NULL,
    protocol TEXT DEFAULT 'analytics_v1',
    payload JSONB NOT NULL,
    status transaction_status DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    received_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 10),
    CONSTRAINT different_agents CHECK (sender_agent_id != receiver_agent_id)
);

CREATE TABLE prdord_analytics (
    order_id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id) ON DELETE CASCADE,
    function_name TEXT NOT NULL,
    priority INTEGER DEFAULT 5,
    status transaction_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    result JSONB,
    execution_time_ms INTEGER,
    input_parameters JSONB,
    requester_id TEXT,
    error_message TEXT,
    
    -- Constraints
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 10),
    CONSTRAINT valid_execution_time CHECK (execution_time_ms >= 0)
);

-- Create comprehensive indexes for performance
-- Users
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_search ON users USING GIN(search_vector);
CREATE INDEX idx_users_subscription ON users(subscription_tier) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_last_login ON users(last_login_at DESC) WHERE deleted_at IS NULL;

-- News & Knowledge
CREATE INDEX idx_news_articles_published ON news_articles(published_at DESC);
CREATE INDEX idx_news_articles_source ON news_articles(source, published_at DESC);
CREATE INDEX idx_news_articles_symbols ON news_articles USING GIN(symbols);
CREATE INDEX idx_news_articles_search ON news_articles USING GIN(search_vector);
CREATE INDEX idx_news_queries_user ON news_queries(user_id, created_at DESC);
CREATE INDEX idx_knowledge_entities_type ON knowledge_graph_entities(entity_type);
CREATE INDEX idx_rdf_triples_subject ON rdf_triples(subject);
CREATE INDEX idx_rdf_triples_article ON rdf_triples(source_article_id);

-- Agents
CREATE INDEX idx_agents_user_id ON agents(user_id, status);
CREATE INDEX idx_agents_type_status ON agents(type, status);
CREATE INDEX idx_agents_last_active ON agents(last_active_at DESC) WHERE status = 'active';
CREATE INDEX idx_a2a_agents_type ON a2a_agents(type, status);
CREATE INDEX idx_agent_interactions_from ON agent_interactions(from_agent_id, created_at DESC);
CREATE INDEX idx_agent_interactions_to ON agent_interactions(to_agent_id, created_at DESC);

-- Market Data
CREATE INDEX idx_market_data_symbol_time ON market_data(symbol, timestamp DESC);
CREATE INDEX idx_market_data_asset_type ON market_data(asset_type, timestamp DESC);
CREATE INDEX idx_portfolio_holdings_user ON portfolio_holdings(user_id);
CREATE INDEX idx_bond_data_symbol ON bond_data(symbol);
CREATE INDEX idx_forex_rates_pair ON forex_rates(base_currency, quote_currency, timestamp DESC);
CREATE INDEX idx_yield_curve_date ON yield_curve(curve_date DESC, maturity_months);
CREATE INDEX idx_volatility_surface_symbol ON volatility_surface(symbol, expiry_date);

-- Process & Monitoring
CREATE INDEX idx_process_executions_agent ON process_executions(agent_id, start_time DESC);
CREATE INDEX idx_process_executions_user ON process_executions(user_id, start_time DESC);
CREATE INDEX idx_process_executions_status ON process_executions(status) WHERE status != 'completed';
CREATE INDEX idx_calculation_results_type ON calculation_results(calculation_type, calculation_date DESC);
CREATE INDEX idx_calculation_results_user ON calculation_results(user_id, created_at DESC);

-- Audit & Security
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_security_events_unresolved ON security_events(severity, created_at DESC) WHERE resolved = FALSE;
CREATE INDEX idx_api_usage_user_time ON api_usage(user_id, created_at DESC);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint, created_at DESC);

-- A2A System
CREATE INDEX idx_ord_resources_agent ON ord_analytics_resources(agent_id, status);
CREATE INDEX idx_a2a_comms_sender ON a2a_analytics_communications(sender_agent_id, created_at DESC);
CREATE INDEX idx_a2a_comms_receiver ON a2a_analytics_communications(receiver_agent_id, created_at DESC);
CREATE INDEX idx_prdord_agent_status ON prdord_analytics(agent_id, status);

-- User Extensions
CREATE INDEX idx_user_tasks_user_status ON user_tasks(user_id, status);
CREATE INDEX idx_session_states_user ON session_states(user_id, expires_at);
CREATE INDEX idx_price_alerts_user_active ON price_alerts(user_id, active) WHERE active = TRUE;
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read = FALSE;

-- Create triggers for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_knowledge_updated_at BEFORE UPDATE ON knowledge_graph_entities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_portfolio_updated_at BEFORE UPDATE ON portfolio_holdings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bond_updated_at BEFORE UPDATE ON bond_data FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_a2a_agents_updated_at BEFORE UPDATE ON a2a_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_ord_resources_updated_at BEFORE UPDATE ON ord_analytics_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_risk_params_updated_at BEFORE UPDATE ON risk_parameters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_tasks_updated_at BEFORE UPDATE ON user_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_session_states_updated_at BEFORE UPDATE ON session_states FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create comprehensive audit trigger
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        metadata
    ) VALUES (
        COALESCE(
            (SELECT id FROM users WHERE id = auth.uid()),
            NEW.user_id,
            OLD.user_id
        ),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'timestamp', NOW()
        )
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_agents AFTER INSERT OR UPDATE OR DELETE ON agents FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_portfolio AFTER INSERT OR UPDATE OR DELETE ON portfolio_holdings FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_price_alerts AFTER INSERT OR UPDATE OR DELETE ON price_alerts FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
-- Users can manage their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Users can manage their own agents
CREATE POLICY "Users can manage own agents" ON agents FOR ALL USING (auth.uid() = user_id);

-- Users can view their own interactions
CREATE POLICY "Users can view own interactions" ON agent_interactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM agents WHERE id = from_agent_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM agents WHERE id = to_agent_id AND user_id = auth.uid())
);

-- Users can manage their own portfolio
CREATE POLICY "Users can manage own portfolio" ON portfolio_holdings FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own tasks
CREATE POLICY "Users can manage own tasks" ON user_tasks FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own sessions
CREATE POLICY "Users can manage own sessions" ON session_states FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own alerts
CREATE POLICY "Users can manage own alerts" ON price_alerts FOR ALL USING (auth.uid() = user_id);

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Users can view their own process executions
CREATE POLICY "Users can view own executions" ON process_executions FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own calculations
CREATE POLICY "Users can view own calculations" ON calculation_results FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own risk parameters
CREATE POLICY "Users can manage own risk params" ON risk_parameters FOR ALL USING (auth.uid() = user_id);

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own API usage
CREATE POLICY "Users can view own API usage" ON api_usage FOR SELECT USING (auth.uid() = user_id);

-- Public read access for market data and news (with potential premium restrictions)
CREATE POLICY "Public can read market data" ON market_data FOR SELECT USING (true);
CREATE POLICY "Public can read news articles" ON news_articles FOR SELECT USING (true);
CREATE POLICY "Public can read bond data" ON bond_data FOR SELECT USING (true);
CREATE POLICY "Public can read forex rates" ON forex_rates FOR SELECT USING (true);
CREATE POLICY "Public can read economic indicators" ON economic_indicators FOR SELECT USING (true);
CREATE POLICY "Public can read yield curve" ON yield_curve FOR SELECT USING (true);
CREATE POLICY "Public can read volatility surface" ON volatility_surface FOR SELECT USING (true);
CREATE POLICY "Public can read correlation matrix" ON correlation_matrix FOR SELECT USING (true);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agent_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON portfolio_holdings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON session_states TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON price_alerts TO authenticated;
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT ON process_executions TO authenticated;
GRANT SELECT, INSERT ON calculation_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON risk_parameters TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON api_usage TO authenticated;
GRANT SELECT, INSERT ON news_queries TO authenticated;

-- Grant read access to public data
GRANT SELECT ON market_data TO anon, authenticated;
GRANT SELECT ON news_articles TO anon, authenticated;
GRANT SELECT ON bond_data TO anon, authenticated;
GRANT SELECT ON forex_rates TO anon, authenticated;
GRANT SELECT ON economic_indicators TO anon, authenticated;
GRANT SELECT ON yield_curve TO anon, authenticated;
GRANT SELECT ON volatility_surface TO anon, authenticated;
GRANT SELECT ON correlation_matrix TO anon, authenticated;
GRANT SELECT ON knowledge_graph_entities TO anon, authenticated;
GRANT SELECT ON rdf_triples TO anon, authenticated;

-- Create views for monitoring and analytics
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.email,
    u.subscription_tier,
    COUNT(DISTINCT a.id) as total_agents,
    COUNT(DISTINCT p.id) as total_portfolio_items,
    COUNT(DISTINCT pe.id) as total_executions,
    MAX(u.last_login_at) as last_login,
    COUNT(DISTINCT al.id) as total_audit_events
FROM users u
LEFT JOIN agents a ON u.id = a.user_id
LEFT JOIN portfolio_holdings p ON u.id = p.user_id
LEFT JOIN process_executions pe ON u.id = pe.user_id
LEFT JOIN audit_logs al ON u.id = al.user_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.email, u.subscription_tier;

CREATE OR REPLACE VIEW system_health_metrics AS
SELECT 
    'users' as metric_name,
    COUNT(*)::text as metric_value,
    'total' as metric_type
FROM users WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'active_agents' as metric_name,
    COUNT(*)::text as metric_value,
    'count' as metric_type
FROM agents WHERE status = 'active'
UNION ALL
SELECT 
    'pending_executions' as metric_name,
    COUNT(*)::text as metric_value,
    'count' as metric_type
FROM process_executions WHERE status = 'pending'
UNION ALL
SELECT 
    'unresolved_security_events' as metric_name,
    COUNT(*)::text as metric_value,
    'critical' as metric_type
FROM security_events WHERE resolved = FALSE AND severity = 'critical';

-- Add helpful comments
COMMENT ON TABLE users IS 'Core user accounts with enterprise features and security';
COMMENT ON TABLE agents IS 'AI agents with configurable capabilities and performance tracking';
COMMENT ON TABLE a2a_agents IS 'Agent-to-agent autonomous system registry';
COMMENT ON TABLE market_data IS 'Real-time and historical market data with time-series optimization';
COMMENT ON TABLE news_articles IS 'News articles with NLP analysis and market impact scoring';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance and security';
COMMENT ON TABLE security_events IS 'Security incident tracking and response system';

-- Success message
SELECT 'Complete integrated schema deployed successfully!' as status,
       COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'agents', 'a2a_agents', 'agent_interactions', 'market_data', 
    'news_articles', 'news_queries', 'knowledge_graph_entities', 'rdf_triples',
    'portfolio_holdings', 'bond_data', 'forex_rates', 'economic_indicators',
    'yield_curve', 'volatility_surface', 'correlation_matrix',
    'user_tasks', 'session_states', 'price_alerts', 'notifications',
    'process_executions', 'calculation_results', 'risk_parameters',
    'audit_logs', 'security_events', 'api_usage',
    'ord_analytics_resources', 'a2a_analytics_communications', 'prdord_analytics'
);