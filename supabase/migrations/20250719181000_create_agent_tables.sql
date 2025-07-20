-- Create tables for new agents with proper structure
-- This migration creates all necessary tables from scratch

-- Drop existing tables if they exist to ensure clean state
DROP TABLE IF EXISTS public.agent_workflows CASCADE;
DROP TABLE IF EXISTS public.agent_messages CASCADE;
DROP TABLE IF EXISTS public.api_requests CASCADE;
DROP TABLE IF EXISTS public.market_data CASCADE;
DROP TABLE IF EXISTS public.news_articles CASCADE;

-- Create news_articles table for News Intelligence Agent
CREATE TABLE IF NOT EXISTS public.news_articles (
    article_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    url TEXT,
    source TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    sentiment_score DECIMAL(3,2),
    entities JSONB DEFAULT '[]'::jsonb,
    relevance_score DECIMAL(3,2),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create market_data table for Market Data Agent
CREATE TABLE IF NOT EXISTS public.market_data (
    data_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    price DECIMAL(15,6),
    volume BIGINT,
    change_amount DECIMAL(15,6),
    change_percent DECIMAL(5,2),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    source TEXT NOT NULL,
    data_type TEXT DEFAULT 'quote',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create agent_messages table for A2A Protocol Manager
CREATE TABLE IF NOT EXISTS public.agent_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_agent TEXT NOT NULL,
    to_agent TEXT NOT NULL,
    message_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    response JSONB DEFAULT '{}'::jsonb
);

-- Create api_requests table for API Gateway Agent
CREATE TABLE IF NOT EXISTS public.api_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    client_id TEXT,
    status_code INTEGER,
    response_time_ms INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address INET,
    error_message TEXT
);

