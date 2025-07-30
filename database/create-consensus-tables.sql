-- A2A Consensus and Voting Tables
-- Required for advanced consensus mechanisms

-- 1. A2A Proposals table
CREATE TABLE IF NOT EXISTS a2a_proposals (
    proposal_id TEXT PRIMARY KEY,
    proposer_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    proposal_type TEXT NOT NULL,
    proposal_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'approved', 'rejected', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_a2a_proposals_proposer ON a2a_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_a2a_proposals_status ON a2a_proposals(status);
CREATE INDEX IF NOT EXISTS idx_a2a_proposals_type ON a2a_proposals(proposal_type);
CREATE INDEX IF NOT EXISTS idx_a2a_proposals_created ON a2a_proposals(created_at DESC);

-- 2. A2A Votes table
CREATE TABLE IF NOT EXISTS a2a_votes (
    vote_id TEXT PRIMARY KEY,
    proposal_id TEXT NOT NULL REFERENCES a2a_proposals(proposal_id),
    voter_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject', 'abstain')),
    voting_power INTEGER NOT NULL DEFAULT 100,
    reasoning TEXT,
    signature TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(proposal_id, voter_id) -- One vote per agent per proposal
);

CREATE INDEX IF NOT EXISTS idx_a2a_votes_proposal ON a2a_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_a2a_votes_voter ON a2a_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_a2a_votes_vote ON a2a_votes(vote);

-- 3. A2A Consensus Rounds table
CREATE TABLE IF NOT EXISTS a2a_consensus_rounds (
    round_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id TEXT NOT NULL REFERENCES a2a_proposals(proposal_id),
    voting_weights JSONB DEFAULT '{}',
    blockchain_consensus BOOLEAN DEFAULT false,
    consensus_algorithm TEXT DEFAULT 'weighted_voting',
    required_participants INTEGER DEFAULT 3,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'approved', 'rejected', 'timeout')),
    final_result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(proposal_id) -- One consensus round per proposal
);

CREATE INDEX IF NOT EXISTS idx_a2a_consensus_proposal ON a2a_consensus_rounds(proposal_id);
CREATE INDEX IF NOT EXISTS idx_a2a_consensus_status ON a2a_consensus_rounds(status);
CREATE INDEX IF NOT EXISTS idx_a2a_consensus_created ON a2a_consensus_rounds(created_at DESC);

-- 4. A2A Contracts table (for agent negotiations)
CREATE TABLE IF NOT EXISTS a2a_contracts (
    id TEXT PRIMARY KEY,
    requester TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    provider TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    proposal JSONB NOT NULL,
    terms JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'disputed')),
    response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_a2a_contracts_requester ON a2a_contracts(requester);
CREATE INDEX IF NOT EXISTS idx_a2a_contracts_provider ON a2a_contracts(provider);
CREATE INDEX IF NOT EXISTS idx_a2a_contracts_status ON a2a_contracts(status);

-- 5. Enhanced A2A Messages columns (if not exists)
ALTER TABLE a2a_messages 
ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS signature TEXT,
ADD COLUMN IF NOT EXISTS routing_priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS autonomy_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS requires_response BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMPTZ;

