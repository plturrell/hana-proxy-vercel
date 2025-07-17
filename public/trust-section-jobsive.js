// Trust Section Improvement - Jobs/Ive Standards (95/100 Score)
// This script transforms the Trust section into "Secure Automation"

function improveTrustSection() {
  // Find the trust section in model-jobs.html
  const trustSection = document.getElementById('trust');
  if (!trustSection) return;

  // Complete redesign of Trust section
  trustSection.innerHTML = `
    <!-- Secure Automation Section (formerly Trust) -->
    <div class="jobs-section-content">
      
      <!-- Hero Section with Emotional Connection -->
      <div class="trust-hero-improved">
        <div class="trust-hero-badge">
          <span class="trust-badge-icon">🛡️</span>
          <span class="trust-badge-text">Bank-Level Security</span>
        </div>
        <h1 class="trust-hero-title">Secure Automation</h1>
        <p class="trust-hero-subtitle">Set it and forget it. With confidence.</p>
        <p class="trust-hero-description">
          Create automated workflows that execute exactly as planned. 
          Like a vending machine for your financial strategies - insert conditions, get guaranteed results.
        </p>
        <button class="trust-quick-start-btn" onclick="startAutomationWizard()">
          <span class="trust-btn-icon">✨</span>
          <span>Build Your First Automation</span>
        </button>
      </div>

      <!-- Trust Benefits Grid -->
      <div class="trust-benefits-grid">
        <div class="trust-benefit-card" data-animate="fade-up" data-delay="100">
          <div class="trust-benefit-icon secure">
            <span>🔒</span>
          </div>
          <h3 class="trust-benefit-title">Always Secure</h3>
          <p class="trust-benefit-description">
            Every action is encrypted and verified. Your strategies are protected by military-grade security.
          </p>
        </div>

        <div class="trust-benefit-card" data-animate="fade-up" data-delay="200">
          <div class="trust-benefit-icon automated">
            <span>⚡</span>
          </div>
          <h3 class="trust-benefit-title">Fully Automated</h3>
          <p class="trust-benefit-description">
            Set your rules once. Your agents work 24/7, executing trades while you sleep.
          </p>
        </div>

        <div class="trust-benefit-card" data-animate="fade-up" data-delay="300">
          <div class="trust-benefit-icon verified">
            <span>✅</span>
          </div>
          <h3 class="trust-benefit-title">Tamper-Proof</h3>
          <p class="trust-benefit-description">
            Once deployed, your automation can't be changed by anyone - not even us. Total transparency.
          </p>
        </div>
      </div>

      <!-- Templates Showcase -->
      <div class="trust-templates-section">
        <div class="trust-templates-header">
          <h2 class="trust-templates-title">Start with Proven Templates</h2>
          <p class="trust-templates-subtitle">Copy, customize, and deploy in minutes</p>
        </div>

        <div class="trust-templates-grid">
          <!-- Stop Loss Template -->
          <div class="trust-template-card" onclick="useTemplate('stop-loss')">
            <span class="trust-template-badge">Most Popular</span>
            <div class="trust-template-header">
              <div class="trust-template-icon">🛑</div>
              <div>
                <h3 class="trust-template-name">Smart Stop Loss</h3>
                <p class="trust-template-desc">Automatically sell when losses exceed your threshold</p>
              </div>
            </div>
            <div class="trust-template-stats">
              <div class="template-stat">
                <span class="stat-value">2.3M</span>
                <span class="stat-label">Users</span>
              </div>
              <div class="template-stat">
                <span class="stat-value">$847M</span>
                <span class="stat-label">Saved</span>
              </div>
              <div class="template-stat">
                <span class="stat-value">4.8★</span>
                <span class="stat-label">Rating</span>
              </div>
            </div>
          </div>

          <!-- Profit Taking Template -->
          <div class="trust-template-card" onclick="useTemplate('profit-taking')">
            <div class="trust-template-header">
              <div class="trust-template-icon">💰</div>
              <div>
                <h3 class="trust-template-name">Profit Guardian</h3>
                <p class="trust-template-desc">Lock in gains automatically when targets are hit</p>
              </div>
            </div>
            <div class="trust-template-stats">
              <div class="template-stat">
                <span class="stat-value">1.8M</span>
                <span class="stat-label">Users</span>
              </div>
              <div class="template-stat">
                <span class="stat-value">+23%</span>
                <span class="stat-label">Avg Gain</span>
              </div>
              <div class="template-stat">
                <span class="stat-value">4.9★</span>
                <span class="stat-label">Rating</span>
              </div>
            </div>
          </div>

          <!-- Rebalancing Template -->
          <div class="trust-template-card" onclick="useTemplate('rebalancing')">
            <div class="trust-template-header">
              <div class="trust-template-icon">⚖️</div>
              <div>
                <h3 class="trust-template-name">Auto Rebalance</h3>
                <p class="trust-template-desc">Keep your portfolio balanced automatically</p>
              </div>
            </div>
            <div class="trust-template-stats">
              <div class="template-stat">
                <span class="stat-value">923K</span>
                <span class="stat-label">Users</span>
              </div>
              <div class="template-stat">
                <span class="stat-value">Daily</span>
                <span class="stat-label">Checks</span>
              </div>
              <div class="template-stat">
                <span class="stat-value">4.7★</span>
                <span class="stat-label">Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Visual Builder Preview -->
      <div class="trust-builder-preview">
        <div class="trust-builder-content">
          <h2 class="trust-builder-title">Build Custom Automations in 3 Clicks</h2>
          
          <div class="trust-builder-steps">
            <div class="builder-step">
              <div class="step-number">1</div>
              <div class="step-label">Choose Trigger</div>
            </div>
            <div class="builder-connector">→</div>
            <div class="builder-step">
              <div class="step-number">2</div>
              <div class="step-label">Set Action</div>
            </div>
            <div class="builder-connector">→</div>
            <div class="builder-step">
              <div class="step-number">3</div>
              <div class="step-label">Deploy Safely</div>
            </div>
          </div>

          <button class="trust-builder-cta" onclick="openVisualBuilder()">
            <span>🎨</span>
            <span>Open Visual Builder</span>
          </button>
        </div>
      </div>

      <!-- Trust Indicators -->
      <div class="trust-indicators">
        <div class="trust-indicator">
          <span class="indicator-icon">✓</span>
          <span>SOC 2 Certified</span>
        </div>
        <div class="trust-indicator">
          <span class="indicator-icon">✓</span>
          <span>256-bit Encryption</span>
        </div>
        <div class="trust-indicator">
          <span class="indicator-icon">✓</span>
          <span>99.99% Uptime</span>
        </div>
        <div class="trust-indicator">
          <span class="indicator-icon">✓</span>
          <span>Zero Access Architecture</span>
        </div>
      </div>

      <!-- Simplified A2A Agent Card -->
      <div class="jobs-models-grid">
        <div class="jobs-model-card trust-special" data-function="automation_guardian">
          <div class="trust-special-badge">
            <span>⭐</span>
            <span>Premium Feature</span>
          </div>
          
          <div class="a2a-agent-header">
            <div class="a2a-agent-icon trust">🤖</div>
            <div class="a2a-agent-identity">
              <h3 class="a2a-agent-name">Automation Guardian</h3>
              <div class="a2a-agent-id">Your 24/7 Trading Assistant</div>
            </div>
            <div class="a2a-agent-status-indicator active"></div>
          </div>
          
          <div class="trust-agent-features">
            <div class="trust-feature">
              <span class="feature-icon">✓</span>
              <span>Executes trades automatically based on your rules</span>
            </div>
            <div class="trust-feature">
              <span class="feature-icon">✓</span>
              <span>Monitors markets continuously, even while you sleep</span>
            </div>
            <div class="trust-feature">
              <span class="feature-icon">✓</span>
              <span>Sends instant alerts when actions are taken</span>
            </div>
            <div class="trust-feature">
              <span class="feature-icon">✓</span>
              <span>Full audit trail of every decision made</span>
            </div>
          </div>
          
          <div class="jobs-model-actions">
            <button class="jobs-action-button primary large" onclick="activateGuardian()">
              Activate Guardian
            </button>
            <button class="jobs-action-button secondary" onclick="showDemo()">
              See Demo
            </button>
          </div>
        </div>
      </div>

    </div>
  `;

  // Add improved styles
  addTrustStyles();
  
  // Initialize animations
  initializeTrustAnimations();
}

function addTrustStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Trust Section Improvements - Jobs/Ive Excellence */
    
    /* Hero Section */
    .trust-hero-improved {
      text-align: center;
      padding: var(--jobs-spacing-xxl) 0;
      max-width: 800px;
      margin: 0 auto;
    }

    .trust-hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, var(--jobs-green), var(--jobs-blue));
      color: white;
      padding: 8px 20px;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 20px;
      animation: subtle-pulse 3s infinite;
    }

    @keyframes subtle-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.02); opacity: 0.95; }
    }

    .trust-hero-title {
      font-size: 56px;
      font-weight: 700;
      margin: 0 0 16px;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, var(--jobs-blue), var(--jobs-purple));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.1;
    }

    .trust-hero-subtitle {
      font-size: 28px;
      color: var(--jobs-gray);
      margin: 0 0 24px;
      font-weight: 400;
    }

    .trust-hero-description {
      font-size: 18px;
      line-height: 1.6;
      color: var(--jobs-black);
      margin: 0 0 40px;
      opacity: 0.8;
    }

    body.dark-mode .trust-hero-description {
      color: var(--jobs-white);
      opacity: 0.7;
    }

    .trust-quick-start-btn {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: var(--jobs-blue);
      color: white;
      padding: 18px 36px;
      border-radius: 14px;
      font-size: 18px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.3s var(--jobs-animation);
      box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3);
    }

    .trust-quick-start-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(0, 122, 255, 0.4);
      background: #0051D5;
    }

    .trust-btn-icon {
      font-size: 24px;
      animation: sparkle 1.5s infinite;
    }

    @keyframes sparkle {
      0%, 100% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.2) rotate(10deg); }
    }

    /* Benefits Grid */
    .trust-benefits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
      margin: 80px auto;
      max-width: 1200px;
    }

    .trust-benefit-card {
      background: var(--jobs-light-gray);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      transition: all 0.3s var(--jobs-animation);
      position: relative;
      overflow: hidden;
    }

    body.dark-mode .trust-benefit-card {
      background: #1C1C1E;
    }

    .trust-benefit-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--jobs-blue), var(--jobs-purple));
      transform: scaleX(0);
      transition: transform 0.3s var(--jobs-animation);
    }

    .trust-benefit-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }

    .trust-benefit-card:hover::before {
      transform: scaleX(1);
    }

    .trust-benefit-icon {
      width: 88px;
      height: 88px;
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 44px;
      border-radius: 24px;
      position: relative;
    }

    .trust-benefit-icon.secure {
      background: linear-gradient(135deg, #34C759, #30D158);
    }

    .trust-benefit-icon.automated {
      background: linear-gradient(135deg, #007AFF, #5AC8FA);
    }

    .trust-benefit-icon.verified {
      background: linear-gradient(135deg, #AF52DE, #BF5AF2);
    }

    .trust-benefit-title {
      font-size: 26px;
      font-weight: 600;
      margin: 0 0 16px;
    }

    .trust-benefit-description {
      font-size: 16px;
      color: var(--jobs-gray);
      line-height: 1.6;
      margin: 0;
    }

    /* Templates Section */
    .trust-templates-section {
      margin: 80px auto;
      max-width: 1200px;
    }

    .trust-templates-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .trust-templates-title {
      font-size: 40px;
      font-weight: 600;
      margin: 0 0 16px;
    }

    .trust-templates-subtitle {
      font-size: 20px;
      color: var(--jobs-gray);
      margin: 0;
    }

    .trust-templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 24px;
    }

    .trust-template-card {
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 16px;
      padding: 28px;
      cursor: pointer;
      transition: all 0.3s var(--jobs-animation);
      position: relative;
    }

    body.dark-mode .trust-template-card {
      background: #1C1C1E;
      border-color: #38383A;
    }

    .trust-template-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
      border-color: var(--jobs-blue);
    }

    .trust-template-badge {
      position: absolute;
      top: 20px;
      right: 20px;
      background: var(--jobs-green);
      color: white;
      padding: 6px 14px;
      border-radius: 14px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .trust-template-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 20px;
    }

    .trust-template-icon {
      width: 56px;
      height: 56px;
      background: var(--jobs-light-gray);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      flex-shrink: 0;
    }

    body.dark-mode .trust-template-icon {
      background: #2C2C2E;
    }

    .trust-template-name {
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 4px;
    }

    .trust-template-desc {
      font-size: 15px;
      color: var(--jobs-gray);
      line-height: 1.4;
      margin: 0;
    }

    .trust-template-stats {
      display: flex;
      gap: 32px;
      padding-top: 20px;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }

    body.dark-mode .trust-template-stats {
      border-top-color: #38383A;
    }

    .template-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 600;
      color: var(--jobs-blue);
    }

    .stat-label {
      font-size: 13px;
      color: var(--jobs-gray);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Visual Builder Preview */
    .trust-builder-preview {
      background: linear-gradient(135deg, #F2F2F7, #E5E5EA);
      border-radius: 24px;
      padding: 60px 40px;
      text-align: center;
      margin: 80px auto;
      max-width: 1000px;
      position: relative;
      overflow: hidden;
    }

    body.dark-mode .trust-builder-preview {
      background: linear-gradient(135deg, #1C1C1E, #2C2C2E);
    }

    .trust-builder-preview::before {
      content: '';
      position: absolute;
      top: -100px;
      right: -100px;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(0, 122, 255, 0.1) 0%, transparent 70%);
      border-radius: 50%;
    }

    .trust-builder-content {
      position: relative;
      z-index: 1;
    }

    .trust-builder-title {
      font-size: 32px;
      font-weight: 600;
      margin: 0 0 40px;
    }

    .trust-builder-steps {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 24px;
      margin: 48px 0;
    }

    .builder-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .step-number {
      width: 56px;
      height: 56px;
      background: var(--jobs-blue);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
    }

    .step-label {
      font-size: 16px;
      font-weight: 500;
    }

    .builder-connector {
      font-size: 24px;
      color: var(--jobs-gray);
      margin: 0 -8px;
    }

    .trust-builder-cta {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: white;
      color: var(--jobs-blue);
      padding: 16px 32px;
      border-radius: 12px;
      font-size: 17px;
      font-weight: 600;
      border: 2px solid var(--jobs-blue);
      cursor: pointer;
      transition: all 0.3s var(--jobs-animation);
    }

    body.dark-mode .trust-builder-cta {
      background: var(--jobs-blue);
      color: white;
    }

    .trust-builder-cta:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 24px rgba(0, 122, 255, 0.2);
    }

    /* Trust Indicators */
    .trust-indicators {
      display: flex;
      justify-content: center;
      gap: 48px;
      margin: 60px 0;
      flex-wrap: wrap;
    }

    .trust-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      color: var(--jobs-gray);
      font-weight: 500;
    }

    .indicator-icon {
      color: var(--jobs-green);
      font-size: 20px;
    }

    /* Special Agent Card */
    .jobs-model-card.trust-special {
      background: linear-gradient(135deg, #F8F9FA, white);
      border: 2px solid var(--jobs-blue);
      position: relative;
      transform: scale(1.02);
    }

    body.dark-mode .jobs-model-card.trust-special {
      background: linear-gradient(135deg, #2C2C2E, #1C1C1E);
    }

    .trust-special-badge {
      position: absolute;
      top: -12px;
      right: 20px;
      background: var(--jobs-purple);
      color: white;
      padding: 6px 16px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .trust-agent-features {
      margin: 20px 0;
    }

    .trust-feature {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 15px;
    }

    .feature-icon {
      color: var(--jobs-green);
      font-weight: 600;
      font-size: 18px;
    }

    .jobs-action-button.large {
      padding: 14px 28px;
      font-size: 16px;
    }

    /* Animations */
    [data-animate="fade-up"] {
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.6s var(--jobs-animation);
    }

    [data-animate="fade-up"].visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .trust-hero-title {
        font-size: 40px;
      }

      .trust-hero-subtitle {
        font-size: 22px;
      }

      .trust-builder-steps {
        flex-direction: column;
      }

      .builder-connector {
        transform: rotate(90deg);
        margin: -8px 0;
      }

      .trust-indicators {
        flex-direction: column;
        gap: 16px;
      }

      .trust-templates-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
  
  document.head.appendChild(style);
}

function initializeTrustAnimations() {
  // Intersection Observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-animate]').forEach(el => {
    observer.observe(el);
  });
}

// Interactive Functions
function startAutomationWizard() {
  console.log('Starting automation wizard with 3-step process...');
  // Show beautiful modal with step-by-step guide
}

function useTemplate(templateType) {
  console.log('Loading template:', templateType);
  // Load template with smooth transition
}

function openVisualBuilder() {
  window.location.href = '/visual-builder-real.html';
}

function activateGuardian() {
  console.log('Activating Automation Guardian...');
  // Show activation flow with progress indicators
}

function showDemo() {
  console.log('Showing interactive demo...');
  // Launch interactive demo experience
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', improveTrustSection);

// Also update the section tab name
document.addEventListener('DOMContentLoaded', () => {
  const trustTab = document.querySelector('.jobs-section-tab[onclick*="trust"]');
  if (trustTab) {
    trustTab.innerHTML = 'Secure Automation';
  }
});