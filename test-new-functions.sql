-- Test the new functions to demonstrate their capabilities

-- Test 1: System Health Summary
SELECT 'System Health Summary' as test_name, generate_system_health_summary() as result;

-- Test 2: Market Dashboard  
SELECT 'Market Dashboard' as test_name, generate_market_dashboard() as result;

-- Test 3: Portfolio Summary
SELECT 'Portfolio Summary' as test_name, generate_portfolio_summary() as result;

-- Test 4: Data Validation - Market Data
SELECT 'Market Data Validation' as test_name, validate_market_data_freshness(24) as result;

-- Test 5: Data Validation - Portfolio Allocations
SELECT 'Portfolio Validation' as test_name, validate_portfolio_allocations() as result;

-- Test 6: Function Complexity Analysis
SELECT 'Function Complexity Analysis' as test_name, analyze_function_complexity() as result;