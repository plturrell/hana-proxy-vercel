#!/bin/bash
# Execute A2A Registry Cleanup Migration

echo "🧹 A2A REGISTRY CLEANUP - MIGRATION EXECUTION"
echo "============================================"
echo ""
echo "This will execute the migration to clean up the A2A registry."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

# Check if we're linked to the project
if [ ! -f ".supabase/project-ref" ]; then
    echo "❌ Not linked to Supabase project. Run:"
    echo "   supabase link --project-ref fnsbxaywhsxqppncqksu"
    exit 1
fi

echo "📋 Migration file created:"
echo "   supabase/migrations/20250118000000_cleanup_a2a_registry.sql"
echo ""
echo "📊 What this migration will do:"
echo "   1. Create backup table: a2a_agents_backup_20250118"
echo "   2. Delete all functions from a2a_agents table"
echo "   3. Keep only 9 true autonomous agents"
echo "   4. Create migration log entry"
echo ""
echo "🤖 The 9 agents that will remain:"
echo "   - finsight.analytics.regime_detection"
echo "   - finsight.analytics.portfolio_rebalancing"
echo "   - finsight.analytics.risk_budgeting"
echo "   - finsight.analytics.risk_parity"
echo "   - finsight.analytics.copula_modeling"
echo "   - finsight.analytics.garch_volatility"
echo "   - finsight.analytics.stress_testing"
echo "   - finsight.analytics.performance_attribution"
echo "   - finsight.analytics.portfolio_optimization"
echo ""
echo "⚠️  IMPORTANT: This will modify your production database!"
echo ""
echo "To execute the migration, run:"
echo ""
echo "   supabase db push"
echo ""
echo "You will be prompted for your database password."
echo "The password can be found in your Supabase dashboard under Settings > Database."
echo ""
echo "Alternatively, you can run the migration directly in SQL Editor:"
echo "https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new"
echo ""
echo "Just copy and paste the contents of:"
echo "supabase/migrations/20250118000000_cleanup_a2a_registry.sql"