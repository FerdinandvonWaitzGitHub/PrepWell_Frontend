import { useState } from 'react';
import { useTimer, TIMER_TYPES } from '../../../contexts/timer-context';

/**
 * CircularProgress - SVG circular progress indicator
 */
const CircularProgress = ({ progress, size = 24, strokeWidth = 2, isBreak = false }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-neutral-200"
      />
      {/* Progress circle */}
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
        className={isBreak ? 'text-green-500' : 'text-primary-500'}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
};

/**
 * TimerDisplay - Shows running timer info based on Figma design
 * Displays remaining/elapsed time with progress indicator
 * T16-W6: Hover shows play/pause button for quick control
 */
const TimerDisplay = ({ onClick }) => {
  const { timerType, isActive, getDisplayInfo, togglePause } = useTimer();
  const [isHovered, setIsHovered] = useState(false);

  if (!isActive) {
    return null;
  }

  const displayInfo = getDisplayInfo();
  if (!displayInfo) {
    return null;
  }

  const { primaryText, secondaryText, progress, isBreak, isPaused } = displayInfo;

  // T16-W6: Handle play/pause without opening dialog
  const handlePlayPause = (e) => {
    e.stopPropagation(); // Prevent dialog from opening
    togglePause();
  };

  // Determine background color based on timer type and state
  const getBgColor = () => {
    if (isPaused) return 'bg-neutral-100';
    if (isBreak) return 'bg-green-50';
    switch (timerType) {
      case TIMER_TYPES.POMODORO:
        return 'bg-red-50';
      case TIMER_TYPES.COUNTDOWN:
        return 'bg-blue-50';
      case TIMER_TYPES.COUNTUP:
        return 'bg-green-50';
      default:
        return 'bg-neutral-50';
    }
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* T16-W6: Main clickable area opens dialog */}
      <div
        onClick={onClick}
        className={`
          inline-flex justify-end items-center gap-4 px-3 py-1 rounded-lg
          transition-colors cursor-pointer hover:opacity-90
          ${getBgColor()}
        `}
        role="button"
        tabIndex={0}
      >
        {/* Time Info */}
        <div className="py-1 rounded-md flex flex-col items-end gap-0.5">
          <div className={`
            text-sm font-medium leading-5 text-right
            ${isPaused ? 'text-neutral-600' : isBreak ? 'text-green-700' : 'text-neutral-950'}
          `}>
            {isPaused && '⏸ '}{primaryText}
          </div>
          <div className="text-sm font-normal leading-5 text-neutral-500 text-right">
            {secondaryText}
          </div>
        </div>

        {/* Progress Circle */}
        <div className="p-2 bg-white rounded-md shadow-xs border border-neutral-200 flex justify-center items-center">
          <CircularProgress
            progress={progress}
            size={24}
            strokeWidth={2.5}
            isBreak={isBreak}
          />
        </div>

        {/* T16-W6: Play/Pause Button - always visible for now */}
        <div
          onClick={handlePlayPause}
          className="p-2 bg-white rounded-md shadow-xs border border-neutral-200 flex justify-center items-center hover:bg-neutral-50 transition-colors cursor-pointer"
          title={isPaused ? 'Fortsetzen' : 'Pausieren'}
          role="button"
          tabIndex={0}
        >
          {isPaused ? (
            // Play Icon
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ) : (
            // Pause Icon
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-primary-600">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimerDisplay;
