-- Add SQL execution function for testing
-- Migration: 20250119070001_add_sql_function.sql

-- Create a function to check foreign key constraints
CREATE OR REPLACE FUNCTION public.check_foreign_keys()
RETURNS TABLE (
    table_name TEXT,
    constraint_name TEXT,
    column_name TEXT,
    foreign_table_name TEXT,
    foreign_column_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.table_name::TEXT,
        tc.constraint_name::TEXT,
        kcu.column_name::TEXT,
        ccu.table_name::TEXT as foreign_table_name,
        ccu.column_name::TEXT as foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name;
END;
$$;

-- Create a function to count foreign keys
CREATE OR REPLACE FUNCTION public.count_foreign_keys()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    fk_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public';
    
    RETURN fk_count;
END;
$$;

-- Create a function to test relationship queries
CREATE OR REPLACE FUNCTION public.test_relationship(
    p_query TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Try to execute the query and return true if successful
    EXECUTE p_query;
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_foreign_keys() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_foreign_keys() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.test_relationship(TEXT) TO anon, authenticated;

-- Test the functions
DO $$
DECLARE
    fk_count INTEGER;
BEGIN
    SELECT public.count_foreign_keys() INTO fk_count;
    RAISE NOTICE 'Foreign key count function created successfully. Count: %', fk_count;
END $$;