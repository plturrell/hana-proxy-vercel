-- A2A Blockchain System - Complete Schema Deployment
-- Run this file to deploy all required database schemas

-- =====================================================
-- 1. AUTONOMY SCHEMA (from autonomy-schema.sql)
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
    contract_name TEXT NOT NULL REFERENCES contract_abis(contract_name),
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

-- Blockchain contracts table
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

CREATE INDEX IF NOT EXISTS idx_blockchain_contracts_type ON a2a_blockchain_contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_contracts_deployer ON a2a_blockchain_contracts(deployer);

-- Blockchain agents table
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

CREATE INDEX IF NOT EXISTS idx_blockchain_agents_type ON a2a_blockchain_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_agents_deployment ON a2a_blockchain_agents(deployment_id);

-- Blockchain trust relationships
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

CREATE INDEX IF NOT EXISTS idx_blockchain_trust_from ON a2a_blockchain_trust(from_agent);
CREATE INDEX IF NOT EXISTS idx_blockchain_trust_to ON a2a_blockchain_trust(to_agent);

-- Blockchain tasks table
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

CREATE INDEX IF NOT EXISTS idx_blockchain_tasks_process ON a2a_blockchain_tasks(process_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tasks_status ON a2a_blockchain_tasks(status);

-- Blockchain messages table
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

CREATE INDEX IF NOT EXISTS idx_blockchain_messages_sender ON a2a_blockchain_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_messages_type ON a2a_blockchain_messages(message_type);

-- Blockchain execution logs
CREATE TABLE IF NOT EXISTS blockchain_execution_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT REFERENCES a2a_blockchain_tasks(task_id),
    agent_id TEXT,
    log_level TEXT NOT NULL CHECK (log_level IN ('DEBUG', 'INFO', 'WARN', 'ERROR')),
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_logs_task ON blockchain_execution_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_level ON blockchain_execution_logs(log_level);

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

-- Function to claim tasks
CREATE OR REPLACE FUNCTION agent_claim_task(
    p_agent_id TEXT,
    p_task_id TEXT,
    p_task_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_claimed BOOLEAN;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM a2a_agents 
        WHERE agent_id = p_agent_id 
        AND status = 'active'
        AND autonomy_enabled = true
    ) THEN
        RETURN FALSE;
    END IF;
    
    PERFORM pg_advisory_xact_lock(hashtext(p_task_id));
    
    IF EXISTS (
        SELECT 1 FROM agent_task_executions
        WHERE task_name = p_task_id
        AND status IN ('started', 'completed')
    ) THEN
        RETURN FALSE;
    END IF;
    
    INSERT INTO agent_task_executions (
        agent_id,
        task_name,
        status,
        started_at
    ) VALUES (
        p_agent_id,
        p_task_id,
        'started',
        NOW()
    );
    
    INSERT INTO agent_activity (
        agent_id,
        activity_type,
        details
    ) VALUES (
        p_agent_id,
        'task_claimed',
        jsonb_build_object(
            'task_id', p_task_id,
            'task_type', p_task_type
        )
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Deploy blockchain process function
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
    
    result := jsonb_build_object(
        'deployment_id', p_deployment_id,
        'status', 'deploying',
        'process_id', p_process->>'id'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get blockchain statistics
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

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Function to notify agent events
CREATE OR REPLACE FUNCTION notify_agent_event()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'a2a_messages' THEN
        PERFORM pg_notify('agent_event', json_build_object(
            'event', 'new_message',
            'message_id', NEW.message_id,
            'recipients', NEW.recipient_ids,
            'type', NEW.message_type
        )::text);
    ELSIF TG_TABLE_NAME = 'a2a_proposals' THEN
        PERFORM pg_notify('agent_event', json_build_object(
            'event', 'new_proposal',
            'proposal_id', NEW.proposal_id,
            'type', NEW.proposal_type
        )::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_new_message_notification ON a2a_messages;
CREATE TRIGGER trigger_new_message_notification
    AFTER INSERT ON a2a_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_agent_event();

DROP TRIGGER IF EXISTS trigger_new_proposal_notification ON a2a_proposals;
CREATE TRIGGER trigger_new_proposal_notification
    AFTER INSERT ON a2a_proposals
    FOR EACH ROW
    EXECUTE FUNCTION notify_agent_event();

-- Function for blockchain event notifications
CREATE OR REPLACE FUNCTION notify_blockchain_event()
RETURNS TRIGGER AS $$
BEGIN
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

-- Create blockchain triggers
DROP TRIGGER IF EXISTS trigger_escrow_event_notification ON a2a_blockchain_escrows;
CREATE TRIGGER trigger_escrow_event_notification
    AFTER UPDATE ON a2a_blockchain_escrows
    FOR EACH ROW
    EXECUTE FUNCTION notify_blockchain_event();

DROP TRIGGER IF EXISTS trigger_blockchain_activity_notification ON agent_blockchain_activities;
CREATE TRIGGER trigger_blockchain_activity_notification
    AFTER INSERT ON agent_blockchain_activities
    FOR EACH ROW
    EXECUTE FUNCTION notify_blockchain_event();

-- =====================================================
-- 6. VIEWS
-- =====================================================

-- Agent health dashboard view
CREATE OR REPLACE VIEW agent_health_dashboard AS
SELECT 
    a.agent_id,
    a.name,
    a.type,
    a.status,
    a.autonomy_enabled,
    a.last_active,
    EXTRACT(EPOCH FROM (NOW() - a.last_active)) / 60 as minutes_since_active,
    a.performance_score,
    (SELECT COUNT(*) FROM agent_activity aa 
     WHERE aa.agent_id = a.agent_id 
     AND aa.created_at > NOW() - INTERVAL '1 hour') as actions_last_hour,
    (SELECT COUNT(*) FROM a2a_messages m 
     WHERE a.agent_id = m.sender_id 
     AND m.created_at > NOW() - INTERVAL '1 hour') as messages_sent_last_hour,
    (SELECT COUNT(*) FROM a2a_votes v 
     WHERE v.agent_id = a.agent_id 
     AND v.created_at > NOW() - INTERVAL '1 day') as votes_last_day,
    w.workload_score
FROM a2a_agents a
CROSS JOIN LATERAL get_agent_workload(a.agent_id) w
WHERE a.status = 'active';

-- =====================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_blockchain_escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_escrow_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_blockchain_contracts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY agent_activity_policy ON agent_activity
    FOR ALL USING (agent_id = current_setting('app.current_agent_id', true));

CREATE POLICY agent_memory_policy ON agent_memory
    FOR ALL USING (agent_id = current_setting('app.current_agent_id', true));

CREATE POLICY agent_task_policy ON agent_task_executions
    FOR ALL USING (agent_id = current_setting('app.current_agent_id', true));

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

-- =====================================================
-- 8. PERMISSIONS
-- =====================================================

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- 9. SAMPLE DATA
-- =====================================================

-- Insert sample blockchain-enabled agents
INSERT INTO a2a_agents (
    agent_id,
    name,
    type,
    capabilities,
    voting_power,
    blockchain_config,
    status,
    scheduled_tasks,
    voting_preferences,
    personality,
    goals
) VALUES 
(
    'blockchain-agent-alpha',
    'Blockchain Agent Alpha',
    'processor',
    ARRAY['blockchain_execution', 'smart_contracts', 'escrow_management'],
    150,
    jsonb_build_object(
        'blockchain_id', '0x' || substring(encode(digest('blockchain-agent-alpha', 'sha256'), 'hex'), 1, 40),
        'network', 'supabase-private',
        'enabled', true,
        'created_at', NOW()
    ),
    'active',
    '[{"name": "check_pending_tasks", "interval": "*/5 * * * *", "action": "process_tasks"}]'::jsonb,
    '{"favor": ["efficiency", "automation"], "oppose": ["manual_processing"]}'::jsonb,
    'Efficient and reliable',
    ARRAY['Process tasks efficiently', 'Maintain high success rate']
),
(
    'blockchain-agent-beta',
    'Blockchain Agent Beta',
    'validator',
    ARRAY['blockchain_verification', 'reputation_tracking', 'consensus_participation'],
    120,
    jsonb_build_object(
        'blockchain_id', '0x' || substring(encode(digest('blockchain-agent-beta', 'sha256'), 'hex'), 1, 40),
        'network', 'supabase-private',
        'enabled', true,
        'created_at', NOW()
    ),
    'active',
    '[{"name": "validate_results", "interval": "*/10 * * * *", "action": "validate_pending"}]'::jsonb,
    '{"favor": ["accuracy", "verification"], "oppose": ["unverified_data"]}'::jsonb,
    'Thorough and meticulous',
    ARRAY['Ensure data accuracy', 'Validate all results']
)
ON CONFLICT (agent_id) DO UPDATE SET
    blockchain_config = EXCLUDED.blockchain_config,
    capabilities = EXCLUDED.capabilities,
    scheduled_tasks = EXCLUDED.scheduled_tasks,
    voting_preferences = EXCLUDED.voting_preferences,
    personality = EXCLUDED.personality,
    goals = EXCLUDED.goals;

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

-- =====================================================
-- DEPLOYMENT COMPLETE!
-- =====================================================

-- Verify deployment
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%a2a%' OR table_name LIKE '%agent%' OR table_name LIKE '%blockchain%';
    
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION';
    
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public';
    
    RAISE NOTICE 'Deployment Complete!';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Functions created: %', function_count;
    RAISE NOTICE 'Triggers created: %', trigger_count;
END $$;

COMMIT;