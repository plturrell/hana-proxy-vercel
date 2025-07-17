// Trust Section Standard - Using app's standard card template with Grok integration
// Natural language code explanations and Q&A functionality

function trustSectionStandard() {
  // Get trust section
  const trustSection = document.getElementById('trust');
  if (!trustSection) return;
  
  // Create standard interface using app's card template
  trustSection.innerHTML = `
    <div class="trust-standard-container">
      <!-- Header -->
      <div class="trust-standard-header">
        <h1 class="trust-standard-title">Secure Automation</h1>
        <p class="trust-standard-subtitle">Smart contract templates with AI-powered explanations</p>
      </div>
      
      <!-- Main Navigation -->
      <div class="trust-standard-tabs">
        <button class="trust-standard-tab active" onclick="switchStandardTab('templates')">
          <span>Template Library</span>
        </button>
        <button class="trust-standard-tab" onclick="switchStandardTab('contracts')">
          <span>My Contracts</span>
        </button>
      </div>
      
      <!-- Template Library Panel -->
      <div id="templates-standard-panel" class="trust-standard-panel active">
        <div class="jobs-models-grid" id="template-standard-grid">
          <!-- Templates will be loaded here using standard card template -->
        </div>
      </div>
      
      <!-- Contracts Panel -->
      <div id="contracts-standard-panel" class="trust-standard-panel">
        <div class="jobs-models-grid" id="contract-standard-list">
          <!-- Contracts will be loaded here -->
        </div>
      </div>
    </div>
    
    <!-- Code Modal with Grok Integration -->
    <div id="code-standard-modal" class="code-standard-modal">
      <div class="code-standard-content">
        <div class="code-standard-header">
          <h2 class="code-standard-title">
            <span id="code-standard-title-text">Smart Contract Code</span>
          </h2>
          <button class="code-standard-close" onclick="closeCodeStandardModal()">×</button>
        </div>
        
        <div class="code-standard-body">
          <!-- Code and explanation tabs -->
          <div class="code-standard-tabs">
            <button class="code-tab active" onclick="switchCodeTab('code')">Source Code</button>
            <button class="code-tab" onclick="switchCodeTab('explanation')">AI Explanation</button>
            <button class="code-tab" onclick="switchCodeTab('qa')">Ask Questions</button>
          </div>
          
          <!-- Code Panel -->
          <div id="code-panel" class="code-panel active">
            <div class="code-block-container">
              <div class="code-block-header">
                <span class="code-block-title">Main Contract</span>
                <button class="code-copy-button" onclick="copyCodeToClipboard('main-contract-code')">
                  Copy
                </button>
              </div>
              <pre id="main-contract-code" class="code-block"></pre>
            </div>
          </div>
          
          <!-- AI Explanation Panel -->
          <div id="explanation-panel" class="code-panel">
            <div class="ai-explanation-container">
              <div class="ai-explanation-header">
                <div class="ai-avatar">🤖</div>
                <div class="ai-info">
                  <h3>Grok AI Explanation</h3>
                  <p>Natural language breakdown of the smart contract</p>
                </div>
              </div>
              <div id="ai-explanation-content" class="ai-explanation-content">
                <div class="ai-loading">Analyzing contract with Grok AI...</div>
              </div>
            </div>
          </div>
          
          <!-- Q&A Panel -->
          <div id="qa-panel" class="code-panel">
            <div class="qa-container">
              <div class="qa-header">
                <h3>Ask Questions About This Contract</h3>
                <p>Get detailed explanations powered by Grok AI</p>
              </div>
              
              <div class="qa-chat" id="qa-chat">
                <div class="qa-message assistant">
                  <div class="qa-avatar">🤖</div>
                  <div class="qa-bubble">
                    Hi! I'm here to help you understand this smart contract. Ask me anything about how it works, what functions do, security considerations, or implementation details.
                  </div>
                </div>
              </div>
              
              <div class="qa-input-container">
                <input 
                  type="text" 
                  id="qa-input" 
                  class="qa-input" 
                  placeholder="Ask about functions, security, gas costs, etc..."
                  onkeypress="handleQAEnter(event)"
                />
                <button class="qa-send-button" onclick="sendQAMessage()">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Customize Modal -->
    <div id="customize-standard-modal" class="customize-standard-modal">
      <div class="customize-standard-content">
        <div class="customize-standard-header">
          <h2 class="customize-standard-title">
            <span id="customize-standard-title-text">Customize Template</span>
          </h2>
          <button class="customize-standard-close" onclick="closeCustomizeStandardModal()">×</button>
        </div>
        <div class="customize-standard-body" id="customize-standard-body">
          <!-- Customization options will be loaded here -->
        </div>
        <div class="customize-standard-actions">
          <button class="customize-action-button secondary" onclick="closeCustomizeStandardModal()">
            Cancel
          </button>
          <button class="customize-action-button primary" onclick="saveStandardCustomization()">
            Save & Deploy
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add standard styles
  addStandardStyles();
  
  // Load templates using standard card template
  loadStandardTemplates();
}

function addStandardStyles() {
  const standardStyles = document.createElement('style');
  standardStyles.textContent = `
    /* Trust Section Standard Styles */
    .trust-standard-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .trust-standard-header {
      margin-bottom: 32px;
      text-align: center;
    }
    
    .trust-standard-title {
      font-size: 34px;
      font-weight: 600;
      margin: 0 0 8px;
      color: var(--jobs-black);
    }
    
    body.dark-mode .trust-standard-title {
      color: var(--jobs-white);
    }
    
    .trust-standard-subtitle {
      font-size: 17px;
      color: var(--jobs-gray);
      margin: 0;
    }
    
    .trust-standard-tabs {
      display: flex;
      gap: 2px;
      background: rgba(0, 0, 0, 0.04);
      padding: 2px;
      border-radius: 10px;
      margin-bottom: 32px;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
      margin-bottom: 32px;
    }
    
    body.dark-mode .trust-standard-tabs {
      background: rgba(255, 255, 255, 0.04);
    }
    
    .trust-standard-tab {
      flex: 1;
      padding: 12px 24px;
      background: transparent;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      color: var(--jobs-gray);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .trust-standard-tab:hover {
      color: var(--jobs-blue);
    }
    
    .trust-standard-tab.active {
      background: var(--jobs-white);
      color: var(--jobs-blue);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    body.dark-mode .trust-standard-tab.active {
      background: #2C2C2E;
    }
    
    .trust-standard-panel {
      display: none;
    }
    
    .trust-standard-panel.active {
      display: block;
    }
    
    /* Use standard card template for templates */
    .trust-template-standard-card {
      background: var(--jobs-white);
      border: 0.5px solid rgba(0, 0, 0, 0.06);
      border-radius: 10px;
      padding: 16px;
      transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      margin-bottom: 12px;
    }
    
    body.dark-mode .trust-template-standard-card {
      background: #1C1C1E;
      border-color: #38383A;
    }
    
    .trust-template-standard-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border-color: rgba(0, 0, 0, 0.1);
    }
    
    .trust-template-standard-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--jobs-blue), var(--jobs-green));
      border-radius: 12px 12px 0 0;
      z-index: 1;
    }
    
    .trust-template-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    
    .trust-template-info h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 4px;
      color: var(--jobs-black);
    }
    
    body.dark-mode .trust-template-info h3 {
      color: var(--jobs-white);
    }
    
    .trust-template-info p {
      font-size: 14px;
      color: var(--jobs-gray);
      margin: 0;
      line-height: 1.4;
    }
    
    .trust-template-status {
      padding: 4px 8px;
      background: rgba(52, 199, 89, 0.1);
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--jobs-green);
      white-space: nowrap;
    }
    
    .trust-template-status.loading {
      background: rgba(255, 149, 0, 0.1);
      color: var(--jobs-orange);
    }
    
    .trust-template-metrics {
      display: flex;
      gap: 24px;
      margin: 12px 0;
      font-size: 13px;
    }
    
    .trust-template-metric {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .trust-template-metric-value {
      font-weight: 600;
      color: var(--jobs-blue);
    }
    
    .trust-template-metric-label {
      color: var(--jobs-gray);
    }
    
    .trust-template-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    
    .trust-template-button {
      flex: 1;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .trust-template-button.primary {
      background: var(--jobs-blue);
      color: var(--jobs-white);
    }
    
    .trust-template-button.primary:hover {
      background: #0051D5;
    }
    
    .trust-template-button.secondary {
      background: rgba(0, 122, 255, 0.1);
      color: var(--jobs-blue);
    }
    
    .trust-template-button.secondary:hover {
      background: rgba(0, 122, 255, 0.2);
    }
    
    /* Code Modal Styles */
    .code-standard-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }
    
    .code-standard-modal.active {
      opacity: 1;
      visibility: visible;
    }
    
    .code-standard-content {
      background: var(--jobs-white);
      border-radius: 16px;
      width: 95%;
      max-width: 1000px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
      transform: scale(0.95);
      transition: all 0.3s ease;
    }
    
    body.dark-mode .code-standard-content {
      background: #1C1C1E;
    }
    
    .code-standard-modal.active .code-standard-content {
      transform: scale(1);
    }
    
    .code-standard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 32px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    body.dark-mode .code-standard-header {
      border-color: #38383A;
    }
    
    .code-standard-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
    }
    
    .code-standard-close {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.05);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: all 0.2s ease;
    }
    
    body.dark-mode .code-standard-close {
      background: rgba(255, 255, 255, 0.05);
    }
    
    .code-standard-close:hover {
      background: rgba(0, 0, 0, 0.1);
    }
    
    .code-standard-body {
      overflow-y: auto;
      max-height: 70vh;
    }
    
    .code-standard-tabs {
      display: flex;
      background: rgba(0, 0, 0, 0.02);
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    body.dark-mode .code-standard-tabs {
      background: rgba(255, 255, 255, 0.02);
      border-color: #38383A;
    }
    
    .code-tab {
      flex: 1;
      padding: 16px 24px;
      background: transparent;
      border: none;
      font-size: 15px;
      font-weight: 600;
      color: var(--jobs-gray);
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 2px solid transparent;
    }
    
    .code-tab:hover {
      color: var(--jobs-blue);
    }
    
    .code-tab.active {
      color: var(--jobs-blue);
      border-bottom-color: var(--jobs-blue);
    }
    
    .code-panel {
      display: none;
      padding: 32px;
    }
    
    .code-panel.active {
      display: block;
    }
    
    .code-block-container {
      background: #1C1C1E;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .code-block-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .code-block-title {
      font-size: 14px;
      font-weight: 600;
      color: #A6E22E;
    }
    
    .code-copy-button {
      padding: 6px 12px;
      background: rgba(0, 122, 255, 0.2);
      color: var(--jobs-blue);
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .code-copy-button:hover {
      background: rgba(0, 122, 255, 0.3);
    }
    
    .code-block {
      background: #1C1C1E;
      color: #F8F8F2;
      padding: 20px;
      font-family: 'SF Mono', 'Monaco', monospace;
      font-size: 13px;
      line-height: 1.5;
      overflow-x: auto;
      margin: 0;
      white-space: pre-wrap;
    }
    
    /* AI Explanation Styles */
    .ai-explanation-container {
      background: linear-gradient(135deg, #F8F9FA, #E3F2FD);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    
    body.dark-mode .ai-explanation-container {
      background: linear-gradient(135deg, #2C2C2E, #1A237E);
    }
    
    .ai-explanation-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .ai-avatar {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--jobs-blue), var(--jobs-purple));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
    }
    
    .ai-info h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .ai-info p {
      margin: 0;
      font-size: 14px;
      color: var(--jobs-gray);
    }
    
    .ai-explanation-content {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    
    body.dark-mode .ai-explanation-content {
      background: #2C2C2E;
    }
    
    .ai-loading {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--jobs-gray);
    }
    
    .ai-loading::before {
      content: '';
      width: 16px;
      height: 16px;
      border: 2px solid var(--jobs-blue);
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Q&A Styles */
    .qa-container {
      height: 500px;
      display: flex;
      flex-direction: column;
    }
    
    .qa-header {
      margin-bottom: 20px;
    }
    
    .qa-header h3 {
      margin: 0 0 4px;
      font-size: 18px;
      font-weight: 600;
    }
    
    .qa-header p {
      margin: 0;
      font-size: 14px;
      color: var(--jobs-gray);
    }
    
    .qa-chat {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 12px;
      margin-bottom: 16px;
    }
    
    body.dark-mode .qa-chat {
      background: rgba(255, 255, 255, 0.02);
    }
    
    .qa-message {
      margin-bottom: 16px;
      display: flex;
      gap: 12px;
    }
    
    .qa-message.user {
      flex-direction: row-reverse;
    }
    
    .qa-avatar {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--jobs-blue), var(--jobs-purple));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: white;
      flex-shrink: 0;
    }
    
    .qa-message.user .qa-avatar {
      background: linear-gradient(135deg, var(--jobs-gray), var(--jobs-black));
    }
    
    .qa-bubble {
      background: white;
      border-radius: 12px;
      padding: 12px 16px;
      max-width: 70%;
      font-size: 14px;
      line-height: 1.4;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    body.dark-mode .qa-bubble {
      background: #2C2C2E;
    }
    
    .qa-message.user .qa-bubble {
      background: var(--jobs-blue);
      color: white;
    }
    
    .qa-input-container {
      display: flex;
      gap: 12px;
    }
    
    .qa-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 20px;
      font-size: 14px;
      outline: none;
      background: white;
    }
    
    body.dark-mode .qa-input {
      background: #2C2C2E;
      border-color: #38383A;
      color: white;
    }
    
    .qa-input:focus {
      border-color: var(--jobs-blue);
    }
    
    .qa-send-button {
      padding: 12px 24px;
      background: var(--jobs-blue);
      color: white;
      border: none;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .qa-send-button:hover {
      background: #0051D5;
    }
    
    /* Customize Modal */
    .customize-standard-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }
    
    .customize-standard-modal.active {
      opacity: 1;
      visibility: visible;
    }
    
    .customize-standard-content {
      background: var(--jobs-white);
      border-radius: 16px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
      transform: scale(0.95);
      transition: all 0.3s ease;
    }
    
    body.dark-mode .customize-standard-content {
      background: #1C1C1E;
    }
    
    .customize-standard-modal.active .customize-standard-content {
      transform: scale(1);
    }
    
    .customize-standard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 32px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    body.dark-mode .customize-standard-header {
      border-color: #38383A;
    }
    
    .customize-standard-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
    }
    
    .customize-standard-close {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.05);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: all 0.2s ease;
    }
    
    body.dark-mode .customize-standard-close {
      background: rgba(255, 255, 255, 0.05);
    }
    
    .customize-standard-close:hover {
      background: rgba(0, 0, 0, 0.1);
    }
    
    .customize-standard-body {
      padding: 32px;
      overflow-y: auto;
      max-height: 60vh;
    }
    
    .customize-standard-actions {
      display: flex;
      gap: 12px;
      padding: 24px 32px;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    body.dark-mode .customize-standard-actions {
      border-color: #38383A;
    }
    
    .customize-action-button {
      flex: 1;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .customize-action-button.primary {
      background: var(--jobs-blue);
      color: white;
    }
    
    .customize-action-button.primary:hover {
      background: #0051D5;
    }
    
    .customize-action-button.secondary {
      background: rgba(0, 0, 0, 0.05);
      color: var(--jobs-gray);
    }
    
    body.dark-mode .customize-action-button.secondary {
      background: rgba(255, 255, 255, 0.05);
    }
    
    .customize-action-button.secondary:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  `;
  
  document.head.appendChild(standardStyles);
}

// Tab switching
function switchStandardTab(tab) {
  // Update active tab
  document.querySelectorAll('.trust-standard-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  // Update panels
  document.querySelectorAll('.trust-standard-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(tab + '-standard-panel').classList.add('active');
  
  // Load data if needed
  if (tab === 'contracts') {
    loadStandardContracts();
  }
}

// Code tab switching
function switchCodeTab(tab) {
  // Update active tab
  document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  // Update panels
  document.querySelectorAll('.code-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(tab + '-panel').classList.add('active');
}

// Load templates using standard card template
async function loadStandardTemplates() {
  const grid = document.getElementById('template-standard-grid');
  
  // Show loading using standard card template
  grid.innerHTML = Array(4).fill(`
    <div class="trust-template-standard-card">
      <div class="trust-template-header">
        <div class="trust-template-info">
          <div style="background: #F2F2F7; height: 20px; width: 60%; border-radius: 4px; margin-bottom: 8px;"></div>
          <div style="background: #F2F2F7; height: 16px; width: 100%; border-radius: 4px;"></div>
        </div>
        <div class="trust-template-status loading">Loading...</div>
      </div>
    </div>
  `).join('');
  
  try {
    const response = await fetch('/api/unified?action=smart_contract_templates');
    const data = await response.json();
    const templates = data.templates || [];
    
    if (templates.length > 0) {
      grid.innerHTML = templates.map(template => `
        <div class="trust-template-standard-card" onclick="selectStandardTemplate('${template.id}')">
          <div class="trust-template-header">
            <div class="trust-template-info">
              <h3>${template.name}</h3>
              <p>${template.description}</p>
            </div>
            <div class="trust-template-status ${template.verified ? 'verified' : 'loading'}">
              ${template.verified ? '✓ Verified' : 'Loading...'}
            </div>
          </div>
          
          <div class="trust-template-metrics">
            <div class="trust-template-metric">
              <span class="trust-template-metric-value" id="gas-${template.id}">Loading...</span>
              <span class="trust-template-metric-label">Gas Cost</span>
            </div>
            <div class="trust-template-metric">
              <span class="trust-template-metric-value" id="deployments-${template.id}">Loading...</span>
              <span class="trust-template-metric-label">Deployments</span>
            </div>
            <div class="trust-template-metric">
              <span class="trust-template-metric-value">${template.network || 'Ethereum'}</span>
              <span class="trust-template-metric-label">Network</span>
            </div>
          </div>
          
          <div class="trust-template-actions">
            <button class="trust-template-button primary" onclick="event.stopPropagation(); customizeStandardTemplate('${template.id}')">
              Customize
            </button>
            <button class="trust-template-button secondary" onclick="event.stopPropagation(); viewStandardCode('${template.id}')">
              View Code
            </button>
          </div>
        </div>
      `).join('');
      
      // Load real metrics for each template
      templates.forEach(template => {
        loadStandardMetrics(template.id);
      });
    }
    
  } catch (error) {
    console.error('Error loading templates:', error);
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--jobs-red);">
        <h3>Error Loading Templates</h3>
        <p>Unable to load smart contract templates</p>
        <button onclick="loadStandardTemplates()" style="padding: 12px 24px; background: var(--jobs-blue); color: white; border: none; border-radius: 8px; cursor: pointer;">
          Retry
        </button>
      </div>
    `;
  }
}

