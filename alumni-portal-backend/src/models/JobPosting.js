const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema({
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Posted by is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters'],
    index: 'text'
  },
  company: {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
      index: true
    },
    logo: {
      type: String,
      default: null
    },
    website: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Website must be a valid URL'
      }
    },
    size: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
      default: null
    },
    industry: {
      type: String,
      trim: true,
      maxlength: [100, 'Industry cannot exceed 100 characters']
    }
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Job description cannot exceed 5000 characters']
  },
  requirements: [{
    type: String,
    trim: true,
    maxlength: [500, 'Requirement cannot exceed 500 characters']
  }],
  responsibilities: [{
    type: String,
    trim: true,
    maxlength: [500, 'Responsibility cannot exceed 500 characters']
  }],
  skills: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Skill name cannot exceed 50 characters']
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    required: {
      type: Boolean,
      default: true
    }
  }],
  location: {
    type: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      required: true
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters']
    },
    timezone: {
      type: String,
      trim: true
    }
  },
  employment: {
    type: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
      required: true,
      index: true
    },
    duration: {
      type: String,
      trim: true // For contract/internship duration
    }
  },
  experience: {
    min: {
      type: Number,
      min: [0, 'Minimum experience cannot be negative'],
      max: [50, 'Minimum experience cannot exceed 50 years']
    },
    max: {
      type: Number,
      min: [0, 'Maximum experience cannot be negative'],
      max: [50, 'Maximum experience cannot exceed 50 years']
    },
    level: {
      type: String,
      enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
      index: true
    }
  },
  salary: {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      maxlength: [3, 'Currency code cannot exceed 3 characters']
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    },
    negotiable: {
      type: Boolean,
      default: true
    }
  },
  benefits: [{
    type: String,
    trim: true,
    maxlength: [200, 'Benefit cannot exceed 200 characters']
  }],
  applicationDeadline: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > new Date();
      },
      message: 'Application deadline must be in the future'
    },
    index: true
  },
  applicationMethod: {
    type: {
      type: String,
      enum: ['email', 'website', 'platform'],
      required: true
    },
    contact: {
      type: String,
      required: true,
      trim: true
    },
    instructions: {
      type: String,
      maxlength: [1000, 'Application instructions cannot exceed 1000 characters']
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters'],
    index: true
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'expired'],
    default: 'active',
    index: true
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  applications: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['applied', 'reviewed', 'shortlisted', 'interviewed', 'rejected', 'hired'],
      default: 'applied'
    },
    notes: {
      type: String,
      maxlength: [1000, 'Application notes cannot exceed 1000 characters']
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiry: 90 days from creation
      return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    },
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Text index for search functionality
jobPostingSchema.index({
  title: 'text',
  'company.name': 'text',
  description: 'text',
  'skills.name': 'text',
  tags: 'text'
});

// Compound indexes for efficient queries
jobPostingSchema.index({ status: 1, createdAt: -1 });
jobPostingSchema.index({ 'employment.type': 1, status: 1 });
jobPostingSchema.index({ 'location.type': 1, status: 1 });
jobPostingSchema.index({ featured: 1, status: 1, createdAt: -1 });
jobPostingSchema.index({ postedBy: 1, status: 1 });
jobPostingSchema.index({ applicationDeadline: 1, status: 1 });

// Virtual for application count
jobPostingSchema.virtual('applicationCount').get(function() {
  return this.applications.length;
});

// Virtual for days remaining
jobPostingSchema.virtual('daysRemaining').get(function() {
  if (!this.applicationDeadline) return null;
  const diff = this.applicationDeadline - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual for job age
jobPostingSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
jobPostingSchema.pre('save', function(next) {
  // Validate salary range
  if (this.salary.min && this.salary.max && this.salary.min > this.salary.max) {
    return next(new Error('Minimum salary cannot be greater than maximum salary'));
  }
  
  // Validate experience range
  if (this.experience.min && this.experience.max && this.experience.min > this.experience.max) {
    return next(new Error('Minimum experience cannot be greater than maximum experience'));
  }
  
  // Auto-expire jobs past deadline
  if (this.applicationDeadline && this.applicationDeadline < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  
  next();
});

// Static methods
jobPostingSchema.statics.findActive = function() {
  return this.find({ 
    status: 'active', 
    isActive: true,
    $or: [
      { applicationDeadline: { $gte: new Date() } },
      { applicationDeadline: null }
    ]
  }).sort({ featured: -1, createdAt: -1 });
};

jobPostingSchema.statics.searchJobs = function(searchParams) {
  const {
    query,
    location,
    employmentType,
    experienceLevel,
    skills,
    salaryMin,
    salaryMax,
    company,
    remote,
    page = 1,
    limit = 20
  } = searchParams;

  const aggregationPipeline = [];
  
  // Match active jobs
  const matchStage = {
    status: 'active',
    isActive: true,
    $or: [
      { applicationDeadline: { $gte: new Date() } },
      { applicationDeadline: null }
    ]
  };

  // Text search
  if (query) {
    matchStage.$text = { $search: query };
  }

  // Location filter
  if (location && !remote) {
    matchStage.$or = [
      { 'location.city': new RegExp(location, 'i') },
      { 'location.state': new RegExp(location, 'i') },
      { 'location.country': new RegExp(location, 'i') }
    ];
  }

  if (remote) {
    matchStage['location.type'] = { $in: ['remote', 'hybrid'] };
  }

  // Employment type filter
  if (employmentType) {
    matchStage['employment.type'] = employmentType;
  }

  // Experience level filter
  if (experienceLevel) {
    matchStage['experience.level'] = experienceLevel;
  }

  // Skills filter
  if (skills && skills.length > 0) {
    matchStage['skills.name'] = { $in: skills.map(skill => new RegExp(skill, 'i')) };
  }

  // Salary filter
  if (salaryMin || salaryMax) {
    const salaryFilter = {};
    if (salaryMin) salaryFilter.$gte = salaryMin;
    if (salaryMax) salaryFilter.$lte = salaryMax;
    matchStage['salary.min'] = salaryFilter;
  }

  // Company filter
  if (company) {
    matchStage['company.name'] = new RegExp(company, 'i');
  }

  aggregationPipeline.push({ $match: matchStage });

  // Add score for text search
  if (query) {
    aggregationPipeline.push({
      $addFields: { score: { $meta: 'textScore' } }
    });
  }

  // Sort by relevance and date
  const sortStage = {};
  if (query) {
    sortStage.score = { $meta: 'textScore' };
  }
  sortStage.featured = -1;
  sortStage.createdAt = -1;
  
  aggregationPipeline.push({ $sort: sortStage });

  // Pagination
  const skip = (page - 1) * limit;
  aggregationPipeline.push({ $skip: skip });
  aggregationPipeline.push({ $limit: parseInt(limit) });

  // Populate postedBy
  aggregationPipeline.push({
    $lookup: {
      from: 'users',
      localField: 'postedBy',
      foreignField: '_id',
      as: 'postedBy',
      pipeline: [
        {
          $project: {
            'profile.firstName': 1,
            'profile.lastName': 1,
            'profile.currentPosition': 1,
            'profile.company': 1,
            email: 1
          }
        }
      ]
    }
  });

  aggregationPipeline.push({
    $unwind: '$postedBy'
  });

  return this.aggregate(aggregationPipeline);
};

jobPostingSchema.statics.getJobStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgViews: { $avg: '$views' },
        avgApplications: { $avg: { $size: '$applications' } }
      }
    }
  ]);
};

module.exports = mongoose.model('JobPosting', jobPostingSchema);