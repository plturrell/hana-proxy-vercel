-- Exasol LUA UDF Migration: Production ML & Enterprise Functions
-- Migrated from HANA Production Enterprise ML stored procedures

-- 1. NLP FINANCIAL SENTIMENT ANALYSIS (PRODUCTION)
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.nlp_analyze_financial_sentiment_production(
    text_content VARCHAR(2000000),
    sentiment_model_json VARCHAR(1000000),
    confidence_threshold DOUBLE,
    language VARCHAR(10)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local model_config = json.decode(ctx.sentiment_model_json or "{}")
    local confidence_threshold = ctx.confidence_threshold or 0.7
    local language = ctx.language or "en"
    
    local sentiment_result = {
        text_content = ctx.text_content,
        language = language,
        sentiment_score = 0,
        sentiment_label = "neutral",
        confidence = 0,
        entity_sentiments = {},
        key_phrases = {},
        risk_indicators = {},
        timestamp = os.time()
    }
    
    local text = string.lower(ctx.text_content or "")
    
    -- Enhanced financial sentiment lexicon
    local positive_financial_terms = {
        "profit", "revenue", "growth", "increase", "gain", "rise", "bull", "bullish",
        "strong", "outperform", "beat", "exceed", "upgrade", "buy", "positive",
        "expansion", "merger", "acquisition", "dividend", "earnings", "success"
    }
    
    local negative_financial_terms = {
        "loss", "decline", "decrease", "fall", "bear", "bearish", "weak",
        "underperform", "miss", "downgrade", "sell", "negative", "recession",
        "bankruptcy", "default", "risk", "volatility", "uncertainty", "crisis"
    }
    
    -- Calculate sentiment scores with financial context weighting
    local positive_score = 0
    local negative_score = 0
    local total_words = 0
    local financial_words = 0
    
    -- Extract words and calculate sentiment
    for word in string.gmatch(text, "%w+") do
        total_words = total_words + 1
        local is_financial = false
        
        -- Check positive terms
        for i = 1, #positive_financial_terms do
            if word == positive_financial_terms[i] then
                positive_score = positive_score + 2  -- Financial terms get double weight
                financial_words = financial_words + 1
                is_financial = true
                break
            end
        end
        
        -- Check negative terms
        if not is_financial then
            for i = 1, #negative_financial_terms do
                if word == negative_financial_terms[i] then
                    negative_score = negative_score + 2  -- Financial terms get double weight
                    financial_words = financial_words + 1
                    is_financial = true
                    break
                end
            end
        end
        
        -- Add general sentiment (lower weight)
        if not is_financial then
            local general_positive = {"good", "great", "excellent", "amazing", "wonderful"}
            local general_negative = {"bad", "terrible", "awful", "horrible", "disappointing"}
            
            for i = 1, #general_positive do
                if word == general_positive[i] then
                    positive_score = positive_score + 1
                    break
                end
            end
            
            for i = 1, #general_negative do
                if word == general_negative[i] then
                    negative_score = negative_score + 1
                    break
                end
            end
        end
    end
    
    -- Calculate final sentiment score
    local total_sentiment_words = positive_score + negative_score
    if total_sentiment_words > 0 then
        sentiment_result.sentiment_score = (positive_score - negative_score) / total_sentiment_words
        sentiment_result.confidence = math.min(1.0, total_sentiment_words / (total_words * 0.1))
    end
    
    -- Determine sentiment label
    if sentiment_result.sentiment_score > 0.2 then
        sentiment_result.sentiment_label = "positive"
    elseif sentiment_result.sentiment_score < -0.2 then
        sentiment_result.sentiment_label = "negative"
    else
        sentiment_result.sentiment_label = "neutral"
    end
    
    -- Extract financial entities and their sentiments
    local entities = {}
    
    -- Extract monetary amounts
    for amount in string.gmatch(text, "%$([%d,%.]+[bmk]?)") do
        table.insert(entities, {
            entity = "$" .. amount,
            type = "monetary_amount",
            context_sentiment = sentiment_result.sentiment_score
        })
    end
    
    -- Extract company tickers
    for ticker in string.gmatch(string.upper(ctx.text_content), "([A-Z][A-Z][A-Z]+)") do
        if string.len(ticker) <= 5 then
            table.insert(entities, {
                entity = ticker,
                type = "ticker",
                context_sentiment = sentiment_result.sentiment_score
            })
        end
    end
    
    sentiment_result.entity_sentiments = entities
    
    -- Identify risk indicators
    local risk_patterns = {
        "volatility", "uncertainty", "risk", "default", "bankruptcy", "crisis",
        "downturn", "recession", "bear market", "correction", "crash"
    }
    
    local risk_indicators = {}
    for i = 1, #risk_patterns do
        local pattern = risk_patterns[i]
        if string.find(text, pattern) then
            table.insert(risk_indicators, {
                indicator = pattern,
                severity = pattern == "crash" or pattern == "crisis" and "high" or "medium",
                position = string.find(text, pattern)
            })
        end
    end
    
    sentiment_result.risk_indicators = risk_indicators
    
    -- Production quality metrics
    sentiment_result.quality_metrics = {
        text_length = string.len(ctx.text_content),
        financial_term_density = financial_words / total_words,
        sentiment_strength = math.abs(sentiment_result.sentiment_score),
        entity_count = #entities,
        risk_indicator_count = #risk_indicators,
        confidence_meets_threshold = sentiment_result.confidence >= confidence_threshold
    }
    
    return json.encode(sentiment_result)
end
/

-- 2. ML MODEL PERFORMANCE MONITORING (PRODUCTION)
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.ml_monitor_model_performance_production(
    model_id VARCHAR(100),
    predictions_json VARCHAR(2000000),
    actuals_json VARCHAR(2000000),
    performance_window_hours DECIMAL(10,0),
    alert_thresholds_json VARCHAR(10000)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local predictions = json.decode(ctx.predictions_json or "[]")
    local actuals = json.decode(ctx.actuals_json or "[]")
    local alert_thresholds = json.decode(ctx.alert_thresholds_json or "{}")
    local window_hours = ctx.performance_window_hours or 24
    
    local monitoring_result = {
        model_id = ctx.model_id,
        monitoring_window_hours = window_hours,
        performance_metrics = {},
        alerts = {},
        drift_detection = {},
        recommendations = {},
        timestamp = os.time()
    }
    
    if #predictions ~= #actuals or #predictions == 0 then
        monitoring_result.error = "Mismatched or empty prediction/actual arrays"
        return json.encode(monitoring_result)
    end
    
    local n = #predictions
    
    -- Calculate comprehensive performance metrics
    local errors = {}
    local absolute_errors = {}
    local squared_errors = {}
    local percentage_errors = {}
    
    for i = 1, n do
        local pred = tonumber(predictions[i])
        local actual = tonumber(actuals[i])
        
        if pred and actual then
            local error = actual - pred
            local abs_error = math.abs(error)
            local sq_error = error * error
            
            table.insert(errors, error)
            table.insert(absolute_errors, abs_error)
            table.insert(squared_errors, sq_error)
            
            if actual ~= 0 then
                table.insert(percentage_errors, abs_error / math.abs(actual) * 100)
            end
        end
    end
    
    -- Basic metrics
    local mse = 0
    local mae = 0
    for i = 1, #squared_errors do
        mse = mse + squared_errors[i]
        mae = mae + absolute_errors[i]
    end
    mse = mse / #squared_errors
    mae = mae / #absolute_errors
    
    local rmse = math.sqrt(mse)
    
    -- Mean Absolute Percentage Error
    local mape = 0
    if #percentage_errors > 0 then
        for i = 1, #percentage_errors do
            mape = mape + percentage_errors[i]
        end
        mape = mape / #percentage_errors
    end
    
    -- Calculate bias
    local bias = 0
    for i = 1, #errors do
        bias = bias + errors[i]
    end
    bias = bias / #errors
    
    -- R-squared calculation
    local actual_sum = 0
    local actual_sum_sq = 0
    for i = 1, n do
        local actual = tonumber(actuals[i])
        if actual then
            actual_sum = actual_sum + actual
            actual_sum_sq = actual_sum_sq + actual * actual
        end
    end
    
    local actual_mean = actual_sum / n
    local ss_tot = actual_sum_sq - n * actual_mean * actual_mean
    local r_squared = 1 - (mse * n / ss_tot)
    
    monitoring_result.performance_metrics = {
        mse = mse,
        rmse = rmse,
        mae = mae,
        mape = mape,
        bias = bias,
        r_squared = r_squared,
        sample_size = n,
        prediction_variance = calculate_variance(predictions),
        actual_variance = calculate_variance(actuals)
    }
    
    -- Check for performance degradation alerts
    local alerts = {}
    
    -- Default thresholds if not provided
    local thresholds = {
        max_mse = alert_thresholds.max_mse or 1.0,
        max_mae = alert_thresholds.max_mae or 0.5,
        max_mape = alert_thresholds.max_mape or 10.0,
        min_r_squared = alert_thresholds.min_r_squared or 0.8,
        max_bias = alert_thresholds.max_bias or 0.1
    }
    
    if mse > thresholds.max_mse then
        table.insert(alerts, {
            type = "performance_degradation",
            metric = "mse",
            value = mse,
            threshold = thresholds.max_mse,
            severity = "high"
        })
    end
    
    if mae > thresholds.max_mae then
        table.insert(alerts, {
            type = "performance_degradation",
            metric = "mae",
            value = mae,
            threshold = thresholds.max_mae,
            severity = "medium"
        })
    end
    
    if mape > thresholds.max_mape then
        table.insert(alerts, {
            type = "performance_degradation",
            metric = "mape",
            value = mape,
            threshold = thresholds.max_mape,
            severity = "medium"
        })
    end
    
    if r_squared < thresholds.min_r_squared then
        table.insert(alerts, {
            type = "performance_degradation",
            metric = "r_squared",
            value = r_squared,
            threshold = thresholds.min_r_squared,
            severity = "high"
        })
    end
    
    if math.abs(bias) > thresholds.max_bias then
        table.insert(alerts, {
            type = "model_bias",
            metric = "bias",
            value = bias,
            threshold = thresholds.max_bias,
            severity = bias > 0 and "overestimation" or "underestimation"
        })
    end
    
    monitoring_result.alerts = alerts
    
    -- Drift detection (simplified statistical tests)
    local drift_indicators = {}
    
    -- Check for distribution shift in predictions vs actuals
    local pred_mean = calculate_mean(predictions)
    local actual_mean = calculate_mean(actuals)
    local mean_shift = math.abs(pred_mean - actual_mean)
    
    if mean_shift > 0.2 * actual_mean then
        table.insert(drift_indicators, {
            type = "distribution_shift",
            description = "Significant shift in prediction vs actual means",
            severity = "medium",
            shift_magnitude = mean_shift
        })
    end
    
    -- Check for variance changes
    local pred_var = monitoring_result.performance_metrics.prediction_variance
    local actual_var = monitoring_result.performance_metrics.actual_variance
    local variance_ratio = pred_var / actual_var
    
    if variance_ratio > 2.0 or variance_ratio < 0.5 then
        table.insert(drift_indicators, {
            type = "variance_shift",
            description = "Significant change in prediction variance",
            severity = "low",
            variance_ratio = variance_ratio
        })
    end
    
    monitoring_result.drift_detection = drift_indicators
    
    -- Generate recommendations
    local recommendations = {}
    
    if #alerts > 2 then
        table.insert(recommendations, "Model performance has degraded significantly - consider retraining")
    end
    
    if math.abs(bias) > 0.05 then
        table.insert(recommendations, "Model shows systematic bias - review training data")
    end
    
    if #drift_indicators > 0 then
        table.insert(recommendations, "Data drift detected - monitor input feature distributions")
    end
    
    if mape > 15 then
        table.insert(recommendations, "High prediction error - investigate feature engineering")
    end
    
    if #alerts == 0 and #drift_indicators == 0 then
        table.insert(recommendations, "Model performance is stable and within acceptable bounds")
    end
    
    monitoring_result.recommendations = recommendations
    
    return json.encode(monitoring_result)
end

-- Helper functions
function calculate_variance(values)
    local n = #values
    if n < 2 then return 0 end
    
    local sum = 0
    for i = 1, n do
        sum = sum + tonumber(values[i] or 0)
    end
    local mean = sum / n
    
    local sum_sq_diff = 0
    for i = 1, n do
        local diff = tonumber(values[i] or 0) - mean
        sum_sq_diff = sum_sq_diff + diff * diff
    end
    
    return sum_sq_diff / (n - 1)
end

function calculate_mean(values)
    local sum = 0
    for i = 1, #values do
        sum = sum + tonumber(values[i] or 0)
    end
    return sum / #values
end
/

-- 3. ADVANCED DATA DRIFT DETECTION
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.ml_detect_data_drift_advanced(
    reference_data_json VARCHAR(2000000),
    current_data_json VARCHAR(2000000),
    drift_threshold DOUBLE,
    statistical_tests_json VARCHAR(10000)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local reference_data = json.decode(ctx.reference_data_json or "[]")
    local current_data = json.decode(ctx.current_data_json or "[]")
    local threshold = ctx.drift_threshold or 0.05
    local test_config = json.decode(ctx.statistical_tests_json or "{}")
    
    local drift_result = {
        drift_detected = false,
        overall_drift_score = 0,
        feature_drift_scores = {},
        statistical_tests = {},
        drift_magnitude = "none",
        affected_features = {},
        recommendations = {},
        timestamp = os.time()
    }
    
    if #reference_data == 0 or #current_data == 0 then
        drift_result.error = "Empty reference or current data"
        return json.encode(drift_result)
    end
    
    -- Get feature names from first record
    local feature_names = {}
    for feature_name, _ in pairs(reference_data[1] or {}) do
        table.insert(feature_names, feature_name)
    end
    
    local total_drift_score = 0
    local significant_drifts = 0
    
    -- Analyze drift for each feature
    for i = 1, #feature_names do
        local feature_name = feature_names[i]
        
        -- Extract feature values
        local ref_values = {}
        local curr_values = {}
        
        for j = 1, #reference_data do
            local val = tonumber(reference_data[j][feature_name])
            if val then table.insert(ref_values, val) end
        end
        
        for j = 1, #current_data do
            local val = tonumber(current_data[j][feature_name])
            if val then table.insert(curr_values, val) end
        end
        
        if #ref_values >= 10 and #curr_values >= 10 then
            -- Calculate various drift metrics
            local drift_metrics = calculate_feature_drift(ref_values, curr_values)
            
            drift_result.feature_drift_scores[feature_name] = drift_metrics
            total_drift_score = total_drift_score + drift_metrics.combined_score
            
            if drift_metrics.combined_score > threshold then
                significant_drifts = significant_drifts + 1
                table.insert(drift_result.affected_features, {
                    feature = feature_name,
                    drift_score = drift_metrics.combined_score,
                    drift_type = drift_metrics.primary_drift_type
                })
            end
        end
    end
    
    -- Calculate overall drift assessment
    if #feature_names > 0 then
        drift_result.overall_drift_score = total_drift_score / #feature_names
    end
    
    drift_result.drift_detected = drift_result.overall_drift_score > threshold or significant_drifts > 0
    
    -- Determine drift magnitude
    if drift_result.overall_drift_score > 0.2 then
        drift_result.drift_magnitude = "severe"
    elseif drift_result.overall_drift_score > 0.1 then
        drift_result.drift_magnitude = "moderate"
    elseif drift_result.overall_drift_score > threshold then
        drift_result.drift_magnitude = "mild"
    else
        drift_result.drift_magnitude = "none"
    end
    
    -- Generate recommendations
    local recommendations = {}
    
    if drift_result.drift_detected then
        table.insert(recommendations, "Data drift detected - investigate data sources")
        
        if significant_drifts > #feature_names * 0.5 then
            table.insert(recommendations, "Multiple features affected - check data pipeline")
        end
        
        if drift_result.drift_magnitude == "severe" then
            table.insert(recommendations, "Severe drift - immediate model retraining recommended")
        elseif drift_result.drift_magnitude == "moderate" then
            table.insert(recommendations, "Moderate drift - schedule model update")
        else
            table.insert(recommendations, "Mild drift - monitor closely")
        end
    else
        table.insert(recommendations, "No significant data drift detected")
    end
    
    drift_result.recommendations = recommendations
    
    return json.encode(drift_result)
end

-- Helper function for feature drift calculation
function calculate_feature_drift(ref_values, curr_values)
    -- Calculate means
    local ref_mean = calculate_mean(ref_values)
    local curr_mean = calculate_mean(curr_values)
    local mean_shift = math.abs(curr_mean - ref_mean) / (math.abs(ref_mean) + 1e-8)
    
    -- Calculate standard deviations
    local ref_std = math.sqrt(calculate_variance(ref_values))
    local curr_std = math.sqrt(calculate_variance(curr_values))
    local std_shift = math.abs(curr_std - ref_std) / (ref_std + 1e-8)
    
    -- Simple KS-test approximation (Kolmogorov-Smirnov)
    table.sort(ref_values)
    table.sort(curr_values)
    
    local max_diff = 0
    local ref_idx, curr_idx = 1, 1
    
    while ref_idx <= #ref_values and curr_idx <= #curr_values do
        local ref_cdf = ref_idx / #ref_values
        local curr_cdf = curr_idx / #curr_values
        local diff = math.abs(ref_cdf - curr_cdf)
        
        if diff > max_diff then
            max_diff = diff
        end
        
        if ref_values[ref_idx] <= curr_values[curr_idx] then
            ref_idx = ref_idx + 1
        else
            curr_idx = curr_idx + 1
        end
    end
    
    -- Combined drift score
    local combined_score = (mean_shift * 0.4 + std_shift * 0.3 + max_diff * 0.3)
    
    -- Determine primary drift type
    local primary_drift_type = "none"
    if mean_shift > std_shift and mean_shift > max_diff then
        primary_drift_type = "mean_shift"
    elseif std_shift > max_diff then
        primary_drift_type = "variance_shift"
    elseif max_diff > 0.1 then
        primary_drift_type = "distribution_shift"
    end
    
    return {
        mean_shift = mean_shift,
        std_shift = std_shift,
        ks_statistic = max_diff,
        combined_score = combined_score,
        primary_drift_type = primary_drift_type
    }
end
/

-- 4. ADVANCED FEATURE IMPORTANCE CALCULATION
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.ml_calculate_feature_importance_production(
    training_data_json VARCHAR(2000000),
    target_variable VARCHAR(100),
    importance_methods_json VARCHAR(10000),
    cross_validation_folds DECIMAL(10,0)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local training_data = json.decode(ctx.training_data_json or "[]")
    local target_var = ctx.target_variable
    local methods = json.decode(ctx.importance_methods_json or "{}")
    local cv_folds = ctx.cross_validation_folds or 5
    
    local importance_result = {
        target_variable = target_var,
        feature_importance_scores = {},
        importance_rankings = {},
        stability_metrics = {},
        cross_validation_results = {},
        recommendations = {},
        timestamp = os.time()
    }
    
    if #training_data == 0 or not target_var then
        importance_result.error = "Missing training data or target variable"
        return json.encode(importance_result)
    end
    
    -- Extract features and target
    local feature_names = {}
    local feature_data = {}
    local target_data = {}
    
    for feature_name, _ in pairs(training_data[1] or {}) do
        if feature_name ~= target_var then
            table.insert(feature_names, feature_name)
            feature_data[feature_name] = {}
        end
    end
    
    for i = 1, #training_data do
        local record = training_data[i]
        local target_val = tonumber(record[target_var])
        if target_val then
            table.insert(target_data, target_val)
            
            for j = 1, #feature_names do
                local feature_name = feature_names[j]
                local feature_val = tonumber(record[feature_name])
                if feature_val then
                    table.insert(feature_data[feature_name], feature_val)
                end
            end
        end
    end
    
    -- Method 1: Correlation-based importance
    local correlation_importance = {}
    for i = 1, #feature_names do
        local feature_name = feature_names[i]
        local feature_values = feature_data[feature_name]
        
        if #feature_values == #target_data then
            local correlation = calculate_correlation(feature_values, target_data)
            correlation_importance[feature_name] = math.abs(correlation)
        else
            correlation_importance[feature_name] = 0
        end
    end
    
    -- Method 2: Variance-based importance
    local variance_importance = {}
    for i = 1, #feature_names do
        local feature_name = feature_names[i]
        local feature_values = feature_data[feature_name]
        local variance = calculate_variance(feature_values)
        variance_importance[feature_name] = variance
    end
    
    -- Normalize variance scores
    local max_variance = 0
    for feature_name, variance in pairs(variance_importance) do
        if variance > max_variance then
            max_variance = variance
        end
    end
    
    if max_variance > 0 then
        for feature_name, variance in pairs(variance_importance) do
            variance_importance[feature_name] = variance / max_variance
        end
    end
    
    -- Method 3: Information gain approximation
    local info_gain_importance = {}
    for i = 1, #feature_names do
        local feature_name = feature_names[i]
        local feature_values = feature_data[feature_name]
        
        -- Simple discretization-based information gain
        local info_gain = calculate_information_gain_approx(feature_values, target_data)
        info_gain_importance[feature_name] = info_gain
    end
    
    -- Combine importance scores
    local combined_importance = {}
    local weights = {
        correlation = methods.correlation_weight or 0.4,
        variance = methods.variance_weight or 0.2,
        information_gain = methods.info_gain_weight or 0.4
    }
    
    for i = 1, #feature_names do
        local feature_name = feature_names[i]
        
        local combined_score = (correlation_importance[feature_name] * weights.correlation +
                              variance_importance[feature_name] * weights.variance +
                              info_gain_importance[feature_name] * weights.information_gain)
        
        combined_importance[feature_name] = combined_score
        
        importance_result.feature_importance_scores[feature_name] = {
            correlation_score = correlation_importance[feature_name],
            variance_score = variance_importance[feature_name],
            info_gain_score = info_gain_importance[feature_name],
            combined_score = combined_score
        }
    end
    
    -- Create rankings
    local feature_rankings = {}
    for feature_name, score in pairs(combined_importance) do
        table.insert(feature_rankings, {
            feature = feature_name,
            importance_score = score
        })
    end
    
    table.sort(feature_rankings, function(a, b) return a.importance_score > b.importance_score end)
    importance_result.importance_rankings = feature_rankings
    
    -- Cross-validation stability (simplified)
    local stability_scores = {}
    
    for i = 1, #feature_names do
        local feature_name = feature_names[i]
        local cv_scores = {}
        
        -- Simulate cross-validation by using different subsets
        for fold = 1, cv_folds do
            local start_idx = math.floor((fold - 1) * #target_data / cv_folds) + 1
            local end_idx = math.floor(fold * #target_data / cv_folds)
            
            local subset_feature = {}
            local subset_target = {}
            
            for j = start_idx, end_idx do
                if j <= #target_data then
                    table.insert(subset_feature, feature_data[feature_name][j])
                    table.insert(subset_target, target_data[j])
                end
            end
            
            if #subset_feature >= 5 then  -- Minimum samples for calculation
                local fold_correlation = calculate_correlation(subset_feature, subset_target)
                table.insert(cv_scores, math.abs(fold_correlation))
            end
        end
        
        -- Calculate stability (standard deviation of CV scores)
        if #cv_scores > 1 then
            local mean_cv = calculate_mean(cv_scores)
            local cv_variance = calculate_variance(cv_scores)
            local stability = 1 - (math.sqrt(cv_variance) / (mean_cv + 1e-8))
            stability_scores[feature_name] = math.max(0, stability)
        else
            stability_scores[feature_name] = 0
        end
    end
    
    importance_result.stability_metrics = stability_scores
    
    -- Generate recommendations
    local recommendations = {}
    
    -- Identify top features
    local top_features = {}
    for i = 1, math.min(5, #feature_rankings) do
        table.insert(top_features, feature_rankings[i].feature)
    end
    
    table.insert(recommendations, "Top important features: " .. table.concat(top_features, ", "))
    
    -- Identify low-importance features
    local low_importance_features = {}
    for i = math.max(1, #feature_rankings - 2), #feature_rankings do
        if feature_rankings[i].importance_score < 0.1 then
            table.insert(low_importance_features, feature_rankings[i].feature)
        end
    end
    
    if #low_importance_features > 0 then
        table.insert(recommendations, "Consider removing low-importance features: " .. 
                    table.concat(low_importance_features, ", "))
    end
    
    -- Check stability
    local unstable_features = {}
    for feature_name, stability in pairs(stability_scores) do
        if stability < 0.5 then
            table.insert(unstable_features, feature_name)
        end
    end
    
    if #unstable_features > 0 then
        table.insert(recommendations, "Features with low stability: " .. 
                    table.concat(unstable_features, ", "))
    end
    
    importance_result.recommendations = recommendations
    
    return json.encode(importance_result)
end

-- Helper function for information gain approximation
function calculate_information_gain_approx(feature_values, target_values)
    if #feature_values ~= #target_values or #feature_values < 5 then
        return 0
    end
    
    -- Simple discretization: split feature values into quartiles
    local sorted_features = {}
    for i = 1, #feature_values do
        table.insert(sorted_features, feature_values[i])
    end
    table.sort(sorted_features)
    
    local q1_idx = math.floor(#sorted_features * 0.25)
    local q3_idx = math.floor(#sorted_features * 0.75)
    local q1_val = sorted_features[q1_idx]
    local q3_val = sorted_features[q3_idx]
    
    -- Categorize samples
    local low_targets = {}
    local high_targets = {}
    
    for i = 1, #feature_values do
        if feature_values[i] <= q1_val then
            table.insert(low_targets, target_values[i])
        elseif feature_values[i] >= q3_val then
            table.insert(high_targets, target_values[i])
        end
    end
    
    -- Calculate variance reduction (simplified information gain)
    local total_variance = calculate_variance(target_values)
    local low_variance = #low_targets > 1 and calculate_variance(low_targets) or 0
    local high_variance = #high_targets > 1 and calculate_variance(high_targets) or 0
    
    local weighted_variance = (low_variance * #low_targets + high_variance * #high_targets) / 
                             (#low_targets + #high_targets + 1e-8)
    
    return math.max(0, total_variance - weighted_variance) / (total_variance + 1e-8)
end
/