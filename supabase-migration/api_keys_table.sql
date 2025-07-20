-- API Keys Management Table
-- Stores rotating API keys for various providers

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL, -- 'fmp', 'finhub', 'polygon', etc.
    api_key TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'invalid'
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    UNIQUE(provider, api_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_provider_status ON api_keys(provider, status);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_api_keys_updated_at_trigger ON api_keys;
CREATE TRIGGER update_api_keys_updated_at_trigger
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_api_keys_updated_at();

-- Insert initial FMP key
INSERT INTO api_keys (provider, api_key, status, expires_at, metadata)
VALUES (
    'fmp', 
    'DKVIEgAABvrrglog978ZuBzlmBT5VGuc', 
    'active',
    CURRENT_DATE + INTERVAL '1 day',
    '{"source": "manual", "note": "Initial FMP key"}'::jsonb
) ON CONFLICT (provider, api_key) DO NOTHING;

-- Function to get current active key for a provider
CREATE OR REPLACE FUNCTION get_active_api_key(provider_name TEXT)
RETURNS TEXT AS $$
DECLARE
    current_key TEXT;
BEGIN
    SELECT api_key INTO current_key
    FROM api_keys
    WHERE provider = provider_name
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN current_key;
END;
$$ LANGUAGE plpgsql;

-- Function to expire old keys and set new one
CREATE OR REPLACE FUNCTION rotate_api_key(
    provider_name TEXT,
    new_key TEXT,
    expiry_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Mark old keys as expired
    UPDATE api_keys
    SET status = 'expired', updated_at = NOW()
    WHERE provider = provider_name AND status = 'active';
    
    -- Insert new key
    INSERT INTO api_keys (provider, api_key, status, expires_at, metadata)
    VALUES (
        provider_name,
        new_key,
        'active',
        COALESCE(expiry_date, CURRENT_DATE + INTERVAL '1 day'),
        '{"source": "auto_rotation"}'::jsonb
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create a view for key status monitoring
CREATE OR REPLACE VIEW api_key_status AS
SELECT 
    provider,
    api_key,
    status,
    expires_at,
    created_at,
    CASE 
        WHEN expires_at IS NULL THEN 'No expiry'
        WHEN expires_at <= NOW() THEN 'Expired'
        WHEN expires_at <= NOW() + INTERVAL '2 hours' THEN 'Expiring soon'
        ELSE 'Valid'
    END AS expiry_status,
    metadata
FROM api_keys
WHERE status = 'active'
ORDER BY provider, created_at DESC;