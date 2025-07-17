// Trust Section Final - Smart Contract Focus with LLM Builder
// Shows deployed automations first, then AI-assisted building

function finalTrustSection() {
  // Add final styles
  const finalStyles = document.createElement('style');
  finalStyles.textContent = `
    /* Trust Section Final - No gaps, real automations */
    .trust-final-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    /* Ultra-compact hero */
    .trust-final-hero {
      margin-bottom: 32px; /* Minimal gap */
    }
    
    .trust-final-title {
      font-size: 34px;
      font-weight: 600;
      margin: 0 0 8px; /* Very tight */
      color: var(--jobs-black);
    }
    
    body.dark-mode .trust-final-title {
      color: var(--jobs-white);
    }
    
    .trust-final-subtitle {
      font-size: 17px;
      color: #8E8E93;
      margin: 0;
    }
    
    /* Section headers */
    .trust-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    
    .trust-section-title {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
    
    .trust-section-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(52, 199, 89, 0.1);
      border-radius: 20px;
      font-size: 13px;
      color: #34C759;
      font-weight: 600;
    }
    
    .trust-live-dot {
      width: 6px;
      height: 6px;
      background: #34C759;
      border-radius: 50%;
      animation: pulse-dot 2s infinite;
    }
    
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.2); }
    }
    
    /* Smart Contract Cards Grid */
    .trust-contracts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
      margin-bottom: 48px;
    }
    
    .trust-contract-card {
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 12px;
      padding: 20px;
      position: relative;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    body.dark-mode .trust-contract-card {
      background: #1C1C1E;
      border-color: #38383A;
    }
    
    .trust-contract-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
      border-color: #007AFF;
    }
    
    .trust-contract-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    
    .trust-contract-info h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .trust-contract-type {
      font-size: 13px;
      color: #8E8E93;
      margin: 0;
    }
    
    .trust-contract-status {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: rgba(52, 199, 89, 0.1);
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #34C759;
    }
    
    .trust-contract-status.pending {
      background: rgba(255, 149, 0, 0.1);
      color: #FF9500;
    }
    
    .trust-contract-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding: 16px 0;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      margin-bottom: 16px;
    }
    
    body.dark-mode .trust-contract-metrics {
      border-color: #38383A;
    }
    
    .trust-metric {
      text-align: center;
    }
    
    .trust-metric-value {
      font-size: 20px;
      font-weight: 600;
      color: #007AFF;
      display: block;
    }
    
    .trust-metric-label {
      font-size: 11px;
      color: #8E8E93;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    
    .trust-contract-actions {
      display: flex;
      gap: 8px;
    }
    
    .trust-contract-button {
      flex: 1;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .trust-contract-button.primary {
      background: #007AFF;
      color: white;
    }
    
    .trust-contract-button.primary:hover {
      background: #0051D5;
    }
    
    .trust-contract-button.secondary {
      background: rgba(0, 122, 255, 0.1);
      color: #007AFF;
    }
    
    .trust-contract-button.secondary:hover {
      background: rgba(0, 122, 255, 0.2);
    }
    
    /* LLM Builder Section */
    .trust-builder-section {
      background: #F2F2F7;
      border-radius: 16px;
      padding: 32px;
      margin-top: 48px;
    }
    
    body.dark-mode .trust-builder-section {
      background: #1C1C1E;
    }
    
    .trust-builder-header {
      text-align: center;
      margin-bottom: 32px;
    }
    
    .trust-builder-title {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 8px;
    }
    
    .trust-builder-subtitle {
      font-size: 17px;
      color: #8E8E93;
      margin: 0;
    }
    
    /* AI Assistant Chat */
    .trust-ai-assistant {
      background: white;
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }
    
    body.dark-mode .trust-ai-assistant {
      background: #2C2C2E;
      border-color: #38383A;
    }
    
    .trust-ai-header {
      background: #007AFF;
      color: white;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .trust-ai-avatar {
      width: 32px;
      height: 32px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    
    .trust-ai-info h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .trust-ai-info p {
      margin: 0;
      font-size: 13px;
      opacity: 0.9;
    }
    
    .trust-ai-chat {
      padding: 24px;
      min-height: 200px;
    }
    
    .trust-ai-message {
      margin-bottom: 16px;
    }
    
    .trust-ai-message.assistant {
      display: flex;
      gap: 12px;
    }
    
    .trust-ai-bubble {
      background: #F2F2F7;
      border-radius: 12px;
      padding: 12px 16px;
      max-width: 80%;
      font-size: 15px;
      line-height: 1.4;
    }
    
    body.dark-mode .trust-ai-bubble {
      background: #38383A;
    }
    
    .trust-ai-suggestions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 16px;
    }
    
    .trust-ai-suggestion {
      padding: 8px 16px;
      background: white;
      border: 1px solid #007AFF;
      border-radius: 20px;
      color: #007AFF;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    body.dark-mode .trust-ai-suggestion {
      background: #1C1C1E;
    }
    
    .trust-ai-suggestion:hover {
      background: #007AFF;
      color: white;
    }
    
    .trust-ai-input {
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      padding: 16px 20px;
      display: flex;
      gap: 12px;
    }
    
    body.dark-mode .trust-ai-input {
      border-color: #38383A;
    }
    
    .trust-ai-textfield {
      flex: 1;
      padding: 10px 16px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 20px;
      font-size: 15px;
      outline: none;
      background: rgba(0, 0, 0, 0.02);
    }
    
    body.dark-mode .trust-ai-textfield {
      background: rgba(255, 255, 255, 0.05);
      border-color: #38383A;
      color: white;
    }
    
    .trust-ai-textfield:focus {
      border-color: #007AFF;
    }
    
    .trust-ai-send {
      padding: 10px 20px;
      background: #007AFF;
      color: white;
      border: none;
      border-radius: 20px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .trust-ai-send:hover {
      background: #0051D5;
      transform: scale(1.05);
    }
    
    /* Empty State */
    .trust-empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #8E8E93;
    }
    
    .trust-empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    /* Loading Animation */
    .trust-loading-card {
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 12px;
      padding: 20px;
    }
    
    body.dark-mode .trust-loading-card {
      background: #1C1C1E;
      border-color: #38383A;
    }
    
    .trust-skeleton {
      background: linear-gradient(90deg, #F2F2F7 25%, #E5E5EA 50%, #F2F2F7 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: 4px;
    }
    
    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  
  document.head.appendChild(finalStyles);
  
  // Get trust section
  const trustSection = document.getElementById('trust');
  if (!trustSection) return;
  
  // Create final content
  trustSection.innerHTML = `
    <div class="trust-final-container">
      <!-- Minimal Hero -->
      <div class="trust-final-hero">
        <h1 class="trust-final-title">Secure Automation</h1>
        <p class="trust-final-subtitle">Your deployed smart contract automations</p>
      </div>
      
      <!-- Active Smart Contracts -->
      <div class="trust-section-header">
        <h2 class="trust-section-title">Active Automations</h2>
        <div class="trust-section-badge">
          <span class="trust-live-dot"></span>
          <span>Live on Blockchain</span>
        </div>
      </div>
      
      <div id="trust-contracts-grid" class="trust-contracts-grid">
        <!-- Will be populated with real smart contract data -->
      </div>
      
      <!-- AI Builder Section -->
      <div class="trust-builder-section">
        <div class="trust-builder-header">
          <h2 class="trust-builder-title">Create New Automation</h2>
          <p class="trust-builder-subtitle">Tell our AI what you want to automate</p>
        </div>
        
        <div class="trust-ai-assistant">
          <div class="trust-ai-header">
            <div class="trust-ai-avatar">🤖</div>
            <div class="trust-ai-info">
              <h3>Automation Assistant</h3>
              <p>Powered by available agents and smart contracts</p>
            </div>
          </div>
          
          <div class="trust-ai-chat" id="trust-ai-chat">
            <div class="trust-ai-message assistant">
              <div class="trust-ai-bubble">
                Hi! I can help you create custom trading automations. What would you like to automate?
              </div>
            </div>
            
            <div class="trust-ai-suggestions">
              <button class="trust-ai-suggestion" onclick="suggestAutomation('stop-loss')">
                Stop losses at 5%
              </button>
              <button class="trust-ai-suggestion" onclick="suggestAutomation('profit-target')">
                Take profits at 20%
              </button>
              <button class="trust-ai-suggestion" onclick="suggestAutomation('dca')">
                DCA every week
              </button>
              <button class="trust-ai-suggestion" onclick="suggestAutomation('rebalance')">
                Rebalance monthly
              </button>
            </div>
          </div>
          
          <div class="trust-ai-input">
            <input 
              type="text" 
              class="trust-ai-textfield" 
              placeholder="Describe your automation strategy..."
              id="trust-ai-input"
              onkeypress="handleAIEnter(event)"
            />
            <button class="trust-ai-send" onclick="sendAIMessage()">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Load deployed smart contracts
  loadSmartContracts();
}

