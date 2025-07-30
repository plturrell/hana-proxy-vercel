#!/bin/bash

# Remove V1 Agent Files Script
# Safely removes v1 agents that have v2 versions

echo "🗑️  Removing V1 Agent Files..."

# List of v1 files to remove (only those with v2 versions)
V1_FILES=(
    "agents/a2a-protocol-manager.js"
    "agents/api-gateway-agent.js"
    "agents/curriculum-learning-agent.js"
    "agents/market-data-agent.js"
    "agents/news-assessment-hedge-agent.js"
    "agents/news-intelligence-agent.js"
    "agents/ord-registry-manager.js"
)

REMOVED_COUNT=0

for file in "${V1_FILES[@]}"; do
    # Check if v2 version exists
    v2_file="${file%.js}-v2.js"
    
    if [ -f "$v2_file" ]; then
        if [ -f "$file" ]; then
            echo "✅ Removing $file (v2 version exists)"
            rm "$file"
            ((REMOVED_COUNT++))
        else
            echo "ℹ️  $file already removed"
        fi
    else
        echo "⚠️  Skipping $file (no v2 version found)"
    fi
done

echo ""
echo "📊 Summary: Removed $REMOVED_COUNT v1 agent files"
echo ""
echo "📁 Remaining agent files:"
ls -la agents/*.js | grep -v "\.md$" | awk '{print "   " $9}'

echo ""
echo "✅ V1 cleanup complete"