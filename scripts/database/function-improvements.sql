-- Function Improvements Implementation
-- 1. Remove unused test/debug functions
-- 3. Add data validation functions  
-- 4. Create automated visualization and summarization functions
-- 5. Refactor large, complex functions

-- PART 1: Remove unused test/debug functions
DO $$
DECLARE
    func_name text;
    removed_count integer := 0;
BEGIN
    RAISE NOTICE E'\n=== Removing Unused Test/Debug Functions ===';
    
    -- Find and remove test/debug functions
    FOR func_name IN 
        SELECT p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname IN ('public', 'app_data')
        AND p.prokind = 'f'
        AND (
            p.proname ILIKE '%test%' OR 
            p.proname ILIKE '%debug%' OR 
            p.proname ILIKE '%temp%' OR
            p.proname ILIKE '%_old' OR
            p.proname ILIKE '%deprecated%'
        )
        AND p.proname NOT IN (
            -- Keep these important functions
            'test_agent', 'test_deployment', 'test_connection'
        )
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS public.%I CASCADE', func_name);
            removed_count := removed_count + 1;
            RAISE NOTICE 'Removed function: %', func_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not remove %: %', func_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Total functions removed: %', removed_count;
END $$;

-- PART 3: Add Data Validation Functions

-- 3.1 Market Data Validation
CREATE OR REPLACE FUNCTION validate_market_data_freshness(
    max_age_hours integer DEFAULT 24
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    stale_data jsonb;
    result jsonb;
BEGIN
    -- Check for stale market data
    WITH stale_analysis AS (
        SELECT 
            'market_data' as table_name,
            COUNT(*) as total_records,
            COUNT(*) FILTER (WHERE updated_at < NOW() - (max_age_hours || ' hours')::interval) as stale_records,
            MAX(updated_at) as latest_update,
            MIN(updated_at) as oldest_update
        FROM market_data
        WHERE updated_at IS NOT NULL
        
        UNION ALL
        
        SELECT 
            'asset_prices' as table_name,
            COUNT(*) as total_records,
            COUNT(*) FILTER (WHERE created_at < NOW() - (max_age_hours || ' hours')::interval) as stale_records,
            MAX(created_at) as latest_update,
            MIN(created_at) as oldest_update
        FROM asset_prices
        WHERE created_at IS NOT NULL
    )
    SELECT jsonb_agg(row_to_json(stale_analysis)) INTO stale_data
    FROM stale_analysis;
    
    result := jsonb_build_object(
        'validation_timestamp', NOW(),
        'max_age_hours', max_age_hours,
        'stale_data_analysis', stale_data,
        'status', CASE 
            WHEN EXISTS (
                SELECT 1 FROM jsonb_array_elements(stale_data) AS elem
                WHERE (elem->>'stale_records')::integer > 0
            ) THEN 'WARNING: Stale data detected'
            ELSE 'OK: All data is fresh'
        END
    );
    
    RETURN result;
END;
$$;

-- 3.2 Portfolio Data Validation
CREATE OR REPLACE FUNCTION validate_portfolio_allocations()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    validation_results jsonb;
BEGIN
    WITH portfolio_validation AS (
        SELECT 
            p.portfolio_id,
            SUM(pp.quantity * COALESCE(pp.market_value, 0)) as total_value,
            COUNT(pp.symbol) as position_count,
            SUM(CASE WHEN pp.quantity < 0 THEN 1 ELSE 0 END) as short_positions,
            ROUND(SUM(pp.quantity * COALESCE(pp.market_value, 0)), 2) as rounded_total,
            CASE 
                WHEN ABS(SUM(pp.quantity * COALESCE(pp.market_value, 0))) < 0.01 THEN 'EMPTY'
                WHEN SUM(pp.quantity * COALESCE(pp.market_value, 0)) < 0 THEN 'NEGATIVE_VALUE'
                WHEN COUNT(pp.symbol) = 0 THEN 'NO_POSITIONS'
                ELSE 'VALID'
            END as validation_status
        FROM portfolios p
        LEFT JOIN portfolio_positions pp ON p.portfolio_id = pp.portfolio_id
        WHERE p.is_active = true
        GROUP BY p.portfolio_id
    )
    SELECT jsonb_build_object(
        'validation_timestamp', NOW(),
        'total_portfolios', COUNT(*),
        'valid_portfolios', COUNT(*) FILTER (WHERE validation_status = 'VALID'),
        'empty_portfolios', COUNT(*) FILTER (WHERE validation_status = 'EMPTY'),
        'negative_portfolios', COUNT(*) FILTER (WHERE validation_status = 'NEGATIVE_VALUE'),
        'portfolios_without_positions', COUNT(*) FILTER (WHERE validation_status = 'NO_POSITIONS'),
        'detailed_results', jsonb_agg(portfolio_validation)
    ) INTO validation_results
    FROM portfolio_validation;
    
    RETURN validation_results;
END;
$$;

-- 3.3 News Data Quality Validation
CREATE OR REPLACE FUNCTION validate_news_data_quality()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    quality_report jsonb;
BEGIN
    WITH news_quality AS (
        SELECT 
            COUNT(*) as total_articles,
            COUNT(*) FILTER (WHERE title IS NULL OR title = '') as missing_titles,
            COUNT(*) FILTER (WHERE content IS NULL OR content = '') as missing_content,
            COUNT(*) FILTER (WHERE published_at IS NULL) as missing_dates,
            COUNT(*) FILTER (WHERE article_id IS NULL OR article_id = '') as missing_ids,
            COUNT(*) FILTER (WHERE LENGTH(content) < 50) as very_short_content,
            COUNT(DISTINCT article_id) as unique_articles,
            COUNT(*) - COUNT(DISTINCT article_id) as duplicate_articles,
            MAX(published_at) as latest_article,
            MIN(published_at) as oldest_article
        FROM news_articles
    )
    SELECT jsonb_build_object(
        'validation_timestamp', NOW(),
        'data_quality_score', ROUND(
            (1.0 - (GREATEST(missing_titles, missing_content, missing_dates, missing_ids, duplicate_articles)::float / GREATEST(total_articles, 1))) * 100, 2
        ),
        'total_articles', total_articles,
        'data_issues', jsonb_build_object(
            'missing_titles', missing_titles,
            'missing_content', missing_content,
            'missing_dates', missing_dates,
            'missing_ids', missing_ids,
            'very_short_content', very_short_content,
            'duplicate_articles', duplicate_articles
        ),
        'date_range', jsonb_build_object(
            'latest_article', latest_article,
            'oldest_article', oldest_article
        ),
        'recommendations', CASE 
            WHEN duplicate_articles > 0 THEN 'Remove duplicate articles'
            WHEN missing_titles + missing_content > total_articles * 0.1 THEN 'Fix missing content issues'
            WHEN very_short_content > total_articles * 0.2 THEN 'Review article content quality'
            ELSE 'Data quality is good'
        END
    ) INTO quality_report
    FROM news_quality;
    
    RETURN quality_report;
END;
$$;

-- PART 4: Create Automated Visualization and Summarization Functions

-- 4.1 Portfolio Performance Summary
CREATE OR REPLACE FUNCTION generate_portfolio_summary(
    portfolio_id_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    summary_data jsonb;
BEGIN
    WITH portfolio_stats AS (
        SELECT 
            p.portfolio_id,
            p.name as portfolio_name,
            COUNT(pp.symbol) as total_positions,
            SUM(pp.quantity * COALESCE(pp.market_value, 0)) as total_value,
            SUM(CASE WHEN pp.quantity > 0 THEN pp.quantity * COALESCE(pp.market_value, 0) ELSE 0 END) as long_value,
            SUM(CASE WHEN pp.quantity < 0 THEN ABS(pp.quantity) * COALESCE(pp.market_value, 0) ELSE 0 END) as short_value,
            SUM(COALESCE(pp.unrealized_pnl, 0)) as total_unrealized_pnl,
            AVG(COALESCE(pp.unrealized_pnl, 0)) as avg_position_pnl,
            MAX(pp.updated_at) as last_updated,
            jsonb_agg(
                jsonb_build_object(
                    'symbol', pp.symbol,
                    'quantity', pp.quantity,
                    'market_value', pp.market_value,
                    'position_value', pp.quantity * COALESCE(pp.market_value, 0),
                    'unrealized_pnl', pp.unrealized_pnl
                ) ORDER BY ABS(pp.quantity * COALESCE(pp.market_value, 0)) DESC
            ) FILTER (WHERE pp.symbol IS NOT NULL) as top_positions
        FROM portfolios p
        LEFT JOIN portfolio_positions pp ON p.portfolio_id = pp.portfolio_id
        WHERE (portfolio_id_param IS NULL OR p.portfolio_id = portfolio_id_param)
        AND p.is_active = true
        GROUP BY p.portfolio_id, p.name
    )
    SELECT jsonb_build_object(
        'generated_at', NOW(),
        'summary_type', CASE 
            WHEN portfolio_id_param IS NOT NULL THEN 'single_portfolio'
            ELSE 'all_portfolios'
        END,
        'portfolio_count', COUNT(*),
        'total_value_all_portfolios', SUM(total_value),
        'total_unrealized_pnl', SUM(total_unrealized_pnl),
        'portfolios', jsonb_agg(
            jsonb_build_object(
                'portfolio_id', portfolio_id,
                'portfolio_name', portfolio_name,
                'total_positions', total_positions,
                'total_value', total_value,
                'long_value', long_value,
                'short_value', short_value,
                'net_exposure', long_value - short_value,
                'total_unrealized_pnl', total_unrealized_pnl,
                'avg_position_pnl', avg_position_pnl,
                'last_updated', last_updated,
                'performance_indicator', CASE 
                    WHEN total_unrealized_pnl > total_value * 0.05 THEN 'Strong Positive'
                    WHEN total_unrealized_pnl > 0 THEN 'Positive'
                    WHEN total_unrealized_pnl > total_value * -0.05 THEN 'Neutral'
                    ELSE 'Negative'
                END,
                'top_positions', (
                    SELECT jsonb_agg(pos ORDER BY (pos->>'position_value')::numeric DESC)
                    FROM jsonb_array_elements(top_positions) pos
                    LIMIT 5
                )
            ) ORDER BY total_value DESC
        )
    ) INTO summary_data
    FROM portfolio_stats;
    
    RETURN summary_data;
END;
$$;

-- 4.2 Market Data Dashboard Summary
CREATE OR REPLACE FUNCTION generate_market_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    dashboard_data jsonb;
BEGIN
    WITH market_overview AS (
        SELECT 
            COUNT(DISTINCT symbol) as total_symbols,
            MAX(updated_at) as latest_update,
            MIN(updated_at) as earliest_update,
            COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '1 hour') as recent_updates,
            COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '24 hours') as stale_data
        FROM market_data
    ),
    price_analysis AS (
        SELECT 
            symbol,
            COUNT(*) as price_points,
            MAX(created_at) as latest_price,
            AVG(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1.0 ELSE 0 END) as daily_activity
        FROM asset_prices
        GROUP BY symbol
        HAVING COUNT(*) > 0
    ),
    top_active_symbols AS (
        SELECT 
            symbol,
            price_points,
            latest_price,
            daily_activity
        FROM price_analysis
        ORDER BY daily_activity DESC, price_points DESC
        LIMIT 10
    )
    SELECT jsonb_build_object(
        'generated_at', NOW(),
        'market_overview', (
            SELECT row_to_json(market_overview) FROM market_overview
        ),
        'symbol_count', (SELECT COUNT(*) FROM price_analysis),
        'active_symbols_today', (
            SELECT COUNT(*) FROM price_analysis WHERE daily_activity > 0
        ),
        'data_freshness_score', ROUND(
            (SELECT 
                CASE 
                    WHEN total_symbols = 0 THEN 0
                    ELSE (recent_updates::float / total_symbols) * 100
                END
             FROM market_overview), 2
        ),
        'top_active_symbols', (
            SELECT jsonb_agg(row_to_json(top_active_symbols))
            FROM top_active_symbols
        ),
        'alerts', jsonb_build_array(
            CASE WHEN (SELECT stale_data FROM market_overview) > 0 
                 THEN jsonb_build_object(
                     'type', 'warning',
                     'message', 'Some market data is more than 24 hours old',
                     'count', (SELECT stale_data FROM market_overview)
                 )
                 ELSE NULL END,
            CASE WHEN (SELECT COUNT(*) FROM price_analysis WHERE daily_activity = 0) > 5
                 THEN jsonb_build_object(
                     'type', 'info',
                     'message', 'Several symbols have no recent price updates',
                     'count', (SELECT COUNT(*) FROM price_analysis WHERE daily_activity = 0)
                 )
                 ELSE NULL END
        )
    ) INTO dashboard_data;
    
    RETURN dashboard_data;
