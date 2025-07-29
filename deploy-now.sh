#!/bin/bash
# Vercel Direct Deployment Script
# Created: January 29, 2025

echo "🚀 Starting Vercel deployment..."
echo "Teaching system ready for deployment!"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📦 Deploying to Vercel..."
vercel --prod --force

echo "✅ Deployment command executed!"
echo "Check https://vercel.com/dashboard for deployment status"