-- EMERGENCY: Fix Broken Constraint Enforcement
-- Migration: 20250119090002_emergency_constraint_fix.sql

-- CRITICAL: The constraints exist but are not being enforced
-- This migration will rebuild them properly

-- 1. Drop and recreate email uniqueness constraint
DO $$
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_unique;
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_username_unique;
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_format;
    
    -- Add properly enforced unique constraints
    ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
    ALTER TABLE public.users ADD CONSTRAINT users_username_unique UNIQUE (username);
    
    -- Add email format constraint with proper regex
    ALTER TABLE public.users ADD CONSTRAINT users_email_format 
    CHECK (email ~* '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$');
    
    RAISE NOTICE 'Users table constraints recreated';
END $$;

-- 2. Drop and recreate market data price constraints
DO $$
BEGIN
    -- Drop existing constraints
    ALTER TABLE public.market_data DROP CONSTRAINT IF EXISTS market_data_price_positive;
    ALTER TABLE public.market_data DROP CONSTRAINT IF EXISTS market_data_volume_positive;
    ALTER TABLE public.market_data DROP CONSTRAINT IF EXISTS market_data_symbol_not_empty;
    
    -- Add properly enforced constraints
    ALTER TABLE public.market_data ADD CONSTRAINT market_data_price_positive 
    CHECK (price > 0);
    
    ALTER TABLE public.market_data ADD CONSTRAINT market_data_volume_positive 
    CHECK (volume IS NULL OR volume >= 0);
    
    ALTER TABLE public.market_data ADD CONSTRAINT market_data_symbol_not_empty 
    CHECK (symbol IS NOT NULL AND LENGTH(TRIM(symbol)) > 0);
    
    RAISE NOTICE 'Market data constraints recreated';
END $$;

-- 3. Add portfolio constraints if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_holdings' AND table_schema = 'public') THEN
        -- Drop existing constraints
        ALTER TABLE public.portfolio_holdings DROP CONSTRAINT IF EXISTS portfolio_holdings_quantity_positive;
        ALTER TABLE public.portfolio_holdings DROP CONSTRAINT IF EXISTS portfolio_holdings_cost_positive;
        
        -- Add properly enforced constraints
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_holdings' AND column_name = 'quantity') THEN
            ALTER TABLE public.portfolio_holdings ADD CONSTRAINT portfolio_holdings_quantity_positive 
            CHECK (quantity > 0);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_holdings' AND column_name = 'average_cost') THEN
            ALTER TABLE public.portfolio_holdings ADD CONSTRAINT portfolio_holdings_cost_positive 
            CHECK (average_cost > 0);
        END IF;
        
        RAISE NOTICE 'Portfolio holdings constraints recreated';
    END IF;
END $$;

-- 4. Add price alerts constraints if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'price_alerts' AND table_schema = 'public') THEN
        -- Drop existing constraints
        ALTER TABLE public.price_alerts DROP CONSTRAINT IF EXISTS price_alerts_target_price_positive;
        ALTER TABLE public.price_alerts DROP CONSTRAINT IF EXISTS price_alerts_alert_type_valid;
        
        -- Add constraints based on actual columns
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'price_alerts' AND column_name = 'target_price') THEN
            ALTER TABLE public.price_alerts ADD CONSTRAINT price_alerts_target_price_positive 
            CHECK (target_price > 0);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'price_alerts' AND column_name = 'alert_type') THEN
            ALTER TABLE public.price_alerts ADD CONSTRAINT price_alerts_alert_type_valid 
            CHECK (alert_type IN ('above', 'below', 'change', 'percentage'));
        END IF;
        
        RAISE NOTICE 'Price alerts constraints recreated';
    END IF;
END $$;

