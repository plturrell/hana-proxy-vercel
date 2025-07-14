-- Exasol Complete Database Schema: Phase 2 Implementation
-- Comprehensive schema for RDF, ML, Financial Analytics, and Production systems

-- =============================================================================
-- 1. CORE APPLICATION SCHEMA
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS app_data;

-- =============================================================================
-- 2. RELATIONAL TABLES (Standard Business Data)
-- =============================================================================

-- Users and Authentication
CREATE TABLE app_data.users (
    user_id         DECIMAL(18,0) IDENTITY,
    username        VARCHAR(100) NOT NULL,
    email          VARCHAR(255) NOT NULL,
    user_type      VARCHAR(50) DEFAULT 'standard',  -- 'cfa', 'admin', 'standard'
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active      BOOLEAN DEFAULT TRUE,
    preferences    VARCHAR(2000),  -- JSON preferences
    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_username UNIQUE (username)
);

-- Financial Transactions
CREATE TABLE app_data.transactions (
    trans_id       DECIMAL(18,0) IDENTITY,
    user_id        DECIMAL(18,0),
    transaction_type VARCHAR(50),  -- 'buy', 'sell', 'dividend', etc.
    symbol         VARCHAR(20),
    quantity       DECIMAL(15,4),
    price          DECIMAL(15,4),
    amount         DECIMAL(15,2),
    currency       VARCHAR(3) DEFAULT 'USD',
    trans_date     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    portfolio_id   DECIMAL(18,0),
    metadata       VARCHAR(2000),  -- JSON metadata
    CONSTRAINT pk_transactions PRIMARY KEY (trans_id),
    CONSTRAINT fk_trans_user FOREIGN KEY (user_id) REFERENCES app_data.users(user_id)
);

-- Portfolio Management
CREATE TABLE app_data.portfolios (
    portfolio_id   DECIMAL(18,0) IDENTITY,
    user_id        DECIMAL(18,0),
    portfolio_name VARCHAR(200),
    portfolio_type VARCHAR(50),  -- 'equity', 'fixed_income', 'mixed', etc.
    base_currency  VARCHAR(3) DEFAULT 'USD',
    total_value    DECIMAL(18,2),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    risk_profile   VARCHAR(50),  -- 'conservative', 'moderate', 'aggressive'
    CONSTRAINT pk_portfolios PRIMARY KEY (portfolio_id),
    CONSTRAINT fk_portfolio_user FOREIGN KEY (user_id) REFERENCES app_data.users(user_id)
);

-- Market Data
CREATE TABLE app_data.market_data (
    market_data_id DECIMAL(18,0) IDENTITY,
    symbol         VARCHAR(20) NOT NULL,
    data_date      DATE NOT NULL,
    open_price     DECIMAL(15,4),
    high_price     DECIMAL(15,4),
    low_price      DECIMAL(15,4),
    close_price    DECIMAL(15,4),
    volume         DECIMAL(18,0),
    adj_close      DECIMAL(15,4),
    dividend       DECIMAL(10,4),
    split_ratio    DECIMAL(10,4),
    data_source    VARCHAR(50),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_market_data PRIMARY KEY (market_data_id),
    CONSTRAINT uk_market_data UNIQUE (symbol, data_date)
);

-- =============================================================================
-- 3. RDF TRIPLE STORE (Knowledge Graph)
-- =============================================================================

-- Core RDF Triples Table
CREATE TABLE app_data.rdf_triples (
    triple_id      DECIMAL(18,0) IDENTITY,
    subject        VARCHAR(2000) NOT NULL,
    predicate      VARCHAR(2000) NOT NULL,
    object         VARCHAR(2000) NOT NULL,
    object_type    VARCHAR(20) DEFAULT 'LITERAL',  -- 'URI', 'LITERAL', 'TYPED_LITERAL'
    datatype       VARCHAR(200),  -- XSD datatype for typed literals
    language       VARCHAR(10),   -- Language tag for string literals
    graph_uri      VARCHAR(2000) DEFAULT 'default',
    confidence     DECIMAL(3,2) DEFAULT 1.0,  -- Confidence score 0-1
    source         VARCHAR(200),  -- Data source
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active      BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT pk_rdf_triples PRIMARY KEY (triple_id)
);

