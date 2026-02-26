/**
 * Profile Completion Utility
 * Centralized logic for calculating profile completion percentage
 */

/**
 * Calculate profile completion percentage
 * @param {Object} user - User object from Redux state
 * @returns {number} - Completion percentage (0-100)
 */
export const calculateProfileCompletion = (user) => {
  if (!user) return 0;

  // Define all fields that contribute to profile completion
  const fields = [
    user.profile?.firstName,
    user.profile?.lastName,
    user.email,
    user.profile?.location,
    user.profile?.graduationYear,
    user.profile?.currentCompany,
    user.profile?.skills?.length > 0,
    user.profile?.bio,
    user.profile?.avatar,
    user.profile?.linkedin,
    user.profile?.github,
  ];

  // Count filled fields (truthy values)
  const filledFields = fields.filter(field => field && field !== '').length;
  
  // Calculate percentage
  const percentage = Math.round((filledFields / fields.length) * 100);
  
  return percentage;
};

/**
 * Get profile completion details
 * @param {Object} user - User object from Redux state
 * @returns {Object} - Detailed completion info
 */
export const getProfileCompletionDetails = (user) => {
  if (!user) {
    return {
      percentage: 0,
      totalFields: 11,
      filledFields: 0,
      missingFields: [],
    };
  }

  const fieldChecks = [
    { name: 'First Name', value: user.profile?.firstName, field: 'firstName' },
    { name: 'Last Name', value: user.profile?.lastName, field: 'lastName' },
    { name: 'Email', value: user.email, field: 'email' },
    { name: 'Location', value: user.profile?.location, field: 'location' },
    { name: 'Graduation Year', value: user.profile?.graduationYear, field: 'graduationYear' },
    { name: 'Company', value: user.profile?.currentCompany, field: 'currentCompany' },
    { name: 'Skills', value: user.profile?.skills?.length > 0, field: 'skills' },
    { name: 'Bio', value: user.profile?.bio, field: 'bio' },
    { name: 'Profile Picture', value: user.profile?.avatar, field: 'avatar' },
    { name: 'LinkedIn', value: user.profile?.linkedin, field: 'linkedin' },
    { name: 'GitHub', value: user.profile?.github, field: 'github' },
  ];

  const filledFields = fieldChecks.filter(check => check.value && check.value !== '');
  const missingFields = fieldChecks.filter(check => !check.value || check.value === '');

  return {
    percentage: Math.round((filledFields.length / fieldChecks.length) * 100),
    totalFields: fieldChecks.length,
    filledFields: filledFields.length,
    missingFields: missingFields.map(f => ({ name: f.name, field: f.field })),
  };
};

/**
 * Get completion status color
 * @param {number} percentage - Completion percentage
 * @returns {string} - Color class or hex code
 */
export const getCompletionColor = (percentage) => {
  if (percentage === 100) return '#22c55e'; // green-500
  if (percentage >= 75) return '#3b82f6'; // blue-500
  if (percentage >= 50) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
};

/**
 * Get completion ring color for Avatar component
 * @param {number} percentage - Completion percentage
 * @returns {string} - Hex color code
 */
export const getCompletionRingColor = (percentage) => {
  return percentage === 100 ? '#22c55e' : '#3b82f6';
};
