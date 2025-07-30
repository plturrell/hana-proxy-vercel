-- Check if analytics agents exist in the database
-- Looking for agents corresponding to the 32 analytics functions

-- Check total agent count
SELECT COUNT(*) as total_agents FROM a2a_agents;

-- Check for specific analytics agents
SELECT agent_id, name, type, capabilities 
FROM a2a_agents 
WHERE type IN ('analytics', 'calculator', 'analyst')
   OR name LIKE '%pearson%'
   OR name LIKE '%correlation%'
   OR name LIKE '%var%'
   OR name LIKE '%sharpe%'
   OR name LIKE '%volatility%'
   OR name LIKE '%portfolio%'
   OR name LIKE '%risk%'
   OR name LIKE '%monte%'
   OR name LIKE '%black%'
   OR name LIKE '%duration%'
   OR name LIKE '%convexity%'
   OR name LIKE '%sortino%'
   OR name LIKE '%treynor%'
   OR name LIKE '%information%'
   OR name LIKE '%jensen%'
   OR name LIKE '%copula%'
   OR name LIKE '%garch%'
   OR name LIKE '%cointegration%'
   OR name LIKE '%granger%'
   OR name LIKE '%regime%'
   OR name LIKE '%markov%'
   OR name LIKE '%jump%'
   OR name LIKE '%heston%'
   OR name LIKE '%vasicek%'
   OR name LIKE '%nelson%'
   OR name LIKE '%credit%'
   OR name LIKE '%merton%'
   OR name LIKE '%hull%'
   OR name LIKE '%factor%'
   OR name LIKE '%stress%'
   OR name LIKE '%liquidity%'
ORDER BY agent_id;

-- Check for PRDORD tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%prdord%' OR table_name LIKE '%PRDORD%')
ORDER BY table_name;

-- List all agent types
SELECT DISTINCT type, COUNT(*) as count 
FROM a2a_agents 
GROUP BY type 
ORDER BY count DESC;