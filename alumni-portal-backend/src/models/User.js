const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'alumni', 'admin'],
    default: 'student',
    required: true
  },
  profile: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },
    phone: {
      type: String,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    dateOfBirth: {
      type: Date
    },
    graduationYear: {
      type: Number,
      min: [1950, 'Graduation year must be after 1950'],
      max: [new Date().getFullYear() + 10, 'Invalid graduation year']
    },
    degree: {
      type: String,
      trim: true
    },
    major: {
      type: String,
      trim: true
    },
    currentPosition: {
      type: String,
      trim: true
    },
    currentCompany: {
      type: String,
      trim: true
    },
    company: {
      type: String,
      trim: true
    },
    location: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    skills: [{
      type: String,
      trim: true
    }],
    interests: [{
      type: String,
      trim: true
    }],
    linkedin: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function(v) {
          // Allow empty, null, or undefined
          if (!v) return true;
          return /^https?:\/\/(www\.)?linkedin\.com\/.+$/.test(v);
        },
        message: 'Please enter a valid LinkedIn URL'
      }
    },
    github: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function(v) {
          // Allow empty, null, or undefined
          if (!v) return true;
          return /^https?:\/\/(www\.)?github\.com\/.+$/.test(v);
        },
        message: 'Please enter a valid GitHub URL'
      }
    },
    socialLinks: {
      linkedin: String,
      github: String,
      twitter: String,
      website: String
    }
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    mentorshipAlerts: {
      type: Boolean,
      default: true
    },
    jobAlerts: {
      type: Boolean,
      default: true
    },
    profileVisibility: {
      type: String,
      enum: ['public', 'alumni', 'private'],
      default: 'public'
    },
    allowMentorRequests: {
      type: Boolean,
      default: true
    },
    mentorshipAvailable: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 2592000 // 30 days
    }
  }],
  resetOTP: {
    type: String,
    select: false
  },
  resetOTPExpiry: {
    type: Date,
    select: false
  },
  resetOTPAttempts: {
    type: Number,
    default: 0,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('profile.fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'profile.graduationYear': 1 });
userSchema.index({ 'profile.skills': 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshTokens;
  return userObject;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('User', userSchema);