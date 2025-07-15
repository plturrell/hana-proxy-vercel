// Shared hamburger navigation component
function createHamburgerNav() {
  return `
    <!-- Navigation with Hamburger -->
    <nav class="jobs-nav">
      <div style="display: flex; align-items: center; gap: var(--jobs-spacing-md);">
        <button class="jobs-hamburger" onclick="toggleSidebar()" id="hamburger-btn">
          <div class="jobs-hamburger-line"></div>
          <div class="jobs-hamburger-line"></div>
          <div class="jobs-hamburger-line"></div>
        </button>
        <div class="jobs-nav-title">FinSight Intelligence</div>
      </div>
      <div class="jobs-nav-actions">
        <span style="font-size: 13px; color: var(--jobs-gray);">Good morning, Sarah</span>
        <button class="jobs-nav-button" onclick="toggleDarkMode()">◐</button>
        <button class="jobs-nav-button" onclick="showSpotlight()">⌘K</button>
      </div>
    </nav>
    
    <!-- Sidebar Overlay -->
    <div class="jobs-sidebar-overlay" id="sidebar-overlay" onclick="closeSidebar()"></div>
    
    <!-- Sidebar -->
    <div class="jobs-sidebar" id="sidebar">
      <div class="jobs-sidebar-section">
        <div class="jobs-sidebar-title">Dashboard</div>
        <a href="/index.html" class="jobs-sidebar-item" data-page="today">
          <div class="jobs-sidebar-icon">◉</div>
          <span>Today</span>
        </a>
        <a href="/analyze-jobs.html" class="jobs-sidebar-item" data-page="analyze">
          <div class="jobs-sidebar-icon">◎</div>
          <span>Analyze</span>
        </a>
      </div>
      
      <div class="jobs-sidebar-section">
        <div class="jobs-sidebar-title">AI & Models</div>
        <a href="/model-jobs.html" class="jobs-sidebar-item" data-page="model">
          <div class="jobs-sidebar-icon">◆</div>
          <span>Machine Learning</span>
        </a>
        <a href="/teach-jobs.html" class="jobs-sidebar-item" data-page="teach">
          <div class="jobs-sidebar-icon">◇</div>
          <span>Adaptive Learning</span>
        </a>
        <a href="/ai-jobs.html" class="jobs-sidebar-item" data-page="ai">
          <div class="jobs-sidebar-icon">◈</div>
          <span>AI Assistant</span>
        </a>
      </div>
      
      <div class="jobs-sidebar-section" id="tech-section" style="display: none;">
        <div class="jobs-sidebar-title">System</div>
        <a href="/control-jobs.html" class="jobs-sidebar-item" data-page="control">
          <div class="jobs-sidebar-icon">◈</div>
          <span>Control Centre</span>
        </a>
      </div>
      
      <div class="jobs-sidebar-section">
        <div class="jobs-sidebar-title">Quick Access</div>
        <div class="jobs-sidebar-item" onclick="navigate('analyze', 'portfolio')">
          <div class="jobs-sidebar-icon">📊</div>
          <span>Portfolio</span>
        </div>
        <div class="jobs-sidebar-item" onclick="navigate('analyze', 'treasury')">
          <div class="jobs-sidebar-icon">💰</div>
          <span>Treasury</span>
        </div>
        <div class="jobs-sidebar-item" onclick="navigate('analyze', 'risk')">
          <div class="jobs-sidebar-icon">⚠️</div>
          <span>Risk Analysis</span>
        </div>
        <div class="jobs-sidebar-item" onclick="navigate('analyze', 'scenarios')">
          <div class="jobs-sidebar-icon">🎯</div>
          <span>Scenarios</span>
        </div>
      </div>
    </div>
  `;
}

