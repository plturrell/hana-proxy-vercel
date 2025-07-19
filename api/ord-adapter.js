/**
 * ORD (Open Resource Discovery) v1 Adapter
 * Transforms our analytics resources to ORD-compliant format
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

const ORD_VERSION = "1.12";
const VENDOR = "finsight";
const PRODUCT = "analytics";
const BASE_NAMESPACE = `urn:${VENDOR}:${PRODUCT}`;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url.split('?')[0];

  // ORD Configuration endpoint
  if (path === '/.well-known/open-resource-discovery/v1/configuration') {
    return handleConfiguration(req, res);
  }

  // ORD Documents endpoint
  if (path.match(/^\/open-resource-discovery\/v1\/documents\/.+$/)) {
    const documentId = path.split('/').pop();
    return handleDocument(documentId, req, res);
  }

  // OpenAPI definitions for specific agents
  if (path.match(/^\/api\/agent\/.+\/openapi\.json$/)) {
    const agentId = path.split('/')[3];
    return handleOpenAPIDefinition(agentId, req, res);
  }

  return res.status(404).json({ error: 'ORD endpoint not found' });
}

/**
 * ORD Configuration endpoint
 */
async function handleConfiguration(req, res) {
  const baseUrl = `https://${req.headers.host}`;
  
  return res.json({
    baseUrl,
    ordDocumentUrls: [
      "/open-resource-discovery/v1/documents/analytics-agents"
    ],
    ordExtensions: {
      "blockchain": {
        "enabled": true,
        "network": "supabase-private"
      }
    }
  });
}

/**
 * Generate ORD Document for analytics agents
 */
