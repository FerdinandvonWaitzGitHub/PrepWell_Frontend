import React, { useState } from 'react';
import { useTimer } from '../../contexts/timer-context';
import TimerDisplay from './timer/timer-display';
import TimerSelectionDialog from './timer/timer-selection-dialog';
import PomodoroSettingsDialog from './timer/pomodoro-settings-dialog';
import CountdownSettingsDialog from './timer/countdown-settings-dialog';
import TimerMainDialog from './timer/timer-main-dialog';

/**
 * TimerButton - Main timer component for dashboard
 * Shows either a start button or the active timer display
 *
 * Features:
 * - Pomodoro Timer
 * - Countdown Timer
 * - Count-up Timer (Stoppuhr)
 * - Unified timer control dialog with settings and logbuch access
 */
const TimerButton = ({ className = '' }) => {
  const { isActive, startPomodoro, startCountdown, startCountup, stopTimer, pomodoroSettings } = useTimer();

  // Dialog states
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);
  const [showCountdownSettings, setShowCountdownSettings] = useState(false);
  const [showTimerMain, setShowTimerMain] = useState(false);

  // Handle timer type selection
  const handleSelectType = (type) => {
    switch (type) {
      case 'pomodoro':
        setShowPomodoroSettings(true);
        break;
      case 'countdown':
        setShowCountdownSettings(true);
        break;
      case 'countup':
        startCountup();
        break;
    }
  };

  // Handle Pomodoro start
  const handleStartPomodoro = (settings, sessions) => {
    startPomodoro(settings, sessions);
  };

  // Handle Countdown start
  const handleStartCountdown = (durationMinutes) => {
    startCountdown(durationMinutes);
  };

  // Handle settings click from main dialog - stop current timer and show selection
  const handleSettingsClick = () => {
    stopTimer();
    setShowTimerMain(false);
    setShowSelectionDialog(true);
  };

  // If timer is active, show the display
  if (isActive) {
    return (
      <div className={className}>
        <TimerDisplay onClick={() => setShowTimerMain(true)} />

        <TimerMainDialog
          open={showTimerMain}
          onOpenChange={setShowTimerMain}
          onSettingsClick={handleSettingsClick}
        />

        {/* Timer Type Selection Dialog (accessible via settings) */}
        <TimerSelectionDialog
          open={showSelectionDialog}
          onOpenChange={setShowSelectionDialog}
          onSelectType={handleSelectType}
        />

        {/* Pomodoro Settings Dialog */}
        <PomodoroSettingsDialog
          open={showPomodoroSettings}
          onOpenChange={setShowPomodoroSettings}
          onStart={handleStartPomodoro}
          initialSettings={pomodoroSettings}
        />

        {/* Countdown Settings Dialog */}
        <CountdownSettingsDialog
          open={showCountdownSettings}
          onOpenChange={setShowCountdownSettings}
          onStart={handleStartCountdown}
        />
      </div>
    );
  }

  // Otherwise show the start button (clock icon)
  return (
    <div className={className}>
      <button
        onClick={() => setShowSelectionDialog(true)}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        title="Timer starten"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-600"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>

      {/* Timer Type Selection Dialog */}
      <TimerSelectionDialog
        open={showSelectionDialog}
        onOpenChange={setShowSelectionDialog}
        onSelectType={handleSelectType}
      />

      {/* Pomodoro Settings Dialog */}
      <PomodoroSettingsDialog
        open={showPomodoroSettings}
        onOpenChange={setShowPomodoroSettings}
        onStart={handleStartPomodoro}
        initialSettings={pomodoroSettings}
      />

      {/* Countdown Settings Dialog */}
      <CountdownSettingsDialog
        open={showCountdownSettings}
        onOpenChange={setShowCountdownSettings}
        onStart={handleStartCountdown}
      />
    </div>
  );
};

export default TimerButton;
