import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer, TIMER_TYPES } from '../../contexts/timer-context';
import { useCheckIn } from '../../contexts/checkin-context';

/**
 * Format seconds to human-readable time string
 */
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
};

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
        className="text-gray-200"
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
        className="text-slate-600"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
};

/**
 * TimerWidget - Shows the currently active timer
 * Based on Figma design with current time display
 */
const TimerWidget = ({ onClick }) => {
  const { timerType, isActive, getDisplayInfo, state } = useTimer();
  const [currentTime, setCurrentTime] = React.useState(getCurrentTimeString());

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
        className="inline-flex justify-end items-center gap-4 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-sm font-medium text-gray-700">Timer starten</span>
          <span className="text-xs text-gray-500">{currentTime}</span>
        </div>
        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
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

  // Determine label based on timer type
  const getTimerLabel = () => {
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

  // Determine secondary text (with current time for countup goal)
  const getSecondaryLabel = () => {
    if (timerType === TIMER_TYPES.COUNTUP) {
      return `Tagesziel erreicht → ${currentTime}`;
    }
    return secondaryText || currentTime;
  };

  return (
    <button
      onClick={onClick}
      className="inline-flex justify-end items-center gap-4 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
    >
      <div className="flex flex-col items-end gap-0.5">
        <span className={`text-sm font-medium ${isPaused ? 'text-gray-500' : 'text-gray-900'}`}>
          {isPaused && '⏸ '}{getTimerLabel()}
        </span>
        <span className="text-xs text-gray-500">{getSecondaryLabel()}</span>
      </div>
      <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
        <CircularProgress progress={progress} size={24} strokeWidth={2.5} />
      </div>
    </button>
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
  learningMinutesGoal = 480, // 8 hours default
  checkInDone = false,
  onTimerClick,
}) => {
  const navigate = useNavigate();
  const { getCurrentPeriod, todayCheckIn } = useCheckIn();

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
  const getCheckInButton = () => {
    if (checkInDone) {
      // Completed state
      return (
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-gray-200 bg-white text-gray-500 text-sm">
          <span>Check-Ins erledigt</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 12L9 23l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    }

    if (!checkInEnabled) {
      // Disabled state (grayed out)
      return (
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-gray-200 bg-gray-50 text-gray-400 text-sm cursor-not-allowed">
          <span>Check-In am Abend</span>
          <span className="text-gray-300">→</span>
        </div>
      );
    }

    // Active state
    const label = isEvening ? 'Check-In am Abend' : 'Check-In am Morgen';
    return (
      <button
        onClick={handleCheckInClick}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 text-sm transition-colors"
      >
        <span>{label}</span>
        <span className="text-gray-500">→</span>
      </button>
    );
  };

  // Progress bar for daily learning goal
  const progressPercentage = Math.min(100, learningPercentage);

  return (
    <section className="px-8 py-4 border-b border-gray-200 bg-white">
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left Side */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Date & Title */}
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-gray-900">{displayDate}</p>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>

          {/* Check-In Button */}
          {getCheckInButton()}

          {/* Daily Learning Progress */}
          <div className="flex flex-col gap-1 min-w-[200px]">
            <span className="text-xs text-gray-600">
              {formatHoursMinutes(learningMinutesCompleted)} von {formatHoursMinutes(learningMinutesGoal)} Tageslernziel
            </span>
            <div className="w-full flex items-center gap-1">
              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-slate-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="w-16 bg-gray-100 rounded-full h-1.5" />
            </div>
          </div>
        </div>

        {/* Right Side - Timer Widget */}
        <TimerWidget onClick={onTimerClick} />
      </div>
    </section>
  );
};

export default DashboardSubHeader;
