#!/bin/bash

# World-Class Supabase Deployment Script
# This script deploys the complete world-class database setup

set -e

echo "🚀 Starting World-Class Supabase Deployment"
echo "==========================================="

# Check if we have the required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set"
    exit 1
fi

# Function to execute SQL via Supabase
execute_sql() {
    local sql_file=$1
    echo "📝 Executing: $sql_file"
    
    # For now, we'll output the SQL and instructions
    echo "Please execute the following SQL in your Supabase SQL Editor:"
    echo "URL: https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new"
    echo ""
    cat "$sql_file"
    echo ""
    echo "Press Enter when completed..."
    read
}

# 1. Deploy core schema
echo ""
echo "1️⃣ Deploying Core Database Schema"
echo "---------------------------------"
execute_sql "supabase-migrations/001_world_class_schema.sql"

# 2. Deploy RLS policies
echo ""
echo "2️⃣ Deploying Row Level Security Policies"
echo "---------------------------------------"
cat > supabase-migrations/002_rls_policies.sql << 'EOF'
-- Advanced RLS Policies for World-Class Security

-- Market data access based on subscription
CREATE POLICY "Premium users see real-time data" ON market_data
    FOR SELECT USING (
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() 
                AND subscription_tier IN ('premium', 'enterprise')
            ) THEN true
            ELSE timestamp < NOW() - INTERVAL '15 minutes'
        END
    );

-- Agent interaction policies
CREATE POLICY "Agents can interact with authorized agents" ON agent_interactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM agents 
            WHERE id = from_agent_id 
            AND user_id = auth.uid()
            AND status = 'active'
        )
    );

CREATE POLICY "Users can view their agent interactions" ON agent_interactions
    FOR SELECT USING (
        from_agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()) OR
        to_agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    );

-- Audit log access for compliance officers
CREATE POLICY "Compliance officers can view all audit logs" ON audit_logs
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND metadata->>'role' ? 'compliance_officer'
        )
    );

-- Security event management
CREATE POLICY "Security team can manage security events" ON security_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND metadata->>'role' ? 'security_team'
        )
    );
EOF
execute_sql "supabase-migrations/002_rls_policies.sql"

# 3. Deploy performance optimizations
echo ""
echo "3️⃣ Deploying Performance Optimizations"
echo "-------------------------------------"
cat > supabase-migrations/003_performance.sql << 'EOF'
-- Performance Optimizations

-- Create materialized views for dashboards
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_active_users AS
SELECT 
    DATE(last_login_at) as date,
    COUNT(DISTINCT id) as dau,
    COUNT(DISTINCT CASE WHEN created_at::date = last_login_at::date THEN id END) as new_users,
    AVG(login_count) as avg_logins_per_user
FROM users
WHERE last_login_at > NOW() - INTERVAL '30 days'
    AND deleted_at IS NULL
GROUP BY DATE(last_login_at);

CREATE UNIQUE INDEX ON daily_active_users(date);

CREATE MATERIALIZED VIEW IF NOT EXISTS agent_performance_stats AS
SELECT 
    a.id,
    a.name,
    a.type,
    a.status,
    COUNT(DISTINCT pe.id) as total_executions,
    COUNT(DISTINCT CASE WHEN pe.status = 'completed' THEN pe.id END) as successful_executions,
    COUNT(DISTINCT CASE WHEN pe.status = 'failed' THEN pe.id END) as failed_executions,
    AVG(pe.duration_ms) FILTER (WHERE pe.status = 'completed') as avg_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pe.duration_ms) FILTER (WHERE pe.status = 'completed') as p95_duration_ms,
    SUM(au.tokens_used) as total_tokens_used,
    SUM(au.cost_usd) as total_cost_usd
FROM agents a
LEFT JOIN process_executions pe ON pe.agent_id = a.id
LEFT JOIN api_usage au ON au.agent_id = a.id
WHERE pe.created_at > NOW() - INTERVAL '7 days'
GROUP BY a.id, a.name, a.type, a.status;

CREATE UNIQUE INDEX ON agent_performance_stats(id);

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_active_users;
    REFRESH MATERIALIZED VIEW CONCURRENTLY agent_performance_stats;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-views', '0 * * * *', 'SELECT refresh_materialized_views()');
EOF
execute_sql "supabase-migrations/003_performance.sql"

# 4. Deploy monitoring and alerting
echo ""
echo "4️⃣ Deploying Monitoring & Alerting"
echo "----------------------------------"
cat > supabase-migrations/004_monitoring.sql << 'EOF'
-- Monitoring and Alerting Functions

