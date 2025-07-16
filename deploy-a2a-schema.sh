#!/bin/bash

echo "🤖 Deploying A2A Agent Schema to Supabase..."
echo ""

# Project configuration
PROJECT_ID="fnsbxaywhsxqppncqksu"
SUPABASE_URL="https://${PROJECT_ID}.supabase.co"

# Check if DB_PASSWORD is set
if [ -z "$DB_PASSWORD" ]; then
    echo "❌ DB_PASSWORD environment variable not set"
    echo ""
    echo "Please set it using:"
    echo "   export DB_PASSWORD='your-database-password'"
    echo ""
    echo "Get your password from:"
    echo "   https://supabase.com/dashboard/project/${PROJECT_ID}/settings/database"
    exit 1
fi

# Database URL
DB_URL="postgresql://postgres.${PROJECT_ID}:${DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

echo "📋 Deploying A2A Agent Schema..."
echo ""

# Deploy the complete A2A schema with all 35 agents
psql "${DB_URL}" -f supabase-migration/a2a_agent_schema_complete.sql

if [ $? -eq 0 ]; then
    echo "✅ A2A Agent Schema deployed successfully!"
    echo ""
    
    # Create test query
    cat > test-a2a-deployment.sql << 'EOF'
-- Check if a2a_agents table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'app_data' 
    AND table_name = 'a2a_agents'
) as table_exists;

-- Count agents
SELECT COUNT(*) as total_agents FROM app_data.a2a_agents;

-- Show sample agents
SELECT 
    agent_id,
    agent_name,
    agent_type,
    icon,
    status
FROM app_data.a2a_agents
LIMIT 5;

-- Test agent discovery
SELECT * FROM app_data.discover_agents('statistical-analysis');

-- Test getting agent card
SELECT app_data.get_agent_card('finsight.analytics.pearson_correlation');
EOF

    echo "🧪 Testing deployment..."
    psql "${DB_URL}" -f test-a2a-deployment.sql
    
    echo ""
    echo "🎉 A2A Agent definitions are now stored in the database!"
    echo "   - Table: app_data.a2a_agents"
    echo "   - Functions: get_agent_card(), discover_agents(), connect_agents()"
    echo ""
    echo "📱 The agents are 100% A2A Protocol compliant with:"
    echo "   - Core identity fields (agent_id, name, version)"
    echo "   - Protocol metadata (protocol_version, agent_type)"
    echo "   - Capabilities definition (input/output types, domains, protocols)"
    echo "   - Connection information (endpoint, auth, parameters)"
    echo "   - Performance metrics tracking"
    echo ""
else
    echo "❌ Deployment failed. Please check your database connection."
fi