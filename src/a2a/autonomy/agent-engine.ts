// src/a2a/autonomy/agent-engine.ts
import { createClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';
import * as cron from 'node-cron';
// Using Grok4 API instead of OpenAI

/**
 * Agent Autonomy Engine
 * Brings passive database agents to life with active behaviors
 */
export class AgentAutonomyEngine extends EventEmitter {
  private supabase: any;
  private openai: OpenAI;
  private activeAgents: Map<string, AgentRunner>;
  private consensusWatcher: ConsensusWatcher;
  private messageRouter: MessageRouter;
  
  constructor(config: {
    supabaseUrl: string;
    supabaseKey: string;
    openaiKey: string;
  }) {
    super();
    
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.openai = new OpenAI({ apiKey: config.openaiKey });
    this.activeAgents = new Map();
    
    // Initialize subsystems
    this.consensusWatcher = new ConsensusWatcher(this.supabase, this);
    this.messageRouter = new MessageRouter(this.supabase, this);
  }
  
  /**
   * Start the autonomy engine
   */
  async start() {
    console.log('🚀 Starting A2A Agent Autonomy Engine...');
    
    // 1. Load and activate all agents
    await this.activateAgents();
    
    // 2. Start real-time subscriptions
    await this.startRealtimeSubscriptions();
    
    // 3. Start scheduled behaviors
    this.startScheduledBehaviors();
    
    // 4. Start consensus watcher
    await this.consensusWatcher.start();
    
    console.log('✅ Agent Autonomy Engine running');
  }
  
  /**
   * Activate all agents from database
   */
  private async activateAgents() {
    const { data: agents } = await this.supabase
      .from('a2a_agents')
      .select('*')
      .eq('status', 'active');
    
    for (const agent of agents || []) {
      const runner = new AgentRunner(agent, this.supabase, this.openai);
      this.activeAgents.set(agent.agent_id, runner);
      
      // Start the agent
      await runner.start();
      
      console.log(`✅ Activated agent: ${agent.name} (${agent.agent_id})`);
    }
  }
  
  /**
   * Setup real-time database subscriptions
   */
  private async startRealtimeSubscriptions() {
    // Watch for new messages that need responses
    this.supabase
      .channel('message-events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'a2a_messages'
      }, (payload: any) => {
        this.handleNewMessage(payload.new);
      })
      .subscribe();
    
    // Watch for new consensus proposals
    this.supabase
      .channel('consensus-events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'a2a_proposals'
      }, (payload: any) => {
        this.handleNewProposal(payload.new);
      })
      .subscribe();
    
    // Watch for agent status changes
    this.supabase
      .channel('agent-events')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'a2a_agents'
      }, (payload: any) => {
        this.handleAgentUpdate(payload);
      })
      .subscribe();
  }
  
  /**
   * Start scheduled behaviors (cron jobs)
   */
  private startScheduledBehaviors() {
    // Every minute: Check for tasks agents should perform
    cron.schedule('* * * * *', async () => {
      await this.runAgentTasks();
    });
    
    // Every 5 minutes: Health check and status updates
    cron.schedule('*/5 * * * *', async () => {
      await this.performHealthChecks();
    });
    
    // Every hour: Run agent learning/optimization
    cron.schedule('0 * * * *', async () => {
      await this.runAgentLearning();
    });
  }
  
  /**
   * Handle new incoming message
   */
  private async handleNewMessage(message: any) {
    console.log(`📨 New message: ${message.message_id}`);
    
    // Find recipient agents
    const recipientIds = message.recipient_ids || [];
    
    for (const recipientId of recipientIds) {
      const agent = this.activeAgents.get(recipientId);
      if (agent) {
        // Let agent decide how to respond
        await agent.handleIncomingMessage(message);
      }
    }
  }
  
  /**
   * Handle new consensus proposal
   */
  private async handleNewProposal(proposal: any) {
    console.log(`🗳️ New proposal: ${proposal.proposal_id}`);
    
    // Notify all eligible agents
    for (const [agentId, agent] of this.activeAgents) {
      if (await agent.canVoteOnProposal(proposal)) {
        await agent.evaluateProposal(proposal);
      }
    }
  }
  
  /**
   * Run periodic agent tasks
   */
  private async runAgentTasks() {
    for (const [agentId, agent] of this.activeAgents) {
      try {
        await agent.runScheduledTasks();
      } catch (error) {
        console.error(`Error in agent ${agentId} tasks:`, error);
      }
    }
  }
  
  /**
   * Send message from one agent
   */
  async sendAgentMessage(
    fromAgentId: string, 
    toAgentIds: string[], 
    content: any,
    messageType: string = 'communication'
  ) {
    const message = {
      sender_id: fromAgentId,
      recipient_ids: toAgentIds,
      message_type: messageType,
      content: content,
      metadata: {
        timestamp: new Date().toISOString(),
        autonomy_engine: true
      }
    };
    
    const { data, error } = await this.supabase
      .from('a2a_messages')
      .insert(message)
      .select()
      .single();
    
    if (error) throw error;
    
    this.emit('message_sent', data);
    return data;
  }
  
  /**
   * Cast vote on behalf of an agent
   */
  async castAgentVote(
    agentId: string,
    proposalId: string,
    vote: 'approve' | 'reject' | 'abstain',
    reasoning: string
  ) {
    // Use the PostgreSQL function
    const { data, error } = await this.supabase
      .rpc('cast_vote', {
        p_agent_id: agentId,
        p_proposal_id: proposalId,
        p_vote: vote,
        p_reasoning: reasoning
      });
    
    if (error) throw error;
    
    this.emit('vote_cast', { agentId, proposalId, vote });
    return data;
  }
}

