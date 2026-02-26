import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ThemeLayout - Wraps authenticated pages to apply dark/light theme
 * This ensures theme only applies to dashboard and internal pages,
 * NOT to landing page or public routes
 */
const ThemeLayout = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        {children}
      </div>
    </div>
  );
};

export default ThemeLayout;
