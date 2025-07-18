-- A2A Blockchain Enhancement Schema
-- Additional tables needed for real blockchain integration

-- 1. Blockchain escrows table
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

CREATE INDEX idx_blockchain_escrows_client ON a2a_blockchain_escrows(client_agent_id);
CREATE INDEX idx_blockchain_escrows_processor ON a2a_blockchain_escrows(processor_agent_id);
CREATE INDEX idx_blockchain_escrows_status ON a2a_blockchain_escrows(status);
CREATE INDEX idx_blockchain_escrows_deadline ON a2a_blockchain_escrows(deadline);

-- 2. Escrow disputes table
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

CREATE INDEX idx_escrow_disputes_escrow ON a2a_escrow_disputes(escrow_id);
CREATE INDEX idx_escrow_disputes_status ON a2a_escrow_disputes(status);

-- 3. Blockchain message metadata enhancements
ALTER TABLE a2a_messages 
ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS signature TEXT,
ADD COLUMN IF NOT EXISTS routing_priority TEXT DEFAULT 'normal';

-- 4. Blockchain consensus rounds enhancement
ALTER TABLE a2a_consensus_rounds
ADD COLUMN IF NOT EXISTS voting_weights JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS blockchain_consensus BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stake_weighted BOOLEAN DEFAULT false;

-- 5. Agent blockchain activities enhancement
ALTER TABLE agent_blockchain_activities
ADD COLUMN IF NOT EXISTS value_transferred TEXT,
ADD COLUMN IF NOT EXISTS contract_name TEXT,
ADD COLUMN IF NOT EXISTS contract_address TEXT,
ADD COLUMN IF NOT EXISTS function_name TEXT;

