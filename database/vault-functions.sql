-- Supabase Vault Functions for Secure Configuration
-- This file creates the necessary functions for secure key storage

-- Create vault schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS vault;

-- Create secrets table in vault schema
CREATE TABLE IF NOT EXISTS vault.secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT current_user,
    is_active BOOLEAN DEFAULT true
);

-- Create audit log for secret access
CREATE TABLE IF NOT EXISTS vault.secret_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_name TEXT NOT NULL,
    accessed_by TEXT DEFAULT current_user,
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    access_type TEXT CHECK (access_type IN ('read', 'write', 'delete')),
    ip_address INET DEFAULT inet_client_addr(),
    user_agent TEXT DEFAULT current_setting('request.headers', true)::json->>'user-agent'
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_secrets_name ON vault.secrets(name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_access_log_secret ON vault.secret_access_log(secret_name);
CREATE INDEX IF NOT EXISTS idx_access_log_time ON vault.secret_access_log(accessed_at DESC);

-- Function to get secret value
CREATE OR REPLACE FUNCTION public.get_secret(p_name TEXT)
RETURNS TEXT AS $$
DECLARE
    v_value TEXT;
BEGIN
    -- Check if user has permission (service role only)
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Insufficient permissions to access secrets';
    END IF;
    
    -- Get the secret value
    SELECT value INTO v_value
    FROM vault.secrets
    WHERE name = p_name
    AND is_active = true;
    
    IF v_value IS NULL THEN
        RETURN NULL; -- Return null instead of error for missing secrets
    END IF;
    
    -- Log the access
    INSERT INTO vault.secret_access_log (secret_name, access_type)
    VALUES (p_name, 'read');
    
    RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set secret value
CREATE OR REPLACE FUNCTION public.set_secret(p_name TEXT, p_value TEXT, p_description TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has permission (service role only)
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Insufficient permissions to modify secrets';
    END IF;
    
    -- Upsert the secret
    INSERT INTO vault.secrets (name, value, description)
    VALUES (p_name, p_value, p_description)
    ON CONFLICT (name) 
    DO UPDATE SET 
        value = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, vault.secrets.description),
        updated_at = NOW();
    
    -- Log the access
    INSERT INTO vault.secret_access_log (secret_name, access_type)
    VALUES (p_name, 'write');
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete secret
CREATE OR REPLACE FUNCTION public.delete_secret(p_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has permission (service role only)
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Insufficient permissions to delete secrets';
    END IF;
    
    -- Soft delete the secret
    UPDATE vault.secrets
    SET is_active = false,
        updated_at = NOW()
    WHERE name = p_name
    AND is_active = true;
    
    -- Log the access
    INSERT INTO vault.secret_access_log (secret_name, access_type)
    VALUES (p_name, 'delete');
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list all secret names (not values)
CREATE OR REPLACE FUNCTION public.list_secrets()
RETURNS TABLE (
    name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Check if user has permission (service role only)
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Insufficient permissions to list secrets';
    END IF;
    
    RETURN QUERY
    SELECT s.name, s.description, s.created_at, s.updated_at
    FROM vault.secrets s
    WHERE s.is_active = true
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get secret access logs
CREATE OR REPLACE FUNCTION public.get_secret_access_log(p_secret_name TEXT DEFAULT NULL, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
    secret_name TEXT,
    accessed_by TEXT,
    accessed_at TIMESTAMPTZ,
    access_type TEXT,
    ip_address INET
) AS $$
BEGIN
    -- Check if user has permission (service role only)
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Insufficient permissions to view access logs';
    END IF;
    
    RETURN QUERY
    SELECT l.secret_name, l.accessed_by, l.accessed_at, l.access_type, l.ip_address
    FROM vault.secret_access_log l
    WHERE (p_secret_name IS NULL OR l.secret_name = p_secret_name)
    AND l.accessed_at > NOW() - (p_days || ' days')::INTERVAL
    ORDER BY l.accessed_at DESC
    LIMIT 1000;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security for vault schema
ALTER TABLE vault.secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault.secret_access_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access vault tables directly
CREATE POLICY vault_secrets_service_role ON vault.secrets
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY vault_access_log_service_role ON vault.secret_access_log
    FOR ALL
    TO service_role
    USING (true);

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_secret(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_secret(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_secret(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_secrets() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_secret_access_log(TEXT, INTEGER) TO service_role;

-- Initial secrets for A2A blockchain system
-- NOTE: Replace these with your actual values before running in production
DO $$
BEGIN
    -- Only insert if running as service role
    IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
        PERFORM set_secret('GROK_API_KEY', 'your-grok-api-key-here', 'Grok AI API key for A2A autonomy');
        PERFORM set_secret('XAI_API_KEY', 'your-xai-api-key-here', 'X.AI API key for agent intelligence');
        PERFORM set_secret('BLOCKCHAIN_PRIVATE_KEY', 'your-blockchain-private-key', 'Private key for blockchain operations');
        PERFORM set_secret('ENCRYPTION_KEY', encode(gen_random_bytes(32), 'hex'), 'Encryption key for sensitive data');
    END IF;
END $$;

-- Cleanup function to remove old access logs
CREATE OR REPLACE FUNCTION public.cleanup_secret_access_logs(p_days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    -- Check if user has permission (service role only)
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
        RAISE EXCEPTION 'Insufficient permissions to cleanup logs';
    END IF;
    
    DELETE FROM vault.secret_access_log
    WHERE accessed_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to cleanup old logs (optional - requires pg_cron extension)
-- SELECT cron.schedule('cleanup-secret-logs', '0 2 * * 0', 'SELECT cleanup_secret_access_logs(90);');

-- Verification query
SELECT 'Vault functions created successfully!' AS status;

-- Example usage:
-- SELECT get_secret('GROK_API_KEY');
-- SELECT set_secret('NEW_API_KEY', 'secret-value', 'Description of the key');
-- SELECT * FROM list_secrets();
-- SELECT * FROM get_secret_access_log(NULL, 7);