-- Exasol LUA UDF Migration: Financial & Treasury Analysis Functions
-- Migrated from HANA Financial/Treasury stored procedures

-- 1. CALCULATE PORTFOLIO RISK METRICS
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.get_portfolio_risk_metrics(
    portfolio_json VARCHAR(2000000),
    market_data_json VARCHAR(2000000),
    risk_free_rate DOUBLE
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local portfolio = json.decode(ctx.portfolio_json)
    local market_data = json.decode(ctx.market_data_json)
    local rf_rate = ctx.risk_free_rate or 0.02
    
    local risk_metrics = {
        portfolio_value = 0,
        portfolio_var = 0,
        sharpe_ratio = 0,
        beta = 0,
        alpha = 0,
        max_drawdown = 0,
        volatility = 0,
        timestamp = os.time()
    }
    
    -- Calculate portfolio value and weights
    local total_value = 0
    local weights = {}
    local returns = {}
    
    for i = 1, #portfolio do
        local holding = portfolio[i]
        local value = holding.quantity * holding.price
        total_value = total_value + value
        
        -- Get historical returns for this asset
        for j = 1, #market_data do
            local market_point = market_data[j]
            if market_point.symbol == holding.symbol then
                if not returns[holding.symbol] then
                    returns[holding.symbol] = {}
                end
                table.insert(returns[holding.symbol], market_point.return_rate or 0)
            end
        end
    end
    
    risk_metrics.portfolio_value = total_value
    
    -- Calculate weights
    for i = 1, #portfolio do
        local holding = portfolio[i]
        local value = holding.quantity * holding.price
        weights[holding.symbol] = value / total_value
    end
    
    -- Calculate portfolio returns
    local portfolio_returns = {}
    local max_length = 0
    
    -- Find the maximum length of return series
    for symbol, return_series in pairs(returns) do
        if #return_series > max_length then
            max_length = #return_series
        end
    end
    
    -- Calculate weighted portfolio returns
    for i = 1, max_length do
        local portfolio_return = 0
        local valid_data = false
        
        for symbol, weight in pairs(weights) do
            if returns[symbol] and returns[symbol][i] then
                portfolio_return = portfolio_return + weight * returns[symbol][i]
                valid_data = true
            end
        end
        
        if valid_data then
            table.insert(portfolio_returns, portfolio_return)
        end
    end
    
    if #portfolio_returns > 1 then
        -- Calculate volatility
        local sum_returns = 0
        for i = 1, #portfolio_returns do
            sum_returns = sum_returns + portfolio_returns[i]
        end
        local mean_return = sum_returns / #portfolio_returns
        
        local variance = 0
        for i = 1, #portfolio_returns do
            variance = variance + (portfolio_returns[i] - mean_return) * (portfolio_returns[i] - mean_return)
        end
        variance = variance / (#portfolio_returns - 1)
        
        risk_metrics.volatility = math.sqrt(variance * 252)  -- Annualized
        
        -- Calculate Sharpe ratio
        local excess_return = mean_return * 252 - rf_rate  -- Annualized
        if risk_metrics.volatility > 0 then
            risk_metrics.sharpe_ratio = excess_return / risk_metrics.volatility
        end
        
        -- Calculate max drawdown
        local peak = portfolio_returns[1]
        local max_dd = 0
        
        for i = 2, #portfolio_returns do
            if portfolio_returns[i] > peak then
                peak = portfolio_returns[i]
            else
                local drawdown = (peak - portfolio_returns[i]) / peak
                if drawdown > max_dd then
                    max_dd = drawdown
                end
            end
        end
        
        risk_metrics.max_drawdown = max_dd
        
        -- Simple VaR calculation (95% confidence)
        local sorted_returns = {}
        for i = 1, #portfolio_returns do
            table.insert(sorted_returns, portfolio_returns[i])
        end
        table.sort(sorted_returns)
        
        local var_index = math.floor(0.05 * #sorted_returns)
        if var_index >= 1 then
            risk_metrics.portfolio_var = -sorted_returns[var_index]
        end
    end
    
    return json.encode(risk_metrics)
end
/

-- 2. CALCULATE BASEL III RATIOS
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.calculate_basel_ratios(
    balance_sheet_json VARCHAR(2000000),
    risk_weighted_assets DOUBLE,
    tier1_capital DOUBLE,
    total_capital DOUBLE
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local balance_sheet = json.decode(ctx.balance_sheet_json or "{}")
    
    local basel_ratios = {
        cet1_ratio = 0,
        tier1_ratio = 0,
        total_capital_ratio = 0,
        leverage_ratio = 0,
        liquidity_coverage_ratio = 0,
        net_stable_funding_ratio = 0,
        timestamp = os.time(),
        regulatory_status = {}
    }
    
    local rwa = ctx.risk_weighted_assets or 0
    local tier1 = ctx.tier1_capital or 0
    local total_cap = ctx.total_capital or 0
    
    -- Calculate CET1 ratio
    if rwa > 0 then
        basel_ratios.cet1_ratio = tier1 / rwa
        basel_ratios.tier1_ratio = tier1 / rwa
        basel_ratios.total_capital_ratio = total_cap / rwa
    end
    
    -- Calculate leverage ratio
    local total_exposure = balance_sheet.total_assets or 0
    if total_exposure > 0 then
        basel_ratios.leverage_ratio = tier1 / total_exposure
    end
    
    -- Calculate liquidity ratios (simplified)
    local liquid_assets = balance_sheet.cash + (balance_sheet.government_bonds or 0)
    local net_cash_outflows = balance_sheet.deposits * 0.1  -- Simplified 10% outflow rate
    
    if net_cash_outflows > 0 then
        basel_ratios.liquidity_coverage_ratio = liquid_assets / net_cash_outflows
    end
    
    -- Regulatory compliance check
    basel_ratios.regulatory_status = {
        cet1_compliant = basel_ratios.cet1_ratio >= 0.045,  -- 4.5% minimum
        tier1_compliant = basel_ratios.tier1_ratio >= 0.06,  -- 6% minimum
        total_capital_compliant = basel_ratios.total_capital_ratio >= 0.08,  -- 8% minimum
        leverage_compliant = basel_ratios.leverage_ratio >= 0.03,  -- 3% minimum
        liquidity_compliant = basel_ratios.liquidity_coverage_ratio >= 1.0  -- 100% minimum
    }
    
    -- Overall compliance
    local all_compliant = basel_ratios.regulatory_status.cet1_compliant and
                         basel_ratios.regulatory_status.tier1_compliant and
                         basel_ratios.regulatory_status.total_capital_compliant and
                         basel_ratios.regulatory_status.leverage_compliant and
                         basel_ratios.regulatory_status.liquidity_compliant
    
    basel_ratios.overall_compliant = all_compliant
    
    return json.encode(basel_ratios)
end
/

-- 3. OPTIONS GREEKS CALCULATION
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.calculate_options_greeks(
    spot_price DOUBLE,
    strike_price DOUBLE,
    time_to_expiry DOUBLE,
    volatility DOUBLE,
    risk_free_rate DOUBLE,
    option_type VARCHAR(10)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local S = ctx.spot_price
    local K = ctx.strike_price
    local T = ctx.time_to_expiry
    local sigma = ctx.volatility
    local r = ctx.risk_free_rate
    local option_type = string.upper(ctx.option_type or "CALL")
    
    -- Black-Scholes Greeks calculation
    local sqrt_T = math.sqrt(T)
    local d1 = (math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrt_T)
    local d2 = d1 - sigma * sqrt_T
    
    -- Normal distribution approximation
    local function norm_cdf(x)
        local a1 =  0.254829592
        local a2 = -0.284496736
        local a3 =  1.421413741
        local a4 = -1.453152027
        local a5 =  1.061405429
        local p  =  0.3275911
        
        local sign = 1
        if x < 0 then
            sign = -1
        end
        x = math.abs(x) / math.sqrt(2.0)
        
        local t = 1.0 / (1.0 + p * x)
        local y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * math.exp(-x * x)
        
        return 0.5 * (1.0 + sign * y)
    end
    
    local function norm_pdf(x)
        return math.exp(-0.5 * x * x) / math.sqrt(2 * math.pi)
    end
    
    local N_d1 = norm_cdf(d1)
    local N_d2 = norm_cdf(d2)
    local n_d1 = norm_pdf(d1)
    
    local greeks = {
        spot_price = S,
        strike_price = K,
        time_to_expiry = T,
        volatility = sigma,
        risk_free_rate = r,
        option_type = option_type,
        timestamp = os.time()
    }
    
    if option_type == "CALL" then
        -- Call option Greeks
        greeks.option_price = S * N_d1 - K * math.exp(-r * T) * N_d2
        greeks.delta = N_d1
        greeks.gamma = n_d1 / (S * sigma * sqrt_T)
        greeks.theta = -(S * n_d1 * sigma) / (2 * sqrt_T) - r * K * math.exp(-r * T) * N_d2
        greeks.vega = S * n_d1 * sqrt_T
        greeks.rho = K * T * math.exp(-r * T) * N_d2
    else
        -- Put option Greeks
        greeks.option_price = K * math.exp(-r * T) * norm_cdf(-d2) - S * norm_cdf(-d1)
        greeks.delta = N_d1 - 1
        greeks.gamma = n_d1 / (S * sigma * sqrt_T)
        greeks.theta = -(S * n_d1 * sigma) / (2 * sqrt_T) + r * K * math.exp(-r * T) * norm_cdf(-d2)
        greeks.vega = S * n_d1 * sqrt_T
        greeks.rho = -K * T * math.exp(-r * T) * norm_cdf(-d2)
    end
    
    -- Risk assessment
    greeks.risk_assessment = {
        high_gamma = math.abs(greeks.gamma) > 0.1,
        high_theta = math.abs(greeks.theta) > 0.05,
        high_vega = math.abs(greeks.vega) > 0.3,
        in_the_money = (option_type == "CALL" and S > K) or (option_type == "PUT" and S < K),
        time_decay_risk = T < 0.25  -- Less than 3 months
    }
    
    return json.encode(greeks)
end
/

-- 4. YIELD CURVE ANALYSIS
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.analyze_yield_curve(
    yield_data_json VARCHAR(2000000),
    curve_date VARCHAR(20)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local yield_data = json.decode(ctx.yield_data_json)
    
    local curve_analysis = {
        curve_date = ctx.curve_date,
        curve_shape = "normal",
        steepness = 0,
        curvature = 0,
        level = 0,
        inversion_points = {},
        key_spreads = {},
        timestamp = os.time()
    }
    
    if #yield_data < 3 then
        curve_analysis.error = "Insufficient data points for curve analysis"
        return json.encode(curve_analysis)
    end
    
    -- Sort by maturity
    table.sort(yield_data, function(a, b) return a.maturity < b.maturity end)
    
    -- Calculate level (average yield)
    local sum_yield = 0
    for i = 1, #yield_data do
        sum_yield = sum_yield + yield_data[i].yield
    end
    curve_analysis.level = sum_yield / #yield_data
    
    -- Calculate steepness (long-term - short-term)
    if #yield_data >= 2 then
        curve_analysis.steepness = yield_data[#yield_data].yield - yield_data[1].yield
    end
    
    -- Calculate curvature (mid-point vs. average of endpoints)
    if #yield_data >= 3 then
        local mid_index = math.floor(#yield_data / 2) + 1
        local mid_yield = yield_data[mid_index].yield
        local endpoints_avg = (yield_data[1].yield + yield_data[#yield_data].yield) / 2
        curve_analysis.curvature = mid_yield - endpoints_avg
    end
    
    -- Determine curve shape
    if curve_analysis.steepness > 0.5 then
        curve_analysis.curve_shape = "steep"
    elseif curve_analysis.steepness < -0.2 then
        curve_analysis.curve_shape = "inverted"
    elseif math.abs(curve_analysis.steepness) < 0.1 then
        curve_analysis.curve_shape = "flat"
    end
    
    -- Find inversion points
    for i = 1, #yield_data - 1 do
        if yield_data[i].yield > yield_data[i + 1].yield then
            table.insert(curve_analysis.inversion_points, {
                short_maturity = yield_data[i].maturity,
                long_maturity = yield_data[i + 1].maturity,
                inversion_magnitude = yield_data[i].yield - yield_data[i + 1].yield
            })
        end
    end
    
    -- Calculate key spreads
    for i = 1, #yield_data do
        for j = i + 1, #yield_data do
            local spread_name = yield_data[j].maturity .. "Y-" .. yield_data[i].maturity .. "Y"
            local spread_value = yield_data[j].yield - yield_data[i].yield
            
            curve_analysis.key_spreads[spread_name] = spread_value
        end
    end
    
    -- Risk indicators
    curve_analysis.risk_indicators = {
        inverted = #curve_analysis.inversion_points > 0,
        flat_curve = math.abs(curve_analysis.steepness) < 0.1,
        steep_curve = curve_analysis.steepness > 2.0,
        unusual_curvature = math.abs(curve_analysis.curvature) > 1.0
    }
    
    return json.encode(curve_analysis)
end
/

-- 5. CREDIT RISK SCORING
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.calculate_credit_risk_score(
    financial_ratios_json VARCHAR(2000000),
    industry_sector VARCHAR(100),
    company_size VARCHAR(50),
    credit_history_json VARCHAR(1000000)
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local ratios = json.decode(ctx.financial_ratios_json or "{}")
    local credit_history = json.decode(ctx.credit_history_json or "{}")
    
    local credit_score = {
        overall_score = 0,
        rating = "NR",
        probability_of_default = 0,
        score_components = {},
        risk_factors = {},
        industry_sector = ctx.industry_sector,
        company_size = ctx.company_size,
        timestamp = os.time()
    }
    
    local total_weight = 0
    local weighted_score = 0
    
    -- Financial ratio scoring (40% weight)
    if ratios.debt_to_equity then
        local debt_equity_score = 100 - math.min(ratios.debt_to_equity * 10, 100)
        credit_score.score_components.debt_equity = debt_equity_score
        weighted_score = weighted_score + debt_equity_score * 0.15
        total_weight = total_weight + 0.15
    end
    
    if ratios.current_ratio then
        local liquidity_score = math.min(ratios.current_ratio * 40, 100)
        credit_score.score_components.liquidity = liquidity_score
        weighted_score = weighted_score + liquidity_score * 0.10
        total_weight = total_weight + 0.10
    end
    
    if ratios.interest_coverage then
        local coverage_score = math.min(ratios.interest_coverage * 20, 100)
        credit_score.score_components.interest_coverage = coverage_score
        weighted_score = weighted_score + coverage_score * 0.15
        total_weight = total_weight + 0.15
    end
    
    -- Profitability scoring (25% weight)
    if ratios.roa then
        local profitability_score = math.min((ratios.roa + 0.05) * 1000, 100)
        credit_score.score_components.profitability = profitability_score
        weighted_score = weighted_score + profitability_score * 0.25
        total_weight = total_weight + 0.25
    end
    
    -- Credit history scoring (35% weight)
    local history_score = 50  -- Default neutral score
    
    if credit_history.payment_delays then
        history_score = history_score - credit_history.payment_delays * 5
    end
    
    if credit_history.defaults then
        history_score = history_score - credit_history.defaults * 20
    end
    
    if credit_history.years_in_business then
        history_score = history_score + math.min(credit_history.years_in_business * 2, 30)
    end
    
    history_score = math.max(0, math.min(100, history_score))
    credit_score.score_components.credit_history = history_score
    weighted_score = weighted_score + history_score * 0.35
    total_weight = total_weight + 0.35
    
    -- Calculate final score
    if total_weight > 0 then
        credit_score.overall_score = weighted_score / total_weight
    end
    
    -- Assign rating
    if credit_score.overall_score >= 90 then
        credit_score.rating = "AAA"
        credit_score.probability_of_default = 0.01
    elseif credit_score.overall_score >= 80 then
        credit_score.rating = "AA"
        credit_score.probability_of_default = 0.05
    elseif credit_score.overall_score >= 70 then
        credit_score.rating = "A"
        credit_score.probability_of_default = 0.10
    elseif credit_score.overall_score >= 60 then
        credit_score.rating = "BBB"
        credit_score.probability_of_default = 0.20
    elseif credit_score.overall_score >= 50 then
        credit_score.rating = "BB"
        credit_score.probability_of_default = 0.40
    elseif credit_score.overall_score >= 40 then
        credit_score.rating = "B"
        credit_score.probability_of_default = 0.60
    else
        credit_score.rating = "CCC"
        credit_score.probability_of_default = 0.80
    end
    
    -- Identify risk factors
    if ratios.debt_to_equity and ratios.debt_to_equity > 2.0 then
        table.insert(credit_score.risk_factors, "High leverage")
    end
    
    if ratios.current_ratio and ratios.current_ratio < 1.0 then
        table.insert(credit_score.risk_factors, "Poor liquidity")
    end
    
    if ratios.interest_coverage and ratios.interest_coverage < 2.0 then
        table.insert(credit_score.risk_factors, "Low interest coverage")
    end
    
    if credit_history.defaults and credit_history.defaults > 0 then
        table.insert(credit_score.risk_factors, "Payment defaults")
    end
    
    return json.encode(credit_score)
end
/

-- 6. STRESS TEST SCENARIO ANALYSIS
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.run_stress_test(
    portfolio_json VARCHAR(2000000),
    stress_scenarios_json VARCHAR(2000000),
    confidence_level DOUBLE
) RETURNS VARCHAR(2000000) AS

function run(ctx)
    local json = require("json")
    local portfolio = json.decode(ctx.portfolio_json)
    local scenarios = json.decode(ctx.stress_scenarios_json)
    local confidence = ctx.confidence_level or 0.95
    
    local stress_results = {
        scenarios = {},
        worst_case_loss = 0,
        expected_shortfall = 0,
        stress_var = 0,
        portfolio_resilience = "strong",
        timestamp = os.time()
    }
    
    local scenario_losses = {}
    
    -- Run each stress scenario
    for i = 1, #scenarios do
        local scenario = scenarios[i]
        local scenario_loss = 0
        local affected_positions = 0
        
        -- Calculate impact on each portfolio position
        for j = 1, #portfolio do
            local position = portfolio[j]
            local position_value = position.quantity * position.price
            local loss = 0
            
            -- Apply stress factors based on asset type or sector
            if scenario.equity_shock and position.asset_type == "equity" then
                loss = position_value * scenario.equity_shock
            elseif scenario.bond_shock and position.asset_type == "bond" then
                loss = position_value * scenario.bond_shock
            elseif scenario.fx_shock and position.currency ~= "USD" then
                loss = position_value * scenario.fx_shock
            elseif scenario.sector_shocks and scenario.sector_shocks[position.sector] then
                loss = position_value * scenario.sector_shocks[position.sector]
            end
            
            if loss > 0 then
                scenario_loss = scenario_loss + loss
                affected_positions = affected_positions + 1
            end
        end
        
        table.insert(scenario_losses, scenario_loss)
        
        table.insert(stress_results.scenarios, {
            name = scenario.name,
            description = scenario.description,
            total_loss = scenario_loss,
            affected_positions = affected_positions,
            loss_percentage = scenario_loss / calculate_portfolio_value(portfolio) * 100
        })
    end
    
    -- Calculate stress metrics
    if #scenario_losses > 0 then
        -- Sort losses (ascending)
        table.sort(scenario_losses)
        
        stress_results.worst_case_loss = scenario_losses[#scenario_losses]
        
        -- Expected Shortfall (average of worst case scenarios)
        local tail_index = math.floor((1 - confidence) * #scenario_losses)
        if tail_index < 1 then tail_index = 1 end
        
        local tail_sum = 0
        local tail_count = 0
        for i = #scenario_losses - tail_index + 1, #scenario_losses do
            tail_sum = tail_sum + scenario_losses[i]
            tail_count = tail_count + 1
        end
        
        if tail_count > 0 then
            stress_results.expected_shortfall = tail_sum / tail_count
        end
        
        -- Stress VaR (percentile of stress losses)
        local var_index = math.floor((1 - confidence) * #scenario_losses)
        if var_index >= 1 then
            stress_results.stress_var = scenario_losses[#scenario_losses - var_index + 1]
        end
    end
    
    -- Assess portfolio resilience
    local portfolio_value = calculate_portfolio_value(portfolio)
    local worst_case_pct = stress_results.worst_case_loss / portfolio_value * 100
    
    if worst_case_pct < 10 then
        stress_results.portfolio_resilience = "very_strong"
    elseif worst_case_pct < 20 then
        stress_results.portfolio_resilience = "strong"
    elseif worst_case_pct < 35 then
        stress_results.portfolio_resilience = "moderate"
    elseif worst_case_pct < 50 then
        stress_results.portfolio_resilience = "weak"
    else
        stress_results.portfolio_resilience = "very_weak"
    end
    
    return json.encode(stress_results)
end

-- Helper function to calculate total portfolio value
function calculate_portfolio_value(portfolio)
    local total_value = 0
    for i = 1, #portfolio do
        total_value = total_value + portfolio[i].quantity * portfolio[i].price
    end
    return total_value
end
/