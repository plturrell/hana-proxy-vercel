-- ========================================
-- A2A REGISTRY CLEANUP - FINAL EXECUTION
-- ========================================
-- Purpose: Remove all computational functions from A2A registry
-- Preserve: Only 9 true autonomous agents
-- Date: 2025-01-18
-- ========================================

-- STEP 1: Create backup (IMPORTANT - DO THIS FIRST!)
CREATE TABLE a2a_agents_backup_20250118_final AS 
SELECT * FROM a2a_agents;

-- Verify backup was created
SELECT COUNT(*) as backup_count FROM a2a_agents_backup_20250118_final;

-- STEP 2: Check current state
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

-- STEP 3: EXECUTE THE CLEANUP
-- This will DELETE all entries except the 9 true autonomous agents
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

-- STEP 4: Verify cleanup was successful
-- Should return exactly 9
SELECT COUNT(*) as remaining_agents FROM a2a_agents;

-- List all remaining agents (should be exactly 9)
SELECT 
  agent_id,
  agent_name,
  description
FROM a2a_agents 
ORDER BY agent_id;

-- Final verification
SELECT 
  CASE 
    WHEN COUNT(*) = 9 THEN '✅ SUCCESS: Exactly 9 agents preserved - Cleanup completed!'
    WHEN COUNT(*) < 9 THEN '❌ ERROR: Missing autonomous agents - Check backup!'
    WHEN COUNT(*) > 9 THEN '⚠️ WARNING: Extra agents remain - Cleanup incomplete!'
  END as cleanup_status,
  COUNT(*) as final_agent_count
FROM a2a_agents;

-- ========================================
-- ROLLBACK COMMAND (if needed):
-- INSERT INTO a2a_agents SELECT * FROM a2a_agents_backup_20250118_final;
-- ========================================