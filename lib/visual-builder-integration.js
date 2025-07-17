/**
 * Visual Builder Integration with Real A2A Network
 * Bridges the visual builder with production A2A infrastructure
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

class VisualBuilderIntegration {
  constructor() {
    this.networkAgents = new Map();
    this.deployedContracts = new Map();
    this.activeProcesses = new Map();
  }

  /**
   * Initialize integration with real A2A network
   */
  async initialize() {
    console.log('🔌 Initializing Visual Builder integration...');
    
    try {
      // Load existing agents
      await this.loadNetworkAgents();
      
      // Load deployed contracts
      await this.loadDeployedContracts();
      
      // Setup real-time subscriptions
      await this.setupRealtimeSubscriptions();
      
      console.log('✅ Visual Builder integration initialized');
      
      return {
        success: true,
        agentCount: this.networkAgents.size,
        contractCount: this.deployedContracts.size
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize integration:', error);
      throw error;
    }
  }

  /**
   * Load active agents from the network
   */
  async loadNetworkAgents() {
    try {
      // Get agents from multiple sources
      const sources = [
        { table: 'a2a_agents', idField: 'agent_id' },
        { table: 'a2a_consensus', idField: 'agent_id' },
        { table: 'a2a_visual_agents', idField: 'agent_id' }
      ];

      for (const source of sources) {
        const { data, error } = await supabase
          .from(source.table)
          .select('*')
          .limit(50);

        if (!error && data) {
          data.forEach(agent => {
            const agentId = agent[source.idField];
            if (agentId && !this.networkAgents.has(agentId)) {
              this.networkAgents.set(agentId, {
                id: agentId,
                name: agent.name || agent.agent_name || agentId,
                type: agent.agent_type || agent.type || 'processor',
                status: agent.status || 'active',
                reputation: agent.reputation_score || agent.reputation || 100,
                address: agent.agent_address || agent.address,
                capabilities: agent.capabilities || [],
                lastActive: agent.last_active || agent.last_seen,
                source: source.table
              });
            }
          });
        }
      }

      console.log(`📡 Loaded ${this.networkAgents.size} network agents`);
      
    } catch (error) {
      console.error('Failed to load network agents:', error);
    }
  }

  /**
   * Load deployed trust contracts
   */
  async loadDeployedContracts() {
    try {
      const sources = [
        'a2a_deployments',
        'a2a_trust_contracts',
        'a2a_visual_contracts'
      ];

      for (const table of sources) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(20);

        if (!error && data) {
          data.forEach(contract => {
            const contractId = contract.contract_id || contract.process_id || contract.id;
            if (contractId && !this.deployedContracts.has(contractId)) {
              this.deployedContracts.set(contractId, {
                id: contractId,
                name: contract.contract_name || contract.process_name || contractId,
                type: contract.contract_type || this.inferContractType(contract),
                address: contract.contract_address || contract.address,
                deployedAt: contract.deployed_at || contract.created_at,
                deployer: contract.deployer || contract.created_by,
                status: contract.status || 'deployed',
                gasUsed: contract.gas_used,
                source: table
              });
            }
          });
        }
      }

      console.log(`📜 Loaded ${this.deployedContracts.size} deployed contracts`);
      
    } catch (error) {
      console.error('Failed to load deployed contracts:', error);
    }
  }

  /**
   * Setup real-time subscriptions for network changes
   */
  async setupRealtimeSubscriptions() {
    try {
      // Subscribe to agent changes
      supabase
        .channel('visual-builder-agents')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'a2a_agents' },
          (payload) => this.handleAgentChange(payload)
        )
        .subscribe();

      // Subscribe to contract deployments
      supabase
        .channel('visual-builder-contracts')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'a2a_deployments' },
          (payload) => this.handleContractChange(payload)
        )
        .subscribe();

      console.log('📡 Real-time subscriptions active');
      
    } catch (error) {
      console.error('Failed to setup real-time subscriptions:', error);
    }
  }

  /**
   * Handle agent network changes
   */
  handleAgentChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        if (newRecord) {
          this.networkAgents.set(newRecord.agent_id, {
            id: newRecord.agent_id,
            name: newRecord.name || newRecord.agent_id,
            type: newRecord.agent_type || 'processor',
            status: newRecord.status || 'active',
            reputation: newRecord.reputation_score || 100,
            address: newRecord.agent_address,
            capabilities: newRecord.capabilities || [],
            lastActive: newRecord.last_active,
            source: 'a2a_agents'
          });
          console.log(`➕ New agent joined: ${newRecord.agent_id}`);
        }
        break;
        
      case 'UPDATE':
        if (newRecord && this.networkAgents.has(newRecord.agent_id)) {
          const existing = this.networkAgents.get(newRecord.agent_id);
          this.networkAgents.set(newRecord.agent_id, {
            ...existing,
            status: newRecord.status,
            reputation: newRecord.reputation_score || existing.reputation,
            lastActive: newRecord.last_active
          });
          console.log(`🔄 Agent updated: ${newRecord.agent_id}`);
        }
        break;
        
      case 'DELETE':
        if (oldRecord) {
          this.networkAgents.delete(oldRecord.agent_id);
          console.log(`➖ Agent removed: ${oldRecord.agent_id}`);
        }
        break;
    }
  }

  /**
   * Handle contract deployment changes
   */
  handleContractChange(payload) {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT' && newRecord) {
      this.deployedContracts.set(newRecord.process_id, {
        id: newRecord.process_id,
        name: newRecord.process_name,
        type: this.inferContractType(newRecord),
        address: newRecord.contract_address,
        deployedAt: newRecord.deployed_at,
        deployer: newRecord.deployer,
        status: 'deployed',
        gasUsed: newRecord.gas_used,
        source: 'a2a_deployments'
      });
      console.log(`🆕 New contract deployed: ${newRecord.process_name}`);
    }
  }

  /**
   * Deploy visual process to real network
   */
  async deployVisualProcess(processDefinition, deployerAddress) {
    try {
      console.log(`🚀 Deploying visual process: ${processDefinition.name}`);
      
      // Validate process has real agents
      const realAgents = this.validateRealAgents(processDefinition);
      if (realAgents.length === 0) {
        throw new Error('Process must include at least one real network agent');
      }

      // Generate deployment ID
      const deploymentId = `visual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create deployment record
      const deployment = {
        process_id: deploymentId,
        process_name: processDefinition.name || 'Visual Process',
        process_definition: processDefinition,
        deployer: deployerAddress,
        real_agents: realAgents.map(a => a.realAgentId),
        visual_elements: processDefinition.elements?.length || 0,
        trust_contracts: this.extractTrustContracts(processDefinition),
        deployed_at: new Date().toISOString(),
        status: 'deploying'
      };

      // Store in database
      const { error: insertError } = await supabase
        .from('a2a_visual_deployments')
        .insert(deployment);

      if (insertError) throw insertError;

      // Notify real agents about the new process
      await this.notifyRealAgents(realAgents, {
        processId: deploymentId,
        processDefinition,
        action: 'process_deployed'
      });

      // Update status to deployed
      await supabase
        .from('a2a_visual_deployments')
        .update({ status: 'deployed' })
        .eq('process_id', deploymentId);

      console.log(`✅ Visual process deployed: ${deploymentId}`);

      return {
        success: true,
        processId: deploymentId,
        realAgentsNotified: realAgents.length,
        deploymentUrl: `/a2a-network.html?process=${deploymentId}`
      };

    } catch (error) {
      console.error('Failed to deploy visual process:', error);
      throw error;
    }
  }

  /**
   * Validate and extract real agents from process
   */
  validateRealAgents(processDefinition) {
    const realAgents = [];
    
    for (const element of processDefinition.elements || []) {
      if (element.type === 'agent' && element.realData?.realAgentId) {
        const networkAgent = this.networkAgents.get(element.realData.realAgentId);
        
        if (!networkAgent) {
          throw new Error(`Real agent ${element.realData.realAgentId} not found in network`);
        }
        
        if (networkAgent.status !== 'active') {
          throw new Error(`Real agent ${element.realData.realAgentId} is not active`);
        }
        
        realAgents.push({
          elementId: element.id,
          realAgentId: element.realData.realAgentId,
          agent: networkAgent,
          config: element.config
        });
      }
    }
    
    return realAgents;
  }

  /**
   * Extract trust contracts from process
   */
  extractTrustContracts(processDefinition) {
    const contracts = [];
    
    for (const element of processDefinition.elements || []) {
      if (element.type === 'contract') {
        contracts.push({
          elementId: element.id,
          contractType: element.subtype,
          realAddress: element.realData?.realContractAddress,
          config: element.config
        });
      }
    }
    
    return contracts;
  }

  /**
   * Notify real agents about process deployment
   */
  async notifyRealAgents(realAgents, notification) {
    const notifications = realAgents.map(({ realAgentId, config }) => ({
      agent_id: realAgentId,
      notification_type: 'visual_process_deployed',
      notification_data: {
        ...notification,
        agentConfig: config
      },
      created_at: new Date().toISOString(),
      status: 'pending'
    }));

    const { error } = await supabase
      .from('a2a_agent_notifications')
      .insert(notifications);

    if (error) {
      console.error('Failed to notify agents:', error);
    } else {
      console.log(`📧 Notified ${realAgents.length} real agents`);
    }
  }

  /**
   * Get current network status
   */
  getNetworkStatus() {
    const activeAgents = Array.from(this.networkAgents.values())
      .filter(agent => agent.status === 'active');
    
    const recentAgents = activeAgents.filter(agent => {
      if (!agent.lastActive) return false;
      const lastActive = new Date(agent.lastActive);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return lastActive > fiveMinutesAgo;
    });

    return {
      totalAgents: this.networkAgents.size,
      activeAgents: activeAgents.length,
      recentlyActiveAgents: recentAgents.length,
      deployedContracts: this.deployedContracts.size,
      networkHealth: recentAgents.length > 0 ? 'healthy' : 'degraded',
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Get real agents for visual builder
   */
  getRealAgents() {
    return Array.from(this.networkAgents.values()).map(agent => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: agent.status,
      reputation: agent.reputation,
      capabilities: agent.capabilities,
      lastActive: agent.lastActive
    }));
  }

  /**
   * Get deployed contracts for visual builder
   */
  getDeployedContracts() {
    return Array.from(this.deployedContracts.values()).map(contract => ({
      id: contract.id,
      name: contract.name,
      type: contract.type,
      address: contract.address,
      deployedAt: contract.deployedAt,
      status: contract.status
    }));
  }

  /**
   * Helper function to infer contract type
   */
  inferContractType(contract) {
    const name = (contract.contract_name || contract.process_name || '').toLowerCase();
    
    if (name.includes('escrow')) return 'escrow';
    if (name.includes('multisig') || name.includes('consensus')) return 'multisig';
    if (name.includes('time') || name.includes('lock')) return 'timelock';
    if (name.includes('reputation')) return 'reputation';
    
    return 'escrow'; // default
  }
}

// Export singleton instance
const visualBuilderIntegration = new VisualBuilderIntegration();

export { visualBuilderIntegration, VisualBuilderIntegration };