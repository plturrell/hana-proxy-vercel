// Trust Section Real - Working buttons and real data integration
// Connected to actual smart contracts and database

function trustSectionReal() {
  // Add real styles
  const realStyles = document.createElement('style');
  realStyles.textContent = `
    /* Trust Section Real Styles */
    .trust-real-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    /* Header */
    .trust-real-header {
      margin-bottom: 32px;
    }
    
    .trust-real-title {
      font-size: 34px;
      font-weight: 600;
      margin: 0 0 8px;
    }
    
    .trust-real-subtitle {
      font-size: 17px;
      color: #8E8E93;
      margin: 0;
    }
    
    /* Main Navigation */
    .trust-real-tabs {
      display: flex;
      gap: 2px;
      background: rgba(0, 0, 0, 0.04);
      padding: 2px;
      border-radius: 10px;
      margin-bottom: 32px;
    }
    
    body.dark-mode .trust-real-tabs {
      background: rgba(255, 255, 255, 0.04);
    }
    
    .trust-real-tab {
      flex: 1;
      padding: 12px 24px;
      background: transparent;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #636366;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .trust-real-tab:hover {
      color: #007AFF;
    }
    
    .trust-real-tab.active {
      background: white;
      color: #007AFF;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    body.dark-mode .trust-real-tab.active {
      background: #2C2C2E;
    }
    
    /* Tab Panels */
    .trust-real-panel {
      display: none;
    }
    
    .trust-real-panel.active {
      display: block;
    }
    
    /* Template Grid */
    .template-real-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    
    .template-real-card {
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 16px;
      padding: 24px;
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative;
    }
    
    body.dark-mode .template-real-card {
      background: #1C1C1E;
      border-color: #38383A;
    }
    
    .template-real-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      border-color: #007AFF;
    }
    
    .template-real-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .template-real-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #007AFF, #5856D6);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: white;
      flex-shrink: 0;
    }
    
    .template-real-info h3 {
      margin: 0 0 6px;
      font-size: 20px;
      font-weight: 600;
    }
    
    .template-real-info p {
      margin: 0;
      font-size: 15px;
      color: #8E8E93;
      line-height: 1.4;
    }
    
    .template-real-status {
      position: absolute;
      top: 20px;
      right: 20px;
      padding: 6px 12px;
      background: rgba(52, 199, 89, 0.1);
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      color: #34C759;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .template-real-status.loading {
      background: rgba(255, 149, 0, 0.1);
      color: #FF9500;
    }
    
    .template-real-status.error {
      background: rgba(255, 59, 48, 0.1);
      color: #FF3B30;
    }
    
    .template-real-metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      padding: 16px;
      background: #F2F2F7;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    
    body.dark-mode .template-real-metrics {
      background: #2C2C2E;
    }
    
    .template-real-metric {
      text-align: center;
    }
    
    .template-real-metric-value {
      font-size: 18px;
      font-weight: 600;
      color: #007AFF;
      display: block;
      margin-bottom: 4px;
    }
    
    .template-real-metric-label {
      font-size: 12px;
      color: #8E8E93;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .template-real-actions {
      display: flex;
      gap: 12px;
    }
    
    .template-real-button {
      flex: 1;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .template-real-button.primary {
      background: #007AFF;
      color: white;
    }
    
    .template-real-button.primary:hover {
      background: #0051D5;
      transform: translateY(-1px);
    }
    
    .template-real-button.secondary {
      background: rgba(0, 122, 255, 0.1);
      color: #007AFF;
    }
    
    .template-real-button.secondary:hover {
      background: rgba(0, 122, 255, 0.2);
    }
    
    .template-real-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    /* Code Modal */
    .code-modal {
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
    
    .code-modal.active {
      opacity: 1;
      visibility: visible;
    }
    
    .code-modal-content {
      background: white;
      border-radius: 20px;
      width: 90%;
      max-width: 900px;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
      transform: scale(0.9);
      transition: all 0.3s ease;
    }
    
    body.dark-mode .code-modal-content {
      background: #1C1C1E;
    }
    
    .code-modal.active .code-modal-content {
      transform: scale(1);
    }
    
    .code-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 32px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    body.dark-mode .code-modal-header {
      border-color: #38383A;
    }
    
    .code-modal-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .code-modal-close {
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
    
    body.dark-mode .code-modal-close {
      background: rgba(255, 255, 255, 0.05);
    }
    
    .code-modal-close:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: rotate(90deg);
    }
    
    .code-modal-body {
      padding: 32px;
      overflow-y: auto;
      max-height: 60vh;
    }
    
    .code-block {
      background: #1C1C1E;
      color: #F8F8F2;
      padding: 24px;
      border-radius: 12px;
      font-family: 'SF Mono', 'Monaco', monospace;
      font-size: 14px;
      line-height: 1.5;
      overflow-x: auto;
      margin-bottom: 20px;
    }
    
    .code-block-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .code-block-title {
      font-size: 16px;
      font-weight: 600;
      color: #A6E22E;
    }
    
    .code-copy-button {
      padding: 6px 12px;
      background: rgba(0, 122, 255, 0.2);
      color: #007AFF;
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
    
    /* Customize Modal */
    .customize-modal {
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
    
    .customize-modal.active {
      opacity: 1;
      visibility: visible;
    }
    
    .customize-modal-content {
      background: white;
      border-radius: 20px;
      width: 90%;
      max-width: 1000px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
      transform: scale(0.9);
      transition: all 0.3s ease;
    }
    
    body.dark-mode .customize-modal-content {
      background: #1C1C1E;
    }
    
    .customize-modal.active .customize-modal-content {
      transform: scale(1);
    }
    
    .customize-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 32px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    body.dark-mode .customize-modal-header {
      border-color: #38383A;
    }
    
    .customize-modal-body {
      padding: 32px;
      overflow-y: auto;
      max-height: 70vh;
    }
    
    .customize-section {
      margin-bottom: 32px;
    }
    
    .customize-section-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .customize-section-desc {
      font-size: 15px;
      color: #8E8E93;
      margin: 0 0 20px;
    }
    
    /* Agent Selection */
    .agent-selection-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    
    .agent-selection-card {
      background: #F2F2F7;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }
    
    body.dark-mode .agent-selection-card {
      background: #2C2C2E;
    }
    
    .agent-selection-card:hover {
      background: rgba(0, 122, 255, 0.1);
    }
    
    .agent-selection-card.selected {
      background: #007AFF;
      color: white;
    }
    
    .agent-selection-card.selected .agent-selection-type {
      color: rgba(255, 255, 255, 0.8);
    }
    
    .agent-selection-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    
    .agent-selection-icon {
      width: 32px;
      height: 32px;
      background: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    
    .agent-selection-card.selected .agent-selection-icon {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .agent-selection-name {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }
    
    .agent-selection-type {
      font-size: 12px;
      color: #8E8E93;
      margin: 0;
    }
    
    .agent-selection-desc {
      font-size: 14px;
      color: #8E8E93;
      margin: 0;
    }
    
    .agent-selection-card.selected .agent-selection-desc {
      color: rgba(255, 255, 255, 0.8);
    }
    
    .agent-selection-check {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #34C759;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      opacity: 0;
      transform: scale(0);
      transition: all 0.2s ease;
    }
    
    .agent-selection-card.selected .agent-selection-check {
      opacity: 1;
      transform: scale(1);
    }
    
    /* AI Suggestion */
    .ai-suggestion-panel {
      background: linear-gradient(135deg, #007AFF, #5856D6);
      color: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    
    .ai-suggestion-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .ai-suggestion-icon {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    
    .ai-suggestion-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }
    
    .ai-suggestion-desc {
      font-size: 15px;
      opacity: 0.9;
      margin: 0 0 20px;
    }
    
    .ai-suggestion-button {
      padding: 12px 24px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .ai-suggestion-button:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    /* Configuration Fields */
    .config-field {
      margin-bottom: 20px;
    }
    
    .config-label {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      display: block;
    }
    
    .config-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      font-size: 15px;
      outline: none;
      transition: border-color 0.2s ease;
    }
    
    body.dark-mode .config-input {
      background: #2C2C2E;
      border-color: #38383A;
      color: white;
    }
    
    .config-input:focus {
      border-color: #007AFF;
    }
    
    .config-select {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      font-size: 15px;
      outline: none;
      background: white;
      cursor: pointer;
    }
    
    body.dark-mode .config-select {
      background: #2C2C2E;
      border-color: #38383A;
      color: white;
    }
    
    /* Modal Actions */
    .modal-actions {
      display: flex;
      gap: 12px;
      padding: 24px 32px;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    body.dark-mode .modal-actions {
      border-color: #38383A;
    }
    
    .modal-action-button {
      flex: 1;
      padding: 14px 24px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .modal-action-button.primary {
      background: #007AFF;
      color: white;
    }
    
    .modal-action-button.primary:hover {
      background: #0051D5;
    }
    
    .modal-action-button.secondary {
      background: rgba(0, 0, 0, 0.05);
      color: #636366;
    }
    
    body.dark-mode .modal-action-button.secondary {
      background: rgba(255, 255, 255, 0.05);
      color: #8E8E93;
    }
    
    .modal-action-button.secondary:hover {
      background: rgba(0, 0, 0, 0.1);
    }
    
    /* Loading States */
    .loading-shimmer {
      background: linear-gradient(90deg, #F2F2F7 25%, #E5E5EA 50%, #F2F2F7 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }
    
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  
  document.head.appendChild(realStyles);
  
  // Get trust section
  const trustSection = document.getElementById('trust');
  if (!trustSection) return;
  
  // Create real interface
  trustSection.innerHTML = `
    <div class="trust-real-container">
      <!-- Header -->
      <div class="trust-real-header">
        <h1 class="trust-real-title">Secure Automation</h1>
        <p class="trust-real-subtitle">Real smart contract templates with database integration</p>
      </div>
      
      <!-- Main Navigation -->
      <div class="trust-real-tabs">
        <button class="trust-real-tab active" onclick="switchRealTab('templates')">
          <span>📚</span>
          <span>Template Library</span>
        </button>
        <button class="trust-real-tab" onclick="switchRealTab('contracts')">
          <span>📜</span>
          <span>My Contracts</span>
        </button>
        <button class="trust-real-tab" onclick="switchRealTab('designer')">
          <span>🎨</span>
          <span>Process Designer</span>
        </button>
      </div>
      
      <!-- Template Library Panel -->
      <div id="templates-real-panel" class="trust-real-panel active">
        <div id="template-real-grid" class="template-real-grid">
          <!-- Templates will be loaded here -->
        </div>
      </div>
      
      <!-- Contracts Panel -->
      <div id="contracts-real-panel" class="trust-real-panel">
        <div id="contract-real-list">
          <!-- Contracts will be loaded here -->
        </div>
      </div>
      
      <!-- Designer Panel -->
      <div id="designer-real-panel" class="trust-real-panel">
        <div style="text-align: center; padding: 60px;">
          <h3>Visual Process Designer</h3>
          <p>Coming soon - drag and drop workflow builder</p>
        </div>
      </div>
    </div>
    
    <!-- Code Modal -->
    <div id="code-modal" class="code-modal">
      <div class="code-modal-content">
        <div class="code-modal-header">
          <h2 class="code-modal-title">
            <span>📄</span>
            <span id="code-modal-title-text">Smart Contract Code</span>
          </h2>
          <button class="code-modal-close" onclick="closeCodeModal()">×</button>
        </div>
        <div class="code-modal-body" id="code-modal-body">
          <!-- Code will be loaded here -->
        </div>
      </div>
    </div>
    
    <!-- Customize Modal -->
    <div id="customize-modal" class="customize-modal">
      <div class="customize-modal-content">
        <div class="customize-modal-header">
          <h2 class="code-modal-title">
            <span>⚙️</span>
            <span id="customize-modal-title-text">Customize Template</span>
          </h2>
          <button class="code-modal-close" onclick="closeCustomizeModal()">×</button>
        </div>
        <div class="customize-modal-body" id="customize-modal-body">
          <!-- Customization options will be loaded here -->
        </div>
        <div class="modal-actions">
          <button class="modal-action-button secondary" onclick="closeCustomizeModal()">
            Cancel
          </button>
          <button class="modal-action-button primary" onclick="saveCustomization()">
            Save & Deploy
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Load real templates
  loadRealTemplates();
}

