-- Final verification query to run via CLI
SELECT 
    'News Tables Final Count' as verification_type,
    COUNT(*) as total_news_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'news%'
ORDER BY verification_type;

-- Show all news tables with row counts
SELECT 
    schemaname,
    tablename,
    n_tup_ins as total_inserts,
    n_tup_del as total_deletes,
    n_live_tup as current_rows
FROM pg_stat_user_tables 
WHERE tablename LIKE 'news%'
ORDER BY tablename;

-- Check table descriptions were added
SELECT 
    c.relname as table_name,
    CASE 
        WHEN obj_description(c.oid) IS NOT NULL THEN 'HAS DESCRIPTION' 
        ELSE 'NO DESCRIPTION' 
    END as description_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
AND c.relname LIKE 'news%'
AND c.relkind = 'r'
ORDER BY c.relname;