-- Optimized indexes for SPARQL-like queries
CREATE INDEX idx_rdf_spo ON app_data.rdf_triples (subject, predicate, object);
CREATE INDEX idx_rdf_pos ON app_data.rdf_triples (predicate, object, subject);
CREATE INDEX idx_rdf_osp ON app_data.rdf_triples (object, subject, predicate);
CREATE INDEX idx_rdf_graph ON app_data.rdf_triples (graph_uri);
CREATE INDEX idx_rdf_created ON app_data.rdf_triples (created_at);

-- RDF Namespaces
CREATE TABLE app_data.rdf_namespaces (
    namespace_id   DECIMAL(18,0) IDENTITY,
    prefix         VARCHAR(50) NOT NULL,
    namespace_uri  VARCHAR(2000) NOT NULL,
    description    VARCHAR(500),
    is_default     BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_rdf_namespaces PRIMARY KEY (namespace_id),
    CONSTRAINT uk_rdf_prefix UNIQUE (prefix)
);

-- Materialized Entities (for performance)
CREATE TABLE app_data.rdf_entities (
    entity_id      DECIMAL(18,0) IDENTITY,
    entity_uri     VARCHAR(2000) NOT NULL,
    entity_type    VARCHAR(200),
    entity_label   VARCHAR(500),
    properties     VARCHAR(2000000),  -- JSON properties
    relationships  VARCHAR(2000000),  -- JSON relationships
    frequency      DECIMAL(10,0) DEFAULT 1,  -- Mention frequency
    importance     DECIMAL(5,2) DEFAULT 0.0,  -- Calculated importance score
    last_updated   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_rdf_entities PRIMARY KEY (entity_id),
    CONSTRAINT uk_rdf_entity_uri UNIQUE (entity_uri)
);

-- Entity Relationships (pre-computed for performance)
CREATE TABLE app_data.rdf_relationships (
    relationship_id DECIMAL(18,0) IDENTITY,
    entity1_id     DECIMAL(18,0),
    relationship   VARCHAR(200),
    entity2_id     DECIMAL(18,0),
    confidence     DECIMAL(3,2) DEFAULT 1.0,
    weight         DECIMAL(10,4) DEFAULT 1.0,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_rdf_relationships PRIMARY KEY (relationship_id),
    CONSTRAINT fk_rdf_rel_entity1 FOREIGN KEY (entity1_id) REFERENCES app_data.rdf_entities(entity_id),
    CONSTRAINT fk_rdf_rel_entity2 FOREIGN KEY (entity2_id) REFERENCES app_data.rdf_entities(entity_id)
);

-- =============================================================================
-- 4. MACHINE LEARNING INFRASTRUCTURE
-- =============================================================================

-- ML Models Registry
CREATE TABLE app_data.ml_models (
    model_id       DECIMAL(18,0) IDENTITY,
    model_name     VARCHAR(200) NOT NULL,
    model_version  VARCHAR(50) DEFAULT '1.0',
    model_type     VARCHAR(50) NOT NULL,  -- 'classification', 'regression', 'clustering', 'reinforcement'
    algorithm      VARCHAR(100),  -- 'random_forest', 'neural_network', 'svm', etc.
    model_blob     VARCHAR(2000000),  -- Serialized model (or reference)
    model_config   VARCHAR(2000000),  -- JSON configuration
    features       VARCHAR(2000000),  -- JSON array of feature names
    target_variable VARCHAR(100),
    training_data_info VARCHAR(2000000),  -- JSON metadata about training data
    performance_metrics VARCHAR(2000000),  -- JSON performance metrics
    hyperparameters VARCHAR(2000000),  -- JSON hyperparameters
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by     DECIMAL(18,0),
    is_active      BOOLEAN DEFAULT TRUE,
    is_production  BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT pk_ml_models PRIMARY KEY (model_id),
    CONSTRAINT uk_ml_model_name_version UNIQUE (model_name, model_version),
    CONSTRAINT fk_ml_model_user FOREIGN KEY (created_by) REFERENCES app_data.users(user_id)
);