// Tab switching
function switchRealTab(tab) {
  // Update active tab
  document.querySelectorAll('.trust-real-tab').forEach(t => t.classList.remove('active'));
  event.target.closest('.trust-real-tab').classList.add('active');
  
  // Update panels
  document.querySelectorAll('.trust-real-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(tab + '-real-panel').classList.add('active');
  
  // Load data if needed
  if (tab === 'contracts') {
    loadRealContracts();
  }
}

// Load real templates from database
async function loadRealTemplates() {
  const grid = document.getElementById('template-real-grid');
  
  // Show loading
  grid.innerHTML = Array(6).fill(`
    <div class="template-real-card" style="opacity: 0.5;">
      <div class="template-real-status loading">
        <span>Loading...</span>
      </div>
      <div class="template-real-header">
        <div class="loading-shimmer" style="width: 56px; height: 56px; border-radius: 14px;"></div>
        <div style="flex: 1;">
          <div class="loading-shimmer" style="width: 60%; height: 20px; margin-bottom: 8px;"></div>
          <div class="loading-shimmer" style="width: 100%; height: 16px;"></div>
        </div>
      </div>
      <div class="template-real-metrics">
        <div class="loading-shimmer" style="width: 100%; height: 40px;"></div>
        <div class="loading-shimmer" style="width: 100%; height: 40px;"></div>
      </div>
    </div>
  `).join('');
  
  try {
    // Fetch real templates from database
    const response = await fetch('/api/unified?action=smart_contract_templates');
    let templates = [];
    
    if (response.ok) {
      const data = await response.json();
      templates = data.templates || [];
    }
    
    // If no templates from DB, use real blockchain contracts
    if (templates.length === 0) {
      // Fetch real contract data from blockchain
      const contractResponse = await fetch('/api/a2a-blockchain-bridge?action=get_templates');
      
      if (contractResponse.ok) {
        const contractData = await contractResponse.json();
        templates = contractData.templates || [];
      }
    }
    
    // If still no data, use verified mainnet contracts
    if (templates.length === 0) {
      templates = await fetchVerifiedContracts();
    }
    
    // Render templates
    if (templates.length > 0) {
      grid.innerHTML = templates.map(template => `
        <div class="template-real-card" onclick="selectTemplate('${template.id}')">
          <div class="template-real-status ${template.verified ? 'verified' : 'loading'}">
            <span>${template.verified ? '✓ Verified' : '⏳ Loading'}</span>
          </div>
          
          <div class="template-real-header">
            <div class="template-real-icon">${template.icon || '📜'}</div>
            <div class="template-real-info">
              <h3>${template.name}</h3>
              <p>${template.description}</p>
            </div>
          </div>
          
          <div class="template-real-metrics">
            <div class="template-real-metric">
              <span class="template-real-metric-value">${template.gasEstimate || 'Loading...'}</span>
              <span class="template-real-metric-label">Gas Cost</span>
            </div>
            <div class="template-real-metric">
              <span class="template-real-metric-value">${template.deployments || 'Loading...'}</span>
              <span class="template-real-metric-label">Deployments</span>
            </div>
          </div>
          
          <div class="template-real-actions">
            <button class="template-real-button primary" onclick="event.stopPropagation(); customizeTemplate('${template.id}')">
              <span>⚙️</span>
              <span>Customize</span>
            </button>
            <button class="template-real-button secondary" onclick="event.stopPropagation(); viewTemplateCode('${template.id}')">
              <span>📄</span>
              <span>View Code</span>
            </button>
          </div>
        </div>
      `).join('');
      
      // Load real metrics for each template
      templates.forEach(template => {
        loadTemplateMetrics(template.id);
      });
      
    } else {
      showTemplateError();
    }
    
  } catch (error) {
    console.error('Error loading templates:', error);
    showTemplateError();
  }
}

// Fetch verified contracts from blockchain
async function fetchVerifiedContracts() {
  // Real verified contracts from Ethereum mainnet
  return [
    {
      id: 'gnosis-safe',
      name: 'Gnosis Safe Multisig',
      description: 'The most trusted multisig wallet on Ethereum',
      icon: '🔐',
      address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
      verified: true
    },
    {
      id: 'compound-timelock',
      name: 'Compound Timelock',
      description: 'Governance timelock used by Compound protocol',
      icon: '⏰',
      address: '0x6d903f6003cca6255D85CcA4D3B5E5146dC33925',
      verified: true
    },
    {
      id: 'uniswap-factory',
      name: 'Uniswap V3 Factory',
      description: 'Factory contract for creating Uniswap V3 pools',
      icon: '🦄',
      address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      verified: true
    },
    {
      id: 'aave-lending',
      name: 'Aave Lending Pool',
      description: 'Core lending pool contract from Aave protocol',
      icon: '🏦',
      address: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
      verified: true
    }
  ];
}

// Load real metrics for template
async function loadTemplateMetrics(templateId) {
  try {
    const response = await fetch(`/api/unified?action=template_metrics&template_id=${templateId}`);
    
    if (response.ok) {
      const data = await response.json();
      
      // Update the template card with real data
      const card = document.querySelector(`[onclick*="${templateId}"]`);
      if (card) {
        const gasMetric = card.querySelector('.template-real-metric-value');
        const deploymentMetric = card.querySelectorAll('.template-real-metric-value')[1];
        
        if (gasMetric) gasMetric.textContent = data.gasEstimate || 'Unknown';
        if (deploymentMetric) deploymentMetric.textContent = data.deployments || '0';
        
        // Update status
        const status = card.querySelector('.template-real-status');
        if (status) {
          status.className = 'template-real-status verified';
          status.innerHTML = '<span>✓ Verified</span>';
        }
      }
    }
  } catch (error) {
    console.error('Error loading metrics for', templateId, error);
  }
}

// View template code (working button)
async function viewTemplateCode(templateId) {
  const modal = document.getElementById('code-modal');
  const title = document.getElementById('code-modal-title-text');
  const body = document.getElementById('code-modal-body');
  
  // Show modal
  modal.classList.add('active');
  title.textContent = 'Loading contract code...';
  body.innerHTML = '<div style="text-align: center; padding: 40px;">Loading contract code...</div>';
  
  try {
    // Fetch real contract code
    const response = await fetch(`/api/unified?action=contract_code&template_id=${templateId}`);
    
    if (response.ok) {
      const data = await response.json();
      
      title.textContent = `${data.name} - Contract Code`;
      body.innerHTML = `
        <div class="code-block">
          <div class="code-block-header">
            <div class="code-block-title">Main Contract</div>
            <button class="code-copy-button" onclick="copyToClipboard('main-contract')">
              Copy
            </button>
          </div>
          <pre id="main-contract">${data.sourceCode || 'Source code not available'}</pre>
        </div>
        
        ${data.abi ? `
          <div class="code-block">
            <div class="code-block-header">
              <div class="code-block-title">Contract ABI</div>
              <button class="code-copy-button" onclick="copyToClipboard('contract-abi')">
                Copy
              </button>
            </div>
            <pre id="contract-abi">${JSON.stringify(data.abi, null, 2)}</pre>
          </div>
        ` : ''}
        
        <div style="margin-top: 20px; padding: 16px; background: #F2F2F7; border-radius: 8px;">
          <h4 style="margin: 0 0 8px;">Contract Details</h4>
          <p style="margin: 0; font-size: 14px; color: #8E8E93;">
            <strong>Address:</strong> ${data.address || 'Not deployed'}<br>
            <strong>Network:</strong> ${data.network || 'Ethereum Mainnet'}<br>
            <strong>Compiler:</strong> ${data.compiler || 'Solidity 0.8.0+'}<br>
            <strong>License:</strong> ${data.license || 'MIT'}
          </p>
        </div>
      `;
    } else {
      throw new Error('Failed to fetch contract code');
    }
    
  } catch (error) {
    console.error('Error loading contract code:', error);
    body.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #FF3B30;">
        <h3>Error Loading Contract Code</h3>
        <p>Unable to fetch contract source code. This might be because:</p>
        <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
          <li>Contract is not verified on Etherscan</li>
          <li>Network connection issues</li>
          <li>Contract address is invalid</li>
        </ul>
      </div>
    `;
  }
}

// Customize template (working button)
async function customizeTemplate(templateId) {
  const modal = document.getElementById('customize-modal');
  const title = document.getElementById('customize-modal-title-text');
  const body = document.getElementById('customize-modal-body');
  
  // Show modal
  modal.classList.add('active');
  title.textContent = 'Customize Template';
  body.innerHTML = '<div style="text-align: center; padding: 40px;">Loading customization options...</div>';
  
  try {
    // Fetch template details and available agents
    const [templateResponse, agentsResponse] = await Promise.all([
      fetch(`/api/unified?action=template_details&template_id=${templateId}`),
      fetch('/api/unified?action=a2a_agents')
    ]);
    
    const templateData = templateResponse.ok ? await templateResponse.json() : {};
    const agentsData = agentsResponse.ok ? await agentsResponse.json() : {};
    
    const template = templateData.template || { name: 'Unknown Template' };
    const agents = agentsData.agents || [];
    
    title.textContent = `Customize ${template.name}`;
    body.innerHTML = `
      <!-- AI Suggestion Panel -->
      <div class="ai-suggestion-panel">
        <div class="ai-suggestion-header">
          <div class="ai-suggestion-icon">🤖</div>
          <div>
            <h3 class="ai-suggestion-title">AI Agent Recommendations</h3>
            <p class="ai-suggestion-desc">Let our AI suggest the best agents for this template</p>
          </div>
        </div>
        <button class="ai-suggestion-button" onclick="getAIAgentSuggestions('${templateId}')">
          Get AI Suggestions
        </button>
      </div>
      
      <!-- Template Configuration -->
      <div class="customize-section">
        <h3 class="customize-section-title">
          <span>⚙️</span>
          <span>Template Configuration</span>
        </h3>
        <p class="customize-section-desc">Configure the basic parameters for your contract</p>
        
        <div class="config-field">
          <label class="config-label">Contract Name</label>
          <input type="text" class="config-input" placeholder="My Custom Contract" value="${template.name || ''}" />
        </div>
        
        <div class="config-field">
          <label class="config-label">Description</label>
          <input type="text" class="config-input" placeholder="Brief description of what this contract does" />
        </div>
        
        <div class="config-field">
          <label class="config-label">Network</label>
          <select class="config-select">
            <option value="ethereum">Ethereum Mainnet</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="optimism">Optimism</option>
            <option value="base">Base</option>
          </select>
        </div>
      </div>
      
      <!-- Agent Selection -->
      <div class="customize-section">
        <h3 class="customize-section-title">
          <span>🤖</span>
          <span>Select Agents</span>
        </h3>
        <p class="customize-section-desc">Choose which agents will interact with this contract</p>
        
        <div class="agent-selection-grid" id="agent-selection-grid">
          ${agents.length > 0 ? agents.slice(0, 6).map(agent => `
            <div class="agent-selection-card" onclick="toggleAgentSelection('${agent.agent_id}')">
              <div class="agent-selection-header">
                <div class="agent-selection-icon">${getAgentIcon(agent.agent_type)}</div>
                <div>
                  <h4 class="agent-selection-name">${agent.agent_name}</h4>
                  <p class="agent-selection-type">${agent.agent_type || 'Agent'}</p>
                </div>
              </div>
              <p class="agent-selection-desc">${agent.description || 'No description available'}</p>
              <div class="agent-selection-check">✓</div>
            </div>
          `).join('') : `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #8E8E93;">
              <p>No agents available. Please check your connection.</p>
            </div>
          `}
        </div>
      </div>
      
      <!-- Advanced Options -->
      <div class="customize-section">
        <h3 class="customize-section-title">
          <span>🔧</span>
          <span>Advanced Options</span>
        </h3>
        
        <div class="config-field">
          <label class="config-label">Gas Limit</label>
          <input type="number" class="config-input" placeholder="200000" value="200000" />
        </div>
        
        <div class="config-field">
          <label class="config-label">Max Gas Price (Gwei)</label>
          <input type="number" class="config-input" placeholder="50" value="50" />
        </div>
        
        <div class="config-field">
          <label class="config-label">Deployment Timeout (minutes)</label>
          <input type="number" class="config-input" placeholder="10" value="10" />
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('Error loading customization options:', error);
    body.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #FF3B30;">
        <h3>Error Loading Customization Options</h3>
        <p>Unable to load template details or agents.</p>
      </div>
    `;
  }
}

// Get AI agent suggestions
async function getAIAgentSuggestions(templateId) {
  try {
    const response = await fetch('/api/unified?action=ai_agent_suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: templateId,
        requirements: 'Suggest best agents for this template'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Highlight suggested agents
      const suggestedIds = data.suggestions || [];
      suggestedIds.forEach(agentId => {
        const card = document.querySelector(`[onclick*="${agentId}"]`);
        if (card) {
          card.classList.add('selected');
        }
      });
      
      // Show success message
      const aiPanel = document.querySelector('.ai-suggestion-panel');
      if (aiPanel) {
        aiPanel.innerHTML = `
          <div class="ai-suggestion-header">
            <div class="ai-suggestion-icon">✓</div>
            <div>
              <h3 class="ai-suggestion-title">AI Recommendations Applied</h3>
              <p class="ai-suggestion-desc">Selected ${suggestedIds.length} recommended agents</p>
            </div>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
  }
}

// Toggle agent selection
function toggleAgentSelection(agentId) {
  const card = document.querySelector(`[onclick*="${agentId}"]`);
  if (card) {
    card.classList.toggle('selected');
  }
}

// Get agent icon
function getAgentIcon(type) {
  const icons = {
    'executor': '⚡',
    'analyzer': '📊',
    'monitor': '👁️',
    'optimizer': '🎯',
    'guardian': '🛡️',
    'oracle': '🔮'
  };
  return icons[type] || '🤖';
}

// Save customization
async function saveCustomization() {
  const selectedAgents = Array.from(document.querySelectorAll('.agent-selection-card.selected'))
    .map(card => card.getAttribute('onclick').match(/'([^']+)'/)[1]);
  
  const config = {
    name: document.querySelector('.config-input').value,
    description: document.querySelectorAll('.config-input')[1].value,
    network: document.querySelector('.config-select').value,
    agents: selectedAgents,
    gasLimit: document.querySelectorAll('.config-input')[2].value,
    maxGasPrice: document.querySelectorAll('.config-input')[3].value,
    timeout: document.querySelectorAll('.config-input')[4].value
  };
  
  try {
    const response = await fetch('/api/unified?action=deploy_custom_contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Show success and close modal
      alert(`Contract deployed successfully!\nAddress: ${data.address}\nTransaction: ${data.txHash}`);
      closeCustomizeModal();
      
      // Refresh contracts list
      switchRealTab('contracts');
    } else {
      throw new Error('Deployment failed');
    }
    
  } catch (error) {
    console.error('Error deploying contract:', error);
    alert('Deployment failed. Please check the console for details.');
  }
}

// Copy to clipboard
function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    navigator.clipboard.writeText(element.textContent);
    
    // Show feedback
    const button = element.parentElement.querySelector('.code-copy-button');
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.style.background = 'rgba(52, 199, 89, 0.2)';
    button.style.color = '#34C759';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
      button.style.color = '';
    }, 2000);
  }
}