/**
 * Individual Agent Runner
 * Manages the autonomous behavior of a single agent
 */
class AgentRunner {
  private agent: any;
  private supabase: any;
  private openai: OpenAI;
  private memory: AgentMemory;
  private decisionEngine: DecisionEngine;
  
  constructor(agent: any, supabase: any, openai: OpenAI) {
    this.agent = agent;
    this.supabase = supabase;
    this.openai = openai;
    this.memory = new AgentMemory();
    this.decisionEngine = new DecisionEngine(openai, agent);
  }
  
  async start() {
    // Load agent's memory/state
    await this.loadMemory();
    
    // Initialize decision engine with agent's personality
    await this.decisionEngine.initialize(this.agent.config);
  }
  
  /**
   * Handle incoming message with AI decision making
   */
  async handleIncomingMessage(message: any) {
    // 1. Add to memory
    this.memory.addMessage(message);
    
    // 2. Use AI to decide response
    const decision = await this.decisionEngine.decideMessageResponse(
      message,
      this.memory.getContext()
    );
    
    // 3. Execute decision
    if (decision.shouldRespond) {
      await this.sendMessage(
        decision.recipientIds,
        decision.responseContent,
        decision.messageType
      );
    }
    
    // 4. Update agent state
    await this.updateState({
      last_message_received: message.message_id,
      messages_processed: this.agent.stats?.messages_processed + 1 || 1
    });
  }
  
  /**
   * Evaluate and vote on proposal using AI
   */
  async evaluateProposal(proposal: any) {
    // 1. Analyze proposal with AI
    const analysis = await this.decisionEngine.analyzeProposal(
      proposal,
      this.memory.getContext(),
      this.agent.voting_preferences
    );
    
    // 2. Decide vote
    if (analysis.shouldVote) {
      await this.castVote(
        proposal.proposal_id,
        analysis.vote,
        analysis.reasoning
      );
    }
    
    // 3. Maybe create counter-proposal
    if (analysis.shouldCounter) {
      await this.createCounterProposal(
        proposal,
        analysis.counterProposal
      );
    }
  }
  
  /**
   * Run scheduled tasks based on agent type
   */
  async runScheduledTasks() {
    const tasks = this.agent.scheduled_tasks || [];
    
    for (const task of tasks) {
      if (this.shouldRunTask(task)) {
        await this.executeTask(task);
      }
    }
    
    // Check if agent should initiate any actions
    const proactiveAction = await this.decisionEngine.decideProactiveAction(
      this.memory.getContext(),
      this.agent.goals
    );
    
    if (proactiveAction) {
      await this.executeProactiveAction(proactiveAction);
    }
  }
  
  /**
   * Check if agent can vote on a proposal
   */
  async canVoteOnProposal(proposal: any): Promise<boolean> {
    // Check voting power
    if (this.agent.voting_power <= 0) return false;
    
    // Check if already voted
    const { data: existingVote } = await this.supabase
      .from('a2a_votes')
      .select('vote_id')
      .eq('proposal_id', proposal.proposal_id)
      .eq('agent_id', this.agent.agent_id)
      .single();
    
    return !existingVote;
  }
  
  private async sendMessage(recipientIds: string[], content: any, type: string) {
    // Use the engine to send message
    const engine = (global as any).autonomyEngine;
    await engine.sendAgentMessage(
      this.agent.agent_id,
      recipientIds,
      content,
      type
    );
  }
  
  private async castVote(proposalId: string, vote: string, reasoning: string) {
    const engine = (global as any).autonomyEngine;
    await engine.castAgentVote(
      this.agent.agent_id,
      proposalId,
      vote,
      reasoning
    );
  }
  
