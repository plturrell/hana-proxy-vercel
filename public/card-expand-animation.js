// Card Expand Animation - Insanely Great In-Place Expansion
// Like the analyze screens - card expands to fill space without navigation

// Store original card positions and sizes
const cardStates = new Map();

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', function() {
  setupCardExpansion();
  updateSectionTitles();
});

// Setup card expansion functionality
function setupCardExpansion() {
  // Replace the "Agent Card" button functionality
  document.querySelectorAll('.jobs-action-button:not(.primary)').forEach(button => {
    if (button.textContent === 'Agent Card') {
      button.onclick = (e) => {
        e.stopPropagation();
        const card = button.closest('.jobs-model-card');
        const agentId = extractAgentId(button);
        expandCard(card, agentId);
      };
    }
  });
}

// Extract agent ID from button onclick
function extractAgentId(button) {
  const onclick = button.getAttribute('onclick');
  if (onclick) {
    const match = onclick.match(/showAgentDetailScreen\('([^']+)'\)/);
    return match ? match[1] : null;
  }
  return null;
}

// Expand card in place
function expandCard(card, agentId) {
  // Store original state
  const rect = card.getBoundingClientRect();
  const gridContainer = card.parentElement;
  const section = gridContainer.closest('.jobs-section');
  
  if (!cardStates.has(card)) {
    cardStates.set(card, {
      position: card.style.position || '',
      top: card.style.top || '',
      left: card.style.left || '',
      width: card.style.width || '',
      height: card.style.height || '',
      zIndex: card.style.zIndex || '',
      transform: card.style.transform || '',
      gridColumn: card.style.gridColumn || '',
      gridRow: card.style.gridRow || ''
    });
  }
  
  // Create expanded content
  const expandedContent = createExpandedContent(card, agentId);
  
  // Calculate grid position
  const allCards = Array.from(gridContainer.querySelectorAll('.jobs-model-card'));
  const cardIndex = allCards.indexOf(card);
  const cardsPerRow = 3; // Assuming 3 cards per row
  const rowIndex = Math.floor(cardIndex / cardsPerRow);
  
  // Hide other cards in the same row with animation
  allCards.forEach((otherCard, index) => {
    if (otherCard !== card) {
      const otherRow = Math.floor(index / cardsPerRow);
      if (otherRow === rowIndex) {
        otherCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        otherCard.style.opacity = '0';
        otherCard.style.transform = 'scale(0.8)';
        setTimeout(() => {
          otherCard.style.display = 'none';
        }, 300);
      }
    }
  });
  
  // Expand the card
  setTimeout(() => {
    card.classList.add('expanded-card');
    card.style.gridColumn = '1 / -1'; // Span full width
    card.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    card.style.height = 'auto';
    card.style.minHeight = '500px';
    card.style.zIndex = '100';
    
    // Replace content with expanded view
    const originalContent = card.innerHTML;
    card.setAttribute('data-original-content', originalContent);
    card.innerHTML = expandedContent;
    
    // Setup close button
    const closeBtn = card.querySelector('.expand-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => collapseCard(card, gridContainer);
    }
    
    // Add chart animations
    setTimeout(() => animateCharts(card), 300);
  }, 310);
}

