import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Pencil, CreditCard, X } from 'lucide-react';
import { useAppMode } from '../../contexts/appmode-context';
import { useAuth } from '../../contexts/auth-context';

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
const ProfileIcon = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const {
    isExamMode,
    modeDisplayText,
    isTrialMode,
  } = useAppMode();
  const { getInitials, signOut, isAuthenticated } = useAuth();

  // Get user initials from auth context
  const initials = getInitials();

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

  const handleLogout = async () => {
    setIsOpen(false);
    if (isAuthenticated) {
      await signOut();
    }
    navigate('/auth');
  };

  const handleEditMode = () => {
    navigate('/einstellungen');
    setIsOpen(false);
  };

  const handleSubscriptionClick = () => {
    setIsOpen(false);
    setShowComingSoon(true);
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

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Coming Soon</h3>
              <button
                onClick={() => setShowComingSoon(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Die Abo-Verwaltung wird bald verfügbar sein. Wir arbeiten daran, dir die beste Lernerfahrung zu bieten.
            </p>
            <button
              onClick={() => setShowComingSoon(false)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileIcon;
