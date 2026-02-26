import React from 'react';
import { calculateProfileCompletion, getCompletionRingColor } from '../../utils/profileCompletion';

/**
 * Reusable Avatar Component with Circular Progress Ring
 * Shows profile image if available, otherwise shows initials
 * Displays profile completion ring around avatar
 * Supports different variants for different contexts
 * Automatically syncs with global user state
 */
const Avatar = ({ user, size = 80, variant = 'default', className = '' }) => {
  // Ring width based on variant
  const ringWidth = variant === 'profile' ? 8 : 3;
  const innerSpacing = variant === 'profile' ? 10 : 5;
  
  // Calculate profile completion using centralized utility
  const percentage = calculateProfileCompletion(user);
  
  // Check all possible avatar field locations
  const avatarPath = user?.avatar || user?.profile?.avatar || user?.profileImage || null;
  
  // Construct full image URL
  const backendUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const imageUrl = avatarPath ? `${backendUrl}${avatarPath}` : null;
  
  // Get initials from user name
  const getInitials = () => {
    const firstName = user?.profile?.firstName || user?.firstName || '';
    const lastName = user?.profile?.lastName || user?.lastName || '';
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  // SVG circle calculations
  const radius = (size / 2) - ringWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Ring color based on completion using centralized utility
  const ringColor = getCompletionRingColor(percentage);

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
    >
      {/* SVG Progress Ring */}
      <svg
        width={size}
        height={size}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: 'rotate(-90deg)',
        }}
      >
        {/* Background circle */}
        <circle
          stroke="#e5e7eb"
          fill="none"
          strokeWidth={ringWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        {/* Progress circle */}
        <circle
          stroke={ringColor}
          fill="none"
          strokeWidth={ringWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease',
          }}
        />
      </svg>

      {/* Avatar Image/Initials */}
      <div
        className="flex items-center justify-center rounded-full overflow-hidden bg-gray-300"
        style={{
          width: size - innerSpacing * 2,
          height: size - innerSpacing * 2,
          position: 'absolute',
          top: innerSpacing,
          left: innerSpacing,
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${user?.profile?.firstName || user?.firstName || 'User'}'s avatar`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide image on error and show initials
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <span
            className="font-semibold text-gray-700"
            style={{
              fontSize: (size - innerSpacing * 2) * 0.4,
            }}
          >
            {getInitials()}
          </span>
        )}
      </div>
    </div>
  );
};

export default Avatar;
