// Jony Ive-inspired header interactions
// "It's not just what it looks like and feels like. Design is how it works."

class HeaderController {
    constructor() {
        this.header = null;
        this.lastScrollPosition = 0;
        this.isScrolling = false;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupHeader();
            this.setupScrollBehavior();
            this.setupThemeToggle();
            this.setupSystemStatus();
        });
    }

    setupHeader() {
        // Transform existing navbar into refined header
        const navbar = document.querySelector('.bp3-navbar');
        if (!navbar) return;

        // Add refined header class
        navbar.classList.add('app-header');
        
        // Wrap content in header-content
        const content = document.createElement('div');
        content.className = 'header-content';
        
        // Move all navbar content into wrapper
        while (navbar.firstChild) {
            content.appendChild(navbar.firstChild);
        }
        navbar.appendChild(content);

        // Refine logo
        const heading = navbar.querySelector('.bp3-navbar-heading');
        if (heading) {
            heading.classList.add('header-logo');
        }

        // Refine status indicator
        const statusIndicator = navbar.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.classList.add('system-status');
            const dot = statusIndicator.querySelector('.status-dot');
            if (dot) {
                dot.classList.add('status-indicator-dot');
            }
        }

        // Refine function count
        const functionCount = navbar.querySelector('#function-count');
        if (functionCount) {
            functionCount.classList.add('function-count');
        }

        // Refine buttons
        const buttons = navbar.querySelectorAll('.bp3-button');
        buttons.forEach(button => {
            button.classList.add('header-icon-button');
            button.classList.remove('bp3-button', 'bp3-minimal');
            
            if (button.id === 'theme-toggle') {
                button.classList.add('theme-toggle');
            } else if (button.querySelector('.bp3-icon-user')) {
                button.classList.add('user-button');
            }
        });

        // Refine dividers
        const dividers = navbar.querySelectorAll('.bp3-navbar-divider');
        dividers.forEach(divider => {
            divider.classList.add('header-divider');
        });

        // Group actions
        const rightGroup = navbar.querySelector('.bp3-align-right');
        if (rightGroup) {
            rightGroup.classList.add('header-actions');
        }

        this.header = navbar;
    }

    setupScrollBehavior() {
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            if (!this.header) return;

            // Add scrolled class when not at top
            if (window.scrollY > 10) {
                this.header.classList.add('scrolled');
            } else {
                this.header.classList.remove('scrolled');
            }

            // Hide/show header on scroll
            const currentScrollPosition = window.scrollY;
            
            if (currentScrollPosition > this.lastScrollPosition && currentScrollPosition > 100) {
                // Scrolling down
                this.header.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up
                this.header.style.transform = 'translateY(0)';
            }
            
            this.lastScrollPosition = currentScrollPosition;

            // Clear timeout
            clearTimeout(scrollTimeout);
            
            // Set scrolling state
            if (!this.isScrolling) {
                this.header.classList.add('scrolling');
                this.isScrolling = true;
            }
            
            // Reset scrolling state after scroll ends
            scrollTimeout = setTimeout(() => {
                this.header.classList.remove('scrolling');
                this.isScrolling = false;
            }, 150);
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        // Smooth theme transition
        themeToggle.addEventListener('click', () => {
            document.body.style.transition = 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
            
            setTimeout(() => {
                document.body.style.transition = '';
            }, 300);
        });
    }

    setupSystemStatus() {
        // Add subtle loading indicator during API calls
        const originalFetch = window.fetch;
        let activeRequests = 0;

        window.fetch = function(...args) {
            activeRequests++;
            
            // Add loading indicator
            const header = document.querySelector('.app-header');
            if (header) {
                let loading = header.querySelector('.header-loading');
                if (!loading) {
                    loading = document.createElement('div');
                    loading.className = 'header-loading';
                    header.appendChild(loading);
                }
                loading.classList.add('active');
            }

            return originalFetch.apply(this, args).finally(() => {
                activeRequests--;
                if (activeRequests === 0) {
                    // Remove loading indicator
                    setTimeout(() => {
                        const loading = document.querySelector('.header-loading');
                        if (loading) {
                            loading.classList.remove('active');
                        }
                    }, 200);
                }
            });
        };
    }
}

// Initialize header controller
new HeaderController();