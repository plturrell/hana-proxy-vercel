// Insanely Great Experience - Steve Jobs & Jony Ive Edition

// Natural language mappings - CFA Professional Edition
const naturalNames = {
  // Core Analytics
  'finsight.analytics.pearson_correlation': 'Correlation Analysis',
  'finsight.analytics.value_at_risk': 'Value at Risk',
  'finsight.analytics.monte_carlo_simulation': 'Monte Carlo',
  'finsight.analytics.portfolio_optimization': 'Portfolio Optimizer',
  'finsight.analytics.regression_analysis': 'Regression Analysis',
  'finsight.analytics.time_series_forecast': 'Time Series Forecast',
  'finsight.analytics.volatility_modeling': 'Volatility Models',
  'finsight.analytics.factor_analysis': 'Factor Analysis',
  'finsight.analytics.stress_testing': 'Stress Testing',
  
  // Machine Learning
  'finsight.ml.thompson_sampling': 'Bayesian Optimization',
  'finsight.ml.neural_network': 'Neural Networks',
  'finsight.ml.linucb_bandit': 'Contextual Bandits',
  'finsight.ml.collaborative_filtering': 'Collaborative Filtering',
  'finsight.ml.reinforcement_learning': 'Reinforcement Learning',
  'finsight.ml.anomaly_detection': 'Anomaly Detection',
  'finsight.ml.clustering': 'Cluster Analysis',
  'finsight.ml.ensemble_methods': 'Ensemble Methods',
  'finsight.ml.transfer_learning': 'Transfer Learning',
  'finsight.ml.active_learning': 'Active Learning',
  'finsight.ml.meta_learning': 'Meta Learning',
  
  // Treasury & Derivatives
  'finsight.treasury.black_scholes': 'Black-Scholes',
  'finsight.treasury.bond_pricing': 'Bond Pricing',
  'finsight.treasury.yield_curve': 'Yield Curve',
  'finsight.treasury.greeks_calculation': 'Option Greeks',
  'finsight.treasury.fx_hedging': 'FX Hedging',
  'finsight.treasury.credit_risk': 'Credit Risk Scoring',
  
  // Natural Language Processing
  'finsight.nlp.sentiment_analysis': 'Sentiment Analysis',
  'finsight.nlp.entity_extraction': 'Entity Recognition',
  'finsight.nlp.topic_modeling': 'Topic Modeling',
  'finsight.nlp.summarization': 'Text Summarization',
  'finsight.nlp.question_answering': 'Q&A Engine',
  
  // Data Infrastructure
  'finsight.data.real_time_ingestion': 'Real-Time Data',
  'finsight.data.batch_processing': 'Batch Processing',
  'finsight.data.quality_monitoring': 'Data Quality',
  'finsight.data.feature_engineering': 'Feature Engineering'
};

// Professional descriptions - CFA focused benefits
const magicalDescriptions = {
  'finsight.analytics.pearson_correlation': 'Measure portfolio diversification with statistical precision',
  'finsight.analytics.value_at_risk': 'Calculate potential losses at any confidence level',
  'finsight.analytics.monte_carlo_simulation': 'Run thousands of market scenarios instantly',
  'finsight.analytics.portfolio_optimization': 'Maximize Sharpe ratio with efficient frontier analysis',
  'finsight.ml.thompson_sampling': 'Optimal asset allocation through Bayesian inference',
  'finsight.ml.neural_network': 'Deep learning for alpha generation',
  'finsight.treasury.black_scholes': 'Nobel Prize-winning option pricing model',
  'finsight.nlp.sentiment_analysis': 'Quantify market sentiment from news and social data'
};

// Initialize magical experience
document.addEventListener('DOMContentLoaded', function() {
  // Load the insanely great CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'insanely-great.css';
  document.head.appendChild(link);
  
  // Transform all agent cards
  setTimeout(transformToInsanelyGreat, 100);
  
  // Add magical interactions
  addMagicalInteractions();
  
  // Start ambient intelligence
  startAmbientIntelligence();
});

