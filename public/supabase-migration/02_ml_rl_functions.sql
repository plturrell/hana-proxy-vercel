-- Supabase PostgreSQL Migration: ML & Reinforcement Learning Functions
-- Converted from Exasol Lua UDFs (Functions 10-18)

-- 10. Q-LEARNING UPDATE FUNCTION
CREATE OR REPLACE FUNCTION app_data.update_q_value(
    current_q DOUBLE PRECISION,
    learning_rate DOUBLE PRECISION,
    discount_factor DOUBLE PRECISION,
    reward DOUBLE PRECISION,
    max_next_q DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
BEGIN
    -- Q-learning update formula: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
    RETURN current_q + learning_rate * (reward + discount_factor * max_next_q - current_q);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 11. THOMPSON SAMPLING BETA UPDATE
CREATE OR REPLACE FUNCTION app_data.thompson_sampling_update(
    alpha DOUBLE PRECISION,
    beta DOUBLE PRECISION,
    reward INTEGER  -- 1 for success, 0 for failure
) RETURNS JSONB AS $$
BEGIN
    -- Update beta distribution parameters
    IF reward = 1 THEN
        alpha := alpha + 1;
    ELSE
        beta := beta + 1;
    END IF;
    
    RETURN jsonb_build_object(
        'alpha', alpha,
        'beta', beta,
        'estimated_mean', alpha / (alpha + beta)
    );
END;
$$ LANGUAGE plpgsql;

-- 12. CALCULATE EXPLORATION PROBABILITY (EPSILON-GREEDY)
CREATE OR REPLACE FUNCTION app_data.calculate_epsilon(
    episode_number INTEGER,
    min_epsilon DOUBLE PRECISION DEFAULT 0.01,
    decay_rate DOUBLE PRECISION DEFAULT 0.995
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    epsilon DOUBLE PRECISION;
BEGIN
    -- Exponential decay of exploration rate
    epsilon := GREATEST(min_epsilon, power(decay_rate, episode_number));
    RETURN epsilon;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 13. UPPER CONFIDENCE BOUND (UCB) CALCULATION
CREATE OR REPLACE FUNCTION app_data.calculate_ucb(
    average_reward DOUBLE PRECISION,
    num_selections INTEGER,
    total_rounds INTEGER,
    confidence_level DOUBLE PRECISION DEFAULT 2.0
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    exploration_term DOUBLE PRECISION;
BEGIN
    IF num_selections = 0 THEN
        RETURN 999999.0;  -- Return high value for unselected actions
    END IF;
    
    -- UCB formula: average_reward + c * sqrt(ln(total_rounds) / num_selections)
    exploration_term := confidence_level * sqrt(ln(total_rounds::DOUBLE PRECISION) / num_selections);
    
    RETURN average_reward + exploration_term;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 14. POLICY GRADIENT UPDATE
CREATE OR REPLACE FUNCTION app_data.update_policy_gradient(
    current_weights JSONB,
    gradients JSONB,
    learning_rate DOUBLE PRECISION
) RETURNS JSONB AS $$
DECLARE
    updated_weights JSONB := '[]'::jsonb;
    i INTEGER;
    weight DOUBLE PRECISION;
    gradient DOUBLE PRECISION;
BEGIN
    FOR i IN 0..jsonb_array_length(current_weights)-1 LOOP
        weight := (current_weights->i)::DOUBLE PRECISION;
        gradient := (gradients->i)::DOUBLE PRECISION;
        
        -- Gradient ascent update
        weight := weight + learning_rate * gradient;
        
        updated_weights := updated_weights || to_jsonb(weight);
    END LOOP;
    
    RETURN updated_weights;
END;
$$ LANGUAGE plpgsql;

-- 15. ADVANTAGE ACTOR-CRITIC (A2C) VALUE ESTIMATION
CREATE OR REPLACE FUNCTION app_data.calculate_advantage(
    rewards JSONB,
    values JSONB,
    gamma DOUBLE PRECISION DEFAULT 0.99
) RETURNS JSONB AS $$
DECLARE
    advantages JSONB := '[]'::jsonb;
    i INTEGER;
    n INTEGER;
    discounted_return DOUBLE PRECISION;
    j INTEGER;
    reward DOUBLE PRECISION;
    value DOUBLE PRECISION;
BEGIN
    n := jsonb_array_length(rewards);
    
    -- Calculate advantages using TD error
    FOR i IN 0..n-1 LOOP
        discounted_return := 0;
        
        -- Calculate discounted return from time i
        FOR j IN i..n-1 LOOP
            reward := (rewards->j)::DOUBLE PRECISION;
            discounted_return := discounted_return + power(gamma, j - i) * reward;
        END LOOP;
        
        value := (values->i)::DOUBLE PRECISION;
        advantages := advantages || to_jsonb(discounted_return - value);
    END LOOP;
    
    RETURN advantages;
END;
$$ LANGUAGE plpgsql;

-- 16. NEURAL NETWORK ACTIVATION FUNCTIONS
CREATE OR REPLACE FUNCTION app_data.activation_relu(x DOUBLE PRECISION) 
RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN GREATEST(0, x);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION app_data.activation_sigmoid(x DOUBLE PRECISION) 
RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN 1.0 / (1.0 + exp(-x));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION app_data.activation_tanh(x DOUBLE PRECISION) 
RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN tanh(x);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 17. FEATURE SCALING (NORMALIZATION)
CREATE OR REPLACE FUNCTION app_data.normalize_features(
    features JSONB,
    min_values JSONB,
    max_values JSONB
) RETURNS JSONB AS $$
DECLARE
    normalized JSONB := '[]'::jsonb;
    i INTEGER;
    value DOUBLE PRECISION;
    min_val DOUBLE PRECISION;
    max_val DOUBLE PRECISION;
    normalized_val DOUBLE PRECISION;
BEGIN
    FOR i IN 0..jsonb_array_length(features)-1 LOOP
        value := (features->i)::DOUBLE PRECISION;
        min_val := (min_values->i)::DOUBLE PRECISION;
        max_val := (max_values->i)::DOUBLE PRECISION;
        
        IF max_val - min_val > 0 THEN
            normalized_val := (value - min_val) / (max_val - min_val);
        ELSE
            normalized_val := 0.5;  -- Default for constant features
        END IF;
        
        normalized := normalized || to_jsonb(normalized_val);
    END LOOP;
    
    RETURN normalized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 18. CALCULATE REWARD FOR TRADING ACTION
CREATE OR REPLACE FUNCTION app_data.calculate_trading_reward(
    action TEXT,  -- 'BUY', 'SELL', 'HOLD'
    price_before DOUBLE PRECISION,
    price_after DOUBLE PRECISION,
    position_size DOUBLE PRECISION DEFAULT 1.0,
    transaction_cost DOUBLE PRECISION DEFAULT 0.001
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    price_change DOUBLE PRECISION;
    reward DOUBLE PRECISION;
BEGIN
    price_change := price_after - price_before;
    
    CASE action
        WHEN 'BUY' THEN
            -- Reward for buying = price increase minus transaction cost
            reward := position_size * price_change - transaction_cost;
        WHEN 'SELL' THEN
            -- Reward for selling = negative of price increase minus transaction cost
            reward := -position_size * price_change - transaction_cost;
        WHEN 'HOLD' THEN
            -- No reward or penalty for holding (except opportunity cost)
            reward := 0;
        ELSE
            reward := 0;
    END CASE;
    
    RETURN reward;
END;
$$ LANGUAGE plpgsql;

-- Create tables for RL state management
CREATE TABLE IF NOT EXISTS app_data.rl_q_table (
    id SERIAL PRIMARY KEY,
    state_key TEXT NOT NULL,
    action TEXT NOT NULL,
    q_value DOUBLE PRECISION DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(state_key, action)
);

CREATE TABLE IF NOT EXISTS app_data.rl_episodes (
    id SERIAL PRIMARY KEY,
    episode_number INTEGER NOT NULL,
    total_reward DOUBLE PRECISION,
    steps_taken INTEGER,
    epsilon_used DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_data.ml_model_weights (
    id SERIAL PRIMARY KEY,
    model_name TEXT NOT NULL,
    layer_name TEXT NOT NULL,
    weights JSONB NOT NULL,
    biases JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_name, layer_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rl_q_table_state_action ON app_data.rl_q_table(state_key, action);
CREATE INDEX IF NOT EXISTS idx_rl_episodes_number ON app_data.rl_episodes(episode_number);
CREATE INDEX IF NOT EXISTS idx_ml_model_weights_name ON app_data.ml_model_weights(model_name);