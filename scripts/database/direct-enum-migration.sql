-- Direct A2A and ORD Enum Creation (Simplified)
-- This creates the core enum types without complex migration logic

-- A2A Protocol Versions
CREATE TYPE a2a_protocol_version AS ENUM (
    'a2a/v1.0',
    'a2a/v1.1', 
    'a2a/v1.2',
    'a2a/v2.0-beta',
    'a2a/v2.0'
);

-- A2A Agent Capabilities
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

-- ORD Release Status
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

-- ORD Visibility Levels
CREATE TYPE ord_visibility AS ENUM (
    'public',
    'internal',
    'restricted',
    'private',
    'partner',
    'customer'
);

-- Compliance Status
CREATE TYPE compliance_status AS ENUM (
    'compliant',
    'non-compliant',
    'partially-compliant',
    'unknown',
    'pending-review',
    'exempted'
);

-- Data Quality Levels
CREATE TYPE data_quality_level AS ENUM (
    'gold',
    'silver',
    'bronze',
    'raw',
    'quarantined',
    'deprecated'
);