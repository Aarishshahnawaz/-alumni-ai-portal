/**
 * User Service Layer
 * Handles all user-related business logic with proper separation of concerns
 */

const User = require('../models/User');
const { logger } = require('../core/logger');
const { NotFoundError, ConflictError, ValidationError } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');

const userLogger = logger.child('UserService');

class UserService {
  /**
   * Create a new user with validation and security measures
   */
  static async createUser(userData) {
    const startTime = Date.now();
    
    try {
      userLogger.info('Creating new user', { email: userData.email, role: userData.role });

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Validate graduation year for students/alumni
      if (['student', 'alumni'].includes(userData.role) && !userData.profile?.graduationYear) {
        throw new ValidationError('Graduation year is required for students and alumni');
      }

      // Create user with hashed password
      const user = new User({
        email: userData.email.toLowerCase(),
        password: userData.password, // Will be hashed by pre-save middleware
        role: userData.role,
        profile: {
          ...userData.profile,
          // Ensure required fields are present
          firstName: userData.profile.firstName,
          lastName: userData.profile.lastName,
        },
        preferences: {
          emailNotifications: true,
          profileVisibility: 'public',
          mentorshipAvailable: userData.role === 'alumni',
        },
      });

      await user.save();

      userLogger.info('User created successfully', { 
        userId: user._id, 
        email: user.email,
        role: user.role,
        duration: Date.now() - startTime 
      });

      return user.getPublicProfile();
    } catch (error) {
      userLogger.error('Failed to create user', error, { 
        email: userData.email,
        duration: Date.now() - startTime 
      });
      throw error;
    }
  }

  /**
   * Authenticate user with enhanced security
   */
  static async authenticateUser(email, password) {
    const startTime = Date.now();
    
    try {
      userLogger.info('Authenticating user', { email });

      // Find user with password field
      const user = await User.findOne({ 
        email: email.toLowerCase(),
        isActive: true 
      }).select('+password');

      if (!user) {
        userLogger.warn('Authentication failed - user not found', { email });
        throw new ValidationError('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        userLogger.warn('Authentication failed - invalid password', { 
          userId: user._id,
          email 
        });
        throw new ValidationError('Invalid email or password');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      userLogger.info('User authenticated successfully', { 
        userId: user._id,
        email: user.email,
        role: user.role,
        duration: Date.now() - startTime 
      });

      return user.getPublicProfile();
    } catch (error) {
      userLogger.error('Authentication failed', error, { 
        email,
        duration: Date.now() - startTime 
      });
      throw error;
    }
  }

