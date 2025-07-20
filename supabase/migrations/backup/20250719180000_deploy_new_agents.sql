-- Deploy New Agent Infrastructure
-- This migration creates the database schema for 5 new agents:
-- 1. News Intelligence Agent
-- 2. Market Data Agent  
-- 3. A2A Protocol Manager
-- 4. ORD Registry Manager
-- 5. API Gateway Agent

-- Ensure agent tables exist and have proper structure
DO $$
BEGIN
    -- Create a2a_agents table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'a2a_agents') THEN
        CREATE TABLE public.a2a_agents (
            agent_id TEXT PRIMARY KEY,
            agent_name TEXT NOT NULL,
            agent_type TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'active',
            capabilities JSONB DEFAULT '[]'::jsonb,
            voting_power INTEGER DEFAULT 50,
            connection_config JSONB DEFAULT '{}'::jsonb,
            scheduled_tasks JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    -- Create ord_analytics_resources table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ord_analytics_resources') THEN
        CREATE TABLE public.ord_analytics_resources (
            agent_id TEXT PRIMARY KEY,
            resource_type TEXT NOT NULL,
            resource_name TEXT NOT NULL,
            resource_path TEXT,
            capabilities JSONB DEFAULT '{}'::jsonb,
            requirements JSONB DEFAULT '{}'::jsonb,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    -- Create agent_workflows table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agent_workflows') THEN
        CREATE TABLE public.agent_workflows (
            workflow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            agent_id TEXT NOT NULL,
            workflow_name TEXT NOT NULL,
            workflow_type TEXT NOT NULL,
            bpmn_definition TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    -- Create news_articles table for News Intelligence Agent
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'news_articles') THEN
        CREATE TABLE public.news_articles (
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
    END IF;

    -- Create market_data table for Market Data Agent
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'market_data') THEN
        CREATE TABLE public.market_data (
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
    END IF;

    -- Create agent_messages table for A2A Protocol Manager
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agent_messages') THEN
        CREATE TABLE public.agent_messages (
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
    END IF;

    -- Create api_requests table for API Gateway Agent
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_requests') THEN
        CREATE TABLE public.api_requests (
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
    END IF;

END $$;

-- Insert/Update the 5 new agents
INSERT INTO public.a2a_agents (
    agent_id, agent_name, agent_type, description, status, capabilities, voting_power, connection_config, scheduled_tasks
) VALUES 
(
    'finsight.data.news_intelligence',
    'News Intelligence Agent',
    'data_product',
    'Processes news articles and extracts financial intelligence using AI',
    'active',
    '["news_processing", "sentiment_analysis", "entity_extraction", "relevance_scoring"]'::jsonb,
    75,
    '{"goals": ["Process financial news in real-time", "Extract actionable intelligence", "Provide sentiment analysis"], "personality": "analytical", "auto_respond": true, "max_concurrent_tasks": 50}'::jsonb,
    '[{"name": "news_processing", "interval": "*/5 * * * *", "action": "processNewArticles"}, {"name": "sentiment_refresh", "interval": "*/15 * * * *", "action": "refreshSentimentModels"}]'::jsonb
),
(
    'finsight.data.market_ingestion',
    'Market Data Agent',
    'data_product', 
    'Ingests and processes real-time market data from multiple sources',
    'active',
    '["real_time_quotes", "historical_data", "data_normalization", "symbol_management"]'::jsonb,
    75,
    '{"goals": ["Provide real-time market data", "Ensure data quality", "Manage symbol subscriptions"], "personality": "reliable", "auto_respond": true, "max_concurrent_tasks": 100}'::jsonb,
    '[{"name": "data_ingestion", "interval": "*/1 * * * *", "action": "ingestMarketData"}, {"name": "data_validation", "interval": "*/10 * * * *", "action": "validateDataQuality"}]'::jsonb
),
(
    'finsight.coordination.a2a_protocol_manager',
    'A2A Protocol Manager',
    'coordination',
    'Manages agent-to-agent communication and coordination protocols',
    'active',
    '["message_routing", "contract_negotiation", "consensus_management", "workflow_orchestration"]'::jsonb,
    100,
    '{"goals": ["Facilitate seamless agent communication", "Manage consensus protocols", "Orchestrate complex workflows"], "personality": "coordinator", "auto_respond": true, "max_concurrent_tasks": 200}'::jsonb,
    '[{"name": "message_processing", "interval": "*/1 * * * *", "action": "processMessages"}, {"name": "consensus_monitoring", "interval": "*/5 * * * *", "action": "monitorConsensus"}]'::jsonb
),
(
    'finsight.coordination.ord_registry_manager', 
    'ORD Registry Manager',
    'coordination',
    'Manages ORD v1.12 compliant capability discovery and registry maintenance',
    'active',
    '["capability_discovery", "registry_management", "metadata_tracking", "compliance_validation"]'::jsonb,
    85,
    '{"goals": ["Maintain ORD compliance", "Enable capability discovery", "Track resource metadata"], "personality": "meticulous", "auto_respond": true, "max_concurrent_tasks": 75}'::jsonb,
    '[{"name": "registry_discovery", "interval": "*/5 * * * *", "action": "performRegistryDiscovery"}, {"name": "compliance_validation", "interval": "*/15 * * * *", "action": "validateCompliance"}]'::jsonb
),
(
    'finsight.interface.api_gateway',
    'API Gateway Agent',
    'interface',
    'Manages API request routing, authentication, rate limiting, and security',
    'active', 
    '["request_routing", "authentication", "rate_limiting", "load_balancing", "circuit_breaking", "security_filtering"]'::jsonb,
    100,
    '{"goals": ["Provide secure API access", "Ensure optimal request routing", "Protect against abuse"], "personality": "vigilant", "auto_respond": true, "max_concurrent_tasks": 100}'::jsonb,
    '[{"name": "rate_limit_cleanup", "interval": "*/1 * * * *", "action": "cleanupRateLimiters"}, {"name": "routing_table_refresh", "interval": "*/15 * * * *", "action": "refreshRoutingTable"}]'::jsonb
)
ON CONFLICT (agent_id) DO UPDATE SET
    agent_name = EXCLUDED.agent_name,
    agent_type = EXCLUDED.agent_type,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    capabilities = EXCLUDED.capabilities,
    voting_power = EXCLUDED.voting_power,
    connection_config = EXCLUDED.connection_config,
    scheduled_tasks = EXCLUDED.scheduled_tasks,
    updated_at = CURRENT_TIMESTAMP;

-- Insert/Update ORD registry entries
INSERT INTO public.ord_analytics_resources (
    agent_id, resource_type, resource_name, resource_path, capabilities, requirements, metadata
) VALUES
(
    'finsight.data.news_intelligence',
    'agent',
    'News Intelligence Agent',
    '/api/agents/news-intelligence',
    '{"input_types": ["news_articles", "urls"], "output_types": ["sentiment_scores", "entities", "intelligence_reports"], "protocols": ["HTTP", "A2A"], "discovery": ["ORD", "A2A"]}'::jsonb,
    '{"data_access": ["news_sources", "perplexity_api"], "dependencies": ["supabase", "perplexity"], "permissions": ["news_processing", "sentiment_analysis"]}'::jsonb,
    '{"category": "data_product", "version": "1.0.0", "documentation": "/docs/agents/news-intelligence", "performance": {"avg_response_time_ms": 200, "success_rate": 0.99}}'::jsonb
),
(
    'finsight.data.market_ingestion',
    'agent', 
    'Market Data Agent',
    '/api/agents/market-data',
    '{"input_types": ["market_feeds", "symbols"], "output_types": ["real_time_quotes", "historical_data"], "protocols": ["HTTP", "WebSocket", "A2A"], "discovery": ["ORD", "A2A"]}'::jsonb,
    '{"data_access": ["market_data", "symbol_registry"], "dependencies": ["supabase", "finhub", "fmp"], "permissions": ["market_data_ingestion", "symbol_management"]}'::jsonb,
    '{"category": "data_product", "version": "1.0.0", "documentation": "/docs/agents/market-data", "performance": {"avg_response_time_ms": 100, "success_rate": 0.999}}'::jsonb
),
(
    'finsight.coordination.a2a_protocol_manager',
    'agent',
    'A2A Protocol Manager', 
    '/api/agents/a2a-protocol-manager',
    '{"input_types": ["agent_messages", "contracts"], "output_types": ["routed_messages", "consensus_results"], "protocols": ["A2A", "HTTP"], "discovery": ["ORD", "A2A"]}'::jsonb,
    '{"data_access": ["agent_messages", "workflows"], "dependencies": ["supabase", "all_agents"], "permissions": ["message_routing", "consensus_management"]}'::jsonb,
    '{"category": "coordination", "version": "1.0.0", "documentation": "/docs/agents/a2a-protocol-manager", "performance": {"avg_response_time_ms": 50, "success_rate": 0.999}}'::jsonb
),
(
    'finsight.coordination.ord_registry_manager',
    'agent',
    'ORD Registry Manager',
    '/api/agents/ord-registry-manager', 
    '{"input_types": ["discovery_requests", "resource_metadata"], "output_types": ["capability_maps", "compliance_reports"], "protocols": ["HTTP", "A2A"], "discovery": ["ORD", "A2A"]}'::jsonb,
    '{"data_access": ["ord_registry", "agent_metadata"], "dependencies": ["supabase", "ord_spec"], "permissions": ["registry_management", "compliance_validation"]}'::jsonb,
    '{"category": "coordination", "version": "1.0.0", "documentation": "/docs/agents/ord-registry-manager", "performance": {"avg_response_time_ms": 150, "success_rate": 0.98}}'::jsonb
),
(
    'finsight.interface.api_gateway',
    'agent',
    'API Gateway Agent',
    '/api/agents/api-gateway',
    '{"input_types": ["http_requests", "routing_configs"], "output_types": ["routed_responses", "auth_decisions"], "protocols": ["HTTP", "HTTPS", "WebSocket", "A2A"], "discovery": ["ORD", "A2A"]}'::jsonb,
    '{"data_access": ["api_endpoints", "auth_tokens"], "dependencies": ["supabase", "all_endpoints"], "permissions": ["request_routing", "authentication_validation"]}'::jsonb,
    '{"category": "interface", "version": "1.0.0", "documentation": "/docs/agents/api-gateway", "performance": {"avg_response_time_ms": 50, "success_rate": 0.999}}'::jsonb
)
ON CONFLICT (agent_id) DO UPDATE SET
    resource_type = EXCLUDED.resource_type,
    resource_name = EXCLUDED.resource_name,
    resource_path = EXCLUDED.resource_path,
    capabilities = EXCLUDED.capabilities,
    requirements = EXCLUDED.requirements,
    metadata = EXCLUDED.metadata,
    updated_at = CURRENT_TIMESTAMP;

-- Insert workflow definitions
INSERT INTO public.agent_workflows (
    agent_id, workflow_name, workflow_type, bpmn_definition, status
) VALUES
(
    'finsight.data.news_intelligence',
    'News Processing Workflow',
    'data_processing',
    '<?xml version="1.0" encoding="UTF-8"?><bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" id="NewsProcessingWorkflow"><bpmn2:process id="NewsProcessing" isExecutable="true"><bpmn2:startEvent id="NewsIngestion"/><bpmn2:serviceTask id="ProcessArticle" name="Process Article"/><bpmn2:endEvent id="NewsComplete"/></bpmn2:process></bpmn2:definitions>',
    'active'
),
(
    'finsight.data.market_ingestion',
    'Market Data Ingestion Workflow', 
    'data_ingestion',
    '<?xml version="1.0" encoding="UTF-8"?><bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" id="MarketDataWorkflow"><bpmn2:process id="MarketDataIngestion" isExecutable="true"><bpmn2:startEvent id="DataReceived"/><bpmn2:serviceTask id="ValidateData" name="Validate Data"/><bpmn2:endEvent id="DataStored"/></bpmn2:process></bpmn2:definitions>',
    'active'
),
(
    'finsight.coordination.a2a_protocol_manager',
    'A2A Coordination Workflow',
    'coordination',
    '<?xml version="1.0" encoding="UTF-8"?><bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" id="A2ACoordinationWorkflow"><bpmn2:process id="MessageRouting" isExecutable="true"><bpmn2:startEvent id="MessageReceived"/><bpmn2:serviceTask id="RouteMessage" name="Route Message"/><bpmn2:endEvent id="MessageDelivered"/></bpmn2:process></bpmn2:definitions>',
    'active'
),
(
    'finsight.coordination.ord_registry_manager',
    'ORD Management Workflow',
    'registry_management',
    '<?xml version="1.0" encoding="UTF-8"?><bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" id="ORDManagementWorkflow"><bpmn2:process id="RegistryDiscovery" isExecutable="true"><bpmn2:startEvent id="DiscoveryRequest"/><bpmn2:serviceTask id="ScanResources" name="Scan Resources"/><bpmn2:endEvent id="RegistryUpdated"/></bpmn2:process></bpmn2:definitions>',
    'active'
),
(
    'finsight.interface.api_gateway',
    'API Gateway Workflow',
    'api_gateway',
    '<?xml version="1.0" encoding="UTF-8"?><bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" id="APIGatewayWorkflow"><bpmn2:process id="RequestRouting" isExecutable="true"><bpmn2:startEvent id="RequestReceived"/><bpmn2:serviceTask id="AuthenticateRequest" name="Authenticate"/><bpmn2:serviceTask id="RouteRequest" name="Route Request"/><bpmn2:endEvent id="ResponseSent"/></bpmn2:process></bpmn2:definitions>',
    'active'
)
ON CONFLICT (agent_id, workflow_name) DO UPDATE SET
    workflow_type = EXCLUDED.workflow_type,
    bpmn_definition = EXCLUDED.bpmn_definition,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON public.news_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_news_articles_sentiment ON public.news_articles(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON public.market_data(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON public.market_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_messages_timestamp ON public.agent_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_messages_status ON public.agent_messages(status);
CREATE INDEX IF NOT EXISTS idx_api_requests_timestamp ON public.api_requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_requests_endpoint ON public.api_requests(endpoint);

-- Enable RLS on new tables
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY IF NOT EXISTS "news_articles_read" ON public.news_articles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "market_data_read" ON public.market_data FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "agent_messages_read" ON public.agent_messages FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "api_requests_read" ON public.api_requests FOR SELECT USING (true);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON public.news_articles TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.market_data TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_messages TO authenticated, anon;
GRANT SELECT, INSERT ON public.api_requests TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.agent_workflows TO authenticated, anon;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;