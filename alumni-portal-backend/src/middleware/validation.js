/**
 * Enhanced Input Validation Middleware
 * Comprehensive validation with security, performance, and user experience considerations
 */

const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');
const { logger } = require('../core/logger');

const validationLogger = logger.child('Validation');

/**
 * Custom validation result handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    console.error('❌ Validation failed:', JSON.stringify(errorDetails, null, 2));
    console.error('Request body:', JSON.stringify(req.body, null, 2));

    validationLogger.warn('Validation failed', {
      requestId: req.requestId,
      url: req.originalUrl,
      method: req.method,
      errors: errorDetails,
      ip: req.ip,
    });

    const firstError = errorDetails[0];
    
    return res.status(400).json({
      success: false,
      message: `Validation failed: ${firstError.field} - ${firstError.message}`,
      errors: errorDetails
    });
  }
  
  next();
};

/**
 * Common validation rules
 */
const commonValidations = {
  // Email validation with comprehensive regex
  email: body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail({
      gmail_lowercase: true,
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
    })
    .isLength({ max: 254 })
    .withMessage('Email must not exceed 254 characters')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('Email format is invalid'),

  // Strong password validation
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),

  // Name validation with sanitization
  firstName: body('profile.firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes')
    .escape(),

  lastName: body('profile.lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes')
    .escape(),

  // Phone number validation (international format)
  phone: body('profile.phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Phone number must be in international format (+1234567890)')
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters'),

  // Role validation
  role: body('role')
    .isIn(['student', 'alumni', 'admin'])
    .withMessage('Role must be one of: student, alumni, admin'),

  // Graduation year validation
  graduationYear: body('profile.graduationYear')
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() + 10 })
    .withMessage(`Graduation year must be between 1950 and ${new Date().getFullYear() + 10}`),

  // Bio validation with HTML sanitization
  bio: body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters')
    .escape(),

  // Skills array validation
  skills: body('profile.skills')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Skills must be an array with maximum 50 items')
    .custom((skills) => {
      if (skills && skills.length > 0) {
        for (const skill of skills) {
          if (typeof skill !== 'string' || skill.length > 50 || skill.length < 1) {
            throw new Error('Each skill must be a string between 1 and 50 characters');
          }
          if (!/^[a-zA-Z0-9\s+#.-]+$/.test(skill)) {
            throw new Error('Skills can only contain letters, numbers, spaces, and common symbols (+, #, ., -)');
          }
        }
      }
      return true;
    }),

  // MongoDB ObjectId validation
  objectId: (field) => param(field)
    .isMongoId()
    .withMessage(`${field} must be a valid MongoDB ObjectId`),

  // Pagination validation
  page: query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer between 1 and 1000')
    .toInt(),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be a positive integer between 1 and 100')
    .toInt(),

  // Search query validation
  searchQuery: query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s.-]+$/)
    .withMessage('Search query can only contain letters, numbers, spaces, dots, and hyphens')
    .escape(),

  // Date validation
  dateOfBirth: body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid ISO 8601 date')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 100, 0, 1);
      const maxDate = new Date(now.getFullYear() - 13, 0, 1);
      
      if (date < minDate || date > maxDate) {
        throw new Error('Date of birth must be between 100 years ago and 13 years ago');
      }
      return true;
    }),

  // Location validation
  location: [
    body('profile.location.city')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('City must not exceed 100 characters')
      .matches(/^[a-zA-Z\s.-]+$/)
      .withMessage('City can only contain letters, spaces, dots, and hyphens')
      .escape(),
    
    body('profile.location.state')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('State must not exceed 100 characters')
      .matches(/^[a-zA-Z\s.-]+$/)
      .withMessage('State can only contain letters, spaces, dots, and hyphens')
      .escape(),
    
    body('profile.location.country')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Country must not exceed 100 characters')
      .matches(/^[a-zA-Z\s.-]+$/)
      .withMessage('Country can only contain letters, spaces, dots, and hyphens')
      .escape(),
  ],
};

/**
 * Registration validation
 */
