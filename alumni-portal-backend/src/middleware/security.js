/**
 * Enhanced Security Middleware
 * Comprehensive security measures including rate limiting, input sanitization, and security headers
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../core/logger');

const securityLogger = logger.child('Security');

/**
 * Enhanced rate limiting with Redis store for production
 */
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests from this IP, please try again later.',
      retryAfter: Math.round(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      securityLogger.logSecurity('rate_limit_exceeded', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        limit: max,
        windowMs,
      });

      res.status(429).json({
        success: false,
        message: message || 'Too many requests from this IP, please try again later.',
        retryAfter: Math.round(windowMs / 1000),
        requestId: req.requestId,
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
  });
};

// General API rate limit - 100 requests per 15 minutes
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100,
  'Too many requests from this IP, please try again in 15 minutes.',
  true // Skip successful requests
);

// Strict rate limit for auth endpoints - 5 attempts per 15 minutes
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5,
  'Too many authentication attempts from this IP, please try again in 15 minutes.'
);

// Very strict rate limit for password reset - 3 attempts per hour
const passwordResetLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3,
  'Too many password reset attempts from this IP, please try again in 1 hour.'
);

// File upload rate limit - 10 uploads per hour
const fileUploadLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10,
  'Too many file uploads from this IP, please try again in 1 hour.'
);

// Admin endpoints rate limit - 50 requests per 15 minutes
const adminLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  50,
  'Too many admin requests from this IP, please try again in 15 minutes.'
);

/**
 * Enhanced Helmet configuration for security headers
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:5000"], // Allow images from backend
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.CORS_ORIGIN || "http://localhost:3000"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
  crossOriginResourcePolicy: false, // CRITICAL: Allow images to be loaded from different origin
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Enhanced CORS configuration
 */
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      'http://localhost:3001', // For development
    ];

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      securityLogger.logSecurity('cors_violation', {
        origin,
        allowedOrigins,
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-ID',
  ],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
};

/**
 * Request ID middleware for tracing
 */
const requestId = (req, res, next) => {
  req.requestId = req.get('X-Request-ID') || uuidv4();
  res.set('X-Request-ID', req.requestId);
  next();
};

/**
 * Enhanced IP extraction middleware
 */
const extractIP = (req, res, next) => {
  // Extract real IP from various headers (for proxy/load balancer setups)
  const forwarded = req.get('X-Forwarded-For');
  const realIP = req.get('X-Real-IP');
  const cfConnectingIP = req.get('CF-Connecting-IP'); // Cloudflare
  
  req.ip = cfConnectingIP || realIP || (forwarded && forwarded.split(',')[0]) || req.connection.remoteAddress;
  
  // Validate IP format
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  if (!ipRegex.test(req.ip) && req.ip !== '::1' && req.ip !== 'localhost') {
    securityLogger.warn('Invalid IP format detected', { ip: req.ip, originalIP: req.connection.remoteAddress });
    req.ip = req.connection.remoteAddress;
  }
  
  next();
};

/**
 * Input sanitization middleware
 */
const sanitizeInput = [
  // Prevent NoSQL injection
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      securityLogger.logSecurity('nosql_injection_attempt', {
        ip: req.ip,
        url: req.originalUrl,
        key,
        userAgent: req.get('User-Agent'),
      });
    },
  }),
  
  // Prevent XSS attacks
  xss(),
  
  // Prevent HTTP Parameter Pollution
  hpp({
    whitelist: ['skills', 'tags', 'categories'], // Allow arrays for these fields
  }),
];

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    securityLogger.logRequest(req, res, duration);
  });
  
  next();
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Additional security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  });
  
  next();
};

/**
 * Request size limiter
 */
const requestSizeLimiter = (req, res, next) => {
  const maxSize = parseInt(process.env.MAX_REQUEST_SIZE) || 10 * 1024 * 1024; // 10MB default
  
  if (req.get('content-length') && parseInt(req.get('content-length')) > maxSize) {
    securityLogger.logSecurity('request_size_exceeded', {
      ip: req.ip,
      size: req.get('content-length'),
      maxSize,
      url: req.originalUrl,
    });
    
    return res.status(413).json({
      success: false,
      message: 'Request entity too large',
    });
  }
  
  next();
};

/**
 * Suspicious activity detector
 */
const suspiciousActivityDetector = (req, res, next) => {
  const suspiciousPatterns = [
    /\b(union|select|insert|delete|drop|create|alter|exec|script)\b/i,
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];
  
  const checkString = JSON.stringify(req.body) + req.originalUrl + JSON.stringify(req.query);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      securityLogger.logSecurity('suspicious_activity_detected', {
        ip: req.ip,
        pattern: pattern.toString(),
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid request detected',
      });
    }
  }
  
  next();
};

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  fileUploadLimiter,
  adminLimiter,
  helmetConfig,
  corsOptions,
  requestId,
  extractIP,
  sanitizeInput,
  requestLogger,
  securityHeaders,
  requestSizeLimiter,
  suspiciousActivityDetector,
};