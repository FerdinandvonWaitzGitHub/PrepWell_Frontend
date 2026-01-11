import { useState } from 'react';
import { useTimer } from '../../../contexts/timer-context';
import TimerDisplay from './timer-display';
import TimerMainDialog from './timer-main-dialog';

/**
 * TimerButton - Main timer component for dashboard
 * Shows either a start button or the active timer display
 *
 * Features:
 * - Pomodoro Timer
 * - Countdown Timer
 * - Count-up Timer (Stoppuhr)
 * - Unified timer control dialog with integrated settings (no separate dialogs)
 */
const TimerButton = ({ className = '' }) => {
  const { isActive } = useTimer();
  const [showTimerMain, setShowTimerMain] = useState(false);

  // If timer is active, show the display
  if (isActive) {
    return (
      <div className={className}>
        <TimerDisplay onClick={() => setShowTimerMain(true)} />

        <TimerMainDialog
          open={showTimerMain}
          onOpenChange={setShowTimerMain}
        />
      </div>
    );
  }

  // Otherwise show the start button (clock icon) - opens main dialog
  return (
    <div className={className}>
      <button
        onClick={() => setShowTimerMain(true)}
        className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
        title="Timer starten"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-neutral-600"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>

      {/* Main Timer Dialog - handles everything inline */}
      <TimerMainDialog
        open={showTimerMain}
        onOpenChange={setShowTimerMain}
      />
    </div>
  );
};

export default TimerButton;
