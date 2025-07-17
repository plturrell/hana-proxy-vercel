-- Input Validation Constraints for A2A Blockchain Tables
-- Comprehensive database-level validation for production security

-- 1. Add check constraints to a2a_blockchain_deployments
ALTER TABLE a2a_blockchain_deployments
ADD CONSTRAINT valid_deployment_id CHECK (deployment_id ~ '^deploy_[a-zA-Z0-9_]+_[0-9]+$'),
ADD CONSTRAINT valid_process_id CHECK (process_id ~ '^[a-zA-Z0-9_-]+$'),
ADD CONSTRAINT valid_status CHECK (status IN ('deploying', 'deployed', 'failed', 'inactive')),
ADD CONSTRAINT valid_deployment_type CHECK (deployment_type IN ('blockchain', 'test', 'simulation')),
ADD CONSTRAINT valid_network_chain CHECK (network_chain_id IN ('supabase-private', 'supabase-test', 'supabase-production')),
ADD CONSTRAINT non_empty_process_name CHECK (length(process_name) > 0 AND length(process_name) <= 255),
ADD CONSTRAINT valid_wallet_address CHECK (deployer_wallet ~ '^0x[a-fA-F0-9]{40}$');

-- 2. Add check constraints to a2a_blockchain_agents
ALTER TABLE a2a_blockchain_agents
ADD CONSTRAINT valid_agent_id CHECK (agent_id ~ '^[a-zA-Z0-9_-]+$'),
ADD CONSTRAINT valid_agent_name CHECK (length(name) > 0 AND length(name) <= 100),
ADD CONSTRAINT valid_agent_type CHECK (agent_type IN ('initiator', 'processor', 'validator', 'oracle', 'executor')),
ADD CONSTRAINT valid_agent_status CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
ADD CONSTRAINT valid_capabilities CHECK (array_length(capabilities, 1) > 0),
ADD CONSTRAINT valid_agent_wallet CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$');

-- 3. Add check constraints to a2a_blockchain_contracts
ALTER TABLE a2a_blockchain_contracts
ADD CONSTRAINT valid_element_id CHECK (element_id ~ '^[a-zA-Z0-9_-]+$'),
ADD CONSTRAINT valid_contract_type CHECK (contract_type IN ('escrow', 'reputation', 'multisig', 'timelock')),
ADD CONSTRAINT valid_contract_address CHECK (contract_address ~ '^0x[a-fA-F0-9]{40}$'),
ADD CONSTRAINT valid_deployment_tx CHECK (deployment_tx ~ '^0x[a-fA-F0-9]{64}$'),
ADD CONSTRAINT valid_deployer_address CHECK (deployer ~ '^0x[a-fA-F0-9]{40}$');

-- 4. Add check constraints to a2a_blockchain_tasks
ALTER TABLE a2a_blockchain_tasks
ADD CONSTRAINT valid_task_id CHECK (task_id ~ '^task_[a-zA-Z0-9_]+_[0-9]+$'),
ADD CONSTRAINT valid_task_status CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
ADD CONSTRAINT valid_execution_type CHECK (execution_type IN ('blockchain', 'simulation', 'test')),
ADD CONSTRAINT valid_executor_wallet CHECK (executor_wallet ~ '^0x[a-fA-F0-9]{40}$'),
ADD CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100),
ADD CONSTRAINT valid_transaction_hash CHECK (transaction_hash IS NULL OR transaction_hash ~ '^0x[a-fA-F0-9]{64}$');

-- 5. Add check constraints to a2a_blockchain_messages
ALTER TABLE a2a_blockchain_messages
ADD CONSTRAINT valid_message_id CHECK (message_id ~ '^msg_[a-zA-Z0-9_-]+$'),
ADD CONSTRAINT valid_sender_id CHECK (sender_id ~ '^[a-zA-Z0-9_-]+$'),
ADD CONSTRAINT valid_message_type CHECK (length(message_type) > 0 AND length(message_type) <= 50),
ADD CONSTRAINT valid_ttl CHECK (ttl_seconds IS NULL OR (ttl_seconds > 0 AND ttl_seconds <= 86400)), -- Max 24 hours
ADD CONSTRAINT valid_priority CHECK (priority >= -10 AND priority <= 10);

-- 6. Add check constraints to a2a_blockchain_trust
ALTER TABLE a2a_blockchain_trust
ADD CONSTRAINT valid_from_agent CHECK (from_agent ~ '^[a-zA-Z0-9_-]+$'),
ADD CONSTRAINT valid_to_agent CHECK (to_agent ~ '^[a-zA-Z0-9_-]+$'),
ADD CONSTRAINT valid_trust_level CHECK (trust_level IN ('none', 'low', 'medium', 'high', 'absolute')),
ADD CONSTRAINT different_agents CHECK (from_agent != to_agent),
ADD CONSTRAINT valid_trust_contract CHECK (contract_address IS NULL OR contract_address ~ '^0x[a-fA-F0-9]{40}$');

