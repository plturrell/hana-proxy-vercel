-- Simple Function Review and Rating
-- Comprehensive analysis of database functions for quality and design

-- 1. Function Overview
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    p.pronargs as parameter_count,
    format_type(p.prorettype, NULL) as return_type,
    l.lanname as language,
    CASE p.provolatile
        WHEN 'i' THEN 'IMMUTABLE'
        WHEN 's' THEN 'STABLE' 
        WHEN 'v' THEN 'VOLATILE'
    END as volatility,
    CASE p.prosecdef 
        WHEN true THEN 'SECURITY DEFINER' 
        ELSE 'SECURITY INVOKER' 
    END as security_type,
    LENGTH(pg_get_functiondef(p.oid)) as code_length_bytes,
    CASE 
        WHEN obj_description(p.oid, 'pg_proc') IS NOT NULL THEN 'Has Documentation'
        ELSE 'No Documentation'
    END as documentation_status,
    CASE 
        WHEN LENGTH(pg_get_functiondef(p.oid)) > 2000 THEN 'Very Large'
        WHEN LENGTH(pg_get_functiondef(p.oid)) > 1000 THEN 'Large'
        WHEN LENGTH(pg_get_functiondef(p.oid)) > 500 THEN 'Medium'
        ELSE 'Small'
    END as size_category
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname IN ('public', 'app_data')
AND p.prokind = 'f'  -- Functions only
ORDER BY LENGTH(pg_get_functiondef(p.oid)) DESC;

-- 2. Function Categories by Purpose
SELECT 
    CASE 
        WHEN p.proname ILIKE '%cache%' THEN 'Caching Functions'
        WHEN p.proname ILIKE '%fetch%' OR p.proname ILIKE '%get%' THEN 'Data Retrieval'
        WHEN p.proname ILIKE '%insert%' OR p.proname ILIKE '%bulk%' THEN 'Data Modification'
        WHEN p.proname ILIKE '%check%' OR p.proname ILIKE '%validate%' THEN 'Validation'
        WHEN p.proname ILIKE '%refresh%' OR p.proname ILIKE '%maintenance%' THEN 'Maintenance'
        WHEN p.proname ILIKE '%partition%' OR p.proname ILIKE '%secure%' THEN 'Infrastructure'
        WHEN p.proname ILIKE '%news%' OR p.proname ILIKE '%market%' THEN 'Business Logic'
        WHEN p.proname ILIKE '%optimization%' OR p.proname ILIKE '%performance%' THEN 'Performance'
        WHEN p.proname ILIKE '%monitor%' OR p.proname ILIKE '%stats%' THEN 'Monitoring'
        ELSE 'Utility/Other'
    END as function_category,
    COUNT(*) as function_count,
    string_agg(p.proname, ', ' ORDER BY p.proname) as function_names
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data')
AND p.prokind = 'f'
GROUP BY 1
ORDER BY function_count DESC;

-- 3. Quality Assessment
WITH quality_metrics AS (
    SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition,
        
        -- Quality indicators (1 = good, 0 = needs improvement)
        CASE WHEN obj_description(p.oid, 'pg_proc') IS NOT NULL THEN 1 ELSE 0 END as has_documentation,
        CASE WHEN pg_get_functiondef(p.oid) ILIKE '%EXCEPTION%' THEN 1 ELSE 0 END as has_error_handling,
        CASE WHEN pg_get_functiondef(p.oid) ILIKE '%RAISE%' THEN 1 ELSE 0 END as has_logging,
        CASE WHEN LENGTH(pg_get_functiondef(p.oid)) <= 1000 THEN 1 ELSE 0 END as reasonable_size,
        CASE WHEN p.pronargs <= 4 THEN 1 ELSE 0 END as simple_interface,
        CASE WHEN pg_get_functiondef(p.oid) NOT ILIKE '%SELECT \*%' THEN 1 ELSE 0 END as avoids_select_star,
        
        p.pronargs,
        LENGTH(pg_get_functiondef(p.oid)) as code_length
        
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'app_data')
    AND p.prokind = 'f'
)
SELECT 
    schema_name,
    function_name,
    (has_documentation + has_error_handling + has_logging + 
     reasonable_size + simple_interface + avoids_select_star) * 100.0 / 6 as quality_score,
    
    CASE WHEN has_documentation = 1 THEN '✓' ELSE '✗' END || ' Documentation' as doc_status,
    CASE WHEN has_error_handling = 1 THEN '✓' ELSE '✗' END || ' Error Handling' as error_status,
    CASE WHEN has_logging = 1 THEN '✓' ELSE '✗' END || ' Logging/Debug' as logging_status,
    CASE WHEN reasonable_size = 1 THEN '✓' ELSE '✗' END || ' Size (' || code_length || ' bytes)' as size_status,
    CASE WHEN simple_interface = 1 THEN '✓' ELSE '✗' END || ' Interface (' || pronargs || ' params)' as interface_status,
    
    CASE 
        WHEN (has_documentation + has_error_handling + has_logging + reasonable_size + simple_interface + avoids_select_star) >= 5 
        THEN 'Excellent'
        WHEN (has_documentation + has_error_handling + has_logging + reasonable_size + simple_interface + avoids_select_star) >= 4 
        THEN 'Good'
        WHEN (has_documentation + has_error_handling + has_logging + reasonable_size + simple_interface + avoids_select_star) >= 3 
        THEN 'Needs Improvement'
        ELSE 'Poor - Needs Major Refactoring'
    END as overall_rating
    