-- ML Training Datasets
CREATE TABLE app_data.ml_training_sets (
    dataset_id     DECIMAL(18,0) IDENTITY,
    dataset_name   VARCHAR(200) NOT NULL,
    dataset_type   VARCHAR(50),  -- 'training', 'validation', 'test'
    data_source    VARCHAR(200),
    feature_columns VARCHAR(2000000),  -- JSON array of feature definitions
    target_column  VARCHAR(100),
    row_count      DECIMAL(18,0),
    column_count   DECIMAL(10,0),
    data_location  VARCHAR(500),  -- File path or table reference
    data_hash      VARCHAR(64),   -- SHA256 hash for data integrity
    statistics     VARCHAR(2000000),  -- JSON statistics (mean, std, etc.)
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_ml_training_sets PRIMARY KEY (dataset_id),
    CONSTRAINT uk_ml_dataset_name UNIQUE (dataset_name)
);

-- ML Experiments and Training History
CREATE TABLE app_data.ml_experiments (
    experiment_id  DECIMAL(18,0) IDENTITY,
    experiment_name VARCHAR(200),
    model_id       DECIMAL(18,0),
    dataset_id     DECIMAL(18,0),
    experiment_config VARCHAR(2000000),  -- JSON experiment configuration
    hyperparameters VARCHAR(2000000),   -- JSON hyperparameters used
    training_metrics VARCHAR(2000000),  -- JSON training metrics
    validation_metrics VARCHAR(2000000), -- JSON validation metrics
    training_duration DECIMAL(10,2),    -- Training time in seconds
    experiment_status VARCHAR(50),      -- 'running', 'completed', 'failed'
    error_message  VARCHAR(2000),
    started_at     TIMESTAMP,
    completed_at   TIMESTAMP,
    created_by     DECIMAL(18,0),
    
    CONSTRAINT pk_ml_experiments PRIMARY KEY (experiment_id),
    CONSTRAINT fk_ml_exp_model FOREIGN KEY (model_id) REFERENCES app_data.ml_models(model_id),
    CONSTRAINT fk_ml_exp_dataset FOREIGN KEY (dataset_id) REFERENCES app_data.ml_training_sets(dataset_id),
    CONSTRAINT fk_ml_exp_user FOREIGN KEY (created_by) REFERENCES app_data.users(user_id)
);

-- Model Predictions and Monitoring
CREATE TABLE app_data.ml_predictions (
    prediction_id  DECIMAL(18,0) IDENTITY,
    model_id       DECIMAL(18,0),
    input_features VARCHAR(2000000),  -- JSON input features
    prediction     VARCHAR(2000000),  -- JSON prediction output
    confidence     DECIMAL(5,4),       -- Prediction confidence
    actual_outcome VARCHAR(2000000),  -- JSON actual outcome (if available)
    prediction_error DECIMAL(15,6),   -- Error if actual is available
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    feedback_score DECIMAL(3,2),      -- User feedback score
    metadata       VARCHAR(2000000),  -- JSON metadata
    
    CONSTRAINT pk_ml_predictions PRIMARY KEY (prediction_id),
    CONSTRAINT fk_ml_pred_model FOREIGN KEY (model_id) REFERENCES app_data.ml_models(model_id)
);

