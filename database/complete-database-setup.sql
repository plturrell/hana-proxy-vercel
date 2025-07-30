-- Complete Database Setup for FinSight Intelligence
-- Run this entire script in your Supabase SQL Editor

-- =====================================================
-- PART 1: AUTHENTICATION TABLES
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' NOT NULL,
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'user', 'readonly')),
    CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'locked', 'pending'))
);

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    
    -- Unique constraint to prevent duplicate permissions
    UNIQUE(user_id, permission)
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Token blacklist table
CREATE TABLE IF NOT EXISTS token_blacklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('access', 'refresh')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason VARCHAR(100)
);

-- Login attempts table (for security)
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT false,
    failure_reason VARCHAR(100)
);

-- Email verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address INET
);

-- Session tracking table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked'))
);

-- =====================================================
-- PART 2: APPLICATION TABLES
-- =====================================================

-- A2A Agents table
CREATE TABLE IF NOT EXISTS a2a_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id VARCHAR(100) UNIQUE NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    agent_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    capabilities TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- A2A Messages table
CREATE TABLE IF NOT EXISTS a2a_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id VARCHAR(100) REFERENCES a2a_agents(agent_id),
    recipient_id VARCHAR(100) REFERENCES a2a_agents(agent_id),
    message_type VARCHAR(50),
    content TEXT,
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
);

-- A2A Agent connections
CREATE TABLE IF NOT EXISTS a2a_agent_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id VARCHAR(100) REFERENCES a2a_agents(agent_id),
    connected_agent_id VARCHAR(100) REFERENCES a2a_agents(agent_id),
    connection_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(agent_id, connected_agent_id)
);

-- A2A Agent metrics
CREATE TABLE IF NOT EXISTS a2a_agent_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id VARCHAR(100) REFERENCES a2a_agents(agent_id),
    metric_type VARCHAR(50),
    metric_value NUMERIC,
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- A2A Proposals (for consensus)
CREATE TABLE IF NOT EXISTS a2a_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id VARCHAR(100) UNIQUE NOT NULL,
    proposer_id VARCHAR(100) REFERENCES a2a_agents(agent_id),
    proposal_type VARCHAR(50),
    content TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- A2A Votes
CREATE TABLE IF NOT EXISTS a2a_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id VARCHAR(100) REFERENCES a2a_proposals(proposal_id),
    voter_id VARCHAR(100) REFERENCES a2a_agents(agent_id),
    vote VARCHAR(20) CHECK (vote IN ('approve', 'reject', 'abstain')),
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    UNIQUE(proposal_id, voter_id)
);

-- Smart Contract Templates
CREATE TABLE IF NOT EXISTS smart_contract_templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    source_code TEXT,
    abi JSONB,
    deployed_address VARCHAR(42),
    network VARCHAR(50) DEFAULT 'Ethereum Mainnet',
    compiler_version VARCHAR(50),
    license VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    popularity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Deployed Contracts
CREATE TABLE IF NOT EXISTS deployed_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id VARCHAR(100) REFERENCES smart_contract_templates(id),
    contract_name VARCHAR(255),
    contract_address VARCHAR(42),
    tx_hash VARCHAR(66),
    network VARCHAR(50),
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    gas_limit INTEGER,
    gas_used INTEGER,
    max_gas_price INTEGER,
    total_value NUMERIC DEFAULT 0,
    selected_agents VARCHAR(100)[],
    deployment_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deployed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Deployment Queue
CREATE TABLE IF NOT EXISTS deployment_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deployment_id UUID REFERENCES deployed_contracts(id),
    priority VARCHAR(20) DEFAULT 'normal',
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'queued',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- RAG Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    file_type VARCHAR(50),
    file_size_bytes INTEGER,
    source_url TEXT,
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Document Chunks
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536), -- For similarity search
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(document_id, chunk_index)
);

-- Document Embeddings (if not using vector column)
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
    embedding_vector FLOAT[],
    model_name VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PART 3: INDEXES FOR PERFORMANCE
-- =====================================================