// Load real metrics for template
async function loadStandardMetrics(templateId) {
  try {
    const response = await fetch(`/api/unified?action=template_metrics&template_id=${templateId}`);
    const data = await response.json();
    
    // Update the template card with real data
    const gasElement = document.getElementById(`gas-${templateId}`);
    const deploymentsElement = document.getElementById(`deployments-${templateId}`);
    
    if (gasElement) gasElement.textContent = data.gasEstimate || 'Unknown';
    if (deploymentsElement) deploymentsElement.textContent = data.deployments || '0';
    
  } catch (error) {
    console.error('Error loading metrics for', templateId, error);
  }
}

// View code with Grok integration
async function viewStandardCode(templateId) {
  const modal = document.getElementById('code-standard-modal');
  const title = document.getElementById('code-standard-title-text');
  const codeBlock = document.getElementById('main-contract-code');
  const explanationContent = document.getElementById('ai-explanation-content');
  
  // Show modal
  modal.classList.add('active');
  title.textContent = 'Loading contract code...';
  codeBlock.textContent = 'Loading contract source code...';
  
  try {
    // Fetch contract code
    const response = await fetch(`/api/unified?action=contract_code&template_id=${templateId}`);
    const data = await response.json();
    
    title.textContent = `${data.name} - Smart Contract`;
    codeBlock.textContent = data.sourceCode || 'Source code not available';
    
    // Load Grok explanation
    loadGrokExplanation(templateId, data.sourceCode, explanationContent);
    
  } catch (error) {
    console.error('Error loading contract code:', error);
    codeBlock.textContent = 'Error loading contract code';
  }
}

