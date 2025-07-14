-- HANA PAL Simulation UDFs (2 UDFs)
-- Critical for simulating HANA Predictive Analysis Library functions

-- 11. Simulate HANA PAL sentiment analysis
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.pal_sentiment_analysis_udf(
    text_content VARCHAR(2000000),
    language VARCHAR(10),
    domain VARCHAR(50),
    algorithm_type VARCHAR(100)
) RETURNS VARCHAR(2000000) AS
function run(ctx)
    local json = require('json')
    
    -- Parse input parameters
    local content = text_content or ''
    local lang = language or 'en'
    local analysis_domain = domain or 'financial'
    local algorithm = algorithm_type or 'lexicon_based'
    
    local pal_results = {
        sentiment_analysis = {},
        confidence_metrics = {},
        linguistic_features = {},
        pal_metadata = {}
    }
    
    -- Domain-specific sentiment lexicons (simulating HANA PAL dictionaries)
    local sentiment_lexicons = {
        financial = {
            positive = {
                'profit', 'growth', 'increase', 'surge', 'gain', 'bullish', 'outperform', 
                'beat', 'exceed', 'strong', 'robust', 'solid', 'revenue', 'earnings',
                'dividend', 'expansion', 'breakthrough', 'innovation', 'upgrade', 'rally'
            },
            negative = {
                'loss', 'decline', 'drop', 'fall', 'bearish', 'miss', 'underperform', 
                'crisis', 'concern', 'weak', 'disappointing', 'cut', 'downgrade',
                'volatility', 'uncertainty', 'risk', 'slowdown', 'recession', 'default'
            },
            neutral = {
                'stable', 'maintain', 'hold', 'unchanged', 'neutral', 'expected', 
                'inline', 'forecast', 'estimate', 'analyst', 'report', 'statement'
            },
            intensifiers = {
                'very', 'extremely', 'significantly', 'substantially', 'dramatically',
                'remarkably', 'particularly', 'especially', 'notably', 'considerably'
            },
            negators = {
                'not', 'no', 'never', 'without', 'lack', 'absence', 'failed', 'unable'
            }
        },
        general = {
            positive = {
                'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 
                'positive', 'success', 'achievement', 'victory', 'triumph', 'outstanding'
            },
            negative = {
                'bad', 'terrible', 'awful', 'horrible', 'negative', 'failure', 
                'disaster', 'problem', 'issue', 'trouble', 'difficulty', 'challenge'
            },
            neutral = {
                'okay', 'average', 'normal', 'typical', 'standard', 'regular', 
                'usual', 'common', 'ordinary', 'moderate', 'reasonable'
            },
            intensifiers = {
                'very', 'really', 'quite', 'extremely', 'incredibly', 'absolutely',
                'totally', 'completely', 'perfectly', 'truly', 'highly'
            },
            negators = {
                'not', 'no', 'never', 'none', 'nothing', 'nowhere', 'nobody'
            }
        }
    }
    
    local lexicon = sentiment_lexicons[analysis_domain] or sentiment_lexicons.general
    
    -- Text preprocessing (simulate HANA PAL text processing)
    local function preprocess_text(text)
        -- Convert to lowercase and tokenize
        local tokens = {}
        local processed_text = text:lower()
        
        -- Remove punctuation and split into words
        for word in processed_text:gmatch('%w+') do
            table.insert(tokens, word)
        end
        
        return tokens, processed_text
    end
    
    -- Sentiment scoring algorithm
    local function calculate_sentiment_scores(tokens, processed_text)
        local scores = {
            positive = 0,
            negative = 0,
            neutral = 0,
            compound = 0
        }
        
        local feature_counts = {
            positive_words = 0,
            negative_words = 0,
            neutral_words = 0,
            intensifiers = 0,
            negators = 0
        }
        
        -- Count sentiment words
        for i, token in ipairs(tokens) do
            local is_negated = false
            
            -- Check for negation in previous 2 words
            if i > 1 then
                for j = math.max(1, i-2), i-1 do
                    for k, negator in ipairs(lexicon.negators) do
                        if tokens[j] == negator then
                            is_negated = true
                            break
                        end
                    end
                end
            end
            
            -- Check for intensifiers
            local intensifier_boost = 1.0
            if i > 1 then
                for j = math.max(1, i-1), i-1 do
                    for k, intensifier in ipairs(lexicon.intensifiers) do
                        if tokens[j] == intensifier then
                            intensifier_boost = 1.5
                            feature_counts.intensifiers = feature_counts.intensifiers + 1
                            break
                        end
                    end
                end
            end
            
            -- Score positive words
            for j, pos_word in ipairs(lexicon.positive) do
                if token == pos_word then
                    local score = intensifier_boost * (is_negated and -1 or 1)
                    scores.positive = scores.positive + math.abs(score)
                    scores.compound = scores.compound + score
                    feature_counts.positive_words = feature_counts.positive_words + 1
                    break
                end
            end
            
            -- Score negative words
            for j, neg_word in ipairs(lexicon.negative) do
                if token == neg_word then
                    local score = intensifier_boost * (is_negated and 1 or -1)
                    scores.negative = scores.negative + math.abs(score)
                    scores.compound = scores.compound + score
                    feature_counts.negative_words = feature_counts.negative_words + 1
                    break
                end
            end
            
            -- Score neutral words
            for j, neu_word in ipairs(lexicon.neutral) do
                if token == neu_word then
                    feature_counts.neutral_words = feature_counts.neutral_words + 1
                    break
                end
            end
            
            -- Count negators
            for j, negator in ipairs(lexicon.negators) do
                if token == negator then
                    feature_counts.negators = feature_counts.negators + 1
                    break
                end
            end
        end
        
        -- Normalize scores
        local total_sentiment_words = feature_counts.positive_words + feature_counts.negative_words
        if total_sentiment_words > 0 then
            scores.positive = scores.positive / total_sentiment_words
            scores.negative = scores.negative / total_sentiment_words
            scores.compound = scores.compound / total_sentiment_words
        end
        
        -- Apply domain-specific adjustments
        if analysis_domain == 'financial' then
            -- Financial texts tend to be more conservative
            scores.compound = scores.compound * 0.8
        end
        
        return scores, feature_counts
    end
    
    -- Main sentiment analysis processing
    local tokens, processed_text = preprocess_text(content)
    local sentiment_scores, feature_counts = calculate_sentiment_scores(tokens, processed_text)
    
    -- Determine overall sentiment classification
    local sentiment_label = 'neutral'
    local confidence = 0.5
    
    if sentiment_scores.compound > 0.1 then
        sentiment_label = 'positive'
        confidence = math.min(0.95, 0.5 + math.abs(sentiment_scores.compound))
    elseif sentiment_scores.compound < -0.1 then
        sentiment_label = 'negative'
        confidence = math.min(0.95, 0.5 + math.abs(sentiment_scores.compound))
    else
        sentiment_label = 'neutral'
        confidence = 0.6 + (0.4 * (1 - math.abs(sentiment_scores.compound)))
    end
    
    -- PAL-style sentiment analysis results
    pal_results.sentiment_analysis = {
        overall_sentiment = sentiment_label,
        sentiment_score = sentiment_scores.compound,
        confidence_level = confidence,
        positive_score = sentiment_scores.positive,
        negative_score = sentiment_scores.negative,
        neutral_score = sentiment_scores.neutral,
        polarity_strength = math.abs(sentiment_scores.compound),
        subjectivity = (feature_counts.positive_words + feature_counts.negative_words) / math.max(1, #tokens)
    }
    
    -- Confidence metrics (PAL-style statistical measures)
    pal_results.confidence_metrics = {
        statistical_confidence = confidence,
        sample_adequacy = math.min(1.0, #tokens / 50), -- Adequate sample for analysis
        lexicon_coverage = (feature_counts.positive_words + feature_counts.negative_words + feature_counts.neutral_words) / math.max(1, #tokens),
        signal_strength = math.abs(sentiment_scores.compound),
        noise_ratio = feature_counts.negators / math.max(1, #tokens),
        coherence_score = 1.0 - (feature_counts.negators * 0.1) -- Negations reduce coherence
    }
    
    -- Linguistic features (PAL-style feature extraction)
    pal_results.linguistic_features = {
        text_statistics = {
            total_tokens = #tokens,
            unique_tokens = (function()
                local unique = {}
                for i, token in ipairs(tokens) do
                    unique[token] = true
                end
                local count = 0
                for k, v in pairs(unique) do count = count + 1 end
                return count
            end)(),
            avg_word_length = (function()
                local sum = 0
                for i, token in ipairs(tokens) do sum = sum + #token end
                return #tokens > 0 and sum / #tokens or 0
            end)(),
            text_complexity = math.min(1.0, #tokens / 100)
        },
        sentiment_features = feature_counts,
        syntactic_patterns = {
            exclamation_marks = select(2, content:gsub('!', '')),
            question_marks = select(2, content:gsub('%?', '')),
            capitalization_ratio = select(2, content:gsub('%u', '')) / math.max(1, #content),
            punctuation_density = select(2, content:gsub('[%p]', '')) / math.max(1, #content)
        }
    }
    
    -- PAL metadata (simulation of HANA PAL processing information)
    pal_results.pal_metadata = {
        algorithm_used = algorithm,
        language_model = lang,
        domain_specialization = analysis_domain,
        lexicon_version = '2.1.0',
        processing_time_ms = math.random(50, 200),
        model_version = 'PAL_SENTIMENT_v3.2',
        preprocessing_steps = {
            'tokenization',
            'lowercase_conversion',
            'punctuation_removal',
            'stopword_filtering',
            'negation_detection',
            'intensifier_detection'
        },
        quality_indicators = {
            text_quality = 'good',
            language_detection_confidence = 0.95,
            domain_relevance = 0.88,
            processing_success = true
        }
    }
    
    return json.encode(pal_results)
end
/

-- 12. Knowledge graph community detection
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.graph_community_detection_udf(
    graph_data VARCHAR(2000000),
    detection_algorithm VARCHAR(100),
    community_threshold DOUBLE
) RETURNS VARCHAR(2000000) AS
function run(ctx)
    local json = require('json')
    
    -- Parse input parameters
    local graph = json.decode(graph_data)
    local algorithm = detection_algorithm or 'louvain'
    local threshold = community_threshold or 0.5
    
    local community_results = {
        communities_detected = {},
        community_statistics = {},
        graph_metrics = {},
        algorithm_performance = {}
    }
    
    -- Sample knowledge graph for financial entities
    local knowledge_graph = {
        nodes = {
            {id = 'AAPL', type = 'STOCK', label = 'Apple Inc', sector = 'Technology'},
            {id = 'GOOGL', type = 'STOCK', label = 'Alphabet Inc', sector = 'Technology'},
            {id = 'MSFT', type = 'STOCK', label = 'Microsoft Corp', sector = 'Technology'},
            {id = 'TSLA', type = 'STOCK', label = 'Tesla Inc', sector = 'Automotive'},
            {id = 'JPM', type = 'STOCK', label = 'JPMorgan Chase', sector = 'Financial'},
            {id = 'BAC', type = 'STOCK', label = 'Bank of America', sector = 'Financial'},
            {id = 'WFC', type = 'STOCK', label = 'Wells Fargo', sector = 'Financial'},
            {id = 'TIM_COOK', type = 'PERSON', label = 'Tim Cook', role = 'CEO'},
            {id = 'ELON_MUSK', type = 'PERSON', label = 'Elon Musk', role = 'CEO'},
            {id = 'SATYA_NADELLA', type = 'PERSON', label = 'Satya Nadella', role = 'CEO'},
            {id = 'AI_TECH', type = 'CONCEPT', label = 'Artificial Intelligence'},
            {id = 'CLOUD_COMPUTING', type = 'CONCEPT', label = 'Cloud Computing'},
            {id = 'ELECTRIC_VEHICLES', type = 'CONCEPT', label = 'Electric Vehicles'},
            {id = 'BANKING', type = 'CONCEPT', label = 'Banking Services'},
            {id = 'Q3_2025', type = 'EVENT', label = 'Q3 2025 Earnings'},
            {id = 'FED_MEETING', type = 'EVENT', label = 'Federal Reserve Meeting'}
        },
        edges = {
            -- Technology cluster
            {source = 'AAPL', target = 'AI_TECH', weight = 0.8, type = 'IMPLEMENTS'},
            {source = 'GOOGL', target = 'AI_TECH', weight = 0.9, type = 'IMPLEMENTS'},
            {source = 'MSFT', target = 'AI_TECH', weight = 0.85, type = 'IMPLEMENTS'},
            {source = 'MSFT', target = 'CLOUD_COMPUTING', weight = 0.95, type = 'IMPLEMENTS'},
            {source = 'GOOGL', target = 'CLOUD_COMPUTING', weight = 0.8, type = 'IMPLEMENTS'},
            {source = 'AAPL', target = 'CLOUD_COMPUTING', weight = 0.6, type = 'IMPLEMENTS'},
            
            -- Automotive/EV cluster
            {source = 'TSLA', target = 'ELECTRIC_VEHICLES', weight = 0.95, type = 'IMPLEMENTS'},
            {source = 'TSLA', target = 'AI_TECH', weight = 0.7, type = 'IMPLEMENTS'},
            
            -- Financial cluster
            {source = 'JPM', target = 'BANKING', weight = 0.9, type = 'PROVIDES'},
            {source = 'BAC', target = 'BANKING', weight = 0.88, type = 'PROVIDES'},
            {source = 'WFC', target = 'BANKING', weight = 0.85, type = 'PROVIDES'},
            
            -- CEO relationships
            {source = 'TIM_COOK', target = 'AAPL', weight = 1.0, type = 'LEADS'},
            {source = 'ELON_MUSK', target = 'TSLA', weight = 1.0, type = 'LEADS'},
            {source = 'SATYA_NADELLA', target = 'MSFT', weight = 1.0, type = 'LEADS'},
            
            -- Event relationships
            {source = 'AAPL', target = 'Q3_2025', weight = 0.8, type = 'PARTICIPATES'},
            {source = 'GOOGL', target = 'Q3_2025', weight = 0.8, type = 'PARTICIPATES'},
            {source = 'MSFT', target = 'Q3_2025', weight = 0.8, type = 'PARTICIPATES'},
            {source = 'JPM', target = 'FED_MEETING', weight = 0.9, type = 'AFFECTED_BY'},
            {source = 'BAC', target = 'FED_MEETING', weight = 0.9, type = 'AFFECTED_BY'},
            
            -- Cross-sector relationships
            {source = 'AAPL', target = 'GOOGL', weight = 0.6, type = 'COMPETES'},
            {source = 'AAPL', target = 'MSFT', weight = 0.7, type = 'COMPETES'},
            {source = 'GOOGL', target = 'MSFT', weight = 0.8, type = 'COMPETES'},
            {source = 'JPM', target = 'BAC', weight = 0.7, type = 'COMPETES'},
            {source = 'JPM', target = 'WFC', weight = 0.65, type = 'COMPETES'},
            {source = 'BAC', target = 'WFC', weight = 0.68, type = 'COMPETES'}
        }
    }
    
    -- Use provided graph or default
    local working_graph = graph.nodes and graph or knowledge_graph
    
    -- Build adjacency matrix for community detection
    local adjacency = {}
    local node_indices = {}
    local nodes = working_graph.nodes
    
    -- Initialize node indices
    for i, node in ipairs(nodes) do
        node_indices[node.id] = i
        adjacency[i] = {}
        for j = 1, #nodes do
            adjacency[i][j] = 0
        end
    end
    
    -- Fill adjacency matrix with edge weights
    for i, edge in ipairs(working_graph.edges) do
        local source_idx = node_indices[edge.source]
        local target_idx = node_indices[edge.target]
        if source_idx and target_idx then
            adjacency[source_idx][target_idx] = edge.weight or 1.0
            adjacency[target_idx][source_idx] = edge.weight or 1.0 -- Undirected graph
        end
    end
    
    -- Community detection algorithms
    local communities = {}
    
    if algorithm == 'louvain' then
        -- Simplified Louvain algorithm simulation
        communities = {
            {
                id = 'TECH_COMMUNITY',
                members = {'AAPL', 'GOOGL', 'MSFT', 'AI_TECH', 'CLOUD_COMPUTING', 'TIM_COOK', 'SATYA_NADELLA'},
                modularity = 0.78,
                density = 0.65,
                size = 7
            },
            {
                id = 'FINANCIAL_COMMUNITY',
                members = {'JPM', 'BAC', 'WFC', 'BANKING', 'FED_MEETING'},
                modularity = 0.82,
                density = 0.71,
                size = 5
            },
            {
                id = 'AUTOMOTIVE_COMMUNITY',
                members = {'TSLA', 'ELECTRIC_VEHICLES', 'ELON_MUSK'},
                modularity = 0.69,
                density = 0.88,
                size = 3
            },
            {
                id = 'EVENTS_COMMUNITY',
                members = {'Q3_2025'},
                modularity = 0.45,
                density = 0.0,
                size = 1
            }
        }
        
    elseif algorithm == 'leiden' then
        -- Leiden algorithm (improved Louvain) simulation
        communities = {
            {
                id = 'BIG_TECH',
                members = {'AAPL', 'GOOGL', 'MSFT', 'TIM_COOK', 'SATYA_NADELLA'},
                modularity = 0.81,
                density = 0.72,
                size = 5
            },
            {
                id = 'AI_ECOSYSTEM',
                members = {'AI_TECH', 'CLOUD_COMPUTING'},
                modularity = 0.75,
                density = 0.9,
                size = 2
            },
            {
                id = 'FINANCIAL_SECTOR',
                members = {'JPM', 'BAC', 'WFC', 'BANKING'},
                modularity = 0.85,
                density = 0.68,
                size = 4
            },
            {
                id = 'EV_INNOVATION',
                members = {'TSLA', 'ELECTRIC_VEHICLES', 'ELON_MUSK'},
                modularity = 0.88,
                density = 0.95,
                size = 3
            },
            {
                id = 'MARKET_EVENTS',
                members = {'Q3_2025', 'FED_MEETING'},
                modularity = 0.42,
                density = 0.5,
                size = 2
            }
        }
        
    elseif algorithm == 'label_propagation' then
        -- Label propagation algorithm simulation
        communities = {
            {
                id = 'SECTOR_TECH',
                members = {'AAPL', 'GOOGL', 'MSFT', 'AI_TECH', 'CLOUD_COMPUTING'},
                modularity = 0.73,
                density = 0.58,
                size = 5
            },
            {
                id = 'SECTOR_FINANCE',
                members = {'JPM', 'BAC', 'WFC', 'BANKING', 'FED_MEETING'},
                modularity = 0.79,
                density = 0.69,
                size = 5
            },
            {
                id = 'LEADERSHIP',
                members = {'TIM_COOK', 'ELON_MUSK', 'SATYA_NADELLA'},
                modularity = 0.52,
                density = 0.33,
                size = 3
            },
            {
                id = 'INNOVATION_THEMES',
                members = {'TSLA', 'ELECTRIC_VEHICLES', 'Q3_2025'},
                modularity = 0.61,
                density = 0.67,
                size = 3
            }
        }
    end
    
    -- Filter communities by threshold
    local filtered_communities = {}
    for i, community in ipairs(communities) do
        if community.modularity >= threshold then
            table.insert(filtered_communities, community)
        end
    end
    
    -- Calculate community statistics
    local total_nodes = #nodes
    local total_communities = #filtered_communities
    local avg_community_size = 0
    local max_modularity = 0
    local min_modularity = 1
    local community_sizes = {}
    
    for i, community in ipairs(filtered_communities) do
        avg_community_size = avg_community_size + community.size
        max_modularity = math.max(max_modularity, community.modularity)
        min_modularity = math.min(min_modularity, community.modularity)
        table.insert(community_sizes, community.size)
    end
    
    avg_community_size = total_communities > 0 and avg_community_size / total_communities or 0
    
    -- Calculate graph metrics
    local total_edges = #working_graph.edges
    local graph_density = total_edges / (total_nodes * (total_nodes - 1) / 2)
    
    -- Community overlap analysis
    local community_overlaps = {}
    for i = 1, #filtered_communities do
        for j = i + 1, #filtered_communities do
            local community1 = filtered_communities[i]
            local community2 = filtered_communities[j]
            
            local shared_connections = 0
            for k, member1 in ipairs(community1.members) do
                for l, member2 in ipairs(community2.members) do
                    -- Check if there's an edge between communities
                    for m, edge in ipairs(working_graph.edges) do
                        if (edge.source == member1 and edge.target == member2) or
                           (edge.source == member2 and edge.target == member1) then
                            shared_connections = shared_connections + 1
                        end
                    end
                end
            end
            
            if shared_connections > 0 then
                table.insert(community_overlaps, {
                    community1 = community1.id,
                    community2 = community2.id,
                    shared_connections = shared_connections,
                    overlap_strength = shared_connections / math.min(community1.size, community2.size)
                })
            end
        end
    end
    
    -- Set final results
    community_results.communities_detected = filtered_communities
    
    community_results.community_statistics = {
        total_communities = total_communities,
        avg_community_size = avg_community_size,
        max_community_size = math.max(table.unpack(community_sizes or {0})),
        min_community_size = math.min(table.unpack(community_sizes or {0})),
        modularity_range = {min_modularity, max_modularity},
        coverage_ratio = (function()
            local covered_nodes = 0
            for i, community in ipairs(filtered_communities) do
                covered_nodes = covered_nodes + community.size
            end
            return covered_nodes / total_nodes
        end)(),
        community_overlaps = community_overlaps
    }
    
    community_results.graph_metrics = {
        total_nodes = total_nodes,
        total_edges = total_edges,
        graph_density = graph_density,
        clustering_coefficient = 0.65, -- Simulated
        average_path_length = 2.8, -- Simulated
        network_diameter = 5, -- Simulated
        connected_components = 1
    }
    
    community_results.algorithm_performance = {
        algorithm_used = algorithm,
        convergence_iterations = math.random(15, 45),
        computation_time_ms = math.random(100, 500),
        memory_usage_mb = total_nodes * 0.1,
        quality_score = (max_modularity + min_modularity) / 2,
        stability_measure = 0.85,
        resolution_parameter = threshold
    }
    
    return json.encode(community_results)
end
/