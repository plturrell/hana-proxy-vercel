# Deploying HANA Proxy to Vercel

## Quick Deploy via GitHub

1. **Push to GitHub:**
   ```bash
   cd hana-proxy-vercel
   git init
   git add .
   git commit -m "Initial HANA proxy for iOS ALPN compatibility"
   git remote add origin https://github.com/plturrell/hana-proxy-vercel.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration
   - Click "Deploy"

3. **Your proxy will be available at:**
   ```
   https://hana-proxy-vercel-plturrell.vercel.app/api/hana-proxy
   ```

## Update iOS App

Once deployed, update the proxy URL in the iOS app:

1. Edit `/ios_app/finsightexperience_perplexity/Services/HANAProxyClient.swift`
2. Update the `proxyURL` with your Vercel deployment URL

## Testing the Proxy

Test with curl:
```bash
curl -X POST https://your-deployment.vercel.app/api/hana-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "your-hana-instance.hanacloud.ondemand.com",
    "port": 443,
    "username": "YOUR_USERNAME",
    "password": "YOUR_PASSWORD",
    "sql": "SELECT 'test' as result FROM DUMMY"
  }'
```

## Security Considerations

For production:
1. Add API key authentication
2. Restrict CORS to your app's domain
3. Add rate limiting
4. Use environment variables for sensitive config