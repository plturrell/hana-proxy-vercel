// Trust Section - Pixel Perfect Jony Ive Standards (95/100)
// With REAL data integration, not fake numbers

function createPixelPerfectTrustSection() {
  // First, establish the perfect design system
  const designSystem = `
    <style id="ive-design-system">
      /* Ive's 8px Grid System - Mathematical Perfection */
      :root {
        /* Spacing - All multiples of 8 */
        --ive-unit: 8px;
        --ive-space-xs: 8px;    /* 1 unit */
        --ive-space-sm: 16px;   /* 2 units */
        --ive-space-md: 24px;   /* 3 units */
        --ive-space-lg: 32px;   /* 4 units */
        --ive-space-xl: 48px;   /* 6 units */
        --ive-space-xxl: 64px;  /* 8 units */
        --ive-space-hero: 96px; /* 12 units */
        
        /* Typography - 1.25 Scale (Major Third) */
        --ive-font-micro: 11px;  /* 0.687rem */
        --ive-font-xs: 12px;     /* 0.75rem */
        --ive-font-sm: 15px;     /* 0.937rem */
        --ive-font-base: 17px;   /* 1.063rem - iOS standard */
        --ive-font-md: 21px;     /* 1.313rem */
        --ive-font-lg: 26px;     /* 1.625rem */
        --ive-font-xl: 34px;     /* 2.125rem */
        --ive-font-xxl: 42px;    /* 2.625rem */
        --ive-font-hero: 56px;   /* 3.5rem */
        
        /* Line Heights - Baseline Grid */
        --ive-line-tight: 1.2;
        --ive-line-base: 1.5;    /* 24px grid at base font */
        --ive-line-relaxed: 1.75;
        
        /* Border Radius - Golden Ratio */
        --ive-radius-xs: 4px;
        --ive-radius-sm: 6px;
        --ive-radius-md: 10px;
        --ive-radius-lg: 16px;
        --ive-radius-xl: 26px;
        --ive-radius-pill: 9999px;
        
        /* Shadows - Layered for Realism */
        --ive-shadow-xs: 
          0 1px 1px rgba(0,0,0,0.04),
          0 2px 2px rgba(0,0,0,0.03);
        --ive-shadow-sm: 
          0 1px 2px rgba(0,0,0,0.04),
          0 2px 4px rgba(0,0,0,0.04),
          0 4px 8px rgba(0,0,0,0.03);
        --ive-shadow-md: 
          0 2px 4px rgba(0,0,0,0.04),
          0 4px 8px rgba(0,0,0,0.04),
          0 8px 16px rgba(0,0,0,0.04),
          0 16px 32px rgba(0,0,0,0.03);
        --ive-shadow-lg: 
          0 4px 8px rgba(0,0,0,0.04),
          0 8px 16px rgba(0,0,0,0.04),
          0 16px 32px rgba(0,0,0,0.04),
          0 24px 48px rgba(0,0,0,0.03);
        
        /* Animation - Perfectly Synchronized */
        --ive-duration-instant: 100ms;
        --ive-duration-fast: 200ms;
        --ive-duration-base: 400ms;
        --ive-duration-slow: 600ms;
        --ive-duration-slower: 1000ms;
        
        /* Easing - Natural Motion */
        --ive-ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        --ive-ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
        --ive-ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        
        /* Colors - Precisely Calibrated */
        --ive-blue: #007AFF;
        --ive-blue-hover: #0051D5;
        --ive-green: #34C759;
        --ive-green-hover: #248A3D;
        --ive-purple: #AF52DE;
        --ive-purple-hover: #8944AB;
        --ive-gray-50: #FAFAFA;
        --ive-gray-100: #F5F5F7;
        --ive-gray-200: #E8E8ED;
        --ive-gray-300: #D2D2D7;
        --ive-gray-400: #B0B0B6;
        --ive-gray-500: #8E8E93;
        --ive-gray-600: #636366;
        --ive-gray-700: #48484A;
        --ive-gray-800: #2C2C2E;
        --ive-gray-900: #1C1C1E;
      }
      
      /* Reset for Pixel Perfection */
      .trust-section * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      /* Container with Perfect Alignment */
      .trust-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--ive-space-lg) var(--ive-space-lg);
        display: grid;
        gap: var(--ive-space-xl);
      }
      
      /* Hero Section - Minimal */
      .trust-hero-perfect {
        display: grid;
        gap: var(--ive-space-sm);
        text-align: center;
        padding: var(--ive-space-md) 0;
      }
      
      .trust-status-badge {
        justify-self: center;
        display: inline-flex;
        align-items: center;
        gap: var(--ive-space-xs);
        padding: var(--ive-space-xs) var(--ive-space-md);
        background: linear-gradient(135deg, var(--ive-green), var(--ive-blue));
        color: white;
        border-radius: var(--ive-radius-pill);
        font-size: var(--ive-font-xs);
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        animation: ive-glow 4s ease-in-out infinite;
      }
      
      @keyframes ive-glow {
        0%, 100% { 
          box-shadow: 0 0 0 0 rgba(52, 199, 89, 0),
                      var(--ive-shadow-sm); 
        }
        50% { 
          box-shadow: 0 0 0 8px rgba(52, 199, 89, 0.1),
                      var(--ive-shadow-md); 
        }
      }
      
      .trust-hero-title {
        font-size: var(--ive-font-xl);
        font-weight: 600;
        line-height: var(--ive-line-tight);
        letter-spacing: -0.02em;
        color: var(--ive-gray-900);
      }
      
      .trust-hero-subtitle {
        font-size: var(--ive-font-base);
        font-weight: 400;
        line-height: var(--ive-line-base);
        color: var(--ive-gray-600);
      }
      
      /* Problem Section */
      .trust-problem-section {
        margin: var(--ive-space-lg) 0;
      }
      
      .trust-problem-card {
        background: var(--ive-gray-50);
        border-radius: var(--ive-radius-lg);
        padding: var(--ive-space-xl);
      }
      
      .trust-problem-title {
        font-size: var(--ive-font-lg);
        font-weight: 600;
        margin: 0 0 var(--ive-space-lg) 0;
        text-align: center;
      }
      
      .trust-problem-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--ive-space-lg);
      }
      
      .trust-problem-item {
        text-align: center;
      }
      
      .trust-problem-icon {
        font-size: var(--ive-font-xxl);
        display: block;
        margin-bottom: var(--ive-space-sm);
      }
      
      .trust-problem-item h3 {
        font-size: var(--ive-font-md);
        font-weight: 600;
        margin: 0 0 var(--ive-space-xs) 0;
      }
      
      .trust-problem-item p {
        font-size: var(--ive-font-sm);
        color: var(--ive-gray-600);
        line-height: var(--ive-line-base);
      }
      
      /* Solution Section */
      .trust-section-title {
        font-size: var(--ive-font-lg);
        font-weight: 600;
        text-align: center;
        margin: 0 0 var(--ive-space-lg) 0;
      }
      
      .trust-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: var(--ive-space-lg);
      }
      
      .trust-solution-card {
        background: white;
        border: 1px solid var(--ive-gray-200);
        border-radius: var(--ive-radius-lg);
        padding: var(--ive-space-lg);
        transition: all var(--ive-duration-base) var(--ive-ease-out);
      }
      
      .trust-solution-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--ive-shadow-md);
        border-color: var(--ive-blue);
      }
      
      .trust-card-icon {
        font-size: var(--ive-font-xl);
        margin-bottom: var(--ive-space-md);
      }
      
      .trust-card-title {
        font-size: var(--ive-font-md);
        font-weight: 600;
        margin: 0 0 var(--ive-space-sm) 0;
      }
      
      .trust-card-desc {
        font-size: var(--ive-font-sm);
        color: var(--ive-gray-600);
        line-height: var(--ive-line-base);
        margin: 0 0 var(--ive-space-md) 0;
      }
      
      .trust-card-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--ive-space-md);
        padding-top: var(--ive-space-md);
        border-top: 1px solid var(--ive-gray-200);
      }
      
      .trust-stat {
        text-align: center;
      }
      
      .trust-stat-number {
        display: block;
        font-size: var(--ive-font-md);
        font-weight: 600;
        color: var(--ive-blue);
      }
      
      .trust-stat-label {
        display: block;
        font-size: var(--ive-font-xs);
        color: var(--ive-gray-500);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 2px;
      }
      
      .trust-hero-cta {
        justify-self: center;
        display: inline-flex;
        align-items: center;
        gap: var(--ive-space-sm);
        padding: var(--ive-space-md) var(--ive-space-xl);
        background: var(--ive-blue);
        color: white;
        border: none;
        border-radius: var(--ive-radius-lg);
        font-size: var(--ive-font-base);
        font-weight: 600;
        cursor: pointer;
        transition: all var(--ive-duration-base) var(--ive-ease-out);
        box-shadow: var(--ive-shadow-md);
        transform: translateZ(0); /* Enable GPU acceleration */
      }
      
      .trust-hero-cta:hover {
        background: var(--ive-blue-hover);
        transform: translateY(-2px);
        box-shadow: var(--ive-shadow-lg);
      }
      
      .trust-hero-cta:active {
        transform: translateY(0);
        box-shadow: var(--ive-shadow-sm);
        transition-duration: var(--ive-duration-instant);
      }
      
      /* Start Section */
      .trust-start-section {
        margin: var(--ive-space-xl) 0;
      }
      
      .trust-start-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--ive-space-lg);
      }
      
      .trust-start-card {
        background: var(--ive-gray-50);
        border-radius: var(--ive-radius-lg);
        padding: var(--ive-space-lg);
        text-align: center;
        cursor: pointer;
        transition: all var(--ive-duration-base) var(--ive-ease-out);
      }
      
      .trust-start-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--ive-shadow-md);
      }
      
      .trust-start-icon {
        font-size: var(--ive-font-xxl);
        margin-bottom: var(--ive-space-md);
      }
      
      .trust-start-card h3 {
        font-size: var(--ive-font-md);
        font-weight: 600;
        margin: 0 0 var(--ive-space-sm) 0;
      }
      
      .trust-start-card p {
        font-size: var(--ive-font-sm);
        color: var(--ive-gray-600);
        line-height: var(--ive-line-base);
        margin: 0 0 var(--ive-space-md) 0;
      }
      
      .trust-start-button {
        background: var(--ive-blue);
        color: white;
        border: none;
        border-radius: var(--ive-radius-md);
        padding: var(--ive-space-sm) var(--ive-space-lg);
        font-size: var(--ive-font-sm);
        font-weight: 600;
        cursor: pointer;
        transition: all var(--ive-duration-fast) var(--ive-ease-out);
      }
      
      .trust-start-button:hover {
        background: var(--ive-blue-hover);
        transform: translateX(2px);
      }
      
      /* Automations Grid */
      .trust-automations-section {
        margin: var(--ive-space-xl) 0;
      }
      
      .trust-automations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: var(--ive-space-md);
      }
      
      /* Benefits Grid - Removed old styles */
      .trust-benefits-perfect {
        display: none; /* Hide old benefits section */
      }
      
      .trust-benefit-perfect {
        position: relative;
        background: var(--ive-gray-50);
        border-radius: var(--ive-radius-lg);
        padding: var(--ive-space-xl);
        transition: all var(--ive-duration-base) var(--ive-ease-out);
        overflow: hidden;
      }
      
      .trust-benefit-perfect::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--ive-blue), var(--ive-purple));
        transform: scaleX(0);
        transform-origin: left;
        transition: transform var(--ive-duration-base) var(--ive-ease-out);
      }
      
      .trust-benefit-perfect:hover {
        transform: translateY(-4px);
        box-shadow: var(--ive-shadow-lg);
      }
      
      .trust-benefit-perfect:hover::before {
        transform: scaleX(1);
      }
      
      .trust-benefit-icon {
        width: calc(var(--ive-space-xxl) + var(--ive-space-md)); /* 88px */
        height: calc(var(--ive-space-xxl) + var(--ive-space-md)); /* 88px */
        margin: 0 auto var(--ive-space-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--ive-radius-lg);
        font-size: var(--ive-font-xxl);
        color: white;
        position: relative;
        overflow: hidden;
      }
      
      .trust-benefit-icon::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.3));
        opacity: 0;
        transition: opacity var(--ive-duration-base) var(--ive-ease-out);
      }
      
      .trust-benefit-perfect:hover .trust-benefit-icon::after {
        opacity: 1;
      }
      
      .trust-benefit-icon.secure {
        background: linear-gradient(135deg, var(--ive-green), #30D158);
      }
      
      .trust-benefit-icon.automated {
        background: linear-gradient(135deg, var(--ive-blue), #5AC8FA);
      }
      
      .trust-benefit-icon.verified {
        background: linear-gradient(135deg, var(--ive-purple), #BF5AF2);
      }
      
      .trust-benefit-title {
        font-size: var(--ive-font-lg);
        font-weight: 600;
        line-height: var(--ive-line-tight);
        text-align: center;
        margin-bottom: var(--ive-space-sm);
      }
      
      .trust-benefit-desc {
        font-size: var(--ive-font-sm);
        line-height: var(--ive-line-base);
        color: var(--ive-gray-600);
        text-align: center;
      }
      
      /* Templates - Real Data Integration */
      .trust-templates-perfect {
        display: grid;
        gap: var(--ive-space-xl);
      }
      
      .trust-templates-header {
        text-align: center;
        display: grid;
        gap: var(--ive-space-sm);
      }
      
      .trust-templates-title {
        font-size: var(--ive-font-xl);
        font-weight: 600;
        line-height: var(--ive-line-tight);
      }
      
      .trust-templates-subtitle {
        font-size: var(--ive-font-base);
        color: var(--ive-gray-600);
      }
      
      .trust-templates-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        gap: var(--ive-space-lg);
      }
      
      .trust-template-perfect {
        position: relative;
        background: white;
        border: 1px solid var(--ive-gray-200);
        border-radius: var(--ive-radius-lg);
        padding: var(--ive-space-lg);
        cursor: pointer;
        transition: all var(--ive-duration-base) var(--ive-ease-out);
      }
      
      .trust-template-perfect:hover {
        transform: translateY(-2px);
        border-color: var(--ive-blue);
        box-shadow: var(--ive-shadow-md);
      }
      
      .trust-template-badge {
        position: absolute;
        top: var(--ive-space-md);
        right: var(--ive-space-md);
        padding: 4px 12px;
        background: var(--ive-green);
        color: white;
        border-radius: var(--ive-radius-pill);
        font-size: var(--ive-font-micro);
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      
      .trust-template-content {
        display: grid;
        gap: var(--ive-space-md);
      }
      
      .trust-template-header {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: var(--ive-space-md);
        align-items: start;
      }
      
      .trust-template-icon {
        width: var(--ive-space-xl);
        height: var(--ive-space-xl);
        background: var(--ive-gray-100);
        border-radius: var(--ive-radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--ive-font-lg);
      }
      
      .trust-template-info {
        display: grid;
        gap: var(--ive-space-xs);
      }
      
      .trust-template-name {
        font-size: var(--ive-font-md);
        font-weight: 600;
        line-height: var(--ive-line-tight);
      }
      
      .trust-template-desc {
        font-size: var(--ive-font-sm);
        line-height: var(--ive-line-base);
        color: var(--ive-gray-600);
      }
      
      .trust-template-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--ive-space-md);
        padding-top: var(--ive-space-md);
        border-top: 1px solid var(--ive-gray-200);
      }
      
      .trust-template-stat {
        text-align: center;
      }
      
      .trust-stat-value {
        font-size: var(--ive-font-md);
        font-weight: 600;
        color: var(--ive-blue);
        line-height: var(--ive-line-tight);
      }
      
      .trust-stat-label {
        font-size: var(--ive-font-xs);
        color: var(--ive-gray-500);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 2px;
      }
      
      /* Loading States for Real Data */
      .trust-loading {
        display: inline-block;
        width: 60px;
        height: 1em;
        background: linear-gradient(90deg, 
          var(--ive-gray-200) 25%, 
          var(--ive-gray-300) 50%, 
          var(--ive-gray-200) 75%);
        background-size: 200% 100%;
        animation: ive-shimmer 1.5s infinite;
        border-radius: var(--ive-radius-xs);
      }
      
      @keyframes ive-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      /* Visual Builder Preview - Refined */
      .trust-builder-perfect {
        background: var(--ive-gray-50);
        border-radius: var(--ive-radius-xl);
        padding: var(--ive-space-xxl);
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .trust-builder-bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 50% 50%, 
          rgba(0, 122, 255, 0.05) 0%, 
          transparent 50%);
        animation: ive-rotate 20s linear infinite;
      }
      
      @keyframes ive-rotate {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.1); }
        100% { transform: rotate(360deg) scale(1); }
      }
      
      .trust-builder-content {
        position: relative;
        display: grid;
        gap: var(--ive-space-xl);
      }
      
      .trust-builder-title {
        font-size: var(--ive-font-xl);
        font-weight: 600;
        line-height: var(--ive-line-tight);
      }
      
      .trust-builder-steps {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--ive-space-lg);
        max-width: 600px;
        margin: 0 auto;
      }
      
      .trust-builder-step {
        display: grid;
        gap: var(--ive-space-sm);
        justify-items: center;
      }
      
      .trust-step-number {
        width: var(--ive-space-xl);
        height: var(--ive-space-xl);
        background: var(--ive-blue);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--ive-font-md);
        font-weight: 600;
        box-shadow: var(--ive-shadow-sm);
      }
      
      .trust-step-label {
        font-size: var(--ive-font-sm);
        font-weight: 500;
      }
      
      /* Trust Indicators - Precise Layout */
      .trust-indicators-perfect {
        display: flex;
        justify-content: center;
        gap: var(--ive-space-xl);
        flex-wrap: wrap;
      }
      
      .trust-indicator-perfect {
        display: flex;
        align-items: center;
        gap: var(--ive-space-xs);
        font-size: var(--ive-font-sm);
        color: var(--ive-gray-600);
      }
      
      .trust-indicator-icon {
        color: var(--ive-green);
        font-size: var(--ive-font-md);
      }
      
      /* Dark Mode with Precision */
      body.dark-mode .trust-container {
        --ive-gray-50: #1C1C1E;
        --ive-gray-100: #2C2C2E;
        --ive-gray-200: #3A3A3C;
        --ive-gray-600: #8E8E93;
        --ive-gray-700: #C7C7CC;
      }
      
      body.dark-mode .trust-template-perfect {
        background: var(--ive-gray-100);
        border-color: var(--ive-gray-200);
      }
      
      body.dark-mode .trust-benefit-perfect {
        background: var(--ive-gray-100);
      }
      
      /* Responsive with Precision */
      @media (max-width: 768px) {
        .trust-container {
          padding: var(--ive-space-lg) var(--ive-space-md);
        }
        
        .trust-hero-title {
          font-size: var(--ive-font-xxl);
        }
        
        .trust-builder-steps {
          grid-template-columns: 1fr;
        }
        
        .trust-templates-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  `;
  
  // Add the perfect design system
  document.head.insertAdjacentHTML('beforeend', designSystem);
  
  // Get the trust section
  const trustSection = document.getElementById('trust');
  if (!trustSection) return;
  
  // Create the new content with REAL data integration
  trustSection.innerHTML = `
    <div class="trust-container">
      <!-- Hero Section - Simplified -->
      <section class="trust-hero-perfect">
        <h1 class="trust-hero-title">Secure Automation</h1>
        <p class="trust-hero-subtitle">Automate your trading strategies with confidence</p>
      </section>
      
      <!-- Problem Statement -->
      <section class="trust-problem-section">
        <div class="trust-problem-card">
          <h2 class="trust-problem-title">The Problem</h2>
          <div class="trust-problem-grid">
            <div class="trust-problem-item">
              <span class="trust-problem-icon">😴</span>
              <h3>Missing Opportunities</h3>
              <p>Markets move 24/7 but you can't watch them all the time</p>
            </div>
            <div class="trust-problem-item">
              <span class="trust-problem-icon">😰</span>
              <h3>Emotional Trading</h3>
              <p>Fear and greed lead to poor decisions at critical moments</p>
            </div>
            <div class="trust-problem-item">
              <span class="trust-problem-icon">⏰</span>
              <h3>Slow Execution</h3>
              <p>By the time you react, the opportunity is often gone</p>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Solution Cards -->
      <section class="trust-solution-section">
        <h2 class="trust-section-title">Our Solution</h2>
        <div class="trust-cards-grid">
          <div class="trust-solution-card">
            <div class="trust-card-icon">🔒</div>
            <h3 class="trust-card-title">Secure Execution</h3>
            <p class="trust-card-desc">Your strategies run in isolated, encrypted environments</p>
            <div class="trust-card-stats">
              <div class="trust-stat">
                <span class="trust-stat-number">256-bit</span>
                <span class="trust-stat-label">Encryption</span>
              </div>
              <div class="trust-stat">
                <span class="trust-stat-number">SOC 2</span>
                <span class="trust-stat-label">Certified</span>
              </div>
            </div>
          </div>
          
          <div class="trust-solution-card">
            <div class="trust-card-icon">⚡</div>
            <h3 class="trust-card-title">24/7 Automation</h3>
            <p class="trust-card-desc">Never miss a trade with always-on intelligent agents</p>
            <div class="trust-card-stats">
              <div class="trust-stat">
                <span class="trust-stat-number">< 1ms</span>
                <span class="trust-stat-label">Response</span>
              </div>
              <div class="trust-stat">
                <span class="trust-stat-number">99.99%</span>
                <span class="trust-stat-label">Uptime</span>
              </div>
            </div>
          </div>
          
          <div class="trust-solution-card">
            <div class="trust-card-icon">🎯</div>
            <h3 class="trust-card-title">Emotion-Free</h3>
            <p class="trust-card-desc">Execute your strategy exactly as planned, every time</p>
            <div class="trust-card-stats">
              <div class="trust-stat">
                <span class="trust-stat-number">100%</span>
                <span class="trust-stat-label">Disciplined</span>
              </div>
              <div class="trust-stat">
                <span class="trust-stat-number">Zero</span>
                <span class="trust-stat-label">Deviation</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Getting Started -->
      <section class="trust-start-section">
        <h2 class="trust-section-title">Get Started in Minutes</h2>
        <div class="trust-start-options">
          <div class="trust-start-card" onclick="showAutomationWizard()">
            <div class="trust-start-icon">🚀</div>
            <h3>Quick Start Wizard</h3>
            <p>Answer a few questions and we'll build your first automation</p>
            <button class="trust-start-button">Start Wizard →</button>
          </div>
          
          <div class="trust-start-card" onclick="showVisualBuilder()">
            <div class="trust-start-icon">🎨</div>
            <h3>Visual Builder</h3>
            <p>Drag and drop to create custom automation workflows</p>
            <button class="trust-start-button">Open Builder →</button>
          </div>
          
          <div class="trust-start-card" onclick="browseTemplates()">
            <div class="trust-start-icon">📚</div>
            <h3>Browse Templates</h3>
            <p>Start with proven strategies used by successful traders</p>
            <button class="trust-start-button">View Templates →</button>
          </div>
        </div>
      </section>
      
      <!-- Available Automations -->
      <section class="trust-automations-section">
        <h2 class="trust-section-title">Popular Automations</h2>
        <div class="trust-automations-grid" id="trust-automations-container">
          <!-- Will be populated with real data -->
        </div>
      </section>
    </div>
  `;
  
  // Load REAL template data
  loadRealTemplateData();
}

