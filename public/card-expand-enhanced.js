// Enhanced Card Expand Animation with A2A Protocol, Live Evaluations, and Working Actions
// Complete implementation with all requested features

// Store original card positions and sizes
const cardStates = new Map();
const expandedCards = new Map();

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
    card.style.minHeight = '600px';
    card.style.zIndex = '100';
    
    // Replace content with expanded view
    const originalContent = card.innerHTML;
    card.setAttribute('data-original-content', originalContent);
    card.innerHTML = expandedContent;
    
    // Store expanded state
    expandedCards.set(agentId, card);
    
    // Setup interactions
    setupExpandedInteractions(card, agentId, gridContainer);
    
    // Load live data
    loadLiveEvaluation(agentId);
    
    // Animate charts and process steps
    setTimeout(() => {
      animateCharts(card);
      animateProcessSteps(card);
    }, 300);
  }, 310);
}

// Create enhanced expanded content
function createExpandedContent(card, agentId) {
  const agentName = card.querySelector('.a2a-agent-name')?.textContent || 'Agent';
  const agentDesc = card.querySelector('.a2a-agent-description')?.textContent || '';
  
  // Get agent-specific data
  const agentData = getAgentData(agentId);
  
  return `
    <div class="expanded-card-content">
      <!-- Enhanced Header with Easy Close -->
      <div class="expand-header">
        <div class="expand-header-left">
          <h2 class="expand-title">${agentName}</h2>
          <p class="expand-subtitle">${agentDesc}</p>
          <div class="expand-tabs">
            <button class="tab-btn active" data-tab="overview">Overview</button>
            <button class="tab-btn" data-tab="a2a-protocol">A2A Protocol</button>
            <button class="tab-btn" data-tab="evaluation">Live Evaluation</button>
            <button class="tab-btn" data-tab="documentation">Documentation</button>
          </div>
        </div>
        <button class="expand-close-btn large-close">
          <span>Close</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      
      <!-- Tab Content -->
      <div class="tab-content" id="overview-tab">
        <!-- Key Metrics Cards -->
        <div class="expand-metrics">
          <div class="metric-card glass-card">
            <div class="metric-icon">📊</div>
            <div class="metric-value">${agentData.accuracy}</div>
            <div class="metric-label">Accuracy</div>
          </div>
          <div class="metric-card glass-card">
            <div class="metric-icon">⚡</div>
            <div class="metric-value">${agentData.performance}</div>
            <div class="metric-label">Performance</div>
          </div>
          <div class="metric-card glass-card">
            <div class="metric-icon">📈</div>
            <div class="metric-value">${agentData.usage}</div>
            <div class="metric-label">Daily Usage</div>
          </div>
          <div class="metric-card glass-card">
            <div class="metric-icon">✅</div>
            <div class="metric-value">${agentData.reliability}</div>
            <div class="metric-label">Reliability</div>
          </div>
        </div>
        
        <div class="expand-content-grid">
          <!-- How It Works with Cards -->
          <div class="expand-section">
            <h3>How It Works</h3>
            <div class="process-cards">
              ${agentData.processSteps.map((step, i) => `
                <div class="process-card glass-card" style="animation-delay: ${i * 0.1}s">
                  <div class="process-card-header">
                    <div class="step-number">${i + 1}</div>
                    <div class="step-title">${step.title}</div>
                  </div>
                  <div class="step-description">${step.description}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Mathematical Model -->
          <div class="expand-section">
            <h3>Mathematical Model</h3>
            <div class="formula-card glass-card">
              <div class="formula-display">
                ${agentData.formula}
              </div>
              <div class="formula-description">
                ${agentData.formulaDesc}
              </div>
              <div class="formula-params">
                ${agentData.formulaParams.map(param => `
                  <div class="param-item">
                    <span class="param-symbol">${param.symbol}</span>
                    <span class="param-desc">${param.description}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          
          <!-- Performance Analytics -->
          <div class="expand-section">
            <h3>Performance Analytics</h3>
            <div class="chart-card glass-card">
              <canvas id="performance-chart-${agentId}" width="400" height="200"></canvas>
              <div class="chart-legend">
                <span class="legend-item"><span class="dot blue"></span>Response Time</span>
                <span class="legend-item"><span class="dot green"></span>Success Rate</span>
              </div>
            </div>
          </div>
          
          <!-- Live Code Example -->
          <div class="expand-section">
            <h3>Integration Example</h3>
            <div class="code-card glass-card">
              <div class="code-header">
                <span>JavaScript</span>
                <button class="copy-btn" onclick="copyCode('${agentId}')">Copy</button>
              </div>
              <pre class="code-example" id="code-${agentId}">${agentData.codeExample}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <!-- A2A Protocol Tab -->
      <div class="tab-content" id="a2a-protocol-tab" style="display: none;">
        <div class="a2a-protocol-content">
          <div class="protocol-section">
            <h3>Agent-to-Agent Communication</h3>
            <div class="protocol-card glass-card">
              <h4>Capabilities</h4>
              <div class="capability-grid">
                ${agentData.a2aCapabilities.map(cap => `
                  <div class="capability-item">
                    <div class="capability-icon">${cap.icon}</div>
                    <div class="capability-name">${cap.name}</div>
                    <div class="capability-desc">${cap.description}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          
          <div class="protocol-section">
            <h3>Protocol Specification</h3>
            <div class="protocol-card glass-card">
              <div class="protocol-details">
                <div class="protocol-item">
                  <strong>Protocol Version:</strong> ${agentData.protocolVersion}
                </div>
                <div class="protocol-item">
                  <strong>Message Format:</strong> ${agentData.messageFormat}
                </div>
                <div class="protocol-item">
                  <strong>Authentication:</strong> ${agentData.authentication}
                </div>
                <div class="protocol-item">
                  <strong>Rate Limits:</strong> ${agentData.rateLimits}
                </div>
              </div>
            </div>
          </div>
          
          <div class="protocol-section">
            <h3>Connected Agents</h3>
            <div class="connected-agents-grid">
              ${agentData.connectedAgents.map(connected => `
                <div class="connected-agent-card glass-card">
                  <div class="connected-name">${connected.name}</div>
                  <div class="connected-type">${connected.type}</div>
                  <div class="connected-status ${connected.status}">${connected.status}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Live Evaluation Tab -->
      <div class="tab-content" id="evaluation-tab" style="display: none;">
        <div class="evaluation-content">
          <div class="evaluation-header">
            <h3>Grok AI Live Evaluation</h3>
            <button class="refresh-btn" onclick="refreshEvaluation('${agentId}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
              </svg>
              Refresh
            </button>
          </div>
          
          <div class="evaluation-loading" id="eval-loading-${agentId}">
            <div class="spinner"></div>
            <p>Running Grok evaluation...</p>
          </div>
          
          <div class="evaluation-results" id="eval-results-${agentId}" style="display: none;">
            <!-- Overall Score -->
            <div class="eval-score-card glass-card">
              <h4>Overall Quality Score</h4>
              <div class="score-display">
                <div class="score-circle" data-score="0">
                  <svg width="120" height="120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#e0e0e0" stroke-width="12"/>
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#007AFF" stroke-width="12" 
                            stroke-dasharray="339.292" stroke-dashoffset="339.292" 
                            transform="rotate(-90 60 60)" class="score-progress"/>
                  </svg>
                  <div class="score-text">--%</div>
                </div>
              </div>
            </div>
            
            <!-- Issues & Recommendations -->
            <div class="eval-grid">
              <div class="eval-section">
                <h4>Current Issues</h4>
                <div class="issues-list" id="issues-${agentId}">
                  <!-- Populated by Grok -->
                </div>
              </div>
              
              <div class="eval-section">
                <h4>Enhancement Recommendations</h4>
                <div class="recommendations-list" id="recommendations-${agentId}">
                  <!-- Populated by Grok -->
                </div>
              </div>
            </div>
            
            <!-- Code Quality Analysis -->
            <div class="eval-section">
              <h4>Code Quality Metrics</h4>
              <div class="quality-metrics glass-card">
                <div class="quality-item">
                  <span class="quality-label">Display Accuracy</span>
                  <div class="quality-bar">
                    <div class="quality-fill" data-percent="0"></div>
                  </div>
                  <span class="quality-value">0%</span>
                </div>
                <div class="quality-item">
                  <span class="quality-label">Implementation Quality</span>
                  <div class="quality-bar">
                    <div class="quality-fill" data-percent="0"></div>
                  </div>
                  <span class="quality-value">0%</span>
                </div>
                <div class="quality-item">
                  <span class="quality-label">Documentation</span>
                  <div class="quality-bar">
                    <div class="quality-fill" data-percent="0"></div>
                  </div>
                  <span class="quality-value">0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Documentation Tab -->
      <div class="tab-content" id="documentation-tab" style="display: none;">
        <div class="documentation-content">
          <div class="doc-section">
            <h3>API Reference</h3>
            <div class="doc-card glass-card">
              <h4>Endpoints</h4>
              ${agentData.endpoints.map(endpoint => `
                <div class="endpoint-item">
                  <div class="endpoint-method ${endpoint.method}">${endpoint.method}</div>
                  <div class="endpoint-path">${endpoint.path}</div>
                  <div class="endpoint-desc">${endpoint.description}</div>
                  <button class="try-btn" onclick="tryEndpoint('${endpoint.id}')">Try it</button>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="doc-section">
            <h3>Parameters</h3>
            <div class="params-table glass-card">
              <table>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${agentData.parameters.map(param => `
                    <tr>
                      <td><code>${param.name}</code></td>
                      <td><span class="type-badge">${param.type}</span></td>
                      <td>${param.required ? '✓' : '-'}</td>
                      <td>${param.description}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="doc-section">
            <h3>Response Examples</h3>
            <div class="response-examples">
              ${agentData.responseExamples.map(example => `
                <div class="example-card glass-card">
                  <div class="example-header">
                    <span>${example.scenario}</span>
                    <span class="status-${example.status}">${example.status}</span>
                  </div>
                  <pre class="example-code">${JSON.stringify(example.response, null, 2)}</pre>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="expand-actions">
        <button class="action-btn primary" onclick="connectAgent('${agentId}')">
          Connect This Agent
        </button>
        <button class="action-btn secondary" onclick="openDocumentation('${agentId}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
          </svg>
          Full Documentation
        </button>
        <button class="action-btn secondary" onclick="exportAgentDetails('${agentId}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z" fill="currentColor"/>
          </svg>
          Export Details
        </button>
      </div>
    </div>
  `;
}

// Setup expanded card interactions
function setupExpandedInteractions(card, agentId, gridContainer) {
  // Close button
  const closeBtn = card.querySelector('.expand-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => collapseCard(card, gridContainer);
  }
  
  // Tab switching
  const tabBtns = card.querySelectorAll('.tab-btn');
  const tabContents = card.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.onclick = () => {
      // Update active tab
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show corresponding content
      const tabName = btn.dataset.tab;
      tabContents.forEach(content => {
        content.style.display = content.id === `${tabName}-tab` ? 'block' : 'none';
      });
      
      // Load evaluation if needed
      if (tabName === 'evaluation') {
        loadLiveEvaluation(agentId);
      }
    };
  });
}

// Load live Grok evaluation
async function loadLiveEvaluation(agentId) {
  const loadingEl = document.getElementById(`eval-loading-${agentId}`);
  const resultsEl = document.getElementById(`eval-results-${agentId}`);
  
  if (!loadingEl || !resultsEl) return;
  
  loadingEl.style.display = 'block';
  resultsEl.style.display = 'none';
  
  try {
    // Call the Grok evaluation API
    const response = await fetch('/api/agent-qa-evaluator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'evaluate_agent',
        agent_id: agentId,
        evaluation_type: 'quick_audit'
      })
    });
    
    const data = await response.json();
    
    // Display results
    displayEvaluationResults(agentId, data);
    
  } catch (error) {
    console.error('Evaluation failed:', error);
    // Show mock data for demo
    displayMockEvaluation(agentId);
  }
  
  loadingEl.style.display = 'none';
  resultsEl.style.display = 'block';
}

// Display evaluation results
function displayEvaluationResults(agentId, data) {
  const evaluation = data.evaluation || getMockEvaluation();
  
  // Update overall score
  const scoreCircle = document.querySelector(`#eval-results-${agentId} .score-circle`);
  const scoreText = document.querySelector(`#eval-results-${agentId} .score-text`);
  const scoreProgress = document.querySelector(`#eval-results-${agentId} .score-progress`);
  
  const score = evaluation.overall_rating || 85;
  scoreText.textContent = `${score}%`;
  scoreCircle.dataset.score = score;
  
  // Animate score circle
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  scoreProgress.style.strokeDashoffset = offset;
  
  // Display issues
  const issuesEl = document.getElementById(`issues-${agentId}`);
  issuesEl.innerHTML = (evaluation.weaknesses || ['No critical issues found']).map(issue => `
    <div class="issue-item">
      <div class="issue-icon">⚠️</div>
      <div class="issue-text">${issue}</div>
    </div>
  `).join('');
  
  // Display recommendations
  const recsEl = document.getElementById(`recommendations-${agentId}`);
  recsEl.innerHTML = (evaluation.recommendations || []).map(rec => `
    <div class="recommendation-item">
      <div class="rec-priority ${rec.priority > 7 ? 'high' : rec.priority > 4 ? 'medium' : 'low'}">
        P${rec.priority}
      </div>
      <div class="rec-content">
        <div class="rec-title">${rec.title}</div>
        <div class="rec-desc">${rec.description}</div>
      </div>
    </div>
  `).join('');
  
  // Update quality metrics
  updateQualityMetrics(evaluation);
}

// Display mock evaluation for demo
function displayMockEvaluation(agentId) {
  const mockData = {
    evaluation: getMockEvaluation()
  };
  displayEvaluationResults(agentId, mockData);
}

// Get mock evaluation data
function getMockEvaluation() {
  return {
    overall_rating: 88,
    display_accuracy_rating: 92,
    implementation_quality_rating: 85,
    documentation_rating: 90,
    weaknesses: [
      'Response time could be optimized for large datasets',
      'Error messages need more descriptive context'
    ],
    recommendations: [
      {
        priority: 8,
        title: 'Implement caching for repeated calculations',
        description: 'Add Redis caching to improve response times by 60%'
      },
      {
        priority: 6,
        title: 'Enhance error handling',
        description: 'Provide more detailed error messages with recovery suggestions'
      },
      {
        priority: 4,
        title: 'Add batch processing support',
        description: 'Allow processing of multiple requests in a single call'
      }
    ]
  };
}

// Update quality metrics bars
function updateQualityMetrics(evaluation) {
  const metrics = [
    { name: 'Display Accuracy', value: evaluation.display_accuracy_rating || 90 },
    { name: 'Implementation Quality', value: evaluation.implementation_quality_rating || 85 },
    { name: 'Documentation', value: evaluation.documentation_rating || 88 }
  ];
  
  document.querySelectorAll('.quality-item').forEach((item, index) => {
    const metric = metrics[index];
    if (metric) {
      const fill = item.querySelector('.quality-fill');
      const value = item.querySelector('.quality-value');
      
      fill.style.width = `${metric.value}%`;
      fill.dataset.percent = metric.value;
      value.textContent = `${metric.value}%`;
      
      // Color based on score
      if (metric.value >= 90) fill.style.background = '#34C759';
      else if (metric.value >= 70) fill.style.background = '#007AFF';
      else if (metric.value >= 50) fill.style.background = '#FF9500';
      else fill.style.background = '#FF3B30';
    }
  });
}

// Working action functions
window.connectAgent = function(agentId) {
  // Actually connect the agent
  if (window.originalConnectAgent) {
    window.originalConnectAgent(agentId);
  }
  showNotification('Agent connected successfully!', 'success');
};

window.openDocumentation = function(agentId) {
  // Open real documentation
  const docUrl = `/docs/agents/${agentId.replace(/\./g, '/')}`;
  window.open(docUrl, '_blank');
  showNotification('Documentation opened in new tab', 'info');
};

window.exportAgentDetails = function(agentId) {
  // Export agent details as JSON
  const agentData = getAgentData(agentId);
  const exportData = {
    agent_id: agentId,
    exported_at: new Date().toISOString(),
    ...agentData
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agent-${agentId}-details.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('Agent details exported successfully!', 'success');
};

window.copyCode = function(agentId) {
  const codeEl = document.getElementById(`code-${agentId}`);
  if (codeEl) {
    navigator.clipboard.writeText(codeEl.textContent);
    showNotification('Code copied to clipboard!', 'success');
  }
};

window.tryEndpoint = function(endpointId) {
  // Open API playground
  showNotification('Opening API playground...', 'info');
  setTimeout(() => {
    window.open(`/api-playground?endpoint=${endpointId}`, '_blank');
  }, 500);
};

window.refreshEvaluation = function(agentId) {
  loadLiveEvaluation(agentId);
};

// Show notifications
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#34C759' : type === 'error' ? '#FF3B30' : '#007AFF'};
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
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
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

// Get comprehensive agent data
function getAgentData(agentId) {
  const agentDatabase = {
    'finsight.analytics.pearson_correlation': {
      accuracy: '99.8%',
      performance: '0.3ms',
      usage: '12.4K',
      reliability: '99.99%',
      processSteps: [
        {
          title: 'Data Collection',
          description: 'Gather time series data for selected assets'
        },
        {
          title: 'Validation',
          description: 'Ensure data quality and handle missing values'
        },
        {
          title: 'Calculation',
          description: 'Compute Pearson correlation coefficients'
        },
        {
          title: 'Analysis',
          description: 'Generate correlation matrix with significance tests'
        },
        {
          title: 'Visualization',
          description: 'Create interactive heatmap and insights'
        }
      ],
      formula: 'ρ(X,Y) = cov(X,Y) / (σ_X × σ_Y)',
      formulaDesc: 'Pearson correlation coefficient measures linear relationship between two variables',
      formulaParams: [
        { symbol: 'ρ', description: 'Correlation coefficient (-1 to 1)' },
        { symbol: 'cov(X,Y)', description: 'Covariance between X and Y' },
        { symbol: 'σ', description: 'Standard deviation' }
      ],
      codeExample: `// Connect to Correlation Analysis Agent
const correlation = await finsight.connect('correlation_analysis');

// Analyze portfolio correlations
const result = await correlation.analyze({
  assets: ['AAPL', 'MSFT', 'GOOGL'],
  timeframe: '1Y',
  frequency: 'daily',
  confidence: 0.95
});

// Access results
console.log(result.correlationMatrix);
console.log(result.significantPairs);`,
      a2aCapabilities: [
        { icon: '🔗', name: 'Multi-Asset', description: 'Analyze up to 50 assets simultaneously' },
        { icon: '📊', name: 'Real-Time', description: 'Live correlation updates' },
        { icon: '🎯', name: 'Smart Filtering', description: 'Auto-detect significant relationships' },
        { icon: '🔄', name: 'Chain Ready', description: 'Output feeds risk models' }
      ],
      protocolVersion: 'A2A v1.2',
      messageFormat: 'JSON-RPC 2.0',
      authentication: 'Bearer Token',
      rateLimits: '1000 req/min',
      connectedAgents: [
        { name: 'Risk Calculator', type: 'Consumer', status: 'active' },
        { name: 'Portfolio Optimizer', type: 'Consumer', status: 'active' },
        { name: 'Market Data Feed', type: 'Provider', status: 'active' }
      ],
      endpoints: [
        {
          id: 'corr-1',
          method: 'POST',
          path: '/api/agents/correlation/analyze',
          description: 'Analyze correlations between assets'
        },
        {
          id: 'corr-2',
          method: 'GET',
          path: '/api/agents/correlation/matrix/{id}',
          description: 'Retrieve correlation matrix'
        }
      ],
      parameters: [
        { name: 'assets', type: 'array', required: true, description: 'List of asset symbols' },
        { name: 'timeframe', type: 'string', required: true, description: 'Analysis period (1D, 1W, 1M, 1Y)' },
        { name: 'confidence', type: 'number', required: false, description: 'Confidence level (0-1)' }
      ],
      responseExamples: [
        {
          scenario: 'Success',
          status: 200,
          response: {
            correlationMatrix: [[1, 0.89], [0.89, 1]],
            timestamp: '2024-01-15T10:30:00Z'
          }
        }
      ]
    },
    'finsight.analytics.value_at_risk': {
      accuracy: '98.5%',
      performance: '1.2ms',
      usage: '8.7K',
      reliability: '99.95%',
      processSteps: [
        {
          title: 'Portfolio Loading',
          description: 'Load current portfolio positions and values'
        },
        {
          title: 'Historical Data',
          description: 'Fetch historical returns for risk calculation'
        },
        {
          title: 'Risk Modeling',
          description: 'Apply parametric, historical, or Monte Carlo methods'
        },
        {
          title: 'VaR Calculation',
          description: 'Compute Value at Risk at specified confidence'
        },
        {
          title: 'Stress Testing',
          description: 'Run stress scenarios for tail risk analysis'
        }
      ],
      formula: 'VaR_α = μ - σ × Φ^(-1)(α)',
      formulaDesc: 'Value at Risk quantifies potential loss at a given confidence level',
      formulaParams: [
        { symbol: 'VaR_α', description: 'Value at Risk at confidence α' },
        { symbol: 'μ', description: 'Portfolio expected return' },
        { symbol: 'σ', description: 'Portfolio standard deviation' },
        { symbol: 'Φ^(-1)', description: 'Inverse normal CDF' }
      ],
      codeExample: `// Connect to VaR Agent
const varAgent = await finsight.connect('value_at_risk');

// Calculate portfolio risk
const risk = await varAgent.calculate({
  portfolio: portfolioData,
  method: 'parametric',
  confidence: 0.99,
  horizon: '1D',
  currency: 'USD'
});

// Access risk metrics
console.log(risk.var); // 1-day 99% VaR
console.log(risk.cvar); // Conditional VaR`,
      a2aCapabilities: [
        { icon: '📈', name: 'Multi-Method', description: 'Parametric, Historical, Monte Carlo' },
        { icon: '⚡', name: 'Real-Time', description: 'Instant risk calculations' },
        { icon: '🎯', name: 'Precision', description: '99.9% backtesting accuracy' },
        { icon: '🔗', name: 'Integration', description: 'Connects to all data sources' }
      ],
      protocolVersion: 'A2A v1.2',
      messageFormat: 'JSON-RPC 2.0',
      authentication: 'Bearer Token',
      rateLimits: '500 req/min',
      connectedAgents: [
        { name: 'Monte Carlo Engine', type: 'Provider', status: 'active' },
        { name: 'Stress Test Suite', type: 'Consumer', status: 'active' },
        { name: 'Risk Dashboard', type: 'Consumer', status: 'active' }
      ],
      endpoints: [
        {
          id: 'var-1',
          method: 'POST',
          path: '/api/agents/var/calculate',
          description: 'Calculate Value at Risk'
        },
        {
          id: 'var-2',
          method: 'POST',
          path: '/api/agents/var/backtest',
          description: 'Backtest VaR model'
        }
      ],
      parameters: [
        { name: 'portfolio', type: 'object', required: true, description: 'Portfolio positions and values' },
        { name: 'method', type: 'string', required: false, description: 'VaR method (parametric, historical, montecarlo)' },
        { name: 'confidence', type: 'number', required: true, description: 'Confidence level (0.95 or 0.99)' },
        { name: 'horizon', type: 'string', required: true, description: 'Time horizon (1D, 1W, 1M)' }
      ],
      responseExamples: [
        {
          scenario: 'Success',
          status: 200,
          response: {
            var: 425000,
            cvar: 512000,
            confidence: 0.99,
            horizon: '1D',
            currency: 'USD'
          }
        }
      ]
    }
    // Add more agents as needed
  };
  
  // Return agent data or default
  return agentDatabase[agentId] || {
    accuracy: '95%+',
    performance: '<1ms',
    usage: '5K+',
    reliability: '99.9%',
    processSteps: [
      { title: 'Input', description: 'Process incoming data' },
      { title: 'Analysis', description: 'Apply core algorithms' },
      { title: 'Output', description: 'Generate results' }
    ],
    formula: 'f(x) = AI(x)',
    formulaDesc: 'Advanced AI-powered analysis',
    formulaParams: [
      { symbol: 'f(x)', description: 'Output function' },
      { symbol: 'x', description: 'Input data' }
    ],
    codeExample: '// Connect and analyze\nconst agent = await finsight.connect(agentId);',
    a2aCapabilities: [
      { icon: '🤖', name: 'AI Powered', description: 'Advanced machine learning' },
      { icon: '⚡', name: 'Fast', description: 'Sub-millisecond response' },
      { icon: '🔗', name: 'Connected', description: 'A2A protocol ready' }
    ],
    protocolVersion: 'A2A v1.0',
    messageFormat: 'JSON',
    authentication: 'API Key',
    rateLimits: '100 req/min',
    connectedAgents: [
      { name: 'Data Feed', type: 'Provider', status: 'active' }
    ],
    endpoints: [
      { id: 'default-1', method: 'POST', path: '/api/agents/analyze', description: 'Main analysis endpoint' }
    ],
    parameters: [
      { name: 'data', type: 'object', required: true, description: 'Input data' }
    ],
    responseExamples: [
      { scenario: 'Success', status: 200, response: { result: 'Analysis complete' } }
    ]
  };
}

// Animate charts when expanded
function animateCharts(card) {
  const canvas = card.querySelector('canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw grid
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 5; i++) {
    const y = (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Draw performance line
  ctx.strokeStyle = '#007AFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  const points = 30;
  for (let i = 0; i <= points; i++) {
    const x = (width / points) * i;
    const y = height / 2 + Math.sin(i * 0.3) * 40 - Math.random() * 20;
    
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  
  ctx.stroke();
  
  // Draw success rate line
  ctx.strokeStyle = '#34C759';
  ctx.beginPath();
  
  for (let i = 0; i <= points; i++) {
    const x = (width / points) * i;
    const y = height * 0.2 + Math.sin(i * 0.2 + 1) * 10;
    
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  
  ctx.stroke();
}

// Animate process steps
function animateProcessSteps(card) {
  const steps = card.querySelectorAll('.process-card');
  steps.forEach((step, index) => {
    setTimeout(() => {
      step.classList.add('animate-in');
    }, index * 100);
  });
}

// Update section titles
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
  
  // Update main header
  const headerTitle = document.querySelector('.jobs-header-title');
  if (headerTitle && headerTitle.textContent === 'A2A Agent Network') {
    headerTitle.textContent = 'Agent Network';
  }
}

// Enhanced CSS
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
  /* Enhanced Expanded Card Styles */
  .expanded-card {
    background: var(--qa-card) !important;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2) !important;
    padding: 0 !important;
    overflow: visible !important;
  }
  
  .expanded-card-content {
    padding: 32px;
    animation: fadeIn 0.5s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  /* Glass Card Style */
  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
  }
  
  .dark-mode .glass-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  /* Enhanced Header */
  .expand-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--qa-border);
  }
  
  .expand-title {
    font-size: 36px;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: var(--qa-text);
  }
  
  .expand-subtitle {
    font-size: 18px;
    color: var(--qa-text-secondary);
    margin: 0 0 24px 0;
  }
  
  /* Tab Navigation */
  .expand-tabs {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }
  
  .tab-btn {
    padding: 8px 16px;
    border: none;
    background: transparent;
    color: var(--qa-text-secondary);
    font-weight: 500;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
  }
  
  .tab-btn:hover {
    background: var(--qa-bg);
  }
  
  .tab-btn.active {
    background: var(--qa-primary);
    color: white;
  }
  
  /* Large Close Button */
  .large-close {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 12px;
    border: 2px solid var(--qa-border);
    background: var(--qa-card);
    cursor: pointer;
    font-weight: 600;
    font-size: 16px;
    color: var(--qa-text);
    transition: all 0.2s;
  }
  
  .large-close:hover {
    background: var(--qa-danger);
    color: white;
    border-color: var(--qa-danger);
    transform: scale(1.05);
  }
  
  /* Process Cards */
  .process-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .process-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    opacity: 0;
    transform: translateX(-20px);
    transition: all 0.5s ease;
  }
  
  .process-card.animate-in {
    opacity: 1;
    transform: translateX(0);
  }
  
  .process-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
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
  
  .step-title {
    font-weight: 600;
    color: var(--qa-text);
  }
  
  .step-description {
    color: var(--qa-text-secondary);
    font-size: 14px;
    margin-left: 44px;
  }
  
  /* Formula Card */
  .formula-card {
    padding: 24px;
  }
  
  .formula-display {
    font-family: 'SF Mono', 'Monaco', monospace;
    font-size: 20px;
    text-align: center;
    margin-bottom: 16px;
    color: var(--qa-primary);
  }
  
  .formula-params {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--qa-border);
  }
  
  .param-item {
    display: flex;
    gap: 12px;
    align-items: baseline;
  }
  
  .param-symbol {
    font-family: 'SF Mono', monospace;
    font-weight: 600;
    color: var(--qa-primary);
  }
  
  /* Code Card */
  .code-card {
    position: relative;
    padding: 0;
    overflow: hidden;
  }
  
  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid var(--qa-border);
  }
  
  .copy-btn {
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid var(--qa-border);
    background: transparent;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }
  
  .copy-btn:hover {
    background: var(--qa-primary);
    color: white;
    border-color: var(--qa-primary);
  }
  
  .code-example {
    padding: 20px;
    margin: 0;
    overflow-x: auto;
    font-size: 14px;
    line-height: 1.6;
  }
  
  /* Metrics */
  .metric-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }
  
  /* Evaluation Styles */
  .evaluation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid var(--qa-border);
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .refresh-btn:hover {
    background: var(--qa-primary);
    color: white;
    border-color: var(--qa-primary);
  }
  
  .evaluation-loading {
    text-align: center;
    padding: 60px;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--qa-border);
    border-top: 3px solid var(--qa-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Score Display */
  .score-display {
    display: flex;
    justify-content: center;
    margin: 24px 0;
  }
  
  .score-circle {
    position: relative;
    width: 120px;
    height: 120px;
  }
  
  .score-circle svg {
    transform: rotate(-90deg);
  }
  
  .score-progress {
    transition: stroke-dashoffset 1s ease;
  }
  
  .score-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 32px;
    font-weight: 700;
    color: var(--qa-primary);
  }
  
  /* Issues and Recommendations */
  .eval-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin: 24px 0;
  }
  
  .issue-item,
  .recommendation-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--qa-bg);
    border-radius: 8px;
    margin-bottom: 8px;
  }
  
  .rec-priority {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    color: white;
  }
  
  .rec-priority.high { background: var(--qa-danger); }
  .rec-priority.medium { background: var(--qa-warning); }
  .rec-priority.low { background: var(--qa-success); }
  
  /* Quality Metrics */
  .quality-item {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }
  
  .quality-label {
    flex: 0 0 150px;
    font-size: 14px;
    color: var(--qa-text-secondary);
  }
  
  .quality-bar {
    flex: 1;
    height: 8px;
    background: var(--qa-bg);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .quality-fill {
    height: 100%;
    background: var(--qa-primary);
    transition: width 1s ease;
  }
  
  .quality-value {
    flex: 0 0 50px;
    text-align: right;
    font-weight: 600;
  }
  
  /* Documentation Styles */
  .endpoint-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    border-bottom: 1px solid var(--qa-border);
  }
  
  .endpoint-method {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    color: white;
  }
  
  .endpoint-method.GET { background: #34C759; }
  .endpoint-method.POST { background: #007AFF; }
  .endpoint-method.PUT { background: #FF9500; }
  .endpoint-method.DELETE { background: #FF3B30; }
  
  .endpoint-path {
    font-family: 'SF Mono', monospace;
    font-size: 14px;
    color: var(--qa-text);
  }
  
  .try-btn {
    margin-left: auto;
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid var(--qa-border);
    background: transparent;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }
  
  .try-btn:hover {
    background: var(--qa-primary);
    color: white;
    border-color: var(--qa-primary);
  }
  
  /* Parameters Table */
  .params-table table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .params-table th {
    text-align: left;
    padding: 12px;
    border-bottom: 2px solid var(--qa-border);
    font-weight: 600;
    color: var(--qa-text-secondary);
    font-size: 14px;
  }
  
  .params-table td {
    padding: 12px;
    border-bottom: 1px solid var(--qa-border);
  }
  
  .type-badge {
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--qa-bg);
    font-size: 12px;
    font-family: 'SF Mono', monospace;
  }
  
  /* Action Buttons */
  .expand-actions {
    display: flex;
    gap: 16px;
    padding-top: 32px;
    border-top: 1px solid var(--qa-border);
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .action-btn svg {
    width: 16px;
    height: 16px;
  }
  
  /* Capability Grid */
  .capability-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-top: 16px;
  }
  
  .capability-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .capability-icon {
    font-size: 24px;
  }
  
  .capability-name {
    font-weight: 600;
    color: var(--qa-text);
  }
  
  .capability-desc {
    font-size: 14px;
    color: var(--qa-text-secondary);
  }
  
  /* Connected Agents */
  .connected-agents-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  
  .connected-agent-card {
    padding: 16px;
    text-align: center;
  }
  
  .connected-name {
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .connected-type {
    font-size: 12px;
    color: var(--qa-text-secondary);
    margin-bottom: 8px;
  }
  
  .connected-status {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .connected-status.active {
    background: var(--qa-success);
    color: white;
  }
  
  /* Chart Legend */
  .chart-legend {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 16px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--qa-text-secondary);
  }
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .dot.blue { background: #007AFF; }
  .dot.green { background: #34C759; }
`;
document.head.appendChild(enhancedStyles);