#!/bin/bash

# Set Vercel environment variables for the News Intelligence System

echo "🔧 Setting Vercel Environment Variables..."
echo "======================================="

# Set SUPABASE_URL
vercel env add SUPABASE_URL production <<< "https://fnsbxaywhsxqppncqksu.supabase.co"
echo "✅ SUPABASE_URL set"

# Set SUPABASE_SERVICE_KEY
vercel env add SUPABASE_SERVICE_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4"
echo "✅ SUPABASE_SERVICE_KEY set"

# Set SUPABASE_ANON_KEY
vercel env add SUPABASE_ANON_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTE5NTYsImV4cCI6MjA2Nzk4Nzk1Nn0.1Y6aIJmVk4t0QJzLmLRpWKBhHu98EdSH5fWHgyW6nX8"
echo "✅ SUPABASE_ANON_KEY set"

# Set PERPLEXITY_API_KEY
vercel env add PERPLEXITY_API_KEY production <<< "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"
echo "✅ PERPLEXITY_API_KEY set"

echo ""
echo "🚀 Environment variables set successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Redeploy to apply env vars: vercel --prod"
echo "2. Wait 5 minutes for first cron execution"
echo "3. Check status: https://hana-proxy-vercel-4j7pac2eu-plturrells-projects.vercel.app/api/news-realtime?action=status"
echo ""