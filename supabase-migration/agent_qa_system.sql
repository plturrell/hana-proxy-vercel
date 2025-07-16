-- Agent QA and Version Control System
-- Comprehensive database schema for automated agent evaluation and tracking

-- Table for agent version control
CREATE TABLE IF NOT EXISTS agent_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    version_number TEXT NOT NULL,
    
    -- Implementation details
    actual_function_name TEXT,
    actual_parameters JSONB,
    actual_implementation_code TEXT,
    actual_performance_metrics JSONB,
    
    -- Display details  
    display_name TEXT,
    display_description TEXT,
    display_capabilities JSONB,
    display_formula TEXT,
    display_process_flow JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by TEXT DEFAULT 'system',
    deployment_status TEXT DEFAULT 'active', -- active, deprecated, testing
    
    UNIQUE(agent_id, version_number)
);

-- Table for GPT-4 evaluations
CREATE TABLE IF NOT EXISTS agent_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_version_id UUID REFERENCES agent_versions(id),
    agent_id TEXT NOT NULL,
    
    -- Evaluation metadata
    evaluation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    gpt4_model_version TEXT DEFAULT 'gpt-4',
    evaluation_type TEXT, -- full_audit, display_check, implementation_review
    
    -- Core ratings (/100)
    overall_rating INTEGER CHECK (overall_rating >= 0 AND overall_rating <= 100),
    display_accuracy_rating INTEGER CHECK (display_accuracy_rating >= 0 AND display_accuracy_rating <= 100),
    implementation_quality_rating INTEGER CHECK (implementation_quality_rating >= 0 AND implementation_quality_rating <= 100),
    documentation_rating INTEGER CHECK (documentation_rating >= 0 AND documentation_rating <= 100),
    user_experience_rating INTEGER CHECK (user_experience_rating >= 0 AND user_experience_rating <= 100),
    
    -- Detailed analysis
    display_vs_implementation_analysis TEXT,
    strengths JSONB, -- Array of identified strengths
    weaknesses JSONB, -- Array of identified issues
    discrepancies JSONB, -- Specific display vs implementation gaps
    
    -- GPT-4 raw outputs
    full_gpt4_response JSONB,
    evaluation_prompt TEXT,
    
    -- Status
    review_status TEXT DEFAULT 'pending' -- pending, reviewed, implemented, dismissed
);

-- Table for recommendations and enhancements
CREATE TABLE IF NOT EXISTS agent_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID REFERENCES agent_evaluations(id),
    agent_id TEXT NOT NULL,
    
    -- Recommendation details
    recommendation_type TEXT, -- critical, enhancement, optimization, ui_improvement
    priority_score INTEGER CHECK (priority_score >= 1 AND priority_score <= 10),
    impact_level TEXT, -- high, medium, low
    effort_estimate TEXT, -- hours, days, weeks
    
    -- Content
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    suggested_implementation TEXT,
    expected_benefit TEXT,
    
    -- Implementation tracking
    status TEXT DEFAULT 'open', -- open, in_progress, completed, rejected
    assigned_to TEXT,
    implementation_notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for enhancement backlog
CREATE TABLE IF NOT EXISTS agent_enhancement_backlog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    
    -- Backlog item details
    feature_title TEXT NOT NULL,
    feature_description TEXT NOT NULL,
    business_value TEXT,
    technical_requirements TEXT,
    
    -- Prioritization
    priority_score INTEGER CHECK (priority_score >= 1 AND priority_score <= 100),
    business_impact INTEGER CHECK (business_impact >= 1 AND business_impact <= 10),
    technical_complexity INTEGER CHECK (technical_complexity >= 1 AND technical_complexity <= 10),
    user_demand_score INTEGER CHECK (user_demand_score >= 1 AND user_demand_score <= 10),
    
    -- Status tracking
    status TEXT DEFAULT 'backlog', -- backlog, planned, in_progress, testing, completed
    sprint_assignment TEXT,
    estimated_story_points INTEGER,
    
    -- Dependencies and relationships
    depends_on UUID[], -- Array of other backlog item IDs
    blocks UUID[], -- Array of items this blocks
    related_agents TEXT[], -- Array of related agent IDs
    
    -- Metadata
    source TEXT, -- gpt4_recommendation, user_request, internal_audit
    source_reference_id UUID, -- Reference to evaluation or recommendation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    target_completion_date DATE
);

-- Table for automated audit logs
CREATE TABLE IF NOT EXISTS agent_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    
    -- Audit details
    audit_type TEXT, -- daily_check, deployment_verification, performance_review
    audit_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Results
    checks_performed JSONB, -- Array of checks
    issues_found JSONB, -- Array of issues
    performance_metrics JSONB,
    
    -- Automated actions taken
    auto_fixes_applied JSONB,
    alerts_triggered JSONB,
    
    -- Status
    audit_status TEXT DEFAULT 'completed', -- running, completed, failed
    next_audit_due TIMESTAMP WITH TIME ZONE
);

