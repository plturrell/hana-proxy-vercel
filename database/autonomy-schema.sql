-- A2A Autonomy Engine Database Schema
-- Run this to add the missing behavioral layer to your A2A system

-- 1. Update a2a_agents table with autonomy fields
ALTER TABLE a2a_agents
ADD COLUMN IF NOT EXISTS scheduled_tasks JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS voting_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS personality TEXT DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS performance_score DECIMAL(5,2) DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS autonomy_enabled BOOLEAN DEFAULT true;

-- 2. Agent activity logging table
CREATE TABLE IF NOT EXISTS agent_activity (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    activity_type TEXT NOT NULL, -- 'message_sent', 'vote_cast', 'proposal_created', 'task_completed'
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_activity_agent_id ON agent_activity(agent_id);
CREATE INDEX idx_agent_activity_type ON agent_activity(activity_type);
CREATE INDEX idx_agent_activity_created ON agent_activity(created_at DESC);

-- 3. Agent memory/context table
CREATE TABLE IF NOT EXISTS agent_memory (
    memory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    memory_type TEXT NOT NULL, -- 'interaction', 'decision', 'learning'
    context JSONB NOT NULL,
    importance DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_agent_memory_agent_id ON agent_memory(agent_id);
CREATE INDEX idx_agent_memory_expires ON agent_memory(expires_at);

-- 4. Agent scheduled tasks execution log
CREATE TABLE IF NOT EXISTS agent_task_executions (
    execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    task_name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'started', 'completed', 'failed'
    result JSONB,
    error TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_task_executions_agent_id ON agent_task_executions(agent_id);
CREATE INDEX idx_task_executions_status ON agent_task_executions(status);

-- 5. Agent errors table for debugging
CREATE TABLE IF NOT EXISTS agent_errors (
    error_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_errors_agent_id ON agent_errors(agent_id);
CREATE INDEX idx_agent_errors_created ON agent_errors(created_at DESC);

-- 6. Update messages table for better autonomy support
ALTER TABLE a2a_messages
ADD COLUMN IF NOT EXISTS autonomy_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS requires_response BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMPTZ;

-- 7. Function to trigger agent actions based on events
CREATE OR REPLACE FUNCTION notify_agent_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify the autonomy engine about important events
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

-- 8. Create triggers for real-time notifications
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

-- 9. Function to get agent workload
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
        
        -- Simple workload score (0-100)
        LEAST(100, 
            (SELECT COUNT(*) FROM a2a_messages WHERE p_agent_id = ANY(recipient_ids) AND metadata->>'processed' IS NULL) * 10 +
            (SELECT COUNT(*) FROM a2a_proposals WHERE proposal_data->>'assigned_to' = p_agent_id) * 20
        )::DECIMAL as workload_score;
END;
$$ LANGUAGE plpgsql;

-- 10. Function for agents to claim tasks
CREATE OR REPLACE FUNCTION agent_claim_task(
    p_agent_id TEXT,
    p_task_id TEXT,
    p_task_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_claimed BOOLEAN;
BEGIN
    -- Check if agent can claim this task
    IF NOT EXISTS (
        SELECT 1 FROM a2a_agents 
        WHERE agent_id = p_agent_id 
        AND status = 'active'
        AND autonomy_enabled = true
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Try to claim the task (using advisory lock to prevent race conditions)
    PERFORM pg_advisory_xact_lock(hashtext(p_task_id));
    
    -- Check if task is already claimed
    IF EXISTS (
        SELECT 1 FROM agent_task_executions
        WHERE task_name = p_task_id
        AND status IN ('started', 'completed')
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Claim the task
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
    
    -- Log activity
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

-- 11. View for monitoring agent health
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

-- 12. Sample agent configurations
INSERT INTO a2a_agents (
    agent_id,
    name,
    type,
    capabilities,
    voting_power,
    config,
    scheduled_tasks,
    voting_preferences,
    personality,
    goals
) VALUES 
(
    'agent-orchestrator-auto',
    'Auto Orchestrator',
    'orchestrator',
    ARRAY['routing', 'task_assignment', 'conflict_resolution'],
    300,
    '{"auto_assign": true, "max_concurrent_tasks": 10}'::jsonb,
    '[
        {"name": "check_pending_messages", "interval": "*/2 * * * *", "action": "route_messages"},
        {"name": "balance_workload", "interval": "*/10 * * * *", "action": "redistribute_tasks"}
    ]'::jsonb,
    '{"favor": ["efficiency", "automation"], "oppose": ["manual_override", "centralization"]}'::jsonb,
    'Efficient and systematic',
    ARRAY['Optimize message routing', 'Balance agent workloads', 'Ensure timely responses']
),
(
    'agent-consensus-facilitator',
    'Consensus Facilitator',
    'facilitator',
    ARRAY['proposal_creation', 'vote_aggregation', 'deadline_management'],
    250,
    '{"min_participation": 0.6, "auto_extend_deadlines": true}'::jsonb,
    '[
        {"name": "check_consensus", "interval": "*/5 * * * *", "action": "evaluate_proposals"},
        {"name": "send_reminders", "interval": "0 * * * *", "action": "remind_voters"}
    ]'::jsonb,
    '{"favor": ["democratic_process", "transparency"], "oppose": ["rushed_decisions", "low_participation"]}'::jsonb,
    'Democratic and inclusive',
    ARRAY['Ensure high participation', 'Facilitate fair voting', 'Document decisions']
),
(
    'agent-quality-monitor',
    'Quality Monitor',
    'monitor',
    ARRAY['performance_tracking', 'anomaly_detection', 'reporting'],
    200,
    '{"alert_threshold": 0.8, "report_frequency": "daily"}'::jsonb,
    '[
        {"name": "performance_check", "interval": "*/30 * * * *", "action": "analyze_performance"},
        {"name": "generate_report", "interval": "0 9 * * *", "action": "daily_report"}
    ]'::jsonb,
    '{"favor": ["quality_improvement", "accountability"], "oppose": ["lowered_standards", "opacity"]}'::jsonb,
    'Analytical and detail-oriented',
    ARRAY['Monitor system health', 'Identify bottlenecks', 'Propose improvements']
)
ON CONFLICT (agent_id) DO UPDATE SET
    scheduled_tasks = EXCLUDED.scheduled_tasks,
    voting_preferences = EXCLUDED.voting_preferences,
    personality = EXCLUDED.personality,
    goals = EXCLUDED.goals,
    autonomy_enabled = true;

-- 13. Enable Row Level Security for autonomous agents
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_task_executions ENABLE ROW LEVEL SECURITY;

-- Agents can only see their own data
CREATE POLICY agent_activity_policy ON agent_activity
    FOR ALL USING (agent_id = current_setting('app.current_agent_id', true));

CREATE POLICY agent_memory_policy ON agent_memory
    FOR ALL USING (agent_id = current_setting('app.current_agent_id', true));

CREATE POLICY agent_task_policy ON agent_task_executions
    FOR ALL USING (agent_id = current_setting('app.current_agent_id', true));

-- 14. Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 15. Initial test message to trigger autonomy
INSERT INTO a2a_messages (
    message_id,
    sender_id,
    recipient_ids,
    message_type,
    content,
    metadata,
    requires_response,
    response_deadline
) VALUES (
    'msg-autonomy-test-001',
    'system',
    ARRAY['agent-orchestrator-auto'],
    'request',
    '{"request": "Initialize autonomy engine and begin operations"}'::jsonb,
    '{"test": true, "priority": "high"}'::jsonb,
    true,
    NOW() + INTERVAL '1 hour'
);

-- Done! Your agents now have the behavioral layer they need to act autonomously.
