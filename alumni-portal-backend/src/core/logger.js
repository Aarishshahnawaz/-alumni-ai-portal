/**
 * Centralized logging system with structured logging
 * Provides consistent logging across the application with proper levels and formatting
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors for console output
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, requestId, userId, ...meta } = info;
    
    const logEntry = {
      timestamp,
      level,
      message,
      ...(requestId && { requestId }),
      ...(userId && { userId }),
      ...(Object.keys(meta).length > 0 && { meta }),
    };

    return JSON.stringify(logEntry);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, requestId, userId, ...meta } = info;
    
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    if (requestId) logMessage += ` [ReqID: ${requestId}]`;
    if (userId) logMessage += ` [UserID: ${userId}]`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

// Create transports
const transports = [
  // Console transport for development
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
  }),
];

// File transports for production
if (process.env.NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: logFormat,
  transports,
  exitOnError: false,
});

/**
 * Enhanced logger with context support
 */
class Logger {
  constructor(context = '') {
    this.context = context;
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext) {
    return new Logger(this.context ? `${this.context}:${additionalContext}` : additionalContext);
  }

  /**
   * Log with context and metadata
   */
  log(level, message, meta = {}) {
    const logMeta = {
      ...meta,
      ...(this.context && { context: this.context }),
    };

    logger.log(level, message, logMeta);
  }

  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    this.log('error', message, errorMeta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  http(message, meta = {}) {
    this.log('http', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  /**
   * Log API request
   */
  logRequest(req, res, responseTime) {
    const { method, originalUrl, ip, headers } = req;
    const { statusCode } = res;
    
    this.http('API Request', {
      method,
      url: originalUrl,
      statusCode,
      responseTime: `${responseTime}ms`,
      ip,
      userAgent: headers['user-agent'],
      requestId: req.requestId,
      userId: req.user?.id,
    });
  }

  /**
   * Log database operation
   */
  logDatabase(operation, collection, query = {}, result = {}) {
    this.debug('Database Operation', {
      operation,
      collection,
      query: JSON.stringify(query),
      resultCount: result.length || (result.acknowledged ? 1 : 0),
    });
  }

  /**
   * Log security event
   */
  logSecurity(event, details = {}) {
    this.warn('Security Event', {
      event,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log performance metric
   */
  logPerformance(metric, value, unit = 'ms') {
    this.info('Performance Metric', {
      metric,
      value,
      unit,
    });
  }
}

// Create default logger instance
const defaultLogger = new Logger('App');

// Export both the class and default instance
module.exports = {
  Logger,
  logger: defaultLogger,
  winstonLogger: logger,
};