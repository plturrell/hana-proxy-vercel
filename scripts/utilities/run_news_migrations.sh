#!/bin/bash

# News Table Migration Runner
# Purpose: Execute all news table improvements in the correct order
# Author: AI Assistant
# Date: 2025-01-22

set -e  # Exit on error

echo "================================================"
echo "News Table Migration Runner"
echo "================================================"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the hana-proxy-vercel directory"
    exit 1
fi

# Create migrations directory if it doesn't exist
mkdir -p migrations/executed

# Function to run a migration
run_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file")
    
    echo ""
    echo "Running migration: $migration_name"
    echo "----------------------------------------"
    
    # Check if already executed
    if [ -f "migrations/executed/$migration_name.done" ]; then
        echo "✓ Already executed, skipping..."
        return 0
    fi
    
    # Run the migration
    if supabase db push --file "$migration_file"; then
        echo "✓ Migration completed successfully"
        touch "migrations/executed/$migration_name.done"
        date > "migrations/executed/$migration_name.done"
    else
        echo "✗ Migration failed!"
        echo "Please check the error above and fix before continuing."
        exit 1
    fi
}

# Start migrations
echo ""
echo "Starting news table migrations..."
echo "This will improve performance, consistency, and features."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

# Run migrations in order
echo ""
echo "Phase 1: Data Consolidation"
run_migration "migrations/001_consolidate_news_tables.sql"

echo ""
echo "Phase 2: Fix Data Integrity"
run_migration "migrations/002_fix_primary_keys_consistency.sql"

echo ""
echo "Phase 3: Performance Optimization"
run_migration "migrations/003_add_missing_indexes.sql"

echo ""
echo "Phase 4: Partition Management"
run_migration "migrations/004_partition_management.sql"

echo ""
echo "Phase 5: AI Features"
run_migration "migrations/005_add_vector_embeddings.sql"

echo ""
echo "Phase 6: Analytics Views"
run_migration "migrations/006_create_materialized_views.sql"

echo ""
echo "Phase 7: Data Retention"
run_migration "migrations/007_archival_and_retention.sql"

echo ""
echo "Phase 8: Real-time Features"
run_migration "migrations/008_real_time_features.sql"

echo ""
echo "================================================"
echo "All migrations completed successfully!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Verify the migration with: supabase db remote status"
echo "2. Check table statistics with: supabase inspect db table-stats --linked | grep news"
echo "3. Monitor performance improvements in your application"
echo ""
echo "To rollback, restore from your database backup."