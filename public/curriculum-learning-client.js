/**
 * Curriculum Learning API Client
 * Handles all interactions with the teaching/learning backend
 */

class CurriculumLearningClient {
  constructor(useRealEndpoint = true) {
    // Use the real endpoint by default (no mocks)
    this.baseUrl = useRealEndpoint ? '/api/agents/curriculum-learning-real' : '/api/agents/curriculum-learning';
    this.cache = new Map();
    this.listeners = new Map();
  }

  /**
   * Subscribe to updates for a specific data type
   */
  subscribe(dataType, callback) {
    if (!this.listeners.has(dataType)) {
      this.listeners.set(dataType, new Set());
    }
    this.listeners.get(dataType).add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(dataType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Notify all listeners for a data type
   */
  notify(dataType, data) {
    const listeners = this.listeners.get(dataType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Get agent status and capabilities
   */
  async getStatus() {
    try {
      const response = await fetch(`${this.baseUrl}?action=status`);
      const data = await response.json();
      
      if (data.success) {
        this.cache.set('status', data);
        this.notify('status', data);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to get status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get knowledge domains
   */
  async getDomains() {
    try {
      const response = await fetch(`${this.baseUrl}?action=domains`);
      const data = await response.json();
      
      if (data.success) {
        this.cache.set('domains', data);
        this.notify('domains', data);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to get domains:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get curricula for agents
   */
  async getCurricula(agentId = null, status = 'active') {
    try {
      const params = new URLSearchParams({ action: 'curricula' });
      if (agentId) params.append('agent_id', agentId);
      if (status) params.append('status', status);
      
      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        this.cache.set('curricula', data);
        this.notify('curricula', data);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to get curricula:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get validation history
   */
  async getValidations(agentId = null, days = 7) {
    try {
      const params = new URLSearchParams({ action: 'validations', days: days.toString() });
      if (agentId) params.append('agent_id', agentId);
      
      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        this.cache.set('validations', data);
        this.notify('validations', data);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to get validations:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get agent compliance scores
   */
  async getAgentScores() {
    try {
      const response = await fetch(`${this.baseUrl}?action=agent_scores`);
      const data = await response.json();
      
      if (data.success) {
        this.cache.set('agent_scores', data);
        this.notify('agent_scores', data);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to get agent scores:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get context templates
   */
  async getContextTemplates() {
    try {
      const response = await fetch(`${this.baseUrl}?action=context_templates`);
      const data = await response.json();
      
      if (data.success) {
        this.cache.set('context_templates', data);
        this.notify('context_templates', data);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to get context templates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get curriculum statistics
   */
  async getStatistics() {
    try {
      const response = await fetch(`${this.baseUrl}?action=statistics`);
      const data = await response.json();
      
      if (data.success) {
        this.cache.set('statistics', data);
        this.notify('statistics', data);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate agent output
   */
  async validateOutput(agentId, output, context) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          agent_id: agentId,
          output: output,
          context: context
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.notify('validation_result', data);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to validate output:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply business context to a task
   */
  async applyContext(agentId, task, businessContext) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_context',
          agent_id: agentId,
          task: task,
          business_context: businessContext
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.notify('context_applied', data);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to apply context:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create curriculum for an agent
   */
  async createCurriculum(agentId, agentType, currentLevel = 'beginner') {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_curriculum',
          agent_id: agentId,
          agent_type: agentType,
          current_level: currentLevel
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.notify('curriculum_created', data);
        // Refresh curricula list
        this.getCurricula();
      }
      
      return data;
    } catch (error) {
      console.error('Failed to create curriculum:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Teach a concept to an agent
   */
  async teachConcept(agentId, concept, currentKnowledge = {}) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'teach_concept',
          agent_id: agentId,
          concept: concept,
          current_knowledge: currentKnowledge
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.notify('concept_taught', data);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to teach concept:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Assess agent knowledge
   */
  async assessKnowledge(agentId, concept, testData = null) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assess_knowledge',
          agent_id: agentId,
          concept: concept,
          test_data: testData
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.notify('assessment_complete', data);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to assess knowledge:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Monitor agent behavior
   */
  async monitorAgent(agentId, action, params = {}) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'monitor_agent',
          agent_id: agentId,
          action: action,
          params: params
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.notify('monitoring_update', data);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to monitor agent:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start auto-refresh for real-time updates
   */
  startAutoRefresh(interval = 5000) {
    // Refresh status and statistics periodically
    this.refreshInterval = setInterval(async () => {
      await Promise.all([
        this.getStatus(),
        this.getStatistics(),
        this.getAgentScores()
      ]);
    }, interval);
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Get cached data
   */
  getCached(key) {
    return this.cache.get(key);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export as global for use in HTML
window.CurriculumLearningClient = CurriculumLearningClient;