async function handleDocument(documentId, req, res) {
  if (documentId !== 'analytics-agents') {
    return res.status(404).json({ error: 'Document not found' });
  }

  try {
    // Fetch all analytics agents and their resources
    const { data: agents, error: agentsError } = await supabase
      .from('a2a_agents')
      .select('*')
      .eq('type', 'analytics')
      .order('voting_power', { ascending: false });

    if (agentsError) throw agentsError;

    const { data: resources, error: resourcesError } = await supabase
      .from('ord_analytics_resources')
      .select('*');

    if (resourcesError) throw resourcesError;

    // Create resource map for quick lookup
    const resourceMap = {};
    resources.forEach(r => {
      resourceMap[r.agent_id] = r;
    });

    // Generate ORD Document
    const ordDocument = {
      openResourceDiscovery: ORD_VERSION,
      perspective: "system-instance",
      systemInstance: {
        systemId: `${BASE_NAMESPACE}:system:a2a-analytics:v1`,
        name: "A2A Analytics Platform",
        description: "Blockchain-enhanced analytics platform with 32 specialized financial calculation agents",
        environmentType: "production"
      },
      packages: [
        {
          ordId: `${BASE_NAMESPACE}:package:core-analytics:v1`,
          title: "Core Analytics Functions",
          shortDescription: "Fundamental financial calculations",
          description: "Core analytics including correlation, VaR, Sharpe ratio, and portfolio optimization",
          version: "1.0.0",
          vendor: VENDOR
        },
        {
          ordId: `${BASE_NAMESPACE}:package:advanced-analytics:v1`,
          title: "Advanced Analytics Functions",
          shortDescription: "Sophisticated financial models",
          description: "Advanced models including GARCH, copulas, regime switching, and stochastic volatility",
          version: "1.0.0",
          vendor: VENDOR
        }
      ],
      groups: [
        {
          groupId: `${BASE_NAMESPACE}:group:risk-analytics:v1`,
          title: "Risk Analytics",
          description: "Risk measurement and management functions"
        },
        {
          groupId: `${BASE_NAMESPACE}:group:performance-analytics:v1`,
          title: "Performance Analytics",
          description: "Performance measurement and attribution"
        },
        {
          groupId: `${BASE_NAMESPACE}:group:derivatives-analytics:v1`,
          title: "Derivatives Analytics",
          description: "Option pricing and derivatives analytics"
        }
      ],
      capabilities: agents.map(agent => {
        const resource = resourceMap[agent.agent_id];
        return {
          ordId: `${BASE_NAMESPACE}:capability:${agent.agent_id}:v1`,
          title: agent.name,
          shortDescription: agent.description || `${agent.name} capability`,
          description: generateCapabilityDescription(agent, resource),
          version: "1.0.0",
          releaseStatus: agent.status === 'active' ? 'active' : 'beta',
          visibility: "public",
          partOfPackage: determinePackage(agent.agent_id),
          partOfGroups: [determineGroup(agent.agent_id)],
          extensible: {
            "blockchain": {
              "walletAddress": agent.blockchain_config?.wallet_address,
              "votingPower": agent.voting_power
            }
          }
        };
      }),
      apiResources: agents.map(agent => {
        const resource = resourceMap[agent.agent_id];
        return {
          ordId: `${BASE_NAMESPACE}:apiResource:${agent.agent_id}-api:v1`,
          title: `${agent.name} API`,
          shortDescription: `REST API for ${agent.name}`,
          description: `# ${agent.name} API\n\nProvides programmatic access to ${resource?.resource_name || agent.name} calculations.`,
          version: "1.0.0",
          releaseStatus: "active",
          visibility: "public",
          partOfPackage: determinePackage(agent.agent_id),
          apiProtocol: "rest",
          resourceDefinitions: [
            {
              type: "openapi-v3",
              mediaType: "application/json",
              url: `/api/agent/${agent.agent_id}/openapi.json`
            }
          ],
          extensible: {
            "a2a": {
              "supportsJsonRpc": true,
              "supportsStreaming": true
            }
          }
        };
      }),
      eventResources: agents.slice(0, 5).map(agent => ({
        ordId: `${BASE_NAMESPACE}:eventResource:${agent.agent_id}-completed:v1`,
        title: `${agent.name} Calculation Completed`,
        shortDescription: `Event emitted when ${agent.name} completes a calculation`,
        description: `Notification event for completed calculations`,
        version: "1.0.0",
        releaseStatus: "active",
        visibility: "public",
        partOfPackage: determinePackage(agent.agent_id),
        resourceDefinitions: [
          {
            type: "asyncapi-v2",
            mediaType: "application/json",
            url: "#inline",
            content: JSON.stringify({
              asyncapi: "2.0.0",
              info: { title: `${agent.name} Events`, version: "1.0.0" },
              channels: {
                [`agent/${agent.agent_id}/completed`]: {
                  subscribe: {
                    message: {
                      payload: {
                        type: "object",
                        properties: {
                          agentId: { type: "string" },
                          taskId: { type: "string" },
                          result: { type: "object" },
                          timestamp: { type: "string", format: "date-time" }
                        }
                      }
                    }
                  }
                }
              }
            })
          }
        ]
      })),
      entityTypes: [
        {
          ordId: `${BASE_NAMESPACE}:entityType:AnalyticsResult:v1`,
          title: "Analytics Result",
          shortDescription: "Result of an analytics calculation",
          description: "Standard structure for analytics calculation results",
          version: "1.0.0",
          releaseStatus: "active",
          visibility: "public",
          partOfPackage: `${BASE_NAMESPACE}:package:core-analytics:v1`
        },
        {
          ordId: `${BASE_NAMESPACE}:entityType:PortfolioData:v1`,
          title: "Portfolio Data",
          shortDescription: "Portfolio holdings and weights",
          description: "Input structure for portfolio-based calculations",
          version: "1.0.0",
          releaseStatus: "active",
          visibility: "public",
          partOfPackage: `${BASE_NAMESPACE}:package:core-analytics:v1`
        }
      ],
      dataProducts: [
        {
          ordId: `${BASE_NAMESPACE}:dataProduct:historical-calculations:v1`,
          title: "Historical Calculations",
          shortDescription: "Archive of all analytics calculations",
          description: "Complete history of calculations performed by analytics agents",
          version: "1.0.0",
          releaseStatus: "active",
          visibility: "internal",
          partOfPackage: `${BASE_NAMESPACE}:package:core-analytics:v1`,
          dataProductLinks: {
            "catalog": "/data-catalog/historical-calculations"
          }
        }
      ]
    };

    return res.json(ordDocument);

  } catch (error) {
    console.error('ORD Document generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate ORD document',
      details: error.message 
    });
  }
}

