// Enhanced Header with User Preferences & Role Management
(function() {
    'use strict';
    
    // User preferences storage
    const UserPreferences = {
        // Get current user from session or default
        getCurrentUser: function() {
            return JSON.parse(localStorage.getItem('finsight_user') || '{"role": "Finance", "theme": "dark", "id": null}');
        },
        
        // Save user preferences
        saveUser: function(user) {
            localStorage.setItem('finsight_user', JSON.stringify(user));
            // Also save to Supabase if authenticated
            if (user.id) {
                this.saveToSupabase(user);
            }
        },
        
        // Save preferences to Supabase
        saveToSupabase: async function(user) {
            try {
                const response = await fetch('/api/supabase-proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'save_preferences',
                        user_id: user.id,
                        preferences: {
                            theme: user.theme,
                            role: user.role,
                            settings: user.settings || {}
                        }
                    })
                });
                const data = await response.json();
                if (!data.success) {
                    console.warn('Failed to save preferences to Supabase:', data.error);
                }
            } catch (error) {
                console.error('Error saving preferences:', error);
            }
        },
        
        // Load preferences from Supabase
        loadFromSupabase: async function(userId) {
            try {
                const response = await fetch('/api/supabase-proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'load_preferences',
                        user_id: userId
                    })
                });
                const data = await response.json();
                if (data.success && data.preferences) {
                    const user = {
                        id: userId,
                        ...data.preferences
                    };
                    this.saveUser(user);
                    return user;
                }
            } catch (error) {
                console.error('Error loading preferences:', error);
            }
            return null;
        }
    };
    
    // Menu visibility based on role
    const MenuVisibility = {
        Finance: {
            // Finance users see analytics, treasury, financial tools, calculations and ML models
            analytics: ['portfolio-analyser', 'treasury-insights', 'scenario-analyser-config'],
            knowledge: ['news-market-data-config', 'calculation-manager-config', 'ml-models-config', 'treasury-insights-config'],
            tools: ['calculation-tester', 'calculations-config', 'scenario-analysis'],
            system: [] // No system access for Finance
        },
        Technology: {
            // Technology users see everything including system management
            analytics: ['portfolio-analyser', 'treasury-insights', 'scenario-analyser-config'],
            knowledge: ['news-market-data-config', 'calculation-manager-config', 'ml-models-config', 'treasury-insights-config'],
            tools: ['calculation-tester', 'calculations-config', 'news-market-config', 'scenario-analysis'],
            system: ['command-centre', 'deployment', 'system-config']
        }
    };
    
    // Apply role-based menu visibility
    function applyRoleVisibility() {
        const user = UserPreferences.getCurrentUser();
        const role = user.role || 'Finance';
        const visibility = MenuVisibility[role] || MenuVisibility.Finance;
        
        // Hide/show menu sections based on role
        document.querySelectorAll('.bp3-menu-header').forEach(header => {
            const section = header.querySelector('.bp3-heading').textContent.toLowerCase();
            let nextElement = header.parentElement.nextElementSibling;
            let hasVisibleItems = false;
            
            // Check items in this section
            while (nextElement && !nextElement.classList.contains('bp3-menu-header') && !nextElement.classList.contains('bp3-menu-divider')) {
                if (nextElement.classList.contains('bp3-menu-item')) {
                    const href = nextElement.getAttribute('href');
                    const page = href ? href.replace('/', '').replace('.html', '') : '';
                    const sectionItems = visibility[section] || [];
                    
                    if (sectionItems.some(item => href && href.includes(item))) {
                        nextElement.style.display = 'flex';
                        hasVisibleItems = true;
                    } else {
                        nextElement.style.display = 'none';
                    }
                }
                nextElement = nextElement.nextElementSibling;
            }
            
            // Hide section header and divider if no visible items
            if (!hasVisibleItems) {
                header.parentElement.style.display = 'none';
                if (header.parentElement.previousElementSibling?.classList.contains('bp3-menu-divider')) {
                    header.parentElement.previousElementSibling.style.display = 'none';
                }
            } else {
                header.parentElement.style.display = 'block';
                if (header.parentElement.previousElementSibling?.classList.contains('bp3-menu-divider')) {
                    header.parentElement.previousElementSibling.style.display = 'block';
                }
            }
        });
        
        // Show/hide technology-only elements
        const isTechnology = user.role === 'Technology';
        document.querySelectorAll('.technology-only').forEach(el => {
            el.style.display = isTechnology ? (el.tagName === 'LI' ? 'list-item' : 'block') : 'none';
        });
        
        // Also handle legacy admin-only elements
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = isTechnology ? (el.tagName === 'LI' ? 'list-item' : 'block') : 'none';
        });
        
        // Update user badge and role label
        updateUserBadge(user);
        updateRoleLabel(user);
    }
    
    // Update user badge in header
    function updateUserBadge(user) {
        // Add role badge to navbar if not exists
        const navbar = document.querySelector('.bp3-navbar-group.bp3-align-right');
        if (navbar && !document.querySelector('.user-role-badge')) {
            const statusIndicator = navbar.querySelector('.status-indicator');
            if (statusIndicator) {
                const badge = document.createElement('span');
                badge.className = `user-role-badge ${user.role.toLowerCase()}`;
                badge.textContent = user.role;
                statusIndicator.parentNode.insertBefore(badge, statusIndicator.nextSibling);
            }
        }
    }
    
    // Update role label in header
    function updateRoleLabel(user) {
        const roleLabel = document.getElementById('user-role-label');
        if (roleLabel) {
            roleLabel.textContent = (user.role || 'Finance') + ' User';
        }
    }
    
    // Enhanced theme toggle with persistence
    window.toggleTheme = function() {
        const body = document.body;
        const button = document.getElementById('theme-toggle');
        const user = UserPreferences.getCurrentUser();
        
        if (body.classList.contains('bp3-dark')) {
            body.classList.remove('bp3-dark');
            const text = button.querySelector('span:not(.bp3-icon)');
            if (text) text.textContent = 'Light Mode';
            user.theme = 'light';
        } else {
            body.classList.add('bp3-dark');
            const text = button.querySelector('span:not(.bp3-icon)');
            if (text) text.textContent = 'Dark Mode';
            user.theme = 'dark';
        }
        
        UserPreferences.saveUser(user);
    };
    
    // User menu functionality
    window.showUserMenu = function(event) {
        event.stopPropagation();
        const user = UserPreferences.getCurrentUser();
        
        // Create popover menu
        const menu = document.createElement('div');
        menu.className = 'bp3-menu bp3-elevation-1';
        menu.style.cssText = `
            position: absolute;
            top: 48px;
            right: 24px;
            background: white;
            border-radius: 3px;
            min-width: 200px;
            z-index: 1001;
        `;
        
        if (document.body.classList.contains('bp3-dark')) {
            menu.style.background = '#30404d';
        }
        
        menu.innerHTML = `
            <li class="bp3-menu-header">
                <h6 class="bp3-heading">User Settings</h6>
            </li>
            <li class="bp3-menu-item" onclick="switchRole('Finance')">
                
                <span class="bp3-text-overflow-ellipsis bp3-fill">Finance User</span>
                ${user.role === 'Finance' ? '' : ''}
            </li>
            <li class="bp3-menu-item" onclick="switchRole('Technology')">
                
                <span class="bp3-text-overflow-ellipsis bp3-fill">Technology User</span>
                ${user.role === 'Technology' ? '' : ''}
            </li>
            <li class="bp3-menu-divider"></li>
            <li class="bp3-menu-item" onclick="showPreferences()">
                
                <span class="bp3-text-overflow-ellipsis bp3-fill">Preferences</span>
            </li>
            <li class="bp3-menu-item" onclick="signOut()">
                
                <span class="bp3-text-overflow-ellipsis bp3-fill">Sign Out</span>
            </li>
        `;
        
        document.body.appendChild(menu);
        
        // Close menu on click outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 0);
    };
    
    // Switch user role
    window.switchRole = function(role) {
        const user = UserPreferences.getCurrentUser();
        user.role = role;
        UserPreferences.saveUser(user);
        
        // Reload to apply new role permissions
        location.reload();
    };
    
    // Show preferences dialog
    window.showPreferences = function() {
        alert('Preferences dialog coming soon!');
    };
    
    // Sign out
    window.signOut = function() {
        localStorage.removeItem('finsight_user');
        location.href = '/';
    };
    
    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        // Load user preferences
        const user = UserPreferences.getCurrentUser();
        
        // Set default role to Finance if not set
        if (!user.role) {
            user.role = 'Finance';
            UserPreferences.saveUser(user);
        }
        
        // Apply theme
        if (user.theme === 'light') {
            document.body.classList.remove('bp3-dark');
            const themeButton = document.getElementById('theme-toggle');
            if (themeButton) {
                const icon = themeButton.querySelector('.bp3-icon');
                const text = themeButton.querySelector('span:not(.bp3-icon)');
                if (text) text.textContent = 'Light Mode';
            }
        }
        
        // Apply role visibility
        applyRoleVisibility();
        
        // Add role badge to header
        updateUserBadge(user);
        
        // Update role label in header
        updateRoleLabel(user);
        
        // Add click handler to user button
        const userButtons = document.querySelectorAll('button[onclick*="showUserMenu"]');
        userButtons.forEach(btn => {
            btn.setAttribute('aria-label', `User menu (${user.role})`);
        });
        
        // Scroll effects
        let lastScroll = 0;
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            const header = document.querySelector('.bp3-navbar');
            
            if (header) {
                if (currentScroll > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }
            
            lastScroll = currentScroll;
        });
    });
})();