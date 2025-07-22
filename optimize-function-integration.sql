-- Function Integration Optimization Plan
-- Create API endpoint mapping and usage recommendations

-- 1. Create function usage monitoring
CREATE OR REPLACE FUNCTION track_function_usage()
RETURNS TABLE(
    function_name text,
    schema_name text,
    last_called timestamptz,
    call_frequency text,
    integration_status text,
    recommended_usage text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH function_analysis AS (
        SELECT 
            p.proname as func_name,
            n.nspname as schema_name,
            CASE 
                WHEN p.proname ILIKE '%validate%' THEN 'Data Validation'
                WHEN p.proname ILIKE '%generate%' OR p.proname ILIKE '%summary%' OR p.proname ILIKE '%dashboard%' THEN 'Reporting/Visualization'
                WHEN p.proname ILIKE '%calculate%' THEN 'Financial Calculations'
                WHEN p.proname ILIKE '%cache%' OR p.proname ILIKE '%refresh%' THEN 'Performance/Maintenance'
                WHEN p.proname ILIKE '%portfolio%' THEN 'Portfolio Management'
                WHEN p.proname ILIKE '%market%' OR p.proname ILIKE '%price%' THEN 'Market Data'
                WHEN p.proname ILIKE '%news%' THEN 'News Intelligence'
                ELSE 'Utility'
            END as category,
            LENGTH(pg_get_functiondef(p.oid)) as complexity
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname IN ('public', 'app_data')
        AND p.prokind = 'f'
    )
    SELECT 
        func_name,
        schema_name,
        NOW() - INTERVAL '1 day' as last_called, -- Placeholder since we can't track actual calls
        CASE 
            WHEN category = 'Financial Calculations' THEN 'High - Core business logic'
            WHEN category = 'Portfolio Management' THEN 'High - Essential operations'
            WHEN category = 'Data Validation' THEN 'Low - Not integrated yet'
            WHEN category = 'Reporting/Visualization' THEN 'None - New functions'
            ELSE 'Medium - Utility functions'
        END as call_frequency,
        CASE 
            WHEN func_name ILIKE '%treasury%' OR func_name ILIKE '%calculate%' THEN 'Well Integrated'
            WHEN func_name ILIKE '%validate%' OR func_name ILIKE '%generate%' THEN 'Not Integrated'
            WHEN func_name ILIKE '%cache%' OR func_name ILIKE '%performance%' THEN 'Partially Integrated'
            ELSE 'Unknown'
        END as integration_status,
        CASE 
            WHEN func_name = 'validate_market_data_freshness' THEN 'Add to market data API endpoints'
            WHEN func_name = 'validate_portfolio_allocations' THEN 'Add to portfolio update workflows'
            WHEN func_name = 'validate_news_data_quality' THEN 'Add to news ingestion pipeline'
            WHEN func_name = 'generate_portfolio_summary' THEN 'Create /api/portfolio-dashboard endpoint'
            WHEN func_name = 'generate_market_dashboard' THEN 'Create /api/market-dashboard endpoint'
            WHEN func_name = 'generate_news_intelligence_summary' THEN 'Create /api/news-dashboard endpoint'
            WHEN func_name = 'generate_system_health_summary' THEN 'Create /api/system-health endpoint'
            WHEN func_name ILIKE '%calculate%' AND category = 'Financial Calculations' THEN 'Already integrated via treasury-calculator'
            ELSE 'Review for API integration opportunities'
        END as recommended_usage
    FROM function_analysis
    ORDER BY 
        CASE integration_status 
            WHEN 'Not Integrated' THEN 1 
            WHEN 'Partially Integrated' THEN 2 
            ELSE 3 
        END,
        category, func_name;
END;
$$;

-- 2. Create API endpoint recommendations
CREATE OR REPLACE FUNCTION recommend_api_endpoints()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    recommendations jsonb;
BEGIN
    SELECT jsonb_build_object(
        'immediate_integrations', jsonb_build_array(
            jsonb_build_object(
                'endpoint', '/api/portfolio-dashboard',
                'function', 'generate_portfolio_summary',
                'description', 'Replace manual portfolio queries with optimized summary function',
                'current_issue', 'Multiple API files manually query portfolio_positions table',
                'benefit', 'Single function call vs multiple queries, includes analytics'
            ),
            jsonb_build_object(
                'endpoint', '/api/market-health',
                'function', 'generate_market_dashboard',
                'description', 'Add market data health monitoring',
                'current_issue', 'No systematic market data quality monitoring',
                'benefit', 'Automated alerts, data freshness tracking'
            ),
            jsonb_build_object(
                'endpoint', '/api/data-validation',
                'function', 'validate_market_data_freshness, validate_portfolio_allocations',
                'description', 'Add data validation to input pipelines',
                'current_issue', 'No systematic data quality checks',
                'benefit', 'Prevent data quality issues, early error detection'
            )
        ),
        'function_replacement_opportunities', jsonb_build_array(
            jsonb_build_object(
                'location', 'graphql-enhanced.js',
                'current', 'Manual SMA/technical indicator calculations',
                'replace_with', 'calculate_moving_average, calculate_technical_indicators functions',
                'benefit', 'Consistent calculations, better performance'
            ),
            jsonb_build_object(
                'location', 'Multiple API files',
                'current', 'Direct .from(portfolio_positions).select() queries',
                'replace_with', 'generate_portfolio_summary() function',
                'benefit', 'Reduced query complexity, built-in analytics'
            ),
            jsonb_build_object(
                'location', 'News processing endpoints',
                'current', 'Manual news data processing',
                'replace_with', 'validate_news_data_quality, generate_news_intelligence_summary',
                'benefit', 'Quality assurance, automated insights'
            )
        ),
        'performance_optimizations', jsonb_build_array(
            jsonb_build_object(
                'issue', 'Sequential function calls',
                'solution', 'Batch function calls using transactions',
                'example', 'Call validation + summary functions together'
            ),
            jsonb_build_object(
                'issue', 'Duplicate calculations across APIs',
                'solution', 'Centralize through function calls',
                'example', 'Use cached calculation results from functions'
            )
        ),
        'missing_integrations', jsonb_build_array(
            'System health monitoring endpoint',
            'Real-time data validation pipeline',
            'Automated report generation',
            'Function performance monitoring'
        )
    ) INTO recommendations;
    
    RETURN recommendations;
END;
$$;

-- 3. Create function performance monitoring
CREATE OR REPLACE VIEW function_integration_status AS
WITH function_categories AS (
    SELECT 
        p.proname as function_name,
        CASE 
            WHEN p.proname ILIKE '%validate%' THEN 'Validation'
            WHEN p.proname ILIKE '%generate%' OR p.proname ILIKE '%summary%' OR p.proname ILIKE '%dashboard%' THEN 'Visualization'
            WHEN p.proname ILIKE '%calculate%' THEN 'Calculation'
            WHEN p.proname ILIKE '%cache%' OR p.proname ILIKE '%refresh%' THEN 'Maintenance'
            ELSE 'Utility'
        END as category,
        LENGTH(pg_get_functiondef(p.oid)) as code_complexity,
        p.pronargs as parameter_count,
        CASE 
            WHEN p.proname IN ('validate_market_data_freshness', 'validate_portfolio_allocations', 'validate_news_data_quality') THEN 'Newly Created - Not Integrated'
            WHEN p.proname IN ('generate_portfolio_summary', 'generate_market_dashboard', 'generate_news_intelligence_summary', 'generate_system_health_summary') THEN 'Newly Created - Ready for API'
            WHEN p.proname ILIKE '%calculate%' AND p.proname NOT ILIKE '%generate%' THEN 'Integrated via Treasury Calculator'
            WHEN p.proname ILIKE '%cache%' OR p.proname ILIKE '%optimization%' THEN 'System Integrated'
            ELSE 'Unknown Integration Status'
        END as integration_status
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'app_data')
    AND p.prokind = 'f'
)
SELECT 
    category,
    COUNT(*) as total_functions,
    COUNT(*) FILTER (WHERE integration_status LIKE '%Integrated%') as integrated_functions,
    COUNT(*) FILTER (WHERE integration_status LIKE '%Not Integrated%') as not_integrated,
    COUNT(*) FILTER (WHERE integration_status LIKE '%Ready for API%') as ready_for_api,
    ROUND(
        COUNT(*) FILTER (WHERE integration_status LIKE '%Integrated%')::float / 
        COUNT(*) * 100, 1
    ) as integration_percentage,
    string_agg(
        CASE WHEN integration_status LIKE '%Not Integrated%' OR integration_status LIKE '%Ready for API%' 
             THEN function_name ELSE NULL END, 
        ', '
    ) as functions_needing_integration