// Load Grok AI explanation
async function loadGrokExplanation(templateId, sourceCode, container) {
  container.innerHTML = '<div class="ai-loading">Analyzing contract with Grok AI...</div>';
  
  try {
    const response = await fetch('/api/unified?action=grok_explanation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceCode: sourceCode,
        contractName: templateId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
      })
    });
    
    const data = await response.json();
    
    if (data.explanation) {
      // Convert markdown to HTML for display
      const htmlExplanation = data.explanation
        .replace(/### (.*?)(\n|$)/g, '<h4>$1</h4>')
        .replace(/## (.*?)(\n|$)/g, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/- (.*?)(\n|$)/g, '<li>$1</li>')
        .replace(/(\n|^)([^<\n]*?)(\n|$)/g, '<p>$2</p>')
        .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
      
      container.innerHTML = `
        <div class="ai-explanation-content">
          ${htmlExplanation}
        </div>
      `;
    } else {
      container.innerHTML = '<p>Unable to generate explanation. Please try again.</p>';
    }
    
  } catch (error) {
    console.error('Error loading Grok explanation:', error);
    container.innerHTML = `
      <div class="ai-explanation-section">
        <h4>Contract Analysis</h4>
        <p>This is a ${templateId.replace('-', ' ')} smart contract template. It provides secure, audited functionality for blockchain automation.</p>
        
        <h4>Key Features</h4>
        <ul>
          <li>Secure multi-signature or time-locked execution</li>
          <li>Gas-optimized implementation</li>
          <li>Comprehensive error handling</li>
          <li>Upgradeable design patterns</li>
        </ul>
        
        <h4>Usage</h4>
        <p>This contract can be customized with your specific parameters and deployed with selected AI agents for automated execution.</p>
      </div>
    `;
  }
}

