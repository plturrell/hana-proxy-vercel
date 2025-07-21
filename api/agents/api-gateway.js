/**
 * API Gateway Agent API Endpoint
 * RESTful interface for gateway management and request routing
 */

import { IntelligentAPIGatewayAgent } from '../../agents/api-gateway-agent-v2.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

let gatewayInstance = null;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Agent-ID');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize API Gateway Agent if needed
    if (!gatewayInstance) {
      const agentData = {
        agent_id: 'finsight.interface.api_gateway',
        agent_name: 'API Gateway Agent',
        agent_type: 'interface',
        voting_power: 100
      };
      
      try {
        gatewayInstance = new IntelligentAPIGatewayAgent(agentData);
        await gatewayInstance.initialize();
      } catch (initError) {
        console.error('Failed to initialize API Gateway Agent:', initError);
        // Create minimal fallback agent
        gatewayInstance = {
          id: 'finsight.interface.api_gateway',
          capabilities: ['request_routing', 'rate_limiting', 'authentication'],
          routingTable: new Map(),
          requestMetrics: new Map(),
          rateLimiters: new Map([
            ['global', { limit: 100, window: 60000, requests: new Map() }],
            ['per_ip', { limit: 50, window: 60000, requests: new Map() }]
          ]),
          authenticationCache: new Map(),
          authProviders: {},
          gatewayConfig: { auth_cache_ttl: 300000 },
          getGatewayStatistics: async () => ({
            routing: { total_routes: 0, active_routes: 0 },
            performance: {
              error_rates: 100,
              avg_response_times: 999999,
              throughput: 0
            }
          }),
          calculateAverageResponseTimes: () => 999999,
          calculateErrorRates: () => 100,
          calculateThroughput: () => 0,
          routeRequest: async (request) => {
            throw new Error('Agent initialization failed - routing unavailable');
          },
          refreshRoutingTable: async () => {
            throw new Error('Agent initialization failed - route refresh unavailable');
          }
        };
      }
    }

    const { action } = req.query;

    if (req.method === 'GET') {
      switch (action) {
        case 'status':
          return await handleStatusRequest(req, res);
        case 'routes':
          return await handleRoutesRequest(req, res);
        case 'metrics':
          return await handleMetricsRequest(req, res);
        case 'rate_limits':
          return await handleRateLimitsRequest(req, res);
        case 'auth_status':
          return await handleAuthStatusRequest(req, res);
        case 'health':
          return await handleHealthRequest(req, res);
        case 'statistics':
          return await handleStatisticsRequest(req, res);
        default:
          return await handleStatusRequest(req, res);
      }
    }

    if (req.method === 'POST') {
      const { action } = req.body;
      
      switch (action) {
        case 'route':
          return await handleRouteRequest(req, res);
        case 'refresh_routes':
          return await handleRefreshRoutes(req, res);
        case 'add_route':
          return await handleAddRoute(req, res);
        case 'remove_route':
          return await handleRemoveRoute(req, res);
        case 'update_rate_limit':
          return await handleUpdateRateLimit(req, res);
        case 'clear_cache':
          return await handleClearCache(req, res);
        default:
          return res.status(400).json({
            success: false,
            error: 'Unknown action',
            available_actions: ['route', 'refresh_routes', 'add_route', 'remove_route', 'update_rate_limit', 'clear_cache']
          });
      }
    }

    // For all other requests, route them through the gateway
    return await handleGatewayRouting(req, res);

  } catch (error) {
    console.error('API Gateway error:', error);
    return res.status(500).json({
      success: false,
      error: 'Gateway error',
      details: error.message
    });
  }
}

/**
 * Handle status requests
 */
async function handleStatusRequest(req, res) {
  try {
    const stats = await gatewayInstance.getGatewayStatistics();
    
    return res.json({
      success: true,
      agent_id: 'finsight.interface.api_gateway',
      status: 'active',
      uptime: process.uptime(),
      gateway_statistics: stats,
      capabilities: gatewayInstance.capabilities,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get status',
      details: error.message
    });
  }
}

/**
 * Handle routes overview requests
 */
