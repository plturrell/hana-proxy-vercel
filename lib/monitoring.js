const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { logger, performanceLogger } = require('./logger');

// Custom metrics
let requestCounter;
let requestDuration;
let activeRequests;
let errorCounter;
let dbQueryDuration;
let cacheHitRate;
let authFailures;
let apiUsage;

// Initialize OpenTelemetry
const initializeMonitoring = () => {
  // Configure resource
  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'finsight-intelligence',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
      'service.namespace': 'finsight',
      'service.instance.id': process.env.INSTANCE_ID || 'local',
    })
  );

  // Configure Jaeger exporter for traces
  const jaegerExporter = new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    serviceName: 'finsight-intelligence',
  });

  // Configure Prometheus exporter for metrics
  const prometheusExporter = new PrometheusExporter({
    port: parseInt(process.env.METRICS_PORT) || 9090,
    endpoint: '/metrics',
  }, () => {
    logger.info('Prometheus metrics server started', { port: prometheusExporter.port });
  });

  // Initialize SDK
  const sdk = new NodeSDK({
    resource,
    traceExporter: jaegerExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Disable fs instrumentation to reduce noise
        },
      }),
    ],
  });

  // Initialize the SDK
  sdk.start()
    .then(() => logger.info('OpenTelemetry initialized successfully'))
    .catch((error) => logger.error('Error initializing OpenTelemetry', { error: error.message }));

  // Initialize metrics
  initializeMetrics(prometheusExporter);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => logger.info('OpenTelemetry terminated'))
      .catch((error) => logger.error('Error terminating OpenTelemetry', { error: error.message }))
      .finally(() => process.exit(0));
  });
};

// Initialize custom metrics
const initializeMetrics = (prometheusExporter) => {
  const meterProvider = new MeterProvider({
    resource: Resource.default(),
    readers: [prometheusExporter],
  });

  const meter = meterProvider.getMeter('finsight-intelligence', '1.0.0');

  // Request metrics
  requestCounter = meter.createCounter('http_requests_total', {
    description: 'Total number of HTTP requests',
  });

  requestDuration = meter.createHistogram('http_request_duration_seconds', {
    description: 'HTTP request duration in seconds',
    boundaries: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  });

  activeRequests = meter.createUpDownCounter('http_requests_active', {
    description: 'Number of active HTTP requests',
  });

  errorCounter = meter.createCounter('errors_total', {
    description: 'Total number of errors',
  });

  // Database metrics
  dbQueryDuration = meter.createHistogram('db_query_duration_seconds', {
    description: 'Database query duration in seconds',
    boundaries: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  });

  // Cache metrics
  cacheHitRate = meter.createCounter('cache_hits_total', {
    description: 'Total number of cache hits',
  });

  // Security metrics
  authFailures = meter.createCounter('auth_failures_total', {
    description: 'Total number of authentication failures',
  });

  // API usage metrics
  apiUsage = meter.createCounter('api_usage_total', {
    description: 'Total API usage by endpoint and user',
  });
};

// Middleware for request tracking
const requestTracking = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  // Increment active requests
  activeRequests.add(1, {
    method: req.method,
    route: req.route?.path || req.path,
  });

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e9; // Convert to seconds
    
    // Record request metrics
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode.toString(),
      status_class: `${Math.floor(res.statusCode / 100)}xx`,
    };

    requestCounter.add(1, labels);
    requestDuration.record(duration, labels);
    
    // Decrement active requests
    activeRequests.add(-1, {
      method: req.method,
      route: req.route?.path || req.path,
    });

    // Log performance metrics
    performanceLogger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${(duration * 1000).toFixed(2)}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    // Track errors
    if (res.statusCode >= 400) {
      errorCounter.add(1, {
        type: res.statusCode >= 500 ? 'server_error' : 'client_error',
        status_code: res.statusCode.toString(),
        path: req.path,
      });
    }
  });

  next();
};

// Database query tracking
const trackDatabaseQuery = (queryType, duration, success = true) => {
  dbQueryDuration.record(duration, {
    query_type: queryType,
    status: success ? 'success' : 'failure',
  });
};

