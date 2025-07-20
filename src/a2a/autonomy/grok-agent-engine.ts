import { createClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';

/**
 * Simplified A2A Agent Autonomy Engine with Grok4 API
 * Fixes all TypeScript issues and provides working autonomous agents
 */
export class GrokAgentEngine extends EventEmitter {
  private supabase: any;
  private agents: Map<string, AgentRunner> = new Map();
  private isRunning: boolean = false;
  private grokApiKey: string;
  private grokBaseUrl: string = 'https://api.x.ai/v1';

  constructor() {
    super();
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Supabase credentials required');
    }

    if (!process.env.GROK_API_KEY) {
      throw new Error('GROK_API_KEY environment variable is required');
    }

    this.grokApiKey = process.env.GROK_API_KEY;
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }

  async start() {
    if (this.isRunning) return;
    
    console.log('🚀 Starting Grok-powered A2A Agent Autonomy Engine...');
    
    // Load active agents
    await this.loadAgents();
    
    // Setup real-time subscriptions
    this.setupRealtimeSubscriptions();
    
    // Start periodic tasks
    this.startPeriodicTasks();
    
    this.isRunning = true;
    this.emit('started');
    console.log('✅ Agent Autonomy Engine running with Grok AI');
  }

  async stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.agents.clear();
    this.emit('stopped');
    console.log('🛑 Agent Autonomy Engine stopped');
  }

  private async loadAgents() {
    const { data: agents, error } = await this.supabase
      .from('a2a_agents')
      .select('*')
      .eq('status', 'active')
      .eq('autonomy_enabled', true);

    if (error) {
      console.error('Error loading agents:', error);
      return;
    }

    for (const agent of agents || []) {
      const runner = new AgentRunner(agent, this.supabase, this.grokApiKey, this.grokBaseUrl);
      await runner.initialize();
      this.agents.set(agent.agent_id, runner);
      console.log(`✅ Activated agent: ${agent.name} (${agent.agent_id})`);
    }
  }

  private setupRealtimeSubscriptions() {
    // Listen for new messages
    this.supabase
      .channel('a2a_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'a2a_messages' 
      }, (payload: any) => {
        this.handleNewMessage(payload.new);
      })
      .subscribe();

    // Listen for new proposals
    this.supabase
      .channel('a2a_proposals')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'a2a_proposals' 
      }, (payload: any) => {
        this.handleNewProposal(payload.new);
      })
      .subscribe();
  }

  private startPeriodicTasks() {
    // Health check every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    // Process scheduled tasks every minute
    setInterval(() => {
      this.processScheduledTasks();
    }, 60 * 1000);
  }

  private async handleNewMessage(message: any) {
    const recipients = message.recipient_ids || [];
    
    for (const recipientId of recipients) {
      const agent = this.agents.get(recipientId);
      if (agent) {
        await agent.processMessage(message);
      }
    }
  }

  private async handleNewProposal(proposal: any) {
    // Notify all agents about the new proposal
    for (const [agentId, agent] of this.agents) {
      await agent.evaluateProposal(proposal);
    }
  }

  private async performHealthCheck() {
    for (const [agentId, agent] of this.agents) {
      try {
        await agent.healthCheck();
      } catch (error) {
        console.error(`Health check failed for agent ${agentId}:`, error);
      }
    }
  }

  private async processScheduledTasks() {
    for (const [agentId, agent] of this.agents) {
      await agent.runScheduledTasks();
    }
  }

  // Public API methods
  async sendMessage(senderId: string, recipientIds: string[], messageType: string, content: any) {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const { error } = await this.supabase
      .from('a2a_messages')
      .insert({
        message_id: messageId,
        sender_id: senderId,
        recipient_ids: recipientIds,
        message_type: messageType,
        content,
        autonomy_generated: true
      });

    if (error) {
      console.error('Error sending message:', error);
      return false;
    }

    return true;
  }

  getAgentStats() {
    const stats: any = {};
    
    for (const [agentId, agent] of this.agents) {
      stats[agentId] = agent.getStats();
    }

    return {
      totalAgents: this.agents.size,
      activeAgents: Array.from(this.agents.values()).filter(a => a.isActive()).length,
      agentDetails: stats
    };
  }
}

/**
 * Individual agent runner with Grok AI decision making
 */
class AgentRunner {
  private agent: any;
  private supabase: any;
  private grokApiKey: string;
  private grokBaseUrl: string;
  private lastActivity: Date = new Date();
  private messageCount: number = 0;
  private voteCount: number = 0;

  constructor(agent: any, supabase: any, grokApiKey: string, grokBaseUrl: string) {
    this.agent = agent;
    this.supabase = supabase;
    this.grokApiKey = grokApiKey;
    this.grokBaseUrl = grokBaseUrl;
  }

  async initialize() {
    console.log(`Initializing agent: ${this.agent.name}`);
  }

