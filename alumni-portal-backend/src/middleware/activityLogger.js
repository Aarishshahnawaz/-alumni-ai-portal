const ActivityLog = require('../models/ActivityLog');

// Activity logging middleware
const logActivity = (action, resource, category = 'api_access', options = {}) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Store original res.json to capture response
    const originalJson = res.json;
    let responseData = null;
    let statusCode = null;

    res.json = function(data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson.call(this, data);
    };

    // Continue with the request
    next();

    // Log after response is sent
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const success = statusCode >= 200 && statusCode < 400;
        
        const logData = {
          userId: req.user ? req.user._id : null,
          action: action,
          resource: resource,
          resourceId: options.getResourceId ? options.getResourceId(req, res) : null,
          category: category,
          level: success ? 'info' : 'error',
          success: success,
          details: {
            ...options.getDetails ? options.getDetails(req, res, responseData) : {},
            requestBody: options.logRequestBody ? sanitizeRequestBody(req.body) : undefined,
            queryParams: Object.keys(req.query).length > 0 ? req.query : undefined
          },
          metadata: {
            ipAddress: getClientIP(req),
            userAgent: req.get('User-Agent') || 'unknown',
            requestId: req.id || null,
            sessionId: req.sessionID || null,
            duration: duration,
            statusCode: statusCode,
            method: req.method,
            endpoint: req.originalUrl
          },
          errorMessage: !success && responseData ? responseData.message : null
        };

        await ActivityLog.createLog(logData);
      } catch (error) {
        console.error('Failed to log activity:', error);
      }
    });
  };
};

// Automatic activity logging for specific actions
const autoLogActivity = async (userId, action, resource, details = {}, req = null) => {
  try {
    const logData = {
      userId: userId,
      action: action,
      resource: resource,
      category: getCategoryByAction(action),
      level: 'info',
      success: true,
      details: details,
      metadata: req ? {
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent') || 'unknown',
        requestId: req.id || null,
        sessionId: req.sessionID || null,
        method: req.method,
        endpoint: req.originalUrl
      } : {
        ipAddress: 'system',
        userAgent: 'system',
        method: 'SYSTEM',
        endpoint: 'internal'
      }
    };

    await ActivityLog.createLog(logData);
  } catch (error) {
    console.error('Failed to auto-log activity:', error);
  }
};

// Log authentication events
const logAuthActivity = (action) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    const originalJson = res.json;
    let responseData = null;
    let statusCode = null;

    res.json = function(data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson.call(this, data);
    };

    next();

    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const success = statusCode >= 200 && statusCode < 400;
        
        let userId = null;
        let details = {};

        if (action === 'user_register' && success && responseData && responseData.data) {
          userId = responseData.data.user ? responseData.data.user._id : null;
          details = {
            email: responseData.data.user ? responseData.data.user.email : null,
            role: responseData.data.user ? responseData.data.user.role : null
          };
        } else if (action === 'user_login' && success && responseData && responseData.data) {
          userId = responseData.data.user ? responseData.data.user._id : null;
          details = {
            email: responseData.data.user ? responseData.data.user.email : null,
            role: responseData.data.user ? responseData.data.user.role : null
          };
        } else if (req.user) {
          userId = req.user._id;
          details = {
            email: req.user.email,
            role: req.user.role
          };
        }

        const logData = {
          userId: userId,
          action: action,
          resource: 'authentication',
          category: 'authentication',
          level: success ? 'info' : 'warn',
          success: success,
          details: details,
          metadata: {
            ipAddress: getClientIP(req),
            userAgent: req.get('User-Agent') || 'unknown',
            requestId: req.id || null,
            sessionId: req.sessionID || null,
            duration: duration,
            statusCode: statusCode,
            method: req.method,
            endpoint: req.originalUrl
          },
          errorMessage: !success && responseData ? responseData.message : null
        };

        await ActivityLog.createLog(logData);
      } catch (error) {
        console.error('Failed to log auth activity:', error);
      }
    });
  };
};

// Helper functions
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
};

const sanitizeRequestBody = (body) => {
  if (!body) return undefined;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'confirmPassword', 'token', 'refreshToken', 'oldPassword', 'newPassword'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

const getCategoryByAction = (action) => {
  const categoryMap = {
    'user_register': 'authentication',
    'user_login': 'authentication',
    'user_logout': 'authentication',
    'profile_update': 'profile_management',
    'profile_view': 'profile_management',
    'password_change': 'security',
    'email_verify': 'authentication',
    'account_deactivate': 'user_management',
    'account_activate': 'user_management',
    'role_change': 'user_management',
    'data_export': 'data_access',
    'data_import': 'data_access',
    'search_alumni': 'business_logic',
    'connect_request': 'business_logic',
    'mentorship_request': 'business_logic',
    'job_post_create': 'business_logic',
    'job_post_view': 'business_logic',
    'career_prediction': 'business_logic',
    'skill_assessment': 'business_logic',
    'notification_send': 'notification',
    'file_upload': 'file_management',
    'file_download': 'file_management',
    'api_access': 'api_access',
    'security_violation': 'security'
  };
  
  return categoryMap[action] || 'system';
};

module.exports = {
  logActivity,
  autoLogActivity,
  logAuthActivity
};