const validateRegistration = [
  commonValidations.email,
  commonValidations.password,
  commonValidations.role,
  commonValidations.firstName,
  commonValidations.lastName,
  commonValidations.phone,
  commonValidations.graduationYear,
  commonValidations.bio,
  commonValidations.skills,
  commonValidations.dateOfBirth,
  ...commonValidations.location,
  
  // Additional registration-specific validations
  body('profile.degree')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Degree must not exceed 100 characters')
    .matches(/^[a-zA-Z\s.-]+$/)
    .withMessage('Degree can only contain letters, spaces, dots, and hyphens')
    .escape(),
  
  body('profile.major')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Major must not exceed 100 characters')
    .matches(/^[a-zA-Z\s.-]+$/)
    .withMessage('Major can only contain letters, spaces, dots, and hyphens')
    .escape(),
  
  handleValidationErrors,
];

/**
 * Login validation
 */
const validateLogin = [
  commonValidations.email,
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 128 })
    .withMessage('Password must not exceed 128 characters'),
  
  handleValidationErrors,
];

/**
 * Profile update validation (supports partial updates)
 */
const validateProfileUpdate = [
  // Make all profile fields optional for partial updates
  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),

  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),

  body('profile.phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters'),

  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),

  body('profile.skills')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Skills must be an array with maximum 50 items'),

  body('profile.location')
    .optional(),

  body('profile.currentPosition')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Current position must not exceed 100 characters'),
  
  body('profile.company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company must not exceed 100 characters'),

  body('profile.currentCompany')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Current company must not exceed 100 characters'),

  body('profile.graduationYear')
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() + 10 })
    .withMessage(`Graduation year must be between 1950 and ${new Date().getFullYear() + 10}`),

  body('profile.linkedin')
    .optional()
    .trim(),

  body('profile.github')
    .optional()
    .trim(),

  // Preferences validation (all optional for partial updates)
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark'),

  body('preferences.emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),

  body('preferences.mentorshipAlerts')
    .optional()
    .isBoolean()
    .withMessage('Mentorship alerts must be a boolean'),

  body('preferences.jobAlerts')
    .optional()
    .isBoolean()
    .withMessage('Job alerts must be a boolean'),

  body('preferences.profileVisibility')
    .optional()
    .isIn(['public', 'alumni', 'private'])
    .withMessage('Profile visibility must be one of: public, alumni, private'),

  body('preferences.allowMentorRequests')
    .optional()
    .isBoolean()
    .withMessage('Allow mentor requests must be a boolean'),
  
  handleValidationErrors,
];

/**
 * Password change validation
 */
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors,
];

/**
 * Refresh token validation
 */
const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isJWT()
    .withMessage('Invalid refresh token format'),
  
  handleValidationErrors,
];

/**
 * Job posting validation
 */
const validateJobPosting = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Job title must be between 5 and 200 characters')
    .escape(),
  
  body('description')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Job description must be between 50 and 5000 characters')
    .escape(),
  
  body('company.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters')
    .escape(),
  
  body('requirements')
    .isArray({ min: 1, max: 20 })
    .withMessage('Requirements must be an array with 1-20 items')
    .custom((requirements) => {
      for (const req of requirements) {
        if (typeof req !== 'string' || req.length > 100 || req.length < 1) {
          throw new Error('Each requirement must be a string between 1 and 100 characters');
        }
      }
      return true;
    }),
  
  body('employment.type')
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance'])
    .withMessage('Employment type must be one of: full-time, part-time, contract, internship, freelance'),
  
  body('employment.salary.min')
    .optional()
    .isInt({ min: 0, max: 10000000 })
    .withMessage('Minimum salary must be between 0 and 10,000,000'),
  
  body('employment.salary.max')
    .optional()
    .isInt({ min: 0, max: 10000000 })
    .withMessage('Maximum salary must be between 0 and 10,000,000')
    .custom((value, { req }) => {
      if (req.body.employment?.salary?.min && value < req.body.employment.salary.min) {
        throw new Error('Maximum salary must be greater than minimum salary');
      }
      return true;
    }),
  
  handleValidationErrors,
];

/**
 * Mentorship request validation
 */
