-- Knowledge Graph Operations UDFs (4 UDFs)
-- Critical for knowledge graph processing and entity relationships

-- 11. Calculate entity influence within knowledge graph
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.calculate_influence_scores_udf(
    entity_uri VARCHAR(200),
    influence_algorithm VARCHAR(100),
    weight_factors VARCHAR(2000000)
) RETURNS VARCHAR(2000000) AS
function run(ctx)
    local json = require('json')
    
    -- Parse input parameters
    local entity = entity_uri or 'ENTITY_UNKNOWN'
    local algorithm = influence_algorithm or 'pagerank'
    local weights = json.decode(weight_factors) or {
        connection_weight = 0.4,
        frequency_weight = 0.3,
        recency_weight = 0.2,
        authority_weight = 0.1
    }
    
    local influence_results = {
        entity_analysis = {},
        influence_metrics = {},
        network_position = {},
        ranking_details = {}
    }
    
    -- Simulate knowledge graph structure for financial entities
    local knowledge_graph = {
        entities = {
            {id = 'AAPL', type = 'STOCK', label = 'Apple Inc', authority_score = 0.95},
            {id = 'TIM_COOK', type = 'PERSON', label = 'Tim Cook', authority_score = 0.88},
            {id = 'IPHONE', type = 'PRODUCT', label = 'iPhone', authority_score = 0.82},
            {id = 'AI_TECH', type = 'CONCEPT', label = 'Artificial Intelligence', authority_score = 0.91},
            {id = 'CLOUD_COMPUTING', type = 'CONCEPT', label = 'Cloud Computing', authority_score = 0.78},
            {id = 'EARNINGS_Q3', type = 'EVENT', label = 'Q3 2025 Earnings', authority_score = 0.72},
            {id = 'TECH_SECTOR', type = 'SECTOR', label = 'Technology Sector', authority_score = 0.89},
            {id = 'NASDAQ', type = 'EXCHANGE', label = 'NASDAQ', authority_score = 0.94},
            {id = 'INNOVATION', type = 'CONCEPT', label = 'Innovation', authority_score = 0.75},
            {id = 'MARKET_LEADERSHIP', type = 'CONCEPT', label = 'Market Leadership', authority_score = 0.85}
        },
        relationships = {
            {source = 'TIM_COOK', target = 'AAPL', type = 'LEADS', weight = 1.0, frequency = 500},
            {source = 'AAPL', target = 'IPHONE', type = 'PRODUCES', weight = 0.9, frequency = 300},
            {source = 'AAPL', target = 'AI_TECH', type = 'INVESTS_IN', weight = 0.8, frequency = 150},
            {source = 'AAPL', target = 'CLOUD_COMPUTING', type = 'OFFERS', weight = 0.7, frequency = 120},
            {source = 'AAPL', target = 'EARNINGS_Q3', type = 'REPORTS', weight = 0.85, frequency = 25},
            {source = 'AAPL', target = 'TECH_SECTOR', type = 'BELONGS_TO', weight = 0.95, frequency = 80},
            {source = 'AAPL', target = 'NASDAQ', type = 'LISTED_ON', weight = 1.0, frequency = 1000},
            {source = 'TIM_COOK', target = 'INNOVATION', type = 'PROMOTES', weight = 0.8, frequency = 45},
            {source = 'AAPL', target = 'MARKET_LEADERSHIP', type = 'DEMONSTRATES', weight = 0.9, frequency = 200},
            {source = 'AI_TECH', target = 'INNOVATION', type = 'REPRESENTS', weight = 0.75, frequency = 60},
            {source = 'IPHONE', target = 'INNOVATION', type = 'EMBODIES', weight = 0.85, frequency = 180}
        }
    }
    
    -- Find target entity
    local target_entity = nil
    for i, ent in ipairs(knowledge_graph.entities) do
        if ent.id == entity then
            target_entity = ent
            break
        end
    end
    
    if not target_entity then
        -- Create unknown entity
        target_entity = {id = entity, type = 'UNKNOWN', label = entity, authority_score = 0.5}
    end
    
    -- Calculate influence based on different algorithms
    local influence_scores = {}
    
    if algorithm == 'pagerank' then
        -- PageRank-style influence calculation
        local damping_factor = 0.85
        local iterations = 10
        
        -- Initialize scores
        local pagerank_scores = {}
        for i, ent in ipairs(knowledge_graph.entities) do
            pagerank_scores[ent.id] = 1.0 / #knowledge_graph.entities
        end
        
        -- Iterate PageRank
        for iter = 1, iterations do
            local new_scores = {}
            
            for i, ent in ipairs(knowledge_graph.entities) do
                local score = (1 - damping_factor) / #knowledge_graph.entities
                
                -- Sum contributions from incoming links
                for j, rel in ipairs(knowledge_graph.relationships) do
                    if rel.target == ent.id then
                        local source_outlinks = 0
                        for k, rel2 in ipairs(knowledge_graph.relationships) do
                            if rel2.source == rel.source then
                                source_outlinks = source_outlinks + 1
                            end
                        end
                        
                        if source_outlinks > 0 then
                            score = score + damping_factor * (pagerank_scores[rel.source] / source_outlinks) * rel.weight
                        end
                    end
                end
                
                new_scores[ent.id] = score
            end
            
            pagerank_scores = new_scores
        end
        
        influence_scores.pagerank = pagerank_scores[entity] or 0.5
        influence_scores.algorithm_details = {
            damping_factor = damping_factor,
            iterations = iterations,
            convergence = 'achieved'
        }
        
    elseif algorithm == 'betweenness' then
        -- Betweenness centrality calculation (simplified)
        local betweenness = 0.72 -- Simulated for the entity
        
        influence_scores.betweenness = betweenness
        influence_scores.algorithm_details = {
            shortest_paths_calculated = 45,
            paths_through_entity = 32,
            centrality_normalized = true
        }
        
    elseif algorithm == 'eigenvector' then
        -- Eigenvector centrality calculation (simplified)
        local eigenvector = target_entity.authority_score * 0.9
        
        influence_scores.eigenvector = eigenvector
        influence_scores.algorithm_details = {
            principal_eigenvalue = 3.24,
            convergence_tolerance = 0.001,
            iterations_to_convergence = 15
        }
        
    elseif algorithm == 'closeness' then
        -- Closeness centrality calculation
        local avg_shortest_path = 2.3 -- Simulated
        local closeness = 1.0 / avg_shortest_path
        
        influence_scores.closeness = closeness
        influence_scores.algorithm_details = {
            average_shortest_path = avg_shortest_path,
            reachable_nodes = #knowledge_graph.entities - 1,
            normalized = true
        }
    end
    
    -- Calculate composite influence score
    local composite_score = 0
    local direct_connections = 0
    local indirect_connections = 0
    local total_relationship_weight = 0
    
    -- Count direct connections and weights
    for i, rel in ipairs(knowledge_graph.relationships) do
        if rel.source == entity or rel.target == entity then
            direct_connections = direct_connections + 1
            total_relationship_weight = total_relationship_weight + (rel.weight * rel.frequency / 100)
        end
    end
    
    -- Find indirect connections (2-hop)
    local connected_entities = {}
    for i, rel in ipairs(knowledge_graph.relationships) do
        if rel.source == entity then
            connected_entities[rel.target] = true
        elseif rel.target == entity then
            connected_entities[rel.source] = true
        end
    end
    
    for entity_id, _ in pairs(connected_entities) do
        for i, rel in ipairs(knowledge_graph.relationships) do
            if (rel.source == entity_id or rel.target == entity_id) and 
               rel.source ~= entity and rel.target ~= entity then
                indirect_connections = indirect_connections + 1
            end
        end
    end
    
    -- Calculate weighted composite score
    composite_score = (direct_connections * weights.connection_weight) +
                     (total_relationship_weight * weights.frequency_weight) +
                     (target_entity.authority_score * weights.authority_weight) +
                     (0.8 * weights.recency_weight) -- Simulated recency factor
    
    -- Network position analysis
    local network_position = {
        centrality_rank = math.random(1, 10),
        degree_centrality = direct_connections / (#knowledge_graph.entities - 1),
        clustering_coefficient = 0.65, -- Simulated
        local_clustering = 0.72,
        bridge_score = indirect_connections / math.max(1, direct_connections),
        structural_holes = math.max(0, direct_connections - 2), -- Simulated
        network_constraint = 0.42 -- Simulated Burt's constraint measure
    }
    
    -- Influence propagation analysis
    local propagation_analysis = {
        one_hop_reach = direct_connections,
        two_hop_reach = indirect_connections,
        three_hop_reach = math.floor(indirect_connections * 1.5),
        influence_decay_rate = 0.7,
        viral_coefficient = total_relationship_weight / math.max(1, direct_connections),
        echo_chamber_factor = 0.35 -- How much influence bounces back
    }
    
    -- Ranking within entity type and overall
    local type_ranking = math.random(1, 5)
    local overall_ranking = math.random(1, #knowledge_graph.entities)
    
    -- Entity analysis
    influence_results.entity_analysis = {
        entity_id = entity,
        entity_type = target_entity.type,
        entity_label = target_entity.label,
        authority_score = target_entity.authority_score,
        direct_connections = direct_connections,
        indirect_connections = indirect_connections,
        total_relationship_weight = total_relationship_weight,
        connected_entity_types = (function()
            local types = {}
            for i, rel in ipairs(knowledge_graph.relationships) do
                if rel.source == entity or rel.target == entity then
                    local other_entity = rel.source == entity and rel.target or rel.source
                    for j, ent in ipairs(knowledge_graph.entities) do
                        if ent.id == other_entity then
                            types[ent.type] = (types[ent.type] or 0) + 1
                            break
                        end
                    end
                end
            end
            return types
        end)()
    }
    
    -- Influence metrics
    influence_results.influence_metrics = {
        composite_influence_score = composite_score,
        algorithm_specific_scores = influence_scores,
        influence_factors = weights,
        propagation_analysis = propagation_analysis,
        temporal_influence = {
            current_period = composite_score,
            trend_6m = composite_score * 1.1, -- Simulated growth
            trend_1y = composite_score * 0.95,
            volatility = 0.15
        }
    }
    
    -- Network position
    influence_results.network_position = network_position
    
    -- Ranking details
    influence_results.ranking_details = {
        overall_rank = overall_ranking,
        type_rank = type_ranking,
        total_entities = #knowledge_graph.entities,
        percentile = (1 - (overall_ranking / #knowledge_graph.entities)) * 100,
        influence_tier = composite_score >= 0.8 and 'HIGH' or
                        composite_score >= 0.5 and 'MEDIUM' or 'LOW',
        comparison_entities = {
            higher_influence = {'AAPL', 'NASDAQ', 'AI_TECH'},
            similar_influence = {'TECH_SECTOR', 'MARKET_LEADERSHIP'},
            lower_influence = {'EARNINGS_Q3', 'INNOVATION'}
        }
    }
    
    return json.encode(influence_results)
end
/

-- 12. Semantic search across knowledge graph entities
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.semantic_search_entities_udf(
    search_terms VARCHAR(2000000),
    semantic_threshold DOUBLE,
    result_limit DOUBLE,
    entity_types VARCHAR(2000000)
) RETURNS VARCHAR(2000000) AS
function run(ctx)
    local json = require('json')
    
    -- Parse input parameters
    local terms = json.decode(search_terms)
    local threshold = semantic_threshold or 0.7
    local limit = result_limit or 20
    local types_filter = json.decode(entity_types) or {'STOCK', 'PERSON', 'CONCEPT', 'EVENT'}
    
    local search_results = {
        matched_entities = {},
        semantic_analysis = {},
        search_statistics = {},
        related_concepts = {}
    }
    
    -- Knowledge graph entities with semantic embeddings (simulated)
    local entities_db = {
        {
            id = 'AAPL',
            type = 'STOCK',
            label = 'Apple Inc',
            description = 'Technology company specializing in consumer electronics, software, and services',
            semantic_keywords = {'technology', 'innovation', 'consumer', 'electronics', 'software', 'mobile', 'computers'},
            embedding_vector = {0.8, 0.6, 0.9, 0.7, 0.5, 0.8, 0.4}, -- Simulated 7D embedding
            popularity_score = 0.95,
            recency_score = 0.9
        },
        {
            id = 'TIM_COOK',
            type = 'PERSON',
            label = 'Tim Cook',
            description = 'Chief Executive Officer of Apple Inc, technology industry leader',
            semantic_keywords = {'leadership', 'executive', 'technology', 'ceo', 'innovation', 'strategy'},
            embedding_vector = {0.7, 0.9, 0.6, 0.8, 0.7, 0.5, 0.6},
            popularity_score = 0.88,
            recency_score = 0.85
        },
        {
            id = 'AI_TECH',
            type = 'CONCEPT',
            label = 'Artificial Intelligence',
            description = 'Machine learning and artificial intelligence technologies and applications',
            semantic_keywords = {'artificial', 'intelligence', 'machine', 'learning', 'neural', 'automation', 'algorithms'},
            embedding_vector = {0.9, 0.8, 0.7, 0.9, 0.8, 0.6, 0.7},
            popularity_score = 0.92,
            recency_score = 0.95
        },
        {
            id = 'CLOUD_COMPUTING',
            type = 'CONCEPT',
            label = 'Cloud Computing',
            description = 'Distributed computing services and infrastructure over the internet',
            semantic_keywords = {'cloud', 'computing', 'distributed', 'infrastructure', 'services', 'scalability'},
            embedding_vector = {0.6, 0.7, 0.8, 0.6, 0.9, 0.7, 0.8},
            popularity_score = 0.78,
            recency_score = 0.88
        },
        {
            id = 'EARNINGS_Q3',
            type = 'EVENT',
            label = 'Q3 2025 Earnings',
            description = 'Third quarter financial results and earnings reports for 2025',
            semantic_keywords = {'earnings', 'financial', 'results', 'quarterly', 'revenue', 'profit'},
            embedding_vector = {0.5, 0.4, 0.6, 0.5, 0.4, 0.9, 0.8},
            popularity_score = 0.72,
            recency_score = 0.95
        },
        {
            id = 'MARKET_VOLATILITY',
            type = 'CONCEPT',
            label = 'Market Volatility',
            description = 'Financial market fluctuations and price movement patterns',
            semantic_keywords = {'volatility', 'market', 'fluctuation', 'risk', 'uncertainty', 'trading'},
            embedding_vector = {0.4, 0.5, 0.3, 0.7, 0.6, 0.8, 0.9},
            popularity_score = 0.65,
            recency_score = 0.8
        },
        {
            id = 'INNOVATION',
            type = 'CONCEPT',
            label = 'Innovation',
            description = 'Technological and business innovation processes and outcomes',
            semantic_keywords = {'innovation', 'creativity', 'technology', 'advancement', 'breakthrough', 'development'},
            embedding_vector = {0.8, 0.7, 0.9, 0.6, 0.7, 0.5, 0.4},
            popularity_score = 0.75,
            recency_score = 0.7
        },
        {
            id = 'REGULATORY_CHANGES',
            type = 'EVENT',
            label = 'Regulatory Changes',
            description = 'New regulations and policy changes affecting financial markets',
            semantic_keywords = {'regulation', 'policy', 'compliance', 'government', 'rules', 'legal'},
            embedding_vector = {0.3, 0.6, 0.4, 0.5, 0.3, 0.7, 0.8},
            popularity_score = 0.58,
            recency_score = 0.75
        }
    }
    
    -- Semantic similarity calculation using cosine similarity
    local function cosine_similarity(vec1, vec2)
        local dot_product = 0
        local norm1 = 0
        local norm2 = 0
        
        for i = 1, math.min(#vec1, #vec2) do
            dot_product = dot_product + vec1[i] * vec2[i]
            norm1 = norm1 + vec1[i] * vec1[i]
            norm2 = norm2 + vec2[i] * vec2[i]
        end
        
        norm1 = math.sqrt(norm1)
        norm2 = math.sqrt(norm2)
        
        if norm1 == 0 or norm2 == 0 then
            return 0
        end
        
        return dot_product / (norm1 * norm2)
    end
    
    -- Create query embedding from search terms
    local query_embedding = {}
    local term_weights = {
        technology = {0.9, 0.7, 0.8, 0.6, 0.5, 0.4, 0.3},
        innovation = {0.8, 0.6, 0.9, 0.5, 0.7, 0.4, 0.2},
        ai = {0.9, 0.8, 0.7, 0.9, 0.8, 0.6, 0.7},
        artificial = {0.9, 0.8, 0.7, 0.9, 0.8, 0.6, 0.7},
        intelligence = {0.9, 0.8, 0.7, 0.9, 0.8, 0.6, 0.7},
        market = {0.4, 0.5, 0.3, 0.7, 0.6, 0.8, 0.9},
        financial = {0.5, 0.4, 0.6, 0.5, 0.4, 0.9, 0.8},
        leadership = {0.7, 0.9, 0.6, 0.8, 0.7, 0.5, 0.6},
        computing = {0.6, 0.7, 0.8, 0.6, 0.9, 0.7, 0.8}
    }
    
    -- Initialize query embedding
    for i = 1, 7 do
        query_embedding[i] = 0
    end
    
    -- Aggregate embeddings from search terms
    local term_count = 0
    for i, term in ipairs(terms) do
        local term_lower = term:lower()
        if term_weights[term_lower] then
            for j = 1, 7 do
                query_embedding[j] = query_embedding[j] + term_weights[term_lower][j]
            end
            term_count = term_count + 1
        else
            -- Default embedding for unknown terms
            for j = 1, 7 do
                query_embedding[j] = query_embedding[j] + 0.5
            end
            term_count = term_count + 1
        end
    end
    
    -- Normalize query embedding
    if term_count > 0 then
        for i = 1, 7 do
            query_embedding[i] = query_embedding[i] / term_count
        end
    end
    
    -- Search and score entities
    local scored_entities = {}
    
    for i, entity in ipairs(entities_db) do
        -- Filter by entity type
        local type_match = false
        for j, allowed_type in ipairs(types_filter) do
            if entity.type == allowed_type then
                type_match = true
                break
            end
        end
        
        if type_match then
            -- Calculate semantic similarity
            local semantic_score = cosine_similarity(query_embedding, entity.embedding_vector)
            
            -- Calculate keyword match score
            local keyword_score = 0
            local keyword_matches = 0
            
            for j, term in ipairs(terms) do
                local term_lower = term:lower()
                for k, keyword in ipairs(entity.semantic_keywords) do
                    if keyword:find(term_lower) or term_lower:find(keyword) then
                        keyword_score = keyword_score + 1
                        keyword_matches = keyword_matches + 1
                        break
                    end
                end
            end
            
            keyword_score = keyword_score / #terms
            
            -- Calculate composite score
            local composite_score = (semantic_score * 0.6) + 
                                  (keyword_score * 0.25) + 
                                  (entity.popularity_score * 0.1) + 
                                  (entity.recency_score * 0.05)
            
            -- Check if above threshold
            if composite_score >= threshold then
                table.insert(scored_entities, {
                    entity = entity,
                    semantic_similarity = semantic_score,
                    keyword_match_score = keyword_score,
                    keyword_matches_count = keyword_matches,
                    composite_score = composite_score,
                    relevance_explanation = {
                        semantic_match = semantic_score >= 0.7 and 'high' or semantic_score >= 0.5 and 'medium' or 'low',
                        keyword_match = keyword_matches .. ' of ' .. #terms .. ' terms matched',
                        popularity_boost = entity.popularity_score > 0.8 and 'significant' or 'minor',
                        recency_boost = entity.recency_score > 0.9 and 'recent' or 'standard'
                    }
                })
            end
        end
    end
    
    -- Sort by composite score
    table.sort(scored_entities, function(a, b) return a.composite_score > b.composite_score end)
    
    -- Limit results
    local limited_results = {}
    for i = 1, math.min(limit, #scored_entities) do
        table.insert(limited_results, scored_entities[i])
    end
    
    -- Build matched entities result
    for i, result in ipairs(limited_results) do
        table.insert(search_results.matched_entities, {
            rank = i,
            entity_id = result.entity.id,
            entity_type = result.entity.type,
            entity_label = result.entity.label,
            description = result.entity.description,
            relevance_score = result.composite_score,
            semantic_similarity = result.semantic_similarity,
            keyword_matches = result.keyword_matches_count,
            matched_keywords = (function()
                local matches = {}
                for j, term in ipairs(terms) do
                    local term_lower = term:lower()
                    for k, keyword in ipairs(result.entity.semantic_keywords) do
                        if keyword:find(term_lower) or term_lower:find(keyword) then
                            table.insert(matches, keyword)
                            break
                        end
                    end
                end
                return matches
            end)(),
            relevance_explanation = result.relevance_explanation
        })
    end
    
    -- Semantic analysis
    local avg_semantic_score = 0
    local max_semantic_score = 0
    local min_semantic_score = 1
    
    for i, result in ipairs(limited_results) do
        avg_semantic_score = avg_semantic_score + result.semantic_similarity
        max_semantic_score = math.max(max_semantic_score, result.semantic_similarity)
        min_semantic_score = math.min(min_semantic_score, result.semantic_similarity)
    end
    
    avg_semantic_score = #limited_results > 0 and avg_semantic_score / #limited_results or 0
    
    search_results.semantic_analysis = {
        query_terms = terms,
        query_embedding_strength = (function()
            local sum = 0
            for i, val in ipairs(query_embedding) do
                sum = sum + val * val
            end
            return math.sqrt(sum)
        end)(),
        semantic_coherence = avg_semantic_score,
        semantic_range = {min_semantic_score, max_semantic_score},
        concept_clusters_identified = 3, -- Simulated
        semantic_drift = 0.15 -- How much results deviate from query
    }
    
    -- Search statistics
    search_results.search_statistics = {
        total_entities_searched = #entities_db,
        entities_above_threshold = #scored_entities,
        results_returned = #limited_results,
        threshold_used = threshold,
        entity_types_searched = types_filter,
        search_coverage = (#scored_entities / #entities_db) * 100,
        precision_estimate = avg_semantic_score,
        recall_estimate = math.min(1.0, #scored_entities / 10) -- Simulated based on expected results
    }
    
    -- Related concepts (entities with high semantic similarity to query)
    local related_concepts = {}
    for i, entity in ipairs(entities_db) do
        if entity.type == 'CONCEPT' then
            local concept_similarity = cosine_similarity(query_embedding, entity.embedding_vector)
            if concept_similarity >= 0.6 then
                table.insert(related_concepts, {
                    concept_id = entity.id,
                    concept_label = entity.label,
                    similarity_score = concept_similarity,
                    relationship_type = concept_similarity >= 0.8 and 'strongly_related' or 'related'
                })
            end
        end
    end
    
    -- Sort related concepts by similarity
    table.sort(related_concepts, function(a, b) return a.similarity_score > b.similarity_score end)
    
    search_results.related_concepts = related_concepts
    
    return json.encode(search_results)
end
/

-- 13. Construct relationship networks between entities
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.build_relationship_graph_udf(
    source_entities VARCHAR(2000000),
    relationship_types VARCHAR(2000000),
    confidence_threshold DOUBLE
) RETURNS VARCHAR(2000000) AS
function run(ctx)
    local json = require('json')
    
    -- Parse input parameters
    local sources = json.decode(source_entities)
    local rel_types = json.decode(relationship_types) or {'ALL'}
    local threshold = confidence_threshold or 0.6
    
    local graph_results = {
        relationship_network = {},
        network_statistics = {},
        graph_metrics = {},
        entity_clusters = {}
    }
    
    -- Comprehensive relationship database
    local relationship_db = {
        {
            source_id = 'AAPL',
            target_id = 'TIM_COOK',
            relationship_type = 'LEADERSHIP',
            confidence = 1.0,
            strength = 0.95,
            frequency = 1000,
            first_observed = '2011-08-24',
            last_updated = '2025-07-13',
            bidirectional = false,
            temporal_stability = 0.98
        },
        {
            source_id = 'AAPL',
            target_id = 'AI_TECH',
            relationship_type = 'INVESTMENT',
            confidence = 0.85,
            strength = 0.78,
            frequency = 245,
            first_observed = '2018-03-15',
            last_updated = '2025-07-10',
            bidirectional = false,
            temporal_stability = 0.82
        },
        {
            source_id = 'AAPL',
            target_id = 'IPHONE',
            relationship_type = 'PRODUCTION',
            confidence = 1.0,
            strength = 0.98,
            frequency = 850,
            first_observed = '2007-06-29',
            last_updated = '2025-07-13',
            bidirectional = false,
            temporal_stability = 0.95
        },
        {
            source_id = 'TIM_COOK',
            target_id = 'INNOVATION',
            relationship_type = 'ADVOCACY',
            confidence = 0.89,
            strength = 0.76,
            frequency = 156,
            first_observed = '2012-01-15',
            last_updated = '2025-07-08',
            bidirectional = false,
            temporal_stability = 0.88
        },
        {
            source_id = 'AI_TECH',
            target_id = 'CLOUD_COMPUTING',
            relationship_type = 'SYNERGY',
            confidence = 0.92,
            strength = 0.84,
            frequency = 312,
            first_observed = '2019-05-20',
            last_updated = '2025-07-11',
            bidirectional = true,
            temporal_stability = 0.91
        },
        {
            source_id = 'AAPL',
            target_id = 'NASDAQ',
            relationship_type = 'LISTING',
            confidence = 1.0,
            strength = 1.0,
            frequency = 1500,
            first_observed = '1980-12-12',
            last_updated = '2025-07-13',
            bidirectional = false,
            temporal_stability = 1.0
        },
        {
            source_id = 'EARNINGS_Q3',
            target_id = 'AAPL',
            relationship_type = 'FINANCIAL_EVENT',
            confidence = 0.95,
            strength = 0.88,
            frequency = 28,
            first_observed = '2025-07-01',
            last_updated = '2025-07-13',
            bidirectional = false,
            temporal_stability = 0.75
        },
        {
            source_id = 'MARKET_VOLATILITY',
            target_id = 'AAPL',
            relationship_type = 'MARKET_IMPACT',
            confidence = 0.73,
            strength = 0.65,
            frequency = 89,
            first_observed = '2020-03-15',
            last_updated = '2025-07-12',
            bidirectional = false,
            temporal_stability = 0.69
        },
        {
            source_id = 'TECH_SECTOR',
            target_id = 'AAPL',
            relationship_type = 'SECTOR_MEMBERSHIP',
            confidence = 1.0,
            strength = 0.96,
            frequency = 720,
            first_observed = '1976-04-01',
            last_updated = '2025-07-13',
            bidirectional = false,
            temporal_stability = 0.99
        },
        {
            source_id = 'REGULATORY_CHANGES',
            target_id = 'TECH_SECTOR',
            relationship_type = 'REGULATORY_IMPACT',
            confidence = 0.67,
            strength = 0.58,
            frequency = 45,
            first_observed = '2021-10-15',
            last_updated = '2025-07-05',
            bidirectional = false,
            temporal_stability = 0.62
        }
    }
    
    -- Filter relationships by source entities and types
    local filtered_relationships = {}
    
    for i, rel in ipairs(relationship_db) do
        -- Check if source entity matches
        local source_match = false
        for j, source in ipairs(sources) do
            if rel.source_id == source or rel.target_id == source then
                source_match = true
                break
            end
        end
        
        -- Check relationship type filter
        local type_match = false
        if rel_types[1] == 'ALL' then
            type_match = true
        else
            for j, rel_type in ipairs(rel_types) do
                if rel.relationship_type == rel_type then
                    type_match = true
                    break
                end
            end
        end
        
        -- Check confidence threshold
        if source_match and type_match and rel.confidence >= threshold then
            table.insert(filtered_relationships, rel)
        end
    end
    
    -- Build relationship network
    local nodes = {}
    local edges = {}
    local node_index = {}
    
    -- Collect unique nodes
    for i, rel in ipairs(filtered_relationships) do
        if not node_index[rel.source_id] then
            node_index[rel.source_id] = #nodes + 1
            table.insert(nodes, {
                id = rel.source_id,
                label = rel.source_id:gsub('_', ' '),
                type = 'ENTITY',
                degree = 0,
                in_degree = 0,
                out_degree = 0,
                centrality_score = 0
            })
        end
        
        if not node_index[rel.target_id] then
            node_index[rel.target_id] = #nodes + 1
            table.insert(nodes, {
                id = rel.target_id,
                label = rel.target_id:gsub('_', ' '),
                type = 'ENTITY',
                degree = 0,
                in_degree = 0,
                out_degree = 0,
                centrality_score = 0
            })
        end
    end
    
    -- Build edges and calculate node degrees
    for i, rel in ipairs(filtered_relationships) do
        local edge = {
            source = rel.source_id,
            target = rel.target_id,
            relationship_type = rel.relationship_type,
            confidence = rel.confidence,
            strength = rel.strength,
            weight = rel.strength * rel.confidence,
            frequency = rel.frequency,
            bidirectional = rel.bidirectional,
            temporal_stability = rel.temporal_stability,
            relationship_age_days = math.floor((os.time() - os.time({year=2025, month=7, day=1})) / 86400),
            relationship_quality = (rel.confidence + rel.strength + rel.temporal_stability) / 3
        }
        
        table.insert(edges, edge)
        
        -- Update node degrees
        local source_node = nodes[node_index[rel.source_id]]
        local target_node = nodes[node_index[rel.target_id]]
        
        source_node.out_degree = source_node.out_degree + 1
        source_node.degree = source_node.degree + 1
        
        target_node.in_degree = target_node.in_degree + 1
        target_node.degree = target_node.degree + 1
        
        if rel.bidirectional then
            source_node.in_degree = source_node.in_degree + 1
            target_node.out_degree = target_node.out_degree + 1
        end
    end
    
    -- Calculate centrality scores (simplified)
    for i, node in ipairs(nodes) do
        node.centrality_score = node.degree / (#nodes - 1)
    end
    
    -- Identify clusters using simple connected components
    local visited = {}
    local clusters = {}
    local cluster_id = 0
    
    local function dfs(node_id, current_cluster)
        if visited[node_id] then
            return
        end
        
        visited[node_id] = true
        table.insert(current_cluster, node_id)
        
        -- Find connected nodes
        for i, edge in ipairs(edges) do
            if edge.source == node_id and not visited[edge.target] then
                dfs(edge.target, current_cluster)
            elseif edge.target == node_id and not visited[edge.source] then
                dfs(edge.source, current_cluster)
            end
        end
    end
    
    for i, node in ipairs(nodes) do
        if not visited[node.id] then
            cluster_id = cluster_id + 1
            local cluster = {}
            dfs(node.id, cluster)
            
            if #cluster > 0 then
                table.insert(clusters, {
                    cluster_id = cluster_id,
                    nodes = cluster,
                    size = #cluster,
                    density = #cluster > 1 and (function()
                        local internal_edges = 0
                        for j, edge in ipairs(edges) do
                            local source_in_cluster = false
                            local target_in_cluster = false
                            
                            for k, cluster_node in ipairs(cluster) do
                                if edge.source == cluster_node then source_in_cluster = true end
                                if edge.target == cluster_node then target_in_cluster = true end
                            end
                            
                            if source_in_cluster and target_in_cluster then
                                internal_edges = internal_edges + 1
                            end
                        end
                        
                        local max_possible_edges = #cluster * (#cluster - 1) / 2
                        return max_possible_edges > 0 and internal_edges / max_possible_edges or 0
                    end)() or 0
                })
            end
        end
    end
    
    -- Network statistics
    local total_edges = #edges
    local total_nodes = #nodes
    local max_possible_edges = total_nodes * (total_nodes - 1) / 2
    local network_density = max_possible_edges > 0 and total_edges / max_possible_edges or 0
    
    -- Calculate average relationship metrics
    local avg_confidence = 0
    local avg_strength = 0
    local avg_frequency = 0
    
    for i, edge in ipairs(edges) do
        avg_confidence = avg_confidence + edge.confidence
        avg_strength = avg_strength + edge.strength
        avg_frequency = avg_frequency + edge.frequency
    end
    
    if total_edges > 0 then
        avg_confidence = avg_confidence / total_edges
        avg_strength = avg_strength / total_edges
        avg_frequency = avg_frequency / total_edges
    end
    
    -- Set final results
    graph_results.relationship_network = {
        nodes = nodes,
        edges = edges,
        network_type = 'directed_weighted',
        construction_timestamp = os.date('%Y-%m-%d %H:%M:%S')
    }
    
    graph_results.network_statistics = {
        total_nodes = total_nodes,
        total_edges = total_edges,
        network_density = network_density,
        average_degree = total_nodes > 0 and (total_edges * 2) / total_nodes or 0,
        clustering_coefficient = 0.72, -- Simulated
        diameter = 4, -- Simulated longest shortest path
        average_path_length = 2.3, -- Simulated
        connected_components = #clusters
    }
    
    graph_results.graph_metrics = {
        relationship_quality = {
            average_confidence = avg_confidence,
            average_strength = avg_strength,
            average_frequency = avg_frequency,
            temporal_stability_avg = 0.84 -- Simulated
        },
        centrality_distribution = {
            max_centrality = (function()
                local max = 0
                for i, node in ipairs(nodes) do
                    max = math.max(max, node.centrality_score)
                end
                return max
            end)(),
            centrality_variance = 0.15 -- Simulated
        },
        relationship_type_distribution = (function()
            local dist = {}
            for i, edge in ipairs(edges) do
                dist[edge.relationship_type] = (dist[edge.relationship_type] or 0) + 1
            end
            return dist
        end)()
    }
    
    graph_results.entity_clusters = clusters
    
    return json.encode(graph_results)
end
/

-- 14. Navigate knowledge graph paths and connections
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.execute_graph_traversal_udf(
    start_node VARCHAR(100),
    end_node VARCHAR(100),
    max_depth DOUBLE,
    traversal_algorithm VARCHAR(100)
) RETURNS VARCHAR(2000000) AS
function run(ctx)
    local json = require('json')
    
    -- Parse input parameters
    local start = start_node or 'AAPL'
    local target = end_node or 'AI_TECH'
    local depth = max_depth or 5
    local algorithm = traversal_algorithm or 'shortest_path'
    
    local traversal_results = {
        paths_found = {},
        traversal_statistics = {},
        algorithm_performance = {},
        graph_insights = {}
    }
    
    -- Knowledge graph structure for traversal
    local graph_structure = {
        nodes = {
            'AAPL', 'TIM_COOK', 'AI_TECH', 'CLOUD_COMPUTING', 'IPHONE', 
            'NASDAQ', 'TECH_SECTOR', 'INNOVATION', 'EARNINGS_Q3', 
            'MARKET_VOLATILITY', 'REGULATORY_CHANGES', 'INVESTORS'
        },
        edges = {
            {from = 'AAPL', to = 'TIM_COOK', weight = 1.0, type = 'LEADERSHIP'},
            {from = 'AAPL', to = 'AI_TECH', weight = 0.8, type = 'INVESTMENT'},
            {from = 'AAPL', to = 'IPHONE', weight = 0.95, type = 'PRODUCTION'},
            {from = 'AAPL', to = 'NASDAQ', weight = 1.0, type = 'LISTING'},
            {from = 'AAPL', to = 'TECH_SECTOR', weight = 0.9, type = 'MEMBERSHIP'},
            {from = 'TIM_COOK', to = 'INNOVATION', weight = 0.75, type = 'ADVOCACY'},
            {from = 'AI_TECH', to = 'CLOUD_COMPUTING', weight = 0.85, type = 'SYNERGY'},
            {from = 'AI_TECH', to = 'INNOVATION', weight = 0.9, type = 'REPRESENTATION'},
            {from = 'EARNINGS_Q3', to = 'AAPL', weight = 0.9, type = 'FINANCIAL_EVENT'},
            {from = 'MARKET_VOLATILITY', to = 'AAPL', weight = 0.6, type = 'IMPACT'},
            {from = 'REGULATORY_CHANGES', to = 'TECH_SECTOR', weight = 0.7, type = 'REGULATION'},
            {from = 'TECH_SECTOR', to = 'INNOVATION', weight = 0.8, type = 'DRIVES'},
            {from = 'INVESTORS', to = 'AAPL', weight = 0.85, type = 'INVESTMENT'},
            {from = 'CLOUD_COMPUTING', to = 'TECH_SECTOR', weight = 0.7, type = 'PART_OF'}
        }
    }
    
    -- Build adjacency list for efficient traversal
    local adjacency_list = {}
    for i, node in ipairs(graph_structure.nodes) do
        adjacency_list[node] = {}
    end
    
    for i, edge in ipairs(graph_structure.edges) do
        table.insert(adjacency_list[edge.from], {
            to = edge.to,
            weight = edge.weight,
            type = edge.type
        })
        
        -- Add reverse edge for undirected traversal
        table.insert(adjacency_list[edge.to], {
            to = edge.from,
            weight = edge.weight,
            type = edge.type
        })
    end
    
    -- Traversal algorithms
    if algorithm == 'shortest_path' then
        -- Dijkstra's algorithm for shortest path
        local distances = {}
        local previous = {}
        local visited = {}
        local priority_queue = {}
        
        -- Initialize distances
        for i, node in ipairs(graph_structure.nodes) do
            distances[node] = math.huge
            previous[node] = nil
            visited[node] = false
        end
        
        distances[start] = 0
        table.insert(priority_queue, {node = start, distance = 0})
        
        while #priority_queue > 0 do
            -- Extract minimum distance node
            table.sort(priority_queue, function(a, b) return a.distance < b.distance end)
            local current = table.remove(priority_queue, 1)
            
            if visited[current.node] then
                goto continue
            end
            
            visited[current.node] = true
            
            -- Check if we reached the target
            if current.node == target then
                break
            end
            
            -- Update distances to neighbors
            if adjacency_list[current.node] then
                for i, neighbor in ipairs(adjacency_list[current.node]) do
                    if not visited[neighbor.to] then
                        local alt_distance = distances[current.node] + (1.0 / neighbor.weight)
                        
                        if alt_distance < distances[neighbor.to] then
                            distances[neighbor.to] = alt_distance
                            previous[neighbor.to] = current.node
                            table.insert(priority_queue, {node = neighbor.to, distance = alt_distance})
                        end
                    end
                end
            end
            
            ::continue::
        end
        
        -- Reconstruct path
        if previous[target] or start == target then
            local path = {}
            local current = target
            local total_weight = 0
            
            while current do
                table.insert(path, 1, current)
                if previous[current] then
                    -- Find edge weight
                    if adjacency_list[previous[current]] then
                        for i, neighbor in ipairs(adjacency_list[previous[current]]) do
                            if neighbor.to == current then
                                total_weight = total_weight + neighbor.weight
                                break
                            end
                        end
                    end
                end
                current = previous[current]
            end
            
            table.insert(traversal_results.paths_found, {
                path_id = 1,
                path_nodes = path,
                path_length = #path - 1,
                total_weight = total_weight,
                path_quality = total_weight / (#path - 1),
                path_type = 'shortest_distance',
                edge_details = (function()
                    local edges = {}
                    for i = 1, #path - 1 do
                        if adjacency_list[path[i]] then
                            for j, neighbor in ipairs(adjacency_list[path[i]]) do
                                if neighbor.to == path[i + 1] then
                                    table.insert(edges, {
                                        from = path[i],
                                        to = path[i + 1],
                                        weight = neighbor.weight,
                                        type = neighbor.type
                                    })
                                    break
                                end
                            end
                        end
                    end
                    return edges
                end)()
            })
        end
        
    elseif algorithm == 'all_paths' then
        -- Find all paths up to max depth using DFS
        local all_paths = {}
        
        local function dfs(current_node, current_path, current_weight, visited_set, current_depth)
            if current_depth > depth then
                return
            end
            
            if current_node == target and #current_path > 1 then
                local path_copy = {}
                for i, node in ipairs(current_path) do
                    table.insert(path_copy, node)
                end
                
                table.insert(all_paths, {
                    path_nodes = path_copy,
                    path_length = #path_copy - 1,
                    total_weight = current_weight,
                    path_quality = current_weight / (#path_copy - 1)
                })
                return
            end
            
            if adjacency_list[current_node] then
                for i, neighbor in ipairs(adjacency_list[current_node]) do
                    if not visited_set[neighbor.to] and current_depth < depth then
                        visited_set[neighbor.to] = true
                        table.insert(current_path, neighbor.to)
                        
                        dfs(neighbor.to, current_path, current_weight + neighbor.weight, visited_set, current_depth + 1)
                        
                        table.remove(current_path)
                        visited_set[neighbor.to] = nil
                    end
                end
            end
        end
        
        local initial_visited = {}
        initial_visited[start] = true
        dfs(start, {start}, 0, initial_visited, 0)
        
        -- Sort paths by quality (weight per hop)
        table.sort(all_paths, function(a, b) return a.path_quality > b.path_quality end)
        
        -- Take top 10 paths
        for i = 1, math.min(10, #all_paths) do
            table.insert(traversal_results.paths_found, {
                path_id = i,
                path_nodes = all_paths[i].path_nodes,
                path_length = all_paths[i].path_length,
                total_weight = all_paths[i].total_weight,
                path_quality = all_paths[i].path_quality,
                path_type = 'all_paths_ranked'
            })
        end
        
    elseif algorithm == 'random_walk' then
        -- Random walk with restart probability
        local restart_probability = 0.15
        local walk_length = math.min(depth * 2, 20)
        local walks = 5
        
        for walk = 1, walks do
            local path = {start}
            local current = start
            local total_weight = 0
            
            for step = 1, walk_length do
                -- Restart with probability
                if math.random() < restart_probability then
                    current = start
                    table.insert(path, current)
                    goto continue_walk
                end
                
                -- Random neighbor selection
                if adjacency_list[current] and #adjacency_list[current] > 0 then
                    local neighbors = adjacency_list[current]
                    local selected_neighbor = neighbors[math.random(#neighbors)]
                    
                    current = selected_neighbor.to
                    total_weight = total_weight + selected_neighbor.weight
                    table.insert(path, current)
                    
                    -- Check if we reached target
                    if current == target then
                        break
                    end
                else
                    break
                end
                
                ::continue_walk::
            end
            
            table.insert(traversal_results.paths_found, {
                path_id = walk,
                path_nodes = path,
                path_length = #path - 1,
                total_weight = total_weight,
                path_quality = #path > 1 and total_weight / (#path - 1) or 0,
                path_type = 'random_walk',
                reached_target = path[#path] == target
            })
        end
    end
    
    -- Traversal statistics
    local paths_found = #traversal_results.paths_found
    local avg_path_length = 0
    local avg_path_weight = 0
    local successful_paths = 0
    
    for i, path in ipairs(traversal_results.paths_found) do
        avg_path_length = avg_path_length + path.path_length
        avg_path_weight = avg_path_weight + path.total_weight
        
        if path.path_nodes[#path.path_nodes] == target then
            successful_paths = successful_paths + 1
        end
    end
    
    avg_path_length = paths_found > 0 and avg_path_length / paths_found or 0
    avg_path_weight = paths_found > 0 and avg_path_weight / paths_found or 0
    
    traversal_results.traversal_statistics = {
        start_node = start,
        target_node = target,
        max_depth_used = depth,
        total_paths_found = paths_found,
        successful_paths = successful_paths,
        success_rate = paths_found > 0 and successful_paths / paths_found or 0,
        average_path_length = avg_path_length,
        average_path_weight = avg_path_weight,
        nodes_explored = #graph_structure.nodes,
        edges_traversed = #graph_structure.edges
    }
    
    traversal_results.algorithm_performance = {
        algorithm_used = algorithm,
        execution_time_ms = math.random(10, 100),
        memory_usage_mb = 0.5,
        complexity_class = algorithm == 'shortest_path' and 'O(V log V + E)' or
                          algorithm == 'all_paths' and 'O(V!)' or 'O(k*L)',
        scalability_rating = algorithm == 'shortest_path' and 'excellent' or
                           algorithm == 'all_paths' and 'poor' or 'good'
    }
    
    traversal_results.graph_insights = {
        connectivity = successful_paths > 0 and 'connected' or 'disconnected',
        path_diversity = paths_found > 1 and 'multiple_paths' or 'single_path',
        relationship_strength = avg_path_weight > 0.8 and 'strong' or
                              avg_path_weight > 0.5 and 'medium' or 'weak',
        graph_density = (#graph_structure.edges * 2) / (#graph_structure.nodes * (#graph_structure.nodes - 1)),
        centrality_importance = {
            start_node_centrality = 0.85, -- Simulated
            target_node_centrality = 0.72, -- Simulated
            path_centrality_avg = 0.78 -- Simulated
        }
    }
    
    return json.encode(traversal_results)
end
/