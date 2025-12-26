import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Pencil, CreditCard } from 'lucide-react';
import { useAppMode } from '../../contexts/appmode-context';

/**
 * ProfileIcon component
 * User profile icon with dropdown menu
 *
 * Dropdown shows:
 * - Mein Profil
 * - Abmelden
 * - Current mode (Examensmodus / X. Semester) with edit option
 * - Subscription status (trial/subscribed)
 */
const ProfileIcon = ({ initials = 'CN', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const {
    isExamMode,
    modeDisplayText,
    isTrialMode,
  } = useAppMode();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleProfileClick = () => {
    navigate('/einstellungen');
    setIsOpen(false);
  };

  const handleLogout = () => {
    // Placeholder - no real logout functionality yet
    console.log('Logout clicked');
    setIsOpen(false);
  };

  const handleEditMode = () => {
    navigate('/einstellungen');
    setIsOpen(false);
  };

  const handleSubscriptionClick = () => {
    // Placeholder - no real subscription functionality yet
    console.log('Subscription clicked');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Profile Icon Button */}
      <button
        onClick={handleToggle}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-200 text-gray-900 text-xs font-medium cursor-pointer hover:bg-primary-300 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {initials}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-3 z-50">
          {/* Mein Profil */}
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4 text-gray-500" />
            <span>Mein Profil</span>
          </button>

          {/* Abmelden */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4 text-gray-500" />
            <span>Abmelden</span>
          </button>

          {/* Divider */}
          <div className="border-t border-gray-100 my-2" />

          {/* Current Mode */}
          <div className="px-4 py-2">
            <p className="text-xs text-gray-500 mb-1">Du befindest dich im</p>
            <button
              onClick={handleEditMode}
              className="flex items-center gap-2 text-sm text-gray-900 hover:text-gray-600 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              <span className="font-medium">{modeDisplayText}</span>
            </button>
          </div>

          {/* Subscription Status (Trial Mode) */}
          {isTrialMode && (
            <>
              <div className="border-t border-gray-100 my-2" />
              <div className="px-4 py-2">
                <p className="text-xs text-gray-500 mb-2">
                  {isExamMode
                    ? 'Du befindest dich im kostenlosen Probemonat'
                    : 'Du befindest dich im kostenlosen Probemonat für den normalen Modus'
                  }
                </p>
                <button
                  onClick={handleSubscriptionClick}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {isExamMode ? 'Abonnement verwalten' : 'Alle Funktionen freischalten'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileIcon;
