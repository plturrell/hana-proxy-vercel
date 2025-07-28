-- Portfolio Analytics Tables
-- Run this in Supabase SQL editor

-- 1. Portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  currency VARCHAR(10) DEFAULT 'USD',
  cash_balance DECIMAL(20, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolios_active ON portfolios(is_active, created_at DESC);

-- 2. Portfolio positions
CREATE TABLE IF NOT EXISTS portfolio_positions (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  avg_price DECIMAL(20, 4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_positions_portfolio ON portfolio_positions(portfolio_id, is_active);
CREATE INDEX idx_positions_symbol ON portfolio_positions(symbol, is_active);

-- 3. Portfolio valuations history
CREATE TABLE IF NOT EXISTS portfolio_valuations (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  total_value DECIMAL(20, 2) NOT NULL,
  total_cost DECIMAL(20, 2) NOT NULL,
  total_return DECIMAL(20, 2) NOT NULL,
  return_percentage DECIMAL(10, 4) NOT NULL,
  positions JSONB NOT NULL DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_valuations_portfolio ON portfolio_valuations(portfolio_id, created_at DESC);
CREATE INDEX idx_valuations_created ON portfolio_valuations(created_at DESC);

-- 4. Portfolio risk metrics
CREATE TABLE IF NOT EXISTS portfolio_risk_metrics (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  period VARCHAR(10) NOT NULL, -- '7d', '30d', '90d', '1y'
  sharpe_ratio DECIMAL(10, 4),
  sortino_ratio DECIMAL(10, 4),
  value_at_risk_95 DECIMAL(10, 4),
  value_at_risk_99 DECIMAL(10, 4),
  max_drawdown DECIMAL(10, 4),
  volatility DECIMAL(10, 4),
  beta DECIMAL(10, 4),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_metrics_portfolio ON portfolio_risk_metrics(portfolio_id, created_at DESC);

-- 5. Portfolio optimizations
CREATE TABLE IF NOT EXISTS portfolio_optimizations (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  strategy VARCHAR(50) NOT NULL, -- 'conservative', 'balanced', 'aggressive', 'crypto'
  suggestions JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  implemented BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_optimizations_portfolio ON portfolio_optimizations(portfolio_id, created_at DESC);

-- 6. Portfolio daily reports
CREATE TABLE IF NOT EXISTS portfolio_daily_reports (
  id BIGSERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  reports JSONB NOT NULL,
  summary JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_daily_reports_date ON portfolio_daily_reports(report_date);

-- 7. Portfolio transactions
CREATE TABLE IF NOT EXISTS portfolio_transactions (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL, -- 'BUY', 'SELL', 'DIVIDEND', 'DEPOSIT', 'WITHDRAWAL'
  symbol VARCHAR(20),
  quantity DECIMAL(20, 8),
  price DECIMAL(20, 4),
  amount DECIMAL(20, 2) NOT NULL,
  fees DECIMAL(10, 2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  executed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_portfolio ON portfolio_transactions(portfolio_id, executed_at DESC);
CREATE INDEX idx_transactions_symbol ON portfolio_transactions(symbol, executed_at DESC);

-- 8. Portfolio benchmarks
CREATE TABLE IF NOT EXISTS portfolio_benchmarks (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  benchmark_symbol VARCHAR(20) NOT NULL, -- 'SPY', 'QQQ', etc.
  comparison_period VARCHAR(10) NOT NULL,
  portfolio_return DECIMAL(10, 4),
  benchmark_return DECIMAL(10, 4),
  alpha DECIMAL(10, 4),
  tracking_error DECIMAL(10, 4),
  information_ratio DECIMAL(10, 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_benchmarks_portfolio ON portfolio_benchmarks(portfolio_id, created_at DESC);

-- Create views for easy access
CREATE OR REPLACE VIEW current_portfolio_values AS
SELECT DISTINCT ON (portfolio_id)
  portfolio_id,
  total_value,
  total_return,
  return_percentage,
  created_at
FROM portfolio_valuations
ORDER BY portfolio_id, created_at DESC;

CREATE OR REPLACE VIEW portfolio_summary AS
SELECT 
  p.id,
  p.name,
  p.cash_balance,
  COUNT(DISTINCT pp.symbol) as position_count,
  COALESCE(v.total_value, p.cash_balance) as current_value,
  COALESCE(v.return_percentage, 0) as total_return_pct,
  p.created_at
FROM portfolios p
LEFT JOIN portfolio_positions pp ON p.id = pp.portfolio_id AND pp.is_active = true
LEFT JOIN current_portfolio_values v ON p.id = v.portfolio_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.cash_balance, v.total_value, v.return_percentage, p.created_at;

-- Enable Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_risk_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_benchmarks ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Enable read access for all users" ON portfolios
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON portfolio_positions
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON portfolio_valuations
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON portfolio_risk_metrics
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON portfolio_optimizations
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON portfolio_daily_reports
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON portfolio_transactions
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON portfolio_benchmarks
  FOR SELECT USING (true);

-- Create policies for service role write access
CREATE POLICY "Enable all operations for service role" ON portfolios
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON portfolio_positions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON portfolio_valuations
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON portfolio_risk_metrics
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON portfolio_optimizations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON portfolio_daily_reports
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON portfolio_transactions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable insert for service role" ON portfolio_benchmarks
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Add table comments
COMMENT ON TABLE portfolios IS 'Master portfolio records';
COMMENT ON TABLE portfolio_positions IS 'Current positions in each portfolio';
COMMENT ON TABLE portfolio_valuations IS 'Historical portfolio valuations';
COMMENT ON TABLE portfolio_risk_metrics IS 'Risk metrics calculated for portfolios';
COMMENT ON TABLE portfolio_optimizations IS 'Portfolio optimization suggestions';
COMMENT ON TABLE portfolio_daily_reports IS 'Daily portfolio performance reports';
COMMENT ON TABLE portfolio_transactions IS 'All portfolio transactions';
COMMENT ON TABLE portfolio_benchmarks IS 'Portfolio performance vs benchmarks';