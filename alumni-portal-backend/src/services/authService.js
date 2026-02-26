/**
 * Authentication Service Layer
 * Handles JWT token management, refresh tokens, and authentication security
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { logger } = require('../core/logger');
const { AuthenticationError, ValidationError } = require('../middleware/errorHandler');

const authLogger = logger.child('AuthService');

class AuthService {
  /**
   * Generate access token with enhanced security
   */
  static generateAccessToken(payload) {
    try {
      const tokenPayload = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomUUID(), // JWT ID for token tracking
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '15m',
        issuer: 'alumni-portal',
        audience: 'alumni-portal-users',
      });

      authLogger.debug('Access token generated', { 
        userId: payload.id,
        jti: tokenPayload.jti 
      });

      return token;
    } catch (error) {
      authLogger.error('Failed to generate access token', error, { userId: payload.id });
      throw new Error('Token generation failed');
    }
  }

  /**
   * Generate refresh token with rotation support
   */
  static generateRefreshToken(payload) {
    try {
      const tokenPayload = {
        id: payload.id,
        email: payload.email,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomUUID(),
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
        issuer: 'alumni-portal',
        audience: 'alumni-portal-users',
      });

      authLogger.debug('Refresh token generated', { 
        userId: payload.id,
        jti: tokenPayload.jti 
      });

      return token;
    } catch (error) {
      authLogger.error('Failed to generate refresh token', error, { userId: payload.id });
      throw new Error('Refresh token generation failed');
    }
  }

  /**
   * Verify access token with comprehensive validation
   */
  static async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'alumni-portal',
        audience: 'alumni-portal-users',
      });

      // Check if user still exists and is active
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new AuthenticationError('User account not found or inactive');
      }

      // Check if password was changed after token was issued
      if (user.passwordChangedAt && decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
        throw new AuthenticationError('Token invalid due to password change');
      }

      authLogger.debug('Access token verified successfully', { 
        userId: decoded.id,
        jti: decoded.jti 
      });

      return {
        user: user.getPublicProfile(),
        tokenData: decoded,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        authLogger.debug('Access token expired');
        throw new AuthenticationError('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        authLogger.warn('Invalid access token', { error: error.message });
        throw new AuthenticationError('Invalid token');
      }
      
      authLogger.error('Token verification failed', error);
      throw error;
    }
  }

  /**
   * Verify refresh token and handle rotation
   */
  static async verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        issuer: 'alumni-portal',
        audience: 'alumni-portal-users',
      });

      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
      }

      // Find user and check if refresh token exists
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new AuthenticationError('User account not found or inactive');
      }

      // Check if refresh token is in user's valid tokens
      const tokenExists = user.refreshTokens.some(
        tokenObj => tokenObj.token === token && tokenObj.isActive
      );

      if (!tokenExists) {
        authLogger.warn('Refresh token not found in user tokens', { 
          userId: decoded.id,
          jti: decoded.jti 
        });
        throw new AuthenticationError('Invalid refresh token');
      }

      authLogger.debug('Refresh token verified successfully', { 
        userId: decoded.id,
        jti: decoded.jti 
      });

      return {
        user: user.getPublicProfile(),
        tokenData: decoded,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        authLogger.debug('Refresh token expired');
        throw new AuthenticationError('Refresh token expired');
      } else if (error.name === 'JsonWebTokenError') {
        authLogger.warn('Invalid refresh token', { error: error.message });
        throw new AuthenticationError('Invalid refresh token');
      }
      
      authLogger.error('Refresh token verification failed', error);
      throw error;
    }
  }

  /**
   * Refresh access token with token rotation
   */
  static async refreshAccessToken(refreshToken) {
    const startTime = Date.now();
    
    try {
      authLogger.info('Refreshing access token');

      // Verify refresh token
      const { user, tokenData } = await this.verifyRefreshToken(refreshToken);

      // Generate new tokens
      const newAccessToken = this.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const newRefreshToken = this.generateRefreshToken({
        id: user.id,
        email: user.email,
      });

      // Update user's refresh tokens (token rotation)
      const userDoc = await User.findById(user.id);
      
      // Remove old refresh token
      userDoc.refreshTokens = userDoc.refreshTokens.filter(
        tokenObj => tokenObj.token !== refreshToken
      );

      // Add new refresh token
      userDoc.refreshTokens.push({
        token: newRefreshToken,
        createdAt: new Date(),
        isActive: true,
        userAgent: null, // Will be set by controller
        ipAddress: null, // Will be set by controller
      });

      // Clean up expired tokens (keep only last 5 active tokens)
      userDoc.refreshTokens = userDoc.refreshTokens
        .filter(tokenObj => tokenObj.isActive)
        .slice(-5);

      await userDoc.save();

      authLogger.info('Access token refreshed successfully', { 
        userId: user.id,
        duration: Date.now() - startTime 
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user,
      };
    } catch (error) {
      authLogger.error('Failed to refresh access token', error, { 
        duration: Date.now() - startTime 
      });
      throw error;
    }
  }

  /**
   * Store refresh token for user
   */
  static async storeRefreshToken(userId, refreshToken, metadata = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }

      // Add refresh token with metadata
      user.refreshTokens.push({
        token: refreshToken,
        createdAt: new Date(),
        isActive: true,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
      });

      // Keep only last 5 refresh tokens per user
      user.refreshTokens = user.refreshTokens.slice(-5);

      await user.save();

      authLogger.debug('Refresh token stored', { 
        userId,
        tokenCount: user.refreshTokens.length 
      });
    } catch (error) {
      authLogger.error('Failed to store refresh token', error, { userId });
      throw error;
    }
  }

  /**
   * Revoke refresh token (logout)
   */
  static async revokeRefreshToken(userId, refreshToken) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }

      // Mark refresh token as inactive
      const tokenIndex = user.refreshTokens.findIndex(
        tokenObj => tokenObj.token === refreshToken
      );

      if (tokenIndex !== -1) {
        user.refreshTokens[tokenIndex].isActive = false;
        user.refreshTokens[tokenIndex].revokedAt = new Date();
        await user.save();
      }

      authLogger.info('Refresh token revoked', { userId });
    } catch (error) {
      authLogger.error('Failed to revoke refresh token', error, { userId });
      throw error;
    }
  }

  /**
   * Revoke all refresh tokens for user (logout from all devices)
   */
  static async revokeAllRefreshTokens(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }

      // Mark all refresh tokens as inactive
      user.refreshTokens.forEach(tokenObj => {
        tokenObj.isActive = false;
        tokenObj.revokedAt = new Date();
      });

      await user.save();

      authLogger.info('All refresh tokens revoked', { 
        userId,
        tokenCount: user.refreshTokens.length 
      });
    } catch (error) {
      authLogger.error('Failed to revoke all refresh tokens', error, { userId });
      throw error;
    }
  }

  /**
   * Clean up expired refresh tokens
   */
  static async cleanupExpiredTokens() {
    try {
      authLogger.info('Starting refresh token cleanup');

      const expirationTime = new Date();
      expirationTime.setDate(expirationTime.getDate() - 7); // 7 days ago

      const result = await User.updateMany(
        {},
        {
          $pull: {
            refreshTokens: {
              $or: [
                { isActive: false },
                { createdAt: { $lt: expirationTime } }
              ]
            }
          }
        }
      );

      authLogger.info('Refresh token cleanup completed', { 
        modifiedUsers: result.modifiedCount 
      });

      return result;
    } catch (error) {
      authLogger.error('Failed to cleanup expired tokens', error);
      throw error;
    }
  }

  /**
   * Get active sessions for user
   */
  static async getActiveSessions(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }

      const activeSessions = user.refreshTokens
        .filter(tokenObj => tokenObj.isActive)
        .map(tokenObj => ({
          id: tokenObj._id,
          createdAt: tokenObj.createdAt,
          userAgent: tokenObj.userAgent,
          ipAddress: tokenObj.ipAddress,
          isCurrent: false, // Will be determined by controller
        }));

      return activeSessions;
    } catch (error) {
      authLogger.error('Failed to get active sessions', error, { userId });
      throw error;
    }
  }

  /**
   * Validate token strength and security
   */
  static validateTokenSecurity(token) {
    try {
      // Basic token format validation
      if (!token || typeof token !== 'string') {
        return { valid: false, reason: 'Invalid token format' };
      }

      // Check token length (JWT tokens should be reasonably long)
      if (token.length < 100) {
        return { valid: false, reason: 'Token too short' };
      }

      // Check JWT structure (header.payload.signature)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, reason: 'Invalid JWT structure' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, reason: 'Token validation error' };
    }
  }
}

module.exports = AuthService;