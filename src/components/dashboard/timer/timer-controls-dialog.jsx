import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui';
import { useTimer, TIMER_TYPES } from '../../../contexts/timer-context';
import { AlertCircle } from 'lucide-react';

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
    remainingSeconds,
    elapsedSeconds,
    isBreak,
    isPaused,
    currentSession,
    totalSessions,
    togglePause,
    resetTimerWithSave,
    stopTimer,
    getDisplayInfo,
    pomodoroSettings,
    countdownSettings,
  } = useTimer();

  // State for reset confirmation dialog
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const displayInfo = getDisplayInfo();
  if (!displayInfo) return null;

  const { progress } = displayInfo;

  // Format time display
  // T16-W2: Removed seconds display - only shows hours and minutes
  const formatTimeDisplay = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')} h`;
    }
    return `${mins} min`;
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

  // Handle reset with confirmation
  const handleResetClick = () => {
    // Only show confirmation if there's significant time (> 1 min)
    const currentTime = timerType === TIMER_TYPES.COUNTUP ? elapsedSeconds :
      (timerType === TIMER_TYPES.POMODORO
        ? (isBreak ? 0 : (pomodoroSettings?.sessionDuration || 25) * 60 - remainingSeconds)
        : (countdownSettings?.duration || 60) * 60 - remainingSeconds);

    if (currentTime >= 60) {
      setShowResetConfirm(true);
    } else {
      // Less than 1 minute, just reset without saving
      resetTimerWithSave();
    }
  };

  const handleConfirmReset = () => {
    resetTimerWithSave();
    setShowResetConfirm(false);
  };

  // Get current elapsed time for display in confirm dialog
  const getCurrentElapsedMinutes = () => {
    if (timerType === TIMER_TYPES.COUNTUP) {
      return Math.floor(elapsedSeconds / 60);
    }
    // For countdown/pomodoro, calculate how much time has passed
    return Math.floor((timerType === TIMER_TYPES.POMODORO
      ? (25 * 60 - remainingSeconds)
      : (60 * 60 - remainingSeconds)) / 60);
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
              onClick={handleResetClick}
              className="p-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
              title="Zeit zurücksetzen"
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

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Zeit zurücksetzen?</h3>
            </div>

            <div className="mb-6">
              <p className="text-neutral-700 mb-2">
                Du hast bereits <strong>{getCurrentElapsedMinutes()} Minuten</strong> erfasst.
              </p>
              <p className="text-sm text-neutral-600">
                Diese Zeit wird als abgebrochene Session im Logbuch gespeichert.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirmReset}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700"
              >
                Zurücksetzen
              </button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default TimerControlsDialog;
