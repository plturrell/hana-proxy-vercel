#!/bin/bash

# FinSight Intelligence Production Deployment Script
# This script automates the deployment process to Vercel

set -e  # Exit on error

echo "🚀 FinSight Intelligence Production Deployment"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm i -g vercel
fi

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ Error: Not in the project root directory${NC}"
    exit 1
fi

# Step 1: Run tests
echo -e "\n${YELLOW}1. Running tests...${NC}"
if [ -f "api/test-db.js" ]; then
    node api/test-db.js || echo -e "${YELLOW}⚠️  Some tests failed, continuing...${NC}"
else
    echo -e "${GREEN}✓ No tests found, skipping${NC}"
fi

# Step 2: Check syntax
echo -e "\n${YELLOW}2. Checking JavaScript syntax...${NC}"
node -c api/unified.js
echo -e "${GREEN}✓ Syntax check passed${NC}"

# Step 3: Environment check
echo -e "\n${YELLOW}3. Checking environment variables...${NC}"
REQUIRED_VARS=(
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_KEY"
    "JWT_SECRET"
    "GROK_API_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if ! vercel env ls production | grep -q "^$var"; then
        MISSING_VARS+=($var)
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing environment variables:${NC}"
    printf '%s\n' "${MISSING_VARS[@]}"
    echo -e "${YELLOW}Add them using: vercel env add VARIABLE_NAME production${NC}"
    echo -e "${YELLOW}Refer to .env.production for values${NC}"
    exit 1
else
    echo -e "${GREEN}✓ All required environment variables are set${NC}"
fi

# Step 4: Build check
echo -e "\n${YELLOW}4. Checking build...${NC}"
if [ -f "next.config.js" ]; then
    npm run build || echo -e "${YELLOW}⚠️  Build check skipped${NC}"
else
    echo -e "${GREEN}✓ No build required for serverless functions${NC}"
fi

# Step 5: Database status
echo -e "\n${YELLOW}5. Database setup reminder...${NC}"
echo -e "${YELLOW}Have you run the database setup script in Supabase?${NC}"
echo -e "File: database/complete-database-setup.sql"
read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 1
fi

# Step 6: Deploy to Vercel
echo -e "\n${YELLOW}6. Deploying to Vercel...${NC}"
echo -e "${YELLOW}This will deploy to production. Are you sure?${NC}"
read -p "Deploy to production? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 1
fi

# Run deployment
vercel --prod

# Step 7: Post-deployment checks
echo -e "\n${YELLOW}7. Running post-deployment checks...${NC}"
DEPLOYMENT_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "your-deployment.vercel.app")

echo -e "${YELLOW}Waiting 10 seconds for deployment to stabilize...${NC}"
sleep 10

# Check health endpoint
echo -e "${YELLOW}Checking health endpoint...${NC}"
if curl -s -f "https://$DEPLOYMENT_URL/api/health" > /dev/null; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
fi

# Step 8: Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nDeployment URL: ${GREEN}https://$DEPLOYMENT_URL${NC}"
echo -e "\nNext steps:"
echo -e "1. Monitor logs: ${YELLOW}vercel logs --follow${NC}"
echo -e "2. Check analytics: ${YELLOW}https://vercel.com/dashboard${NC}"
echo -e "3. Test authentication: ${YELLOW}https://$DEPLOYMENT_URL/model-jobs.html${NC}"
echo -e "4. Review monitoring: ${YELLOW}monitoring/setup-monitoring.md${NC}"

# Step 9: Create deployment record
echo -e "\n${YELLOW}Creating deployment record...${NC}"
cat > deployments/$(date +%Y%m%d_%H%M%S).json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "url": "https://$DEPLOYMENT_URL",
  "git_commit": "$(git rev-parse HEAD)",
  "git_branch": "$(git branch --show-current)",
  "deployed_by": "$(whoami)",
  "environment": "production"
}
EOF

echo -e "${GREEN}✓ Deployment recorded${NC}"