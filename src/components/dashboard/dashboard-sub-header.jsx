import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer, TIMER_TYPES } from '../../contexts/timer-context';
import { useCheckIn } from '../../contexts/checkin-context';

/**
 * Format seconds to human-readable time string
 * Reserved for future use
 */
const _formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
};
void _formatTime;

/**
 * Format hours:minutes for display (e.g., "6:22h")
 */
const formatHoursMinutes = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}h`;
};

/**
 * Get current time as HH:MM string
 */
const getCurrentTimeString = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * CircularProgress - SVG circular progress indicator
 */
const CircularProgress = ({ progress = 0, size = 24, strokeWidth = 2 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-neutral-200"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        className="text-neutral-900"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
};

/**
 * TimerWidget - Shows the currently active timer
 * Based on Figma design with current time display
 * T16-W6: Added play/pause button for quick control
 */
const TimerWidget = ({ onClick }) => {
  const { timerType, isActive, getDisplayInfo, togglePause, elapsedSeconds, remainingSeconds, state: _state } = useTimer();
  void _state; // Reserved for future use
  const [currentTime, setCurrentTime] = React.useState(getCurrentTimeString());
  const [isHovered, setIsHovered] = useState(false); // T16-W6: Hover state for play/pause button

  // Update current time every second
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // If no timer is active, show start button
  if (!isActive) {
    return (
      <button
        onClick={onClick}
        className="inline-flex justify-end items-center gap-4 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 shadow-xs hover:bg-neutral-50 transition-colors"
      >
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-sm font-medium text-neutral-700">Timer starten</span>
          <span className="text-xs text-neutral-500">{currentTime}</span>
        </div>
        <div className="p-2 bg-white rounded-lg border border-neutral-200 shadow-xs">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
      </button>
    );
  }

  const displayInfo = getDisplayInfo();
  if (!displayInfo) return null;

  const { primaryText, secondaryText, progress, isPaused } = displayInfo;

  // PW-009: Format seconds with MM:SS or H:MM:SS (for hover)
  const formatWithSeconds = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine label based on timer type
  // PW-009: Show seconds on hover
  const getTimerLabel = () => {
    if (isHovered) {
      // Show seconds when hovering
      switch (timerType) {
        case TIMER_TYPES.POMODORO:
        case TIMER_TYPES.COUNTDOWN:
          return formatWithSeconds(remainingSeconds);
        case TIMER_TYPES.COUNTUP:
          return formatWithSeconds(elapsedSeconds);
        default:
          return primaryText;
      }
    }
    // Normal display without seconds
    switch (timerType) {
      case TIMER_TYPES.POMODORO:
        return primaryText; // e.g., "6min verbleibend"
      case TIMER_TYPES.COUNTDOWN:
        return primaryText; // e.g., "1h 34min verbleibend"
      case TIMER_TYPES.COUNTUP:
        return primaryText; // e.g., "6h 22min gelernt"
      default:
        return primaryText;
    }
  };

  // Determine secondary text
  const getSecondaryLabel = () => {
    // PW-013 Fix: Don't override secondaryText with confusing current time
    if (timerType === TIMER_TYPES.COUNTUP) {
      return secondaryText || 'Tagesziel erreicht';
    }
    return secondaryText || currentTime;
  };

  // T16-W6: Handle play/pause without opening dialog
  const handlePlayPause = (e) => {
    e.stopPropagation();
    togglePause();
  };

  return (
    <div
      className="inline-flex items-center gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main timer area - opens dialog */}
      <button
        onClick={onClick}
        className="inline-flex justify-end items-center gap-4 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 shadow-xs hover:bg-neutral-50 transition-colors"
      >
        <div className="flex flex-col items-end gap-0.5">
          <span className={`text-sm font-medium ${isPaused ? 'text-neutral-500' : 'text-neutral-900'}`}>
            {isPaused && '⏸ '}{getTimerLabel()}
          </span>
          <span className="text-xs text-neutral-500">{getSecondaryLabel()}</span>
        </div>
        <div className="p-2 bg-white rounded-lg border border-neutral-200 shadow-xs">
          <CircularProgress progress={progress} size={24} strokeWidth={2.5} />
        </div>
      </button>

      {/* T16-W6: Play/Pause Button - visible on hover */}
      {isHovered && (
        <button
          onClick={handlePlayPause}
          className="p-2 bg-white rounded-lg shadow-xs border border-neutral-200 hover:bg-neutral-50 transition-colors"
          title={isPaused ? 'Fortsetzen' : 'Pausieren'}
        >
          {isPaused ? (
            // Play Icon
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-neutral-600">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ) : (
            // Pause Icon
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-neutral-600">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

/**
 * DashboardSubHeader - Sub-header for Dashboard page
 *
 * Left side: Day/Date, "Dashboard", Check-In button, Progress bar
 * Right side: Active timer widget
 *
 * Check-In button activation logic:
 * - 18 Uhr UND (80% Aufgaben ODER 80% Lernziel erreicht)
 * - States: disabled (gray), active (clickable), completed (checkmark)
 */
const DashboardSubHeader = ({
  displayDate,
  tasksCompleted = 0,
  tasksTotal = 0,
  learningMinutesCompleted = 0,
  learningMinutesGoal = 0, // BUG-022 FIX: Default to 0, not 480 - goal comes from settings or planned blocks
  checkInDone = false,
  checkInStatus = null, // TICKET-1: Detailed check-in status { morningDone, eveningDone, count, allDone }
  isMentorActivated = false, // T16-W1: Only show check-in if mentor is activated
  onTimerClick,
}) => {
  const navigate = useNavigate();
  const { getCurrentPeriod, todayCheckIn: _todayCheckIn } = useCheckIn();
  void _todayCheckIn; // Reserved for future use

  const currentPeriod = getCurrentPeriod();
  const isEvening = currentPeriod === 'evening';

  // Calculate percentages
  const taskPercentage = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;
  const learningPercentage = learningMinutesGoal > 0
    ? (learningMinutesCompleted / learningMinutesGoal) * 100
    : 0;

  // Check if current hour is >= 18
  const currentHour = new Date().getHours();
  const isAfter18 = currentHour >= 18;

  // Check-In button logic: 18 Uhr UND (80% Aufgaben ODER 80% Lernziel)
  const checkInEnabled = useMemo(() => {
    // If check-in is already done, button should show completed state
    if (checkInDone) return true;

    // For evening check-in: must be after 18:00 AND (80% tasks OR 80% learning goal)
    if (isEvening) {
      const hasEnoughTasks = taskPercentage >= 80;
      const hasEnoughLearning = learningPercentage >= 80;
      return isAfter18 && (hasEnoughTasks || hasEnoughLearning);
    }

    // For morning check-in: always enabled
    return true;
  }, [checkInDone, isEvening, isAfter18, taskPercentage, learningPercentage]);

  const handleCheckInClick = () => {
    if (checkInEnabled && !checkInDone) {
      navigate('/checkin');
    }
  };

  // Button label and state
  // PW-011: Revised visibility logic
  // PW-022: Extended for disabled and evening-only modes
  const getCheckInButton = () => {
    // PW-011: All expected check-ins completed → hide button completely
    if (checkInStatus?.allDone) {
      return null;
    }

    // PW-022: If current period's check-in is not expected, hide button
    // Morning period but morning not expected (e.g., evening-only mode)
    if (!isEvening && checkInStatus?.morningExpected === false) {
      return null;
    }
    // Evening period but evening not expected (e.g., morning-only mode)
    if (isEvening && checkInStatus?.eveningExpected === false) {
      return null;
    }

    // PW-011: Morning period check-in done → hide button until evening rules apply
    // (Button will reappear when evening conditions are met)
    if (!isEvening && checkInStatus?.morningDone && !checkInStatus?.morningSkipped) {
      return null;
    }

    // PW-011: Evening period and evening check-in done → hide button
    if (isEvening && checkInStatus?.eveningDone && !checkInStatus?.eveningSkipped) {
      return null;
    }

    // PW-011: Skipped check-in → show clickable button so user can complete it
    // Morning skipped but not done: show button to complete morning check-in (only if expected)
    if (checkInStatus?.morningSkipped && !checkInStatus?.morningDone && checkInStatus?.morningExpected !== false) {
      return (
        <button
          onClick={handleCheckInClick}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-neutral-200 bg-white shadow-xs text-neutral-800 hover:bg-neutral-50 text-xs transition-colors"
        >
          <span>Morgen-Check-in nachholen</span>
          <span className="text-neutral-500">→</span>
        </button>
      );
    }

    // Evening skipped but not done: show button to complete evening check-in (only if expected)
    if (checkInStatus?.eveningSkipped && !checkInStatus?.eveningDone && checkInStatus?.eveningExpected !== false) {
      return (
        <button
          onClick={handleCheckInClick}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-neutral-200 bg-white shadow-xs text-neutral-800 hover:bg-neutral-50 text-xs transition-colors"
        >
          <span>Abend-Check-in nachholen</span>
          <span className="text-neutral-500">→</span>
        </button>
      );
    }

    // Evening period but rules not met → show disabled state
    if (isEvening && !checkInEnabled) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-neutral-200 bg-neutral-50 text-neutral-400 text-xs cursor-not-allowed">
          <span>Abend-Check-in</span>
          <span className="text-neutral-300">→</span>
        </div>
      );
    }

    // Active state - current period's check-in is available
    const label = isEvening ? 'Abend-Check-in' : 'Morgen-Check-in';
    return (
      <button
        onClick={handleCheckInClick}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-neutral-200 bg-white shadow-xs text-neutral-800 hover:bg-neutral-50 text-xs transition-colors"
      >
        <span>{label}</span>
        <span className="text-neutral-500">→</span>
      </button>
    );
  };

  // Progress bar for daily learning goal
  const progressPercentage = Math.min(100, learningPercentage);

  return (
    <section className="px-8 py-4 border-b border-neutral-200 bg-white">
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left Side */}
        <div className="flex flex-wrap items-center gap-7.5">
          {/* Date & Title */}
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-neutral-900">{displayDate}</p>
            <p className="text-sm text-neutral-500">Dashboard</p>
          </div>

          {/* T16-W1: Check-In Button - only show if mentor is activated */}
          {isMentorActivated && getCheckInButton()}

          {/* T16-W1: Daily Learning Progress - only show if goal is set */}
          {learningMinutesGoal > 0 && (
            <div className="flex flex-col gap-1 min-w-[200px]">
              <span className="text-xs text-neutral-600">
                {`${formatHoursMinutes(learningMinutesCompleted)} von ${formatHoursMinutes(learningMinutesGoal)} Tageslernziel`}
              </span>
              <div className="w-full flex items-center">
                <div className="flex-1 bg-neutral-200 rounded-full h-1">
                  <div
                    className="h-1 rounded-full transition-all bg-neutral-900"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Timer Widget */}
        <TimerWidget onClick={onTimerClick} />
      </div>
    </section>
  );
};

export default DashboardSubHeader;
