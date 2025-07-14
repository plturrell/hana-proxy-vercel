-- Create Schema and Prerequisites for Supabase Functions
-- Run this FIRST before running the function migration scripts

-- Create the app_data schema
CREATE SCHEMA IF NOT EXISTS app_data;

-- Grant permissions to Supabase roles
GRANT USAGE ON SCHEMA app_data TO anon, authenticated;
GRANT CREATE ON SCHEMA app_data TO postgres;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS plpgsql;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;

-- Create custom types if needed
DO $$ 
BEGIN
    -- Check if types don't exist before creating
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calculation_result') THEN
        CREATE TYPE app_data.calculation_result AS (
            value DOUBLE PRECISION,
            metadata JSONB
        );
    END IF;
END $$;

-- Create base tables for function results storage
CREATE TABLE IF NOT EXISTS app_data.calculation_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    function_name TEXT NOT NULL,
    input_params JSONB NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(function_name, input_params)
);

CREATE INDEX IF NOT EXISTS idx_calc_cache_function ON app_data.calculation_cache(function_name);
CREATE INDEX IF NOT EXISTS idx_calc_cache_expires ON app_data.calculation_cache(expires_at);

-- Function execution log
CREATE TABLE IF NOT EXISTS app_data.function_execution_log (
    id SERIAL PRIMARY KEY,
    function_name TEXT NOT NULL,
    execution_time_ms DOUBLE PRECISION,
    input_size INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    user_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exec_log_function ON app_data.function_execution_log(function_name);
CREATE INDEX IF NOT EXISTS idx_exec_log_created ON app_data.function_execution_log(created_at);

-- Grant permissions on tables
GRANT SELECT, INSERT ON app_data.calculation_cache TO anon, authenticated;
GRANT SELECT, INSERT ON app_data.function_execution_log TO anon, authenticated;
GRANT USAGE ON SEQUENCE app_data.function_execution_log_id_seq TO anon, authenticated;

-- Create a helper function to log executions
CREATE OR REPLACE FUNCTION app_data.log_function_execution(
    p_function_name TEXT,
    p_execution_time_ms DOUBLE PRECISION,
    p_input_size INTEGER DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO app_data.function_execution_log 
        (function_name, execution_time_ms, input_size, success, error_message, user_id)
    VALUES 
        (p_function_name, p_execution_time_ms, p_input_size, p_success, p_error_message, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the schema creation
DO $$
BEGIN
    RAISE NOTICE 'Schema app_data created successfully';
    RAISE NOTICE 'Tables created: calculation_cache, function_execution_log';
    RAISE NOTICE 'Ready to deploy functions!';
END $$;