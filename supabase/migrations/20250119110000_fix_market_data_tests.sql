-- Fix Market Data Tests to Include Source Column
-- Migration: 20250119110000_fix_market_data_tests.sql

-- Update the constraint test function to include source column
CREATE OR REPLACE FUNCTION public.enterprise_constraint_test()
RETURNS TABLE (
    test_name TEXT,
    status TEXT,
    is_working BOOLEAN,
    details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_id TEXT;
    test_uuid UUID;
    test_passed BOOLEAN;
    error_details TEXT;
BEGIN
    -- Generate unique test identifiers
    test_id := 'ent' || floor(random() * 1000)::text;
    test_uuid := gen_random_uuid();
    
    -- Test 1: Email Uniqueness (with proper username format)
    BEGIN
        test_passed := FALSE;
        error_details := '';
        
        -- Insert first user with valid username (3-30 chars, alphanumeric+underscore)
        INSERT INTO public.users (user_id, username, email, created_at, updated_at)
        VALUES (test_uuid, test_id || '_usr1', test_id || '@test.com', NOW(), NOW());
        
        -- Try duplicate email with different username
        BEGIN
            INSERT INTO public.users (user_id, username, email, created_at, updated_at)
            VALUES (gen_random_uuid(), test_id || '_usr2', test_id || '@test.com', NOW(), NOW());
            
            -- If we get here, constraint is broken
            test_passed := FALSE;
            error_details := 'Duplicate email was allowed';
        EXCEPTION
            WHEN unique_violation THEN
                test_passed := TRUE;
                error_details := 'Correctly blocked duplicate email';
            WHEN OTHERS THEN
                test_passed := FALSE;
                error_details := 'Error: ' || SQLERRM;
        END;
        
        -- Cleanup
        DELETE FROM public.users WHERE email = test_id || '@test.com';
        
    EXCEPTION
        WHEN OTHERS THEN
            test_passed := FALSE;
            error_details := 'Test setup failed: ' || SQLERRM;
            -- Cleanup attempt
            DELETE FROM public.users WHERE email = test_id || '@test.com';
    END;
    
    RETURN QUERY SELECT 
        'Email Uniqueness'::TEXT,
        CASE WHEN test_passed THEN 'PASS' ELSE 'FAIL' END::TEXT,
        test_passed,
        error_details;
    
    -- Test 2: Username Uniqueness
    BEGIN
        test_passed := FALSE;
        error_details := '';
        
        -- Insert first user
        INSERT INTO public.users (user_id, username, email, created_at, updated_at)
        VALUES (gen_random_uuid(), test_id || '_same', test_id || '_1@test.com', NOW(), NOW());
        
        -- Try duplicate username
        BEGIN
            INSERT INTO public.users (user_id, username, email, created_at, updated_at)
            VALUES (gen_random_uuid(), test_id || '_same', test_id || '_2@test.com', NOW(), NOW());
            
            test_passed := FALSE;
            error_details := 'Duplicate username was allowed';
        EXCEPTION
            WHEN unique_violation THEN
                test_passed := TRUE;
                error_details := 'Correctly blocked duplicate username';
            WHEN OTHERS THEN
                test_passed := FALSE;
                error_details := 'Error: ' || SQLERRM;
        END;
        
        -- Cleanup
        DELETE FROM public.users WHERE username = test_id || '_same';
        
    EXCEPTION
        WHEN OTHERS THEN
            test_passed := FALSE;
            error_details := 'Test setup failed: ' || SQLERRM;
            DELETE FROM public.users WHERE username = test_id || '_same';
    END;
    
    RETURN QUERY SELECT 
        'Username Uniqueness'::TEXT,
        CASE WHEN test_passed THEN 'PASS' ELSE 'FAIL' END::TEXT,
        test_passed,
        error_details;
    
    -- Test 3: Negative Price Validation (with source column)
    BEGIN
        test_passed := FALSE;
        error_details := '';
        
        BEGIN
            INSERT INTO public.market_data (symbol, price, source, timestamp, created_at, updated_at)
            VALUES ('NEG_' || test_id, -100.0, 'test', NOW(), NOW(), NOW());
            
            test_passed := FALSE;
            error_details := 'Negative price was allowed';
            
            -- Cleanup if somehow inserted
            DELETE FROM public.market_data WHERE symbol = 'NEG_' || test_id;
        EXCEPTION
            WHEN check_violation THEN
                test_passed := TRUE;
                error_details := 'Correctly blocked negative price';
            WHEN OTHERS THEN
                test_passed := FALSE;
                error_details := 'Error: ' || SQLERRM;
        END;
        
    EXCEPTION
        WHEN OTHERS THEN
            test_passed := FALSE;
            error_details := 'Test setup failed: ' || SQLERRM;
    END;
    
    RETURN QUERY SELECT 
        'Negative Price Block'::TEXT,
        CASE WHEN test_passed THEN 'PASS' ELSE 'FAIL' END::TEXT,
        test_passed,
        error_details;
    
    -- Test 4: Zero Price Validation (with source column)
    BEGIN
        test_passed := FALSE;
        error_details := '';
        
        BEGIN
            INSERT INTO public.market_data (symbol, price, source, timestamp, created_at, updated_at)
            VALUES ('ZERO_' || test_id, 0.0, 'test', NOW(), NOW(), NOW());
            
            test_passed := FALSE;
            error_details := 'Zero price was allowed';
            
            -- Cleanup if somehow inserted
            DELETE FROM public.market_data WHERE symbol = 'ZERO_' || test_id;
        EXCEPTION
            WHEN check_violation THEN
                test_passed := TRUE;
                error_details := 'Correctly blocked zero price';
            WHEN OTHERS THEN
                test_passed := FALSE;
                error_details := 'Error: ' || SQLERRM;
        END;
        
    EXCEPTION
        WHEN OTHERS THEN
            test_passed := FALSE;
            error_details := 'Test setup failed: ' || SQLERRM;
    END;
    
    RETURN QUERY SELECT 
        'Zero Price Block'::TEXT,
        CASE WHEN test_passed THEN 'PASS' ELSE 'FAIL' END::TEXT,
        test_passed,
        error_details;
    
    -- Test 5: Email Format Validation
    BEGIN
        test_passed := FALSE;
        error_details := '';
        
        BEGIN
            INSERT INTO public.users (user_id, username, email, created_at, updated_at)
            VALUES (gen_random_uuid(), test_id || '_fmt', 'not-an-email', NOW(), NOW());
            
            test_passed := FALSE;
            error_details := 'Invalid email format was allowed';
            
            -- Cleanup if somehow inserted
            DELETE FROM public.users WHERE username = test_id || '_fmt';
        EXCEPTION
            WHEN check_violation THEN
                test_passed := TRUE;
                error_details := 'Correctly blocked invalid email format';
            WHEN OTHERS THEN
                test_passed := FALSE;
                error_details := 'Error: ' || SQLERRM;
        END;
        
    EXCEPTION
        WHEN OTHERS THEN
            test_passed := FALSE;
            error_details := 'Test setup failed: ' || SQLERRM;
    END;
    
    RETURN QUERY SELECT 
        'Email Format Validation'::TEXT,
        CASE WHEN test_passed THEN 'PASS' ELSE 'FAIL' END::TEXT,
        test_passed,
        error_details;
    
    -- Test 6: Empty Symbol Validation (with source column)
    BEGIN
        test_passed := FALSE;
        error_details := '';
        
        BEGIN
            INSERT INTO public.market_data (symbol, price, source, timestamp, created_at, updated_at)
            VALUES ('', 100.0, 'test', NOW(), NOW(), NOW());
            
            test_passed := FALSE;
            error_details := 'Empty symbol was allowed';
            
            -- Cleanup if somehow inserted
            DELETE FROM public.market_data WHERE symbol = '';
        EXCEPTION
            WHEN check_violation THEN
                test_passed := TRUE;
                error_details := 'Correctly blocked empty symbol';
            WHEN OTHERS THEN
                test_passed := FALSE;
                error_details := 'Error: ' || SQLERRM;
        END;
        
    EXCEPTION
        WHEN OTHERS THEN
            test_passed := FALSE;
            error_details := 'Test setup failed: ' || SQLERRM;
    END;
    
    RETURN QUERY SELECT 
        'Empty Symbol Block'::TEXT,
        CASE WHEN test_passed THEN 'PASS' ELSE 'FAIL' END::TEXT,
        test_passed,
        error_details;
END;
$$;

-- Test immediately
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 FIXED MARKET DATA TESTS';
    RAISE NOTICE '=========================';
    RAISE NOTICE 'Run enterprise_constraint_test() to verify all constraints now pass';
END $$;