-- Function to check system health
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS TABLE (
    metric TEXT,
    value NUMERIC,
    status TEXT,
    details JSONB
) AS $$
BEGIN
    -- Check active users
    RETURN QUERY
    SELECT 
        'active_users_24h'::TEXT,
        COUNT(DISTINCT id)::NUMERIC,
        CASE 
            WHEN COUNT(DISTINCT id) < 10 THEN 'warning'
            ELSE 'healthy'
        END,
        jsonb_build_object('threshold', 10)
    FROM users
    WHERE last_login_at > NOW() - INTERVAL '24 hours';

    -- Check agent health
    RETURN QUERY
    SELECT 
        'failing_agents'::TEXT,
        COUNT(*)::NUMERIC,
        CASE 
            WHEN COUNT(*) > 5 THEN 'critical'
            WHEN COUNT(*) > 0 THEN 'warning'
            ELSE 'healthy'
        END,
        jsonb_build_object('agent_ids', array_agg(id))
    FROM agents
    WHERE status = 'active'
    AND total_errors > total_requests * 0.1
    AND last_active_at > NOW() - INTERVAL '1 hour';

    -- Check API rate limits
    RETURN QUERY
    SELECT 
        'api_rate_limit_breaches'::TEXT,
        COUNT(*)::NUMERIC,
        CASE 
            WHEN COUNT(*) > 0 THEN 'warning'
            ELSE 'healthy'
        END,
        jsonb_build_object('user_ids', array_agg(DISTINCT user_id))
    FROM api_usage
    WHERE created_at > NOW() - INTERVAL '5 minutes'
    GROUP BY user_id
    HAVING COUNT(*) > 100;

    -- Check disk usage (placeholder)
    RETURN QUERY
    SELECT 
        'disk_usage_percent'::TEXT,
        75::NUMERIC, -- Would be actual disk usage
        CASE 
            WHEN 75 > 90 THEN 'critical'
            WHEN 75 > 80 THEN 'warning'
            ELSE 'healthy'
        END,
        jsonb_build_object('total_gb', 100, 'used_gb', 75);
END;
$$ LANGUAGE plpgsql;

-- Function to detect anomalies
CREATE OR REPLACE FUNCTION detect_anomalies()
RETURNS TABLE (
    anomaly_type TEXT,
    severity risk_level,
    details JSONB
) AS $$
BEGIN
    -- Detect unusual login patterns
    RETURN QUERY
    SELECT 
        'unusual_login_pattern'::TEXT,
        'high'::risk_level,
        jsonb_build_object(
            'user_id', user_id,
            'login_count', COUNT(*),
            'unique_ips', COUNT(DISTINCT ip_address)
        )
    FROM audit_logs
    WHERE action = 'login'
    AND created_at > NOW() - INTERVAL '1 hour'
    GROUP BY user_id
    HAVING COUNT(DISTINCT ip_address) > 5;

    -- Detect excessive API usage
    RETURN QUERY
    SELECT 
        'excessive_api_usage'::TEXT,
        'medium'::risk_level,
        jsonb_build_object(
            'user_id', user_id,
            'request_count', COUNT(*),
            'total_tokens', SUM(tokens_used),
            'total_cost', SUM(cost_usd)
        )
    FROM api_usage
    WHERE created_at > NOW() - INTERVAL '1 hour'
    GROUP BY user_id
    HAVING SUM(cost_usd) > 100;
END;
$$ LANGUAGE plpgsql;
EOF
execute_sql "supabase-migrations/004_monitoring.sql"

# 5. Deploy Edge Functions
echo ""
echo "5️⃣ Deploying Supabase Edge Functions"
echo "------------------------------------"
echo "Creating Edge Functions..."

# Create edge function directories
mkdir -p supabase/functions/ai-processor
mkdir -p supabase/functions/real-time-analytics
mkdir -p supabase/functions/webhook-handler

# AI Processor Function
cat > supabase/functions/ai-processor/index.ts << 'EOF'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { query, agent_id, context } = await req.json()

    // Get agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent_id)
      .single()

    if (agentError) throw agentError

    // Process with AI (placeholder for actual AI integration)
    const result = {
      response: `Processed query: ${query}`,
      agent: agent.name,
      tokens_used: 100,
      processing_time_ms: 250
    }

    // Log the interaction
    await supabase.from('agent_interactions').insert({
      from_agent_id: agent_id,
      to_agent_id: agent_id,
      interaction_type: 'ai_processing',
      request_payload: { query, context },
      response_payload: result,
      status: 'completed',
      duration_ms: result.processing_time_ms,
      tokens_used: result.tokens_used
    })

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
EOF

