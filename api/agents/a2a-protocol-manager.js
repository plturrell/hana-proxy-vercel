/**
 * A2A Protocol Manager API Endpoint
 * RESTful interface for agent coordination and protocol management
 */

import { A2AProtocolManager } from '../../agents/a2a-protocol-manager.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

let protocolManagerInstance = null;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize Protocol Manager if needed
    if (!protocolManagerInstance) {
      const agentData = {
        agent_id: 'finsight.coordination.a2a_protocol_manager',
        agent_name: 'A2A Protocol Manager',
        agent_type: 'coordination',
        voting_power: 200
      };
      
      try {
        protocolManagerInstance = new A2AProtocolManager(agentData);
        await protocolManagerInstance.initialize();
      } catch (initError) {
        console.error('Failed to initialize A2A Protocol Manager:', initError);
        // Create minimal fallback agent
        protocolManagerInstance = {
          capabilities: ['coordination', 'workflow_orchestration', 'consensus_management'],
          agentRegistry: new Map(),
          workflowOrchestrator: new Map(),
          activeContracts: new Map(),
          getCoordinationStatus: async () => ({
            active_agents: 0,
            active_workflows: 0,
            active_consensus: 0,
            system_health: 'degraded'
          }),
          calculateSystemHealth: () => ({
            agent_availability: 0,
            average_response_time: 999999,
            system_load: 1.0
          }),
          handleCoordinationRequest: async (message) => {
            throw new Error('Agent initialization failed - coordination unavailable');
          },
          executeWorkflow: async (workflow, data, agent) => {
            throw new Error('Agent initialization failed - workflow execution unavailable');
          },
          handleConsensusProposal: async (message) => {
            throw new Error('Agent initialization failed - consensus unavailable');
          },
          sendMessage: async (toAgent, message) => {
            throw new Error('Agent initialization failed - messaging unavailable');
          },
          performHealthCheck: async () => {
            throw new Error('Agent initialization failed - health check unavailable');
          }
        };
      }
    }

    const { action } = req.query;

    if (req.method === 'GET') {
      switch (action) {
        case 'status':
          return await handleStatusRequest(req, res);
        case 'agents':
          return await handleAgentsRequest(req, res);
        case 'workflows':
          return await handleWorkflowsRequest(req, res);
        case 'consensus':
          return await handleConsensusRequest(req, res);
        case 'metrics':
          return await handleMetricsRequest(req, res);
        case 'health':
          return await handleHealthRequest(req, res);
        default:
          return await handleStatusRequest(req, res);
      }
    }

    if (req.method === 'POST') {
      const { action } = req.body;
      
      switch (action) {
        case 'coordinate':
          return await handleCoordinationRequest(req, res);
        case 'trigger_workflow':
          return await handleWorkflowTrigger(req, res);
        case 'propose_consensus':
          return await handleConsensusProposal(req, res);
        case 'send_message':
          return await handleMessageSend(req, res);
        case 'health_check':
          return await handleHealthCheck(req, res);
        default:
          return res.status(400).json({
            success: false,
            error: 'Unknown action',
            available_actions: ['coordinate', 'trigger_workflow', 'propose_consensus', 'send_message', 'health_check']
          });
      }
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed_methods: ['GET', 'POST', 'OPTIONS']
    });

  } catch (error) {
    console.error('A2A Protocol Manager API error:', error);
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
    const status = await protocolManagerInstance.getCoordinationStatus();
    
    return res.json({
      success: true,
      agent_id: 'finsight.coordination.a2a_protocol_manager',
      status: 'active',
      uptime: process.uptime(),
      coordination_status: status,
      capabilities: protocolManagerInstance.capabilities,
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
 * Handle agents registry requests
 */
async function handleAgentsRequest(req, res) {
  try {
    const agents = Array.from(protocolManagerInstance.agentRegistry.entries()).map(([id, info]) => ({
      agent_id: id,
      agent_name: info.agent_name,
      agent_type: info.agent_type,
      status: info.status,
      health_status: info.health_status,
      last_seen: info.last_seen,
      performance_metrics: info.performance_metrics,
      capabilities: info.capabilities?.slice(0, 5) // Limit for response size
    }));

    return res.json({
      success: true,
      total_agents: agents.length,
      agents: agents,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get agents',
      details: error.message
    });
  }
}

/**
 * Handle workflows requests
 */
async function handleWorkflowsRequest(req, res) {
  try {
    const workflows = Array.from(protocolManagerInstance.workflowOrchestrator.entries()).map(([id, workflow]) => ({
      workflow_id: id,
      workflow_name: workflow.workflow_name,
      status: workflow.status,
      last_execution: workflow.last_execution,
      execution_count: workflow.execution_count,
      associated_agents: workflow.associated_agents
    }));

    return res.json({
      success: true,
      total_workflows: workflows.length,
      active_workflows: workflows.filter(w => w.status === 'executing').length,
      workflows: workflows,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get workflows',
      details: error.message
    });
  }
}

/**
 * Handle consensus requests
 */
async function handleConsensusRequest(req, res) {
  try {
    const consensusProcesses = Array.from(protocolManagerInstance.activeContracts.entries()).map(([id, consensus]) => ({
      proposal_id: id,
      type: consensus.type,
      status: consensus.status,
      voting_agents: consensus.voting_agents,
      votes_received: consensus.votes.size,
      threshold: consensus.threshold,
      created_at: consensus.created_at,
      timeout: new Date(consensus.timeout)
    }));

    return res.json({
      success: true,
      total_consensus_processes: consensusProcesses.length,
      active_voting: consensusProcesses.filter(c => c.status === 'voting').length,
      consensus_processes: consensusProcesses,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get consensus data',
      details: error.message
    });
  }
}

/**
 * Handle metrics requests
 */
async function handleMetricsRequest(req, res) {
  try {
    const systemHealth = protocolManagerInstance.calculateSystemHealth();
    const coordination = await protocolManagerInstance.getCoordinationStatus();
    
    // Get recent message activity
    const { data: recentMessages, error } = await supabase
      .from('a2a_messages')
      .select('message_type, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    const messageStats = {};
    if (!error && recentMessages) {
      recentMessages.forEach(msg => {
        messageStats[msg.message_type] = (messageStats[msg.message_type] || 0) + 1;
      });
    }

    return res.json({
      success: true,
      metrics: {
        system_health: systemHealth,
        coordination_status: coordination,
        message_activity_24h: {
          total_messages: recentMessages?.length || 0,
          by_type: messageStats
        },
        performance: {
          avg_response_time: systemHealth.average_response_time,
          agent_availability: systemHealth.agent_availability,
          system_load: systemHealth.system_load
        }
      },
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
 * Handle health requests
 */
async function handleHealthRequest(req, res) {
  try {
    const health = protocolManagerInstance.calculateSystemHealth();
    const isHealthy = health.agent_availability > 0.7 && health.average_response_time < 1000;

    return res.json({
      success: true,
      healthy: isHealthy,
      health_score: health.agent_availability,
      details: {
        agent_availability: health.agent_availability,
        average_response_time: health.average_response_time,
        system_load: health.system_load
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
 * Handle coordination requests
 */
async function handleCoordinationRequest(req, res) {
  try {
    const { task_type, agents_involved, task_definition, priority = 'normal' } = req.body;

    if (!task_type || !agents_involved || !task_definition) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['task_type', 'agents_involved', 'task_definition']
      });
    }

    // Create coordination message
    const coordinationMessage = {
      from_agent: 'api_request',
      to_agent: 'finsight.coordination.a2a_protocol_manager',
      message_type: 'coordination_request',
      payload: {
        request_type: 'multi_agent_task',
        task_type,
        agents_involved,
        task_definition,
        priority
      },
      timestamp: new Date()
    };

    // Process coordination
    await protocolManagerInstance.handleCoordinationRequest(coordinationMessage);

    return res.json({
      success: true,
      message: 'Coordination request initiated',
      task_type,
      agents_involved,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process coordination request',
      details: error.message
    });
  }
}

/**
 * Handle workflow trigger requests
 */
async function handleWorkflowTrigger(req, res) {
  try {
    const { workflow_id, trigger_data, initiating_agent = 'api_request' } = req.body;

    if (!workflow_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing workflow_id'
      });
    }

    const workflow = protocolManagerInstance.workflowOrchestrator.get(workflow_id);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
        workflow_id
      });
    }

    // Execute workflow
    await protocolManagerInstance.executeWorkflow(workflow, trigger_data, initiating_agent);

    return res.json({
      success: true,
      message: 'Workflow triggered successfully',
      workflow_id,
      initiating_agent,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to trigger workflow',
      details: error.message
    });
  }
}

/**
 * Handle consensus proposal requests
 */
async function handleConsensusProposal(req, res) {
  try {
    const { proposal_type, proposal_data, voting_agents } = req.body;

    if (!proposal_type || !proposal_data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['proposal_type', 'proposal_data']
      });
    }

    const proposalId = `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create consensus message
    const consensusMessage = {
      from_agent: 'api_request',
      to_agent: 'finsight.coordination.a2a_protocol_manager',
      message_type: 'consensus_proposal',
      payload: {
        proposal_id: proposalId,
        proposal_type,
        proposal_data,
        voting_agents
      },
      timestamp: new Date()
    };

    // Process consensus proposal
    await protocolManagerInstance.handleConsensusProposal(consensusMessage);

    return res.json({
      success: true,
      message: 'Consensus proposal initiated',
      proposal_id: proposalId,
      proposal_type,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to process consensus proposal',
      details: error.message
    });
  }
}

/**
 * Handle message send requests
 */
async function handleMessageSend(req, res) {
  try {
    const { to_agent, message_type, payload } = req.body;

    if (!to_agent || !message_type || !payload) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['to_agent', 'message_type', 'payload']
      });
    }

    // Send message via protocol manager
    await protocolManagerInstance.sendMessage(to_agent, {
      message_type,
      payload
    });

    return res.json({
      success: true,
      message: 'Message sent successfully',
      to_agent,
      message_type,
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to send message',
      details: error.message
    });
  }
}

/**
 * Handle health check requests
 */
async function handleHealthCheck(req, res) {
  try {
    await protocolManagerInstance.performHealthCheck();

    return res.json({
      success: true,
      message: 'Health check initiated for all agents',
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to perform health check',
      details: error.message
    });
  }
}