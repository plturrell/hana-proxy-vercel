-- Fix RLS policies for iOS app compatibility

-- 1. Fix MARKET_DATA RLS policies
DROP POLICY IF EXISTS "Market data readable by all" ON market_data;
DROP POLICY IF EXISTS "Service role can manage market data" ON market_data;

-- Create permissive policies for market_data
CREATE POLICY "Allow all market data operations" ON market_data
    FOR ALL USING (true) WITH CHECK (true);

-- Alternative: Disable RLS entirely for market_data (simpler for iOS app)
-- ALTER TABLE market_data DISABLE ROW LEVEL SECURITY;

-- 2. Fix USERS RLS policies  
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

-- Create permissive policies for users
CREATE POLICY "Allow user registration and management" ON users
    FOR ALL USING (true) WITH CHECK (true);

-- 3. Ensure NEWS_ARTICLES policies are permissive
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON news_articles;
DROP POLICY IF EXISTS "Enable insert for service role" ON news_articles;
DROP POLICY IF EXISTS "Enable update for service role" ON news_articles;

CREATE POLICY "Allow all news operations" ON news_articles
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Ensure A2A_AGENTS policies are permissive
DROP POLICY IF EXISTS "A2A agents readable by all" ON a2a_agents;
DROP POLICY IF EXISTS "Service role can manage a2a agents" ON a2a_agents;

CREATE POLICY "Allow all a2a agent operations" ON a2a_agents
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Add missing columns to market_data
ALTER TABLE market_data ADD COLUMN IF NOT EXISTS change_pct DECIMAL(8,4);
ALTER TABLE market_data ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'live_feed';

-- 6. Add missing columns to news_articles (text versions)
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20);
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS market_impact VARCHAR(20);

-- Update existing records with text versions based on numeric scores
UPDATE news_articles SET 
  sentiment = CASE 
    WHEN sentiment_score > 0.2 THEN 'positive'
    WHEN sentiment_score < -0.2 THEN 'negative'
    ELSE 'neutral'
  END,
  market_impact = CASE
    WHEN market_impact_score > 0.7 THEN 'high'
    WHEN market_impact_score > 0.4 THEN 'medium'
    ELSE 'low'
  END
WHERE sentiment IS NULL OR market_impact IS NULL;

-- Success message
SELECT 'RLS policies fixed! iOS app now has full write access.' as status;