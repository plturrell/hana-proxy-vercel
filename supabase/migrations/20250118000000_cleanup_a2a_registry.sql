-- Migration: Clean up A2A Registry
-- Description: Remove computational functions from a2a_agents table, keeping only 9 true autonomous agents
-- Date: 2025-01-18

-- Create backup table before cleanup
CREATE TABLE IF NOT EXISTS a2a_agents_backup_20250118 AS 
SELECT * FROM a2a_agents;

-- Log the current state
DO $$
DECLARE
    total_count INTEGER;
    true_agents_count INTEGER;
    functions_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM a2a_agents;
    
    SELECT COUNT(*) INTO true_agents_count 
    FROM a2a_agents 
    WHERE agent_id IN (
        'finsight.analytics.regime_detection',
        'finsight.analytics.portfolio_rebalancing',
        'finsight.analytics.risk_budgeting',
        'finsight.analytics.risk_parity',
        'finsight.analytics.copula_modeling',
        'finsight.analytics.garch_volatility',
        'finsight.analytics.stress_testing',
        'finsight.analytics.performance_attribution',
        'finsight.analytics.portfolio_optimization'
    );
    
    functions_count := total_count - true_agents_count;
    
    RAISE NOTICE 'A2A Registry Cleanup Starting';
    RAISE NOTICE 'Total registrations: %', total_count;
    RAISE NOTICE 'True autonomous agents: %/9', true_agents_count;
    RAISE NOTICE 'Functions to remove: %', functions_count;
END $$;

-- Execute the cleanup: Remove all entries except the 9 true autonomous agents
DELETE FROM a2a_agents 
WHERE agent_id NOT IN (
    'finsight.analytics.regime_detection',
    'finsight.analytics.portfolio_rebalancing',
    'finsight.analytics.risk_budgeting',
    'finsight.analytics.risk_parity',
    'finsight.analytics.copula_modeling',
    'finsight.analytics.garch_volatility',
    'finsight.analytics.stress_testing',
    'finsight.analytics.performance_attribution',
    'finsight.analytics.portfolio_optimization'
);

-- Verify the cleanup results
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count FROM a2a_agents;
    
    RAISE NOTICE 'A2A Registry Cleanup Completed';
    RAISE NOTICE 'Remaining agents: %', remaining_count;
    
    IF remaining_count = 9 THEN
        RAISE NOTICE 'SUCCESS: Exactly 9 agents preserved';
    ELSIF remaining_count < 9 THEN
        RAISE WARNING 'ERROR: Missing autonomous agents - only % agents remain', remaining_count;
    ELSE
        RAISE WARNING 'WARNING: Extra agents remain - % agents found', remaining_count;
    END IF;
END $$;

-- Create a cleanup log entry
CREATE TABLE IF NOT EXISTS migration_logs (
    id SERIAL PRIMARY KEY,
    migration_name TEXT NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    agents_before INTEGER,
    agents_after INTEGER,
    success BOOLEAN
);

INSERT INTO migration_logs (migration_name, agents_before, agents_after, success)
SELECT 
    '20250118_cleanup_a2a_registry',
    (SELECT COUNT(*) FROM a2a_agents_backup_20250118),
    (SELECT COUNT(*) FROM a2a_agents),
    (SELECT COUNT(*) = 9 FROM a2a_agents);

-- Final verification query
SELECT 
    agent_id,
    agent_name,
    description,
    CASE 
        WHEN agent_id IN (
            'finsight.analytics.regime_detection',
            'finsight.analytics.portfolio_rebalancing',
            'finsight.analytics.risk_budgeting',
            'finsight.analytics.risk_parity',
            'finsight.analytics.copula_modeling',
            'finsight.analytics.garch_volatility',
            'finsight.analytics.stress_testing',
            'finsight.analytics.performance_attribution',
            'finsight.analytics.portfolio_optimization'
        ) THEN 'Expected Agent ✓'
        ELSE 'Unexpected Entry ✗'
    END as status
FROM a2a_agents
ORDER BY agent_id;