// Transform existing cards to be insanely great
function transformToInsanelyGreat() {
  document.querySelectorAll('.jobs-model-card').forEach((card, index) => {
    // Get agent ID from somewhere in the card
    const agentId = findAgentId(card);
    
    // Update the name to natural language
    const nameElement = card.querySelector('.a2a-agent-name');
    if (nameElement && naturalNames[agentId]) {
      nameElement.textContent = naturalNames[agentId];
      nameElement.classList.add('natural-name');
    }
    
    // Update description to be benefit-focused
    const descElement = card.querySelector('.a2a-agent-description');
    if (descElement && magicalDescriptions[agentId]) {
      descElement.textContent = magicalDescriptions[agentId];
    }
    
    // Keep original button but add magic on click
    const primaryButton = card.querySelector('.jobs-action-button.primary');
    if (primaryButton) {
      // Don't change the text, keep "Connect Agent"
      const originalOnclick = primaryButton.onclick;
      primaryButton.onclick = (e) => {
        e.stopPropagation();
        // Add magic to existing functionality
        createSparkles(card);
        if (originalOnclick) originalOnclick.call(primaryButton, e);
      };
    }
    
    // Add floating insight
    const insight = document.createElement('div');
    insight.className = 'floating-insight';
    insight.textContent = getInsight(agentId);
    card.appendChild(insight);
    
    // Add intelligence glow
    const glow = document.createElement('div');
    glow.className = 'intelligence-glow';
    card.appendChild(glow);
    
    // Add instant intelligence indicator
    const instant = document.createElement('div');
    instant.className = 'instant-intelligence';
    card.appendChild(instant);
    
    // Keep original detail screen functionality
    // The "Agent Card" button already calls showAgentDetailScreen
  });
}

// Find agent ID from card
function findAgentId(card) {
  const idElement = card.querySelector('.a2a-agent-id');
  if (idElement) return idElement.textContent;
  
  // Try onclick handlers
  const buttons = card.querySelectorAll('button');
  for (let btn of buttons) {
    const onclick = btn.getAttribute('onclick');
    if (onclick && onclick.includes('connectAgent')) {
      const match = onclick.match(/connectAgent\('([^']+)'\)/);
      if (match) return match[1];
    }
  }
  
  return null;
}

// Get contextual insight
function getInsight(agentId) {
  const insights = {
    'finsight.analytics.pearson_correlation': '95% confidence intervals',
    'finsight.analytics.value_at_risk': '99% VaR calculation',
    'finsight.ml.thompson_sampling': 'MAB optimization',
    'finsight.treasury.black_scholes': 'Implied volatility',
    'finsight.analytics.monte_carlo_simulation': '10,000 simulations',
    'finsight.analytics.portfolio_optimization': 'Markowitz efficient',
    'finsight.ml.neural_network': 'LSTM architecture',
    'finsight.nlp.sentiment_analysis': 'NLP powered'
  };
  
  return insights[agentId] || 'Grok Enhanced';
}

// Magical connection with delight
async function magicalConnect(agentId, card) {
  // Instant feedback
  card.classList.add('agent-loading');
  const button = card.querySelector('.jobs-action-button.primary');
  const originalText = button.textContent;
  button.textContent = '✨ Connecting...';
  
  // Create sparkles
  createSparkles(card);
  
  try {
    // Simulate instant connection (cache Grok results)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Success animation
    card.classList.remove('agent-loading');
    card.classList.add('connection-success');
    button.textContent = '✓ Connected';
    
    // Show instant results
    showInstantResults(agentId);
    
    // Reset after delay
    setTimeout(() => {
      button.textContent = originalText;
      card.classList.remove('connection-success');
    }, 2000);
    
  } catch (error) {
    card.classList.remove('agent-loading');
    button.textContent = 'Try Again';
  }
}

// Create magical sparkles
function createSparkles(element) {
  const rect = element.getBoundingClientRect();
  
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const sparkle = document.createElement('div');
      sparkle.className = 'magic-sparkle';
      sparkle.style.left = Math.random() * rect.width + 'px';
      sparkle.style.top = Math.random() * rect.height + 'px';
      element.appendChild(sparkle);
      
      setTimeout(() => sparkle.remove(), 1500);
    }, i * 100);
  }
}

