#!/bin/bash

# Deployment script for HANA Vercel Proxy

echo "🚀 Deploying HANA Proxy to Vercel..."

# Initialize git repository
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial HANA proxy for iOS ALPN compatibility"
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🔄 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Copy your deployment URL from above"
echo "2. Update the proxyURL in HANAProxyClient.swift"
echo "3. Test with: swift ../test_vercel_proxy.swift"