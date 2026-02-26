const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true,
    index: true
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required'],
    trim: true,
    maxlength: [255, 'Original file name cannot exceed 255 characters']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
    trim: true
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative'],
    max: [10485760, 'File size cannot exceed 10MB'] // 10MB limit
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    enum: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    validate: {
      validator: function(v) {
        return ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(v);
      },
      message: 'Only PDF, DOC, and DOCX files are allowed'
    }
  },
  extractedText: {
    type: String,
    default: null,
    maxlength: [50000, 'Extracted text cannot exceed 50000 characters']
  },
  parsedData: {
    personalInfo: {
      name: String,
      email: String,
      phone: String,
      address: String,
      linkedin: String,
      github: String,
      website: String
    },
    summary: {
      type: String,
      maxlength: [2000, 'Summary cannot exceed 2000 characters']
    },
    skills: [{
      name: {
        type: String,
        trim: true,
        maxlength: [100, 'Skill name cannot exceed 100 characters']
      },
      category: {
        type: String,
        enum: ['technical', 'soft', 'language', 'certification', 'other'],
        default: 'technical'
      },
      proficiency: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
      }
    }],
    experience: [{
      company: {
        type: String,
        trim: true,
        maxlength: [200, 'Company name cannot exceed 200 characters']
      },
      position: {
        type: String,
        trim: true,
        maxlength: [200, 'Position cannot exceed 200 characters']
      },
      startDate: Date,
      endDate: Date,
      current: {
        type: Boolean,
        default: false
      },
      description: {
        type: String,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
      },
      achievements: [{
        type: String,
        maxlength: [500, 'Achievement cannot exceed 500 characters']
      }]
    }],
    education: [{
      institution: {
        type: String,
        trim: true,
        maxlength: [200, 'Institution name cannot exceed 200 characters']
      },
      degree: {
        type: String,
        trim: true,
        maxlength: [200, 'Degree cannot exceed 200 characters']
      },
      field: {
        type: String,
        trim: true,
        maxlength: [200, 'Field of study cannot exceed 200 characters']
      },
      startDate: Date,
      endDate: Date,
      gpa: {
        type: Number,
        min: [0, 'GPA cannot be negative'],
        max: [4.0, 'GPA cannot exceed 4.0']
      },
      honors: [{
        type: String,
        maxlength: [200, 'Honor cannot exceed 200 characters']
      }]
    }],
    certifications: [{
      name: {
        type: String,
        trim: true,
        maxlength: [200, 'Certification name cannot exceed 200 characters']
      },
      issuer: {
        type: String,
        trim: true,
        maxlength: [200, 'Issuer cannot exceed 200 characters']
      },
      issueDate: Date,
      expiryDate: Date,
      credentialId: {
        type: String,
        trim: true,
        maxlength: [100, 'Credential ID cannot exceed 100 characters']
      },
      url: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'URL must be valid'
        }
      }
    }],
    projects: [{
      name: {
        type: String,
        trim: true,
        maxlength: [200, 'Project name cannot exceed 200 characters']
      },
      description: {
        type: String,
        maxlength: [1000, 'Project description cannot exceed 1000 characters']
      },
      technologies: [{
        type: String,
        trim: true,
        maxlength: [50, 'Technology cannot exceed 50 characters']
      }],
      url: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'URL must be valid'
        }
      },
      github: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^https?:\/\/.+/.test(v);
          },
          message: 'GitHub URL must be valid'
        }
      },
      startDate: Date,
      endDate: Date
    }],
    languages: [{
      name: {
        type: String,
        trim: true,
        maxlength: [50, 'Language name cannot exceed 50 characters']
      },
      proficiency: {
        type: String,
        enum: ['basic', 'conversational', 'fluent', 'native'],
        default: 'conversational'
      }
    }]
  },
  analysisResults: {
    skillsExtracted: [{
      type: String,
      trim: true
    }],
    experienceYears: {
      type: Number,
      min: [0, 'Experience years cannot be negative']
    },
    educationLevel: {
      type: String,
      enum: ['high-school', 'associate', 'bachelor', 'master', 'doctorate', 'other']
    },
    industryExperience: [{
      industry: String,
      years: Number
    }],
    keywordDensity: [{
      keyword: String,
      count: Number,
      percentage: Number
    }],
    atsScore: {
      type: Number,
      min: [0, 'ATS score cannot be negative'],
      max: [100, 'ATS score cannot exceed 100']
    },
    suggestions: [{
      type: String,
      maxlength: [500, 'Suggestion cannot exceed 500 characters']
    }]
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  processingError: {
    type: String,
    default: null,
    maxlength: [1000, 'Processing error cannot exceed 1000 characters']
  },
  version: {
    type: Number,
    default: 1,
    min: [1, 'Version must be at least 1']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: [0, 'Download count cannot be negative']
  },
  lastDownloaded: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
resumeSchema.index({ user: 1, isActive: 1 });
resumeSchema.index({ processingStatus: 1, createdAt: -1 });
resumeSchema.index({ 'parsedData.skills.name': 1 });
resumeSchema.index({ 'analysisResults.skillsExtracted': 1 });
resumeSchema.index({ 'analysisResults.experienceYears': 1 });

// Virtual for file extension
resumeSchema.virtual('fileExtension').get(function() {
  return this.originalName.split('.').pop().toLowerCase();
});

// Virtual for file size in MB
resumeSchema.virtual('fileSizeMB').get(function() {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Virtual for processing age
resumeSchema.virtual('processingAge').get(function() {
  if (this.processingStatus === 'completed') return null;
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60)); // in minutes
});

// Pre-save middleware
resumeSchema.pre('save', function(next) {
  // Update version when parsedData is modified
  if (this.isModified('parsedData') && !this.isNew) {
    this.version += 1;
  }
  
  next();
});

// Static methods
resumeSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId, isActive: true });
};

