-- Deploy News Assessment & Hedge Agent
-- This migration creates the database schema for the News Assessment & Hedge Agent
-- which transforms news intelligence into actionable hedge recommendations

-- Create news_hedge_analyses table
CREATE TABLE IF NOT EXISTS public.news_hedge_analyses (
    analysis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    analysis_data JSONB NOT NULL,
    classification JSONB,
    impact_assessment JSONB,
    hedge_recommendations JSONB,
    confidence_score DECIMAL(3,2),
    urgency_level TEXT DEFAULT 'medium',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create hedge_recommendations table
CREATE TABLE IF NOT EXISTS public.hedge_recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID REFERENCES public.news_hedge_analyses(analysis_id),
    asset_class TEXT NOT NULL,
    hedge_instrument TEXT NOT NULL,
    instruments JSONB NOT NULL,
    hedge_ratio DECIMAL(5,4) NOT NULL,
    notional_amount BIGINT NOT NULL,
    estimated_cost DECIMAL(12,2) NOT NULL,
    expected_protection DECIMAL(12,2) NOT NULL,
    cost_benefit_ratio DECIMAL(8,2) NOT NULL,
    effectiveness DECIMAL(3,2) NOT NULL,
    liquidity TEXT NOT NULL,
    implementation_urgency TEXT DEFAULT 'medium',
    exit_strategy JSONB,
    risk_considerations JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create hedge_effectiveness_monitoring table
CREATE TABLE IF NOT EXISTS public.hedge_effectiveness_monitoring (
    monitoring_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID REFERENCES public.hedge_recommendations(recommendation_id),
    current_hedge_ratio DECIMAL(5,4),
    target_hedge_ratio DECIMAL(5,4),
    hedge_pnl DECIMAL(15,2),
    underlying_pnl DECIMAL(15,2),
    effectiveness_ratio DECIMAL(3,2),
    status TEXT DEFAULT 'active',
    adjustments_needed BOOLEAN DEFAULT FALSE,
    next_review_date TIMESTAMP WITH TIME ZONE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create news_event_classifications table
CREATE TABLE IF NOT EXISTS public.news_event_classifications (
    classification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    headline TEXT NOT NULL,
    primary_category TEXT NOT NULL,
    subcategory TEXT,
    impact_weight DECIMAL(3,2),
    affected_assets JSONB,
    geographic_scope TEXT DEFAULT 'global',
    time_horizon TEXT DEFAULT 'short_term',
    sentiment_score DECIMAL(3,2),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create scenario_models table
CREATE TABLE IF NOT EXISTS public.scenario_models (
    model_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_category TEXT NOT NULL,
    subcategory TEXT,
    base_case_probability DECIMAL(3,2),
    stress_case_probability DECIMAL(3,2),
    extreme_case_probability DECIMAL(3,2),
    historical_accuracy DECIMAL(3,2),
    model_parameters JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert the News Assessment & Hedge Agent into a2a_agents
INSERT INTO public.a2a_agents (
    agent_id, agent_name, agent_type, description, status, capabilities, voting_power, connection_config, scheduled_tasks
) VALUES (
    'finsight.risk.news_assessment_hedge',
    'News Assessment & Hedge Agent',
    'risk_management',
    'Transforms news intelligence into actionable hedge recommendations',
    'active',
    '[
        "news_impact_quantification",
        "event_driven_scenario_modeling", 
        "hedge_instrument_selection",
        "hedge_ratio_optimization",
        "cost_benefit_analysis",
        "timing_strategy_optimization",
        "cross_asset_correlation_analysis",
        "hedge_effectiveness_tracking"
    ]'::jsonb,
    120,
    '{
        "goals": [
            "Assess portfolio impact of news events",
            "Generate optimal hedge recommendations", 
            "Monitor hedge effectiveness in real-time",
            "Provide cost-benefit analysis for risk mitigation"
        ],
        "personality": "analytical",
        "auto_respond": true,
        "max_concurrent_analyses": 25,
        "hedge_focus": "event_driven"
    }'::jsonb,
    '[
        {
            "name": "news_impact_scan",
            "interval": "*/5 * * * *",
            "action": "scanNewsImpacts"
        },
        {
            "name": "hedge_effectiveness_review", 
            "interval": "0 */4 * * *",
            "action": "reviewHedgeEffectiveness"
        },
        {
            "name": "scenario_model_update",
            "interval": "0 2 * * *", 
            "action": "updateScenarioModels"
        }
    ]'::jsonb
) ON CONFLICT (agent_id) DO UPDATE SET
    agent_name = EXCLUDED.agent_name,
    agent_type = EXCLUDED.agent_type,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    capabilities = EXCLUDED.capabilities,
    voting_power = EXCLUDED.voting_power,
    connection_config = EXCLUDED.connection_config,
    scheduled_tasks = EXCLUDED.scheduled_tasks,
    updated_at = CURRENT_TIMESTAMP;

-- Skip ORD registry entry due to table structure issue
-- This will be handled by the agent's self-registration on initialization

-- Insert workflow definition
INSERT INTO public.agent_workflows (
    agent_id, workflow_name, workflow_type, bpmn_definition, status
) VALUES (
    'finsight.risk.news_assessment_hedge',
    'News Assessment & Hedge Workflow',
    'news_driven_hedging',
    '<?xml version="1.0" encoding="UTF-8"?><bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" id="NewsAssessmentHedgeWorkflow"><bpmn2:process id="NewsHedging" isExecutable="true"><bpmn2:startEvent id="NewsReceived"/><bpmn2:serviceTask id="ClassifyNews" name="Classify News"/><bpmn2:serviceTask id="AssessImpact" name="Assess Impact"/><bpmn2:serviceTask id="GenerateHedges" name="Generate Hedges"/><bpmn2:endEvent id="RecommendationsPublished"/></bpmn2:process></bpmn2:definitions>',
    'active'
);

-- Insert sample news event classifications
INSERT INTO public.news_event_classifications (event_id, headline, primary_category, subcategory, impact_weight, affected_assets, sentiment_score) VALUES
(
    'news_001',
    'Federal Reserve Signals Aggressive Rate Hikes to Combat Inflation',
    'central_bank',
    'fed_policy',
    0.90,
    '["treasury", "corporate_bonds", "currency", "equities"]'::jsonb,
    -0.75
),
(
    'news_002', 
    'ECB Maintains Dovish Stance Despite Rising Inflation Pressures',
    'central_bank',
    'ecb_policy',
    0.80,
    '["eur_bonds", "eur_currency", "european_equities"]'::jsonb,
    0.25
),
(
    'news_003',
    'Trade War Escalation: New Tariffs on Technology Imports',
    'geopolitical',
    'trade_war',
    0.85,
    '["commodities", "emerging_markets", "currency", "technology"]'::jsonb,
    -0.65
),
(
    'news_004',
    'Employment Report Shows Stronger Than Expected Job Growth',
    'economic_data',
    'employment', 
    0.60,
    '["treasury", "currency", "consumer_discretionary"]'::jsonb,
    0.55
),
(
    'news_005',
    'Oil Prices Surge on Middle East Supply Concerns',
    'geopolitical',
    'supply_disruption',
    0.70,
    '["energy", "commodities", "inflation_linked_bonds"]'::jsonb,
    -0.40
);

-- Insert sample scenario models
INSERT INTO public.scenario_models (event_category, subcategory, base_case_probability, stress_case_probability, extreme_case_probability, historical_accuracy, model_parameters) VALUES
(
    'central_bank',
    'fed_policy',
    0.60,
    0.30,
    0.10,
    0.82,
    '{
        "rate_change_magnitude": {"min": 0.25, "max": 1.00, "expected": 0.50},
        "market_reaction_duration": {"short_term": "1-3_days", "medium_term": "1-2_weeks"},
        "asset_correlations": {"treasury_duration": 0.95, "equity_beta": -0.75}
    }'::jsonb
),
(
    'geopolitical',
    'trade_war',
    0.55,
    0.35,
    0.10,
    0.71,
    '{
        "volatility_spike": {"equity": 1.5, "fx": 1.3, "commodities": 1.2},
        "correlation_breakdown": 0.3,
        "flight_to_quality": {"treasury_flows": "high", "gold_flows": "medium"}
    }'::jsonb
),
(
    'economic_data',
    'employment',
    0.65,
    0.25,
    0.10,
    0.88,
    '{
        "surprise_threshold": 0.2,
        "market_sensitivity": {"bond_duration": 0.7, "currency_reaction": 0.6},
        "revision_impact": 0.3
    }'::jsonb
);

