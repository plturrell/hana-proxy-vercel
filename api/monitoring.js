// Production Monitoring and Logging System

// OpenTelemetry integration for production monitoring
const { trace, metrics, context } = require('@opentelemetry/api');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

// Performance metrics
class MetricsCollector {
    constructor() {
        this.counters = new Map();
        this.histograms = new Map();
        this.gauges = new Map();
        
        // Initialize meters
        this.meter = metrics.getMeter('bpmn-agent-system', '1.0.0');
        
        // Define metrics
        this.requestCounter = this.meter.createCounter('api_requests_total', {
            description: 'Total number of API requests'
        });
        
        this.requestDuration = this.meter.createHistogram('api_request_duration_ms', {
            description: 'API request duration in milliseconds'
        });
        
        this.activeAgents = this.meter.createUpDownCounter('active_agents', {
            description: 'Number of active agents'
        });
        
        this.cacheHitRate = this.meter.createObservableGauge('cache_hit_rate', {
            description: 'Cache hit rate percentage'
        });
        
        this.errorRate = this.meter.createObservableGauge('error_rate', {
            description: 'Error rate per minute'
        });
    }
    
    recordRequest(endpoint, method, statusCode, duration) {
        this.requestCounter.add(1, {
            endpoint,
            method,
            status_code: statusCode,
            status_class: Math.floor(statusCode / 100) + 'xx'
        });
        
        this.requestDuration.record(duration, {
            endpoint,
            method
        });
    }
    
    recordCacheHit(cacheKey, hit) {
        const key = `cache_${cacheKey}`;
        if (!this.counters.has(key)) {
            this.counters.set(key, { hits: 0, misses: 0 });
        }
        
        const counter = this.counters.get(key);
        if (hit) {
            counter.hits++;
        } else {
            counter.misses++;
        }
    }
    
    recordError(errorType, errorMessage, context) {
        const timestamp = Date.now();
        const errorKey = `error_${errorType}`;
        
        if (!this.counters.has(errorKey)) {
            this.counters.set(errorKey, []);
        }
        
        this.counters.get(errorKey).push({
            timestamp,
            message: errorMessage,
            context
        });
        
        // Clean up old errors (older than 5 minutes)
        const fiveMinutesAgo = timestamp - (5 * 60 * 1000);
        const errors = this.counters.get(errorKey);
        this.counters.set(errorKey, errors.filter(e => e.timestamp > fiveMinutesAgo));
    }
    
    getMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            requests: {},
            cache: {},
            errors: {},
            performance: {}
        };
        
        // Calculate cache hit rates
        for (const [key, value] of this.counters.entries()) {
            if (key.startsWith('cache_')) {
                const total = value.hits + value.misses;
                metrics.cache[key] = {
                    hits: value.hits,
                    misses: value.misses,
                    hitRate: total > 0 ? (value.hits / total * 100).toFixed(2) + '%' : '0%'
                };
            } else if (key.startsWith('error_')) {
                metrics.errors[key] = value.length;
            }
        }
        
        return metrics;
    }
}

// Logger with structured logging
class Logger {
    constructor(component = 'bpmn-agent-system') {
        this.component = component;
        this.tracer = trace.getTracer(component, '1.0.0');
    }
    
    log(level, message, data = {}) {
        const span = trace.getActiveSpan();
        const spanContext = span ? span.spanContext() : null;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            component: this.component,
            message,
            ...data,
            trace: spanContext ? {
                traceId: spanContext.traceId,
                spanId: spanContext.spanId
            } : null
        };
        
        // In production, send to log aggregation service
        if (process.env.NODE_ENV === 'production') {
            this.sendToLogService(logEntry);
        } else {
            console.log(JSON.stringify(logEntry));
        }
    }
    
    info(message, data) {
        this.log('INFO', message, data);
    }
    
    warn(message, data) {
        this.log('WARN', message, data);
    }
    
    error(message, error, data) {
        this.log('ERROR', message, {
            ...data,
            error: {
                message: error.message,
                stack: error.stack,
                code: error.code
            }
        });
    }
    
    sendToLogService(logEntry) {
        // Implement log aggregation service integration
        // Example: CloudWatch, Datadog, ELK stack
        try {
            // Batch logs for efficiency
            if (!this.logBatch) {
                this.logBatch = [];
                this.batchTimer = setTimeout(() => this.flushLogs(), 1000);
            }
            
            this.logBatch.push(logEntry);
            
            if (this.logBatch.length >= 100) {
                this.flushLogs();
            }
        } catch (e) {
            console.error('Failed to send logs:', e);
        }
    }
    
    flushLogs() {
        if (!this.logBatch || this.logBatch.length === 0) return;
        
        const batch = this.logBatch;
        this.logBatch = [];
        
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        
        // Send batch to log service
        // Implementation depends on your log service
    }
}

// Health check system
class HealthChecker {
    constructor() {
        this.checks = new Map();
        this.lastCheckTime = 0;
        this.checkInterval = 30000; // 30 seconds
    }
    
    registerCheck(name, checkFn) {
        this.checks.set(name, {
            fn: checkFn,
            lastStatus: 'unknown',
            lastCheckTime: 0,
            consecutiveFailures: 0
        });
    }
    
