import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui';
import { useTimer, TIMER_TYPES, formatTime } from '../../../contexts/timer-context';

/**
 * CircularProgress - Larger version for dialog
 */
const CircularProgress = ({ progress, size = 120, strokeWidth = 8, isBreak = false, isPaused = false }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress * circumference);

  const getColor = () => {
    if (isPaused) return 'text-neutral-400';
    if (isBreak) return 'text-green-500';
    return 'text-primary-500';
  };

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
        className="text-neutral-100"
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
        className={getColor()}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
};

/**
 * TimerControlsDialog - Controls for running timer
 */
const TimerControlsDialog = ({ open, onOpenChange }) => {
  const {
    timerType,
    timerState,
    remainingSeconds,
    elapsedSeconds,
    isBreak,
    isPaused,
    isRunning,
    currentSession,
    totalSessions,
    togglePause,
    resetSession,
    stopTimer,
    getDisplayInfo,
  } = useTimer();

  const displayInfo = getDisplayInfo();
  if (!displayInfo) return null;

  const { progress } = displayInfo;

  // Format time display
  const formatTimeDisplay = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer type label
  const getTimerTypeLabel = () => {
    switch (timerType) {
      case TIMER_TYPES.POMODORO:
        return isBreak ? 'Pause' : `Pomodoro ${currentSession}/${totalSessions}`;
      case TIMER_TYPES.COUNTDOWN:
        return 'Countdown';
      case TIMER_TYPES.COUNTUP:
        return 'Stoppuhr';
      default:
        return 'Timer';
    }
  };

  // Get status label
  const getStatusLabel = () => {
    if (isPaused) return 'Pausiert';
    if (isBreak) return 'Pause läuft';
    return 'Läuft';
  };

  const handleStop = () => {
    stopTimer();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader className="text-center">
          <DialogTitle>{getTimerTypeLabel()}</DialogTitle>
          <p className={`text-sm ${isPaused ? 'text-neutral-500' : isBreak ? 'text-green-600' : 'text-primary-600'}`}>
            {getStatusLabel()}
          </p>
        </DialogHeader>

        <DialogBody className="flex flex-col items-center py-6">
          {/* Timer Display */}
          <div className="relative">
            <CircularProgress
              progress={progress}
              size={160}
              strokeWidth={10}
              isBreak={isBreak}
              isPaused={isPaused}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-light ${isPaused ? 'text-neutral-500' : 'text-neutral-900'}`}>
                {timerType === TIMER_TYPES.COUNTUP
                  ? formatTimeDisplay(elapsedSeconds)
                  : formatTimeDisplay(remainingSeconds)
                }
              </span>
              {timerType === TIMER_TYPES.POMODORO && (
                <span className="text-xs text-neutral-500 mt-1">
                  {isBreak ? 'Pause' : 'Session'}
                </span>
              )}
            </div>
          </div>

          {/* Session Indicators (Pomodoro) */}
          {timerType === TIMER_TYPES.POMODORO && (
            <div className="flex gap-2 mt-6">
              {Array.from({ length: totalSessions }).map((_, i) => (
                <div
                  key={i}
                  className={`
                    w-3 h-3 rounded-full
                    ${i < currentSession - 1
                      ? 'bg-primary-500'
                      : i === currentSession - 1
                        ? isBreak ? 'bg-green-500' : 'bg-primary-300'
                        : 'bg-neutral-200'
                    }
                  `}
                />
              ))}
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center gap-3 mt-8">
            {/* Reset Button */}
            <button
              onClick={resetSession}
              className="p-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
              title="Session zurücksetzen"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={togglePause}
              className={`
                p-4 rounded-full text-white transition-colors
                ${isPaused
                  ? 'bg-primary-500 hover:bg-primary-600'
                  : 'bg-neutral-600 hover:bg-neutral-700'
                }
              `}
              title={isPaused ? 'Fortsetzen' : 'Pausieren'}
            >
              {isPaused ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>

            {/* Stop Button */}
            <button
              onClick={handleStop}
              className="p-3 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
              title="Timer beenden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          </div>
        </DialogBody>

        <DialogFooter className="justify-center">
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimerControlsDialog;
