const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Made optional for pre-registration activities
    default: null,
    index: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'user_register',
      'user_login',
      'user_logout',
      'profile_update',
      'profile_view',
      'password_change',
      'password_reset',
      'email_verify',
      'send_registration_otp',
      'verify_registration_otp',
      'resend_registration_otp',
      'account_deactivate',
      'account_activate',
      'role_change',
      'data_export',
      'data_import',
      'search_alumni',
      'connect_request',
      'mentorship_request',
      'job_post_create',
      'job_post_view',
      'career_prediction',
      'skill_assessment',
      'notification_send',
      'file_upload',
      'file_download',
      'profile_image_update',
      'api_access',
      'security_violation'
    ]
  },
  resource: {
    type: String,
    required: true,
    trim: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    ipAddress: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          // Basic IP validation (IPv4 and IPv6)
          const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
          return ipv4Regex.test(v) || ipv6Regex.test(v) || v === '::1' || v === 'localhost';
        },
        message: 'Invalid IP address format'
      }
    },
    userAgent: {
      type: String,
      required: true,
      maxlength: [500, 'User agent cannot exceed 500 characters']
    },
    requestId: {
      type: String,
      default: null
    },
    sessionId: {
      type: String,
      default: null
    },
    duration: {
      type: Number,
      default: null,
      min: [0, 'Duration cannot be negative']
    },
    statusCode: {
      type: Number,
      default: null,
      min: [100, 'Invalid status code'],
      max: [599, 'Invalid status code']
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      default: null
    },
    endpoint: {
      type: String,
      default: null
    }
  },
  level: {
    type: String,
    enum: ['info', 'warn', 'error', 'debug'],
    default: 'info'
  },
  category: {
    type: String,
    enum: [
      'authentication',
      'authorization',
      'user_management',
      'profile_management',
      'security',
      'api_access',
      'data_access',
      'system',
      'business_logic',
      'file_management',
      'notification',
      'integration'
    ],
    required: true
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    default: null,
    maxlength: [1000, 'Error message cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ level: 1, createdAt: -1 });
activityLogSchema.index({ success: 1, createdAt: -1 });
activityLogSchema.index({ 'metadata.ipAddress': 1 });
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days retention

// Static methods for common queries
activityLogSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'email profile.firstName profile.lastName role');
};

activityLogSchema.statics.findByAction = function(action, limit = 100) {
  return this.find({ action })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'email profile.firstName profile.lastName role');
};

activityLogSchema.statics.findSecurityEvents = function(limit = 100) {
  return this.find({ 
    $or: [
      { category: 'security' },
      { success: false, category: 'authentication' },
      { level: 'error' }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'email profile.firstName profile.lastName role');
};

activityLogSchema.statics.getActivityStats = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastActivity: { $max: '$createdAt' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Method to create activity log entry
activityLogSchema.statics.createLog = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create activity log:', error);
    // Don't throw error to prevent breaking main functionality
    return null;
  }
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);