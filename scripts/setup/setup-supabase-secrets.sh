#!/bin/bash

echo "Setting up Supabase secrets..."

# Set the X.AI API key as a Supabase secret
npx supabase secrets set GROK_API_KEY=xai-g3l1agMtmoevIeah1m3llh0QPjbhYLOQezWyMnS6ZtxCh5ZqcWXeWOXRkNNdv8RaZJavrOHTsVnyKw1VY
npx supabase secrets set XAI_API_KEY=xai-g3l1agMtmoevIeah1m3llh0QPjbhYLOQezWyMnS6ZtxCh5ZqcWXeWOXRkNNdv8RaZJavrOHTsVnyKw1VY

echo "Secrets configured!"
echo ""
echo "To verify, run: npx supabase secrets list"