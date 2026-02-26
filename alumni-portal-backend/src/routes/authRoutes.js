const express = require('express');
const router = express.Router();

// Import controllers
const {
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
  upload
} = require('../controllers/authController');

// Import middleware
const { authenticate, refreshToken } = require('../middleware/auth');
const { logAuthActivity, logActivity } = require('../middleware/activityLogger');
const {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateRefreshToken
} = require('../middleware/validation');

// Public routes
router.post('/register', 
  validateRegistration,
  logAuthActivity('user_register'),
  register
);

router.post('/login',
  validateLogin,
  logAuthActivity('user_login'),
  login
);

router.post('/refresh-token',
  validateRefreshToken,
  refreshToken,
  refreshAccessToken
);

// Password reset routes (public)
router.post('/forgot-password',
  logAuthActivity('forgot_password'),
  forgotPassword
);

router.post('/verify-otp',
  logAuthActivity('verify_otp'),
  verifyOTP
);

router.post('/reset-password',
  logAuthActivity('reset_password'),
  resetPassword
);

// Email verification routes (public)
router.get('/verify-email/:token',
  logAuthActivity('email_verification'),
  verifyEmail
);

router.post('/resend-verification',
  logAuthActivity('resend_verification'),
  resendVerificationEmail
);

// Protected routes (require authentication)
router.use(authenticate);

router.post('/logout',
  logAuthActivity('user_logout'),
  logout
);

router.get('/profile',
  logActivity('profile_view', 'user_profile', 'profile_management'),
  getProfile
);

router.put('/profile',
  validateProfileUpdate,
  logActivity('profile_update', 'user_profile', 'profile_management', {
    logRequestBody: true,
    getDetails: (req, res, responseData) => ({
      updatedFields: Object.keys(req.body.profile || {}),
      updatedPreferences: Object.keys(req.body.preferences || {})
    })
  }),
  updateProfile
);

router.put('/profile-image',
  upload.single('avatar'),
  logActivity('profile_image_upload', 'user_profile', 'profile_management'),
  uploadProfileImage
);

router.put('/change-password',
  validatePasswordChange,
  logActivity('password_change', 'user_security', 'security'),
  changePassword
);

module.exports = router;