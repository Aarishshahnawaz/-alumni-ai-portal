const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { autoLogActivity } = require('../middleware/activityLogger');
const { verifyVerificationToken } = require('../utils/verificationToken');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for profile image upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user._id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, role = 'student', profile, verificationToken } = req.body;

    console.log('📝 Registration request for:', email);

    // Verify the temporary verification token
    if (!verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required. Please verify your email first.',
        requiresVerification: true
      });
    }

    const tokenData = verifyVerificationToken(verificationToken);
    
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token. Please verify your email again.',
        requiresVerification: true
      });
    }

    // Ensure email matches the verified email
    if (tokenData.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Email mismatch. Please use the verified email address.'
      });
    }

    console.log('✅ Verification token validated');

    // Double-check email was verified in database
    const verification = await EmailVerification.findOne({ 
      email: email.toLowerCase().trim(),
      verified: true
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Email not verified. Please verify your email with OTP first.',
        requiresVerification: true
      });
    }

    // Check if verification expired (10 minutes after OTP verification)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (verification.expiresAt < tenMinutesAgo) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({
        success: false,
        message: 'Verification expired. Please verify your email again.',
        requiresVerification: true
      });
    }

    console.log('✅ Email pre-verification confirmed');

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const userData = {
      email,
      password,
      role: tokenData.role, // Use role from verification token
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        graduationYear: profile.graduationYear,
        degree: profile.degree,
        major: profile.major,
        currentCompany: profile.currentCompany,
        location: profile.location,
        bio: profile.bio || ''
      },
      isEmailVerified: true // Already verified via OTP
    };

    const user = new User(userData);
    await user.save();

    console.log('✅ User created successfully');

    // Delete verification record after successful registration
    await EmailVerification.deleteOne({ _id: verification._id });

    // Generate tokens for auto-login
    const tokenPayload = { id: user._id, email: user.email, role: user.role };
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token to user
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    // Get user without sensitive data
    const userResponse = user.getPublicProfile();

    res.status(201).json({
      success: true,
      message: 'Registration successful! You are now logged in.',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findByEmail(email).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const tokenPayload = { id: user._id, email: user.email, role: user.role };
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token and update last login
    user.refreshTokens.push({ token: refreshToken });
    user.lastLogin = new Date();
    await user.save();

    // Get user without sensitive data
    const userResponse = user.getPublicProfile();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;

    if (refreshToken) {
      // Remove the specific refresh token
      user.refreshTokens = user.refreshTokens.filter(
        tokenObj => tokenObj.token !== refreshToken
      );
    } else {
      // Remove all refresh tokens (logout from all devices)
      user.refreshTokens = [];
    }

    await user.save();

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed. Please try again.'
    });
  }
};

