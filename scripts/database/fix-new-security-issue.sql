-- Fix the new security definer view that was created
ALTER VIEW public.top_market_symbols_authenticated SET (security_invoker = true);

-- Also ensure the materialized view has proper settings
-- Drop the problematic authenticated view and create a better solution
DROP VIEW IF EXISTS public.top_market_symbols_authenticated;

-- Create a function-based access control instead
CREATE OR REPLACE FUNCTION public.get_top_market_symbols()
RETURNS TABLE (
    symbol text,
    company_name text,
    sector text,
    market_cap numeric,
    volume bigint,
    price numeric,
    change_percent numeric
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Return data from materialized view
    RETURN QUERY
    SELECT * FROM public.top_market_symbols_view;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_top_market_symbols() TO authenticated;

-- Revoke direct access to the materialized view
REVOKE ALL ON public.top_market_symbols_view FROM anon, authenticated;
GRANT SELECT ON public.top_market_symbols_view TO service_role;