/**
 * Generate OpenAPI definition for an agent
 */
async function handleOpenAPIDefinition(agentId, req, res) {
  try {
    const { data: agent } = await supabase
      .from('a2a_agents')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const { data: resource } = await supabase
      .from('ord_analytics_resources')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    const openApiDoc = {
      openapi: "3.0.0",
      info: {
        title: `${agent.name} API`,
        description: agent.description,
        version: "1.0.0"
      },
      servers: [
        {
          url: `https://${req.headers.host}/api/agent/${agentId}`,
          description: "Production server"
        }
      ],
      paths: {
        "/calculate": {
          post: {
            summary: `Execute ${agent.name} calculation`,
            operationId: "calculate",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: generateInputSchema(resource)
                }
              }
            },
            responses: {
              "200": {
                description: "Successful calculation",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        result: { type: "number" },
                        metadata: { type: "object" },
                        timestamp: { type: "string", format: "date-time" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    return res.json(openApiDoc);

  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to generate OpenAPI definition',
      details: error.message 
    });
  }
}

// Helper functions

function generateCapabilityDescription(agent, resource) {
  let description = `# ${agent.name}\n\n`;
  description += `${agent.description || 'Analytics capability'}\n\n`;
  
  if (resource?.capabilities) {
    description += `## Capabilities\n`;
    Object.entries(resource.capabilities).forEach(([key, value]) => {
      description += `- **${key}**: ${value}\n`;
    });
  }
  
  if (resource?.requirements) {
    description += `\n## Requirements\n`;
    Object.entries(resource.requirements).forEach(([key, value]) => {
      description += `- **${key}**: ${value}\n`;
    });
  }
  
  if (agent.goals?.length > 0) {
    description += `\n## Goals\n`;
    agent.goals.forEach(goal => {
      description += `- ${goal}\n`;
    });
  }
  
  return description;
}

function determinePackage(agentId) {
  const advancedAgents = [
    'agent-copula-correlation', 'agent-garch-volatility', 'agent-regime-switching',
    'agent-jump-diffusion', 'agent-heston-model', 'agent-hull-white'
  ];
  
  return advancedAgents.includes(agentId) 
    ? `${BASE_NAMESPACE}:package:advanced-analytics:v1`
    : `${BASE_NAMESPACE}:package:core-analytics:v1`;
}

function determineGroup(agentId) {
  if (agentId.includes('risk') || agentId.includes('var') || agentId.includes('volatility')) {
    return `${BASE_NAMESPACE}:group:risk-analytics:v1`;
  }
  if (agentId.includes('sharpe') || agentId.includes('sortino') || agentId.includes('treynor')) {
    return `${BASE_NAMESPACE}:group:performance-analytics:v1`;
  }
  if (agentId.includes('black-scholes') || agentId.includes('option') || agentId.includes('heston')) {
    return `${BASE_NAMESPACE}:group:derivatives-analytics:v1`;
  }
  return `${BASE_NAMESPACE}:group:risk-analytics:v1`;
}

function generateInputSchema(resource) {
  const schema = {
    type: "object",
    required: [],
    properties: {}
  };
  
  if (resource?.requirements) {
    Object.entries(resource.requirements).forEach(([key, value]) => {
      if (value !== 'optional') {
        schema.required.push(key);
      }
      schema.properties[key] = {
        type: typeof value === 'string' && value.includes('array') ? 'array' : 'number',
        description: value
      };
    });
  }
  
  return schema;
}