  private async updateState(updates: any) {
    await this.supabase
      .from('a2a_agents')
      .update({
        ...updates,
        last_active: new Date().toISOString()
      })
      .eq('agent_id', this.agent.agent_id);
  }
  
  private async loadMemory() {
    // Load recent messages
    const { data: messages } = await this.supabase
      .from('a2a_messages')
      .select('*')
      .or(`sender_id.eq.${this.agent.agent_id},recipient_ids.cs.{${this.agent.agent_id}}`)
      .order('created_at', { ascending: false })
      .limit(50);
    
    this.memory.loadMessages(messages || []);
    
    // Load recent votes
    const { data: votes } = await this.supabase
      .from('a2a_votes')
      .select('*')
      .eq('agent_id', this.agent.agent_id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    this.memory.loadVotes(votes || []);
  }
}

/**
 * AI-powered decision engine for agents
 */
class DecisionEngine {
  private agent: any;
  private systemPrompt: string;
  private grokApiKey: string;
  private grokBaseUrl: string;

  constructor(agent: any) {
    this.agent = agent;
    this.grokApiKey = process.env.GROK_API_KEY || '';
    this.grokBaseUrl = 'https://api.x.ai/v1'; // Grok API endpoint

    if (!this.grokApiKey) {
      throw new Error('GROK_API_KEY environment variable is required');
    }
  }

  async initialize(config: any) {
    this.systemPrompt = `You are an autonomous A2A agent named "${this.agent.name}".
    
Your role: ${this.agent.type}
Your goals: ${JSON.stringify(config?.goals || [])}
Your capabilities: ${JSON.stringify(config?.capabilities || [])}
Your personality: ${config?.personality || 'professional and helpful'}

You make decisions about:
1. When and how to respond to messages
2. How to vote on proposals (approve/reject/abstain)
3. When to initiate new actions or proposals
4. How to collaborate with other agents

Always act in accordance with your role and goals. Be strategic but ethical.`;
  }

  async makeDecision(context: any, question: string): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);

