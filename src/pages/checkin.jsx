import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckInQuestionnaire from '../components/mentor/checkin-questionnaire';
import GoodNightScreen from '../components/mentor/good-night-screen';
import { useCheckIn } from '../contexts/checkin-context';
import { useAuth } from '../contexts/auth-context';

/**
 * CheckIn Page - Full-page questionnaire for Well Score
 * TICKET-2: Shows GoodNightScreen after completing Abend-Check-in
 * BUG-B FIX: Route guard - redirect if mentor not activated
 */
const CheckInPage = () => {
  const navigate = useNavigate();
  const { getCurrentPeriod, isMentorActivated } = useCheckIn();

  // BUG-B FIX: Route guard - redirect wenn Mentor nicht aktiviert
  useEffect(() => {
    if (!isMentorActivated) {
      navigate('/', { replace: true });
    }
  }, [isMentorActivated, navigate]);

  const { getFirstName, signOut, isAuthenticated } = useAuth();
  const [showGoodNight, setShowGoodNight] = useState(false);

  // BUG-B FIX: Early return wenn Mentor nicht aktiviert (nach allen Hooks!)
  if (!isMentorActivated) {
    return null;
  }

  const handleComplete = () => {
    // If evening check-out, show Good Night screen
    if (getCurrentPeriod() === 'evening') {
      setShowGoodNight(true);
    } else {
      navigate('/');
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    if (isAuthenticated) {
      await signOut();
    }
    navigate('/');
  };

  // Show Good Night screen after evening check-out
  if (showGoodNight) {
    return (
      <GoodNightScreen
        userName={getFirstName() || 'User'}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <CheckInQuestionnaire
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
};

export default CheckInPage;
