-- Fix Supabase Security Issues - Basic Version
-- This version only fixes the critical security issues without adding complex policies

-- 1. Remove SECURITY DEFINER from all views
ALTER VIEW public.top_market_symbols SET (security_invoker = true);
ALTER VIEW public.gql_exchanges SET (security_invoker = true);
ALTER VIEW public.gql_users SET (security_invoker = true);
ALTER VIEW public.gql_currencies SET (security_invoker = true);
ALTER VIEW public.gql_agents SET (security_invoker = true);
ALTER VIEW public.gql_countries SET (security_invoker = true);
ALTER VIEW public.portfolio_summary SET (security_invoker = true);
ALTER VIEW public.latest_market_predictions SET (security_invoker = true);
ALTER VIEW public.gql_sectors SET (security_invoker = true);
ALTER VIEW public.compliance_status_view SET (security_invoker = true);
ALTER VIEW public.active_anomalies SET (security_invoker = true);

-- 2. Enable RLS on all public tables
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_rate_curves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_blockchain_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.a2a_agents_backup_20250118 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websocket_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_characteristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployed_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_process_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_source_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_market_data_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data_fetch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_volatility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_stress_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sector_risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_entity_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owl_ontology ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owl_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_abis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_blockchain_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.a2a_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rdf_triples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_article_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_prediction_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_fixes_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_compliance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_data ENABLE ROW LEVEL SECURITY;

-- 3. Add a basic policy that allows service role full access to all tables
-- This ensures your backend can still access the data while RLS is enabled

-- For each table, create a policy that allows service role full access
DO $$ 
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'news_sources', 'asset_prices', 'interest_rate_curves', 'process_blockchain_deployments',
            'a2a_agents_backup_20250118', 'migration_logs', 'websocket_channels', 'financial_metrics',
            'portfolios', 'portfolio_positions', 'asset_correlations', 'user_interactions',
            'feature_definitions', 'feature_values', 'agent_activity', 'bond_characteristics',
            'deployed_contracts', 'visual_process_deployments', 'blockchain_events', 'stock_symbols',
            'api_configurations', 'data_source_settings', 'entity_market_data_mapping',
            'market_data_fetch_history', 'xai_insights', 'asset_volatility', 'liquidity_metrics',
            'regulatory_stress_scenarios', 'sector_risk_factors', 'entity_registry',
            'news_entity_mentions', 'owl_ontology', 'owl_properties', 'extracted_entities',
            'contract_abis', 'blockchain_config', 'test_accounts', 'agent_blockchain_activities',
            'article_classifications', 'a2a_messages', 'anomaly_details', 'ai_recommendations',
            'technical_indicators', 'market_risks', 'rdf_triples', 'news_article_symbols',
            'agent_capabilities', 'user_portfolios', 'compliance_prediction_details',
            'compliance_fixes_log', 'ai_compliance_log', 'ai_learning_data'
        )
    LOOP
        -- Create policy for service role
        EXECUTE format('
            CREATE POLICY "Service role has full access to %I" ON public.%I
            FOR ALL 
            USING (auth.jwt() ->> ''role'' = ''service_role'')
            WITH CHECK (auth.jwt() ->> ''role'' = ''service_role'')',
            table_name, table_name
        );
    END LOOP;
END $$;