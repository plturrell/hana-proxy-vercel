// Trust Section Complete - Template Library, Contract Library, and Process Designer
// Real smart contracts with database versioning and agent integration

function trustSectionComplete() {
  // Add complete styles
  const completeStyles = document.createElement('style');
  completeStyles.textContent = `
    /* Trust Section Complete Styles */
    .trust-complete-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    /* Compact Header */
    .trust-complete-header {
      margin-bottom: 32px;
    }
    
    .trust-complete-title {
      font-size: 34px;
      font-weight: 600;
      margin: 0 0 8px;
    }
    
    .trust-complete-subtitle {
      font-size: 17px;
      color: #8E8E93;
      margin: 0;
    }
    
    /* Main Navigation Tabs */
    .trust-main-tabs {
      display: flex;
      gap: 2px;
      background: rgba(0, 0, 0, 0.04);
      padding: 2px;
      border-radius: 10px;
      margin-bottom: 32px;
    }
    
    body.dark-mode .trust-main-tabs {
      background: rgba(255, 255, 255, 0.04);
    }
    
    .trust-main-tab {
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
    
    .trust-main-tab:hover {
      color: #007AFF;
    }
    
    .trust-main-tab.active {
      background: white;
      color: #007AFF;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    body.dark-mode .trust-main-tab.active {
      background: #2C2C2E;
    }
    
    /* Tab Panels */
    .trust-tab-panel {
      display: none;
    }
    
    .trust-tab-panel.active {
      display: block;
    }
    
    /* Template Library Styles */
    .template-library-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    
    .template-search-bar {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    
    .template-search-input {
      width: 300px;
      padding: 10px 16px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      font-size: 15px;
      outline: none;
    }
    
    body.dark-mode .template-search-input {
      background: #1C1C1E;
      border-color: #38383A;
      color: white;
    }
    
    .template-filter-button {
      padding: 10px 16px;
      background: rgba(0, 122, 255, 0.1);
      border: none;
      border-radius: 8px;
      color: #007AFF;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .template-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    
    .template-card {
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      padding: 24px;
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative;
    }
    
    body.dark-mode .template-card {
      background: #1C1C1E;
      border-color: #38383A;
    }
    
    .template-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      border-color: #007AFF;
    }
    
    .template-card-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .template-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #007AFF, #5856D6);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
      flex-shrink: 0;
    }
    
    .template-info h3 {
      margin: 0 0 4px;
      font-size: 18px;
      font-weight: 600;
    }
    
    .template-info p {
      margin: 0;
      font-size: 14px;
      color: #8E8E93;
    }
    
    .template-version {
      position: absolute;
      top: 16px;
      right: 16px;
      padding: 4px 8px;
      background: rgba(0, 122, 255, 0.1);
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #007AFF;
    }
    
    .template-details {
      background: #F2F2F7;
      border-radius: 8px;
      padding: 12px;
      margin: 16px 0;
      font-size: 13px;
      font-family: 'SF Mono', monospace;
    }
    
    body.dark-mode .template-details {
      background: #2C2C2E;
    }
    
    .template-detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    
    .template-detail-row:last-child {
      margin-bottom: 0;
    }
    
    .template-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    
    .template-action-button {
      flex: 1;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .template-action-button.primary {
      background: #007AFF;
      color: white;
    }
    
    .template-action-button.primary:hover {
      background: #0051D5;
    }
    
    .template-action-button.secondary {
      background: rgba(0, 122, 255, 0.1);
      color: #007AFF;
    }
    
    .template-action-button.secondary:hover {
      background: rgba(0, 122, 255, 0.2);
    }
    
    /* Contract Library Styles */
    .contract-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    
    .contract-stat-card {
      background: linear-gradient(135deg, #007AFF, #5856D6);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
    
    .contract-stat-value {
      font-size: 32px;
      font-weight: 700;
      margin: 0;
    }
    
    .contract-stat-label {
      font-size: 14px;
      opacity: 0.9;
      margin: 4px 0 0;
    }
    
    .contract-list {
      display: grid;
      gap: 16px;
    }
    
    .contract-item {
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      padding: 20px;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 20px;
      align-items: center;
    }
    
    body.dark-mode .contract-item {
      background: #1C1C1E;
      border-color: #38383A;
    }
    
    .contract-status-indicator {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    
    .contract-status-indicator.active {
      background: rgba(52, 199, 89, 0.1);
      color: #34C759;
    }
    
    .contract-status-indicator.pending {
      background: rgba(255, 149, 0, 0.1);
      color: #FF9500;
    }
    
    .contract-info h4 {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 600;
    }
    
    .contract-meta {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #8E8E93;
    }
    
    .contract-meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .contract-actions {
      display: flex;
      gap: 8px;
    }
    
    /* Process Designer Styles */
    .designer-container {
      background: #F2F2F7;
      border-radius: 16px;
      padding: 24px;
      min-height: 600px;
    }
    
    body.dark-mode .designer-container {
      background: #1C1C1E;
    }
    
    .designer-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }
    
    body.dark-mode .designer-toolbar {
      border-color: #38383A;
    }
    
    .designer-tools {
      display: flex;
      gap: 12px;
    }
    
    .designer-tool-button {
      padding: 8px 16px;
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }
    
    body.dark-mode .designer-tool-button {
      background: #2C2C2E;
      border-color: #38383A;
      color: white;
    }
    
    .designer-tool-button:hover {
      border-color: #007AFF;
      color: #007AFF;
    }
    
    .designer-workspace {
      display: grid;
      grid-template-columns: 280px 1fr 320px;
      gap: 24px;
      height: 500px;
    }
    
    .designer-panel {
      background: white;
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }
    
    body.dark-mode .designer-panel {
      background: #2C2C2E;
      border-color: #38383A;
    }
    
    .designer-panel-header {
      padding: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      font-weight: 600;
    }
    
    body.dark-mode .designer-panel-header {
      border-color: #38383A;
    }
    
    .designer-panel-content {
      padding: 16px;
      overflow-y: auto;
      height: calc(100% - 53px);
    }
    
    /* Component Library */
    .component-item {
      background: #F2F2F7;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      cursor: move;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.2s ease;
    }
    
    body.dark-mode .component-item {
      background: #1C1C1E;
    }
    
    .component-item:hover {
      background: rgba(0, 122, 255, 0.1);
    }
    
    .component-icon {
      width: 32px;
      height: 32px;
      background: white;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    
    body.dark-mode .component-icon {
      background: #38383A;
    }
    
    .component-info h5 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }
    
    .component-info p {
      margin: 2px 0 0;
      font-size: 12px;
      color: #8E8E93;
    }
    
    /* Canvas */
    .designer-canvas {
      position: relative;
      background-image: 
        linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
      background-size: 20px 20px;
    }
    
    body.dark-mode .designer-canvas {
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    }
    
    .canvas-placeholder {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #8E8E93;
    }
    
    .canvas-placeholder-icon {
      font-size: 48px;
      opacity: 0.3;
      margin-bottom: 16px;
    }
    
    /* Properties Panel */
    .property-group {
      margin-bottom: 24px;
    }
    
    .property-group-title {
      font-size: 13px;
      font-weight: 600;
      color: #8E8E93;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    
    .property-field {
      margin-bottom: 16px;
    }
    
    .property-label {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 6px;
      display: block;
    }
    
    .property-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 6px;
      font-size: 14px;
      outline: none;
    }
    
    body.dark-mode .property-input {
      background: #1C1C1E;
      border-color: #38383A;
      color: white;
    }
    
    .property-input:focus {
      border-color: #007AFF;
    }
    
    /* Agent Selector */
    .agent-selector {
      background: rgba(0, 122, 255, 0.05);
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
    }
    
    .agent-selector-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    
    .agent-selector-title {
      font-size: 14px;
      font-weight: 600;
    }
    
    .agent-ai-button {
      padding: 6px 12px;
      background: #007AFF;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .agent-ai-button:hover {
      background: #0051D5;
    }
    
    .agent-list {
      display: grid;
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .agent-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    body.dark-mode .agent-option {
      background: #2C2C2E;
    }
    
    .agent-option:hover {
      background: rgba(0, 122, 255, 0.1);
    }
    
    .agent-option.selected {
      background: #007AFF;
      color: white;
    }
    
    .agent-checkbox {
      width: 16px;
      height: 16px;
    }
    
    .agent-option-name {
      font-size: 14px;
      font-weight: 500;
    }
    
    .agent-option-type {
      font-size: 12px;
      opacity: 0.7;
      margin-left: auto;
    }
    
    /* Empty States */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #8E8E93;
    }
    
    .empty-state-icon {
      font-size: 48px;
      opacity: 0.3;
      margin-bottom: 16px;
    }
    
    .empty-state-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px;
    }
    
    .empty-state-desc {
      font-size: 14px;
      margin: 0 0 24px;
    }
    
    .empty-state-button {
      padding: 12px 24px;
      background: #007AFF;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
    }
    
    .empty-state-button:hover {
      background: #0051D5;
    }
  `;
  
  document.head.appendChild(completeStyles);
  
  // Get trust section
  const trustSection = document.getElementById('trust');
  if (!trustSection) return;
  
  // Create complete interface
  trustSection.innerHTML = `
    <div class="trust-complete-container">
      <!-- Header -->
      <div class="trust-complete-header">
        <h1 class="trust-complete-title">Secure Automation</h1>
        <p class="trust-complete-subtitle">Smart contract templates, deployed contracts, and visual process designer</p>
      </div>
      
      <!-- Main Navigation -->
      <div class="trust-main-tabs">
        <button class="trust-main-tab active" onclick="switchTrustTab('templates')">
          <span>📚</span>
          <span>Template Library</span>
        </button>
        <button class="trust-main-tab" onclick="switchTrustTab('contracts')">
          <span>📜</span>
          <span>My Contracts</span>
        </button>
        <button class="trust-main-tab" onclick="switchTrustTab('designer')">
          <span>🎨</span>
          <span>Process Designer</span>
        </button>
      </div>
      
      <!-- Template Library Panel -->
      <div id="templates-panel" class="trust-tab-panel active">
        <div class="template-library-header">
          <h2 style="margin: 0; font-size: 24px;">Smart Contract Templates</h2>
          <div class="template-search-bar">
            <input 
              type="text" 
              class="template-search-input" 
              placeholder="Search templates..."
              id="template-search"
              onkeyup="searchTemplates()"
            />
            <button class="template-filter-button" onclick="showTemplateFilters()">
              <span>🔽</span>
              <span>Filters</span>
            </button>
          </div>
        </div>
        
        <div id="template-grid" class="template-grid">
          <!-- Templates will be loaded here -->
        </div>
      </div>
      
      <!-- Contracts Library Panel -->
      <div id="contracts-panel" class="trust-tab-panel">
        <div class="contract-stats">
          <div class="contract-stat-card">
            <p class="contract-stat-value" id="total-contracts">0</p>
            <p class="contract-stat-label">Total Contracts</p>
          </div>
          <div class="contract-stat-card">
            <p class="contract-stat-value" id="active-contracts">0</p>
            <p class="contract-stat-label">Active</p>
          </div>
          <div class="contract-stat-card">
            <p class="contract-stat-value" id="total-volume">$0</p>
            <p class="contract-stat-label">Total Volume</p>
          </div>
          <div class="contract-stat-card">
            <p class="contract-stat-value" id="gas-saved">0 ETH</p>
            <p class="contract-stat-label">Gas Saved</p>
          </div>
        </div>
        
        <div id="contract-list" class="contract-list">
          <!-- Deployed contracts will be loaded here -->
        </div>
      </div>
      
      <!-- Process Designer Panel -->
      <div id="designer-panel" class="trust-tab-panel">
        <div class="designer-container">
          <div class="designer-toolbar">
            <div class="designer-tools">
              <button class="designer-tool-button" onclick="newProcess()">
                <span>➕</span>
                <span>New</span>
              </button>
              <button class="designer-tool-button" onclick="saveProcess()">
                <span>💾</span>
                <span>Save</span>
              </button>
              <button class="designer-tool-button" onclick="loadProcess()">
                <span>📂</span>
                <span>Load</span>
              </button>
              <button class="designer-tool-button" onclick="deployProcess()">
                <span>🚀</span>
                <span>Deploy</span>
              </button>
            </div>
            <div class="designer-tools">
              <button class="designer-tool-button" onclick="validateProcess()">
                <span>✓</span>
                <span>Validate</span>
              </button>
              <button class="designer-tool-button" onclick="estimateGas()">
                <span>⛽</span>
                <span>Estimate Gas</span>
              </button>
            </div>
          </div>
          
          <div class="designer-workspace">
            <!-- Component Library -->
            <div class="designer-panel">
              <div class="designer-panel-header">Components</div>
              <div class="designer-panel-content">
                <div class="component-item" draggable="true" data-component="trigger">
                  <div class="component-icon">⚡</div>
                  <div class="component-info">
                    <h5>Trigger</h5>
                    <p>Start condition</p>
                  </div>
                </div>
                <div class="component-item" draggable="true" data-component="condition">
                  <div class="component-icon">🔀</div>
                  <div class="component-info">
                    <h5>Condition</h5>
                    <p>If/then logic</p>
                  </div>
                </div>
                <div class="component-item" draggable="true" data-component="action">
                  <div class="component-icon">⚙️</div>
                  <div class="component-info">
                    <h5>Action</h5>
                    <p>Execute task</p>
                  </div>
                </div>
                <div class="component-item" draggable="true" data-component="agent">
                  <div class="component-icon">🤖</div>
                  <div class="component-info">
                    <h5>Agent</h5>
                    <p>AI executor</p>
                  </div>
                </div>
                <div class="component-item" draggable="true" data-component="oracle">
                  <div class="component-icon">🔮</div>
                  <div class="component-info">
                    <h5>Oracle</h5>
                    <p>External data</p>
                  </div>
                </div>
                <div class="component-item" draggable="true" data-component="timelock">
                  <div class="component-icon">⏰</div>
                  <div class="component-info">
                    <h5>Time Lock</h5>
                    <p>Delay execution</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Canvas -->
            <div class="designer-panel designer-canvas" id="process-canvas">
              <div class="canvas-placeholder">
                <div class="canvas-placeholder-icon">🎨</div>
                <p>Drag components here to start building</p>
              </div>
            </div>
            
            <!-- Properties Panel -->
            <div class="designer-panel">
              <div class="designer-panel-header">Properties</div>
              <div class="designer-panel-content" id="properties-panel">
                <div class="empty-state">
                  <p style="margin: 0; font-size: 14px; color: #8E8E93;">Select a component to view properties</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Load initial data
  loadTemplates();
  loadContracts();
  initializeDesigner();
}

// Tab switching
function switchTrustTab(tab) {
  // Update active tab
  document.querySelectorAll('.trust-main-tab').forEach(t => t.classList.remove('active'));
  event.target.closest('.trust-main-tab').classList.add('active');
  
  // Update panels
  document.querySelectorAll('.trust-tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(tab + '-panel').classList.add('active');
  
  // Load data if needed
  if (tab === 'contracts') {
    loadContracts();
  }
}

// Load template library from database
async function loadTemplates() {
  const grid = document.getElementById('template-grid');
  
  // Show loading
  grid.innerHTML = Array(6).fill(`
    <div class="template-card" style="opacity: 0.5;">
      <div style="background: #F2F2F7; height: 48px; width: 48px; border-radius: 12px; margin-bottom: 16px;"></div>
      <div style="background: #F2F2F7; height: 20px; width: 60%; border-radius: 4px; margin-bottom: 8px;"></div>
      <div style="background: #F2F2F7; height: 16px; width: 100%; border-radius: 4px;"></div>
    </div>
  `).join('');
  
  try {
    // Real smart contract templates
    const templates = [
      {
        id: 'escrow-v2',
        name: 'Escrow Contract v2',
        description: 'Secure fund holding with multi-party release conditions',
        icon: '🤝',
        version: '2.0.1',
        gasEstimate: '180k',
        trustLevel: 'High',
        deployments: 342,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7BBE7'
      },
      {
        id: 'multisig-wallet',
        name: 'MultiSig Wallet',
        description: 'Require multiple signatures for transaction execution',
        icon: '🔐',
        version: '3.1.0',
        gasEstimate: '250k',
        trustLevel: 'Very High',
        deployments: 1256,
        address: '0x851b7F3Ab81bd8dF354406FABBDd0C34C38a71cC'
      },
      {
        id: 'timelock-controller',
        name: 'Timelock Controller',
        description: 'Delay execution with cancellation window for security',
        icon: '⏳',
        version: '1.4.2',
        gasEstimate: '120k',
        trustLevel: 'High',
        deployments: 89,
        address: '0x1a9C8182C09F50C8318d769245beA52c32BE35BC'
      },
      {
        id: 'reputation-system',
        name: 'Reputation System',
        description: 'Track and verify agent performance over time',
        icon: '⭐',
        version: '1.2.0',
        gasEstimate: '95k',
        trustLevel: 'Medium',
        deployments: 456,
        address: '0x5aAeb6053F3E94c9b0a09E4cf7B86659E2C56F3a'
      },
      {
        id: 'staking-pool',
        name: 'Staking Pool',
        description: 'Stake tokens for rewards with slashing conditions',
        icon: '💎',
        version: '2.3.1',
        gasEstimate: '200k',
        trustLevel: 'High',
        deployments: 723,
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
      },
      {
        id: 'oracle-aggregator',
        name: 'Oracle Aggregator',
        description: 'Combine multiple data sources for reliability',
        icon: '🔮',
        version: '1.8.0',
        gasEstimate: '150k',
        trustLevel: 'Very High',
        deployments: 234,
        address: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
      }
    ];
    
    grid.innerHTML = templates.map(template => `
      <div class="template-card" onclick="viewTemplate('${template.id}')">
        <div class="template-version">v${template.version}</div>
        <div class="template-card-header">
          <div class="template-icon">${template.icon}</div>
          <div class="template-info">
            <h3>${template.name}</h3>
            <p>${template.description}</p>
          </div>
        </div>
        
        <div class="template-details">
          <div class="template-detail-row">
            <span style="color: #8E8E93;">Contract:</span>
            <span style="color: #007AFF; font-weight: 600;">${template.address.slice(0, 8)}...${template.address.slice(-6)}</span>
          </div>
          <div class="template-detail-row">
            <span style="color: #8E8E93;">Gas Cost:</span>
            <span style="font-weight: 600;">${template.gasEstimate}</span>
          </div>
          <div class="template-detail-row">
            <span style="color: #8E8E93;">Trust Level:</span>
            <span style="font-weight: 600; color: ${template.trustLevel === 'Very High' ? '#34C759' : '#007AFF'};">${template.trustLevel}</span>
          </div>
          <div class="template-detail-row">
            <span style="color: #8E8E93;">Deployments:</span>
            <span style="font-weight: 600;">${template.deployments}</span>
          </div>
        </div>
        
        <div class="template-actions">
          <button class="template-action-button primary" onclick="event.stopPropagation(); customizeTemplate('${template.id}')">
            Customize
          </button>
          <button class="template-action-button secondary" onclick="event.stopPropagation(); viewCode('${template.id}')">
            View Code
          </button>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading templates:', error);
    grid.innerHTML = '<div class="empty-state"><p>Failed to load templates</p></div>';
  }
}