-- Feature Store
CREATE TABLE app_data.ml_features (
    feature_id     DECIMAL(18,0) IDENTITY,
    feature_name   VARCHAR(200) NOT NULL,
    feature_type   VARCHAR(50),   -- 'numeric', 'categorical', 'text', 'datetime'
    data_type      VARCHAR(50),   -- 'INTEGER', 'DECIMAL', 'VARCHAR', 'BOOLEAN', etc.
    description    VARCHAR(1000),
    calculation_logic VARCHAR(2000000),  -- JSON or SQL for feature calculation
    dependencies   VARCHAR(2000000),    -- JSON array of dependent features/tables
    feature_group  VARCHAR(100),        -- Grouping for related features
    version        VARCHAR(50) DEFAULT '1.0',
    is_active      BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_ml_features PRIMARY KEY (feature_id),
    CONSTRAINT uk_ml_feature_name_version UNIQUE (feature_name, version)
);

-- =============================================================================
-- 5. REINFORCEMENT LEARNING INFRASTRUCTURE
-- =============================================================================

-- RL Agents and Policies
CREATE TABLE app_data.rl_agents (
    agent_id       DECIMAL(18,0) IDENTITY,
    agent_name     VARCHAR(200) NOT NULL,
    agent_type     VARCHAR(50),   -- 'q_learning', 'policy_gradient', 'actor_critic', etc.
    environment_id DECIMAL(18,0),
    policy_config  VARCHAR(2000000),  -- JSON policy configuration
    state_space    VARCHAR(2000000),  -- JSON state space definition
    action_space   VARCHAR(2000000),  -- JSON action space definition
    reward_function VARCHAR(2000000), -- JSON reward function definition
    learning_rate  DECIMAL(8,6) DEFAULT 0.001,
    discount_factor DECIMAL(4,3) DEFAULT 0.99,
    exploration_rate DECIMAL(4,3) DEFAULT 0.1,
    total_episodes DECIMAL(18,0) DEFAULT 0,
    total_rewards  DECIMAL(18,4) DEFAULT 0,
    average_reward DECIMAL(10,4) DEFAULT 0,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_training    BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT pk_rl_agents PRIMARY KEY (agent_id),
    CONSTRAINT uk_rl_agent_name UNIQUE (agent_name)
);

-- RL Episodes and Experience
CREATE TABLE app_data.rl_episodes (
    episode_id     DECIMAL(18,0) IDENTITY,
    agent_id       DECIMAL(18,0),
    episode_number DECIMAL(18,0),
    initial_state  VARCHAR(2000000),  -- JSON initial state
    final_state    VARCHAR(2000000),  -- JSON final state
    total_reward   DECIMAL(18,4),
    episode_length DECIMAL(10,0),     -- Number of steps
    episode_data   VARCHAR(2000000),  -- JSON complete episode data
    started_at     TIMESTAMP,
    completed_at   TIMESTAMP,
    
    CONSTRAINT pk_rl_episodes PRIMARY KEY (episode_id),
    CONSTRAINT fk_rl_episode_agent FOREIGN KEY (agent_id) REFERENCES app_data.rl_agents(agent_id)
);

-- RL Experience Replay Buffer
CREATE TABLE app_data.rl_experience (
    experience_id  DECIMAL(18,0) IDENTITY,
    agent_id       DECIMAL(18,0),
    state          VARCHAR(2000000),  -- JSON state
    action         VARCHAR(2000000),  -- JSON action
    reward         DECIMAL(18,4),
    next_state     VARCHAR(2000000),  -- JSON next state
    is_terminal    BOOLEAN DEFAULT FALSE,
    priority       DECIMAL(8,6) DEFAULT 1.0,  -- For prioritized experience replay
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_rl_experience PRIMARY KEY (experience_id),
    CONSTRAINT fk_rl_exp_agent FOREIGN KEY (agent_id) REFERENCES app_data.rl_agents(agent_id)
);

