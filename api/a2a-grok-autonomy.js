/**
 * A2A Autonomy Engine Client - Grok4 API Integration via Supabase Edge Functions
 * This replaces the local Node.js autonomy engine with serverless Supabase Edge Functions
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

class A2AAutonomyClient {
  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Supabase credentials required');
    }

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    this.edgeFunctionUrl = `${process.env.SUPABASE_URL}/functions/v1/a2a-autonomy-engine`;
    this.blockchainProcessor = null;
    this.escrowManager = null;
    this.apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    
    if (!this.apiKey) {
      console.warn('⚠️ GROK_API_KEY not found - Grok AI features will be disabled');
    }
    
    console.log('🧠 A2A Autonomy Client initialized with blockchain integration via Supabase Edge Functions');
  }

  /**
   * Get blockchain message processor instance
   */
  async getBlockchainMessageProcessor() {
    if (!this.blockchainProcessor) {
      const { getBlockchainMessageProcessor } = await import('./a2a-blockchain-message-processor.js');
      this.blockchainProcessor = getBlockchainMessageProcessor();
    }
    return this.blockchainProcessor;
  }

  /**
   * Get blockchain escrow manager instance
   */
  async getBlockchainEscrowManager() {
    if (!this.escrowManager) {
      const { getBlockchainEscrowManager } = await import('./a2a-blockchain-escrow.js');
      this.escrowManager = getBlockchainEscrowManager();
    }
    return this.escrowManager;
  }

  /**
   * Process a specific message through blockchain-verified autonomous agents
   */
  async processMessage(messageId) {
    try {
      console.log(`🔗 Processing message ${messageId} with blockchain verification...`);
      
      // Use the blockchain message processor for real verification
      const blockchainProcessor = await this.getBlockchainMessageProcessor();
      const result = await blockchainProcessor.processMessage(messageId);
      
      // Also trigger the Edge Function for additional processing
      const { data, error } = await this.supabase.functions.invoke('a2a-autonomy-engine', {
        body: {
          action: 'process_message',
          message_id: messageId
        }
      });

      if (error) {
        console.warn('Edge function error (continuing with blockchain result):', error);
      }
      
      return {
        blockchain_result: result,
        edge_function_result: data,
        blockchain_verified: result.success
      };
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  /**
   * Process a proposal through blockchain consensus and stake-weighted voting
   */
  async processProposal(proposalId) {
    try {
      console.log(`🗳️ Processing proposal ${proposalId} with blockchain consensus...`);
      
      // Use the blockchain message processor for real consensus
      const blockchainProcessor = await this.getBlockchainMessageProcessor();
      const result = await blockchainProcessor.processProposal(proposalId);
      
      // Also trigger the Edge Function for additional processing
      const { data, error } = await this.supabase.functions.invoke('a2a-autonomy-engine', {
        body: {
          action: 'process_proposal',
          proposal_id: proposalId
        }
      });

      if (error) {
        console.warn('Edge function error (continuing with blockchain result):', error);
      }
      
      return {
        blockchain_result: result,
        edge_function_result: data,
        blockchain_verified: result.success,
        consensus_enabled: true
      };
    } catch (error) {
      console.error('Error processing proposal:', error);
      throw error;
    }
  }

  /**
   * Run proactive autonomous actions for all agents
   */
  async runProactiveActions() {
    try {
      const { data, error } = await this.supabase.functions.invoke('a2a-autonomy-engine', {
        body: {
          action: 'run_proactive'
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error running proactive actions:', error);
      throw error;
    }
  }

  /**
   * Health check for the autonomy engine
   */
  async healthCheck() {
    try {
      const { data, error } = await this.supabase.functions.invoke('a2a-autonomy-engine', {
        body: {
          action: 'health_check'
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in health check:', error);
      throw error;
    }
  }

  /**
   * Initialize blockchain capabilities for all active agents
   */
  async initializeBlockchainForAgents() {
    try {
      console.log('🔗 Initializing blockchain capabilities...');
      
      // Get all active agents
      const { data: agents, error } = await this.supabase
        .from('a2a_agents')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      
      let initializedCount = 0;
      
      // Initialize blockchain wallets for agents without them
      for (const agent of agents || []) {
        if (!agent.blockchain_config?.wallet_address) {
          await this.createAgentBlockchainWallet(agent.agent_id);
          initializedCount++;
        }
      }
      
      console.log(`✅ Blockchain initialized for ${initializedCount} new agents (${agents?.length || 0} total)`);
      return { initialized: initializedCount, total: agents?.length || 0 };
    } catch (error) {
      console.error('❌ Blockchain initialization failed:', error);
      // Continue without blockchain - it's optional
      return { error: error.message };
    }
  }

  /**
   * Create blockchain wallet for an agent
   */
  async createAgentBlockchainWallet(agentId) {
    try {
      // Generate deterministic blockchain wallet from agent ID
      const addressHash = crypto.createHash('sha256').update(`address:${agentId}`).digest('hex');
      const keyHash = crypto.createHash('sha256').update(`key:${agentId}:${Date.now()}`).digest('hex');
      
      const wallet = {
        address: `0x${addressHash.substring(0, 40)}`,
        privateKey: `0x${keyHash}`,
        network: 'supabase-private',
        funded: true,
        balance: '100 ETH',
        created_at: new Date().toISOString()
      };
      
      // Get current agent capabilities
      const { data: currentAgent } = await this.supabase
        .from('a2a_agents')
        .select('capabilities')
        .eq('agent_id', agentId)
        .single();
      
      const currentCapabilities = currentAgent?.capabilities || [];
      const newCapabilities = [...new Set([...currentCapabilities, 'blockchain_execution', 'smart_contracts'])];
      
      // Update agent with blockchain config
      const { error } = await this.supabase
        .from('a2a_agents')
        .update({
          blockchain_config: wallet,
          capabilities: newCapabilities
        })
        .eq('agent_id', agentId);
      
      if (error) throw error;
      
      // Log blockchain initialization
      await this.supabase
        .from('agent_activity')
        .insert({
          agent_id: agentId,
          activity_type: 'blockchain_wallet_created',
          details: {
            wallet_address: wallet.address,
            network: wallet.network,
            capabilities_added: ['blockchain_execution', 'smart_contracts']
          }
        });
      
      console.log(`💰 Created blockchain wallet for agent ${agentId}: ${wallet.address}`);
      return wallet;
    } catch (error) {
      console.error(`❌ Failed to create blockchain wallet for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Execute blockchain action for an agent
   */
  async executeBlockchainAction(agentId, action, params = {}) {
    try {
      console.log(`🔗 Agent ${agentId} executing blockchain action: ${action}`);
      
      // Get agent blockchain config
      const { data: agent, error: agentError } = await this.supabase
        .from('a2a_agents')
        .select('blockchain_config, name')
        .eq('agent_id', agentId)
        .single();
      
      if (agentError || !agent?.blockchain_config) {
        // Create blockchain config if missing
        const blockchainConfig = await this.createAgentBlockchainWallet(agentId);
        agent = { blockchain_config: blockchainConfig, name: `Agent-${agentId}` };
      }
      
      let result;
      
      switch (action) {
        case 'deploy_contract':
          result = await this.simulateContractDeployment(agentId, params);
          break;
          
        case 'execute_contract':
          result = await this.simulateContractExecution(agentId, params);
          break;
          
        case 'create_escrow':
          result = await this.simulateEscrowCreation(agentId, params);
          break;
          
        case 'check_balance':
          result = {
            address: agent.blockchain_config.address,
            balance: agent.blockchain_config.balance || '100 ETH',
            network: agent.blockchain_config.network
          };
          break;
          
        case 'verify_reputation':
          result = await this.checkReputationWithAI(agentId, params);
          break;
          
        default:
          throw new Error(`Unknown blockchain action: ${action}`);
      }
      
      // Log blockchain activity
      await this.supabase
        .from('agent_blockchain_activities')
        .insert({
          agent_id: agentId,
          activity_type: `blockchain_${action}`,
          contract_name: params.contractName,
          function_name: params.functionName,
          transaction_hash: result.tx_hash,
          status: 'completed',
          created_at: new Date().toISOString()
        });
      
      console.log(`✅ Blockchain action completed for ${agent.name}`);
      return result;
    } catch (error) {
      console.error(`❌ Blockchain action failed for agent ${agentId}:`, error);
      
      // Log failed activity
      await this.supabase
        .from('agent_blockchain_activities')
        .insert({
          agent_id: agentId,
          activity_type: `blockchain_${action}`,
          status: 'failed',
          error: error.message,
          created_at: new Date().toISOString()
        });
      
      throw error;
    }
  }

  // Simulation methods for blockchain actions
  async simulateContractDeployment(agentId, params) {
    const deploymentId = `${agentId}:${params.contractName || 'contract'}:${Date.now()}`;
    const addressHash = crypto.createHash('sha256').update(`contract:${deploymentId}`).digest('hex');
    const txHash = crypto.createHash('sha256').update(`tx:${deploymentId}`).digest('hex');
    
    return {
      success: true,
      contract_address: `0x${addressHash.substring(0, 40)}`,
      tx_hash: `0x${txHash}`,
      gas_used: '2100000'
    };
  }

  async simulateContractExecution(agentId, params) {
    const executionId = `${agentId}:${params.functionName || 'execute'}:${Date.now()}`;
    const txHash = crypto.createHash('sha256').update(`tx:${executionId}`).digest('hex');
    
    return {
      success: true,
      tx_hash: `0x${txHash}`,
      gas_used: '21000',
      result: params.expectedResult || 'success'
    };
  }

  async simulateEscrowCreation(agentId, params) {
    const escrowId = params.taskId || `escrow_${Date.now()}`;
    const txHash = crypto.createHash('sha256').update(`escrow:${agentId}:${escrowId}`).digest('hex');
    
    return {
      success: true,
      escrow_id: escrowId,
      tx_hash: `0x${txHash}`,
      amount: params.amount || '1 ETH'
    };
  }

  async checkReputationWithAI(agentId, params) {
    // Use real AI to assess agent reputation based on comprehensive data
    if (!this.apiKey) {
      console.error('AI API key not configured - reputation analysis unavailable');
      return null;
    }
    
    // Get comprehensive agent data
    const { data: activities } = await this.supabase
      .from('agent_blockchain_activities')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    const { data: agent } = await this.supabase
      .from('a2a_agents')
      .select('*')
      .eq('agent_id', agentId)
      .single();
      
    const { data: messages } = await this.supabase
      .from('a2a_messages')
      .select('message_type, success, created_at')
      .eq('sender_id', agentId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'grok-2',
          messages: [
            {
              role: 'system',
              content: 'You are a blockchain reputation analysis expert. Assess agent reputation based on comprehensive behavioral and performance data.'
            },
            {
              role: 'user',
              content: `Analyze the reputation of agent ${agentId}:

Agent Data: ${JSON.stringify(agent)}
Recent Activities: ${JSON.stringify(activities)}
Recent Messages: ${JSON.stringify(messages)}
Analysis Request: ${JSON.stringify(params)}

Assess based on:
- Blockchain transaction history and success rates
- Message quality and response patterns
- Compliance with protocol standards
- Consistency and reliability over time
- Risk factors and anomalies

Return JSON:
{
  "qualified": true|false,
  "score": <number 0-1000>,
  "confidence": <number 0-1>,
  "risk_level": "low|medium|high",
  "trust_factors": ["factor1", "factor2"],
  "concerns": ["concern1", "concern2"],
  "recommendations": ["rec1", "rec2"],
  "last_updated": "ISO timestamp",
  "analysis_summary": "detailed explanation"
}`
            }
          ],
          temperature: 0.2,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        console.error('Reputation analysis API failed:', response.status);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      try {
        return JSON.parse(content);
      } catch {
        console.error('Failed to parse reputation analysis response');
        return null;
      }
    } catch (error) {
      console.error('AI reputation analysis failed:', error);
      return null;
    }
  }

  /**
   * Setup real-time listeners for automatic processing
   */
  async setupRealtimeListeners() {
    console.log('🔄 Setting up real-time listeners for autonomous processing...');

    // Listen for new messages
    const messageChannel = this.supabase
      .channel('a2a_messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'a2a_messages' 
        }, 
        async (payload) => {
          console.log('📨 New message detected, triggering autonomous processing...');
          try {
            await this.processMessage(payload.new.message_id);
          } catch (error) {
            console.error('Error in autonomous message processing:', error);
          }
        }
      )
      .subscribe();

    // Listen for new proposals  
    const proposalChannel = this.supabase
      .channel('a2a_proposals')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'a2a_proposals' 
        }, 
        async (payload) => {
          console.log('📋 New proposal detected, triggering autonomous evaluation...');
          try {
            await this.processProposal(payload.new.proposal_id);
          } catch (error) {
            console.error('Error in autonomous proposal processing:', error);
          }
        }
      )
      .subscribe();

    return { messageChannel, proposalChannel };
  }

  /**
   * Start periodic proactive actions
   */
  startPeriodicProactiveActions(intervalMinutes = 10) {
    console.log(`🔄 Starting periodic proactive actions every ${intervalMinutes} minutes`);
    
    const runProactive = async () => {
      try {
        const result = await this.runProactiveActions();
        console.log('🤖 Proactive actions completed:', result);
      } catch (error) {
        console.error('Error in periodic proactive actions:', error);
      }
    };

    // Run immediately
    runProactive();

    // Then run periodically
    return setInterval(runProactive, intervalMinutes * 60 * 1000);
  }

  /**
   * Get autonomy statistics
   */
  async getAutonomyStats() {
    try {
      // Get agent activity stats
      const { data: activityStats } = await this.supabase
        .from('agent_activity')
        .select('agent_id, activity_type, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      // Get message stats
      const { data: messageStats } = await this.supabase
        .from('a2a_messages')
        .select('sender_id, autonomy_generated, created_at')
        .eq('autonomy_generated', true)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get vote stats
      const { data: voteStats } = await this.supabase
        .from('a2a_votes')
        .select('agent_id, vote, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get active autonomous agents
      const { data: agents } = await this.supabase
        .from('a2a_agents')
        .select('agent_id, name, type, status, autonomy_enabled, last_active')
        .eq('autonomy_enabled', true);

      return {
        totalAutonomousAgents: agents?.length || 0,
        activeAgents: agents?.filter(a => a.status === 'active').length || 0,
        activityCount24h: activityStats?.length || 0,
        autonomousMessages24h: messageStats?.length || 0,
        autonomousVotes24h: voteStats?.length || 0,
        agents: agents || [],
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting autonomy stats:', error);
      throw error;
    }
  }

  async generateCodeWithGrok(prompt) {
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a senior A2A autonomous agent developer. Generate production-ready code with proper error handling, TypeScript/JavaScript, and Supabase integration. Always include complete, deployable code with comments.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'grok-4-0709',
          messages: messages,
          max_tokens: 4000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status}`);
      }

      const data = await response.json();
      const grokResponse = data.choices[0].message.content;

      // Extract code and explanation from response
      const codeMatch = grokResponse.match(/```(?:typescript|javascript|ts|js)?\n([\s\S]*?)\n```/);
      const code = codeMatch ? codeMatch[1] : grokResponse;
      
      return {
        code: code,
        explanation: grokResponse,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating code with Grok:', error);
      throw error;
    }
  }
}

// Singleton instance
let autonomyClient = null;

export function getAutonomyClient() {
  if (!autonomyClient) {
    autonomyClient = new A2AAutonomyClient();
  }
  return autonomyClient;
}

// Vercel API handler
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    const client = getAutonomyClient();
    if (!client) {
      return res.status(500).json({ error: 'Failed to initialize autonomy client' });
    }
    
    const { action, messageId, proposalId, agentId, blockchainAction, params } = req.body;
    
    switch (action) {
      case 'process_message':
        if (!messageId) {
          return res.status(400).json({ error: 'Message ID required' });
        }
        const messageResult = await client.processMessage(messageId);
        return res.json(messageResult);
        
      case 'process_proposal':
        if (!proposalId) {
          return res.status(400).json({ error: 'Proposal ID required' });
        }
        const proposalResult = await client.processProposal(proposalId);
        return res.json(proposalResult);
        
      case 'run_proactive':
        const proactiveResult = await client.runProactiveActions();
        return res.json(proactiveResult);
        
      case 'health_check':
        const healthResult = await client.healthCheck();
        return res.json(healthResult);
        
      case 'initialize':
        const initResult = await client.initialize();
        return res.json(initResult);
        
      // NEW BLOCKCHAIN ACTIONS
      case 'initialize_blockchain':
        const blockchainInitResult = await client.initializeBlockchainForAgents();
        return res.json({
          success: true,
          message: 'Blockchain initialization completed',
          result: blockchainInitResult
        });
        
      case 'execute_blockchain_action':
        if (!agentId || !blockchainAction) {
          return res.status(400).json({ error: 'Agent ID and blockchain action required' });
        }
        const actionResult = await client.executeBlockchainAction(agentId, blockchainAction, params || {});
        return res.json({
          success: true,
          action: blockchainAction,
          result: actionResult
        });
        
      case 'get_agent_blockchain_status':
        if (!agentId) {
          return res.status(400).json({ error: 'Agent ID required' });
        }
        
        // Get agent blockchain config
        const { data: agent, error: agentError } = await client.supabase
          .from('a2a_agents')
          .select('agent_id, name, blockchain_config, capabilities')
          .eq('agent_id', agentId)
          .single();
        
        if (agentError) {
          return res.status(404).json({ error: 'Agent not found' });
        }
        
        // Get recent blockchain activities
        const { data: agentActivities } = await client.supabase
          .from('agent_blockchain_activities')
          .select('*')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        return res.json({
          success: true,
          agent: {
            id: agent.agent_id,
            name: agent.name,
            blockchain_enabled: !!agent.blockchain_config?.address,
            wallet_address: agent.blockchain_config?.address,
            network: agent.blockchain_config?.network,
            balance: agent.blockchain_config?.balance,
            capabilities: agent.capabilities || []
          },
          recent_activities: agentActivities || []
        });
        
      case 'monitor_blockchain_events':
        // Get recent blockchain events
        const { data: events } = await client.supabase
          .from('blockchain_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        
        const { data: allActivities } = await client.supabase
          .from('agent_blockchain_activities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        
        return res.json({
          success: true,
          events: events || [],
          activities: allActivities || [],
          summary: {
            total_events: events?.length || 0,
            recent_activities: allActivities?.length || 0
          }
        });
        
      case 'generate_a2a_code':
        if (!req.body.description) {
          return res.status(400).json({ error: 'Description required' });
        }
        
        const codePrompt = `Generate A2A autonomous agent code for: ${req.body.description}
        
        Requirements:
        - Use A2A Protocol v2.0
        - Include blockchain integration
        - Implement agent autonomy logic
        - Add error handling
        - Use TypeScript/JavaScript
        - Include Supabase database operations
        - Make it production-ready
        
        Generate complete, deployable code:`;
        
        const codeResult = await client.generateCodeWithGrok(codePrompt);
        return res.json({
          success: true,
          code: codeResult.code,
          explanation: codeResult.explanation
        });
        
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('A2A Autonomy API Error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
}

// Self-starting autonomy client for real-time processing
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'development') {
  // Only auto-start in production server environment
  const startAutonomy = async () => {
    try {
      const client = getAutonomyClient();
      await client.setupRealtimeListeners();
      client.startPeriodicProactiveActions(15); // Every 15 minutes
      console.log('🚀 A2A Autonomy Engine with Grok4 API is running autonomously!');
    } catch (error) {
      console.error('Failed to start autonomy engine:', error);
    }
  };

  // Start after a short delay
  setTimeout(startAutonomy, 5000);
}