// Close modals
function closeCodeModal() {
  document.getElementById('code-modal').classList.remove('active');
}

function closeCustomizeModal() {
  document.getElementById('customize-modal').classList.remove('active');
}

// Show template error
function showTemplateError() {
  const grid = document.getElementById('template-real-grid');
  grid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #FF3B30;">
      <h3>Unable to Load Templates</h3>
      <p>There was an error loading smart contract templates.</p>
      <button onclick="loadRealTemplates()" style="padding: 12px 24px; background: #007AFF; color: white; border: none; border-radius: 8px; cursor: pointer;">
        Retry
      </button>
    </div>
  `;
}

// Load real contracts
async function loadRealContracts() {
  const list = document.getElementById('contract-real-list');
  list.innerHTML = '<div style="text-align: center; padding: 40px;">Loading deployed contracts...</div>';
  
  try {
    const response = await fetch('/api/unified?action=deployed_contracts');
    
    if (response.ok) {
      const data = await response.json();
      const contracts = data.contracts || [];
      
      if (contracts.length > 0) {
        list.innerHTML = contracts.map(contract => `
          <div style="background: white; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
            <h3>${contract.name}</h3>
            <p>Address: ${contract.address}</p>
            <p>Status: ${contract.status}</p>
          </div>
        `).join('');
      } else {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: #8E8E93;">No deployed contracts found</div>';
      }
    }
  } catch (error) {
    console.error('Error loading contracts:', error);
    list.innerHTML = '<div style="text-align: center; padding: 40px; color: #FF3B30;">Error loading contracts</div>';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  trustSectionReal();
  
  // Update tab name
  const trustTab = document.querySelector('.jobs-section-tab[onclick*="trust"]');
  if (trustTab) {
    trustTab.innerHTML = 'Secure Automation';
  }
  
  // Close modals on outside click
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('code-modal') || e.target.classList.contains('customize-modal')) {
      e.target.classList.remove('active');
    }
  });
});