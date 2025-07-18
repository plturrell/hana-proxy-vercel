-- A2A BLOCKCHAIN SYSTEM - COMPLETE DEPLOYMENT
-- Run this entire file in Supabase SQL Editor
-- https://supabase.com/dashboard/project/qupqqlxhtnoljlnkfpmc/sql/new

-- =====================================================
-- STEP 1: CREATE BASE TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS a2a_agents (
    agent_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    capabilities TEXT[],
    status TEXT DEFAULT 'active',
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
    autonomy_enabled BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS a2a_messages (
    message_id TEXT PRIMARY KEY,
    sender_id TEXT REFERENCES a2a_agents(agent_id),
    recipient_ids TEXT[],
    message_type TEXT NOT NULL,
    content JSONB,
    status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    autonomy_generated BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0,
    requires_response BOOLEAN DEFAULT false,
    response_deadline TIMESTAMPTZ,
    blockchain_verified BOOLEAN DEFAULT false,
    reputation_score INTEGER DEFAULT 0,
    signature TEXT,
    routing_priority TEXT DEFAULT 'normal'
);

CREATE TABLE IF NOT EXISTS agent_activity (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    activity_type TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_blockchain_activities (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    activity_type TEXT NOT NULL,
    contract_name TEXT,
    contract_address TEXT,
    function_name TEXT,
    transaction_hash TEXT,
    value_transferred TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS a2a_blockchain_escrows (
    escrow_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    contract_address TEXT NOT NULL UNIQUE,
    client_agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    processor_agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    amount TEXT NOT NULL,
    currency TEXT DEFAULT 'ETH',
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED')),
    requirements JSONB NOT NULL,
    requirements_hash TEXT NOT NULL,
    deadline TIMESTAMPTZ,
    deployment_tx TEXT NOT NULL,
    blockchain_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS deployed_contracts (
    contract_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_name TEXT NOT NULL,
    contract_address TEXT NOT NULL UNIQUE,
    network TEXT NOT NULL DEFAULT 'supabase',
    deployer TEXT NOT NULL,
    deployed_by_agent TEXT REFERENCES a2a_agents(agent_id),
    deployment_tx TEXT NOT NULL,
    abi JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 2: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_messages_sender ON a2a_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_agent_id ON agent_activity(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_blockchain_agent ON agent_blockchain_activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_escrows_client ON a2a_blockchain_escrows(client_agent_id);

-- =====================================================
-- STEP 3: INSERT SAMPLE DATA
-- =====================================================

INSERT INTO a2a_agents (agent_id, name, type, status, blockchain_config, capabilities) VALUES
('blockchain-agent-alpha', 'Blockchain Alpha Agent', 'executor', 'active', 
 '{"blockchain_id": "0x1234567890abcdef", "wallet_address": "0xabc123", "network": "supabase-private", "balance": "100 ETH"}',
 ARRAY['blockchain_execution', 'smart_contracts', 'consensus_voting']),
('blockchain-agent-beta', 'Blockchain Beta Agent', 'validator', 'active',
 '{"blockchain_id": "0xfedcba0987654321", "wallet_address": "0xdef456", "network": "supabase-private", "balance": "100 ETH"}',
 ARRAY['blockchain_validation', 'reputation_tracking', 'escrow_management'])
ON CONFLICT (agent_id) DO UPDATE SET
    blockchain_config = EXCLUDED.blockchain_config,
    capabilities = EXCLUDED.capabilities;

-- =====================================================
-- STEP 4: GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

SELECT 'Deployment complete! Tables created:' as status,
       COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('a2a_agents', 'a2a_messages', 'agent_activity', 
                   'agent_blockchain_activities', 'a2a_blockchain_escrows', 
                   'deployed_contracts');