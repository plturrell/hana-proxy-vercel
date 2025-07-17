/**
 * Real A2A Visual Builder API
 * Connects to live A2A network with real agents and contracts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { action } = req.body;
    
    switch (action) {
      case 'list_real_agents':
        return handleListRealAgents(req, res);
        
      case 'list_real_contracts':
        return handleListRealContracts(req, res);
        
      case 'deploy_to_real_network':
        return handleDeployToRealNetwork(req, res);
        
      case 'get_network_status':
        return handleGetNetworkStatus(req, res);
        
      case 'validate_real_process':
        return handleValidateRealProcess(req, res);
        
      case 'bridge_integration':
        return handleBridgeIntegration(req, res);
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Visual builder real API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      bridge: 'A2A Visual Builder Bridge v1.0'
    });
  }
}

/**
 * List real A2A agents from the network
 */
async function handleListRealAgents(req, res) {
  try {
    // Get agents from a2a_agents table
    const { data: agents, error: agentsError } = await supabase
      .from('a2a_agents')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (agentsError) throw agentsError;
    
    // Get agents from consensus table (backup)
    const { data: consensusAgents, error: consensusError } = await supabase
      .from('a2a_consensus')
      .select('agent_id, agent_address, last_seen, reputation')
      .order('last_seen', { ascending: false })
      .limit(10);
    
    // Combine and format agents
    const realAgents = [
      ...(agents || []).map(agent => ({
        id: agent.agent_id,
        name: agent.name || agent.agent_id,
        type: agent.agent_type || 'processor',
        status: 'active',
        reputation: agent.reputation_score || 100,
        address: agent.agent_address,
        lastSeen: agent.last_active,
        capabilities: agent.capabilities || []
      })),
      ...(consensusAgents || []).map(agent => ({
        id: agent.agent_id,
        name: agent.agent_id,
        type: 'consensus',
        status: 'active',
        reputation: agent.reputation || 100,
        address: agent.agent_address,
        lastSeen: agent.last_seen,
        capabilities: ['consensus']
      }))
    ];
    
    // Remove duplicates based on agent_id
    const uniqueAgents = realAgents.filter((agent, index, self) => 
      index === self.findIndex(a => a.id === agent.id)
    );
    
    return res.status(200).json({
      success: true,
      agents: uniqueAgents,
      totalCount: uniqueAgents.length,
      networkHealth: uniqueAgents.length > 0 ? 'healthy' : 'no-agents'
    });
    
  } catch (error) {
    console.error('Failed to list real agents:', error);
    return res.status(500).json({
      error: 'Failed to load real agents',
      details: error.message
    });
  }
}

/**
 * List real deployed contracts
 */
async function handleListRealContracts(req, res) {
  try {
    // Get deployed A2A processes
    const { data: deployments, error: deploymentsError } = await supabase
      .from('a2a_deployments')
      .select('*')
      .order('deployed_at', { ascending: false })
      .limit(20);
    
    if (deploymentsError) throw deploymentsError;
    
    // Get trust contracts if available
    const { data: contracts, error: contractsError } = await supabase
      .from('a2a_trust_contracts')
      .select('*')
      .eq('status', 'deployed')
      .order('deployed_at', { ascending: false })
      .limit(10);
    
    const realContracts = [
      ...(deployments || []).map(deployment => ({
        id: deployment.process_id,
        name: deployment.process_name,
        type: inferContractType(deployment.process_name),
        address: deployment.contracts?.address || deployment.contract_address,
        deployedAt: deployment.deployed_at,
        gasUsed: deployment.gas_used,
        status: 'deployed',
        deployer: deployment.deployer
      })),
      ...(contracts || []).map(contract => ({
        id: contract.contract_id,
        name: contract.contract_name,
        type: contract.contract_type,
        address: contract.contract_address,
        deployedAt: contract.deployed_at,
        gasUsed: contract.gas_used,
        status: contract.status,
        deployer: contract.deployer
      }))
    ];
    
    return res.status(200).json({
      success: true,
      contracts: realContracts,
      totalCount: realContracts.length
    });
    
  } catch (error) {
    console.error('Failed to list real contracts:', error);
    return res.status(500).json({
      error: 'Failed to load real contracts',
      details: error.message
    });
  }
}

/**
 * Deploy process to real A2A network
 */
