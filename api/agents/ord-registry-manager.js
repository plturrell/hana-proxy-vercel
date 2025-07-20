/**
 * ORD Registry Manager API Endpoint
 * RESTful interface for ORD compliance management and capability discovery
 */

import { ORDRegistryManager } from '../../agents/ord-registry-manager.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

let ordManagerInstance = null;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize ORD Registry Manager if needed
    if (!ordManagerInstance) {
      const agentData = {
        agent_id: 'finsight.coordination.ord_registry_manager',
        agent_name: 'ORD Registry Manager',
        agent_type: 'coordination',
        voting_power: 150
      };
      
      try {
        ordManagerInstance = new ORDRegistryManager(agentData);
        await ordManagerInstance.initialize();
      } catch (initError) {
        console.error('Failed to initialize ORD Registry Manager:', initError);
        // Create minimal fallback agent
        ordManagerInstance = {
          capabilities: ['capability_discovery', 'compliance_management', 'registry_operations'],
          registryCache: new Map(),
          capabilityIndex: new Map(),
          dependencyGraph: new Map(),
          ordVersion: '1.0.0',
          ordConfig: { discovery_interval: 300000 },
          discoveryStats: { last_updated: new Date() },
          getRegistryStatistics: async () => ({
            total_resources: 0,
            compliant_resources: 0,
            non_compliant_resources: 0,
            capabilities_indexed: 0
          }),
          getComplianceSummary: () => ({
            total_resources: 0,
            compliant: 0,
            non_compliant: 0,
            compliance_rate: 0
          }),
          getDependencyMetrics: () => ({
            total_dependencies: 0,
            circular_dependencies: 0,
            critical_paths: 0
          }),
          handleDiscoveryRequest: async (request) => {
            throw new Error('Agent initialization failed - discovery unavailable');
          },
          validateResourceCompliance: async (id, resource) => {
            throw new Error('Agent initialization failed - validation unavailable');
          },
          validateCompliance: async () => {
            throw new Error('Agent initialization failed - compliance check unavailable');
          },
          buildRegistryCache: async () => {
            throw new Error('Agent initialization failed - registry unavailable');
          },
          buildCapabilityIndex: async () => {
            throw new Error('Agent initialization failed - capability indexing unavailable');
          },
          analyzeDependencyGraph: async () => {
            throw new Error('Agent initialization failed - dependency analysis unavailable');
          },
          refreshMetadata: async () => {
            throw new Error('Agent initialization failed - metadata refresh unavailable');
          },
          performRegistryDiscovery: async () => {
            throw new Error('Agent initialization failed - registry discovery unavailable');
          },
          cleanupRegistry: async () => {
            throw new Error('Agent initialization failed - registry cleanup unavailable');
          }
        };
      }
    }

    const { action } = req.query;

    if (req.method === 'GET') {
      switch (action) {
        case 'status':
          return await handleStatusRequest(req, res);
        case 'registry':
          return await handleRegistryRequest(req, res);
        case 'capabilities':
          return await handleCapabilitiesRequest(req, res);
        case 'compliance':
          return await handleComplianceRequest(req, res);
        case 'dependencies':
          return await handleDependenciesRequest(req, res);
        case 'statistics':
          return await handleStatisticsRequest(req, res);
        case 'discovery':
          return await handleDiscoveryRequest(req, res);
        default:
          return await handleStatusRequest(req, res);
      }
    }

    if (req.method === 'POST') {
      const { action } = req.body;
      
      switch (action) {
        case 'discover':
          return await handleDiscoveryQuery(req, res);
        case 'validate':
          return await handleValidationRequest(req, res);
        case 'refresh':
          return await handleRefreshRequest(req, res);
        case 'register':
          return await handleRegistrationRequest(req, res);
        case 'cleanup':
          return await handleCleanupRequest(req, res);
        default:
          return res.status(400).json({
            success: false,
            error: 'Unknown action',
            available_actions: ['discover', 'validate', 'refresh', 'register', 'cleanup']
          });
      }
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed_methods: ['GET', 'POST', 'OPTIONS']
    });

  } catch (error) {
    console.error('ORD Registry Manager API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

/**
 * Handle status requests
 */
async function handleStatusRequest(req, res) {
  try {
    const stats = await ordManagerInstance.getRegistryStatistics();
    
    return res.json({
      success: true,
      agent_id: 'finsight.coordination.ord_registry_manager',
      status: 'active',
      uptime: process.uptime(),
      ord_version: ordManagerInstance.ordVersion,
      registry_statistics: stats,
      capabilities: ordManagerInstance.capabilities,
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
 * Handle registry overview requests
 */
async function handleRegistryRequest(req, res) {
  try {
    const { resource_type, status, limit = 50 } = req.query;
    
    const registryData = Array.from(ordManagerInstance.registryCache.entries())
      .filter(([id, resource]) => {
        if (resource_type && resource.resource_type !== resource_type) return false;
        if (status && resource.agent_data?.status !== status) return false;
        return true;
      })
      .slice(0, parseInt(limit))
      .map(([id, resource]) => ({
        resource_id: id,
        resource_type: resource.resource_type,
        resource_name: resource.resource_name,
        resource_path: resource.resource_path,
        agent_type: resource.agent_data?.agent_type,
        status: resource.agent_data?.status,
        compliance_status: resource.compliance_status,
        last_validated: resource.last_validated,
        ord_compliant: resource.ord_compliant !== false,
        capabilities_count: Array.isArray(resource.capabilities?.input_types) ? 
          resource.capabilities.input_types.length : 0
      }));

    return res.json({
      success: true,
      total_resources: ordManagerInstance.registryCache.size,
      filtered_count: registryData.length,
      resources: registryData,
      filters_applied: { resource_type, status },
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get registry data',
      details: error.message
    });
  }
}

/**
 * Handle capabilities overview requests
 */
async function handleCapabilitiesRequest(req, res) {
  try {
    const { capability_filter, min_providers = 1 } = req.query;
    
    const capabilities = Array.from(ordManagerInstance.capabilityIndex.entries())
      .filter(([capability, providers]) => {
        if (capability_filter && !capability.toLowerCase().includes(capability_filter.toLowerCase())) return false;
        if (providers.length < parseInt(min_providers)) return false;
        return true;
      })
      .map(([capability, providers]) => ({
        capability,
        provider_count: providers.length,
        providers: providers.map(p => ({
          resource_id: p.resource_id,
          resource_type: p.resource_type,
          confidence: p.confidence
        })),
        avg_confidence: providers.reduce((sum, p) => sum + p.confidence, 0) / providers.length
      }))
      .sort((a, b) => b.provider_count - a.provider_count);

    return res.json({
      success: true,
      total_capabilities: ordManagerInstance.capabilityIndex.size,
      filtered_count: capabilities.length,
      capabilities: capabilities,
      filters_applied: { capability_filter, min_providers },
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get capabilities data',
      details: error.message
    });
  }
}

/**
 * Handle compliance status requests
 */
async function handleComplianceRequest(req, res) {
  try {
    const complianceSummary = ordManagerInstance.getComplianceSummary();
    
    // Get detailed compliance issues
    const issues = Array.from(ordManagerInstance.registryCache.entries())
      .filter(([id, resource]) => resource.compliance_status === 'non_compliant')
      .map(([id, resource]) => ({
        resource_id: id,
        resource_name: resource.resource_name,
        resource_type: resource.resource_type,
        issues: resource.compliance_issues || ['Unknown compliance issue'],
        last_validated: resource.last_validated
      }));

    return res.json({
      success: true,
      compliance_summary: complianceSummary,
      ord_version: ordManagerInstance.ordVersion,
      non_compliant_resources: issues,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get compliance data',
      details: error.message
    });
  }
}

/**
 * Handle dependencies analysis requests
 */
async function handleDependenciesRequest(req, res) {
  try {
    const { resource_id } = req.query;
    
    if (resource_id) {
      // Get specific resource dependencies
      const deps = ordManagerInstance.dependencyGraph.get(resource_id);
      if (!deps) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found in dependency graph'
        });
      }
      
      return res.json({
        success: true,
        resource_id,
        dependencies: deps.dependencies,
        dependents: deps.dependents,
        dependency_depth: deps.dependency_depth,
        critical_path: deps.critical_path,
        timestamp: new Date()
      });
    } else {
      // Get overall dependency metrics
      const metrics = ordManagerInstance.getDependencyMetrics();
      
      // Get critical resources
      const criticalResources = Array.from(ordManagerInstance.dependencyGraph.entries())
        .filter(([id, deps]) => deps.critical_path)
        .map(([id, deps]) => ({
          resource_id: id,
          dependencies_count: deps.dependencies.length,
          dependents_count: deps.dependents.length,
          dependency_depth: deps.dependency_depth
        }));

      return res.json({
        success: true,
        dependency_metrics: metrics,
        critical_resources: criticalResources,
        timestamp: new Date()
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get dependencies data',
      details: error.message
    });
  }
}

/**
 * Handle statistics requests
 */
async function handleStatisticsRequest(req, res) {
  try {
    const stats = await ordManagerInstance.getRegistryStatistics();
    
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
 * Handle discovery overview requests
 */
async function handleDiscoveryRequest(req, res) {
  try {
    const recentDiscoveries = {
      last_discovery: ordManagerInstance.discoveryStats.last_updated,
      discovery_interval: ordManagerInstance.ordConfig.discovery_interval,
      next_discovery: new Date(Date.now() + ordManagerInstance.ordConfig.discovery_interval)
    };

    return res.json({
      success: true,
      discovery_info: recentDiscoveries,
      discovery_statistics: ordManagerInstance.discoveryStats,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get discovery data',
      details: error.message
    });
  }
}

/**
 * Handle discovery query requests
 */
async function handleDiscoveryQuery(req, res) {
  try {
    const { discovery_type, filters } = req.body;

    if (!discovery_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing discovery_type',
        available_types: ['capabilities', 'resources', 'dependencies', 'agents']
      });
    }

    const results = await ordManagerInstance.handleDiscoveryRequest({
      discovery_type,
      filters: filters || {},
      requester_agent: 'api_request'
    });

    return res.json({
      success: true,
      discovery_results: results,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process discovery query',
      details: error.message
    });
  }
}

/**
 * Handle validation requests
 */
async function handleValidationRequest(req, res) {
  try {
    const { resource_id } = req.body;

    if (resource_id) {
      // Validate specific resource
      const resource = ordManagerInstance.registryCache.get(resource_id);
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }

      const validation = await ordManagerInstance.validateResourceCompliance(resource_id, resource);
      
      return res.json({
        success: true,
        resource_id,
        validation_result: validation,
        timestamp: new Date()
      });
    } else {
      // Trigger full compliance validation
      await ordManagerInstance.validateCompliance();
      
      return res.json({
        success: true,
        message: 'Full compliance validation initiated',
        timestamp: new Date()
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process validation request',
      details: error.message
    });
  }
}

/**
 * Handle refresh requests
 */
async function handleRefreshRequest(req, res) {
  try {
    const { refresh_type = 'full' } = req.body;

    switch (refresh_type) {
      case 'registry':
        await ordManagerInstance.buildRegistryCache();
        break;
      case 'capabilities':
        await ordManagerInstance.buildCapabilityIndex();
        break;
      case 'dependencies':
        await ordManagerInstance.analyzeDependencyGraph();
        break;
      case 'metadata':
        await ordManagerInstance.refreshMetadata();
        break;
      case 'full':
      default:
        await ordManagerInstance.performRegistryDiscovery();
        break;
    }

    return res.json({
      success: true,
      message: `${refresh_type} refresh completed`,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process refresh request',
      details: error.message
    });
  }
}

/**
 * Handle registration requests
 */
async function handleRegistrationRequest(req, res) {
  try {
    const { resource_data } = req.body;

    if (!resource_data || !resource_data.agent_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing resource_data with agent_id'
      });
    }

    // Register new resource in ORD
    const { data, error } = await supabase
      .from('ord_analytics_resources')
      .upsert(resource_data, { onConflict: 'agent_id' });

    if (error) {
      throw error;
    }

    // Refresh registry to include new resource
    await ordManagerInstance.buildRegistryCache();

    return res.json({
      success: true,
      message: 'Resource registered successfully',
      resource_id: resource_data.agent_id,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to register resource',
      details: error.message
    });
  }
}

/**
 * Handle cleanup requests
 */
async function handleCleanupRequest(req, res) {
  try {
    await ordManagerInstance.cleanupRegistry();

    return res.json({
      success: true,
      message: 'Registry cleanup completed',
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to cleanup registry',
      details: error.message
    });
  }
}