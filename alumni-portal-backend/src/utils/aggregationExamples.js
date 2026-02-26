// MongoDB Aggregation Pipeline Examples for AlumniAI Portal
// This file contains reusable aggregation pipelines for complex queries

const mongoose = require('mongoose');

/**
 * Alumni Skills Analysis Pipeline
 * Analyzes skills distribution across alumni with experience levels
 */
const getAlumniSkillsAnalysis = () => [
  {
    $match: {
      role: 'alumni',
      isActive: true,
      'profile.skills': { $exists: true, $ne: [] }
    }
  },
  {
    $addFields: {
      experienceYears: {
        $cond: [
          { $ne: ['$profile.graduationYear', null] },
          { $subtract: [new Date().getFullYear(), '$profile.graduationYear'] },
          0
        ]
      }
    }
  },
  {
    $unwind: '$profile.skills'
  },
  {
    $group: {
      _id: { $toLower: '$profile.skills' },
      count: { $sum: 1 },
      avgExperience: { $avg: '$experienceYears' },
      companies: { $addToSet: '$profile.company' },
      positions: { $addToSet: '$profile.currentPosition' },
      users: { $addToSet: {
        id: '$_id',
        name: { $concat: ['$profile.firstName', ' ', '$profile.lastName'] },
        company: '$profile.company',
        position: '$profile.currentPosition'
      }}
    }
  },
  {
    $project: {
      skill: '$_id',
      count: 1,
      avgExperience: { $round: ['$avgExperience', 1] },
      uniqueCompanies: { $size: { $filter: { input: '$companies', cond: { $ne: ['$$this', null] } } } },
      uniquePositions: { $size: { $filter: { input: '$positions', cond: { $ne: ['$$this', null] } } } },
      topUsers: { $slice: ['$users', 5] },
      _id: 0
    }
  },
  {
    $sort: { count: -1 }
  }
];

/**
 * Mentorship Success Rate Pipeline
 * Calculates mentorship success rates by various dimensions
 */
const getMentorshipSuccessRate = () => [
  {
    $match: {
      isActive: true,
      status: { $in: ['completed', 'declined', 'cancelled'] }
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: 'mentor',
      foreignField: '_id',
      as: 'mentorInfo'
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: 'student',
      foreignField: '_id',
      as: 'studentInfo'
    }
  },
  {
    $unwind: '$mentorInfo'
  },
  {
    $unwind: '$studentInfo'
  },
  {
    $addFields: {
      isSuccessful: { $eq: ['$status', 'completed'] },
      responseTime: {
        $cond: [
          { $ne: ['$respondedAt', null] },
          { $subtract: ['$respondedAt', '$createdAt'] },
          null
        ]
      },
      mentorExperience: {
        $subtract: [new Date().getFullYear(), '$mentorInfo.profile.graduationYear']
      }
    }
  },
  {
    $group: {
      _id: {
        mentorCompany: '$mentorInfo.profile.company',
        areasOfInterest: '$areasOfInterest',
        urgency: '$urgency'
      },
      totalRequests: { $sum: 1 },
      successfulRequests: { $sum: { $cond: ['$isSuccessful', 1, 0] } },
      avgResponseTime: { $avg: '$responseTime' },
      avgMentorExperience: { $avg: '$mentorExperience' },
      avgMeetings: { $avg: { $size: '$scheduledMeetings' } }
    }
  },
  {
    $project: {
      mentorCompany: '$_id.mentorCompany',
      areasOfInterest: '$_id.areasOfInterest',
      urgency: '$_id.urgency',
      totalRequests: 1,
      successfulRequests: 1,
      successRate: {
        $multiply: [
          { $divide: ['$successfulRequests', '$totalRequests'] },
          100
        ]
      },
      avgResponseTimeHours: {
        $divide: ['$avgResponseTime', 1000 * 60 * 60]
      },
      avgMentorExperience: { $round: ['$avgMentorExperience', 1] },
      avgMeetings: { $round: ['$avgMeetings', 1] },
      _id: 0
    }
  },
  {
    $sort: { successRate: -1, totalRequests: -1 }
  }
];

/**
 * Job Market Trends Pipeline
 * Analyzes job market trends by skills, companies, and time
 */
