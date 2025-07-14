-- Exasol LUA UDF Migration: Core Analytics Functions
-- Migrated from HANA stored procedures

-- 1. PEARSON CORRELATION CALCULATION
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.calculate_pearson_correlation(
    x_values VARCHAR(2000000),  -- JSON array of x values
    y_values VARCHAR(2000000)   -- JSON array of y values
) RETURNS DOUBLE AS

function run(ctx)
    -- Parse JSON arrays
    local json = require("json")
    local x_data = json.decode(ctx.x_values)
    local y_data = json.decode(ctx.y_values)
    
    if #x_data ~= #y_data or #x_data < 2 then
        return nil
    end
    
    local n = #x_data
    local sum_x, sum_y, sum_xx, sum_yy, sum_xy = 0, 0, 0, 0, 0
    
    -- Calculate sums
    for i = 1, n do
        local x, y = tonumber(x_data[i]), tonumber(y_data[i])
        if x and y then
            sum_x = sum_x + x
            sum_y = sum_y + y
            sum_xx = sum_xx + x * x
            sum_yy = sum_yy + y * y
            sum_xy = sum_xy + x * y
        end
    end
    
    -- Calculate correlation
    local numerator = n * sum_xy - sum_x * sum_y
    local denominator = math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y))
    
    if denominator == 0 then
        return 0
    end
    
    return numerator / denominator
end
/

-- 2. VALUE AT RISK CALCULATION
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.calculate_var(
    returns_json VARCHAR(2000000),  -- JSON array of returns
    confidence_level DOUBLE         -- Confidence level (e.g., 0.95)
) RETURNS DOUBLE AS