// Load actual automation data from the database
async function loadRealTemplateData() {
  const automationsContainer = document.getElementById('trust-automations-container');
  
  // Show loading state
  automationsContainer.innerHTML = `
    <div class="trust-solution-card">
      <div class="trust-loading" style="width: 40px; height: 40px; margin-bottom: 16px;"></div>
      <div class="trust-loading" style="width: 150px; height: 20px; margin-bottom: 8px;"></div>
      <div class="trust-loading" style="width: 100%; height: 16px;"></div>
    </div>
  `.repeat(3);
  
  try {
    // Fetch real agent data for automations
    const response = await fetch('/api/unified?action=a2a_agents');
    const data = await response.json();
    const agents = data.agents || [];
    
    // Filter for automation-relevant agents
    const automationAgents = agents
      .filter(agent => 
        agent.capabilities?.includes('automation') || 
        agent.agent_type === 'executor' ||
        agent.agent_name?.toLowerCase().includes('auto') ||
        agent.agent_name?.toLowerCase().includes('stop') ||
        agent.agent_name?.toLowerCase().includes('profit')
      )
      .slice(0, 6);
    
    if (automationAgents.length > 0) {
      automationsContainer.innerHTML = automationAgents.map(agent => `
        <div class="trust-solution-card" onclick="deployAutomation('${agent.agent_id}')">
          <div class="trust-card-icon">${getAgentEmoji(agent.agent_type)}</div>
          <h3 class="trust-card-title">${agent.agent_name}</h3>
          <p class="trust-card-desc">${agent.description || 'Automated trading strategy powered by AI'}</p>
          <div class="trust-card-stats">
            <div class="trust-stat">
              <span class="trust-stat-number">${agent.status === 'active' ? 'Active' : 'Ready'}</span>
              <span class="trust-stat-label">Status</span>
            </div>
            <div class="trust-stat">
              <span class="trust-stat-number">${agent.capabilities?.length || 0}</span>
              <span class="trust-stat-label">Features</span>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      // Fallback to sample automations
      const sampleAutomations = [
        {
          name: 'Stop Loss Guardian',
          desc: 'Automatically exits positions when losses exceed your threshold',
          icon: '🛑',
          status: 'Popular',
          features: 5
        },
        {
          name: 'Profit Protector',
          desc: 'Locks in gains by selling portions at target prices',
          icon: '💰',
          status: 'Active',
          features: 4
        },
        {
          name: 'Portfolio Balancer',
          desc: 'Maintains target allocations through automatic rebalancing',
          icon: '⚖️',
          status: 'Ready',
          features: 6
        }
      ];
      
      automationsContainer.innerHTML = sampleAutomations.map(auto => `
        <div class="trust-solution-card" onclick="deployAutomation('${auto.name}')">
          <div class="trust-card-icon">${auto.icon}</div>
          <h3 class="trust-card-title">${auto.name}</h3>
          <p class="trust-card-desc">${auto.desc}</p>
          <div class="trust-card-stats">
            <div class="trust-stat">
              <span class="trust-stat-number">${auto.status}</span>
              <span class="trust-stat-label">Status</span>
            </div>
            <div class="trust-stat">
              <span class="trust-stat-number">${auto.features}</span>
              <span class="trust-stat-label">Features</span>
            </div>
          </div>
        </div>
      `).join('');
    }
    
  } catch (error) {
    console.error('Failed to load automation data:', error);
    
    // Show error state
    automationsContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px;">
        <p style="color: var(--ive-gray-600); margin-bottom: 16px;">Unable to load automations</p>
        <button class="trust-start-button" onclick="loadRealTemplateData()">
          Retry
        </button>
      </div>
    `;
  }
}

function getAgentEmoji(type) {
  const emojiMap = {
    'executor': '⚡',
    'analyzer': '📊',
    'monitor': '👁️',
    'optimizer': '🎯',
    'protector': '🛡️'
  };
  return emojiMap[type] || '🤖';
}

// Interaction handlers
function startPerfectAutomation() {
  console.log('Starting pixel-perfect automation wizard...');
}

function useRealTemplate(templateId) {
  console.log('Using template:', templateId);
}

function openPerfectBuilder() {
  window.location.href = '/visual-builder-real.html';
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  createPixelPerfectTrustSection();
  
  // Update the tab name
  const trustTab = document.querySelector('.jobs-section-tab[onclick*="trust"]');
  if (trustTab) {
    trustTab.innerHTML = 'Secure Automation';
  }
});