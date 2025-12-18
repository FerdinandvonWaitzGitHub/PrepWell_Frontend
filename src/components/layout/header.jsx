import React from 'react';
import Logo from './logo';
import Navigation from './navigation';
import ProfileIcon from './profile-icon';

/**
 * Header component
 * Main application header with logo, navigation, and profile
 *
 * @param {string} userInitials - User initials for profile icon
 * @param {string} currentPage - Current active page key for navigation highlighting
 */
const Header = ({ userInitials = 'CN', currentPage = 'kalender-monat', className = '' }) => {
  return (
    <header className={`flex items-center justify-between bg-white px-12.5 py-2 border-b border-gray-200 ${className}`}>
      {/* Logo */}
      <Logo />

      {/* Navigation Menu */}
      <Navigation currentPage={currentPage} />

      {/* Profile Icon */}
      <ProfileIcon initials={userInitials} />
    </header>
  );
};

export default Header;
