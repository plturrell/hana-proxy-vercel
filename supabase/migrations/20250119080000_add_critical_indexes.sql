-- Add Critical Database Indexes for Performance
-- Migration: 20250119080000_add_critical_indexes.sql

-- 1. Market data indexes (most critical for financial queries)
CREATE INDEX IF NOT EXISTS idx_market_data_symbol 
ON public.market_data(symbol);

CREATE INDEX IF NOT EXISTS idx_market_data_timestamp_desc 
ON public.market_data(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp 
ON public.market_data(symbol, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_market_data_asset_type 
ON public.market_data(asset_type);

-- 2. News articles indexes (critical for content queries)
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at_desc 
ON public.news_articles(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_articles_category 
ON public.news_articles(category);

CREATE INDEX IF NOT EXISTS idx_news_articles_source 
ON public.news_articles(source);

CREATE INDEX IF NOT EXISTS idx_news_articles_sentiment_score 
ON public.news_articles(sentiment_score);

-- 3. Users table indexes (critical for authentication)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique 
ON public.users(email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique 
ON public.users(username);

CREATE INDEX IF NOT EXISTS idx_users_user_type 
ON public.users(user_type);

-- 4. Portfolio holdings indexes (critical for user queries)
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id 
ON public.portfolio_holdings(user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_symbol 
ON public.portfolio_holdings(symbol);

CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_symbol 
ON public.portfolio_holdings(user_id, symbol);

-- 5. Price alerts indexes (critical for alert processing)
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id 
ON public.price_alerts(user_id);

CREATE INDEX IF NOT EXISTS idx_price_alerts_symbol 
ON public.price_alerts(symbol);

CREATE INDEX IF NOT EXISTS idx_price_alerts_active 
ON public.price_alerts(is_active) WHERE is_active = true;

-- 6. Agents table indexes (critical for A2A operations)
CREATE INDEX IF NOT EXISTS idx_agents_user_id 
ON public.agents(user_id);

CREATE INDEX IF NOT EXISTS idx_agents_type 
ON public.agents(type);

CREATE INDEX IF NOT EXISTS idx_agents_status 
ON public.agents(status);

-- 7. A2A agents indexes (critical for agent registry)
CREATE INDEX IF NOT EXISTS idx_a2a_agents_agent_type 
ON public.a2a_agents(agent_type);

CREATE INDEX IF NOT EXISTS idx_a2a_agents_status 
ON public.a2a_agents(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_a2a_agents_agent_id_unique 
ON public.a2a_agents(agent_id);

-- 8. Notifications indexes (critical for real-time features)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read 
ON public.notifications(is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at_desc 
ON public.notifications(created_at DESC);

-- 9. User tasks indexes (critical for workflow management)
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id 
ON public.user_tasks(user_id);

CREATE INDEX IF NOT EXISTS idx_user_tasks_assigned_agent_id 
ON public.user_tasks(assigned_agent_id);

CREATE INDEX IF NOT EXISTS idx_user_tasks_status 
ON public.user_tasks(status);

-- 10. Session states indexes (critical for session management)
CREATE INDEX IF NOT EXISTS idx_session_states_user_id 
ON public.session_states(user_id);

-- Success notification
DO $$
BEGIN
    RAISE NOTICE 'Critical database indexes created successfully!';
    RAISE NOTICE '- Market data: symbol, timestamp, asset_type indexes';
    RAISE NOTICE '- News articles: published_at, category, source indexes';
    RAISE NOTICE '- Users: unique email, username indexes';
    RAISE NOTICE '- Portfolio: user_id, symbol indexes';
    RAISE NOTICE '- Price alerts: user_id, symbol, active indexes';
    RAISE NOTICE '- Agents: user_id, type, status indexes';
    RAISE NOTICE '- A2A agents: agent_type, status, unique agent_id';
    RAISE NOTICE '- Notifications: user_id, unread, timestamp indexes';
    RAISE NOTICE '- User tasks: user_id, agent_id, status indexes';
    RAISE NOTICE '- Sessions: user_id, session_id indexes';
END $$;