/**
 * Consolidated A2A Blockchain API
 * Combines agent registry, blockchain bridge, and agent integration
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration:', { 
    url: !!supabaseUrl, 
    key: !!supabaseKey 
  });
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
    
    // Registry actions
    if (action.startsWith('registry_')) {
      return handleRegistryAction(action.replace('registry_', ''), req, res);
    }
    
    // Bridge actions
    if (action.startsWith('bridge_')) {
      return handleBridgeAction(action.replace('bridge_', ''), req, res);
    }
    
    // Integration actions
    if (action.startsWith('integration_')) {
      return handleIntegrationAction(action.replace('integration_', ''), req, res);
    }
    
    // Default registry actions (backward compatibility)
    switch (action) {
      case 'register_agent':
      case 'onboard_to_blockchain':
      case 'discover_agents':
      case 'get_agent_details':
      case 'verify_agent':
      case 'update_capabilities':
      case 'get_registry_stats':
        return handleRegistryAction(action, req, res);
        
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('A2A Blockchain API Error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
}

// ============================================
// REGISTRY HANDLERS
// ============================================

async function handleRegistryAction(action, req, res) {
  switch (action) {
    case 'register_agent':
      return handleRegisterAgent(req, res);
    case 'onboard_to_blockchain':
      return handleOnboardToBlockchain(req, res);
    case 'discover_agents':
      return handleDiscoverAgents(req, res);
    case 'get_agent_details':
      return handleGetAgentDetails(req, res);
    case 'verify_agent':
      return handleVerifyAgent(req, res);
    case 'update_capabilities':
      return handleUpdateCapabilities(req, res);
    case 'get_registry_stats':
      return handleGetRegistryStats(req, res);
    default:
      return res.status(400).json({ error: 'Unknown registry action' });
  }
}

async function handleRegisterAgent(req, res) {
  try {
    const { name, type, description, capabilities, metadata } = req.body;
    
    if (!name || !type || !capabilities) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, type, capabilities' 
      });
    }
    
    // Test Supabase connection
    console.log('Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('a2a_agents')
      .select('agent_id')
      .limit(1);
    
    if (testError) {
      console.error('Supabase connection test failed:', testError);
    }
    
    const agentId = generateAgentId(name, type);
    
    const { data: existing } = await supabase
      .from('a2a_agents')
      .select('agent_id')
      .eq('agent_id', agentId)
      .single();
    
    if (existing) {
      return res.status(409).json({ 
        error: 'Agent with this ID already exists',
        agent_id: agentId 
      });
    }
    
    const agentData = {
      agent_id: agentId,
      name,
      type,
      description: description || `${type} agent for ${name}`,
      capabilities: Array.isArray(capabilities) ? capabilities : [capabilities],
      status: 'pending',
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };
    
    const { data: agent, error } = await supabase
      .from('a2a_agents')
      .insert(agentData)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    await supabase
      .from('agent_activity')
      .insert({
        agent_id: agentId,
        activity_type: 'agent_registered',
        details: { name, type, capabilities: agent.capabilities }
      });
    
    return res.json({
      success: true,
      message: 'Agent registered successfully',
      agent: {
        agent_id: agent.agent_id,
        name: agent.name,
        type: agent.type,
        capabilities: agent.capabilities,
        status: agent.status,
        next_step: 'Call onboard_to_blockchain to activate agent'
      }
    });
    
  } catch (error) {
    console.error('Register agent error:', error);
    return res.status(500).json({ 
      error: 'Failed to register agent',
      details: error.message 
    });
  }
}

async function handleOnboardToBlockchain(req, res) {
  try {
    const { agent_id, initial_stake } = req.body;
    
    if (!agent_id) {
      return res.status(400).json({ error: 'Agent ID required' });
    }
    
    const { data: agent, error: agentError } = await supabase
      .from('a2a_agents')
      .select('*')
      .eq('agent_id', agent_id)
      .single();
    
    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    if (agent.blockchain_config?.wallet_address) {
      return res.status(400).json({ 
        error: 'Agent already onboarded to blockchain',
        wallet_address: agent.blockchain_config.wallet_address 
      });
    }
    
    const blockchainId = generateBlockchainId(agent_id);
    const walletAddress = generateWalletAddress(agent_id);
    const privateKey = generatePrivateKey(agent_id);
    
    const blockchainConfig = {
      blockchain_id: blockchainId,
      wallet_address: walletAddress,
      private_key_hash: crypto.createHash('sha256').update(privateKey).digest('hex'),
      network: 'supabase-private',
      initial_stake: initial_stake || '100',
      balance: initial_stake || '100',
      created_at: new Date().toISOString(),
      verified: true
    };
    
    const { error: updateError } = await supabase
      .from('a2a_agents')
      .update({
        blockchain_config: blockchainConfig,
        status: 'active',
        voting_power: parseInt(initial_stake || '100'),
        capabilities: [...agent.capabilities, 'blockchain_enabled'],
        updated_at: new Date().toISOString()
      })
      .eq('agent_id', agent_id);
    
    if (updateError) throw updateError;
    
    await supabase
      .from('agent_blockchain_activities')
      .insert({
        agent_id: agent_id,
        activity_type: 'wallet_created',
        transaction_hash: generateTransactionHash('wallet_creation', agent_id),
        status: 'confirmed',
        details: {
          wallet_address: walletAddress,
          initial_stake: initial_stake || '100',
          network: 'supabase-private'
        }
      });
    
    await supabase
      .from('agent_activity')
      .insert({
        agent_id: agent_id,
        activity_type: 'blockchain_onboarded',
        details: {
          wallet_address: walletAddress,
          blockchain_id: blockchainId,
          initial_stake: initial_stake || '100'
        }
      });
    
    return res.json({
      success: true,
      message: 'Agent successfully onboarded to blockchain',
      blockchain_details: {
        agent_id: agent_id,
        blockchain_id: blockchainId,
        wallet_address: walletAddress,
        network: 'supabase-private',
        initial_stake: initial_stake || '100',
        status: 'active'
      }
    });
    
  } catch (error) {
    console.error('Onboard to blockchain error:', error);
    return res.status(500).json({ 
      error: 'Failed to onboard agent to blockchain',
      details: error.message 
    });
  }
}

async function handleDiscoverAgents(req, res) {
  try {
    const { 
      type, 
      capabilities, 
      status,
      blockchain_only,
      limit = 10,
      offset = 0 
    } = req.body;
    
    let query = supabase
      .from('a2a_agents')
      .select(`
        agent_id,
        name,
        type,
        description,
        capabilities,
        status,
        success_rate,
        performance_score,
        blockchain_config,
        last_active
      `);
    
    if (type) {
      query = query.eq('type', type);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (capabilities && capabilities.length > 0) {
      query = query.contains('capabilities', capabilities);
    }
    
    if (blockchain_only) {
      query = query.not('blockchain_config', 'is', null);
    }
    
    query = query
      .order('performance_score', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data: agents, error, count } = await query;
    
    if (error) throw error;
    
    const processedAgents = agents?.map(agent => ({
      ...agent,
      blockchain_enabled: !!agent.blockchain_config,
      wallet_address: agent.blockchain_config?.wallet_address,
      reputation_score: calculateReputationScore(agent)
    })) || [];
    
    return res.json({
      success: true,
      agents: processedAgents,
      total: count || processedAgents.length,
      filters_applied: {
        type,
        capabilities,
        status,
        blockchain_only
      }
    });
    
  } catch (error) {
    console.error('Discover agents error:', error);
    return res.status(500).json({ 
      error: 'Failed to discover agents',
      details: error.message 
    });
  }
}

async function handleGetAgentDetails(req, res) {
  try {
    const { agent_id } = req.body;
    
    if (!agent_id) {
      return res.status(400).json({ error: 'Agent ID required' });
    }
    
    const { data: agent, error: agentError } = await supabase
      .from('a2a_agents')
      .select('*')
      .eq('agent_id', agent_id)
      .single();
    
    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    const { data: activities } = await supabase
      .from('agent_activity')
      .select('*')
      .eq('agent_id', agent_id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    let blockchainActivities = [];
    if (agent.blockchain_config) {
      const { data: bcActivities } = await supabase
        .from('agent_blockchain_activities')
        .select('*')
        .eq('agent_id', agent_id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      blockchainActivities = bcActivities || [];
    }
    
    const { data: taskStats } = await supabase
      .from('agent_task_executions')
      .select('status')
      .eq('agent_id', agent_id);
    
    const successfulTasks = taskStats?.filter(t => t.status === 'completed').length || 0;
    const totalTasks = taskStats?.length || 0;
    
    return res.json({
      success: true,
      agent: {
        ...agent,
        blockchain_enabled: !!agent.blockchain_config,
        wallet_address: agent.blockchain_config?.wallet_address,
        blockchain_id: agent.blockchain_config?.blockchain_id,
        reputation_score: calculateReputationScore(agent),
        recent_activities: activities || [],
        blockchain_activities: blockchainActivities,
        task_stats: {
          total: totalTasks,
          successful: successfulTasks,
          success_rate: totalTasks > 0 ? (successfulTasks / totalTasks * 100).toFixed(2) : 0
        }
      }
    });
    
  } catch (error) {
    console.error('Get agent details error:', error);
    return res.status(500).json({ 
      error: 'Failed to get agent details',
      details: error.message 
    });
  }
}

async function handleVerifyAgent(req, res) {
  try {
    const { agent_id, blockchain_id, wallet_address } = req.body;
    
    if (!agent_id) {
      return res.status(400).json({ error: 'Agent ID required' });
    }
    
    const { data: agent, error } = await supabase
      .from('a2a_agents')
      .select('blockchain_config')
      .eq('agent_id', agent_id)
      .single();
    
    if (error || !agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    if (!agent.blockchain_config) {
      return res.json({
        success: false,
        verified: false,
        reason: 'Agent not onboarded to blockchain'
      });
    }
    
    const configId = agent.blockchain_config.blockchain_id;
    const configWallet = agent.blockchain_config.wallet_address;
    
    const idMatch = !blockchain_id || configId === blockchain_id;
    const walletMatch = !wallet_address || configWallet === wallet_address;
    
    const verified = idMatch && walletMatch;
    
    return res.json({
      success: true,
      verified,
      agent_id,
      blockchain_id: configId,
      wallet_address: configWallet,
      network: agent.blockchain_config.network,
      reason: verified ? 'Identity verified' : 'Identity mismatch'
    });
    
  } catch (error) {
    console.error('Verify agent error:', error);
    return res.status(500).json({ 
      error: 'Failed to verify agent',
      details: error.message 
    });
  }
}

async function handleUpdateCapabilities(req, res) {
  try {
    const { agent_id, capabilities, add_capabilities, remove_capabilities } = req.body;
    
    if (!agent_id) {
      return res.status(400).json({ error: 'Agent ID required' });
    }
    
    const { data: agent, error: agentError } = await supabase
      .from('a2a_agents')
      .select('capabilities')
      .eq('agent_id', agent_id)
      .single();
    
    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    let newCapabilities = agent.capabilities || [];
    
    if (capabilities) {
      newCapabilities = capabilities;
    } else {
      if (add_capabilities) {
        newCapabilities = [...new Set([...newCapabilities, ...add_capabilities])];
      }
      
      if (remove_capabilities) {
        newCapabilities = newCapabilities.filter(cap => !remove_capabilities.includes(cap));
      }
    }
    
    const { error: updateError } = await supabase
      .from('a2a_agents')
      .update({
        capabilities: newCapabilities,
        updated_at: new Date().toISOString()
      })
      .eq('agent_id', agent_id);
    
    if (updateError) throw updateError;
    
    await supabase
      .from('agent_activity')
      .insert({
        agent_id: agent_id,
        activity_type: 'capabilities_updated',
        details: {
          old_capabilities: agent.capabilities,
          new_capabilities: newCapabilities,
          added: add_capabilities,
          removed: remove_capabilities
        }
      });
    
    return res.json({
      success: true,
      message: 'Capabilities updated successfully',
      agent_id,
      capabilities: newCapabilities
    });
    
  } catch (error) {
    console.error('Update capabilities error:', error);
    return res.status(500).json({ 
      error: 'Failed to update capabilities',
      details: error.message 
    });
  }
}

async function handleGetRegistryStats(req, res) {
  try {
    const { count: totalAgents } = await supabase
      .from('a2a_agents')
      .select('*', { count: 'exact', head: true });
    
    const { count: activeAgents } = await supabase
      .from('a2a_agents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    const { count: blockchainAgents } = await supabase
      .from('a2a_agents')
      .select('*', { count: 'exact', head: true })
      .not('blockchain_config', 'is', null);
    
    const { data: agentTypes } = await supabase
      .from('a2a_agents')
      .select('type');
    
    const typeDistribution = {};
    agentTypes?.forEach(agent => {
      typeDistribution[agent.type] = (typeDistribution[agent.type] || 0) + 1;
    });
    
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentRegistrations } = await supabase
      .from('a2a_agents')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday);
    
    const { data: agents } = await supabase
      .from('a2a_agents')
      .select('capabilities');
    
    const capabilityCount = {};
    agents?.forEach(agent => {
      agent.capabilities?.forEach(cap => {
        capabilityCount[cap] = (capabilityCount[cap] || 0) + 1;
      });
    });
    
    const topCapabilities = Object.entries(capabilityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([capability, count]) => ({ capability, count }));
    
    return res.json({
      success: true,
      stats: {
        total_agents: totalAgents || 0,
        active_agents: activeAgents || 0,
        blockchain_enabled: blockchainAgents || 0,
        recent_registrations_24h: recentRegistrations || 0,
        agent_type_distribution: typeDistribution,
        top_capabilities: topCapabilities,
        blockchain_adoption_rate: totalAgents > 0 
          ? ((blockchainAgents / totalAgents) * 100).toFixed(2) + '%'
          : '0%'
      }
    });
    
  } catch (error) {
    console.error('Get registry stats error:', error);
    return res.status(500).json({ 
      error: 'Failed to get registry stats',
      details: error.message 
    });
  }
}

// ============================================
// BRIDGE HANDLERS (stub for now)
// ============================================

async function handleBridgeAction(action, req, res) {
  // Bridge actions would go here
  return res.status(400).json({ error: 'Bridge action not implemented: ' + action });
}

// ============================================
// INTEGRATION HANDLERS (stub for now)
// ============================================

async function handleIntegrationAction(action, req, res) {
  // Integration actions would go here
  return res.status(400).json({ error: 'Integration action not implemented: ' + action });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateAgentId(name, type) {
  const timestamp = Date.now();
  const hash = crypto.createHash('sha256')
    .update(`${name}-${type}-${timestamp}`)
    .digest('hex')
    .substring(0, 8);
  return `${type}-${name.toLowerCase().replace(/\s+/g, '-')}-${hash}`;
}

function generateBlockchainId(agentId) {
  return '0x' + crypto.createHash('sha256')
    .update(agentId)
    .digest('hex')
    .substring(0, 40);
}

function generateWalletAddress(agentId) {
  return '0x' + crypto.createHash('sha256')
    .update(`wallet-${agentId}`)
    .digest('hex')
    .substring(0, 40);
}

function generatePrivateKey(agentId) {
  return '0x' + crypto.createHash('sha256')
    .update(`private-${agentId}-${Date.now()}`)
    .digest('hex');
}

function generateTransactionHash(action, agentId) {
  return '0x' + crypto.createHash('sha256')
    .update(`${action}-${agentId}-${Date.now()}`)
    .digest('hex');
}

function calculateReputationScore(agent) {
  const baseScore = 100;
  const successBonus = (agent.success_rate || 100) * 5;
  const activityBonus = Math.min(200, (agent.total_requests || 0) * 2);
  const performanceBonus = (agent.performance_score || 100) * 2;
  
  return Math.min(1000, Math.round(
    baseScore + successBonus + activityBonus + performanceBonus
  ));
}