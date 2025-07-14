-- Market Data Tables for Real Treasury Calculations
-- Creates tables to store live market data and calculation results

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_data schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS app_data;
SET search_path TO app_data, public;

-- 1. MARKET DATA - Real-time price data
CREATE TABLE IF NOT EXISTS app_data.market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    asset_type VARCHAR(20) NOT NULL, -- 'stock', 'bond', 'forex', 'commodity'
    price DECIMAL(18,6) NOT NULL,
    bid DECIMAL(18,6),
    ask DECIMAL(18,6),
    volume BIGINT,
    change_pct DECIMAL(8,4),
    market_cap DECIMAL(20,2),
    exchange VARCHAR(10),
    currency VARCHAR(3) DEFAULT 'USD',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(50) DEFAULT 'live_feed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PORTFOLIO HOLDINGS - User portfolio positions
CREATE TABLE IF NOT EXISTS app_data.portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(18,6) NOT NULL,
    avg_cost DECIMAL(18,6) NOT NULL,
    current_price DECIMAL(18,6),
    market_value DECIMAL(20,2),
    unrealized_pnl DECIMAL(20,2),
    sector VARCHAR(50),
    asset_class VARCHAR(30),
    weight DECIMAL(8,4), -- Portfolio weight percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BOND DATA - Fixed income securities
CREATE TABLE IF NOT EXISTS app_data.bond_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    cusip VARCHAR(12),
    issuer VARCHAR(100),
    coupon_rate DECIMAL(8,4),
    yield_to_maturity DECIMAL(8,4),
    duration DECIMAL(8,4),
    convexity DECIMAL(10,6),
    face_value DECIMAL(18,2) DEFAULT 1000,
    current_price DECIMAL(8,4),
    maturity_date DATE,
    issue_date DATE,
    credit_rating VARCHAR(10),
    sector VARCHAR(50),
    callable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. FOREX RATES - Currency exchange rates
CREATE TABLE IF NOT EXISTS app_data.forex_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency VARCHAR(3) NOT NULL,
    quote_currency VARCHAR(3) NOT NULL,
    spot_rate DECIMAL(12,6) NOT NULL,
    bid DECIMAL(12,6),
    ask DECIMAL(12,6),
    high_24h DECIMAL(12,6),
    low_24h DECIMAL(12,6),
    change_24h DECIMAL(8,4),
    volatility DECIMAL(8,4),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(50) DEFAULT 'live_feed'
);

-- 5. ECONOMIC INDICATORS - Risk-free rates, inflation, etc.
CREATE TABLE IF NOT EXISTS app_data.economic_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator_name VARCHAR(100) NOT NULL,
    indicator_code VARCHAR(20) NOT NULL,
    value DECIMAL(12,6) NOT NULL,
    period_type VARCHAR(20), -- 'daily', 'monthly', 'quarterly', 'annual'
    period_date DATE NOT NULL,
    country VARCHAR(3) DEFAULT 'US',
    unit VARCHAR(20),
    source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CALCULATION RESULTS - Store all treasury calculation outputs
CREATE TABLE IF NOT EXISTS app_data.calculation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calculation_type VARCHAR(50) NOT NULL, -- 'var', 'sharpe', 'duration', etc.
    input_parameters JSONB NOT NULL,
    result_value DECIMAL(18,6),
    result_data JSONB, -- Full calculation output
    portfolio_id UUID,
    symbol VARCHAR(20),
    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. RISK PARAMETERS - Dynamic risk calculation parameters
CREATE TABLE IF NOT EXISTS app_data.risk_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parameter_name VARCHAR(100) NOT NULL,
    parameter_value DECIMAL(12,6) NOT NULL,
    parameter_type VARCHAR(50), -- 'confidence_level', 'time_horizon', 'volatility_window'
    asset_class VARCHAR(30),
    sector VARCHAR(50),
    effective_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. YIELD CURVE DATA - Interest rate term structure
CREATE TABLE IF NOT EXISTS app_data.yield_curve (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curve_date DATE NOT NULL,
    maturity_months INTEGER NOT NULL, -- 1, 3, 6, 12, 24, 60, 120, 360
    yield_rate DECIMAL(8,4) NOT NULL,
    curve_type VARCHAR(30) DEFAULT 'treasury', -- 'treasury', 'corporate', 'municipal'
    country VARCHAR(3) DEFAULT 'US',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. VOLATILITY SURFACE - Option volatility data
CREATE TABLE IF NOT EXISTS app_data.volatility_surface (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    strike_price DECIMAL(12,4) NOT NULL,
    expiry_date DATE NOT NULL,
    volatility DECIMAL(8,4) NOT NULL,
    option_type VARCHAR(4), -- 'call', 'put'
    delta DECIMAL(8,4),
    gamma DECIMAL(8,4),
    vega DECIMAL(8,4),
    theta DECIMAL(8,4),
    trade_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. CORRELATION MATRIX - Asset correlations
CREATE TABLE IF NOT EXISTS app_data.correlation_matrix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset1 VARCHAR(20) NOT NULL,
    asset2 VARCHAR(20) NOT NULL,
    correlation DECIMAL(8,6) NOT NULL,
    lookback_days INTEGER DEFAULT 252,
    calculation_date DATE DEFAULT CURRENT_DATE,
    data_source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON app_data.market_data(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id ON app_data.portfolio_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_bond_data_symbol ON app_data.bond_data(symbol);
CREATE INDEX IF NOT EXISTS idx_forex_rates_pair ON app_data.forex_rates(base_currency, quote_currency);
CREATE INDEX IF NOT EXISTS idx_economic_indicators_code_date ON app_data.economic_indicators(indicator_code, period_date DESC);
CREATE INDEX IF NOT EXISTS idx_calculation_results_type_date ON app_data.calculation_results(calculation_type, calculation_date DESC);
CREATE INDEX IF NOT EXISTS idx_risk_parameters_name ON app_data.risk_parameters(parameter_name);
CREATE INDEX IF NOT EXISTS idx_yield_curve_date_maturity ON app_data.yield_curve(curve_date, maturity_months);
CREATE INDEX IF NOT EXISTS idx_volatility_surface_symbol_expiry ON app_data.volatility_surface(symbol, expiry_date);
CREATE INDEX IF NOT EXISTS idx_correlation_matrix_assets ON app_data.correlation_matrix(asset1, asset2);

-- Grant permissions
GRANT ALL ON SCHEMA app_data TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA app_data TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app_data TO postgres;