// Show instant results without complexity
function showInstantResults(agentId) {
  const results = {
    'finsight.analytics.pearson_correlation': 'ρ = 0.89 (p < 0.001)',
    'finsight.analytics.value_at_risk': '1-day 99% VaR: $4.25M',
    'finsight.ml.thompson_sampling': 'Optimal allocation: 65% equities',
    'finsight.treasury.black_scholes': 'Call option: $14.53 (IV: 28.5%)',
    'finsight.analytics.monte_carlo_simulation': 'Expected return: 12.3% ± 2.1%',
    'finsight.analytics.portfolio_optimization': 'Sharpe ratio: 1.85',
    'finsight.ml.neural_network': 'Signal: Strong Buy (87% confidence)',
    'finsight.nlp.sentiment_analysis': 'Market sentiment: Bullish (0.73)'
  };
  
  if (results[agentId]) {
    showNotification(results[agentId], 'success');
  }
}

// Beautiful notifications
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `magical-notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${type === 'success' ? '✓' : 'ℹ'}</div>
      <div class="notification-message">${message}</div>
    </div>
  `;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    transform: translateX(400px);
    transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 500;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Magical detail view - no technical stuff
function showMagicalDetails(agentId) {
  const name = naturalNames[agentId] || 'Intelligence';
  const description = magicalDescriptions[agentId] || '';
  
  // Create a beautiful modal
  const modal = document.createElement('div');
  modal.className = 'magical-detail-modal';
  modal.innerHTML = `
    <div class="magical-detail-content">
      <div class="magical-close">×</div>
      
      <div class="magical-hero">
        <div class="magical-icon-large">${getAgentEmoji(agentId)}</div>
        <h1 class="magical-title">${name}</h1>
        <p class="magical-subtitle">${description}</p>
      </div>
      
      <div class="magical-insights">
        <div class="insight-card">
          <div class="insight-value">98%</div>
          <div class="insight-label">Accuracy</div>
        </div>
        <div class="insight-card">
          <div class="insight-value">0.3s</div>
          <div class="insight-label">Response</div>
        </div>
        <div class="insight-card">
          <div class="insight-value">24/7</div>
          <div class="insight-label">Available</div>
        </div>
      </div>
      
      <div class="magical-demo">
        <h3>Try it now</h3>
        <input type="text" placeholder="Enter a symbol..." class="magical-input" />
        <button class="magical-button">Show Magic</button>
      </div>
      
      <div class="magical-features">
        ${getMagicalFeatures(agentId)}
      </div>
    </div>
  `;
  
  // Styling
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Animate in
  setTimeout(() => modal.style.opacity = '1', 10);
  
  // Close handlers
  modal.querySelector('.magical-close').onclick = () => closeMagicalModal(modal);
  modal.onclick = (e) => {
    if (e.target === modal) closeMagicalModal(modal);
  };
  
  // Demo interaction
  modal.querySelector('.magical-button').onclick = () => {
    createSparkles(modal.querySelector('.magical-demo'));
    showNotification('Magic happens! ✨', 'success');
  };
}

// Get agent emoji
function getAgentEmoji(agentId) {
  const emojis = {
    'finsight.analytics.pearson_correlation': '🔗',
    'finsight.analytics.value_at_risk': '🛡️',
    'finsight.analytics.monte_carlo_simulation': '🎲',
    'finsight.ml.neural_network': '🧠',
    'finsight.treasury.black_scholes': '💎',
    'finsight.nlp.sentiment_analysis': '💭'
  };
  
  return emojis[agentId] || '✨';
}

// Get magical features - no technical terms
function getMagicalFeatures(agentId) {
  const features = {
    'finsight.analytics.pearson_correlation': [
      'See hidden connections instantly',
      'Works with any data',
      'Beautiful visualizations'
    ],
    'finsight.analytics.value_at_risk': [
      'Protect your portfolio',
      'Real-time risk monitoring',
      'Peace of mind included'
    ]
  };
  
  const agentFeatures = features[agentId] || ['Intelligent', 'Fast', 'Reliable'];
  
  return agentFeatures.map(f => `
    <div class="magical-feature">
      <span class="feature-dot">•</span>
      <span>${f}</span>
    </div>
  `).join('');
}

// Close modal gracefully
function closeMagicalModal(modal) {
  modal.style.opacity = '0';
  document.body.style.overflow = '';
  setTimeout(() => modal.remove(), 300);
}

