#!/bin/bash

# A2A Blockchain System - Vercel Environment Setup Helper
# This script helps you set up environment variables in Vercel

echo "🔧 A2A Blockchain - Vercel Environment Setup"
echo "=========================================="
echo ""
echo "This script will help you set up the required environment variables."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📝 Please provide your Supabase credentials:"
echo "(You can find these in your Supabase project settings)"
echo ""

read -p "SUPABASE_URL: " SUPABASE_URL
read -p "SUPABASE_SERVICE_KEY: " SUPABASE_SERVICE_KEY
read -p "SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -p "GROK_API_KEY (optional, press Enter to skip): " GROK_API_KEY
read -p "XAI_API_KEY (optional, press Enter to skip): " XAI_API_KEY

echo ""
echo "📤 Setting environment variables in Vercel..."

# Set production environment variables
vercel env add SUPABASE_URL production <<< "$SUPABASE_URL"
vercel env add SUPABASE_SERVICE_KEY production <<< "$SUPABASE_SERVICE_KEY"
vercel env add SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY"

if [ ! -z "$GROK_API_KEY" ]; then
    vercel env add GROK_API_KEY production <<< "$GROK_API_KEY"
fi

if [ ! -z "$XAI_API_KEY" ]; then
    vercel env add XAI_API_KEY production <<< "$XAI_API_KEY"
fi

echo ""
echo "✅ Environment variables set!"
echo ""
echo "🚀 Redeploying to apply changes..."
vercel --prod

echo ""
echo "🎉 Setup complete! Your deployment should now have all required environment variables."
echo ""
echo "Next steps:"
echo "1. Deploy database schemas using ./deploy-to-supabase.sh"
echo "2. Deploy Edge Function to Supabase"
echo "3. Test the deployment using ./test-deployment.js"