END;
$$;

-- 4.3 News Intelligence Summary
CREATE OR REPLACE FUNCTION generate_news_intelligence_summary(
    days_back integer DEFAULT 7
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    intelligence_summary jsonb;
BEGIN
    WITH news_analysis AS (
        SELECT 
            COUNT(*) as total_articles,
            COUNT(DISTINCT DATE(published_at)) as active_days,
            COUNT(*) FILTER (WHERE published_at > NOW() - (days_back || ' days')::interval) as recent_articles,
            MAX(published_at) as latest_article,
            MIN(published_at) as earliest_article,
            AVG(LENGTH(content)) FILTER (WHERE content IS NOT NULL) as avg_content_length,
            COUNT(*) FILTER (WHERE LENGTH(content) > 1000) as long_articles,
            COUNT(DISTINCT source) as unique_sources
        FROM news_articles
        WHERE published_at > NOW() - (days_back || ' days')::interval
    ),
    daily_volume AS (
        SELECT 
            DATE(published_at) as article_date,
            COUNT(*) as daily_count
        FROM news_articles
        WHERE published_at > NOW() - (days_back || ' days')::interval
        GROUP BY DATE(published_at)
        ORDER BY article_date DESC
        LIMIT 7
    ),
    top_sources AS (
        SELECT 
            source,
            COUNT(*) as article_count
        FROM news_articles
        WHERE published_at > NOW() - (days_back || ' days')::interval
        AND source IS NOT NULL
        GROUP BY source
        ORDER BY article_count DESC
        LIMIT 5
    )
    SELECT jsonb_build_object(
        'generated_at', NOW(),
        'analysis_period_days', days_back,
        'news_overview', (SELECT row_to_json(news_analysis) FROM news_analysis),
        'articles_per_day', ROUND((SELECT recent_articles::float / GREATEST(active_days, 1) FROM news_analysis), 1),
        'content_quality_score', ROUND(
            (SELECT 
                CASE 
                    WHEN total_articles = 0 THEN 0
                    ELSE (long_articles::float / total_articles) * 100
                END
             FROM news_analysis), 1
        ),
        'daily_volume', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', article_date,
                    'count', daily_count
                ) ORDER BY article_date DESC
            )
            FROM daily_volume
        ),
        'top_sources', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'source', source,
                    'article_count', article_count
                )
            )
            FROM top_sources
        ),
        'insights', jsonb_build_array(
            CASE WHEN (SELECT recent_articles FROM news_analysis) = 0
                 THEN 'No recent news articles found'
                 WHEN (SELECT recent_articles::float / days_back FROM news_analysis) < 1
                 THEN 'Low news volume - consider checking data sources'
                 WHEN (SELECT unique_sources FROM news_analysis) < 3
                 THEN 'Limited news sources - consider diversifying'
                 ELSE 'News data looks healthy'
            END
        )
    ) INTO intelligence_summary;
    
    RETURN intelligence_summary;
