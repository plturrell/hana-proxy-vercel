-- Create 15 Missing Core Tables
-- Migration: 20250719050001_create_missing_tables.sql

-- 1. AGENTS table (core agent management)
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    configuration JSONB DEFAULT '{}',
    capabilities TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER_TASKS table (task management)
CREATE TABLE IF NOT EXISTS public.user_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRICE_ALERTS table
CREATE TABLE IF NOT EXISTS public.price_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('above', 'below', 'change')),
    threshold_value DECIMAL(20,6) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    triggered_at TIMESTAMPTZ,
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SESSION_STATES table
CREATE TABLE IF NOT EXISTS public.session_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    state_data JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. NOTIFICATIONS table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AGENT_INTERACTIONS table
CREATE TABLE IF NOT EXISTS public.agent_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    interaction_type VARCHAR(50) NOT NULL,
    request_data JSONB,
    response_data JSONB,
    duration_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. NEWS_QUERIES table
CREATE TABLE IF NOT EXISTS public.news_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    result_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. KNOWLEDGE_GRAPH_ENTITIES table
CREATE TABLE IF NOT EXISTS public.knowledge_graph_entities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    properties JSONB DEFAULT '{}',
    relationships JSONB DEFAULT '{}',
    source_references TEXT[],
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_type, entity_name)
);

-- 9. PROCESS_EXECUTIONS table
CREATE TABLE IF NOT EXISTS public.process_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    process_name VARCHAR(255) NOT NULL,
    process_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'running',
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER
);

-- 10. RISK_PARAMETERS table
CREATE TABLE IF NOT EXISTS public.risk_parameters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    parameter_name VARCHAR(100) NOT NULL,
    parameter_value DECIMAL(20,6) NOT NULL,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, parameter_name)
);

-- 11. AUDIT_LOGS table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    changes JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SECURITY_EVENTS table
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. API_USAGE table
CREATE TABLE IF NOT EXISTS public.api_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_count INTEGER DEFAULT 1,
    response_time_ms INTEGER,
    status_code INTEGER,
    date DATE DEFAULT CURRENT_DATE,
    hour INTEGER DEFAULT EXTRACT(hour FROM NOW()),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ORD_ANALYTICS_RESOURCES table
CREATE TABLE IF NOT EXISTS public.ord_analytics_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id VARCHAR(255) UNIQUE NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    ord_version VARCHAR(20) DEFAULT 'v1.0',
    metadata JSONB NOT NULL,
    visibility VARCHAR(20) DEFAULT 'public',
    release_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. A2A_ANALYTICS_COMMUNICATIONS table
CREATE TABLE IF NOT EXISTS public.a2a_analytics_communications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_agent_id VARCHAR(255) NOT NULL,
    receiver_agent_id VARCHAR(255) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    protocol_version VARCHAR(20) DEFAULT 'a2a/v1.0',
    message_content JSONB NOT NULL,
    consensus_data JSONB,
    verification_level VARCHAR(20) DEFAULT 'basic',
    status VARCHAR(20) DEFAULT 'delivered',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_user_tasks_user_id ON public.user_tasks(user_id);
CREATE INDEX idx_user_tasks_agent_id ON public.user_tasks(assigned_agent_id);
CREATE INDEX idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX idx_price_alerts_symbol ON public.price_alerts(symbol);
CREATE INDEX idx_session_states_user_id ON public.session_states(user_id);
CREATE INDEX idx_session_states_token ON public.session_states(session_token);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_agent_interactions_agent_id ON public.agent_interactions(agent_id);
CREATE INDEX idx_news_queries_user_id ON public.news_queries(user_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_api_usage_user_id ON public.api_usage(user_id);
CREATE INDEX idx_api_usage_date ON public.api_usage(date);
CREATE INDEX idx_a2a_comms_sender ON public.a2a_analytics_communications(sender_agent_id);
CREATE INDEX idx_a2a_comms_receiver ON public.a2a_analytics_communications(receiver_agent_id);

-- Enable RLS on all tables
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_graph_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ord_analytics_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.a2a_analytics_communications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own agents" ON public.agents
    FOR ALL USING (auth.uid()::text::bigint = user_id);

CREATE POLICY "Users can manage their own tasks" ON public.user_tasks
    FOR ALL USING (auth.uid()::text::bigint = user_id);

CREATE POLICY "Users can manage their own alerts" ON public.price_alerts
    FOR ALL USING (auth.uid()::text::bigint = user_id);

CREATE POLICY "Users can access their own sessions" ON public.session_states
    FOR ALL USING (auth.uid()::text::bigint = user_id);

CREATE POLICY "Users can access their own notifications" ON public.notifications
    FOR ALL USING (auth.uid()::text::bigint = user_id);

CREATE POLICY "Service role has full access" ON public.agents
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON public.user_tasks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access" ON public.audit_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Enable GraphQL for new tables
COMMENT ON TABLE public.agents IS E'@graphql({"primary_key_columns": ["id"]})';
COMMENT ON TABLE public.user_tasks IS E'@graphql({"primary_key_columns": ["id"]})';
COMMENT ON TABLE public.price_alerts IS E'@graphql({"primary_key_columns": ["id"]})';
COMMENT ON TABLE public.notifications IS E'@graphql({"primary_key_columns": ["id"]})';

-- Success notification
DO $$
BEGIN
    RAISE NOTICE '15 missing core tables created successfully';
END $$;