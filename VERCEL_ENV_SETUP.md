# Vercel Environment Variables Setup

## Required Environment Variables

Add these environment variables in your Vercel Dashboard:

### 1. Go to Vercel Dashboard
- Navigate to: https://vercel.com/dashboard
- Select your project: `hana-proxy-vercel`
- Go to Settings → Environment Variables

### 2. Add These Variables:

#### Database Connection
```
SUPABASE_URL=https://fnsbxaywhsxqppncqksu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NjUxMjMsImV4cCI6MjA1MDU0MTEyM30.xY2FxBZmUgDW4mfKBTQYnJfJGYZeRHHIJhpb9iLXYEE
```

#### Optional: Service Role (for admin operations)
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4
```

#### AI Integration (Required for agent analysis)
```
GROK_API_KEY=your_grok_api_key_here
```

#### Optional AI Keys
```
XAI_API_KEY=your_xai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

#### Market Data Sources (Optional)
```
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FINNHUB_API_KEY=your_finnhub_key
IEX_CLOUD_API_KEY=your_iex_cloud_key
```

### 3. Environment Scopes

For each variable, select the appropriate environments:
- ✅ Production
- ✅ Preview  
- ✅ Development

### 4. After Adding Variables

1. **Redeploy** your project for changes to take effect
2. **Test** the GraphQL endpoint:
   ```bash
   curl -X POST https://hana-proxy-vercel.vercel.app/api/graphql \
     -H "Content-Type: application/json" \
     -d '{"query": "query { marketIntelligence(symbol: \"AAPL\") { symbol currentPrice } }"}'
   ```

### 5. Security Notes

- Never commit these keys to your repository
- Use different keys for development and production
- Rotate keys regularly
- Monitor usage in your provider dashboards

### 6. Verification

After deployment, verify the environment variables are working:

```javascript
// In your API endpoints, you can log (but not expose):
console.log('Environment check:', {
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
  hasGrokKey: !!process.env.GROK_API_KEY
});
```

### 7. GraphQL Endpoint Features

With proper environment variables, your GraphQL endpoint will provide:

- ✅ Real-time market data from Supabase
- ✅ News sentiment analysis
- ✅ AI-powered agent predictions (with GROK_API_KEY)
- ✅ Opportunity identification
- ✅ Risk assessment
- ✅ Knowledge graph traversal

### 8. Troubleshooting

If the GraphQL endpoint returns empty data:
1. Check environment variables are set correctly
2. Verify database has market data (run `populate-market-data.js`)
3. Check Vercel function logs for errors
4. Ensure API keys are valid and have remaining quota