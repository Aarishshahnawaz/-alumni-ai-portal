/**
 * Email Validation Utility
 * Strict institutional email verification for students and alumni
 */

const dns = require('dns').promises;

// List of public email providers that are NOT allowed
const PUBLIC_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'zoho.com',
  'mail.com',
  'yandex.com',
  'gmx.com',
  'live.com',
  'msn.com',
  'rediffmail.com',
  'inbox.com',
  'fastmail.com',
];

/**
 * Validate email format using regex
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid format
 */
const isValidEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if email domain is a public provider
 * @param {string} email - Email address to check
 * @returns {boolean} - True if public domain
 */
const isPublicEmailDomain = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  return PUBLIC_EMAIL_DOMAINS.includes(domain);
};

/**
 * Check if domain is an institutional domain
 * Allowed patterns: .edu, .edu.in, .ac.in, .ac.uk, .gov, .org, or custom company domains
 * @param {string} email - Email address to check
 * @returns {boolean} - True if institutional domain
 */
const isInstitutionalDomain = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (!domain) return false;
  
  // Check for institutional patterns
  const institutionalPatterns = [
    /\.edu$/,           // .edu
    /\.edu\.[a-z]{2}$/, // .edu.in, .edu.pk, etc.
    /\.ac\.[a-z]{2}$/,  // .ac.in, .ac.uk, etc.
    /\.gov$/,           // .gov
    /\.gov\.[a-z]{2}$/, // .gov.in, etc.
    /\.org$/,           // .org
  ];
  
  // Check if matches any institutional pattern
  const matchesPattern = institutionalPatterns.some(pattern => pattern.test(domain));
  
  // If matches pattern, it's institutional
  if (matchesPattern) return true;
  
  // If doesn't match pattern but is not a public domain, allow it (company email)
  // This allows custom company domains like @company.com
  if (!PUBLIC_EMAIL_DOMAINS.includes(domain)) {
    return true;
  }
  
  return false;
};

/**
 * Verify domain has valid MX records (DNS check)
 * @param {string} email - Email address to check
 * @returns {Promise<boolean>} - True if domain has MX records
 */
const hasValidMXRecords = async (email) => {
  try {
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (!domain) return false;
    
    const mxRecords = await dns.resolveMx(domain);
    
    // Domain must have at least one MX record
    return mxRecords && mxRecords.length > 0;
  } catch (error) {
    // DNS lookup failed - domain doesn't exist or has no MX records
    return false;
  }
};

/**
 * Comprehensive email validation for institutional emails
 * @param {string} email - Email address to validate
 * @returns {Promise<Object>} - Validation result with success and message
 */
const validateInstitutionalEmail = async (email) => {
  // Step 1: Check email format
  if (!isValidEmailFormat(email)) {
    return {
      valid: false,
      message: 'Please enter a valid email address',
    };
  }
  
  // Step 2: Block public email providers (DISABLED IN DEVELOPMENT)
  // In development, allow all email domains for testing
  if (process.env.NODE_ENV === 'production') {
    if (isPublicEmailDomain(email)) {
      return {
        valid: false,
        message: 'Please use your official institutional email address. Public email providers (Gmail, Yahoo, Outlook, etc.) are not allowed.',
      };
    }
    
    // Step 3: Check if institutional domain
    if (!isInstitutionalDomain(email)) {
      return {
        valid: false,
        message: 'Please use an institutional or company email address.',
      };
    }
    
    // Step 4: Verify domain has MX records
    const hasMXRecords = await hasValidMXRecords(email);
    
    if (!hasMXRecords) {
      return {
        valid: false,
        message: 'Invalid institutional email domain. Please check your email address.',
      };
    }
  } else {
    console.log('⚠️  [DEV MODE] Allowing all email domains for testing:', email);
    console.log('⚠️  [DEV MODE] Public domain check: DISABLED');
    console.log('⚠️  [DEV MODE] MX record check: DISABLED');
  }
  
  // All checks passed
  return {
    valid: true,
    message: 'Email validation successful',
  };
};

module.exports = {
  validateInstitutionalEmail,
  isValidEmailFormat,
  isPublicEmailDomain,
  isInstitutionalDomain,
  hasValidMXRecords,
  PUBLIC_EMAIL_DOMAINS,
};
