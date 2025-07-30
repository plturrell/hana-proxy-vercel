// Enterprise Authentication Module
class Auth {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.refreshToken = localStorage.getItem('refresh_token');
        this.user = null;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.refreshInterval = null;
        
        this.init();
    }

    async init() {
        if (this.token) {
            await this.validateToken();
            this.startTokenRefresh();
            this.setupActivityMonitoring();
        }
    }

    async login(credentials) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                throw new Error('Invalid credentials');
            }

            const data = await response.json();
            
            this.token = data.token;
            this.refreshToken = data.refreshToken;
            this.user = data.user;
            
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('refresh_token', this.refreshToken);
            localStorage.setItem('user', JSON.stringify(this.user));
            
            this.startTokenRefresh();
            this.setupActivityMonitoring();
            
            return { success: true, user: this.user };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        this.clearSession();
        window.location.href = '/login.html';
    }

    async validateToken() {
        try {
            const response = await fetch('/api/auth/validate', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Invalid token');
            }

            const data = await response.json();
            this.user = data.user;
            localStorage.setItem('user', JSON.stringify(this.user));
            
            return true;
            
        } catch (error) {
            this.clearSession();
            return false;
        }
    }

    async refreshTokens() {
        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            
            this.token = data.token;
            localStorage.setItem('auth_token', this.token);
            
            return true;
            
        } catch (error) {
            this.clearSession();
            return false;
        }
    }

    startTokenRefresh() {
        // Refresh token every 15 minutes
        this.refreshInterval = setInterval(() => {
            this.refreshTokens();
        }, 15 * 60 * 1000);
    }

    setupActivityMonitoring() {
        let lastActivity = Date.now();
        
        const updateActivity = () => {
            lastActivity = Date.now();
        };
        
        // Monitor user activity
        document.addEventListener('click', updateActivity);
        document.addEventListener('keypress', updateActivity);
        document.addEventListener('scroll', updateActivity);
        
        // Check for inactivity every minute
        setInterval(() => {
            if (Date.now() - lastActivity > this.sessionTimeout) {
                this.logout();
            }
        }, 60 * 1000);
    }

    clearSession() {
        this.token = null;
        this.refreshToken = null;
        this.user = null;
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        return this.user || JSON.parse(localStorage.getItem('user') || 'null');
    }

    hasPermission(permission) {
        const user = this.getUser();
        return user && user.permissions && user.permissions.includes(permission);
    }

    async updateProfile(data) {
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const updatedUser = await response.json();
            this.user = updatedUser;
            localStorage.setItem('user', JSON.stringify(this.user));
            
            return { success: true, user: this.user };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async changePassword(oldPassword, newPassword) {
        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            if (!response.ok) {
                throw new Error('Failed to change password');
            }

            return { success: true };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async enable2FA() {
        try {
            const response = await fetch('/api/auth/2fa/enable', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to enable 2FA');
            }

            const data = await response.json();
            return { success: true, qrCode: data.qrCode, secret: data.secret };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async verify2FA(code) {
        try {
            const response = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ code })
            });

            if (!response.ok) {
                throw new Error('Invalid 2FA code');
            }

            return { success: true };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // SSO Integration
    async loginWithSSO(provider) {
        window.location.href = `/api/auth/sso/${provider}`;
    }

    // Session Management
    async getSessions() {
        try {
            const response = await fetch('/api/auth/sessions', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get sessions');
            }

            return await response.json();
            
        } catch (error) {
            return [];
        }
    }

    async revokeSession(sessionId) {
        try {
            const response = await fetch(`/api/auth/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            return response.ok;
            
        } catch (error) {
            return false;
        }
    }
}

// Initialize auth globally
window.auth = new Auth();

// Protect routes
function requireAuth() {
    if (!window.auth.isAuthenticated()) {
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
        return false;
    }
    return true;
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', () => {
    const publicPages = ['/login.html', '/register.html', '/forgot-password.html'];
    const currentPage = window.location.pathname;
    
    if (!publicPages.includes(currentPage) && !requireAuth()) {
        return;
    }
    
    // Update UI with user info
    const user = window.auth.getUser();
    if (user) {
        const userElements = document.querySelectorAll('[data-user-name]');
        userElements.forEach(el => el.textContent = user.name);
        
        const avatarElements = document.querySelectorAll('[data-user-avatar]');
        avatarElements.forEach(el => {
            if (user.avatar) {
                el.src = user.avatar;
            }
        });
    }
});