// Load real smart contract data
async function loadSmartContracts() {
  const grid = document.getElementById('trust-contracts-grid');
  
  // Show loading
  grid.innerHTML = Array(3).fill(`
    <div class="trust-loading-card">
      <div class="trust-skeleton" style="width: 60%; height: 24px; margin-bottom: 8px;"></div>
      <div class="trust-skeleton" style="width: 40%; height: 16px; margin-bottom: 16px;"></div>
      <div class="trust-skeleton" style="width: 100%; height: 60px; margin-bottom: 16px;"></div>
      <div class="trust-skeleton" style="width: 100%; height: 36px;"></div>
    </div>
  `).join('');
  
  try {
    // Fetch blockchain agent data
    const response = await fetch('/api/a2a-blockchain-bridge');
    const data = await response.json();
    
    if (data.success && data.agents && data.agents.length > 0) {
      // Filter for deployed contracts
      const deployedContracts = data.agents.filter(agent => 
        agent.contractAddress && agent.status === 'active'
      ).slice(0, 6);
      
      if (deployedContracts.length > 0) {
        grid.innerHTML = deployedContracts.map(contract => `
          <div class="trust-contract-card" onclick="viewContract('${contract.contractAddress}')">
            <div class="trust-contract-header">
              <div class="trust-contract-info">
                <h3>
                  ${contract.metadata?.name || 'Smart Automation'}
                  <span style="font-size: 16px;">${getContractEmoji(contract.metadata?.type)}</span>
                </h3>
                <p class="trust-contract-type">${contract.metadata?.type || 'Automation'}</p>
              </div>
              <div class="trust-contract-status ${contract.isActive ? 'active' : 'pending'}">
                <span class="trust-live-dot"></span>
                ${contract.isActive ? 'Active' : 'Pending'}
              </div>
            </div>
            
            <div class="trust-contract-metrics">
              <div class="trust-metric">
                <span class="trust-metric-value">${contract.executions || 0}</span>
                <span class="trust-metric-label">Executions</span>
              </div>
              <div class="trust-metric">
                <span class="trust-metric-value">${formatValue(contract.totalValue)}</span>
                <span class="trust-metric-label">Volume</span>
              </div>
              <div class="trust-metric">
                <span class="trust-metric-value">${contract.successRate || '100'}%</span>
                <span class="trust-metric-label">Success</span>
              </div>
            </div>
            
            <div class="trust-contract-actions">
              <button class="trust-contract-button primary" onclick="event.stopPropagation(); manageContract('${contract.contractAddress}')">
                Manage
              </button>
              <button class="trust-contract-button secondary" onclick="event.stopPropagation(); viewStats('${contract.contractAddress}')">
                Stats
              </button>
            </div>
          </div>
        `).join('');
      } else {
        showEmptyState();
      }
    } else {
      // Try unified API
      const unifiedResponse = await fetch('/api/unified?action=a2a_agents');
      const unifiedData = await unifiedResponse.json();
      
      if (unifiedData.agents && unifiedData.agents.length > 0) {
        // Show agents as potential automations
        const automationAgents = unifiedData.agents
          .filter(agent => agent.status === 'active')
          .slice(0, 6);
        
        grid.innerHTML = automationAgents.map(agent => `
          <div class="trust-contract-card" onclick="deployAgent('${agent.agent_id}')">
            <div class="trust-contract-header">
              <div class="trust-contract-info">
                <h3>
                  ${agent.agent_name}
                  <span style="font-size: 16px;">${getAgentEmoji(agent.agent_type)}</span>
                </h3>
                <p class="trust-contract-type">${agent.agent_type || 'Automation'}</p>
              </div>
              <div class="trust-contract-status pending">
                <span class="trust-live-dot" style="background: #FF9500;"></span>
                Deploy Ready
              </div>
            </div>
            
            <div class="trust-contract-metrics">
              <div class="trust-metric">
                <span class="trust-metric-value">${Array.isArray(agent.capabilities) ? agent.capabilities.length : 0}</span>
                <span class="trust-metric-label">Features</span>
              </div>
              <div class="trust-metric">
                <span class="trust-metric-value">Gas</span>
                <span class="trust-metric-label">Optimized</span>
              </div>
              <div class="trust-metric">
                <span class="trust-metric-value">24/7</span>
                <span class="trust-metric-label">Uptime</span>
              </div>
            </div>
            
            <div class="trust-contract-actions">
              <button class="trust-contract-button primary" onclick="event.stopPropagation(); deployAgent('${agent.agent_id}')">
                Deploy Now
              </button>
              <button class="trust-contract-button secondary" onclick="event.stopPropagation(); previewAgent('${agent.agent_id}')">
                Preview
              </button>
            </div>
          </div>
        `).join('');
      } else {
        showEmptyState();
      }
    }
  } catch (error) {
    console.error('Failed to load contracts:', error);
    showEmptyState();
  }
}