-- Create agent_workflows table
CREATE TABLE IF NOT EXISTS public.agent_workflows (
    workflow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    workflow_name TEXT NOT NULL,
    workflow_type TEXT NOT NULL,
    bpmn_definition TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON public.news_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_news_articles_sentiment ON public.news_articles(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_news_articles_source ON public.news_articles(source);

CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON public.market_data(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON public.market_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_market_data_source ON public.market_data(source);

CREATE INDEX IF NOT EXISTS idx_agent_messages_timestamp ON public.agent_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_messages_status ON public.agent_messages(status);
CREATE INDEX IF NOT EXISTS idx_agent_messages_from_to ON public.agent_messages(from_agent, to_agent);

CREATE INDEX IF NOT EXISTS idx_api_requests_timestamp ON public.api_requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_requests_endpoint ON public.api_requests(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_requests_status ON public.api_requests(status_code);

CREATE INDEX IF NOT EXISTS idx_agent_workflows_agent_id ON public.agent_workflows(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_workflows_status ON public.agent_workflows(status);

-- Enable RLS on new tables
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_workflows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service role (full access)
CREATE POLICY "service_role_all_news_articles" ON public.news_articles 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_market_data" ON public.market_data 
    FOR ALL USING (auth.role() = 'service_role');
    
CREATE POLICY "service_role_all_agent_messages" ON public.agent_messages 
    FOR ALL USING (auth.role() = 'service_role');
    
CREATE POLICY "service_role_all_api_requests" ON public.api_requests 
    FOR ALL USING (auth.role() = 'service_role');
    
CREATE POLICY "service_role_all_agent_workflows" ON public.agent_workflows 
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for authenticated users (read access)
CREATE POLICY "authenticated_read_news_articles" ON public.news_articles 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_market_data" ON public.market_data 
    FOR SELECT USING (auth.role() = 'authenticated');
    
CREATE POLICY "authenticated_read_agent_messages" ON public.agent_messages 
    FOR SELECT USING (auth.role() = 'authenticated');
    
CREATE POLICY "authenticated_read_api_requests" ON public.api_requests 
    FOR SELECT USING (auth.role() = 'authenticated');
    
CREATE POLICY "authenticated_read_agent_workflows" ON public.agent_workflows 
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create RLS policies for anon users (limited read access)
CREATE POLICY "anon_read_news_articles" ON public.news_articles 
    FOR SELECT USING (auth.role() = 'anon');

CREATE POLICY "anon_read_market_data" ON public.market_data 
    FOR SELECT USING (auth.role() = 'anon' AND timestamp > NOW() - INTERVAL '24 hours');

-- Grant appropriate permissions
GRANT ALL ON public.news_articles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.news_articles TO authenticated;
GRANT SELECT ON public.news_articles TO anon;

GRANT ALL ON public.market_data TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.market_data TO authenticated;
GRANT SELECT ON public.market_data TO anon;

GRANT ALL ON public.agent_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_messages TO authenticated;

GRANT ALL ON public.api_requests TO service_role;
GRANT SELECT, INSERT ON public.api_requests TO authenticated;

GRANT ALL ON public.agent_workflows TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.agent_workflows TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Insert sample workflow definitions for each agent
INSERT INTO public.agent_workflows (agent_id, workflow_name, workflow_type, bpmn_definition, status)
VALUES
    ('finsight.data.news_intelligence', 'News Processing Workflow', 'data_processing', 
     '<?xml version="1.0" encoding="UTF-8"?><bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" id="NewsProcessingWorkflow"><bpmn2:process id="NewsProcessing" isExecutable="true"><bpmn2:startEvent id="NewsIngestion"/><bpmn2:serviceTask id="ProcessArticle" name="Process Article"/><bpmn2:endEvent id="NewsComplete"/></bpmn2:process></bpmn2:definitions>',
     'active'),
    ('finsight.data.market_ingestion', 'Market Data Ingestion Workflow', 'data_ingestion',
     '<?xml version="1.0" encoding="UTF-8"?><bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" id="MarketDataWorkflow"><bpmn2:process id="MarketDataIngestion" isExecutable="true"><bpmn2:startEvent id="DataReceived"/><bpmn2:serviceTask id="ValidateData" name="Validate Data"/><bpmn2:endEvent id="DataStored"/></bpmn2:process></bpmn2:definitions>',
     'active'),
    ('finsight.coordination.a2a_protocol_manager', 'A2A Coordination Workflow', 'coordination',
     '<?xml version="1.0" encoding="UTF-8"?><bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" id="A2ACoordinationWorkflow"><bpmn2:process id="MessageRouting" isExecutable="true"><bpmn2:startEvent id="MessageReceived"/><bpmn2:serviceTask id="RouteMessage" name="Route Message"/><bpmn2:endEvent id="MessageDelivered"/></bpmn2:process></bpmn2:definitions>',
     'active'),
    ('finsight.coordination.ord_registry_manager', 'ORD Management Workflow', 'registry_management',
     '<?xml version="1.0" encoding="UTF-8"?><bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" id="ORDManagementWorkflow"><bpmn2:process id="RegistryDiscovery" isExecutable="true"><bpmn2:startEvent id="DiscoveryRequest"/><bpmn2:serviceTask id="ScanResources" name="Scan Resources"/><bpmn2:endEvent id="RegistryUpdated"/></bpmn2:process></bpmn2:definitions>',
     'active'),
    ('finsight.interface.api_gateway', 'API Gateway Workflow', 'api_gateway',
     '<?xml version="1.0" encoding="UTF-8"?><bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" id="APIGatewayWorkflow"><bpmn2:process id="RequestRouting" isExecutable="true"><bpmn2:startEvent id="RequestReceived"/><bpmn2:serviceTask id="AuthenticateRequest" name="Authenticate"/><bpmn2:serviceTask id="RouteRequest" name="Route Request"/><bpmn2:endEvent id="ResponseSent"/></bpmn2:process></bpmn2:definitions>',
     'active')
ON CONFLICT DO NOTHING;