const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { logger, auditLogger } = require('./logger');

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Correlation-ID'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // 24 hours
};

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userId: req.user?.id
      });
      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Different rate limiters for different endpoints
const rateLimiters = {
  general: createRateLimiter(15 * 60 * 1000, 100, 'Too many requests'),
  auth: createRateLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts'),
  api: createRateLimiter(60 * 1000, 60, 'API rate limit exceeded'),
  upload: createRateLimiter(60 * 60 * 1000, 10, 'Too many file uploads')
};

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Note: Remove unsafe-eval in production
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.supabase.co", "wss://"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Request ID middleware for tracking
const requestIdMiddleware = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
};

// IP whitelist middleware
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next();
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    if (allowedIPs.includes(clientIP)) {
      return next();
    }
    
    logger.warn('Unauthorized IP access attempt', {
      ip: clientIP,
      path: req.path
    });
    
    res.status(403).json({
      error: 'Access denied',
      message: 'Your IP address is not authorized'
    });
  };
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.correlationId,
      userId: req.user?.id
    });
    
    // Audit sensitive operations
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && res.statusCode < 400) {
      auditLogger.info('Audit event', {
        action: `${req.method} ${req.path}`,
        userId: req.user?.id,
        ip: req.ip,
        body: req.body,
        correlationId: req.correlationId
      });
    }
  });
  
  next();
};

// Input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

// API key authentication middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide an API key in the X-API-Key header'
    });
  }
  
  // Verify API key (this would check against database in production)
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key attempt', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip
    });
    
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  next();
};

// Content type validation
const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    if (['GET', 'DELETE', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    const contentType = req.headers['content-type'];
    const hasValidType = allowedTypes.some(type => contentType?.includes(type));
    
    if (!hasValidType) {
      return res.status(415).json({
        error: 'Unsupported media type',
        message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
      });
    }
    
    next();
  };
};

// SQL injection prevention middleware
const preventSQLInjection = (req, res, next) => {
  const suspiciousPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
    /(--)|(\/*)|(*\/)/g,
    /(\bor\b\s*\d+\s*=\s*\d+)/gi,
    /(\band\b\s*\d+\s*=\s*\d+)/gi
  ];
  
  const checkValue = (value) => {
    if (typeof value === 'string') {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          return true;
        }
      }
    }
    return false;
  };
  
  const checkObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (checkValue(obj[key]) || (typeof obj[key] === 'object' && checkObject(obj[key]))) {
          return true;
        }
      }
    }
    return false;
  };
  
  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    logger.warn('Potential SQL injection attempt', {
      ip: req.ip,
      path: req.path,
      body: req.body,
      query: req.query
    });
    
    return res.status(400).json({
      error: 'Invalid input',
      message: 'Request contains potentially malicious content'
    });
  }
  
  next();
};

// Security configuration function
const configureSecurity = (app) => {
  // Enable trust proxy for accurate IP addresses
  app.set('trust proxy', true);
  
  // Basic security headers
  app.use(securityHeaders);
  
  // CORS
  app.use(cors(corsOptions));
  
  // Body parsing security
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Request ID tracking
  app.use(requestIdMiddleware);
  
  // Request logging
  app.use(requestLogger);
  
  // Data sanitization
  app.use(mongoSanitize());
  app.use(xss());
  
  // Prevent parameter pollution
  app.use(hpp());
  
  // SQL injection prevention
  app.use(preventSQLInjection);
  
  // Rate limiting
  app.use('/api/', rateLimiters.api);
  app.use('/auth/', rateLimiters.auth);
  app.use('/upload/', rateLimiters.upload);
  app.use(rateLimiters.general);
  
  // Content type validation
  app.use(validateContentType(['application/json', 'multipart/form-data']));
};

module.exports = {
  configureSecurity,
  corsOptions,
  rateLimiters,
  requestIdMiddleware,
  ipWhitelist,
  requestLogger,
  validateInput,
  apiKeyAuth,
  validateContentType,
  preventSQLInjection
};