-- Complex Operations UDFs (3 UDFs)
-- Critical for multi-table operations and advanced analytics

-- 8. Handle multi-table JOIN operations
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.execute_complex_join_udf(
    table_specs VARCHAR(2000000),
    join_conditions VARCHAR(2000000),
    filter_criteria VARCHAR(2000000)
) RETURNS VARCHAR(2000000) AS
function run(ctx)
    local json = require('json')
    
    -- Parse input parameters
    local tables = json.decode(table_specs)
    local joins = json.decode(join_conditions)
    local filters = json.decode(filter_criteria) or {}
    
    local join_results = {
        query_plan = {},
        execution_stats = {},
        result_preview = {},
        performance_metrics = {}
    }
    
    -- Simulate table metadata and statistics
    local table_metadata = {
        news_articles = {
            row_count = 150000,
            columns = {'article_id', 'title', 'content', 'publish_date', 'sentiment_score', 'source_id'},
            indexes = {'article_id_idx', 'publish_date_idx', 'source_id_idx'},
            avg_row_size = 2048
        },
        market_data = {
            row_count = 500000,
            columns = {'symbol', 'price', 'volume', 'timestamp', 'source'},
            indexes = {'symbol_timestamp_idx', 'timestamp_idx'},
            avg_row_size = 128
        },
        sentiment_analysis = {
            row_count = 75000,
            columns = {'article_id', 'sentiment_score', 'confidence', 'analysis_timestamp'},
            indexes = {'article_id_idx', 'analysis_timestamp_idx'},
            avg_row_size = 96
        },
        user_interactions = {
            row_count = 1000000,
            columns = {'interaction_id', 'user_id', 'article_id', 'interaction_type', 'timestamp'},
            indexes = {'user_id_idx', 'article_id_idx', 'timestamp_idx'},
            avg_row_size = 64
        }
    }
    
    -- Build query plan
    local query_plan = {
        join_order = {},
        join_types = {},
        estimated_cost = 0,
        estimated_rows = 0
    }
    
    -- Analyze join complexity
    local total_tables = #tables
    local join_complexity = 'simple'
    
    if total_tables <= 2 then
        join_complexity = 'simple'
    elseif total_tables <= 4 then
        join_complexity = 'moderate'
    else
        join_complexity = 'complex'
    end
    
    -- Optimize join order (simulate cost-based optimization)
    local sorted_tables = {}
    for i, table_spec in ipairs(tables) do
        local table_name = table_spec.table_name
        local metadata = table_metadata[table_name]
        if metadata then
            table.insert(sorted_tables, {
                name = table_name,
                alias = table_spec.alias or table_name,
                row_count = metadata.row_count,
                selectivity = 1.0 / metadata.row_count
            })
        end
    end
    
    -- Sort by row count (smallest first for better join performance)
    table.sort(sorted_tables, function(a, b) return a.row_count < b.row_count end)
    
    query_plan.join_order = sorted_tables
    
    -- Estimate execution cost and result size
    local estimated_cost = 0
    local estimated_rows = 1
    
    for i, table_info in ipairs(sorted_tables) do
        estimated_cost = estimated_cost + (table_info.row_count * 0.1) -- Scan cost
        if i > 1 then
            estimated_cost = estimated_cost + (estimated_rows * table_info.row_count * 0.01) -- Join cost
        end
        estimated_rows = estimated_rows * table_info.row_count * table_info.selectivity
    end
    
    -- Apply filter selectivity
    for i, filter in ipairs(filters) do
        if filter.operator == '=' then
            estimated_rows = estimated_rows * 0.1
        elseif filter.operator == 'LIKE' then
            estimated_rows = estimated_rows * 0.3
        elseif filter.operator == 'BETWEEN' then
            estimated_rows = estimated_rows * 0.2
        end
    end
    
    query_plan.estimated_cost = estimated_cost
    query_plan.estimated_rows = math.floor(estimated_rows)
    
    -- Simulate join execution
    local execution_stats = {
        execution_time_ms = estimated_cost / 100, -- Simulated timing
        rows_examined = 0,
        rows_returned = query_plan.estimated_rows,
        index_usage = {},
        memory_usage_mb = 0
    }
    
    for i, table_info in ipairs(sorted_tables) do
        execution_stats.rows_examined = execution_stats.rows_examined + table_info.row_count
        execution_stats.memory_usage_mb = execution_stats.memory_usage_mb + 
            (table_info.row_count * table_metadata[table_info.name].avg_row_size / 1024 / 1024)
        
        -- Simulate index usage
        table.insert(execution_stats.index_usage, {
            table_name = table_info.name,
            indexes_used = table_metadata[table_info.name].indexes,
            index_efficiency = math.random(75, 95) / 100
        })
    end
    
    -- Generate sample result preview
    local result_preview = {}
    local preview_size = math.min(10, query_plan.estimated_rows)
    
    for i = 1, preview_size do
        local row = {
            article_id = 'ART_' .. (1000 + i),
            title = 'Sample Article Title ' .. i,
            symbol = i % 2 == 0 and 'AAPL' or 'GOOGL',
            price = 150.00 + (i * 2.5),
            sentiment_score = (math.random(-100, 100) / 100),
            interaction_count = math.random(10, 1000),
            publish_date = os.date('%Y-%m-%d', os.time() - (i * 3600)),
            relevance_score = math.random(70, 98) / 100
        }
        table.insert(result_preview, row)
    end
    
    -- Performance metrics and recommendations
    local performance_metrics = {
        query_complexity = join_complexity,
        optimization_applied = {
            'join_reordering',
            'index_usage_optimization',
            'filter_pushdown'
        },
        performance_warnings = {},
        recommendations = {}
    }
    
    -- Add warnings and recommendations
    if execution_stats.execution_time_ms > 5000 then
        table.insert(performance_metrics.performance_warnings, 'Long execution time expected')
        table.insert(performance_metrics.recommendations, 'Consider adding indexes on join columns')
    end
    
    if execution_stats.memory_usage_mb > 100 then
        table.insert(performance_metrics.performance_warnings, 'High memory usage')
        table.insert(performance_metrics.recommendations, 'Consider partitioning large tables')
    end
    
    if query_plan.estimated_rows > 100000 then
        table.insert(performance_metrics.performance_warnings, 'Large result set')
        table.insert(performance_metrics.recommendations, 'Add LIMIT clause if appropriate')
    end
    
    -- Set final results
    join_results.query_plan = query_plan
    join_results.execution_stats = execution_stats
    join_results.result_preview = result_preview
    join_results.performance_metrics = performance_metrics
    
    return json.encode(join_results)