async function handleRoutesRequest(req, res) {
  try {
    const { path_filter, target_filter } = req.query;
    
    const routes = Array.from(gatewayInstance.routingTable.entries())
      .filter(([path, route]) => {
        if (path_filter && !path.includes(path_filter)) return false;
        if (target_filter && !route.target_agent?.includes(target_filter)) return false;
        return true;
      })
      .map(([path, route]) => ({
        path,
        target_agent: route.target_agent,
        target_type: route.target_type,
        resource_type: route.resource_type,
        auth_required: route.auth_required !== false,
        rate_limit: route.rate_limit,
        circuit_breaker_state: route.circuit_breaker?.state || 'closed',
        load_balancing: route.load_balancing
      }));

    return res.json({
      success: true,
      total_routes: gatewayInstance.routingTable.size,
      filtered_count: routes.length,
      routes: routes,
      filters_applied: { path_filter, target_filter },
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get routes',
      details: error.message
    });
  }
}

/**
 * Handle metrics requests
 */
async function handleMetricsRequest(req, res) {
  try {
    const { endpoint_filter, time_window = '1h' } = req.query;
    
    const metrics = Array.from(gatewayInstance.requestMetrics.entries())
      .filter(([endpoint, metrics]) => {
        if (endpoint_filter && !endpoint.includes(endpoint_filter)) return false;
        return true;
      })
      .map(([endpoint, metrics]) => ({
        endpoint,
        total_requests: metrics.total_requests,
        success_count: metrics.success_count,
        error_count: metrics.error_count,
        success_rate: metrics.total_requests > 0 ? (metrics.success_count / metrics.total_requests) * 100 : 0,
        avg_response_time: metrics.avg_duration,
        last_request: metrics.last_request ? new Date(metrics.last_request) : null
      }))
      .sort((a, b) => b.total_requests - a.total_requests);

    const summary = {
      total_requests: metrics.reduce((sum, m) => sum + m.total_requests, 0),
      total_errors: metrics.reduce((sum, m) => sum + m.error_count, 0),
      avg_response_time: gatewayInstance.calculateAverageResponseTimes(),
      error_rate: gatewayInstance.calculateErrorRates(),
      throughput_per_minute: gatewayInstance.calculateThroughput()
    };

    return res.json({
      success: true,
      time_window,
      summary,
      endpoint_metrics: metrics,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      details: error.message
    });
  }
}

/**
 * Handle rate limits requests
 */
async function handleRateLimitsRequest(req, res) {
  try {
    const rateLimitStatus = Array.from(gatewayInstance.rateLimiters.entries())
      .map(([type, limiter]) => ({
        type,
        limit_per_window: limiter.limit,
        window_ms: limiter.window,
        active_clients: limiter.requests.size,
        total_tracked_requests: Array.from(limiter.requests.values()).reduce((sum, reqs) => sum + reqs.length, 0)
      }));

    return res.json({
      success: true,
      rate_limiters: rateLimitStatus,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get rate limits',
      details: error.message
    });
  }
}

/**
 * Handle auth status requests
 */
async function handleAuthStatusRequest(req, res) {
  try {
    const authStatus = {
      cached_tokens: gatewayInstance.authenticationCache.size,
      auth_providers: Object.keys(gatewayInstance.authProviders),
      cache_ttl_ms: gatewayInstance.gatewayConfig.auth_cache_ttl
    };

    return res.json({
      success: true,
      authentication_status: authStatus,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get auth status',
      details: error.message
    });
  }
}

/**
 * Handle health requests
 */
async function handleHealthRequest(req, res) {
  try {
    const stats = await gatewayInstance.getGatewayStatistics();
    const isHealthy = stats.performance.error_rates < 5 && stats.routing.active_routes > 0;

    return res.json({
      success: true,
      healthy: isHealthy,
      health_score: isHealthy ? 1.0 : 0.5,
      details: {
        error_rate: stats.performance.error_rates,
        active_routes: stats.routing.active_routes,
        response_time: stats.performance.avg_response_times,
        throughput: stats.performance.throughput
      },
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get health status',
      details: error.message
    });
  }
}

/**
 * Handle statistics requests
 */
async function handleStatisticsRequest(req, res) {
  try {
    const stats = await gatewayInstance.getGatewayStatistics();
    
    return res.json({
      success: true,
      statistics: stats,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      details: error.message
    });
  }
}

