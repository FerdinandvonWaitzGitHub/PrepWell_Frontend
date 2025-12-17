import React from 'react';
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
        className="text-gray-200"
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
 */
const TimerDisplay = ({ onClick }) => {
  const { timerType, isActive, getDisplayInfo } = useTimer();

  if (!isActive) {
    return null;
  }

  const displayInfo = getDisplayInfo();
  if (!displayInfo) {
    return null;
  }

  const { primaryText, secondaryText, progress, isBreak, isPaused } = displayInfo;

  // Determine background color based on timer type and state
  const getBgColor = () => {
    if (isPaused) return 'bg-gray-100';
    if (isBreak) return 'bg-green-50';
    switch (timerType) {
      case TIMER_TYPES.POMODORO:
        return 'bg-red-50';
      case TIMER_TYPES.COUNTDOWN:
        return 'bg-blue-50';
      case TIMER_TYPES.COUNTUP:
        return 'bg-green-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex justify-end items-center gap-4 px-3 py-1 rounded-lg
        transition-colors cursor-pointer hover:opacity-90
        ${getBgColor()}
      `}
    >
      {/* Time Info */}
      <div className="py-1 rounded-md flex flex-col items-end gap-0.5">
        <div className={`
          text-sm font-medium leading-5 text-right
          ${isPaused ? 'text-gray-600' : isBreak ? 'text-green-700' : 'text-gray-900'}
        `}>
          {isPaused && '⏸ '}{primaryText}
        </div>
        <div className="text-sm font-normal leading-5 text-gray-500 text-right">
          {secondaryText}
        </div>
      </div>

      {/* Progress Circle */}
      <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 flex justify-center items-center">
        <CircularProgress
          progress={progress}
          size={24}
          strokeWidth={2.5}
          isBreak={isBreak}
        />
      </div>
    </button>
  );
};

export default TimerDisplay;
