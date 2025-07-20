-- Deploy 8 Advanced Market Tables for Full iOS App Functionality
-- These tables enable portfolio management, bond analytics, FX trading, and advanced risk analysis

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PORTFOLIO_HOLDINGS - User portfolio data
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    symbol TEXT NOT NULL,
    quantity DECIMAL(18,6) NOT NULL,
    avg_cost DECIMAL(18,6) NOT NULL,
    current_price DECIMAL(18,6),
    market_value DECIMAL(20,2),
    unrealized_pnl DECIMAL(20,2),
    sector TEXT,
    asset_class TEXT DEFAULT 'equity',
    weight DECIMAL(8,4),
    purchase_date DATE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT positive_avg_cost CHECK (avg_cost > 0),
    CONSTRAINT valid_weight CHECK (weight >= 0 AND weight <= 100),
    CONSTRAINT unique_user_symbol UNIQUE(user_id, symbol)
);

-- 2. BOND_DATA - Fixed income securities
CREATE TABLE IF NOT EXISTS bond_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL UNIQUE,
    cusip VARCHAR(12),
    isin VARCHAR(12),
    issuer TEXT NOT NULL,
    coupon_rate DECIMAL(8,4) NOT NULL,
    yield_to_maturity DECIMAL(8,4),
    duration DECIMAL(8,4),
    modified_duration DECIMAL(8,4),
    convexity DECIMAL(10,6),
    face_value DECIMAL(18,2) DEFAULT 1000,
    current_price DECIMAL(8,4),
    accrued_interest DECIMAL(8,4) DEFAULT 0,
    maturity_date DATE NOT NULL,
    issue_date DATE,
    first_coupon_date DATE,
    last_coupon_date DATE,
    payment_frequency INTEGER DEFAULT 2,
    credit_rating TEXT,
    sector TEXT,
    country VARCHAR(3) DEFAULT 'US',
    currency VARCHAR(3) DEFAULT 'USD',
    callable BOOLEAN DEFAULT FALSE,
    putable BOOLEAN DEFAULT FALSE,
    floating_rate BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_coupon CHECK (coupon_rate >= 0),
    CONSTRAINT positive_face_value CHECK (face_value > 0),
    CONSTRAINT valid_payment_freq CHECK (payment_frequency IN (1, 2, 4, 12))
);

-- 3. FOREX_RATES - Currency exchange rates
CREATE TABLE IF NOT EXISTS forex_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency VARCHAR(3) NOT NULL,
    quote_currency VARCHAR(3) NOT NULL,
    spot_rate DECIMAL(12,6) NOT NULL,
    bid DECIMAL(12,6),
    ask DECIMAL(12,6),
    high_24h DECIMAL(12,6),
    low_24h DECIMAL(12,6),
    open_24h DECIMAL(12,6),
    close_24h DECIMAL(12,6),
    change_24h DECIMAL(8,4),
    change_pct_24h DECIMAL(8,4),
    volatility DECIMAL(8,4),
    volume_24h DECIMAL(20,2),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    source TEXT DEFAULT 'live_feed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_spot_rate CHECK (spot_rate > 0),
    CONSTRAINT valid_currencies CHECK (base_currency != quote_currency),
    CONSTRAINT unique_pair_timestamp UNIQUE(base_currency, quote_currency, timestamp)
);

-- 4. ECONOMIC_INDICATORS - Risk-free rates, inflation, etc.
CREATE TABLE IF NOT EXISTS economic_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator_name TEXT NOT NULL,
    indicator_code TEXT NOT NULL,
    value DECIMAL(12,6) NOT NULL,
    period_type TEXT DEFAULT 'monthly',
    period_date DATE NOT NULL,
    country VARCHAR(3) DEFAULT 'US',
    unit TEXT,
    seasonally_adjusted BOOLEAN DEFAULT FALSE,
    source TEXT,
    release_date DATE,
    next_release_date DATE,
    importance TEXT DEFAULT 'medium',
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_indicator_period UNIQUE(indicator_code, period_date, country),
    CONSTRAINT valid_importance CHECK (importance IN ('low', 'medium', 'high'))
);

-- 5. YIELD_CURVE - Interest rate term structure
CREATE TABLE IF NOT EXISTS yield_curve (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curve_date DATE NOT NULL,
    maturity_months INTEGER NOT NULL,
    maturity_years DECIMAL(8,4),
    yield_rate DECIMAL(8,4) NOT NULL,
    curve_type TEXT DEFAULT 'treasury',
    country VARCHAR(3) DEFAULT 'US',
    currency VARCHAR(3) DEFAULT 'USD',
    instrument_type TEXT DEFAULT 'bond',
    source TEXT DEFAULT 'treasury_gov',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_maturity CHECK (maturity_months > 0),
    CONSTRAINT positive_yield CHECK (yield_rate >= 0),
    CONSTRAINT unique_curve_point UNIQUE(curve_date, maturity_months, curve_type, country)
);

