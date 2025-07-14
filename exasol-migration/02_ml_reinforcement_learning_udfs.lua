-- Exasol LUA UDF Migration: Machine Learning & Reinforcement Learning Functions
-- Migrated from HANA ML/RL stored procedures

-- 1. LINUCB BANDIT ALGORITHM
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.update_linucb_arm(
    arm_id VARCHAR(100),
    context_features_json VARCHAR(2000000),
    reward DOUBLE,
    alpha DOUBLE  -- Exploration parameter
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local features = json.decode(ctx.context_features_json)
    local d = #features  -- Feature dimension
    
    -- Initialize A matrix (d x d) and b vector (d x 1) if needed
    -- For simplicity, we'll return updated parameters as JSON
    local alpha = ctx.alpha or 1.0
    
    -- LinUCB update formulas would go here
    -- This is a simplified version for demonstration
    local result = {
        arm_id = ctx.arm_id,
        timestamp = os.time(),
        reward = ctx.reward,
        alpha = alpha,
        features = features,
        confidence_bound = alpha * math.sqrt(d)  -- Simplified UCB
    }
    
    return json.encode(result)
end
/

-- 2. NEURAL BANDIT DECISION RECORDING
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.record_neural_bandit_decision(
    user_id VARCHAR(100),
    arm_selected VARCHAR(100),
    context_vector_json VARCHAR(2000000),
    predicted_reward DOUBLE,
    actual_reward DOUBLE
) RETURNS VARCHAR(1000) AS

function run(ctx)
    local json = require("json")
    local context = json.decode(ctx.context_vector_json)
    
    -- Calculate prediction error for learning
    local prediction_error = ctx.actual_reward - ctx.predicted_reward
    
    local decision_record = {
        user_id = ctx.user_id,
        arm_selected = ctx.arm_selected,
        context_dim = #context,
        prediction_error = prediction_error,
        timestamp = os.time(),
        exploration_bonus = math.abs(prediction_error) * 0.1
    }
    
    return json.encode(decision_record)
end
/

-- 3. COLLABORATIVE LEARNING UPDATE
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.update_collaborative_learning(
    user_id VARCHAR(100),
    item_id VARCHAR(100),
    interaction_type VARCHAR(50),
    rating DOUBLE,
    user_features_json VARCHAR(2000000),
    item_features_json VARCHAR(2000000)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local user_features = json.decode(ctx.user_features_json or "{}")
    local item_features = json.decode(ctx.item_features_json or "{}")
    
    -- Simple collaborative filtering update
    local learning_rate = 0.01
    local regularization = 0.001
    
    -- Update user and item embeddings (simplified)
    local prediction_error = ctx.rating - 3.0  -- Assuming 5-point scale, 3 is neutral
    
    local update_info = {
        user_id = ctx.user_id,
        item_id = ctx.item_id,
        interaction_type = ctx.interaction_type,
        rating = ctx.rating,
        prediction_error = prediction_error,
        learning_rate = learning_rate,
        timestamp = os.time(),
        user_embedding_update = prediction_error * learning_rate,
        item_embedding_update = prediction_error * learning_rate
    }
    
    return json.encode(update_info)
end
/

-- 4. ADAPTIVE CACHE RECOMMENDATION
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.get_cache_recommendations(
    access_pattern_json VARCHAR(2000000),
    cache_size DECIMAL(10,0),
    prediction_window DECIMAL(10,0)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local access_pattern = json.decode(ctx.access_pattern_json)
    
    -- Frequency-based caching with recency weighting
    local item_scores = {}
    local current_time = os.time()
    
    for i = 1, #access_pattern do
        local access = access_pattern[i]
        local item_id = access.item_id
        local access_time = access.timestamp or current_time
        local recency_weight = math.exp(-(current_time - access_time) / 3600)  -- Hour decay
        
        if not item_scores[item_id] then
            item_scores[item_id] = 0
        end
        item_scores[item_id] = item_scores[item_id] + recency_weight
    end
    
    -- Sort by score and return top items
    local recommendations = {}
    for item_id, score in pairs(item_scores) do
        table.insert(recommendations, {item_id = item_id, score = score})
    end
    
    table.sort(recommendations, function(a, b) return a.score > b.score end)
    
    -- Return top N recommendations
    local top_recommendations = {}
    local max_recommendations = math.min(ctx.cache_size or 10, #recommendations)
    
    for i = 1, max_recommendations do
        table.insert(top_recommendations, recommendations[i])
    end
    
    return json.encode({
        recommendations = top_recommendations,
        cache_size = ctx.cache_size,
        prediction_window = ctx.prediction_window,
        total_items_analyzed = #access_pattern
    })
end
/

-- 5. MODEL PERFORMANCE MONITORING
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.calculate_model_performance(
    predictions_json VARCHAR(2000000),
    actuals_json VARCHAR(2000000),
    model_type VARCHAR(50)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local predictions = json.decode(ctx.predictions_json)
    local actuals = json.decode(ctx.actuals_json)
    
    if #predictions ~= #actuals or #predictions == 0 then
        return json.encode({error = "Mismatched or empty arrays"})
    end
    
    local n = #predictions
    local metrics = {}
    
    if ctx.model_type == "regression" then
        -- Regression metrics
        local sum_squared_error = 0
        local sum_absolute_error = 0
        local sum_actual = 0
        local sum_actual_squared = 0
        
        for i = 1, n do
            local pred = tonumber(predictions[i])
            local actual = tonumber(actuals[i])
            
            if pred and actual then
                local error = actual - pred
                sum_squared_error = sum_squared_error + error * error
                sum_absolute_error = sum_absolute_error + math.abs(error)
                sum_actual = sum_actual + actual
                sum_actual_squared = sum_actual_squared + actual * actual
            end
        end
        
        local mse = sum_squared_error / n
        local rmse = math.sqrt(mse)
        local mae = sum_absolute_error / n
        
        -- R-squared calculation
        local mean_actual = sum_actual / n
        local ss_tot = sum_actual_squared - n * mean_actual * mean_actual
        local r_squared = 1 - (sum_squared_error / ss_tot)
        
        metrics = {
            model_type = "regression",
            mse = mse,
            rmse = rmse,
            mae = mae,
            r_squared = r_squared,
            n_samples = n
        }
        
    elseif ctx.model_type == "classification" then
        -- Classification metrics
        local true_positives = 0
        local false_positives = 0
        local true_negatives = 0
        local false_negatives = 0
        
        for i = 1, n do
            local pred = tonumber(predictions[i])
            local actual = tonumber(actuals[i])
            
            if pred and actual then
                if pred >= 0.5 and actual >= 0.5 then
                    true_positives = true_positives + 1
                elseif pred >= 0.5 and actual < 0.5 then
                    false_positives = false_positives + 1
                elseif pred < 0.5 and actual < 0.5 then
                    true_negatives = true_negatives + 1
                else
                    false_negatives = false_negatives + 1
                end
            end
        end
        
        local precision = true_positives / (true_positives + false_positives)
        local recall = true_positives / (true_positives + false_negatives)
        local f1_score = 2 * precision * recall / (precision + recall)
        local accuracy = (true_positives + true_negatives) / n
        
        metrics = {
            model_type = "classification",
            accuracy = accuracy,
            precision = precision,
            recall = recall,
            f1_score = f1_score,
            true_positives = true_positives,
            false_positives = false_positives,
            true_negatives = true_negatives,
            false_negatives = false_negatives,
            n_samples = n
        }
    end
    
    metrics.timestamp = os.time()
    return json.encode(metrics)
end
/

-- 6. FEATURE IMPORTANCE CALCULATION
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.calculate_feature_importance(
    feature_matrix_json VARCHAR(2000000),
    target_vector_json VARCHAR(2000000),
    method VARCHAR(50)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local feature_matrix = json.decode(ctx.feature_matrix_json)
    local target_vector = json.decode(ctx.target_vector_json)
    
    if #feature_matrix == 0 or #feature_matrix ~= #target_vector then
        return json.encode({error = "Invalid input dimensions"})
    end
    
    local n_samples = #feature_matrix
    local n_features = #feature_matrix[1]
    local importance_scores = {}
    
    if ctx.method == "correlation" then
        -- Calculate correlation-based feature importance
        for j = 1, n_features do
            local feature_values = {}
            for i = 1, n_samples do
                table.insert(feature_values, feature_matrix[i][j])
            end
            
            -- Calculate correlation with target
            local correlation = calculate_correlation(feature_values, target_vector)
            table.insert(importance_scores, {
                feature_index = j,
                importance = math.abs(correlation),
                method = "correlation"
            })
        end
        
    elseif ctx.method == "variance" then
        -- Calculate variance-based feature importance
        for j = 1, n_features do
            local sum = 0
            local sum_sq = 0
            
            for i = 1, n_samples do
                local val = feature_matrix[i][j]
                sum = sum + val
                sum_sq = sum_sq + val * val
            end
            
            local mean = sum / n_samples
            local variance = (sum_sq - sum * sum / n_samples) / (n_samples - 1)
            
            table.insert(importance_scores, {
                feature_index = j,
                importance = variance,
                method = "variance"
            })
        end
    end
    
    -- Sort by importance (descending)
    table.sort(importance_scores, function(a, b) return a.importance > b.importance end)
    
    return json.encode({
        feature_importance = importance_scores,
        method = ctx.method,
        n_features = n_features,
        n_samples = n_samples,
        timestamp = os.time()
    })
end

-- Helper function for correlation calculation
function calculate_correlation(x_values, y_values)
    local n = #x_values
    if n ~= #y_values or n < 2 then
        return 0
    end
    
    local sum_x, sum_y, sum_xx, sum_yy, sum_xy = 0, 0, 0, 0, 0
    
    for i = 1, n do
        local x, y = x_values[i], y_values[i]
        sum_x = sum_x + x
        sum_y = sum_y + y
        sum_xx = sum_xx + x * x
        sum_yy = sum_yy + y * y
        sum_xy = sum_xy + x * y
    end
    
    local numerator = n * sum_xy - sum_x * sum_y
    local denominator = math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y))
    
    if denominator == 0 then
        return 0
    end
    
    return numerator / denominator
end
/

-- 7. SYNTHETIC DATA GENERATION
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.generate_synthetic_data(
    n_samples DECIMAL(10,0),
    n_features DECIMAL(10,0),
    distribution_type VARCHAR(50),
    parameters_json VARCHAR(2000000)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local params = json.decode(ctx.parameters_json or "{}")
    
    local synthetic_data = {}
    local n_samples = ctx.n_samples or 100
    local n_features = ctx.n_features or 5
    
    -- Simple random number generator (linear congruential)
    local seed = os.time()
    local function random()
        seed = (seed * 1103515245 + 12345) % 2147483648
        return seed / 2147483648
    end
    
    if ctx.distribution_type == "normal" then
        local mean = params.mean or 0
        local std_dev = params.std_dev or 1
        
        for i = 1, n_samples do
            local sample = {}
            for j = 1, n_features do
                -- Box-Muller transformation for normal distribution
                local u1, u2 = random(), random()
                local z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
                local value = mean + std_dev * z
                table.insert(sample, value)
            end
            table.insert(synthetic_data, sample)
        end
        
    elseif ctx.distribution_type == "uniform" then
        local min_val = params.min or 0
        local max_val = params.max or 1
        local range = max_val - min_val
        
        for i = 1, n_samples do
            local sample = {}
            for j = 1, n_features do
                local value = min_val + range * random()
                table.insert(sample, value)
            end
            table.insert(synthetic_data, sample)
        end
    end
    
    return json.encode({
        synthetic_data = synthetic_data,
        n_samples = n_samples,
        n_features = n_features,
        distribution_type = ctx.distribution_type,
        parameters = params,
        timestamp = os.time()
    })
end
/