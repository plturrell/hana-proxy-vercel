-- Comprehensive Function Analysis
-- Rate and review all database functions for quality, design, performance, and maintainability

-- 1. Function Overview and Basic Metrics
WITH function_stats AS (
    SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        p.pronargs as parameter_count,
        pg_get_function_identity_arguments(p.oid) as parameters,
        pg_get_functiondef(p.oid) as full_definition,
        LENGTH(pg_get_functiondef(p.oid)) as code_length,
        CASE p.provolatile
            WHEN 'i' THEN 'IMMUTABLE'
            WHEN 's' THEN 'STABLE' 
            WHEN 'v' THEN 'VOLATILE'
        END as volatility,
        CASE p.prosecdef 
            WHEN true THEN 'SECURITY DEFINER' 
            ELSE 'SECURITY INVOKER' 
        END as security_type,
        format_type(p.prorettype, NULL) as return_type,
        l.lanname as language,
        CASE 
            WHEN p.proconfig IS NOT NULL THEN 
                array_to_string(p.proconfig, '; ')
            ELSE NULL
        END as configuration_settings,
        obj_description(p.oid, 'pg_proc') as documentation
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    JOIN pg_language l ON p.prolang = l.oid
    WHERE n.nspname IN ('public', 'app_data')
    AND p.prokind = 'f'  -- Functions only, not procedures
)
SELECT 
    schema_name,
    function_name,
    parameter_count,
    return_type,
    language,
    volatility,
    security_type,
    code_length,
    CASE 
        WHEN documentation IS NOT NULL THEN 'Documented'
        ELSE 'No Documentation'
    END as has_documentation,
    CASE 
        WHEN code_length > 2000 THEN 'Very Large (>2KB)'
        WHEN code_length > 1000 THEN 'Large (>1KB)'
        WHEN code_length > 500 THEN 'Medium (>500B)'
        ELSE 'Small (<500B)'
    END as code_size_category,
    CASE 
        WHEN parameter_count > 5 THEN 'High Complexity'
        WHEN parameter_count > 2 THEN 'Medium Complexity'
        ELSE 'Low Complexity'
    END as parameter_complexity
FROM function_stats
ORDER BY schema_name, function_name;

-- 2. Function Quality Assessment
WITH function_quality AS (
    SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition,
        
        -- Quality Indicators
        CASE WHEN obj_description(p.oid, 'pg_proc') IS NOT NULL THEN 1 ELSE 0 END as has_docs,
        
        CASE WHEN pg_get_functiondef(p.oid) ILIKE '%RAISE NOTICE%' 
             OR pg_get_functiondef(p.oid) ILIKE '%RAISE LOG%' THEN 1 ELSE 0 END as has_logging,
             
        CASE WHEN pg_get_functiondef(p.oid) ILIKE '%EXCEPTION%' 
             AND pg_get_functiondef(p.oid) ILIKE '%BEGIN%' THEN 1 ELSE 0 END as has_error_handling,
             
        CASE WHEN pg_get_functiondef(p.oid) ILIKE '%-- %' 
             OR pg_get_functiondef(p.oid) ILIKE '%/* %' THEN 1 ELSE 0 END as has_comments,
             
        CASE WHEN p.provolatile = 'i' AND pg_get_functiondef(p.oid) NOT ILIKE '%NOW()%' 
             AND pg_get_functiondef(p.oid) NOT ILIKE '%CURRENT_%' THEN 1 ELSE 0 END as proper_immutable,
             
        CASE WHEN p.prosecdef = true AND p.proconfig IS NOT NULL 
             AND 'search_path=pg_catalog,public' = ANY(p.proconfig) THEN 1 ELSE 0 END as secure_definer,
             
        CASE WHEN pg_get_functiondef(p.oid) ILIKE '%SELECT \* FROM%' THEN 0 ELSE 1 END as avoids_select_star,
        
        CASE WHEN LENGTH(pg_get_functiondef(p.oid)) > 2000 THEN 0 ELSE 1 END as reasonable_size,
        
        p.pronargs as param_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'app_data')
    AND p.prokind = 'f'
)
SELECT 
    schema_name,
    function_name,
    (has_docs + has_logging + has_error_handling + has_comments + 
     proper_immutable + secure_definer + avoids_select_star + reasonable_size)::float / 8 * 100 as quality_score,
    
    CASE 
        WHEN has_docs = 1 THEN '✓ Documented' 
        ELSE '✗ No Documentation' 
    END as documentation_status,
    
    CASE 
        WHEN has_error_handling = 1 THEN '✓ Error Handling' 
        ELSE '✗ No Error Handling' 
    END as error_handling_status,
    
    CASE 
        WHEN has_logging = 1 THEN '✓ Has Logging' 
        ELSE '✗ No Logging' 
    END as logging_status,
    
    CASE 
        WHEN param_count <= 3 THEN '✓ Simple Interface' 
        WHEN param_count <= 5 THEN '⚠ Complex Interface'
        ELSE '✗ Very Complex Interface' 
    END as interface_complexity,
    
    CASE 
        WHEN reasonable_size = 1 THEN '✓ Reasonable Size' 
        ELSE '✗ Very Large Function' 
    END as size_assessment

