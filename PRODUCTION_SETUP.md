# Production Setup Guide

## Overview

This production-ready HANA proxy solves iOS ALPN negotiation issues by providing a secure, scalable edge function that translates between iOS HTTP/2 preferences and HANA Cloud requirements.

## Architecture

```
iOS App → Vercel Edge Function → HANA Cloud
   ↓              ↓                    ↓
HTTP/2         HTTP/1.1            SQL API
```

## Deployment Steps

### 1. Configure Environment Variables in Vercel Dashboard

```bash
# Required for production
HANA_PROXY_API_KEY=<generate-secure-key>
ALLOWED_ORIGINS=com.standardchartered.finsightexperience
MAX_SQL_LENGTH=50000
REQUEST_TIMEOUT=30000
```

### 2. Deploy to Production

```bash
# Deploy with production configuration
vercel --prod

# Or via GitHub integration
git push origin main
```

### 3. Update iOS App Configuration

In your iOS app's scheme settings or Info.plist:

```xml
<key>HANA_PROXY_URL</key>
<string>https://your-production-domain.vercel.app/api/hana-proxy</string>

<key>VERCEL_PROXY_API_KEY</key>
<string>your-api-key</string>
```

## Security Best Practices

### 1. API Key Authentication

Generate a secure API key:
```bash
openssl rand -hex 32
```

### 2. Domain Restrictions

Set `ALLOWED_ORIGINS` to your app's bundle identifier:
```
ALLOWED_ORIGINS=com.standardchartered.finsightexperience
```

### 3. SQL Query Validation

The proxy validates:
- Maximum SQL length
- Valid hostname format
- Port range (1-65535)
- Required parameters

### 4. Rate Limiting

Consider adding Vercel's rate limiting:
```javascript
import { rateLimit } from '@vercel/edge';

const limiter = rateLimit({
  interval: '1m',
  limit: 100,
});
```

## Monitoring

### 1. Vercel Dashboard

Monitor:
- Request volume
- Error rates
- Response times
- Function logs

### 2. iOS App Metrics

The `HANAVercelProxyClient` provides metrics:

```swift
let metrics = HANAVercelProxyClient.shared.getMetrics()
print("Error rate: \(metrics.errorRate)")
print("Avg response time: \(metrics.averageResponseTime)s")
```

### 3. Alerting

Set up alerts in Vercel for:
- High error rates (>5%)
- Slow response times (>2s)
- Authentication failures

## Performance Optimization

### 1. Edge Regions

Configure regions close to your HANA instance:

```javascript
export const config = {
  runtime: 'edge',
  regions: ['iad1', 'sfo1'], // US East & West
};
```

### 2. Connection Pooling

The iOS client includes:
- Automatic retry with exponential backoff
- Connection reuse
- Request batching capability

### 3. Caching Strategy

For read-heavy queries, consider adding edge caching:

```javascript
// Cache successful responses for 60 seconds
if (hanaResponse.ok && request.method === 'GET') {
  headers['Cache-Control'] = 'public, max-age=60';
}
```

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check HANA Cloud firewall rules
   - Verify proxy has access to HANA

2. **Authentication Failures**
   - Verify API key in both Vercel and iOS
   - Check HANA credentials

3. **CORS Errors**
   - Ensure ALLOWED_ORIGINS is set correctly
   - Check preflight handling

### Debug Mode

Enable debug logging:

```javascript
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Request details:', { ... });
}
```

## Scaling Considerations

### 1. Vercel Limits

- Edge Function timeout: 30 seconds
- Max request size: 4.5 MB
- Concurrent executions: Unlimited

### 2. HANA Connection Limits

Monitor HANA connection pool usage:
- Set appropriate max connections
- Use connection pooling in HANA

### 3. Cost Optimization

- Use Vercel's usage-based pricing
- Monitor function invocations
- Implement request deduplication

## Migration from Mock Data

1. Deploy the proxy
2. Update `HANAVercelProxyClient` URL
3. Remove mock data fallback:

```swift
// Remove this block from HANAConnectionPool
Logger.shared.warning("Using mock data as final fallback")
return getMockData(for: sql)
```

4. Test thoroughly before production release

## Support

- Vercel Status: https://vercel-status.com
- SAP HANA Cloud: https://help.sap.com/hana-cloud
- iOS Issues: Check Xcode logs for detailed errors