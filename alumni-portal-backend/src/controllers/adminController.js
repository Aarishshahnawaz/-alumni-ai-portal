const mongoose = require('mongoose');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const MentorshipRequest = require('../models/MentorshipRequest');
const JobPosting = require('../models/JobPosting');
const Resume = require('../models/Resume');

// Get dashboard overview statistics
const getDashboardStats = async (req, res) => {
  try {
    // User statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          verified: {
            $sum: { $cond: [{ $eq: ['$isEmailVerified', true] }, 1, 0] }
          }
        }
      }
    ]);

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Mentorship statistics
    const mentorshipStats = await MentorshipRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Job posting statistics
    const jobStats = await JobPosting.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalApplications: { $sum: { $size: '$applications' } }
        }
      }
    ]);

    // Resume statistics
    const resumeStats = await Resume.aggregate([
      {
        $group: {
          _id: '$processingStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Activity statistics (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activityStats = await ActivityLog.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        users: {
          byRole: userStats,
          recentRegistrations
        },
        mentorship: mentorshipStats,
        jobs: jobStats,
        resumes: resumeStats,
        activity: activityStats,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

// Get total users count with filters
const getTotalUsers = async (req, res) => {
  try {
    const { role, isActive, isEmailVerified, startDate, endDate } = req.query;

    const matchStage = {};
    
    if (role) matchStage.role = role;
    if (isActive !== undefined) matchStage.isActive = isActive === 'true';
    if (isEmailVerified !== undefined) matchStage.isEmailVerified = isEmailVerified === 'true';
    
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const stats = await User.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byRole: {
            $push: {
              role: '$role',
              isActive: '$isActive',
              isEmailVerified: '$isEmailVerified',
              createdAt: '$createdAt'
            }
          }
        }
      },
      {
        $project: {
          total: 1,
          roleDistribution: {
            $reduce: {
              input: '$byRole',
              initialValue: { student: 0, alumni: 0, admin: 0 },
              in: {
                student: {
                  $cond: [
                    { $eq: ['$$this.role', 'student'] },
                    { $add: ['$$value.student', 1] },
                    '$$value.student'
                  ]
                },
                alumni: {
                  $cond: [
                    { $eq: ['$$this.role', 'alumni'] },
                    { $add: ['$$value.alumni', 1] },
                    '$$value.alumni'
                  ]
                },
                admin: {
                  $cond: [
                    { $eq: ['$$this.role', 'admin'] },
                    { $add: ['$$value.admin', 1] },
                    '$$value.admin'
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    const result = stats[0] || { total: 0, roleDistribution: { student: 0, alumni: 0, admin: 0 } };

    res.json({
      success: true,
      data: {
        totalUsers: result.total,
        roleDistribution: result.roleDistribution,
        filters: { role, isActive, isEmailVerified, startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Total users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
};

// Get mentorship requests statistics
const getMentorshipRequestsStats = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const matchStage = { isActive: true };
    
    if (status) matchStage.status = status;
    
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const stats = await MentorshipRequest.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byStatus: {
            $push: '$status'
          },
          byUrgency: {
            $push: '$urgency'
          },
          avgResponseTime: {
            $avg: {
              $cond: [
                { $ne: ['$respondedAt', null] },
                { $subtract: ['$respondedAt', '$createdAt'] },
                null
              ]
            }
          },
          totalMeetings: {
            $sum: { $size: '$scheduledMeetings' }
          }
        }
      },
      {
        $project: {
          total: 1,
          statusDistribution: {
            $reduce: {
              input: '$byStatus',
              initialValue: { pending: 0, accepted: 0, declined: 0, completed: 0, cancelled: 0 },
              in: {
                pending: {
                  $cond: [
                    { $eq: ['$$this', 'pending'] },
                    { $add: ['$$value.pending', 1] },
                    '$$value.pending'
                  ]
                },
                accepted: {
                  $cond: [
                    { $eq: ['$$this', 'accepted'] },
                    { $add: ['$$value.accepted', 1] },
                    '$$value.accepted'
                  ]
                },
                declined: {
                  $cond: [
                    { $eq: ['$$this', 'declined'] },
                    { $add: ['$$value.declined', 1] },
                    '$$value.declined'
                  ]
                },
                completed: {
                  $cond: [
                    { $eq: ['$$this', 'completed'] },
                    { $add: ['$$value.completed', 1] },
                    '$$value.completed'
                  ]
                },
                cancelled: {
                  $cond: [
                    { $eq: ['$$this', 'cancelled'] },
                    { $add: ['$$value.cancelled', 1] },
                    '$$value.cancelled'
                  ]
                }
              }
            }
          },
          urgencyDistribution: {
            $reduce: {
              input: '$byUrgency',
              initialValue: { low: 0, medium: 0, high: 0 },
              in: {
                low: {
                  $cond: [
                    { $eq: ['$$this', 'low'] },
                    { $add: ['$$value.low', 1] },
                    '$$value.low'
                  ]
                },
                medium: {
                  $cond: [
                    { $eq: ['$$this', 'medium'] },
                    { $add: ['$$value.medium', 1] },
                    '$$value.medium'
                  ]
                },
                high: {
                  $cond: [
                    { $eq: ['$$this', 'high'] },
                    { $add: ['$$value.high', 1] },
                    '$$value.high'
                  ]
                }
              }
            }
          },
          avgResponseTimeHours: {
            $divide: ['$avgResponseTime', 1000 * 60 * 60]
          },
          totalMeetings: 1
        }
      }
    ]);

    // Get top areas of interest
    const topAreas = await MentorshipRequest.aggregate([
      { $match: matchStage },
      { $unwind: '$areasOfInterest' },
      {
        $group: {
          _id: { $toLower: '$areasOfInterest' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          area: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      statusDistribution: {},
      urgencyDistribution: {},
      avgResponseTimeHours: 0,
      totalMeetings: 0
    };

    res.json({
      success: true,
      data: {
        ...result,
        topAreasOfInterest: topAreas,
        filters: { status, startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Mentorship requests stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentorship statistics'
    });
  }
};

// Get skills distribution aggregation
const getSkillsDistribution = async (req, res) => {
  try {
    const { source = 'all', limit = 50 } = req.query;

    let skillsData = [];

    if (source === 'all' || source === 'profiles') {
      // Get skills from user profiles
      const profileSkills = await User.aggregate([
        {
          $match: {
            isActive: true,
            'profile.skills': { $exists: true, $ne: [] }
          }
        },
        { $unwind: '$profile.skills' },
        {
          $group: {
            _id: { $toLower: '$profile.skills' },
            count: { $sum: 1 },
            source: { $addToSet: 'profile' },
            users: { $addToSet: '$_id' }
          }
        },
        {
          $project: {
            skill: '$_id',
            count: 1,
            userCount: { $size: '$users' },
            source: 1,
            _id: 0
          }
        }
      ]);

      skillsData = [...skillsData, ...profileSkills];
    }

    if (source === 'all' || source === 'resumes') {
      // Get skills from resumes
      const resumeSkills = await Resume.aggregate([
        {
          $match: {
            isActive: true,
            processingStatus: 'completed',
            'analysisResults.skillsExtracted': { $exists: true, $ne: [] }
          }
        },
        { $unwind: '$analysisResults.skillsExtracted' },
        {
          $group: {
            _id: { $toLower: '$analysisResults.skillsExtracted' },
            count: { $sum: 1 },
            source: { $addToSet: 'resume' },
            users: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            skill: '$_id',
            count: 1,
            userCount: { $size: '$users' },
            source: 1,
            _id: 0
          }
        }
      ]);

      skillsData = [...skillsData, ...resumeSkills];
    }

    if (source === 'all' || source === 'jobs') {
      // Get skills from job postings
      const jobSkills = await JobPosting.aggregate([
        {
          $match: {
            isActive: true,
            status: 'active',
            'skills': { $exists: true, $ne: [] }
          }
        },
        { $unwind: '$skills' },
        {
          $group: {
            _id: { $toLower: '$skills.name' },
            count: { $sum: 1 },
            source: { $addToSet: 'job' },
            avgLevel: {
              $avg: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$skills.level', 'beginner'] }, then: 1 },
                    { case: { $eq: ['$skills.level', 'intermediate'] }, then: 2 },
                    { case: { $eq: ['$skills.level', 'advanced'] }, then: 3 },
                    { case: { $eq: ['$skills.level', 'expert'] }, then: 4 }
                  ],
                  default: 2
                }
              }
            }
          }
        },
        {
          $project: {
            skill: '$_id',
            count: 1,
            avgLevel: 1,
            source: 1,
            _id: 0
          }
        }
      ]);

      skillsData = [...skillsData, ...jobSkills];
    }

    // Merge and aggregate skills from different sources
    const skillsMap = new Map();
    
    skillsData.forEach(item => {
      const skill = item.skill;
      if (skillsMap.has(skill)) {
        const existing = skillsMap.get(skill);
        existing.totalCount += item.count;
        existing.sources = [...new Set([...existing.sources, ...item.source])];
        existing.userCount = Math.max(existing.userCount || 0, item.userCount || 0);
        if (item.avgLevel) {
          existing.avgLevel = existing.avgLevel ? (existing.avgLevel + item.avgLevel) / 2 : item.avgLevel;
        }
      } else {
        skillsMap.set(skill, {
          skill,
          totalCount: item.count,
          sources: item.source,
          userCount: item.userCount || 0,
          avgLevel: item.avgLevel || null
        });
      }
    });

    // Convert to array and sort
    const aggregatedSkills = Array.from(skillsMap.values())
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, parseInt(limit));

    // Calculate categories
    const categories = {
      technical: 0,
      soft: 0,
      language: 0,
      other: 0
    };

    // Simple categorization (in real app, you'd have a more sophisticated system)
    aggregatedSkills.forEach(skill => {
      const skillName = skill.skill.toLowerCase();
      if (skillName.includes('javascript') || skillName.includes('python') || 
          skillName.includes('java') || skillName.includes('react') ||
          skillName.includes('node') || skillName.includes('sql')) {
        categories.technical++;
      } else if (skillName.includes('communication') || skillName.includes('leadership') ||
                 skillName.includes('management') || skillName.includes('teamwork')) {
        categories.soft++;
      } else if (skillName.includes('english') || skillName.includes('spanish') ||
                 skillName.includes('french') || skillName.includes('language')) {
        categories.language++;
      } else {
        categories.other++;
      }
    });

    res.json({
      success: true,
      data: {
        skills: aggregatedSkills,
        categories,
        totalSkills: aggregatedSkills.length,
        source,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Skills distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch skills distribution'
    });
  }
};

// Get recent activity logs
const getRecentActivityLogs = async (req, res) => {
  try {
    const { 
      category, 
      level, 
      action, 
      userId,
      email,
      startDate, 
      endDate, 
      page = 1, 
      limit = 20 
    } = req.query;

    const matchStage = {};
    
    if (category) matchStage.category = category;
    if (level) matchStage.level = level;
    if (action) matchStage.action = action;
    if (userId) matchStage.userId = mongoose.Types.ObjectId(userId);
    
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            {
              $project: {
                'profile.firstName': 1,
                'profile.lastName': 1,
                email: 1,
                role: 1
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Add email filter after lookup
    if (email) {
      pipeline.push({
        $match: {
          'user.email': { $regex: email, $options: 'i' }
        }
      });
    }

    // Sort by latest first
    pipeline.push({ $sort: { createdAt: -1 } });

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await ActivityLog.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination
    const skip = (page - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const logs = await ActivityLog.aggregate(pipeline);

    // Get activity summary
    const summaryPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            category: '$category',
            level: '$level'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          levels: {
            $push: {
              level: '$_id.level',
              count: '$count'
            }
          },
          totalCount: { $sum: '$count' }
        }
      },
      { $sort: { totalCount: -1 } }
    ];

    const summary = await ActivityLog.aggregate(summaryPipeline);

    res.json({
      success: true,
      data: {
        logs,
        summary,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: logs.length,
          totalRecords: total,
          hasNext: parseInt(page) * parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        },
        filters: { category, level, action, userId, email, startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Recent activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs'
    });
  }
};

// Get system health metrics
const getSystemHealth = async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Error rate in last hour
    const errorStats = await ActivityLog.aggregate([
      {
        $match: {
          createdAt: { $gte: oneHourAgo },
          level: { $in: ['error', 'warn'] }
        }
      },
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      }
    ]);

    // Active users in last 24 hours
    const activeUsers = await ActivityLog.aggregate([
      {
        $match: {
          createdAt: { $gte: oneDayAgo },
          userId: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$userId'
        }
      },
      {
        $count: 'activeUsers'
      }
    ]);

    // API response times (last hour)
    const responseTimeStats = await ActivityLog.aggregate([
      {
        $match: {
          createdAt: { $gte: oneHourAgo },
          'metadata.duration': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$metadata.duration' },
          maxResponseTime: { $max: '$metadata.duration' },
          minResponseTime: { $min: '$metadata.duration' },
          totalRequests: { $sum: 1 }
        }
      }
    ]);

    // Database connection status
    const dbStatus = {
      connected: true, // mongoose.connection.readyState === 1
      collections: {
        users: await User.countDocuments(),
        activityLogs: await ActivityLog.countDocuments(),
        mentorshipRequests: await MentorshipRequest.countDocuments(),
        jobPostings: await JobPosting.countDocuments(),
        resumes: await Resume.countDocuments()
      }
    };

    res.json({
      success: true,
      data: {
        timestamp: now,
        errors: {
          lastHour: errorStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, { error: 0, warn: 0 })
        },
        activeUsers: activeUsers[0]?.activeUsers || 0,
        performance: responseTimeStats[0] || {
          avgResponseTime: 0,
          maxResponseTime: 0,
          minResponseTime: 0,
          totalRequests: 0
        },
        database: dbStatus,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      }
    });

  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health metrics'
    });
  }
};

module.exports = {
  getDashboardStats,
  getTotalUsers,
  getMentorshipRequestsStats,
  getSkillsDistribution,
  getRecentActivityLogs,
  getSystemHealth
};


// Get total mentors count
const getMentorCount = async (req, res) => {
  try {
    // Count users with role = 'alumni' (mentors)
    const mentorCount = await User.countDocuments({
      role: 'alumni',
      isActive: true
    });

    // Get additional mentor statistics
    const mentorStats = await User.aggregate([
      {
        $match: {
          role: 'alumni',
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'mentorshiprequests',
          localField: '_id',
          foreignField: 'mentorId',
          as: 'mentorshipRequests'
        }
      },
      {
        $project: {
          totalRequests: { $size: '$mentorshipRequests' },
          acceptedRequests: {
            $size: {
              $filter: {
                input: '$mentorshipRequests',
                as: 'req',
                cond: { $eq: ['$$req.status', 'accepted'] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalMentors: { $sum: 1 },
          totalRequests: { $sum: '$totalRequests' },
          totalAccepted: { $sum: '$acceptedRequests' },
          avgRequestsPerMentor: { $avg: '$totalRequests' }
        }
      }
    ]);

    const stats = mentorStats[0] || {
      totalMentors: mentorCount,
      totalRequests: 0,
      totalAccepted: 0,
      avgRequestsPerMentor: 0
    };

    res.json({
      success: true,
      data: {
        mentorCount: mentorCount,
        ...stats
      }
    });

  } catch (error) {
    console.error('Mentor count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentor count'
    });
  }
};

// Get total earnings
const getTotalEarnings = async (req, res) => {
  try {
    // Calculate earnings from accepted mentorship requests (₹100 each)
    const mentorshipEarnings = await MentorshipRequest.countDocuments({
      status: 'accepted',
      isActive: true
    });

    // Calculate earnings from active job postings (₹50 each)
    const jobEarnings = await JobPosting.countDocuments({
      status: 'active',
      isActive: true
    });

    const totalEarnings = (mentorshipEarnings * 100) + (jobEarnings * 50);

    // Get monthly breakdown
    const monthlyEarnings = await MentorshipRequest.aggregate([
      {
        $match: {
          status: 'accepted',
          isActive: true,
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          mentorshipCount: { $sum: 1 },
          mentorshipEarnings: { $sum: 100 }
        }
      },
      {
        $lookup: {
          from: 'jobpostings',
          let: { year: '$_id.year', month: '$_id.month' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$createdAt' }, '$$year'] },
                    { $eq: [{ $month: '$createdAt' }, '$$month'] },
                    { $eq: ['$status', 'active'] },
                    { $eq: ['$isActive', true] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 }
              }
            }
          ],
          as: 'jobData'
        }
      },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          mentorshipCount: 1,
          mentorshipEarnings: 1,
          jobCount: { $ifNull: [{ $arrayElemAt: ['$jobData.count', 0] }, 0] },
          jobEarnings: { $multiply: [{ $ifNull: [{ $arrayElemAt: ['$jobData.count', 0] }, 0] }, 50] }
        }
      },
      {
        $project: {
          year: 1,
          month: 1,
          mentorshipCount: 1,
          mentorshipEarnings: 1,
          jobCount: 1,
          jobEarnings: 1,
          totalEarnings: { $add: ['$mentorshipEarnings', '$jobEarnings'] }
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalEarnings,
        breakdown: {
          mentorshipEarnings: mentorshipEarnings * 100,
          mentorshipCount: mentorshipEarnings,
          jobEarnings: jobEarnings * 50,
          jobCount: jobEarnings
        },
        monthlyEarnings,
        currency: '₹'
      }
    });

  } catch (error) {
    console.error('Total earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate total earnings'
    });
  }
};

module.exports = {
  getDashboardStats,
  getTotalUsers,
  getMentorshipRequestsStats,
  getSkillsDistribution,
  getRecentActivityLogs,
  getSystemHealth,
  getMentorCount,
  getTotalEarnings
};
