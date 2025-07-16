# A2A Agent Schema Deployment

## Overview
This deployment creates a complete A2A (Agent-to-Agent) protocol implementation with all 35 Supabase functions as separate agents stored in the database.

## Deployment Steps

### 1. Deploy to Supabase Database

Set your database password and deploy:
```bash
export DB_PASSWORD='your-supabase-database-password'
./deploy-a2a-schema.sh
```

Or manually using psql:
```bash
psql "postgresql://postgres.fnsbxaywhsxqppncqksu:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres" \
  -f supabase-migration/a2a_agent_schema_complete.sql
```

### 2. What Gets Created

- **Table**: `app_data.a2a_agents` with 35 agent records
- **Functions**:
  - `get_all_a2a_agents()` - Returns all active agents
  - `get_agent_card(agent_id)` - Full A2A metadata for one agent
  - `discover_agents(capability)` - Find agents by capability
  - `connect_agents(source, target)` - Create agent connections
- **View**: `agent_network` - For visualization
- **Permissions**: Granted to authenticated users

### 3. Agent Structure

Each agent has complete A2A Protocol compliance:

```json
{
  "agent_id": "finsight.analytics.pearson_correlation",
  "agent_name": "Pearson Correlation Agent", 
  "agent_version": "1.0.0",
  "protocol_version": "A2A/1.0",
  "agent_type": "analytics",
  "description": "Calculates statistical correlation...",
  "icon": "PC",
  "status": "active",
  "capabilities": {
    "input_types": ["json-array"],
    "output_types": ["numeric"],
    "domains": ["statistical-analysis", "correlation"],
    "protocols": ["REST", "JSON-RPC"],
    "authentication": ["api-key"]
  },
  "connection": {
    "endpoint": "/api/supabase-proxy",
    "function_name": "calculate_pearson_correlation",
    "parameters": [...]
  },
  "metrics": {
    "avg_response_time_ms": 0,
    "success_rate": 100.00,
    "total_requests": 0
  }
}
```

### 4. UI Integration

The model cards now automatically load from the database:
- Dynamic agent card generation
- Real-time agent status
- Database-driven capabilities
- Live connection testing

### 5. Verification

Test the deployment:
```bash
# Check agents were created
psql "..." -c "SELECT COUNT(*) FROM app_data.a2a_agents;"

# Test agent discovery
psql "..." -c "SELECT * FROM app_data.discover_agents('statistical-analysis');"

# Get agent card
psql "..." -c "SELECT app_data.get_agent_card('finsight.analytics.pearson_correlation');"
```

## API Usage

The agents are accessible via `/api/supabase-proxy`:

```javascript
// Get all agents
fetch('/api/supabase-proxy', {
  method: 'POST',
  body: JSON.stringify({ action: 'get_all_a2a_agents' })
});

// Get agent card
fetch('/api/supabase-proxy', {
  method: 'POST', 
  body: JSON.stringify({ 
    action: 'get_agent_card',
    parameters: { p_agent_id: 'finsight.analytics.pearson_correlation' }
  })
});
```

## Coverage

✅ **100% A2A Protocol Compliance**
- Core identity fields
- Protocol metadata  
- Capabilities definition
- Connection information
- Performance metrics
- Timestamps

✅ **All 35 Functions Mapped**
- Analytics agents (9)
- Financial agents (8) 
- ML agents (7)
- NLP agents (4)
- Data agents (7)

✅ **Database Storage**
- Persistent agent definitions
- Query capabilities
- Agent discovery
- Connection tracking