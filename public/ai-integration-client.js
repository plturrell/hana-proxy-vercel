/**
 * AI Integration Client - Frontend JavaScript to connect AI magic to existing UI
 * Automatically enhances any page with invisible AI capabilities
 */

class AIIntegrationClient {
  constructor() {
    this.baseURL = window.location.origin;
    this.currentPage = this.getCurrentPageName();
    this.userContext = this.initializeUserContext();
    this.aiEnabled = true;
    this.conversationHistory = [];
    
    // Initialize AI enhancements when page loads
    this.initialize();
  }

  async initialize() {
    console.log('🤖 AI Integration Client initializing...');
    
    try {
      // Enhance current page with AI
      await this.enhanceCurrentPage();
      
      // Setup natural language interface
      this.setupNaturalLanguageInterface();
      
      // Enable smart navigation
      this.enableSmartNavigation();
      
      // Setup predictive loading
      this.enablePredictiveLoading();
      
      // Setup contextual help
      this.setupContextualHelp();
      
      console.log('✨ AI Magic enabled for', this.currentPage);
    } catch (error) {
      console.error('AI initialization failed:', error);
    }
  }

  getCurrentPageName() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    return filename;
  }

  initializeUserContext() {
    return {
      userId: this.getUserId(),
      preferences: this.getUserPreferences(),
      portfolio: this.getPortfolioContext(),
      recentActions: this.getRecentActions(),
      sessionStart: Date.now()
    };
  }

  async enhanceCurrentPage() {
    try {
      const response = await fetch(`${this.baseURL}/api/ai-integration-hub?action=enhance-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: this.currentPage,
          userContext: this.userContext,
          currentData: this.getCurrentPageData()
        })
      });

      if (response.ok) {
        const enhancements = await response.json();
        this.applyPageEnhancements(enhancements);
      }
    } catch (error) {
      console.error('Page enhancement failed:', error);
    }
  }

  setupNaturalLanguageInterface() {
    // Create floating AI assistant
    this.createAIAssistant();
    
    // Add natural language input to forms
    this.enhanceFormsWithNL();
    
    // Setup voice commands if available
    this.setupVoiceCommands();
  }

  createAIAssistant() {
    // Create floating AI assistant button
    const assistantHTML = `
      <div id="ai-assistant" class="ai-assistant-container">
        <button id="ai-toggle" class="ai-assistant-toggle" title="AI Assistant">
          🤖
        </button>
        <div id="ai-panel" class="ai-assistant-panel" style="display: none;">
          <div class="ai-header">
            <h4>AI Financial Assistant</h4>
            <button id="ai-close" class="ai-close">×</button>
          </div>
          <div id="ai-suggestions" class="ai-suggestions"></div>
          <div class="ai-input-container">
            <input type="text" id="ai-input" placeholder="Ask me anything about your finances..." />
            <button id="ai-send">Send</button>
          </div>
          <div id="ai-response" class="ai-response"></div>
        </div>
      </div>
    `;

    // Inject AI assistant into page
    document.body.insertAdjacentHTML('beforeend', assistantHTML);
    
    // Add CSS styles
    this.injectAIStyles();
    
    // Setup event listeners
    this.setupAIAssistantEvents();
  }

  injectAIStyles() {
    const styles = `
      <style>
        .ai-assistant-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .ai-assistant-toggle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
        }
        
        .ai-assistant-toggle:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        }
        
        .ai-assistant-panel {
          position: absolute;
          bottom: 70px;
          right: 0;
          width: 350px;
          max-height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          border: 1px solid #e1e5e9;
          overflow: hidden;
        }
        
        .ai-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .ai-header h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .ai-close {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
        }
        
        .ai-suggestions {
          padding: 15px;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .ai-suggestion {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        
        .ai-suggestion:hover {
          background: #e9ecef;
          border-color: #667eea;
        }
        
        .ai-input-container {
          padding: 15px;
          border-top: 1px solid #e1e5e9;
          display: flex;
          gap: 10px;
        }
        
        #ai-input {
          flex: 1;
          padding: 10px;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          font-size: 14px;
        }
        
        #ai-send {
          background: #667eea;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .ai-response {
          padding: 15px;
          border-top: 1px solid #e1e5e9;
          max-height: 200px;
          overflow-y: auto;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .ai-thinking {
          color: #6c757d;
          font-style: italic;
        }
        
        .ai-error {
          color: #dc3545;
          background: #f8d7da;
          padding: 10px;
          border-radius: 4px;
          margin-top: 10px;
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }

  setupAIAssistantEvents() {
    // Toggle AI panel
    document.getElementById('ai-toggle').addEventListener('click', () => {
      const panel = document.getElementById('ai-panel');
      const isVisible = panel.style.display !== 'none';
      panel.style.display = isVisible ? 'none' : 'block';
      
      if (!isVisible) {
        this.loadContextualSuggestions();
      }
    });

    // Close AI panel
    document.getElementById('ai-close').addEventListener('click', () => {
      document.getElementById('ai-panel').style.display = 'none';
    });

    // Send AI query
    const sendQuery = async () => {
      const input = document.getElementById('ai-input');
      const query = input.value.trim();
      
      if (!query) return;
      
      input.value = '';
      await this.processNaturalLanguageQuery(query);
    };

    document.getElementById('ai-send').addEventListener('click', sendQuery);
    document.getElementById('ai-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendQuery();
    });
  }

  async loadContextualSuggestions() {
    try {
      const response = await fetch(`${this.baseURL}/api/ai-integration-hub?action=smart-navigation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPage: this.currentPage,
          userState: this.userContext,
          recentActions: this.userContext.recentActions
        })
      });

      if (response.ok) {
        const suggestions = await response.json();
        this.displaySuggestions(suggestions.navigation_suggestions);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  }

  displaySuggestions(suggestions) {
    const container = document.getElementById('ai-suggestions');
    
    if (!suggestions?.immediate_suggestions) {
      container.innerHTML = '<div class="ai-thinking">Analyzing your current context...</div>';
      return;
    }
    
    const suggestionsHTML = suggestions.immediate_suggestions.map(suggestion => `
      <div class="ai-suggestion" data-action="${suggestion.one_click_action || suggestion.suggestion}">
        <strong>${suggestion.suggestion || suggestion.destination}</strong>
        <div style="font-size: 12px; color: #6c757d; margin-top: 4px;">
          ${suggestion.reason || suggestion.benefit}
        </div>
      </div>
    `).join('');
    
    container.innerHTML = suggestionsHTML;
    
    // Add click handlers for suggestions
    container.querySelectorAll('.ai-suggestion').forEach(suggestion => {
      suggestion.addEventListener('click', () => {
        const action = suggestion.dataset.action;
        this.executeSuggestion(action);
      });
    });
  }

  async processNaturalLanguageQuery(query) {
    const responseDiv = document.getElementById('ai-response');
    responseDiv.innerHTML = '<div class="ai-thinking">🤔 Understanding your request...</div>';
    
    try {
      const response = await fetch(`${this.baseURL}/api/ai-integration-hub?action=natural-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          userId: this.userContext.userId,
          context: {
            page: this.currentPage,
            portfolio: this.userContext.portfolio,
            history: this.conversationHistory
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.displayAIResponse(result);
        this.conversationHistory.push({ query, result, timestamp: Date.now() });
      } else {
        throw new Error('AI service unavailable');
      }
    } catch (error) {
      responseDiv.innerHTML = `<div class="ai-error">Sorry, I'm having trouble processing that request. Please try again.</div>`;
    }
  }

  displayAIResponse(result) {
    const responseDiv = document.getElementById('ai-response');
    
    let responseHTML = '';
    
    if (result.ai_understanding?.plain_english_explanation) {
      responseHTML += `<div style="margin-bottom: 10px;">
        <strong>Here's what I found:</strong><br>
        ${result.ai_understanding.plain_english_explanation.what_ill_do}
      </div>`;
    }
    
    if (result.execution_results?.results?.length > 0) {
      responseHTML += `<div style="margin-bottom: 10px;">
        <strong>Analysis Complete:</strong><br>
        ${result.execution_results.results.length} operations executed successfully
      </div>`;
    }
    
    if (result.follow_up_suggestions?.length > 0) {
      responseHTML += `<div style="margin-top: 10px;">
        <strong>Next suggestions:</strong><br>
        ${result.follow_up_suggestions.slice(0, 2).map(s => `• ${s.suggestion}`).join('<br>')}
      </div>`;
    }
    
    responseDiv.innerHTML = responseHTML || '<div>Analysis complete! Check the main interface for results.</div>';
  }

  enableSmartNavigation() {
    // Add smart navigation hints to existing navigation elements
    const navItems = document.querySelectorAll('nav a, .nav-link, .sidebar a');
    
    navItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        this.showNavigationHint(item);
      });
    });
  }

  enhanceFormsWithNL() {
    // Find forms and add AI auto-completion
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      // Add AI enhancement to input fields
      const inputs = form.querySelectorAll('input[type="text"], input[type="number"], select');
      
      inputs.forEach(input => {
        this.enhanceInputWithAI(input);
      });
    });
  }

  enhanceInputWithAI(input) {
    // Add smart auto-completion
    input.addEventListener('focus', async () => {
      const suggestions = await this.getSmartSuggestions(input);
      this.showInputSuggestions(input, suggestions);
    });
    
    // Auto-apply intelligent defaults
    input.addEventListener('blur', async () => {
      if (!input.value) {
        const smartDefault = await this.getIntelligentDefault(input);
        if (smartDefault) {
          input.value = smartDefault.value;
          this.showDefaultReasoning(input, smartDefault.reasoning);
        }
      }
    });
  }

  async getSmartSuggestions(input) {
    try {
      const response = await fetch(`${this.baseURL}/api/ai-magic-simplification?action=smart-autocomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input.value,
          context: {
            page: this.currentPage,
            field: input.name || input.id,
            form: this.getFormContext(input)
          },
          userProfile: this.userContext
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.ai_suggestions?.suggestions || [];
      }
    } catch (error) {
      console.error('Smart suggestions failed:', error);
    }
    
    return [];
  }

  enablePredictiveLoading() {
    // Monitor user actions and predict next needs
    this.setupActionMonitoring();
    
    // Preload likely next operations
    this.startPredictivePreloading();
  }

  setupActionMonitoring() {
    // Track user actions for predictive analysis
    document.addEventListener('click', (e) => {
      this.trackUserAction('click', e.target);
    });
    
    // Track form interactions
    document.addEventListener('input', (e) => {
      this.trackUserAction('input', e.target);
    });
  }

  trackUserAction(type, element) {
    const action = {
      type,
      element: element.tagName,
      id: element.id,
      class: element.className,
      page: this.currentPage,
      timestamp: Date.now()
    };
    
    this.userContext.recentActions.push(action);
    
    // Keep only last 20 actions
    if (this.userContext.recentActions.length > 20) {
      this.userContext.recentActions.shift();
    }
  }

  // Helper methods
  getUserId() {
    return localStorage.getItem('userId') || `user_${Date.now()}`;
  }

  getUserPreferences() {
    return JSON.parse(localStorage.getItem('userPreferences') || '{}');
  }

  getPortfolioContext() {
    // Extract portfolio data from current page if available
    return JSON.parse(localStorage.getItem('portfolioContext') || '{}');
  }

  getRecentActions() {
    return JSON.parse(sessionStorage.getItem('recentActions') || '[]');
  }

  getCurrentPageData() {
    // Extract relevant data from current page
    const data = {};
    
    // Get form data
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
      const formData = new FormData(form);
      data[`form_${index}`] = Object.fromEntries(formData.entries());
    });
    
    // Get visible charts/data
    const chartElements = document.querySelectorAll('[id*="chart"], [class*="chart"]');
    data.charts = chartElements.length;
    
    return data;
  }

  applyPageEnhancements(enhancements) {
    console.log('Applying AI enhancements:', enhancements);
    
    // Apply enhancements based on integration points
    if (enhancements.integration_points) {
      this.applyIntegrationPoints(enhancements.integration_points);
    }
    
    // Store enhancements for use
    this.currentEnhancements = enhancements;
  }

  applyIntegrationPoints(integrationPoints) {
    // Apply AI enhancements to specific DOM elements
    for (const [feature, selector] of Object.entries(integrationPoints)) {
      const element = document.querySelector(selector);
      if (element) {
        this.enhanceElement(element, feature);
      }
    }
  }

  enhanceElement(element, feature) {
    // Add AI capabilities to specific elements
    switch (feature) {
      case 'natural_language_input':
        this.addNaturalLanguageCapability(element);
        break;
      case 'smart_suggestions':
        this.addSmartSuggestions(element);
        break;
      case 'auto_configuration':
        this.addAutoConfiguration(element);
        break;
    }
  }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.aiClient = new AIIntegrationClient();
});

// Export for manual initialization if needed
window.AIIntegrationClient = AIIntegrationClient;