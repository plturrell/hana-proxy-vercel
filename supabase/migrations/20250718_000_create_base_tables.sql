-- A2A Blockchain System - Base Tables
-- This creates the foundational tables needed for the system

-- Create a2a_agents table first
CREATE TABLE IF NOT EXISTS a2a_agents (
    agent_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    capabilities TEXT[],
    status TEXT DEFAULT 'active',
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    total_requests INTEGER DEFAULT 0,
    voting_power INTEGER DEFAULT 100,
    blockchain_config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a2a_messages table
CREATE TABLE IF NOT EXISTS a2a_messages (
    message_id TEXT PRIMARY KEY,
    sender_id TEXT REFERENCES a2a_agents(agent_id),
    recipient_ids TEXT[],
    message_type TEXT NOT NULL,
    content JSONB,
    status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a2a_proposals table
CREATE TABLE IF NOT EXISTS a2a_proposals (
    proposal_id TEXT PRIMARY KEY,
    proposer_id TEXT REFERENCES a2a_agents(agent_id),
    proposal_type TEXT NOT NULL,
    proposal_data JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Create a2a_consensus_rounds table
CREATE TABLE IF NOT EXISTS a2a_consensus_rounds (
    round_id TEXT PRIMARY KEY,
    proposal_id TEXT REFERENCES a2a_proposals(proposal_id),
    status TEXT DEFAULT 'voting',
    consensus_threshold INTEGER DEFAULT 60,
    voting_deadline TIMESTAMPTZ,
    eligible_voters TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a2a_votes table
CREATE TABLE IF NOT EXISTS a2a_votes (
    vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id TEXT REFERENCES a2a_proposals(proposal_id),
    agent_id TEXT REFERENCES a2a_agents(agent_id),
    vote TEXT NOT NULL,
    reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(proposal_id, agent_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender ON a2a_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON a2a_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_proposer ON a2a_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_votes_proposal ON a2a_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_agent ON a2a_votes(agent_id);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;