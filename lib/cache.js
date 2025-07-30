const Redis = require('ioredis');
const { promisify } = require('util');
const { logger } = require('./logger');
const { trackCacheOperation } = require('./monitoring');

// Redis client configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      logger.error('Redis READONLY error, reconnecting...');
      return true;
    }
    return false;
  },
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  lazyConnect: true
};

// Create Redis clients
let redisClient;
let redisSubscriber;
let redisPublisher;

// Cache TTL configurations (in seconds)
const TTL = {
  SHORT: 300,        // 5 minutes
  MEDIUM: 3600,      // 1 hour
  LONG: 86400,       // 24 hours
  SESSION: 7200,     // 2 hours
  PERMANENT: 0       // No expiration
};

// Cache key prefixes
const PREFIXES = {
  USER: 'user:',
  SESSION: 'session:',
  AGENT: 'agent:',
  DOCUMENT: 'doc:',
  QUERY: 'query:',
  API: 'api:',
  RATE_LIMIT: 'ratelimit:',
  LOCK: 'lock:',
  TEMP: 'temp:'
};

// Initialize Redis connections
const initialize = async () => {
  try {
    // Main client for general operations
    redisClient = new Redis(redisConfig);
    
    // Subscriber client for pub/sub
    redisSubscriber = new Redis(redisConfig);
    
    // Publisher client for pub/sub
    redisPublisher = new Redis(redisConfig);

    // Set up event handlers
    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });

    redisClient.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    // Connect all clients
    await Promise.all([
      redisClient.connect(),
      redisSubscriber.connect(),
      redisPublisher.connect()
    ]);

    logger.info('All Redis clients initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Redis', { error: error.message });
    throw error;
  }
};

// Get client for direct access
const getClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

// Cache operations
class CacheService {
  // Get value from cache
  static async get(key, options = {}) {
    try {
      const value = await redisClient.get(key);
      
      trackCacheOperation('get', value !== null);
      
      if (value && options.parse !== false) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      
      return value;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  // Set value in cache
  static async set(key, value, ttl = TTL.MEDIUM) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl > 0) {
        await redisClient.setex(key, ttl, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
      
      trackCacheOperation('set', true);
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  // Delete from cache
  static async delete(key) {
    try {
      const result = await redisClient.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }

  // Delete multiple keys by pattern
  static async deletePattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return keys.length;
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error: error.message });
      return 0;
    }
  }

  // Check if key exists
  static async exists(key) {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error: error.message });
      return false;
    }
  }

  // Get remaining TTL
  static async ttl(key) {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      logger.error('Cache TTL error', { key, error: error.message });
      return -1;
    }
  }

  // Increment counter
  static async increment(key, amount = 1) {
    try {
      return await redisClient.incrby(key, amount);
    } catch (error) {
      logger.error('Cache increment error', { key, error: error.message });
      return null;
    }
  }

  // Decrement counter
  static async decrement(key, amount = 1) {
    try {
      return await redisClient.decrby(key, amount);
    } catch (error) {
      logger.error('Cache decrement error', { key, error: error.message });
      return null;
    }
  }

  // Hash operations
  static async hget(key, field) {
    try {
      const value = await redisClient.hget(key, field);
      
      trackCacheOperation('hget', value !== null);
      
      if (value) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      
      return value;
    } catch (error) {
      logger.error('Cache hget error', { key, field, error: error.message });
      return null;
    }
  }

  static async hset(key, field, value, ttl) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await redisClient.hset(key, field, serialized);
      
      if (ttl > 0) {
        await redisClient.expire(key, ttl);
      }
      
      trackCacheOperation('hset', true);
      return true;
    } catch (error) {
      logger.error('Cache hset error', { key, field, error: error.message });
      return false;
    }
  }

  static async hgetall(key) {
    try {
      const data = await redisClient.hgetall(key);
      
      trackCacheOperation('hgetall', Object.keys(data).length > 0);
      
      // Parse JSON values
      const parsed = {};
      for (const [field, value] of Object.entries(data)) {
        try {
          parsed[field] = JSON.parse(value);
        } catch {
          parsed[field] = value;
        }
      }
      
      return parsed;
    } catch (error) {
      logger.error('Cache hgetall error', { key, error: error.message });
      return {};
    }
  }

  // List operations
  static async lpush(key, ...values) {
    try {
      const serialized = values.map(v => typeof v === 'string' ? v : JSON.stringify(v));
      return await redisClient.lpush(key, ...serialized);
    } catch (error) {
      logger.error('Cache lpush error', { key, error: error.message });
      return 0;
    }
  }

  static async lrange(key, start = 0, stop = -1) {
    try {
      const values = await redisClient.lrange(key, start, stop);
      
      trackCacheOperation('lrange', values.length > 0);
      
      return values.map(v => {
        try {
          return JSON.parse(v);
        } catch {
          return v;
        }
      });
    } catch (error) {
      logger.error('Cache lrange error', { key, error: error.message });
      return [];
    }
  }

  // Set operations
  static async sadd(key, ...members) {
    try {
      return await redisClient.sadd(key, ...members);
    } catch (error) {
      logger.error('Cache sadd error', { key, error: error.message });
      return 0;
    }
  }

  static async smembers(key) {
    try {
      const members = await redisClient.smembers(key);
      trackCacheOperation('smembers', members.length > 0);
      return members;
    } catch (error) {
      logger.error('Cache smembers error', { key, error: error.message });
      return [];
    }
  }
}

