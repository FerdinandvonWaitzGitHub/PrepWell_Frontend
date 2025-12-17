import React, { useState } from 'react';
import { useTimer } from '../../../contexts/timer-context';
import TimerDisplay from './timer-display';
import TimerSelectionDialog from './timer-selection-dialog';
import PomodoroSettingsDialog from './pomodoro-settings-dialog';
import CountdownSettingsDialog from './countdown-settings-dialog';
import TimerControlsDialog from './timer-controls-dialog';

/**
 * TimerButton - Main timer component for dashboard
 * Shows either a start button or the active timer display
 */
const TimerButton = () => {
  const { isActive, startPomodoro, startCountdown, startCountup, pomodoroSettings } = useTimer();

  // Dialog states
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);
  const [showCountdownSettings, setShowCountdownSettings] = useState(false);
  const [showTimerControls, setShowTimerControls] = useState(false);

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

  // If timer is active, show the display
  if (isActive) {
    return (
      <>
        <TimerDisplay onClick={() => setShowTimerControls(true)} />

        <TimerControlsDialog
          open={showTimerControls}
          onOpenChange={setShowTimerControls}
        />
      </>
    );
  }

  // Otherwise show the start button
  return (
    <>
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
    </>
  );
};

export default TimerButton;
