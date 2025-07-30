-- Function Gap Analysis
-- Identify missing functions, redundant functions, and unused functions

-- 1. Current Function Inventory
WITH function_inventory AS (
    SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition,
        p.pronargs as param_count,
        obj_description(p.oid, 'pg_proc') as documentation,
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
        END as category,
        CASE 
            WHEN pg_get_functiondef(p.oid) ILIKE '%http%' OR pg_get_functiondef(p.oid) ILIKE '%api%' THEN 'External API'
            WHEN pg_get_functiondef(p.oid) ILIKE '%jsonb%' OR pg_get_functiondef(p.oid) ILIKE '%json%' THEN 'JSON Processing'
            WHEN format_type(p.prorettype, NULL) = 'trigger' THEN 'Trigger Function'
            WHEN p.proretset = true THEN 'Set Returning'
            ELSE 'Standard Function'
        END as function_type
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'app_data')
    AND p.prokind = 'f'
)
SELECT 
    category,
    function_type,
    COUNT(*) as function_count,
    string_agg(function_name, ', ' ORDER BY function_name) as functions
FROM function_inventory
GROUP BY category, function_type
ORDER BY category, function_count DESC;

-- 2. Identify Potential Duplicates or Redundant Functions
WITH similar_functions AS (
    SELECT 
        p1.proname as function1,
        p2.proname as function2,
        CASE 
            WHEN p1.proname ILIKE p2.proname THEN 'Name similarity'
            WHEN levenshtein(p1.proname, p2.proname) <= 3 THEN 'Very similar names'
            WHEN pg_get_functiondef(p1.oid) = pg_get_functiondef(p2.oid) THEN 'Identical code'
            ELSE 'Different'
        END as similarity_type
    FROM pg_proc p1
    JOIN pg_proc p2 ON p1.oid != p2.oid
    JOIN pg_namespace n1 ON p1.pronamespace = n1.oid
    JOIN pg_namespace n2 ON p2.pronamespace = n2.oid
    WHERE n1.nspname IN ('public', 'app_data')
    AND n2.nspname IN ('public', 'app_data')
    AND p1.prokind = 'f' AND p2.prokind = 'f'
    AND (
        levenshtein(p1.proname, p2.proname) <= 3
        OR pg_get_functiondef(p1.oid) = pg_get_functiondef(p2.oid)
    )
)
SELECT 
    similarity_type,
    function1,
    function2,
    'Review for potential consolidation' as recommendation
FROM similar_functions
WHERE function1 < function2  -- Avoid duplicates in results
ORDER BY similarity_type, function1;

-- 3. Check for Missing Core Functions that financial systems typically need
WITH missing_functions AS (
    SELECT * FROM (VALUES
        ('Data Validation', 'validate_portfolio_allocation', 'Ensure portfolio allocations sum to 100%'),
        ('Data Validation', 'validate_market_data_freshness', 'Check if market data is recent enough'),
        ('Data Validation', 'validate_news_data_quality', 'Validate news article completeness'),
        ('Risk Management', 'calculate_portfolio_var', 'Value at Risk calculation'),
        ('Risk Management', 'calculate_portfolio_beta', 'Portfolio beta calculation'),
        ('Risk Management', 'detect_market_anomalies', 'Automated anomaly detection'),
        ('Business Logic', 'calculate_portfolio_returns', 'Calculate portfolio performance'),
        ('Business Logic', 'generate_risk_report', 'Generate risk assessment reports'),
        ('Business Logic', 'calculate_correlation_matrix', 'Asset correlation calculations'),
        ('Data Cleanup', 'archive_old_news_articles', 'Archive articles older than X months'),
        ('Data Cleanup', 'cleanup_duplicate_market_data', 'Remove duplicate market data entries'),
        ('Monitoring', 'check_data_pipeline_health', 'Monitor data ingestion pipeline'),
        ('Monitoring', 'alert_on_stale_data', 'Alert when data becomes stale'),
        ('Performance', 'optimize_query_cache', 'Intelligent query cache management'),
        ('Security', 'log_sensitive_data_access', 'Audit trail for sensitive data access'),
        ('Integration', 'sync_portfolio_positions', 'Sync positions across systems'),
        ('Integration', 'export_compliance_report', 'Export data for compliance reporting')
    ) AS missing(category, function_name, description)
) 
SELECT 
    category,
    function_name,
    description,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE n.nspname IN ('public', 'app_data') 
            AND p.proname ILIKE '%' || split_part(function_name, '_', 2) || '%'
        ) THEN 'Similar function exists'
        ELSE 'Missing - Consider implementing'
    END as status
FROM missing_functions
ORDER BY category, function_name;