-- Function to automatically create agent version when agent is updated
CREATE OR REPLACE FUNCTION create_agent_version_on_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Create new version entry
    INSERT INTO agent_versions (
        agent_id,
        agent_name,
        version_number,
        actual_function_name,
        display_name,
        display_description,
        created_at
    ) VALUES (
        NEW.agent_id,
        NEW.agent_name,
        CONCAT('v', EXTRACT(EPOCH FROM now())::INTEGER),
        NEW.function_name,
        NEW.agent_name,
        NEW.description,
        now()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate priority score for recommendations
CREATE OR REPLACE FUNCTION calculate_recommendation_priority(
    p_impact_level TEXT,
    p_effort_estimate TEXT,
    p_evaluation_rating INTEGER
) RETURNS INTEGER AS $$
DECLARE
    impact_weight INTEGER;
    effort_weight INTEGER;
    rating_weight INTEGER;
    priority_score INTEGER;
BEGIN
    -- Impact level weights
    impact_weight := CASE p_impact_level
        WHEN 'high' THEN 8
        WHEN 'medium' THEN 5
        WHEN 'low' THEN 2
        ELSE 3
    END;
    
    -- Effort weights (inverse - less effort = higher priority)
    effort_weight := CASE p_effort_estimate
        WHEN 'hours' THEN 8
        WHEN 'days' THEN 5
        WHEN 'weeks' THEN 2
        ELSE 3
    END;
    
    -- Rating weight (lower rating = higher priority for fixes)
    rating_weight := CASE 
        WHEN p_evaluation_rating < 50 THEN 9
        WHEN p_evaluation_rating < 70 THEN 6
        WHEN p_evaluation_rating < 85 THEN 4
        ELSE 2
    END;
    
    -- Calculate weighted priority (1-10 scale)
    priority_score := LEAST(10, GREATEST(1, 
        ROUND((impact_weight + effort_weight + rating_weight) / 3.0)
    ));
    
    RETURN priority_score;
END;
$$ LANGUAGE plpgsql;

-- Function to run automated GPT-4 evaluation (placeholder for API call)
CREATE OR REPLACE FUNCTION trigger_gpt4_evaluation(p_agent_id TEXT)
RETURNS UUID AS $$
DECLARE
    evaluation_id UUID;
BEGIN
    -- Create evaluation record
    INSERT INTO agent_evaluations (
        agent_id,
        evaluation_type,
        review_status
    ) VALUES (
        p_agent_id,
        'automated_audit',
        'pending'
    ) RETURNING id INTO evaluation_id;
    
    -- Note: Actual GPT-4 API call would be made by the application layer
    -- This function just creates the tracking record
    
    RETURN evaluation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get agent evaluation summary
CREATE OR REPLACE FUNCTION get_agent_evaluation_summary(p_agent_id TEXT)
RETURNS TABLE (
    agent_id TEXT,
    latest_overall_rating INTEGER,
    avg_rating_last_30_days NUMERIC,
    total_evaluations INTEGER,
    critical_recommendations INTEGER,
    open_enhancements INTEGER,
    last_evaluation_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_agent_id,
        (SELECT overall_rating 
         FROM agent_evaluations 
         WHERE agent_evaluations.agent_id = p_agent_id 
         ORDER BY evaluation_timestamp DESC 
         LIMIT 1),
        (SELECT AVG(overall_rating)::NUMERIC(5,2)
         FROM agent_evaluations 
         WHERE agent_evaluations.agent_id = p_agent_id 
         AND evaluation_timestamp > now() - INTERVAL '30 days'),
        (SELECT COUNT(*)::INTEGER
         FROM agent_evaluations 
         WHERE agent_evaluations.agent_id = p_agent_id),
        (SELECT COUNT(*)::INTEGER
         FROM agent_recommendations 
         WHERE agent_recommendations.agent_id = p_agent_id 
         AND recommendation_type = 'critical' 
         AND status = 'open'),
        (SELECT COUNT(*)::INTEGER
         FROM agent_enhancement_backlog 
         WHERE agent_enhancement_backlog.agent_id = p_agent_id 
         AND status IN ('backlog', 'planned')),
        (SELECT MAX(evaluation_timestamp)
         FROM agent_evaluations 
         WHERE agent_evaluations.agent_id = p_agent_id);
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_versions_agent_id ON agent_versions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_versions_created_at ON agent_versions(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_evaluations_agent_id ON agent_evaluations(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_evaluations_timestamp ON agent_evaluations(evaluation_timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_recommendations_agent_id ON agent_recommendations(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_recommendations_priority ON agent_recommendations(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_backlog_agent_id ON agent_enhancement_backlog(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_backlog_priority ON agent_enhancement_backlog(priority_score DESC);

-- Grant permissions
GRANT ALL ON TABLE agent_versions TO authenticated;
GRANT ALL ON TABLE agent_evaluations TO authenticated;
GRANT ALL ON TABLE agent_recommendations TO authenticated;
GRANT ALL ON TABLE agent_enhancement_backlog TO authenticated;
GRANT ALL ON TABLE agent_audit_logs TO authenticated;

-- Insert initial test data
INSERT INTO agent_versions (agent_id, agent_name, version_number, actual_function_name, display_name, display_description)
VALUES 
    ('finsight.analytics.pearson_correlation', 'Pearson Correlation Agent', 'v1.0', 'calculate_pearson_correlation', 'Portfolio Correlation', 'Discover hidden relationships between your investments with intelligent correlation analysis.'),
    ('finsight.analytics.value_at_risk', 'Value at Risk Agent', 'v1.0', 'calculate_var', 'Risk Calculator', 'Calculate your maximum potential loss with precision and confidence.')
ON CONFLICT (agent_id, version_number) DO NOTHING;

COMMENT ON TABLE agent_versions IS 'Version control for all agent implementations and display configurations';
COMMENT ON TABLE agent_evaluations IS 'GPT-4 powered evaluations comparing agent display vs actual implementation';
COMMENT ON TABLE agent_recommendations IS 'Prioritized recommendations for agent improvements';
COMMENT ON TABLE agent_enhancement_backlog IS 'Product backlog for agent enhancements with business prioritization';