  async processMessage(message: any) {
    try {
      // Use Grok AI to decide how to respond
      const decision = await this.makeAIDecision(`
        You received a message:
        From: ${message.sender_id}
        Type: ${message.message_type}
        Content: ${JSON.stringify(message.content)}
        
        Should you respond? If yes, what should you say?
        Respond in JSON: {"shouldRespond": boolean, "response": string, "reasoning": string}
      `);

      if (decision.shouldRespond) {
        await this.sendResponse(message, decision.response);
        this.logActivity('message_response', { 
          original_message: message.message_id,
          reasoning: decision.reasoning 
        });
      }

      this.messageCount++;
      this.lastActivity = new Date();
    } catch (error) {
      console.error(`Error processing message for agent ${this.agent.agent_id}:`, error);
    }
  }

  async evaluateProposal(proposal: any) {
    try {
      const decision = await this.makeAIDecision(`
        Evaluate this proposal:
        ID: ${proposal.proposal_id}
        Title: ${proposal.title}
        Type: ${proposal.proposal_type}
        Data: ${JSON.stringify(proposal.proposal_data)}
        
        Your preferences: ${JSON.stringify(this.agent.voting_preferences)}
        Your goals: ${JSON.stringify(this.agent.goals)}
        
        How should you vote? Respond in JSON:
        {"vote": "APPROVE|REJECT|ABSTAIN", "reasoning": string}
      `);

      if (decision.vote) {
        await this.castVote(proposal.proposal_id, decision.vote, decision.reasoning);
        this.voteCount++;
        this.lastActivity = new Date();
      }
    } catch (error) {
      console.error(`Error evaluating proposal for agent ${this.agent.agent_id}:`, error);
    }
  }

  async runScheduledTasks() {
    const scheduledTasks = this.agent.scheduled_tasks || [];
    
    for (const task of scheduledTasks) {
      // Simple interval check (in production, use proper cron parsing)
      if (this.shouldRunTask(task)) {
        await this.executeScheduledTask(task);
      }
    }
  }

  async healthCheck() {
    // Update last_active timestamp
    await this.supabase
      .from('a2a_agents')
      .update({ last_active: new Date().toISOString() })
      .eq('agent_id', this.agent.agent_id);
  }

  private async makeAIDecision(prompt: string): Promise<any> {
    try {
      const systemPrompt = `You are ${this.agent.name}, an autonomous AI agent.
Role: ${this.agent.type}
Personality: ${this.agent.personality}
Goals: ${this.agent.goals?.join(', ')}
Capabilities: ${this.agent.capabilities?.join(', ')}

Always respond in valid JSON format. Be decisive but thoughtful.`;

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
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '{}';
      
      return JSON.parse(content);
    } catch (error) {
      console.error('AI decision error:', error);
      return { shouldRespond: false, vote: 'ABSTAIN', reasoning: 'AI decision failed' };
    }
  }

  private async sendResponse(originalMessage: any, responseContent: string) {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await this.supabase
      .from('a2a_messages')
      .insert({
        message_id: messageId,
        sender_id: this.agent.agent_id,
        recipient_ids: [originalMessage.sender_id],
        message_type: 'response',
        content: { response: responseContent, in_reply_to: originalMessage.message_id },
        autonomy_generated: true
      });
  }

  private async castVote(proposalId: string, vote: string, reasoning: string) {
    const { error } = await this.supabase.rpc('cast_vote', {
      p_proposal_id: proposalId,
      p_agent_id: this.agent.agent_id,
      p_vote: vote,
      p_reasoning: reasoning
    });

    if (error) {
      console.error('Error casting vote:', error);
    }
  }

  private async logActivity(activityType: string, details: any) {
    await this.supabase
      .from('agent_activity')
      .insert({
        agent_id: this.agent.agent_id,
        activity_type: activityType,
        details
      });
  }

  private shouldRunTask(task: any): boolean {
    // Simplified task scheduling - in production, use proper cron parsing
    return Math.random() < 0.1; // 10% chance per check
  }

  private async executeScheduledTask(task: any) {
    console.log(`Executing scheduled task: ${task.name} for agent ${this.agent.agent_id}`);
    
    await this.logActivity('scheduled_task', {
      task_name: task.name,
      action: task.action
    });
  }

  isActive(): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastActivity > fiveMinutesAgo;
  }

  getStats() {
    return {
      name: this.agent.name,
      type: this.agent.type,
      lastActivity: this.lastActivity,
      messageCount: this.messageCount,
      voteCount: this.voteCount,
      isActive: this.isActive()
    };
  }
}

// Singleton instance
let engineInstance: GrokAgentEngine | null = null;

export function getAgentEngine(): GrokAgentEngine {
  if (!engineInstance) {
    engineInstance = new GrokAgentEngine();
  }
  return engineInstance;
}

export function resetAgentEngine(): void {
  if (engineInstance) {
    engineInstance.stop();
    engineInstance = null;
  }
}
