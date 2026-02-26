/**
 * Pre-Registration Controller
 * Handles OTP-based email verification BEFORE user registration
 */

const EmailVerification = require('../models/EmailVerification');
const User = require('../models/User');
const { validateInstitutionalEmail } = require('../utils/emailValidator');
const { sendOTPEmail } = require('../utils/sendEmail');
const { generateVerificationToken } = require('../utils/verificationToken');

// Send OTP for email verification
const sendOTP = async (req, res) => {
  try {
    console.log('');
    console.log('🔍 ========== SEND OTP REQUEST START ==========');
    console.log('📦 Incoming body:', JSON.stringify(req.body, null, 2));
    
    const { email, role } = req.body;

    console.log('📧 Email:', email);
    console.log('👤 Role:', role);

    // Validate email
    if (!email) {
      console.log('❌ Email is missing');
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate role
    if (!role || !['student', 'alumni'].includes(role)) {
      console.log('❌ Invalid role:', role);
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either student or alumni.'
      });
    }

    console.log('✅ Basic validation passed');

    // Validate institutional email
    console.log('🔍 Validating institutional email...');
    try {
      const emailValidation = await validateInstitutionalEmail(email);
      console.log('📧 Email validation result:', emailValidation);
      
      if (!emailValidation.valid) {
        console.log('❌ Email validation failed:', emailValidation.message);
        return res.status(400).json({
          success: false,
          message: emailValidation.message
        });
      }
      console.log('✅ Email validation passed');
    } catch (validationError) {
      console.error('🔥 EMAIL VALIDATION ERROR:', validationError);
      console.error('🔥 ERROR STACK:', validationError.stack);
      throw validationError;
    }

    // Check if user already exists
    console.log('🔍 Checking for existing user...');
    try {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        console.log('❌ User already exists:', email);
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists. Please login instead.'
        });
      }
      console.log('✅ No existing user found');
    } catch (userCheckError) {
      console.error('🔥 USER CHECK ERROR:', userCheckError);
      console.error('🔥 ERROR STACK:', userCheckError.stack);
      throw userCheckError;
    }

    // Check for existing verification record
    console.log('🔍 Checking for existing verification record...');
    try {
      const existingVerification = await EmailVerification.findOne({ email });
      
      if (existingVerification) {
        console.log('⚠️ Existing verification found, checking resend limit...');
        // Check resend limit
        if (!EmailVerification.canResend(existingVerification)) {
          console.log('❌ Resend limit exceeded for:', email);
          return res.status(429).json({
            success: false,
            message: 'Too many OTP requests. Please try again after 1 hour.'
          });
        }
        console.log('✅ Resend allowed');
      } else {
        console.log('✅ No existing verification record');
      }

      // Generate 6-digit OTP
      console.log('🔢 Generating OTP...');
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('✅ OTP generated:', otp);
      
      // Set expiry to 5 minutes from now
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      console.log('⏰ OTP expires at:', expiresAt);

      // Delete any existing verification records for this email
      console.log('🗑️ Deleting old verification records...');
      await EmailVerification.deleteMany({ email });
      console.log('✅ Old records deleted');

      // Create new verification record (OTP will be hashed by pre-save middleware)
      console.log('💾 Creating new verification record...');
      const verification = new EmailVerification({
        email,
        role,
        otp, // Will be hashed automatically
        expiresAt,
        verified: false,
        attempts: 0,
        resendCount: existingVerification ? existingVerification.resendCount + 1 : 0,
        lastResendAt: new Date()
      });

      await verification.save();
      console.log('✅ Verification record saved (OTP hashed)');

      // Send OTP email (send plain OTP, not hashed)
      console.log('📧 Attempting to send OTP email...');
      console.log('📧 Email recipient:', email);
      console.log('📧 OTP to send:', otp);
      console.log('📧 Role:', role);
      
      try {
        await sendOTPEmail(email, otp, role);
        console.log('✅ OTP email sent successfully!');
      } catch (emailError) {
        console.error('');
        console.error('🔥 ========== EMAIL SEND ERROR ==========');
        console.error('🔥 Error name:', emailError.name);
        console.error('🔥 Error message:', emailError.message);
        console.error('🔥 Error code:', emailError.code);
        console.error('🔥 Full error:', emailError);
        console.error('🔥 Error stack:', emailError.stack);
        console.error('🔥 ========================================');
        console.error('');
        
        // Delete the verification record since email failed
        console.log('🗑️ Deleting verification record due to email failure...');
        await EmailVerification.deleteOne({ _id: verification._id });
        
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP email. Please check your email configuration.',
          error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
        });
      }

      console.log('✅ ========== SEND OTP SUCCESS ==========');
      console.log('');

      res.json({
        success: true,
        message: 'OTP sent successfully to your email. Please check your inbox.',
        data: {
          email,
          expiresIn: '5 minutes'
        }
      });

    } catch (verificationError) {
      console.error('🔥 VERIFICATION PROCESS ERROR:', verificationError);
      console.error('🔥 ERROR STACK:', verificationError.stack);
      throw verificationError;
    }

  } catch (error) {
    console.error('');
    console.error('🔥 ========== SEND OTP CRASH ==========');
    console.error('🔥 Error name:', error.name);
    console.error('🔥 Error message:', error.message);
    console.error('🔥 Error code:', error.code);
    console.error('🔥 Full error object:', error);
    console.error('🔥 Error stack:', error.stack);
    console.error('🔥 =====================================');
    console.error('');
    
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('🔍 Verifying OTP for:', email);

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find verification record (include OTP field)
    const verification = await EmailVerification.findOne({ 
      email: email.toLowerCase().trim()
    }).select('+otp');

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this email. Please request a new OTP.'
      });
    }

    // Check if expired
    if (new Date() > verification.expiresAt) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Check if already verified
    if (verification.verified) {
      // Generate new verification token
      const verificationToken = generateVerificationToken(verification.email, verification.role);
      
      return res.json({
        success: true,
        message: 'Email already verified. You can proceed with registration.',
        data: {
          email: verification.email,
          role: verification.role,
          verified: true,
          verificationToken
        }
      });
    }

    // Check attempts (max 5)
    if (verification.attempts >= 5) {
      await EmailVerification.deleteOne({ _id: verification._id });
      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      });
    }

    // Verify OTP using bcrypt comparison
    const isOTPValid = await verification.compareOTP(otp.trim());
    
    if (!isOTPValid) {
      // Increment attempts
      verification.attempts += 1;
      await verification.save();

      const remainingAttempts = 5 - verification.attempts;
      
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
      });
    }

    // OTP is valid - mark as verified
    verification.verified = true;
    await verification.save();

    // Generate temporary verification token (10 minutes)
    const verificationToken = generateVerificationToken(verification.email, verification.role);

    console.log('✅ OTP verified successfully');

    res.json({
      success: true,
      message: 'Email verified successfully! You can now complete your registration.',
      data: {
        email: verification.email,
        role: verification.role,
        verified: true,
        verificationToken // Send token to frontend
      }
    });

  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔄 Resending OTP for:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find existing verification record
    const verification = await EmailVerification.findOne({ 
      email: email.toLowerCase().trim()
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'No verification request found. Please start the registration process again.'
      });
    }

    // Check resend limit
    if (!EmailVerification.canResend(verification)) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again after 1 hour.'
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set new expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Update verification record
    verification.otp = otp; // Will be hashed by pre-save middleware
    verification.expiresAt = expiresAt;
    verification.attempts = 0;
    verification.verified = false;
    verification.resendCount += 1;
    verification.lastResendAt = new Date();
    await verification.save();

    // Send new OTP email
    try {
      await sendOTPEmail(verification.email, otp, verification.role);
      console.log('✅ OTP resent successfully');
    } catch (emailError) {
      console.error('❌ Failed to resend OTP email:', emailError.message);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to resend OTP email. Please check your email configuration.',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }

    res.json({
      success: true,
      message: 'New OTP sent successfully. Please check your email.',
      data: {
        email: verification.email,
        expiresIn: '5 minutes',
        remainingResends: 3 - verification.resendCount
      }
    });

  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP. Please try again.'
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP
};
