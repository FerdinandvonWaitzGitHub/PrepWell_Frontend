import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckInQuestionnaire from '../components/mentor/checkin-questionnaire';
import GoodNightScreen from '../components/mentor/good-night-screen';
import { useCheckIn } from '../contexts/checkin-context';
import { useAuth } from '../contexts/auth-context';

/**
 * CheckIn Page - Full-page questionnaire for Well Score
 * Shows GoodNightScreen after completing evening Check-Out
 */
const CheckInPage = () => {
  const navigate = useNavigate();
  const { getCurrentPeriod } = useCheckIn();
  const { getFirstName, signOut, isAuthenticated } = useAuth();
  const [showGoodNight, setShowGoodNight] = useState(false);

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