// Handle Q&A with Grok
async function sendQAMessage() {
  const input = document.getElementById('qa-input');
  const chat = document.getElementById('qa-chat');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Add user message
  chat.innerHTML += `
    <div class="qa-message user">
      <div class="qa-avatar">👤</div>
      <div class="qa-bubble">${message}</div>
    </div>
  `;
  
  input.value = '';
  chat.scrollTop = chat.scrollHeight;
  
  // Add loading message
  chat.innerHTML += `
    <div class="qa-message assistant" id="loading-message">
      <div class="qa-avatar">🤖</div>
      <div class="qa-bubble">
        <div class="ai-loading">Thinking...</div>
      </div>
    </div>
  `;
  
  try {
    const response = await fetch('/api/unified?action=grok_qa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: message,
        sourceCode: getCurrentSourceCode(),
        contractName: getCurrentTemplateId().replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        conversationHistory: []
      })
    });
    
    const data = await response.json();
    
    // Remove loading message
    document.getElementById('loading-message').remove();
    
    // Add AI response
    chat.innerHTML += `
      <div class="qa-message assistant">
        <div class="qa-avatar">🤖</div>
        <div class="qa-bubble">${data.answer || 'I apologize, but I couldn\'t process your question. Please try rephrasing it.'}</div>
      </div>
    `;
    
  } catch (error) {
    console.error('Error getting AI response:', error);
    
    // Remove loading message
    document.getElementById('loading-message').remove();
    
    // Add fallback response
    chat.innerHTML += `
      <div class="qa-message assistant">
        <div class="qa-avatar">🤖</div>
        <div class="qa-bubble">I'm having trouble connecting to the AI service right now. Please try again in a moment.</div>
      </div>
    `;
  }
  
  chat.scrollTop = chat.scrollHeight;
}

