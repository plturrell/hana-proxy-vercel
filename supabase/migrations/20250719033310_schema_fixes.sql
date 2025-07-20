-- FIX SCHEMA ISSUES
-- Adding missing columns to existing tables

-- 1. FIX USERS TABLE - Add missing columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS risk_score DECIMAL(5,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS api_key_hash TEXT,
ADD COLUMN IF NOT EXISTS rate_limit_tier INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS storage_quota_mb INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}';

-- Add constraints to users table (PostgreSQL doesn't support IF NOT EXISTS for constraints)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_email') THEN
        ALTER TABLE users ADD CONSTRAINT valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_risk_score') THEN
        ALTER TABLE users ADD CONSTRAINT valid_risk_score CHECK (risk_score >= 0 AND risk_score <= 100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_rate_limit') THEN
        ALTER TABLE users ADD CONSTRAINT valid_rate_limit CHECK (rate_limit_tier > 0);
    END IF;
END $$;

-- 2. FIX MARKET_DATA TABLE - Add missing columns
ALTER TABLE market_data 
ADD COLUMN IF NOT EXISTS asset_type TEXT DEFAULT 'stock',
ADD COLUMN IF NOT EXISTS bid DECIMAL(20,8),
ADD COLUMN IF NOT EXISTS ask DECIMAL(20,8),
ADD COLUMN IF NOT EXISTS market_cap DECIMAL(20,2),
ADD COLUMN IF NOT EXISTS change_percentage_24h DECIMAL(8,4),
ADD COLUMN IF NOT EXISTS high_24h DECIMAL(20,8),
ADD COLUMN IF NOT EXISTS low_24h DECIMAL(20,8),
ADD COLUMN IF NOT EXISTS open_24h DECIMAL(20,8),
ADD COLUMN IF NOT EXISTS vwap DECIMAL(20,8),
ADD COLUMN IF NOT EXISTS exchange TEXT,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS volume_24h DECIMAL(20,2),
ADD COLUMN IF NOT EXISTS price_change DECIMAL(20,8),
ADD COLUMN IF NOT EXISTS percentage_change DECIMAL(8,4);

-- 3. FIX NEWS_ARTICLES TABLE - Add missing columns
ALTER TABLE news_articles 
ADD COLUMN IF NOT EXISTS symbols TEXT[],
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS entities JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS relevance_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS market_impact_score DECIMAL(3,2);

-- Add constraints to news_articles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_sentiment') THEN
        ALTER TABLE news_articles ADD CONSTRAINT valid_sentiment CHECK (sentiment_score IS NULL OR (sentiment_score >= -1.0 AND sentiment_score <= 1.0));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_relevance') THEN
        ALTER TABLE news_articles ADD CONSTRAINT valid_relevance CHECK (relevance_score IS NULL OR (relevance_score >= 0.0 AND relevance_score <= 1.0));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_impact') THEN
        ALTER TABLE news_articles ADD CONSTRAINT valid_impact CHECK (market_impact_score IS NULL OR (market_impact_score >= 0.0 AND market_impact_score <= 1.0));
    END IF;
END $$;

-- 4. FIX A2A_AGENTS TABLE - Add missing columns (keeping existing ones)
ALTER TABLE a2a_agents 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS voting_power INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS blockchain_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS base_agent_id UUID,
ADD COLUMN IF NOT EXISTS success_rate_percent DECIMAL(5,2) DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS total_requests_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_tasks JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS voting_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS personality TEXT DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS performance_score DECIMAL(5,2) DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS autonomy_enabled BOOLEAN DEFAULT true;

-- Copy data from existing columns to new standard columns
UPDATE a2a_agents SET 
  name = agent_name,
  type = agent_type,
  success_rate_percent = success_rate,
  total_requests_count = total_requests
WHERE name IS NULL;

-- Add constraints to a2a_agents
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_success_rate_percent') THEN
        ALTER TABLE a2a_agents ADD CONSTRAINT valid_success_rate_percent CHECK (success_rate_percent >= 0.0 AND success_rate_percent <= 100.0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_voting_power') THEN
        ALTER TABLE a2a_agents ADD CONSTRAINT valid_voting_power CHECK (voting_power >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_performance_score') THEN
        ALTER TABLE a2a_agents ADD CONSTRAINT valid_performance_score CHECK (performance_score >= 0.0 AND performance_score <= 100.0);
    END IF;
END $$;

-- 5. ADD INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON market_data(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_market_data_asset_type ON market_data(asset_type);
CREATE INDEX IF NOT EXISTS idx_news_articles_symbols ON news_articles USING GIN(symbols);
CREATE INDEX IF NOT EXISTS idx_news_articles_keywords ON news_articles USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_news_articles_language ON news_articles(language);
CREATE INDEX IF NOT EXISTS idx_a2a_agents_type ON a2a_agents(type);
CREATE INDEX IF NOT EXISTS idx_a2a_agents_status ON a2a_agents(status);

-- 6. UPDATE ROW LEVEL SECURITY POLICIES
-- Fix news_articles RLS to allow service role access
DROP POLICY IF EXISTS "Enable read access for all users" ON news_articles;
CREATE POLICY "Enable read access for authenticated users" ON news_articles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role" ON news_articles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for service role" ON news_articles
    FOR UPDATE USING (true);

-- Enable RLS on other tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_agents ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Market data readable by all" ON market_data
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage market data" ON market_data
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "A2A agents readable by all" ON a2a_agents
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage a2a agents" ON a2a_agents
    FOR ALL USING (auth.role() = 'service_role');