const getJobMarketTrends = (months = 6) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return [
    {
      $match: {
        isActive: true,
        createdAt: { $gte: startDate }
      }
    },
    {
      $addFields: {
        month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        salaryMidpoint: {
          $cond: [
            { $and: [{ $ne: ['$salary.min', null] }, { $ne: ['$salary.max', null] }] },
            { $divide: [{ $add: ['$salary.min', '$salary.max'] }, 2] },
            { $ifNull: ['$salary.min', '$salary.max'] }
          ]
        }
      }
    },
    {
      $unwind: {
        path: '$skills',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: {
          month: '$month',
          skill: { $toLower: '$skills.name' },
          employmentType: '$employment.type',
          experienceLevel: '$experience.level',
          locationType: '$location.type'
        },
        jobCount: { $sum: 1 },
        avgSalary: { $avg: '$salaryMidpoint' },
        companies: { $addToSet: '$company.name' },
        totalApplications: { $sum: { $size: '$applications' } }
      }
    },
    {
      $group: {
        _id: {
          month: '$_id.month',
          skill: '$_id.skill'
        },
        totalJobs: { $sum: '$jobCount' },
        avgSalary: { $avg: '$avgSalary' },
        employmentTypes: {
          $push: {
            type: '$_id.employmentType',
            count: '$jobCount'
          }
        },
        experienceLevels: {
          $push: {
            level: '$_id.experienceLevel',
            count: '$jobCount'
          }
        },
        locationTypes: {
          $push: {
            type: '$_id.locationType',
            count: '$jobCount'
          }
        },
        uniqueCompanies: { $sum: { $size: '$companies' } },
        totalApplications: { $sum: '$totalApplications' }
      }
    },
    {
      $project: {
        month: '$_id.month',
        skill: '$_id.skill',
        totalJobs: 1,
        avgSalary: { $round: ['$avgSalary', 0] },
        avgApplicationsPerJob: {
          $round: [{ $divide: ['$totalApplications', '$totalJobs'] }, 1]
        },
        employmentTypes: 1,
        experienceLevels: 1,
        locationTypes: 1,
        uniqueCompanies: 1,
        _id: 0
      }
    },
    {
      $sort: { month: -1, totalJobs: -1 }
    }
  ];
};

/**
 * User Engagement Analytics Pipeline
 * Analyzes user engagement patterns and activity
 */
const getUserEngagementAnalytics = (days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return [
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $addFields: {
        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        hour: { $hour: '$createdAt' },
        dayOfWeek: { $dayOfWeek: '$createdAt' }
      }
    },
    {
      $group: {
        _id: {
          userId: '$userId',
          date: '$date'
        },
        dailyActions: { $sum: 1 },
        categories: { $addToSet: '$category' },
        actions: { $addToSet: '$action' },
        avgDuration: { $avg: '$metadata.duration' },
        errors: { $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] } },
        hours: { $addToSet: '$hour' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id.userId',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    {
      $unwind: {
        path: '$userInfo',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: '$_id.userId',
        userName: { $first: { $concat: ['$userInfo.profile.firstName', ' ', '$userInfo.profile.lastName'] } },
        userRole: { $first: '$userInfo.role' },
        activeDays: { $sum: 1 },
        totalActions: { $sum: '$dailyActions' },
        avgActionsPerDay: { $avg: '$dailyActions' },
        uniqueCategories: { $addToSet: '$categories' },
        uniqueActions: { $addToSet: '$actions' },
        avgSessionDuration: { $avg: '$avgDuration' },
        totalErrors: { $sum: '$errors' },
        activeHours: { $addToSet: '$hours' }
      }
    },
    {
      $project: {
        userId: '$_id',
        userName: 1,
        userRole: 1,
        activeDays: 1,
        totalActions: 1,
        avgActionsPerDay: { $round: ['$avgActionsPerDay', 1] },
        engagementScore: {
          $multiply: [
            { $divide: ['$activeDays', days] },
            { $min: [{ $divide: ['$avgActionsPerDay', 10] }, 1] }
          ]
        },
        categoriesUsed: { $size: { $reduce: { input: '$uniqueCategories', initialValue: [], in: { $setUnion: ['$$value', '$$this'] } } } },
        actionsUsed: { $size: { $reduce: { input: '$uniqueActions', initialValue: [], in: { $setUnion: ['$$value', '$$this'] } } } },
        avgSessionDurationMs: { $round: ['$avgSessionDuration', 0] },
        errorRate: {
          $multiply: [
            { $divide: ['$totalErrors', '$totalActions'] },
            100
          ]
        },
        peakHours: { $reduce: { input: '$activeHours', initialValue: [], in: { $setUnion: ['$$value', '$$this'] } } },
        _id: 0
      }
    },
    {
      $sort: { engagementScore: -1, totalActions: -1 }
    }
  ];
};

/**
 * Career Progression Analysis Pipeline
 * Analyzes career progression patterns of alumni
 */
