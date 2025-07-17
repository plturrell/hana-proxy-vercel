-- Row Level Security for Private Blockchain Tables
-- Secure access control for A2A agent communication and smart contract operations

-- 1. Enable RLS on all blockchain tables
ALTER TABLE a2a_blockchain_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_blockchain_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_blockchain_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_blockchain_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_blockchain_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_blockchain_trust ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_events ENABLE ROW LEVEL SECURITY;

-- 2. Deployment policies - who can deploy and view processes
CREATE POLICY "Authenticated users can view their deployments" ON a2a_blockchain_deployments
    FOR SELECT USING (
        auth.uid()::text = deployer_wallet OR
        auth.jwt()->>'role' = 'service_role'
    );

CREATE POLICY "Service role can manage all deployments" ON a2a_blockchain_deployments
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Deployers can update their own deployments" ON a2a_blockchain_deployments
    FOR UPDATE USING (auth.uid()::text = deployer_wallet)
    WITH CHECK (auth.uid()::text = deployer_wallet);

-- 3. Agent policies - agents can only access their own data and messages
CREATE POLICY "Agents can view themselves and connected agents" ON a2a_blockchain_agents
    FOR SELECT USING (
        wallet_address = auth.uid()::text OR
        agent_id IN (
            SELECT DISTINCT unnest(ARRAY[from_agent, to_agent])
            FROM a2a_blockchain_trust
            WHERE from_agent = auth.uid()::text OR to_agent = auth.uid()::text
        ) OR
        auth.jwt()->>'role' = 'service_role'
    );

CREATE POLICY "Agents can update their own status" ON a2a_blockchain_agents
    FOR UPDATE USING (wallet_address = auth.uid()::text)
    WITH CHECK (wallet_address = auth.uid()::text);

CREATE POLICY "Service role can manage all agents" ON a2a_blockchain_agents
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 4. Contract policies - visibility based on deployment participation
CREATE POLICY "Users can view contracts they deployed or interact with" ON a2a_blockchain_contracts
    FOR SELECT USING (
        deployer = auth.uid()::text OR
        deployment_id IN (
            SELECT deployment_id FROM a2a_blockchain_deployments
            WHERE deployer_wallet = auth.uid()::text
        ) OR
        auth.jwt()->>'role' = 'service_role'
    );

CREATE POLICY "Service role can manage all contracts" ON a2a_blockchain_contracts
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 5. Task policies - agents can only see tasks they're involved in
CREATE POLICY "Agents can view tasks they execute or are assigned to" ON a2a_blockchain_tasks
    FOR SELECT USING (
        executor_wallet = auth.uid()::text OR
        current_agent IN (
            SELECT agent_id FROM a2a_blockchain_agents
            WHERE wallet_address = auth.uid()::text
        ) OR
        auth.jwt()->>'role' = 'service_role'
    );

CREATE POLICY "Agents can update tasks assigned to them" ON a2a_blockchain_tasks
    FOR UPDATE USING (
        current_agent IN (
            SELECT agent_id FROM a2a_blockchain_agents
            WHERE wallet_address = auth.uid()::text
        )
    );

CREATE POLICY "Service role can manage all tasks" ON a2a_blockchain_tasks
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 6. Message policies - agents can only see messages sent to/from them
CREATE POLICY "Agents can view their messages" ON a2a_blockchain_messages
    FOR SELECT USING (
        sender_id IN (
            SELECT agent_id FROM a2a_blockchain_agents
            WHERE wallet_address = auth.uid()::text
        ) OR
        auth.uid()::text = ANY(recipient_ids) OR
        EXISTS (
            SELECT 1 FROM a2a_blockchain_agents
            WHERE wallet_address = auth.uid()::text
            AND agent_id = ANY(a2a_blockchain_messages.recipient_ids)
        ) OR
        auth.jwt()->>'role' = 'service_role'
    );

CREATE POLICY "Agents can send messages" ON a2a_blockchain_messages
    FOR INSERT WITH CHECK (
        sender_id IN (
            SELECT agent_id FROM a2a_blockchain_agents
            WHERE wallet_address = auth.uid()::text
        ) OR
        auth.jwt()->>'role' = 'service_role'
    );