-- Authentication indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON token_blacklist(token);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON login_attempts(email, attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ip_address, attempted_at);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Application indexes
CREATE INDEX IF NOT EXISTS idx_a2a_messages_sender ON a2a_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_a2a_messages_recipient ON a2a_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_a2a_messages_created ON a2a_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_user ON deployed_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_status ON deployed_contracts(status);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document ON document_chunks(document_id);

-- =====================================================
-- PART 4: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployed_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM user_permissions up 
        WHERE up.user_id = auth.uid() AND up.permission = 'users.read'
    ));

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM user_permissions up 
        WHERE up.user_id = auth.uid() AND up.permission = 'users.update'
    ));

-- RLS Policies for permissions
CREATE POLICY "Admins can manage permissions" ON user_permissions
    FOR ALL USING (EXISTS (
        SELECT 1 FROM user_permissions up 
        WHERE up.user_id = auth.uid() AND up.permission = 'system.admin'
    ));

-- RLS Policies for documents
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_permissions up 
        WHERE up.user_id = auth.uid() AND up.permission = 'documents.read'
    ));

CREATE POLICY "Users can create documents" ON documents
    FOR INSERT WITH CHECK (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_permissions up 
        WHERE up.user_id = auth.uid() AND up.permission = 'documents.create'
    ));

-- RLS Policies for deployed contracts
CREATE POLICY "Users can view own contracts" ON deployed_contracts
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_permissions up 
        WHERE up.user_id = auth.uid() AND up.permission = 'contracts.read'
    ));

-- =====================================================
-- PART 5: FUNCTIONS AND TRIGGERS
-- =====================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_a2a_agents_updated_at 
    BEFORE UPDATE ON a2a_agents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smart_contract_templates_updated_at 
    BEFORE UPDATE ON smart_contract_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Cleanup expired tokens function
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Clean up expired refresh tokens
    DELETE FROM refresh_tokens WHERE expires_at < NOW();
    
    -- Clean up expired blacklisted tokens
    DELETE FROM token_blacklist WHERE expires_at < NOW();
    
    -- Clean up expired email verifications
    DELETE FROM email_verifications WHERE expires_at < NOW();
    
    -- Clean up expired password reset tokens
    DELETE FROM password_reset_tokens WHERE expires_at < NOW();
    
    -- Clean up expired sessions
    DELETE FROM user_sessions WHERE expires_at < NOW();
    
    -- Clean up old login attempts (keep 30 days)
    DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Network connections function