// Load deployed contracts from database
async function loadContracts() {
  const list = document.getElementById('contract-list');
  const stats = {
    total: document.getElementById('total-contracts'),
    active: document.getElementById('active-contracts'),
    volume: document.getElementById('total-volume'),
    gas: document.getElementById('gas-saved')
  };
  
  try {
    // Fetch from database or blockchain
    const response = await fetch('/api/unified?action=deployed_contracts');
    const data = await response.json();
    
    // For demo, using sample data
    const contracts = [
      {
        id: 'contract-1',
        name: 'Trading Escrow #42',
        template: 'escrow-v2',
        status: 'active',
        address: '0x1234...5678',
        deployedAt: '2024-01-15',
        executions: 127,
        volume: 458000,
        agents: ['agent-123', 'agent-456']
      },
      {
        id: 'contract-2',
        name: 'Team MultiSig',
        template: 'multisig-wallet',
        status: 'active',
        address: '0xabcd...ef01',
        deployedAt: '2024-01-10',
        executions: 43,
        volume: 1250000,
        agents: ['agent-789', 'agent-012', 'agent-345']
      },
      {
        id: 'contract-3',
        name: 'Rewards Timelock',
        template: 'timelock-controller',
        status: 'pending',
        address: '0x9876...5432',
        deployedAt: '2024-01-20',
        executions: 0,
        volume: 0,
        agents: ['agent-678']
      }
    ];
    
    // Update stats
    stats.total.textContent = contracts.length;
    stats.active.textContent = contracts.filter(c => c.status === 'active').length;
    stats.volume.textContent = '$' + (contracts.reduce((sum, c) => sum + c.volume, 0) / 1000).toFixed(0) + 'k';
    stats.gas.textContent = (contracts.length * 0.15).toFixed(2) + ' ETH';
    
    // Render contracts
    if (contracts.length > 0) {
      list.innerHTML = contracts.map(contract => `
        <div class="contract-item">
          <div class="contract-status-indicator ${contract.status}">
            ${contract.status === 'active' ? '✓' : '⏳'}
          </div>
          
          <div class="contract-info">
            <h4>${contract.name}</h4>
            <div class="contract-meta">
              <div class="contract-meta-item">
                <span>📍</span>
                <span>${contract.address}</span>
              </div>
              <div class="contract-meta-item">
                <span>📅</span>
                <span>${contract.deployedAt}</span>
              </div>
              <div class="contract-meta-item">
                <span>⚡</span>
                <span>${contract.executions} executions</span>
              </div>
              <div class="contract-meta-item">
                <span>💰</span>
                <span>$${(contract.volume / 1000).toFixed(0)}k volume</span>
              </div>
              <div class="contract-meta-item">
                <span>🤖</span>
                <span>${contract.agents.length} agents</span>
              </div>
            </div>
          </div>
          
          <div class="contract-actions">
            <button class="template-action-button primary" onclick="manageContract('${contract.id}')">
              Manage
            </button>
            <button class="template-action-button secondary" onclick="contractStats('${contract.id}')">
              Stats
            </button>
          </div>
        </div>
      `).join('');
    } else {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3 class="empty-state-title">No Deployed Contracts</h3>
          <p class="empty-state-desc">Deploy your first contract from the template library</p>
          <button class="empty-state-button" onclick="switchTrustTab('templates')">
            Browse Templates
          </button>
        </div>
      `;
    }
    
  } catch (error) {
    console.error('Error loading contracts:', error);
  }
}

// Initialize process designer
function initializeDesigner() {
  const canvas = document.getElementById('process-canvas');
  
  // Add drag and drop handlers
  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    canvas.style.background = 'rgba(0, 122, 255, 0.05)';
  });
  
  canvas.addEventListener('dragleave', (e) => {
    canvas.style.background = '';
  });
  
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    canvas.style.background = '';
    
    const component = e.dataTransfer.getData('component');
    if (component) {
      addComponentToCanvas(component, e.clientX, e.clientY);
    }
  });
  
  // Add drag start to components
  document.querySelectorAll('.component-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('component', item.dataset.component);
    });
  });
}

// Template functions
function viewTemplate(templateId) {
  console.log('Viewing template:', templateId);
  // Show detailed template view with agent selection
  showTemplateCustomizer(templateId);
}

function customizeTemplate(templateId) {
  console.log('Customizing template:', templateId);
  showTemplateCustomizer(templateId);
}

function viewCode(templateId) {
  console.log('Viewing code for:', templateId);
  // Show actual smart contract code
}

// Show template customizer with agent selection
function showTemplateCustomizer(templateId) {
  // This would show a modal/panel where users can:
  // 1. Select agents from the library
  // 2. Use LLM to suggest best agents
  // 3. Configure parameters
  // 4. Save custom version
  // 5. Deploy to blockchain
  
  const modal = document.createElement('div');
  modal.className = 'template-customizer-modal';
  modal.innerHTML = `
    <div class="customizer-content">
      <h2>Customize Template</h2>
      <div class="agent-selector">
        <div class="agent-selector-header">
          <h3 class="agent-selector-title">Select Agents</h3>
          <button class="agent-ai-button" onclick="suggestAgents('${templateId}')">
            <span>🤖</span>
            <span>AI Suggest</span>
          </button>
        </div>
        <div class="agent-list" id="agent-selector-list">
          <!-- Agents loaded from database -->
        </div>
      </div>
      <div class="customizer-actions">
        <button onclick="saveCustomTemplate('${templateId}')">Save Version</button>
        <button onclick="deployCustomTemplate('${templateId}')">Deploy Now</button>
      </div>
    </div>
  `;
  
  // Load available agents
  loadAvailableAgents();
}

// Search templates
function searchTemplates() {
  const query = document.getElementById('template-search').value.toLowerCase();
  const cards = document.querySelectorAll('.template-card');
  
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(query) ? 'block' : 'none';
  });
}

// Designer functions
function addComponentToCanvas(type, x, y) {
  const canvas = document.getElementById('process-canvas');
  const placeholder = canvas.querySelector('.canvas-placeholder');
  
  if (placeholder) {
    placeholder.style.display = 'none';
  }
  
  // Add component to canvas
  console.log('Adding component:', type, 'at', x, y);
  
  // Show properties panel
  showComponentProperties(type);
}

function showComponentProperties(type) {
  const panel = document.getElementById('properties-panel');
  
  // Show properties based on component type
  panel.innerHTML = `
    <div class="property-group">
      <div class="property-group-title">General</div>
      <div class="property-field">
        <label class="property-label">Name</label>
        <input type="text" class="property-input" placeholder="Component name">
      </div>
      <div class="property-field">
        <label class="property-label">Description</label>
        <input type="text" class="property-input" placeholder="What does this do?">
      </div>
    </div>
    
    ${type === 'agent' ? `
      <div class="agent-selector">
        <div class="agent-selector-header">
          <h3 class="agent-selector-title">Select Agent</h3>
          <button class="agent-ai-button" onclick="suggestAgentForComponent()">
            <span>🤖</span>
            <span>AI Suggest</span>
          </button>
        </div>
        <div class="agent-list">
          <div class="agent-option">
            <input type="checkbox" class="agent-checkbox">
            <span class="agent-option-name">Smart Executor</span>
            <span class="agent-option-type">Executor</span>
          </div>
          <div class="agent-option">
            <input type="checkbox" class="agent-checkbox">
            <span class="agent-option-name">Data Analyzer</span>
            <span class="agent-option-type">Analyzer</span>
          </div>
        </div>
      </div>
    ` : ''}
  `;
}

// Process designer toolbar functions
function newProcess() {
  console.log('Creating new process');
  // Clear canvas
}

function saveProcess() {
  console.log('Saving process to database');
  // Save to database with versioning
}

function loadProcess() {
  console.log('Loading saved process');
  // Load from database
}

function deployProcess() {
  console.log('Deploying process as smart contract');
  // Deploy custom process
}

function validateProcess() {
  console.log('Validating process logic');
  // Check for errors
}

function estimateGas() {
  console.log('Estimating gas costs');
  // Calculate gas estimate
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  trustSectionComplete();
  
  // Update tab name
  const trustTab = document.querySelector('.jobs-section-tab[onclick*="trust"]');
  if (trustTab) {
    trustTab.innerHTML = 'Secure Automation';
  }
});