CREATE POLICY "Service role can manage all messages" ON a2a_blockchain_messages
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 7. Trust relationship policies
CREATE POLICY "Agents can view trust relationships they're part of" ON a2a_blockchain_trust
    FOR SELECT USING (
        from_agent IN (
            SELECT agent_id FROM a2a_blockchain_agents
            WHERE wallet_address = auth.uid()::text
        ) OR
        to_agent IN (
            SELECT agent_id FROM a2a_blockchain_agents
            WHERE wallet_address = auth.uid()::text
        ) OR
        auth.jwt()->>'role' = 'service_role'
    );

CREATE POLICY "Agents can establish trust from themselves" ON a2a_blockchain_trust
    FOR INSERT WITH CHECK (
        from_agent IN (
            SELECT agent_id FROM a2a_blockchain_agents
            WHERE wallet_address = auth.uid()::text
        ) OR
        auth.jwt()->>'role' = 'service_role'
    );

CREATE POLICY "Service role can manage all trust relationships" ON a2a_blockchain_trust
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 8. Validation policies
CREATE POLICY "Users can view their validation results" ON a2a_validations
    FOR SELECT USING (
        wallet_address = auth.uid()::text OR
        auth.jwt()->>'role' = 'service_role'
    );

CREATE POLICY "Service role can manage all validations" ON a2a_validations
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 9. Blockchain events - public read for transparency
CREATE POLICY "Authenticated users can view blockchain events" ON blockchain_events
    FOR SELECT USING (auth.jwt()->>'sub' IS NOT NULL);

CREATE POLICY "Service role can create events" ON blockchain_events
    FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- 10. Create helper functions for RLS
CREATE OR REPLACE FUNCTION get_user_agent_ids()
RETURNS TEXT[] AS $$
    SELECT ARRAY_AGG(agent_id)
    FROM a2a_blockchain_agents
    WHERE wallet_address = auth.uid()::text;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_agent_interact(p_agent_id TEXT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM a2a_blockchain_trust
        WHERE (from_agent = p_agent_id AND to_agent = ANY(get_user_agent_ids()))
        OR (to_agent = p_agent_id AND from_agent = ANY(get_user_agent_ids()))
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- 11. Create views for easier access
CREATE OR REPLACE VIEW my_blockchain_agents AS
SELECT * FROM a2a_blockchain_agents
WHERE wallet_address = auth.uid()::text;

CREATE OR REPLACE VIEW my_blockchain_messages AS
SELECT * FROM a2a_blockchain_messages
WHERE sender_id = ANY(get_user_agent_ids())
OR EXISTS (
    SELECT 1 FROM unnest(recipient_ids) AS r(id)
    WHERE r.id = ANY(get_user_agent_ids())
);

CREATE OR REPLACE VIEW my_blockchain_tasks AS
SELECT * FROM a2a_blockchain_tasks
WHERE executor_wallet = auth.uid()::text
OR current_agent = ANY(get_user_agent_ids());

-- 12. Grant appropriate permissions
GRANT SELECT ON a2a_blockchain_deployments TO authenticated;
GRANT SELECT ON a2a_blockchain_agents TO authenticated;
GRANT SELECT, UPDATE ON a2a_blockchain_agents TO authenticated;
GRANT SELECT ON a2a_blockchain_contracts TO authenticated;
GRANT SELECT, UPDATE ON a2a_blockchain_tasks TO authenticated;
GRANT SELECT, INSERT ON a2a_blockchain_messages TO authenticated;
GRANT SELECT, INSERT ON a2a_blockchain_trust TO authenticated;
GRANT SELECT ON a2a_validations TO authenticated;
GRANT SELECT ON blockchain_events TO authenticated;

GRANT SELECT ON my_blockchain_agents TO authenticated;
GRANT SELECT ON my_blockchain_messages TO authenticated;
GRANT SELECT ON my_blockchain_tasks TO authenticated;

-- Service role gets full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;