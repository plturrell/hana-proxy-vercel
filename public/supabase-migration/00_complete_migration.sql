-- Complete Supabase Migration Script
-- Total: 32 Functions (23 new + 9 original)
-- Converted from Exasol Lua UDFs to PostgreSQL

-- This script includes all functions from:
-- 1. Core Analytics Functions (1-9)
-- 2. ML & Reinforcement Learning Functions (10-18)
-- 3. Advanced Analytics Functions (19-32)

-- To deploy to Supabase:
-- 1. Run this script in Supabase SQL Editor
-- 2. Or use: psql -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres -f 00_complete_migration.sql

\echo 'Starting complete migration of 32 functions...'

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS app_data;

-- Grant permissions
GRANT USAGE ON SCHEMA app_data TO anon, authenticated;

-- Include all function files
\i 01_core_analytics_functions.sql
\i 02_ml_rl_functions.sql
\i 03_advanced_analytics_functions.sql

-- Create summary view of all functions
CREATE OR REPLACE VIEW app_data.function_catalog AS
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    pg_get_function_result(p.oid) AS return_type,
    obj_description(p.oid, 'pg_proc') AS description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'app_data'
ORDER BY p.proname;

-- Create function usage tracking
CREATE TABLE IF NOT EXISTS app_data.function_usage_stats (
    id SERIAL PRIMARY KEY,
    function_name TEXT NOT NULL,
    execution_time_ms DOUBLE PRECISION,
    input_size INTEGER,
    output_size INTEGER,
    success BOOLEAN,
    error_message TEXT,
    called_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_function_usage_name_time ON app_data.function_usage_stats(function_name, called_at);

-- Grant permissions for app usage
GRANT USAGE ON SCHEMA app_data TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app_data TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA app_data TO anon, authenticated;
GRANT INSERT, UPDATE ON app_data.function_usage_stats TO anon, authenticated;

\echo 'Migration complete! 32 functions successfully created.'
\echo 'Run SELECT * FROM app_data.function_catalog; to see all available functions.'