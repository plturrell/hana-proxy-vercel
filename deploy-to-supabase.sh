#!/bin/bash

# A2A Blockchain System - Supabase Deployment Script
# This script helps deploy all required database schemas to Supabase

echo "🚀 A2A Blockchain System - Database Deployment"
echo "=============================================="

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set"
    echo "Please export these variables:"
    echo "  export SUPABASE_URL=your_supabase_url"
    echo "  export SUPABASE_SERVICE_KEY=your_service_role_key"
    exit 1
fi

# Extract project ref from SUPABASE_URL
PROJECT_REF=$(echo $SUPABASE_URL | sed -n 's/https:\/\/\([^.]*\).*/\1/p')
echo "📍 Project Reference: $PROJECT_REF"

# Function to execute SQL via REST API
execute_sql() {
    local sql_file=$1
    local description=$2
    
    echo ""
    echo "📝 Deploying: $description"
    echo "   File: $sql_file"
    
    # Read SQL file content
    SQL_CONTENT=$(cat "$sql_file")
    
    # Escape JSON
    JSON_SQL=$(echo "$SQL_CONTENT" | jq -Rs .)
    
    # Execute via REST API
    RESPONSE=$(curl -s -X POST \
        "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $JSON_SQL}")
    
    # Check if successful
    if [ $? -eq 0 ]; then
        echo "   ✅ Success!"
    else
        echo "   ❌ Failed: $RESPONSE"
        return 1
    fi
}

# Alternative: Direct connection string method (requires psql)
deploy_with_psql() {
    local sql_file=$1
    local description=$2
    
    echo ""
    echo "📝 Deploying: $description"
    echo "   File: $sql_file"
    
    # Construct database URL
    DB_URL="postgresql://postgres.${PROJECT_REF}:${SUPABASE_SERVICE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    
    # Execute SQL
    psql "$DB_URL" -f "$sql_file"
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Success!"
    else
        echo "   ❌ Failed!"
        return 1
    fi
}

# Check if psql is available
if command -v psql &> /dev/null; then
    echo "✅ Using psql for deployment"
    DEPLOY_METHOD="psql"
else
    echo "⚠️  psql not found. Using REST API method (limited functionality)"
    DEPLOY_METHOD="api"
fi

# Deploy schemas in order
echo ""
echo "🔧 Starting deployment..."

# 1. Deploy vault functions first
if [ "$DEPLOY_METHOD" = "psql" ]; then
    deploy_with_psql "database/vault-functions.sql" "Vault Functions (Secure Key Storage)"
else
    echo "⚠️  Vault functions require psql. Please install PostgreSQL client."
    echo "   On macOS: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# 2. Deploy main A2A blockchain schemas
if [ -f "database/deploy-all-schemas.sql" ]; then
    if [ "$DEPLOY_METHOD" = "psql" ]; then
        deploy_with_psql "database/deploy-all-schemas.sql" "A2A Blockchain Complete Schema"
    fi
else
    echo "❌ Error: database/deploy-all-schemas.sql not found"
    exit 1
fi

echo ""
echo "=============================================="
echo "🎉 Database deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set your API keys in the vault:"
echo "   psql \$DB_URL -c \"SELECT set_secret('GROK_API_KEY', 'your-key', 'Grok AI API key');\""
echo "   psql \$DB_URL -c \"SELECT set_secret('XAI_API_KEY', 'your-key', 'X.AI API key');\""
echo ""
echo "2. Deploy the Edge Function:"
echo "   supabase functions deploy a2a-autonomy-engine"
echo ""
echo "3. Add environment variables to Vercel:"
echo "   https://vercel.com/plturrells-projects/hana-proxy-vercel/settings/environment-variables"
echo ""
echo "4. Test the deployment:"
echo "   curl -X POST https://hana-proxy-vercel-42n5xfxkv-plturrells-projects.vercel.app/api/a2a-grok-autonomy \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"action\": \"health_check\"}'"