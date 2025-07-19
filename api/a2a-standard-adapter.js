/**
 * A2A Standard Protocol Adapter
 * Bridges our blockchain A2A implementation with Google Cloud A2A standard
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

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

  // Handle Agent Card discovery
  if (path === '/.well-known/agent.json') {
    return handleAgentCard(req, res);
  }

  // Handle agent-specific endpoints
  if (pathParts[0] === 'api' && pathParts[1] === 'agent') {
    const agentId = pathParts[2];
    const action = pathParts[3];

    switch (action) {
      case 'message':
        return handleMessage(agentId, req, res);
      case 'stream':
        return handleStream(agentId, req, res);
      case 'task':
        return handleTask(agentId, req, res);
      default:
        return res.status(404).json({ error: 'Unknown action' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}

/**
 * Return Agent Card for discovery
 */
async function handleAgentCard(req, res) {
  const agentCards = [];

  // Fetch all analytics agents
  const { data: agents, error } = await supabase
    .from('a2a_agents')
    .select('*')
    .eq('type', 'analytics')
    .eq('status', 'active');

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch agents' });
  }

  // Convert to Agent Card format
  for (const agent of agents || []) {
    const { data: resources } = await supabase
      .from('ord_analytics_resources')
      .select('*')
      .eq('agent_id', agent.agent_id)
      .single();

    agentCards.push({
      name: agent.name,
      description: agent.description,
      capabilities: agent.capabilities,
      endpoints: {
        'message/send': `/api/agent/${agent.agent_id}/message`,
        'message/stream': `/api/agent/${agent.agent_id}/stream`,
        'task/create': `/api/agent/${agent.agent_id}/task`
      },
      authentication: {
        required: true,
        methods: ['bearer', 'apikey']
      },
      metadata: {
        voting_power: agent.voting_power,
        blockchain_enabled: !!agent.blockchain_config?.wallet_address,
        function_path: resources?.resource_path
      }
    });
  }

  return res.json({
    version: '1.0',
    agents: agentCards,
    total: agentCards.length
  });
}

/**
 * Handle synchronous message (JSON-RPC 2.0)
 */
async function handleMessage(agentId, req, res) {
  try {
    const { jsonrpc, method, params, id } = req.body;

    // Validate JSON-RPC format
    if (jsonrpc !== '2.0') {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id: id || null
      });
    }

    // Get agent
    const { data: agent, error: agentError } = await supabase
      .from('a2a_agents')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (agentError || !agent) {
      return res.json({
        jsonrpc: '2.0',
        error: { code: -32602, message: 'Agent not found' },
        id
      });
    }

    // Process based on method
    switch (method) {
      case 'calculate':
        return handleCalculation(agent, params, id, res);
      case 'query':
        return handleQuery(agent, params, id, res);
      case 'negotiate':
        return handleNegotiation(agent, params, id, res);
      default:
        return res.json({
          jsonrpc: '2.0',
          error: { code: -32601, message: 'Method not found' },
          id
        });
    }

  } catch (error) {
    return res.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: 'Internal error', data: error.message },
      id: req.body.id || null
    });
  }
}

/**
 * Handle Server-Sent Events streaming
 */
async function handleStream(agentId, req, res) {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection
  res.write('event: connected\n');
  res.write(`data: {"agent": "${agentId}", "status": "connected"}\n\n`);

  // Set up real-time subscription
  const subscription = supabase
    .channel(`agent:${agentId}`)
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'a2a_analytics_communications',
        filter: `receiver_agent_id=eq.${agentId}`
      }, 
      (payload) => {
        res.write(`event: message\n`);
        res.write(`data: ${JSON.stringify(payload.new)}\n\n`);
      }
    )
    .subscribe();

  // Handle client disconnect
  req.on('close', () => {
    subscription.unsubscribe();
    res.end();
  });
}

/**
 * Handle Task creation and management
 */
async function handleTask(agentId, req, res) {
  try {
    const { action, task_id } = req.body;

    if (action === 'create') {
      // Create new task
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('prdord_analytics')
        .insert({
          order_id: taskId,
          agent_id: agentId,
          function_name: req.body.function,
          input_parameters: req.body.parameters,
          status: 'submitted',
          requester_id: req.body.requester_id || 'api'
        });

      if (error) throw error;

      return res.json({
        task_id: taskId,
        status: 'submitted',
        agent_id: agentId,
        created_at: new Date().toISOString()
      });
    }

    if (action === 'status' && task_id) {
      // Get task status
      const { data: task, error } = await supabase
        .from('prdord_analytics')
        .select('*')
        .eq('order_id', task_id)
        .single();

      if (error || !task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      return res.json({
        task_id: task.order_id,
        status: task.status,
        result: task.result,
        error: task.error_message,
        created_at: task.created_at,
        completed_at: task.completed_at
      });
    }

    return res.status(400).json({ error: 'Invalid task action' });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Task operation failed',
      details: error.message 
    });
  }
}

/**
 * Handle calculation requests
 */
async function handleCalculation(agent, params, id, res) {
  try {
    // Get agent's function from ORD
    const { data: resource } = await supabase
      .from('ord_analytics_resources')
      .select('*')
      .eq('agent_id', agent.agent_id)
      .single();

    if (!resource) {
      return res.json({
        jsonrpc: '2.0',
        error: { code: -32602, message: 'No resource found for agent' },
        id
      });
    }

    // In real implementation, this would call the actual function
    // For now, return mock result
    const result = {
      function: resource.resource_name,
      input: params,
      output: {
        value: Math.random(),
        confidence: 0.95,
        metadata: {
          calculated_by: agent.agent_id,
          timestamp: new Date().toISOString()
        }
      }
    };

    // Store in A2A communications
    await supabase
      .from('a2a_analytics_communications')
      .insert({
        sender_agent_id: agent.agent_id,
        receiver_agent_id: params.requester || 'api',
        message_type: 'response',
        payload: result
      });

    return res.json({
      jsonrpc: '2.0',
      result,
      id
    });

  } catch (error) {
    return res.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: 'Calculation failed', data: error.message },
      id
    });
  }
}

/**
 * Handle query requests
 */
async function handleQuery(agent, params, id, res) {
  // Query agent capabilities or status
  const queryType = params.type || 'capabilities';

  switch (queryType) {
    case 'capabilities':
      return res.json({
        jsonrpc: '2.0',
        result: {
          capabilities: agent.capabilities,
          voting_power: agent.voting_power,
          status: agent.status
        },
        id
      });

    case 'resources':
      const { data: resources } = await supabase
        .from('ord_analytics_resources')
        .select('*')
        .eq('agent_id', agent.agent_id);

      return res.json({
        jsonrpc: '2.0',
        result: { resources: resources || [] },
        id
      });

    default:
      return res.json({
        jsonrpc: '2.0',
        error: { code: -32602, message: 'Unknown query type' },
        id
      });
  }
}

/**
 * Handle negotiation between agents
 */
async function handleNegotiation(agent, params, id, res) {
  // Simple negotiation logic
  const { proposal, target_agent } = params;

  // Record negotiation in A2A communications
  await supabase
    .from('a2a_analytics_communications')
    .insert({
      sender_agent_id: agent.agent_id,
      receiver_agent_id: target_agent,
      message_type: 'negotiation',
      payload: {
        proposal,
        terms: params.terms || {},
        expires_at: new Date(Date.now() + 3600000).toISOString()
      }
    });

  return res.json({
    jsonrpc: '2.0',
    result: {
      negotiation_id: `neg_${Date.now()}`,
      status: 'proposed',
      from: agent.agent_id,
      to: target_agent
    },
    id
  });
}