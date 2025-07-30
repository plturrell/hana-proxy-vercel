-- Supabase PostgreSQL Migration: Core Analytics Functions
-- Converted from Exasol Lua UDFs
-- Functions 1-9

-- Note: Run 00_create_schema.sql first to create the app_data schema

-- 1. PEARSON CORRELATION CALCULATION
CREATE OR REPLACE FUNCTION app_data.calculate_pearson_correlation(
    x_values JSONB,  -- JSON array of x values
    y_values JSONB   -- JSON array of y values
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    n INTEGER;
    sum_x DOUBLE PRECISION := 0;
    sum_y DOUBLE PRECISION := 0;
    sum_xx DOUBLE PRECISION := 0;
    sum_yy DOUBLE PRECISION := 0;
    sum_xy DOUBLE PRECISION := 0;
    i INTEGER;
    x_val DOUBLE PRECISION;
    y_val DOUBLE PRECISION;
    numerator DOUBLE PRECISION;
    denominator DOUBLE PRECISION;
BEGIN
    -- Check array lengths
    n := jsonb_array_length(x_values);
    IF n != jsonb_array_length(y_values) OR n < 2 THEN
        RETURN NULL;
    END IF;
    
    -- Calculate sums
    FOR i IN 0..n-1 LOOP
        x_val := (x_values->i)::DOUBLE PRECISION;
        y_val := (y_values->i)::DOUBLE PRECISION;
        
        sum_x := sum_x + x_val;
        sum_y := sum_y + y_val;
        sum_xx := sum_xx + x_val * x_val;
        sum_yy := sum_yy + y_val * y_val;
        sum_xy := sum_xy + x_val * y_val;
    END LOOP;
    
    -- Calculate correlation
    numerator := n * sum_xy - sum_x * sum_y;
    denominator := sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y));
    
    IF denominator = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN numerator / denominator;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. VALUE AT RISK CALCULATION