// Shared hamburger CSS
function getHamburgerCSS() {
  return `
    /* Navigation with Hamburger */
    .jobs-nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 48px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--jobs-spacing-lg);
    }
    
    .jobs-hamburger {
      background: none;
      border: none;
      padding: var(--jobs-spacing-xs);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 3px;
      transition: all var(--jobs-duration) var(--jobs-animation);
    }
    
    .jobs-hamburger-line {
      width: 18px;
      height: 2px;
      background: var(--jobs-black);
      transition: all var(--jobs-duration) var(--jobs-animation);
    }
    
    body.dark-mode .jobs-hamburger-line {
      background: var(--jobs-white);
    }
    
    .jobs-hamburger.active .jobs-hamburger-line:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }
    
    .jobs-hamburger.active .jobs-hamburger-line:nth-child(2) {
      opacity: 0;
    }
    
    .jobs-hamburger.active .jobs-hamburger-line:nth-child(3) {
      transform: rotate(-45deg) translate(5px, -5px);
    }
    
    /* Side Menu */
    .jobs-sidebar {
      position: fixed;
      top: 48px;
      left: -280px;
      width: 280px;
      height: calc(100vh - 48px);
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-right: 1px solid rgba(0, 0, 0, 0.1);
      z-index: 999;
      transition: left var(--jobs-duration) var(--jobs-animation);
      overflow-y: auto;
      padding: var(--jobs-spacing-lg);
    }
    
    .jobs-sidebar.open {
      left: 0;
    }
    
    body.dark-mode .jobs-sidebar {
      background: rgba(28, 28, 30, 0.95);
      border-right-color: #38383A;
    }
    
    .jobs-sidebar-section {
      margin-bottom: var(--jobs-spacing-xl);
    }
    
    .jobs-sidebar-title {
      font-size: var(--jobs-font-size-caption);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--jobs-gray);
      margin-bottom: var(--jobs-spacing-md);
    }
    
    .jobs-sidebar-item {
      display: flex;
      align-items: center;
      gap: var(--jobs-spacing-sm);
      padding: var(--jobs-spacing-sm) var(--jobs-spacing-md);
      border-radius: 8px;
      cursor: pointer;
      transition: all var(--jobs-duration) var(--jobs-animation);
      margin-bottom: var(--jobs-spacing-xs);
      text-decoration: none;
      color: var(--jobs-black);
    }
    
    body.dark-mode .jobs-sidebar-item {
      color: var(--jobs-white);
    }
    
    .jobs-sidebar-item:hover {
      background: rgba(0, 122, 255, 0.1);
    }
    
    .jobs-sidebar-item.active {
      background: var(--jobs-blue);
      color: var(--jobs-white);
    }
    
    .jobs-sidebar-icon {
      font-size: 16px;
    }
    
    .jobs-sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      opacity: 0;
      visibility: hidden;
      transition: all var(--jobs-duration) var(--jobs-animation);
      z-index: 998;
    }
    
    .jobs-sidebar-overlay.open {
      opacity: 1;
      visibility: visible;
    }
    
    body.dark-mode .jobs-nav {
      background: rgba(0, 0, 0, 0.8);
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }
    
    .jobs-nav-title {
      font-size: var(--jobs-font-size-body);
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    
    .jobs-nav-actions {
      display: flex;
      gap: var(--jobs-spacing-md);
      align-items: center;
    }
    
    .jobs-nav-button {
      background: none;
      border: none;
      padding: var(--jobs-spacing-xs) var(--jobs-spacing-sm);
      font-size: var(--jobs-font-size-caption);
      color: var(--jobs-blue);
      cursor: pointer;
      border-radius: 6px;
      transition: all var(--jobs-duration) var(--jobs-animation);
    }
    
    .jobs-nav-button:hover {
      background: rgba(0, 122, 255, 0.1);
    }
  `;
}

// Shared hamburger functionality
function initHamburgerNav() {
  // Check user role
  const userRole = localStorage.getItem('userRole') || 'Finance';
  if (userRole === 'Technology') {
    document.getElementById('tech-section').style.display = 'block';
  }
  
  // Set active page
  const currentPage = getCurrentPage();
  document.querySelectorAll('.jobs-sidebar-item[data-page]').forEach(item => {
    if (item.dataset.page === currentPage) {
      item.classList.add('active');
    }
  });
  
  // Load saved preferences
  if (localStorage.getItem('darkMode') === 'false') {
    document.body.classList.remove('dark-mode');
  }
}

// Sidebar functionality
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('hamburger-btn');
  
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
  hamburger.classList.toggle('active');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('hamburger-btn');
  
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
  hamburger.classList.remove('active');
}

// Navigation
function navigate(screen, section) {
  if (screen === 'analyze') {
    window.location.href = `/analyze-jobs.html${section ? '#' + section : ''}`;
  }
}

// Get current page for active state
function getCurrentPage() {
  const path = window.location.pathname;
  if (path.includes('analyze')) return 'analyze';
  if (path.includes('model')) return 'model';
  if (path.includes('teach')) return 'teach';
  if (path.includes('ai')) return 'ai';
  if (path.includes('control')) return 'control';
  return 'today';
}

// Dark mode toggle
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Spotlight search
function showSpotlight() {
  const query = prompt('Search FinSight...');
  if (query) {
    console.log('Searching for:', query);
  }
}

// Close sidebar when clicking on a link
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.jobs-sidebar-item').forEach(item => {
    item.addEventListener('click', closeSidebar);
  });
});