-- Create market data tables in Supabase
-- Run this in the SQL editor at https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new

-- 1. Main market data table
CREATE TABLE IF NOT EXISTS market_data (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  source VARCHAR(20) NOT NULL, -- 'fmp', 'finnhub', etc.
  price DECIMAL(20, 4) NOT NULL,
  change DECIMAL(20, 4),
  change_percent DECIMAL(10, 4),
  volume BIGINT,
  high DECIMAL(20, 4),
  low DECIMAL(20, 4),
  open DECIMAL(20, 4),
  previous_close DECIMAL(20, 4),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_market_data_symbol_timestamp ON market_data(symbol, timestamp DESC);
CREATE INDEX idx_market_data_source_timestamp ON market_data(source, timestamp DESC);
CREATE INDEX idx_market_data_timestamp ON market_data(timestamp DESC);

-- 2. Collection log table
CREATE TABLE IF NOT EXISTS market_data_collection_log (
  id BIGSERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  symbols_requested INTEGER,
  symbols_collected INTEGER,
  symbols_failed INTEGER,
  duplicates_skipped INTEGER,
  success_rate DECIMAL(5, 2),
  sources JSONB,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Symbol reference table
CREATE TABLE IF NOT EXISTS market_symbols (
  symbol VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255),
  exchange VARCHAR(50),
  category VARCHAR(50), -- 'stock', 'index', 'crypto', 'forex', 'commodity'
  sector VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default symbols
INSERT INTO market_symbols (symbol, name, category, exchange) VALUES
  -- Indices
  ('SPY', 'SPDR S&P 500 ETF', 'index', 'NYSE'),
  ('QQQ', 'Invesco QQQ Trust', 'index', 'NASDAQ'),
  ('DIA', 'SPDR Dow Jones Industrial Average ETF', 'index', 'NYSE'),
  ('IWM', 'iShares Russell 2000 ETF', 'index', 'NYSE'),
  ('VTI', 'Vanguard Total Stock Market ETF', 'index', 'NYSE'),
  
  -- Major stocks
  ('AAPL', 'Apple Inc.', 'stock', 'NASDAQ'),
  ('MSFT', 'Microsoft Corporation', 'stock', 'NASDAQ'),
  ('GOOGL', 'Alphabet Inc.', 'stock', 'NASDAQ'),
  ('AMZN', 'Amazon.com Inc.', 'stock', 'NASDAQ'),
  ('TSLA', 'Tesla Inc.', 'stock', 'NASDAQ'),
  ('NVDA', 'NVIDIA Corporation', 'stock', 'NASDAQ'),
  ('META', 'Meta Platforms Inc.', 'stock', 'NASDAQ'),
  
  -- Crypto
  ('BTC-USD', 'Bitcoin USD', 'crypto', 'CRYPTO'),
  ('ETH-USD', 'Ethereum USD', 'crypto', 'CRYPTO'),
  ('BNB-USD', 'Binance Coin USD', 'crypto', 'CRYPTO')
ON CONFLICT (symbol) DO NOTHING;

-- 4. Market alerts table
CREATE TABLE IF NOT EXISTS market_alerts (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- 'price_spike', 'volume_surge', 'new_high', 'new_low'
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  message TEXT,
  current_value DECIMAL(20, 4),
  threshold_value DECIMAL(20, 4),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to detect price anomalies
CREATE OR REPLACE FUNCTION detect_market_anomalies()
RETURNS void AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Check for significant price movements (>5% in 15 minutes)
  FOR rec IN 
    SELECT 
      m1.symbol,
      m1.price as current_price,
      m2.price as previous_price,
      ((m1.price - m2.price) / m2.price * 100) as change_percent
    FROM market_data m1
    JOIN market_data m2 ON m1.symbol = m2.symbol
    WHERE m1.timestamp > NOW() - INTERVAL '5 minutes'
      AND m2.timestamp BETWEEN NOW() - INTERVAL '20 minutes' AND NOW() - INTERVAL '15 minutes'
      AND ABS((m1.price - m2.price) / m2.price) > 0.05
  LOOP
    INSERT INTO market_alerts (symbol, alert_type, severity, message, current_value, threshold_value)
    VALUES (
      rec.symbol,
      CASE WHEN rec.change_percent > 0 THEN 'price_spike' ELSE 'price_drop' END,
      CASE 
        WHEN ABS(rec.change_percent) > 10 THEN 'critical'
        WHEN ABS(rec.change_percent) > 7 THEN 'high'
        ELSE 'medium'
      END,
      rec.symbol || ' moved ' || ROUND(rec.change_percent, 2) || '% in 15 minutes',
      rec.current_price,
      rec.previous_price
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create view for latest prices
CREATE OR REPLACE VIEW latest_market_prices AS
SELECT DISTINCT ON (symbol)
  symbol,
  price,
  change,
  change_percent,
  volume,
  high,
  low,
  timestamp,
  source
FROM market_data
ORDER BY symbol, timestamp DESC;

-- Enable Row Level Security
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data_collection_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Enable read access for all users" ON market_data
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON market_data_collection_log
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON market_symbols
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON market_alerts
  FOR SELECT USING (true);

-- Create policies for service role write access
CREATE POLICY "Enable insert for service role" ON market_data
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON market_data_collection_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON market_symbols
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON market_alerts
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Add table comments
COMMENT ON TABLE market_data IS 'Real-time market data from multiple sources (FMP, Finnhub, etc.)';
COMMENT ON TABLE market_data_collection_log IS 'Logs for market data collection runs';
COMMENT ON TABLE market_symbols IS 'Reference table for tracked symbols';
COMMENT ON TABLE market_alerts IS 'Automated alerts for significant market movements';