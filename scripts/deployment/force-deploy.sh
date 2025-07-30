#!/bin/bash

echo "🚀 Forcing Vercel deployment..."

# Add timestamp to force change
echo "# Deployment timestamp: $(date)" >> vercel.json

# Stage and commit
git add -A
git commit -m "Force deployment at $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main

echo "✅ Deployment triggered"