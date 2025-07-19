/**
 * Unified Compliance Adapter
 * Combines A2A, ORD, and A2A Agent Registry into one function
 * to work within Vercel's 12 function limit
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client with proper error handling
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

// Only create client if we have valid credentials
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Constants
const ORD_VERSION = "1.12";
const VENDOR = "finsight";
const PRODUCT = "analytics";
const BASE_URL = process.env.VERCEL_URL || 'https://hana-proxy-vercel.vercel.app';

// In-memory stores
const activeTasks = new Map();
const sseClients = new Map();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url.split('?')[0];
  const pathParts = path.split('/').filter(Boolean);

  try {
    // ========================================
    // ORD COMPLIANCE ENDPOINTS
    // ========================================
    
    if (path === '/.well-known/open-resource-discovery/v1/configuration') {
      return handleORDConfiguration(req, res);
    }
    
    if (path.startsWith('/open-resource-discovery/v1/documents/')) {
      return handleORDDocument(req, res);
    }

    // ========================================
    // A2A COMPLIANCE ENDPOINTS
    // ========================================
    
    if (path === '/.well-known/agent.json') {
      return handleAgentCard(req, res);
    }

    // Agent-specific endpoints
    if (pathParts[0] === 'api' && pathParts[1] === 'agent' && pathParts[2]) {
      const agentId = pathParts[2];
      const action = pathParts[3];

      switch (action) {
        case 'message':
          return handleA2AMessage(agentId, req, res);
        case 'stream':
          return handleA2AStream(agentId, req, res);
        case 'task':
          return handleA2ATask(agentId, req, res);
        case 'openapi.json':
          return handleOpenAPISpec(agentId, req, res);
        default:
          return res.status(404).json({ error: 'Unknown action' });
      }
    }

    // ========================================
    // A2A AGENT REGISTRY ENDPOINTS
    // ========================================
    
    if (path === '/api/a2a-agent-registry' || path === '/api/a2a-agent-registry/') {
      switch (req.method) {
        case 'GET':
          const { action } = req.query;
          if (action === 'list') {
            return handleListAgents(req, res);
          } else if (action === 'discover') {
            return handleDiscoverAgent(req, res);
          }
          break;
        case 'POST':
          const body = req.body;
          if (body.action === 'register') {
            return handleRegisterAgent(req, res);
          } else if (body.action === 'onboard') {
            return handleOnboardAgent(req, res);
          }
          break;
      }
    }

    return res.status(404).json({ error: 'Not found' });

  } catch (error) {
    console.error('Compliance adapter error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// ========================================
// ORD IMPLEMENTATION
// ========================================

async function handleORDConfiguration(req, res) {
  return res.json({
    baseUrl: BASE_URL,
    ordDocumentUrls: [
      "/open-resource-discovery/v1/documents/analytics-platform"
    ],
    ordExtensions: {
      "sap.blockchain": {
        "enabled": true,
        "network": "supabase-private"
      }
    }
  });
}

async function handleORDDocument(req, res) {
  // Check if Supabase is configured
  if (!supabase) {
    return res.status(503).json({
      error: 'Database not configured',
      message: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables. Please configure these in your Vercel project settings.'
    });
  }

  const { data: agents } = await supabase
    .from('a2a_agents')
    .select('*')
    .eq('agent_type', 'analytics')
    .eq('status', 'active');

  const ordDocument = {
    "$schema": "https://sap.github.io/open-resource-discovery/spec-v1/interfaces/Document.schema.json",
    "openResourceDiscovery": ORD_VERSION,
    "perspective": "system-instance",
    "policyLevel": "sap:core:v1",
    "systemInstance": {
      "systemId": `urn:${VENDOR}:${PRODUCT}:system:a2a-analytics:v1`,
      "name": "A2A Analytics Platform",
      "description": "Blockchain-enhanced analytics with 32 specialized agents",
      "baseUrl": BASE_URL,
      "labels": {
        "blockchain-enabled": ["true"],
        "compliance": ["a2a-v1", "ord-v1.12"]
      }
    },
    "packages": [
      {
        "ordId": `urn:${VENDOR}:${PRODUCT}:package:core-analytics:v1`,
        "title": "Core Analytics Package",
        "shortDescription": "Core financial analytics functions",
        "description": "Essential analytics including correlation, VaR, Sharpe ratio",
        "version": "1.0.0",
        "vendor": VENDOR,
        "tags": ["analytics", "core", "financial"]
      },
      {
        "ordId": `urn:${VENDOR}:${PRODUCT}:package:advanced-analytics:v1`,
        "title": "Advanced Analytics Package",
        "shortDescription": "Advanced financial models",
        "description": "Sophisticated models including GARCH, copulas, regime switching",
        "version": "1.0.0",
        "vendor": VENDOR,
        "tags": ["analytics", "advanced", "derivatives"]
      }
    ],
    "groups": [
      {
        "groupId": `urn:${VENDOR}:${PRODUCT}:group:risk:v1`,
        "title": "Risk Analytics",
        "groupTypeId": "sap:core:groupType:capabilities"
      },
      {
        "groupId": `urn:${VENDOR}:${PRODUCT}:group:performance:v1`,
        "title": "Performance Analytics",
        "groupTypeId": "sap:core:groupType:capabilities"
      }
    ],
    "capabilities": agents?.map(agent => ({
      "ordId": `urn:${VENDOR}:${PRODUCT}:capability:${agent.agent_id}:v1`,
      "title": agent.agent_name || agent.name,
      "shortDescription": agent.description || `${agent.agent_name} capability`,
      "description": formatMarkdown(agent),
      "version": agent.agent_version || "1.0.0",
      "releaseStatus": "active",
      "visibility": "public",
      "partOfPackage": determinePackage(agent.agent_id),
      "partOfGroups": [determineGroup(agent.agent_id)],
      "apiResources": [`urn:${VENDOR}:${PRODUCT}:apiResource:${agent.agent_id}-api:v1`],
      "extensible": {
        "supported": "automatic",
        "description": "Extensible via blockchain voting"
      },
      "labels": {
        "voting-power": [(agent.connection_config?.voting_power || 100).toString()],
        "agent-type": [agent.agent_type || 'analytics']
      }
    })) || [],
    "apiResources": agents?.map(agent => ({
      "ordId": `urn:${VENDOR}:${PRODUCT}:apiResource:${agent.agent_id}-api:v1`,
      "title": `${agent.agent_name || agent.name} API`,
      "shortDescription": `REST API for ${agent.agent_name || agent.name}`,
      "description": `Provides A2A-compliant access to ${agent.name}`,
      "version": "1.0.0",
      "releaseStatus": "active",
      "visibility": "public",
      "partOfPackage": determinePackage(agent.agent_id),
      "apiProtocol": "rest",
      "tags": ["a2a", "analytics", agent.type],
      "countries": ["us"],
      "lineOfBusiness": ["Finance"],
      "industry": ["Financial Services"],
      "resourceDefinitions": [
        {
          "type": "openapi-v3",
          "mediaType": "application/json",
          "url": `/api/agent/${agent.agent_id}/openapi.json`
        }
      ],
      "entityTypeMappings": [
        {
          "entityTypeId": `urn:${VENDOR}:${PRODUCT}:entityType:AnalyticsRequest:v1`
        }
      ]
    })) || [],
    "eventResources": agents?.slice(0, 10).map(agent => ({
      "ordId": `urn:${VENDOR}:${PRODUCT}:eventResource:${agent.agent_id}-complete:v1`,
      "title": `${agent.name} Completion Event`,
      "shortDescription": `Event when ${agent.name} completes calculation`,
      "description": "Async notification of calculation completion",
      "version": "1.0.0",
      "releaseStatus": "active",
      "visibility": "public",
      "partOfPackage": determinePackage(agent.agent_id),
      "tags": ["event", "completion", "async"],
      "resourceDefinitions": [
        {
          "type": "asyncapi-v2",
          "mediaType": "application/yaml",
          "url": "#inline",
          "content": JSON.stringify({
            asyncapi: "2.6.0",
            info: { title: `${agent.name} Events`, version: "1.0.0" },
            channels: {
              [`agent.${agent.agent_id}.complete`]: {
                subscribe: {
                  message: {
                    contentType: "application/json",
                    payload: {
                      type: "object",
                      properties: {
                        taskId: { type: "string" },
                        agentId: { type: "string" },
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
    })) || [],
    "entityTypes": [
      {
        "ordId": `urn:${VENDOR}:${PRODUCT}:entityType:AnalyticsRequest:v1`,
        "title": "Analytics Request",
        "shortDescription": "Request structure for analytics calculations",
        "description": "Standard input format for all analytics agents",
        "version": "1.0.0",
        "releaseStatus": "active",
        "visibility": "public",
        "partOfPackage": `urn:${VENDOR}:${PRODUCT}:package:core-analytics:v1`,
        "level": 1,
        "tags": ["entity", "request"]
      }
    ],
    "dataProducts": [
      {
        "ordId": `urn:${VENDOR}:${PRODUCT}:dataProduct:calculation-history:v1`,
        "title": "Calculation History",
        "shortDescription": "Historical analytics calculations",
        "description": "Complete audit trail of all calculations",
        "version": "1.0.0",
        "releaseStatus": "active",
        "visibility": "internal",
        "partOfPackage": `urn:${VENDOR}:${PRODUCT}:package:core-analytics:v1`,
        "type": "primary",
        "category": "analytical",
        "outputPorts": [
          {
            "ordId": `urn:${VENDOR}:${PRODUCT}:dataProduct:calculation-history:port:api:v1`
          }
        ],
        "dataProductLinks": {
          "catalog": `${BASE_URL}/data-catalog/calculation-history`
        }
      }
    ],
    "integrationDependencies": []
  };

  return res.json(ordDocument);
}

// ========================================
// A2A IMPLEMENTATION
// ========================================

async function handleAgentCard(req, res) {
  // Check if Supabase is configured
  if (!supabase) {
    return res.status(503).json({
      error: 'Database not configured',
      message: 'Supabase credentials are missing'
    });
  }

  const { data: agents } = await supabase
    .from('a2a_agents')
    .select('*')
    .eq('agent_type', 'analytics')
    .eq('status', 'active');

  const agentCards = agents?.map(agent => ({
    "name": agent.agent_name || agent.name,
    "description": agent.description,
    "id": agent.agent_id,
    "version": agent.agent_version || "1.0.0",
    "protocolVersion": agent.protocol_version || "a2a/v1",
    "capabilities": agent.capabilities || [],
    "inputSchema": {
      "type": "json-schema",
      "url": `/api/agent/${agent.agent_id}/openapi.json`
    },
    "outputSchema": {
      "type": "json-schema",
      "url": `/api/agent/${agent.agent_id}/openapi.json`
    },
    "endpoints": {
      "message/send": {
        "url": `/api/agent/${agent.agent_id}/message`,
        "method": "POST",
        "contentType": "application/json"
      },
      "message/stream": {
        "url": `/api/agent/${agent.agent_id}/stream`,
        "method": "GET",
        "contentType": "text/event-stream"
      },
      "task/create": {
        "url": `/api/agent/${agent.agent_id}/task`,
        "method": "POST",
        "contentType": "application/json"
      }
    },
    "authentication": {
      "required": true,
      "methods": ["bearer", "api-key"],
      "bearerFormat": "JWT"
    },
    "rateLimit": {
      "requests": 1000,
      "window": "1h"
    },
    "metadata": {
      "blockchain": {
        "enabled": true,
        "walletAddress": agent.connection_config?.wallet_address,
        "votingPower": agent.connection_config?.voting_power || 100
      },
      "ord": {
        "capabilityId": `urn:${VENDOR}:${PRODUCT}:capability:${agent.agent_id}:v1`
      }
    }
  })) || [];

  return res.json({
    "agents": agentCards,
    "version": "1.0.0",
    "totalAgents": agentCards.length
  });
}

async function handleA2AMessage(agentId, req, res) {
  const { jsonrpc, method, params, id } = req.body;

  // Validate JSON-RPC 2.0
  if (jsonrpc !== '2.0') {
    return res.json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid Request' },
      id: id || null
    });
  }

  // Check if Supabase is configured
  if (!supabase) {
    return res.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: 'Database not configured' },
      id
    });
  }

  try {
    // Get agent
    const { data: agent } = await supabase
      .from('a2a_agents')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (!agent) {
      return res.json({
        jsonrpc: '2.0',
        error: { code: -32602, message: 'Agent not found' },
        id
      });
    }

    // Create task
    const taskId = `task_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    // Store in database
    if (supabase) {
      await supabase
        .from('prdord_analytics')
        .insert({
          order_id: taskId,
          agent_id: agentId,
          function_name: method,
          input_parameters: params,
          status: 'processing',
          requester_id: req.headers['x-agent-id'] || 'api'
        });
    }

    // Store in memory
    activeTasks.set(taskId, {
      agentId,
      method,
      params,
      status: 'processing',
      createdAt: new Date()
    });

    // Simulate processing
    setTimeout(async () => {
      const result = await processAnalyticsRequest(agent, method, params);
      
      // Update database
      if (supabase) {
        await supabase
          .from('prdord_analytics')
          .update({
            status: 'completed',
            result: result,
            completed_at: new Date()
          })
          .eq('order_id', taskId);
      }

      // Update memory
      const task = activeTasks.get(taskId);
      if (task) {
        task.status = 'completed';
        task.result = result;
      }

      // Send SSE update
      broadcastTaskUpdate(agentId, taskId, 'completed', result);
      
    }, 1000);

    // Return immediate response
    return res.json({
      jsonrpc: '2.0',
      result: {
        taskId,
        status: 'processing',
        message: 'Task created and processing',
        estimatedTime: 1000
      },
      id
    });

  } catch (error) {
    return res.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: 'Internal error', data: error.message },
      id
    });
  }
}

async function handleA2AStream(agentId, req, res) {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Add client
  const clientId = crypto.randomBytes(8).toString('hex');
  sseClients.set(clientId, { res, agentId });

  // Send initial connection
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ 
    type: 'connected',
    agentId,
    clientId,
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Keep alive
  const keepAlive = setInterval(() => {
    res.write(`event: ping\n`);
    res.write(`data: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
  }, 30000);

  // Handle disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(clientId);
  });
}

async function handleA2ATask(agentId, req, res) {
  const { action, taskId, message } = req.body;

  switch (action) {
    case 'create':
      // Create new task
      const newTaskId = `task_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const task = {
        id: newTaskId,
        agentId,
        status: 'submitted',
        message: message || {},
        createdAt: new Date().toISOString()
      };

      // Store task
      activeTasks.set(newTaskId, task);
      
      // Store in database
      if (supabase) {
        await supabase
          .from('prdord_analytics')
          .insert({
            order_id: newTaskId,
            agent_id: agentId,
            function_name: message.method || 'calculate',
            input_parameters: message.params || {},
            status: 'submitted'
          });
      }

      return res.json(task);

    case 'get':
      // Get task status
      if (!taskId) {
        return res.status(400).json({ error: 'taskId required' });
      }

      if (!supabase) {
        // Check in-memory store
        const memTask = activeTasks.get(taskId);
        if (memTask) {
          return res.json(memTask);
        }
        return res.status(404).json({ error: 'Task not found' });
      }

      const { data: dbTask } = await supabase
        .from('prdord_analytics')
        .select('*')
        .eq('order_id', taskId)
        .single();

      if (!dbTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      return res.json({
        id: dbTask.order_id,
        agentId: dbTask.agent_id,
        status: dbTask.status,
        result: dbTask.result,
        createdAt: dbTask.created_at,
        completedAt: dbTask.completed_at
      });

    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}

async function handleOpenAPISpec(agentId, req, res) {
  // Check if Supabase is configured
  if (!supabase) {
    // Return a generic OpenAPI spec for the agent
    return res.json(generateGenericOpenAPISpec(agentId));
  }

  const { data: agent } = await supabase
    .from('a2a_agents')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  const openApiDoc = {
    "openapi": "3.0.0",
    "info": {
      "title": `${agent.agent_name || agent.name} API`,
      "description": agent.description,
      "version": "1.0.0",
      "x-a2a-compliant": true,
      "x-ord-capability": `urn:${VENDOR}:${PRODUCT}:capability:${agentId}:v1`
    },
    "servers": [
      {
        "url": `${BASE_URL}/api/agent/${agentId}`,
        "description": "Production server"
      }
    ],
    "paths": {
      "/message": {
        "post": {
          "summary": "Send JSON-RPC message",
          "operationId": "sendMessage",
          "tags": ["A2A"],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["jsonrpc", "method", "params", "id"],
                  "properties": {
                    "jsonrpc": { "type": "string", "enum": ["2.0"] },
                    "method": { "type": "string" },
                    "params": { "type": "object" },
                    "id": { "type": "string" }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "JSON-RPC response",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "jsonrpc": { "type": "string" },
                      "result": { "type": "object" },
                      "error": { "type": "object" },
                      "id": { "type": "string" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/stream": {
        "get": {
          "summary": "Server-Sent Events stream",
          "operationId": "streamEvents",
          "tags": ["A2A"],
          "responses": {
            "200": {
              "description": "SSE stream",
              "content": {
                "text/event-stream": {
                  "schema": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      },
      "/task": {
        "post": {
          "summary": "Task management",
          "operationId": "manageTask",
          "tags": ["A2A"],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["action"],
                  "properties": {
                    "action": { "type": "string", "enum": ["create", "get"] },
                    "taskId": { "type": "string" },
                    "message": { "type": "object" }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Task response"
            }
          }
        }
      }
    }
  };

  return res.json(openApiDoc);
}

// ========================================
// A2A REGISTRY IMPLEMENTATION
// ========================================

async function handleListAgents(req, res) {
  // Check if Supabase is configured
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'Database not configured',
      message: 'Supabase credentials are missing'
    });
  }

  try {
    const { data: agents, error } = await supabase
      .from('a2a_agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      agents: agents || [],
      count: agents?.length || 0
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function handleDiscoverAgent(req, res) {
  const { agent_id, capabilities } = req.query;
  
  // Check if Supabase is configured
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'Database not configured',
      message: 'Supabase credentials are missing'
    });
  }
  
  try {
    let query = supabase.from('a2a_agents').select('*');
    
    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }
    
    if (capabilities) {
      const capList = capabilities.split(',');
      query = query.contains('capabilities', capList);
    }
    
    const { data: agents, error } = await query;
    
    if (error) throw error;
    
    return res.json({
      success: true,
      agents: agents || []
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function handleRegisterAgent(req, res) {
  const { agent_id, name, type, description, capabilities, goals, personality, voting_power } = req.body;
  
  // Check if Supabase is configured
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'Database not configured',
      message: 'Supabase credentials are missing'
    });
  }
  
  try {
    const wallet_address = `0x${crypto.randomBytes(20).toString('hex')}`;
    
    const { data, error } = await supabase
      .from('a2a_agents')
      .insert({
        agent_id,
        name,
        type: type || 'custom',
        description,
        capabilities: capabilities || [],
        goals: goals || [],
        personality: personality || 'collaborative',
        voting_power: voting_power || 100,
        status: 'pending',
        blockchain_config: {
          wallet_address,
          consensus_weight: 1.0,
          network: 'private'
        }
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return res.json({
      success: true,
      agent: data,
      message: 'Agent registered successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function handleOnboardAgent(req, res) {
  const { agent_id } = req.body;
  
  // Check if Supabase is configured
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'Database not configured',
      message: 'Supabase credentials are missing'
    });
  }
  
  try {
    const transaction_hash = `0x${crypto.randomBytes(32).toString('hex')}`;
    
    const { data, error } = await supabase
      .from('a2a_agents')
      .update({
        status: 'active',
        onboarded_at: new Date().toISOString(),
        'blockchain_config.transaction_hash': transaction_hash
      })
      .eq('agent_id', agent_id)
      .select()
      .single();
    
    if (error) throw error;
    
    return res.json({
      success: true,
      agent: data,
      transaction_hash,
      message: 'Agent onboarded to blockchain'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function formatMarkdown(agent) {
  let md = `# ${agent.agent_name || agent.name}\n\n`;
  md += `${agent.description || 'Analytics capability'}\n\n`;
  md += `## Capabilities\n`;
  agent.capabilities?.forEach(cap => {
    md += `- ${cap}\n`;
  });
  md += `\n## Metadata\n`;
  md += `- Voting Power: ${agent.connection_config?.voting_power || 100}\n`;
  md += `- Agent Type: ${agent.agent_type || 'analytics'}\n`;
  md += `- Status: ${agent.status}\n`;
  return md;
}

function determinePackage(agentId) {
  const advanced = ['copula', 'garch', 'regime', 'jump', 'heston', 'hull'];
  return advanced.some(a => agentId.includes(a))
    ? `urn:${VENDOR}:${PRODUCT}:package:advanced-analytics:v1`
    : `urn:${VENDOR}:${PRODUCT}:package:core-analytics:v1`;
}

function determineGroup(agentId) {
  if (agentId.includes('risk') || agentId.includes('var')) {
    return `urn:${VENDOR}:${PRODUCT}:group:risk:v1`;
  }
  return `urn:${VENDOR}:${PRODUCT}:group:performance:v1`;
}

async function processAnalyticsRequest(agent, method, params) {
  // Simulate analytics calculation
  return {
    value: Math.random() * 100,
    confidence: 0.95,
    metadata: {
      calculatedBy: agent.agent_id,
      method,
      timestamp: new Date().toISOString()
    }
  };
}

function broadcastTaskUpdate(agentId, taskId, status, result) {
  // Send to all SSE clients watching this agent
  for (const [clientId, client] of sseClients) {
    if (client.agentId === agentId) {
      client.res.write(`event: task-update\n`);
      client.res.write(`data: ${JSON.stringify({
        type: 'task-update',
        taskId,
        status,
        result,
        timestamp: new Date().toISOString()
      })}\n\n`);
    }
  }
}

function generateGenericOpenAPISpec(agentId) {
  return {
    "openapi": "3.0.0",
    "info": {
      "title": `${agentId} API`,
      "description": "Analytics agent API",
      "version": "1.0.0",
      "x-a2a-compliant": true,
      "x-ord-capability": `urn:${VENDOR}:${PRODUCT}:capability:${agentId}:v1`
    },
    "servers": [
      {
        "url": `${BASE_URL}/api/agent/${agentId}`,
        "description": "Production server"
      }
    ],
    "paths": {
      "/message": {
        "post": {
          "summary": "Send JSON-RPC message",
          "operationId": "sendMessage",
          "tags": ["A2A"],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["jsonrpc", "method", "params", "id"],
                  "properties": {
                    "jsonrpc": { "type": "string", "enum": ["2.0"] },
                    "method": { "type": "string" },
                    "params": { "type": "object" },
                    "id": { "type": "string" }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "JSON-RPC response"
            }
          }
        }
      }
    }
  };
}