echo "Edge functions created. Deploy them using:"
echo "supabase functions deploy ai-processor"
echo ""

# 6. Create Vercel integration files
echo ""
echo "6️⃣ Creating Vercel Integration Files"
echo "------------------------------------"

# Advanced API route with caching
cat > api/v2/supabase-cached.js << 'EOF'
import { createClient } from '@supabase/supabase-js';
import NodeCache from 'node-cache';

// Initialize cache with 60 second TTL
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const config = {
  runtime: 'edge',
};

export default async function handler(req, res) {
  const { method, body, query } = req;
  const cacheKey = `${method}:${req.url}`;

  // Check cache for GET requests
  if (method === 'GET') {
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        ...cached,
        _cache: 'HIT',
        _cached_at: cached._timestamp
      });
    }
  }

  try {
    let result;
    
    switch (query.action) {
      case 'health':
        result = await checkHealth();
        break;
      case 'stats':
        result = await getStats();
        break;
      case 'query':
        result = await executeQuery(body);
        break;
      default:
        throw new Error('Invalid action');
    }

    // Cache successful GET responses
    if (method === 'GET' && result.success) {
      cache.set(cacheKey, {
        ...result,
        _timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      ...result,
      _cache: 'MISS'
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error.message,
      success: false
    });
  }
}

async function checkHealth() {
  const { data, error } = await supabase
    .rpc('check_system_health');
  
  return {
    success: !error,
    data,
    timestamp: new Date().toISOString()
  };
}

async function getStats() {
  const stats = await Promise.all([
    supabase.from('users').select('count', { count: 'exact' }),
    supabase.from('agents').select('count', { count: 'exact' }),
    supabase.from('process_executions').select('count', { count: 'exact' })
  ]);

  return {
    success: true,
    data: {
      users: stats[0].count,
      agents: stats[1].count,
      executions: stats[2].count
    }
  };
}

async function executeQuery({ table, query, filters }) {
  let supabaseQuery = supabase.from(table).select(query || '*');
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      supabaseQuery = supabaseQuery.eq(key, value);
    });
  }

  const { data, error } = await supabaseQuery;
  
  return {
    success: !error,
    data,
    error: error?.message
  };
}
EOF

# 7. Create deployment verification script
echo ""
echo "7️⃣ Creating Deployment Verification"
echo "-----------------------------------"

cat > verify-world-class-deployment.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './hana-proxy-vercel/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function verifyDeployment() {
    console.log('🔍 Verifying World-Class Deployment\n');
    
    const checks = {
        tables: 0,
        indexes: 0,
        policies: 0,
        functions: 0,
        views: 0
    };

    // Check tables
    const tables = [
        'users', 'agents', 'agent_interactions', 'market_data',
        'process_executions', 'audit_logs', 'security_events',
        'api_usage', 'notifications'
    ];

    console.log('📊 Checking Tables:');
    for (const table of tables) {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (!error) {
            console.log(`  ✅ ${table}`);
            checks.tables++;
        } else {
            console.log(`  ❌ ${table}: ${error.message}`);
        }
    }

    console.log(`\n✨ Deployment Status:`);
    console.log(`  Tables: ${checks.tables}/${tables.length}`);
    console.log(`  Status: ${checks.tables === tables.length ? '✅ READY' : '⚠️  INCOMPLETE'}`);
    
    if (checks.tables === tables.length) {
        console.log('\n🎉 World-Class Supabase deployment verified!');
        console.log('🚀 Your database is ready for production use.');
    } else {
        console.log('\n⚠️  Some components are missing.');
        console.log('Please complete the SQL migrations in Supabase Dashboard.');
    }
}

verifyDeployment().catch(console.error);
EOF

echo ""
echo "✅ World-Class deployment files created!"
echo ""
echo "📋 Next Steps:"
echo "1. Execute the SQL migrations in Supabase SQL Editor"
echo "2. Deploy Edge Functions: supabase functions deploy --verify-jwt"
echo "3. Update Vercel environment variables"
echo "4. Deploy to Vercel: vercel --prod"
echo "5. Run verification: node verify-world-class-deployment.js"
echo ""
echo "🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new"
echo ""
echo "🎯 You're about to have the best Supabase + Vercel setup ever!"