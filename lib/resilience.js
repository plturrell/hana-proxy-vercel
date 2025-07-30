const CircuitBreaker = require('opossum');
const { logger } = require('./logger');
const { ExternalServiceError } = require('./error-handler');

// Circuit breaker default configuration
const DEFAULT_CIRCUIT_OPTIONS = {
  timeout: 3000,               // 3 seconds
  errorThresholdPercentage: 50, // Open circuit at 50% error rate
  resetTimeout: 30000,         // Try again after 30 seconds
  rollingCountTimeout: 10000,  // Count errors over 10 seconds
  rollingCountBuckets: 10,     // Number of buckets to use
  name: 'default',
  allowWarmUp: true,
  volumeThreshold: 10,         // Minimum requests before opening
  fallback: null,
  errorFilter: null
};

// Retry configuration
const DEFAULT_RETRY_OPTIONS = {
  retries: 3,
  factor: 2,                   // Exponential backoff factor
  minTimeout: 1000,            // 1 second
  maxTimeout: 30000,           // 30 seconds
  randomize: true,             // Add randomization to prevent thundering herd
  errorFilter: (err) => {      // Retry on these conditions
    // Don't retry on client errors
    if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
      return false;
    }
    return true;
  }
};

// Circuit breaker registry
const circuitBreakerRegistry = new Map();

// Create or get circuit breaker
function getCircuitBreaker(name, fn, options = {}) {
  if (circuitBreakerRegistry.has(name)) {
    return circuitBreakerRegistry.get(name);
  }

  const breakerOptions = {
    ...DEFAULT_CIRCUIT_OPTIONS,
    ...options,
    name
  };

  const breaker = new CircuitBreaker(fn, breakerOptions);

  // Event listeners
  breaker.on('open', () => {
    logger.warn('Circuit breaker opened', { name, state: 'OPEN' });
  });

  breaker.on('halfOpen', () => {
    logger.info('Circuit breaker half-open', { name, state: 'HALF_OPEN' });
  });

  breaker.on('close', () => {
    logger.info('Circuit breaker closed', { name, state: 'CLOSED' });
  });

  breaker.on('reject', () => {
    logger.warn('Circuit breaker rejected request', { name });
  });

  breaker.on('timeout', () => {
    logger.warn('Circuit breaker timeout', { name });
  });

  breaker.on('success', (result) => {
    logger.debug('Circuit breaker success', { name });
  });

  breaker.on('failure', (err) => {
    logger.error('Circuit breaker failure', { name, error: err.message });
  });

  // Fallback handler
  if (breakerOptions.fallback) {
    breaker.fallback(breakerOptions.fallback);
  }

  circuitBreakerRegistry.set(name, breaker);
  return breaker;
}

// Retry logic implementation
async function retry(fn, options = {}) {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError;
  let delay = config.minTimeout;

  for (let attempt = 0; attempt <= config.retries; attempt++) {
    try {
      const result = await fn(attempt);
      
      // Log successful retry if not first attempt
      if (attempt > 0) {
        logger.info('Retry successful', { 
          attempt, 
          totalAttempts: attempt + 1,
          finalDelay: delay 
        });
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (config.errorFilter && !config.errorFilter(error)) {
        throw error;
      }
      
      // Don't retry if we've exhausted attempts
      if (attempt === config.retries) {
        logger.error('All retry attempts failed', {
          attempts: config.retries + 1,
          error: error.message
        });
        throw error;
      }
      
      // Calculate next delay
      if (config.randomize) {
        delay = Math.min(
          delay * config.factor * (1 + Math.random()),
          config.maxTimeout
        );
      } else {
        delay = Math.min(delay * config.factor, config.maxTimeout);
      }
      
      logger.warn('Retry attempt failed, retrying', {
        attempt: attempt + 1,
        nextDelay: Math.round(delay),
        error: error.message
      });
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Bulkhead pattern implementation
class Bulkhead {
  constructor(name, options = {}) {
    this.name = name;
    this.concurrency = options.concurrency || 10;
    this.queueSize = options.queueSize || 100;
    this.timeout = options.timeout || 60000;
    
    this.running = 0;
    this.queue = [];
    
    logger.info('Bulkhead created', {
      name: this.name,
      concurrency: this.concurrency,
      queueSize: this.queueSize
    });
  }

  async execute(fn) {
    if (this.running >= this.concurrency) {
      if (this.queue.length >= this.queueSize) {
        throw new Error(`Bulkhead ${this.name} queue is full`);
      }
      
      // Queue the request
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          const index = this.queue.findIndex(item => item.resolve === resolve);
          if (index !== -1) {
            this.queue.splice(index, 1);
            reject(new Error(`Bulkhead ${this.name} timeout`));
          }
        }, this.timeout);
        
        this.queue.push({
          fn,
          resolve,
          reject,
          timeoutId
        });
      });
    }
    
    this.running++;
    
    try {
      const result = await fn();
      this._processQueue();
      return result;
    } catch (error) {
      this._processQueue();
      throw error;
    } finally {
      this.running--;
    }
  }
  
  _processQueue() {
    if (this.queue.length > 0 && this.running < this.concurrency) {
      const { fn, resolve, reject, timeoutId } = this.queue.shift();
      clearTimeout(timeoutId);
      
      this.execute(fn)
        .then(resolve)
        .catch(reject);
    }
  }
  
  getStats() {
    return {
      name: this.name,
      running: this.running,
      queued: this.queue.length,
      concurrency: this.concurrency,
      queueSize: this.queueSize
    };
  }
}

