#!/bin/bash

echo "🔧 Deploying Knowledge tab content fix..."

cd /Users/apple/projects/finsightexperience_perplexity/hana-proxy-vercel

git add public/teach-jobs.html
git commit -m "Fix Knowledge tab content display - correct div structure"
git push origin main

echo "⏳ Triggering Vercel deployment..."
vercel --prod --force

echo "✅ Knowledge tab fix deployed!"