-- Insert sample hedge recommendations
INSERT INTO public.hedge_recommendations (
    analysis_id, asset_class, hedge_instrument, instruments, hedge_ratio, notional_amount, 
    estimated_cost, expected_protection, cost_benefit_ratio, effectiveness, liquidity,
    implementation_urgency, exit_strategy, risk_considerations
) VALUES
(
    (SELECT analysis_id FROM public.news_hedge_analyses ORDER BY created_at DESC LIMIT 1),
    'treasury_bonds',
    'treasury_futures',
    '["ZN", "ZB", "ZF"]'::jsonb,
    0.85,
    42500000,
    85000.00,
    1020000.00,
    12.00,
    0.95,
    'high',
    'high',
    '{
        "trigger_conditions": ["event_resolution", "hedge_effectiveness_below_threshold"],
        "target_pnl": "break_even",
        "maximum_holding_period": "90_days",
        "monitoring_frequency": "daily"
    }'::jsonb,
    '["basis_risk", "liquidity_risk", "margin_risk", "rollover_risk"]'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_hedge_analyses_event_id ON public.news_hedge_analyses(event_id);
CREATE INDEX IF NOT EXISTS idx_news_hedge_analyses_timestamp ON public.news_hedge_analyses(timestamp);
CREATE INDEX IF NOT EXISTS idx_news_hedge_analyses_confidence ON public.news_hedge_analyses(confidence_score);
CREATE INDEX IF NOT EXISTS idx_news_hedge_analyses_urgency ON public.news_hedge_analyses(urgency_level);

