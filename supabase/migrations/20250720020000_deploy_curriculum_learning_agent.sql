-- Deploy Curriculum Learning Agent
-- This migration creates the database schema for the Curriculum Learning Agent
-- which ensures CFA/Treasury compliance and provides domain context to all agents

-- Create agent_curricula table
CREATE TABLE IF NOT EXISTS public.agent_curricula (
    curriculum_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    curriculum_data JSONB NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create agent_learning_records table
CREATE TABLE IF NOT EXISTS public.agent_learning_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    concept TEXT NOT NULL,
    lesson_data JSONB NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    improvement_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create agent_validations table
CREATE TABLE IF NOT EXISTS public.agent_validations (
    validation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    validation_result JSONB NOT NULL,
    context JSONB,
    compliance_score DECIMAL(3,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create knowledge_assessments table
CREATE TABLE IF NOT EXISTS public.knowledge_assessments (
    assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    concept TEXT NOT NULL,
    assessment_data JSONB NOT NULL,
    score DECIMAL(3,2),
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create context_overlays table
CREATE TABLE IF NOT EXISTS public.context_overlays (
    overlay_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    task_id TEXT,
    overlay_data JSONB NOT NULL,
    business_context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    applied_at TIMESTAMP WITH TIME ZONE
);

-- Create cfa_standards table
CREATE TABLE IF NOT EXISTS public.cfa_standards (
    standard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    level TEXT NOT NULL,
    standards JSONB NOT NULL,
    formulas JSONB,
    common_errors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create treasury_policies table
CREATE TABLE IF NOT EXISTS public.treasury_policies (
    policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function TEXT NOT NULL,
    policy_name TEXT NOT NULL,
    requirements JSONB NOT NULL,
    constraints JSONB,
    best_practices JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert the Curriculum Learning Agent into a2a_agents
INSERT INTO public.a2a_agents (
    agent_id, agent_name, agent_type, description, status, capabilities, voting_power, connection_config, scheduled_tasks
) VALUES (
    'finsight.education.curriculum_learning',
    'Curriculum Learning Agent',
    'education',
    'Ensures CFA/Treasury compliance and provides domain context to all agents',
    'active',
    '["domain_knowledge_validation", "context_engineering", "curriculum_design", "knowledge_assessment", "error_correction", "best_practice_enforcement"]'::jsonb,
    150,
    '{"goals": ["Enforce CFA standards across all financial calculations", "Maintain treasury best practices", "Provide business context to technical agents", "Prevent financial methodology errors"], "personality": "authoritative", "auto_respond": true, "max_concurrent_tasks": 50, "education_role": "domain_guardian"}'::jsonb,
    '[{"name": "knowledge_validation", "interval": "*/15 * * * *", "action": "validateAgentKnowledge"}, {"name": "context_update", "interval": "0 * * * *", "action": "updateContextOverlays"}, {"name": "curriculum_review", "interval": "0 0 * * *", "action": "reviewCurricula"}]'::jsonb
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
    'finsight.education.curriculum_learning',
    'Domain Education Workflow',
    'education_validation',
    '<?xml version="1.0" encoding="UTF-8"?><bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" id="CurriculumLearningWorkflow"><bpmn2:process id="DomainEducation" isExecutable="true"><bpmn2:startEvent id="ValidationTimer"/><bpmn2:serviceTask id="ValidateKnowledge" name="Validate Knowledge"/><bpmn2:endEvent id="ValidationComplete"/></bpmn2:process></bpmn2:definitions>',
    'active'
);

-- Insert sample CFA standards
INSERT INTO public.cfa_standards (topic, level, standards, formulas, common_errors) VALUES
(
    'portfolio_optimization',
    'Level I',
    '["Consider all relevant constraints", "Use mean-variance optimization appropriately", "Account for transaction costs", "Consider investor risk tolerance"]'::jsonb,
    '{"sharpe_ratio": "(Rp - Rf) / σp", "efficient_frontier": "min σ² subject to E[R] = μ", "portfolio_variance": "σ²p = Σ Σ wi wj σij"}'::jsonb,
    '["Ignoring transaction costs", "Over-optimization", "Data mining bias", "Assuming normal distributions"]'::jsonb
),
(
    'risk_management',
    'Level II',
    '["Use multiple risk measures", "Consider tail risk", "Implement appropriate hedging strategies", "Regular monitoring and rebalancing"]'::jsonb,
    '{"var_95": "μ - 1.645σ", "expected_shortfall": "E[L | L > VaR]", "beta": "Cov(Ri,Rm) / Var(Rm)"}'::jsonb,
    '["Normal distribution assumption", "Correlation breakdown in crisis", "Underestimating tail risk"]'::jsonb
),
(
    'fixed_income',
    'Level I',
    '["Understand price-yield relationship", "Calculate duration and convexity", "Assess credit risk", "Consider embedded options"]'::jsonb,
    '{"duration": "-1/P * dP/dy", "convexity": "1/P * d²P/dy²", "ytm": "solve for y in P = Σ CF/(1+y)^t"}'::jsonb,
    '["Ignoring convexity for large yield changes", "Not adjusting for embedded options", "Using wrong day count convention"]'::jsonb
);

-- Insert sample treasury policies
INSERT INTO public.treasury_policies (function, policy_name, requirements, constraints, best_practices) VALUES
(
    'cash_management',
    'Liquidity Management Policy',
    '["Maintain minimum operating cash balance", "Daily cash positioning", "Forecast accuracy > 90%", "Multiple banking relationships"]'::jsonb,
    '{"min_cash_balance": 5000000, "max_concentration": 0.25, "forecast_horizon": "13_weeks", "update_frequency": "daily"}'::jsonb,
    '["Use rolling forecasts", "Automate cash concentration", "Implement fraud controls", "Regular bank fee analysis"]'::jsonb
),
(
    'investment_management',
    'Short-term Investment Policy',
    '["Capital preservation priority", "Maintain liquidity", "Diversify counterparty risk", "Comply with investment guidelines"]'::jsonb,
    '{"allowed_instruments": ["treasury_bills", "commercial_paper_a1p1", "money_market_funds"], "max_maturity": "365_days", "min_rating": "A-", "max_issuer_concentration": 0.10}'::jsonb,
    '["Ladder maturities", "Monitor credit ratings daily", "Stress test portfolio", "Document all exceptions"]'::jsonb
),
(
    'risk_management',
    'Financial Risk Management Policy',
    '["Identify all material risks", "Implement hedging strategies", "Regular risk reporting", "Board oversight"]'::jsonb,
    '{"var_limit": 0.02, "hedge_ratio_min": 0.7, "hedge_ratio_max": 0.9, "reporting_frequency": "monthly"}'::jsonb,
    '["Natural hedging first", "Avoid speculation", "Document hedge effectiveness", "Independent valuation"]'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_curricula_agent_id ON public.agent_curricula(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_curricula_status ON public.agent_curricula(status);

CREATE INDEX IF NOT EXISTS idx_agent_learning_agent_concept ON public.agent_learning_records(agent_id, concept);
CREATE INDEX IF NOT EXISTS idx_agent_learning_completed ON public.agent_learning_records(completed_at);

CREATE INDEX IF NOT EXISTS idx_agent_validations_agent_id ON public.agent_validations(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_validations_timestamp ON public.agent_validations(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_validations_compliance ON public.agent_validations(compliance_score);

CREATE INDEX IF NOT EXISTS idx_knowledge_assessments_agent_concept ON public.knowledge_assessments(agent_id, concept);
CREATE INDEX IF NOT EXISTS idx_knowledge_assessments_score ON public.knowledge_assessments(score);

CREATE INDEX IF NOT EXISTS idx_context_overlays_agent_id ON public.context_overlays(agent_id);
CREATE INDEX IF NOT EXISTS idx_context_overlays_task_id ON public.context_overlays(task_id);

CREATE INDEX IF NOT EXISTS idx_cfa_standards_topic_level ON public.cfa_standards(topic, level);
CREATE INDEX IF NOT EXISTS idx_treasury_policies_function ON public.treasury_policies(function);

-- Enable RLS on new tables
ALTER TABLE public.agent_curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_learning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.context_overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cfa_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_policies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service role (full access)
CREATE POLICY "service_role_all_agent_curricula" ON public.agent_curricula 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_agent_learning_records" ON public.agent_learning_records 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_agent_validations" ON public.agent_validations 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_knowledge_assessments" ON public.knowledge_assessments 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_context_overlays" ON public.context_overlays 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_cfa_standards" ON public.cfa_standards 
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_treasury_policies" ON public.treasury_policies 
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for authenticated users (read access)
CREATE POLICY "authenticated_read_agent_curricula" ON public.agent_curricula 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_agent_learning_records" ON public.agent_learning_records 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_agent_validations" ON public.agent_validations 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_knowledge_assessments" ON public.knowledge_assessments 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_context_overlays" ON public.context_overlays 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_cfa_standards" ON public.cfa_standards 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_read_treasury_policies" ON public.treasury_policies 
    FOR SELECT USING (auth.role() = 'authenticated');

-- Grant appropriate permissions
GRANT ALL ON public.agent_curricula TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.agent_curricula TO authenticated;

GRANT ALL ON public.agent_learning_records TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.agent_learning_records TO authenticated;

GRANT ALL ON public.agent_validations TO service_role;
GRANT SELECT, INSERT ON public.agent_validations TO authenticated;

GRANT ALL ON public.knowledge_assessments TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.knowledge_assessments TO authenticated;

GRANT ALL ON public.context_overlays TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.context_overlays TO authenticated;

GRANT ALL ON public.cfa_standards TO service_role;
GRANT SELECT ON public.cfa_standards TO authenticated, anon;

GRANT ALL ON public.treasury_policies TO service_role;
GRANT SELECT ON public.treasury_policies TO authenticated, anon;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;