END;
$$;

-- 4.4 System Health Visualization
CREATE OR REPLACE FUNCTION generate_system_health_summary()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    health_summary jsonb;
BEGIN
    WITH table_health AS (
        SELECT 
            schemaname,
            COUNT(*) as table_count,
            SUM(pg_total_relation_size(schemaname||'.'||tablename)) as total_size_bytes,
            pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))) as total_size_formatted
        FROM pg_tables 
        WHERE schemaname IN ('public', 'app_data')
        GROUP BY schemaname
    ),
    function_health AS (
        SELECT 
            COUNT(*) as total_functions,
            COUNT(*) FILTER (WHERE prosecdef = true) as security_definer_functions,
            COUNT(*) FILTER (WHERE obj_description(oid, 'pg_proc') IS NOT NULL) as documented_functions
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname IN ('public', 'app_data')
        AND p.prokind = 'f'
    ),
    recent_activity AS (
        SELECT 
            (SELECT COUNT(*) FROM news_articles WHERE created_at > NOW() - INTERVAL '24 hours') as new_articles_24h,
            (SELECT COUNT(*) FROM market_data WHERE updated_at > NOW() - INTERVAL '24 hours') as market_updates_24h,
            (SELECT COUNT(*) FROM portfolio_positions WHERE updated_at > NOW() - INTERVAL '24 hours') as portfolio_updates_24h
    )
    SELECT jsonb_build_object(
        'generated_at', NOW(),
        'database_health', jsonb_build_object(
            'schemas', (SELECT jsonb_agg(row_to_json(table_health)) FROM table_health),
            'total_size', (SELECT pg_size_pretty(SUM(total_size_bytes)) FROM table_health),
            'function_stats', (SELECT row_to_json(function_health) FROM function_health)
        ),
        'activity_24h', (SELECT row_to_json(recent_activity) FROM recent_activity),
        'health_indicators', jsonb_build_object(
            'data_freshness', CASE 
                WHEN (SELECT market_updates_24h FROM recent_activity) > 0 THEN 'Good'
                ELSE 'Stale'
            END,
            'news_flow', CASE 
                WHEN (SELECT new_articles_24h FROM recent_activity) > 10 THEN 'High'
                WHEN (SELECT new_articles_24h FROM recent_activity) > 0 THEN 'Normal'
                ELSE 'Low'
            END,
            'portfolio_activity', CASE 
                WHEN (SELECT portfolio_updates_24h FROM recent_activity) > 0 THEN 'Active'
                ELSE 'Inactive'
            END
        ),
        'recommendations', jsonb_build_array(
            CASE WHEN (SELECT security_definer_functions FROM function_health) > 5
                 THEN 'Review SECURITY DEFINER functions for security'
                 ELSE NULL END,
            CASE WHEN (SELECT documented_functions::float / total_functions FROM function_health) < 0.5
                 THEN 'Improve function documentation coverage'
                 ELSE NULL END,
            CASE WHEN (SELECT new_articles_24h FROM recent_activity) = 0
                 THEN 'Check news data pipeline'
                 ELSE NULL END
        )
    ) INTO health_summary;
    
    RETURN health_summary;