-- Bandit Algorithms (Multi-Armed Bandits)
CREATE TABLE app_data.bandit_arms (
    arm_id         DECIMAL(18,0) IDENTITY,
    bandit_name    VARCHAR(200),
    arm_name       VARCHAR(200),
    arm_type       VARCHAR(50),   -- 'contextual', 'non_contextual'
    alpha          DECIMAL(18,6) DEFAULT 1.0,  -- Beta distribution parameter
    beta           DECIMAL(18,6) DEFAULT 1.0,  -- Beta distribution parameter
    total_pulls    DECIMAL(18,0) DEFAULT 0,
    total_rewards  DECIMAL(18,4) DEFAULT 0,
    success_count  DECIMAL(18,0) DEFAULT 0,
    failure_count  DECIMAL(18,0) DEFAULT 0,
    confidence_radius DECIMAL(8,6),
    last_pulled    TIMESTAMP,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_bandit_arms PRIMARY KEY (arm_id),
    CONSTRAINT uk_bandit_arm UNIQUE (bandit_name, arm_name)
);

-- Thompson Sampling Records
CREATE TABLE app_data.thompson_sampling (
    sampling_id    DECIMAL(18,0) IDENTITY,
    arm_id         DECIMAL(18,0),
    context_vector VARCHAR(2000000),  -- JSON context features
    sampled_value  DECIMAL(18,6),
    selected       BOOLEAN,
    reward_received DECIMAL(18,4),
    timestamp      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_thompson_sampling PRIMARY KEY (sampling_id),
    CONSTRAINT fk_thompson_arm FOREIGN KEY (arm_id) REFERENCES app_data.bandit_arms(arm_id)
);

-- =============================================================================
-- 6. NEWS AND CONTENT PROCESSING
-- =============================================================================

-- News Articles
CREATE TABLE app_data.news_articles (
    article_id     DECIMAL(18,0) IDENTITY,
    title          VARCHAR(1000),
    content        VARCHAR(2000000),
    summary        VARCHAR(2000),
    url            VARCHAR(1000),
    source         VARCHAR(200),
    category       VARCHAR(100),
    subcategory    VARCHAR(100),
    language       VARCHAR(10) DEFAULT 'en',
    publish_date   TIMESTAMP,
    fetch_date     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sentiment_score DECIMAL(4,3),    -- -1 to +1
    sentiment_label VARCHAR(20),     -- 'positive', 'negative', 'neutral'
    importance_score DECIMAL(5,2) DEFAULT 0,
    entities_extracted VARCHAR(2000000),  -- JSON extracted entities
    keywords       VARCHAR(2000000),      -- JSON keywords
    processing_status VARCHAR(50) DEFAULT 'pending',
    
    CONSTRAINT pk_news_articles PRIMARY KEY (article_id)
);

CREATE INDEX idx_news_date ON app_data.news_articles (publish_date);
CREATE INDEX idx_news_category ON app_data.news_articles (category, subcategory);
CREATE INDEX idx_news_sentiment ON app_data.news_articles (sentiment_score);

-- News Processing Status
CREATE TABLE app_data.news_processing_status (
    status_id      DECIMAL(18,0) IDENTITY,
    source         VARCHAR(100),
    category       VARCHAR(100),
    last_fetch     TIMESTAMP,
    articles_fetched DECIMAL(10,0) DEFAULT 0,
    articles_processed DECIMAL(10,0) DEFAULT 0,
    errors_encountered DECIMAL(10,0) DEFAULT 0,
    status         VARCHAR(50),   -- 'active', 'paused', 'error'
    next_fetch     TIMESTAMP,
    configuration  VARCHAR(2000000),  -- JSON source configuration
    
    CONSTRAINT pk_news_processing_status PRIMARY KEY (status_id),
    CONSTRAINT uk_news_source_category UNIQUE (source, category)
);

-- =============================================================================
-- 7. FINANCIAL ANALYTICS TABLES
-- =============================================================================

