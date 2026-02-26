const express = require('express');
const router = express.Router();

// Import controllers
const {
  sendOTP,
  verifyOTP,
  resendOTP
} = require('../controllers/preRegistrationController');

// Import middleware
const { logAuthActivity } = require('../middleware/activityLogger');

// Pre-registration routes (public)
router.post('/send-otp',
  logAuthActivity('send_registration_otp'),
  sendOTP
);

router.post('/verify-otp',
  logAuthActivity('verify_registration_otp'),
  verifyOTP
);

router.post('/resend-otp',
  logAuthActivity('resend_registration_otp'),
  resendOTP
);

module.exports = router;
