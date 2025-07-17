-- A2A Blockchain Integration Schema
-- Complete database schema for private blockchain integration

-- 1. Contract ABIs storage
CREATE TABLE IF NOT EXISTS contract_abis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_name TEXT NOT NULL UNIQUE,
    abi JSONB NOT NULL,
    bytecode TEXT NOT NULL,
    compiler_version TEXT DEFAULT 'solc-0.8.19',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Deployed contracts registry
CREATE TABLE IF NOT EXISTS deployed_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_name TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    network TEXT NOT NULL DEFAULT 'private',
    deployer TEXT NOT NULL,
    deployed_by_agent TEXT,
    deployment_tx TEXT,
    abi JSONB NOT NULL,
    deployed_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
    
    UNIQUE(contract_name, network)
);

-- 3. Blockchain events tracking
CREATE TABLE IF NOT EXISTS blockchain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_name TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    event_name TEXT NOT NULL,
    args JSONB,
    block_number INTEGER NOT NULL,
    transaction_hash TEXT NOT NULL,
    log_index INTEGER,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Agent blockchain activities
CREATE TABLE IF NOT EXISTS agent_blockchain_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    activity_type TEXT NOT NULL,
    contract_name TEXT,
    contract_address TEXT,
    function_name TEXT,
    transaction_hash TEXT,
    block_number INTEGER,
    gas_used TEXT,
    value_transferred TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

-- 5. Visual process blockchain deployments
CREATE TABLE IF NOT EXISTS process_blockchain_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id TEXT NOT NULL,
    process_name TEXT NOT NULL,
    deployment_id TEXT NOT NULL UNIQUE,
    contracts JSONB NOT NULL DEFAULT '[]',
    agents JSONB NOT NULL DEFAULT '[]',
    network TEXT DEFAULT 'private',
    deployed_by TEXT NOT NULL,
    deployment_status TEXT DEFAULT 'pending' CHECK (deployment_status IN ('pending', 'deploying', 'deployed', 'failed')),
    deployment_tx TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deployed_at TIMESTAMPTZ
);

-- 6. Blockchain configuration
CREATE TABLE IF NOT EXISTS blockchain_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network_name TEXT NOT NULL UNIQUE,
    rpc_url TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    deployer_address TEXT NOT NULL,
    gas_price TEXT DEFAULT '20000000000', -- 20 gwei
    gas_limit TEXT DEFAULT '6000000',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Update a2a_agents table for blockchain integration
ALTER TABLE a2a_agents 
ADD COLUMN IF NOT EXISTS blockchain_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS blockchain_enabled BOOLEAN DEFAULT false;

-- 8. Blockchain event processing queue
CREATE TABLE IF NOT EXISTS blockchain_event_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES blockchain_events(id),
    agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 9. Agent wallet registry
