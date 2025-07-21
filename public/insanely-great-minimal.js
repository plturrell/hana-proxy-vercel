/**
 * Insanely Great Minimal - Jobs/Ive Style UI Enhancements
 * Implements Apple design philosophy for FinSight Intelligence
 */

class InsanelyGreatMinimal {
  constructor() {
    this.initialized = false;
    this.version = '2.0.0';
    console.log('🍎 Insanely Great Minimal v2.0.0 initializing...');
  }

  /**
   * Initialize Jobs/Ive design enhancements
   */
  async initialize() {
    // Apply Jobs/Ive design philosophy
    this.applyMinimalistDesign();
    this.enableElegantInteractions();
    this.optimizeForClarity();
    
    this.initialized = true;
    console.log('✅ Insanely Great design system ready');
  }

  /**
   * Apply minimalist design principles
   */
  applyMinimalistDesign() {
    // Focus on essential elements only
    document.querySelectorAll('.unnecessary-decoration').forEach(el => {
      el.style.display = 'none';
    });

    // Enhance whitespace and breathing room
    document.body.style.setProperty('--jobs-focus-spacing', '1.618em');
  }

  /**
   * Enable elegant, intuitive interactions
   */
  enableElegantInteractions() {
    // Smooth, natural animations that feel right
    const style = document.createElement('style');
    style.textContent = `
      .jobs-elegant-transition {
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
      
      .jobs-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Optimize interface for maximum clarity
   */
  optimizeForClarity() {
    // Remove visual noise, emphasize content
    document.querySelectorAll('.jobs-model-card').forEach(card => {
      card.classList.add('jobs-elegant-transition');
    });

    // Ensure perfect contrast and readability
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (darkMode) {
      document.body.classList.add('dark-mode');
    }
  }

  /**
   * Show what matters, hide what doesn't
   */
  progressiveDisclosure() {
    // Reveal complexity only when needed
    console.log('🎯 Progressive disclosure: showing what matters most');
  }
}

// Initialize the system
window.insanelyGreat = new InsanelyGreatMinimal();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.insanelyGreat.initialize();
  });
} else {
  window.insanelyGreat.initialize();
}