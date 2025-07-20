-- Fix ALL A2A agents constraints for iOS compatibility

-- Make all potentially problematic columns nullable
ALTER TABLE a2a_agents ALTER COLUMN agent_name DROP NOT NULL;
ALTER TABLE a2a_agents ALTER COLUMN agent_version DROP NOT NULL;
ALTER TABLE a2a_agents ALTER COLUMN protocol_version DROP NOT NULL;
ALTER TABLE a2a_agents ALTER COLUMN agent_type DROP NOT NULL;
ALTER TABLE a2a_agents ALTER COLUMN description DROP NOT NULL;
ALTER TABLE a2a_agents ALTER COLUMN status DROP NOT NULL;
ALTER TABLE a2a_agents ALTER COLUMN capabilities DROP NOT NULL;
ALTER TABLE a2a_agents ALTER COLUMN endpoint_url DROP NOT NULL;
ALTER TABLE a2a_agents ALTER COLUMN connection_config DROP NOT NULL;
ALTER TABLE a2a_agents ALTER COLUMN function_name DROP NOT NULL;
ALTER TABLE a2a_agents ALTER COLUMN function_parameters DROP NOT NULL;

-- Set useful defaults for key columns
ALTER TABLE a2a_agents ALTER COLUMN agent_version SET DEFAULT '1.0.0';
ALTER TABLE a2a_agents ALTER COLUMN protocol_version SET DEFAULT 'A2A/1.0';
ALTER TABLE a2a_agents ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE a2a_agents ALTER COLUMN description SET DEFAULT 'iOS created agent';
ALTER TABLE a2a_agents ALTER COLUMN capabilities SET DEFAULT '[]';
ALTER TABLE a2a_agents ALTER COLUMN connection_config SET DEFAULT '{}';
ALTER TABLE a2a_agents ALTER COLUMN function_parameters SET DEFAULT '{}';

-- Update existing records to ensure name/type are populated
UPDATE a2a_agents SET 
  name = COALESCE(name, agent_name, 'Unknown Agent'),
  type = COALESCE(type, agent_type, 'general'),
  description = COALESCE(description, 'Legacy agent'),
  function_name = COALESCE(function_name, 'default_function')
WHERE name IS NULL OR type IS NULL OR description IS NULL OR function_name IS NULL;

-- Success message  
SELECT 'All A2A agents constraints fixed for iOS compatibility!' as status;