// Distributed lock implementation
class DistributedLock {
  static async acquire(resource, ttl = 10000) {
    const lockKey = `${PREFIXES.LOCK}${resource}`;
    const lockId = `${process.pid}:${Date.now()}:${Math.random()}`;
    
    try {
      const result = await redisClient.set(lockKey, lockId, 'PX', ttl, 'NX');
      
      if (result === 'OK') {
        return {
          resource,
          lockId,
          lockKey,
          release: async () => {
            const currentValue = await redisClient.get(lockKey);
            if (currentValue === lockId) {
              await redisClient.del(lockKey);
              return true;
            }
            return false;
          }
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Lock acquire error', { resource, error: error.message });
      return null;
    }
  }

  static async extend(lock, ttl = 10000) {
    try {
      const currentValue = await redisClient.get(lock.lockKey);
      if (currentValue === lock.lockId) {
        await redisClient.pexpire(lock.lockKey, ttl);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Lock extend error', { resource: lock.resource, error: error.message });
      return false;
    }
  }
}

// Pub/Sub implementation
class PubSub {
  static async publish(channel, message) {
    try {
      const serialized = typeof message === 'string' ? message : JSON.stringify(message);
      return await redisPublisher.publish(channel, serialized);
    } catch (error) {
      logger.error('Publish error', { channel, error: error.message });
      return 0;
    }
  }

  static async subscribe(channel, callback) {
    try {
      await redisSubscriber.subscribe(channel);
      
      redisSubscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsed = JSON.parse(message);
            callback(parsed);
          } catch {
            callback(message);
          }
        }
      });
      
      return true;
    } catch (error) {
      logger.error('Subscribe error', { channel, error: error.message });
      return false;
    }
  }

  static async unsubscribe(channel) {
    try {
      await redisSubscriber.unsubscribe(channel);
      return true;
    } catch (error) {
      logger.error('Unsubscribe error', { channel, error: error.message });
      return false;
    }
  }
}

// Cache invalidation strategies
class CacheInvalidation {
  // Invalidate by tags
  static async invalidateByTags(tags) {
    try {
      const keys = [];
      
      for (const tag of tags) {
        const taggedKeys = await redisClient.smembers(`tag:${tag}`);
        keys.push(...taggedKeys);
      }
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      
      // Clean up tag sets
      for (const tag of tags) {
        await redisClient.del(`tag:${tag}`);
      }
      
      return keys.length;
    } catch (error) {
      logger.error('Cache invalidation error', { tags, error: error.message });
      return 0;
    }
  }

  // Tag a cache key
  static async tagKey(key, tags) {
    try {
      for (const tag of tags) {
        await redisClient.sadd(`tag:${tag}`, key);
      }
      return true;
    } catch (error) {
      logger.error('Cache tagging error', { key, tags, error: error.message });
      return false;
    }
  }
}

// Cache warming utilities
class CacheWarming {
  static async warmCache(dataLoader, keys, ttl = TTL.MEDIUM) {
    const results = {
      success: 0,
      failed: 0
    };

    for (const key of keys) {
      try {
        const data = await dataLoader(key);
        if (data) {
          await CacheService.set(key, data, ttl);
          results.success++;
        }
      } catch (error) {
        logger.error('Cache warming error', { key, error: error.message });
        results.failed++;
      }
    }

    return results;
  }
}

// Middleware for HTTP caching
const cacheMiddleware = (options = {}) => {
  const {
    ttl = TTL.SHORT,
    keyGenerator = (req) => `${PREFIXES.API}${req.method}:${req.originalUrl}`,
    condition = () => true,
    tags = []
  } = options;

  return async (req, res, next) => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET' || !condition(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get from cache
      const cached = await CacheService.get(cacheKey);
      
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-TTL', await CacheService.ttl(cacheKey));
        return res.json(cached);
      }

      // Cache miss - intercept response
      res.setHeader('X-Cache', 'MISS');
      
      const originalJson = res.json;
      res.json = async function(data) {
        // Cache the response
        await CacheService.set(cacheKey, data, ttl);
        
        // Tag the cache entry if tags provided
        if (tags.length > 0) {
          await CacheInvalidation.tagKey(cacheKey, tags);
        }
        
        // Send the response
        originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      next();
    }
  };
};

// Clean up on exit
const cleanup = async () => {
  try {
    if (redisClient) await redisClient.quit();
    if (redisSubscriber) await redisSubscriber.quit();
    if (redisPublisher) await redisPublisher.quit();
    logger.info('Redis connections closed');
  } catch (error) {
    logger.error('Redis cleanup error', { error: error.message });
  }
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

module.exports = {
  initialize,
  getClient,
  CacheService,
  DistributedLock,
  PubSub,
  CacheInvalidation,
  CacheWarming,
  cacheMiddleware,
  cleanup,
  TTL,
  PREFIXES
};