-- Risk Metrics
CREATE TABLE app_data.risk_metrics (
    metric_id      DECIMAL(18,0) IDENTITY,
    entity_id      VARCHAR(200),   -- Portfolio, security, etc.
    entity_type    VARCHAR(50),    -- 'portfolio', 'security', 'market'
    metric_name    VARCHAR(100),   -- 'var', 'sharpe_ratio', 'beta', etc.
    metric_value   DECIMAL(18,6),
    confidence_level DECIMAL(4,3), -- For VaR, etc.
    calculation_date DATE,
    time_horizon   DECIMAL(10,0),  -- Days
    methodology    VARCHAR(100),   -- 'historical', 'parametric', 'monte_carlo'
    metadata       VARCHAR(2000000), -- JSON additional parameters
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_risk_metrics PRIMARY KEY (metric_id)
);

CREATE INDEX idx_risk_entity ON app_data.risk_metrics (entity_id, entity_type);
CREATE INDEX idx_risk_date ON app_data.risk_metrics (calculation_date);

-- Performance Attribution
CREATE TABLE app_data.performance_attribution (
    attribution_id DECIMAL(18,0) IDENTITY,
    portfolio_id   DECIMAL(18,0),
    period_start   DATE,
    period_end     DATE,
    total_return   DECIMAL(10,6),
    benchmark_return DECIMAL(10,6),
    active_return  DECIMAL(10,6),
    security_selection DECIMAL(10,6),
    sector_allocation DECIMAL(10,6),
    interaction_effect DECIMAL(10,6),
    attribution_details VARCHAR(2000000), -- JSON detailed attribution
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_performance_attribution PRIMARY KEY (attribution_id),
    CONSTRAINT fk_perf_attr_portfolio FOREIGN KEY (portfolio_id) REFERENCES app_data.portfolios(portfolio_id)
);

-- Stress Test Scenarios
CREATE TABLE app_data.stress_scenarios (
    scenario_id    DECIMAL(18,0) IDENTITY,
    scenario_name  VARCHAR(200),
    scenario_type  VARCHAR(50),    -- 'historical', 'hypothetical', 'regulatory'
    description    VARCHAR(1000),
    stress_factors VARCHAR(2000000), -- JSON stress factors
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by     DECIMAL(18,0),
    is_active      BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT pk_stress_scenarios PRIMARY KEY (scenario_id),
    CONSTRAINT fk_stress_scenario_user FOREIGN KEY (created_by) REFERENCES app_data.users(user_id)
);

-- Stress Test Results
CREATE TABLE app_data.stress_test_results (
    result_id      DECIMAL(18,0) IDENTITY,
    scenario_id    DECIMAL(18,0),
    portfolio_id   DECIMAL(18,0),
    test_date      DATE,
    portfolio_value_base DECIMAL(18,2),
    portfolio_value_stressed DECIMAL(18,2),
    absolute_loss  DECIMAL(18,2),
    percentage_loss DECIMAL(8,4),
    var_breach     BOOLEAN,
    detailed_results VARCHAR(2000000), -- JSON detailed results
    
    CONSTRAINT pk_stress_test_results PRIMARY KEY (result_id),
    CONSTRAINT fk_stress_result_scenario FOREIGN KEY (scenario_id) REFERENCES app_data.stress_scenarios(scenario_id),
    CONSTRAINT fk_stress_result_portfolio FOREIGN KEY (portfolio_id) REFERENCES app_data.portfolios(portfolio_id)
);

-- =============================================================================
-- 8. DATA QUALITY AND MONITORING
-- =============================================================================

