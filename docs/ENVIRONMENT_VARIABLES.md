# Environment Variables

This document lists all required environment variables for the FinSight Intelligence application to function properly in production.

## Required Variables

### Database Configuration
```bash
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Admin operations
```

### Authentication & Security
```bash
# JWT Configuration (REQUIRED)
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
JWT_EXPIRES_IN=1d                    # Access token expiration (default: 1 day)
JWT_REFRESH_EXPIRES_IN=7d           # Refresh token expiration (default: 7 days)

# Security Configuration
ALLOWED_ORIGINS=https://your-domain.com,https://another-domain.com  # CORS origins
NODE_ENV=production                  # Environment (development|production)
```

### AI Services
```bash
# Grok API (REQUIRED for AI features)
GROK_API_KEY=gsk_your_grok_api_key_here

# OpenAI (Optional - for additional AI features)
OPENAI_API_KEY=sk-your-openai-key-here
```

### Application Configuration
```bash
# Application Metadata
APP_VERSION=1.1.0                    # Application version
SERVICE_NAME=finsight-intelligence   # Service identifier

# Logging Configuration
LOG_LEVEL=info                       # Log level (error|warn|info|debug)
```

### Vercel-Specific Variables
```bash
# Automatically set by Vercel (read-only)
VERCEL_URL=your-app.vercel.app      # Auto-set by Vercel
VERCEL_ENV=production               # Auto-set by Vercel
```

## Optional Variables

### Redis Cache (Enhanced Performance)
```bash
# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
```

### Monitoring & Observability
```bash
# OpenTelemetry (Optional)
OTEL_EXPORTER_JAEGER_ENDPOINT=http://localhost:14268/api/traces
OTEL_SERVICE_NAME=finsight-intelligence
OTEL_ENVIRONMENT=production

# Prometheus Metrics (Optional)
PROMETHEUS_GATEWAY_URL=http://localhost:9091
```

### External Integrations
```bash
# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password

# Webhook URLs (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Development Only
```bash
# Development Configuration (Not needed in production)
PORT=3000                           # Local development port
NEXT_PUBLIC_API_URL=http://localhost:3000/api  # Frontend API URL
```

## Security Guidelines

### JWT Secret
- **CRITICAL**: Use a strong, randomly generated secret (minimum 32 characters)
- Never reuse secrets across environments
- Rotate secrets regularly
- Generate with: `openssl rand -base64 32`

### Database Keys
- Use `SUPABASE_SERVICE_KEY` only for server-side operations
- Never expose service keys in client-side code
- Rotate keys if compromised
- Monitor access logs regularly

### API Keys
- Store in secure environment variable storage
- Never commit to version control
- Use different keys for development/staging/production
- Monitor usage and set up alerts for unusual activity

## Vercel Deployment

### Setting Environment Variables in Vercel

1. **Via Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add each variable with appropriate scope (Production/Preview/Development)

2. **Via Vercel CLI:**
   ```bash
   vercel env add JWT_SECRET
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_SERVICE_KEY
   vercel env add GROK_API_KEY
   ```

3. **From .env file:**
   ```bash
   vercel env pull .env.local
   ```

### Environment Scopes
- **Production**: Live application
- **Preview**: Pull request deployments
- **Development**: Local development (vercel dev)

## Validation

The application validates required environment variables on startup. Missing critical variables will cause the application to fail with clear error messages.

### Required Variables Check
```javascript
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY', 
  'JWT_SECRET'
];

const missing = requiredVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}
```

## Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] API keys are not committed to git
- [ ] CORS origins are restrictive
- [ ] NODE_ENV is set to 'production'
- [ ] Logging level is appropriate
- [ ] All secrets are rotated regularly
- [ ] Environment variables are encrypted at rest
- [ ] Access to environment variables is logged
- [ ] Secrets are not exposed in error messages or logs

## Troubleshooting

### Common Issues

1. **Authentication fails**: Check JWT_SECRET and database keys
2. **CORS errors**: Verify ALLOWED_ORIGINS includes your domain
3. **AI features not working**: Confirm GROK_API_KEY is valid
4. **Database connection fails**: Verify Supabase URL and keys
5. **Rate limiting**: Check if proper REDIS_URL is configured

### Debug Mode
Set `LOG_LEVEL=debug` to enable detailed logging for troubleshooting.

### Health Check
The application provides health check endpoints:
- `/api/health` - Basic health check
- `/api/ready` - Readiness check (includes database)
- `/api/live` - Liveness check