      const response = await fetch(`${this.grokBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.grokApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-4-0709',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No decision made';
    } catch (error) {
      console.error('Decision making error:', error);
      return 'Error making decision';
    }
  }

  private buildSystemPrompt(context: any): string {
    return `${this.systemPrompt}

Context:
- Recent interactions: ${JSON.stringify(context.recentMessages)}
- Active proposals: ${JSON.stringify(context.activeProposals)}
- Your current state: ${JSON.stringify(this.agent.stats)}`;
  }

  async decideMessageResponse(message: any, context: any) {
    const prompt = `New message received:
From: ${message.sender_id}
Type: ${message.message_type}
Content: ${JSON.stringify(message.content)}

${this.buildSystemPrompt(context)}

Should you respond? If yes, what should you say and to whom?
Respond in JSON format:
{
  "shouldRespond": boolean,
  "recipientIds": string[],
  "responseContent": object,
  "messageType": string,
  "reasoning": string
}`;

    const decision = await this.makeDecision(context, prompt);
    return JSON.parse(decision || '{}');
  }

  async analyzeProposal(proposal: any, context: any, preferences: any) {
    const prompt = `Analyze this proposal:
ID: ${proposal.proposal_id}
Title: ${proposal.title}
Type: ${proposal.proposal_type}
Description: ${proposal.description}
Data: ${JSON.stringify(proposal.proposal_data)}

Your voting preferences: ${JSON.stringify(preferences)}
${this.buildSystemPrompt(context)}

Decide:
1. Should you vote? 
2. If yes, how? (approve/reject/abstain)
3. Your reasoning
4. Should you propose a counter/amendment?

Respond in JSON format:
{
  "shouldVote": boolean,
  "vote": "approve" | "reject" | "abstain",
  "reasoning": string,
  "shouldCounter": boolean,
  "counterProposal": object | null
}`;

    const analysis = await this.makeDecision(context, prompt);
    return JSON.parse(analysis || '{}');
  }

  async decideProactiveAction(context: any, goals: any) {
    const prompt = `Based on your current context and goals, should you take any proactive action?

Your goals: ${JSON.stringify(goals)}
${this.buildSystemPrompt(context)}
Time since last action: ${context.timeSinceLastAction}

Consider:
- Starting new conversations
- Creating proposals
- Checking on pending tasks
- Collaborating with other agents

Respond with an action to take or null if no action needed.
Format: { "action": string, "target": string, "data": object }`;

    const decision = await this.makeDecision(context, prompt);
    try {
      return JSON.parse(decision || 'null');
    } catch {
      return null;
    }
  }
}

/**
 * Agent memory system
 */
class AgentMemory {
  private messages: any[] = [];
  private votes: any[] = [];
  private interactions: Map<string, any> = new Map();
  
  addMessage(message: any) {
    this.messages.unshift(message);
    if (this.messages.length > 100) {
      this.messages.pop();
    }
  }
  
  loadMessages(messages: any[]) {
    this.messages = messages;
  }
  
  loadVotes(votes: any[]) {
    this.votes = votes;
  }
  
  getContext() {
    return {
      recentMessages: this.messages.slice(0, 10),
      recentVotes: this.votes.slice(0, 5),
      activeProposals: this.getActiveProposals(),
      timeSinceLastAction: this.getTimeSinceLastAction()
    };
  }
  
  private getActiveProposals() {
    // Extract active proposals from recent messages
    return this.messages
      .filter(m => m.message_type === 'proposal')
      .slice(0, 5);
  }
  
  private getTimeSinceLastAction() {
    if (this.messages.length === 0) return Infinity;
    const lastMessage = this.messages[0];
    return Date.now() - new Date(lastMessage.created_at).getTime();
  }
}

/**
 * Consensus participation watcher
 */
class ConsensusWatcher {
  constructor(
    private supabase: any,
    private engine: AgentAutonomyEngine
  ) {}
  
  async start() {
    // Check for proposals needing attention every 30 seconds
    setInterval(async () => {
      await this.checkPendingProposals();
    }, 30000);
  }
  
  private async checkPendingProposals() {
    const { data: activeRounds } = await this.supabase
      .from('a2a_consensus_rounds')
      .select('*')
      .eq('status', 'voting')
      .gt('voting_deadline', new Date().toISOString());
    
    // Alert agents about rounds ending soon
    for (const round of activeRounds || []) {
      const timeLeft = new Date(round.voting_deadline).getTime() - Date.now();
      
      if (timeLeft < 3600000) { // Less than 1 hour
        this.engine.emit('consensus_deadline_approaching', round);
      }
    }
  }
}

/**
 * Message routing system
 */
class MessageRouter {
  constructor(
    private supabase: any,
    private engine: AgentAutonomyEngine
  ) {}
  
  async routeMessage(message: any) {
    // Implement intelligent routing based on message type
    const routes = {
      'request': this.routeRequest,
      'proposal': this.routeProposal,
      'notification': this.routeNotification,
      'collaboration': this.routeCollaboration
    };
    
    const router = routes[message.message_type] || this.defaultRoute;
    await router.call(this, message);
  }
  
  private async routeRequest(message: any) {
    // Find best agent to handle request
    const { data: agents } = await this.supabase
      .from('a2a_agents')
      .select('*')
      .contains('capabilities', [message.content.capability])
      .eq('status', 'active')
      .order('performance_score', { ascending: false })
      .limit(3);
    
    // Route to top performers
    if (agents && agents.length > 0) {
      message.recipient_ids = agents.map(a => a.agent_id);
    }
  }
  
  private async routeProposal(message: any) {
    // Route to all agents with voting power
    const { data: voters } = await this.supabase
      .from('a2a_agents')
      .select('agent_id')
      .gt('voting_power', 0)
      .eq('status', 'active');
    
    message.recipient_ids = voters?.map(v => v.agent_id) || [];
  }
  
  private async routeNotification(message: any) {
    // Broadcast notifications
    if (message.content.broadcast) {
      const { data: agents } = await this.supabase
        .from('a2a_agents')
        .select('agent_id')
        .eq('status', 'active');
      
      message.recipient_ids = agents?.map(a => a.agent_id) || [];
    }
  }
  
  private async routeCollaboration(message: any) {
    // Find agents with complementary skills
    const requiredSkills = message.content.required_skills || [];
    
    const { data: agents } = await this.supabase
      .from('a2a_agents')
      .select('*')
      .overlaps('capabilities', requiredSkills)
      .eq('status', 'active');
    
    message.recipient_ids = agents?.map(a => a.agent_id) || [];
  }
  
  private async defaultRoute(message: any) {
    // Default: route to specified recipients
    return message;
  }
}

// Export singleton instance
let engineInstance: AgentAutonomyEngine | null = null;

export function createAutonomyEngine(config: any): AgentAutonomyEngine {
  if (!engineInstance) {
    engineInstance = new AgentAutonomyEngine(config);
    (global as any).autonomyEngine = engineInstance;
  }
  return engineInstance;
}

export function getAutonomyEngine(): AgentAutonomyEngine | null {
  return engineInstance;
}