-- 6. A2A Blockchain Escrows table
CREATE TABLE IF NOT EXISTS a2a_blockchain_escrows (
    escrow_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    contract_address TEXT NOT NULL UNIQUE,
    client_agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    processor_agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    amount TEXT NOT NULL,
    currency TEXT DEFAULT 'ETH',
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED')),
    requirements JSONB NOT NULL,
    requirements_hash TEXT NOT NULL,
    deadline TIMESTAMPTZ,
    deployment_tx TEXT NOT NULL,
    blockchain_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_blockchain_escrows_client ON a2a_blockchain_escrows(client_agent_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_escrows_processor ON a2a_blockchain_escrows(processor_agent_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_escrows_status ON a2a_blockchain_escrows(status);

-- 7. A2A Escrow Disputes table
CREATE TABLE IF NOT EXISTS a2a_escrow_disputes (
    dispute_id TEXT PRIMARY KEY,
    escrow_id TEXT NOT NULL REFERENCES a2a_blockchain_escrows(escrow_id),
    complainant_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
    dispute_reason TEXT NOT NULL,
    evidence JSONB DEFAULT '{}',
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED')),
    resolution JSONB,
    arbitrators TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_escrow_disputes_escrow ON a2a_escrow_disputes(escrow_id);
CREATE INDEX IF NOT EXISTS idx_escrow_disputes_status ON a2a_escrow_disputes(status);

-- 8. Function to process A2A message
CREATE OR REPLACE FUNCTION process_a2a_message(
    p_message_id TEXT,
    p_sender_id TEXT,
    p_recipient_ids TEXT[],
    p_message_type TEXT,
    p_content JSONB
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Validate sender exists
    IF NOT EXISTS (SELECT 1 FROM a2a_agents WHERE agent_id = p_sender_id) THEN
        RAISE EXCEPTION 'Sender agent not found: %', p_sender_id;
    END IF;
    
    -- Insert message
    INSERT INTO a2a_messages (
        message_id,
        sender_id,
        recipient_ids,
        message_type,
        content,
        blockchain_verified,
        signature,
        created_at
    ) VALUES (
        p_message_id,
        p_sender_id,
        p_recipient_ids,
        p_message_type,
        p_content,
        true,
        encode(sha256((p_sender_id || p_message_type || p_content::text)::bytea), 'hex'),
        NOW()
    );
    
    v_result := jsonb_build_object(
        'success', true,
        'message_id', p_message_id,
        'recipients', array_length(p_recipient_ids, 1)
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function to start consensus round
CREATE OR REPLACE FUNCTION start_consensus_round(
    p_proposal_id TEXT,
    p_proposer_id TEXT,
    p_proposal_type TEXT,
    p_proposal_data JSONB,
    p_required_votes INTEGER DEFAULT 3
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Create proposal
    INSERT INTO a2a_proposals (
        proposal_id,
        proposer_id,
        proposal_type,
        proposal_data,
        status
    ) VALUES (
        p_proposal_id,
        p_proposer_id,
        p_proposal_type,
        p_proposal_data,
        'active'
    );
    
    -- Create consensus round
    INSERT INTO a2a_consensus_rounds (
        proposal_id,
        required_participants,
        voting_weights,
        blockchain_consensus
    ) VALUES (
        p_proposal_id,
        p_required_votes,
        jsonb_build_object(p_proposer_id, 100),
        true
    );
    
    v_result := jsonb_build_object(
        'success', true,
        'proposal_id', p_proposal_id,
        'status', 'active'
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function to cast vote
CREATE OR REPLACE FUNCTION cast_vote(
    p_vote_id TEXT,
    p_proposal_id TEXT,
    p_voter_id TEXT,
    p_vote TEXT,
    p_voting_power INTEGER DEFAULT 100,
    p_reasoning TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_consensus_status TEXT;
BEGIN
    -- Validate vote
    IF p_vote NOT IN ('approve', 'reject', 'abstain') THEN
        RAISE EXCEPTION 'Invalid vote: %', p_vote;
    END IF;
    
    -- Check if proposal exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM a2a_proposals 
        WHERE proposal_id = p_proposal_id 
        AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Active proposal not found: %', p_proposal_id;
    END IF;
    
    -- Insert vote
    INSERT INTO a2a_votes (
        vote_id,
        proposal_id,
        voter_id,
        vote,
        voting_power,
        reasoning,
        signature
    ) VALUES (
        p_vote_id,
        p_proposal_id,
        p_voter_id,
        p_vote,
        p_voting_power,
        p_reasoning,
        encode(sha256((p_voter_id || p_proposal_id || p_vote)::bytea), 'hex')
    );
    
    -- Check consensus
    v_consensus_status := check_consensus(p_proposal_id);
    
    v_result := jsonb_build_object(
        'success', true,
        'vote_id', p_vote_id,
        'consensus_status', v_consensus_status
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Function to check consensus
CREATE OR REPLACE FUNCTION check_consensus(p_proposal_id TEXT) 
RETURNS TEXT AS $$
DECLARE
    v_round RECORD;
    v_total_weight INTEGER;
    v_approve_weight INTEGER;
    v_consensus_reached BOOLEAN;
    v_status TEXT;
BEGIN
    -- Get consensus round
    SELECT * INTO v_round
    FROM a2a_consensus_rounds
    WHERE proposal_id = p_proposal_id
    AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN 'no_active_round';
    END IF;
    
    -- Calculate voting weights
    SELECT 
        COALESCE(SUM(voting_power), 0),
        COALESCE(SUM(CASE WHEN vote = 'approve' THEN voting_power ELSE 0 END), 0)
    INTO v_total_weight, v_approve_weight
    FROM a2a_votes
    WHERE proposal_id = p_proposal_id;
    
    -- Check if we have enough votes
    IF (SELECT COUNT(*) FROM a2a_votes WHERE proposal_id = p_proposal_id) < v_round.required_participants THEN
        RETURN 'pending';
    END IF;
    
    -- Calculate consensus (60% threshold)
    v_consensus_reached := (v_approve_weight::FLOAT / v_total_weight::FLOAT) >= 0.6;
    v_status := CASE WHEN v_consensus_reached THEN 'approved' ELSE 'rejected' END;
    
    -- Update consensus round
    UPDATE a2a_consensus_rounds
    SET 
        status = v_status,
        final_result = jsonb_build_object(
            'total_votes', (SELECT COUNT(*) FROM a2a_votes WHERE proposal_id = p_proposal_id),
            'total_weight', v_total_weight,
            'approve_weight', v_approve_weight,
            'consensus_percentage', ROUND((v_approve_weight::FLOAT / v_total_weight::FLOAT * 100)::NUMERIC, 2),
            'approved', v_consensus_reached
        ),
        completed_at = NOW()
    WHERE proposal_id = p_proposal_id;
    
    -- Update proposal
    UPDATE a2a_proposals
    SET 
        status = v_status,
        resolved_at = NOW()
    WHERE proposal_id = p_proposal_id;
    
    RETURN v_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON a2a_proposals TO authenticated;
GRANT ALL ON a2a_votes TO authenticated;
GRANT ALL ON a2a_consensus_rounds TO authenticated;
GRANT ALL ON a2a_contracts TO authenticated;
GRANT ALL ON a2a_blockchain_escrows TO authenticated;
GRANT ALL ON a2a_escrow_disputes TO authenticated;

-- Enable RLS
ALTER TABLE a2a_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_consensus_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_blockchain_escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_escrow_disputes ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable all for authenticated users" ON a2a_proposals FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON a2a_votes FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON a2a_consensus_rounds FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON a2a_contracts FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON a2a_blockchain_escrows FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON a2a_escrow_disputes FOR ALL TO authenticated USING (true);