const validateMentorshipRequest = [
  commonValidations.objectId('mentorId'),
  
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters')
    .escape(),
  
  body('areasOfInterest')
    .isArray({ min: 1, max: 10 })
    .withMessage('Areas of interest must be an array with 1-10 items')
    .custom((areas) => {
      const validAreas = [
        'Career Guidance', 'Technical Skills', 'Industry Insights',
        'Networking', 'Interview Preparation', 'Resume Review',
        'Entrepreneurship', 'Leadership', 'Work-Life Balance',
        'Professional Development'
      ];
      
      for (const area of areas) {
        if (!validAreas.includes(area)) {
          throw new Error(`Invalid area of interest: ${area}`);
        }
      }
      return true;
    }),
  
  handleValidationErrors,
];

/**
 * File upload validation
 */
const validateFileUpload = [
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('File description must not exceed 500 characters')
    .escape(),
  
  handleValidationErrors,
];

/**
 * Admin user management validation
 */
const validateUserManagement = [
  commonValidations.objectId('userId'),
  
  body('action')
    .isIn(['activate', 'deactivate', 'change_role', 'delete'])
    .withMessage('Action must be one of: activate, deactivate, change_role, delete'),
  
  body('newRole')
    .if(body('action').equals('change_role'))
    .isIn(['student', 'alumni', 'admin'])
    .withMessage('New role must be one of: student, alumni, admin'),
  
  handleValidationErrors,
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateRefreshToken,
  validateJobPosting,
  validateMentorshipRequest,
  validateFileUpload,
  validateUserManagement,
  handleValidationErrors,
  commonValidations,
};


// Additional validation helpers
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    next();
  };
};

const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Invalid pagination parameters'
    });
  }
  
  req.pagination = { page, limit };
  next();
};

const validateAlumniSearch = (req, res, next) => {
  // Optional validation for search parameters
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateRefreshToken,
  validateJobPosting,
  validateMentorshipRequest,
  validateFileUpload,
  validateUserManagement,
  handleValidationErrors,
  commonValidations,
  validateObjectId,
  validatePagination,
  validateAlumniSearch,
};


const validateMentorshipResponse = (req, res, next) => {
  const { status, message } = req.body;
  if (!status || !['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be accepted or rejected'
    });
  }
  next();
};

const validateJobUpdate = (req, res, next) => {
  next();
};

const validateResumeAnalysis = (req, res, next) => {
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateRefreshToken,
  validateJobPosting,
  validateMentorshipRequest,
  validateFileUpload,
  validateUserManagement,
  handleValidationErrors,
  commonValidations,
  validateObjectId,
  validatePagination,
  validateAlumniSearch,
  validateMentorshipResponse,
  validateJobUpdate,
  validateResumeAnalysis,
};


const validateMeeting = (req, res, next) => {
  next();
};

const validateFeedback = (req, res, next) => {
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateRefreshToken,
  validateJobPosting,
  validateMentorshipRequest,
  validateFileUpload,
  validateUserManagement,
  handleValidationErrors,
  commonValidations,
  validateObjectId,
  validatePagination,
  validateAlumniSearch,
  validateMentorshipResponse,
  validateJobUpdate,
  validateResumeAnalysis,
  validateMeeting,
  validateFeedback,
};


const validateJobSearch = (req, res, next) => {
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateRefreshToken,
  validateJobPosting,
  validateMentorshipRequest,
  validateFileUpload,
  validateUserManagement,
  handleValidationErrors,
  commonValidations,
  validateObjectId,
  validatePagination,
  validateAlumniSearch,
  validateMentorshipResponse,
  validateJobUpdate,
  validateResumeAnalysis,
  validateMeeting,
  validateFeedback,
  validateJobSearch,
};


const validateDateRange = (req, res, next) => {
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateRefreshToken,
  validateJobPosting,
  validateMentorshipRequest,
  validateFileUpload,
  validateUserManagement,
  handleValidationErrors,
  commonValidations,
  validateObjectId,
  validatePagination,
  validateAlumniSearch,
  validateMentorshipResponse,
  validateJobUpdate,
  validateResumeAnalysis,
  validateMeeting,
  validateFeedback,
  validateJobSearch,
  validateDateRange,
};
