import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout';
import { MentorContent, MentorNotActivated } from '../components/mentor';
import { useMentor } from '../contexts/mentor-context';
import { useCheckIn } from '../contexts/checkin-context';
import { useStatistics } from '../hooks/useStatistics';

/**
 * MentorPage - Mentor
 * Statistics and analytics dashboard for learning progress
 */
const MentorPage = () => {
  const navigate = useNavigate();
  const { isActivated, activatedAt } = useMentor();
  const { todayCheckIn, getCurrentPeriod } = useCheckIn();
  const { scores } = useStatistics();

  // Current date display
  const today = new Date();
  const weekday = today.toLocaleDateString('de-DE', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Check if today's check-in is done (not skipped)
  const checkInDone = (todayCheckIn.morning?.answers && !todayCheckIn.morning?.skipped) ||
                      (todayCheckIn.evening?.answers && !todayCheckIn.evening?.skipped);

  // Get period label for button
  const currentPeriod = getCurrentPeriod();
  const periodLabel = currentPeriod === 'evening' ? 'Abend' : 'Morgen';

  // Handle check-in click
  const handleCheckInClick = () => {
    navigate('/checkin');
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <Header userInitials="CN" currentPage="mentor" />

      {/* Sub-Header - Custom for Mentor page */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white">
        {/* Left: Title + Date */}
        <div className="flex flex-col">
          <h1 className="text-lg font-medium text-neutral-900">Mentor</h1>
          <span className="text-xs text-neutral-500">{weekday}, {dateStr}</span>
        </div>

        {/* Right: Actions */}
        {isActivated ? (
          <div className="flex items-center gap-3">
            {checkInDone ? (
              /* Check-in completed state */
              <div className="flex items-center gap-2 text-neutral-700">
                <span className="text-sm">Check-Ins erledigt</span>
                {/* Double checkmark icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 7L9.5 15.5L6 12" />
                  <path d="M22 7L13.5 15.5L12 14" />
                </svg>
              </div>
            ) : (
              /* Check-in needed state */
              <>
                {/* Well Score Badge */}
                <div className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-lg font-semibold">
                  {Math.round(scores.wellScore || 0)}
                </div>

                {/* Check-in Button */}
                <button
                  onClick={handleCheckInClick}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-900 bg-white border border-neutral-300 rounded-full hover:bg-neutral-50 transition-colors"
                >
                  Check-In am {periodLabel}
                  <span className="text-neutral-400">→</span>
                </button>
              </>
            )}
          </div>
        ) : (
          /* Not activated state - show activate hint */
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-neutral-500">
                Mentor nicht aktiv
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-5">
        {isActivated ? (
          <MentorContent className="h-full" />
        ) : (
          <MentorNotActivated />
        )}
      </main>
    </div>
  );
};

export default MentorPage;
