-- Exasol LUA UDF Migration: News Processing & Loading Functions
-- Migrated from HANA News Processing stored procedures

-- 1. PROCESS NEWS CONTENT
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.process_news_content(
    news_content VARCHAR(2000000),
    content_type VARCHAR(50),
    processing_options_json VARCHAR(10000)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local options = json.decode(ctx.processing_options_json or "{}")
    local content = ctx.news_content or ""
    
    local processed_result = {
        original_length = string.len(content),
        processed_content = content,
        extracted_entities = {},
        sentiment_score = 0,
        key_metrics = {},
        content_type = ctx.content_type,
        processing_timestamp = os.time()
    }
    
    -- Text cleaning and preprocessing
    local cleaned_content = content
    
    -- Remove excessive whitespace
    cleaned_content = string.gsub(cleaned_content, "%s+", " ")
    
    -- Remove special characters if requested
    if options.remove_special_chars then
        cleaned_content = string.gsub(cleaned_content, "[^%w%s%.%,%-]", "")
    end
    
    processed_result.processed_content = cleaned_content
    processed_result.processed_length = string.len(cleaned_content)
    
    -- Extract financial entities
    local entities = {}
    
    -- Extract monetary amounts
    for amount in string.gmatch(cleaned_content, "%$([%d,%.]+[BMK]?)") do
        table.insert(entities, {
            type = "MONETARY_AMOUNT",
            value = "$" .. amount,
            position = string.find(cleaned_content, "%$" .. amount:gsub("([%.%-%+%*%?%[%]%^%$%(%)%%])", "%%%1"))
        })
    end
    
    -- Extract percentages
    for percent in string.gmatch(cleaned_content, "([%d%.]+)%%") do
        table.insert(entities, {
            type = "PERCENTAGE",
            value = percent .. "%",
            position = string.find(cleaned_content, percent:gsub("([%.%-%+%*%?%[%]%^%$%(%)%%])", "%%%1") .. "%%")
        })
    end
    
    -- Extract dates
    for date in string.gmatch(cleaned_content, "(%d+/%d+/%d+)") do
        table.insert(entities, {
            type = "DATE",
            value = date,
            position = string.find(cleaned_content, date:gsub("([%.%-%+%*%?%[%]%^%$%(%)%%])", "%%%1"))
        })
    end
    
    -- Extract company tickers (simplified)
    for ticker in string.gmatch(cleaned_content, "([A-Z][A-Z][A-Z]+)") do
        if string.len(ticker) <= 5 then  -- Most tickers are 5 chars or less
            table.insert(entities, {
                type = "TICKER",
                value = ticker,
                position = string.find(cleaned_content, ticker)
            })
        end
    end
    
    processed_result.extracted_entities = entities
    
    -- Simple sentiment analysis
    local positive_words = {"positive", "gain", "rise", "increase", "up", "bull", "strong", "growth", "profit", "success"}
    local negative_words = {"negative", "loss", "fall", "decrease", "down", "bear", "weak", "decline", "deficit", "failure"}
    
    local content_lower = string.lower(cleaned_content)
    local pos_count = 0
    local neg_count = 0
    local total_words = 0
    
    for word in string.gmatch(content_lower, "%w+") do
        total_words = total_words + 1
        
        for i = 1, #positive_words do
            if word == positive_words[i] then
                pos_count = pos_count + 1
                break
            end
        end
        
        for i = 1, #negative_words do
            if word == negative_words[i] then
                neg_count = neg_count + 1
                break
            end
        end
    end
    
    if total_words > 0 then
        processed_result.sentiment_score = (pos_count - neg_count) / total_words
    end
    
    -- Extract key metrics
    local metrics = {}
    
    -- Look for specific financial metrics
    local metric_patterns = {
        {"revenue", "revenue"},
        {"profit", "profit"},
        {"earnings", "earnings"},
        {"ebitda", "ebitda"},
        {"margin", "margin"},
        {"yield", "yield"},
        {"rate", "rate"}
    }
    
    for i = 1, #metric_patterns do
        local pattern = metric_patterns[i][1]
        local metric_name = metric_patterns[i][2]
        
        -- Look for the pattern followed by a number
        local match = string.match(content_lower, pattern .. "[%s:%-]*([%d%.]+[%%]?)")
        if match then
            metrics[metric_name] = match
        end
    end
    
    processed_result.key_metrics = metrics
    
    -- Content quality assessment
    processed_result.quality_metrics = {
        readability_score = math.min(100, total_words / 10),  -- Simple readability
        entity_density = #entities / math.max(1, total_words / 100),
        sentiment_strength = math.abs(processed_result.sentiment_score),
        information_richness = #metrics + #entities
    }
    
    return json.encode(processed_result)
end
/

-- 2. NEWS LOADING STATUS TRACKING
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.update_news_loading_status(
    source VARCHAR(100),
    category VARCHAR(100),
    articles_fetched DECIMAL(10,0),
    articles_processed DECIMAL(10,0),
    errors_encountered DECIMAL(10,0),
    status VARCHAR(50)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    
    local status_update = {
        source = ctx.source,
        category = ctx.category,
        articles_fetched = ctx.articles_fetched or 0,
        articles_processed = ctx.articles_processed or 0,
        errors_encountered = ctx.errors_encountered or 0,
        status = ctx.status or "unknown",
        success_rate = 0,
        processing_rate = 0,
        timestamp = os.time()
    }
    
    -- Calculate success and processing rates
    if status_update.articles_fetched > 0 then
        status_update.success_rate = (status_update.articles_fetched - status_update.errors_encountered) / status_update.articles_fetched
        status_update.processing_rate = status_update.articles_processed / status_update.articles_fetched
    end
    
    -- Determine overall health
    local health = "healthy"
    if status_update.success_rate < 0.8 then
        health = "degraded"
    elseif status_update.success_rate < 0.5 then
        health = "critical"
    end
    
    status_update.health = health
    
    -- Generate recommendations
    local recommendations = {}
    
    if status_update.success_rate < 0.9 then
        table.insert(recommendations, "Investigate error sources")
    end
    
    if status_update.processing_rate < 0.8 then
        table.insert(recommendations, "Optimize processing pipeline")
    end
    
    if status_update.articles_fetched < 10 then
        table.insert(recommendations, "Check API connectivity")
    end
    
    status_update.recommendations = recommendations
    
    return json.encode(status_update)
end
/

-- 3. NEWS CLEANUP AND ARCHIVAL
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.cleanup_old_news(
    retention_days DECIMAL(10,0),
    categories_json VARCHAR(1000),
    dry_run BOOLEAN
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local categories = json.decode(ctx.categories_json or "[]")
    local retention_days = ctx.retention_days or 30
    local dry_run = ctx.dry_run or true
    
    local cleanup_result = {
        retention_days = retention_days,
        categories_processed = categories,
        dry_run = dry_run,
        articles_to_delete = 0,
        articles_to_archive = 0,
        storage_freed_mb = 0,
        timestamp = os.time()
    }
    
    local current_time = os.time()
    local cutoff_time = current_time - (retention_days * 24 * 3600)
    
    -- Simulate cleanup analysis (in real implementation, this would query actual data)
    local simulated_articles = {}
    
    -- Generate some sample data for demonstration
    for i = 1, 100 do
        local article_age_days = math.random(1, 60)
        local article_timestamp = current_time - (article_age_days * 24 * 3600)
        local article_size_kb = math.random(5, 50)
        
        table.insert(simulated_articles, {
            article_id = "article_" .. i,
            timestamp = article_timestamp,
            size_kb = article_size_kb,
            category = categories[math.random(1, math.max(1, #categories))] or "general",
            importance_score = math.random() * 100
        })
    end
    
    -- Categorize articles for cleanup
    local to_delete = {}
    local to_archive = {}
    local total_size_to_delete = 0
    local total_size_to_archive = 0
    
    for i = 1, #simulated_articles do
        local article = simulated_articles[i]
        
        if article.timestamp < cutoff_time then
            if article.importance_score < 30 then
                -- Low importance articles get deleted
                table.insert(to_delete, article)
                total_size_to_delete = total_size_to_delete + article.size_kb
            else
                -- High importance articles get archived
                table.insert(to_archive, article)
                total_size_to_archive = total_size_to_archive + article.size_kb
            end
        end
    end
    
    cleanup_result.articles_to_delete = #to_delete
    cleanup_result.articles_to_archive = #to_archive
    cleanup_result.storage_freed_mb = (total_size_to_delete + total_size_to_archive) / 1024
    
    -- Generate cleanup summary by category
    local category_summary = {}
    
    for i = 1, #to_delete do
        local article = to_delete[i]
        local cat = article.category
        
        if not category_summary[cat] then
            category_summary[cat] = {
                deleted = 0,
                archived = 0,
                size_deleted_kb = 0,
                size_archived_kb = 0
            }
        end
        
        category_summary[cat].deleted = category_summary[cat].deleted + 1
        category_summary[cat].size_deleted_kb = category_summary[cat].size_deleted_kb + article.size_kb
    end
    
    for i = 1, #to_archive do
        local article = to_archive[i]
        local cat = article.category
        
        if not category_summary[cat] then
            category_summary[cat] = {
                deleted = 0,
                archived = 0,
                size_deleted_kb = 0,
                size_archived_kb = 0
            }
        end
        
        category_summary[cat].archived = category_summary[cat].archived + 1
        category_summary[cat].size_archived_kb = category_summary[cat].size_archived_kb + article.size_kb
    end
    
    cleanup_result.category_summary = category_summary
    
    -- Cleanup recommendations
    local recommendations = {}
    
    if cleanup_result.articles_to_delete > 50 then
        table.insert(recommendations, "Consider increasing retention period")
    end
    
    if cleanup_result.storage_freed_mb > 100 then
        table.insert(recommendations, "Schedule regular cleanup jobs")
    end
    
    if cleanup_result.articles_to_archive > cleanup_result.articles_to_delete then
        table.insert(recommendations, "Review archival criteria")
    end
    
    cleanup_result.recommendations = recommendations
    
    return json.encode(cleanup_result)
end
/

-- 4. NEWS STATISTICS UPDATE
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.update_news_statistics(
    time_period VARCHAR(20),
    statistics_json VARCHAR(2000000)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local stats = json.decode(ctx.statistics_json or "{}")
    
    local updated_stats = {
        time_period = ctx.time_period,
        total_articles = stats.total_articles or 0,
        articles_by_category = stats.articles_by_category or {},
        articles_by_source = stats.articles_by_source or {},
        sentiment_distribution = stats.sentiment_distribution or {},
        top_entities = stats.top_entities or {},
        trending_topics = stats.trending_topics or {},
        quality_metrics = {},
        timestamp = os.time()
    }
    
    -- Calculate quality metrics
    local total_articles = updated_stats.total_articles
    
    if total_articles > 0 then
        -- Calculate average sentiment
        local sentiment_sum = 0
        local sentiment_count = 0
        
        for sentiment, count in pairs(updated_stats.sentiment_distribution) do
            local sentiment_value = 0
            if sentiment == "positive" then
                sentiment_value = 1
            elseif sentiment == "negative" then
                sentiment_value = -1
            end
            
            sentiment_sum = sentiment_sum + sentiment_value * count
            sentiment_count = sentiment_count + count
        end
        
        local avg_sentiment = 0
        if sentiment_count > 0 then
            avg_sentiment = sentiment_sum / sentiment_count
        end
        
        -- Calculate category diversity (using Shannon entropy)
        local category_entropy = 0
        local total_categorized = 0
        
        for category, count in pairs(updated_stats.articles_by_category) do
            total_categorized = total_categorized + count
        end
        
        if total_categorized > 0 then
            for category, count in pairs(updated_stats.articles_by_category) do
                local probability = count / total_categorized
                if probability > 0 then
                    category_entropy = category_entropy - probability * math.log(probability)
                end
            end
        end
        
        updated_stats.quality_metrics = {
            average_sentiment = avg_sentiment,
            category_diversity = category_entropy,
            coverage_ratio = total_categorized / total_articles,
            articles_per_day = total_articles / (ctx.time_period == "weekly" and 7 or 
                                               ctx.time_period == "monthly" and 30 or 1),
            entity_extraction_rate = #updated_stats.top_entities / total_articles
        }
    end
    
    -- Identify trends and patterns
    local insights = {}
    
    -- Find dominant category
    local max_category_count = 0
    local dominant_category = "none"
    
    for category, count in pairs(updated_stats.articles_by_category) do
        if count > max_category_count then
            max_category_count = count
            dominant_category = category
        end
    end
    
    table.insert(insights, {
        type = "dominant_category",
        value = dominant_category,
        percentage = total_articles > 0 and (max_category_count / total_articles * 100) or 0
    })
    
    -- Sentiment trend
    local positive_count = updated_stats.sentiment_distribution.positive or 0
    local negative_count = updated_stats.sentiment_distribution.negative or 0
    local neutral_count = updated_stats.sentiment_distribution.neutral or 0
    
    local sentiment_trend = "neutral"
    if positive_count > negative_count + neutral_count then
        sentiment_trend = "bullish"
    elseif negative_count > positive_count + neutral_count then
        sentiment_trend = "bearish"
    end
    
    table.insert(insights, {
        type = "sentiment_trend",
        value = sentiment_trend,
        confidence = math.max(positive_count, negative_count, neutral_count) / total_articles
    })
    
    -- Source diversity
    local source_count = 0
    for source, count in pairs(updated_stats.articles_by_source) do
        source_count = source_count + 1
    end
    
    table.insert(insights, {
        type = "source_diversity",
        value = source_count,
        quality = source_count >= 5 and "good" or "limited"
    })
    
    updated_stats.insights = insights
    
    -- Performance benchmarks
    updated_stats.benchmarks = {
        target_articles_per_day = 50,
        target_sentiment_balance = 0.1,  -- Close to neutral
        target_category_diversity = 2.0,  -- Shannon entropy
        target_source_count = 5
    }
    
    -- Calculate overall health score (0-100)
    local health_score = 0
    local health_factors = 0
    
    if updated_stats.quality_metrics.articles_per_day then
        local article_score = math.min(100, updated_stats.quality_metrics.articles_per_day / 50 * 100)
        health_score = health_score + article_score
        health_factors = health_factors + 1
    end
    
    if updated_stats.quality_metrics.category_diversity then
        local diversity_score = math.min(100, updated_stats.quality_metrics.category_diversity / 2.0 * 100)
        health_score = health_score + diversity_score
        health_factors = health_factors + 1
    end
    
    if source_count > 0 then
        local source_score = math.min(100, source_count / 5 * 100)
        health_score = health_score + source_score
        health_factors = health_factors + 1
    end
    
    if health_factors > 0 then
        updated_stats.health_score = health_score / health_factors
    else
        updated_stats.health_score = 0
    end
    
    return json.encode(updated_stats)
end
/

-- 5. TRENDING TOPICS ANALYSIS
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.analyze_trending_topics(
    news_content_array_json VARCHAR(2000000),
    time_window_hours DECIMAL(10,0),
    min_frequency DECIMAL(10,0)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local news_articles = json.decode(ctx.news_content_array_json or "[]")
    local window_hours = ctx.time_window_hours or 24
    local min_freq = ctx.min_frequency or 3
    
    local trending_analysis = {
        time_window_hours = window_hours,
        min_frequency = min_freq,
        trending_topics = {},
        topic_clusters = {},
        momentum_score = {},
        timestamp = os.time()
    }
    
    local current_time = os.time()
    local window_seconds = window_hours * 3600
    
    -- Filter articles within time window
    local recent_articles = {}
    
    for i = 1, #news_articles do
        local article = news_articles[i]
        local article_time = article.timestamp or current_time
        
        if (current_time - article_time) <= window_seconds then
            table.insert(recent_articles, article)
        end
    end
    
    -- Extract keywords and phrases
    local keyword_frequency = {}
    local keyword_timestamps = {}
    
    for i = 1, #recent_articles do
        local article = recent_articles[i]
        local content = string.lower(article.content or article.title or "")
        
        -- Extract meaningful words (filter out common words)
        local stop_words = {
            "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
            "a", "an", "is", "are", "was", "were", "be", "been", "have", "has", "had",
            "will", "would", "could", "should", "may", "might", "can", "do", "does", "did"
        }
        
        for word in string.gmatch(content, "%w+") do
            if string.len(word) >= 4 then  -- Only words 4+ characters
                local is_stop_word = false
                
                for j = 1, #stop_words do
                    if word == stop_words[j] then
                        is_stop_word = true
                        break
                    end
                end
                
                if not is_stop_word then
                    if not keyword_frequency[word] then
                        keyword_frequency[word] = 0
                        keyword_timestamps[word] = {}
                    end
                    
                    keyword_frequency[word] = keyword_frequency[word] + 1
                    table.insert(keyword_timestamps[word], article.timestamp or current_time)
                end
            end
        end
    end
    
    -- Identify trending topics
    for keyword, frequency in pairs(keyword_frequency) do
        if frequency >= min_freq then
            -- Calculate momentum (recent vs. older mentions)
            local timestamps = keyword_timestamps[keyword]
            local recent_mentions = 0
            local older_mentions = 0
            local half_window = window_seconds / 2
            
            for i = 1, #timestamps do
                local age = current_time - timestamps[i]
                if age <= half_window then
                    recent_mentions = recent_mentions + 1
                else
                    older_mentions = older_mentions + 1
                end
            end
            
            -- Calculate momentum score
            local momentum = 0
            if older_mentions > 0 then
                momentum = recent_mentions / older_mentions
            elseif recent_mentions > 0 then
                momentum = 2.0  -- High momentum if all mentions are recent
            end
            
            table.insert(trending_analysis.trending_topics, {
                keyword = keyword,
                frequency = frequency,
                momentum = momentum,
                recent_mentions = recent_mentions,
                older_mentions = older_mentions,
                trend_strength = frequency * momentum
            })
            
            trending_analysis.momentum_score[keyword] = momentum
        end
    end
    
    -- Sort by trend strength
    table.sort(trending_analysis.trending_topics, 
               function(a, b) return a.trend_strength > b.trend_strength end)
    
    -- Keep only top 20 trending topics
    local top_topics = {}
    for i = 1, math.min(20, #trending_analysis.trending_topics) do
        table.insert(top_topics, trending_analysis.trending_topics[i])
    end
    trending_analysis.trending_topics = top_topics
    
    -- Create topic clusters (simple co-occurrence clustering)
    local clusters = {}
    
    for i = 1, #trending_analysis.trending_topics do
        local topic1 = trending_analysis.trending_topics[i]
        local cluster_found = false
        
        -- Check if this topic should be in an existing cluster
        for j = 1, #clusters do
            local cluster = clusters[j]
            
            -- Simple clustering based on co-occurrence in articles
            local cooccurrence_count = 0
            
            for k = 1, #recent_articles do
                local article = recent_articles[k]
                local content = string.lower(article.content or article.title or "")
                
                local has_topic1 = string.find(content, topic1.keyword) ~= nil
                local has_cluster_topic = false
                
                for l = 1, #cluster.topics do
                    if string.find(content, cluster.topics[l]) ~= nil then
                        has_cluster_topic = true
                        break
                    end
                end
                
                if has_topic1 and has_cluster_topic then
                    cooccurrence_count = cooccurrence_count + 1
                end
            end
            
            -- If topics co-occur in at least 2 articles, add to cluster
            if cooccurrence_count >= 2 then
                table.insert(cluster.topics, topic1.keyword)
                cluster.total_frequency = cluster.total_frequency + topic1.frequency
                cluster_found = true
                break
            end
        end
        
        -- Create new cluster if not found
        if not cluster_found then
            table.insert(clusters, {
                topics = {topic1.keyword},
                total_frequency = topic1.frequency,
                cluster_id = #clusters + 1
            })
        end
    end
    
    trending_analysis.topic_clusters = clusters
    trending_analysis.total_articles_analyzed = #recent_articles
    trending_analysis.unique_keywords = 0
    
    for keyword, frequency in pairs(keyword_frequency) do
        trending_analysis.unique_keywords = trending_analysis.unique_keywords + 1
    end
    
    return json.encode(trending_analysis)
end
/