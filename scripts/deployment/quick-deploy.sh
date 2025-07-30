#!/bin/bash
# One-click deployment helper

echo "🚀 World-Class Deployment Helper"
echo "================================"
echo ""
echo "Step 1: Open Supabase SQL Editor"
echo "URL: https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new"
echo ""
echo "Step 2: Copy the SQL from:"
echo "supabase-migrations/001_world_class_schema.sql"
echo ""
echo "Press Enter when SQL is executed..."
read

echo "Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