end
/

-- 9. Advanced article search with ranking
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.search_articles_advanced_udf(
    search_queries VARCHAR(2000000),
    ranking_algorithm VARCHAR(100),
    result_limit DOUBLE
) RETURNS VARCHAR(2000000) AS
function run(ctx)
    local json = require('json')
    
    -- Parse input parameters
    local queries = json.decode(search_queries)
    local algorithm = ranking_algorithm or 'relevance_score'
    local limit = result_limit or 50
    
    local search_results = {
        matched_articles = {},
        search_statistics = {},
        ranking_details = {},
        query_analysis = {}
    }
    
    -- Sample article database for search simulation
    local article_database = {
        {
            article_id = 'ART_001',
            title = 'Apple Reports Record Quarterly Earnings with Strong iPhone Sales',
            content = 'Apple Inc. announced record quarterly earnings driven by strong iPhone 15 sales and services revenue growth.',
            tags = {'Apple', 'AAPL', 'earnings', 'iPhone', 'technology'},
            publish_date = '2025-07-12',
            author = 'Tech Reporter',
            source = 'Financial Times',
            view_count = 15420,
            sentiment_score = 0.8,
            quality_score = 0.95
        },
        {
            article_id = 'ART_002',
            title = 'Federal Reserve Maintains Interest Rates Amid Economic Uncertainty',
            content = 'The Federal Reserve decided to keep interest rates unchanged as inflation concerns persist and economic indicators remain mixed.',
            tags = {'Federal Reserve', 'interest rates', 'economy', 'inflation', 'monetary policy'},
            publish_date = '2025-07-11',
            author = 'Economic Analyst',
            source = 'Reuters',
            view_count = 12800,
            sentiment_score = 0.1,
            quality_score = 0.92
        },
        {
            article_id = 'ART_003',
            title = 'Tesla Stock Surges on Autonomous Vehicle Technology Breakthrough',
            content = 'Tesla shares jumped 8% after the company demonstrated significant advances in its full self-driving technology.',
            tags = {'Tesla', 'TSLA', 'autonomous vehicles', 'technology', 'stock surge'},
            publish_date = '2025-07-10',
            author = 'Auto Industry Reporter',
            source = 'Bloomberg',
            view_count = 18900,
            sentiment_score = 0.9,
            quality_score = 0.88
        },
        {
            article_id = 'ART_004',
            title = 'Market Volatility Continues as Investors Await Economic Data',
            content = 'Stock markets experienced continued volatility as investors remain cautious ahead of key economic data releases.',
            tags = {'market volatility', 'economic data', 'investors', 'stocks', 'uncertainty'},
            publish_date = '2025-07-09',
            author = 'Market Analyst',
            source = 'MarketWatch',
            view_count = 9600,
            sentiment_score = -0.3,
            quality_score = 0.85
        },
        {
            article_id = 'ART_005',
            title = 'Microsoft Azure Revenue Growth Beats Expectations in Cloud Computing',
            content = 'Microsoft reported stronger than expected Azure cloud revenue growth, demonstrating continued dominance in enterprise cloud services.',
            tags = {'Microsoft', 'MSFT', 'Azure', 'cloud computing', 'revenue growth'},
            publish_date = '2025-07-08',
            author = 'Cloud Computing Specialist',
            source = 'TechCrunch',
            view_count = 11200,
            sentiment_score = 0.7,
            quality_score = 0.91
        }
    }
    
    -- Process each search query
    local all_matches = {}
    local query_stats = {}
    
    for i, query in ipairs(queries) do
        local query_text = query.text or query
        local query_matches = {}
        local query_terms = {}
        
        -- Tokenize query
        for term in query_text:lower():gmatch('%w+') do
            table.insert(query_terms, term)
        end
        
        -- Search articles
        for j, article in ipairs(article_database) do
            local relevance_score = 0
            local matches = {
                title_matches = 0,
                content_matches = 0,
                tag_matches = 0
            }
            
            -- Search in title (higher weight)
            local title_lower = article.title:lower()
            for k, term in ipairs(query_terms) do
                if title_lower:find(term) then
                    matches.title_matches = matches.title_matches + 1
                    relevance_score = relevance_score + 10
                end
            end
            
            -- Search in content
            local content_lower = article.content:lower()
            for k, term in ipairs(query_terms) do
                if content_lower:find(term) then
                    matches.content_matches = matches.content_matches + 1
                    relevance_score = relevance_score + 5
                end
            end
            
            -- Search in tags (medium weight)
            for k, tag in ipairs(article.tags) do
                local tag_lower = tag:lower()
                for l, term in ipairs(query_terms) do
                    if tag_lower:find(term) then
                        matches.tag_matches = matches.tag_matches + 1
                        relevance_score = relevance_score + 7
                    end
                end
            end
            
            -- Calculate final score based on algorithm
            local final_score = relevance_score
            
            if algorithm == 'relevance_score' then
                final_score = relevance_score
            elseif algorithm == 'popularity' then
                final_score = relevance_score * 0.7 + (article.view_count / 1000) * 0.3
            elseif algorithm == 'recency' then
                local days_old = math.random(1, 10) -- Simulate days since publication
                final_score = relevance_score * 0.8 + (10 - days_old) * 2
            elseif algorithm == 'quality' then
                final_score = relevance_score * 0.6 + article.quality_score * 40
            elseif algorithm == 'sentiment' then
                final_score = relevance_score * 0.7 + (article.sentiment_score + 1) * 15
            end
            
            -- Add to matches if relevant
            if relevance_score > 0 then
                table.insert(query_matches, {
                    article_id = article.article_id,
                    title = article.title,
                    author = article.author,
                    source = article.source,
                    publish_date = article.publish_date,
                    relevance_score = relevance_score,
                    final_score = final_score,
                    sentiment_score = article.sentiment_score,
                    quality_score = article.quality_score,
                    view_count = article.view_count,
                    match_details = matches,
                    query_index = i
                })
            end
        end
        
        -- Sort matches by final score
        table.sort(query_matches, function(a, b) return a.final_score > b.final_score end)
        
        -- Add to all matches
        for k, match in ipairs(query_matches) do
            table.insert(all_matches, match)
        end
        
        -- Query statistics
        table.insert(query_stats, {
            query_text = query_text,
            query_terms = query_terms,
            matches_found = #query_matches,
            avg_relevance = #query_matches > 0 and 
                (function()
                    local sum = 0
                    for k, match in ipairs(query_matches) do
                        sum = sum + match.relevance_score
                    end
                    return sum / #query_matches
                end)() or 0
        })
    end
    
    -- Sort all matches and apply limit
    table.sort(all_matches, function(a, b) return a.final_score > b.final_score end)
    
    local limited_matches = {}
    for i = 1, math.min(limit, #all_matches) do
        table.insert(limited_matches, all_matches[i])
    end
    
    -- Search statistics
    search_results.search_statistics = {
        total_queries = #queries,
        total_matches_found = #all_matches,
        matches_returned = #limited_matches,
        avg_matches_per_query = #all_matches / #queries,
        search_algorithm_used = algorithm,
        result_limit_applied = limit
    }
    
    -- Ranking details
    search_results.ranking_details = {
        algorithm_used = algorithm,
        ranking_factors = {
            title_match_weight = 10,
            content_match_weight = 5,
            tag_match_weight = 7,
            quality_factor = algorithm == 'quality' and 40 or 0,
            popularity_factor = algorithm == 'popularity' and 0.3 or 0,
            recency_factor = algorithm == 'recency' and 2 or 0,
            sentiment_factor = algorithm == 'sentiment' and 15 or 0
        },
        score_distribution = {
            high_relevance = 0,
            medium_relevance = 0,
            low_relevance = 0
        }
    }
    
    -- Calculate score distribution
    for i, match in ipairs(limited_matches) do
        if match.final_score >= 30 then
            search_results.ranking_details.score_distribution.high_relevance = 
                search_results.ranking_details.score_distribution.high_relevance + 1
        elseif match.final_score >= 15 then
            search_results.ranking_details.score_distribution.medium_relevance = 
                search_results.ranking_details.score_distribution.medium_relevance + 1
        else
            search_results.ranking_details.score_distribution.low_relevance = 
                search_results.ranking_details.score_distribution.low_relevance + 1
        end
    end
    
    -- Set final results
    search_results.matched_articles = limited_matches
    search_results.query_analysis = query_stats
    
    return json.encode(search_results)
end
/

-- 10. Cross-asset correlation analysis
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.calculate_market_correlations_udf(
    asset_pairs VARCHAR(2000000),
    correlation_method VARCHAR(100),
    time_window VARCHAR(100)
) RETURNS VARCHAR(2000000) AS
function run(ctx)
    local json = require('json')
    
    -- Parse input parameters
    local pairs = json.decode(asset_pairs)
    local method = correlation_method or 'pearson'
    local window = time_window or '30d'
    
    local correlation_results = {
        correlation_matrix = {},
        statistical_analysis = {},
        market_insights = {},
        risk_analysis = {}
    }
    
    -- Simulate historical price data for correlation calculation
    local asset_data = {
        AAPL = {150.25, 151.30, 149.80, 152.10, 150.95, 153.20, 151.75, 152.90, 150.40, 154.15},
        GOOGL = {2750.80, 2768.40, 2735.20, 2782.60, 2759.30, 2795.10, 2771.85, 2788.95, 2743.70, 2801.25},
        MSFT = {378.85, 381.20, 376.40, 383.70, 379.95, 385.30, 380.15, 384.60, 377.25, 386.90},
        TSLA = {248.50, 252.80, 245.30, 256.20, 249.70, 258.90, 251.40, 255.60, 247.10, 260.30},
        AMZN = {3342.80, 3358.40, 3325.60, 3375.20, 3347.90, 3382.50, 3354.30, 3371.80, 3331.40, 3388.70},
        SPY = {445.60, 447.20, 443.90, 448.80, 446.30, 450.10, 447.75, 449.40, 444.85, 451.25},
        QQQ = {376.40, 378.90, 374.20, 380.50, 377.80, 382.10, 378.60, 381.30, 375.70, 383.45},
        VTI = {238.75, 240.20, 237.85, 241.40, 239.60, 242.80, 240.95, 242.15, 238.30, 243.90}
    }
    
    -- Function to calculate Pearson correlation
    local function calculate_pearson(x_data, y_data)
        local n = math.min(#x_data, #y_data)
        if n < 2 then return 0 end
        
        local sum_x, sum_y, sum_xx, sum_yy, sum_xy = 0, 0, 0, 0, 0
        
        for i = 1, n do
            local x, y = x_data[i], y_data[i]
            sum_x = sum_x + x
            sum_y = sum_y + y
            sum_xx = sum_xx + x * x
            sum_yy = sum_yy + y * y
            sum_xy = sum_xy + x * y
        end
        
        local mean_x = sum_x / n
        local mean_y = sum_y / n
        
        local numerator = sum_xy - n * mean_x * mean_y
        local denominator = math.sqrt((sum_xx - n * mean_x * mean_x) * (sum_yy - n * mean_y * mean_y))
        
        return denominator ~= 0 and numerator / denominator or 0
    end
    
    -- Function to calculate Spearman correlation (rank-based)
    local function calculate_spearman(x_data, y_data)
        -- For simplicity, approximate with Pearson + noise
        local pearson = calculate_pearson(x_data, y_data)
        return pearson * (0.95 + math.random() * 0.1) -- Slight variation from Pearson
    end
    
    -- Calculate correlations for each pair
    local correlation_matrix = {}
    local correlation_stats = {
        strong_positive = {},
        strong_negative = {},
        weak_correlations = {},
        avg_correlation = 0,
        correlation_distribution = {}
    }
    
    local total_correlations = 0
    local sum_correlations = 0
    
    for i, pair in ipairs(pairs) do
        local asset1 = pair.asset1 or pair[1]
        local asset2 = pair.asset2 or pair[2]
        
        if asset_data[asset1] and asset_data[asset2] then
            local correlation = 0
            
            if method == 'pearson' then
                correlation = calculate_pearson(asset_data[asset1], asset_data[asset2])
            elseif method == 'spearman' then
                correlation = calculate_spearman(asset_data[asset1], asset_data[asset2])
            elseif method == 'kendall' then
                -- Approximate Kendall's tau
                correlation = calculate_pearson(asset_data[asset1], asset_data[asset2]) * 0.8
            end
            
            -- Statistical significance (simulated)
            local p_value = math.max(0.001, (1 - math.abs(correlation)) * 0.5)
            local confidence_interval = {
                correlation - 0.1,
                correlation + 0.1
            }
            
            local correlation_entry = {
                asset1 = asset1,
                asset2 = asset2,
                correlation = correlation,
                correlation_strength = math.abs(correlation) >= 0.7 and 'strong' or 
                                     math.abs(correlation) >= 0.3 and 'moderate' or 'weak',
                direction = correlation > 0 and 'positive' or correlation < 0 and 'negative' or 'neutral',
                p_value = p_value,
                significance = p_value < 0.05 and 'significant' or 'not_significant',
                confidence_interval = confidence_interval,
                sample_size = #asset_data[asset1],
                time_window = window
            }
            
            table.insert(correlation_matrix, correlation_entry)
            
            -- Categorize correlations
            if correlation >= 0.7 then
                table.insert(correlation_stats.strong_positive, {asset1, asset2, correlation})
            elseif correlation <= -0.7 then
                table.insert(correlation_stats.strong_negative, {asset1, asset2, correlation})
            elseif math.abs(correlation) < 0.3 then
                table.insert(correlation_stats.weak_correlations, {asset1, asset2, correlation})
            end
            
            total_correlations = total_correlations + 1
            sum_correlations = sum_correlations + correlation
        end
    end
    
    correlation_stats.avg_correlation = total_correlations > 0 and sum_correlations / total_correlations or 0
    
    -- Market insights
    local market_insights = {
        sector_analysis = {
            tech_stocks_correlation = 0.85,  -- AAPL, GOOGL, MSFT typically correlated
            market_vs_individual = 0.72,     -- Individual stocks vs market indices
            cross_sector_correlation = 0.45   -- Different sectors
        },
        diversification_opportunities = {},
        portfolio_implications = {},
        market_regime = 'normal_volatility'
    }
    
    -- Identify diversification opportunities (low correlations)
    for i, entry in ipairs(correlation_matrix) do
        if math.abs(entry.correlation) < 0.3 and entry.significance == 'significant' then
            table.insert(market_insights.diversification_opportunities, {
                asset_pair = {entry.asset1, entry.asset2},
                correlation = entry.correlation,
                diversification_benefit = 'high'
            })
        end
    end
    
    -- Portfolio implications
    market_insights.portfolio_implications = {
        concentration_risk = #correlation_stats.strong_positive > 3 and 'high' or 'moderate',
        hedging_opportunities = #correlation_stats.strong_negative,
        overall_portfolio_correlation = correlation_stats.avg_correlation,
        recommended_allocation = 'diversified'
    }
    
    -- Risk analysis
    local risk_analysis = {
        correlation_risk = {
            systemic_risk = correlation_stats.avg_correlation > 0.6 and 'high' or 'moderate',
            diversification_effectiveness = 1 - math.abs(correlation_stats.avg_correlation),
            tail_risk_correlation = 0.85  -- Correlations tend to increase during market stress
        },
        volatility_clustering = {
            detected = true,
            persistence = 0.7,
            implications = 'Increased correlation during volatile periods'
        },
        regime_analysis = {
            current_regime = 'normal',
            regime_stability = 0.8,
            transition_probability = 0.15
        }
    }
    
    -- Set final results
    correlation_results.correlation_matrix = correlation_matrix
    correlation_results.statistical_analysis = correlation_stats
    correlation_results.market_insights = market_insights
    correlation_results.risk_analysis = risk_analysis
    
    return json.encode(correlation_results)
end
/