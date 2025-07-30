const Joi = require('joi');
const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');
const { ValidationError } = require('./error-handler');

// Custom validators
const customValidators = {
  // Ethereum address validation
  ethereumAddress: (value, helpers) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  },

  // Safe SQL identifier (table/column names)
  sqlIdentifier: (value, helpers) => {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  },

  // URL validation with protocol check
  safeUrl: (value, helpers) => {
    if (!validator.isURL(value, { protocols: ['http', 'https'], require_protocol: true })) {
      return helpers.error('any.invalid');
    }
    return value;
  },

  // File upload validation
  fileUpload: (value, helpers) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.csv', '.json'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const extension = value.filename.substring(value.filename.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return helpers.error('any.invalid');
    }
    
    if (value.size > maxSize) {
      return helpers.error('any.invalid');
    }
    
    return value;
  }
};

// Schema definitions for different entities
const schemas = {
  // User schemas
  userRegistration: Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().min(12).required(),
    firstName: Joi.string().min(1).max(50).required().trim(),
    lastName: Joi.string().min(1).max(50).required().trim(),
    role: Joi.string().valid('viewer', 'analyst', 'trader', 'admin').default('viewer'),
    company: Joi.string().max(100).trim(),
    phone: Joi.string().pattern(/^[+]?[\d\s-()]+$/).allow('').optional()
  }),

  userLogin: Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().required()
  }),

  userUpdate: Joi.object({
    firstName: Joi.string().min(1).max(50).trim(),
    lastName: Joi.string().min(1).max(50).trim(),
    company: Joi.string().max(100).trim(),
    phone: Joi.string().pattern(/^[+]?[\d\s-()]+$/).allow(''),
    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark'),
      notifications: Joi.boolean(),
      language: Joi.string().valid('en', 'es', 'fr', 'de', 'zh', 'ja')
    })
  }),

  // Agent schemas
  agentCreate: Joi.object({
    agentName: Joi.string().min(3).max(100).required().trim(),
    agentType: Joi.string().valid('analytics', 'financial', 'ml', 'nlp', 'data').required(),
    description: Joi.string().max(500).required().trim(),
    capabilities: Joi.array().items(Joi.string().max(50)).max(10),
    configuration: Joi.object({
      model: Joi.string().max(50),
      temperature: Joi.number().min(0).max(2),
      maxTokens: Joi.number().integer().min(1).max(4000),
      timeout: Joi.number().integer().min(1000).max(300000)
    }),
    metadata: Joi.object().max(20)
  }),

  agentUpdate: Joi.object({
    agentName: Joi.string().min(3).max(100).trim(),
    description: Joi.string().max(500).trim(),
    status: Joi.string().valid('active', 'inactive', 'maintenance'),
    capabilities: Joi.array().items(Joi.string().max(50)).max(10),
    configuration: Joi.object({
      model: Joi.string().max(50),
      temperature: Joi.number().min(0).max(2),
      maxTokens: Joi.number().integer().min(1).max(4000),
      timeout: Joi.number().integer().min(1000).max(300000)
    })
  }),

  // Financial transaction schemas
  transaction: Joi.object({
    type: Joi.string().valid('buy', 'sell', 'transfer').required(),
    asset: Joi.string().max(10).uppercase().required(),
    amount: Joi.number().positive().precision(8).required(),
    price: Joi.number().positive().precision(8).when('type', {
      is: Joi.valid('buy', 'sell'),
      then: Joi.required()
    }),
    recipient: Joi.string().custom(customValidators.ethereumAddress).when('type', {
      is: 'transfer',
      then: Joi.required()
    }),
    notes: Joi.string().max(500).trim()
  }),

  // Portfolio schemas
  portfolioCreate: Joi.object({
    name: Joi.string().min(3).max(100).required().trim(),
    description: Joi.string().max(500).trim(),
    type: Joi.string().valid('personal', 'institutional', 'fund').required(),
    currency: Joi.string().length(3).uppercase().default('USD'),
    initialBalance: Joi.number().min(0).precision(2).default(0),
    riskProfile: Joi.string().valid('conservative', 'moderate', 'aggressive').default('moderate')
  }),

  // Contract deployment schemas
  contractDeploy: Joi.object({
    name: Joi.string().min(3).max(100).required().trim(),
    description: Joi.string().max(500).required().trim(),
    templateId: Joi.string().uuid().required(),
    network: Joi.string().valid('ethereum', 'polygon', 'arbitrum', 'optimism').required(),
    agents: Joi.array().items(Joi.string().uuid()).max(10),
    parameters: Joi.object({
      gasLimit: Joi.number().integer().min(21000).max(10000000).default(200000),
      maxGasPrice: Joi.number().positive().max(1000).default(50),
      timeout: Joi.number().integer().min(1).max(60).default(10)
    })
  }),

  // Query/Search schemas
  searchQuery: Joi.object({
    query: Joi.string().min(2).max(200).required().trim(),
    filters: Joi.object({
      type: Joi.array().items(Joi.string()),
      dateFrom: Joi.date().iso(),
      dateTo: Joi.date().iso().greater(Joi.ref('dateFrom')),
      status: Joi.array().items(Joi.string()),
      tags: Joi.array().items(Joi.string()).max(10)
    }),
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sort: Joi.string().valid('relevance', 'date', 'name').default('relevance'),
      order: Joi.string().valid('asc', 'desc').default('desc')
    })
  }),

  // File upload schemas
  fileUpload: Joi.object({
    file: Joi.object({
      filename: Joi.string().required(),
      mimetype: Joi.string().required(),
      size: Joi.number().integer().positive().max(10485760).required() // 10MB
    }).custom(customValidators.fileUpload).required(),
    documentType: Joi.string().valid('contract', 'report', 'analysis', 'other').required(),
    tags: Joi.array().items(Joi.string().max(20)).max(5),
    metadata: Joi.object().max(10)
  }),

  // API request schemas
  apiRequest: Joi.object({
    endpoint: Joi.string().custom(customValidators.safeUrl).required(),
    method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE').required(),
    headers: Joi.object().pattern(
      Joi.string().pattern(/^[a-zA-Z0-9-]+$/),
      Joi.string().max(1000)
    ).max(20),
    body: Joi.alternatives().try(
      Joi.object(),
      Joi.array(),
      Joi.string()
    ),
    timeout: Joi.number().integer().min(1000).max(60000).default(30000)
  })
};

