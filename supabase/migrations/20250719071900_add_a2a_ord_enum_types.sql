-- A2A and ORD Metadata Enum Types
-- Create standardized enum types for Agent-to-Agent and Open Resource Discovery metadata

-- A2A Protocol Versions
DO $$ BEGIN
    CREATE TYPE a2a_protocol_version AS ENUM (
        'a2a/v1.0',
        'a2a/v1.1', 
        'a2a/v1.2',
        'a2a/v2.0-beta',
        'a2a/v2.0'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- A2A Agent Capabilities
DO $$ BEGIN
    CREATE TYPE a2a_agent_capability AS ENUM (
        'financial-analysis',
        'risk-assessment',
        'portfolio-optimization',
        'market-research',
        'compliance-monitoring',
        'fraud-detection',
        'algorithmic-trading',
        'sentiment-analysis',
        'forecasting',
        'data-transformation',
        'anomaly-detection',
        'regulatory-reporting',
        'stress-testing',
        'backtesting',
        'performance-attribution'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- A2A Message Types
DO $$ BEGIN
    CREATE TYPE a2a_message_type AS ENUM (
        'request',
        'response', 
        'notification',
        'broadcast',
        'negotiation',
        'heartbeat',
        'error',
        'ack',
        'nack',
        'subscribe',
        'unsubscribe',
        'discovery'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- A2A Message Priority
DO $$ BEGIN
    CREATE TYPE a2a_message_priority AS ENUM (
        'low',
        'normal',
        'high', 
        'urgent',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- A2A Consensus Methods
DO $$ BEGIN
    CREATE TYPE a2a_consensus_method AS ENUM (
        'simple-majority',
        'weighted-voting',
        'reputation-based',
        'stake-weighted',
        'proof-of-work',
        'proof-of-stake',
        'delegated-consensus',
        'byzantine-fault-tolerant'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- A2A Verification Levels
DO $$ BEGIN
    CREATE TYPE a2a_verification_level AS ENUM (
        'none',
        'basic',
        'enhanced',
        'cryptographic',
        'blockchain-verified',
        'multi-signature',
        'zero-knowledge-proof'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- A2A Agent Roles
DO $$ BEGIN
    CREATE TYPE a2a_agent_role AS ENUM (
        'autonomous',
        'reactive',
        'coordinator',
        'monitor',
        'validator',
        'mediator',
        'aggregator',
        'transformer',
        'gateway',
        'oracle'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- A2A Communication Patterns
DO $$ BEGIN
    CREATE TYPE a2a_communication_pattern AS ENUM (
        'synchronous',
        'asynchronous',
        'publish-subscribe',
        'request-response',
        'streaming',
        'batch',
        'event-driven',
        'message-queue'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ORD Specification Versions
DO $$ BEGIN
    CREATE TYPE ord_version AS ENUM (
        'v1.0',
        'v1.1',
        'v1.2',
        'v1.3',
        'v1.4',
        'v1.5',
        'v1.6',
        'v1.7',
        'v1.8',
        'v1.9',
        'v1.10',
        'v1.11',
        'v1.12'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ORD Release Status
DO $$ BEGIN
    CREATE TYPE ord_release_status AS ENUM (
        'active',
        'beta',
        'deprecated',
        'retired',
        'planned',
        'draft',
        'review',
        'approved'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ORD Visibility Levels
DO $$ BEGIN
    CREATE TYPE ord_visibility AS ENUM (
        'public',
        'internal',
        'restricted',
        'private',
        'partner',
        'customer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ORD API Protocols
DO $$ BEGIN
    CREATE TYPE ord_api_protocol AS ENUM (
        'rest',
        'graphql',
        'grpc',
        'websocket',
        'sse',
        'soap',
        'rpc',
        'odata',
        'mqtt',
        'kafka'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ORD Data Product Types
DO $$ BEGIN
    CREATE TYPE ord_data_product_type AS ENUM (
        'primary',
        'derived',
        'aggregated',
        'reference',
        'audit',
        'operational',
        'analytical',
        'transactional',
        'master',
        'dimensional'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ORD Entity Levels
DO $$ BEGIN
    CREATE TYPE ord_entity_level AS ENUM (
        '1',
        '2', 
        '3',
        '4',
        '5'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ORD Capability Extensibility
DO $$ BEGIN
    CREATE TYPE ord_capability_extensibility AS ENUM (
        'automatic',
        'manual',
        'none',
        'scripted',
        'api-driven'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ORD Policy Levels
DO $$ BEGIN
    CREATE TYPE ord_policy_level AS ENUM (
        'sap:core:v1',
        'custom:v1',
        'partner:v1',
        'industry:finance:v1',
        'regulatory:mifid:v1',
        'regulatory:basel:v1'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ORD Resource Categories
DO $$ BEGIN
    CREATE TYPE ord_resource_category AS ENUM (
        'api',
        'event',
        'entity-type',
        'data-product',
        'capability',
        'package',
        'group',
        'integration-dependency',
        'tombstone'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ORD Documentation Types
DO $$ BEGIN
    CREATE TYPE ord_documentation_type AS ENUM (
        'openapi-v3',
        'asyncapi-v2',
        'json-schema',
        'markdown',
        'html',
        'pdf',
        'swagger-v2',
        'raml',
        'blueprint'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ORD Access Strategies
DO $$ BEGIN
    CREATE TYPE ord_access_strategy AS ENUM (
        'open',
        'api-key',
        'oauth2',
        'jwt',
        'basic-auth',
        'certificate',
        'saml',
        'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Compliance Status
DO $$ BEGIN
    CREATE TYPE compliance_status AS ENUM (
        'compliant',
        'non-compliant',
        'partially-compliant',
        'unknown',
        'pending-review',
        'exempted'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Data Quality Levels
DO $$ BEGIN
    CREATE TYPE data_quality_level AS ENUM (
        'gold',
        'silver',
        'bronze',
        'raw',
        'quarantined',
        'deprecated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Security Classifications
DO $$ BEGIN
    CREATE TYPE security_classification AS ENUM (
        'public',
        'internal',
        'confidential',
        'restricted',
        'top-secret'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create a function to list all enum types
CREATE OR REPLACE FUNCTION list_enum_types()
RETURNS TABLE(
    enum_name TEXT,
    enum_values TEXT[]
) 
LANGUAGE sql
AS $$
    SELECT 
        t.typname::TEXT as enum_name,
        array_agg(e.enumlabel::TEXT ORDER BY e.enumsortorder) as enum_values
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typtype = 'e'
    AND t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND (t.typname LIKE 'a2a_%' OR t.typname LIKE 'ord_%' OR t.typname IN ('compliance_status', 'data_quality_level', 'security_classification'))
    GROUP BY t.typname
    ORDER BY t.typname;
$$;