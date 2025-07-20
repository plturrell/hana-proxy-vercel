-- A2A Registry Cleanup SQL Script
-- Purpose: Remove computational functions from A2A registry while preserving 9 true autonomous agents
-- Date: 2025-01-18

-- Step 1: Create backup of current registry
CREATE TABLE a2a_agents_backup_20250118 AS 
SELECT * FROM a2a_agents;

-- Step 2: Verify current state
SELECT 
  'Total registrations' as description,
  COUNT(*) as count
FROM a2a_agents
UNION ALL
SELECT 
  'True autonomous agents' as description,
  COUNT(*) as count
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
)
UNION ALL
SELECT 
  'Functions to remove' as description,
  COUNT(*) as count
FROM a2a_agents 
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

-- Step 3: Execute cleanup - REMOVE all except the 9 true autonomous agents
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

-- Step 4: Verify cleanup results
-- Should show exactly 9 agents
SELECT COUNT(*) as remaining_agents FROM a2a_agents;

-- List all remaining agents
SELECT 
  agent_id,
  agent_name,
  description,
  created_at
FROM a2a_agents 
ORDER BY agent_id;

-- Final verification - should show SUCCESS
SELECT 
  CASE 
    WHEN COUNT(*) = 9 THEN '✅ SUCCESS: Exactly 9 agents preserved'
    WHEN COUNT(*) < 9 THEN '❌ ERROR: Missing autonomous agents'
    WHEN COUNT(*) > 9 THEN '⚠️ WARNING: Extra agents remain'
  END as cleanup_status,
  COUNT(*) as agent_count
FROM a2a_agents;