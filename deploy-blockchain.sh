#!/bin/bash

# A2A Blockchain System Deployment Script
# This script deploys the complete A2A blockchain system

set -e  # Exit on error

echo "🚀 Starting A2A Blockchain System Deployment..."
echo "=============================================="

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set"
    echo "Please set these environment variables and try again"
    exit 1
fi

# Function to run SQL file in Supabase
run_sql() {
    local sql_file=$1
    local description=$2
    
    echo ""
    echo "📄 $description"
    echo "Running: $sql_file"
    
    # Note: You'll need to run these SQL files manually in Supabase SQL editor
    # or use the Supabase CLI with: supabase db push
    echo "⚠️  Please run the following SQL file in your Supabase SQL editor:"
    echo "   $sql_file"
    echo ""
    read -p "Press enter when completed..."
}

# Step 1: Deploy Vault Functions
echo ""
echo "Step 1: Deploying Vault Functions"
echo "---------------------------------"
run_sql "database/vault-functions.sql" "Creating secure vault for API keys"

# Step 2: Deploy A2A Blockchain Schemas
echo ""
echo "Step 2: Deploying A2A Blockchain Schemas"
echo "----------------------------------------"
run_sql "database/deploy-all-schemas.sql" "Creating all blockchain tables and functions"

# Step 3: Check if Supabase CLI is installed
echo ""
echo "Step 3: Checking Supabase CLI"
echo "-----------------------------"
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Installing..."
    npm install -g supabase
else
    echo "✅ Supabase CLI is installed"
fi

# Step 4: Deploy Edge Function
echo ""
echo "Step 4: Deploying Edge Function"
echo "-------------------------------"
if [ -d "supabase/functions/a2a-autonomy-engine" ]; then
    echo "📦 Deploying a2a-autonomy-engine Edge Function..."
    
    # Check if project is linked
    if [ ! -f "supabase/.temp/project-ref" ]; then
        echo "⚠️  Supabase project not linked. Please run:"
        echo "   supabase link --project-ref your-project-ref"
        read -p "Press enter when completed..."
    fi
    
    # Deploy the function
    supabase functions deploy a2a-autonomy-engine
    echo "✅ Edge Function deployed"
else
    echo "❌ Edge Function directory not found"
fi

# Step 5: Set up environment variables
echo ""
echo "Step 5: Setting up Environment Variables"
echo "---------------------------------------"
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY

# API Keys (update these with your actual keys)
GROK_API_KEY=your-grok-api-key-here
XAI_API_KEY=your-xai-api-key-here

# Blockchain Configuration
BLOCKCHAIN_NETWORK=supabase-private
BLOCKCHAIN_MIN_REPUTATION=400
BLOCKCHAIN_MIN_STAKE=50
EOF
    echo "✅ .env file created (please update API keys)"
else
    echo "✅ .env file already exists"
fi

# Step 6: Install dependencies
echo ""
echo "Step 6: Installing Dependencies"
echo "-------------------------------"
if [ -f "package.json" ]; then
    echo "📦 Installing npm packages..."
    npm install
    echo "✅ Dependencies installed"
fi

# Step 7: Build the project
echo ""
echo "Step 7: Building Project"
echo "-----------------------"
if [ -f "package.json" ]; then
    if grep -q "\"build\":" package.json; then
        echo "🔨 Building project..."
        npm run build || echo "⚠️  No build script found, skipping..."
    fi
fi

# Step 8: Deploy to Vercel
echo ""
echo "Step 8: Deploying to Vercel"
echo "---------------------------"
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
else
    echo "✅ Vercel CLI is installed"
fi

echo "🚀 Deploying to Vercel..."
echo "Note: Make sure you're logged in to Vercel (vercel login)"
read -p "Press enter to deploy to Vercel..."

# Deploy to Vercel
vercel --prod

# Step 9: Post-deployment verification
echo ""
echo "Step 9: Post-Deployment Verification"
echo "-----------------------------------"
echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "Please verify the deployment by:"
echo ""
echo "1. Check database tables in Supabase:"
echo "   SELECT COUNT(*) FROM information_schema.tables"
echo "   WHERE table_schema = 'public'"
echo "   AND table_name LIKE '%a2a%' OR table_name LIKE '%blockchain%';"
echo ""
echo "2. Test the blockchain endpoints:"
echo "   curl -X POST https://your-project.vercel.app/api/a2a-grok-autonomy \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"action\": \"health_check\"}'"
echo ""
echo "3. Store your API keys in Supabase vault:"
echo "   SELECT set_secret('GROK_API_KEY', 'your-actual-key', 'Grok API key');"
echo "   SELECT set_secret('XAI_API_KEY', 'your-actual-key', 'X.AI API key');"
echo ""
echo "=============================================="
echo "✅ A2A Blockchain System Deployment Complete!"
echo "=============================================="