// Bulkhead registry
const bulkheadRegistry = new Map();

function getBulkhead(name, options = {}) {
  if (bulkheadRegistry.has(name)) {
    return bulkheadRegistry.get(name);
  }
  
  const bulkhead = new Bulkhead(name, options);
  bulkheadRegistry.set(name, bulkhead);
  return bulkhead;
}

// Timeout wrapper
async function withTimeout(promise, timeout, errorMessage = 'Operation timed out') {
  let timeoutId;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeout);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Health indicator for circuit breakers
function getCircuitBreakerHealth() {
  const health = {};
  
  for (const [name, breaker] of circuitBreakerRegistry) {
    const stats = breaker.stats;
    health[name] = {
      state: breaker.opened ? 'OPEN' : (breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED'),
      stats: {
        failures: stats.failures,
        fallbacks: stats.fallbacks,
        successes: stats.successes,
        timeouts: stats.timeouts,
        cacheHits: stats.cacheHits,
        cacheMisses: stats.cacheMisses,
        semaphoreRejections: stats.semaphoreRejections,
        percentiles: stats.percentiles
      }
    };
  }
  
  return health;
}

// Health indicator for bulkheads
function getBulkheadHealth() {
  const health = {};
  
  for (const [name, bulkhead] of bulkheadRegistry) {
    health[name] = bulkhead.getStats();
  }
  
  return health;
}

// Resilient HTTP client wrapper
class ResilientHttpClient {
  constructor(name, options = {}) {
    this.name = name;
    this.baseURL = options.baseURL;
    this.headers = options.headers || {};
    this.timeout = options.timeout || 30000;
    
    // Create circuit breaker for this client
    this.circuitBreaker = getCircuitBreaker(
      `http-${name}`,
      this._makeRequest.bind(this),
      {
        timeout: this.timeout,
        errorThresholdPercentage: options.errorThreshold || 50,
        resetTimeout: options.resetTimeout || 30000,
        fallback: options.fallback
      }
    );
    
    // Create bulkhead for this client
    this.bulkhead = getBulkhead(
      `http-${name}`,
      {
        concurrency: options.concurrency || 10,
        queueSize: options.queueSize || 100
      }
    );
  }
  
  async request(options) {
    const retryOptions = {
      retries: options.retries ?? 3,
      errorFilter: (err) => {
        // Don't retry client errors
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
          return false;
        }
        return true;
      }
    };
    
    return retry(async (attempt) => {
      return this.bulkhead.execute(async () => {
        return this.circuitBreaker.fire(options);
      });
    }, retryOptions);
  }
  
  async _makeRequest(options) {
    const fetch = require('node-fetch');
    const url = this.baseURL ? `${this.baseURL}${options.path}` : options.url;
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        ...this.headers,
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      timeout: this.timeout
    });
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.response = response;
      throw error;
    }
    
    return response.json();
  }
  
  async get(path, options = {}) {
    return this.request({ ...options, method: 'GET', path });
  }
  
  async post(path, body, options = {}) {
    return this.request({ ...options, method: 'POST', path, body });
  }
  
  async put(path, body, options = {}) {
    return this.request({ ...options, method: 'PUT', path, body });
  }
  
  async delete(path, options = {}) {
    return this.request({ ...options, method: 'DELETE', path });
  }
}

// Database resilience wrapper
class ResilientDatabase {
  constructor(name, dbClient, options = {}) {
    this.name = name;
    this.dbClient = dbClient;
    
    // Create circuit breaker for database operations
    this.circuitBreaker = getCircuitBreaker(
      `db-${name}`,
      null, // We'll bind the function dynamically
      {
        timeout: options.timeout || 5000,
        errorThresholdPercentage: options.errorThreshold || 30,
        resetTimeout: options.resetTimeout || 60000
      }
    );
  }
  
  async query(queryFn, options = {}) {
    const retryOptions = {
      retries: options.retries ?? 2,
      errorFilter: (err) => {
        // Retry on connection errors
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
          return true;
        }
        // Don't retry on query errors
        if (err.code && err.code.startsWith('22') || err.code.startsWith('23')) {
          return false;
        }
        return true;
      }
    };
    
    return retry(async () => {
      return this.circuitBreaker.fire(queryFn, this.dbClient);
    }, retryOptions);
  }
}

// Export everything
module.exports = {
  getCircuitBreaker,
  retry,
  getBulkhead,
  withTimeout,
  getCircuitBreakerHealth,
  getBulkheadHealth,
  ResilientHttpClient,
  ResilientDatabase,
  DEFAULT_CIRCUIT_OPTIONS,
  DEFAULT_RETRY_OPTIONS
};