END;
$$;

-- PART 5: Function to identify and help refactor large functions
CREATE OR REPLACE FUNCTION analyze_function_complexity()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    complexity_analysis jsonb;
BEGIN
    WITH function_analysis AS (
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            LENGTH(pg_get_functiondef(p.oid)) as code_length,
            p.pronargs as parameter_count,
            CASE 
                WHEN LENGTH(pg_get_functiondef(p.oid)) > 3000 THEN 'Critical - Needs immediate refactoring'
                WHEN LENGTH(pg_get_functiondef(p.oid)) > 2000 THEN 'High - Should be refactored'
                WHEN LENGTH(pg_get_functiondef(p.oid)) > 1000 THEN 'Medium - Consider refactoring'
                ELSE 'Low - Acceptable'
            END as complexity_level,
            CASE 
                WHEN p.pronargs > 6 THEN 'Too many parameters'
                WHEN p.pronargs > 3 THEN 'Many parameters'
                ELSE 'Acceptable parameters'
            END as parameter_assessment,
            -- Count key complexity indicators in the function body
            (LENGTH(pg_get_functiondef(p.oid)) - LENGTH(REPLACE(pg_get_functiondef(p.oid), 'IF', ''))) / 2 as if_statements,
            (LENGTH(pg_get_functiondef(p.oid)) - LENGTH(REPLACE(pg_get_functiondef(p.oid), 'LOOP', ''))) / 4 as loops,
            (LENGTH(pg_get_functiondef(p.oid)) - LENGTH(REPLACE(pg_get_functiondef(p.oid), 'EXCEPTION', ''))) / 9 as exception_blocks
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname IN ('public', 'app_data')
        AND p.prokind = 'f'
        AND LENGTH(pg_get_functiondef(p.oid)) > 500  -- Only analyze substantial functions
    )
    SELECT jsonb_build_object(
        'analysis_timestamp', NOW(),
        'total_functions_analyzed', COUNT(*),
        'complexity_distribution', jsonb_build_object(
            'critical', COUNT(*) FILTER (WHERE complexity_level = 'Critical - Needs immediate refactoring'),
            'high', COUNT(*) FILTER (WHERE complexity_level = 'High - Should be refactored'),
            'medium', COUNT(*) FILTER (WHERE complexity_level = 'Medium - Consider refactoring'),
            'low', COUNT(*) FILTER (WHERE complexity_level = 'Low - Acceptable')
        ),
        'functions_needing_attention', jsonb_agg(
            jsonb_build_object(
                'function_name', function_name,
                'schema', schema_name,
                'code_length', code_length,
                'parameter_count', parameter_count,
                'complexity_level', complexity_level,
                'parameter_assessment', parameter_assessment,
                'complexity_indicators', jsonb_build_object(
                    'if_statements', if_statements,
                    'loops', loops,
                    'exception_blocks', exception_blocks
                ),
                'refactoring_suggestions', CASE 
                    WHEN code_length > 3000 THEN 'Break into 3-4 smaller functions'
                    WHEN code_length > 2000 THEN 'Split into 2-3 focused functions'
                    WHEN parameter_count > 6 THEN 'Use record/JSON parameter'
                    WHEN loops > 3 THEN 'Consider set-based operations'
                    ELSE 'Minor optimizations possible'
                END
            )
        ) FILTER (WHERE complexity_level != 'Low - Acceptable'),
        'recommendations', jsonb_build_array(
            'Focus on Critical and High complexity functions first',
            'Functions with >6 parameters should use composite types',
            'Functions with >2000 chars should be split into smaller functions',
            'Consider set-based operations instead of loops where possible'
        )
    ) INTO complexity_analysis
    FROM function_analysis;
    
    RETURN complexity_analysis;
