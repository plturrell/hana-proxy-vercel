# 🚀 Deploy A2A Blockchain System - Step by Step

Follow these steps to deploy the A2A blockchain system:

## Prerequisites
- Supabase account and project
- Vercel account
- Node.js installed

## Step 1: Deploy Database Schemas to Supabase

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Create a new query

### First, deploy vault functions:
```sql
-- Copy the entire contents of database/vault-functions.sql
-- Paste and run in Supabase SQL Editor
```

### Then, deploy A2A schemas:
```sql
-- Copy the entire contents of database/deploy-all-schemas.sql
-- Paste and run in Supabase SQL Editor
```

## Step 2: Store API Keys in Vault

Run this in Supabase SQL Editor:
```sql
-- Replace with your actual API keys
SELECT set_secret('GROK_API_KEY', 'your-actual-grok-api-key', 'Grok AI API key');
SELECT set_secret('XAI_API_KEY', 'your-actual-xai-api-key', 'X.AI API key');
```

## Step 3: Create Environment Variables

Create `.env.local` file in project root:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
GROK_API_KEY=your-grok-api-key
XAI_API_KEY=your-xai-api-key
```

## Step 4: Deploy Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project (get project-ref from Supabase dashboard)
supabase link --project-ref your-project-ref

# Deploy the edge function
cd /Users/apple/projects/finsightexperience_perplexity/hana-proxy-vercel
supabase functions deploy a2a-autonomy-engine
```

## Step 5: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd /Users/apple/projects/finsightexperience_perplexity/hana-proxy-vercel
vercel --prod
```

When prompted:
- Set up and deploy: Y
- Which scope: Select your account
- Link to existing project: N (unless you have one)
- Project name: hana-proxy-vercel (or your choice)
- Directory: ./
- Override settings: N

## Step 6: Add Environment Variables in Vercel

1. Go to your Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `GROK_API_KEY`
   - `XAI_API_KEY`

## Step 7: Verify Deployment

Test the endpoints:

```bash
# Replace with your Vercel URL
VERCEL_URL=https://your-project.vercel.app

# Test health check
curl -X POST $VERCEL_URL/api/a2a-grok-autonomy \
  -H "Content-Type: application/json" \
  -d '{"action": "health_check"}'

# Test blockchain status
curl -X POST $VERCEL_URL/api/a2a-blockchain-bridge \
  -H "Content-Type: application/json" \
  -d '{"action": "get_blockchain_status"}'
```

## Step 8: Verify Database

Run in Supabase SQL Editor:
```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%a2a%' OR table_name LIKE '%blockchain%')
ORDER BY table_name;

-- Check functions were created
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';

-- Check sample agents
SELECT * FROM a2a_agents WHERE blockchain_config IS NOT NULL;
```

## 🎉 Deployment Complete!

Your A2A blockchain system is now live with:
- ✅ Blockchain message authentication
- ✅ Reputation-based filtering
- ✅ Stake-weighted voting
- ✅ Escrow management
- ✅ Secure key storage

## Quick Test Commands

```bash
# Create a test message
curl -X POST $VERCEL_URL/api/a2a-blockchain-message-processor \
  -H "Content-Type: application/json" \
  -d '{
    "action": "process_message",
    "messageId": "blockchain-test-msg-001"
  }'

# Create a test escrow
curl -X POST $VERCEL_URL/api/a2a-blockchain-escrow \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_escrow",
    "taskId": "test-task-001",
    "clientAgentId": "blockchain-agent-alpha",
    "processorAgentId": "blockchain-agent-beta",
    "amount": "1.0",
    "deadline": "2024-12-31T00:00:00Z",
    "requirements": {
      "milestones": [{"name": "completion", "payment_percentage": 100}]
    }
  }'
```

## Troubleshooting

If you see errors:
1. Check all environment variables are set in Vercel
2. Verify database schemas were deployed
3. Ensure Edge Function is deployed
4. Check Vercel function logs for detailed errors