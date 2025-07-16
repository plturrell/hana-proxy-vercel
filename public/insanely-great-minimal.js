// Minimal Insanely Great - Professional CFA Edition
// Keep original design, just enhance names and add subtle magic

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

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  // Simple CSS for subtle enhancements
  const style = document.createElement('style');
  style.textContent = `
    /* Subtle Enhancements Only */
    .jobs-model-card {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .jobs-model-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
    }
    
    .a2a-agent-icon {
      transition: transform 0.3s ease;
    }
    
    .jobs-model-card:hover .a2a-agent-icon {
      transform: scale(1.05);
    }
    
    /* Hide only technical protocol version */
    .a2a-protocol-version {
      display: none;
    }
    
    /* Sparkle animation */
    @keyframes sparkle {
      0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
      50% { opacity: 1; transform: scale(1) rotate(180deg); }
    }
    
    .magic-sparkle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: #FFD60A;
      border-radius: 50%;
      pointer-events: none;
      animation: sparkle 1.5s ease-out;
    }
  `;
  document.head.appendChild(style);
  
  // Update agent names after a short delay
  setTimeout(updateAgentNames, 100);
  
  // Add subtle sparkles to Connect button clicks
  addConnectMagic();
});

// Update agent names to professional CFA terms
function updateAgentNames() {
  document.querySelectorAll('.jobs-model-card').forEach(card => {
    const agentId = findAgentId(card);
    
    if (agentId && naturalNames[agentId]) {
      // Update the display name
      const nameElement = card.querySelector('.a2a-agent-name');
      if (nameElement) {
        nameElement.textContent = naturalNames[agentId];
      }
      
      // Update in the detail screen too
      const technicalNameElement = card.querySelector('.a2a-technical-name');
      if (technicalNameElement) {
        technicalNameElement.style.fontSize = '12px';
        technicalNameElement.style.opacity = '0.7';
      }
    }
  });
}

// Find agent ID from card
function findAgentId(card) {
  const idElement = card.querySelector('.a2a-agent-id');
  if (idElement) return idElement.textContent;
  
  // Try buttons
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

// Add subtle magic to Connect button
function addConnectMagic() {
  document.addEventListener('click', function(e) {
    if (e.target.matches('.jobs-action-button.primary')) {
      const card = e.target.closest('.jobs-model-card');
      if (card) {
        createSparkles(card, e.target);
      }
    }
  });
}

// Create subtle sparkles
function createSparkles(element, button) {
  const rect = button.getBoundingClientRect();
  const cardRect = element.getBoundingClientRect();
  
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const sparkle = document.createElement('div');
      sparkle.className = 'magic-sparkle';
      sparkle.style.left = (rect.left - cardRect.left + rect.width / 2 + (Math.random() - 0.5) * 40) + 'px';
      sparkle.style.top = (rect.top - cardRect.top + rect.height / 2 + (Math.random() - 0.5) * 40) + 'px';
      element.appendChild(sparkle);
      
      setTimeout(() => sparkle.remove(), 1500);
    }, i * 100);
  }
}

// Simple notification for results
window.showAgentNotification = function(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #007AFF;
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    transform: translateX(400px);
    transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    z-index: 10000;
    font-size: 16px;
    font-weight: 500;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};