// Cache tracking
const trackCacheOperation = (operation, hit = true) => {
  if (hit) {
    cacheHitRate.add(1, {
      operation,
      result: 'hit',
    });
  } else {
    cacheHitRate.add(1, {
      operation,
      result: 'miss',
    });
  }
};

// Authentication tracking
const trackAuthFailure = (reason, userId = 'anonymous') => {
  authFailures.add(1, {
    reason,
    user_id: userId,
  });
};

// API usage tracking
const trackApiUsage = (endpoint, userId = 'anonymous', apiKey = null) => {
  apiUsage.add(1, {
    endpoint,
    user_id: userId,
    api_key: apiKey ? apiKey.substring(0, 8) + '...' : 'none',
  });
};

// Health check endpoint
const healthCheck = async (req, res) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    uptime: process.uptime(),
    checks: {}
  };

  // Database health check
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { error } = await supabase.from('health_check').select('*').limit(1);
    checks.checks.database = {
      status: error ? 'unhealthy' : 'healthy',
      message: error ? error.message : 'Connected'
    };
  } catch (error) {
    checks.checks.database = {
      status: 'unhealthy',
      message: error.message
    };
  }

  // Redis health check (if configured)
  if (process.env.REDIS_URL) {
    try {
      const redis = require('./cache').getClient();
      await redis.ping();
      checks.checks.redis = {
        status: 'healthy',
        message: 'Connected'
      };
    } catch (error) {
      checks.checks.redis = {
        status: 'unhealthy',
        message: error.message
      };
    }
  }

  // Memory check
  const memoryUsage = process.memoryUsage();
  checks.checks.memory = {
    status: memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9 ? 'healthy' : 'warning',
    usage: {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
    }
  };

  // Overall status
  const hasUnhealthy = Object.values(checks.checks).some(check => check.status === 'unhealthy');
  const hasWarning = Object.values(checks.checks).some(check => check.status === 'warning');
  
  if (hasUnhealthy) {
    checks.status = 'unhealthy';
    res.status(503);
  } else if (hasWarning) {
    checks.status = 'degraded';
    res.status(200);
  } else {
    res.status(200);
  }

  res.json(checks);
};

// Readiness check endpoint
const readinessCheck = async (req, res) => {
  const checks = {
    ready: true,
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Check if all required services are available
  const requiredServices = ['database'];
  
  // Database check
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { error } = await supabase.from('health_check').select('*').limit(1);
    checks.checks.database = !error;
  } catch (error) {
    checks.checks.database = false;
  }

  // Check if all required services are ready
  checks.ready = requiredServices.every(service => checks.checks[service] === true);
  
  res.status(checks.ready ? 200 : 503).json(checks);
};

// Liveness check endpoint
const livenessCheck = (req, res) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    pid: process.pid,
    uptime: process.uptime()
  });
};

// Custom span creation for tracing
const createSpan = (tracer, spanName, attributes = {}) => {
  return tracer.startSpan(spanName, {
    attributes: {
      'span.type': 'custom',
      ...attributes
    }
  });
};

// Performance monitoring decorator
const monitorPerformance = (target, propertyKey, descriptor) => {
  const originalMethod = descriptor.value;

  descriptor.value = async function(...args) {
    const start = process.hrtime.bigint();
    const span = createSpan(tracer, `${target.constructor.name}.${propertyKey}`);

    try {
      const result = await originalMethod.apply(this, args);
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (error) {
      span.setStatus({ code: 2, message: error.message }); // ERROR
      span.recordException(error);
      throw error;
    } finally {
      const duration = Number(process.hrtime.bigint() - start) / 1e9;
      span.setAttribute('duration', duration);
      span.end();

      performanceLogger.info('Method execution', {
        class: target.constructor.name,
        method: propertyKey,
        duration: `${(duration * 1000).toFixed(2)}ms`
      });
    }
  };

  return descriptor;
};

module.exports = {
  initializeMonitoring,
  requestTracking,
  trackDatabaseQuery,
  trackCacheOperation,
  trackAuthFailure,
  trackApiUsage,
  healthCheck,
  readinessCheck,
  livenessCheck,
  createSpan,
  monitorPerformance
};