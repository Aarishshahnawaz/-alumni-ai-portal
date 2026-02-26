const mongoose = require('mongoose');

const mentorshipRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required'],
    index: true
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Mentor is required'],
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  requestMessage: {
    type: String,
    required: [true, 'Request message is required'],
    maxlength: [1000, 'Request message cannot exceed 1000 characters'],
    trim: true
  },
  responseMessage: {
    type: String,
    maxlength: [1000, 'Response message cannot exceed 1000 characters'],
    trim: true,
    default: null
  },
  areasOfInterest: [{
    type: String,
    trim: true,
    maxlength: [100, 'Area of interest cannot exceed 100 characters']
  }],
  preferredMeetingType: {
    type: String,
    enum: ['video-call', 'phone-call', 'in-person', 'email', 'flexible'],
    default: 'flexible'
  },
  duration: {
    type: String,
    enum: ['one-time', '1-month', '3-months', '6-months', 'ongoing'],
    default: 'one-time'
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  scheduledMeetings: [{
    date: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // in minutes
      required: true,
      min: [15, 'Meeting duration must be at least 15 minutes'],
      max: [480, 'Meeting duration cannot exceed 8 hours']
    },
    type: {
      type: String,
      enum: ['video-call', 'phone-call', 'in-person', 'email'],
      required: true
    },
    notes: {
      type: String,
      maxlength: [500, 'Meeting notes cannot exceed 500 characters']
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  feedback: {
    studentRating: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    mentorRating: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    studentFeedback: {
      type: String,
      maxlength: [1000, 'Feedback cannot exceed 1000 characters']
    },
    mentorFeedback: {
      type: String,
      maxlength: [1000, 'Feedback cannot exceed 1000 characters']
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  respondedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
mentorshipRequestSchema.index({ student: 1, status: 1 });
mentorshipRequestSchema.index({ mentor: 1, status: 1 });
mentorshipRequestSchema.index({ status: 1, createdAt: -1 });
mentorshipRequestSchema.index({ areasOfInterest: 1 });
mentorshipRequestSchema.index({ urgency: 1, createdAt: -1 });
mentorshipRequestSchema.index({ isActive: 1, status: 1 });

// Compound index for efficient queries
mentorshipRequestSchema.index({ 
  mentor: 1, 
  status: 1, 
  createdAt: -1 
});

// Virtual for request age in days
mentorshipRequestSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for total meetings
mentorshipRequestSchema.virtual('totalMeetings').get(function() {
  return this.scheduledMeetings.length;
});

// Virtual for completed meetings
mentorshipRequestSchema.virtual('completedMeetings').get(function() {
  return this.scheduledMeetings.filter(meeting => meeting.completed).length;
});

// Pre-save middleware
mentorshipRequestSchema.pre('save', function(next) {
  // Set respondedAt when status changes from pending
  if (this.isModified('status') && this.status !== 'pending' && !this.respondedAt) {
    this.respondedAt = new Date();
  }
  
  // Set completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Static methods
mentorshipRequestSchema.statics.findByStudent = function(studentId, status = null) {
  const query = { student: studentId, isActive: true };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('mentor', 'profile.firstName profile.lastName profile.currentPosition profile.company email')
    .sort({ createdAt: -1 });
};

mentorshipRequestSchema.statics.findByMentor = function(mentorId, status = null) {
  const query = { mentor: mentorId, isActive: true };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('student', 'profile.firstName profile.lastName profile.graduationYear profile.major email')
    .sort({ createdAt: -1 });
};

mentorshipRequestSchema.statics.getPendingRequests = function(mentorId) {
  return this.find({ 
    mentor: mentorId, 
    status: 'pending', 
    isActive: true 
  })
    .populate('student', 'profile.firstName profile.lastName profile.graduationYear profile.major email')
    .sort({ urgency: -1, createdAt: 1 });
};

mentorshipRequestSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgResponseTime: {
          $avg: {
            $cond: [
              { $ne: ['$respondedAt', null] },
              { $subtract: ['$respondedAt', '$createdAt'] },
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
        avgResponseTimeHours: {
          $divide: ['$avgResponseTime', 1000 * 60 * 60]
        }
      }
    }
  ]);
};

module.exports = mongoose.model('MentorshipRequest', mentorshipRequestSchema);