-- Supabase PostgreSQL Migration: Advanced Analytics Functions
-- Converted from Exasol Lua UDFs (Functions 19-32)

-- 19. KNOWLEDGE GRAPH SIMILARITY CALCULATION
CREATE OR REPLACE FUNCTION app_data.calculate_entity_similarity(
    entity1_features JSONB,
    entity2_features JSONB,
    similarity_type TEXT DEFAULT 'cosine'
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    dot_product DOUBLE PRECISION := 0;
    norm1 DOUBLE PRECISION := 0;
    norm2 DOUBLE PRECISION := 0;
    i INTEGER;
    val1 DOUBLE PRECISION;
    val2 DOUBLE PRECISION;
    result DOUBLE PRECISION;
BEGIN
    -- Ensure arrays have same length
    IF jsonb_array_length(entity1_features) != jsonb_array_length(entity2_features) THEN
        RETURN NULL;
    END IF;
    
    -- Calculate based on similarity type
    CASE similarity_type
        WHEN 'cosine' THEN
            -- Calculate cosine similarity
            FOR i IN 0..jsonb_array_length(entity1_features)-1 LOOP
                val1 := (entity1_features->i)::DOUBLE PRECISION;
                val2 := (entity2_features->i)::DOUBLE PRECISION;
                
                dot_product := dot_product + val1 * val2;
                norm1 := norm1 + val1 * val1;
                norm2 := norm2 + val2 * val2;
            END LOOP;
            
            IF norm1 = 0 OR norm2 = 0 THEN
                result := 0;
            ELSE
                result := dot_product / (sqrt(norm1) * sqrt(norm2));
            END IF;
            
        WHEN 'euclidean' THEN
            -- Calculate inverse Euclidean distance
            FOR i IN 0..jsonb_array_length(entity1_features)-1 LOOP
                val1 := (entity1_features->i)::DOUBLE PRECISION;
                val2 := (entity2_features->i)::DOUBLE PRECISION;
                
                dot_product := dot_product + power(val1 - val2, 2);
            END LOOP;
            
            result := 1.0 / (1.0 + sqrt(dot_product));
            
        ELSE
            result := NULL;
    END CASE;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 20. SENTIMENT ANALYSIS SCORING
CREATE OR REPLACE FUNCTION app_data.calculate_sentiment_score(
    text_features JSONB,  -- Pre-processed text features
    sentiment_weights JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    positive_score DOUBLE PRECISION := 0;
    negative_score DOUBLE PRECISION := 0;
    neutral_score DOUBLE PRECISION := 0;
    total_score DOUBLE PRECISION;
    i INTEGER;
    feature JSONB;
    word TEXT;
    weight DOUBLE PRECISION;
BEGIN
    -- Use default weights if not provided
    IF sentiment_weights IS NULL THEN
        sentiment_weights := '{
            "excellent": 2.0, "good": 1.5, "positive": 1.0, "bullish": 1.5,
            "terrible": -2.0, "bad": -1.5, "negative": -1.0, "bearish": -1.5,
            "neutral": 0.0, "uncertain": -0.2
        }'::jsonb;
    END IF;
    
    -- Process each feature
    FOR i IN 0..jsonb_array_length(text_features)-1 LOOP
        feature := text_features->i;
        word := feature->>'word';
        
        IF sentiment_weights ? word THEN
            weight := (sentiment_weights->>word)::DOUBLE PRECISION;
            
            IF weight > 0 THEN
                positive_score := positive_score + weight;
            ELSIF weight < 0 THEN
                negative_score := negative_score + ABS(weight);
            ELSE
                neutral_score := neutral_score + 1;
            END IF;
        END IF;
    END LOOP;
    
    total_score := positive_score + negative_score + neutral_score;
    
    IF total_score = 0 THEN
        total_score := 1;
    END IF;
    
    RETURN jsonb_build_object(
        'positive_ratio', positive_score / total_score,
        'negative_ratio', negative_score / total_score,
        'neutral_ratio', neutral_score / total_score,
        'compound_score', (positive_score - negative_score) / total_score
    );
END;
$$ LANGUAGE plpgsql;

-- 21. TREASURY YIELD CURVE INTERPOLATION
CREATE OR REPLACE FUNCTION app_data.interpolate_yield_curve(
    maturities JSONB,  -- Array of maturity points (in years)
    yields JSONB,      -- Array of corresponding yields
    target_maturity DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    n INTEGER;
    i INTEGER;
    x1 DOUBLE PRECISION;
    x2 DOUBLE PRECISION;
    y1 DOUBLE PRECISION;
    y2 DOUBLE PRECISION;
BEGIN
    n := jsonb_array_length(maturities);
    
    -- Check if target is outside range
    IF target_maturity <= (maturities->0)::DOUBLE PRECISION THEN
        RETURN (yields->0)::DOUBLE PRECISION;
    END IF;
    
    IF target_maturity >= (maturities->>(n-1))::DOUBLE PRECISION THEN
        RETURN (yields->>(n-1))::DOUBLE PRECISION;
    END IF;
    
    -- Find interpolation points
    FOR i IN 0..n-2 LOOP
        x1 := (maturities->i)::DOUBLE PRECISION;
        x2 := (maturities->(i+1))::DOUBLE PRECISION;
        
        IF target_maturity >= x1 AND target_maturity <= x2 THEN
            y1 := (yields->i)::DOUBLE PRECISION;
            y2 := (yields->(i+1))::DOUBLE PRECISION;
            
            -- Linear interpolation
            RETURN y1 + (y2 - y1) * (target_maturity - x1) / (x2 - x1);
        END IF;
    END LOOP;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 22. CALCULATE BOND DURATION
CREATE OR REPLACE FUNCTION app_data.calculate_bond_duration(
    face_value DOUBLE PRECISION,
    coupon_rate DOUBLE PRECISION,
    years_to_maturity DOUBLE PRECISION,
    yield_to_maturity DOUBLE PRECISION,
    frequency INTEGER DEFAULT 2  -- Semi-annual payments
) RETURNS JSONB AS $$
DECLARE
    coupon_payment DOUBLE PRECISION;
    present_value DOUBLE PRECISION := 0;
    weighted_time DOUBLE PRECISION := 0;
    period_yield DOUBLE PRECISION;
    time DOUBLE PRECISION;
    cash_flow DOUBLE PRECISION;
    discount_factor DOUBLE PRECISION;
    pv_cash_flow DOUBLE PRECISION;
    i INTEGER;
    num_periods INTEGER;
    macaulay_duration DOUBLE PRECISION;
    modified_duration DOUBLE PRECISION;
BEGIN
    coupon_payment := face_value * coupon_rate / frequency;
    period_yield := yield_to_maturity / frequency;
    num_periods := years_to_maturity * frequency;
    
    -- Calculate present value and weighted time
    FOR i IN 1..num_periods LOOP
        time := i::DOUBLE PRECISION / frequency;
        
        IF i < num_periods THEN
            cash_flow := coupon_payment;
        ELSE
            cash_flow := coupon_payment + face_value;
        END IF;
        
        discount_factor := power(1 + period_yield, -i);
        pv_cash_flow := cash_flow * discount_factor;
        
        present_value := present_value + pv_cash_flow;
        weighted_time := weighted_time + time * pv_cash_flow;
    END LOOP;
    
    -- Calculate durations
    macaulay_duration := weighted_time / present_value;
    modified_duration := macaulay_duration / (1 + period_yield);
    
    RETURN jsonb_build_object(
        'macaulay_duration', macaulay_duration,
        'modified_duration', modified_duration,
        'present_value', present_value,
        'convexity', macaulay_duration * (macaulay_duration + 1) / power(1 + period_yield, 2)
    );
END;
$$ LANGUAGE plpgsql;

-- 23. NEWS IMPACT SCORING
CREATE OR REPLACE FUNCTION app_data.calculate_news_impact(
    sentiment_score DOUBLE PRECISION,
    entity_relevance DOUBLE PRECISION,
    source_credibility DOUBLE PRECISION,
    time_decay_hours DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    base_impact DOUBLE PRECISION;
    time_factor DOUBLE PRECISION;
    final_impact DOUBLE PRECISION;
BEGIN
    -- Calculate base impact
    base_impact := ABS(sentiment_score) * entity_relevance * source_credibility;
    
    -- Apply time decay (exponential decay)
    time_factor := exp(-0.1 * time_decay_hours / 24.0);  -- Decay rate of 0.1 per day
    
    -- Calculate final impact
    final_impact := base_impact * time_factor;
    
    -- Apply sign based on sentiment
    IF sentiment_score < 0 THEN
        final_impact := -final_impact;
    END IF;
    
    RETURN final_impact;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 24. DATA QUALITY SCORE CALCULATION
CREATE OR REPLACE FUNCTION app_data.calculate_data_quality_score(
    completeness_ratio DOUBLE PRECISION,
    accuracy_score DOUBLE PRECISION,
    consistency_score DOUBLE PRECISION,
    timeliness_hours DOUBLE PRECISION
) RETURNS JSONB AS $$
DECLARE
    timeliness_score DOUBLE PRECISION;
    overall_score DOUBLE PRECISION;
    quality_grade TEXT;
BEGIN
    -- Calculate timeliness score (decay function)
    timeliness_score := CASE
        WHEN timeliness_hours <= 1 THEN 1.0
        WHEN timeliness_hours <= 24 THEN 0.9
        WHEN timeliness_hours <= 168 THEN 0.7  -- 1 week
        WHEN timeliness_hours <= 720 THEN 0.5  -- 1 month
        ELSE 0.3
    END;
    
    -- Calculate weighted overall score
    overall_score := (
        completeness_ratio * 0.3 +
        accuracy_score * 0.3 +
        consistency_score * 0.2 +
        timeliness_score * 0.2
    );
    
    -- Assign quality grade
    quality_grade := CASE
        WHEN overall_score >= 0.9 THEN 'A'
        WHEN overall_score >= 0.8 THEN 'B'
        WHEN overall_score >= 0.7 THEN 'C'
        WHEN overall_score >= 0.6 THEN 'D'
        ELSE 'F'
    END;
    
    RETURN jsonb_build_object(
        'overall_score', overall_score,
        'quality_grade', quality_grade,
        'completeness', completeness_ratio,
        'accuracy', accuracy_score,
        'consistency', consistency_score,
        'timeliness', timeliness_score
    );
END;
$$ LANGUAGE plpgsql;

-- 25. BATCH PROCESSING OPTIMIZER
CREATE OR REPLACE FUNCTION app_data.optimize_batch_processing(
    total_records INTEGER,
    available_memory_mb INTEGER,
    record_size_bytes INTEGER,
    processing_time_ms DOUBLE PRECISION
) RETURNS JSONB AS $$
DECLARE
    memory_per_record_mb DOUBLE PRECISION;
    max_batch_by_memory INTEGER;
    optimal_batch_size INTEGER;
    num_batches INTEGER;
    estimated_total_time DOUBLE PRECISION;
BEGIN
    -- Calculate memory constraints
    memory_per_record_mb := record_size_bytes / 1048576.0;  -- Convert to MB
    max_batch_by_memory := FLOOR(available_memory_mb * 0.8 / memory_per_record_mb);  -- Use 80% of available memory
    
    -- Calculate optimal batch size (balance between memory and processing efficiency)
    optimal_batch_size := LEAST(
        max_batch_by_memory,
        GREATEST(
            100,  -- Minimum batch size
            LEAST(
                10000,  -- Maximum batch size
                CEIL(sqrt(total_records::DOUBLE PRECISION))  -- Square root heuristic
            )
        )
    );
    
    -- Calculate batching metrics
    num_batches := CEIL(total_records::DOUBLE PRECISION / optimal_batch_size);
    estimated_total_time := num_batches * optimal_batch_size * processing_time_ms / 1000.0;  -- Convert to seconds
    
    RETURN jsonb_build_object(
        'optimal_batch_size', optimal_batch_size,
        'num_batches', num_batches,
        'estimated_time_seconds', estimated_total_time,
        'memory_usage_mb', optimal_batch_size * memory_per_record_mb,
        'memory_utilization', (optimal_batch_size * memory_per_record_mb) / available_memory_mb
    );
END;
$$ LANGUAGE plpgsql;

-- 26. CALCULATE PORTFOLIO RISK METRICS
CREATE OR REPLACE FUNCTION app_data.calculate_portfolio_risk(
    returns_history JSONB,
    confidence_level DOUBLE PRECISION DEFAULT 0.95
) RETURNS JSONB AS $$
DECLARE
    returns_array DOUBLE PRECISION[];
    mean_return DOUBLE PRECISION;
    volatility DOUBLE PRECISION;
    var_value DOUBLE PRECISION;
    cvar_value DOUBLE PRECISION;
    sharpe_ratio DOUBLE PRECISION;
    max_drawdown DOUBLE PRECISION;
    current_drawdown DOUBLE PRECISION;
    peak_value DOUBLE PRECISION := 0;
    i INTEGER;
    current_value DOUBLE PRECISION := 1;
    risk_free_rate DOUBLE PRECISION := 0.02;  -- Assume 2% risk-free rate
BEGIN
    -- Convert JSONB to array
    SELECT ARRAY_AGG((value::text)::DOUBLE PRECISION)
    INTO returns_array
    FROM jsonb_array_elements(returns_history) AS value;
    
    -- Calculate basic statistics
    SELECT AVG(val), STDDEV(val)
    INTO mean_return, volatility
    FROM unnest(returns_array) AS val;
    
    -- Calculate VaR
    var_value := app_data.calculate_var(returns_history, confidence_level);
    
    -- Calculate CVaR (Conditional VaR)
    SELECT AVG(val)
    INTO cvar_value
    FROM unnest(returns_array) AS val
    WHERE val <= var_value;
    
    -- Calculate Sharpe ratio
    IF volatility > 0 THEN
        sharpe_ratio := (mean_return - risk_free_rate) / volatility;
    ELSE
        sharpe_ratio := 0;
    END IF;
    
    -- Calculate maximum drawdown
    max_drawdown := 0;
    FOR i IN 1..array_length(returns_array, 1) LOOP
        current_value := current_value * (1 + returns_array[i]);
        
        IF current_value > peak_value THEN
            peak_value := current_value;
        END IF;
        
        current_drawdown := (peak_value - current_value) / peak_value;
        IF current_drawdown > max_drawdown THEN
            max_drawdown := current_drawdown;
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object(
        'mean_return', mean_return,
        'volatility', volatility,
        'value_at_risk', var_value,
        'conditional_var', cvar_value,
        'sharpe_ratio', sharpe_ratio,
        'max_drawdown', max_drawdown
    );
END;
$$ LANGUAGE plpgsql;

-- 27. MARKET REGIME DETECTION
CREATE OR REPLACE FUNCTION app_data.detect_market_regime(
    price_data JSONB,
    volume_data JSONB,
    volatility_threshold DOUBLE PRECISION DEFAULT 0.02
) RETURNS TEXT AS $$
DECLARE
    prices DOUBLE PRECISION[];
    volumes DOUBLE PRECISION[];
    returns DOUBLE PRECISION[];
    avg_return DOUBLE PRECISION;
    volatility DOUBLE PRECISION;
    avg_volume DOUBLE PRECISION;
    recent_avg_volume DOUBLE PRECISION;
    trend_strength DOUBLE PRECISION;
    i INTEGER;
    regime TEXT;
BEGIN
    -- Convert JSONB to arrays
    SELECT ARRAY_AGG((value::text)::DOUBLE PRECISION)
    INTO prices
    FROM jsonb_array_elements(price_data) AS value;
    
    SELECT ARRAY_AGG((value::text)::DOUBLE PRECISION)
    INTO volumes
    FROM jsonb_array_elements(volume_data) AS value;
    
    -- Calculate returns
    FOR i IN 2..array_length(prices, 1) LOOP
        returns := array_append(returns, (prices[i] - prices[i-1]) / prices[i-1]);
    END LOOP;
    
    -- Calculate metrics
    SELECT AVG(val), STDDEV(val)
    INTO avg_return, volatility
    FROM unnest(returns) AS val;
    
    SELECT AVG(val)
    INTO avg_volume
    FROM unnest(volumes) AS val;
    
    -- Recent volume (last 20% of data)
    SELECT AVG(val)
    INTO recent_avg_volume
    FROM unnest(volumes[GREATEST(1, array_length(volumes, 1) - array_length(volumes, 1) / 5):array_length(volumes, 1)]) AS val;
    
    -- Determine regime
    IF volatility > volatility_threshold THEN
        IF avg_return > 0 THEN
            regime := 'volatile_bull';
        ELSE
            regime := 'volatile_bear';
        END IF;
    ELSE
        IF avg_return > 0.001 THEN
            regime := 'trending_bull';
        ELSIF avg_return < -0.001 THEN
            regime := 'trending_bear';
        ELSE
            regime := 'range_bound';
        END IF;
    END IF;
    
    -- Check for high volume
    IF recent_avg_volume > avg_volume * 1.5 THEN
        regime := regime || '_high_volume';
    END IF;
    
    RETURN regime;
END;
$$ LANGUAGE plpgsql;

-- 28. OPTION PRICING (BLACK-SCHOLES)
CREATE OR REPLACE FUNCTION app_data.black_scholes_option_price(
    spot_price DOUBLE PRECISION,
    strike_price DOUBLE PRECISION,
    time_to_expiry DOUBLE PRECISION,  -- In years
    risk_free_rate DOUBLE PRECISION,
    volatility DOUBLE PRECISION,
    option_type TEXT  -- 'call' or 'put'
) RETURNS JSONB AS $$
DECLARE
    d1 DOUBLE PRECISION;
    d2 DOUBLE PRECISION;
    nd1 DOUBLE PRECISION;
    nd2 DOUBLE PRECISION;
    option_price DOUBLE PRECISION;
    delta DOUBLE PRECISION;
    gamma DOUBLE PRECISION;
    theta DOUBLE PRECISION;
    vega DOUBLE PRECISION;
    rho DOUBLE PRECISION;
BEGIN
    -- Calculate d1 and d2
    d1 := (ln(spot_price / strike_price) + (risk_free_rate + volatility * volatility / 2) * time_to_expiry) / 
          (volatility * sqrt(time_to_expiry));
    d2 := d1 - volatility * sqrt(time_to_expiry);
    
    -- Normal CDF approximation (using error function)
    nd1 := 0.5 * (1 + erf(d1 / sqrt(2)));
    nd2 := 0.5 * (1 + erf(d2 / sqrt(2)));
    
    -- Calculate option price and Greeks
    IF lower(option_type) = 'call' THEN
        option_price := spot_price * nd1 - strike_price * exp(-risk_free_rate * time_to_expiry) * nd2;
        delta := nd1;
        rho := strike_price * time_to_expiry * exp(-risk_free_rate * time_to_expiry) * nd2 / 100;
    ELSE  -- put option
        option_price := strike_price * exp(-risk_free_rate * time_to_expiry) * (1 - nd2) - spot_price * (1 - nd1);
        delta := nd1 - 1;
        rho := -strike_price * time_to_expiry * exp(-risk_free_rate * time_to_expiry) * (1 - nd2) / 100;
    END IF;
    
    -- Calculate common Greeks
    gamma := exp(-d1 * d1 / 2) / (spot_price * volatility * sqrt(2 * pi() * time_to_expiry));
    theta := -(spot_price * exp(-d1 * d1 / 2) * volatility) / (2 * sqrt(2 * pi() * time_to_expiry)) / 365;
    vega := spot_price * exp(-d1 * d1 / 2) * sqrt(time_to_expiry / (2 * pi())) / 100;
    
    RETURN jsonb_build_object(
        'price', option_price,
        'delta', delta,
        'gamma', gamma,
        'theta', theta,
        'vega', vega,
        'rho', rho,
        'intrinsic_value', GREATEST(0, 
            CASE WHEN lower(option_type) = 'call' 
                THEN spot_price - strike_price 
                ELSE strike_price - spot_price 
            END
        ),
        'time_value', option_price - GREATEST(0, 
            CASE WHEN lower(option_type) = 'call' 
                THEN spot_price - strike_price 
                ELSE strike_price - spot_price 
            END
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 29. TECHNICAL INDICATOR: RSI (Relative Strength Index)
CREATE OR REPLACE FUNCTION app_data.calculate_rsi(
    price_data JSONB,
    period INTEGER DEFAULT 14
) RETURNS JSONB AS $$
DECLARE
    prices DOUBLE PRECISION[];
    gains DOUBLE PRECISION[];
    losses DOUBLE PRECISION[];
    avg_gain DOUBLE PRECISION;
    avg_loss DOUBLE PRECISION;
    rs DOUBLE PRECISION;
    rsi DOUBLE PRECISION;
    rsi_values JSONB := '[]'::jsonb;
    i INTEGER;
    price_change DOUBLE PRECISION;
BEGIN
    -- Convert JSONB to array
    SELECT ARRAY_AGG((value::text)::DOUBLE PRECISION)
    INTO prices
    FROM jsonb_array_elements(price_data) AS value;
    
    IF array_length(prices, 1) < period + 1 THEN
        RETURN NULL;
    END IF;
    
    -- Calculate initial average gain and loss
    FOR i IN 2..period + 1 LOOP
        price_change := prices[i] - prices[i-1];
        IF price_change > 0 THEN
            gains := array_append(gains, price_change);
            losses := array_append(losses, 0);
        ELSE
            gains := array_append(gains, 0);
            losses := array_append(losses, ABS(price_change));
        END IF;
    END LOOP;
    
    SELECT AVG(val) INTO avg_gain FROM unnest(gains) AS val;
    SELECT AVG(val) INTO avg_loss FROM unnest(losses) AS val;
    
    -- Calculate RSI for each subsequent period
    FOR i IN period + 2..array_length(prices, 1) LOOP
        price_change := prices[i] - prices[i-1];
        
        IF price_change > 0 THEN
            avg_gain := (avg_gain * (period - 1) + price_change) / period;
            avg_loss := (avg_loss * (period - 1)) / period;
        ELSE
            avg_gain := (avg_gain * (period - 1)) / period;
            avg_loss := (avg_loss * (period - 1) + ABS(price_change)) / period;
        END IF;
        
        IF avg_loss = 0 THEN
            rsi := 100;
        ELSE
            rs := avg_gain / avg_loss;
            rsi := 100 - (100 / (1 + rs));
        END IF;
        
        rsi_values := rsi_values || to_jsonb(rsi);
    END LOOP;
    
    RETURN rsi_values;
END;
$$ LANGUAGE plpgsql;

-- 30. TECHNICAL INDICATOR: MACD
CREATE OR REPLACE FUNCTION app_data.calculate_macd(
    price_data JSONB,
    fast_period INTEGER DEFAULT 12,
    slow_period INTEGER DEFAULT 26,
    signal_period INTEGER DEFAULT 9
) RETURNS JSONB AS $$
DECLARE
    fast_ema JSONB;
    slow_ema JSONB;
    macd_line DOUBLE PRECISION[];
    signal_line JSONB;
    histogram DOUBLE PRECISION[];
    i INTEGER;
    fast_val DOUBLE PRECISION;
    slow_val DOUBLE PRECISION;
    macd_val DOUBLE PRECISION;
    signal_val DOUBLE PRECISION;
BEGIN
    -- Calculate EMAs
    fast_ema := app_data.calculate_ema(price_data, fast_period);
    slow_ema := app_data.calculate_ema(price_data, slow_period);
    
    -- Calculate MACD line
    FOR i IN 0..jsonb_array_length(fast_ema)-1 LOOP
        IF i < jsonb_array_length(slow_ema) THEN
            fast_val := (fast_ema->i)::DOUBLE PRECISION;
            slow_val := (slow_ema->i)::DOUBLE PRECISION;
            macd_line := array_append(macd_line, fast_val - slow_val);
        END IF;
    END LOOP;
    
    -- Calculate signal line (EMA of MACD)
    signal_line := app_data.calculate_ema(to_jsonb(macd_line), signal_period);
    
    -- Calculate histogram
    FOR i IN 0..jsonb_array_length(signal_line)-1 LOOP
        macd_val := macd_line[i + 1];
        signal_val := (signal_line->i)::DOUBLE PRECISION;
        histogram := array_append(histogram, macd_val - signal_val);
    END LOOP;
    
    RETURN jsonb_build_object(
        'macd_line', macd_line,
        'signal_line', signal_line,
        'histogram', histogram
    );
END;
$$ LANGUAGE plpgsql;

-- 31. COMPLEX EVENT PROCESSING
CREATE OR REPLACE FUNCTION app_data.detect_complex_event(
    event_stream JSONB,
    pattern_type TEXT,
    threshold DOUBLE PRECISION DEFAULT 0.05
) RETURNS JSONB AS $$
DECLARE
    events JSONB[];
    detected_patterns JSONB := '[]'::jsonb;
    i INTEGER;
    j INTEGER;
    event1 JSONB;
    event2 JSONB;
    event3 JSONB;
    price1 DOUBLE PRECISION;
    price2 DOUBLE PRECISION;
    price3 DOUBLE PRECISION;
    time1 TIMESTAMP;
    time2 TIMESTAMP;
    time3 TIMESTAMP;
BEGIN
    -- Convert event stream to array
    FOR i IN 0..jsonb_array_length(event_stream)-1 LOOP
        events := array_append(events, event_stream->i);
    END LOOP;
    
    CASE pattern_type
        WHEN 'double_top' THEN
            -- Detect double top pattern
            FOR i IN 2..array_length(events, 1)-1 LOOP
                event1 := events[i-1];
                event2 := events[i];
                event3 := events[i+1];
                
                price1 := (event1->>'price')::DOUBLE PRECISION;
                price2 := (event2->>'price')::DOUBLE PRECISION;
                price3 := (event3->>'price')::DOUBLE PRECISION;
                
                -- Check if middle point is a peak
                IF price2 > price1 AND price2 > price3 THEN
                    -- Look for similar peak
                    FOR j IN i+2..LEAST(i+20, array_length(events, 1)) LOOP
                        IF ABS((events[j]->>'price')::DOUBLE PRECISION - price2) / price2 < threshold THEN
                            detected_patterns := detected_patterns || jsonb_build_object(
                                'pattern', 'double_top',
                                'peak1_index', i-1,
                                'peak2_index', j-1,
                                'peak_price', price2
                            );
                            EXIT;
                        END IF;
                    END LOOP;
                END IF;
            END LOOP;
            
        WHEN 'breakout' THEN
            -- Detect price breakouts
            FOR i IN 21..array_length(events, 1) LOOP
                price1 := (events[i]->>'price')::DOUBLE PRECISION;
                
                -- Calculate 20-period high/low
                DECLARE
                    max_price DOUBLE PRECISION := 0;
                    min_price DOUBLE PRECISION := 999999;
                    k INTEGER;
                BEGIN
                    FOR k IN i-20..i-1 LOOP
                        price2 := (events[k]->>'price')::DOUBLE PRECISION;
                        IF price2 > max_price THEN max_price := price2; END IF;
                        IF price2 < min_price THEN min_price := price2; END IF;
                    END LOOP;
                    
                    IF price1 > max_price * (1 + threshold) THEN
                        detected_patterns := detected_patterns || jsonb_build_object(
                            'pattern', 'breakout_up',
                            'index', i-1,
                            'price', price1,
                            'previous_high', max_price
                        );
                    ELSIF price1 < min_price * (1 - threshold) THEN
                        detected_patterns := detected_patterns || jsonb_build_object(
                            'pattern', 'breakout_down',
                            'index', i-1,
                            'price', price1,
                            'previous_low', min_price
                        );
                    END IF;
                END;
            END LOOP;
            
        ELSE
            -- Unknown pattern type
            NULL;
    END CASE;
    
    RETURN detected_patterns;
END;
$$ LANGUAGE plpgsql;

-- 32. ADVANCED PERFORMANCE ANALYTICS
CREATE OR REPLACE FUNCTION app_data.calculate_performance_attribution(
    portfolio_returns JSONB,
    benchmark_returns JSONB,
    factor_exposures JSONB
) RETURNS JSONB AS $$
DECLARE
    portfolio_array DOUBLE PRECISION[];
    benchmark_array DOUBLE PRECISION[];
    active_returns DOUBLE PRECISION[];
    total_return DOUBLE PRECISION;
    benchmark_return DOUBLE PRECISION;
    active_return DOUBLE PRECISION;
    tracking_error DOUBLE PRECISION;
    information_ratio DOUBLE PRECISION;
    i INTEGER;
BEGIN
    -- Convert JSONB to arrays
    SELECT ARRAY_AGG((value::text)::DOUBLE PRECISION)
    INTO portfolio_array
    FROM jsonb_array_elements(portfolio_returns) AS value;
    
    SELECT ARRAY_AGG((value::text)::DOUBLE PRECISION)
    INTO benchmark_array
    FROM jsonb_array_elements(benchmark_returns) AS value;
    
    -- Calculate active returns
    FOR i IN 1..LEAST(array_length(portfolio_array, 1), array_length(benchmark_array, 1)) LOOP
        active_returns := array_append(active_returns, portfolio_array[i] - benchmark_array[i]);
    END LOOP;
    
    -- Calculate performance metrics
    SELECT 
        AVG(p), AVG(b), AVG(a), STDDEV(a)
    INTO 
        total_return, benchmark_return, active_return, tracking_error
    FROM (
        SELECT 
            unnest(portfolio_array) AS p,
            unnest(benchmark_array) AS b,
            unnest(active_returns) AS a
    ) AS data;
    
    -- Calculate information ratio
    IF tracking_error > 0 THEN
        information_ratio := active_return / tracking_error;
    ELSE
        information_ratio := 0;
    END IF;
    
    -- Simple factor attribution (placeholder for more complex analysis)
    RETURN jsonb_build_object(
        'total_return', total_return,
        'benchmark_return', benchmark_return,
        'active_return', active_return,
        'tracking_error', tracking_error,
        'information_ratio', information_ratio,
        'factor_contribution', jsonb_build_object(
            'selection', active_return * 0.6,  -- Simplified attribution
            'allocation', active_return * 0.3,
            'interaction', active_return * 0.1
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Create supporting tables for advanced analytics
CREATE TABLE IF NOT EXISTS app_data.market_regimes (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    regime TEXT NOT NULL,
    confidence DOUBLE PRECISION,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_data.detected_patterns (
    id SERIAL PRIMARY KEY,
    symbol TEXT NOT NULL,
    pattern_type TEXT NOT NULL,
    detection_time TIMESTAMP NOT NULL,
    pattern_data JSONB NOT NULL,
    confidence DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_data.performance_analytics (
    id SERIAL PRIMARY KEY,
    portfolio_id TEXT NOT NULL,
    analysis_date DATE NOT NULL,
    metrics JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(portfolio_id, analysis_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_regimes_timestamp ON app_data.market_regimes(timestamp);
CREATE INDEX IF NOT EXISTS idx_detected_patterns_symbol_time ON app_data.detected_patterns(symbol, detection_time);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_portfolio_date ON app_data.performance_analytics(portfolio_id, analysis_date);