function run(ctx)
    local json = require("json")
    local returns = json.decode(ctx.returns_json)
    
    if #returns < 10 then
        return nil  -- Insufficient data
    end
    
    -- Convert to numbers and sort
    local numeric_returns = {}
    for i = 1, #returns do
        local val = tonumber(returns[i])
        if val then
            table.insert(numeric_returns, val)
        end
    end
    
    table.sort(numeric_returns)
    
    -- Calculate VaR using historical simulation
    local percentile_index = math.floor((1 - ctx.confidence_level) * #numeric_returns)
    if percentile_index < 1 then
        percentile_index = 1
    end
    
    return -numeric_returns[percentile_index]  -- VaR is positive loss
end
/

-- 3. THOMPSON SAMPLING UPDATE
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.update_thompson_sampling(
    arm_id VARCHAR(100),
    reward DOUBLE,
    context_json VARCHAR(2000000)
) RETURNS VARCHAR(1000) AS

function run(ctx)
    local json = require("json")
    local context = json.decode(ctx.context_json or "{}")
    
    -- Thompson Sampling Beta distribution update
    local alpha_prior = context.alpha or 1
    local beta_prior = context.beta or 1
    
    -- Update parameters based on reward (0 or 1)
    local alpha_new, beta_new
    if ctx.reward > 0.5 then
        alpha_new = alpha_prior + 1
        beta_new = beta_prior
    else
        alpha_new = alpha_prior
        beta_new = beta_prior + 1
    end
    
    -- Return updated parameters as JSON
    local result = {
        arm_id = ctx.arm_id,
        alpha = alpha_new,
        beta = beta_new,
        timestamp = os.time(),
        total_trials = (context.total_trials or 0) + 1
    }
    
    return json.encode(result)
end
/

-- 4. SENTIMENT ANALYSIS SCORING
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.calculate_sentiment_score(
    text VARCHAR(2000000),
    positive_keywords VARCHAR(10000),
    negative_keywords VARCHAR(10000)
) RETURNS DOUBLE AS

function run(ctx)
    if not ctx.text or ctx.text == "" then
        return 0
    end
    
    local text_lower = string.lower(ctx.text)
    local pos_words = {}
    local neg_words = {}
    
    -- Parse keyword lists (comma-separated)
    for word in string.gmatch(ctx.positive_keywords or "", "([^,]+)") do
        pos_words[string.lower(word:match("^%s*(.-)%s*$"))] = true
    end
    
    for word in string.gmatch(ctx.negative_keywords or "", "([^,]+)") do
        neg_words[string.lower(word:match("^%s*(.-)%s*$"))] = true
    end
    
    local pos_count, neg_count, total_words = 0, 0, 0
    
    -- Count sentiment words
    for word in string.gmatch(text_lower, "%w+") do
        total_words = total_words + 1
        if pos_words[word] then
            pos_count = pos_count + 1
        elseif neg_words[word] then
            neg_count = neg_count + 1
        end
    end
    
    if total_words == 0 then
        return 0
    end
    
    -- Calculate sentiment score (-1 to +1)
    local sentiment_words = pos_count + neg_count
    if sentiment_words == 0 then
        return 0
    end
    
    return (pos_count - neg_count) / total_words
end
/

-- 5. PORTFOLIO RISK CALCULATION
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.calculate_portfolio_risk(
    weights_json VARCHAR(2000000),      -- Portfolio weights
    covariance_matrix_json VARCHAR(2000000)  -- Covariance matrix
) RETURNS DOUBLE AS

function run(ctx)
    local json = require("json")
    local weights = json.decode(ctx.weights_json)
    local cov_matrix = json.decode(ctx.covariance_matrix_json)
    
    local n = #weights
    if n ~= #cov_matrix or n == 0 then
        return nil
    end
    
    -- Calculate portfolio variance: w' * Σ * w
    local portfolio_variance = 0
    
    for i = 1, n do
        for j = 1, n do
            portfolio_variance = portfolio_variance + 
                weights[i] * weights[j] * (cov_matrix[i][j] or 0)
        end
    end
    
    -- Return portfolio standard deviation (risk)
    return math.sqrt(math.max(0, portfolio_variance))
end
/

-- 6. TIME SERIES TREND DETECTION
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.detect_trend(
    values_json VARCHAR(2000000),
    window_size DECIMAL(10,0)
) RETURNS VARCHAR(100) AS

function run(ctx)
    local json = require("json")
    local values = json.decode(ctx.values_json)
    local window = ctx.window_size or 5
    
    if #values < window * 2 then
        return "insufficient_data"
    end
    
    -- Calculate moving averages for trend detection
    local recent_avg, older_avg = 0, 0
    local recent_count, older_count = 0, 0
    
    -- Recent window (last N values)
    for i = math.max(1, #values - window + 1), #values do
        local val = tonumber(values[i])
        if val then
            recent_avg = recent_avg + val
            recent_count = recent_count + 1
        end
    end
    
    -- Older window (previous N values)
    local start_idx = math.max(1, #values - 2 * window + 1)
    local end_idx = #values - window
    for i = start_idx, end_idx do
        local val = tonumber(values[i])
        if val then
            older_avg = older_avg + val
            older_count = older_count + 1
        end
    end
    
    if recent_count == 0 or older_count == 0 then
        return "no_data"
    end
    
    recent_avg = recent_avg / recent_count
    older_avg = older_avg / older_count
    
    -- Determine trend
    local change_pct = (recent_avg - older_avg) / older_avg
    
    if change_pct > 0.02 then
        return "uptrend"
    elseif change_pct < -0.02 then
        return "downtrend"
    else
        return "sideways"
    end
end
/

-- 7. ANOMALY DETECTION (Z-SCORE BASED)
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.detect_anomaly(
    value DOUBLE,
    historical_values_json VARCHAR(2000000),
    threshold DOUBLE
) RETURNS BOOLEAN AS

function run(ctx)
    local json = require("json")
    local hist_values = json.decode(ctx.historical_values_json)
    
    if #hist_values < 10 then
        return false  -- Insufficient historical data
    end
    
    -- Calculate mean and standard deviation
    local sum, sum_sq = 0, 0
    local count = 0
    
    for i = 1, #hist_values do
        local val = tonumber(hist_values[i])
        if val then
            sum = sum + val
            sum_sq = sum_sq + val * val
            count = count + 1
        end
    end
    
    if count < 10 then
        return false
    end
    
    local mean = sum / count
    local variance = (sum_sq - sum * sum / count) / (count - 1)
    local std_dev = math.sqrt(variance)
    
    if std_dev == 0 then
        return false
    end
    
    -- Calculate Z-score
    local z_score = math.abs((ctx.value - mean) / std_dev)
    
    return z_score > (ctx.threshold or 2.5)
end
/