-- Market Data Functions for Treasury Calculator Integration
-- Functions to retrieve live market data and store calculation results

-- Set search path
SET search_path TO app_data, public;

-- 1. GET CURRENT MARKET DATA
CREATE OR REPLACE FUNCTION app_data.get_current_market_data(
    p_symbol VARCHAR(20)
) RETURNS JSON AS $$
DECLARE
    market_info JSON;
BEGIN
    SELECT json_build_object(
        'symbol', symbol,
        'price', price,
        'bid', bid,
        'ask', ask,
        'volume', volume,
        'change_pct', change_pct,
        'volatility', COALESCE(
            (SELECT value FROM app_data.risk_parameters 
             WHERE parameter_name = 'historical_volatility' 
             AND (asset_class = asset_type OR asset_class IS NULL)
             ORDER BY created_at DESC LIMIT 1), 
            0.20
        ),
        'timestamp', timestamp
    )
    INTO market_info
    FROM app_data.market_data
    WHERE symbol = p_symbol
    ORDER BY timestamp DESC
    LIMIT 1;
    
    RETURN COALESCE(market_info, '{"error": "Symbol not found"}'::json);
END;
$$ LANGUAGE plpgsql;

-- 2. GET RISK-FREE RATE
CREATE OR REPLACE FUNCTION app_data.get_risk_free_rate(
    p_maturity_months INTEGER DEFAULT 12
) RETURNS DECIMAL(8,4) AS $$
DECLARE
    risk_free_rate DECIMAL(8,4);
BEGIN
    -- Get the risk-free rate from yield curve or economic indicators
    SELECT yield_rate INTO risk_free_rate
    FROM app_data.yield_curve
    WHERE curve_type = 'treasury'
    AND maturity_months = p_maturity_months
    AND curve_date = (
        SELECT MAX(curve_date) 
        FROM app_data.yield_curve 
        WHERE curve_type = 'treasury'
        AND maturity_months = p_maturity_months
    );
    
    -- Fallback to economic indicators if yield curve not available
    IF risk_free_rate IS NULL THEN
        SELECT value INTO risk_free_rate
        FROM app_data.economic_indicators
        WHERE indicator_code = 'TREASURY_RATE'
        ORDER BY period_date DESC
        LIMIT 1;
    END IF;
    
    -- Default fallback
    RETURN COALESCE(risk_free_rate, 0.05);
END;
$$ LANGUAGE plpgsql;