-- 4. Functions that might not add value (low usage indicators)
WITH potentially_unused AS (
    SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition,
        LENGTH(pg_get_functiondef(p.oid)) as code_length,
        p.pronargs as param_count,
        CASE 
            WHEN p.proname ILIKE '%test%' OR p.proname ILIKE '%debug%' THEN 'Development/Testing'
            WHEN p.proname ILIKE '%backup%' OR p.proname ILIKE '%temp%' THEN 'Temporary/Backup'
            WHEN pg_get_functiondef(p.oid) ILIKE '%TODO%' OR pg_get_functiondef(p.oid) ILIKE '%FIXME%' THEN 'Incomplete'
            WHEN LENGTH(pg_get_functiondef(p.oid)) < 200 AND p.pronargs = 0 THEN 'Very Simple'
            WHEN p.proname ILIKE '%_old' OR p.proname ILIKE '%_deprecated%' THEN 'Deprecated'
            ELSE 'Active'
        END as usage_indicator
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'app_data')
    AND p.prokind = 'f'
)
SELECT 
    schema_name,
    function_name,
    usage_indicator,
    code_length,
    CASE usage_indicator
        WHEN 'Development/Testing' THEN 'Consider removing if not needed in production'
        WHEN 'Temporary/Backup' THEN 'Review if still needed'
        WHEN 'Incomplete' THEN 'Complete implementation or remove'
        WHEN 'Very Simple' THEN 'Consider if this could be inline code instead'
        WHEN 'Deprecated' THEN 'Remove if no longer used'
        ELSE 'Keep'
    END as recommendation
FROM potentially_unused
WHERE usage_indicator != 'Active'
ORDER BY usage_indicator, function_name;

-- 5. Critical Functions Missing Based on Table Structure
WITH table_functions AS (
    SELECT 
        t.table_name,
        CASE 
            WHEN t.table_name ILIKE '%portfolio%' THEN 'Portfolio Management'
            WHEN t.table_name ILIKE '%news%' OR t.table_name ILIKE '%article%' THEN 'News Processing'
            WHEN t.table_name ILIKE '%market%' OR t.table_name ILIKE '%price%' THEN 'Market Data'
            WHEN t.table_name ILIKE '%agent%' OR t.table_name ILIKE '%a2a%' THEN 'Agent Management'
            WHEN t.table_name ILIKE '%risk%' OR t.table_name ILIKE '%compliance%' THEN 'Risk Management'
            ELSE 'Other'
        END as domain,
        -- Check if corresponding functions exist
        EXISTS (
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE n.nspname = 'public' 
            AND p.proname ILIKE '%' || split_part(t.table_name, '_', 1) || '%'
        ) as has_related_functions
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE '%partition%'
    AND t.table_name NOT LIKE '%cache%'
)
SELECT 
    domain,
    COUNT(*) as table_count,
    COUNT(*) FILTER (WHERE has_related_functions) as tables_with_functions,
    COUNT(*) FILTER (WHERE NOT has_related_functions) as tables_without_functions,
    string_agg(
        CASE WHEN NOT has_related_functions THEN table_name ELSE NULL END, 
        ', ' 
    ) as tables_needing_functions
FROM table_functions
WHERE domain != 'Other'
GROUP BY domain
ORDER BY tables_without_functions DESC;

-- 6. Function Complexity vs Value Assessment
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    LENGTH(pg_get_functiondef(p.oid)) as code_complexity,
    p.pronargs as parameter_complexity,
    CASE 
        WHEN LENGTH(pg_get_functiondef(p.oid)) > 2000 AND p.pronargs > 5 THEN 'High Complexity'
        WHEN LENGTH(pg_get_functiondef(p.oid)) > 1000 OR p.pronargs > 3 THEN 'Medium Complexity'
        ELSE 'Low Complexity'
    END as complexity_level,
    CASE 
        WHEN p.proname ILIKE '%core%' OR p.proname ILIKE '%main%' OR p.proname ILIKE '%primary%' THEN 'High Value'
        WHEN p.proname ILIKE '%helper%' OR p.proname ILIKE '%util%' OR p.proname ILIKE '%support%' THEN 'Medium Value'
        WHEN p.proname ILIKE '%test%' OR p.proname ILIKE '%debug%' OR p.proname ILIKE '%temp%' THEN 'Low Value'
        ELSE 'Unknown Value'
    END as estimated_value,
    CASE 
        WHEN LENGTH(pg_get_functiondef(p.oid)) > 2000 AND p.proname ILIKE '%test%' 
        THEN 'High complexity, low value - consider removing'
        WHEN LENGTH(pg_get_functiondef(p.oid)) > 1000 AND p.pronargs > 5 
        THEN 'High complexity - consider refactoring'
        WHEN LENGTH(pg_get_functiondef(p.oid)) < 200 AND p.pronargs = 0 
        THEN 'Very simple - consider inlining'
        ELSE 'Complexity appropriate'
    END as recommendation
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data')
AND p.prokind = 'f'
ORDER BY LENGTH(pg_get_functiondef(p.oid)) DESC;

-- 7. Summary: Functions We Should Consider Adding
SELECT 
    'Critical Missing Functions' as analysis_type,
    'These functions would add significant value to the system' as description
    
UNION ALL SELECT 'Portfolio Risk Functions', 'calculate_portfolio_var, calculate_portfolio_beta, portfolio_stress_test'
UNION ALL SELECT 'Data Quality Functions', 'validate_market_data_completeness, detect_data_anomalies, data_freshness_check'
UNION ALL SELECT 'Business Logic Functions', 'calculate_sharpe_ratio, calculate_portfolio_returns, rebalance_recommendations'
UNION ALL SELECT 'Automation Functions', 'auto_archive_old_data, auto_cleanup_cache, scheduled_maintenance'
UNION ALL SELECT 'Integration Functions', 'export_portfolio_report, sync_external_data, compliance_data_export';