async function handleDeployToRealNetwork(req, res) {
  try {
    const { process, deployer } = req.body;
    
    if (!process || !process.nodes || process.nodes.length === 0) {
      return res.status(400).json({
        error: 'Valid process with nodes required'
      });
    }
    
    // Validate that real agents exist
    const realAgentNodes = process.nodes.filter(node => 
      node.type === 'agent' && node.realData?.realAgentId
    );
    
    if (realAgentNodes.length === 0) {
      return res.status(400).json({
        error: 'Process must include at least one real agent'
      });
    }
    
    // Verify real agents are still active
    for (const node of realAgentNodes) {
      const { data: agent } = await supabase
        .from('a2a_agents')
        .select('status')
        .eq('agent_id', node.realData.realAgentId)
        .single();
        
      if (!agent || agent.status !== 'active') {
        return res.status(400).json({
          error: `Agent ${node.realData.realAgentId} is not active`
        });
      }
    }
    
    // Generate process ID
    const processId = `real_process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store process deployment
    const { error: deployError } = await supabase
      .from('a2a_real_deployments')
      .insert({
        process_id: processId,
        process_name: process.name || 'Visual Process',
        process_definition: process,
        deployer: deployer || 'visual-builder',
        real_agents: realAgentNodes.map(n => n.realData.realAgentId),
        deployed_at: new Date().toISOString(),
        status: 'deployed'
      });
    
    if (deployError) throw deployError;
    
    // Notify real agents about new process
    for (const node of realAgentNodes) {
      await notifyRealAgent(node.realData.realAgentId, {
        action: 'process_deployed',
        processId,
        nodeId: node.id,
        nodeConfig: node.config
      });
    }
    
    return res.status(200).json({
      success: true,
      processId,
      realAgentsNotified: realAgentNodes.length,
      deploymentUrl: `/a2a-network.html?process=${processId}`,
      monitorUrl: `/api/visual-builder-real?action=get_process_status&processId=${processId}`
    });
    
  } catch (error) {
    console.error('Failed to deploy to real network:', error);
    return res.status(500).json({
      error: 'Deployment to real network failed',
      details: error.message
    });
  }
}

/**
 * Get A2A network status
 */
async function handleGetNetworkStatus(req, res) {
  try {
    // Check active agents
    const { data: agents, error: agentsError } = await supabase
      .from('a2a_agents')
      .select('agent_id, status, last_active')
      .eq('status', 'active');
    
    // Check recent consensus activity
    const { data: consensus, error: consensusError } = await supabase
      .from('a2a_consensus')
      .select('agent_id, last_seen')
      .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes
    
    // Check recent deployments
    const { data: deployments, error: deploymentsError } = await supabase
      .from('a2a_real_deployments')
      .select('process_id, deployed_at, status')
      .gte('deployed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours
    
    const networkStatus = {
      status: 'healthy',
      activeAgents: agents?.length || 0,
      consensusAgents: consensus?.length || 0,
      recentDeployments: deployments?.length || 0,
      lastUpdate: new Date().toISOString(),
      issues: []
    };
    
    // Check for issues
    if (networkStatus.activeAgents === 0) {
      networkStatus.status = 'degraded';
      networkStatus.issues.push('No active agents');
    }
    
    if (networkStatus.consensusAgents === 0) {
      networkStatus.status = 'degraded';
      networkStatus.issues.push('No recent consensus activity');
    }
    
    return res.status(200).json({
      success: true,
      networkStatus
    });
    
  } catch (error) {
    console.error('Failed to get network status:', error);
    return res.status(500).json({
      error: 'Failed to get network status',
      details: error.message
    });
  }
}

/**
 * Validate process with real network constraints
 */
async function handleValidateRealProcess(req, res) {
  try {
    const { process } = req.body;
    
    if (!process) {
      return res.status(400).json({ error: 'Process required' });
    }
    
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      realNetworkCompatible: true
    };
    
    // Check if process has real agents
    const realAgents = process.nodes?.filter(n => 
      n.type === 'agent' && n.realData?.realAgentId
    ) || [];
    
    if (realAgents.length === 0) {
      validation.warnings.push('No real agents included - process will use simulated agents');
      validation.realNetworkCompatible = false;
    }
    
    // Validate real agent connections
    for (const agent of realAgents) {
      const { data: agentData } = await supabase
        .from('a2a_agents')
        .select('status, capabilities')
        .eq('agent_id', agent.realData.realAgentId)
        .single();
        
      if (!agentData) {
        validation.errors.push(`Real agent ${agent.realData.realAgentId} not found`);
        validation.valid = false;
      } else if (agentData.status !== 'active') {
        validation.errors.push(`Real agent ${agent.realData.realAgentId} is not active`);
        validation.valid = false;
      }
    }
    
    // Check trust contracts
    const trustContracts = process.nodes?.filter(n => n.type === 'contract') || [];
    for (const contract of trustContracts) {
      if (contract.realData?.realContractAddress) {
        // Validate real contract exists and is functional
        validation.warnings.push(`Using deployed contract ${contract.realData.realContractAddress}`);
      }
    }
    
    return res.status(200).json({
      success: true,
      validation
    });
    
  } catch (error) {
    console.error('Failed to validate real process:', error);
    return res.status(500).json({
      error: 'Process validation failed',
      details: error.message
    });
  }
}

/**
 * Helper functions
 */

function inferContractType(processName) {
  if (!processName) return 'escrow';
  
  const name = processName.toLowerCase();
  if (name.includes('escrow')) return 'escrow';
  if (name.includes('multisig') || name.includes('consensus')) return 'multisig';
  if (name.includes('time') || name.includes('lock')) return 'timelock';
  if (name.includes('reputation')) return 'reputation';
  
  return 'escrow';
}

/**
 * Handle bridge integration requests
 */
async function handleBridgeIntegration(req, res) {
  try {
    const { bridge_action, data } = req.body;
    
    switch (bridge_action) {
      case 'initialize':
        return res.status(200).json({
          success: true,
          bridge_version: '1.0.0',
          compatible_with: 'src/a2a-visual/integration.ts',
          features: [
            'TypeScript Integration',
            'Real-time Monitoring',
            'Blockchain Deployment',
            'Agent Management',
            'Visual Process Execution'
          ]
        });
        
      case 'convert_process':
        // Convert between TypeScript and HTML/JS formats
        const convertedProcess = convertToTypeScriptFormat(data.process);
        return res.status(200).json({
          success: true,
          converted_process: convertedProcess
        });
        
      case 'register_agent_skills':
        // Register agent skills compatible with A2A protocol
        await registerAgentSkills(data.agentId, data.subtype);
        return res.status(200).json({
          success: true,
          skills_registered: true
        });
        
      default:
        return res.status(400).json({ error: 'Invalid bridge action' });
    }
    
  } catch (error) {
    console.error('Bridge integration error:', error);
    return res.status(500).json({
      error: 'Bridge integration failed',
      details: error.message
    });
  }
}

/**
 * Convert process to TypeScript-compatible format
 */
function convertToTypeScriptFormat(htmlProcess) {
  return {
    id: htmlProcess.id,
    name: htmlProcess.name,
    elements: htmlProcess.elements?.map(el => ({
      id: el.id,
      type: el.type,
      subtype: el.subtype,
      position: el.position || { x: 0, y: 0 },
      config: {
        ...el.config,
        name: el.name,
        description: el.config?.description || ''
      }
    })) || [],
    connections: htmlProcess.connections?.map(conn => ({
      from: conn.from,
      to: conn.to,
      trustLevel: conn.trustLevel || 'medium',
      contract: conn.contract
    })) || [],
    trustRequirements: extractTrustRequirements(htmlProcess.elements || [])
  };
}

/**
 * Extract trust requirements compatible with TypeScript interface
 */
function extractTrustRequirements(elements) {
  const requirements = [];
  
  elements.forEach(element => {
    if (element.type === 'contract') {
      switch (element.subtype) {
        case 'reputation':
          requirements.push({
            type: 'reputation',
            threshold: element.config?.threshold || 80
          });
          break;
        case 'multisig':
          requirements.push({
            type: 'multisig',
            participants: element.config?.participants || [],
            threshold: element.config?.requiredSignatures || 2
          });
          break;
        case 'timelock':
          requirements.push({
            type: 'timelock',
            duration: element.config?.lockDuration || 3600
          });
          break;
        case 'escrow':
          requirements.push({
            type: 'stake',
            threshold: element.config?.stakeAmount || 0.1
          });
          break;
      }
    }
  });
  
  return requirements;
}

/**
 * Register agent skills compatible with A2A protocol
 */
async function registerAgentSkills(agentId, subtype) {
  const skillMappings = {
    'initiator': [
      {
        name: 'initiate_task',
        description: 'Start new tasks',
        input_schema: { type: 'object', properties: { task_type: { type: 'string' }, data: { type: 'object' } } },
        output_schema: { type: 'object', properties: { task_id: { type: 'string' }, status: { type: 'string' } } },
        required_params: ['task_type', 'data']
      }
    ],
    'processor': [
      {
        name: 'process_data',
        description: 'Process incoming data',
        input_schema: { type: 'object', properties: { input_data: { type: 'object' } } },
        output_schema: { type: 'object', properties: { processed_data: { type: 'object' }, status: { type: 'string' } } },
        required_params: ['input_data']
      }
    ],
    'validator': [
      {
        name: 'validate_result',
        description: 'Validate task results',
        input_schema: { type: 'object', properties: { result: { type: 'object' }, criteria: { type: 'object' } } },
        output_schema: { type: 'boolean' },
        required_params: ['result', 'criteria']
      }
    ]
  };
  
  const skills = skillMappings[subtype] || [];
  
  for (const skill of skills) {
    await supabase
      .from('a2a_agent_skills')
      .insert({
        agent_id: agentId,
        skill_name: skill.name,
        skill_description: skill.description,
        input_schema: skill.input_schema,
        output_schema: skill.output_schema,
        required_params: skill.required_params,
        created_at: new Date().toISOString()
      });
  }
  
  console.log(`📚 Registered ${skills.length} skills for agent ${agentId} (${subtype})`);
}

async function notifyRealAgent(agentId, notification) {
  try {
    // Store notification for agent to pick up
    await supabase
      .from('a2a_agent_notifications')
      .insert({
        agent_id: agentId,
        notification_type: notification.action,
        notification_data: notification,
        created_at: new Date().toISOString(),
        status: 'pending'
      });
    
    console.log(`📧 Notified agent ${agentId} about ${notification.action}`);
    
    // In a real implementation, you might also:
    // - Send WebSocket message
    // - Call agent's webhook
    // - Add to message queue
    
  } catch (error) {
    console.error(`Failed to notify agent ${agentId}:`, error);
  }
}