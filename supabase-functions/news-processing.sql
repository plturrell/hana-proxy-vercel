-- Create tables for news processing and RDF storage
CREATE TABLE IF NOT EXISTS news_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    source TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    sentiment TEXT CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
    market_impact TEXT CHECK (market_impact IN ('high', 'medium', 'low')),
    perplexity_query_id TEXT,
    entities JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query_text TEXT NOT NULL,
    categories TEXT[],
    query_depth TEXT,
    articles_found INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rdf_triples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES news_articles(id),
    subject TEXT NOT NULL,
    predicate TEXT NOT NULL,
    object TEXT NOT NULL,
    turtle_format TEXT,
    entity_type TEXT,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_graph_entities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_name TEXT UNIQUE NOT NULL,
    entity_type TEXT,
    financial_significance TEXT,
    related_symbols TEXT[],
    market_sector TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to query Perplexity API and process news
CREATE OR REPLACE FUNCTION query_perplexity_news(
    query TEXT,
    categories TEXT[] DEFAULT ARRAY['Financial Markets'],
    depth TEXT DEFAULT 'detailed',
    include_sources BOOLEAN DEFAULT true,
    return_citations BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    perplexity_response JSON;
    query_id UUID;
    article_record RECORD;
    processed_articles JSON[] := '{}';
BEGIN
    -- Insert query record
    INSERT INTO news_queries (query_text, categories, query_depth)
    VALUES (query, categories, depth)
    RETURNING id INTO query_id;
    
    -- In a real implementation, this would call the Perplexity API
    -- For now, we'll simulate the response structure
    perplexity_response := json_build_object(
        'success', true,
        'query_id', query_id,
        'articles', json_build_array(
            json_build_object(
                'id', gen_random_uuid(),
                'title', 'Federal Reserve Signals Potential Rate Cut Amid Economic Uncertainty',
                'content', 'Federal Reserve officials indicated in recent statements that they are considering monetary policy adjustments to address ongoing economic challenges...',
                'source', 'Perplexity Analysis from Reuters, Bloomberg, WSJ',
                'published_at', CURRENT_TIMESTAMP,
                'sentiment', 'bearish',
                'market_impact', 'high',
                'entities', json_build_array('Federal Reserve', 'Interest Rates', 'Monetary Policy'),
                'citations', json_build_array(
                    'https://reuters.com/fed-signals-rate-cut',
                    'https://bloomberg.com/fed-policy-update',
                    'https://wsj.com/federal-reserve-meeting'
                )
            ),
            json_build_object(
                'id', gen_random_uuid(),
                'title', 'Technology Stocks Rally on AI Infrastructure Investment News',
                'content', 'Major technology companies announced significant investments in AI infrastructure, driving sector-wide gains...',
                'source', 'Perplexity Analysis from CNBC, TechCrunch, Financial Times',
                'published_at', CURRENT_TIMESTAMP,
                'sentiment', 'bullish',
                'market_impact', 'medium',
                'entities', json_build_array('Technology Stocks', 'AI Infrastructure', 'Investment'),
                'citations', json_build_array(
                    'https://cnbc.com/tech-ai-investment',
                    'https://techcrunch.com/ai-infrastructure-boom'
                )
            )
        )
    );
    
    -- Process and store articles
    FOR article_record IN 
        SELECT * FROM json_array_elements(perplexity_response->'articles')
    LOOP
        INSERT INTO news_articles (
            title, content, source, published_at, sentiment, 
            market_impact, perplexity_query_id, entities
        ) VALUES (
            article_record.value->>'title',
            article_record.value->>'content',
            article_record.value->>'source',
            (article_record.value->>'published_at')::TIMESTAMP WITH TIME ZONE,
            article_record.value->>'sentiment',
            article_record.value->>'market_impact',
            query_id::TEXT,
            article_record.value->'entities'
        );
        
        processed_articles := processed_articles || article_record.value;
    END LOOP;
    
    -- Update query with articles count
    UPDATE news_queries 
    SET articles_found = json_array_length(perplexity_response->'articles')
    WHERE id = query_id;
    
    RETURN json_build_object(
        'success', true,
        'query_id', query_id,
        'articles', processed_articles
    );
END;
$$;

-- Function to extract entities and create RDF triples
CREATE OR REPLACE FUNCTION extract_entities_to_rdf(
    article_id UUID,
    title TEXT,
    content TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    source TEXT,
    sentiment TEXT,
    market_impact TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    entity_name TEXT;
    turtle_output TEXT;
    namespace_prefix TEXT := 'http://example.org/finance#';
    article_uri TEXT;
    triples_created INTEGER := 0;
BEGIN
    article_uri := namespace_prefix || 'article_' || replace(article_id::TEXT, '-', '_');
    
    -- Create base article triple
    turtle_output := format(
        '@prefix fin: <%s> .
@prefix news: <http://example.org/news#> .
@prefix time: <http://www.w3.org/2006/time#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

%s a news:Article ;
    news:title "%s" ;
    news:publishedAt "%s"^^xsd:dateTime ;
    news:sentiment "%s" ;
    news:marketImpact "%s" ;
    news:source "%s" .',
        namespace_prefix,
        article_uri,
        replace(title, '"', '\"'),
        published_at::TEXT,
        sentiment,
        market_impact,
        source
    );
    
    -- Extract entities from title and content using simple keyword matching
    -- In production, this would use NLP libraries or AI services
    DECLARE
        financial_entities TEXT[] := ARRAY[
            'Federal Reserve', 'Fed', 'Interest Rates', 'Inflation', 'GDP',
            'Stock Market', 'S&P 500', 'Nasdaq', 'Dow Jones', 'Bitcoin',
            'Dollar', 'Treasury', 'Bond Yields', 'Employment', 'CPI'
        ];
        entity TEXT;
        entity_uri TEXT;
    BEGIN
        FOREACH entity IN ARRAY financial_entities
        LOOP
            IF position(entity IN title) > 0 OR position(entity IN content) > 0 THEN
                entity_uri := namespace_prefix || replace(lower(entity), ' ', '_');
                
                -- Create entity triples
                turtle_output := turtle_output || format('

%s a fin:FinancialEntity ;
    fin:name "%s" ;
    fin:mentionedIn %s .',
                    entity_uri,
                    entity,
                    article_uri
                );
                
                -- Store in RDF triples table
                INSERT INTO rdf_triples (
                    article_id, subject, predicate, object, turtle_format, entity_type, confidence_score
                ) VALUES (
                    article_id,
                    article_uri,
                    'news:mentions',
                    entity_uri,
                    turtle_output,
                    'financial_entity',
                    0.8
                );
                
                triples_created := triples_created + 1;
                
                -- Store or update entity in knowledge graph
                INSERT INTO knowledge_graph_entities (entity_name, entity_type, financial_significance)
                VALUES (entity, 'financial_concept', market_impact)
                ON CONFLICT (entity_name) DO UPDATE SET
                    financial_significance = EXCLUDED.financial_significance;
            END IF;
        END LOOP;
    END;
    
    RETURN json_build_object(
        'success', true,
        'triples', json_build_object(
            'subject', article_uri,
            'predicate', 'news:mentions',
            'object', 'multiple_entities',
            'turtle', turtle_output
        ),
        'triples_created', triples_created
    );
END;
$$;

-- Function to get knowledge graph statistics
CREATE OR REPLACE FUNCTION get_knowledge_graph_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    entity_count INTEGER;
    relation_count INTEGER;
    triple_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO entity_count FROM knowledge_graph_entities;
    SELECT COUNT(DISTINCT predicate) INTO relation_count FROM rdf_triples;
    SELECT COUNT(*) INTO triple_count FROM rdf_triples;
    
    RETURN json_build_object(
        'entities', entity_count,
        'relations', relation_count,
        'triples', triple_count,
        'last_updated', CURRENT_TIMESTAMP
    );
END;
$$;

-- Function to build knowledge graph from news
CREATE OR REPLACE FUNCTION build_knowledge_graph_from_news(
    rebuild BOOLEAN DEFAULT false,
    include_temporal BOOLEAN DEFAULT true,
    infer_relationships BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    articles_processed INTEGER;
    triples_created INTEGER;
    entities_extracted INTEGER;
    article_record RECORD;
BEGIN
    IF rebuild THEN
        DELETE FROM rdf_triples;
        DELETE FROM knowledge_graph_entities;
    END IF;
    
    articles_processed := 0;
    triples_created := 0;
    
    -- Process all articles to build the knowledge graph
    FOR article_record IN 
        SELECT * FROM news_articles ORDER BY created_at DESC LIMIT 100
    LOOP
        PERFORM extract_entities_to_rdf(
            article_record.id,
            article_record.title,
            article_record.content,
            article_record.published_at,
            article_record.source,
            article_record.sentiment,
            article_record.market_impact
        );
        
        articles_processed := articles_processed + 1;
    END LOOP;
    
    SELECT COUNT(*) INTO triples_created FROM rdf_triples;
    SELECT COUNT(*) INTO entities_extracted FROM knowledge_graph_entities;
    
    RETURN json_build_object(
        'success', true,
        'articles_processed', articles_processed,
        'triples_created', triples_created,
        'entities_extracted', entities_extracted,
        'build_timestamp', CURRENT_TIMESTAMP
    );
END;
$$;

-- Function to query knowledge graph
CREATE OR REPLACE FUNCTION query_knowledge_graph(
    query TEXT,
    format TEXT DEFAULT 'json'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_data JSON;
BEGIN
    -- Simple query parsing and execution
    -- In production, this would be a full SPARQL engine
    
    IF query ILIKE '%sentiment = "bullish"%' THEN
        SELECT json_agg(
            json_build_object(
                'entity', entity_name,
                'type', entity_type,
                'significance', financial_significance
            )
        ) INTO result_data
        FROM knowledge_graph_entities ke
        WHERE EXISTS (
            SELECT 1 FROM news_articles na 
            WHERE na.entities ? ke.entity_name 
            AND na.sentiment = 'bullish'
        );
    ELSE
        SELECT json_agg(
            json_build_object(
                'subject', subject,
                'predicate', predicate,
                'object', object
            )
        ) INTO result_data
        FROM rdf_triples
        LIMIT 50;
    END IF;
    
    RETURN COALESCE(result_data, '[]'::json);
END;
$$;

-- Function to export RDF turtle
CREATE OR REPLACE FUNCTION export_rdf_turtle(
    include_metadata BOOLEAN DEFAULT true,
    compress BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    turtle_content TEXT;
    triple_record RECORD;
BEGIN
    turtle_content := '@prefix fin: <http://example.org/finance#> .
@prefix news: <http://example.org/news#> .
@prefix time: <http://www.w3.org/2006/time#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# Knowledge Graph exported from Financial News Analysis
# Generated: ' || CURRENT_TIMESTAMP || '

';
    
    FOR triple_record IN 
        SELECT DISTINCT turtle_format FROM rdf_triples 
        WHERE turtle_format IS NOT NULL 
        ORDER BY created_at DESC
        LIMIT 100
    LOOP
        turtle_content := turtle_content || triple_record.turtle_format || E'\n\n';
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'turtle', turtle_content,
        'export_timestamp', CURRENT_TIMESTAMP,
        'triple_count', (SELECT COUNT(*) FROM rdf_triples)
    );
END;
$$;

-- Function to test Perplexity connection
CREATE OR REPLACE FUNCTION test_perplexity_connection()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- In production, this would test the actual API connection
    RETURN json_build_object(
        'connected', true,
        'api_status', 'operational',
        'test_timestamp', CURRENT_TIMESTAMP
    );
END;
$$;

-- Function to check Perplexity connection status
CREATE OR REPLACE FUNCTION check_perplexity_connection()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if we have recent successful queries
    IF EXISTS (
        SELECT 1 FROM news_queries 
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
    ) THEN
        RETURN json_build_object('connected', true);
    ELSE
        RETURN json_build_object('connected', false);
    END IF;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION query_perplexity_news TO anon, authenticated;
GRANT EXECUTE ON FUNCTION extract_entities_to_rdf TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_knowledge_graph_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION build_knowledge_graph_from_news TO anon, authenticated;
GRANT EXECUTE ON FUNCTION query_knowledge_graph TO anon, authenticated;
GRANT EXECUTE ON FUNCTION export_rdf_turtle TO anon, authenticated;
GRANT EXECUTE ON FUNCTION test_perplexity_connection TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_perplexity_connection TO anon, authenticated;

GRANT ALL ON news_articles TO anon, authenticated;
GRANT ALL ON news_queries TO anon, authenticated;
GRANT ALL ON rdf_triples TO anon, authenticated;
GRANT ALL ON knowledge_graph_entities TO anon, authenticated;