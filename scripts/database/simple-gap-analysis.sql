-- Simple Function Gap Analysis
-- Identify what functions we're missing or don't need

-- 1. Current Function Categories
WITH function_inventory AS (
    SELECT 
        p.proname as function_name,
        CASE 
            WHEN p.proname ILIKE '%cache%' THEN 'Caching'
            WHEN p.proname ILIKE '%fetch%' OR p.proname ILIKE '%get%' THEN 'Data Retrieval'
            WHEN p.proname ILIKE '%insert%' OR p.proname ILIKE '%bulk%' THEN 'Data Modification'
            WHEN p.proname ILIKE '%check%' OR p.proname ILIKE '%validate%' THEN 'Validation'
            WHEN p.proname ILIKE '%refresh%' OR p.proname ILIKE '%maintenance%' THEN 'Maintenance'
            WHEN p.proname ILIKE '%partition%' OR p.proname ILIKE '%secure%' THEN 'Infrastructure'
            WHEN p.proname ILIKE '%news%' OR p.proname ILIKE '%market%' THEN 'Business Logic'
            WHEN p.proname ILIKE '%optimization%' OR p.proname ILIKE '%performance%' THEN 'Performance'
            WHEN p.proname ILIKE '%monitor%' OR p.proname ILIKE '%stats%' THEN 'Monitoring'
            ELSE 'Utility/Other'
        END as category
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'app_data')
    AND p.prokind = 'f'
)
SELECT 
    category,
    COUNT(*) as function_count,
    string_agg(function_name, ', ' ORDER BY function_name) as functions
FROM function_inventory
GROUP BY category
ORDER BY function_count DESC;

-- 2. Functions That Might Be Redundant or Unnecessary
SELECT 
    p.proname as function_name,
    LENGTH(pg_get_functiondef(p.oid)) as code_length,
    p.pronargs as param_count,
    CASE 
        WHEN p.proname ILIKE '%test%' OR p.proname ILIKE '%debug%' THEN 'Development/Testing - May not be needed in production'
        WHEN p.proname ILIKE '%backup%' OR p.proname ILIKE '%temp%' THEN 'Temporary/Backup - Review if still needed'
        WHEN p.proname ILIKE '%_old' OR p.proname ILIKE '%deprecated%' THEN 'Deprecated - Consider removing'
        WHEN LENGTH(pg_get_functiondef(p.oid)) < 200 AND p.pronargs = 0 THEN 'Very simple - Could be inline code'
        WHEN pg_get_functiondef(p.oid) ILIKE '%TODO%' OR pg_get_functiondef(p.oid) ILIKE '%FIXME%' THEN 'Incomplete implementation'
        ELSE 'Potentially useful'
    END as assessment,
    CASE 
        WHEN p.proname ILIKE '%test%' THEN 'Consider removing if not needed for testing'
        WHEN p.proname ILIKE '%backup%' THEN 'Remove if backup strategy has changed'
        WHEN p.proname ILIKE '%_old' THEN 'Remove if superseded by newer function'
        WHEN LENGTH(pg_get_functiondef(p.oid)) < 200 THEN 'Consider inlining this simple logic'
        ELSE 'Keep - serves a purpose'
    END as recommendation
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data')
AND p.prokind = 'f'
AND (
    p.proname ILIKE '%test%' OR p.proname ILIKE '%debug%' OR 
    p.proname ILIKE '%backup%' OR p.proname ILIKE '%temp%' OR
    p.proname ILIKE '%_old' OR p.proname ILIKE '%deprecated%' OR
    LENGTH(pg_get_functiondef(p.oid)) < 200 OR
    pg_get_functiondef(p.oid) ILIKE '%TODO%' OR pg_get_functiondef(p.oid) ILIKE '%FIXME%'
)
ORDER BY assessment, function_name;

-- 3. Critical Functions We're Missing for a Financial System
WITH missing_functions AS (
    SELECT category, function_name, description, priority FROM (VALUES
        ('Risk Management', 'calculate_portfolio_var', 'Value at Risk calculation for portfolios', 'High'),
        ('Risk Management', 'calculate_portfolio_beta', 'Portfolio beta vs market benchmark', 'High'),
        ('Risk Management', 'portfolio_stress_test', 'Stress testing under market scenarios', 'High'),
        ('Data Quality', 'validate_market_data_freshness', 'Check if market data is recent enough', 'High'),
        ('Data Quality', 'detect_data_anomalies', 'Automated detection of data quality issues', 'Medium'),
        ('Data Quality', 'validate_portfolio_allocation', 'Ensure allocations sum to 100%', 'Medium'),
        ('Business Logic', 'calculate_portfolio_returns', 'Portfolio performance calculations', 'High'),
        ('Business Logic', 'calculate_sharpe_ratio', 'Risk-adjusted return calculations', 'Medium'),
        ('Business Logic', 'rebalance_recommendations', 'Portfolio rebalancing suggestions', 'Medium'),
        ('Reporting', 'generate_risk_report', 'Automated risk reporting', 'Medium'),
        ('Reporting', 'export_compliance_report', 'Compliance data export', 'Medium'),
        ('Automation', 'auto_archive_old_news', 'Archive news articles older than X months', 'Low'),
        ('Automation', 'cleanup_stale_cache', 'Clean up expired cache entries', 'Low'),
        ('Integration', 'sync_portfolio_positions', 'Sync positions across systems', 'Medium'),
        ('Monitoring', 'alert_on_stale_data', 'Alert when critical data becomes stale', 'Medium')
    ) AS f(category, function_name, description, priority)
)
SELECT 
    category,
    function_name,
    description,
    priority,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE n.nspname IN ('public', 'app_data') 
            AND (p.proname ILIKE '%' || split_part(function_name, '_', 2) || '%'
                 OR p.proname ILIKE '%' || split_part(function_name, '_', 3) || '%')
        ) THEN 'Similar function exists - review if adequate'
        ELSE 'Missing - should implement'
    END as status
