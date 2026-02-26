const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Temporary Email Verification Schema
 * Stores OTP for email verification BEFORE user registration
 */
const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  role: {
    type: String,
    enum: ['student', 'alumni'],
    required: true
  },
  otp: {
    type: String,
    required: true,
    select: false // Don't return OTP in queries by default
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum 5 attempts
  },
  resendCount: {
    type: Number,
    default: 0,
    max: 3 // Maximum 3 resends per hour
  },
  lastResendAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index - MongoDB will auto-delete expired documents
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
emailVerificationSchema.index({ email: 1, verified: 1 });
emailVerificationSchema.index({ expiresAt: 1 });

// Pre-save middleware to hash OTP
emailVerificationSchema.pre('save', async function(next) {
  // Only hash OTP if it's modified
  if (!this.isModified('otp')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare OTP
emailVerificationSchema.methods.compareOTP = async function(candidateOTP) {
  try {
    return await bcrypt.compare(candidateOTP, this.otp);
  } catch (error) {
    throw new Error('OTP comparison failed');
  }
};

// Static method to clean up old records
emailVerificationSchema.statics.cleanupExpired = async function() {
  const now = new Date();
  await this.deleteMany({ expiresAt: { $lt: now } });
};

// Static method to check resend limit
emailVerificationSchema.statics.canResend = function(verification) {
  if (!verification.lastResendAt) return true;
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // Reset counter if last resend was more than 1 hour ago
  if (verification.lastResendAt < oneHourAgo) {
    return true;
  }
  
  // Check if under limit
  return verification.resendCount < 3;
};

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
