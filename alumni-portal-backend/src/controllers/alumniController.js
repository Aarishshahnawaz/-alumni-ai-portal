const User = require('../models/User');
const { autoLogActivity } = require('../middleware/activityLogger');

// Get alumni directory with search and filters
const getAlumniDirectory = async (req, res) => {
  try {
    const {
      search,
      skills,
      company,
      graduationYear,
      location,
      industry,
      mentorshipAvailable,
      page = 1,
      limit = 20,
      sortBy = 'graduationYear',
      sortOrder = 'desc'
    } = req.query;

    // Build aggregation pipeline
    const pipeline = [];

    // Match alumni users
    const matchStage = {
      role: 'alumni',
      isActive: true,
      isEmailVerified: true
    };

    // Text search across multiple fields
    if (search) {
      matchStage.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { 'profile.currentPosition': { $regex: search, $options: 'i' } },
        { 'profile.company': { $regex: search, $options: 'i' } },
        { 'profile.bio': { $regex: search, $options: 'i' } },
        { 'profile.skills': { $in: [new RegExp(search, 'i')] } },
        { 'profile.interests': { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Skills filter
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
      matchStage['profile.skills'] = { 
        $in: skillsArray.map(skill => new RegExp(skill.trim(), 'i')) 
      };
    }

    // Company filter
    if (company) {
      matchStage['profile.company'] = { $regex: company, $options: 'i' };
    }

    // Graduation year filter
    if (graduationYear) {
      if (graduationYear.includes('-')) {
        const [startYear, endYear] = graduationYear.split('-').map(Number);
        matchStage['profile.graduationYear'] = { $gte: startYear, $lte: endYear };
      } else {
        matchStage['profile.graduationYear'] = parseInt(graduationYear);
      }
    }

    // Location filter
    if (location) {
      matchStage.$or = [
        { 'profile.location.city': { $regex: location, $options: 'i' } },
        { 'profile.location.state': { $regex: location, $options: 'i' } },
        { 'profile.location.country': { $regex: location, $options: 'i' } }
      ];
    }

    // Mentorship availability filter
    if (mentorshipAvailable === 'true') {
      matchStage['preferences.mentorshipAvailable'] = true;
    }

    pipeline.push({ $match: matchStage });

    // Add computed fields for sorting and filtering
    pipeline.push({
      $addFields: {
        fullName: { $concat: ['$profile.firstName', ' ', '$profile.lastName'] },
        experienceYears: {
          $cond: [
            { $ne: ['$profile.graduationYear', null] },
            { $subtract: [new Date().getFullYear(), '$profile.graduationYear'] },
            0
          ]
        }
      }
    });

    // Sorting
    const sortStage = {};
    switch (sortBy) {
      case 'name':
        sortStage.fullName = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'company':
        sortStage['profile.company'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'experience':
        sortStage.experienceYears = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'graduationYear':
      default:
        sortStage['profile.graduationYear'] = sortOrder === 'desc' ? -1 : 1;
        break;
    }
    pipeline.push({ $sort: sortStage });

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await User.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Project only necessary fields
    pipeline.push({
      $project: {
        email: 1,
        role: 1,
        'profile.firstName': 1,
        'profile.lastName': 1,
        'profile.avatar': 1,
        'profile.bio': 1,
        'profile.graduationYear': 1,
        'profile.degree': 1,
        'profile.major': 1,
        'profile.currentPosition': 1,
        'profile.company': 1,
        'profile.location': 1,
        'profile.skills': 1,
        'profile.interests': 1,
        'profile.socialLinks': 1,
        'preferences.mentorshipAvailable': 1,
        'preferences.profileVisibility': 1,
        fullName: 1,
        experienceYears: 1,
        lastLogin: 1,
        createdAt: 1
      }
    });

    const alumni = await User.aggregate(pipeline);

    // Filter by profile visibility based on current user
    const filteredAlumni = alumni.filter(alum => {
      if (alum.preferences.profileVisibility === 'public') return true;
      if (alum.preferences.profileVisibility === 'alumni-only' && req.user?.role === 'alumni') return true;
      if (req.user?.role === 'admin') return true;
      return false;
    });

    // Log search activity
    if (req.user) {
      await autoLogActivity(
        req.user._id,
        'search_alumni',
        'alumni_directory',
        {
          searchParams: { search, skills, company, graduationYear, location },
          resultsCount: filteredAlumni.length,
          page: parseInt(page),
          limit: parseInt(limit)
        },
        req
      );
    }

    res.json({
      success: true,
      data: {
        alumni: filteredAlumni,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: filteredAlumni.length,
          totalRecords: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        filters: {
          search,
          skills: skills ? (Array.isArray(skills) ? skills : skills.split(',')) : null,
          company,
          graduationYear,
          location,
          mentorshipAvailable
        }
      }
    });

  } catch (error) {
    console.error('Alumni directory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alumni directory'
    });
  }
};

// Get single alumni profile
const getAlumniProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const alumni = await User.findById(id).select('-password -refreshTokens');
    
    if (!alumni || alumni.role !== 'alumni' || !alumni.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Alumni not found'
      });
    }

    // Check profile visibility
    const canView = 
      alumni.preferences.profileVisibility === 'public' ||
      (alumni.preferences.profileVisibility === 'alumni-only' && req.user?.role === 'alumni') ||
      req.user?.role === 'admin' ||
      req.user?._id.toString() === alumni._id.toString();

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Profile is private'
      });
    }

    // Log profile view
    if (req.user && req.user._id.toString() !== alumni._id.toString()) {
      await autoLogActivity(
        req.user._id,
        'profile_view',
        'alumni_profile',
        {
          viewedUserId: alumni._id,
          viewedUserName: `${alumni.profile.firstName} ${alumni.profile.lastName}`
        },
        req
      );
    }

    res.json({
      success: true,
      data: {
        alumni: alumni.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Get alumni profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alumni profile'
    });
  }
};