  /**
   * Get user by ID with caching support
   */
  static async getUserById(userId, includePrivate = false) {
    try {
      userLogger.debug('Fetching user by ID', { userId });

      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User');
      }

      return includePrivate ? user : user.getPublicProfile();
    } catch (error) {
      userLogger.error('Failed to fetch user', error, { userId });
      throw error;
    }
  }

  /**
   * Update user profile with validation
   */
  static async updateUserProfile(userId, profileData) {
    const startTime = Date.now();
    
    try {
      userLogger.info('Updating user profile', { userId });

      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User');
      }

      // Validate profile data
      if (profileData.email && profileData.email !== user.email) {
        const existingUser = await User.findOne({ 
          email: profileData.email.toLowerCase(),
          _id: { $ne: userId }
        });
        
        if (existingUser) {
          throw new ConflictError('Email already in use');
        }
      }

      // Update profile fields
      const allowedFields = [
        'firstName', 'lastName', 'bio', 'phone', 'dateOfBirth',
        'graduationYear', 'degree', 'major', 'currentPosition',
        'company', 'location', 'skills', 'interests', 'avatar'
      ];

      allowedFields.forEach(field => {
        if (profileData[field] !== undefined) {
          user.profile[field] = profileData[field];
        }
      });

      // Update preferences if provided
      if (profileData.preferences) {
        Object.assign(user.preferences, profileData.preferences);
      }

      // Update email if provided
      if (profileData.email) {
        user.email = profileData.email.toLowerCase();
      }

      user.updatedAt = new Date();
      await user.save();

      userLogger.info('User profile updated successfully', { 
        userId,
        updatedFields: Object.keys(profileData),
        duration: Date.now() - startTime 
      });

      return user.getPublicProfile();
    } catch (error) {
      userLogger.error('Failed to update user profile', error, { 
        userId,
        duration: Date.now() - startTime 
      });
      throw error;
    }
  }

  /**
   * Change user password with security validation
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const startTime = Date.now();
    
    try {
      userLogger.info('Changing user password', { userId });

      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new NotFoundError('User');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        userLogger.warn('Password change failed - invalid current password', { userId });
        throw new ValidationError('Current password is incorrect');
      }

      // Check if new password is different
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw new ValidationError('New password must be different from current password');
      }

      // Update password
      user.password = newPassword; // Will be hashed by pre-save middleware
      user.passwordChangedAt = new Date();
      
      // Invalidate all refresh tokens
      user.refreshTokens = [];
      
      await user.save();

      userLogger.info('Password changed successfully', { 
        userId,
        duration: Date.now() - startTime 
      });

      return { message: 'Password changed successfully' };
    } catch (error) {
      userLogger.error('Failed to change password', error, { 
        userId,
        duration: Date.now() - startTime 
      });
      throw error;
    }
  }

  /**
   * Get users with advanced filtering and pagination
   */
  static async getUsers(filters = {}, pagination = {}) {
    const startTime = Date.now();
    
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const skip = (page - 1) * limit;

      userLogger.debug('Fetching users with filters', { filters, pagination });

      // Build query
      const query = { isActive: true };
      
      if (filters.role) {
        query.role = filters.role;
      }
      
      if (filters.graduationYear) {
        query['profile.graduationYear'] = filters.graduationYear;
      }
      
      if (filters.skills && filters.skills.length > 0) {
        query['profile.skills'] = { $in: filters.skills };
      }
      
      if (filters.location) {
        const locationQuery = {};
        if (filters.location.city) locationQuery['profile.location.city'] = new RegExp(filters.location.city, 'i');
        if (filters.location.state) locationQuery['profile.location.state'] = new RegExp(filters.location.state, 'i');
        if (filters.location.country) locationQuery['profile.location.country'] = new RegExp(filters.location.country, 'i');
        Object.assign(query, locationQuery);
      }
      
      if (filters.search) {
        query.$or = [
          { 'profile.firstName': new RegExp(filters.search, 'i') },
          { 'profile.lastName': new RegExp(filters.search, 'i') },
          { 'profile.company': new RegExp(filters.search, 'i') },
          { 'profile.currentPosition': new RegExp(filters.search, 'i') },
        ];
      }

      // Execute query with pagination
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password -refreshTokens -__v')
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query)
      ]);

      const result = {
        users: users.map(user => ({
          ...user,
          profile: {
            ...user.profile,
            // Remove sensitive information
            phone: undefined,
            dateOfBirth: undefined,
          }
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        }
      };

      userLogger.debug('Users fetched successfully', { 
        count: users.length,
        total,
        duration: Date.now() - startTime 
      });

      return result;
    } catch (error) {
      userLogger.error('Failed to fetch users', error, { 
        filters,
        pagination,
        duration: Date.now() - startTime 
      });
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  static async deactivateUser(userId, reason = 'User requested') {
    try {
      userLogger.info('Deactivating user', { userId, reason });

      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User');
      }

      user.isActive = false;
      user.deactivatedAt = new Date();
      user.deactivationReason = reason;
      user.refreshTokens = []; // Invalidate all tokens

      await user.save();

      userLogger.info('User deactivated successfully', { userId });

      return { message: 'User account deactivated successfully' };
    } catch (error) {
      userLogger.error('Failed to deactivate user', error, { userId });
      throw error;
    }
  }

  /**
   * Get user statistics for admin dashboard
   */
  static async getUserStatistics(timeRange = '30d') {
    try {
      userLogger.debug('Generating user statistics', { timeRange });

      const now = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      const [
        totalUsers,
        activeUsers,
        newUsers,
        usersByRole,
        usersByGraduationYear,
        topSkills
      ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        User.countDocuments({ 
          isActive: true,
          lastLogin: { $gte: startDate }
        }),
        User.countDocuments({ 
          createdAt: { $gte: startDate }
        }),
        User.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]),
        User.aggregate([
          { $match: { isActive: true, 'profile.graduationYear': { $exists: true } } },
          { $group: { _id: '$profile.graduationYear', count: { $sum: 1 } } },
          { $sort: { _id: -1 } },
          { $limit: 10 }
        ]),
        User.aggregate([
          { $match: { isActive: true } },
          { $unwind: '$profile.skills' },
          { $group: { _id: '$profile.skills', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 }
        ])
      ]);

      const statistics = {
        overview: {
          totalUsers,
          activeUsers,
          newUsers,
          activityRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) : 0,
        },
        demographics: {
          byRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byGraduationYear: usersByGraduationYear,
        },
        skills: {
          topSkills: topSkills.map(skill => ({
            name: skill._id,
            count: skill.count
          }))
        },
        timeRange,
        generatedAt: new Date().toISOString(),
      };

      userLogger.debug('User statistics generated successfully', { 
        totalUsers,
        activeUsers,
        timeRange 
      });

      return statistics;
    } catch (error) {
      userLogger.error('Failed to generate user statistics', error, { timeRange });
      throw error;
    }
  }
}

module.exports = UserService;