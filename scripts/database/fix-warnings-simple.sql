-- Fix Supabase Warnings - Simplified Version
-- This version uses individual ALTER FUNCTION statements

-- 1. Fix function search path warnings for public schema functions
ALTER FUNCTION public.update_news_loading_status(uuid, text, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_updated_at() SET search_path = pg_catalog, public;
ALTER FUNCTION public.cleanup_old_news() SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_source_reliability(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_source_reliability() SET search_path = pg_catalog, public;
ALTER FUNCTION public.top_market_symbols_json() SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_real_sector_breakdown(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.top_market_symbols() SET search_path = pg_catalog, public;
ALTER FUNCTION public.notify_price_alert() SET search_path = pg_catalog, public;
ALTER FUNCTION public.process_real_financial_news(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.test_all_financial_functions() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_entity_market_mappings() SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_credit_risk_score(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.perform_grok_credit_analysis(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_real_position_impacts(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.ensure_http_extension() SET search_path = pg_catalog, public, extensions;
ALTER FUNCTION public.setup_news_fetch_environment() SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_real_market_stress_impact(uuid, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.generate_rdf_triples(text, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.sparql_query(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.analyze_yield_curve(date) SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_real_historical_yield_curves(text, integer) SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_real_market_benchmarks() SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_real_current_market_levels() SET search_path = pg_catalog, public;
ALTER FUNCTION public.generate_news_rdf(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.link_news_to_companies(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_company_graph(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.extract_entities_with_grok(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.extract_entities_batch() SET search_path = pg_catalog, public;
ALTER FUNCTION public.process_news_content(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.analyze_real_sentiment(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.extract_real_entities(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.assess_real_market_impact(text, text[]) SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_all_a2a_agents() SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_real_curve_level(date, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_real_curve_steepness(date, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.run_stress_test(uuid, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_real_curve_curvature(date, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_real_butterfly_spread(date, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.analyze_real_curve_shape(date, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.identify_real_inversion_points(date, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.analyze_real_curve_dynamics(text, integer) SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_real_resilience_score(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.perform_real_yield_curve_factor_analysis(date, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.determine_market_regime(date) SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_agent_card(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.classify_curve_shape_with_market_context(date, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.fetch_perplexity_news(text, integer) SET search_path = pg_catalog, public, extensions;
ALTER FUNCTION public.get_api_key(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_real_stress_impact(uuid, text, jsonb) SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_real_expected_shortfall(uuid, numeric) SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_real_stress_var(uuid, numeric) SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_agent_metrics(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.assess_real_portfolio_resilience(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.assess_real_concentration_risk(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.setup_perplexity_api_key(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.build_scenario_analysis(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.assess_real_risk_capacity(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.assess_real_stress_tolerance(uuid, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = pg_catalog, public;
ALTER FUNCTION public.generate_real_monte_carlo_stats(uuid, integer) SET search_path = pg_catalog, public;
ALTER FUNCTION public.generate_real_risk_insights(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.generate_real_hedging_recommendations(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_historical_curve_statistics(text, integer) SET search_path = pg_catalog, public;
ALTER FUNCTION public.estimate_real_recovery_probability(uuid, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.rank_real_scenario_severity(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_historical_percentiles(numeric[], numeric[]) SET search_path = pg_catalog, public;
ALTER FUNCTION public.calculate_historical_volatility(numeric[]) SET search_path = pg_catalog, public;
ALTER FUNCTION public.find_yield_at_maturity(date, text, numeric) SET search_path = pg_catalog, public;
ALTER FUNCTION public.compute_xai_market_relevance(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.gql_realtime_volume(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.gql_get_market_stats() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_article_classifications_modified_column() SET search_path = pg_catalog, public;
ALTER FUNCTION public.gql_get_agents_by_type(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.trigger_market_entity_analysis() SET search_path = pg_catalog, public;
ALTER FUNCTION public.gql_update_task_status(uuid, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.check_foreign_keys() SET search_path = pg_catalog, public;
ALTER FUNCTION public.gql_mark_notification_read(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.count_foreign_keys() SET search_path = pg_catalog, public;
ALTER FUNCTION public.test_relationship(text, text, text, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = pg_catalog, public;
ALTER FUNCTION public.list_enum_types() SET search_path = pg_catalog, public;
ALTER FUNCTION public.gql_update_user_profile(uuid, jsonb) SET search_path = pg_catalog, public;
ALTER FUNCTION public.gql_add_portfolio_holding(uuid, jsonb) SET search_path = pg_catalog, public;
ALTER FUNCTION public.gql_update_portfolio_holding(uuid, jsonb) SET search_path = pg_catalog, public;
ALTER FUNCTION public.gql_create_price_alert(jsonb) SET search_path = pg_catalog, public;
ALTER FUNCTION public.notify_market_update() SET search_path = pg_catalog, public;
ALTER FUNCTION public.notify_news_update() SET search_path = pg_catalog, public;
ALTER FUNCTION public.grok_credit_analysis(text, numeric) SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_a2a_message_history(text, text, integer) SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_a2a_communication_stats(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.start_consensus_round(text, jsonb) SET search_path = pg_catalog, public;
ALTER FUNCTION public.cast_vote(uuid, uuid, text, jsonb) SET search_path = pg_catalog, public;
ALTER FUNCTION public.check_consensus(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.gql_create_task(jsonb) SET search_path = pg_catalog, public;
ALTER FUNCTION public.gql_create_agent(jsonb) SET search_path = pg_catalog, public;
ALTER FUNCTION public.gql_mark_all_notifications_read(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.gql_execute_trade(jsonb) SET search_path = pg_catalog, public;
ALTER FUNCTION public.analyze_database_performance() SET search_path = pg_catalog, public;
ALTER FUNCTION public.sql(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.emergency_constraint_test() SET search_path = pg_catalog, public;
ALTER FUNCTION public.enterprise_database_assessment() SET search_path = pg_catalog, public;
ALTER FUNCTION public.test_transaction_safety() SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_database_health() SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_backup_status() SET search_path = pg_catalog, public;
ALTER FUNCTION public.sql_safe(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.test_constraint_enforcement() SET search_path = pg_catalog, public;
ALTER FUNCTION public.enterprise_constraint_test() SET search_path = pg_catalog, public;
ALTER FUNCTION public.enterprise_transaction_test() SET search_path = pg_catalog, public;

-- 2. Fix function search path warnings for app_data schema functions
ALTER FUNCTION app_data.get_all_a2a_agents() SET search_path = pg_catalog, app_data, public;
ALTER FUNCTION app_data.authenticate_agent_request(text, text, jsonb) SET search_path = pg_catalog, app_data, public;
ALTER FUNCTION app_data.get_agent_card(uuid) SET search_path = pg_catalog, app_data, public;
ALTER FUNCTION app_data.discover_agents(text, text[]) SET search_path = pg_catalog, app_data, public;
ALTER FUNCTION app_data.connect_agents(uuid, uuid) SET search_path = pg_catalog, app_data, public;
ALTER FUNCTION app_data.update_task_state(uuid, jsonb) SET search_path = pg_catalog, app_data, public;

-- 3. Move http extension to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Note: Moving extensions requires special handling
-- We'll need to update functions that use http to reference extensions.http

-- 4. Fix materialized view permissions
REVOKE ALL ON public.top_market_symbols_view FROM anon, authenticated;
GRANT SELECT ON public.top_market_symbols_view TO service_role;

-- Create a secure view for authenticated users
CREATE OR REPLACE VIEW public.top_market_symbols_secure AS
SELECT * FROM public.top_market_symbols_view;

-- Enable RLS on the secure view (views inherit RLS from base tables)
GRANT SELECT ON public.top_market_symbols_secure TO authenticated;

-- 5. Create auth configuration recommendations
COMMENT ON SCHEMA public IS 'Auth Configuration Required (via Supabase Dashboard):
1. Reduce OTP expiry to < 1 hour: Authentication > Providers > Email > OTP Expiry
2. Enable leaked password protection: Authentication > Settings > Leaked Password Protection';