CREATE OR REPLACE FUNCTION get_a2a_network_connections(
    active_only BOOLEAN DEFAULT true,
    include_metrics BOOLEAN DEFAULT true
)
RETURNS TABLE (
    source VARCHAR(100),
    target VARCHAR(100),
    connection_type VARCHAR(50),
    message_count BIGINT,
    last_activity TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.sender_id as source,
        m.recipient_id as target,
        'message' as connection_type,
        COUNT(*) as message_count,
        MAX(m.created_at) as last_activity,
        'active' as status
    FROM a2a_messages m
    WHERE 
        m.sender_id IS NOT NULL 
        AND m.recipient_id IS NOT NULL
        AND m.sender_id != m.recipient_id
        AND (NOT active_only OR m.status = 'sent')
    GROUP BY m.sender_id, m.recipient_id
    
    UNION ALL
    
    SELECT 
        ac.agent_id as source,
        ac.connected_agent_id as target,
        ac.connection_type,
        0 as message_count,
        ac.created_at as last_activity,
        ac.status
    FROM a2a_agent_connections ac
    WHERE NOT active_only OR ac.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Document search function (simplified without pgvector)
CREATE OR REPLACE FUNCTION search_documents(
    query_text TEXT,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INTEGER DEFAULT 20,
    filter_params JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    document_id UUID,
    title VARCHAR(255),
    content TEXT,
    relevance_score FLOAT,
    chunk_matches INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id as document_id,
        d.title,
        d.content,
        1.0 as relevance_score, -- Placeholder for actual similarity
        COUNT(dc.id)::INTEGER as chunk_matches
    FROM documents d
    LEFT JOIN document_chunks dc ON d.id = dc.document_id
    WHERE 
        d.status = 'active'
        AND (
            d.title ILIKE '%' || query_text || '%'
            OR d.content ILIKE '%' || query_text || '%'
            OR dc.content ILIKE '%' || query_text || '%'
        )
    GROUP BY d.id, d.title, d.content
    ORDER BY chunk_matches DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 6: INITIAL DATA
-- =====================================================

-- Create default admin user (password: AdminPassword123!)
INSERT INTO users (email, password_hash, role, status, email_verified, first_name, last_name)
VALUES (
    'admin@finsight.ai',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGTrOvwWG',
    'admin',
    'active',
    true,
    'System',
    'Administrator'
) ON CONFLICT (email) DO NOTHING;

-- Grant all permissions to admin user
INSERT INTO user_permissions (user_id, permission)
SELECT 
    u.id,
    p.permission
FROM users u
CROSS JOIN (
    VALUES 
        ('agents.read'), ('agents.create'), ('agents.update'), ('agents.delete'), ('agents.suggest'),
        ('network.read'), ('network.manage'),
        ('contracts.read'), ('contracts.create'), ('contracts.deploy'), ('contracts.delete'),
        ('documents.read'), ('documents.create'), ('documents.update'), ('documents.delete'), ('documents.search'),
        ('processes.read'), ('processes.create'), ('processes.export'),
        ('ai.use'), ('ai.configure'),
        ('users.read'), ('users.create'), ('users.update'), ('users.delete'),
        ('system.admin'), ('system.monitor')
) p(permission)
WHERE u.email = 'admin@finsight.ai'
ON CONFLICT (user_id, permission) DO NOTHING;

-- Insert sample smart contract templates
INSERT INTO smart_contract_templates (id, name, description, category, status, popularity)
VALUES 
    ('gnosis-safe', 'Multi-Person Approval', 'Requires multiple signatures for transaction execution', 'governance', 'active', 100),
    ('compound-timelock', 'Review Period Enforcement', 'Enforces mandatory waiting period before execution', 'governance', 'active', 85),
    ('automated-workflow', 'If-This-Then-That Logic', 'Automated conditional execution based on triggers', 'automation', 'active', 75),
    ('permission-management', 'Role-Based Access', 'Granular permission control for different user roles', 'security', 'active', 90)
ON CONFLICT (id) DO NOTHING;

-- Insert sample A2A agents
INSERT INTO a2a_agents (agent_id, agent_name, agent_type, capabilities)
VALUES 
    ('risk-analyzer-001', 'Risk Analyzer', 'analyzer', ARRAY['risk_assessment', 'portfolio_analysis', 'alert_generation']),
    ('market-monitor-001', 'Market Monitor', 'monitor', ARRAY['price_tracking', 'volume_analysis', 'trend_detection']),
    ('compliance-officer-001', 'Compliance Officer', 'guardian', ARRAY['regulation_check', 'audit_trail', 'compliance_reporting']),
    ('trade-executor-001', 'Trade Executor', 'executor', ARRAY['order_placement', 'execution_optimization', 'slippage_control'])
ON CONFLICT (agent_id) DO NOTHING;

-- =====================================================
-- PART 7: PERMISSIONS AND GRANTS
-- =====================================================

-- Grant appropriate permissions to anon and authenticated roles
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION cleanup_expired_tokens() TO authenticated;
GRANT EXECUTE ON FUNCTION get_a2a_network_connections(BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION search_documents(TEXT, FLOAT, INTEGER, JSONB) TO authenticated;

-- =====================================================
-- PART 8: FINAL NOTES
-- =====================================================

-- After running this script:
-- 1. Test the admin login with: admin@finsight.ai / AdminPassword123!
-- 2. Change the admin password immediately
-- 3. Create additional users as needed
-- 4. Set up scheduled job for cleanup_expired_tokens() function
-- 5. Configure your environment variables according to docs/ENVIRONMENT_VARIABLES.md

COMMENT ON SCHEMA public IS 'FinSight Intelligence Production Database Schema';