-- 3. GET PORTFOLIO DATA FOR CALCULATIONS
CREATE OR REPLACE FUNCTION app_data.get_portfolio_data(
    p_user_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    portfolio_data JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'symbol', ph.symbol,
            'quantity', ph.quantity,
            'current_price', COALESCE(md.price, ph.current_price),
            'market_value', ph.quantity * COALESCE(md.price, ph.current_price),
            'weight', ph.weight,
            'sector', ph.sector,
            'asset_class', ph.asset_class,
            'volatility', COALESCE(
                (SELECT value FROM app_data.risk_parameters 
                 WHERE parameter_name = 'historical_volatility' 
                 AND asset_class = ph.asset_class
                 ORDER BY created_at DESC LIMIT 1), 
                0.20
            )
        )
    )
    INTO portfolio_data
    FROM app_data.portfolio_holdings ph
    LEFT JOIN app_data.market_data md ON ph.symbol = md.symbol
    WHERE (p_user_id IS NULL OR ph.user_id = p_user_id)
    AND md.timestamp = (
        SELECT MAX(timestamp) 
        FROM app_data.market_data md2 
        WHERE md2.symbol = md.symbol
    );
    
    RETURN COALESCE(portfolio_data, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- 4. GET BOND PARAMETERS
CREATE OR REPLACE FUNCTION app_data.get_bond_parameters(
    p_symbol VARCHAR(20)
) RETURNS JSON AS $$
DECLARE
    bond_params JSON;
BEGIN
    SELECT json_build_object(
        'symbol', symbol,
        'coupon_rate', coupon_rate,
        'yield_to_maturity', yield_to_maturity,
        'duration', duration,
        'convexity', convexity,
        'face_value', face_value,
        'current_price', current_price,
        'maturity_date', maturity_date,
        'time_to_maturity', EXTRACT(YEAR FROM AGE(maturity_date, CURRENT_DATE)) +
                           EXTRACT(MONTH FROM AGE(maturity_date, CURRENT_DATE))/12.0,
        'credit_rating', credit_rating
    )
    INTO bond_params
    FROM app_data.bond_data
    WHERE symbol = p_symbol
    ORDER BY updated_at DESC
    LIMIT 1;
    
    RETURN COALESCE(bond_params, '{"error": "Bond not found"}'::json);
END;
$$ LANGUAGE plpgsql;

-- 5. GET FOREX RATES
CREATE OR REPLACE FUNCTION app_data.get_forex_rate(
    p_base_currency VARCHAR(3),
    p_quote_currency VARCHAR(3)
) RETURNS JSON AS $$
DECLARE
    fx_data JSON;
BEGIN
    SELECT json_build_object(
        'base_currency', base_currency,
        'quote_currency', quote_currency,
        'spot_rate', spot_rate,
        'bid', bid,
        'ask', ask,
        'volatility', volatility,
        'timestamp', timestamp
    )
    INTO fx_data
    FROM app_data.forex_rates
    WHERE base_currency = p_base_currency
    AND quote_currency = p_quote_currency
    ORDER BY timestamp DESC
    LIMIT 1;
    
    RETURN COALESCE(fx_data, '{"error": "Currency pair not found"}'::json);
END;
$$ LANGUAGE plpgsql;

-- 6. STORE CALCULATION RESULT
CREATE OR REPLACE FUNCTION app_data.store_calculation_result(
    p_calculation_type VARCHAR(50),
    p_input_parameters JSON,
    p_result_value DECIMAL(18,6),
    p_result_data JSON DEFAULT NULL,
    p_symbol VARCHAR(20) DEFAULT NULL,
    p_execution_time_ms INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    result_id UUID;
BEGIN
    INSERT INTO app_data.calculation_results (
        calculation_type,
        input_parameters,
        result_value,
        result_data,
        symbol,
        execution_time_ms
    ) VALUES (
        p_calculation_type,
        p_input_parameters::jsonb,
        p_result_value,
        p_result_data::jsonb,
        p_symbol,
        p_execution_time_ms
    )
    RETURNING id INTO result_id;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- 7. GET DYNAMIC RISK PARAMETERS
CREATE OR REPLACE FUNCTION app_data.get_risk_parameters(
    p_parameter_name VARCHAR(100),
    p_asset_class VARCHAR(30) DEFAULT NULL
) RETURNS DECIMAL(12,6) AS $$
DECLARE
    param_value DECIMAL(12,6);
BEGIN
    SELECT parameter_value INTO param_value
    FROM app_data.risk_parameters
    WHERE parameter_name = p_parameter_name
    AND (p_asset_class IS NULL OR asset_class = p_asset_class OR asset_class IS NULL)
    AND (effective_date <= CURRENT_DATE)
    AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
    ORDER BY 
        CASE WHEN asset_class = p_asset_class THEN 1 ELSE 2 END,
        created_at DESC
    LIMIT 1;
    
    RETURN param_value;
END;
$$ LANGUAGE plpgsql;

-- 8. CALCULATE PORTFOLIO RETURNS
CREATE OR REPLACE FUNCTION app_data.calculate_portfolio_returns(
    p_user_id UUID DEFAULT NULL,
    p_lookback_days INTEGER DEFAULT 252
) RETURNS JSON AS $$
DECLARE
    returns_data JSON;
BEGIN
    WITH portfolio_values AS (
        SELECT 
            md.timestamp::date as price_date,
            SUM(ph.quantity * md.price) as portfolio_value
        FROM app_data.portfolio_holdings ph
        JOIN app_data.market_data md ON ph.symbol = md.symbol
        WHERE (p_user_id IS NULL OR ph.user_id = p_user_id)
        AND md.timestamp >= CURRENT_DATE - INTERVAL '1 day' * (p_lookback_days + 10)
        GROUP BY md.timestamp::date
        ORDER BY price_date
    ),
    daily_returns AS (
        SELECT 
            price_date,
            portfolio_value,
            LAG(portfolio_value) OVER (ORDER BY price_date) as prev_value,
            CASE 
                WHEN LAG(portfolio_value) OVER (ORDER BY price_date) > 0 
                THEN (portfolio_value - LAG(portfolio_value) OVER (ORDER BY price_date)) / LAG(portfolio_value) OVER (ORDER BY price_date)
                ELSE 0 
            END as daily_return
        FROM portfolio_values
    )
    SELECT json_build_object(
        'returns', json_agg(daily_return ORDER BY price_date),
        'mean_return', AVG(daily_return),
        'volatility', STDDEV(daily_return) * SQRT(252),
        'start_date', MIN(price_date),
        'end_date', MAX(price_date),
        'observations', COUNT(*)
    )
    INTO returns_data
    FROM daily_returns
    WHERE daily_return IS NOT NULL
    AND price_date >= CURRENT_DATE - INTERVAL '1 day' * p_lookback_days;
    
    RETURN COALESCE(returns_data, '{"error": "Insufficient data"}'::json);
END;
$$ LANGUAGE plpgsql;

-- 9. GET CORRELATION DATA
CREATE OR REPLACE FUNCTION app_data.get_correlation(
    p_asset1 VARCHAR(20),
    p_asset2 VARCHAR(20)
) RETURNS DECIMAL(8,6) AS $$
DECLARE
    correlation_value DECIMAL(8,6);
BEGIN
    SELECT correlation INTO correlation_value
    FROM app_data.correlation_matrix
    WHERE (asset1 = p_asset1 AND asset2 = p_asset2)
    OR (asset1 = p_asset2 AND asset2 = p_asset1)
    ORDER BY calculation_date DESC
    LIMIT 1;
    
    RETURN COALESCE(correlation_value, 0.0);
END;
$$ LANGUAGE plpgsql;

-- 10. POPULATE SAMPLE DATA FOR TESTING
CREATE OR REPLACE FUNCTION app_data.populate_sample_market_data() RETURNS TEXT AS $$
BEGIN
    -- Insert sample market data
    INSERT INTO app_data.market_data (symbol, asset_type, price, volume, change_pct) VALUES
    ('AAPL', 'stock', 175.50, 45000000, 1.25),
    ('GOOGL', 'stock', 2800.75, 15000000, -0.50),
    ('MSFT', 'stock', 385.25, 25000000, 0.75),
    ('TSLA', 'stock', 245.80, 35000000, 2.10),
    ('SPY', 'etf', 445.60, 80000000, 0.40);
    
    -- Insert risk-free rates
    INSERT INTO app_data.yield_curve (curve_date, maturity_months, yield_rate, curve_type) VALUES
    (CURRENT_DATE, 1, 5.25, 'treasury'),
    (CURRENT_DATE, 3, 5.15, 'treasury'),
    (CURRENT_DATE, 12, 4.95, 'treasury'),
    (CURRENT_DATE, 24, 4.75, 'treasury'),
    (CURRENT_DATE, 60, 4.65, 'treasury'),
    (CURRENT_DATE, 120, 4.55, 'treasury'),
    (CURRENT_DATE, 360, 4.45, 'treasury');
    
    -- Insert economic indicators
    INSERT INTO app_data.economic_indicators (indicator_name, indicator_code, value, period_date) VALUES
    ('Federal Funds Rate', 'FED_FUNDS', 5.25, CURRENT_DATE),
    ('10-Year Treasury', 'TREASURY_10Y', 4.55, CURRENT_DATE),
    ('VIX', 'VIX', 18.5, CURRENT_DATE);
    
    -- Insert risk parameters
    INSERT INTO app_data.risk_parameters (parameter_name, parameter_value, parameter_type, asset_class) VALUES
    ('confidence_level', 0.95, 'risk_metric', NULL),
    ('time_horizon', 252, 'risk_metric', NULL),
    ('historical_volatility', 0.20, 'volatility', 'stock'),
    ('historical_volatility', 0.15, 'volatility', 'bond'),
    ('historical_volatility', 0.12, 'volatility', 'etf');
    
    -- Insert sample portfolio
    INSERT INTO app_data.portfolio_holdings (symbol, quantity, avg_cost, current_price, market_value, sector, asset_class, weight) VALUES
    ('AAPL', 100, 150.00, 175.50, 17550, 'Technology', 'stock', 35.1),
    ('GOOGL', 10, 2500.00, 2800.75, 28007.5, 'Technology', 'stock', 56.0),
    ('SPY', 25, 420.00, 445.60, 11140, 'Diversified', 'etf', 22.3);
    
    RETURN 'Sample market data populated successfully';
END;
$$ LANGUAGE plpgsql;