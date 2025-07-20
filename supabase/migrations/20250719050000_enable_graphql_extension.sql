-- Enable GraphQL Support via Comments
-- Migration: 20250719050000_enable_graphql_extension.sql

-- Note: Supabase automatically generates GraphQL schema from database tables
-- We use table and column comments to configure GraphQL behavior

-- 3. Enable GraphQL for specific tables
COMMENT ON TABLE public.users IS E'@graphql({"primary_key_columns": ["id"]})';
COMMENT ON TABLE public.market_data IS E'@graphql({"primary_key_columns": ["id"]})';
COMMENT ON TABLE public.news_articles IS E'@graphql({"primary_key_columns": ["id"]})';
COMMENT ON TABLE public.a2a_agents IS E'@graphql({"primary_key_columns": ["agent_id"]})';
COMMENT ON TABLE public.portfolio_holdings IS E'@graphql({"primary_key_columns": ["id"]})';
COMMENT ON TABLE public.currencies IS E'@graphql({"primary_key_columns": ["id"]})';
COMMENT ON TABLE public.exchanges IS E'@graphql({"primary_key_columns": ["id"]})';
COMMENT ON TABLE public.sectors IS E'@graphql({"primary_key_columns": ["id"]})';
COMMENT ON TABLE public.countries IS E'@graphql({"primary_key_columns": ["id"]})';

-- 4. Note: GraphQL relationships will be configured after foreign keys are created

-- 5. Note: GraphQL introspection is enabled by default in Supabase

-- 6. Create operation tracking type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operation_type') THEN
        CREATE TYPE operation_type AS ENUM ('query', 'mutation', 'subscription');
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'GraphQL configuration completed successfully';
END $$;