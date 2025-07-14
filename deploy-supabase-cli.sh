#!/bin/bash

echo "🚀 Deploying functions to Supabase using CLI..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

# Set project ID
PROJECT_ID="fnsbxaywhsxqppncqksu"
SUPABASE_URL="https://${PROJECT_ID}.supabase.co"

# Login to Supabase (requires access token)
echo "📝 Logging in to Supabase..."
echo "   Note: You need a Supabase access token from https://supabase.com/dashboard/account/tokens"
echo ""

# Initialize connection using db URL
DB_URL="postgresql://postgres.${PROJECT_ID}:${DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# Alternative: Use psql directly with the connection string
echo "📋 Direct deployment using psql:"
echo ""
echo "1. Get your database password from:"
echo "   https://supabase.com/dashboard/project/${PROJECT_ID}/settings/database"
echo ""
echo "2. Run this command:"
echo "   psql \"${DB_URL}\" -f supabase-migration/00_complete_migration.sql"
echo ""
echo "Or deploy individually:"
echo "   psql \"${DB_URL}\" -f supabase-migration/01_core_analytics_functions.sql"
echo "   psql \"${DB_URL}\" -f supabase-migration/02_ml_rl_functions.sql"
echo "   psql \"${DB_URL}\" -f supabase-migration/03_advanced_analytics_functions.sql"
echo ""

# Create a simple test script
cat > test-deployment.sql << 'EOF'
-- Test if functions exist
SELECT 
    p.proname AS function_name,
    pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'app_data'
LIMIT 5;

-- Test calculate_pearson_correlation
SELECT app_data.calculate_pearson_correlation(
    '[1,2,3,4,5]'::jsonb,
    '[2,4,6,8,10]'::jsonb
) as correlation;
EOF

echo "3. Test deployment:"
echo "   psql \"${DB_URL}\" -f test-deployment.sql"
echo ""
echo "📱 For iOS app update:"
echo "   Update HANAProxyClient URLs to: ${SUPABASE_URL}/api/supabase-proxy"