CREATE OR REPLACE FUNCTION app_data.calculate_var(
    returns_json JSONB,          -- JSON array of returns
    confidence_level DOUBLE PRECISION  -- Confidence level (e.g., 0.95)
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    returns_array DOUBLE PRECISION[];
    var_index INTEGER;
    result DOUBLE PRECISION;
BEGIN
    -- Convert JSONB to array
    SELECT ARRAY_AGG((value::text)::DOUBLE PRECISION ORDER BY (value::text)::DOUBLE PRECISION)
    INTO returns_array
    FROM jsonb_array_elements(returns_json) AS value;
    
    -- Calculate VaR index
    var_index := CEIL((1 - confidence_level) * array_length(returns_array, 1));
    
    IF var_index > 0 AND var_index <= array_length(returns_array, 1) THEN
        result := returns_array[var_index];
    ELSE
        result := returns_array[1];
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. MONTE CARLO SIMULATION
CREATE OR REPLACE FUNCTION app_data.monte_carlo_simulation(
    initial_value DOUBLE PRECISION,
    drift DOUBLE PRECISION,
    volatility DOUBLE PRECISION,
    time_horizon DOUBLE PRECISION,
    num_simulations INTEGER
) RETURNS JSONB AS $$
DECLARE
    results JSONB := '[]'::jsonb;
    i INTEGER;
    random_shock DOUBLE PRECISION;
    simulated_value DOUBLE PRECISION;
BEGIN
    FOR i IN 1..num_simulations LOOP
        -- Generate random shock (Box-Muller transform for normal distribution)
        random_shock := sqrt(-2 * ln(random())) * cos(2 * pi() * random());
        
        -- Calculate simulated value using geometric Brownian motion
        simulated_value := initial_value * exp(
            (drift - 0.5 * volatility * volatility) * time_horizon + 
            volatility * sqrt(time_horizon) * random_shock
        );
        
        results := results || jsonb_build_object(
            'simulation', i,
            'value', simulated_value
        );
    END LOOP;
    
    RETURN results;
END;
$$ LANGUAGE plpgsql;

-- 4. EXPONENTIAL MOVING AVERAGE
CREATE OR REPLACE FUNCTION app_data.calculate_ema(
    values_json JSONB,
    period INTEGER
) RETURNS JSONB AS $$
DECLARE
    values_array DOUBLE PRECISION[];
    ema_array DOUBLE PRECISION[];
    alpha DOUBLE PRECISION;
    i INTEGER;
    result JSONB := '[]'::jsonb;
BEGIN
    -- Convert JSONB to array
    SELECT ARRAY_AGG((value::text)::DOUBLE PRECISION)
    INTO values_array
    FROM jsonb_array_elements(values_json) AS value;
    
    IF array_length(values_array, 1) < period THEN
        RETURN NULL;
    END IF;
    
    -- Calculate smoothing factor
    alpha := 2.0 / (period + 1);
    
    -- Initialize with SMA for first period
    ema_array := ARRAY[
        (SELECT AVG(val) FROM unnest(values_array[1:period]) AS val)
    ];
    
    -- Calculate EMA for remaining values
    FOR i IN period + 1..array_length(values_array, 1) LOOP
        ema_array := array_append(
            ema_array,
            alpha * values_array[i] + (1 - alpha) * ema_array[array_length(ema_array, 1)]
        );
    END LOOP;
    
    -- Convert to JSONB
    SELECT jsonb_agg(val)
    INTO result
    FROM unnest(ema_array) AS val;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. PORTFOLIO OPTIMIZATION (SHARPE RATIO)
CREATE OR REPLACE FUNCTION app_data.optimize_portfolio_sharpe(
    returns_matrix JSONB,  -- Matrix of returns for each asset
    risk_free_rate DOUBLE PRECISION
) RETURNS JSONB AS $$
DECLARE
    num_assets INTEGER;
    mean_returns DOUBLE PRECISION[];
    cov_matrix DOUBLE PRECISION[][];
    weights DOUBLE PRECISION[];
    portfolio_return DOUBLE PRECISION;
    portfolio_risk DOUBLE PRECISION;
    sharpe_ratio DOUBLE PRECISION;
    i INTEGER;
    j INTEGER;
BEGIN
    -- Get number of assets
    num_assets := jsonb_array_length(returns_matrix);
    
    -- Initialize equal weights
    FOR i IN 1..num_assets LOOP
        weights[i] := 1.0 / num_assets;
    END LOOP;
    
    -- Calculate mean returns for each asset
    FOR i IN 0..num_assets-1 LOOP
        SELECT AVG((value::text)::DOUBLE PRECISION)
        INTO mean_returns[i+1]
        FROM jsonb_array_elements(returns_matrix->i) AS value;
    END LOOP;
    
    -- Calculate portfolio metrics
    portfolio_return := 0;
    FOR i IN 1..num_assets LOOP
        portfolio_return := portfolio_return + weights[i] * mean_returns[i];
    END LOOP;
    
    -- Simplified risk calculation (assumes uncorrelated assets)
    portfolio_risk := 0;
    FOR i IN 1..num_assets LOOP
        portfolio_risk := portfolio_risk + power(weights[i], 2) * 0.02; -- Assumed volatility
    END LOOP;
    portfolio_risk := sqrt(portfolio_risk);
    
    -- Calculate Sharpe ratio
    IF portfolio_risk > 0 THEN
        sharpe_ratio := (portfolio_return - risk_free_rate) / portfolio_risk;
    ELSE
        sharpe_ratio := 0;
    END IF;
    
    RETURN jsonb_build_object(
        'weights', weights,
        'expected_return', portfolio_return,
        'risk', portfolio_risk,
        'sharpe_ratio', sharpe_ratio
    );
END;
$$ LANGUAGE plpgsql;

-- 6. TIME SERIES FORECASTING (SIMPLE EXPONENTIAL SMOOTHING)
CREATE OR REPLACE FUNCTION app_data.forecast_time_series(
    historical_data JSONB,
    alpha DOUBLE PRECISION,  -- Smoothing parameter (0-1)
    periods_ahead INTEGER
) RETURNS JSONB AS $$
DECLARE
    values_array DOUBLE PRECISION[];
    smoothed_value DOUBLE PRECISION;
    forecasts JSONB := '[]'::jsonb;
    i INTEGER;
BEGIN
    -- Convert JSONB to array
    SELECT ARRAY_AGG((value::text)::DOUBLE PRECISION)
    INTO values_array
    FROM jsonb_array_elements(historical_data) AS value;
    
    -- Initialize with first value
    smoothed_value := values_array[1];
    
    -- Apply exponential smoothing to historical data
    FOR i IN 2..array_length(values_array, 1) LOOP
        smoothed_value := alpha * values_array[i] + (1 - alpha) * smoothed_value;
    END LOOP;
    
    -- Generate forecasts
    FOR i IN 1..periods_ahead LOOP
        forecasts := forecasts || jsonb_build_object(
            'period', i,
            'forecast', smoothed_value
        );
    END LOOP;
    
    RETURN forecasts;
END;
$$ LANGUAGE plpgsql;

-- 7. ANOMALY DETECTION (Z-SCORE METHOD)
CREATE OR REPLACE FUNCTION app_data.detect_anomalies(
    data_points JSONB,
    threshold DOUBLE PRECISION DEFAULT 3.0
) RETURNS JSONB AS $$
DECLARE
    values_array DOUBLE PRECISION[];
    mean_val DOUBLE PRECISION;
    stddev_val DOUBLE PRECISION;
    anomalies JSONB := '[]'::jsonb;
    z_score DOUBLE PRECISION;
    i INTEGER;
BEGIN
    -- Convert JSONB to array
    SELECT ARRAY_AGG((value::text)::DOUBLE PRECISION)
    INTO values_array
    FROM jsonb_array_elements(data_points) AS value;
    
    -- Calculate mean and standard deviation
    SELECT AVG(val), STDDEV(val)
    INTO mean_val, stddev_val
    FROM unnest(values_array) AS val;
    
    IF stddev_val = 0 THEN
        RETURN anomalies;
    END IF;
    
    -- Detect anomalies
    FOR i IN 1..array_length(values_array, 1) LOOP
        z_score := ABS((values_array[i] - mean_val) / stddev_val);
        
        IF z_score > threshold THEN
            anomalies := anomalies || jsonb_build_object(
                'index', i - 1,
                'value', values_array[i],
                'z_score', z_score
            );
        END IF;
    END LOOP;
    
    RETURN anomalies;
END;
$$ LANGUAGE plpgsql;

-- 8. CALCULATE BETA (MARKET SENSITIVITY)
CREATE OR REPLACE FUNCTION app_data.calculate_beta(
    stock_returns JSONB,
    market_returns JSONB
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    covariance DOUBLE PRECISION;
    market_variance DOUBLE PRECISION;
    n INTEGER;
    stock_array DOUBLE PRECISION[];
    market_array DOUBLE PRECISION[];
    stock_mean DOUBLE PRECISION;
    market_mean DOUBLE PRECISION;
    i INTEGER;
BEGIN
    -- Convert JSONB to arrays
    SELECT ARRAY_AGG((value::text)::DOUBLE PRECISION)
    INTO stock_array
    FROM jsonb_array_elements(stock_returns) AS value;
    
    SELECT ARRAY_AGG((value::text)::DOUBLE PRECISION)
    INTO market_array
    FROM jsonb_array_elements(market_returns) AS value;
    
    n := array_length(stock_array, 1);
    
    IF n != array_length(market_array, 1) OR n < 2 THEN
        RETURN NULL;
    END IF;
    
    -- Calculate means
    SELECT AVG(val) INTO stock_mean FROM unnest(stock_array) AS val;
    SELECT AVG(val) INTO market_mean FROM unnest(market_array) AS val;
    
    -- Calculate covariance and market variance
    covariance := 0;
    market_variance := 0;
    
    FOR i IN 1..n LOOP
        covariance := covariance + (stock_array[i] - stock_mean) * (market_array[i] - market_mean);
        market_variance := market_variance + power(market_array[i] - market_mean, 2);
    END LOOP;
    
    covariance := covariance / (n - 1);
    market_variance := market_variance / (n - 1);
    
    IF market_variance = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN covariance / market_variance;
END;
$$ LANGUAGE plpgsql;

-- 9. CALCULATE FINANCIAL RATIOS
CREATE OR REPLACE FUNCTION app_data.calculate_financial_ratios(
    financial_data JSONB
) RETURNS JSONB AS $$
DECLARE
    current_assets DOUBLE PRECISION;
    current_liabilities DOUBLE PRECISION;
    total_debt DOUBLE PRECISION;
    total_equity DOUBLE PRECISION;
    net_income DOUBLE PRECISION;
    revenue DOUBLE PRECISION;
    total_assets DOUBLE PRECISION;
BEGIN
    -- Extract financial values
    current_assets := (financial_data->>'current_assets')::DOUBLE PRECISION;
    current_liabilities := (financial_data->>'current_liabilities')::DOUBLE PRECISION;
    total_debt := (financial_data->>'total_debt')::DOUBLE PRECISION;
    total_equity := (financial_data->>'total_equity')::DOUBLE PRECISION;
    net_income := (financial_data->>'net_income')::DOUBLE PRECISION;
    revenue := (financial_data->>'revenue')::DOUBLE PRECISION;
    total_assets := (financial_data->>'total_assets')::DOUBLE PRECISION;
    
    RETURN jsonb_build_object(
        'current_ratio', CASE WHEN current_liabilities > 0 
            THEN current_assets / current_liabilities ELSE NULL END,
        'debt_to_equity', CASE WHEN total_equity > 0 
            THEN total_debt / total_equity ELSE NULL END,
        'profit_margin', CASE WHEN revenue > 0 
            THEN net_income / revenue ELSE NULL END,
        'return_on_assets', CASE WHEN total_assets > 0 
            THEN net_income / total_assets ELSE NULL END,
        'return_on_equity', CASE WHEN total_equity > 0 
            THEN net_income / total_equity ELSE NULL END
    );
END;
$$ LANGUAGE plpgsql;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_data_timestamp ON financial_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio_holdings(user_id);