// Refresh access token
const refreshAccessToken = async (req, res) => {
  try {
    const user = req.user;
    const oldRefreshToken = req.refreshToken;

    // Generate new tokens
    const tokenPayload = { id: user._id, email: user.email, role: user.role };
    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(
      tokenObj => tokenObj.token !== oldRefreshToken
    );
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed. Please login again.'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    const userProfile = user.getPublicProfile();

    res.json({
      success: true,
      data: {
        user: userProfile
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    console.log('📝 Profile update request received');
    console.log('User ID:', req.user._id);
    console.log('🔍 Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 req.body.profile exists?', !!req.body.profile);
    console.log('🔍 req.body.profile.linkedin:', req.body.profile?.linkedin);
    console.log('🔍 req.body.profile.github:', req.body.profile?.github);
    
    const user = req.user;
    const updates = req.body;

    // Store original data for logging
    const originalProfile = user.profile ? { ...user.profile.toObject() } : {};
    const originalPreferences = user.preferences ? { ...user.preferences.toObject() } : {};

    // Update profile fields (if provided)
    if (updates.profile) {
      Object.keys(updates.profile).forEach(key => {
        if (updates.profile[key] !== undefined) {
          console.log(`Updating profile.${key}:`, updates.profile[key]);
          user.profile[key] = updates.profile[key];
        }
      });
      
      // Explicitly log LinkedIn and GitHub
      console.log('💼 LinkedIn value:', user.profile.linkedin);
      console.log('💻 GitHub value:', user.profile.github);
    }

    // Update preferences (if provided) - supports partial updates
    if (updates.preferences) {
      // Initialize preferences if it doesn't exist
      if (!user.preferences) {
        user.preferences = {};
      }
      
      Object.keys(updates.preferences).forEach(key => {
        if (updates.preferences[key] !== undefined) {
          console.log(`Updating preferences.${key}:`, updates.preferences[key]);
          user.preferences[key] = updates.preferences[key];
        }
      });
    }

    console.log('💾 Saving user to database...');
    await user.save();
    console.log('✅ User saved successfully');

    // Log profile update activity (only if significant changes)
    const hasProfileChanges = updates.profile && Object.keys(updates.profile).length > 0;
    const hasPreferenceChanges = updates.preferences && Object.keys(updates.preferences).length > 0;
    
    if (hasProfileChanges || hasPreferenceChanges) {
      await autoLogActivity(
        user._id,
        'profile_update',
        'user_profile',
        {
          updatedFields: Object.keys(updates.profile || {}),
          updatedPreferences: Object.keys(updates.preferences || {}),
          profileChanges: hasProfileChanges ? getChangedFields(originalProfile, user.profile.toObject()) : {},
          preferencesChanges: hasPreferenceChanges ? getChangedFields(originalPreferences, user.preferences.toObject()) : {}
        },
        req
      );
    }

    const userResponse = user.getPublicProfile();

    console.log('✅ Profile update successful');
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    console.error('❌ Profile update error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      console.error('Validation errors:', errors);
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Profile update failed. Please try again.'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    
    // Clear all refresh tokens (force re-login on all devices)
    user.refreshTokens = [];
    
    await user.save();

    // Log password change activity
    await autoLogActivity(
      user._id,
      'password_change',
      'user_security',
      {
        forcedLogoutAllDevices: true
      },
      req
    );

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed. Please try again.'
    });
  }
};

// Helper function to get changed fields
const getChangedFields = (original, updated) => {
  const changes = {};
  
  Object.keys(updated).forEach(key => {
    if (JSON.stringify(original[key]) !== JSON.stringify(updated[key])) {
      changes[key] = {
        from: original[key],
        to: updated[key]
      };
    }
  });
  
  return changes;
};

module.exports = {
  register,
  login,
  logout,
  refreshAccessToken,
  getProfile,
  updateProfile,
  changePassword
};


// Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email).select('+resetOTPAttempts');
    
    if (!user) {
      // Don't reveal if email exists or not (security)
      return res.json({
        success: true,
        message: 'If the email exists, an OTP has been sent to it.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP expiry (10 minutes from now)
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP to user
    user.resetOTP = otp;
    user.resetOTPExpiry = otpExpiry;
    user.resetOTPAttempts = 0; // Reset attempts
    await user.save();

    // Send OTP email
    const { sendOTPEmail } = require('../services/emailService');
    await sendOTPEmail(user.email, otp, user.profile.firstName);

    console.log('🔐 OTP generated for:', user.email);
    console.log('📧 OTP sent to email');

    res.json({
      success: true,
      message: 'OTP has been sent to your email address. Please check your inbox.',
      data: {
        email: user.email,
        expiresIn: '10 minutes'
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request. Please try again.'
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find user with OTP fields
    const user = await User.findByEmail(email).select('+resetOTP +resetOTPExpiry +resetOTPAttempts');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP exists
    if (!user.resetOTP || !user.resetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }

    // Check if OTP has expired
    if (new Date() > user.resetOTPExpiry) {
      // Clear expired OTP
      user.resetOTP = undefined;
      user.resetOTPExpiry = undefined;
      user.resetOTPAttempts = 0;
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check attempts (max 3)
    if (user.resetOTPAttempts >= 3) {
      // Clear OTP after max attempts
      user.resetOTP = undefined;
      user.resetOTPExpiry = undefined;
      user.resetOTPAttempts = 0;
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'Maximum OTP attempts exceeded. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (user.resetOTP !== otp) {
      // Increment attempts
      user.resetOTPAttempts += 1;
      await user.save();

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - user.resetOTPAttempts} attempts remaining.`
      });
    }

    // OTP is valid
    console.log('✅ OTP verified for:', user.email);

    res.json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      data: {
        email: user.email,
        verified: true
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user with OTP fields
    const user = await User.findByEmail(email).select('+resetOTP +resetOTPExpiry +resetOTPAttempts +password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP exists
    if (!user.resetOTP || !user.resetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }

    // Check if OTP has expired
    if (new Date() > user.resetOTPExpiry) {
      user.resetOTP = undefined;
      user.resetOTPExpiry = undefined;
      user.resetOTPAttempts = 0;
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Verify OTP one more time
    if (user.resetOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    
    // Clear OTP fields
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    user.resetOTPAttempts = 0;
    
    // Clear all refresh tokens (logout from all devices)
    user.refreshTokens = [];
    
    await user.save();

    // Send success email
    const { sendPasswordResetSuccessEmail } = require('../services/emailService');
    await sendPasswordResetSuccessEmail(user.email, user.profile.firstName);

    // Log activity
    const { autoLogActivity } = require('../middleware/activityLogger');
    await autoLogActivity(
      user._id,
      'password_reset',
      'user_security',
      {
        method: 'otp',
        timestamp: new Date()
      },
      req
    );

    console.log('✅ Password reset successful for:', user.email);

    res.json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.'
    });
  }
};

// Upload Profile Image
const uploadProfileImage = async (req, res) => {
  try {
    console.log('📤 Profile image upload request received');
    console.log('User ID:', req.user._id);
    console.log('File:', req.file);

    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Fetch user from database
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Delete old avatar if exists
    if (user.profile.avatar) {
      const oldAvatarPath = path.join(process.cwd(), 'uploads', 'avatars', path.basename(user.profile.avatar));
      try {
        await fs.unlink(oldAvatarPath);
        console.log('🗑️ Old avatar deleted');
      } catch (error) {
        console.log('⚠️ Old avatar not found or already deleted');
      }
    }

    // Save new avatar path (relative path for serving)
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    user.profile.avatar = avatarPath;
    await user.save();

    console.log('✅ Profile image saved:', avatarPath);

    // Log activity
    await autoLogActivity(
      user._id,
      'profile_image_update',
      'user_profile',
      {
        filename: req.file.filename,
        size: req.file.size
      },
      req
    );

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        avatar: avatarPath,
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('❌ Upload profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile image. Please try again.'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshAccessToken,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOTP,
  resetPassword,
  uploadProfileImage,
  upload // Export multer middleware
};


// Verify Email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    console.log('🔍 Verifying email with token:', token);

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      console.log('❌ Invalid or expired token');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link. Please request a new verification email.'
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    console.log('✅ Email verified successfully for:', user.email);

    // Log activity
    await autoLogActivity(
      user._id,
      'email_verified',
      'user_security',
      {
        email: user.email,
        verifiedAt: new Date()
      },
      req
    );

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in to your account.',
      data: {
        email: user.email,
        verified: true
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed. Please try again.'
    });
  }
};

// Resend Verification Email
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await User.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists or not (security)
      return res.json({
        success: true,
        message: 'If the email exists and is not verified, a verification link has been sent.'
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified. You can log in now.'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send verification email
    const { sendVerificationEmail } = require('../services/emailService');
    await sendVerificationEmail(user.email, verificationToken, user.profile.firstName);

    console.log('✅ Verification email resent to:', user.email);

    res.json({
      success: true,
      message: 'Verification link has been sent to your email. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email. Please try again.'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshAccessToken,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOTP,
  resetPassword,
  uploadProfileImage,
  verifyEmail,
  resendVerificationEmail,
  upload // Export multer middleware
};
