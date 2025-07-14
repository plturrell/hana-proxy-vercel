-- Exasol LUA UDF Migration: Data Quality & Validation Functions
-- Migrated from HANA Data Quality stored procedures

-- 1. CALCULATE DATA SUFFICIENCY
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.calculate_data_sufficiency(
    entity_id VARCHAR(200),
    historical_data_json VARCHAR(2000000),
    required_metrics_json VARCHAR(10000),
    time_window_days DECIMAL(10,0)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local historical_data = json.decode(ctx.historical_data_json or "[]")
    local required_metrics = json.decode(ctx.required_metrics_json or "[]")
    local window_days = ctx.time_window_days or 30
    
    local sufficiency_result = {
        entity_id = ctx.entity_id,
        time_window_days = window_days,
        data_sufficiency_score = 0,
        metric_coverage = {},
        temporal_coverage = {},
        quality_issues = {},
        recommendations = {},
        timestamp = os.time()
    }
    
    local current_time = os.time()
    local window_seconds = window_days * 24 * 3600
    local cutoff_time = current_time - window_seconds
    
    -- Filter data within time window
    local relevant_data = {}
    for i = 1, #historical_data do
        local data_point = historical_data[i]
        if data_point.entity_id == ctx.entity_id and 
           (data_point.timestamp or current_time) >= cutoff_time then
            table.insert(relevant_data, data_point)
        end
    end
    
    -- Check metric coverage
    local metric_scores = {}
    local total_metric_score = 0
    
    for i = 1, #required_metrics do
        local metric = required_metrics[i]
        local metric_name = metric.name
        local min_points = metric.min_data_points or 10
        local max_age_hours = metric.max_age_hours or 24
        
        local metric_data_points = 0
        local latest_timestamp = 0
        local data_quality_sum = 0
        local quality_count = 0
        
        for j = 1, #relevant_data do
            local data_point = relevant_data[j]
            if data_point.metric_name == metric_name then
                metric_data_points = metric_data_points + 1
                
                if data_point.timestamp > latest_timestamp then
                    latest_timestamp = data_point.timestamp
                end
                
                -- Assess data point quality
                local quality_score = 100
                
                if not data_point.value or data_point.value == "" then
                    quality_score = quality_score - 50
                end
                
                if data_point.confidence and data_point.confidence < 0.7 then
                    quality_score = quality_score - 30
                end
                
                if data_point.source_reliability and data_point.source_reliability < 0.8 then
                    quality_score = quality_score - 20
                end
                
                data_quality_sum = data_quality_sum + quality_score
                quality_count = quality_count + 1
            end
        end
        
        -- Calculate metric sufficiency score
        local coverage_score = math.min(100, (metric_data_points / min_points) * 100)
        
        local freshness_score = 100
        if latest_timestamp > 0 then
            local age_hours = (current_time - latest_timestamp) / 3600
            if age_hours > max_age_hours then
                freshness_score = math.max(0, 100 - ((age_hours - max_age_hours) / max_age_hours) * 100)
            end
        else
            freshness_score = 0
        end
        
        local quality_score = quality_count > 0 and (data_quality_sum / quality_count) or 0
        
        local metric_sufficiency = (coverage_score * 0.4 + freshness_score * 0.3 + quality_score * 0.3)
        
        metric_scores[metric_name] = {
            sufficiency_score = metric_sufficiency,
            data_points = metric_data_points,
            required_points = min_points,
            coverage_percentage = coverage_score,
            freshness_score = freshness_score,
            quality_score = quality_score,
            latest_update_hours_ago = latest_timestamp > 0 and ((current_time - latest_timestamp) / 3600) or nil
        }
        
        total_metric_score = total_metric_score + metric_sufficiency
    end
    
    sufficiency_result.metric_coverage = metric_scores
    
    -- Calculate overall data sufficiency score
    if #required_metrics > 0 then
        sufficiency_result.data_sufficiency_score = total_metric_score / #required_metrics
    end
    
    -- Analyze temporal coverage
    local time_buckets = {}
    local bucket_size_hours = 6  -- 6-hour buckets
    
    for i = 1, #relevant_data do
        local data_point = relevant_data[i]
        local timestamp = data_point.timestamp or current_time
        local bucket = math.floor((timestamp - cutoff_time) / (bucket_size_hours * 3600))
        
        if not time_buckets[bucket] then
            time_buckets[bucket] = 0
        end
        time_buckets[bucket] = time_buckets[bucket] + 1
    end
    
    local expected_buckets = math.ceil(window_seconds / (bucket_size_hours * 3600))
    local filled_buckets = 0
    
    for bucket, count in pairs(time_buckets) do
        if count > 0 then
            filled_buckets = filled_buckets + 1
        end
    end
    
    local temporal_coverage_pct = (filled_buckets / expected_buckets) * 100
    
    sufficiency_result.temporal_coverage = {
        coverage_percentage = temporal_coverage_pct,
        filled_buckets = filled_buckets,
        expected_buckets = expected_buckets,
        bucket_size_hours = bucket_size_hours,
        data_gaps = expected_buckets - filled_buckets
    }
    
    -- Identify quality issues
    local issues = {}
    
    if sufficiency_result.data_sufficiency_score < 70 then
        table.insert(issues, {
            type = "insufficient_data",
            severity = "high",
            description = "Overall data sufficiency below 70%"
        })
    end
    
    if temporal_coverage_pct < 60 then
        table.insert(issues, {
            type = "temporal_gaps",
            severity = "medium",
            description = "Temporal coverage below 60%"
        })
    end
    
    for metric_name, metric_info in pairs(metric_scores) do
        if metric_info.sufficiency_score < 50 then
            table.insert(issues, {
                type = "metric_insufficiency",
                severity = "high",
                metric = metric_name,
                description = "Metric " .. metric_name .. " has insufficient data"
            })
        end
        
        if metric_info.freshness_score < 70 then
            table.insert(issues, {
                type = "stale_data",
                severity = "medium",
                metric = metric_name,
                description = "Metric " .. metric_name .. " has stale data"
            })
        end
    end
    
    sufficiency_result.quality_issues = issues
    
    -- Generate recommendations
    local recommendations = {}
    
    if #issues > 0 then
        for i = 1, #issues do
            local issue = issues[i]
            
            if issue.type == "insufficient_data" then
                table.insert(recommendations, "Increase data collection frequency")
                table.insert(recommendations, "Add more data sources for entity")
            elseif issue.type == "temporal_gaps" then
                table.insert(recommendations, "Implement continuous data monitoring")
                table.insert(recommendations, "Set up gap detection alerts")
            elseif issue.type == "metric_insufficiency" then
                table.insert(recommendations, "Focus collection on metric: " .. (issue.metric or "unknown"))
            elseif issue.type == "stale_data" then
                table.insert(recommendations, "Update data source for metric: " .. (issue.metric or "unknown"))
            end
        end
    else
        table.insert(recommendations, "Data sufficiency is adequate")
        table.insert(recommendations, "Continue current collection practices")
    end
    
    sufficiency_result.recommendations = recommendations
    
    return json.encode(sufficiency_result)
end
/

-- 2. UPDATE FEATURE AVAILABILITY MATRIX
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.update_feature_availability(
    entity_id VARCHAR(200),
    features_json VARCHAR(2000000),
    availability_threshold DOUBLE
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local features = json.decode(ctx.features_json or "{}")
    local threshold = ctx.availability_threshold or 0.8
    
    local availability_matrix = {
        entity_id = ctx.entity_id,
        threshold = threshold,
        feature_availability = {},
        overall_availability = 0,
        missing_features = {},
        quality_score = 0,
        timestamp = os.time()
    }
    
    local total_features = 0
    local available_features = 0
    local quality_sum = 0
    
    -- Analyze each feature
    for feature_name, feature_data in pairs(features) do
        total_features = total_features + 1
        
        local feature_info = {
            name = feature_name,
            data_points = 0,
            completeness = 0,
            quality_score = 0,
            last_updated = 0,
            is_available = false
        }
        
        -- Count data points and assess completeness
        if feature_data.values then
            feature_info.data_points = #feature_data.values
            
            local non_null_count = 0
            local quality_scores = {}
            
            for i = 1, #feature_data.values do
                local value = feature_data.values[i]
                
                if value ~= nil and value ~= "" then
                    non_null_count = non_null_count + 1
                    
                    -- Calculate quality score for this value
                    local value_quality = 100
                    
                    -- Check for outliers (simplified)
                    if type(value) == "number" and feature_data.expected_range then
                        if value < feature_data.expected_range.min or 
                           value > feature_data.expected_range.max then
                            value_quality = value_quality - 30
                        end
                    end
                    
                    -- Check data consistency
                    if feature_data.data_type then
                        local actual_type = type(value)
                        if (feature_data.data_type == "number" and actual_type ~= "number") or
                           (feature_data.data_type == "string" and actual_type ~= "string") then
                            value_quality = value_quality - 40
                        end
                    end
                    
                    table.insert(quality_scores, value_quality)
                end
            end
            
            feature_info.completeness = feature_info.data_points > 0 and 
                                      (non_null_count / feature_info.data_points) or 0
            
            -- Calculate average quality score
            if #quality_scores > 0 then
                local quality_total = 0
                for i = 1, #quality_scores do
                    quality_total = quality_total + quality_scores[i]
                end
                feature_info.quality_score = quality_total / #quality_scores
            end
        end
        
        -- Check last updated timestamp
        if feature_data.last_updated then
            feature_info.last_updated = feature_data.last_updated
        end
        
        -- Determine if feature is available
        feature_info.is_available = feature_info.completeness >= threshold and
                                  feature_info.quality_score >= 70
        
        if feature_info.is_available then
            available_features = available_features + 1
        else
            table.insert(availability_matrix.missing_features, {
                feature = feature_name,
                completeness = feature_info.completeness,
                quality_score = feature_info.quality_score,
                reason = feature_info.completeness < threshold and "insufficient_data" or "poor_quality"
            })
        end
        
        availability_matrix.feature_availability[feature_name] = feature_info
        quality_sum = quality_sum + feature_info.quality_score
    end
    
    -- Calculate overall metrics
    if total_features > 0 then
        availability_matrix.overall_availability = available_features / total_features
        availability_matrix.quality_score = quality_sum / total_features
    end
    
    -- Feature importance weighting (if provided)
    if features.feature_weights then
        local weighted_availability = 0
        local total_weight = 0
        
        for feature_name, weight in pairs(features.feature_weights) do
            local feature_info = availability_matrix.feature_availability[feature_name]
            if feature_info then
                weighted_availability = weighted_availability + 
                                      (feature_info.is_available and weight or 0)
                total_weight = total_weight + weight
            end
        end
        
        if total_weight > 0 then
            availability_matrix.weighted_availability = weighted_availability / total_weight
        end
    end
    
    -- Generate feature gaps analysis
    availability_matrix.gaps_analysis = {
        critical_missing = 0,
        partially_available = 0,
        quality_issues = 0
    }
    
    for feature_name, feature_info in pairs(availability_matrix.feature_availability) do
        if not feature_info.is_available then
            if feature_info.completeness < 0.3 then
                availability_matrix.gaps_analysis.critical_missing = 
                    availability_matrix.gaps_analysis.critical_missing + 1
            elseif feature_info.completeness < threshold then
                availability_matrix.gaps_analysis.partially_available = 
                    availability_matrix.gaps_analysis.partially_available + 1
            else
                availability_matrix.gaps_analysis.quality_issues = 
                    availability_matrix.gaps_analysis.quality_issues + 1
            end
        end
    end
    
    return json.encode(availability_matrix)
end
/

-- 3. CALCULATE CONFIDENCE BANDS
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.calculate_confidence_bands(
    historical_values_json VARCHAR(2000000),
    prediction_value DOUBLE,
    confidence_level DOUBLE,
    method VARCHAR(50)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local historical_values = json.decode(ctx.historical_values_json or "[]")
    local prediction = ctx.prediction_value
    local confidence_level = ctx.confidence_level or 0.95
    local method = ctx.method or "bootstrap"
    
    local confidence_result = {
        prediction_value = prediction,
        confidence_level = confidence_level,
        method = method,
        lower_bound = 0,
        upper_bound = 0,
        confidence_width = 0,
        historical_volatility = 0,
        sample_size = #historical_values,
        timestamp = os.time()
    }
    
    if #historical_values < 3 then
        confidence_result.error = "Insufficient historical data for confidence calculation"
        return json.encode(confidence_result)
    end
    
    -- Convert to numeric values
    local numeric_values = {}
    for i = 1, #historical_values do
        local val = tonumber(historical_values[i])
        if val then
            table.insert(numeric_values, val)
        end
    end
    
    if #numeric_values < 3 then
        confidence_result.error = "Insufficient numeric values"
        return json.encode(confidence_result)
    end
    
    -- Calculate basic statistics
    local sum = 0
    local sum_sq = 0
    
    for i = 1, #numeric_values do
        sum = sum + numeric_values[i]
        sum_sq = sum_sq + numeric_values[i] * numeric_values[i]
    end
    
    local mean = sum / #numeric_values
    local variance = (sum_sq - sum * sum / #numeric_values) / (#numeric_values - 1)
    local std_dev = math.sqrt(variance)
    
    confidence_result.historical_volatility = std_dev
    
    if method == "normal" then
        -- Normal distribution method
        local z_score = 1.96  -- For 95% confidence
        if confidence_level == 0.90 then
            z_score = 1.645
        elseif confidence_level == 0.99 then
            z_score = 2.576
        end
        
        local margin_of_error = z_score * std_dev / math.sqrt(#numeric_values)
        
        confidence_result.lower_bound = prediction - margin_of_error
        confidence_result.upper_bound = prediction + margin_of_error
        
    elseif method == "percentile" then
        -- Percentile method using historical residuals
        local residuals = {}
        
        for i = 1, #numeric_values do
            table.insert(residuals, math.abs(numeric_values[i] - mean))
        end
        
        table.sort(residuals)
        
        local percentile_index = math.floor((1 - confidence_level) / 2 * #residuals)
        local upper_percentile_index = math.floor((confidence_level + (1 - confidence_level) / 2) * #residuals)
        
        percentile_index = math.max(1, percentile_index)
        upper_percentile_index = math.min(#residuals, upper_percentile_index)
        
        local margin = residuals[upper_percentile_index]
        
        confidence_result.lower_bound = prediction - margin
        confidence_result.upper_bound = prediction + margin
        
    elseif method == "bootstrap" then
        -- Bootstrap method (simplified)
        local bootstrap_predictions = {}
        local bootstrap_iterations = 100
        
        -- Simple random number generator
        local seed = os.time()
        local function random()
            seed = (seed * 1103515245 + 12345) % 2147483648
            return seed / 2147483648
        end
        
        for iter = 1, bootstrap_iterations do
            local bootstrap_sample = {}
            
            -- Create bootstrap sample
            for i = 1, #numeric_values do
                local random_index = math.floor(random() * #numeric_values) + 1
                table.insert(bootstrap_sample, numeric_values[random_index])
            end
            
            -- Calculate mean of bootstrap sample
            local bootstrap_sum = 0
            for i = 1, #bootstrap_sample do
                bootstrap_sum = bootstrap_sum + bootstrap_sample[i]
            end
            local bootstrap_mean = bootstrap_sum / #bootstrap_sample
            
            -- Simple prediction adjustment
            local prediction_adjustment = bootstrap_mean - mean
            table.insert(bootstrap_predictions, prediction + prediction_adjustment)
        end
        
        -- Sort bootstrap predictions
        table.sort(bootstrap_predictions)
        
        -- Calculate confidence bounds
        local lower_index = math.floor((1 - confidence_level) / 2 * bootstrap_iterations)
        local upper_index = math.floor((confidence_level + (1 - confidence_level) / 2) * bootstrap_iterations)
        
        lower_index = math.max(1, lower_index)
        upper_index = math.min(bootstrap_iterations, upper_index)
        
        confidence_result.lower_bound = bootstrap_predictions[lower_index]
        confidence_result.upper_bound = bootstrap_predictions[upper_index]
    end
    
    confidence_result.confidence_width = confidence_result.upper_bound - confidence_result.lower_bound
    
    -- Assess confidence quality
    local width_to_prediction_ratio = math.abs(confidence_result.confidence_width / prediction)
    
    confidence_result.quality_assessment = {
        relative_width = width_to_prediction_ratio,
        precision = width_to_prediction_ratio < 0.1 and "high" or 
                   width_to_prediction_ratio < 0.3 and "medium" or "low",
        reliability = #numeric_values >= 30 and "high" or 
                     #numeric_values >= 10 and "medium" or "low"
    }
    
    return json.encode(confidence_result)
end
/

-- 4. CALCULATE DATA QUALITY METRICS
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.calculate_data_quality_metrics(
    dataset_json VARCHAR(2000000),
    schema_definition_json VARCHAR(100000),
    quality_rules_json VARCHAR(100000)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local dataset = json.decode(ctx.dataset_json or "[]")
    local schema = json.decode(ctx.schema_definition_json or "{}")
    local quality_rules = json.decode(ctx.quality_rules_json or "{}")
    
    local quality_metrics = {
        overall_score = 0,
        completeness = {},
        accuracy = {},
        consistency = {},
        validity = {},
        uniqueness = {},
        timeliness = {},
        total_records = #dataset,
        quality_issues = {},
        timestamp = os.time()
    }
    
    if #dataset == 0 then
        quality_metrics.error = "Empty dataset"
        return json.encode(quality_metrics)
    end
    
    -- Get field names from first record or schema
    local field_names = {}
    if schema.fields then
        for i = 1, #schema.fields do
            table.insert(field_names, schema.fields[i].name)
        end
    else
        -- Get fields from first record
        for field_name, _ in pairs(dataset[1] or {}) do
            table.insert(field_names, field_name)
        end
    end
    
    -- Initialize metrics for each field
    for i = 1, #field_names do
        local field_name = field_names[i]
        quality_metrics.completeness[field_name] = 0
        quality_metrics.accuracy[field_name] = 0
        quality_metrics.consistency[field_name] = 0
        quality_metrics.validity[field_name] = 0
    end
    
    -- Calculate completeness
    for i = 1, #field_names do
        local field_name = field_names[i]
        local non_null_count = 0
        
        for j = 1, #dataset do
            local record = dataset[j]
            if record[field_name] ~= nil and record[field_name] ~= "" then
                non_null_count = non_null_count + 1
            end
        end
        
        quality_metrics.completeness[field_name] = non_null_count / #dataset
    end
    
    -- Calculate validity (based on schema rules)
    for i = 1, #field_names do
        local field_name = field_names[i]
        local valid_count = 0
        local field_schema = nil
        
        -- Find field schema
        if schema.fields then
            for j = 1, #schema.fields do
                if schema.fields[j].name == field_name then
                    field_schema = schema.fields[j]
                    break
                end
            end
        end
        
        for j = 1, #dataset do
            local record = dataset[j]
            local value = record[field_name]
            local is_valid = true
            
            if value ~= nil and value ~= "" then
                -- Type validation
                if field_schema and field_schema.type then
                    local expected_type = field_schema.type
                    local actual_type = type(value)
                    
                    if expected_type == "number" and actual_type ~= "number" then
                        is_valid = false
                    elseif expected_type == "string" and actual_type ~= "string" then
                        is_valid = false
                    end
                end
                
                -- Range validation
                if field_schema and field_schema.range and type(value) == "number" then
                    if field_schema.range.min and value < field_schema.range.min then
                        is_valid = false
                    end
                    if field_schema.range.max and value > field_schema.range.max then
                        is_valid = false
                    end
                end
                
                -- Pattern validation
                if field_schema and field_schema.pattern and type(value) == "string" then
                    -- Simple pattern matching (could be enhanced)
                    if field_schema.pattern == "email" then
                        if not string.find(value, "@") or not string.find(value, "%.") then
                            is_valid = false
                        end
                    end
                end
            end
            
            if is_valid then
                valid_count = valid_count + 1
            else
                table.insert(quality_metrics.quality_issues, {
                    type = "validity",
                    field = field_name,
                    record_index = j,
                    value = value,
                    reason = "Schema validation failed"
                })
            end
        end
        
        quality_metrics.validity[field_name] = valid_count / #dataset
    end
    
    -- Calculate uniqueness (for fields that should be unique)
    for i = 1, #field_names do
        local field_name = field_names[i]
        local field_schema = nil
        
        -- Check if field should be unique
        if schema.fields then
            for j = 1, #schema.fields do
                if schema.fields[j].name == field_name and schema.fields[j].unique then
                    field_schema = schema.fields[j]
                    break
                end
            end
        end
        
        if field_schema and field_schema.unique then
            local seen_values = {}
            local duplicate_count = 0
            
            for j = 1, #dataset do
                local record = dataset[j]
                local value = record[field_name]
                
                if value ~= nil and value ~= "" then
                    if seen_values[value] then
                        duplicate_count = duplicate_count + 1
                        table.insert(quality_metrics.quality_issues, {
                            type = "uniqueness",
                            field = field_name,
                            record_index = j,
                            value = value,
                            reason = "Duplicate value found"
                        })
                    else
                        seen_values[value] = true
                    end
                end
            end
            
            quality_metrics.uniqueness[field_name] = 1 - (duplicate_count / #dataset)
        else
            quality_metrics.uniqueness[field_name] = 1  -- Not applicable
        end
    end
    
    -- Calculate consistency (cross-field validation)
    local consistency_checks = 0
    local consistency_passes = 0
    
    if quality_rules.consistency_rules then
        for rule_name, rule in pairs(quality_rules.consistency_rules) do
            consistency_checks = consistency_checks + 1
            local rule_passes = 0
            
            for j = 1, #dataset do
                local record = dataset[j]
                local passes_rule = true
                
                -- Simple consistency rule evaluation
                if rule.type == "field_relationship" then
                    local field1_value = record[rule.field1]
                    local field2_value = record[rule.field2]
                    
                    if rule.operation == "greater_than" then
                        if type(field1_value) == "number" and type(field2_value) == "number" then
                            passes_rule = field1_value > field2_value
                        end
                    elseif rule.operation == "equal" then
                        passes_rule = field1_value == field2_value
                    end
                end
                
                if passes_rule then
                    rule_passes = rule_passes + 1
                else
                    table.insert(quality_metrics.quality_issues, {
                        type = "consistency",
                        rule = rule_name,
                        record_index = j,
                        reason = "Consistency rule violation"
                    })
                end
            end
            
            if rule_passes == #dataset then
                consistency_passes = consistency_passes + 1
            end
        end
    end
    
    -- Calculate overall scores
    local total_completeness = 0
    local total_validity = 0
    local total_uniqueness = 0
    
    for i = 1, #field_names do
        local field_name = field_names[i]
        total_completeness = total_completeness + quality_metrics.completeness[field_name]
        total_validity = total_validity + quality_metrics.validity[field_name]
        total_uniqueness = total_uniqueness + quality_metrics.uniqueness[field_name]
    end
    
    local avg_completeness = #field_names > 0 and (total_completeness / #field_names) or 0
    local avg_validity = #field_names > 0 and (total_validity / #field_names) or 0
    local avg_uniqueness = #field_names > 0 and (total_uniqueness / #field_names) or 0
    local consistency_score = consistency_checks > 0 and (consistency_passes / consistency_checks) or 1
    
    -- Calculate overall quality score (weighted average)
    quality_metrics.overall_score = (avg_completeness * 0.25 + 
                                   avg_validity * 0.30 + 
                                   avg_uniqueness * 0.20 + 
                                   consistency_score * 0.25) * 100
    
    quality_metrics.summary = {
        avg_completeness = avg_completeness,
        avg_validity = avg_validity,
        avg_uniqueness = avg_uniqueness,
        consistency_score = consistency_score,
        total_issues = #quality_metrics.quality_issues
    }
    
    return json.encode(quality_metrics)
end
/

-- 5. IDENTIFY DATA COLLECTION TARGETS
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.identify_data_collection_targets(
    entities_status_json VARCHAR(2000000),
    priority_weights_json VARCHAR(10000),
    collection_capacity DECIMAL(10,0)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local entities_status = json.decode(ctx.entities_status_json or "[]")
    local priority_weights = json.decode(ctx.priority_weights_json or "{}")
    local capacity = ctx.collection_capacity or 10
    
    local collection_targets = {
        recommended_targets = {},
        priority_distribution = {},
        collection_strategy = {},
        resource_allocation = {},
        capacity = capacity,
        timestamp = os.time()
    }
    
    -- Default priority weights
    local weights = {
        data_sufficiency = priority_weights.data_sufficiency or 0.3,
        business_impact = priority_weights.business_impact or 0.25,
        collection_feasibility = priority_weights.collection_feasibility or 0.2,
        data_freshness = priority_weights.data_freshness or 0.15,
        cost_effectiveness = priority_weights.cost_effectiveness or 0.1
    }
    
    -- Calculate priority scores for each entity
    local entity_priorities = {}
    
    for i = 1, #entities_status do
        local entity = entities_status[i]
        local entity_id = entity.entity_id
        
        -- Calculate individual scores
        local data_sufficiency_score = 100 - (entity.data_sufficiency_score or 50)
        local business_impact_score = entity.business_impact_score or 50
        local feasibility_score = entity.collection_feasibility_score or 50
        
        -- Calculate freshness score (inverse of age)
        local freshness_score = 50
        if entity.last_update_hours then
            freshness_score = math.max(0, 100 - entity.last_update_hours)
        end
        
        -- Calculate cost effectiveness score
        local cost_effectiveness_score = 100 - (entity.collection_cost_score or 50)
        
        -- Calculate weighted priority score
        local priority_score = (data_sufficiency_score * weights.data_sufficiency +
                              business_impact_score * weights.business_impact +
                              feasibility_score * weights.collection_feasibility +
                              freshness_score * weights.data_freshness +
                              cost_effectiveness_score * weights.cost_effectiveness)
        
        table.insert(entity_priorities, {
            entity_id = entity_id,
            priority_score = priority_score,
            data_sufficiency_score = data_sufficiency_score,
            business_impact_score = business_impact_score,
            feasibility_score = feasibility_score,
            freshness_score = freshness_score,
            cost_effectiveness_score = cost_effectiveness_score,
            missing_metrics = entity.missing_metrics or {},
            estimated_effort = entity.estimated_collection_effort or 1
        })
    end
    
    -- Sort by priority score (descending)
    table.sort(entity_priorities, function(a, b) return a.priority_score > b.priority_score end)
    
    -- Select top targets based on capacity
    local selected_targets = {}
    local total_effort = 0
    local remaining_capacity = capacity
    
    for i = 1, #entity_priorities do
        local entity = entity_priorities[i]
        
        if remaining_capacity >= entity.estimated_effort then
            table.insert(selected_targets, entity)
            total_effort = total_effort + entity.estimated_effort
            remaining_capacity = remaining_capacity - entity.estimated_effort
            
            if #selected_targets >= capacity then
                break
            end
        end
    end
    
    collection_targets.recommended_targets = selected_targets
    
    -- Analyze priority distribution
    local high_priority_count = 0
    local medium_priority_count = 0
    local low_priority_count = 0
    
    for i = 1, #entity_priorities do
        local score = entity_priorities[i].priority_score
        if score >= 75 then
            high_priority_count = high_priority_count + 1
        elseif score >= 50 then
            medium_priority_count = medium_priority_count + 1
        else
            low_priority_count = low_priority_count + 1
        end
    end
    
    collection_targets.priority_distribution = {
        high_priority = high_priority_count,
        medium_priority = medium_priority_count,
        low_priority = low_priority_count,
        total_entities = #entity_priorities
    }
    
    -- Generate collection strategy
    local strategies = {}
    
    if high_priority_count > capacity then
        table.insert(strategies, "Focus on highest priority entities only")
        table.insert(strategies, "Consider increasing collection capacity")
    elseif total_effort < capacity * 0.8 then
        table.insert(strategies, "Capacity underutilized - consider additional targets")
    else
        table.insert(strategies, "Optimal capacity utilization")
    end
    
    if remaining_capacity > 0 then
        table.insert(strategies, "Consider batch collection for remaining capacity")
    end
    
    collection_targets.collection_strategy = strategies
    
    -- Resource allocation recommendations
    collection_targets.resource_allocation = {
        immediate_targets = 0,
        short_term_targets = 0,
        long_term_targets = 0,
        total_effort_allocated = total_effort,
        remaining_capacity = remaining_capacity
    }
    
    for i = 1, #selected_targets do
        local target = selected_targets[i]
        if target.priority_score >= 80 then
            collection_targets.resource_allocation.immediate_targets = 
                collection_targets.resource_allocation.immediate_targets + 1
        elseif target.priority_score >= 60 then
            collection_targets.resource_allocation.short_term_targets = 
                collection_targets.resource_allocation.short_term_targets + 1
        else
            collection_targets.resource_allocation.long_term_targets = 
                collection_targets.resource_allocation.long_term_targets + 1
        end
    end
    
    return json.encode(collection_targets)
end
/