-- Fix A2A agents constraints for iOS compatibility

-- Make agent_name nullable to allow new agent creation
ALTER TABLE a2a_agents ALTER COLUMN agent_name DROP NOT NULL;

-- Make other required columns nullable for new agent insertion
ALTER TABLE a2a_agents ALTER COLUMN agent_version DROP NOT NULL;
ALTER TABLE a2a_agents ALTER COLUMN protocol_version DROP NOT NULL;
ALTER TABLE a2a_agents ALTER COLUMN agent_type DROP NOT NULL;

-- Set default values for important columns
ALTER TABLE a2a_agents ALTER COLUMN agent_version SET DEFAULT '1.0.0';
ALTER TABLE a2a_agents ALTER COLUMN protocol_version SET DEFAULT 'A2A/1.0';
ALTER TABLE a2a_agents ALTER COLUMN status SET DEFAULT 'active';

-- Ensure name column is populated for existing records
UPDATE a2a_agents SET name = agent_name WHERE name IS NULL AND agent_name IS NOT NULL;
UPDATE a2a_agents SET type = agent_type WHERE type IS NULL AND agent_type IS NOT NULL;

-- Success message
SELECT 'A2A agents constraints fixed for iOS compatibility!' as status;