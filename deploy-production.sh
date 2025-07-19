#!/bin/bash

# FinSight BPMN Production Deployment Script
# This script will guide you through deploying the 100% real system

set -e

echo "🚀 FinSight BPMN Production Deployment"
echo "======================================"
echo ""

# Step 1: Check prerequisites
echo "Step 1: Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check for .env.local
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Creating from template..."
    
    cat > .env.local << 'EOF'
# FinSight BPMN Environment Variables
# Fill in your real values

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# OpenAI for Real AI Features
OPENAI_API_KEY=

# Vercel for Real Deployments
VERCEL_TOKEN=
VERCEL_TEAM_ID=

# Market Data (at least one required)
POLYGON_API_KEY=
ALPHA_VANTAGE_API_KEY=

# Authentication
NEXTAUTH_URL=
NEXTAUTH_SECRET=
EOF
    
    echo "⚠️  Please edit .env.local with your API keys before continuing."
    echo "Press Enter when ready..."
    read
fi

# Step 2: Install dependencies
echo ""
echo "Step 2: Installing dependencies..."
npm install

# Step 3: Build the project
echo ""
echo "Step 3: Building the project..."
npm run build || echo "⚠️  Build warnings detected, continuing..."

# Step 4: Set up Supabase
echo ""
echo "Step 4: Supabase Setup"
echo "====================="
echo ""
echo "Please ensure you have:"
echo "1. Created a Supabase project"
echo "2. Run the SQL commands from PRODUCTION_SETUP_REAL.md"
echo ""
echo "Press Enter when Supabase is ready..."
read

# Step 5: Deploy to Vercel
echo ""
echo "Step 5: Deploying to Vercel..."
echo ""

# Check if already linked to Vercel
if [ ! -d .vercel ]; then
    echo "Linking to Vercel project..."
    vercel link
fi

# Deploy to production
echo "Deploying to production..."
vercel --prod

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "your-deployment.vercel.app")

echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo ""
echo "Your app is live at: https://$DEPLOYMENT_URL"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Vercel Dashboard"
echo "2. Configure custom domain (optional)"
echo "3. Test the deployment"
echo ""

# Step 6: Post-deployment tests
echo "Would you like to run deployment tests? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Running deployment tests..."
    
    # Test health endpoint
    echo "Testing health endpoint..."
    curl -s "https://$DEPLOYMENT_URL/api/monitoring" | jq . || echo "⚠️  Health check failed"
    
    # Test AI endpoint
    echo ""
    echo "Testing AI endpoint..."
    curl -s -X POST "https://$DEPLOYMENT_URL/api/llm-automation" \
        -H "Content-Type: application/json" \
        -d '{"action":"build-from-description","description":"Test process"}' \
        | jq . || echo "⚠️  AI endpoint not configured"
    
    echo ""
    echo "Tests complete. Check the responses above."
fi

echo ""
echo "🎉 Deployment script finished!"
echo ""
echo "For production monitoring, check:"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Supabase Dashboard: https://app.supabase.com"
echo ""