resumeSchema.statics.findPendingProcessing = function() {
  return this.find({ 
    processingStatus: { $in: ['pending', 'processing'] },
    isActive: true 
  }).sort({ createdAt: 1 });
};

resumeSchema.statics.searchBySkills = function(skills) {
  return this.find({
    isActive: true,
    processingStatus: 'completed',
    $or: [
      { 'parsedData.skills.name': { $in: skills.map(skill => new RegExp(skill, 'i')) } },
      { 'analysisResults.skillsExtracted': { $in: skills.map(skill => new RegExp(skill, 'i')) } }
    ]
  }).populate('user', 'profile.firstName profile.lastName profile.currentPosition profile.company email');
};

resumeSchema.statics.getSkillsDistribution = function() {
  return this.aggregate([
    {
      $match: {
        isActive: true,
        processingStatus: 'completed'
      }
    },
    {
      $unwind: '$analysisResults.skillsExtracted'
    },
    {
      $group: {
        _id: { $toLower: '$analysisResults.skillsExtracted' },
        count: { $sum: 1 },
        users: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        skill: '$_id',
        count: 1,
        userCount: { $size: '$users' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 50
    }
  ]);
};

resumeSchema.statics.getProcessingStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$processingStatus',
        count: { $sum: 1 },
        avgProcessingTime: {
          $avg: {
            $cond: [
              { $eq: ['$processingStatus', 'completed'] },
              { $subtract: ['$updatedAt', '$createdAt'] },
              null
            ]
          }
        }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        avgProcessingTimeMinutes: {
          $divide: ['$avgProcessingTime', 1000 * 60]
        }
      }
    }
  ]);
};

// Instance methods
resumeSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  return this.save();
};

resumeSchema.methods.updateProcessingStatus = function(status, error = null) {
  this.processingStatus = status;
  if (error) {
    this.processingError = error;
  }
  return this.save();
};

module.exports = mongoose.model('Resume', resumeSchema);