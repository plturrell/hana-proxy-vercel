-- Exasol LUA UDF Migration: Knowledge Graph & NLP Functions
-- Migrated from HANA Knowledge Graph stored procedures

-- 1. GENERATE KNOWLEDGE GRAPH TRIPLES
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.generate_knowledge_graph(
    news_content VARCHAR(2000000),
    entity_types_json VARCHAR(10000),
    relationship_patterns_json VARCHAR(50000)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local entity_types = json.decode(ctx.entity_types_json or "{}")
    local patterns = json.decode(ctx.relationship_patterns_json or "{}")
    
    local text = ctx.news_content or ""
    local triples = {}
    
    -- Simple entity extraction patterns
    local entities = {}
    
    -- Extract monetary amounts
    for amount in string.gmatch(text, "%$([%d,%.]+[BMK]?)") do
        table.insert(entities, {
            type = "MONETARY_AMOUNT",
            value = "$" .. amount,
            confidence = 0.9
        })
    end
    
    -- Extract percentages
    for percent in string.gmatch(text, "([%d%.]+)%%") do
        table.insert(entities, {
            type = "PERCENTAGE",
            value = percent .. "%",
            confidence = 0.8
        })
    end
    
    -- Extract dates
    for date in string.gmatch(text, "(%d+/%d+/%d+)") do
        table.insert(entities, {
            type = "DATE",
            value = date,
            confidence = 0.7
        })
    end
    
    -- Extract organizations (simple heuristic)
    for org in string.gmatch(text, "([A-Z][a-z]+ [A-Z][a-z]+)") do
        if string.find(org, "Bank") or string.find(org, "Corp") or 
           string.find(org, "Inc") or string.find(org, "LLC") then
            table.insert(entities, {
                type = "ORGANIZATION",
                value = org,
                confidence = 0.6
            })
        end
    end
    
    -- Generate triples from entities
    for i = 1, #entities do
        for j = i + 1, #entities do
            local subject = entities[i]
            local object = entities[j]
            
            -- Create relationship based on types
            local predicate = "RELATED_TO"
            if subject.type == "ORGANIZATION" and object.type == "MONETARY_AMOUNT" then
                predicate = "HAS_VALUE"
            elseif subject.type == "MONETARY_AMOUNT" and object.type == "PERCENTAGE" then
                predicate = "HAS_RATE"
            elseif subject.type == "ORGANIZATION" and object.type == "DATE" then
                predicate = "REPORTED_ON"
            end
            
            table.insert(triples, {
                subject = subject.value,
                predicate = predicate,
                object = object.value,
                subject_type = subject.type,
                object_type = object.type,
                confidence = (subject.confidence + object.confidence) / 2
            })
        end
    end
    
    return json.encode({
        triples = triples,
        entities_found = #entities,
        triples_generated = #triples,
        timestamp = os.time()
    })
end
/

-- 2. MATERIALIZE ENTITIES FOR FAST ACCESS
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.materialize_entities(
    triples_json VARCHAR(2000000),
    entity_type VARCHAR(100)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local triples = json.decode(ctx.triples_json)
    
    local materialized_entities = {}
    local entity_relationships = {}
    
    -- Extract entities of specified type
    for i = 1, #triples do
        local triple = triples[i]
        
        if not ctx.entity_type or triple.subject_type == ctx.entity_type then
            local entity_id = triple.subject
            
            if not materialized_entities[entity_id] then
                materialized_entities[entity_id] = {
                    entity_id = entity_id,
                    entity_type = triple.subject_type,
                    relationships = {},
                    attributes = {},
                    frequency = 0
                }
            end
            
            materialized_entities[entity_id].frequency = 
                materialized_entities[entity_id].frequency + 1
            
            table.insert(materialized_entities[entity_id].relationships, {
                predicate = triple.predicate,
                object = triple.object,
                object_type = triple.object_type,
                confidence = triple.confidence
            })
        end
    end
    
    -- Convert to array
    local result = {}
    for entity_id, entity_data in pairs(materialized_entities) do
        table.insert(result, entity_data)
    end
    
    -- Sort by frequency (most mentioned first)
    table.sort(result, function(a, b) return a.frequency > b.frequency end)
    
    return json.encode({
        materialized_entities = result,
        entity_type = ctx.entity_type,
        total_entities = #result,
        timestamp = os.time()
    })
end
/

-- 3. GENERATE TEMPORAL CORRELATIONS
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.generate_temporal_correlations(
    time_series_data_json VARCHAR(2000000),
    entity_pairs_json VARCHAR(1000000),
    time_window_hours DECIMAL(10,0)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local time_series = json.decode(ctx.time_series_data_json)
    local entity_pairs = json.decode(ctx.entity_pairs_json or "{}")
    
    local correlations = {}
    local window_hours = ctx.time_window_hours or 24
    
    -- Group data by time windows
    local time_buckets = {}
    
    for i = 1, #time_series do
        local data_point = time_series[i]
        local timestamp = data_point.timestamp
        local bucket = math.floor(timestamp / (window_hours * 3600))
        
        if not time_buckets[bucket] then
            time_buckets[bucket] = {}
        end
        
        table.insert(time_buckets[bucket], data_point)
    end
    
    -- Calculate correlations for each entity pair
    for i = 1, #entity_pairs do
        local pair = entity_pairs[i]
        local entity1 = pair.entity1
        local entity2 = pair.entity2
        
        local entity1_values = {}
        local entity2_values = {}
        
        -- Extract values for correlation calculation
        for bucket, data_points in pairs(time_buckets) do
            local e1_sum, e2_sum = 0, 0
            local e1_count, e2_count = 0, 0
            
            for j = 1, #data_points do
                local point = data_points[j]
                if point.entity_id == entity1 then
                    e1_sum = e1_sum + (point.value or 0)
                    e1_count = e1_count + 1
                elseif point.entity_id == entity2 then
                    e2_sum = e2_sum + (point.value or 0)
                    e2_count = e2_count + 1
                end
            end
            
            if e1_count > 0 and e2_count > 0 then
                table.insert(entity1_values, e1_sum / e1_count)
                table.insert(entity2_values, e2_sum / e2_count)
            end
        end
        
        -- Calculate Pearson correlation
        local correlation = calculate_correlation(entity1_values, entity2_values)
        
        table.insert(correlations, {
            entity1 = entity1,
            entity2 = entity2,
            correlation = correlation,
            data_points = #entity1_values,
            time_window_hours = window_hours,
            statistical_significance = #entity1_values >= 10 and math.abs(correlation) > 0.3
        })
    end
    
    return json.encode({
        temporal_correlations = correlations,
        time_window_hours = window_hours,
        total_correlations = #correlations,
        timestamp = os.time()
    })
end

-- Helper function for correlation (reused from previous file)
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

-- 4. ANSWER SWIFT QUERY (iOS APP INTEGRATION)
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.answer_swift_query(
    query_text VARCHAR(2000000),
    knowledge_base_json VARCHAR(2000000),
    query_type VARCHAR(100)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local knowledge_base = json.decode(ctx.knowledge_base_json or "{}")
    local query = string.lower(ctx.query_text or "")
    
    local response = {
        query = ctx.query_text,
        query_type = ctx.query_type,
        answers = {},
        confidence = 0,
        timestamp = os.time()
    }
    
    -- Simple keyword-based query processing
    if ctx.query_type == "FINANCIAL_METRIC" then
        -- Look for financial metrics
        for keyword in string.gmatch(query, "%w+") do
            for i = 1, #knowledge_base do
                local kb_entry = knowledge_base[i]
                if kb_entry.entity_type == "MONETARY_AMOUNT" or 
                   kb_entry.entity_type == "PERCENTAGE" then
                    if string.find(string.lower(kb_entry.entity_id or ""), keyword) then
                        table.insert(response.answers, {
                            entity = kb_entry.entity_id,
                            value = kb_entry.value,
                            confidence = 0.8,
                            source = "knowledge_graph"
                        })
                    end
                end
            end
        end
        
    elseif ctx.query_type == "ORGANIZATION_INFO" then
        -- Look for organization information
        for i = 1, #knowledge_base do
            local kb_entry = knowledge_base[i]
            if kb_entry.entity_type == "ORGANIZATION" then
                if string.find(query, string.lower(kb_entry.entity_id or "")) then
                    table.insert(response.answers, {
                        organization = kb_entry.entity_id,
                        relationships = kb_entry.relationships or {},
                        confidence = 0.9,
                        source = "knowledge_graph"
                    })
                end
            end
        end
        
    elseif ctx.query_type == "TREND_ANALYSIS" then
        -- Look for trend-related information
        local trend_keywords = {"increase", "decrease", "rise", "fall", "trend", "up", "down"}
        local has_trend_keyword = false
        
        for i = 1, #trend_keywords do
            if string.find(query, trend_keywords[i]) then
                has_trend_keyword = true
                break
            end
        end
        
        if has_trend_keyword then
            for i = 1, #knowledge_base do
                local kb_entry = knowledge_base[i]
                if kb_entry.temporal_data then
                    table.insert(response.answers, {
                        entity = kb_entry.entity_id,
                        trend_data = kb_entry.temporal_data,
                        confidence = 0.7,
                        source = "temporal_analysis"
                    })
                end
            end
        end
    end
    
    -- Calculate overall confidence
    if #response.answers > 0 then
        local total_confidence = 0
        for i = 1, #response.answers do
            total_confidence = total_confidence + response.answers[i].confidence
        end
        response.confidence = total_confidence / #response.answers
    end
    
    return json.encode(response)
end
/

-- 5. ENTITY EVOLUTION ANALYSIS
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.entity_evolution_analysis(
    entity_id VARCHAR(200),
    historical_data_json VARCHAR(2000000),
    analysis_window_days DECIMAL(10,0)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local historical_data = json.decode(ctx.historical_data_json)
    local window_days = ctx.analysis_window_days or 30
    local current_time = os.time()
    local window_seconds = window_days * 24 * 3600
    
    local evolution_metrics = {
        entity_id = ctx.entity_id,
        analysis_window_days = window_days,
        metrics = {},
        trends = {},
        anomalies = [],
        timestamp = current_time
    }
    
    -- Filter data for the entity and time window
    local entity_data = {}
    for i = 1, #historical_data do
        local data_point = historical_data[i]
        if data_point.entity_id == ctx.entity_id and 
           (current_time - data_point.timestamp) <= window_seconds then
            table.insert(entity_data, data_point)
        end
    end
    
    if #entity_data == 0 then
        evolution_metrics.error = "No data found for entity in time window"
        return json.encode(evolution_metrics)
    end
    
    -- Sort by timestamp
    table.sort(entity_data, function(a, b) return a.timestamp < b.timestamp end)
    
    -- Calculate evolution metrics
    local values = {}
    local timestamps = {}
    
    for i = 1, #entity_data do
        table.insert(values, entity_data[i].value or 0)
        table.insert(timestamps, entity_data[i].timestamp)
    end
    
    -- Basic statistics
    local sum = 0
    local min_val = values[1]
    local max_val = values[1]
    
    for i = 1, #values do
        sum = sum + values[i]
        if values[i] < min_val then min_val = values[i] end
        if values[i] > max_val then max_val = values[i] end
    end
    
    local mean = sum / #values
    local variance = 0
    
    for i = 1, #values do
        variance = variance + (values[i] - mean) * (values[i] - mean)
    end
    variance = variance / (#values - 1)
    
    evolution_metrics.metrics = {
        mean = mean,
        variance = variance,
        std_dev = math.sqrt(variance),
        min_value = min_val,
        max_value = max_val,
        data_points = #values,
        volatility = math.sqrt(variance) / mean  -- Coefficient of variation
    }
    
    -- Trend analysis (simple linear trend)
    if #values >= 3 then
        local trend_slope = (values[#values] - values[1]) / (#values - 1)
        local trend_direction = "stable"
        
        if trend_slope > 0.01 * mean then
            trend_direction = "increasing"
        elseif trend_slope < -0.01 * mean then
            trend_direction = "decreasing"
        end
        
        evolution_metrics.trends = {
            direction = trend_direction,
            slope = trend_slope,
            strength = math.abs(trend_slope) / math.sqrt(variance)
        }
    end
    
    -- Simple anomaly detection (values > 2 standard deviations from mean)
    local std_dev = math.sqrt(variance)
    for i = 1, #values do
        if math.abs(values[i] - mean) > 2 * std_dev then
            table.insert(evolution_metrics.anomalies, {
                timestamp = timestamps[i],
                value = values[i],
                z_score = (values[i] - mean) / std_dev,
                severity = math.abs(values[i] - mean) > 3 * std_dev and "high" or "medium"
            })
        end
    end
    
    return json.encode(evolution_metrics)
end
/

-- 6. METRIC CORRELATION ANALYSIS
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.metric_correlation_analysis(
    metrics_data_json VARCHAR(2000000),
    correlation_threshold DOUBLE,
    time_lag_hours DECIMAL(10,0)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local metrics_data = json.decode(ctx.metrics_data_json)
    local threshold = ctx.correlation_threshold or 0.5
    local lag_hours = ctx.time_lag_hours or 0
    local lag_seconds = lag_hours * 3600
    
    local correlation_results = {
        correlations = {},
        threshold = threshold,
        time_lag_hours = lag_hours,
        timestamp = os.time()
    }
    
    -- Group metrics by type
    local metric_groups = {}
    for i = 1, #metrics_data do
        local metric = metrics_data[i]
        local metric_type = metric.metric_type
        
        if not metric_groups[metric_type] then
            metric_groups[metric_type] = {}
        end
        
        table.insert(metric_groups[metric_type], metric)
    end
    
    -- Calculate correlations between different metric types
    local metric_types = {}
    for metric_type, _ in pairs(metric_groups) do
        table.insert(metric_types, metric_type)
    end
    
    for i = 1, #metric_types do
        for j = i + 1, #metric_types do
            local type1 = metric_types[i]
            local type2 = metric_types[j]
            
            local values1 = {}
            local values2 = {}
            local timestamps1 = {}
            local timestamps2 = {}
            
            -- Extract time series for each metric type
            for k = 1, #metric_groups[type1] do
                table.insert(values1, metric_groups[type1][k].value or 0)
                table.insert(timestamps1, metric_groups[type1][k].timestamp or 0)
            end
            
            for k = 1, #metric_groups[type2] do
                table.insert(values2, metric_groups[type2][k].value or 0)
                table.insert(timestamps2, metric_groups[type2][k].timestamp or 0)
            end
            
            -- Apply time lag if specified
            if lag_seconds > 0 then
                local lagged_values2 = {}
                for k = 1, #timestamps2 do
                    if timestamps2[k] >= lag_seconds then
                        table.insert(lagged_values2, values2[k])
                    end
                end
                values2 = lagged_values2
            end
            
            -- Calculate correlation if we have enough data
            if #values1 >= 5 and #values2 >= 5 then
                local min_length = math.min(#values1, #values2)
                local subset1 = {}
                local subset2 = {}
                
                for k = 1, min_length do
                    table.insert(subset1, values1[k])
                    table.insert(subset2, values2[k])
                end
                
                local correlation = calculate_correlation(subset1, subset2)
                
                if math.abs(correlation) >= threshold then
                    table.insert(correlation_results.correlations, {
                        metric_type1 = type1,
                        metric_type2 = type2,
                        correlation = correlation,
                        data_points = min_length,
                        significance = math.abs(correlation) > 0.8 and "high" or "medium",
                        lag_applied = lag_hours > 0
                    })
                end
            end
        end
    end
    
    -- Sort correlations by strength
    table.sort(correlation_results.correlations, 
               function(a, b) return math.abs(a.correlation) > math.abs(b.correlation) end)
    
    correlation_results.total_correlations = #correlation_results.correlations
    correlation_results.metric_types_analyzed = #metric_types
    
    return json.encode(correlation_results)
end
/