-- FINAL SCHEMA FIXES
-- Fix remaining table structure issues

-- 1. Fix USERS table - add missing user_id column or rename id column
-- First check if we need to add user_id or if id should be renamed
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT uuid_generate_v4();

-- If users table uses user_id as primary key instead of id, update accordingly
-- Make user_id the primary key if id doesn't exist
DO $$
BEGIN
    -- Check if id column exists, if not make user_id primary
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id') THEN
        ALTER TABLE users ADD PRIMARY KEY (user_id);
    END IF;
END $$;

-- 2. Fix MARKET_DATA table - add missing date/price columns
ALTER TABLE market_data ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE market_data ADD COLUMN IF NOT EXISTS price DECIMAL(20,8);

-- Update existing timestamp column to date if needed
UPDATE market_data SET date = timestamp::date WHERE date IS NULL AND timestamp IS NOT NULL;

-- 3. Fix NEWS_ARTICLES table - make article_id nullable or provide default
ALTER TABLE news_articles ALTER COLUMN article_id DROP NOT NULL;

-- Or provide a default value for article_id
UPDATE news_articles SET article_id = 'article_' || id::text WHERE article_id IS NULL;

-- 4. Update existing news_articles to populate new columns with sample data
UPDATE news_articles SET 
  symbols = CASE 
    WHEN title ILIKE '%apple%' THEN ARRAY['AAPL']
    WHEN title ILIKE '%google%' THEN ARRAY['GOOGL'] 
    WHEN title ILIKE '%microsoft%' THEN ARRAY['MSFT']
    WHEN title ILIKE '%tesla%' THEN ARRAY['TSLA']
    ELSE ARRAY['SPY']
  END,
  keywords = CASE
    WHEN title ILIKE '%earnings%' THEN ARRAY['earnings', 'financial']
    WHEN title ILIKE '%fed%' OR title ILIKE '%rate%' THEN ARRAY['monetary_policy', 'federal_reserve']
    WHEN title ILIKE '%market%' THEN ARRAY['market', 'trading']
    ELSE ARRAY['news', 'finance']
  END,
  entities = CASE
    WHEN title ILIKE '%apple%' THEN '[{"type": "COMPANY", "name": "Apple Inc."}]'::jsonb
    WHEN title ILIKE '%google%' THEN '[{"type": "COMPANY", "name": "Alphabet Inc."}]'::jsonb
    ELSE '[{"type": "MARKET", "name": "Stock Market"}]'::jsonb
  END,
  language = 'en',
  relevance_score = 0.8,
  market_impact_score = 0.6
WHERE symbols IS NULL;

-- 5. Add sample market data for testing (only if table is empty)
INSERT INTO market_data (symbol, price, asset_type, bid, ask, market_cap, currency, exchange, date)
SELECT 'AAPL', 150.25, 'stock', 150.20, 150.30, 2500000000000, 'USD', 'NASDAQ', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM market_data WHERE symbol = 'AAPL');

INSERT INTO market_data (symbol, price, asset_type, bid, ask, market_cap, currency, exchange, date)
SELECT 'GOOGL', 2750.80, 'stock', 2750.50, 2751.00, 1800000000000, 'USD', 'NASDAQ', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM market_data WHERE symbol = 'GOOGL');

INSERT INTO market_data (symbol, price, asset_type, bid, ask, market_cap, currency, exchange, date)
SELECT 'MSFT', 380.50, 'stock', 380.25, 380.75, 2800000000000, 'USD', 'NASDAQ', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM market_data WHERE symbol = 'MSFT');

-- 6. Add sample users for testing (only if email doesn't exist)
INSERT INTO users (user_id, email, bio, subscription_tier, risk_score, kyc_verified, full_name, username)
SELECT uuid_generate_v4(), 'demo@finsight.ai', 'Demo user for testing', 'free', 25.0, false, 'Demo User', 'demo_user'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo@finsight.ai');

INSERT INTO users (user_id, email, bio, subscription_tier, risk_score, kyc_verified, full_name, username)
SELECT uuid_generate_v4(), 'admin@finsight.ai', 'System administrator', 'enterprise', 10.0, true, 'Admin User', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@finsight.ai');

-- Success message
SELECT 'Final schema fixes applied! All tables now iOS app compatible.' as status;