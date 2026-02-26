// Token management utilities
export const setAuthToken = (token, refreshToken) => {
  if (token) {
    localStorage.setItem('token', token);
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

export const getStoredToken = () => {
  return localStorage.getItem('token');
};

export const getStoredRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

// Role-based access control
export const hasRole = (user, allowedRoles) => {
  if (!user || !user.role) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(user.role);
};

// Check if user has permission for specific action
export const hasPermission = (user, permission) => {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
};

// Format user display name
export const getUserDisplayName = (user) => {
  if (!user || !user.profile) return 'Unknown User';
  const { firstName, lastName } = user.profile;
  return `${firstName || ''} ${lastName || ''}`.trim() || user.email || 'Unknown User';
};

// Get user initials for avatar
export const getUserInitials = (user) => {
  if (!user || !user.profile) return 'U';
  const { firstName, lastName } = user.profile;
  const firstInitial = firstName ? firstName[0].toUpperCase() : '';
  const lastInitial = lastName ? lastName[0].toUpperCase() : '';
  return firstInitial + lastInitial || user.email?.[0]?.toUpperCase() || 'U';
};

// Check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Get token expiration time
export const getTokenExpiration = (token) => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch (error) {
    return null;
  }
};

// Format role for display
export const formatRole = (role) => {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

// Check if user profile is complete
export const isProfileComplete = (user) => {
  if (!user || !user.profile) return false;
  
  const requiredFields = ['firstName', 'lastName', 'graduationYear', 'major'];
  return requiredFields.every(field => user.profile[field]);
};

// Calculate profile completion percentage
export const getProfileCompletionPercentage = (user) => {
  if (!user || !user.profile) return 0;
  
  const allFields = [
    'firstName',
    'lastName',
    'graduationYear',
    'major',
    'currentCompany',
    'currentPosition',
    'location',
    'bio',
    'skills',
    'linkedinUrl'
  ];
  
  const completedFields = allFields.filter(field => {
    const value = user.profile[field];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value && value.toString().trim() !== '';
  });
  
  return Math.round((completedFields.length / allFields.length) * 100);
};