const getCareerProgressionAnalysis = () => [
  {
    $match: {
      role: 'alumni',
      isActive: true,
      'profile.graduationYear': { $exists: true, $ne: null },
      'profile.currentPosition': { $exists: true, $ne: null }
    }
  },
  {
    $addFields: {
      experienceYears: {
        $subtract: [new Date().getFullYear(), '$profile.graduationYear']
      },
      seniorityLevel: {
        $switch: {
          branches: [
            { case: { $lte: ['$experienceYears', 2] }, then: 'Junior' },
            { case: { $lte: ['$experienceYears', 5] }, then: 'Mid-Level' },
            { case: { $lte: ['$experienceYears', 10] }, then: 'Senior' },
            { case: { $gt: ['$experienceYears', 10] }, then: 'Executive' }
          ],
          default: 'Unknown'
        }
      }
    }
  },
  {
    $group: {
      _id: {
        major: '$profile.major',
        seniorityLevel: '$seniorityLevel',
        graduationDecade: {
          $multiply: [
            { $floor: { $divide: ['$profile.graduationYear', 10] } },
            10
          ]
        }
      },
      count: { $sum: 1 },
      avgExperience: { $avg: '$experienceYears' },
      companies: { $addToSet: '$profile.company' },
      positions: { $addToSet: '$profile.currentPosition' },
      skills: { $push: '$profile.skills' },
      mentorshipAvailable: {
        $sum: { $cond: ['$preferences.mentorshipAvailable', 1, 0] }
      }
    }
  },
  {
    $project: {
      major: '$_id.major',
      seniorityLevel: '$_id.seniorityLevel',
      graduationDecade: '$_id.graduationDecade',
      count: 1,
      avgExperience: { $round: ['$avgExperience', 1] },
      uniqueCompanies: { $size: { $filter: { input: '$companies', cond: { $ne: ['$$this', null] } } } },
      uniquePositions: { $size: { $filter: { input: '$positions', cond: { $ne: ['$$this', null] } } } },
      topSkills: {
        $slice: [
          {
            $map: {
              input: {
                $reduce: {
                  input: '$skills',
                  initialValue: [],
                  in: { $setUnion: ['$$value', '$$this'] }
                }
              },
              as: 'skill',
              in: '$$skill'
            }
          },
          10
        ]
      },
      mentorshipRate: {
        $multiply: [
          { $divide: ['$mentorshipAvailable', '$count'] },
          100
        ]
      },
      _id: 0
    }
  },
  {
    $sort: { graduationDecade: -1, count: -1 }
  }
];

/**
 * Resume Skills Gap Analysis Pipeline
 * Identifies skills gaps between resumes and job requirements
 */
const getSkillsGapAnalysis = () => [
  {
    $facet: {
      jobSkills: [
        {
          $match: {
            status: 'active',
            isActive: true,
            skills: { $exists: true, $ne: [] }
          }
        },
        { $unwind: '$skills' },
        {
          $group: {
            _id: { $toLower: '$skills.name' },
            demandCount: { $sum: 1 },
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
            },
            companies: { $addToSet: '$company.name' }
          }
        }
      ],
      resumeSkills: [
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
            supplyCount: { $sum: 1 },
            users: { $addToSet: '$user' }
          }
        }
      ]
    }
  },
  {
    $project: {
      skillsAnalysis: {
        $map: {
          input: '$jobSkills',
          as: 'jobSkill',
          in: {
            $mergeObjects: [
              '$$jobSkill',
              {
                supplyCount: {
                  $ifNull: [
                    {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: {
                              $filter: {
                                input: '$resumeSkills',
                                cond: { $eq: ['$$this._id', '$$jobSkill._id'] }
                              }
                            },
                            as: 'resumeSkill',
                            in: '$$resumeSkill.supplyCount'
                          }
                        },
                        0
                      ]
                    },
                    0
                  ]
                }
              }
            ]
          }
        }
      }
    }
  },
  { $unwind: '$skillsAnalysis' },
  { $replaceRoot: { newRoot: '$skillsAnalysis' } },
  {
    $addFields: {
      skill: '$_id',
      gapRatio: {
        $cond: [
          { $gt: ['$supplyCount', 0] },
          { $divide: ['$demandCount', '$supplyCount'] },
          '$demandCount'
        ]
      },
      marketDemand: {
        $switch: {
          branches: [
            { case: { $gte: ['$demandCount', 20] }, then: 'High' },
            { case: { $gte: ['$demandCount', 10] }, then: 'Medium' },
            { case: { $gte: ['$demandCount', 5] }, then: 'Low' }
          ],
          default: 'Very Low'
        }
      }
    }
  },
  {
    $project: {
      skill: 1,
      demandCount: 1,
      supplyCount: 1,
      gapRatio: { $round: ['$gapRatio', 2] },
      avgRequiredLevel: { $round: ['$avgLevel', 1] },
      marketDemand: 1,
      uniqueCompanies: { $size: '$companies' },
      _id: 0
    }
  },
  {
    $sort: { gapRatio: -1, demandCount: -1 }
  }
];

module.exports = {
  getAlumniSkillsAnalysis,
  getMentorshipSuccessRate,
  getJobMarketTrends,
  getUserEngagementAnalytics,
  getCareerProgressionAnalysis,
  getSkillsGapAnalysis
};