FROM missing_functions
ORDER BY 
    CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END,
    category;

-- 4. Tables Without Supporting Functions
WITH table_analysis AS (
    SELECT 
        t.table_name,
        CASE 
            WHEN t.table_name ILIKE '%portfolio%' THEN 'Portfolio'
            WHEN t.table_name ILIKE '%news%' OR t.table_name ILIKE '%article%' THEN 'News'
            WHEN t.table_name ILIKE '%market%' OR t.table_name ILIKE '%price%' THEN 'Market Data'
            WHEN t.table_name ILIKE '%agent%' OR t.table_name ILIKE '%a2a%' THEN 'Agent'
            WHEN t.table_name ILIKE '%risk%' OR t.table_name ILIKE '%compliance%' THEN 'Risk'
            ELSE 'Other'
        END as domain,
        EXISTS (
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE n.nspname = 'public' 
            AND (p.proname ILIKE '%' || split_part(t.table_name, '_', 1) || '%'
                 OR p.proname ILIKE '%' || split_part(t.table_name, '_', 2) || '%')
        ) as has_functions
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'news_articles_y%'  -- Exclude partitions
    AND t.table_name NOT LIKE '%cache%'
)
SELECT 
    domain,
    COUNT(*) as total_tables,
    COUNT(*) FILTER (WHERE has_functions) as tables_with_functions,
    COUNT(*) FILTER (WHERE NOT has_functions) as tables_without_functions,
    ROUND(COUNT(*) FILTER (WHERE has_functions)::numeric / COUNT(*) * 100, 1) as coverage_percent,
    string_agg(
        CASE WHEN NOT has_functions THEN table_name ELSE NULL END, 
        ', ' 
    ) as tables_needing_functions
FROM table_analysis
WHERE domain != 'Other'
GROUP BY domain
ORDER BY coverage_percent ASC;

-- 5. Function Complexity Assessment
SELECT 
    p.proname as function_name,
    LENGTH(pg_get_functiondef(p.oid)) as code_length,
    p.pronargs as param_count,
    CASE 
        WHEN LENGTH(pg_get_functiondef(p.oid)) > 3000 THEN 'Very Large - Consider splitting'
        WHEN LENGTH(pg_get_functiondef(p.oid)) > 1500 THEN 'Large - Review complexity'
        WHEN LENGTH(pg_get_functiondef(p.oid)) > 500 THEN 'Medium - Acceptable'
        ELSE 'Small - Good'
    END as size_assessment,
    CASE 
        WHEN p.pronargs > 6 THEN 'Too many parameters - Consider refactoring'
        WHEN p.pronargs > 3 THEN 'Many parameters - Review if necessary'
        ELSE 'Parameter count OK'
    END as parameter_assessment
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data')
AND p.prokind = 'f'
AND (LENGTH(pg_get_functiondef(p.oid)) > 1500 OR p.pronargs > 4)
ORDER BY LENGTH(pg_get_functiondef(p.oid)) DESC;

-- 6. Summary and Recommendations
SELECT 
    'Function Analysis Summary' as section,
    '' as details
    
UNION ALL SELECT 'Functions to Consider Removing', 
    (SELECT COUNT(*)::text FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
     WHERE n.nspname IN ('public', 'app_data') AND p.prokind = 'f' 
     AND (p.proname ILIKE '%test%' OR p.proname ILIKE '%debug%' OR p.proname ILIKE '%temp%'))
     
UNION ALL SELECT 'High Priority Missing Functions', 
    'calculate_portfolio_var, calculate_portfolio_returns, validate_market_data_freshness'
    
UNION ALL SELECT 'Tables Needing Function Support', 
    (SELECT COUNT(DISTINCT t.table_name)::text FROM information_schema.tables t
     WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
     AND NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
                    WHERE n.nspname = 'public' AND p.proname ILIKE '%' || split_part(t.table_name, '_', 1) || '%'))
                    
UNION ALL SELECT 'Functions Needing Refactoring', 
    (SELECT COUNT(*)::text FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
     WHERE n.nspname IN ('public', 'app_data') AND p.prokind = 'f' 
     AND (LENGTH(pg_get_functiondef(p.oid)) > 2000 OR p.pronargs > 5));