FROM function_quality
ORDER BY quality_score DESC, schema_name, function_name;

-- 3. Function Categories and Purpose Analysis  
WITH function_categories AS (
    SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition,
        
        CASE 
            WHEN p.proname ILIKE '%cache%' OR pg_get_functiondef(p.oid) ILIKE '%cache%' THEN 'Caching'
            WHEN p.proname ILIKE '%fetch%' OR p.proname ILIKE '%get%' THEN 'Data Retrieval'
            WHEN p.proname ILIKE '%insert%' OR p.proname ILIKE '%bulk%' THEN 'Data Modification'
            WHEN p.proname ILIKE '%check%' OR p.proname ILIKE '%validate%' THEN 'Validation'
            WHEN p.proname ILIKE '%refresh%' OR p.proname ILIKE '%update%' THEN 'Maintenance'
            WHEN p.proname ILIKE '%partition%' OR p.proname ILIKE '%secure%' THEN 'Infrastructure'
            WHEN p.proname ILIKE '%news%' OR p.proname ILIKE '%market%' THEN 'Business Logic'
            WHEN p.proname ILIKE '%optimization%' OR p.proname ILIKE '%performance%' THEN 'Performance'
            WHEN p.proname ILIKE '%monitor%' OR p.proname ILIKE '%stats%' THEN 'Monitoring'
            ELSE 'Other'
        END as category,
        
        CASE 
            WHEN pg_get_functiondef(p.oid) ILIKE '%http%' OR pg_get_functiondef(p.oid) ILIKE '%api%' THEN 'External API'
            WHEN pg_get_functiondef(p.oid) ILIKE '%jsonb%' OR pg_get_functiondef(p.oid) ILIKE '%json%' THEN 'JSON Processing'
            WHEN pg_get_functiondef(p.oid) ILIKE '%trigger%' THEN 'Trigger Function'
            WHEN format_type(p.prorettype, NULL) = 'trigger' THEN 'Trigger Function'
            WHEN p.proretset = true THEN 'Set Returning'
            ELSE 'Standard Function'
        END as function_type,
        
        format_type(p.prorettype, NULL) as return_type,
        p.pronargs as param_count

    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'app_data')
    AND p.prokind = 'f'
)
SELECT 
    category,
    function_type,
    COUNT(*) as function_count,
    AVG(param_count) as avg_parameters,
    string_agg(function_name, ', ' ORDER BY function_name) as functions
FROM function_categories
GROUP BY category, function_type
ORDER BY function_count DESC, category;