-- 6. VOLATILITY_SURFACE - Options data
CREATE TABLE IF NOT EXISTS volatility_surface (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    underlying_price DECIMAL(12,4),
    strike_price DECIMAL(12,4) NOT NULL,
    expiry_date DATE NOT NULL,
    days_to_expiry INTEGER,
    implied_volatility DECIMAL(8,4) NOT NULL,
    option_type VARCHAR(4) CHECK (option_type IN ('CALL', 'PUT')),
    delta DECIMAL(8,4),
    gamma DECIMAL(8,4),
    vega DECIMAL(8,4),
    theta DECIMAL(8,4),
    rho DECIMAL(8,4),
    option_price DECIMAL(12,4),
    volume INTEGER DEFAULT 0,
    open_interest INTEGER DEFAULT 0,
    trade_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_strike CHECK (strike_price > 0),
    CONSTRAINT positive_iv CHECK (implied_volatility >= 0),
    CONSTRAINT valid_greeks CHECK (delta BETWEEN -1 AND 1),
    CONSTRAINT unique_option UNIQUE(symbol, strike_price, expiry_date, option_type, trade_date)
);

-- 7. CORRELATION_MATRIX - Asset correlations
CREATE TABLE IF NOT EXISTS correlation_matrix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset1 TEXT NOT NULL,
    asset2 TEXT NOT NULL,
    correlation DECIMAL(8,6) NOT NULL,
    lookback_days INTEGER DEFAULT 252,
    calculation_date DATE DEFAULT CURRENT_DATE,
    correlation_type TEXT DEFAULT 'pearson',
    data_frequency TEXT DEFAULT 'daily',
    sample_size INTEGER,
    data_source TEXT DEFAULT 'market_data',
    statistical_significance DECIMAL(8,6),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_correlation CHECK (correlation BETWEEN -1 AND 1),
    CONSTRAINT different_assets CHECK (asset1 != asset2),
    CONSTRAINT positive_lookback CHECK (lookback_days > 0),
    CONSTRAINT unique_correlation UNIQUE(asset1, asset2, calculation_date, lookback_days)
);

-- 8. CALCULATION_RESULTS - Treasury calculation storage
CREATE TABLE IF NOT EXISTS calculation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    calculation_type TEXT NOT NULL,
    function_name TEXT NOT NULL,
    input_parameters JSONB NOT NULL,
    result_value DECIMAL(20,8),
    result_data JSONB,
    calculation_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    market_data_snapshot JSONB,
    calculation_date TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cached BOOLEAN DEFAULT FALSE,
    version TEXT DEFAULT '1.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_calc_time CHECK (calculation_time_ms >= 0)
);

-- Create comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id ON portfolio_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_symbol ON portfolio_holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_bond_data_symbol ON bond_data(symbol);
CREATE INDEX IF NOT EXISTS idx_forex_rates_pair ON forex_rates(base_currency, quote_currency);
CREATE INDEX IF NOT EXISTS idx_economic_indicators_code ON economic_indicators(indicator_code);
CREATE INDEX IF NOT EXISTS idx_yield_curve_date ON yield_curve(curve_date);
CREATE INDEX IF NOT EXISTS idx_volatility_surface_symbol ON volatility_surface(symbol);
CREATE INDEX IF NOT EXISTS idx_correlation_matrix_assets ON correlation_matrix(asset1, asset2);
CREATE INDEX IF NOT EXISTS idx_calculation_results_user_id ON calculation_results(user_id);

-- Enable RLS with permissive policies for iOS app
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bond_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE forex_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE yield_curve ENABLE ROW LEVEL SECURITY;
ALTER TABLE volatility_surface ENABLE ROW LEVEL SECURITY;
ALTER TABLE correlation_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_results ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies for iOS app
CREATE POLICY "Allow all portfolio operations" ON portfolio_holdings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all bond operations" ON bond_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all forex operations" ON forex_rates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all indicator operations" ON economic_indicators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all yield curve operations" ON yield_curve FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all volatility operations" ON volatility_surface FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all correlation operations" ON correlation_matrix FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all calculation operations" ON calculation_results FOR ALL USING (true) WITH CHECK (true);

-- Success message
SELECT 'All 8 advanced market tables deployed! iOS app now has full functionality.' as status;