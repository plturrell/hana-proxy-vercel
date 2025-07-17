-- Supabase Vault Setup for A2A Blockchain Secrets
-- This replaces exposed environment variables with secure Supabase Vault storage

-- Enable the vault extension
CREATE EXTENSION IF NOT EXISTS vault;

-- Create a secure secrets table using Supabase Vault
CREATE TABLE IF NOT EXISTS vault.a2a_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    secret TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an audit log for secret access
CREATE TABLE IF NOT EXISTS public.secret_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_name TEXT NOT NULL,
    accessed_by TEXT NOT NULL,
    access_type TEXT NOT NULL CHECK (access_type IN ('read', 'write', 'delete')),
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to safely insert secrets
CREATE OR REPLACE FUNCTION vault.insert_secret(
    p_name TEXT,
    p_secret TEXT,
    p_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_secret_id UUID;
BEGIN
    INSERT INTO vault.a2a_secrets (name, secret, description)
    VALUES (p_name, p_secret, p_description)
    ON CONFLICT (name) DO UPDATE SET
        secret = EXCLUDED.secret,
        description = EXCLUDED.description,
        updated_at = NOW()
    RETURNING id INTO v_secret_id;
    
    -- Log the access
    INSERT INTO public.secret_access_log (secret_name, accessed_by, access_type)
    VALUES (p_name, current_user, 'write');
    
    RETURN v_secret_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retrieve secrets securely
CREATE OR REPLACE FUNCTION vault.get_secret(p_name TEXT)
RETURNS TEXT AS $$
DECLARE
    v_secret TEXT;
BEGIN
    SELECT secret INTO v_secret
    FROM vault.a2a_secrets
    WHERE name = p_name;
    
    IF v_secret IS NOT NULL THEN
        -- Log the access
        INSERT INTO public.secret_access_log (secret_name, accessed_by, access_type)
        VALUES (p_name, current_user, 'read');
    END IF;
    
    RETURN v_secret;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rotate a secret
CREATE OR REPLACE FUNCTION vault.rotate_secret(
    p_name TEXT,
    p_new_secret TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE vault.a2a_secrets
    SET secret = p_new_secret,
        updated_at = NOW()
    WHERE name = p_name;
    
    IF FOUND THEN
        INSERT INTO public.secret_access_log (secret_name, accessed_by, access_type)
        VALUES (p_name, current_user, 'write');
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migrate existing secrets (run this manually after confirming values)
-- DO $$
-- BEGIN
--     PERFORM vault.insert_secret('grok_api_key', 'your-grok-api-key', 'Grok AI API Key');
--     PERFORM vault.insert_secret('exasol_password', 'your-exasol-password', 'Exasol Database Password');
--     PERFORM vault.insert_secret('blockchain_deployer_key', 'generated-key', 'Simulated blockchain deployer key');
-- END $$;

-- Row Level Security for audit log
ALTER TABLE public.secret_access_log ENABLE ROW LEVEL SECURITY;

-- Only service role can view audit logs
CREATE POLICY "Service role can view all audit logs" ON public.secret_access_log
    FOR SELECT USING (auth.jwt()->>'role' = 'service_role');

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION vault.get_secret TO service_role;
GRANT EXECUTE ON FUNCTION vault.insert_secret TO service_role;
GRANT EXECUTE ON FUNCTION vault.rotate_secret TO service_role;

-- Create index for performance
CREATE INDEX idx_secret_access_log_created ON public.secret_access_log(accessed_at DESC);
CREATE INDEX idx_secret_access_log_secret ON public.secret_access_log(secret_name);

-- Automatic secret expiration tracking
ALTER TABLE vault.a2a_secrets ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Function to check for expiring secrets
CREATE OR REPLACE FUNCTION vault.get_expiring_secrets(p_days INTEGER DEFAULT 7)
RETURNS TABLE(name TEXT, expires_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT s.name, s.expires_at
    FROM vault.a2a_secrets s
    WHERE s.expires_at IS NOT NULL
    AND s.expires_at <= NOW() + (p_days || ' days')::INTERVAL
    ORDER BY s.expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;