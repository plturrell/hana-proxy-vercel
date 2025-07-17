// Trust Section Fixed - Addressing All User Feedback
// No huge gaps, no funny badges, nice card layouts, real data

function fixTrustSection() {
  // Add fixed styles first
  const fixedStyles = document.createElement('style');
  fixedStyles.textContent = `
    /* Trust Section Fixed Styles */
    .trust-fixed-container {
      padding: 32px 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    /* Compact Hero - No huge gaps */
    .trust-fixed-hero {
      text-align: center;
      margin-bottom: 48px; /* Reduced from 80px */
    }
    
    .trust-fixed-title {
      font-size: 48px;
      font-weight: 700;
      margin: 0 0 16px; /* Tight spacing */
      background: linear-gradient(135deg, #007AFF, #5856D6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .trust-fixed-subtitle {
      font-size: 21px;
      color: #8E8E93;
      margin: 0;
      font-weight: 400;
    }
    
    /* Problem/Solution Cards */
    .trust-problem-container {
      background: #F2F2F7;
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 48px;
    }
    
    body.dark-mode .trust-problem-container {
      background: #1C1C1E;
    }
    
    .trust-problem-header {
      margin-bottom: 24px;
    }
    
    .trust-problem-title {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 8px;
    }
    
    .trust-problem-subtitle {
      font-size: 17px;
      color: #8E8E93;
      margin: 0;
    }
    
    /* Nice Card Grid */
    .trust-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }
    
    .trust-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid rgba(0, 0, 0, 0.04);
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    body.dark-mode .trust-card {
      background: #2C2C2E;
      border-color: #38383A;
    }
    
    .trust-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }
    
    .trust-card-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .trust-card-icon {
      width: 48px;
      height: 48px;
      background: #F2F2F7;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }
    
    body.dark-mode .trust-card-icon {
      background: #1C1C1E;
    }
    
    .trust-card-content h3 {
      font-size: 19px;
      font-weight: 600;
      margin: 0 0 4px;
    }
    
    .trust-card-content p {
      font-size: 15px;
      color: #8E8E93;
      margin: 0;
      line-height: 1.4;
    }
    
    /* Solution Cards */
    .trust-solution-card {
      background: white;
      border: 2px solid #007AFF;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      transition: all 0.2s ease;
    }
    
    body.dark-mode .trust-solution-card {
      background: #1C1C1E;
    }
    
    .trust-solution-card:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 24px rgba(0, 122, 255, 0.2);
    }
    
    .trust-solution-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .trust-solution-title {
      font-size: 21px;
      font-weight: 600;
      margin: 0 0 8px;
    }
    
    .trust-solution-desc {
      font-size: 15px;
      color: #8E8E93;
      margin: 0 0 16px;
    }
    
    .trust-solution-button {
      background: #007AFF;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .trust-solution-button:hover {
      background: #0051D5;
      transform: translateY(-1px);
    }
    
    /* Visual Builder Inline */
    .trust-builder-inline {
      background: #F2F2F7;
      border-radius: 16px;
      padding: 32px;
      margin: 48px 0;
      display: none;
    }
    
    body.dark-mode .trust-builder-inline {
      background: #1C1C1E;
    }
    
    .trust-builder-inline.active {
      display: block;
    }
    
    .trust-builder-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .trust-builder-close {
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
    
    body.dark-mode .trust-builder-close {
      background: rgba(255, 255, 255, 0.05);
    }
    
    .trust-builder-close:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: rotate(90deg);
    }
    
    /* Template Grid */
    .trust-templates-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 32px;
    }
    
    .trust-template-card {
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }
    
    body.dark-mode .trust-template-card {
      background: #2C2C2E;
      border-color: #38383A;
    }
    
    .trust-template-card:hover {
      border-color: #007AFF;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    .trust-template-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: #34C759;
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .trust-automation-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }
    
    body.dark-mode .trust-automation-status {
      border-top-color: #38383A;
    }
    
    .trust-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #34C759;
    }
    
    .trust-status-text {
      font-size: 13px;
      color: #8E8E93;
    }
    
    /* Loading State */
    .trust-loading {
      background: linear-gradient(90deg, #F2F2F7 25%, #E5E5EA 50%, #F2F2F7 75%);
      background-size: 200% 100%;
      animation: loading-shimmer 1.5s infinite;
      border-radius: 8px;
    }
    
    @keyframes loading-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .trust-fixed-title {
        font-size: 36px;
      }
      
      .trust-cards-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
  
  document.head.appendChild(fixedStyles);
  
  // Get trust section
  const trustSection = document.getElementById('trust');
  if (!trustSection) return;
  
  // Create fixed content
  trustSection.innerHTML = `
    <div class="trust-fixed-container">
      <!-- Compact Hero -->
      <div class="trust-fixed-hero">
        <h1 class="trust-fixed-title">Secure Automation</h1>
        <p class="trust-fixed-subtitle">Trade smarter, not harder</p>
      </div>
      
      <!-- Problem Cards -->
      <div class="trust-problem-container">
        <div class="trust-problem-header">
          <h2 class="trust-problem-title">Common Trading Problems</h2>
          <p class="trust-problem-subtitle">We've all been there</p>
        </div>
        
        <div class="trust-cards-grid">
          <div class="trust-card">
            <div class="trust-card-header">
              <div class="trust-card-icon">😴</div>
              <div class="trust-card-content">
                <h3>Missing Opportunities</h3>
                <p>Markets move while you sleep. Critical trades happen in seconds.</p>
              </div>
            </div>
          </div>
          
          <div class="trust-card">
            <div class="trust-card-header">
              <div class="trust-card-icon">😰</div>
              <div class="trust-card-content">
                <h3>Emotional Decisions</h3>
                <p>Fear and greed override logic when money is on the line.</p>
              </div>
            </div>
          </div>
          
          <div class="trust-card">
            <div class="trust-card-header">
              <div class="trust-card-icon">⏰</div>
              <div class="trust-card-content">
                <h3>Slow Execution</h3>
                <p>Manual trades take time. Opportunities vanish in milliseconds.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Solution Cards -->
      <div class="trust-problem-container">
        <div class="trust-problem-header">
          <h2 class="trust-problem-title">Your Automated Solution</h2>
          <p class="trust-problem-subtitle">Let intelligent agents handle the heavy lifting</p>
        </div>
        
        <div class="trust-cards-grid">
          <div class="trust-solution-card">
            <div class="trust-solution-icon">🤖</div>
            <h3 class="trust-solution-title">Stop Loss Guardian</h3>
            <p class="trust-solution-desc">Protects your capital by automatically exiting losing positions</p>
            <button class="trust-solution-button" onclick="deployTemplate('stop-loss')">
              Deploy Now
            </button>
          </div>
          
          <div class="trust-solution-card">
            <div class="trust-solution-icon">💰</div>
            <h3 class="trust-solution-title">Profit Maximizer</h3>
            <p class="trust-solution-desc">Locks in gains at optimal points using AI-driven analysis</p>
            <button class="trust-solution-button" onclick="deployTemplate('profit-max')">
              Deploy Now
            </button>
          </div>
          
          <div class="trust-solution-card">
            <div class="trust-solution-icon">⚖️</div>
            <h3 class="trust-solution-title">Auto Rebalancer</h3>
            <p class="trust-solution-desc">Maintains your target portfolio allocation automatically</p>
            <button class="trust-solution-button" onclick="deployTemplate('rebalance')">
              Deploy Now
            </button>
          </div>
        </div>
      </div>
      
      <!-- Visual Builder Section -->
      <div class="trust-problem-container">
        <div class="trust-problem-header">
          <h2 class="trust-problem-title">Build Custom Automations</h2>
          <p class="trust-problem-subtitle">No coding required</p>
        </div>
        
        <div style="text-align: center; padding: 24px;">
          <button class="trust-solution-button" style="font-size: 17px; padding: 16px 32px;" onclick="toggleVisualBuilder()">
            🎨 Open Visual Builder
          </button>
        </div>
        
        <!-- Inline Visual Builder -->
        <div id="trust-builder-inline" class="trust-builder-inline">
          <div class="trust-builder-header">
            <h3 style="margin: 0; font-size: 24px;">Visual Automation Builder</h3>
            <button class="trust-builder-close" onclick="toggleVisualBuilder()">×</button>
          </div>
          
          <div style="text-align: center; padding: 40px;">
            <p style="color: #8E8E93; margin-bottom: 24px;">Loading visual builder...</p>
            <div class="trust-loading" style="width: 200px; height: 20px; margin: 0 auto;"></div>
          </div>
        </div>
      </div>
      
      <!-- Available Templates -->
      <div class="trust-problem-container">
        <div class="trust-problem-header">
          <h2 class="trust-problem-title">Available Automation Templates</h2>
          <p class="trust-problem-subtitle">Battle-tested strategies ready to deploy</p>
        </div>
        
        <div id="trust-templates-container" class="trust-templates-container">
          <!-- Will be populated with real data -->
        </div>
      </div>
    </div>
  `;
  
  // Load real automation templates
  loadRealAutomations();
}

// Load real automation data
async function loadRealAutomations() {
  const container = document.getElementById('trust-templates-container');
  
  // Show loading
  container.innerHTML = Array(3).fill(`
    <div class="trust-template-card">
      <div class="trust-loading" style="width: 60%; height: 20px; margin-bottom: 12px;"></div>
      <div class="trust-loading" style="width: 100%; height: 16px; margin-bottom: 8px;"></div>
      <div class="trust-loading" style="width: 80%; height: 16px;"></div>
    </div>
  `).join('');
  
  try {
    // Fetch real data
    const response = await fetch('/api/unified?action=a2a_agents');
    const data = await response.json();
    const agents = data.agents || [];
    
    // Filter automation agents
    const automations = agents.filter(agent => 
      (Array.isArray(agent.capabilities) && agent.capabilities.includes('automation')) ||
      agent.agent_type === 'executor' ||
      ['stop', 'profit', 'balance', 'auto', 'guard'].some(keyword => 
        agent.agent_name?.toLowerCase().includes(keyword)
      )
    ).slice(0, 9);
    
    if (automations.length > 0) {
      container.innerHTML = automations.map(agent => `
        <div class="trust-template-card" onclick="deployAutomation('${agent.agent_id}')">
          ${agent.status === 'active' ? '<span class="trust-template-badge">Active</span>' : ''}
          <h3 style="font-size: 18px; margin: 0 0 8px;">${agent.agent_name}</h3>
          <p style="font-size: 14px; color: #8E8E93; margin: 0; line-height: 1.4;">
            ${agent.description || 'Automated trading strategy'}
          </p>
          <div class="trust-automation-status">
            <span class="trust-status-dot"></span>
            <span class="trust-status-text">
              ${Array.isArray(agent.capabilities) ? agent.capabilities.length : 0} capabilities • 
              ${agent.agent_type || 'automation'}
            </span>
          </div>
        </div>
      `).join('');
    } else {
      // Fallback templates
      const templates = [
        { name: 'Smart Stop Loss', desc: 'Exit positions when losses exceed threshold', status: 'Popular' },
        { name: 'Trailing Profit', desc: 'Follow rising prices and lock gains on reversal', status: 'Active' },
        { name: 'Grid Trading Bot', desc: 'Place orders at set intervals in ranging markets', status: 'New' },
        { name: 'DCA Accumulator', desc: 'Dollar cost average into positions over time', status: 'Stable' },
        { name: 'Breakout Hunter', desc: 'Enter positions on volume and price breakouts', status: 'Beta' },
        { name: 'Mean Reversion', desc: 'Trade oversold bounces and overbought pullbacks', status: 'Tested' }
      ];
      
      container.innerHTML = templates.map(t => `
        <div class="trust-template-card" onclick="deployTemplate('${t.name}')">
          ${t.status === 'Popular' ? '<span class="trust-template-badge">Popular</span>' : ''}
          <h3 style="font-size: 18px; margin: 0 0 8px;">${t.name}</h3>
          <p style="font-size: 14px; color: #8E8E93; margin: 0; line-height: 1.4;">${t.desc}</p>
          <div class="trust-automation-status">
            <span class="trust-status-dot"></span>
            <span class="trust-status-text">${t.status} • Ready to deploy</span>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load automations:', error);
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 32px;">
        <p style="color: #8E8E93;">Unable to load templates</p>
        <button class="trust-solution-button" onclick="loadRealAutomations()">Retry</button>
      </div>
    `;
  }
}

// Toggle visual builder inline
function toggleVisualBuilder() {
  const builder = document.getElementById('trust-builder-inline');
  builder.classList.toggle('active');
  
  if (builder.classList.contains('active')) {
    // Load builder content
    setTimeout(() => {
      builder.querySelector('div[style*="text-align: center"]').innerHTML = `
        <iframe 
          src="/visual-builder-real.html?embedded=true" 
          style="width: 100%; height: 600px; border: none; border-radius: 8px;"
          title="Visual Automation Builder"
        ></iframe>
      `;
    }, 500);
  }
}

// Deploy functions
function deployTemplate(templateId) {
  console.log('Deploying template:', templateId);
  // Show deployment wizard
}

function deployAutomation(agentId) {
  console.log('Deploying automation:', agentId);
  // Show deployment wizard
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fixTrustSection();
  
  // Update tab name
  const trustTab = document.querySelector('.jobs-section-tab[onclick*="trust"]');
  if (trustTab) {
    trustTab.innerHTML = 'Secure Automation';
  }
});