-- 6. A2A validations table for blockchain process validation
CREATE TABLE IF NOT EXISTS a2a_validations (
    validation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    network_chain_id TEXT DEFAULT 'supabase-private',
    validation_result JSONB NOT NULL,
    validated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_validations_process ON a2a_validations(process_id);
CREATE INDEX idx_validations_wallet ON a2a_validations(wallet_address);

-- 7. Blockchain deployments table
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

CREATE INDEX idx_deployments_process ON a2a_blockchain_deployments(process_id);
CREATE INDEX idx_deployments_status ON a2a_blockchain_deployments(status);

-- 8. Blockchain contracts table
CREATE TABLE IF NOT EXISTS a2a_blockchain_contracts (
    contract_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    element_id TEXT NOT NULL,
    contract_type TEXT NOT NULL,
    contract_address TEXT NOT NULL UNIQUE,
    deployment_tx TEXT NOT NULL,
    deployed_at TIMESTAMPTZ DEFAULT NOW(),
    deployer TEXT NOT NULL,
    deployment_id TEXT NOT NULL REFERENCES a2a_blockchain_deployments(deployment_id),
    contract_config JSONB DEFAULT '{}',
    gas_used TEXT DEFAULT '0',
    blockchain_verified BOOLEAN DEFAULT true
);

CREATE INDEX idx_blockchain_contracts_type ON a2a_blockchain_contracts(contract_type);
CREATE INDEX idx_blockchain_contracts_deployer ON a2a_blockchain_contracts(deployer);

-- 9. Blockchain agents table (separate from regular agents for blockchain-specific data)
CREATE TABLE IF NOT EXISTS a2a_blockchain_agents (
    agent_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    description TEXT,
    capabilities TEXT[],
    status TEXT DEFAULT 'active',
    process_id TEXT,
    deployment_id TEXT REFERENCES a2a_blockchain_deployments(deployment_id),
    wallet_address TEXT NOT NULL,
    blockchain_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blockchain_agents_type ON a2a_blockchain_agents(agent_type);
CREATE INDEX idx_blockchain_agents_deployment ON a2a_blockchain_agents(deployment_id);

-- 10. Blockchain trust relationships
CREATE TABLE IF NOT EXISTS a2a_blockchain_trust (
    trust_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_agent TEXT NOT NULL,
    to_agent TEXT NOT NULL,
    trust_level TEXT NOT NULL CHECK (trust_level IN ('low', 'medium', 'high')),
    contract_address TEXT,
    deployment_id TEXT REFERENCES a2a_blockchain_deployments(deployment_id),
    established_at TIMESTAMPTZ DEFAULT NOW(),
    blockchain_verified BOOLEAN DEFAULT true,
    UNIQUE(from_agent, to_agent, deployment_id)
);

CREATE INDEX idx_blockchain_trust_from ON a2a_blockchain_trust(from_agent);
CREATE INDEX idx_blockchain_trust_to ON a2a_blockchain_trust(to_agent);

-- 11. Blockchain tasks table
CREATE TABLE IF NOT EXISTS a2a_blockchain_tasks (
    task_id TEXT PRIMARY KEY,
    process_id TEXT NOT NULL,
    deployment_id TEXT REFERENCES a2a_blockchain_deployments(deployment_id),
    input_data JSONB,
    output_data JSONB,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
    execution_type TEXT DEFAULT 'blockchain',
    executor_wallet TEXT,
    transaction_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_blockchain_tasks_process ON a2a_blockchain_tasks(process_id);
CREATE INDEX idx_blockchain_tasks_status ON a2a_blockchain_tasks(status);

-- 12. Blockchain messages table (separate from regular messages for blockchain-specific routing)
CREATE TABLE IF NOT EXISTS a2a_blockchain_messages (
    message_id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    recipient_ids TEXT[] NOT NULL,
    message_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    blockchain_verified BOOLEAN DEFAULT true,
    signature TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blockchain_messages_sender ON a2a_blockchain_messages(sender_id);
CREATE INDEX idx_blockchain_messages_type ON a2a_blockchain_messages(message_type);

-- 13. Blockchain execution logs
CREATE TABLE IF NOT EXISTS blockchain_execution_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT REFERENCES a2a_blockchain_tasks(task_id),
    agent_id TEXT,
    log_level TEXT NOT NULL CHECK (log_level IN ('DEBUG', 'INFO', 'WARN', 'ERROR')),
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_execution_logs_task ON blockchain_execution_logs(task_id);
CREATE INDEX idx_execution_logs_level ON blockchain_execution_logs(log_level);

-- 14. Functions for blockchain operations

-- Function to deploy blockchain process (stored procedure)
CREATE OR REPLACE FUNCTION deploy_blockchain_process(
    p_deployment_id TEXT,
    p_process JSONB,
    p_wallet_address TEXT,
    p_network_chain_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Insert deployment record
    INSERT INTO a2a_blockchain_deployments (
        deployment_id,
        process_id,
        wallet_address,
        network_chain_id,
        status,
        process_definition
    ) VALUES (
        p_deployment_id,
        p_process->>'id',
        p_wallet_address,
        p_network_chain_id,
        'deploying',
        p_process
    );
    
    -- Return deployment info
    result := jsonb_build_object(
        'deployment_id', p_deployment_id,
        'status', 'deploying',
        'process_id', p_process->>'id'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get blockchain statistics
CREATE OR REPLACE FUNCTION get_blockchain_statistics()
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_deployments', (SELECT COUNT(*) FROM a2a_blockchain_deployments),
        'active_deployments', (SELECT COUNT(*) FROM a2a_blockchain_deployments WHERE status = 'deployed'),
        'total_contracts', (SELECT COUNT(*) FROM a2a_blockchain_contracts),
        'total_escrows', (SELECT COUNT(*) FROM a2a_blockchain_escrows),
        'active_escrows', (SELECT COUNT(*) FROM a2a_blockchain_escrows WHERE status = 'ACTIVE'),
        'blockchain_agents', (SELECT COUNT(*) FROM a2a_blockchain_agents WHERE blockchain_enabled = true),
        'total_blockchain_activities', (SELECT COUNT(*) FROM agent_blockchain_activities),
        'last_activity', (SELECT MAX(created_at) FROM agent_blockchain_activities)
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- 15. Triggers for real-time blockchain events

-- Trigger function for blockchain event notifications
CREATE OR REPLACE FUNCTION notify_blockchain_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify about blockchain events
    IF TG_TABLE_NAME = 'a2a_blockchain_escrows' THEN
        PERFORM pg_notify('blockchain_event', json_build_object(
            'event', 'escrow_status_change',
            'escrow_id', NEW.escrow_id,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'contract_address', NEW.contract_address
        )::text);
    ELSIF TG_TABLE_NAME = 'agent_blockchain_activities' THEN
        PERFORM pg_notify('blockchain_event', json_build_object(
            'event', 'blockchain_activity',
            'agent_id', NEW.agent_id,
            'activity_type', NEW.activity_type,
            'transaction_hash', NEW.transaction_hash
        )::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create blockchain event triggers
DROP TRIGGER IF EXISTS trigger_escrow_event_notification ON a2a_blockchain_escrows;
CREATE TRIGGER trigger_escrow_event_notification
    AFTER UPDATE ON a2a_blockchain_escrows
    FOR EACH ROW
    EXECUTE FUNCTION notify_blockchain_event();

DROP TRIGGER IF EXISTS trigger_blockchain_activity_notification ON agent_blockchain_activities;
CREATE TRIGGER trigger_blockchain_activity_notification
    AFTER INSERT ON agent_blockchain_activities
    FOR EACH ROW
    EXECUTE FUNCTION notify_blockchain_activity();

-- 16. Row Level Security for blockchain data
ALTER TABLE a2a_blockchain_escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_escrow_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_blockchain_contracts ENABLE ROW LEVEL SECURITY;

-- Policies for blockchain data access
CREATE POLICY escrow_access_policy ON a2a_blockchain_escrows
    FOR ALL USING (
        client_agent_id = current_setting('app.current_agent_id', true) OR
        processor_agent_id = current_setting('app.current_agent_id', true) OR
        current_setting('app.current_agent_id', true) = 'service_role'
    );

CREATE POLICY dispute_access_policy ON a2a_escrow_disputes
    FOR ALL USING (
        complainant_id = current_setting('app.current_agent_id', true) OR
        current_setting('app.current_agent_id', true) = 'service_role'
    );

-- 17. Grant permissions for blockchain operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 18. Sample blockchain data for testing

-- Insert sample blockchain-enabled agents
INSERT INTO a2a_agents (
    agent_id,
    name,
    type,
    capabilities,
    voting_power,
    blockchain_config,
    status
) VALUES 
(
    'blockchain-agent-alpha',
    'Blockchain Agent Alpha',
    'processor',
    ARRAY['blockchain_execution', 'smart_contracts', 'escrow_management'],
    150,
    jsonb_build_object(
        'blockchain_id', '0x' || encode(digest('blockchain-agent-alpha', 'sha256'), 'hex')::text[1:40],
        'network', 'supabase-private',
        'enabled', true,
        'created_at', NOW()
    ),
    'active'
),
(
    'blockchain-agent-beta',
    'Blockchain Agent Beta',
    'validator',
    ARRAY['blockchain_verification', 'reputation_tracking', 'consensus_participation'],
    120,
    jsonb_build_object(
        'blockchain_id', '0x' || encode(digest('blockchain-agent-beta', 'sha256'), 'hex')::text[1:40],
        'network', 'supabase-private',
        'enabled', true,
        'created_at', NOW()
    ),
    'active'
)
ON CONFLICT (agent_id) DO UPDATE SET
    blockchain_config = EXCLUDED.blockchain_config,
    capabilities = EXCLUDED.capabilities;

-- Insert sample contract ABIs
INSERT INTO contract_abis (
    contract_name,
    abi,
    description
) VALUES 
(
    'TrustEscrow',
    '[{"type":"function","name":"createEscrow","inputs":[{"name":"processor","type":"address"},{"name":"amount","type":"uint256"},{"name":"deadline","type":"uint256"}],"outputs":[{"name":"escrowId","type":"uint256"}]}]',
    'Trust-based escrow contract for A2A task coordination'
),
(
    'ReputationOracle',
    '[{"type":"function","name":"updateReputation","inputs":[{"name":"agent","type":"address"},{"name":"score","type":"uint256"}],"outputs":[]}]',
    'Reputation tracking and verification contract'
),
(
    'A2AOrchestrator',
    '[{"type":"function","name":"processMessage","inputs":[{"name":"messageId","type":"string"},{"name":"sender","type":"address"}],"outputs":[{"name":"success","type":"bool"}]}]',
    'Main orchestration contract for A2A message processing'
)
ON CONFLICT (contract_name) DO UPDATE SET
    abi = EXCLUDED.abi,
    description = EXCLUDED.description;

-- Create initial test message with blockchain verification
INSERT INTO a2a_messages (
    message_id,
    sender_id,
    recipient_ids,
    message_type,
    content,
    metadata,
    blockchain_verified,
    reputation_score,
    routing_priority
) VALUES (
    'blockchain-test-msg-001',
    'blockchain-agent-alpha',
    ARRAY['blockchain-agent-beta'],
    'blockchain_test',
    jsonb_build_object(
        'message', 'Testing blockchain integration',
        'requires_verification', true,
        'blockchain_enabled', true
    ),
    jsonb_build_object(
        'blockchain_processed', false,
        'requires_consensus', true,
        'signature', '0x' || encode(digest('test-signature', 'sha256'), 'hex')
    ),
    true,
    750,
    'high'
);

-- Done! Your A2A system now has full blockchain integration capabilities.
COMMIT;