-- Fix Constraint Test to Handle User Table Structure
-- Migration: 20250119090003_fix_constraint_test.sql

-- Update the constraint test to properly handle the users table structure
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
    test_uuid UUID;
    constraint_working BOOLEAN;
    error_msg TEXT;
BEGIN
    test_id := 'emergency_test_' || extract(epoch from NOW())::text;
    test_uuid := gen_random_uuid();
    
    -- Test 1: Email uniqueness
    BEGIN
        -- Insert first user with proper UUID
        INSERT INTO public.users (user_id, username, email, created_at, updated_at)
        VALUES (test_uuid, test_id || '_1', test_id || '@test.com', NOW(), NOW());
        
        -- Try to insert duplicate email (should fail)
        INSERT INTO public.users (user_id, username, email, created_at, updated_at)
        VALUES (gen_random_uuid(), test_id || '_2', test_id || '@test.com', NOW(), NOW());
        
        -- If we get here, constraint is broken
        constraint_working := FALSE;
        error_msg := 'Duplicate email was allowed';
        
        -- Cleanup
        DELETE FROM public.users WHERE email = test_id || '@test.com';
        
    EXCEPTION
        WHEN unique_violation THEN
            constraint_working := TRUE;
            error_msg := 'Working correctly - duplicate email blocked';
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
    
    -- Test 2: Username uniqueness  
    BEGIN
        -- Insert first user
        INSERT INTO public.users (user_id, username, email, created_at, updated_at)
        VALUES (gen_random_uuid(), test_id || '_unique', test_id || '_unique_1@test.com', NOW(), NOW());
        
        -- Try to insert duplicate username (should fail)
        INSERT INTO public.users (user_id, username, email, created_at, updated_at)
        VALUES (gen_random_uuid(), test_id || '_unique', test_id || '_unique_2@test.com', NOW(), NOW());
        
        -- If we get here, constraint is broken
        constraint_working := FALSE;
        error_msg := 'Duplicate username was allowed';
        
        -- Cleanup
        DELETE FROM public.users WHERE username = test_id || '_unique';
        
    EXCEPTION
        WHEN unique_violation THEN
            constraint_working := TRUE;
            error_msg := 'Working correctly - duplicate username blocked';
            -- Cleanup
            DELETE FROM public.users WHERE username = test_id || '_unique';
        WHEN OTHERS THEN
            constraint_working := FALSE;
            error_msg := SQLERRM;
            -- Cleanup
            DELETE FROM public.users WHERE username = test_id || '_unique';
    END;
    
    RETURN QUERY SELECT 
        'Username Uniqueness'::TEXT,
        CASE WHEN constraint_working THEN 'PASS' ELSE 'FAIL' END::TEXT,
        constraint_working,
        error_msg;
    
    -- Test 3: Negative price validation
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
            error_msg := 'Working correctly - negative price blocked';
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
    
    -- Test 4: Invalid email format
    BEGIN
        INSERT INTO public.users (user_id, username, email, created_at, updated_at)
        VALUES (gen_random_uuid(), test_id || '_format', 'invalid-email-no-at-sign', NOW(), NOW());
        
        -- If we get here, constraint is broken
        constraint_working := FALSE;
        error_msg := 'Invalid email format was allowed';
        
        -- Cleanup
        DELETE FROM public.users WHERE username = test_id || '_format';
        
    EXCEPTION
        WHEN check_violation THEN
            constraint_working := TRUE;
            error_msg := 'Working correctly - invalid email blocked';
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
        
    -- Test 5: Zero price validation
    BEGIN
        INSERT INTO public.market_data (symbol, price, timestamp, created_at, updated_at)
        VALUES ('TEST_ZERO_' || test_id, 0.0, NOW(), NOW(), NOW());
        
        -- If we get here, constraint is broken
        constraint_working := FALSE;
        error_msg := 'Zero price was allowed';
        
        -- Cleanup
        DELETE FROM public.market_data WHERE symbol = 'TEST_ZERO_' || test_id;
        
    EXCEPTION
        WHEN check_violation THEN
            constraint_working := TRUE;
            error_msg := 'Working correctly - zero price blocked';
        WHEN OTHERS THEN
            constraint_working := FALSE;
            error_msg := SQLERRM;
            -- Cleanup
            DELETE FROM public.market_data WHERE symbol = 'TEST_ZERO_' || test_id;
    END;
    
    RETURN QUERY SELECT 
        'Zero Price Block'::TEXT,
        CASE WHEN constraint_working THEN 'PASS' ELSE 'FAIL' END::TEXT,
        constraint_working,
        error_msg;
END;
$$;

-- Test immediately
DO $$
DECLARE
    test_result RECORD;
    passed_count INTEGER := 0;
    total_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'UPDATED CONSTRAINT VALIDATION:';
    RAISE NOTICE '============================';
    
    FOR test_result IN SELECT * FROM public.emergency_constraint_test() LOOP
        total_count := total_count + 1;
        
        RAISE NOTICE '% %: % (%)', 
            CASE WHEN test_result.is_working THEN '✅' ELSE '❌' END,
            test_result.test_name,
            test_result.status,
            test_result.error_message;
            
        IF test_result.is_working THEN
            passed_count := passed_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'RESULTS: %/% tests passed', passed_count, total_count;
    
    IF passed_count = total_count THEN
        RAISE NOTICE '🎉 ALL CONSTRAINTS NOW WORKING!';
        RAISE NOTICE 'Database integrity is FULLY RESTORED!';
    ELSE
        RAISE NOTICE '⚠️ % constraints still need fixing', (total_count - passed_count);
    END IF;
END $$;