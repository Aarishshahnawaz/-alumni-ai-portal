/**
 * Verification Token Utility
 * Generates temporary JWT tokens for email verification
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Generate temporary verification token (10 minutes validity)
 * @param {string} email - Verified email address
 * @param {string} role - User role (student/alumni)
 * @returns {string} - JWT token
 */
const generateVerificationToken = (email, role) => {
  const payload = {
    email,
    role,
    type: 'email_verification',
    timestamp: Date.now()
  };

  // Token expires in 10 minutes
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '10m' });
};

/**
 * Verify and decode verification token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded payload or null if invalid
 */
const verifyVerificationToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if it's a verification token
    if (decoded.type !== 'email_verification') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    // Token expired or invalid
    return null;
  }
};

module.exports = {
  generateVerificationToken,
  verifyVerificationToken
};