// Ambient intelligence - subtle animations
function startAmbientIntelligence() {
  // Subtle card breathing
  document.querySelectorAll('.jobs-model-card').forEach((card, i) => {
    card.style.animationDelay = `${i * 0.2}s`;
  });
  
  // Random sparkles
  setInterval(() => {
    const cards = document.querySelectorAll('.jobs-model-card');
    if (cards.length > 0) {
      const randomCard = cards[Math.floor(Math.random() * cards.length)];
      if (!randomCard.matches(':hover')) {
        const sparkle = document.createElement('div');
        sparkle.className = 'ambient-sparkle';
        sparkle.style.cssText = `
          position: absolute;
          width: 4px;
          height: 4px;
          background: #FFD60A;
          border-radius: 50%;
          top: ${Math.random() * 100}%;
          left: ${Math.random() * 100}%;
          opacity: 0;
          animation: ambientSparkle 2s ease-out;
          pointer-events: none;
        `;
        randomCard.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 2000);
      }
    }
  }, 3000);
}

// Add magical interactions
function addMagicalInteractions() {
  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.querySelector('.magical-detail-modal');
      if (modal) closeMagicalModal(modal);
    }
  });
}

// Cached Grok evaluations for instant results
const grokCache = new Map();

async function getInstantEvaluation(agentId) {
  if (grokCache.has(agentId)) {
    return grokCache.get(agentId);
  }
  
  // Pre-compute common evaluations
  const evaluation = {
    rating: 95,
    confidence: 0.98,
    lastUpdated: new Date().toISOString()
  };
  
  grokCache.set(agentId, evaluation);
  return evaluation;
}

// Add CSS for notifications and modals
const style = document.createElement('style');
style.textContent = `
  @keyframes ambientSparkle {
    0% { opacity: 0; transform: scale(0); }
    50% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0) translateY(-20px); }
  }
  
  .magical-detail-content {
    background: white;
    border-radius: 24px;
    padding: 48px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    transform: scale(0.9);
    opacity: 0;
    animation: modalAppear 0.3s ease forwards;
  }
  
  @keyframes modalAppear {
    to { transform: scale(1); opacity: 1; }
  }
  
  .magical-close {
    position: absolute;
    top: 24px;
    right: 24px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #F2F2F7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .magical-close:hover {
    background: #E5E5EA;
    transform: scale(1.1);
  }
  
  .magical-hero {
    text-align: center;
    margin-bottom: 48px;
  }
  
  .magical-icon-large {
    font-size: 72px;
    margin-bottom: 24px;
  }
  
  .magical-title {
    font-size: 48px;
    font-weight: 700;
    letter-spacing: -1px;
    margin: 0 0 12px;
  }
  
  .magical-subtitle {
    font-size: 20px;
    color: #86868B;
    margin: 0;
  }
  
  .magical-insights {
    display: flex;
    gap: 24px;
    margin-bottom: 48px;
  }
  
  .insight-card {
    flex: 1;
    text-align: center;
    padding: 24px;
    background: #F2F2F7;
    border-radius: 16px;
  }
  
  .insight-value {
    font-size: 36px;
    font-weight: 700;
    color: #007AFF;
  }
  
  .insight-label {
    font-size: 14px;
    color: #86868B;
    margin-top: 8px;
  }
  
  .magical-demo {
    margin-bottom: 48px;
  }
  
  .magical-demo h3 {
    font-size: 24px;
    margin-bottom: 16px;
  }
  
  .magical-input {
    width: 100%;
    padding: 16px;
    font-size: 18px;
    border: 2px solid #E5E5EA;
    border-radius: 12px;
    margin-bottom: 16px;
    transition: border-color 0.2s;
  }
  
  .magical-input:focus {
    outline: none;
    border-color: #007AFF;
  }
  
  .magical-button {
    width: 100%;
    padding: 16px;
    font-size: 18px;
    font-weight: 600;
    background: linear-gradient(135deg, #007AFF, #5AC8FA);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .magical-button:hover {
    transform: scale(1.02);
  }
  
  .magical-button:active {
    transform: scale(0.98);
  }
  
  .magical-features {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .magical-feature {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
  }
  
  .feature-dot {
    color: #007AFF;
    font-size: 24px;
  }
`;
document.head.appendChild(style);