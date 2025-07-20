#!/bin/bash
# A2A Registry Cleanup via Supabase API

echo "🧹 A2A REGISTRY CLEANUP VIA API"
echo "=============================================="

# Load environment variables
source .env

# Check if variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY"
  exit 1
fi

# The 9 true autonomous agents to preserve
TRUE_AGENTS=(
  "finsight.analytics.regime_detection"
  "finsight.analytics.portfolio_rebalancing"
  "finsight.analytics.risk_budgeting"
  "finsight.analytics.risk_parity"
  "finsight.analytics.copula_modeling"
  "finsight.analytics.garch_volatility"
  "finsight.analytics.stress_testing"
  "finsight.analytics.performance_attribution"
  "finsight.analytics.portfolio_optimization"
)

# Build the NOT IN clause
NOT_IN_LIST=""
for agent in "${TRUE_AGENTS[@]}"; do
  if [ -z "$NOT_IN_LIST" ]; then
    NOT_IN_LIST="\"$agent\""
  else
    NOT_IN_LIST="$NOT_IN_LIST,\"$agent\""
  fi
done

echo ""
echo "📋 STEP 1: Getting current registry count..."

# Get all agents
RESPONSE=$(curl -s -X GET \
  "$SUPABASE_URL/rest/v1/a2a_agents?select=agent_id" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY")

# Check if response is valid
if [[ "$RESPONSE" == *"Invalid API key"* ]]; then
  echo "❌ API key authentication failed"
  echo ""
  echo "📝 Manual SQL Cleanup Required"
  echo "Execute this in Supabase Dashboard:"
  echo "https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new"
  echo ""
  echo "DELETE FROM a2a_agents WHERE agent_id NOT IN ($NOT_IN_LIST);"
  exit 1
fi

# Count agents
TOTAL_COUNT=$(echo "$RESPONSE" | jq '. | length')
echo "✅ Total agents found: $TOTAL_COUNT"

# Count true agents
TRUE_COUNT=0
for agent in "${TRUE_AGENTS[@]}"; do
  if [[ "$RESPONSE" == *"$agent"* ]]; then
    ((TRUE_COUNT++))
  fi
done

FUNCTIONS_TO_REMOVE=$((TOTAL_COUNT - TRUE_COUNT))

echo ""
echo "📊 Registry status:"
echo "   Total registrations: $TOTAL_COUNT"
echo "   True autonomous agents: $TRUE_COUNT/9"
echo "   Functions to remove: $FUNCTIONS_TO_REMOVE"

if [ $FUNCTIONS_TO_REMOVE -eq 0 ]; then
  echo ""
  echo "✅ Registry is already clean!"
  exit 0
fi

echo ""
echo "📋 STEP 2: Executing cleanup..."
echo "This will delete $FUNCTIONS_TO_REMOVE functions from the registry."
echo ""

# For safety, show the SQL command instead of executing
echo "⚠️  For safety, please execute this SQL manually:"
echo ""
echo "-- Backup first"
echo "CREATE TABLE a2a_agents_backup_$(date +%Y%m%d_%H%M%S) AS SELECT * FROM a2a_agents;"
echo ""
echo "-- Then cleanup"
echo "DELETE FROM a2a_agents WHERE agent_id NOT IN ($NOT_IN_LIST);"
echo ""
echo "-- Verify results"
echo "SELECT COUNT(*) as remaining_agents FROM a2a_agents;"
echo ""
echo "🔗 Execute at: https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new"