-- Data Quality Metrics
CREATE TABLE app_data.data_quality_metrics (
    quality_id     DECIMAL(18,0) IDENTITY,
    table_name     VARCHAR(200),
    column_name    VARCHAR(200),
    metric_type    VARCHAR(50),    -- 'completeness', 'accuracy', 'consistency', etc.
    metric_value   DECIMAL(8,4),   -- 0-100 percentage or 0-1 ratio
    threshold      DECIMAL(8,4),
    status         VARCHAR(20),    -- 'pass', 'warning', 'fail'
    measurement_date DATE,
    details        VARCHAR(2000000), -- JSON details
    
    CONSTRAINT pk_data_quality_metrics PRIMARY KEY (quality_id)
);

CREATE INDEX idx_dq_table ON app_data.data_quality_metrics (table_name, column_name);
CREATE INDEX idx_dq_date ON app_data.data_quality_metrics (measurement_date);

-- Data Lineage
CREATE TABLE app_data.data_lineage (
    lineage_id     DECIMAL(18,0) IDENTITY,
    source_table   VARCHAR(200),
    source_column  VARCHAR(200),
    target_table   VARCHAR(200),
    target_column  VARCHAR(200),
    transformation VARCHAR(2000000), -- JSON transformation logic
    dependency_type VARCHAR(50),     -- 'direct', 'calculated', 'aggregated'
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_data_lineage PRIMARY KEY (lineage_id)
);

-- =============================================================================
-- 9. SYSTEM CONFIGURATION AND METADATA
-- =============================================================================

-- System Configuration
CREATE TABLE app_data.system_config (
    config_id      DECIMAL(18,0) IDENTITY,
    config_key     VARCHAR(200) NOT NULL,
    config_value   VARCHAR(2000000),
    config_type    VARCHAR(50),    -- 'string', 'number', 'boolean', 'json'
    description    VARCHAR(1000),
    is_sensitive   BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by     DECIMAL(18,0),
    
    CONSTRAINT pk_system_config PRIMARY KEY (config_id),
    CONSTRAINT uk_system_config_key UNIQUE (config_key),
    CONSTRAINT fk_system_config_user FOREIGN KEY (updated_by) REFERENCES app_data.users(user_id)
);

-- Audit Log
CREATE TABLE app_data.audit_log (
    audit_id       DECIMAL(18,0) IDENTITY,
    table_name     VARCHAR(200),
    record_id      VARCHAR(100),
    action_type    VARCHAR(20),    -- 'INSERT', 'UPDATE', 'DELETE'
    old_values     VARCHAR(2000000), -- JSON old values
    new_values     VARCHAR(2000000), -- JSON new values
    changed_by     DECIMAL(18,0),
    changed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address     VARCHAR(50),
    user_agent     VARCHAR(500),
    
    CONSTRAINT pk_audit_log PRIMARY KEY (audit_id),
    CONSTRAINT fk_audit_user FOREIGN KEY (changed_by) REFERENCES app_data.users(user_id)
);

CREATE INDEX idx_audit_table ON app_data.audit_log (table_name, record_id);
CREATE INDEX idx_audit_date ON app_data.audit_log (changed_at);

-- =============================================================================
-- 10. INITIAL DATA AND CONFIGURATION
-- =============================================================================

-- Insert default namespaces for RDF
INSERT INTO app_data.rdf_namespaces (prefix, namespace_uri, description, is_default) VALUES
('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#', 'RDF Schema', FALSE),
('rdfs', 'http://www.w3.org/2000/01/rdf-schema#', 'RDF Schema', FALSE),
('owl', 'http://www.w3.org/2002/07/owl#', 'OWL Ontology', FALSE),
('foaf', 'http://xmlns.com/foaf/0.1/', 'Friend of a Friend', FALSE),
('fin', 'http://finsight.ai/ontology/finance#', 'Financial Ontology', TRUE),
('news', 'http://finsight.ai/ontology/news#', 'News Ontology', FALSE);