/**
 * Handle request routing through gateway
 */
async function handleRouteRequest(req, res) {
  try {
    const { target_path, method = 'GET', headers = {}, body } = req.body;

    if (!target_path) {
      return res.status(400).json({
        success: false,
        error: 'Missing target_path'
      });
    }

    const routeRequest = {
      path: target_path,
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      search: req.query.search || ''
    };

    const response = await gatewayInstance.routeRequest(routeRequest);

    return res.status(response.status).json({
      success: response.status < 400,
      routed_response: {
        status: response.status,
        headers: response.headers,
        body: response.body
      },
      gateway_agent: gatewayInstance.id,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to route request',
      details: error.message
    });
  }
}

/**
 * Handle gateway routing for actual requests
 */
async function handleGatewayRouting(req, res) {
  try {
    const routeRequest = {
      path: req.url.split('?')[0],
      method: req.method,
      headers: req.headers,
      body: req.body ? JSON.stringify(req.body) : undefined,
      search: req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '',
      ip: req.ip || req.connection.remoteAddress
    };

    const response = await gatewayInstance.routeRequest(routeRequest);

    // Set response headers
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(response.status).send(response.body);

  } catch (error) {
    console.error('Gateway routing error:', error);
    return res.status(502).json({
      error: 'Gateway routing failed',
      details: error.message,
      gateway: gatewayInstance.id
    });
  }
}

/**
 * Handle refresh routes requests
 */
async function handleRefreshRoutes(req, res) {
  try {
    await gatewayInstance.refreshRoutingTable();

    return res.json({
      success: true,
      message: 'Routing table refreshed',
      total_routes: gatewayInstance.routingTable.size,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to refresh routes',
      details: error.message
    });
  }
}

/**
 * Handle add route requests
 */
async function handleAddRoute(req, res) {
  try {
    const { path, route_config } = req.body;

    if (!path || !route_config) {
      return res.status(400).json({
        success: false,
        error: 'Missing path or route_config'
      });
    }

    gatewayInstance.routingTable.set(path, route_config);

    return res.json({
      success: true,
      message: 'Route added successfully',
      path,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to add route',
      details: error.message
    });
  }
}

/**
 * Handle remove route requests
 */
async function handleRemoveRoute(req, res) {
  try {
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({
        success: false,
        error: 'Missing path'
      });
    }

    const existed = gatewayInstance.routingTable.delete(path);

    return res.json({
      success: true,
      message: existed ? 'Route removed successfully' : 'Route not found',
      path,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to remove route',
      details: error.message
    });
  }
}

/**
 * Handle update rate limit requests
 */
async function handleUpdateRateLimit(req, res) {
  try {
    const { limiter_type, limit, window } = req.body;

    if (!limiter_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing limiter_type'
      });
    }

    const limiter = gatewayInstance.rateLimiters.get(limiter_type);
    if (!limiter) {
      return res.status(404).json({
        success: false,
        error: 'Rate limiter not found'
      });
    }

    if (limit) limiter.limit = limit;
    if (window) limiter.window = window;

    return res.json({
      success: true,
      message: 'Rate limit updated successfully',
      limiter_type,
      new_config: { limit: limiter.limit, window: limiter.window },
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to update rate limit',
      details: error.message
    });
  }
}

/**
 * Handle clear cache requests
 */
async function handleClearCache(req, res) {
  try {
    const { cache_type = 'all' } = req.body;

    let cleared = [];

    if (cache_type === 'all' || cache_type === 'auth') {
      gatewayInstance.authenticationCache.clear();
      cleared.push('auth');
    }

    if (cache_type === 'all' || cache_type === 'rate_limits') {
      gatewayInstance.rateLimiters.forEach(limiter => limiter.requests.clear());
      cleared.push('rate_limits');
    }

    if (cache_type === 'all' || cache_type === 'metrics') {
      gatewayInstance.requestMetrics.clear();
      cleared.push('metrics');
    }

    return res.json({
      success: true,
      message: 'Cache cleared successfully',
      cleared_caches: cleared,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      details: error.message
    });
  }
}