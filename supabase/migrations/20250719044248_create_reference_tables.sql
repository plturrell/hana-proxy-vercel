-- Create Reference Data Tables
-- Migration: 20250719044248_create_reference_tables.sql

-- 1. CURRENCIES TABLE
CREATE TABLE IF NOT EXISTS currencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10),
    decimal_places INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EXCHANGES TABLE
CREATE TABLE IF NOT EXISTS exchanges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(2),
    timezone VARCHAR(50),
    market_hours VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SECTORS TABLE
CREATE TABLE IF NOT EXISTS sectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDUSTRIES TABLE
CREATE TABLE IF NOT EXISTS industries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    sector_code VARCHAR(10),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ASSET CLASSES TABLE
CREATE TABLE IF NOT EXISTS asset_classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    risk_level VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RISK RATINGS TABLE
CREATE TABLE IF NOT EXISTS risk_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    numeric_value INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CREDIT RATINGS TABLE
CREATE TABLE IF NOT EXISTS credit_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency VARCHAR(20) NOT NULL,
    rating VARCHAR(10) NOT NULL,
    description TEXT,
    investment_grade BOOLEAN DEFAULT false,
    numeric_value INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency, rating)
);

-- 8. COUNTRIES TABLE
CREATE TABLE IF NOT EXISTS countries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(2) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    continent VARCHAR(50),
    currency_code VARCHAR(3),
    market_status VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TIME ZONES TABLE
CREATE TABLE IF NOT EXISTS time_zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    utc_offset VARCHAR(10),
    dst_observed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. MARKET CALENDARS TABLE
CREATE TABLE IF NOT EXISTS market_calendars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exchange_code VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    name VARCHAR(100),
    type VARCHAR(20),
    is_trading_day BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exchange_code, date)
);

-- 11. HOLIDAYS TABLE
CREATE TABLE IF NOT EXISTS holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code VARCHAR(2) NOT NULL,
    date DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(country_code, date)
);

-- 12. REF DATA TABLE (Generic reference data)
CREATE TABLE IF NOT EXISTS ref_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    value TEXT,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, code)
);

-- 13. LOOKUP TABLES (Generic lookup table)
CREATE TABLE IF NOT EXISTS lookup_tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    key_field VARCHAR(50) NOT NULL,
    value_field VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. CONSTANTS TABLE
CREATE TABLE IF NOT EXISTS constants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    data_type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    category VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CONFIGURATIONS TABLE
CREATE TABLE IF NOT EXISTS configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    environment VARCHAR(20) DEFAULT 'production',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category, key)
);

-- 17. PARAMETERS TABLE
CREATE TABLE IF NOT EXISTS parameters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    data_type VARCHAR(20) DEFAULT 'string',
    category VARCHAR(50),
    description TEXT,
    min_value DECIMAL,
    max_value DECIMAL,
    validation_rule TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. ENUMS TABLE (Dynamic enum management)
CREATE TABLE IF NOT EXISTS enums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    enum_type VARCHAR(50) NOT NULL,
    value VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(enum_type, value)
);

-- 19. TYPES TABLE (Data type definitions)
CREATE TABLE IF NOT EXISTS types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    description TEXT,
    validation_schema JSONB,
    example_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookup_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE constants ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE enums ENABLE ROW LEVEL SECURITY;
ALTER TABLE types ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all tables (for now)
CREATE POLICY "Enable all access for service role" ON currencies FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON exchanges FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON sectors FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON industries FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON asset_classes FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON risk_ratings FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON credit_ratings FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON countries FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON time_zones FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON market_calendars FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON holidays FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON ref_data FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON lookup_tables FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON constants FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON configurations FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON settings FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON parameters FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON enums FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON types FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_exchanges_code ON exchanges(code);
CREATE INDEX IF NOT EXISTS idx_sectors_code ON sectors(code);
CREATE INDEX IF NOT EXISTS idx_industries_code ON industries(code);
CREATE INDEX IF NOT EXISTS idx_industries_sector ON industries(sector_code);
CREATE INDEX IF NOT EXISTS idx_asset_classes_code ON asset_classes(code);
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_currency ON countries(currency_code);
CREATE INDEX IF NOT EXISTS idx_market_calendars_exchange ON market_calendars(exchange_code);
CREATE INDEX IF NOT EXISTS idx_market_calendars_date ON market_calendars(date);
CREATE INDEX IF NOT EXISTS idx_credit_ratings_agency ON credit_ratings(agency);
CREATE INDEX IF NOT EXISTS idx_ref_data_category ON ref_data(category);
CREATE INDEX IF NOT EXISTS idx_enums_type ON enums(enum_type);
CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_configurations_environment ON configurations(environment);