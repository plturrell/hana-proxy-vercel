-- A2A Blockchain System - Complete Deployment
-- This file deploys all required schemas for the A2A blockchain system

-- =====================================================
-- 1. AUTONOMY SCHEMA UPDATES
-- =====================================================

-- Update a2a_agents table with autonomy fields
ALTER TABLE a2a_agents
ADD COLUMN IF NOT EXISTS scheduled_tasks JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS voting_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS personality TEXT DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS performance_score DECIMAL(5,2) DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS autonomy_enabled BOOLEAN DEFAULT true;

-- Agent activity logging table
CREATE TABLE IF NOT EXISTS agent_activity (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    activity_type TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_activity_agent_id ON agent_activity(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_type ON agent_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_agent_activity_created ON agent_activity(created_at DESC);

-- Agent memory/context table
CREATE TABLE IF NOT EXISTS agent_memory (
    memory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    memory_type TEXT NOT NULL,
    context JSONB NOT NULL,
    importance DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_id ON agent_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_expires ON agent_memory(expires_at);

-- Agent scheduled tasks execution log
CREATE TABLE IF NOT EXISTS agent_task_executions (
    execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    task_name TEXT NOT NULL,
    status TEXT NOT NULL,
    result JSONB,
    error TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_task_executions_agent_id ON agent_task_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_task_executions_status ON agent_task_executions(status);

-- Agent errors table
CREATE TABLE IF NOT EXISTS agent_errors (
    error_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_errors_agent_id ON agent_errors(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_errors_created ON agent_errors(created_at DESC);

-- Update messages table for autonomy support
ALTER TABLE a2a_messages
ADD COLUMN IF NOT EXISTS autonomy_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS requires_response BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMPTZ;

-- =====================================================
-- 2. BLOCKCHAIN INTEGRATION SCHEMA
-- =====================================================

-- Contract ABIs table
CREATE TABLE IF NOT EXISTS contract_abis (
    contract_name TEXT PRIMARY KEY,
    abi JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deployed contracts table  
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

CREATE INDEX IF NOT EXISTS idx_deployed_contracts_name ON deployed_contracts(contract_name);
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_network ON deployed_contracts(network);
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_deployer ON deployed_contracts(deployer);

-- Blockchain events table
CREATE TABLE IF NOT EXISTS blockchain_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_name TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    event_name TEXT NOT NULL,
    args JSONB,
    transaction_hash TEXT NOT NULL,
    block_number BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blockchain_events_contract ON blockchain_events(contract_name);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_event ON blockchain_events(event_name);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_block ON blockchain_events(block_number DESC);

-- Agent blockchain activities
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

CREATE INDEX IF NOT EXISTS idx_agent_blockchain_agent ON agent_blockchain_activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_blockchain_type ON agent_blockchain_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_agent_blockchain_status ON agent_blockchain_activities(status);

-- =====================================================
-- 3. BLOCKCHAIN ENHANCEMENT SCHEMA
-- =====================================================

-- Blockchain escrows table
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

CREATE INDEX IF NOT EXISTS idx_blockchain_escrows_client ON a2a_blockchain_escrows(client_agent_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_escrows_processor ON a2a_blockchain_escrows(processor_agent_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_escrows_status ON a2a_blockchain_escrows(status);

-- Escrow disputes table
CREATE TABLE IF NOT EXISTS a2a_escrow_disputes (
    dispute_id TEXT PRIMARY KEY,
    escrow_id TEXT NOT NULL REFERENCES a2a_blockchain_escrows(escrow_id),
    complainant_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    dispute_reason TEXT NOT NULL,
    evidence JSONB DEFAULT '{}',
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED')),
    resolution JSONB,
    arbitrators TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_escrow_disputes_escrow ON a2a_escrow_disputes(escrow_id);
CREATE INDEX IF NOT EXISTS idx_escrow_disputes_status ON a2a_escrow_disputes(status);

-- Blockchain message enhancements
ALTER TABLE a2a_messages 
ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS signature TEXT,
ADD COLUMN IF NOT EXISTS routing_priority TEXT DEFAULT 'normal';

-- Blockchain consensus enhancements
ALTER TABLE a2a_consensus_rounds
ADD COLUMN IF NOT EXISTS voting_weights JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS blockchain_consensus BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stake_weighted BOOLEAN DEFAULT false;

-- A2A validations table
CREATE TABLE IF NOT EXISTS a2a_validations (
    validation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    network_chain_id TEXT DEFAULT 'supabase-private',
    validation_result JSONB NOT NULL,
    validated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validations_process ON a2a_validations(process_id);
CREATE INDEX IF NOT EXISTS idx_validations_wallet ON a2a_validations(wallet_address);

-- Blockchain deployments table
CREATE TABLE IF NOT EXISTS a2a_blockchain_deployments (
    deployment_id TEXT PRIMARY KEY,
    process_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    network_chain_id TEXT DEFAULT 'supabase-private',
    status TEXT NOT NULL CHECK (status IN ('deploying', 'deployed', 'failed')),
    process_definition JSONB NOT NULL,
    deployed_at TIMESTAMPTZ,
    deployed_contracts INTEGER DEFAULT 0,
    created_agents INTEGER DEFAULT 0,
    trust_relationships INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deployments_process ON a2a_blockchain_deployments(process_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON a2a_blockchain_deployments(status);

-- =====================================================
-- 4. FUNCTIONS AND PROCEDURES
-- =====================================================

-- Function to get agent workload
CREATE OR REPLACE FUNCTION get_agent_workload(p_agent_id TEXT)
RETURNS TABLE (
    pending_messages INTEGER,
    pending_votes INTEGER,
    active_tasks INTEGER,
    workload_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM a2a_messages 
         WHERE p_agent_id = ANY(recipient_ids) 
         AND metadata->>'processed' IS NULL)::INTEGER as pending_messages,
        
        (SELECT COUNT(*) FROM a2a_proposals p
         JOIN a2a_consensus_rounds r ON p.proposal_id = r.proposal_id
         WHERE r.status = 'voting'
         AND NOT EXISTS (
             SELECT 1 FROM a2a_votes v 
             WHERE v.proposal_id = p.proposal_id 
             AND v.agent_id = p_agent_id
         ))::INTEGER as pending_votes,
        
        (SELECT COUNT(*) FROM agent_task_executions
         WHERE agent_id = p_agent_id
         AND status = 'started')::INTEGER as active_tasks,
        
        LEAST(100, 
            (SELECT COUNT(*) FROM a2a_messages WHERE p_agent_id = ANY(recipient_ids) AND metadata->>'processed' IS NULL) * 10 +
            (SELECT COUNT(*) FROM a2a_proposals WHERE proposal_data->>'assigned_to' = p_agent_id) * 20
        )::DECIMAL as workload_score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. INITIAL DATA
-- =====================================================

-- Insert sample blockchain-enabled agents
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

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;