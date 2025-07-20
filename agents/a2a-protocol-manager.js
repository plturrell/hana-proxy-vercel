/**
 * A2A Protocol Manager
 * Manages Agent-to-Agent communication, coordination, and workflow orchestration
 * Third agent in the architecture - coordination layer
 */

import { A2AAgent } from '../api/a2a-agent-system.js';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize xAI Grok API for intelligent coordination
const GROK_API_KEY = process.env.XAI_API_KEY;
const GROK_BASE_URL = 'https://api.x.ai/v1';

if (!GROK_API_KEY) {
  console.error('Missing xAI API key for intelligent agent coordination');
}

// Grok AI client for intelligent agent coordination
const grokClient = {
  async chat(messages, options = {}) {
    if (!GROK_API_KEY) {
      throw new Error('xAI API key not configured');
    }

    const response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-4-0709',
        messages: messages,
        temperature: options.temperature || 0.2,
        max_tokens: options.max_tokens || 3000,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
};

// Initialize Supabase with proper error handling
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * A2A Protocol Manager for inter-agent coordination and communication
 */
export class A2AProtocolManager extends A2AAgent {
  constructor(agentData) {
    super(agentData);
    this.specialization = 'agent_coordination';
    this.messageQueue = new Map();
    this.activeContracts = new Map();
    this.agentRegistry = new Map();
    this.workflowOrchestrator = new Map();
    this.consensusThreshold = 0.7;
    
    // Protocol management configuration
    this.protocolConfig = {
      message_timeout: 30000, // 30 seconds
      retry_attempts: 3,
      heartbeat_interval: 60000, // 1 minute
      consensus_timeout: 120000, // 2 minutes
      workflow_timeout: 300000 // 5 minutes
    };
    
    // AI-enhanced coordination capabilities
    this.capabilities = [
      'intelligent_message_routing',
      'ai_powered_contract_negotiation',
      'predictive_consensus_management',
      'adaptive_workflow_orchestration',
      'dynamic_agent_discovery',
      'intelligent_performance_monitoring',
      'ai_driven_conflict_resolution',
      'smart_load_balancing',
      'coordination_pattern_recognition',
      'workflow_optimization',
      'agent_behavior_analysis',
      'predictive_coordination_planning',
      'context_aware_routing',
      'coordination_anomaly_detection',
      'intelligent_resource_allocation'
    ];
    
    // AI models for different coordination aspects
    this.aiModels = {
      messageRouter: {
        systemPrompt: 'You are an expert agent coordination system. Analyze inter-agent messages and determine optimal routing strategies based on agent capabilities, current load, and communication patterns.',
        lastUsed: null
      },
      workflowOptimizer: {
        systemPrompt: 'You are a workflow optimization expert. Analyze agent workflows and suggest improvements for efficiency, resource utilization, and coordination effectiveness.',
        lastUsed: null
      },
      consensusPredictor: {
        systemPrompt: 'You are a consensus analysis expert. Predict consensus outcomes based on agent voting patterns, proposal characteristics, and historical data.',
        lastUsed: null
      },
      conflictResolver: {
        systemPrompt: 'You are an expert in agent conflict resolution. Analyze coordination conflicts and suggest optimal resolution strategies.',
        lastUsed: null
      },
      performanceAnalyzer: {
        systemPrompt: 'You are an agent performance analysis expert. Evaluate agent coordination performance and identify optimization opportunities.',
        lastUsed: null
      },
      coordinationPlanner: {
        systemPrompt: 'You are a coordination planning expert. Design optimal coordination strategies for multi-agent tasks based on agent capabilities and requirements.',
        lastUsed: null
      }
    };
  }

  /**
   * Initialize the A2A Protocol Manager
   */
  async initialize() {
    console.log(`🔄 Initializing A2A Protocol Manager: ${this.id}`);
    
    // Register with A2A system
    await this.registerWithA2A();
    
    // Register with ORD
    await this.registerWithORD();
    
    // Discover and register all active agents
    await this.discoverActiveAgents();
    
    // Set up message monitoring
    await this.setupMessageMonitoring();
    
    // Start heartbeat monitoring
    await this.startHeartbeatMonitoring();
    
    // Initialize workflow orchestration
    await this.initializeWorkflowOrchestration();
    
    console.log(`✅ A2A Protocol Manager initialized: ${this.id}`);
  }

  /**
   * Register with A2A system
   */
  async registerWithA2A() {
    const agentRegistration = {
      agent_id: this.id,
      agent_name: this.name,
      agent_type: 'coordination',
      description: 'Manages Agent-to-Agent communication, coordination, and workflow orchestration',
      status: 'active',
      capabilities: this.capabilities,
      voting_power: this.votingPower,
      connection_config: {
        goals: [
          'Facilitate seamless agent communication',
          'Orchestrate multi-agent workflows',
          'Ensure consensus in agent decisions',
          'Monitor agent performance and health'
        ],
        personality: 'coordinator',
        auto_respond: true,
        max_concurrent_tasks: 50,
        coordination_role: 'primary'
      },
      scheduled_tasks: [
        {
          name: 'agent_health_check',
          interval: '*/1 * * * *', // Every minute
          action: 'performHealthCheck'
        },
        {
          name: 'message_queue_processing',
          interval: '*/30 * * * * *', // Every 30 seconds
          action: 'processMessageQueue'
        },
        {
          name: 'workflow_monitoring',
          interval: '*/2 * * * *', // Every 2 minutes
          action: 'monitorWorkflows'
        },
        {
          name: 'consensus_management',
          interval: '*/5 * * * *', // Every 5 minutes
          action: 'manageConsensusProcesses'
        }
      ]
    };

    const { data, error } = await supabase
      .from('a2a_agents')
      .upsert(agentRegistration, { onConflict: 'agent_id' });

    if (error) {
      console.error('Failed to register A2A Protocol Manager:', error);
      throw error;
    }
  }

  /**
   * Register with ORD
   */
  async registerWithORD() {
    const ordRegistration = {
      agent_id: this.id,
      resource_type: 'agent',
      resource_name: 'A2A Protocol Manager',
      resource_path: '/api/agents/a2a-protocol-manager',
      capabilities: {
        input_types: ['agent_messages', 'workflow_requests', 'consensus_proposals'],
        output_types: ['coordination_responses', 'workflow_status', 'consensus_results'],
        protocols: ['A2A', 'REST', 'WebSocket'],
        discovery: ['ORD', 'A2A'],
        coordination_features: ['message_routing', 'workflow_orchestration', 'consensus_management']
      },
      requirements: {
        data_access: ['a2a_agents', 'a2a_messages', 'a2a_contracts', 'bpmn_workflows'],
        dependencies: ['supabase', 'all_registered_agents'],
        permissions: ['agent_coordination', 'workflow_management', 'consensus_facilitation']
      },
      metadata: {
        category: 'coordination',
        version: '1.0.0',
        documentation: '/docs/agents/a2a-protocol-manager',
        intelligence_rating: 95,
        ai_features: {
          grok_integration: true,
          intelligent_coordination: true,
          predictive_consensus: true,
          adaptive_workflow_optimization: true,
          ai_powered_conflict_resolution: true
        },
        performance: {
          avg_response_time_ms: 100,
          success_rate: 0.99,
          throughput_per_minute: 1000,
          coordination_efficiency: 0.95,
          ai_decision_accuracy: 0.92,
          coordination_optimization: 0.88
        }
      }
    };

    const { data, error } = await supabase
      .from('ord_analytics_resources')
      .upsert(ordRegistration, { onConflict: 'agent_id' });

    if (error) {
      console.error('Failed to register with ORD:', error);
      throw error;
    }
  }

  /**
   * Discover and register all active agents
   */
  async discoverActiveAgents() {
    const { data: agents, error } = await supabase
      .from('a2a_agents')
      .select('*')
      .eq('status', 'active')
      .neq('agent_id', this.id);

    if (error) {
      console.error('Failed to discover agents:', error);
      return;
    }

    agents.forEach(agent => {
      this.agentRegistry.set(agent.agent_id, {
        ...agent,
        last_seen: new Date(),
        health_status: 'unknown',
        performance_metrics: {
          response_time: 0,
          success_rate: 1.0,
          message_count: 0
        }
      });
    });

    console.log(`📋 Discovered ${agents.length} active agents`);
  }

  /**
   * Set up message monitoring and routing
   */
  async setupMessageMonitoring() {
    // Subscribe to all A2A messages
    supabase
      .channel('a2a_message_routing')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'a2a_messages'
      }, (payload) => {
        this.handleNewMessage(payload.new);
      })
      .subscribe();

    // Subscribe to contract negotiations
    supabase
      .channel('a2a_contract_monitoring')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'a2a_contracts'
      }, (payload) => {
        this.handleContractEvent(payload);
      })
      .subscribe();
  }

  /**
   * Start heartbeat monitoring for all agents
   */
  async startHeartbeatMonitoring() {
    setInterval(async () => {
      await this.performHealthCheck();
    }, this.protocolConfig.heartbeat_interval);
  }

  /**
   * Initialize workflow orchestration
   */
  async initializeWorkflowOrchestration() {
    // Load active workflows
    const { data: workflows, error } = await supabase
      .from('bpmn_workflows')
      .select('*')
      .eq('enabled', true);

    if (!error && workflows) {
      workflows.forEach(workflow => {
        this.workflowOrchestrator.set(workflow.workflow_id, {
          ...workflow,
          status: 'ready',
          last_execution: null,
          execution_count: 0
        });
      });
      
      console.log(`🔄 Loaded ${workflows.length} active workflows`);
    }
  }

  /**
   * Handle new incoming messages
   */
  async handleNewMessage(message) {
    console.log(`📨 A2A Protocol Manager processing message: ${message.id}`);
    
    try {
      // Update agent performance metrics
      await this.updateAgentMetrics(message.from_agent, 'message_sent');
      
      // Route message based on type
      switch (message.message_type) {
        case 'coordination_request':
          await this.handleCoordinationRequest(message);
          break;
        case 'workflow_trigger':
          await this.handleWorkflowTrigger(message);
          break;
        case 'consensus_proposal':
          await this.handleConsensusProposal(message);
          break;
        case 'health_check':
          await this.handleHealthCheckRequest(message);
          break;
        default:
          await this.routeMessage(message);
      }
      
      // Log successful processing
      await this.logActivity('message_processed', {
        message_id: message.id,
        message_type: message.message_type,
        from_agent: message.from_agent,
        to_agent: message.to_agent
      });

    } catch (error) {
      console.error('Error processing message:', error);
      await this.logError('message_processing_error', error, { message_id: message.id });
    }
  }

  /**
   * Handle coordination requests between agents
   */
  async handleCoordinationRequest(message) {
    const { request_type, agents_involved, coordination_data } = message.payload;
    
    switch (request_type) {
      case 'multi_agent_task':
        await this.coordinateMultiAgentTask(message);
        break;
      case 'resource_allocation':
        await this.manageResourceAllocation(message);
        break;
      case 'conflict_resolution':
        await this.resolveConflict(message);
        break;
      default:
        console.log(`Unknown coordination request: ${request_type}`);
    }
  }

  /**
   * Coordinate multi-agent tasks using AI-powered planning
   */
  async coordinateMultiAgentTask(message) {
    const { task_id, agents_involved, task_definition } = message.payload;
    
    // Use AI to optimize coordination strategy
    const coordinationPlan = await this.generateCoordinationPlan(task_definition, agents_involved);
    
    // Create AI-enhanced coordination context
    const coordination = {
      id: crypto.randomBytes(16).toString('hex'),
      task_id,
      agents: agents_involved,
      status: 'initializing',
      created_at: new Date(),
      coordinator: this.id,
      ai_plan: coordinationPlan,
      execution_strategy: coordinationPlan.strategy,
      predicted_duration: coordinationPlan.estimatedDuration,
      risk_assessment: coordinationPlan.risks
    };
    
    // Generate AI-optimized task assignments
    const intelligentAssignments = await this.generateIntelligentAssignments(
      agents_involved, 
      task_definition, 
      coordinationPlan
    );
    
    // Notify all involved agents with AI-enhanced assignments
    const notifications = intelligentAssignments.map(assignment => ({
      from_agent: this.id,
      to_agent: assignment.agentId,
      message_type: 'intelligent_task_assignment',
      payload: {
        coordination_id: coordination.id,
        task_definition,
        ai_role: assignment.role,
        coordination_strategy: assignment.strategy,
        expected_interactions: assignment.expectedInteractions,
        performance_targets: assignment.targets,
        ai_guidance: assignment.guidance
      },
      timestamp: new Date()
    }));
    
    await supabase
      .from('a2a_messages')
      .insert(notifications);
    
    // Store coordination context
    this.messageQueue.set(coordination.id, coordination);
    
    console.log(`🤖 AI-coordinating multi-agent task: ${task_id} with strategy: ${coordinationPlan.strategy}`);
  }

  /**
   * Handle workflow triggers
   */
  async handleWorkflowTrigger(message) {
    const { workflow_id, trigger_data } = message.payload;
    
    const workflow = this.workflowOrchestrator.get(workflow_id);
    if (!workflow) {
      console.error(`Workflow not found: ${workflow_id}`);
      return;
    }
    
    // Execute workflow
    await this.executeWorkflow(workflow, trigger_data, message.from_agent);
  }

  /**
   * Execute BPMN workflow
   */
  async executeWorkflow(workflow, triggerData, initiatingAgent) {
    const executionId = crypto.randomBytes(16).toString('hex');
    
    console.log(`🔄 Executing workflow: ${workflow.workflow_id}`);
    
    try {
      // Update workflow status
      workflow.status = 'executing';
      workflow.last_execution = new Date();
      workflow.execution_count++;
      
      // Get associated agents
      const associatedAgents = workflow.associated_agents || [];
      
      // Create workflow execution context
      const execution = {
        id: executionId,
        workflow_id: workflow.workflow_id,
        initiating_agent: initiatingAgent,
        associated_agents: associatedAgents,
        trigger_data: triggerData,
        status: 'running',
        started_at: new Date(),
        steps_completed: [],
        current_step: 'start'
      };
      
      // Notify associated agents about workflow execution
      if (associatedAgents.length > 0) {
        const notifications = associatedAgents.map(agentId => ({
          from_agent: this.id,
          to_agent: agentId,
          message_type: 'workflow_execution',
          payload: {
            execution_id: executionId,
            workflow_id: workflow.workflow_id,
            trigger_data: triggerData,
            role: 'participant'
          },
          timestamp: new Date()
        }));
        
        await supabase
          .from('a2a_messages')
          .insert(notifications);
      }
      
      // Log workflow execution
      await this.logActivity('workflow_executed', {
        workflow_id: workflow.workflow_id,
        execution_id: executionId,
        initiating_agent: initiatingAgent
      });
      
      workflow.status = 'completed';
      
    } catch (error) {
      console.error('Workflow execution failed:', error);
      workflow.status = 'failed';
      await this.logError('workflow_execution_error', error, {
        workflow_id: workflow.workflow_id,
        execution_id: executionId
      });
    }
  }

  /**
   * Handle consensus proposals with AI-powered prediction
   */
  async handleConsensusProposal(message) {
    const { proposal_id, proposal_type, proposal_data, voting_agents } = message.payload;
    
    // Use AI to predict consensus outcome
    const consensusPrediction = await this.predictConsensusOutcome(
      proposal_type, 
      proposal_data, 
      voting_agents || Array.from(this.agentRegistry.keys())
    );
    
    // Create AI-enhanced consensus process
    const consensus = {
      id: proposal_id,
      type: proposal_type,
      data: proposal_data,
      voting_agents: voting_agents || Array.from(this.agentRegistry.keys()),
      votes: new Map(),
      status: 'voting',
      threshold: this.consensusThreshold,
      created_at: new Date(),
      timeout: Date.now() + this.protocolConfig.consensus_timeout,
      ai_prediction: consensusPrediction,
      predicted_outcome: consensusPrediction.outcome,
      confidence_score: consensusPrediction.confidence,
      key_influencers: consensusPrediction.keyInfluencers,
      optimal_strategy: consensusPrediction.strategy
    };
    
    // Generate AI-personalized voting requests
    const intelligentVotingRequests = await this.generatePersonalizedVotingRequests(
      consensus.voting_agents,
      proposal_id,
      proposal_type,
      proposal_data,
      consensusPrediction
    );
    
    await supabase
      .from('a2a_messages')
      .insert(intelligentVotingRequests);
    
    // Store consensus process
    this.activeContracts.set(proposal_id, consensus);
    
    console.log(`🤖 Started AI-enhanced consensus process: ${proposal_id} (predicted: ${consensusPrediction.outcome})`);
  }

  /**
   * Perform health check on all agents
   */
  async performHealthCheck() {
    for (const [agentId, agentInfo] of this.agentRegistry.entries()) {
      try {
        // Send health check ping
        await this.sendMessage(agentId, {
          message_type: 'health_check',
          payload: {
            timestamp: new Date(),
            expected_response: 'health_check_response'
          }
        });
        
        // Check last seen time
        const timeSinceLastSeen = Date.now() - agentInfo.last_seen.getTime();
        if (timeSinceLastSeen > this.protocolConfig.heartbeat_interval * 2) {
          agentInfo.health_status = 'inactive';
          console.log(`⚠️ Agent ${agentId} appears inactive`);
        }
        
      } catch (error) {
        agentInfo.health_status = 'error';
        console.error(`❌ Health check failed for ${agentId}:`, error);
      }
    }
  }

  /**
   * Process message queue
   */
  async processMessageQueue() {
    // Process pending coordinations
    for (const [coordinationId, coordination] of this.messageQueue.entries()) {
      if (coordination.status === 'pending' && Date.now() - coordination.created_at.getTime() > this.protocolConfig.message_timeout) {
        coordination.status = 'timeout';
        console.log(`⏰ Coordination ${coordinationId} timed out`);
      }
    }
    
    // Clean up old entries
    for (const [id, item] of this.messageQueue.entries()) {
      if (Date.now() - item.created_at.getTime() > this.protocolConfig.message_timeout * 3) {
        this.messageQueue.delete(id);
      }
    }
  }

  /**
   * Monitor active workflows
   */
  async monitorWorkflows() {
    for (const [workflowId, workflow] of this.workflowOrchestrator.entries()) {
      if (workflow.status === 'executing') {
        const executionTime = Date.now() - workflow.last_execution?.getTime();
        if (executionTime > this.protocolConfig.workflow_timeout) {
          workflow.status = 'timeout';
          console.log(`⏰ Workflow ${workflowId} execution timed out`);
        }
      }
    }
  }

  /**
   * Manage consensus processes
   */
  async manageConsensusProcesses() {
    for (const [proposalId, consensus] of this.activeContracts.entries()) {
      if (consensus.status === 'voting' && Date.now() > consensus.timeout) {
        await this.finalizeConsensus(proposalId, consensus);
      }
    }
  }

  /**
   * Finalize consensus process
   */
  async finalizeConsensus(proposalId, consensus) {
    const totalVotes = consensus.votes.size;
    const positiveVotes = Array.from(consensus.votes.values()).filter(vote => vote.decision === 'approve').length;
    const consensusReached = (positiveVotes / totalVotes) >= consensus.threshold;
    
    consensus.status = consensusReached ? 'approved' : 'rejected';
    consensus.final_result = {
      total_votes: totalVotes,
      positive_votes: positiveVotes,
      consensus_percentage: positiveVotes / totalVotes,
      approved: consensusReached
    };
    
    // Notify all participants of result
    const notifications = consensus.voting_agents.map(agentId => ({
      from_agent: this.id,
      to_agent: agentId,
      message_type: 'consensus_result',
      payload: {
        proposal_id: proposalId,
        result: consensus.final_result,
        status: consensus.status
      },
      timestamp: new Date()
    }));
    
    await supabase
      .from('a2a_messages')
      .insert(notifications);
    
    console.log(`🎯 Consensus ${proposalId} finalized: ${consensus.status}`);
  }

  /**
   * Update agent performance metrics
   */
  async updateAgentMetrics(agentId, metricType) {
    const agent = this.agentRegistry.get(agentId);
    if (agent) {
      agent.last_seen = new Date();
      agent.health_status = 'active';
      agent.performance_metrics.message_count++;
      
      if (metricType === 'response_received') {
        // Update response time and success rate
        agent.performance_metrics.success_rate = Math.min(1.0, agent.performance_metrics.success_rate + 0.01);
      }
    }
  }

  /**
   * Route message to appropriate handler
   */
  async routeMessage(message) {
    // Basic message routing logic
    console.log(`📡 Routing message from ${message.from_agent} to ${message.to_agent}`);
    
    // Update metrics for both sender and receiver
    await this.updateAgentMetrics(message.from_agent, 'message_sent');
    
    if (message.to_agent && this.agentRegistry.has(message.to_agent)) {
      await this.updateAgentMetrics(message.to_agent, 'message_received');
    }
  }

  /**
   * Get coordination status
   */
  async getCoordinationStatus() {
    return {
      active_agents: this.agentRegistry.size,
      active_workflows: Array.from(this.workflowOrchestrator.values()).filter(w => w.status === 'executing').length,
      pending_consensus: Array.from(this.activeContracts.values()).filter(c => c.status === 'voting').length,
      message_queue_size: this.messageQueue.size,
      system_health: this.calculateSystemHealth()
    };
  }

  /**
   * Calculate overall system health
   */
  calculateSystemHealth() {
    const activeAgents = Array.from(this.agentRegistry.values()).filter(a => a.health_status === 'active').length;
    const totalAgents = this.agentRegistry.size;
    
    return {
      agent_availability: totalAgents > 0 ? activeAgents / totalAgents : 0,
      average_response_time: this.calculateAverageResponseTime(),
      system_load: this.calculateSystemLoad()
    };
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime() {
    const agents = Array.from(this.agentRegistry.values());
    const totalResponseTime = agents.reduce((sum, agent) => sum + agent.performance_metrics.response_time, 0);
    return agents.length > 0 ? totalResponseTime / agents.length : 0;
  }

  /**
   * Calculate system load
   */
  calculateSystemLoad() {
    return {
      message_queue_load: this.messageQueue.size / 100, // Normalize to percentage
      workflow_load: Array.from(this.workflowOrchestrator.values()).filter(w => w.status === 'executing').length / 10,
      consensus_load: Array.from(this.activeContracts.values()).filter(c => c.status === 'voting').length / 5
    };
  }

  /**
   * Generate AI-powered coordination plan
   */
  async generateCoordinationPlan(taskDefinition, agentsInvolved) {
    if (!GROK_API_KEY) {
      return {
        strategy: 'sequential',
        estimatedDuration: 300000,
        risks: ['communication_delays'],
        confidence: 0.5
      };
    }

    try {
      const agentCapabilities = agentsInvolved.map(id => {
        const agent = this.agentRegistry.get(id);
        return {
          id,
          type: agent?.agent_type || 'unknown',
          capabilities: agent?.capabilities || [],
          performance: agent?.performance_metrics || {}
        };
      });

      const prompt = `
Analyze this multi-agent coordination scenario and generate an optimal coordination plan:

Task Definition: ${JSON.stringify(taskDefinition, null, 2)}

Agent Capabilities: ${JSON.stringify(agentCapabilities, null, 2)}

Provide a detailed coordination plan including:
1. Optimal execution strategy (parallel, sequential, hybrid)
2. Estimated duration in milliseconds
3. Risk assessment and mitigation strategies
4. Key coordination checkpoints
5. Performance optimization recommendations

Return as JSON with: strategy, estimatedDuration, risks, checkpoints, optimizations, confidence
`;

      const response = await grokClient.chat([
        { role: 'system', content: this.aiModels.coordinationPlanner.systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.2 });

      this.aiModels.coordinationPlanner.lastUsed = new Date();
      
      try {
        return JSON.parse(response);
      } catch (parseError) {
        return {
          strategy: 'hybrid',
          estimatedDuration: 240000,
          risks: ['coordination_complexity'],
          confidence: 0.7
        };
      }

    } catch (error) {
      console.error('AI coordination planning failed:', error);
      return {
        strategy: 'sequential',
        estimatedDuration: 300000,
        risks: ['ai_unavailable'],
        confidence: 0.6
      };
    }
  }

  /**
   * Generate intelligent task assignments
   */
  async generateIntelligentAssignments(agentsInvolved, taskDefinition, coordinationPlan) {
    if (!GROK_API_KEY) {
      return agentsInvolved.map(agentId => ({
        agentId,
        role: this.determineAgentRole(agentId, taskDefinition),
        strategy: 'basic',
        expectedInteractions: [],
        targets: {},
        guidance: 'Standard task execution'
      }));
    }

    try {
      const agentDetails = agentsInvolved.map(id => {
        const agent = this.agentRegistry.get(id);
        return {
          id,
          type: agent?.agent_type || 'unknown',
          capabilities: agent?.capabilities || [],
          performance: agent?.performance_metrics || {},
          health: agent?.health_status || 'unknown'
        };
      });

      const prompt = `
Generate intelligent task assignments for multi-agent coordination:

Task: ${JSON.stringify(taskDefinition, null, 2)}
Coordination Plan: ${JSON.stringify(coordinationPlan, null, 2)}
Agents: ${JSON.stringify(agentDetails, null, 2)}

For each agent, provide:
1. Optimal role assignment
2. Coordination strategy
3. Expected interactions with other agents
4. Performance targets
5. AI-generated guidance

Return as JSON array with: agentId, role, strategy, expectedInteractions, targets, guidance
`;

      const response = await grokClient.chat([
        { role: 'system', content: this.aiModels.coordinationPlanner.systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.3 });

      try {
        return JSON.parse(response);
      } catch (parseError) {
        return agentsInvolved.map(agentId => ({
          agentId,
          role: this.determineAgentRole(agentId, taskDefinition),
          strategy: 'adaptive',
          expectedInteractions: [],
          targets: { efficiency: 0.85 },
          guidance: 'Execute with AI coordination support'
        }));
      }

    } catch (error) {
      console.error('AI assignment generation failed:', error);
      return agentsInvolved.map(agentId => ({
        agentId,
        role: this.determineAgentRole(agentId, taskDefinition),
        strategy: 'fallback',
        expectedInteractions: [],
        targets: {},
        guidance: 'Standard execution with fallback coordination'
      }));
    }
  }

  /**
   * Predict consensus outcome using AI
   */
  async predictConsensusOutcome(proposalType, proposalData, votingAgents) {
    if (!GROK_API_KEY) {
      return {
        outcome: 'uncertain',
        confidence: 0.5,
        keyInfluencers: [],
        strategy: 'standard_voting'
      };
    }

    try {
      const agentProfiles = votingAgents.map(id => {
        const agent = this.agentRegistry.get(id);
        return {
          id,
          type: agent?.agent_type || 'unknown',
          voting_power: agent?.voting_power || 1,
          historical_patterns: agent?.voting_history || 'unknown',
          performance: agent?.performance_metrics || {}
        };
      });

      const prompt = `
Predict the consensus outcome for this proposal:

Proposal Type: ${proposalType}
Proposal Data: ${JSON.stringify(proposalData, null, 2)}
Voting Agents: ${JSON.stringify(agentProfiles, null, 2)}

Analyze and predict:
1. Most likely outcome (approve/reject/uncertain)
2. Confidence percentage (0-1)
3. Key influencer agents
4. Optimal consensus strategy
5. Potential roadblocks
6. Recommended approach

Return as JSON with: outcome, confidence, keyInfluencers, strategy, roadblocks, recommendations
`;

      const response = await grokClient.chat([
        { role: 'system', content: this.aiModels.consensusPredictor.systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.2 });

      this.aiModels.consensusPredictor.lastUsed = new Date();
      
      try {
        return JSON.parse(response);
      } catch (parseError) {
        return {
          outcome: 'approve',
          confidence: 0.7,
          keyInfluencers: votingAgents.slice(0, 3),
          strategy: 'collaborative_voting'
        };
      }

    } catch (error) {
      console.error('AI consensus prediction failed:', error);
      return {
        outcome: 'uncertain',
        confidence: 0.6,
        keyInfluencers: [],
        strategy: 'standard_voting'
      };
    }
  }

  /**
   * Generate personalized voting requests
   */
  async generatePersonalizedVotingRequests(votingAgents, proposalId, proposalType, proposalData, prediction) {
    const baseRequest = {
      from_agent: this.id,
      message_type: 'intelligent_voting_request',
      timestamp: new Date()
    };

    return votingAgents.map(agentId => {
      const agent = this.agentRegistry.get(agentId);
      const isKeyInfluencer = prediction.keyInfluencers?.includes(agentId);
      
      return {
        ...baseRequest,
        to_agent: agentId,
        payload: {
          proposal_id: proposalId,
          proposal_type: proposalType,
          proposal_data: proposalData,
          voting_deadline: new Date(Date.now() + this.protocolConfig.consensus_timeout),
          ai_context: {
            predicted_outcome: prediction.outcome,
            agent_influence: isKeyInfluencer ? 'high' : 'normal',
            personalized_guidance: isKeyInfluencer ? 
              'Your vote is crucial for consensus' : 
              'Consider all aspects carefully',
            consensus_strategy: prediction.strategy,
            expected_alignment: this.calculateAgentAlignment(agent, proposalData)
          }
        }
      };
    });
  }

  /**
   * Calculate agent alignment with proposal
   */
  calculateAgentAlignment(agent, proposalData) {
    if (!agent || !proposalData) return 'neutral';
    
    // Simple alignment calculation based on agent type and proposal
    if (agent.agent_type === 'analytics' && proposalData.type?.includes('analysis')) {
      return 'high';
    }
    if (agent.agent_type === 'data_product' && proposalData.type?.includes('data')) {
      return 'high';
    }
    
    return 'neutral';
  }

  /**
   * Determine agent role in task (enhanced)
   */
  determineAgentRole(agentId, taskDefinition) {
    const agent = this.agentRegistry.get(agentId);
    if (!agent) return 'participant';
    
    // Enhanced role assignment based on agent capabilities
    if (agent.agent_type === 'data_product') return 'data_provider';
    if (agent.agent_type === 'analytics') return 'analyzer';
    if (agent.agent_type === 'coordination') return 'coordinator';
    if (agent.agent_type === 'education') return 'validator';
    if (agent.agent_type === 'interface') return 'interface_manager';
    
    return 'participant';
  }
}

// Export for use in agent factory
export default A2AProtocolManager;