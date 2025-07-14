-- HANA PAL Simulation Advanced UDFs (5 UDFs)
-- Critical for advanced analytics and machine learning

-- 6. Advanced text mining and topic extraction
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.pal_text_mining_udf(
    text_corpus VARCHAR(2000000),
    mining_algorithm VARCHAR(100),
    topic_count DOUBLE,
    language VARCHAR(10)
) RETURNS VARCHAR(2000000) AS
function run(ctx)
    local json = require('json')
    
    -- Parse input parameters
    local corpus = json.decode(text_corpus)
    local algorithm = mining_algorithm or 'lda'
    local num_topics = topic_count or 5
    local lang = language or 'en'
    
    local mining_results = {
        topics_extracted = {},
        document_topic_distribution = {},
        term_frequency_analysis = {},
        mining_statistics = {}
    }
    
    -- Pre-defined topic models for financial text mining
    local financial_topics = {
        {
            topic_id = 1,
            topic_label = 'Market Performance',
            keywords = {
                {term = 'earnings', weight = 0.23},
                {term = 'revenue', weight = 0.21},
                {term = 'profit', weight = 0.19},
                {term = 'growth', weight = 0.18},
                {term = 'performance', weight = 0.15},
                {term = 'quarter', weight = 0.12},
                {term = 'results', weight = 0.10}
            },
            coherence_score = 0.78
        },
        {
            topic_id = 2,
            topic_label = 'Technology Innovation',
            keywords = {
                {term = 'artificial', weight = 0.25},
                {term = 'intelligence', weight = 0.24},
                {term = 'cloud', weight = 0.20},
                {term = 'digital', weight = 0.18},
                {term = 'innovation', weight = 0.16},
                {term = 'technology', weight = 0.14},
                {term = 'automation', weight = 0.12}
            },
            coherence_score = 0.82
        },
        {
            topic_id = 3,
            topic_label = 'Economic Policy',
            keywords = {
                {term = 'federal', weight = 0.26},
                {term = 'reserve', weight = 0.25},
                {term = 'interest', weight = 0.23},
                {term = 'policy', weight = 0.20},
                {term = 'inflation', weight = 0.18},
                {term = 'economy', weight = 0.15},
                {term = 'monetary', weight = 0.13}
            },
            coherence_score = 0.85
        },
        {
            topic_id = 4,
            topic_label = 'Corporate Actions',
            keywords = {
                {term = 'merger', weight = 0.24},
                {term = 'acquisition', weight = 0.23},
                {term = 'dividend', weight = 0.21},
                {term = 'buyback', weight = 0.19},
                {term = 'restructuring', weight = 0.17},
                {term = 'spinoff', weight = 0.14},
                {term = 'partnership', weight = 0.12}
            },
            coherence_score = 0.76
        },
        {
            topic_id = 5,
            topic_label = 'Market Volatility',
            keywords = {
                {term = 'volatility', weight = 0.27},
                {term = 'uncertainty', weight = 0.24},
                {term = 'risk', weight = 0.22},
                {term = 'decline', weight = 0.20},
                {term = 'correction', weight = 0.18},
                {term = 'bearish', weight = 0.15},
                {term = 'concern', weight = 0.13}
            },
            coherence_score = 0.73
        }
    }
    
    -- Select topics based on requested count
    local selected_topics = {}
    for i = 1, math.min(num_topics, #financial_topics) do
        table.insert(selected_topics, financial_topics[i])
    end
    
    -- Document-topic distribution simulation
    local doc_topic_dist = {}
    for i, document in ipairs(corpus) do
        local doc_id = document.doc_id or ('doc_' .. i)
        local content = document.content or document
        
        local topic_probabilities = {}
        local content_lower = content:lower()
        
        -- Calculate topic probabilities based on keyword matching
        for j, topic in ipairs(selected_topics) do
            local topic_score = 0
            local keyword_matches = 0
            
            for k, keyword in ipairs(topic.keywords) do
                if content_lower:find(keyword.term) then
                    topic_score = topic_score + keyword.weight
                    keyword_matches = keyword_matches + 1
                end
            end
            
            -- Normalize by content length and add some randomness
            local probability = (topic_score / #content) * 100 + (math.random() * 0.1)
            table.insert(topic_probabilities, {
                topic_id = topic.topic_id,
                topic_label = topic.topic_label,
                probability = probability,
                keyword_matches = keyword_matches
            })
        end
        
        -- Normalize probabilities to sum to 1
        local total_prob = 0
        for j, prob in ipairs(topic_probabilities) do
            total_prob = total_prob + prob.probability
        end
        
        if total_prob > 0 then
            for j, prob in ipairs(topic_probabilities) do
                prob.probability = prob.probability / total_prob
            end
        end
        
        table.insert(doc_topic_dist, {
            document_id = doc_id,
            content_length = #content,
            topic_distribution = topic_probabilities,
            dominant_topic = topic_probabilities[1] and topic_probabilities[1].topic_label or 'Unknown'
        })
    end
    
    -- Term frequency analysis
    local term_frequencies = {}
    local total_terms = 0
    
    for i, document in ipairs(corpus) do
        local content = document.content or document
        local content_lower = content:lower()
        
        -- Tokenize and count terms
        for term in content_lower:gmatch('%w+') do
            if #term > 3 then -- Filter short words
                if not term_frequencies[term] then
                    term_frequencies[term] = {
                        term = term,
                        frequency = 0,
                        document_frequency = 0,
                        tf_idf_score = 0
                    }
                end
                term_frequencies[term].frequency = term_frequencies[term].frequency + 1
                total_terms = total_terms + 1
            end
        end
    end
    
    -- Calculate TF-IDF scores
    local top_terms = {}
    for term, data in pairs(term_frequencies) do
        data.tf_idf_score = (data.frequency / total_terms) * math.log(#corpus / (data.document_frequency + 1))
        table.insert(top_terms, data)
    end
    
    -- Sort by TF-IDF score
    table.sort(top_terms, function(a, b) return a.tf_idf_score > b.tf_idf_score end)
    
    -- Take top 20 terms
    local top_20_terms = {}
    for i = 1, math.min(20, #top_terms) do
        table.insert(top_20_terms, top_terms[i])
    end
    
    -- Mining statistics
    local mining_stats = {
        algorithm_used = algorithm,
        topics_requested = num_topics,
        topics_extracted = #selected_topics,
        documents_processed = #corpus,
        total_terms_extracted = total_terms,
        unique_terms = (function() 
            local count = 0 
            for k, v in pairs(term_frequencies) do count = count + 1 end 
            return count 
        end)(),
        avg_document_length = total_terms / #corpus,
        language_detected = lang,
        coherence_scores = {},
        perplexity_score = 45.7, -- Simulated
        convergence_iterations = math.random(50, 150)
    }
    
    for i, topic in ipairs(selected_topics) do
        table.insert(mining_stats.coherence_scores, {
            topic_id = topic.topic_id,
            coherence = topic.coherence_score
        })
    end
    
    -- Set final results
    mining_results.topics_extracted = selected_topics
    mining_results.document_topic_distribution = doc_topic_dist
    mining_results.term_frequency_analysis = {
        top_terms = top_20_terms,
        total_unique_terms = mining_stats.unique_terms,
        vocabulary_richness = mining_stats.unique_terms / total_terms
    }
    mining_results.mining_statistics = mining_stats
    
    return json.encode(mining_results)
end
/

-- 7. K-means clustering for financial data grouping
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.pal_clustering_analysis_udf(
    dataset VARCHAR(2000000),
    cluster_count DOUBLE,
    algorithm_type VARCHAR(100),
    distance_metric VARCHAR(50)
) RETURNS VARCHAR(2000000) AS
function run(ctx)
    local json = require('json')
    
    -- Parse input parameters
    local data = json.decode(dataset)
    local k = cluster_count or 3
    local algorithm = algorithm_type or 'kmeans'
    local distance = distance_metric or 'euclidean'
    
    local clustering_results = {
        clusters = {},
        cluster_assignments = {},
        cluster_statistics = {},
        algorithm_performance = {}
    }
    
    -- Generate sample financial data if not provided
    local financial_data = data.data_points or {
        -- Sample stocks with features: [market_cap, pe_ratio, volatility, beta, dividend_yield]
        {symbol = 'AAPL', features = {2800, 28.5, 0.25, 1.2, 0.44}},
        {symbol = 'GOOGL', features = {1650, 22.1, 0.28, 1.1, 0.0}},
        {symbol = 'MSFT', features = {2400, 31.2, 0.23, 0.9, 0.72}},
        {symbol = 'TSLA', features = {800, 45.7, 0.52, 1.8, 0.0}},
        {symbol = 'AMZN', features = {1200, 38.9, 0.31, 1.3, 0.0}},
        {symbol = 'JPM', features = {450, 11.2, 0.33, 1.1, 2.45}},
        {symbol = 'BAC', features = {320, 9.8, 0.38, 1.4, 2.78}},
        {symbol = 'WFC', features = {180, 8.9, 0.41, 1.3, 3.12}},
        {symbol = 'JNJ', features = {420, 16.4, 0.18, 0.7, 2.85}},
        {symbol = 'PG', features = {380, 24.1, 0.19, 0.6, 2.41}},
        {symbol = 'XOM', features = {280, 12.7, 0.45, 1.2, 5.89}},
        {symbol = 'CVX', features = {320, 14.3, 0.42, 1.1, 3.12}}
    }
    
    -- Distance calculation functions
    local function euclidean_distance(point1, point2)
        local sum = 0
        for i = 1, #point1 do
            sum = sum + math.pow(point1[i] - point2[i], 2)
        end
        return math.sqrt(sum)
    end
    
    local function manhattan_distance(point1, point2)
        local sum = 0
        for i = 1, #point1 do
            sum = sum + math.abs(point1[i] - point2[i])
        end
        return sum
    end
    
    local function cosine_distance(point1, point2)
        local dot_product = 0
        local norm1 = 0
        local norm2 = 0
        
        for i = 1, #point1 do
            dot_product = dot_product + point1[i] * point2[i]
            norm1 = norm1 + point1[i] * point1[i]
            norm2 = norm2 + point2[i] * point2[i]
        end
        
        norm1 = math.sqrt(norm1)
        norm2 = math.sqrt(norm2)
        
        if norm1 == 0 or norm2 == 0 then
            return 1
        end
        
        return 1 - (dot_product / (norm1 * norm2))
    end
    
    local distance_function = euclidean_distance
    if distance == 'manhattan' then
        distance_function = manhattan_distance
    elseif distance == 'cosine' then
        distance_function = cosine_distance
    end
    
    -- Normalize features (important for clustering)
    local normalized_data = {}
    local feature_stats = {}
    
    -- Calculate feature statistics
    for feature_idx = 1, #financial_data[1].features do
        local values = {}
        for i = 1, #financial_data do
            table.insert(values, financial_data[i].features[feature_idx])
        end
        
        table.sort(values)
        local min_val = values[1]
        local max_val = values[#values]
        local sum = 0
        for i = 1, #values do
            sum = sum + values[i]
        end
        local mean = sum / #values
        
        feature_stats[feature_idx] = {
            min = min_val,
            max = max_val,
            mean = mean,
            range = max_val - min_val
        }
    end
    
    -- Normalize data
    for i = 1, #financial_data do
        local normalized_features = {}
        for j = 1, #financial_data[i].features do
            local normalized = (financial_data[i].features[j] - feature_stats[j].min) / feature_stats[j].range
            table.insert(normalized_features, normalized)
        end
        
        table.insert(normalized_data, {
            symbol = financial_data[i].symbol,
            original_features = financial_data[i].features,
            normalized_features = normalized_features
        })
    end
    
    -- K-means clustering algorithm
    local centroids = {}
    local assignments = {}
    
    -- Initialize centroids randomly
    for i = 1, k do
        local centroid = {}
        for j = 1, #normalized_data[1].normalized_features do
            table.insert(centroid, math.random())
        end
        table.insert(centroids, centroid)
    end
    
    -- K-means iterations
    local max_iterations = 100
    local converged = false
    local iteration = 0
    
    while iteration < max_iterations and not converged do
        iteration = iteration + 1
        local new_assignments = {}
        
        -- Assign points to closest centroids
        for i = 1, #normalized_data do
            local min_distance = math.huge
            local best_cluster = 1
            
            for j = 1, k do
                local dist = distance_function(normalized_data[i].normalized_features, centroids[j])
                if dist < min_distance then
                    min_distance = dist
                    best_cluster = j
                end
            end
            
            new_assignments[i] = {
                cluster_id = best_cluster,
                distance_to_centroid = min_distance
            }
        end
        
        -- Update centroids
        local new_centroids = {}
        for i = 1, k do
            local cluster_points = {}
            for j = 1, #normalized_data do
                if new_assignments[j].cluster_id == i then
                    table.insert(cluster_points, normalized_data[j].normalized_features)
                end
            end
            
            if #cluster_points > 0 then
                local new_centroid = {}
                for feature_idx = 1, #normalized_data[1].normalized_features do
                    local sum = 0
                    for point_idx = 1, #cluster_points do
                        sum = sum + cluster_points[point_idx][feature_idx]
                    end
                    table.insert(new_centroid, sum / #cluster_points)
                end
                table.insert(new_centroids, new_centroid)
            else
                table.insert(new_centroids, centroids[i]) -- Keep old centroid if no points assigned
            end
        end
        
        -- Check convergence
        converged = true
        for i = 1, k do
            if distance_function(centroids[i], new_centroids[i]) > 0.001 then
                converged = false
                break
            end
        end
        
        centroids = new_centroids
        assignments = new_assignments
    end
    
    -- Create cluster results
    local clusters = {}
    for i = 1, k do
        local cluster_members = {}
        local cluster_features = {}
        
        for j = 1, #normalized_data do
            if assignments[j].cluster_id == i then
                table.insert(cluster_members, {
                    symbol = normalized_data[j].symbol,
                    distance_to_centroid = assignments[j].distance_to_centroid,
                    original_features = normalized_data[j].original_features
                })
                table.insert(cluster_features, normalized_data[j].normalized_features)
            end
        end
        
        -- Calculate cluster statistics
        local cluster_size = #cluster_members
        local intra_cluster_distance = 0
        
        if cluster_size > 1 then
            for m = 1, cluster_size do
                for n = m + 1, cluster_size do
                    intra_cluster_distance = intra_cluster_distance + 
                        distance_function(cluster_features[m], cluster_features[n])
                end
            end
            intra_cluster_distance = intra_cluster_distance / (cluster_size * (cluster_size - 1) / 2)
        end
        
        table.insert(clusters, {
            cluster_id = i,
            centroid = centroids[i],
            members = cluster_members,
            cluster_size = cluster_size,
            intra_cluster_distance = intra_cluster_distance,
            cluster_label = cluster_size > 0 and (
                cluster_size >= 4 and 'Large Cap Stocks' or
                cluster_size >= 2 and 'Mid Cap Stocks' or
                'Small Cap Stocks'
            ) or 'Empty Cluster'
        })
    end
    
    -- Cluster assignments
    for i = 1, #normalized_data do
        table.insert(clustering_results.cluster_assignments, {
            symbol = normalized_data[i].symbol,
            cluster_id = assignments[i].cluster_id,
            distance_to_centroid = assignments[i].distance_to_centroid
        })
    end
    
    -- Calculate clustering quality metrics
    local silhouette_score = 0.72 -- Simulated
    local within_sum_squares = 0
    local between_sum_squares = 0
    
    for i = 1, #clusters do
        within_sum_squares = within_sum_squares + (clusters[i].intra_cluster_distance * clusters[i].cluster_size)
    end
    
    -- Set final results
    clustering_results.clusters = clusters
    clustering_results.cluster_statistics = {
        algorithm_used = algorithm,
        distance_metric = distance,
        clusters_requested = k,
        clusters_created = #clusters,
        total_data_points = #normalized_data,
        iterations_to_convergence = iteration,
        converged = converged,
        silhouette_score = silhouette_score,
        within_sum_squares = within_sum_squares,
        feature_statistics = feature_stats
    }
    
    clustering_results.algorithm_performance = {
        execution_time_ms = iteration * 10, -- Simulated
        memory_usage_mb = #normalized_data * 0.05,
        convergence_rate = converged and 'converged' or 'max_iterations_reached',
        stability_score = 0.85,
        optimal_k_suggestion = k + (silhouette_score < 0.5 and -1 or 0)
    }
    
    return json.encode(clustering_results)
end
/

-- 8. ML classification for risk/sentiment categories
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.pal_classification_udf(
    training_data VARCHAR(2000000),
    model_type VARCHAR(100),
    features VARCHAR(2000000),
    target_variable VARCHAR(100)
) RETURNS VARCHAR(2000000) AS
function run(ctx)
    local json = require('json')
    
    -- Parse input parameters
    local train_data = json.decode(training_data)
    local model = model_type or 'decision_tree'
    local feature_list = json.decode(features) or {'sentiment_score', 'volatility', 'volume', 'price_change'}
    local target = target_variable or 'risk_category'
    
    local classification_results = {
        model_summary = {},
        feature_importance = {},
        performance_metrics = {},
        predictions = {}
    }
    
    -- Generate sample training data if not provided
    local sample_data = train_data.samples or {
        {sentiment_score = 0.8, volatility = 0.15, volume = 1500000, price_change = 0.03, risk_category = 'LOW'},
        {sentiment_score = 0.6, volatility = 0.22, volume = 2100000, price_change = 0.01, risk_category = 'MEDIUM'},
        {sentiment_score = 0.2, volatility = 0.35, volume = 3200000, price_change = -0.02, risk_category = 'HIGH'},
        {sentiment_score = 0.9, volatility = 0.12, volume = 800000, price_change = 0.05, risk_category = 'LOW'},
        {sentiment_score = 0.4, volatility = 0.28, volume = 2800000, price_change = -0.01, risk_category = 'MEDIUM'},
        {sentiment_score = 0.1, volatility = 0.42, volume = 4100000, price_change = -0.04, risk_category = 'HIGH'},
        {sentiment_score = 0.75, volatility = 0.18, volume = 1200000, price_change = 0.02, risk_category = 'LOW'},
        {sentiment_score = 0.55, volatility = 0.25, volume = 1900000, price_change = 0.005, risk_category = 'MEDIUM'},
        {sentiment_score = 0.3, volatility = 0.38, volume = 3500000, price_change = -0.03, risk_category = 'HIGH'},
        {sentiment_score = 0.85, volatility = 0.14, volume = 950000, price_change = 0.04, risk_category = 'LOW'}
    }
    
    -- Feature normalization and analysis
    local feature_stats = {}
    for i, feature in ipairs(feature_list) do
        local values = {}
        for j, sample in ipairs(sample_data) do
            if sample[feature] then
                table.insert(values, sample[feature])
            end
        end
        
        if #values > 0 then
            table.sort(values)
            local sum = 0
            for k, val in ipairs(values) do
                sum = sum + val
            end
            
            feature_stats[feature] = {
                min = values[1],
                max = values[#values],
                mean = sum / #values,
                median = values[math.ceil(#values / 2)],
                std_dev = 0 -- Simplified
            }
        end
    end
    
    -- Model training simulation
    local model_params = {}
    local feature_importance = {}
    
    if model == 'decision_tree' then
        model_params = {
            max_depth = 10,
            min_samples_split = 2,
            min_samples_leaf = 1,
            criterion = 'gini'
        }
        
        -- Simulate feature importance for decision tree
        feature_importance = {
            {feature = 'volatility', importance = 0.45, gain = 0.34},
            {feature = 'sentiment_score', importance = 0.32, gain = 0.28},
            {feature = 'price_change', importance = 0.15, gain = 0.12},
            {feature = 'volume', importance = 0.08, gain = 0.06}
        }
        
    elseif model == 'random_forest' then
        model_params = {
            n_estimators = 100,
            max_depth = 15,
            min_samples_split = 5,
            bootstrap = true
        }
        
        feature_importance = {
            {feature = 'sentiment_score', importance = 0.38, gain = 0.31},
            {feature = 'volatility', importance = 0.35, gain = 0.29},
            {feature = 'price_change', importance = 0.18, gain = 0.15},
            {feature = 'volume', importance = 0.09, gain = 0.07}
        }
        
    elseif model == 'svm' then
        model_params = {
            kernel = 'rbf',
            c_parameter = 1.0,
            gamma = 'scale',
            class_weight = 'balanced'
        }
        
        -- SVM doesn't provide direct feature importance
        feature_importance = {
            {feature = 'volatility', importance = 0.42, coefficient = 1.23},
            {feature = 'sentiment_score', importance = 0.35, coefficient = -0.89},
            {feature = 'price_change', importance = 0.15, coefficient = 0.67},
            {feature = 'volume', importance = 0.08, coefficient = 0.34}
        }
        
    elseif model == 'logistic_regression' then
        model_params = {
            regularization = 'l2',
            c_parameter = 1.0,
            max_iterations = 1000,
            solver = 'lbfgs'
        }
        
        feature_importance = {
            {feature = 'sentiment_score', importance = 0.41, coefficient = -1.45},
            {feature = 'volatility', importance = 0.39, coefficient = 2.12},
            {feature = 'price_change', importance = 0.13, coefficient = -0.78},
            {feature = 'volume', importance = 0.07, coefficient = 0.23}
        }
    end
    
    -- Performance metrics simulation
    local class_distribution = {LOW = 0, MEDIUM = 0, HIGH = 0}
    for i, sample in ipairs(sample_data) do
        class_distribution[sample[target]] = (class_distribution[sample[target]] or 0) + 1
    end
    
    local total_samples = #sample_data
    local performance_metrics = {
        accuracy = 0.87,
        precision = {
            LOW = 0.92,
            MEDIUM = 0.84,
            HIGH = 0.89
        },
        recall = {
            LOW = 0.88,
            MEDIUM = 0.81,
            HIGH = 0.94
        },
        f1_score = {
            LOW = 0.90,
            MEDIUM = 0.82,
            HIGH = 0.91
        },
        confusion_matrix = {
            {actual = 'LOW', predicted = 'LOW', count = 3},
            {actual = 'LOW', predicted = 'MEDIUM', count = 0},
            {actual = 'LOW', predicted = 'HIGH', count = 0},
            {actual = 'MEDIUM', predicted = 'LOW', count = 0},
            {actual = 'MEDIUM', predicted = 'MEDIUM', count = 2},
            {actual = 'MEDIUM', predicted = 'HIGH', count = 1},
            {actual = 'HIGH', predicted = 'LOW', count = 0},
            {actual = 'HIGH', predicted = 'MEDIUM', count = 0},
            {actual = 'HIGH', predicted = 'HIGH', count = 3}
        },
        cross_validation_score = 0.85,
        class_distribution = class_distribution
    }
    
    -- Generate predictions for sample test data
    local test_predictions = {
        {
            features = {sentiment_score = 0.7, volatility = 0.20, volume = 1800000, price_change = 0.015},
            predicted_class = 'MEDIUM',
            prediction_confidence = 0.78,
            class_probabilities = {LOW = 0.15, MEDIUM = 0.78, HIGH = 0.07}
        },
        {
            features = {sentiment_score = 0.2, volatility = 0.40, volume = 3800000, price_change = -0.035},
            predicted_class = 'HIGH',
            prediction_confidence = 0.91,
            class_probabilities = {LOW = 0.02, MEDIUM = 0.07, HIGH = 0.91}
        },
        {
            features = {sentiment_score = 0.9, volatility = 0.10, volume = 700000, price_change = 0.06},
            predicted_class = 'LOW',
            prediction_confidence = 0.95,
            class_probabilities = {LOW = 0.95, MEDIUM = 0.04, HIGH = 0.01}
        }
    }
    
    -- Model summary
    classification_results.model_summary = {
        model_type = model,
        target_variable = target,
        features_used = feature_list,
        training_samples = total_samples,
        model_parameters = model_params,
        training_time_ms = math.random(500, 2000),
        model_size_mb = math.random(1, 10),
        cross_validation_folds = 5
    }
    
    classification_results.feature_importance = feature_importance
    classification_results.performance_metrics = performance_metrics
    classification_results.predictions = test_predictions
    
    return json.encode(classification_results)
end
/

-- 9. Predictive regression analysis for price forecasting
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.pal_regression_analysis_udf(
    historical_data VARCHAR(2000000),
    regression_type VARCHAR(100),
    prediction_horizon DOUBLE
) RETURNS VARCHAR(2000000) AS
function run(ctx)
    local json = require('json')
    
    -- Parse input parameters
    local hist_data = json.decode(historical_data)
    local reg_type = regression_type or 'linear'
    local horizon = prediction_horizon or 5
    
    local regression_results = {
        model_coefficients = {},
        predictions = {},
        model_diagnostics = {},
        statistical_analysis = {}
    }
    
    -- Generate sample historical price data if not provided
    local price_data = hist_data.prices or {
        {date = '2025-07-01', price = 150.25, volume = 1200000, sentiment = 0.6},
        {date = '2025-07-02', price = 151.30, volume = 1350000, sentiment = 0.7},
        {date = '2025-07-03', price = 149.80, volume = 1800000, sentiment = 0.4},
        {date = '2025-07-04', price = 152.10, volume = 1100000, sentiment = 0.8},
        {date = '2025-07-05', price = 150.95, volume = 1450000, sentiment = 0.5},
        {date = '2025-07-06', price = 153.20, volume = 1250000, sentiment = 0.75},
        {date = '2025-07-07', price = 151.75, volume = 1600000, sentiment = 0.6},
        {date = '2025-07-08', price = 152.90, volume = 1300000, sentiment = 0.8},
        {date = '2025-07-09', price = 150.40, volume = 1750000, sentiment = 0.3},
        {date = '2025-07-10', price = 154.15, volume = 1150000, sentiment = 0.9}
    }
    
    -- Feature engineering
    local features = {}
    local targets = {}
    
    for i = 2, #price_data do
        local price_change = (price_data[i].price - price_data[i-1].price) / price_data[i-1].price
        local volume_change = (price_data[i].volume - price_data[i-1].volume) / price_data[i-1].volume
        
        table.insert(features, {
            price_lag1 = price_data[i-1].price,
            volume = price_data[i].volume,
            volume_change = volume_change,
            sentiment = price_data[i].sentiment,
            day_index = i
        })
        
        table.insert(targets, price_data[i].price)
    end
    
    -- Model coefficients based on regression type
    local coefficients = {}
    local model_stats = {}
    
    if reg_type == 'linear' then
        coefficients = {
            intercept = 5.23,
            price_lag1 = 0.965,
            volume = 0.000002,
            volume_change = 2.15,
            sentiment = 1.87,
            day_index = 0.12
        }
        
        model_stats = {
            r_squared = 0.78,
            adjusted_r_squared = 0.75,
            rmse = 1.24,
            mae = 0.89,
            mape = 0.58
        }
        
    elseif reg_type == 'polynomial' then
        coefficients = {
            intercept = 12.45,
            price_lag1 = 0.823,
            price_lag1_squared = 0.0012,
            volume = 0.000003,
            sentiment = 2.34,
            sentiment_squared = -1.12,
            day_index = 0.15
        }
        
        model_stats = {
            r_squared = 0.84,
            adjusted_r_squared = 0.80,
            rmse = 1.08,
            mae = 0.76,
            mape = 0.51
        }
        
    elseif reg_type == 'ridge' then
        coefficients = {
            intercept = 8.12,
            price_lag1 = 0.891,
            volume = 0.0000015,
            volume_change = 1.78,
            sentiment = 1.45,
            day_index = 0.08
        }
        
        model_stats = {
            r_squared = 0.76,
            adjusted_r_squared = 0.72,
            rmse = 1.31,
            mae = 0.94,
            mape = 0.62,
            alpha = 1.0
        }
        
    elseif reg_type == 'lasso' then
        coefficients = {
            intercept = 6.89,
            price_lag1 = 0.934,
            volume = 0.0,  -- Feature selected out
            volume_change = 1.92,
            sentiment = 1.67,
            day_index = 0.0  -- Feature selected out
        }
        
        model_stats = {
            r_squared = 0.74,
            adjusted_r_squared = 0.69,
            rmse = 1.38,
            mae = 1.02,
            mape = 0.67,
            alpha = 0.1,
            features_selected = 4
        }
    end
    
    -- Generate predictions
    local predictions = {}
    local last_price = price_data[#price_data].price
    local last_volume = price_data[#price_data].volume
    local last_sentiment = price_data[#price_data].sentiment
    
    for i = 1, horizon do
        local predicted_price = coefficients.intercept + 
                              coefficients.price_lag1 * last_price +
                              (coefficients.volume or 0) * last_volume +
                              (coefficients.sentiment or 0) * last_sentiment +
                              (coefficients.day_index or 0) * (#price_data + i)
        
        -- Add polynomial terms if applicable
        if coefficients.price_lag1_squared then
            predicted_price = predicted_price + coefficients.price_lag1_squared * (last_price * last_price)
        end
        
        if coefficients.sentiment_squared then
            predicted_price = predicted_price + coefficients.sentiment_squared * (last_sentiment * last_sentiment)
        end
        
        -- Calculate prediction intervals
        local prediction_std = model_stats.rmse * math.sqrt(1 + 1/#features) -- Simplified
        local confidence_interval = {
            lower_95 = predicted_price - 1.96 * prediction_std,
            upper_95 = predicted_price + 1.96 * prediction_std,
            lower_80 = predicted_price - 1.28 * prediction_std,
            upper_80 = predicted_price + 1.28 * prediction_std
        }
        
        table.insert(predictions, {
            period = i,
            predicted_date = os.date('%Y-%m-%d', os.time() + i * 86400),
            predicted_price = predicted_price,
            confidence_intervals = confidence_interval,
            prediction_error_est = prediction_std
        })
        
        -- Update for next prediction (simplified)
        last_price = predicted_price
        last_sentiment = last_sentiment * 0.9 + 0.1 * 0.6 -- Decay towards neutral
    end
    
    -- Model diagnostics
    local residuals = {}
    local predicted_values = {}
    
    for i = 1, #features do
        local predicted = coefficients.intercept + 
                         coefficients.price_lag1 * features[i].price_lag1 +
                         (coefficients.volume or 0) * features[i].volume +
                         (coefficients.sentiment or 0) * features[i].sentiment +
                         (coefficients.day_index or 0) * features[i].day_index
        
        local residual = targets[i] - predicted
        
        table.insert(predicted_values, predicted)
        table.insert(residuals, residual)
    end
    
    -- Statistical tests
    local durbin_watson = 1.85 -- Simulated autocorrelation test
    local jarque_bera_p = 0.23 -- Simulated normality test
    local breusch_pagan_p = 0.67 -- Simulated heteroscedasticity test
    
    -- Set final results
    regression_results.model_coefficients = {
        coefficients = coefficients,
        regression_type = reg_type,
        features_used = {'price_lag1', 'volume', 'volume_change', 'sentiment', 'day_index'},
        model_equation = reg_type == 'linear' and 'y = β₀ + β₁x₁ + β₂x₂ + ... + ε' or
                        reg_type == 'polynomial' and 'y = β₀ + β₁x₁ + β₂x₁² + ... + ε' or
                        'Regularized linear regression'
    }
    
    regression_results.predictions = predictions
    
    regression_results.model_diagnostics = {
        performance_metrics = model_stats,
        residual_analysis = {
            mean_residual = 0.02,
            residual_std = model_stats.rmse,
            min_residual = -2.34,
            max_residual = 2.89
        },
        statistical_tests = {
            durbin_watson = durbin_watson,
            autocorrelation = durbin_watson < 1.5 and 'positive' or durbin_watson > 2.5 and 'negative' or 'none',
            jarque_bera_p_value = jarque_bera_p,
            normality = jarque_bera_p > 0.05 and 'normal' or 'non_normal',
            breusch_pagan_p_value = breusch_pagan_p,
            heteroscedasticity = breusch_pagan_p > 0.05 and 'homoscedastic' or 'heteroscedastic'
        }
    }
    
    regression_results.statistical_analysis = {
        sample_size = #features,
        degrees_of_freedom = #features - (function() 
            local count = 0 
            for k, v in pairs(coefficients) do count = count + 1 end 
            return count 
        end)(),
        prediction_horizon = horizon,
        model_complexity = reg_type == 'polynomial' and 'high' or 
                          reg_type == 'linear' and 'low' or 'medium',
        overfitting_risk = model_stats.r_squared - model_stats.adjusted_r_squared > 0.05 and 'high' or 'low'
    }
    
    return json.encode(regression_results)
end
/

-- 10. Time series forecasting for market trends
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.pal_time_series_forecast_udf(
    time_series_data VARCHAR(2000000),
    forecast_method VARCHAR(100),
    prediction_periods DOUBLE
) RETURNS VARCHAR(2000000) AS
function run(ctx)
    local json = require('json')
    
    -- Parse input parameters
    local ts_data = json.decode(time_series_data)
    local method = forecast_method or 'arima'
    local periods = prediction_periods or 10
    
    local forecast_results = {
        model_parameters = {},
        forecasts = {},
        model_diagnostics = {},
        trend_analysis = {}
    }
    
    -- Generate sample time series data if not provided
    local time_series = ts_data.series or {
        {timestamp = '2025-06-01', value = 150.25},
        {timestamp = '2025-06-02', value = 151.30},
        {timestamp = '2025-06-03', value = 149.80},
        {timestamp = '2025-06-04', value = 152.10},
        {timestamp = '2025-06-05', value = 150.95},
        {timestamp = '2025-06-06', value = 153.20},
        {timestamp = '2025-06-07', value = 151.75},
        {timestamp = '2025-06-08', value = 152.90},
        {timestamp = '2025-06-09', value = 150.40},
        {timestamp = '2025-06-10', value = 154.15},
        {timestamp = '2025-06-11', value = 155.30},
        {timestamp = '2025-06-12', value = 153.85},
        {timestamp = '2025-06-13', value = 156.20}
    }
    
    -- Extract values for analysis
    local values = {}
    for i, point in ipairs(time_series) do
        table.insert(values, point.value)
    end
    
    -- Time series decomposition
    local function calculate_trend(data)
        local trend = {}
        local window = math.min(5, math.floor(#data / 3))
        
        for i = 1, #data do
            local start_idx = math.max(1, i - window)
            local end_idx = math.min(#data, i + window)
            local sum = 0
            local count = 0
            
            for j = start_idx, end_idx do
                sum = sum + data[j]
                count = count + 1
            end
            
            table.insert(trend, sum / count)
        end
        
        return trend
    end
    
    local function calculate_seasonality(data, trend, period)
        local seasonal = {}
        local detrended = {}
        
        for i = 1, #data do
            table.insert(detrended, data[i] - trend[i])
        end
        
        -- Simple seasonal pattern detection
        for i = 1, #data do
            local seasonal_avg = 0
            local count = 0
            
            for j = i, #data, period do
                seasonal_avg = seasonal_avg + detrended[j]
                count = count + 1
            end
            
            table.insert(seasonal, count > 0 and seasonal_avg / count or 0)
        end
        
        return seasonal
    end
    
    local trend_component = calculate_trend(values)
    local seasonal_component = calculate_seasonality(values, trend_component, 7) -- Weekly seasonality
    
    -- Model parameters based on forecast method
    local model_params = {}
    local forecasts = {}
    
    if method == 'arima' then
        model_params = {
            p = 2, -- AR order
            d = 1, -- Differencing order
            q = 1, -- MA order
            aic = 234.5,
            bic = 241.8,
            log_likelihood = -112.3,
            coefficients = {
                ar1 = 0.65,
                ar2 = 0.23,
                ma1 = -0.45,
                intercept = 0.12
            }
        }
        
        -- ARIMA forecasting simulation
        local last_values = {values[#values], values[#values-1]}
        local last_errors = {0.5, -0.3} -- Simulated residuals
        
        for i = 1, periods do
            local forecast = model_params.coefficients.intercept +
                           model_params.coefficients.ar1 * last_values[1] +
                           model_params.coefficients.ar2 * last_values[2] +
                           model_params.coefficients.ma1 * last_errors[1]
            
            -- Add trend
            local trend_forecast = trend_component[#trend_component] + (i * 0.05)
            forecast = forecast + trend_forecast
            
            -- Calculate prediction intervals
            local forecast_se = 1.2 * math.sqrt(i) -- Standard error increases with horizon
            
            table.insert(forecasts, {
                period = i,
                timestamp = os.date('%Y-%m-%d', os.time() + i * 86400),
                point_forecast = forecast,
                lower_80 = forecast - 1.28 * forecast_se,
                upper_80 = forecast + 1.28 * forecast_se,
                lower_95 = forecast - 1.96 * forecast_se,
                upper_95 = forecast + 1.96 * forecast_se,
                forecast_se = forecast_se
            })
            
            -- Update for next iteration
            last_values = {forecast, last_values[1]}
            last_errors = {math.random(-1, 1), last_errors[1]}
        end
        
    elseif method == 'exponential_smoothing' then
        model_params = {
            alpha = 0.3, -- Level smoothing
            beta = 0.2,  -- Trend smoothing
            gamma = 0.1, -- Seasonal smoothing
            smoothing_type = 'holt_winters',
            seasonal_periods = 7,
            aic = 245.2
        }
        
        -- Exponential smoothing forecasting
        local level = values[#values]
        local trend_est = (values[#values] - values[#values-1])
        
        for i = 1, periods do
            local forecast = level + i * trend_est
            
            -- Add seasonal component
            local seasonal_index = ((#values + i - 1) % 7) + 1
            local seasonal_factor = seasonal_component[seasonal_index] or 0
            forecast = forecast + seasonal_factor
            
            local forecast_se = 0.8 * math.sqrt(i)
            
            table.insert(forecasts, {
                period = i,
                timestamp = os.date('%Y-%m-%d', os.time() + i * 86400),
                point_forecast = forecast,
                lower_80 = forecast - 1.28 * forecast_se,
                upper_80 = forecast + 1.28 * forecast_se,
                lower_95 = forecast - 1.96 * forecast_se,
                upper_95 = forecast + 1.96 * forecast_se,
                forecast_se = forecast_se
            })
        end
        
    elseif method == 'prophet' then
        model_params = {
            growth = 'linear',
            changepoints = {'2025-06-05', '2025-06-10'},
            seasonality_mode = 'additive',
            yearly_seasonality = false,
            weekly_seasonality = true,
            daily_seasonality = false,
            uncertainty_samples = 1000
        }
        
        -- Prophet-style forecasting
        local base_growth = 0.02
        local weekly_pattern = {0.1, -0.05, 0.02, -0.03, 0.08, 0.15, -0.12} -- Mon-Sun
        
        for i = 1, periods do
            local trend_forecast = values[#values] + (i * base_growth)
            local day_of_week = ((#values + i - 1) % 7) + 1
            local seasonal_adj = weekly_pattern[day_of_week]
            
            local forecast = trend_forecast + seasonal_adj
            local forecast_se = 1.1 * math.sqrt(i)
            
            table.insert(forecasts, {
                period = i,
                timestamp = os.date('%Y-%m-%d', os.time() + i * 86400),
                point_forecast = forecast,
                lower_80 = forecast - 1.28 * forecast_se,
                upper_80 = forecast + 1.28 * forecast_se,
                lower_95 = forecast - 1.96 * forecast_se,
                upper_95 = forecast + 1.96 * forecast_se,
                forecast_se = forecast_se,
                trend_component = trend_forecast,
                seasonal_component = seasonal_adj
            })
        end
    end
    
    -- Model diagnostics
    local residuals = {}
    local fitted_values = {}
    
    -- Simulate fitted values and residuals
    for i = 1, #values do
        local fitted = values[i] + math.random(-1, 1) * 0.5 -- Simulated fitted value
        local residual = values[i] - fitted
        
        table.insert(fitted_values, fitted)
        table.insert(residuals, residual)
    end
    
    -- Calculate diagnostic statistics
    local mean_residual = 0
    local residual_sum_sq = 0
    
    for i = 1, #residuals do
        mean_residual = mean_residual + residuals[i]
        residual_sum_sq = residual_sum_sq + (residuals[i] * residuals[i])
    end
    
    mean_residual = mean_residual / #residuals
    local residual_se = math.sqrt(residual_sum_sq / (#residuals - 1))
    
    -- Trend analysis
    local first_half = {}
    local second_half = {}
    local midpoint = math.floor(#values / 2)
    
    for i = 1, midpoint do
        table.insert(first_half, values[i])
    end
    
    for i = midpoint + 1, #values do
        table.insert(second_half, values[i])
    end
    
    local function average(arr)
        local sum = 0
        for i = 1, #arr do
            sum = sum + arr[i]
        end
        return #arr > 0 and sum / #arr or 0
    end
    
    local trend_direction = average(second_half) > average(first_half) and 'increasing' or 'decreasing'
    local trend_strength = math.abs(average(second_half) - average(first_half)) / average(first_half)
    
    -- Set final results
    forecast_results.model_parameters = {
        method = method,
        parameters = model_params,
        fitted_periods = #values,
        forecast_periods = periods
    }
    
    forecast_results.forecasts = forecasts
    
    forecast_results.model_diagnostics = {
        residual_statistics = {
            mean_error = mean_residual,
            rmse = residual_se,
            mae = residual_se * 0.8, -- Approximation
            mape = 2.5, -- Simulated
            mase = 0.85 -- Simulated
        },
        information_criteria = {
            aic = model_params.aic or 240.0,
            bic = (model_params.aic or 240.0) + 5,
            hqc = (model_params.aic or 240.0) + 2.5
        },
        ljung_box_test = {
            statistic = 8.45,
            p_value = 0.67,
            autocorrelation_present = false
        }
    }
    
    forecast_results.trend_analysis = {
        trend_direction = trend_direction,
        trend_strength = trend_strength,
        seasonal_pattern_detected = true,
        seasonal_strength = 0.15,
        cycle_length = 7,
        volatility = residual_se,
        stationarity = 'stationary',
        outliers_detected = 0
    }
    
    return json.encode(forecast_results)
end
/