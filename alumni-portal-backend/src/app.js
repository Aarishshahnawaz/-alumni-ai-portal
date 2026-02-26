/**
 * AlumniAI Portal Backend Application
 * Production-ready Express.js application with enhanced security, logging, and architecture
 */

require('dotenv').config();

// Verify environment variables are loaded
console.log('');
console.log('🔍 Environment Variables Check:');
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
console.log('🔑 EMAIL_PASS configured:', !!process.env.EMAIL_PASS);
console.log('');

if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
  console.log('⚠️  WARNING: EMAIL_USER not configured!');
  console.log('⚠️  Update .env file with real Gmail credentials');
  console.log('⚠️  OTP emails will FAIL until configured');
  console.log('');
}

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

// Import core modules
const { logger } = require('./core/logger');
const connectDB = require('./config/database');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { 
  generalLimiter, 
  authLimiter, 
  adminLimiter,
  fileUploadLimiter,
  helmetConfig, 
  corsOptions, 
  requestId, 
  extractIP,
  sanitizeInput,
  requestLogger,
  securityHeaders,
  requestSizeLimiter,
  suspiciousActivityDetector
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/authRoutes');
const preRegistrationRoutes = require('./routes/preRegistrationRoutes');
const alumniRoutes = require('./routes/alumniRoutes');
const mentorshipRoutes = require('./routes/mentorshipRoutes');
const jobRoutes = require('./routes/jobRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const testRoutes = require('./routes/testRoutes');

// Initialize express app
const app = express();
const appLogger = logger.child('App');

// Connect to database
connectDB();

// Trust proxy for accurate IP detection (important for load balancers)
app.set('trust proxy', 1);

// Disable x-powered-by header for security
app.disable('x-powered-by');

// Request ID and IP extraction (must be first)
app.use(requestId);
app.use(extractIP);

// Security middleware (order matters)
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(securityHeaders);
app.use(requestSizeLimiter);

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 100 // Prevent parameter pollution
}));

// Input sanitization (after body parsing)
app.use(sanitizeInput);
app.use(suspiciousActivityDetector);

// Compression middleware
app.use(require('compression')({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    // Don't compress if the request includes a Cache-Control no-transform directive
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    return require('compression').filter(req, res);
  }
}));

// Request logging
app.use(requestLogger);

// Static file serving with security headers and CORS
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://localhost:3000',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
  }
}));

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => {
  const healthData = {
    success: true,
    message: 'AlumniAI Portal Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    database: 'connected', // This could be enhanced to check actual DB connection
  };

  res.status(200).json(healthData);
});

// Rate limiting (applied to API routes only)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh-token', authLimiter);
// Temporarily disabled rate limiting for debugging OTP
// app.use('/api/pre-registration/send-otp', authLimiter);
// app.use('/api/pre-registration/verify-otp', authLimiter);
app.use('/api/resumes/upload', fileUploadLimiter);
app.use('/api/admin', adminLimiter);
app.use('/api/', generalLimiter);

// API routes with versioning
const API_VERSION = '/api/v1';

app.use('/api/auth', authRoutes);
app.use('/api/pre-registration', preRegistrationRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/test', testRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'AlumniAI Portal API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      alumni: '/api/alumni',
      mentorship: '/api/mentorship',
      jobs: '/api/jobs',
      resumes: '/api/resumes',
      admin: '/api/admin',
      health: '/health'
    },
    rateLimit: {
      general: '100 requests per 15 minutes',
      auth: '5 requests per 15 minutes',
      admin: '50 requests per 15 minutes',
      fileUpload: '10 requests per hour'
    }
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  appLogger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      appLogger.error('Error during server shutdown', err);
      process.exit(1);
    }
    
    appLogger.info('HTTP server closed');
    
    // Close database connection
    require('mongoose').connection.close(() => {
      appLogger.info('Database connection closed');
      process.exit(0);
    });
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    appLogger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle 404 errors
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
🚀 AlumniAI Portal Backend Server Started
📍 Environment: ${process.env.NODE_ENV}
🌐 Port: ${PORT}
📊 Health Check: http://localhost:${PORT}/health
📚 API Base: http://localhost:${PORT}/api
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', err);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  appLogger.error('Uncaught Exception', err);
  process.exit(1);
});

// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;