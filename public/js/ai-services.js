// AI Services - Enterprise Production Module
class AIServices {
    constructor() {
        this.services = {
            grok: {
                endpoint: '/api/ai/grok',
                model: 'grok-beta',
                capabilities: ['analysis', 'prediction', 'research']
            },
            perplexity: {
                endpoint: '/api/ai/perplexity',
                model: 'pplx-70b-online',
                capabilities: ['search', 'news', 'market-data']
            },
            openai: {
                endpoint: '/api/ai/openai',
                model: 'gpt-4-turbo',
                capabilities: ['strategy', 'risk', 'optimization']
            }
        };
        
        this.state = {
            loading: false,
            error: null,
            activeService: 'openai',
            history: [],
            metrics: {}
        };
        
        this.init();
    }

    async init() {
        await this.loadMetrics();
        this.setupWebSocket();
        this.startHealthCheck();
    }

    async query(message, service = this.state.activeService, options = {}) {
        this.state.loading = true;
        this.updateUI('loading');
        
        try {
            const response = await fetch(this.services[service].endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    message,
                    context: options.context || {},
                    sessionId: this.getSessionId()
                })
            });

            if (!response.ok) {
                throw new Error(`Service error: ${response.statusText}`);
            }

            const data = await response.json();
            
            this.addToHistory({
                service,
                message,
                response: data.response,
                timestamp: new Date()
            });
            
            this.state.loading = false;
            this.updateUI('success');
            
            return data;
            
        } catch (error) {
            this.state.error = error.message;
            this.state.loading = false;
            this.updateUI('error');
            throw error;
        }
    }

    async analyzePortfolio(portfolioId) {
        return this.query(
            'Analyze portfolio performance and provide optimization recommendations',
            'openai',
            {
                context: {
                    portfolioId,
                    analysisType: 'comprehensive'
                }
            }
        );
    }

    async assessRisk(portfolioId) {
        const response = await fetch('/api/risk/assessment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify({ portfolioId })
        });

        if (!response.ok) {
            throw new Error('Risk assessment failed');
        }

        return response.json();
    }

    async predictMarket(symbols, horizon = 30) {
        const response = await fetch('/api/market/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify({ symbols, horizon })
        });

        if (!response.ok) {
            throw new Error('Market prediction failed');
        }

        return response.json();
    }

    async loadMetrics() {
        try {
            const response = await fetch('/api/metrics/ai');
            if (response.ok) {
                this.state.metrics = await response.json();
                this.updateMetricsUI();
            }
        } catch (error) {
            console.error('Failed to load metrics:', error);
        }
    }

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.ws = new WebSocket(`${protocol}//${window.location.host}/ws/ai`);
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'metrics') {
                this.state.metrics = data.payload;
                this.updateMetricsUI();
            }
        };
        
        this.ws.onerror = () => {
            setTimeout(() => this.setupWebSocket(), 5000);
        };
    }

    startHealthCheck() {
        setInterval(async () => {
            for (const [name, service] of Object.entries(this.services)) {
                try {
                    const response = await fetch(`${service.endpoint}/health`);
                    const status = response.ok ? 'healthy' : 'unhealthy';
                    this.updateServiceStatus(name, status);
                } catch {
                    this.updateServiceStatus(name, 'offline');
                }
            }
        }, 30000);
    }

    addToHistory(entry) {
        this.state.history.unshift(entry);
        if (this.state.history.length > 100) {
            this.state.history.pop();
        }
        localStorage.setItem('ai_history', JSON.stringify(this.state.history));
    }

    getToken() {
        return localStorage.getItem('auth_token') || '';
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    }

    updateUI(status) {
        const event = new CustomEvent('ai-status-change', {
            detail: { status, state: this.state }
        });
        window.dispatchEvent(event);
    }

    updateMetricsUI() {
        const event = new CustomEvent('ai-metrics-update', {
            detail: this.state.metrics
        });
        window.dispatchEvent(event);
    }

    updateServiceStatus(service, status) {
        const event = new CustomEvent('ai-service-status', {
            detail: { service, status }
        });
        window.dispatchEvent(event);
    }

    exportHistory(format = 'json') {
        const data = format === 'json' 
            ? JSON.stringify(this.state.history, null, 2)
            : this.state.history.map(h => 
                `${h.timestamp}: [${h.service}] ${h.message}\n${h.response}`
              ).join('\n\n');
        
        const blob = new Blob([data], { 
            type: format === 'json' ? 'application/json' : 'text/plain' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai_history_${Date.now()}.${format === 'json' ? 'json' : 'txt'}`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize global instance
window.AI = new AIServices();