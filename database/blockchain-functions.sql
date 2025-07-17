-- Blockchain Simulation Functions for Supabase
-- Production-ready database functions with proper transaction management

-- Function to deploy a blockchain process atomically
CREATE OR REPLACE FUNCTION deploy_blockchain_process(
    p_deployment_id TEXT,
    p_process JSONB,
    p_wallet_address TEXT,
    p_network_chain_id TEXT DEFAULT 'supabase-private'
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Start transaction
    -- Validate inputs
    IF p_process IS NULL OR p_process->>'id' IS NULL THEN
        RAISE EXCEPTION 'Invalid process object';
    END IF;
    
    IF NOT p_wallet_address ~ '^0x[a-fA-F0-9]{40}$' THEN
        RAISE EXCEPTION 'Invalid wallet address format';
    END IF;
    
    -- Create deployment record
    INSERT INTO a2a_blockchain_deployments (
        deployment_id,
        process_id,
        process_name,
        process_definition,
        deployer_wallet,
        network_chain_id,
        status,
        deployment_type,
        created_at
    ) VALUES (
        p_deployment_id,
        p_process->>'id',
        p_process->>'name',
        p_process,
        p_wallet_address,
        p_network_chain_id,
         'deploying',
        'blockchain',
        NOW()
    );
    
    -- Return success
    v_result := jsonb_build_object(
        'success', true,
        'deployment_id', p_deployment_id,
        'status', 'deploying'
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback is automatic
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get blockchain statistics
CREATE OR REPLACE FUNCTION get_blockchain_statistics()
RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
BEGIN
    WITH deployment_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as deployments_24h,
            COUNT(*) FILTER (WHERE status = 'deployed') as active_deployments,
            COUNT(*) as total_deployments
        FROM a2a_blockchain_deployments
    ),
    agent_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE status = 'active') as active_agents,
            COUNT(*) as total_agents
        FROM a2a_blockchain_agents
    ),
    contract_stats AS (
        SELECT 
            COUNT(*) as total_contracts,
            COUNT(DISTINCT contract_type) as contract_types
        FROM a2a_blockchain_contracts
    ),
    task_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE status = 'RUNNING') as running_tasks,
            COUNT(*) FILTER (WHERE status = 'COMPLETED' AND created_at >= NOW() - INTERVAL '1 hour') as completed_last_hour,
            AVG(CASE 
                WHEN status = 'COMPLETED' AND completed_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (completed_at - created_at))
                ELSE NULL 
            END) as avg_execution_time_seconds
        FROM a2a_blockchain_tasks
    )
    SELECT jsonb_build_object(
        'deployments', (SELECT row_to_json(d) FROM deployment_stats d),
        'agents', (SELECT row_to_json(a) FROM agent_stats a),
        'contracts', (SELECT row_to_json(c) FROM contract_stats c),
        'tasks', (SELECT row_to_json(t) FROM task_stats t),
        'network_health', CASE 
            WHEN (SELECT active_agents FROM agent_stats) > 0 THEN 'healthy'
            ELSE 'degraded'
        END,
        'last_update', NOW()
    ) INTO v_stats;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate agent permissions
CREATE OR REPLACE FUNCTION validate_agent_permission(
    p_agent_id TEXT,
    p_action TEXT,
    p_resource_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_agent RECORD;
    v_has_permission BOOLEAN DEFAULT FALSE;
BEGIN
    -- Get agent details
    SELECT * INTO v_agent
    FROM a2a_blockchain_agents
    WHERE agent_id = p_agent_id
    AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check capabilities
    CASE p_action
        WHEN 'execute_contract' THEN
            v_has_permission := 'blockchain_operations' = ANY(v_agent.capabilities);
        WHEN 'validate_result' THEN
            v_has_permission := 'blockchain_verification' = ANY(v_agent.capabilities);
        WHEN 'initiate_task' THEN
            v_has_permission := 'initiate_task' = ANY(v_agent.capabilities);
        ELSE
            v_has_permission := 'general_processing' = ANY(v_agent.capabilities);
    END CASE;
    
    -- Log permission check
    INSERT INTO blockchain_permission_checks (
        agent_id,
        action,
        resource_id,
        granted,
        checked_at
    ) VALUES (
        p_agent_id,
        p_action,
        p_resource_id,
        v_has_permission,
        NOW()
    );
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record blockchain event
CREATE OR REPLACE FUNCTION record_blockchain_event(
    p_event_type TEXT,
    p_entity_id TEXT,
    p_entity_type TEXT,
    p_event_data JSONB DEFAULT '{}'::jsonb,
    p_transaction_hash TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO blockchain_events (
        event_type,
        entity_id,
        entity_type,
        event_data,
        transaction_hash,
        created_at
    ) VALUES (
        p_event_type,
        p_entity_id,
        p_entity_type,
        p_event_data,
        p_transaction_hash,
        NOW()
    ) RETURNING event_id INTO v_event_id;
    
    -- Notify listeners
    PERFORM pg_notify('blockchain_event', json_build_object(
        'event_id', v_event_id,
        'event_type', p_event_type,
        'entity_id', p_entity_id,
        'entity_type', p_entity_type
    )::text);
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for atomic task execution update
CREATE OR REPLACE FUNCTION update_task_execution(
    p_task_id TEXT,
    p_status TEXT,
    p_progress INTEGER DEFAULT NULL,
    p_result JSONB DEFAULT NULL,
    p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE a2a_blockchain_tasks
    SET 
        status = p_status,
        progress = COALESCE(p_progress, progress),
        result = COALESCE(p_result, result),
        error = p_error,
        updated_at = NOW(),
        completed_at = CASE 
            WHEN p_status IN ('COMPLETED', 'FAILED') THEN NOW()
            ELSE completed_at
        END
    WHERE task_id = p_task_id;
    
    IF FOUND THEN
        -- Record event
        PERFORM record_blockchain_event(
            'task_status_change',
            p_task_id,
            'task',
            jsonb_build_object(
                'new_status', p_status,
                'progress', p_progress
            )
        );
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create necessary tables if they don't exist
CREATE TABLE IF NOT EXISTS blockchain_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    transaction_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blockchain_permission_checks (
    check_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_id TEXT,
    granted BOOLEAN NOT NULL,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blockchain_execution_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT NOT NULL,
    agent_id TEXT,
    log_level TEXT NOT NULL CHECK (log_level IN ('info', 'warning', 'error')),
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blockchain_events_entity ON blockchain_events(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_events_created ON blockchain_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permission_checks_agent ON blockchain_permission_checks(agent_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_logs_task ON blockchain_execution_logs(task_id, created_at);

-- Row Level Security
ALTER TABLE blockchain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_permission_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_execution_logs ENABLE ROW LEVEL SECURITY;

-- Policies for service role access
CREATE POLICY "Service role full access to events" ON blockchain_events
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to permission checks" ON blockchain_permission_checks
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to execution logs" ON blockchain_execution_logs
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');