// Sanitization functions
const sanitizers = {
  // HTML sanitization
  html: (input) => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'title']
    });
  },

  // SQL input sanitization
  sql: (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove SQL comments
    input = input.replace(/--.*$/gm, '');
    input = input.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Escape special characters
    input = input.replace(/['";\\]/g, '\\$&');
    
    return input;
  },

  // NoSQL input sanitization
  nosql: (input) => {
    if (typeof input !== 'object') return input;
    
    const sanitized = {};
    for (const key in input) {
      if (key.startsWith('$')) {
        continue; // Skip MongoDB operators
      }
      sanitized[key] = input[key];
    }
    
    return sanitized;
  },

  // File path sanitization
  filePath: (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove path traversal attempts
    input = input.replace(/\.\./g, '');
    input = input.replace(/[<>:"|?*]/g, '');
    
    // Normalize path separators
    input = input.replace(/\\/g, '/');
    
    return input;
  },

  // Email sanitization
  email: (input) => {
    if (typeof input !== 'string') return input;
    
    input = input.toLowerCase().trim();
    
    if (!validator.isEmail(input)) {
      throw new ValidationError('Invalid email format');
    }
    
    return validator.normalizeEmail(input);
  },

  // Phone sanitization
  phone: (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove all non-numeric characters except + at the beginning
    input = input.replace(/[^\d+]/g, '');
    input = input.replace(/\+/g, (match, offset) => offset === 0 ? match : '');
    
    return input;
  },

  // General text sanitization
  text: (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove control characters
    input = input.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Trim whitespace
    input = input.trim();
    
    // Limit consecutive spaces
    input = input.replace(/\s+/g, ' ');
    
    return input;
  }
};

// Validation middleware factory
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      throw new Error(`Validation schema '${schemaName}' not found`);
    }
    
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));
      
      throw new ValidationError('Validation failed', errors);
    }
    
    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Sanitize middleware
const sanitize = (fields = []) => {
  return (req, res, next) => {
    try {
      // Sanitize body
      if (req.body) {
        req.body = sanitizeObject(req.body, fields);
      }
      
      // Sanitize query parameters
      if (req.query) {
        req.query = sanitizeObject(req.query, fields);
      }
      
      // Sanitize route parameters
      if (req.params) {
        req.params = sanitizeObject(req.params, fields);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Helper function to sanitize objects
function sanitizeObject(obj, fields = []) {
  const sanitized = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      let value = obj[key];
      
      // Apply field-specific sanitization
      if (fields.includes('html') && typeof value === 'string') {
        value = sanitizers.html(value);
      } else if (fields.includes('sql') && typeof value === 'string') {
        value = sanitizers.sql(value);
      } else if (key === 'email') {
        value = sanitizers.email(value);
      } else if (key === 'phone') {
        value = sanitizers.phone(value);
      } else if (typeof value === 'string') {
        value = sanitizers.text(value);
      } else if (typeof value === 'object' && value !== null) {
        value = sanitizeObject(value, fields);
      }
      
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Export everything
module.exports = {
  schemas,
  sanitizers,
  validate,
  sanitize,
  customValidators
};