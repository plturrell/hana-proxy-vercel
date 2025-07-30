-- Migration 005: Add Vector Embeddings for Semantic Search
-- Purpose: Enable AI-powered semantic search on news articles
-- Author: AI Assistant
-- Date: 2025-01-22

-- Step 1: Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add embedding column to partitioned table (already added in migration 001)
ALTER TABLE news_articles_partitioned 
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(50) DEFAULT 'text-embedding-ada-002',
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

-- Step 3: Create function to find similar articles
CREATE OR REPLACE FUNCTION find_similar_news(
    query_embedding vector(1536),
    limit_count INT DEFAULT 10,
    similarity_threshold FLOAT DEFAULT 0.7,
    date_range_days INT DEFAULT 30
)
RETURNS TABLE (
    article_id TEXT,
    title TEXT,
    published_at TIMESTAMPTZ,
    source TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.article_id,
        n.title,
        n.published_at,
        n.source,
        1 - (n.embedding <=> query_embedding) as similarity
    FROM news_articles_partitioned n
    WHERE n.embedding IS NOT NULL
    AND n.published_at > CURRENT_DATE - INTERVAL '1 day' * date_range_days
    AND 1 - (n.embedding <=> query_embedding) > similarity_threshold
    ORDER BY n.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create function for semantic news search
CREATE OR REPLACE FUNCTION semantic_news_search(
    query_text TEXT,
    embedding_vector vector(1536),
    limit_count INT DEFAULT 20,
    combine_scores BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    article_id TEXT,
    title TEXT,
    content TEXT,
    published_at TIMESTAMPTZ,
    source TEXT,
    text_rank FLOAT,
    semantic_similarity FLOAT,
    combined_score FLOAT
) AS $$
BEGIN
    IF combine_scores THEN
        -- Combine full-text search with semantic search
        RETURN QUERY
        WITH text_results AS (
            SELECT 
                n.article_id,
                n.title,
                n.content,
                n.published_at,
                n.source,
                ts_rank(n.search_vector, websearch_to_tsquery('english', query_text)) as text_rank,
                CASE 
                    WHEN n.embedding IS NOT NULL 
                    THEN 1 - (n.embedding <=> embedding_vector)
                    ELSE 0
                END as semantic_sim
            FROM news_articles_partitioned n
            WHERE n.search_vector @@ websearch_to_tsquery('english', query_text)
               OR (n.embedding IS NOT NULL AND 1 - (n.embedding <=> embedding_vector) > 0.5)
        )
        SELECT 
            article_id,
            title,
            content,
            published_at,
            source,
            text_rank,
            semantic_sim,
            (0.4 * text_rank + 0.6 * semantic_sim) as combined_score
        FROM text_results
        ORDER BY combined_score DESC
        LIMIT limit_count;
    ELSE
        -- Pure semantic search
        RETURN QUERY
        SELECT 
            n.article_id,
            n.title,
            n.content,
            n.published_at,
            n.source,
            0::FLOAT as text_rank,
            1 - (n.embedding <=> embedding_vector) as semantic_sim,
            1 - (n.embedding <=> embedding_vector) as combined_score
        FROM news_articles_partitioned n
        WHERE n.embedding IS NOT NULL
        ORDER BY n.embedding <=> embedding_vector
        LIMIT limit_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create clustering function for news topics
CREATE OR REPLACE FUNCTION cluster_news_by_embedding(
    num_clusters INT DEFAULT 10,
    date_range_days INT DEFAULT 7
)
RETURNS TABLE (
    cluster_id INT,
    article_count BIGINT,
    centroid vector(1536),
    top_keywords TEXT[],
    avg_sentiment FLOAT,
    representative_title TEXT
) AS $$
DECLARE
    -- This is a placeholder for K-means clustering
    -- In production, you'd use a proper clustering algorithm
BEGIN
    -- For now, return a simple grouping by similarity
    RETURN QUERY
    WITH recent_news AS (
        SELECT *
        FROM news_articles_partitioned
        WHERE published_at > CURRENT_DATE - INTERVAL '1 day' * date_range_days
        AND embedding IS NOT NULL
    ),
    clusters AS (
        SELECT 
            (ROW_NUMBER() OVER (ORDER BY embedding) - 1) / 
            ((SELECT COUNT(*) FROM recent_news) / num_clusters) as cluster_id,
            article_id,
            title,
            embedding,
            keywords,
            sentiment_score
        FROM recent_news
    )
    SELECT 
        cluster_id::INT,
        COUNT(*) as article_count,
        AVG(embedding) as centroid,
        ARRAY_AGG(DISTINCT unnest(keywords)) as top_keywords,
        AVG(sentiment_score)::FLOAT as avg_sentiment,
        (ARRAY_AGG(title ORDER BY RANDOM()))[1] as representative_title
    FROM clusters
    GROUP BY cluster_id
    ORDER BY cluster_id;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create indexes for vector similarity search
-- Using IVFFlat for approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_news_embedding_ivfflat 
    ON news_articles_partitioned 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Alternative: Using HNSW for better recall (if available)
-- CREATE INDEX IF NOT EXISTS idx_news_embedding_hnsw 
--     ON news_articles_partitioned 
--     USING hnsw (embedding vector_cosine_ops);

-- Step 7: Create materialized view for topic embeddings
CREATE MATERIALIZED VIEW news_topic_embeddings AS
WITH topic_articles AS (
    SELECT 
        unnest(categories) as topic,
        embedding
    FROM news_articles_partitioned
    WHERE embedding IS NOT NULL
    AND published_at > CURRENT_DATE - INTERVAL '30 days'
)
SELECT 
    topic,
    COUNT(*) as article_count,
    AVG(embedding) as avg_embedding
FROM topic_articles
GROUP BY topic
HAVING COUNT(*) >= 5;

CREATE INDEX idx_topic_embeddings ON news_topic_embeddings USING ivfflat (avg_embedding vector_cosine_ops);

-- Step 8: Create function to get trending topics by embedding clusters
CREATE OR REPLACE FUNCTION get_trending_topic_clusters(
    hours_back INT DEFAULT 24,
    min_articles INT DEFAULT 3
)
RETURNS TABLE (
    cluster_topics TEXT[],
    article_count BIGINT,
    avg_sentiment FLOAT,
    trend_score FLOAT,
    sample_titles TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_articles AS (
        SELECT 
            article_id,
            title,
            categories,
            sentiment_score,
            embedding,
            EXTRACT(EPOCH FROM (NOW() - published_at))/3600 as hours_ago
        FROM news_articles_partitioned
        WHERE published_at > NOW() - INTERVAL '1 hour' * hours_back
        AND embedding IS NOT NULL
    ),
    article_pairs AS (
        SELECT 
            a1.article_id as id1,
            a2.article_id as id2,
            a1.embedding <=> a2.embedding as distance
        FROM recent_articles a1
        CROSS JOIN recent_articles a2
        WHERE a1.article_id < a2.article_id
        AND a1.embedding <=> a2.embedding < 0.3  -- Similar articles
    ),
    clusters AS (
        -- Simple connected components clustering
        SELECT DISTINCT
            LEAST(id1, id2) as cluster_root,
            id1 as article_id
        FROM article_pairs
        UNION
        SELECT DISTINCT
            LEAST(id1, id2) as cluster_root,
            id2 as article_id
        FROM article_pairs
    )
    SELECT 
        ARRAY_AGG(DISTINCT unnest(ra.categories)) as cluster_topics,
        COUNT(DISTINCT c.article_id) as article_count,
        AVG(ra.sentiment_score)::FLOAT as avg_sentiment,
        COUNT(DISTINCT c.article_id)::FLOAT / AVG(ra.hours_ago + 1) as trend_score,
        ARRAY_AGG(DISTINCT ra.title) FILTER (WHERE ra.title IS NOT NULL) as sample_titles
    FROM clusters c
    JOIN recent_articles ra ON c.article_id = ra.article_id
    GROUP BY c.cluster_root
    HAVING COUNT(DISTINCT c.article_id) >= min_articles
    ORDER BY trend_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Add trigger to mark when embeddings need update
ALTER TABLE news_articles_partitioned 
ADD COLUMN IF NOT EXISTS embedding_needed BOOLEAN DEFAULT TRUE;

CREATE OR REPLACE FUNCTION mark_embedding_needed()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.title != NEW.title OR OLD.content != NEW.content THEN
        NEW.embedding_needed := TRUE;
        NEW.embedding_updated_at := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_embedding_needed
    BEFORE UPDATE OF title, content
    ON news_articles_partitioned
    FOR EACH ROW
    EXECUTE FUNCTION mark_embedding_needed();