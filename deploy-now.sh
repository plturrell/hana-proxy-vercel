#!/bin/bash

# Deploy script for Knowledge tab fixes
echo "🚀 Deploying Knowledge tab fixes..."

# Navigate to project directory
cd /Users/apple/projects/finsightexperience_perplexity/hana-proxy-vercel

# Add all changes
git add -A

# Commit with descriptive message
git commit -m "Fix Knowledge tab visibility - remove duplicate containers and fix environment variables"

# Push to GitHub
git push origin main

# Force deploy to Vercel
vercel --prod --force

echo "✅ Deployment complete!"