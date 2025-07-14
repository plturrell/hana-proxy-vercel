#!/bin/bash

# Test script for production Exasol setup

echo "🧪 Testing Exasol Production Setup"
echo "=================================="

# Check environment variables
echo "1️⃣ Checking Vercel environment..."
if [ -z "$EXASOL_PROXY_URL" ]; then
    echo "❌ EXASOL_PROXY_URL not set"
else
    echo "✅ EXASOL_PROXY_URL: $EXASOL_PROXY_URL"
fi

if [ -z "$EXASOL_API_KEY" ]; then
    echo "❌ EXASOL_API_KEY not set"
else
    echo "✅ EXASOL_API_KEY: [SET]"
fi

# Test proxy health
if [ ! -z "$EXASOL_PROXY_URL" ]; then
    echo ""
    echo "2️⃣ Testing proxy health..."
    HEALTH_RESPONSE=$(curl -s "$EXASOL_PROXY_URL/health")
    echo "Response: $HEALTH_RESPONSE"
fi

# Test Vercel API
echo ""
echo "3️⃣ Testing Vercel API..."
curl -X POST https://hana-proxy-vercel.vercel.app/api/exasol-production \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test_connection"
  }' | jq .

echo ""
echo "4️⃣ Testing UDF execution..."
curl -X POST https://hana-proxy-vercel.vercel.app/api/exasol-production \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute_udf",
    "function_name": "calculate_sentiment_score",
    "parameters": ["Market outlook is positive", "positive,bullish", "negative,bearish"]
  }' | jq .

echo ""
echo "✅ Test complete!"