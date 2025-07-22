-- Check Function Security Status
-- Identify any remaining SECURITY DEFINER functions and search path issues

-- 1. Check all functions for SECURITY DEFINER
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    CASE p.prosecdef 
        WHEN true THEN 'SECURITY DEFINER' 
        ELSE 'SECURITY INVOKER' 
    END as security_type,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.proconfig IS NOT NULL THEN 
            array_to_string(p.proconfig, ', ')
        ELSE 'No SET clauses'
    END as set_clauses,
    CASE 
        WHEN p.proconfig IS NOT NULL AND 'search_path=' = ANY(
            SELECT unnest(p.proconfig) LIKE 'search_path=%'
        ) THEN 'HAS search_path'
        WHEN p.prosecdef = true THEN 'NEEDS search_path'
        ELSE 'OK'
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data')
ORDER BY 
    CASE p.prosecdef WHEN true THEN 1 ELSE 2 END,
    n.nspname, 
    p.proname;

-- 2. Count functions by security type
SELECT 
    CASE prosecdef 
        WHEN true THEN 'SECURITY DEFINER' 
        ELSE 'SECURITY INVOKER' 
    END as security_type,
    COUNT(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data')
GROUP BY prosecdef
ORDER BY prosecdef DESC;

-- 3. Check for functions without proper search_path (security risk)
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    'SECURITY DEFINER without search_path' as issue,
    'High' as severity
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data')
AND p.prosecdef = true  -- SECURITY DEFINER
AND (
    p.proconfig IS NULL 
    OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS config 
        WHERE config LIKE 'search_path=%'
    )
)
ORDER BY n.nspname, p.proname;

-- 4. Functions summary for dashboard comparison
SELECT 
    'Total Functions' as metric,
    COUNT(*)::text as value
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data')

UNION ALL

SELECT 
    'SECURITY DEFINER Functions' as metric,
    COUNT(*)::text as value
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data')
AND p.prosecdef = true

UNION ALL

SELECT 
    'SECURITY INVOKER Functions' as metric,
    COUNT(*)::text as value
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data')
AND p.prosecdef = false

UNION ALL

SELECT 
    'Functions with search_path' as metric,
    COUNT(*)::text as value
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'app_data')
AND p.proconfig IS NOT NULL 
AND EXISTS (
    SELECT 1 FROM unnest(p.proconfig) AS config 
    WHERE config LIKE 'search_path=%'
);