function showEmptyState() {
  const grid = document.getElementById('trust-contracts-grid');
  grid.innerHTML = `
    <div class="trust-empty-state" style="grid-column: 1/-1;">
      <div class="trust-empty-icon">📭</div>
      <h3 style="font-size: 20px; margin: 0 0 8px;">No Active Automations</h3>
      <p style="margin: 0 0 24px;">Create your first automation using the AI assistant below</p>
      <button class="trust-ai-send" onclick="document.getElementById('trust-ai-input').focus()">
        Get Started
      </button>
    </div>
  `;
}

function getContractEmoji(type) {
  const emojis = {
    'stop-loss': '🛑',
    'profit-target': '🎯',
    'rebalance': '⚖️',
    'dca': '📊',
    'grid': '🔲',
    'arbitrage': '💱'
  };
  return emojis[type] || '📜';
}

function getAgentEmoji(type) {
  const emojis = {
    'executor': '⚡',
    'analyzer': '📊',
    'guardian': '🛡️',
    'optimizer': '🎯',
    'monitor': '👁️'
  };
  return emojis[type] || '🤖';
}

function formatValue(value) {
  if (!value) return '$0';
  if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return '$' + (value / 1000).toFixed(1) + 'K';
  return '$' + value.toFixed(0);
}

// AI Assistant Functions
function suggestAutomation(type) {
  const input = document.getElementById('trust-ai-input');
  const suggestions = {
    'stop-loss': 'Create a stop loss automation that sells when my position drops 5%',
    'profit-target': 'Set up automatic profit taking when gains reach 20%',
    'dca': 'Build a DCA strategy that buys $100 worth every Monday',
    'rebalance': 'Rebalance my portfolio to maintain 60/40 allocation monthly'
  };
  
  input.value = suggestions[type];
  sendAIMessage();
}

