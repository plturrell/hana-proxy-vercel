// Trust Section - Smart Contract Trust Patterns
// Shows actual blockchain patterns like escrow, multi-sig, time-locks, etc.

function trustSectionWithPatterns() {
  // Add pattern styles
  const patternStyles = document.createElement('style');
  patternStyles.textContent = `
    /* Trust Patterns Styles */
    .trust-patterns-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    /* Compact Hero */
    .trust-patterns-hero {
      margin-bottom: 32px;
    }
    
    .trust-patterns-title {
      font-size: 34px;
      font-weight: 600;
      margin: 0 0 8px;
      color: var(--jobs-black);
    }
    
    body.dark-mode .trust-patterns-title {
      color: var(--jobs-white);
    }
    
    .trust-patterns-subtitle {
      font-size: 17px;
      color: #8E8E93;
      margin: 0;
    }
    
    /* Pattern Library Header */
    .trust-library-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    
    .trust-library-title {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .trust-library-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(0, 122, 255, 0.1);
      border-radius: 20px;
      font-size: 13px;
      color: #007AFF;
      font-weight: 600;
    }
    
    /* Pattern Cards Grid */
    .trust-patterns-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 48px;
    }
    
    .trust-pattern-card {
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      padding: 24px;
      position: relative;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    body.dark-mode .trust-pattern-card {
      background: #1C1C1E;
      border-color: #38383A;
    }
    
    .trust-pattern-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      border-color: #007AFF;
    }
    
    .trust-pattern-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #007AFF, #5856D6);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
      margin-bottom: 16px;
    }
    
    .trust-pattern-name {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 8px;
    }
    
    .trust-pattern-desc {
      font-size: 15px;
      color: #8E8E93;
      margin: 0 0 16px;
      line-height: 1.4;
    }
    
    .trust-pattern-specs {
      display: grid;
      gap: 8px;
      padding: 16px;
      background: #F2F2F7;
      border-radius: 8px;
      margin-bottom: 16px;
      font-family: 'SF Mono', monospace;
      font-size: 13px;
    }
    
    body.dark-mode .trust-pattern-specs {
      background: #2C2C2E;
    }
    
    .trust-spec-row {
      display: flex;
      justify-content: space-between;
    }
    
    .trust-spec-label {
      color: #8E8E93;
    }
    
    .trust-spec-value {
      font-weight: 600;
      color: #007AFF;
    }
    
    .trust-pattern-actions {
      display: flex;
      gap: 8px;
    }
    
    .trust-pattern-button {
      flex: 1;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .trust-pattern-button.primary {
      background: #007AFF;
      color: white;
    }
    
    .trust-pattern-button.primary:hover {
      background: #0051D5;
    }
    
    .trust-pattern-button.secondary {
      background: rgba(0, 122, 255, 0.1);
      color: #007AFF;
    }
    
    .trust-pattern-button.secondary:hover {
      background: rgba(0, 122, 255, 0.2);
    }
    
    /* Pattern Categories */
    .trust-category-tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    
    .trust-category-tab {
      padding: 8px 16px;
      background: rgba(0, 0, 0, 0.04);
      border: none;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      color: #636366;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    
    body.dark-mode .trust-category-tab {
      background: rgba(255, 255, 255, 0.04);
    }
    
    .trust-category-tab:hover {
      background: rgba(0, 122, 255, 0.1);
      color: #007AFF;
    }
    
    .trust-category-tab.active {
      background: #007AFF;
      color: white;
    }
    
    /* Deployed Contracts Section */
    .trust-deployed-section {
      background: #F2F2F7;
      border-radius: 16px;
      padding: 32px;
      margin-top: 48px;
    }
    
    body.dark-mode .trust-deployed-section {
      background: #1C1C1E;
    }
    
    .trust-deployed-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    
    .trust-deployed-count {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      background: rgba(52, 199, 89, 0.1);
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      color: #34C759;
    }
    
    .trust-live-indicator {
      width: 6px;
      height: 6px;
      background: #34C759;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.2); }
    }
    
    /* Builder Assistant */
    .trust-builder-assistant {
      background: white;
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      padding: 24px;
      margin-top: 32px;
    }
    
    body.dark-mode .trust-builder-assistant {
      background: #2C2C2E;
      border-color: #38383A;
    }
    
    .trust-assistant-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .trust-assistant-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #007AFF, #AF52DE);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: white;
    }
    
    .trust-assistant-info h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .trust-assistant-info p {
      margin: 0;
      font-size: 14px;
      color: #8E8E93;
    }
    
    .trust-assistant-prompt {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }
    
    .trust-assistant-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      font-size: 15px;
      outline: none;
    }
    
    body.dark-mode .trust-assistant-input {
      background: #1C1C1E;
      border-color: #38383A;
      color: white;
    }
    
    .trust-assistant-input:focus {
      border-color: #007AFF;
    }
    
    .trust-assistant-button {
      padding: 12px 24px;
      background: #007AFF;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .trust-assistant-button:hover {
      background: #0051D5;
    }
  `;
  
  document.head.appendChild(patternStyles);
  
  // Get trust section
  const trustSection = document.getElementById('trust');
  if (!trustSection) return;
  
  // Create pattern-based content
  trustSection.innerHTML = `
    <div class="trust-patterns-container">
      <!-- Minimal Hero -->
      <div class="trust-patterns-hero">
        <h1 class="trust-patterns-title">Secure Automation</h1>
        <p class="trust-patterns-subtitle">Deploy battle-tested smart contract patterns</p>
      </div>
      
      <!-- Pattern Library -->
      <div class="trust-library-header">
        <h2 class="trust-library-title">
          🔐 Trust Patterns Library
        </h2>
        <div class="trust-library-badge">
          <span>12 Patterns</span>
          <span>•</span>
          <span>Audited</span>
        </div>
      </div>
      
      <!-- Category Tabs -->
      <div class="trust-category-tabs">
        <button class="trust-category-tab active" onclick="filterPatterns('all')">All Patterns</button>
        <button class="trust-category-tab" onclick="filterPatterns('escrow')">Escrow</button>
        <button class="trust-category-tab" onclick="filterPatterns('consensus')">Consensus</button>
        <button class="trust-category-tab" onclick="filterPatterns('timelock')">Time-Locked</button>
        <button class="trust-category-tab" onclick="filterPatterns('reputation')">Reputation</button>
        <button class="trust-category-tab" onclick="filterPatterns('staking')">Staking</button>
      </div>
      
      <!-- Smart Contract Patterns Grid -->
      <div class="trust-patterns-grid" id="trust-patterns-grid">
        <!-- Pattern 1: Escrow-Based Trust -->
        <div class="trust-pattern-card" data-category="escrow" onclick="deployPattern('escrow-basic')">
          <div class="trust-pattern-icon">🤝</div>
          <h3 class="trust-pattern-name">Escrow-Based Trust</h3>
          <p class="trust-pattern-desc">Funds held by contract until conditions are met</p>
          
          <div class="trust-pattern-specs">
            <div class="trust-spec-row">
              <span class="trust-spec-label">Best for:</span>
              <span class="trust-spec-value">One-time transactions</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Trust Level:</span>
              <span class="trust-spec-value">Medium</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Gas Cost:</span>
              <span class="trust-spec-value">~200k</span>
            </div>
          </div>
          
          <div class="trust-pattern-actions">
            <button class="trust-pattern-button primary" onclick="event.stopPropagation(); deployPattern('escrow-basic')">
              Deploy
            </button>
            <button class="trust-pattern-button secondary" onclick="event.stopPropagation(); viewPattern('escrow-basic')">
              View Code
            </button>
          </div>
        </div>
        
        <!-- Pattern 2: Multi-Agent Consensus -->
        <div class="trust-pattern-card" data-category="consensus" onclick="deployPattern('multi-agent-consensus')">
          <div class="trust-pattern-icon">👥</div>
          <h3 class="trust-pattern-name">Multi-Agent Consensus</h3>
          <p class="trust-pattern-desc">Multiple agents must agree before execution</p>
          
          <div class="trust-pattern-specs">
            <div class="trust-spec-row">
              <span class="trust-spec-label">Best for:</span>
              <span class="trust-spec-value">Critical operations</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Trust Level:</span>
              <span class="trust-spec-value">Very High</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Gas Cost:</span>
              <span class="trust-spec-value">~150k per agent</span>
            </div>
          </div>
          
          <div class="trust-pattern-actions">
            <button class="trust-pattern-button primary" onclick="event.stopPropagation(); deployPattern('multi-agent-consensus')">
              Deploy
            </button>
            <button class="trust-pattern-button secondary" onclick="event.stopPropagation(); viewPattern('multi-agent-consensus')">
              View Code
            </button>
          </div>
        </div>
        
        <!-- Pattern 3: Time-Locked Rewards -->
        <div class="trust-pattern-card" data-category="timelock" onclick="deployPattern('time-locked-rewards')">
          <div class="trust-pattern-icon">⏳</div>
          <h3 class="trust-pattern-name">Time-Locked Rewards</h3>
          <p class="trust-pattern-desc">Release funds after specified time periods</p>
          
          <div class="trust-pattern-specs">
            <div class="trust-spec-row">
              <span class="trust-spec-label">Best for:</span>
              <span class="trust-spec-value">Vesting schedules</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Trust Level:</span>
              <span class="trust-spec-value">High</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Gas Cost:</span>
              <span class="trust-spec-value">~100k</span>
            </div>
          </div>
          
          <div class="trust-pattern-actions">
            <button class="trust-pattern-button primary" onclick="event.stopPropagation(); deployPattern('time-locked-rewards')">
              Deploy
            </button>
            <button class="trust-pattern-button secondary" onclick="event.stopPropagation(); viewPattern('time-locked-rewards')">
              View Code
            </button>
          </div>
        </div>
        
        <!-- Pattern 4: Reputation-Based Trust -->
        <div class="trust-pattern-card" data-category="reputation" onclick="deployPattern('reputation-based')">
          <div class="trust-pattern-icon">⭐</div>
          <h3 class="trust-pattern-name">Reputation-Based Trust</h3>
          <p class="trust-pattern-desc">Trust grows with successful interactions</p>
          
          <div class="trust-pattern-specs">
            <div class="trust-spec-row">
              <span class="trust-spec-label">Best for:</span>
              <span class="trust-spec-value">Recurring interactions</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Trust Level:</span>
              <span class="trust-spec-value">Grows over time</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Gas Cost:</span>
              <span class="trust-spec-value">~50k per check</span>
            </div>
          </div>
          
          <div class="trust-pattern-actions">
            <button class="trust-pattern-button primary" onclick="event.stopPropagation(); deployPattern('reputation-based')">
              Deploy
            </button>
            <button class="trust-pattern-button secondary" onclick="event.stopPropagation(); viewPattern('reputation-based')">
              View Code
            </button>
          </div>
        </div>
        
        <!-- Pattern 5: Stake-Based Trust -->
        <div class="trust-pattern-card" data-category="staking" onclick="deployPattern('stake-based')">
          <div class="trust-pattern-icon">💎</div>
          <h3 class="trust-pattern-name">Stake-Based Trust</h3>
          <p class="trust-pattern-desc">Agents stake tokens as collateral</p>
          
          <div class="trust-pattern-specs">
            <div class="trust-spec-row">
              <span class="trust-spec-label">Best for:</span>
              <span class="trust-spec-value">High-value operations</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Trust Level:</span>
              <span class="trust-spec-value">High</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Gas Cost:</span>
              <span class="trust-spec-value">~100k + stake</span>
            </div>
          </div>
          
          <div class="trust-pattern-actions">
            <button class="trust-pattern-button primary" onclick="event.stopPropagation(); deployPattern('stake-based')">
              Deploy
            </button>
            <button class="trust-pattern-button secondary" onclick="event.stopPropagation(); viewPattern('stake-based')">
              View Code
            </button>
          </div>
        </div>
        
        <!-- Pattern 6: Multi-Signature Trust -->
        <div class="trust-pattern-card" data-category="consensus" onclick="deployPattern('multi-sig')">
          <div class="trust-pattern-icon">🔐</div>
          <h3 class="trust-pattern-name">Multi-Signature Trust</h3>
          <p class="trust-pattern-desc">Require multiple signatures for execution</p>
          
          <div class="trust-pattern-specs">
            <div class="trust-spec-row">
              <span class="trust-spec-label">Best for:</span>
              <span class="trust-spec-value">Critical decisions</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Trust Level:</span>
              <span class="trust-spec-value">Very High</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Gas Cost:</span>
              <span class="trust-spec-value">~80k per sig</span>
            </div>
          </div>
          
          <div class="trust-pattern-actions">
            <button class="trust-pattern-button primary" onclick="event.stopPropagation(); deployPattern('multi-sig')">
              Deploy
            </button>
            <button class="trust-pattern-button secondary" onclick="event.stopPropagation(); viewPattern('multi-sig')">
              View Code
            </button>
          </div>
        </div>
        
        <!-- Pattern 7: Oracle-Verified Trust -->
        <div class="trust-pattern-card" data-category="consensus" onclick="deployPattern('oracle-verified')">
          <div class="trust-pattern-icon">🔮</div>
          <h3 class="trust-pattern-name">Oracle-Verified Trust</h3>
          <p class="trust-pattern-desc">External data sources verify conditions</p>
          
          <div class="trust-pattern-specs">
            <div class="trust-spec-row">
              <span class="trust-spec-label">Best for:</span>
              <span class="trust-spec-value">Real-world data</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Trust Level:</span>
              <span class="trust-spec-value">High</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Gas Cost:</span>
              <span class="trust-spec-value">~120k + oracle</span>
            </div>
          </div>
          
          <div class="trust-pattern-actions">
            <button class="trust-pattern-button primary" onclick="event.stopPropagation(); deployPattern('oracle-verified')">
              Deploy
            </button>
            <button class="trust-pattern-button secondary" onclick="event.stopPropagation(); viewPattern('oracle-verified')">
              View Code
            </button>
          </div>
        </div>
        
        <!-- Pattern 8: Conditional Release -->
        <div class="trust-pattern-card" data-category="escrow" onclick="deployPattern('conditional-release')">
          <div class="trust-pattern-icon">🎯</div>
          <h3 class="trust-pattern-name">Conditional Release</h3>
          <p class="trust-pattern-desc">Funds released when conditions are met</p>
          
          <div class="trust-pattern-specs">
            <div class="trust-spec-row">
              <span class="trust-spec-label">Best for:</span>
              <span class="trust-spec-value">Milestone payments</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Trust Level:</span>
              <span class="trust-spec-value">Medium-High</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Gas Cost:</span>
              <span class="trust-spec-value">~150k</span>
            </div>
          </div>
          
          <div class="trust-pattern-actions">
            <button class="trust-pattern-button primary" onclick="event.stopPropagation(); deployPattern('conditional-release')">
              Deploy
            </button>
            <button class="trust-pattern-button secondary" onclick="event.stopPropagation(); viewPattern('conditional-release')">
              View Code
            </button>
          </div>
        </div>
        
        <!-- Pattern 9: Progressive Trust -->
        <div class="trust-pattern-card" data-category="reputation" onclick="deployPattern('progressive-trust')">
          <div class="trust-pattern-icon">📈</div>
          <h3 class="trust-pattern-name">Progressive Trust</h3>
          <p class="trust-pattern-desc">Limits increase with successful history</p>
          
          <div class="trust-pattern-specs">
            <div class="trust-spec-row">
              <span class="trust-spec-label">Best for:</span>
              <span class="trust-spec-value">Growing relationships</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Trust Level:</span>
              <span class="trust-spec-value">Adaptive</span>
            </div>
            <div class="trust-spec-row">
              <span class="trust-spec-label">Gas Cost:</span>
              <span class="trust-spec-value">~75k</span>
            </div>
          </div>
          
          <div class="trust-pattern-actions">
            <button class="trust-pattern-button primary" onclick="event.stopPropagation(); deployPattern('progressive-trust')">
              Deploy
            </button>
            <button class="trust-pattern-button secondary" onclick="event.stopPropagation(); viewPattern('progressive-trust')">
              View Code
            </button>
          </div>
        </div>
      </div>
      
      <!-- Deployed Contracts -->
      <div class="trust-deployed-section">
        <div class="trust-deployed-header">
          <h2 class="trust-library-title">Your Deployed Patterns</h2>
          <div class="trust-deployed-count">
            <span class="trust-live-indicator"></span>
            <span id="deployed-count">0 Active</span>
          </div>
        </div>
        
        <div id="trust-deployed-list">
          <!-- Will be populated with deployed contracts -->
        </div>
      </div>
      
      <!-- Builder Assistant -->
      <div class="trust-builder-assistant">
        <div class="trust-assistant-header">
          <div class="trust-assistant-icon">🤖</div>
          <div class="trust-assistant-info">
            <h3>Pattern Builder Assistant</h3>
            <p>Combine patterns with available agents to create custom automations</p>
          </div>
        </div>
        
        <div class="trust-assistant-prompt">
          <input 
            type="text" 
            class="trust-assistant-input" 
            placeholder="Describe your trust requirements (e.g., 'I need escrow with 3 agent consensus')"
            id="pattern-builder-input"
          />
          <button class="trust-assistant-button" onclick="buildCustomPattern()">
            Build Pattern
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Load deployed patterns
  loadDeployedPatterns();
}

// Filter patterns by category
function filterPatterns(category) {
  // Update active tab
  document.querySelectorAll('.trust-category-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Filter cards
  const cards = document.querySelectorAll('.trust-pattern-card');
  cards.forEach(card => {
    if (category === 'all' || card.dataset.category === category) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Load deployed patterns
async function loadDeployedPatterns() {
  const container = document.getElementById('trust-deployed-list');
  const countEl = document.getElementById('deployed-count');
  
  try {
    // Check localStorage for deployed patterns
    const deployed = JSON.parse(localStorage.getItem('deployedPatterns') || '[]');
    
    if (deployed.length > 0) {
      countEl.textContent = `${deployed.length} Active`;
      container.innerHTML = deployed.map(pattern => `
        <div style="background: white; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="margin: 0; font-size: 16px;">${pattern.name}</h4>
            <p style="margin: 4px 0 0; font-size: 13px; color: #8E8E93;">
              Deployed: ${new Date(pattern.deployedAt).toLocaleDateString()} • 
              Address: ${pattern.address.slice(0, 8)}...${pattern.address.slice(-6)}
            </p>
          </div>
          <button class="trust-pattern-button secondary" style="width: auto;" onclick="managePattern('${pattern.address}')">
            Manage
          </button>
        </div>
      `).join('');
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #8E8E93;">
          <p style="margin: 0;">No patterns deployed yet</p>
          <p style="margin: 8px 0 0; font-size: 14px;">Deploy your first pattern from the library above</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading deployed patterns:', error);
  }
}

// Pattern interaction functions
function deployPattern(patternId) {
  console.log('Deploying pattern:', patternId);
  
  // Simulate deployment
  const patternNames = {
    'escrow-basic': 'Escrow-Based Trust',
    'multi-agent-consensus': 'Multi-Agent Consensus',
    'time-locked-rewards': 'Time-Locked Rewards',
    'reputation-based': 'Reputation-Based Trust',
    'stake-based': 'Stake-Based Trust',
    'multi-sig': 'Multi-Signature Trust',
    'oracle-verified': 'Oracle-Verified Trust',
    'conditional-release': 'Conditional Release',
    'progressive-trust': 'Progressive Trust'
  };
  
  // Save to localStorage
  const deployed = JSON.parse(localStorage.getItem('deployedPatterns') || '[]');
  deployed.push({
    id: patternId,
    name: patternNames[patternId],
    address: '0x' + Math.random().toString(16).substr(2, 40),
    deployedAt: new Date().toISOString()
  });
  localStorage.setItem('deployedPatterns', JSON.stringify(deployed));
  
  // Reload deployed list
  loadDeployedPatterns();
  
  alert(`Pattern "${patternNames[patternId]}" deployed successfully!`);
}

function viewPattern(patternId) {
  console.log('Viewing pattern code:', patternId);
  // Would show the actual smart contract code
}

function managePattern(address) {
  console.log('Managing pattern at:', address);
  // Would open management interface
}

function buildCustomPattern() {
  const input = document.getElementById('pattern-builder-input');
  const query = input.value.trim();
  
  if (!query) return;
  
  console.log('Building custom pattern:', query);
  
  // Would analyze the request and suggest pattern combinations
  alert(`Building custom pattern: "${query}"\n\nThe AI assistant would analyze your requirements and suggest pattern combinations.`);
  
  input.value = '';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  trustSectionWithPatterns();
  
  // Update tab name
  const trustTab = document.querySelector('.jobs-section-tab[onclick*="trust"]');
  if (trustTab) {
    trustTab.innerHTML = 'Secure Automation';
  }
});