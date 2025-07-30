# Production Monitoring Setup

This guide covers setting up comprehensive monitoring for the FinSight Intelligence application.

## 1. Log Management (Winston)

### Log Files Created Automatically
- `logs/error.log` - Error-level logs only
- `logs/combined.log` - All logs
- `logs/audit.log` - Security audit trail
- `logs/performance.log` - Performance metrics

### Vercel Log Streaming
```bash
# Install Vercel CLI
npm i -g vercel

# Stream logs in real-time
vercel logs --follow

# Filter by function
vercel logs --filter api/unified.js

# Export logs
vercel logs --since 24h > production-logs.txt
```

## 2. Application Performance Monitoring (APM)

### Option A: Vercel Analytics (Recommended)
1. Enable in Vercel Dashboard → Project → Analytics
2. No code changes needed
3. Tracks:
   - Request duration
   - Error rates
   - Geographic distribution
   - Function performance

### Option B: OpenTelemetry + Jaeger
```bash
# Set environment variables
OTEL_EXPORTER_JAEGER_ENDPOINT=http://your-jaeger:14268/api/traces
OTEL_SERVICE_NAME=finsight-intelligence
OTEL_ENVIRONMENT=production
```

## 3. Error Tracking

### Built-in Error Handling
The application includes comprehensive error tracking:
- Correlation IDs for request tracing
- Structured error logging with Winston
- Error categorization (AppError types)
- Stack trace capture in development

### Error Alerts
Configure alerts in Vercel:
1. Go to Project Settings → Integrations
2. Add Slack/Discord/Email integration
3. Set up alerts for:
   - 5xx errors
   - High error rate (>1%)
   - Function timeouts

## 4. Database Monitoring

### Supabase Dashboard
Monitor at: https://app.supabase.com/project/YOUR_PROJECT/database

Key metrics:
- Query performance
- Connection pool usage
- Storage usage
- Replication lag

### Database Queries to Monitor
```sql
-- Check slow queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Monitor connection count
SELECT count(*) FROM pg_stat_activity;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

## 5. Security Monitoring

### Authentication Monitoring
```sql
-- Failed login attempts (last 24h)
SELECT 
    email,
    ip_address,
    COUNT(*) as attempts,
    MAX(attempted_at) as last_attempt
FROM login_attempts
WHERE 
    attempted_at > NOW() - INTERVAL '24 hours'
    AND success = false
GROUP BY email, ip_address
HAVING COUNT(*) > 5
ORDER BY attempts DESC;

-- Suspicious token usage
SELECT 
    user_id,
    COUNT(DISTINCT ip_address) as unique_ips,
    COUNT(*) as total_requests
FROM refresh_tokens
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(DISTINCT ip_address) > 3;
```

### Rate Limiting Monitoring
The application tracks rate limits in memory. Monitor via logs:
```bash
vercel logs --filter "Rate limit exceeded"
```

## 6. Uptime Monitoring

### Option A: Vercel Checks (Built-in)
Automatically monitors deployment health

### Option B: External Monitoring
Set up external monitors for:
- `https://your-domain.com/api/health` - Basic health
- `https://your-domain.com/api/ready` - Readiness (includes DB)
- `https://your-domain.com/api/live` - Liveness

Recommended services:
- UptimeRobot (free tier available)
- Pingdom
- StatusCake

## 7. Custom Dashboards

### Metrics to Track
1. **API Performance**
   - Request count by endpoint
   - Average response time
   - Error rate by endpoint
   - Rate limit hits

2. **Business Metrics**
   - Active users (last 24h)
   - Documents processed
   - Contracts deployed
   - AI queries processed

3. **Infrastructure**
   - Function invocations
   - Cold starts
   - Memory usage
   - Database connections

### Dashboard Queries
```sql
-- Daily active users
SELECT COUNT(DISTINCT user_id) as dau
FROM user_sessions
WHERE last_activity_at > NOW() - INTERVAL '24 hours';

-- API usage by endpoint
SELECT 
    action,
    COUNT(*) as requests,
    AVG(duration_ms) as avg_duration,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as errors
FROM api_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY action
ORDER BY requests DESC;

-- Document processing stats
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as documents_processed,
    SUM(file_size_bytes) as total_bytes
FROM documents
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

## 8. Alerting Rules

### Critical Alerts (Immediate)
- Database connection failures
- Authentication service down
- Error rate > 5%
- Response time > 5s (p99)

### Warning Alerts (15 min delay)
- Error rate > 1%
- Response time > 2s (p95)
- High memory usage (>90%)
- Rate limit hits > 100/hour

### Info Alerts (Daily summary)
- Daily active users
- Total API requests
- New user signups
- Document processing stats

## 9. Automated Health Checks

Create a scheduled job to verify system health:

```javascript
// monitoring/health-check.js
const checks = [
  { name: 'API', url: '/api/health' },
  { name: 'Database', url: '/api/ready' },
  { name: 'Auth', url: '/api/unified?action=a2a_agents' },
];

async function runHealthChecks() {
  for (const check of checks) {
    try {
      const response = await fetch(`${BASE_URL}${check.url}`, {
        headers: { 'Authorization': `Bearer ${MONITORING_TOKEN}` }
      });
      
      if (!response.ok) {
        await sendAlert(`${check.name} health check failed: ${response.status}`);
      }
    } catch (error) {
      await sendAlert(`${check.name} health check error: ${error.message}`);
    }
  }
}
```

## 10. Deployment Checklist

Before each deployment:
- [ ] Review error logs from last 24h
- [ ] Check current API performance metrics
- [ ] Verify database migration success
- [ ] Test authentication flow
- [ ] Confirm monitoring alerts are working
- [ ] Document any new endpoints/features

After deployment:
- [ ] Monitor error rates for 30 minutes
- [ ] Check cold start performance
- [ ] Verify all health checks pass
- [ ] Review initial user sessions
- [ ] Confirm no regression in response times

## 11. Monthly Review

Schedule monthly reviews to:
1. Analyze performance trends
2. Review security incidents
3. Optimize slow queries
4. Update monitoring thresholds
5. Clean up old logs/data
6. Review and rotate secrets