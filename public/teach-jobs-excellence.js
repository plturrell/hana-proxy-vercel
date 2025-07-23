/* Jobs/Ive Excellence JavaScript - Magical Interactions */

// Initialize excellence features
document.addEventListener('DOMContentLoaded', function() {
  // Add ripple effect to buttons
  initializeRippleEffect();
  
  // Add smooth tab sliding indicator
  initializeTabIndicator();
  
  // Add progress bar animations
  initializeProgressAnimations();
  
  // Add card hover effects
  initializeCardEffects();
  
  // Add subtle parallax scrolling
  initializeParallaxEffects();
  
  // Add loading state management
  initializeLoadingStates();
  
  // Add success/error notifications
  initializeNotifications();
  
  // Enhanced tooltips
  initializeTooltips();
});

// Ripple effect for buttons (Material Design inspired but more subtle)
function initializeRippleEffect() {
  document.querySelectorAll('.excellence-button, .excellence-button-primary').forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');
      
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// Smooth tab indicator
function initializeTabIndicator() {
  const tabContainer = document.querySelector('.excellence-tabs');
  if (!tabContainer) return;
  
  const indicator = document.createElement('div');
  indicator.className = 'excellence-tab-indicator';
  tabContainer.appendChild(indicator);
  
  const tabs = tabContainer.querySelectorAll('.excellence-tab');
  const activeTab = tabContainer.querySelector('.excellence-tab.active');
  
  if (activeTab) {
    moveIndicator(activeTab, indicator);
  }
  
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      moveIndicator(this, indicator);
    });
  });
}

function moveIndicator(tab, indicator) {
  const tabRect = tab.getBoundingClientRect();
  const containerRect = tab.parentElement.getBoundingClientRect();
  
  indicator.style.width = tabRect.width + 'px';
  indicator.style.left = (tabRect.left - containerRect.left) + 'px';
  indicator.style.opacity = '1';
}

// Progress bar animations
function initializeProgressAnimations() {
  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -10% 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const progress = entry.target;
        const targetWidth = progress.getAttribute('data-progress') || '0';
        const fill = progress.querySelector('.excellence-progress-fill');
        
        if (fill) {
          setTimeout(() => {
            fill.style.width = targetWidth + '%';
          }, 200);
        }
        
        observer.unobserve(progress);
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.excellence-progress').forEach(progress => {
    observer.observe(progress);
  });
}

// Card hover effects with subtle 3D transform
function initializeCardEffects() {
  document.querySelectorAll('.excellence-card').forEach(card => {
    card.addEventListener('mousemove', function(e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      
      card.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateZ(10px)
      `;
    });
    
    card.addEventListener('mouseleave', function() {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    });
  });
}

// Subtle parallax scrolling
function initializeParallaxEffects() {
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    
    parallaxElements.forEach(element => {
      const speed = element.getAttribute('data-parallax') || 0.5;
      const yPos = -(scrolled * speed);
      
      element.style.transform = `translateY(${yPos}px)`;
    });
  });
}

// Loading state management
function initializeLoadingStates() {
  // Show sync indicator during data operations
  window.showSyncIndicator = function() {
    const indicator = document.getElementById('sync-indicator');
    if (indicator) {
      indicator.style.display = 'inline-block';
      
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 2000);
    }
  };
  
  // Hook into existing AJAX calls
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    window.showSyncIndicator();
    return originalFetch.apply(this, args);
  };
}

// Success/Error notifications
function initializeNotifications() {
  window.showNotification = function(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `excellence-${type}`;
    notification.innerHTML = `
      <span class="excellence-notification-icon">${type === 'success' ? '✓' : '⚠'}</span>
      <span>${message}</span>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      animation: excellence-slide-in 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'excellence-slide-out 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };
}

// Enhanced tooltips with smooth fade
function initializeTooltips() {
  let tooltipTimeout;
  
  document.querySelectorAll('[data-tooltip]').forEach(element => {
    element.addEventListener('mouseenter', function() {
      clearTimeout(tooltipTimeout);
      
      const tooltip = document.createElement('div');
      tooltip.className = 'excellence-tooltip';
      tooltip.textContent = this.getAttribute('data-tooltip');
      
      const rect = this.getBoundingClientRect();
      tooltip.style.cssText = `
        position: fixed;
        bottom: ${window.innerHeight - rect.top + 8}px;
        left: ${rect.left + rect.width / 2}px;
        transform: translateX(-50%);
        padding: 8px 12px;
        background: var(--excellence-gray-900);
        color: var(--excellence-white);
        font-size: 11px;
        border-radius: 6px;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        z-index: 9999;
      `;
      
      document.body.appendChild(tooltip);
      
      tooltipTimeout = setTimeout(() => {
        tooltip.style.opacity = '1';
      }, 500);
      
      this._tooltip = tooltip;
    });
    
    element.addEventListener('mouseleave', function() {
      clearTimeout(tooltipTimeout);
      
      if (this._tooltip) {
        this._tooltip.style.opacity = '0';
        const tooltipToRemove = this._tooltip;
        setTimeout(() => {
          if (tooltipToRemove && tooltipToRemove.parentNode) {
            tooltipToRemove.remove();
          }
        }, 200);
        delete this._tooltip;
      }
    });
  });
}

// Add smooth number animations
window.animateValue = function(element, start, end, duration = 1000) {
  const startTime = performance.now();
  const isPercentage = element.textContent.includes('%');
  
  function updateValue(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = start + (end - start) * easeProgress;
    
    element.textContent = Math.round(currentValue) + (isPercentage ? '%' : '');
    
    if (progress < 1) {
      requestAnimationFrame(updateValue);
    }
  }
  
  requestAnimationFrame(updateValue);
};