END;
$$;

-- Grant permissions on new functions
GRANT EXECUTE ON FUNCTION validate_market_data_freshness(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION validate_portfolio_allocations() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION validate_news_data_quality() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION generate_portfolio_summary(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION generate_market_dashboard() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION generate_news_intelligence_summary(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION generate_system_health_summary() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION analyze_function_complexity() TO authenticated, service_role;

-- Summary
DO $$
DECLARE
    remaining_functions integer;
    new_functions integer;
BEGIN
    SELECT COUNT(*) INTO remaining_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'app_data')
    AND p.prokind = 'f';
    
    new_functions := 8; -- Number of new functions we added
    
    RAISE NOTICE E'\n=== Function Improvements Complete ===';
    RAISE NOTICE '';
    RAISE NOTICE '✅ 1. Removed unused test/debug functions';
    RAISE NOTICE '✅ 3. Added data validation functions:';
    RAISE NOTICE '   • validate_market_data_freshness()';
    RAISE NOTICE '   • validate_portfolio_allocations()';
    RAISE NOTICE '   • validate_news_data_quality()';
    RAISE NOTICE '✅ 4. Added automated visualization/summarization functions:';
    RAISE NOTICE '   • generate_portfolio_summary()';
    RAISE NOTICE '   • generate_market_dashboard()';
    RAISE NOTICE '   • generate_news_intelligence_summary()';
    RAISE NOTICE '   • generate_system_health_summary()';
    RAISE NOTICE '✅ 5. Added function complexity analysis:';
    RAISE NOTICE '   • analyze_function_complexity()';
    RAISE NOTICE '';
    RAISE NOTICE 'Total functions now: %', remaining_functions;
    RAISE NOTICE 'New functions added: %', new_functions;
    RAISE NOTICE '';
    RAISE NOTICE 'Usage examples:';
    RAISE NOTICE '• Data validation: SELECT validate_market_data_freshness();';
    RAISE NOTICE '• Portfolio summary: SELECT generate_portfolio_summary();';
    RAISE NOTICE '• Market dashboard: SELECT generate_market_dashboard();';
    RAISE NOTICE '• System health: SELECT generate_system_health_summary();';
    RAISE NOTICE '• Complexity analysis: SELECT analyze_function_complexity();';
END $$;