// Get alumni statistics
const getAlumniStatistics = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $match: {
          role: 'alumni',
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalAlumni: { $sum: 1 },
          availableMentors: {
            $sum: {
              $cond: [{ $eq: ['$preferences.mentorshipAvailable', true] }, 1, 0]
            }
          },
          avgGraduationYear: { $avg: '$profile.graduationYear' },
          graduationYearRange: {
            $push: '$profile.graduationYear'
          }
        }
      },
      {
        $project: {
          totalAlumni: 1,
          availableMentors: 1,
          avgGraduationYear: { $round: ['$avgGraduationYear', 0] },
          minGraduationYear: { $min: '$graduationYearRange' },
          maxGraduationYear: { $max: '$graduationYearRange' }
        }
      }
    ]);

    // Get top skills
    const topSkills = await User.aggregate([
      {
        $match: {
          role: 'alumni',
          isActive: true,
          'profile.skills': { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$profile.skills'
      },
      {
        $group: {
          _id: { $toLower: '$profile.skills' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      },
      {
        $project: {
          skill: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get top companies
    const topCompanies = await User.aggregate([
      {
        $match: {
          role: 'alumni',
          isActive: true,
          'profile.company': { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$profile.company',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 15
      },
      {
        $project: {
          company: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get graduation year distribution
    const graduationDistribution = await User.aggregate([
      {
        $match: {
          role: 'alumni',
          isActive: true,
          'profile.graduationYear': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$profile.graduationYear',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          year: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalAlumni: 0,
          availableMentors: 0,
          avgGraduationYear: null,
          minGraduationYear: null,
          maxGraduationYear: null
        },
        topSkills,
        topCompanies,
        graduationDistribution
      }
    });

  } catch (error) {
    console.error('Alumni statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alumni statistics'
    });
  }
};

// Get suggested alumni for networking
const getSuggestedAlumni = async (req, res) => {
  try {
    const currentUser = req.user;
    const { limit = 10 } = req.query;

    if (currentUser.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can get alumni suggestions'
      });
    }

    const userSkills = currentUser.profile.skills || [];
    const userInterests = currentUser.profile.interests || [];
    const userMajor = currentUser.profile.major;

    const pipeline = [
      {
        $match: {
          role: 'alumni',
          isActive: true,
          isEmailVerified: true,
          'preferences.profileVisibility': { $in: ['public', 'alumni-only'] },
          _id: { $ne: currentUser._id }
        }
      },
      {
        $addFields: {
          skillsMatch: {
            $size: {
              $setIntersection: [
                { $ifNull: ['$profile.skills', []] },
                userSkills
              ]
            }
          },
          interestsMatch: {
            $size: {
              $setIntersection: [
                { $ifNull: ['$profile.interests', []] },
                userInterests
              ]
            }
          },
          majorMatch: {
            $cond: [
              { $eq: ['$profile.major', userMajor] },
              1,
              0
            ]
          },
          mentorshipAvailable: {
            $cond: [
              { $eq: ['$preferences.mentorshipAvailable', true] },
              1,
              0
            ]
          }
        }
      },
      {
        $addFields: {
          relevanceScore: {
            $add: [
              { $multiply: ['$skillsMatch', 3] },
              { $multiply: ['$interestsMatch', 2] },
              { $multiply: ['$majorMatch', 2] },
              { $multiply: ['$mentorshipAvailable', 1] }
            ]
          }
        }
      },
      {
        $match: {
          relevanceScore: { $gt: 0 }
        }
      },
      {
        $sort: {
          relevanceScore: -1,
          'profile.graduationYear': -1
        }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          'profile.firstName': 1,
          'profile.lastName': 1,
          'profile.avatar': 1,
          'profile.bio': 1,
          'profile.graduationYear': 1,
          'profile.degree': 1,
          'profile.major': 1,
          'profile.currentPosition': 1,
          'profile.company': 1,
          'profile.skills': 1,
          'profile.interests': 1,
          'preferences.mentorshipAvailable': 1,
          skillsMatch: 1,
          interestsMatch: 1,
          majorMatch: 1,
          relevanceScore: 1
        }
      }
    ];

    const suggestions = await User.aggregate(pipeline);

    res.json({
      success: true,
      data: {
        suggestions,
        basedOn: {
          skills: userSkills,
          interests: userInterests,
          major: userMajor
        }
      }
    });

  } catch (error) {
    console.error('Alumni suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alumni suggestions'
    });
  }
};

module.exports = {
  getAlumniDirectory,
  getAlumniProfile,
  getAlumniStatistics,
  getSuggestedAlumni
};