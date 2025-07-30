-- World-Class Supabase Schema
-- This creates an enterprise-grade database structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Custom types for better data integrity
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'enterprise');

-- Enhanced users table with enterprise features
CREATE TABLE IF NOT EXISTS users (
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
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(full_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(username, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(bio, '')), 'C')
    ) STORED
);

-- High-performance indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_search ON users USING GIN(search_vector);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_metadata ON users USING GIN(metadata);
CREATE INDEX idx_users_subscription ON users(subscription_tier) WHERE deleted_at IS NULL;

-- Enhanced agents table with AI capabilities
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
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
    parent_agent_id UUID REFERENCES agents(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,
    suspended_reason TEXT,
    CONSTRAINT unique_agent_name_per_user UNIQUE(user_id, name)
);

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(status) WHERE status = 'active';
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_parent ON agents(parent_agent_id) WHERE parent_agent_id IS NOT NULL;
CREATE INDEX idx_agents_last_active ON agents(last_active_at DESC) WHERE status = 'active';

-- Agent interactions for A2A communication
CREATE TABLE IF NOT EXISTS agent_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    to_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL,
    request_payload JSONB,
    response_payload JSONB,
    status transaction_status DEFAULT 'pending',
    error_message TEXT,
    duration_ms INTEGER,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT different_agents CHECK (from_agent_id != to_agent_id)
);

CREATE INDEX idx_interactions_from ON agent_interactions(from_agent_id, created_at DESC);
CREATE INDEX idx_interactions_to ON agent_interactions(to_agent_id, created_at DESC);
CREATE INDEX idx_interactions_status ON agent_interactions(status) WHERE status != 'completed';

-- Real-time market data with time-series optimization
CREATE TABLE IF NOT EXISTS market_data (
    symbol TEXT NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    volume DECIMAL(20,8),
    market_cap DECIMAL(20,2),
    change_24h DECIMAL(10,4),
    change_percentage_24h DECIMAL(8,4),
    high_24h DECIMAL(20,8),
    low_24h DECIMAL(20,8),
    open_24h DECIMAL(20,8),
    bid DECIMAL(20,8),
    ask DECIMAL(20,8),
    spread DECIMAL(10,8),
    vwap DECIMAL(20,8),
    metadata JSONB DEFAULT '{}',
    source TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (symbol, timestamp)
);

-- Create hypertable for time-series data (if TimescaleDB is available)
-- SELECT create_hypertable('market_data', 'timestamp', chunk_time_interval => INTERVAL '1 day');

CREATE INDEX idx_market_data_symbol ON market_data(symbol, timestamp DESC);
CREATE INDEX idx_market_data_timestamp ON market_data(timestamp DESC);
CREATE INDEX idx_market_recent ON market_data(timestamp) WHERE timestamp > NOW() - INTERVAL '1 hour';

-- Process execution tracking
CREATE TABLE IF NOT EXISTS process_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_name TEXT NOT NULL,
    process_version TEXT,
    agent_id UUID REFERENCES agents(id),
    user_id UUID REFERENCES users(id),
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

CREATE INDEX idx_process_agent ON process_executions(agent_id, created_at DESC);
CREATE INDEX idx_process_user ON process_executions(user_id, created_at DESC);
CREATE INDEX idx_process_status ON process_executions(status) WHERE status != 'completed';
CREATE INDEX idx_process_name ON process_executions(process_name, created_at DESC);

-- Comprehensive audit logging
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    agent_id UUID REFERENCES agents(id),
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_ip ON audit_logs(ip_address) WHERE ip_address IS NOT NULL;

-- Security events tracking
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    severity risk_level NOT NULL,
    user_id UUID REFERENCES users(id),
    agent_id UUID REFERENCES agents(id),
    ip_address INET,
    details JSONB NOT NULL,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_unresolved ON security_events(severity, created_at DESC) WHERE resolved = false;
CREATE INDEX idx_security_user ON security_events(user_id, created_at DESC);
CREATE INDEX idx_security_type ON security_events(event_type, created_at DESC);

-- API usage tracking for rate limiting and billing
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    agent_id UUID REFERENCES agents(id),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    duration_ms INTEGER,
    tokens_used INTEGER,
    cost_usd DECIMAL(10,6),
    rate_limit_remaining INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by month for better performance
-- CREATE TABLE api_usage_2025_01 PARTITION OF api_usage FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE INDEX idx_api_usage_user ON api_usage(user_id, created_at DESC);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint, created_at DESC);
CREATE INDEX idx_api_usage_created ON api_usage(created_at DESC);

-- Notification queue for async processing
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 0,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    failed_attempts INTEGER DEFAULT 0,
    last_error TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read = false;
CREATE INDEX idx_notifications_unsent ON notifications(priority DESC, created_at) WHERE sent = false AND (expires_at IS NULL OR expires_at > NOW());

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to track agent activity
CREATE OR REPLACE FUNCTION track_agent_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE agents 
    SET 
        last_active_at = NOW(),
        total_requests = total_requests + 1
    WHERE id = NEW.agent_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_agent_activity_on_execution
    AFTER INSERT ON process_executions
    FOR EACH ROW
    EXECUTE FUNCTION track_agent_activity();

-- Function for soft deletes
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deleted_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id OR deleted_at IS NULL);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND deleted_at IS NULL);

-- Users can manage their own agents
CREATE POLICY "Users can view own agents" ON agents
    FOR SELECT USING (auth.uid() = user_id OR parent_agent_id IN (
        SELECT id FROM agents WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create agents" ON agents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agents" ON agents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agents" ON agents
    FOR DELETE USING (auth.uid() = user_id);

-- Process executions visible to owner
CREATE POLICY "Users can view own executions" ON process_executions
    FOR SELECT USING (auth.uid() = user_id);

-- API usage visible to owner
CREATE POLICY "Users can view own API usage" ON api_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Notifications for the user
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agents TO authenticated;
GRANT SELECT, INSERT ON process_executions TO authenticated;
GRANT SELECT ON api_usage TO authenticated;
GRANT SELECT, UPDATE ON notifications TO authenticated;

-- Create initial indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_login_tracking ON users(email, last_login_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_active_recently ON agents(last_active_at DESC) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_market_data_latest ON market_data(symbol, timestamp DESC);

-- Add comments for documentation
COMMENT ON TABLE users IS 'Core user accounts with enterprise features';
COMMENT ON TABLE agents IS 'AI agents with configurable capabilities';
COMMENT ON TABLE market_data IS 'Time-series financial market data';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance';
COMMENT ON TABLE security_events IS 'Security incident tracking and response';