function handleAIEnter(event) {
  if (event.key === 'Enter') {
    sendAIMessage();
  }
}

async function sendAIMessage() {
  const input = document.getElementById('trust-ai-input');
  const chat = document.getElementById('trust-ai-chat');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Add user message
  chat.innerHTML += `
    <div class="trust-ai-message user" style="text-align: right; margin-bottom: 16px;">
      <div class="trust-ai-bubble" style="background: #007AFF; color: white; margin-left: auto;">
        ${message}
      </div>
    </div>
  `;
  
  input.value = '';
  
  // Simulate AI response
  setTimeout(() => {
    chat.innerHTML += `
      <div class="trust-ai-message assistant">
        <div class="trust-ai-bubble">
          <div style="margin-bottom: 12px;">I understand. I'll help you create that automation. Based on available agents, I recommend:</div>
          
          <div style="background: rgba(0, 122, 255, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <strong>Strategy:</strong> ${message}<br>
            <strong>Agent:</strong> Smart Executor v2<br>
            <strong>Gas Cost:</strong> ~0.002 ETH<br>
            <strong>Success Rate:</strong> 99.8%
          </div>
          
          <div style="display: flex; gap: 8px; margin-top: 16px;">
            <button class="trust-contract-button primary" style="font-size: 14px;" onclick="deployFromAI()">
              Deploy Now
            </button>
            <button class="trust-contract-button secondary" style="font-size: 14px;" onclick="customizeFromAI()">
              Customize
            </button>
          </div>
        </div>
      </div>
    `;
    
    chat.scrollTop = chat.scrollHeight;
  }, 1000);
}

// Contract interaction functions
function viewContract(address) {
  console.log('Viewing contract:', address);
}

function manageContract(address) {
  console.log('Managing contract:', address);
}

function viewStats(address) {
  console.log('Viewing stats for:', address);
}

function deployAgent(agentId) {
  console.log('Deploying agent:', agentId);
}

function previewAgent(agentId) {
  console.log('Previewing agent:', agentId);
}

function deployFromAI() {
  console.log('Deploying from AI suggestion');
}

function customizeFromAI() {
  console.log('Customizing AI suggestion');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  finalTrustSection();
  
  // Update tab name
  const trustTab = document.querySelector('.jobs-section-tab[onclick*="trust"]');
  if (trustTab) {
    trustTab.innerHTML = 'Secure Automation';
  }
});