// Create expanded content for the card
function createExpandedContent(card, agentId) {
  const agentName = card.querySelector('.a2a-agent-name')?.textContent || 'Agent';
  const agentDesc = card.querySelector('.a2a-agent-description')?.textContent || '';
  
  // Get agent-specific data
  const agentData = getAgentData(agentId);
  
  return `
    <div class="expanded-card-content">
      <div class="expand-header">
        <div class="expand-header-left">
          <h2 class="expand-title">${agentName}</h2>
          <p class="expand-subtitle">${agentDesc}</p>
        </div>
        <button class="expand-close-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      
      <div class="expand-metrics">
        <div class="metric-card">
          <div class="metric-value">${agentData.accuracy}</div>
          <div class="metric-label">Accuracy</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${agentData.performance}</div>
          <div class="metric-label">Performance</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${agentData.usage}</div>
          <div class="metric-label">Daily Usage</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${agentData.reliability}</div>
          <div class="metric-label">Reliability</div>
        </div>
      </div>
      
      <div class="expand-content-grid">
        <div class="expand-section">
          <h3>How It Works</h3>
          <div class="process-flow">
            ${agentData.processSteps.map((step, i) => `
              <div class="process-step" style="animation-delay: ${i * 0.1}s">
                <div class="step-number">${i + 1}</div>
                <div class="step-content">${step}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="expand-section">
          <h3>Mathematical Model</h3>
          <div class="formula-display">
            ${agentData.formula}
          </div>
          <div class="formula-description">
            ${agentData.formulaDesc}
          </div>
        </div>
        
        <div class="expand-section">
          <h3>Performance Analytics</h3>
          <div class="chart-container">
            <canvas id="performance-chart-${agentId}" width="400" height="200"></canvas>
          </div>
        </div>
        
        <div class="expand-section">
          <h3>Integration Example</h3>
          <pre class="code-example">${agentData.codeExample}</pre>
        </div>
      </div>
      
      <div class="expand-actions">
        <button class="action-btn primary" onclick="window.connectAgent('${agentId}')">
          Connect This Agent
        </button>
        <button class="action-btn secondary" onclick="showAgentNotification('Documentation opened in new tab')">
          View Documentation
        </button>
        <button class="action-btn secondary" onclick="showAgentNotification('API details copied to clipboard')">
          Copy API Details
        </button>
      </div>
    </div>
  `;
}

// Collapse card back to original state
function collapseCard(card, gridContainer) {
  // Restore original content
  const originalContent = card.getAttribute('data-original-content');
  if (originalContent) {
    card.innerHTML = originalContent;
  }
  
  // Remove expanded class
  card.classList.remove('expanded-card');
  
  // Restore original styles
  const originalState = cardStates.get(card);
  if (originalState) {
    Object.assign(card.style, originalState);
  }
  
  // Show other cards
  const allCards = gridContainer.querySelectorAll('.jobs-model-card');
  allCards.forEach(otherCard => {
    if (otherCard !== card) {
      otherCard.style.display = '';
      setTimeout(() => {
        otherCard.style.opacity = '1';
        otherCard.style.transform = 'scale(1)';
      }, 50);
    }
  });
  
  // Re-setup the button
  setupCardExpansion();
}

// Get agent-specific data
function getAgentData(agentId) {
  const agentDatabase = {
    'finsight.analytics.pearson_correlation': {
      accuracy: '99.8%',
      performance: '0.3ms',
      usage: '12.4K',
      reliability: '99.99%',
      processSteps: [
        'Data Collection & Validation',
        'Statistical Analysis',
        'Correlation Matrix Generation',
        'Confidence Interval Calculation',
        'Result Visualization'
      ],
      formula: 'ρ(X,Y) = cov(X,Y) / (σ_X × σ_Y)',
      formulaDesc: 'Pearson correlation coefficient measures linear relationship between two variables',
      codeExample: `// Connect to Correlation Agent
const correlation = await finsight.connect('correlation_analysis');
const result = await correlation.analyze({
  assets: ['AAPL', 'MSFT', 'GOOGL'],
  timeframe: '1Y',
  confidence: 0.95
});`
    },
    'finsight.analytics.value_at_risk': {
      accuracy: '98.5%',
      performance: '1.2ms',
      usage: '8.7K',
      reliability: '99.95%',
      processSteps: [
        'Portfolio Data Aggregation',
        'Historical Returns Calculation',
        'Risk Factor Analysis',
        'VaR Computation',
        'Stress Testing'
      ],
      formula: 'VaR_α = μ - σ × Φ^(-1)(α)',
      formulaDesc: 'Value at Risk quantifies potential loss at a given confidence level',
      codeExample: `// Calculate Portfolio VaR
const var = await finsight.connect('value_at_risk');
const risk = await var.calculate({
  portfolio: portfolioData,
  confidence: 0.99,
  horizon: '1D'
});`
    }
    // Add more agents as needed
  };
  
  return agentDatabase[agentId] || {
    accuracy: '95%+',
    performance: '<1ms',
    usage: '5K+',
    reliability: '99.9%',
    processSteps: ['Input Processing', 'Core Analysis', 'Result Generation'],
    formula: 'f(x) = AI(x)',
    formulaDesc: 'Advanced AI-powered analysis',
    codeExample: '// Connect and analyze\nconst agent = await finsight.connect(agentId);'
  };
}

// Animate charts when expanded
function animateCharts(card) {
  const canvas = card.querySelector('canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Simple performance chart animation
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = '#007AFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  const points = 50;
  for (let i = 0; i <= points; i++) {
    const x = (width / points) * i;
    const y = height / 2 + Math.sin(i * 0.2) * 30 * Math.random() - 15;
    
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  
  ctx.stroke();
}

// Update section titles to match agent types
function updateSectionTitles() {
  const titleMappings = {
    'Core Analytics (Functions 1-9)': 'Core Analytics Agents',
    'Financial Models (Functions 10-15)': 'Financial Agents',
    'Machine Learning (Functions 16-26)': 'Learning Agents',
    'Data Processing (Functions 27-35)': 'Data Agents'
  };
  
  document.querySelectorAll('.jobs-category-title').forEach(title => {
    const currentText = title.textContent;
    if (titleMappings[currentText]) {
      title.textContent = titleMappings[currentText];
    }
  });
  
  // Also update the overview title
  const headerTitle = document.querySelector('.jobs-header-title');
  if (headerTitle && headerTitle.textContent === 'A2A Agent Network') {
    headerTitle.textContent = 'Agent Network';
  }
}

// Add the CSS for expanded cards
const expandStyles = document.createElement('style');
expandStyles.textContent = `
  /* Expanded Card Styles */
  .expanded-card {
    background: var(--qa-card) !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
    padding: 0 !important;
    overflow: hidden;
  }
  
  .expanded-card-content {
    padding: 32px;
    animation: fadeIn 0.5s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .expand-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--qa-border);
  }
  
  .expand-title {
    font-size: 32px;
    font-weight: 700;
    margin: 0;
    color: var(--qa-text);
  }
  
  .expand-subtitle {
    font-size: 18px;
    color: var(--qa-text-secondary);
    margin: 8px 0 0;
  }
  
  .expand-close-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: var(--qa-bg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .expand-close-btn:hover {
    background: var(--qa-border);
    transform: scale(1.1);
  }
  
  .expand-metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    margin-bottom: 48px;
  }
  
  .metric-card {
    background: var(--qa-bg);
    padding: 24px;
    border-radius: 12px;
    text-align: center;
  }
  
  .metric-value {
    font-size: 36px;
    font-weight: 700;
    color: var(--qa-primary);
    margin-bottom: 8px;
  }
  
  .metric-label {
    font-size: 14px;
    color: var(--qa-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .expand-content-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;
    margin-bottom: 32px;
  }
  
  .expand-section h3 {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 16px;
    color: var(--qa-text);
  }
  
  .process-flow {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .process-step {
    display: flex;
    align-items: center;
    gap: 16px;
    opacity: 0;
    animation: slideIn 0.5s ease forwards;
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  .step-number {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--qa-primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    flex-shrink: 0;
  }
  
  .step-content {
    color: var(--qa-text-secondary);
  }
  
  .formula-display {
    background: var(--qa-bg);
    padding: 24px;
    border-radius: 8px;
    font-family: 'SF Mono', monospace;
    font-size: 18px;
    text-align: center;
    margin-bottom: 12px;
  }
  
  .formula-description {
    font-size: 14px;
    color: var(--qa-text-secondary);
  }
  
  .chart-container {
    background: var(--qa-bg);
    padding: 16px;
    border-radius: 8px;
    height: 200px;
  }
  
  .code-example {
    background: var(--qa-bg);
    padding: 16px;
    border-radius: 8px;
    font-family: 'SF Mono', monospace;
    font-size: 14px;
    overflow-x: auto;
    margin: 0;
  }
  
  .expand-actions {
    display: flex;
    gap: 16px;
    padding-top: 24px;
    border-top: 1px solid var(--qa-border);
  }
  
  .action-btn {
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .action-btn.primary {
    background: var(--qa-primary);
    color: white;
  }
  
  .action-btn.primary:hover {
    background: #0051D5;
    transform: scale(1.02);
  }
  
  .action-btn.secondary {
    background: var(--qa-bg);
    color: var(--qa-text);
    border: 1px solid var(--qa-border);
  }
  
  .action-btn.secondary:hover {
    background: var(--qa-border);
  }
`;
document.head.appendChild(expandStyles);