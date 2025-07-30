-- Authentication System Database Tables
-- Run this in your Supabase SQL Editor to create required tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' NOT NULL,
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'user', 'readonly')),
    CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'locked', 'pending'))
);

-- User permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    
    -- Unique constraint to prevent duplicate permissions
    UNIQUE(user_id, permission)
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for cleanup
    INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)
);

-- Token blacklist table
CREATE TABLE IF NOT EXISTS token_blacklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('access', 'refresh')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason VARCHAR(100),
    
    -- Index for cleanup and lookup
    INDEX idx_token_blacklist_token ON token_blacklist(token),
    INDEX idx_token_blacklist_expires_at ON token_blacklist(expires_at)
);

-- Login attempts table (for security)
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT false,
    failure_reason VARCHAR(100),
    
    -- Index for lockout queries
    INDEX idx_login_attempts_email_time ON login_attempts(email, attempted_at),
    INDEX idx_login_attempts_ip_time ON login_attempts(ip_address, attempted_at)
);

-- Email verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Index for cleanup
    INDEX idx_email_verifications_expires_at ON email_verifications(expires_at)
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    
    -- Index for cleanup
    INDEX idx_password_reset_expires_at ON password_reset_tokens(expires_at)
);

-- Session tracking table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    
    -- Indexes
    INDEX idx_user_sessions_user_id ON user_sessions(user_id),
    INDEX idx_user_sessions_expires_at ON user_sessions(expires_at)
);

-- Create default admin user (password: AdminPassword123!)
-- You should change this immediately after setup
INSERT INTO users (email, password_hash, role, status, email_verified, first_name, last_name)
VALUES (
    'admin@finsight.ai',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGTrOvwWG', -- AdminPassword123!
    'admin',
    'active',
    true,
    'System',
    'Administrator'
) ON CONFLICT (email) DO NOTHING;

-- Grant all permissions to admin user
INSERT INTO user_permissions (user_id, permission)
SELECT 
    u.id,
    p.permission
FROM users u
CROSS JOIN (
    VALUES 
        ('agents.read'), ('agents.create'), ('agents.update'), ('agents.delete'), ('agents.suggest'),
        ('network.read'), ('network.manage'),
        ('contracts.read'), ('contracts.create'), ('contracts.deploy'), ('contracts.delete'),
        ('documents.read'), ('documents.create'), ('documents.update'), ('documents.delete'), ('documents.search'),
        ('processes.read'), ('processes.create'), ('processes.export'),
        ('ai.use'), ('ai.configure'),
        ('users.read'), ('users.create'), ('users.update'), ('users.delete'),
        ('system.admin'), ('system.monitor')
) p(permission)
WHERE u.email = 'admin@finsight.ai'
ON CONFLICT (user_id, permission) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only see their own data unless they're admin
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM user_permissions up 
        WHERE up.user_id = auth.uid() AND up.permission = 'users.read'
    ));

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM user_permissions up 
        WHERE up.user_id = auth.uid() AND up.permission = 'users.update'
    ));

-- Admins can manage user permissions
CREATE POLICY "Admins can manage permissions" ON user_permissions
    FOR ALL USING (EXISTS (
        SELECT 1 FROM user_permissions up 
        WHERE up.user_id = auth.uid() AND up.permission = 'system.admin'
    ));

-- Users can manage their own tokens and sessions
CREATE POLICY "Users manage own tokens" ON refresh_tokens
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users manage own sessions" ON user_sessions
    FOR ALL USING (user_id = auth.uid());

-- Create a function to clean up expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Clean up expired refresh tokens
    DELETE FROM refresh_tokens WHERE expires_at < NOW();
    
    -- Clean up expired blacklisted tokens
    DELETE FROM token_blacklist WHERE expires_at < NOW();
    
    -- Clean up expired email verifications
    DELETE FROM email_verifications WHERE expires_at < NOW();
    
    -- Clean up expired password reset tokens
    DELETE FROM password_reset_tokens WHERE expires_at < NOW();
    
    -- Clean up expired sessions
    DELETE FROM user_sessions WHERE expires_at < NOW();
    
    -- Clean up old login attempts (keep 30 days)
    DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup function (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-tokens', '0 2 * * *', 'SELECT cleanup_expired_tokens();');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant appropriate permissions to anon and authenticated roles
GRANT SELECT, INSERT ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON refresh_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON token_blacklist TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON login_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_verifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON password_reset_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON TABLE users IS 'Main users table with authentication information';
COMMENT ON TABLE user_permissions IS 'Granular permissions assigned to users';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for secure authentication';
COMMENT ON TABLE token_blacklist IS 'Revoked tokens that should not be accepted';
COMMENT ON TABLE login_attempts IS 'Track login attempts for security monitoring';
COMMENT ON TABLE email_verifications IS 'Email verification tokens';
COMMENT ON TABLE password_reset_tokens IS 'Password reset tokens';
COMMENT ON TABLE user_sessions IS 'Active user sessions tracking';