CREATE TABLE IF NOT EXISTS agent_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id) UNIQUE,
    wallet_address TEXT NOT NULL UNIQUE,
    private_key_encrypted TEXT NOT NULL, -- Encrypted private key
    network TEXT NOT NULL DEFAULT 'private',
    balance TEXT DEFAULT '0',
    last_balance_check TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blockchain_events_contract ON blockchain_events(contract_name, contract_address);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_block ON blockchain_events(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_processed ON blockchain_events(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_blockchain_events_created ON blockchain_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_blockchain_activities_agent ON agent_blockchain_activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_blockchain_activities_created ON agent_blockchain_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_blockchain_activities_status ON agent_blockchain_activities(status);

CREATE INDEX IF NOT EXISTS idx_deployed_contracts_network ON deployed_contracts(network);
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_name ON deployed_contracts(contract_name);
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_address ON deployed_contracts(contract_address);

CREATE INDEX IF NOT EXISTS idx_process_deployments_status ON process_blockchain_deployments(deployment_status);
CREATE INDEX IF NOT EXISTS idx_process_deployments_created ON process_blockchain_deployments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_queue_status ON blockchain_event_queue(processing_status);
CREATE INDEX IF NOT EXISTS idx_event_queue_agent ON blockchain_event_queue(agent_id);

-- 11. Create functions for blockchain operations

-- Function to get agent's blockchain config
CREATE OR REPLACE FUNCTION get_agent_blockchain_config(p_agent_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_config JSONB;
BEGIN
    SELECT blockchain_config INTO v_config
    FROM a2a_agents
    WHERE agent_id = p_agent_id;
    
    RETURN COALESCE(v_config, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function to update agent balance
CREATE OR REPLACE FUNCTION update_agent_balance(
    p_agent_id TEXT,
    p_balance TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE agent_wallets
    SET balance = p_balance,
        last_balance_check = NOW()
    WHERE agent_id = p_agent_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to queue blockchain events for processing
CREATE OR REPLACE FUNCTION queue_blockchain_event_for_agents(
    p_event_id UUID,
    p_agent_ids TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
    v_agent_id TEXT;
    v_count INTEGER := 0;
BEGIN
    FOREACH v_agent_id IN ARRAY p_agent_ids
    LOOP
        INSERT INTO blockchain_event_queue (event_id, agent_id)
        VALUES (p_event_id, v_agent_id);
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending blockchain events for agent
CREATE OR REPLACE FUNCTION get_pending_blockchain_events(p_agent_id TEXT)
RETURNS TABLE(
    event_id UUID,
    contract_name TEXT,
    event_name TEXT,
    args JSONB,
    block_number INTEGER,
    transaction_hash TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        be.id,
        be.contract_name,
        be.event_name,
        be.args,
        be.block_number,
        be.transaction_hash
    FROM blockchain_events be
    JOIN blockchain_event_queue beq ON be.id = beq.event_id
    WHERE beq.agent_id = p_agent_id
    AND beq.processing_status = 'pending'
    ORDER BY be.block_number ASC, be.log_index ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to mark blockchain event as processed
CREATE OR REPLACE FUNCTION mark_blockchain_event_processed(
    p_event_id UUID,
    p_agent_id TEXT,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE blockchain_event_queue
    SET processing_status = CASE 
        WHEN p_success THEN 'completed'
        ELSE 'failed'
    END,
    error_message = p_error_message,
    processed_at = NOW()
    WHERE event_id = p_event_id AND agent_id = p_agent_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 12. Create triggers for automatic event processing

-- Trigger to automatically queue events for relevant agents
CREATE OR REPLACE FUNCTION auto_queue_blockchain_events()
RETURNS TRIGGER AS $$
DECLARE
    v_relevant_agents TEXT[];
BEGIN
    -- Find relevant agents based on contract and event type
    SELECT ARRAY_AGG(agent_id) INTO v_relevant_agents
    FROM a2a_agents
    WHERE status = 'active'
    AND blockchain_enabled = true
    AND (
        -- Orchestrator agents get all events
        type = 'orchestrator' OR
        -- Escrow events go to agents with escrow capabilities
        (NEW.contract_name = 'TrustEscrow' AND 'escrow_management' = ANY(capabilities)) OR
        -- Reputation events go to agents with reputation capabilities
        (NEW.contract_name = 'ReputationOracle' AND 'reputation_tracking' = ANY(capabilities))
    );
    
    -- Queue events for relevant agents
    IF v_relevant_agents IS NOT NULL AND array_length(v_relevant_agents, 1) > 0 THEN
        PERFORM queue_blockchain_event_for_agents(NEW.id, v_relevant_agents);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_queue_blockchain_events
    AFTER INSERT ON blockchain_events
    FOR EACH ROW
    EXECUTE FUNCTION auto_queue_blockchain_events();

-- 13. Create views for monitoring

-- View for blockchain activity dashboard
CREATE OR REPLACE VIEW blockchain_activity_dashboard AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_events,
    COUNT(DISTINCT contract_name) as unique_contracts,
    COUNT(DISTINCT transaction_hash) as unique_transactions,
    COUNT(*) FILTER (WHERE processed = true) as processed_events
FROM blockchain_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- View for agent blockchain status
CREATE OR REPLACE VIEW agent_blockchain_status AS
SELECT 
    a.agent_id,
    a.name,
    a.type,
    a.blockchain_enabled,
    w.wallet_address,
    w.balance,
    w.last_balance_check,
    COUNT(aba.id) as total_activities,
    COUNT(aba.id) FILTER (WHERE aba.status = 'confirmed') as confirmed_activities,
    MAX(aba.created_at) as last_activity
FROM a2a_agents a
LEFT JOIN agent_wallets w ON a.agent_id = w.agent_id
LEFT JOIN agent_blockchain_activities aba ON a.agent_id = aba.agent_id
WHERE a.blockchain_enabled = true
GROUP BY a.agent_id, a.name, a.type, a.blockchain_enabled, w.wallet_address, w.balance, w.last_balance_check;

-- View for contract deployment status
CREATE OR REPLACE VIEW contract_deployment_status AS
SELECT 
    dc.contract_name,
    dc.contract_address,
    dc.network,
    dc.deployer,
    dc.deployed_by_agent,
    dc.status,
    dc.deployed_at,
    COUNT(be.id) as total_events,
    COUNT(be.id) FILTER (WHERE be.processed = true) as processed_events,
    MAX(be.created_at) as last_event
FROM deployed_contracts dc
LEFT JOIN blockchain_events be ON dc.contract_address = be.contract_address
GROUP BY dc.contract_name, dc.contract_address, dc.network, dc.deployer, dc.deployed_by_agent, dc.status, dc.deployed_at;

-- 14. Initial configuration data
INSERT INTO blockchain_config (network_name, rpc_url, chain_id, deployer_address) VALUES
('private', 'http://localhost:8545', 31337, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
ON CONFLICT (network_name) DO UPDATE SET
    rpc_url = EXCLUDED.rpc_url,
    chain_id = EXCLUDED.chain_id,
    deployer_address = EXCLUDED.deployer_address;

-- 15. Grant permissions
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;