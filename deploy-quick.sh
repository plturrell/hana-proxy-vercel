#!/bin/bash

# Quick deployment to Vercel (assuming database is already set up)

echo "🚀 Quick Deploy to Vercel"
echo "========================"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to production
echo "Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Add environment variables in Vercel dashboard:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_KEY" 
echo "   - GROK_API_KEY"
echo "   - XAI_API_KEY"
echo ""
echo "2. Test your deployment:"
echo "   curl -X POST https://your-project.vercel.app/api/a2a-grok-autonomy \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"action\": \"health_check\"}'"