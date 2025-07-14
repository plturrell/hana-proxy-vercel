// Universal Jony Ive-inspired header injector
// Works with any page structure

class UniversalHeaderController {
    constructor() {
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.injectHeader());
        } else {
            this.injectHeader();
        }
    }

    injectHeader() {
        // Check if header already exists
        if (document.querySelector('.jony-ive-header')) return;

        // Create the header HTML
        const headerHTML = `
            <nav class="jony-ive-header">
                <div class="header-container">
                    <div class="header-left">
                        <a href="/" class="header-logo">
                            <span class="logo-icon">⟡</span>
                            <span class="logo-text">FinSight Intelligence</span>
                        </a>
                    </div>
                    
                    <div class="header-center">
                        <div class="status-indicator">
                            <span class="status-dot"></span>
                            <span class="status-text">All Systems Operational</span>
                        </div>
                    </div>
                    
                    <div class="header-right">
                        <button class="header-icon-btn" id="theme-toggle" aria-label="Toggle theme">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M8 1v2m0 10v2m7-7h-2M3 8H1m11.3-4.3l-1.4 1.4M5.1 10.9l-1.4 1.4m8.6 0l-1.4-1.4M5.1 5.1L3.7 3.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                        </button>
                        <button class="header-icon-btn" id="user-menu" aria-label="User menu">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M2.5 14c0-2.5 2.5-4.5 5.5-4.5s5.5 2 5.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>
        `;

        // Insert at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', headerHTML);

        // Add the loading indicator div
        document.body.insertAdjacentHTML('afterbegin', '<div class="header-loading"></div>');

        // Adjust page content to account for fixed header
        this.adjustPageContent();
        
        // Setup interactions
        this.setupScrollBehavior();
        this.setupThemeToggle();
        this.setupStatusIndicator();
    }

    adjustPageContent() {
        // Find the main content container
        const containers = [
            '.container',
            '.bp3-app',
            '.main-content',
            'main',
            // Add any other common container selectors
        ];

        for (const selector of containers) {
            const container = document.querySelector(selector);
            if (container) {
                // Add padding-top to account for fixed header
                const currentPaddingTop = parseInt(window.getComputedStyle(container).paddingTop) || 0;
                container.style.paddingTop = `${currentPaddingTop + 48}px`;
                break;
            }
        }

        // Also adjust body if no container found
        if (!containers.some(sel => document.querySelector(sel))) {
            document.body.style.paddingTop = '48px';
        }
    }

    setupScrollBehavior() {
        const header = document.querySelector('.jony-ive-header');
        let lastScrollPosition = 0;
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            if (!header) return;

            // Add scrolled class when not at top
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Hide/show header on scroll
            const currentScrollPosition = window.scrollY;
            
            if (currentScrollPosition > lastScrollPosition && currentScrollPosition > 100) {
                // Scrolling down
                header.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up
                header.style.transform = 'translateY(0)';
            }
            
            lastScrollPosition = currentScrollPosition;

            // Add scrolling class
            clearTimeout(scrollTimeout);
            header.classList.add('scrolling');
            
            scrollTimeout = setTimeout(() => {
                header.classList.remove('scrolling');
            }, 150);
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            // Smooth transition
            document.body.style.transition = 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
            setTimeout(() => {
                document.body.style.transition = '';
            }, 300);
        });

        // Load saved theme
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }

    setupStatusIndicator() {
        // Intercept fetch to show loading state
        const originalFetch = window.fetch;
        let activeRequests = 0;

        window.fetch = function(...args) {
            activeRequests++;
            
            const loading = document.querySelector('.header-loading');
            if (loading) {
                loading.classList.add('active');
            }

            // Update status text during requests
            const statusText = document.querySelector('.status-text');
            if (statusText && activeRequests === 1) {
                statusText.textContent = 'Syncing...';
            }

            return originalFetch.apply(this, args).finally(() => {
                activeRequests--;
                if (activeRequests === 0) {
                    setTimeout(() => {
                        const loading = document.querySelector('.header-loading');
                        if (loading) {
                            loading.classList.remove('active');
                        }
                        
                        const statusText = document.querySelector('.status-text');
                        if (statusText) {
                            statusText.textContent = 'All Systems Operational';
                        }
                    }, 200);
                }
            });
        };
    }
}

// Initialize universal header
new UniversalHeaderController();