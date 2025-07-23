/**
 * Agent Health Monitoring System
 * Monitors the status and performance of all 8 agents
 * Provides health checks, performance metrics, and alerting
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';
const supabase = createClient(supabaseUrl, supabaseKey);

// Agent configurations
const AGENTS = [
  {
    id: 'news-intelligence',
    name: 'News Intelligence Agent',
    endpoint: '/api/agents/news-intelligence',
    healthCheck: { action: 'health' },
    critical: true
  },
  {
    id: 'market-data',
    name: 'Market Data Agent',
    endpoint: '/api/agents/market-data',
    healthCheck: { action: 'health' },
    critical: true
  },
  {
    id: 'curriculum-learning',
    name: 'Curriculum Learning Agent',
    endpoint: '/api/agents/curriculum-learning',
    healthCheck: { action: 'health' },
    critical: false
  },
  {
    id: 'news-assessment-hedge',
    name: 'News Assessment Hedge Agent',
    endpoint: '/api/agents/news-assessment-hedge',
    healthCheck: { action: 'health' },
    critical: true
  },
  {
    id: 'a2a-protocol-manager',
    name: 'A2A Protocol Manager',
    endpoint: '/api/agents/a2a-protocol-manager',
    healthCheck: { action: 'health' },
    critical: false
  },
  {
    id: 'ord-registry-manager',
    name: 'ORD Registry Manager',
    endpoint: '/api/agents/ord-registry-manager',
    healthCheck: { action: 'health' },
    critical: false
  },
  {
    id: 'api-gateway',
    name: 'API Gateway Agent',
    endpoint: '/api/agents/api-gateway',
    healthCheck: { action: 'health' },
    critical: true
  },
  {
    id: 'orchestrator',
    name: 'Function Orchestrator',
    endpoint: '/api/functions/orchestrator',
    healthCheck: { method: 'GET' },
    critical: true
  }
];

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).json({}).setHeader(corsHeaders);
  }

  const { action = 'monitor' } = req.query || req.body || {};
  
  try {
    switch (action) {
      case 'monitor':
        return await monitorAllAgents(res);
        
      case 'health':
        return await checkAgentHealth(req, res);
        
      case 'metrics':
        return await getAgentMetrics(res);
        
      case 'alerts':
        return await checkAlerts(res);
        
      case 'history':
        return await getHealthHistory(res);
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Health monitor error:', error);
    return res.status(500).json({ 
      error: 'Health check failed', 
      details: error.message 
    });
  }
}

async function monitorAllAgents(res) {
  console.log('🔍 Monitoring all agents...');
  
  const results = {
    timestamp: new Date().toISOString(),
    healthy: 0,
    unhealthy: 0,
    degraded: 0,
    agents: []
  };
  
  // Check each agent
  for (const agent of AGENTS) {
    const health = await checkAgentHealthStatus(agent);
    results.agents.push(health);
    
    if (health.status === 'healthy') results.healthy++;
    else if (health.status === 'degraded') results.degraded++;
    else results.unhealthy++;
  }
  
  // Calculate overall system health
  results.overallHealth = calculateOverallHealth(results);
  
  // Store monitoring results
  await storeHealthMetrics(results);
  
  // Check if alerts need to be triggered
  await checkAndTriggerAlerts(results);
  
  return res.status(200).json(results);
}

async function checkAgentHealthStatus(agent) {
  const startTime = Date.now();
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://hana-proxy-vercel-95h9zguqh-plturrells-projects.vercel.app';
  
  try {
    // Make health check request
    const response = await fetch(`${baseUrl}${agent.endpoint}`, {
      method: agent.healthCheck.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: agent.healthCheck.method === 'GET' ? undefined : JSON.stringify(agent.healthCheck),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    const isHealthy = response.ok;
    
    // Get recent performance metrics
    const metrics = await getRecentMetrics(agent.id);
    
    return {
      id: agent.id,
      name: agent.name,
      status: isHealthy ? 'healthy' : 'unhealthy',
      responseTime,
      statusCode: response.status,
      critical: agent.critical,
      lastChecked: new Date().toISOString(),
      metrics: {
        avgResponseTime: metrics.avgResponseTime || responseTime,
        successRate: metrics.successRate || (isHealthy ? 100 : 0),
        lastError: metrics.lastError
      }
    };
  } catch (error) {
    return {
      id: agent.id,
      name: agent.name,
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message,
      critical: agent.critical,
      lastChecked: new Date().toISOString()
    };
  }
}

async function getRecentMetrics(agentId) {
  // Get metrics from last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data } = await supabase
    .from('agent_health_metrics')
    .select('response_time, status, error_message')
    .eq('agent_id', agentId)
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (!data || data.length === 0) {
    return {};
  }
  
  const successful = data.filter(m => m.status === 'healthy').length;
  const avgResponseTime = data.reduce((sum, m) => sum + (m.response_time || 0), 0) / data.length;
  const lastError = data.find(m => m.error_message)?.error_message;
  
  return {
    avgResponseTime: Math.round(avgResponseTime),
    successRate: Math.round((successful / data.length) * 100),
    lastError
  };
}

async function storeHealthMetrics(results) {
  // Store overall health snapshot
  await supabase
    .from('agent_health_snapshots')
    .insert({
      healthy_count: results.healthy,
      unhealthy_count: results.unhealthy,
      degraded_count: results.degraded,
      overall_health: results.overallHealth,
      snapshot_data: results
    });
  
  // Store individual agent metrics
  const metrics = results.agents.map(agent => ({
    agent_id: agent.id,
    agent_name: agent.name,
    status: agent.status,
    response_time: agent.responseTime,
    status_code: agent.statusCode,
    error_message: agent.error,
    is_critical: agent.critical
  }));
  
  await supabase
    .from('agent_health_metrics')
    .insert(metrics);
}

async function checkAndTriggerAlerts(results) {
  const alerts = [];
  
  // Check for critical agents down
  const criticalDown = results.agents.filter(a => a.critical && a.status === 'unhealthy');
  if (criticalDown.length > 0) {
    alerts.push({
      severity: 'critical',
      type: 'agent_down',
      message: `Critical agents down: ${criticalDown.map(a => a.name).join(', ')}`,
      agents: criticalDown.map(a => a.id)
    });
  }
  
  // Check for degraded performance
  const degraded = results.agents.filter(a => a.responseTime > 3000);
  if (degraded.length > 0) {
    alerts.push({
      severity: 'warning',
      type: 'performance_degradation',
      message: `Agents with slow response: ${degraded.map(a => a.name).join(', ')}`,
      agents: degraded.map(a => a.id)
    });
  }
  
  // Check overall system health
  if (results.overallHealth < 70) {
    alerts.push({
      severity: results.overallHealth < 50 ? 'critical' : 'warning',
      type: 'system_health_low',
      message: `Overall system health at ${results.overallHealth}%`,
      health_score: results.overallHealth
    });
  }
  
  // Store alerts
  if (alerts.length > 0) {
    await supabase
      .from('agent_alerts')
      .insert(alerts);
  }
  
  return alerts;
}

function calculateOverallHealth(results) {
  const totalAgents = results.agents.length;
  const criticalAgents = results.agents.filter(a => a.critical).length;
  const healthyCritical = results.agents.filter(a => a.critical && a.status === 'healthy').length;
  
  // Weight critical agents more heavily
  const criticalScore = (healthyCritical / criticalAgents) * 70; // 70% weight
  const overallScore = (results.healthy / totalAgents) * 30; // 30% weight
  
  return Math.round(criticalScore + overallScore);
}

async function getAgentMetrics(res) {
  const { period = '1h', agentId } = req.query || {};
  
  const periodMap = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };
  
  const since = new Date(Date.now() - (periodMap[period] || periodMap['1h'])).toISOString();
  
  let query = supabase
    .from('agent_health_metrics')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  
  if (agentId) {
    query = query.eq('agent_id', agentId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Aggregate metrics by agent
  const aggregated = {};
  
  data.forEach(metric => {
    if (!aggregated[metric.agent_id]) {
      aggregated[metric.agent_id] = {
        agent_id: metric.agent_id,
        agent_name: metric.agent_name,
        total_checks: 0,
        successful_checks: 0,
        failed_checks: 0,
        avg_response_time: 0,
        max_response_time: 0,
        min_response_time: Infinity,
        response_times: []
      };
    }
    
    const agg = aggregated[metric.agent_id];
    agg.total_checks++;
    
    if (metric.status === 'healthy') {
      agg.successful_checks++;
    } else {
      agg.failed_checks++;
    }
    
    if (metric.response_time) {
      agg.response_times.push(metric.response_time);
      agg.max_response_time = Math.max(agg.max_response_time, metric.response_time);
      agg.min_response_time = Math.min(agg.min_response_time, metric.response_time);
    }
  });
  
  // Calculate averages
  Object.values(aggregated).forEach(agg => {
    if (agg.response_times.length > 0) {
      agg.avg_response_time = Math.round(
        agg.response_times.reduce((sum, rt) => sum + rt, 0) / agg.response_times.length
      );
    }
    agg.success_rate = Math.round((agg.successful_checks / agg.total_checks) * 100);
    delete agg.response_times; // Remove raw data
  });
  
  return res.status(200).json({
    period,
    since,
    metrics: Object.values(aggregated)
  });
}

async function checkAlerts(res) {
  const { resolved = false } = req.query || {};
  
  let query = supabase
    .from('agent_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (!resolved) {
    query = query.is('resolved_at', null);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return res.status(200).json({
    alerts: data || [],
    unresolved_count: data?.filter(a => !a.resolved_at).length || 0
  });
}

async function getHealthHistory(res) {
  const { hours = 24 } = req.query || {};
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('agent_health_snapshots')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  
  return res.status(200).json({
    history: data || [],
    period_hours: hours
  });
}