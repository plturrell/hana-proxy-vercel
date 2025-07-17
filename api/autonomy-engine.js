// API endpoint for managing the Agent Autonomy Engine
const { createAutonomyEngine, getAutonomyEngine } = require('../src/a2a/autonomy/agent-engine.ts');

let autonomyEngine = null;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'start':
        return await startEngine(req, res);
      
      case 'stop':
        return await stopEngine(req, res);
      
      case 'status':
        return await getStatus(req, res);
      
      case 'send_message':
        return await sendMessage(req, res);
      
      case 'create_proposal':
        return await createProposal(req, res);
      
      case 'agent_stats':
        return await getAgentStats(req, res);
      
      default:
        return res.status(400).json({ 
          error: 'Invalid action',
          available_actions: ['start', 'stop', 'status', 'send_message', 'create_proposal', 'agent_stats']
        });
    }
  } catch (error) {
    console.error('Autonomy Engine API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Start the autonomy engine
 */
async function startEngine(req, res) {
  if (autonomyEngine) {
    return res.json({ 
      status: 'already_running',
      message: 'Autonomy engine is already active'
    });
  }

  const config = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_KEY,
    openaiKey: process.env.OPENAI_API_KEY
  };

  // Validate required environment variables
  if (!config.supabaseUrl || !config.supabaseKey || !config.openaiKey) {
    return res.status(400).json({
      error: 'Missing required environment variables',
      required: ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'OPENAI_API_KEY']
    });
  }

  try {
    autonomyEngine = createAutonomyEngine(config);
    
    // Start the engine
    await autonomyEngine.start();
    
    // Set up event listeners for monitoring
    autonomyEngine.on('message_sent', (data) => {
      console.log(`📤 Agent message sent: ${data.message_id}`);
    });
    
    autonomyEngine.on('vote_cast', (data) => {
      console.log(`🗳️ Agent vote cast: ${data.agentId} → ${data.vote}`);
    });
    
    autonomyEngine.on('consensus_deadline_approaching', (round) => {
      console.log(`⏰ Consensus deadline approaching: ${round.round_id}`);
    });

    return res.json({
      status: 'started',
      message: 'Agent Autonomy Engine started successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to start autonomy engine:', error);
    autonomyEngine = null;
    
    return res.status(500).json({
      error: 'Failed to start autonomy engine',
      message: error.message
    });
  }
}

/**
 * Stop the autonomy engine
 */
async function stopEngine(req, res) {
  if (!autonomyEngine) {
    return res.json({
      status: 'not_running',
      message: 'Autonomy engine is not active'
    });
  }

  try {
    // Stop the engine (remove listeners, cleanup)
    autonomyEngine.removeAllListeners();
    autonomyEngine = null;
    
    return res.json({
      status: 'stopped',
      message: 'Agent Autonomy Engine stopped successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to stop autonomy engine',
      message: error.message
    });
  }
}

/**
 * Get engine status
 */
async function getStatus(req, res) {
  const isRunning = autonomyEngine !== null;
  
  let agentCount = 0;
  let activeAgentCount = 0;
  
  if (isRunning) {
    try {
      // Get agent counts from the engine
      agentCount = autonomyEngine.activeAgents?.size || 0;
      
      // Get active agent count from database
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
      
      const { data: agents } = await supabase
        .from('a2a_agents')
        .select('agent_id')
        .eq('status', 'active');
      
      activeAgentCount = agents?.length || 0;
      
    } catch (error) {
      console.error('Error getting status:', error);
    }
  }

  return res.json({
    status: isRunning ? 'running' : 'stopped',
    engine_active: isRunning,
    active_agents: agentCount,
    total_agents: activeAgentCount,
    last_check: new Date().toISOString()
  });
}

/**
 * Send message through autonomy engine
 */
async function sendMessage(req, res) {
  if (!autonomyEngine) {
    return res.status(400).json({
      error: 'Autonomy engine not running',
      message: 'Start the engine first'
    });
  }

  const { sender_id, recipient_ids, content, message_type = 'communication' } = req.body;

  if (!sender_id || !recipient_ids || !content) {
    return res.status(400).json({
      error: 'Missing required parameters',
      required: ['sender_id', 'recipient_ids', 'content']
    });
  }

  try {
    const message = await autonomyEngine.sendAgentMessage(
      sender_id,
      Array.isArray(recipient_ids) ? recipient_ids : [recipient_ids],
      content,
      message_type
    );

    return res.json({
      status: 'sent',
      message_id: message.message_id,
      message: message
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to send message',
      message: error.message
    });
  }
}

/**
 * Create consensus proposal through autonomy engine
 */
async function createProposal(req, res) {
  if (!autonomyEngine) {
    return res.status(400).json({
      error: 'Autonomy engine not running',
      message: 'Start the engine first'
    });
  }

  const { 
    proposer_id, 
    title, 
    description, 
    proposal_type,
    proposal_data = {},
    voting_deadline 
  } = req.body;

  if (!proposer_id || !title || !description) {
    return res.status(400).json({
      error: 'Missing required parameters',
      required: ['proposer_id', 'title', 'description']
    });
  }

  try {
    // Create proposal in database
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const proposalId = `proposal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const deadline = voting_deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: proposal, error } = await supabase
      .from('a2a_proposals')
      .insert({
        proposal_id: proposalId,
        proposer_id: proposer_id,
        title: title,
        description: description,
        proposal_type: proposal_type || 'general',
        proposal_data: proposal_data,
        status: 'voting',
        voting_deadline: deadline
      })
      .select()
      .single();

    if (error) throw error;

    // Start consensus round
    const { data: round } = await supabase
      .rpc('start_consensus_round', {
        p_proposal_id: proposalId,
        p_deadline_hours: 24
      });

    return res.json({
      status: 'created',
      proposal_id: proposalId,
      proposal: proposal,
      consensus_round: round
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to create proposal',
      message: error.message
    });
  }
}

/**
 * Get agent statistics
 */
async function getAgentStats(req, res) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Get agent statistics
    const { data: agents } = await supabase
      .from('a2a_agents')
      .select('*')
      .order('last_active', { ascending: false });

    // Get recent messages
    const { data: messages } = await supabase
      .from('a2a_messages')
      .select('sender_id, message_type, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    // Get recent votes
    const { data: votes } = await supabase
      .from('a2a_votes')
      .select('agent_id, vote, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    // Calculate statistics
    const stats = {
      total_agents: agents?.length || 0,
      active_agents: agents?.filter(a => a.status === 'active').length || 0,
      recent_messages: messages?.length || 0,
      recent_votes: votes?.length || 0,
      engine_status: autonomyEngine ? 'running' : 'stopped',
      agent_activity: agents?.map(agent => ({
        agent_id: agent.agent_id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        last_active: agent.last_active,
        messages_sent: messages?.filter(m => m.sender_id === agent.agent_id).length || 0,
        votes_cast: votes?.filter(v => v.agent_id === agent.agent_id).length || 0
      })) || []
    };

    return res.json(stats);

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to get agent stats',
      message: error.message
    });
  }
}
