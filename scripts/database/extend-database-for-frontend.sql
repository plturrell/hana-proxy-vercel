-- Extend Database Schema to Support All Frontend UI Elements
-- This adds missing fields to existing tables and creates new tables as needed

-- ====================================================================
-- 1. EXTEND EXISTING portfolio_holdings TABLE
-- ====================================================================

-- Add missing fields to support frontend UI elements
ALTER TABLE portfolio_holdings ADD COLUMN IF NOT EXISTS cash_position DECIMAL(20,2) DEFAULT 0.00;
ALTER TABLE portfolio_holdings ADD COLUMN IF NOT EXISTS ytd_return DECIMAL(8,4); -- Year-to-date return percentage
ALTER TABLE portfolio_holdings ADD COLUMN IF NOT EXISTS volatility DECIMAL(8,4); -- 30-day volatility
ALTER TABLE portfolio_holdings ADD COLUMN IF NOT EXISTS beta DECIMAL(8,4); -- Stock beta vs market
ALTER TABLE portfolio_holdings ADD COLUMN IF NOT EXISTS dividend_yield DECIMAL(8,4); -- Annual dividend yield %
ALTER TABLE portfolio_holdings ADD COLUMN IF NOT EXISTS pe_ratio DECIMAL(8,4); -- Price-to-earnings ratio
ALTER TABLE portfolio_holdings ADD COLUMN IF NOT EXISTS market_cap_category TEXT DEFAULT 'unknown'; -- 'large_cap', 'mid_cap', 'small_cap'
ALTER TABLE portfolio_holdings ADD COLUMN IF NOT EXISTS position_type TEXT DEFAULT 'long'; -- 'long', 'short', 'cash'

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_symbol ON portfolio_holdings(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_updated ON portfolio_holdings(updated_at);

-- ====================================================================
-- 2. CREATE PORTFOLIO-LEVEL TABLE (user_portfolios)
-- ====================================================================

CREATE TABLE IF NOT EXISTS user_portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    portfolio_name TEXT NOT NULL DEFAULT 'My Portfolio',
    portfolio_type TEXT DEFAULT 'investment', -- 'investment', 'trading', 'retirement'
    
    -- Core Financial Metrics
    total_value DECIMAL(20,2) DEFAULT 0.00,
    cash_balance DECIMAL(20,2) DEFAULT 0.00,
    invested_value DECIMAL(20,2) DEFAULT 0.00,
    
    -- Performance Metrics (for frontend UI)
    total_return_pct DECIMAL(8,4), -- Total return percentage
    ytd_return_pct DECIMAL(8,4), -- Year-to-date return
    daily_return_pct DECIMAL(8,4), -- Daily return
    monthly_return_pct DECIMAL(8,4), -- Monthly return
    
    -- Risk Metrics
    portfolio_volatility DECIMAL(8,4), -- Portfolio-level volatility
    sharpe_ratio DECIMAL(8,4), -- Risk-adjusted return
    max_drawdown DECIMAL(8,4), -- Maximum drawdown
    
    -- Position Counts (for frontend UI)
    total_positions INTEGER DEFAULT 0,
    long_positions INTEGER DEFAULT 0,
    short_positions INTEGER DEFAULT 0,
    cash_positions INTEGER DEFAULT 0,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_portfolios_user ON user_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_user_portfolios_active ON user_portfolios(is_active);

-- ====================================================================
-- 3. CREATE PERFORMANCE HISTORY TABLE (for charts)
-- ====================================================================

CREATE TABLE IF NOT EXISTS portfolio_performance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
    
    -- Date and performance data
    performance_date DATE NOT NULL,
    total_value DECIMAL(20,2) NOT NULL,
    cash_balance DECIMAL(20,2) DEFAULT 0.00,
    
    -- Daily performance metrics
    daily_return DECIMAL(8,4),
    daily_pnl DECIMAL(20,2),
    volatility DECIMAL(8,4),
    
    -- Position counts for tracking
    position_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_performance_portfolio_date ON portfolio_performance_history(portfolio_id, performance_date);
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_date ON portfolio_performance_history(performance_date);

-- ====================================================================
-- 4. CREATE CASH TRANSACTIONS TABLE (for cash flow tracking)
-- ====================================================================

CREATE TABLE IF NOT EXISTS cash_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Transaction details
    transaction_type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'dividend', 'interest', 'fee', 'trade_settlement'
    amount DECIMAL(20,2) NOT NULL,
    balance_after DECIMAL(20,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Transaction metadata
    description TEXT,
    related_symbol TEXT, -- If related to a stock transaction
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_transactions_portfolio ON cash_transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON cash_transactions(transaction_date);

-- ====================================================================
-- 5. CREATE PORTFOLIO SECTORS TABLE (for diversification analysis)
-- ====================================================================

CREATE TABLE IF NOT EXISTS portfolio_sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
    
    -- Sector allocation
    sector_name TEXT NOT NULL,
    sector_value DECIMAL(20,2) DEFAULT 0.00,
    sector_weight DECIMAL(8,4) DEFAULT 0.00, -- Percentage of portfolio
    position_count INTEGER DEFAULT 0,
    
    -- Performance by sector
    sector_return_pct DECIMAL(8,4),
    sector_pnl DECIMAL(20,2),
    
    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_sectors_portfolio ON portfolio_sectors(portfolio_id);

-- ====================================================================
-- 6. UPDATE EXISTING MARKET_DATA TABLE (add fields if missing)
-- ====================================================================

-- Ensure market_data table has volatility fields
ALTER TABLE market_data ADD COLUMN IF NOT EXISTS volatility_30d DECIMAL(8,4);
ALTER TABLE market_data ADD COLUMN IF NOT EXISTS beta DECIMAL(8,4);
ALTER TABLE market_data ADD COLUMN IF NOT EXISTS dividend_yield DECIMAL(8,4);
ALTER TABLE market_data ADD COLUMN IF NOT EXISTS pe_ratio DECIMAL(8,4);
ALTER TABLE market_data ADD COLUMN IF NOT EXISTS year_high DECIMAL(20,8);
ALTER TABLE market_data ADD COLUMN IF NOT EXISTS year_low DECIMAL(20,8);

-- ====================================================================
-- 7. CREATE FUNCTIONS TO CALCULATE MISSING METRICS
-- ====================================================================

-- Function to calculate portfolio volatility
CREATE OR REPLACE FUNCTION calculate_portfolio_volatility(p_portfolio_id UUID)
RETURNS DECIMAL(8,4)
LANGUAGE plpgsql
AS $$
DECLARE
    portfolio_vol DECIMAL(8,4) := 0;
BEGIN
    -- Calculate weighted average volatility
    SELECT 
        COALESCE(
            SUM(
                (ph.weight / 100.0) * COALESCE(md.volatility_30d, 0)
            ), 
            0
        ) INTO portfolio_vol
    FROM portfolio_holdings ph
    LEFT JOIN market_data md ON ph.symbol = md.symbol
    WHERE ph.user_id = (SELECT user_id FROM user_portfolios WHERE id = p_portfolio_id)
    AND ph.quantity > 0;
    
    RETURN portfolio_vol;
END;
$$;

-- Function to calculate YTD returns
CREATE OR REPLACE FUNCTION calculate_ytd_return(p_portfolio_id UUID)
RETURNS DECIMAL(8,4)
LANGUAGE plpgsql
AS $$
DECLARE
    ytd_return DECIMAL(8,4) := 0;
    start_value DECIMAL(20,2);
    current_value DECIMAL(20,2);
BEGIN
    -- Get portfolio value at start of year
    SELECT total_value INTO start_value
    FROM portfolio_performance_history
    WHERE portfolio_id = p_portfolio_id
    AND performance_date = DATE_TRUNC('year', CURRENT_DATE)::DATE
    ORDER BY performance_date
    LIMIT 1;
    
    -- Get current portfolio value
    SELECT total_value INTO current_value
    FROM user_portfolios
    WHERE id = p_portfolio_id;
    
    -- Calculate YTD return
    IF start_value > 0 THEN
        ytd_return := ((current_value - start_value) / start_value) * 100;
    END IF;
    
    RETURN ytd_return;
END;
$$;

-- Function to update portfolio summary (extends existing generate_portfolio_summary)
CREATE OR REPLACE FUNCTION update_portfolio_metrics(p_portfolio_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
    portfolio_record RECORD;
BEGIN
    -- Get portfolio with all calculated metrics
    SELECT 
        up.id,
        up.portfolio_name,
        up.total_value,
        up.cash_balance,
        COUNT(ph.id) as position_count,
        SUM(CASE WHEN ph.quantity > 0 THEN 1 ELSE 0 END) as long_positions,
        SUM(ph.unrealized_pnl) as total_pnl,
        calculate_portfolio_volatility(up.id) as volatility,
        calculate_ytd_return(up.id) as ytd_return
    INTO portfolio_record
    FROM user_portfolios up
    LEFT JOIN portfolio_holdings ph ON up.user_id = ph.user_id
    WHERE up.id = p_portfolio_id
    GROUP BY up.id, up.portfolio_name, up.total_value, up.cash_balance;
    
    -- Build result JSON
    result := jsonb_build_object(
        'portfolio_id', portfolio_record.id,
        'portfolio_name', portfolio_record.portfolio_name,
        'total_value', portfolio_record.total_value,
        'cash_balance', portfolio_record.cash_balance,
        'total_positions', portfolio_record.position_count,
        'long_positions', portfolio_record.long_positions,
        'total_pnl', portfolio_record.total_pnl,
        'volatility', portfolio_record.volatility,
        'ytd_return', portfolio_record.ytd_return,
        'updated_at', NOW()
    );
    
    RETURN result;
END;
$$;

-- ====================================================================
-- 8. CREATE TRIGGERS TO MAINTAIN DATA CONSISTENCY
-- ====================================================================

-- Trigger to update portfolio totals when holdings change
CREATE OR REPLACE FUNCTION update_portfolio_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user_portfolios totals when holdings change
    UPDATE user_portfolios SET 
        total_value = (
            SELECT COALESCE(SUM(market_value), 0) + cash_balance
            FROM portfolio_holdings ph 
            WHERE ph.user_id = user_portfolios.user_id
        ),
        total_positions = (
            SELECT COUNT(*)
            FROM portfolio_holdings ph 
            WHERE ph.user_id = user_portfolios.user_id 
            AND ph.quantity != 0
        ),
        updated_at = NOW()
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to portfolio_holdings
DROP TRIGGER IF EXISTS trigger_update_portfolio_totals ON portfolio_holdings;
CREATE TRIGGER trigger_update_portfolio_totals
    AFTER INSERT OR UPDATE OR DELETE ON portfolio_holdings
    FOR EACH ROW EXECUTE FUNCTION update_portfolio_totals();

-- ====================================================================
-- 9. COMMENTS AND DOCUMENTATION
-- ====================================================================

COMMENT ON TABLE user_portfolios IS 'Portfolio-level data with all metrics needed for frontend UI';
COMMENT ON TABLE portfolio_performance_history IS 'Historical performance data for charts and analysis';
COMMENT ON TABLE cash_transactions IS 'Cash flow tracking for cash_position and cash_change UI elements';
COMMENT ON TABLE portfolio_sectors IS 'Sector allocation analysis for diversification metrics';

COMMENT ON COLUMN portfolio_holdings.cash_position IS 'Cash portion of this holding (for cash equivalents)';
COMMENT ON COLUMN portfolio_holdings.ytd_return IS 'Year-to-date return percentage for this position';
COMMENT ON COLUMN portfolio_holdings.volatility IS '30-day price volatility for this asset';

COMMENT ON FUNCTION calculate_portfolio_volatility IS 'Calculates weighted portfolio volatility for frontend display';
COMMENT ON FUNCTION calculate_ytd_return IS 'Calculates year-to-date return for frontend YTD metrics';
COMMENT ON FUNCTION update_portfolio_metrics IS 'Returns complete portfolio metrics for API consumption';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Database schema extended successfully! All frontend UI elements now have database backing.';
    RAISE NOTICE 'New tables: user_portfolios, portfolio_performance_history, cash_transactions, portfolio_sectors';
    RAISE NOTICE 'Extended tables: portfolio_holdings (added cash_position, ytd_return, volatility, etc)';
    RAISE NOTICE 'New functions: calculate_portfolio_volatility, calculate_ytd_return, update_portfolio_metrics';
END $$;