CREATE INDEX IF NOT EXISTS idx_hedge_recommendations_analysis_id ON public.hedge_recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_hedge_recommendations_asset_class ON public.hedge_recommendations(asset_class);
CREATE INDEX IF NOT EXISTS idx_hedge_recommendations_status ON public.hedge_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_hedge_recommendations_cost_benefit ON public.hedge_recommendations(cost_benefit_ratio);

CREATE INDEX IF NOT EXISTS idx_hedge_effectiveness_rec_id ON public.hedge_effectiveness_monitoring(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_hedge_effectiveness_timestamp ON public.hedge_effectiveness_monitoring(timestamp);
CREATE INDEX IF NOT EXISTS idx_hedge_effectiveness_status ON public.hedge_effectiveness_monitoring(status);

CREATE INDEX IF NOT EXISTS idx_news_classifications_event_id ON public.news_event_classifications(event_id);
CREATE INDEX IF NOT EXISTS idx_news_classifications_category ON public.news_event_classifications(primary_category, subcategory);
CREATE INDEX IF NOT EXISTS idx_news_classifications_processed ON public.news_event_classifications(processed_at);

CREATE INDEX IF NOT EXISTS idx_scenario_models_category ON public.scenario_models(event_category, subcategory);
CREATE INDEX IF NOT EXISTS idx_scenario_models_updated ON public.scenario_models(last_updated);

-- Enable RLS on new tables
ALTER TABLE public.news_hedge_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hedge_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hedge_effectiveness_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_event_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_models ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service role (full access)
CREATE POLICY "service_role_all_news_hedge_analyses" ON public.news_hedge_analyses 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_hedge_recommendations" ON public.hedge_recommendations 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_hedge_effectiveness" ON public.hedge_effectiveness_monitoring 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_news_classifications" ON public.news_event_classifications 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_scenario_models" ON public.scenario_models 
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for authenticated users (read access)
CREATE POLICY "authenticated_read_news_hedge_analyses" ON public.news_hedge_analyses 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_hedge_recommendations" ON public.hedge_recommendations 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_hedge_effectiveness" ON public.hedge_effectiveness_monitoring 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_news_classifications" ON public.news_event_classifications 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_scenario_models" ON public.scenario_models 
    FOR SELECT USING (auth.role() = 'authenticated');

-- Grant appropriate permissions
GRANT ALL ON public.news_hedge_analyses TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.news_hedge_analyses TO authenticated;

GRANT ALL ON public.hedge_recommendations TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.hedge_recommendations TO authenticated;

GRANT ALL ON public.hedge_effectiveness_monitoring TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.hedge_effectiveness_monitoring TO authenticated;

GRANT ALL ON public.news_event_classifications TO service_role;
GRANT SELECT ON public.news_event_classifications TO authenticated, anon;

GRANT ALL ON public.scenario_models TO service_role;
GRANT SELECT ON public.scenario_models TO authenticated, anon;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;