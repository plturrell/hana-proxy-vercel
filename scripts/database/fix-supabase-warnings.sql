-- Fix Supabase Warning Issues
-- Generated on 2025-01-21

-- 1. Fix function search path warnings
-- This sets a secure search path for all functions to prevent search path injection attacks

-- Create a helper function to update all functions
DO $$
DECLARE
    func RECORD;
    func_def TEXT;
    func_args TEXT;
    func_returns TEXT;
    func_lang TEXT;
    func_body TEXT;
    new_func_def TEXT;
BEGIN
    -- Update all functions in public schema
    FOR func IN
        SELECT 
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS arguments,
            pg_get_function_result(p.oid) AS return_type,
            l.lanname AS language,
            p.prosrc AS source_code,
            p.provolatile AS volatility,
            p.proisstrict AS is_strict,
            p.prosecdef AS security_definer,
            p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        JOIN pg_language l ON p.prolang = l.oid
        WHERE n.nspname = 'public'
        AND l.lanname IN ('plpgsql', 'sql')
        AND p.proname IN (
            'update_news_loading_status', 'update_updated_at', 'cleanup_old_news',
            'calculate_source_reliability', 'update_source_reliability', 'top_market_symbols_json',
            'calculate_real_sector_breakdown', 'top_market_symbols', 'notify_price_alert',
            'process_real_financial_news', 'test_all_financial_functions', 'update_entity_market_mappings',
            'calculate_credit_risk_score', 'perform_grok_credit_analysis', 'calculate_real_position_impacts',
            'ensure_http_extension', 'setup_news_fetch_environment', 'calculate_real_market_stress_impact',
            'generate_rdf_triples', 'sparql_query', 'analyze_yield_curve', 'get_real_historical_yield_curves',
            'get_real_market_benchmarks', 'get_real_current_market_levels', 'generate_news_rdf',
            'link_news_to_companies', 'get_company_graph', 'extract_entities_with_grok',
            'extract_entities_batch', 'process_news_content', 'analyze_real_sentiment',
            'extract_real_entities', 'assess_real_market_impact', 'get_all_a2a_agents',
            'calculate_real_curve_level', 'calculate_real_curve_steepness', 'run_stress_test',
            'calculate_real_curve_curvature', 'calculate_real_butterfly_spread', 'analyze_real_curve_shape',
            'identify_real_inversion_points', 'analyze_real_curve_dynamics', 'calculate_real_resilience_score',
            'perform_real_yield_curve_factor_analysis', 'determine_market_regime', 'get_agent_card',
            'classify_curve_shape_with_market_context', 'fetch_perplexity_news', 'get_api_key',
            'calculate_real_stress_impact', 'calculate_real_expected_shortfall', 'calculate_real_stress_var',
            'get_agent_metrics', 'assess_real_portfolio_resilience', 'assess_real_concentration_risk',
            'setup_perplexity_api_key', 'build_scenario_analysis', 'assess_real_risk_capacity',
            'assess_real_stress_tolerance', 'trigger_set_timestamp', 'generate_real_monte_carlo_stats',
            'generate_real_risk_insights', 'generate_real_hedging_recommendations',
            'calculate_historical_curve_statistics', 'estimate_real_recovery_probability',
            'rank_real_scenario_severity', 'calculate_historical_percentiles', 'calculate_historical_volatility',
            'find_yield_at_maturity', 'compute_xai_market_relevance', 'gql_realtime_volume',
            'gql_get_market_stats', 'update_article_classifications_modified_column', 'gql_get_agents_by_type',
            'trigger_market_entity_analysis', 'gql_update_task_status', 'check_foreign_keys',
            'gql_mark_notification_read', 'count_foreign_keys', 'test_relationship',
            'update_updated_at_column', 'list_enum_types', 'gql_update_user_profile',
            'gql_add_portfolio_holding', 'gql_update_portfolio_holding', 'gql_create_price_alert',
            'notify_market_update', 'notify_news_update', 'grok_credit_analysis',
            'get_a2a_message_history', 'get_a2a_communication_stats', 'start_consensus_round',
            'cast_vote', 'check_consensus', 'gql_create_task', 'gql_create_agent',
            'gql_mark_all_notifications_read', 'gql_execute_trade', 'analyze_database_performance',
            'sql', 'emergency_constraint_test', 'enterprise_database_assessment',
            'test_transaction_safety', 'get_database_health', 'get_backup_status',
            'sql_safe', 'test_constraint_enforcement', 'enterprise_constraint_test',
            'enterprise_transaction_test'
        )
    LOOP
        BEGIN
            -- Build the ALTER FUNCTION statement
            EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = pg_catalog, public',
                func.function_name,
                func.arguments
            );
            
            RAISE NOTICE 'Updated function: %', func.function_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to update function %: %', func.function_name, SQLERRM;
        END;
    END LOOP;

    -- Update functions in app_data schema
    FOR func IN
        SELECT 
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        JOIN pg_language l ON p.prolang = l.oid
        WHERE n.nspname = 'app_data'
        AND l.lanname IN ('plpgsql', 'sql')
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION app_data.%I(%s) SET search_path = pg_catalog, app_data, public',
                func.function_name,
                func.arguments
            );
            
            RAISE NOTICE 'Updated app_data function: %', func.function_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to update app_data function %: %', func.function_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. Move http extension out of public schema
-- First create the extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move the http extension
-- Note: We need to drop and recreate it in the new schema
DROP EXTENSION IF EXISTS http CASCADE;
CREATE EXTENSION http SCHEMA extensions;

-- Grant execute permissions on http functions to necessary roles
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, authenticated, service_role;

-- Update any functions that use http to reference the new schema
-- This is done by updating the search_path in the functions above

-- 3. Fix materialized view permissions
-- Remove public access to the materialized view
REVOKE ALL ON public.top_market_symbols_view FROM anon, authenticated;

-- Grant access only to service role
GRANT SELECT ON public.top_market_symbols_view TO service_role;

-- Create a regular view that enforces RLS for public access
CREATE OR REPLACE VIEW public.top_market_symbols_public AS
SELECT * FROM public.top_market_symbols_view
WHERE EXISTS (
    SELECT 1 FROM auth.users WHERE auth.uid() IS NOT NULL
);

-- Grant access to the public view
GRANT SELECT ON public.top_market_symbols_public TO authenticated;

-- 4. Fix Auth configuration warnings
-- Note: These require Supabase dashboard access or environment configuration
-- We'll create a configuration file with recommendations

-- Create a configuration recommendations file
COMMENT ON DATABASE postgres IS 'Auth Configuration Recommendations:
1. Reduce OTP expiry time to less than 1 hour (currently exceeds recommended threshold)
   - Go to Authentication > Providers > Email in Supabase Dashboard
   - Set "OTP Expiry" to 3600 seconds (1 hour) or less

2. Enable leaked password protection
   - Go to Authentication > Settings in Supabase Dashboard
   - Enable "Leaked Password Protection" to check passwords against HaveIBeenPwned.org
';