-- Insert default system configuration
INSERT INTO app_data.system_config (config_key, config_value, config_type, description) VALUES
('ml.default_train_test_split', '0.8', 'number', 'Default train/test split ratio'),
('ml.default_cross_validation_folds', '5', 'number', 'Default number of CV folds'),
('ml.model_performance_threshold', '0.8', 'number', 'Minimum acceptable model performance'),
('news.fetch_interval_minutes', '60', 'number', 'News fetching interval in minutes'),
('news.sentiment_confidence_threshold', '0.7', 'number', 'Minimum confidence for sentiment classification'),
('rdf.max_triples_per_insert', '1000', 'number', 'Maximum triples per batch insert'),
('risk.var_confidence_level', '0.95', 'number', 'Default VaR confidence level'),
('risk.stress_test_scenarios', '["market_crash", "interest_rate_shock", "credit_crisis"]', 'json', 'Default stress test scenarios');

-- Create default admin user
INSERT INTO app_data.users (username, email, user_type, is_active) VALUES
('admin', 'admin@finsight.ai', 'admin', TRUE),
('system', 'system@finsight.ai', 'admin', TRUE);

-- =============================================================================
-- 11. VIEWS FOR COMMON QUERIES
-- =============================================================================

-- RDF Entity Summary View
CREATE VIEW app_data.v_entity_summary AS
SELECT 
    e.entity_id,
    e.entity_uri,
    e.entity_type,
    e.entity_label,
    e.frequency,
    e.importance,
    COUNT(r.relationship_id) as relationship_count,
    e.last_updated
FROM app_data.rdf_entities e
LEFT JOIN app_data.rdf_relationships r ON e.entity_id = r.entity1_id OR e.entity_id = r.entity2_id
WHERE e.entity_id IS NOT NULL
GROUP BY e.entity_id, e.entity_uri, e.entity_type, e.entity_label, e.frequency, e.importance, e.last_updated;

-- Portfolio Performance View
CREATE VIEW app_data.v_portfolio_performance AS
SELECT 
    p.portfolio_id,
    p.portfolio_name,
    p.total_value,
    p.base_currency,
    COUNT(t.trans_id) as transaction_count,
    SUM(CASE WHEN t.transaction_type = 'buy' THEN t.amount ELSE 0 END) as total_invested,
    SUM(CASE WHEN t.transaction_type = 'sell' THEN t.amount ELSE 0 END) as total_divested,
    MAX(t.trans_date) as last_transaction_date
FROM app_data.portfolios p
LEFT JOIN app_data.transactions t ON p.portfolio_id = t.portfolio_id
GROUP BY p.portfolio_id, p.portfolio_name, p.total_value, p.base_currency;

-- Model Performance Summary View
CREATE VIEW app_data.v_model_performance AS
SELECT 
    m.model_id,
    m.model_name,
    m.model_type,
    m.is_production,
    COUNT(p.prediction_id) as total_predictions,
    AVG(p.confidence) as avg_confidence,
    AVG(ABS(p.prediction_error)) as avg_absolute_error,
    MAX(p.prediction_date) as last_prediction_date
FROM app_data.ml_models m
LEFT JOIN app_data.ml_predictions p ON m.model_id = p.model_id
WHERE m.is_active = TRUE
GROUP BY m.model_id, m.model_name, m.model_type, m.is_production;

-- Data Quality Dashboard View
CREATE VIEW app_data.v_data_quality_dashboard AS
SELECT 
    table_name,
    COUNT(*) as total_metrics,
    SUM(CASE WHEN status = 'pass' THEN 1 ELSE 0 END) as passed_metrics,
    SUM(CASE WHEN status = 'warning' THEN 1 ELSE 0 END) as warning_metrics,
    SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) as failed_metrics,
    AVG(metric_value) as avg_quality_score,
    MAX(measurement_date) as last_measured
FROM app_data.data_quality_metrics
GROUP BY table_name;

COMMENT ON SCHEMA app_data IS 'Complete FinSight application schema with RDF knowledge graph, ML infrastructure, financial analytics, and production monitoring capabilities';