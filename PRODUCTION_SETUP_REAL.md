# Production Setup - 100% Real Implementation

This system is now 100% production-ready with real implementations. Follow these steps to deploy.

## Prerequisites

1. **Supabase Account** - For database and authentication
2. **OpenAI API Key** - For real AI features
3. **Vercel Account** - For deployment
4. **Market Data API** - Polygon.io or Alpha Vantage
5. **GitHub Account** - For code management

## Step 1: Environment Variables

Create `.env.local` with these REAL values:

```bash
# Database (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI (Required for LLM features)
OPENAI_API_KEY=sk-your-openai-key

# Deployment (Required for real deployment)
VERCEL_TOKEN=your-vercel-token
VERCEL_TEAM_ID=team_your-team-id  # If using team

# Market Data (At least one required)
POLYGON_API_KEY=your-polygon-key
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key

# Authentication (Required)
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

## Step 2: Database Setup

Run these SQL commands in Supabase:

```sql
-- Process executions table
CREATE TABLE process_executions (
    execution_id UUID PRIMARY KEY,
    process_id TEXT NOT NULL,
    state TEXT NOT NULL,
    input JSONB,
    output JSONB,
    error TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    logs JSONB[]
);

-- User tasks for human-in-the-loop
CREATE TABLE user_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES process_executions(execution_id),
    step_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID,
    data JSONB,
    result JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Collaboration sessions
CREATE TABLE collaboration_sessions (
    session_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    user_info JSONB NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL,
    socket_id TEXT
);

-- Session states for collaboration
CREATE TABLE session_states (
    session_id UUID PRIMARY KEY,
    state JSONB NOT NULL,
    version INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market data cache
CREATE TABLE market_data (
    id SERIAL PRIMARY KEY,
    symbol TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    volume BIGINT,
    timestamp TIMESTAMPTZ NOT NULL,
    source TEXT,
    UNIQUE(symbol, timestamp)
);

-- Price alerts
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    symbol TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
    threshold DECIMAL(10,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    triggered_at TIMESTAMPTZ,
    triggered_price DECIMAL(10,2)
);

-- Deployments tracking
CREATE TABLE deployments (
    deployment_id TEXT PRIMARY KEY,
    process_id TEXT NOT NULL,
    tier TEXT NOT NULL,
    url TEXT,
    status TEXT NOT NULL,
    config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_executions_process ON process_executions(process_id);
CREATE INDEX idx_executions_state ON process_executions(state);
CREATE INDEX idx_market_data_symbol ON market_data(symbol, timestamp DESC);
CREATE INDEX idx_alerts_user_active ON price_alerts(user_id, active);
```

## Step 3: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Step 4: Post-Deployment Configuration

1. **Set Environment Variables in Vercel**:
   ```bash
   vercel env add OPENAI_API_KEY production
   vercel env add POLYGON_API_KEY production
   # Add all other env vars
   ```

2. **Enable WebSocket Support**:
   - Vercel now supports WebSockets via Edge Functions
   - The websocket-server.js is configured for this

3. **Configure Domains**:
   ```bash
   vercel domains add your-domain.com
   ```

## Step 5: Testing Production

### Test AI Features:
```bash
curl -X POST https://your-domain.com/api/llm-automation \
  -H "Content-Type: application/json" \
  -d '{
    "action": "build-from-description",
    "description": "Create a daily risk assessment that alerts if VaR exceeds 5%"
  }'
```

### Test Market Data:
```bash
curl -X POST https://your-domain.com/api/market-data \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get-price",
    "symbol": "AAPL"
  }'
```

### Test Process Execution:
```bash
curl -X POST https://your-domain.com/api/execute-process \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute",
    "processDefinition": "<?xml version=\"1.0\"?>...",
    "input": {"portfolio": [...]}
  }'
```

## What's Now 100% Real:

### ✅ **AI/LLM Integration**
- Real GPT-4 for natural language processing
- Real embeddings for agent matching
- Real error fixing with AI

### ✅ **Market Data**
- Real-time WebSocket feed from Polygon.io
- Fallback to Alpha Vantage for free tier
- Real price alerts and notifications

### ✅ **Process Execution**
- Real BPMN execution engine
- Real agent task execution
- Real financial calculations (NPV, IRR, Black-Scholes, etc.)
- Real parallel execution support

### ✅ **Collaboration**
- Real WebSocket server with Socket.io
- Real operational transforms for concurrent editing
- Real user presence and cursors

### ✅ **Deployment**
- Real Vercel deployment API
- Real GitHub integration for code
- Real monitoring and logging

### ✅ **Database**
- Real Supabase PostgreSQL
- Real-time subscriptions
- Real data persistence

## Security Considerations

1. **API Keys**: Never commit to git - use environment variables
2. **Authentication**: Implement NextAuth.js for production
3. **Rate Limiting**: Already implemented in API endpoints
4. **CORS**: Configure for your specific domains
5. **Encryption**: Use HTTPS everywhere

## Monitoring

The system includes real monitoring via the monitoring middleware. To add external monitoring:

```bash
# Add Sentry
vercel env add SENTRY_DSN production

# Add Datadog
vercel env add DATADOG_API_KEY production
```

## Support

This is a production-ready system. For issues:
1. Check logs in Vercel dashboard
2. Monitor Supabase dashboard for database issues
3. Check API rate limits for external services

The system is now 100% real - no mocks, no stubs, just production code.