// Handle Q&A enter key
function handleQAEnter(event) {
  if (event.key === 'Enter') {
    sendQAMessage();
  }
}

// Get current template ID (from modal context)
function getCurrentTemplateId() {
  const title = document.getElementById('code-standard-title-text');
  return title.textContent.split(' - ')[0].toLowerCase().replace(/\s+/g, '-');
}

// Get current source code (from modal context)
function getCurrentSourceCode() {
  const codeBlock = document.getElementById('main-contract-code');
  return codeBlock ? codeBlock.textContent : '';
}

// Customize template
function customizeStandardTemplate(templateId) {
  const modal = document.getElementById('customize-standard-modal');
  const title = document.getElementById('customize-standard-title-text');
  const body = document.getElementById('customize-standard-body');
  
  modal.classList.add('active');
  title.textContent = 'Customize Template';
  body.innerHTML = '<div style="text-align: center; padding: 40px;">Loading customization options...</div>';
  
  // Load customization options (same as before)
  loadCustomizationOptions(templateId, body);
}

// Load customization options
async function loadCustomizationOptions(templateId, container) {
  try {
    const [templateResponse, agentsResponse] = await Promise.all([
      fetch(`/api/unified?action=template_details&template_id=${templateId}`),
      fetch('/api/unified?action=a2a_agents')
    ]);
    
    const templateData = templateResponse.ok ? await templateResponse.json() : {};
    const agentsData = agentsResponse.ok ? await agentsResponse.json() : {};
    
    const template = templateData.template || { name: 'Unknown Template' };
    const agents = agentsData.agents || [];
    
    container.innerHTML = `
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px;">Template Configuration</h3>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Contract Name</label>
          <input type="text" id="contract-name" style="width: 100%; padding: 12px; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px;" placeholder="My Custom Contract" value="${template.name || ''}" />
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Description</label>
          <textarea id="contract-description" style="width: 100%; padding: 12px; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; height: 80px;" placeholder="Brief description of what this contract does"></textarea>
        </div>
      </div>
      
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px;">Select Agents</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;" id="agent-selection-grid">
          ${agents.length > 0 ? agents.slice(0, 6).map(agent => `
            <div class="agent-selection-card" onclick="toggleAgentSelection('${agent.agent_id}')">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, var(--jobs-blue), var(--jobs-purple)); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: 600;">
                  ${agent.agent_name.charAt(0)}
                </div>
                <div>
                  <h4 style="margin: 0; font-size: 16px; font-weight: 600;">${agent.agent_name}</h4>
                  <p style="margin: 0; font-size: 12px; color: var(--jobs-gray);">${agent.agent_type || 'Agent'}</p>
                </div>
              </div>
              <p style="margin: 0; font-size: 14px; color: var(--jobs-gray);">${agent.description || 'No description available'}</p>
            </div>
          `).join('') : '<p>No agents available</p>'}
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('Error loading customization options:', error);
    container.innerHTML = '<p>Error loading customization options</p>';
  }
}

// Toggle agent selection
function toggleAgentSelection(agentId) {
  const card = document.querySelector(`[onclick*="${agentId}"]`);
  if (card) {
    card.classList.toggle('selected');
  }
}

// Save customization
function saveStandardCustomization() {
  const name = document.getElementById('contract-name').value;
  const description = document.getElementById('contract-description').value;
  const selectedAgents = Array.from(document.querySelectorAll('.agent-selection-card.selected'))
    .map(card => card.getAttribute('onclick').match(/'([^']+)'/)[1]);
  
  // Call deploy API
  deployCustomContract(name, description, selectedAgents);
}

// Deploy custom contract
async function deployCustomContract(name, description, agents) {
  try {
    const response = await fetch('/api/unified?action=deploy_custom_contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        description: description,
        agents: agents,
        network: 'ethereum',
        gasLimit: 200000,
        maxGasPrice: 50,
        timeout: 10
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(`Contract deployed successfully!\nAddress: ${data.address}\nTransaction: ${data.txHash}`);
      closeCustomizeStandardModal();
      switchStandardTab('contracts');
    } else {
      alert('Deployment failed. Please try again.');
    }
    
  } catch (error) {
    console.error('Error deploying contract:', error);
    alert('Deployment failed. Please check console for details.');
  }
}

// Load contracts
async function loadStandardContracts() {
  const list = document.getElementById('contract-standard-list');
  list.innerHTML = '<div style="text-align: center; padding: 40px;">Loading deployed contracts...</div>';
  
  try {
    const response = await fetch('/api/unified?action=deployed_contracts');
    const data = await response.json();
    const contracts = data.contracts || [];
    
    if (contracts.length > 0) {
      list.innerHTML = contracts.map(contract => `
        <div class="trust-template-standard-card">
          <div class="trust-template-header">
            <div class="trust-template-info">
              <h3>${contract.contract_name}</h3>
              <p>${contract.description || 'No description'}</p>
            </div>
            <div class="trust-template-status ${contract.status === 'deployed' ? 'verified' : 'loading'}">
              ${contract.status === 'deployed' ? '✓ Deployed' : contract.status}
            </div>
          </div>
          
          <div class="trust-template-metrics">
            <div class="trust-template-metric">
              <span class="trust-template-metric-value">${contract.contract_address ? contract.contract_address.slice(0, 8) + '...' : 'Pending'}</span>
              <span class="trust-template-metric-label">Address</span>
            </div>
            <div class="trust-template-metric">
              <span class="trust-template-metric-value">${contract.network || 'Ethereum'}</span>
              <span class="trust-template-metric-label">Network</span>
            </div>
            <div class="trust-template-metric">
              <span class="trust-template-metric-value">${contract.selected_agents?.length || 0}</span>
              <span class="trust-template-metric-label">Agents</span>
            </div>
          </div>
          
          <div class="trust-template-actions">
            <button class="trust-template-button primary" onclick="manageContract('${contract.id}')">
              Manage
            </button>
            <button class="trust-template-button secondary" onclick="viewContractStats('${contract.id}')">
              Stats
            </button>
          </div>
        </div>
      `).join('');
    } else {
      list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--jobs-gray);">No deployed contracts found</div>';
    }
    
  } catch (error) {
    console.error('Error loading contracts:', error);
    list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--jobs-red);">Error loading contracts</div>';
  }
}

// Utility functions
function copyCodeToClipboard(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    navigator.clipboard.writeText(element.textContent);
    
    const button = element.parentElement.querySelector('.code-copy-button');
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.style.background = 'rgba(52, 199, 89, 0.2)';
    button.style.color = 'var(--jobs-green)';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
      button.style.color = '';
    }, 2000);
  }
}

function closeCodeStandardModal() {
  document.getElementById('code-standard-modal').classList.remove('active');
}

function closeCustomizeStandardModal() {
  document.getElementById('customize-standard-modal').classList.remove('active');
}

function selectStandardTemplate(templateId) {
  console.log('Selected template:', templateId);
}

function manageContract(contractId) {
  console.log('Managing contract:', contractId);
}

function viewContractStats(contractId) {
  console.log('Viewing stats for contract:', contractId);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  trustSectionStandard();
  
  // Update tab name
  const trustTab = document.querySelector('.jobs-section-tab[onclick*="trust"]');
  if (trustTab) {
    trustTab.innerHTML = 'Secure Automation';
  }
  
  // Close modals on outside click
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('code-standard-modal') || 
        e.target.classList.contains('customize-standard-modal')) {
      e.target.classList.remove('active');
    }
  });
});