-- 7. Create domain types for common validations
CREATE DOMAIN blockchain_address AS TEXT
    CHECK (VALUE ~ '^0x[a-fA-F0-9]{40}$');

CREATE DOMAIN transaction_hash AS TEXT
    CHECK (VALUE ~ '^0x[a-fA-F0-9]{64}$');

CREATE DOMAIN entity_identifier AS TEXT
    CHECK (VALUE ~ '^[a-zA-Z0-9_-]+$' AND length(VALUE) > 0 AND length(VALUE) <= 255);

-- 8. Create validation functions
CREATE OR REPLACE FUNCTION validate_process_definition(p_process JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check required fields
    IF p_process->>'id' IS NULL OR p_process->>'name' IS NULL THEN
        RAISE EXCEPTION 'Process must have id and name';
    END IF;
    
    -- Check elements array
    IF p_process->'elements' IS NULL OR jsonb_array_length(p_process->'elements') = 0 THEN
        RAISE EXCEPTION 'Process must have at least one element';
    END IF;
    
    -- Validate each element
    FOR i IN 0..jsonb_array_length(p_process->'elements') - 1 LOOP
        IF (p_process->'elements'->i->>'type') IS NULL THEN
            RAISE EXCEPTION 'Each element must have a type';
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for process validation
CREATE OR REPLACE FUNCTION validate_deployment_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate process definition
    IF NOT validate_process_definition(NEW.process_definition) THEN
        RAISE EXCEPTION 'Invalid process definition';
    END IF;
    
    -- Ensure deployment_id is unique
    IF EXISTS (SELECT 1 FROM a2a_blockchain_deployments WHERE deployment_id = NEW.deployment_id) THEN
        RAISE EXCEPTION 'Deployment ID already exists';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_deployment_trigger
    BEFORE INSERT OR UPDATE ON a2a_blockchain_deployments
    FOR EACH ROW
    EXECUTE FUNCTION validate_deployment_before_insert();

-- 10. Create function for safe JSON input
CREATE OR REPLACE FUNCTION sanitize_json_input(p_input JSONB)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Remove any potentially dangerous keys
    v_result := p_input;
    
    -- Remove SQL injection attempts
    v_result := regexp_replace(v_result::text, '(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|EXEC|SCRIPT)', '', 'gi')::jsonb;
    
    -- Limit string lengths
    -- This is a simplified example - in production, you'd want more sophisticated sanitization
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 11. Create rate limiting table
CREATE TABLE IF NOT EXISTS api_rate_limits (
    rate_limit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP address or user ID
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_identifier ON api_rate_limits(identifier, endpoint, window_start);

-- 12. Function for rate limit checking
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_limit INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
    v_window_start TIMESTAMPTZ;
BEGIN
    v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Get current request count
    SELECT COALESCE(SUM(request_count), 0) INTO v_count
    FROM api_rate_limits
    WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;
    
    -- Check if limit exceeded
    IF v_count >= p_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Record this request
    INSERT INTO api_rate_limits (identifier, endpoint, request_count, window_start)
    VALUES (p_identifier, p_endpoint, 1, NOW())
    ON CONFLICT (identifier, endpoint, window_start) DO UPDATE
    SET request_count = api_rate_limits.request_count + 1,
        updated_at = NOW();
    
    -- Clean up old records
    DELETE FROM api_rate_limits WHERE window_start < NOW() - INTERVAL '24 hours';
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 13. Add composite unique constraints
ALTER TABLE a2a_blockchain_agents
ADD CONSTRAINT unique_agent_deployment UNIQUE (agent_id, deployment_id);

ALTER TABLE a2a_blockchain_contracts
ADD CONSTRAINT unique_contract_deployment UNIQUE (element_id, deployment_id);

-- 14. Create validation summary view
CREATE OR REPLACE VIEW validation_summary AS
SELECT 
    'deployments' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE status = 'deployed') as valid_records
FROM a2a_blockchain_deployments
UNION ALL
SELECT 
    'agents' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE status = 'active') as valid_records
FROM a2a_blockchain_agents
UNION ALL
SELECT 
    'contracts' as table_name,
    COUNT(*) as total_records,
    COUNT(*) as valid_records
FROM a2a_blockchain_contracts;

-- Grant permissions
GRANT SELECT ON validation_summary TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO anon, authenticated;