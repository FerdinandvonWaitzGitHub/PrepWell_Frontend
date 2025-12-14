import React from 'react';

/**
 * ProfileIcon component
 * User profile icon with initials
 *
 * @param {string} initials - User initials (e.g., "CN")
 */
const ProfileIcon = ({ initials = 'CN', className = '' }) => {
  return (
    <div
      className={`flex items-center justify-center w-8 h-8 rounded-full bg-primary-200 text-gray-900 text-xs font-medium cursor-pointer hover:bg-primary-300 transition-colors ${className}`}
    >
      {initials}
    </div>
  );
};

export default ProfileIcon;
