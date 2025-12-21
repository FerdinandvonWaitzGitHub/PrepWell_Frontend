import { useNavigate } from 'react-router-dom';
import CheckInQuestionnaire from '../components/mentor/checkin-questionnaire';

/**
 * CheckIn Page - Full-page questionnaire for Well Score
 */
const CheckInPage = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/');
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <CheckInQuestionnaire
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
};

export default CheckInPage;
