const winston = require('winston');
const { format } = winston;

// Enterprise-grade logging configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { 
    service: 'finsight-intelligence',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, service, ...meta }) => {
          return `${timestamp} [${service}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      )
    })
  ]
});

// Add file transport for production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 10485760, // 10MB
    maxFiles: 10,
    tailable: true
  }));
}

// Create a child logger for specific modules
logger.child = function(metadata) {
  return winston.createLogger({
    level: this.level,
    format: this.format,
    defaultMeta: { ...this.defaultMeta, ...metadata },
    transports: this.transports
  });
};

// Audit logger for security events
const auditLogger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  defaultMeta: { 
    type: 'audit',
    service: 'finsight-intelligence'
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/audit.log',
      maxsize: 10485760,
      maxFiles: 30,
      tailable: true
    })
  ]
});

// Performance logger
const performanceLogger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  defaultMeta: { 
    type: 'performance',
    service: 'finsight-intelligence'
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/performance.log',
      maxsize: 10485760,
      maxFiles: 7,
      tailable: true
    })
  ]
});

module.exports = {
  logger,
  auditLogger,
  performanceLogger
};