-- 4. Performance and Usage Recommendations
WITH function_recommendations AS (
    SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition,
        p.provolatile,
        p.prosecdef,
        p.pronargs,
        LENGTH(pg_get_functiondef(p.oid)) as code_length,
        
        -- Generate recommendations
        ARRAY[
            CASE WHEN obj_description(p.oid, 'pg_proc') IS NULL 
                 THEN 'Add function documentation describing purpose, parameters, and return value'
                 ELSE NULL END,
                 
            CASE WHEN pg_get_functiondef(p.oid) NOT ILIKE '%EXCEPTION%' 
                 AND pg_get_functiondef(p.oid) ILIKE '%INSERT%|%UPDATE%|%DELETE%'
                 THEN 'Add error handling for data modification operations'
                 ELSE NULL END,
                 
            CASE WHEN LENGTH(pg_get_functiondef(p.oid)) > 2000
                 THEN 'Consider breaking down this large function into smaller, focused functions'
                 ELSE NULL END,
                 
            CASE WHEN p.pronargs > 5
                 THEN 'Consider using a record/JSON parameter instead of many individual parameters'
                 ELSE NULL END,
                 
            CASE WHEN p.prosecdef = true AND p.proconfig IS NULL
                 THEN 'SECURITY DEFINER function should set search_path for security'
                 ELSE NULL END,
                 
            CASE WHEN pg_get_functiondef(p.oid) ILIKE '%SELECT \* FROM%'
                 THEN 'Avoid SELECT * - specify column names explicitly'
                 ELSE NULL END,
                 
            CASE WHEN p.provolatile = 'v' AND pg_get_functiondef(p.oid) NOT ILIKE '%NOW()%' 
                 AND pg_get_functiondef(p.oid) NOT ILIKE '%INSERT%|%UPDATE%|%DELETE%'
                 THEN 'Consider if this function could be STABLE or IMMUTABLE for better performance'
                 ELSE NULL END
        ] as recommendations

    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'app_data')
    AND p.prokind = 'f'
)
SELECT 
    schema_name,
    function_name,
    array_to_string(
        ARRAY(SELECT unnest(recommendations) WHERE unnest IS NOT NULL), 
        E'\n• '
    ) as improvement_recommendations,
    
    CASE 
        WHEN array_length(ARRAY(SELECT unnest(recommendations) WHERE unnest IS NOT NULL), 1) = 0 
        THEN 'Well designed function ✓'
        WHEN array_length(ARRAY(SELECT unnest(recommendations) WHERE unnest IS NOT NULL), 1) <= 2 
        THEN 'Minor improvements needed'
        ELSE 'Significant improvements recommended'
    END as overall_assessment

FROM function_recommendations
WHERE array_length(ARRAY(SELECT unnest(recommendations) WHERE unnest IS NOT NULL), 1) > 0
ORDER BY array_length(ARRAY(SELECT unnest(recommendations) WHERE unnest IS NOT NULL), 1) DESC;

-- 5. Summary Report
SELECT 
    'Database Function Health Report' as report_section,
    '' as details
    
UNION ALL

SELECT 
    'Total Functions',
    COUNT(*)::text
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data') AND p.prokind = 'f'

UNION ALL

SELECT 
    'Functions with Documentation',
    COUNT(*)::text || ' (' || ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM pg_proc p2 JOIN pg_namespace n2 ON p2.pronamespace = n2.oid WHERE n2.nspname IN ('public', 'app_data') AND p2.prokind = 'f') * 100, 1) || '%)'
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data') AND p.prokind = 'f'
AND obj_description(p.oid, 'pg_proc') IS NOT NULL

UNION ALL

SELECT 
    'SECURITY DEFINER Functions',
    COUNT(*)::text
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data') AND p.prokind = 'f'
AND p.prosecdef = true

UNION ALL

SELECT 
    'Functions > 1KB Code',
    COUNT(*)::text
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data') AND p.prokind = 'f'
AND LENGTH(pg_get_functiondef(p.oid)) > 1000;