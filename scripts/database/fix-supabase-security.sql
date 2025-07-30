-- Fix Supabase Security Issues
-- Generated on 2025-01-21

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

-- 3. Create basic RLS policies for read-only access
-- These policies allow authenticated users to read data but not modify it
-- You can customize these based on your specific security requirements

-- Reference data tables (read-only for all authenticated users)
CREATE POLICY "Allow authenticated read access" ON public.stock_symbols
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.news_sources
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.asset_prices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.interest_rate_curves
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.financial_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.asset_correlations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.asset_volatility
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.liquidity_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.regulatory_stress_scenarios
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.sector_risk_factors
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.technical_indicators
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.market_risks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.bond_characteristics
    FOR SELECT USING (auth.role() = 'authenticated');

-- Entity and knowledge graph tables
CREATE POLICY "Allow authenticated read access" ON public.entity_registry
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.entity_market_data_mapping
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.news_entity_mentions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.extracted_entities
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.owl_ontology
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.owl_properties
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.rdf_triples
    FOR SELECT USING (auth.role() = 'authenticated');

-- Agent and AI tables
CREATE POLICY "Allow authenticated read access" ON public.agent_activity
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.agent_capabilities
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.agent_blockchain_activities
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.ai_recommendations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.ai_compliance_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.ai_learning_data
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.xai_insights
    FOR SELECT USING (auth.role() = 'authenticated');

-- User-specific tables (users can only see their own data)
CREATE POLICY "Users can view own portfolios" ON public.portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own portfolio positions" ON public.portfolio_positions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.portfolios
            WHERE portfolios.id = portfolio_positions.portfolio_id
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own user portfolios" ON public.user_portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own interactions" ON public.user_interactions
    FOR SELECT USING (auth.uid() = user_id);

-- Configuration and system tables (read-only for authenticated users)
CREATE POLICY "Allow authenticated read access" ON public.api_configurations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.data_source_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.feature_definitions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.feature_values
    FOR SELECT USING (auth.role() = 'authenticated');

-- Blockchain tables
CREATE POLICY "Allow authenticated read access" ON public.deployed_contracts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.contract_abis
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.blockchain_config
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.blockchain_events
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.process_blockchain_deployments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.visual_process_deployments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Communication tables
CREATE POLICY "Allow authenticated read access" ON public.a2a_messages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.websocket_channels
    FOR SELECT USING (auth.role() = 'authenticated');

-- Monitoring and logging tables
CREATE POLICY "Allow authenticated read access" ON public.anomaly_details
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.compliance_prediction_details
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.compliance_fixes_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.market_data_fetch_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.migration_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- News and articles tables
CREATE POLICY "Allow authenticated read access" ON public.article_classifications
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.news_article_symbols
    FOR SELECT USING (auth.role() = 'authenticated');

-- Test and backup tables (restrict access)
CREATE POLICY "Allow service role only" ON public.test_accounts
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow service role only" ON public.a2a_agents_backup_20250118
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Note: You may want to add INSERT, UPDATE, and DELETE policies for specific tables
-- based on your application's requirements. For example:

-- Allow users to create their own portfolios
CREATE POLICY "Users can create own portfolios" ON public.portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own portfolios
CREATE POLICY "Users can update own portfolios" ON public.portfolios
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own portfolios
CREATE POLICY "Users can delete own portfolios" ON public.portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- Similar policies can be added for portfolio_positions, user_interactions, etc.