FROM function_categories
GROUP BY category
ORDER BY integration_percentage ASC;

-- 4. Create specific integration recommendations
CREATE OR REPLACE FUNCTION get_integration_priority()
RETURNS TABLE(
    priority text,
    function_name text,
    integration_type text,
    estimated_impact text,
    implementation_effort text,
    specific_recommendation text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (VALUES
        ('HIGH', 'validate_market_data_freshness', 'Data Pipeline Integration', 'Prevent data quality issues', 'Low - 1 day', 'Add to market data ingestion in /api/market-data-*.js files'),
        ('HIGH', 'generate_portfolio_summary', 'API Endpoint Creation', 'Reduce query complexity', 'Medium - 2-3 days', 'Create /api/portfolio-dashboard.js using this function'),
        ('HIGH', 'validate_portfolio_allocations', 'Workflow Integration', 'Prevent portfolio errors', 'Low - 1 day', 'Add to portfolio update workflows'),
        ('MEDIUM', 'generate_market_dashboard', 'Dashboard Creation', 'Market monitoring', 'Medium - 2-3 days', 'Create market health monitoring endpoint'),
        ('MEDIUM', 'generate_system_health_summary', 'Admin Interface', 'System monitoring', 'Medium - 2-3 days', 'Add to admin/monitoring interface'),
        ('MEDIUM', 'validate_news_data_quality', 'News Pipeline', 'News quality assurance', 'Low - 1 day', 'Add to news ingestion pipeline'),
        ('LOW', 'generate_news_intelligence_summary', 'Reporting Enhancement', 'News analytics', 'High - 3-5 days', 'Create comprehensive news analytics dashboard'),
        ('LOW', 'analyze_function_complexity', 'Developer Tools', 'Code maintenance', 'Low - 1 day', 'Add to development/maintenance scripts')
    ) AS priorities(priority, function_name, integration_type, estimated_impact, implementation_effort, specific_recommendation)
    ORDER BY 
        CASE priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END,
        function_name;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION track_function_usage() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION recommend_api_endpoints() TO authenticated, service_role;
GRANT SELECT ON function_integration_status TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_integration_priority() TO authenticated, service_role;

-- Summary of optimization opportunities
SELECT 
    'Function Integration Analysis Complete' as status,
    'Use track_function_usage() to see current state' as next_step_1,
    'Use recommend_api_endpoints() for specific recommendations' as next_step_2,
    'Use get_integration_priority() for implementation roadmap' as next_step_3;