    async runChecks() {
        const now = Date.now();
        if (now - this.lastCheckTime < this.checkInterval) {
            return this.getStatus();
        }
        
        this.lastCheckTime = now;
        const results = {};
        
        for (const [name, check] of this.checks.entries()) {
            try {
                const startTime = Date.now();
                const result = await check.fn();
                const duration = Date.now() - startTime;
                
                check.lastStatus = result.healthy ? 'healthy' : 'unhealthy';
                check.lastCheckTime = now;
                check.consecutiveFailures = result.healthy ? 0 : check.consecutiveFailures + 1;
                
                results[name] = {
                    status: check.lastStatus,
                    message: result.message,
                    duration,
                    lastCheck: new Date(now).toISOString(),
                    consecutiveFailures: check.consecutiveFailures
                };
            } catch (error) {
                check.lastStatus = 'error';
                check.consecutiveFailures++;
                
                results[name] = {
                    status: 'error',
                    message: error.message,
                    lastCheck: new Date(now).toISOString(),
                    consecutiveFailures: check.consecutiveFailures
                };
            }
        }
        
        return {
            status: this.getOverallStatus(),
            timestamp: new Date().toISOString(),
            checks: results
        };
    }
    
    getStatus() {
        const results = {};
        
        for (const [name, check] of this.checks.entries()) {
            results[name] = {
                status: check.lastStatus,
                lastCheck: check.lastCheckTime ? new Date(check.lastCheckTime).toISOString() : 'never',
                consecutiveFailures: check.consecutiveFailures
            };
        }
        
        return {
            status: this.getOverallStatus(),
            timestamp: new Date().toISOString(),
            checks: results
        };
    }
    
    getOverallStatus() {
        let hasError = false;
        let hasUnhealthy = false;
        
        for (const check of this.checks.values()) {
            if (check.lastStatus === 'error' || check.consecutiveFailures >= 3) {
                hasError = true;
            } else if (check.lastStatus === 'unhealthy') {
                hasUnhealthy = true;
            }
        }
        
        if (hasError) return 'error';
        if (hasUnhealthy) return 'degraded';
        return 'healthy';
    }
}

// Initialize monitoring
const metricsCollector = new MetricsCollector();
const logger = new Logger();
const healthChecker = new HealthChecker();

// Register health checks
healthChecker.registerCheck('database', async () => {
    try {
        // Check database connectivity
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        const { error } = await supabase.from('a2a_agents').select('count').limit(1);
        
        return {
            healthy: !error,
            message: error ? error.message : 'Database connection successful'
        };
    } catch (error) {
        return {
            healthy: false,
            message: error.message
        };
    }
});

healthChecker.registerCheck('memory', async () => {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const usage = (used.heapUsed / used.heapTotal) * 100;
    
    return {
        healthy: usage < 90,
        message: `Heap usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${usage.toFixed(1)}%)`
    };
});

// Monitoring middleware
function monitoringMiddleware(handler) {
    return async (req, res) => {
        const startTime = Date.now();
        const span = logger.tracer.startSpan(`${req.method} ${req.url}`);
        
        // Add request ID
        const requestId = req.headers['x-request-id'] || generateRequestId();
        req.requestId = requestId;
        
        // Log request
        logger.info('Incoming request', {
            method: req.method,
            url: req.url,
            headers: sanitizeHeaders(req.headers),
            requestId
        });
        
        // Wrap response methods
        const originalEnd = res.end;
        const originalJson = res.json;
        
        res.end = function(...args) {
            const duration = Date.now() - startTime;
            metricsCollector.recordRequest(req.url, req.method, res.statusCode, duration);
            
            logger.info('Request completed', {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration,
                requestId
            });
            
            span.setStatus({ code: res.statusCode < 400 ? 0 : 2 });
            span.end();
            
            return originalEnd.apply(res, args);
        };
        
        res.json = function(data) {
            const duration = Date.now() - startTime;
            metricsCollector.recordRequest(req.url, req.method, res.statusCode, duration);
            
            logger.info('Request completed', {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration,
                requestId,
                responseSize: JSON.stringify(data).length
            });
            
            span.setStatus({ code: res.statusCode < 400 ? 0 : 2 });
            span.end();
            
            return originalJson.call(res, data);
        };
        
        try {
            await handler(req, res);
        } catch (error) {
            const duration = Date.now() - startTime;
            metricsCollector.recordRequest(req.url, req.method, 500, duration);
            metricsCollector.recordError('unhandled_error', error.message, {
                method: req.method,
                url: req.url,
                requestId
            });
            
            logger.error('Unhandled error', error, {
                method: req.method,
                url: req.url,
                requestId
            });
            
            span.recordException(error);
            span.setStatus({ code: 2, message: error.message });
            span.end();
            
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Internal server error',
                    message: process.env.NODE_ENV === 'production' 
                        ? 'An unexpected error occurred' 
                        : error.message,
                    requestId
                });
            }
        }
    };
}

// Utility functions
function generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    // Remove sensitive headers
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    return sanitized;
}

// Export monitoring tools
module.exports = {
    metricsCollector,
    logger,
    healthChecker,
    monitoringMiddleware,
    
    // Monitoring endpoints
    async handleMetrics(req, res) {
        const metrics = metricsCollector.getMetrics();
        res.status(200).json(metrics);
    },
    
    async handleHealth(req, res) {
        const health = await healthChecker.runChecks();
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'degraded' ? 200 : 503;
        res.status(statusCode).json(health);
    }
};