-- 5. Create immediate constraint validation test
CREATE OR REPLACE FUNCTION public.emergency_constraint_test()
RETURNS TABLE (
    test_name TEXT,
    status TEXT,
    is_working BOOLEAN,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_id TEXT;
    constraint_working BOOLEAN;
    error_msg TEXT;
BEGIN
    test_id := 'emergency_test_' || extract(epoch from NOW())::text;
    
    -- Test 1: Email uniqueness
    BEGIN
        -- Insert first user
        INSERT INTO public.users (username, email, created_at, updated_at)
        VALUES (test_id || '_1', test_id || '@test.com', NOW(), NOW());
        
        -- Try to insert duplicate email (should fail)
        INSERT INTO public.users (username, email, created_at, updated_at)
        VALUES (test_id || '_2', test_id || '@test.com', NOW(), NOW());
        
        -- If we get here, constraint is broken
        constraint_working := FALSE;
        error_msg := 'Duplicate email was allowed';
        
        -- Cleanup
        DELETE FROM public.users WHERE email = test_id || '@test.com';
        
    EXCEPTION
        WHEN unique_violation THEN
            constraint_working := TRUE;
            error_msg := 'Working correctly';
            -- Cleanup
            DELETE FROM public.users WHERE email = test_id || '@test.com';
        WHEN OTHERS THEN
            constraint_working := FALSE;
            error_msg := SQLERRM;
            -- Cleanup
            DELETE FROM public.users WHERE email = test_id || '@test.com';
    END;
    
    RETURN QUERY SELECT 
        'Email Uniqueness'::TEXT,
        CASE WHEN constraint_working THEN 'PASS' ELSE 'FAIL' END::TEXT,
        constraint_working,
        error_msg;
    
    -- Test 2: Negative price validation
    BEGIN
        INSERT INTO public.market_data (symbol, price, timestamp, created_at, updated_at)
        VALUES ('TEST_NEG_' || test_id, -999.99, NOW(), NOW(), NOW());
        
        -- If we get here, constraint is broken
        constraint_working := FALSE;
        error_msg := 'Negative price was allowed';
        
        -- Cleanup
        DELETE FROM public.market_data WHERE symbol = 'TEST_NEG_' || test_id;
        
    EXCEPTION
        WHEN check_violation THEN
            constraint_working := TRUE;
            error_msg := 'Working correctly';
        WHEN OTHERS THEN
            constraint_working := FALSE;
            error_msg := SQLERRM;
            -- Cleanup
            DELETE FROM public.market_data WHERE symbol = 'TEST_NEG_' || test_id;
    END;
    
    RETURN QUERY SELECT 
        'Negative Price Block'::TEXT,
        CASE WHEN constraint_working THEN 'PASS' ELSE 'FAIL' END::TEXT,
        constraint_working,
        error_msg;
    
    -- Test 3: Invalid email format
    BEGIN
        INSERT INTO public.users (username, email, created_at, updated_at)
        VALUES (test_id || '_format', 'invalid-email-no-at-sign', NOW(), NOW());
        
        -- If we get here, constraint is broken
        constraint_working := FALSE;
        error_msg := 'Invalid email format was allowed';
        
        -- Cleanup
        DELETE FROM public.users WHERE username = test_id || '_format';
        
    EXCEPTION
        WHEN check_violation THEN
            constraint_working := TRUE;
            error_msg := 'Working correctly';
        WHEN OTHERS THEN
            constraint_working := FALSE;
            error_msg := SQLERRM;
            -- Cleanup
            DELETE FROM public.users WHERE username = test_id || '_format';
    END;
    
    RETURN QUERY SELECT 
        'Email Format Validation'::TEXT,
        CASE WHEN constraint_working THEN 'PASS' ELSE 'FAIL' END::TEXT,
        constraint_working,
        error_msg;
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION public.emergency_constraint_test TO anon, authenticated;

-- 6. Test the constraints immediately
DO $$
DECLARE
    test_result RECORD;
    all_passed BOOLEAN := TRUE;
BEGIN
    RAISE NOTICE 'EMERGENCY CONSTRAINT VALIDATION:';
    RAISE NOTICE '===================================';
    
    FOR test_result IN SELECT * FROM public.emergency_constraint_test() LOOP
        RAISE NOTICE '% %: % (%)', 
            CASE WHEN test_result.is_working THEN '✅' ELSE '❌' END,
            test_result.test_name,
            test_result.status,
            test_result.error_message;
            
        IF NOT test_result.is_working THEN
            all_passed := FALSE;
        END IF;
    END LOOP;
    
    IF all_passed THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 ALL CONSTRAINTS NOW WORKING!';
        RAISE NOTICE 'Database integrity is restored';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '🚨 CONSTRAINTS STILL BROKEN!';
        RAISE NOTICE 'Database integrity compromised';
    END IF;
END $$;