FROM quality_metrics
ORDER BY quality_score DESC, function_name;

-- 4. Security and Performance Issues
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    
    CASE WHEN p.prosecdef = true THEN 'SECURITY DEFINER - Review needed' ELSE 'SECURITY INVOKER - OK' END as security_concern,
    
    CASE 
        WHEN p.provolatile = 'v' AND pg_get_functiondef(p.oid) NOT ILIKE '%INSERT%' 
             AND pg_get_functiondef(p.oid) NOT ILIKE '%UPDATE%' 
             AND pg_get_functiondef(p.oid) NOT ILIKE '%DELETE%'
             AND pg_get_functiondef(p.oid) NOT ILIKE '%NOW()%'
        THEN 'Consider STABLE/IMMUTABLE for performance'
        ELSE 'Volatility appropriate'
    END as volatility_suggestion,
    
    CASE WHEN LENGTH(pg_get_functiondef(p.oid)) > 2000 
         THEN 'Large function - consider splitting' 
         ELSE 'Size OK' 
    END as size_recommendation,
    
    CASE WHEN p.pronargs > 5 
         THEN 'Many parameters - consider using record/JSON' 
         ELSE 'Parameter count OK' 
    END as interface_recommendation

FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data')
AND p.prokind = 'f'
ORDER BY p.prosecdef DESC, LENGTH(pg_get_functiondef(p.oid)) DESC;

-- 5. Summary Statistics
SELECT 
    'Total Functions' as metric,
    COUNT(*)::text as value,
    'Database functions across public and app_data schemas' as description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data') AND p.prokind = 'f'

UNION ALL

SELECT 
    'Functions with Documentation',
    COUNT(*)::text || ' (' || ROUND(COUNT(*)::numeric * 100.0 / (
        SELECT COUNT(*) FROM pg_proc p2 
        JOIN pg_namespace n2 ON p2.pronamespace = n2.oid 
        WHERE n2.nspname IN ('public', 'app_data') AND p2.prokind = 'f'
    ), 1) || '%)',
    'Functions that have proper documentation'
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data') AND p.prokind = 'f'
AND obj_description(p.oid, 'pg_proc') IS NOT NULL

UNION ALL

SELECT 
    'SECURITY DEFINER Functions',
    COUNT(*)::text,
    'Functions running with elevated privileges - should be reviewed'
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data') AND p.prokind = 'f'
AND p.prosecdef = true

UNION ALL

SELECT 
    'Large Functions (>1KB)',
    COUNT(*)::text,
    'Functions that might benefit from refactoring'
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data') AND p.prokind = 'f'
AND LENGTH(pg_get_functiondef(p.oid)) > 1000

UNION ALL

SELECT 
    'Functions with Error Handling',
    COUNT(*)::text || ' (' || ROUND(COUNT(*)::numeric * 100.0 / (
        SELECT COUNT(*) FROM pg_proc p2 
        JOIN pg_namespace n2 ON p2.pronamespace = n2.oid 
        WHERE n2.nspname IN ('public', 'app_data') AND p2.prokind = 'f'
    ), 1) || '%)',
    'Functions that include proper exception handling'
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data') AND p.prokind = 'f'
AND pg_get_functiondef(p.oid) ILIKE '%EXCEPTION%';