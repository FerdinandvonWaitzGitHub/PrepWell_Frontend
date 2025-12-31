import React, { useState, useMemo } from 'react';
import { useTimer, TIMER_TYPES } from '../../../contexts/timer-context';
import { useCalendar } from '../../../contexts/calendar-context';
import { RECHTSGEBIET_LABELS, ALL_UNTERRECHTSGEBIETE } from '../../../data/unterrechtsgebiete-data';
import TimerLogbuchDialog from './timer-logbuch-dialog';

/**
 * Close Icon (X)
 */
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-70">
    <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
  </svg>
);

/**
 * Settings Icon (Gear)
 */
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2.67" y="2.67" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.33" fill="none" />
  </svg>
);

/**
 * Book Icon (Logbuch)
 */
const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M1.33 1.33H6C7.1 1.33 8 2.23 8 3.33V14.67C8 13.93 7.4 13.33 6.67 13.33H1.33V1.33Z" stroke="currentColor" strokeWidth="1.33" fill="none" />
    <path d="M14.67 1.33H10C8.9 1.33 8 2.23 8 3.33V14.67C8 13.93 8.6 13.33 9.33 13.33H14.67V1.33Z" stroke="currentColor" strokeWidth="1.33" fill="none" />
  </svg>
);

/**
 * Check Icon
 */
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2.67 8L6 11.33L13.33 4" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Pause Icon
 */
const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="2" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.33" fill="none" />
    <rect x="9" y="2" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.33" fill="none" />
  </svg>
);

/**
 * Stop Icon
 */
const StopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2.67" y="4" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.33" fill="none" />
  </svg>
);

/**
 * Trash Icon
 */
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4H14M5.33 4V2.67C5.33 2 5.87 1.33 6.67 1.33H9.33C10.13 1.33 10.67 2 10.67 2.67V4M12.67 4V13.33C12.67 14.13 12 14.67 11.33 14.67H4.67C3.87 14.67 3.33 14.13 3.33 13.33V4" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
  </svg>
);

/**
 * Chevron Down Icon
 */
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
  </svg>
);

/**
 * Circular Progress Ring - matches Figma design
 */
const CircularProgressRing = ({ progress = 0, timeDisplay }) => {
  const size = 192; // w-48 = 192px
  const innerSize = 144; // w-36 = 144px
  const strokeWidth = 6;
  const radius = (innerSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div className="w-48 h-48 relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E5E5"
          strokeWidth={strokeWidth}
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
          className="text-neutral-900"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {/* Time display centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl font-light font-['DM_Sans'] text-neutral-900 leading-10">
          {timeDisplay}
        </span>
      </div>
    </div>
  );
};

/**
 * Outline Button - matches Figma pill button style
 */
const OutlineButton = ({ children, onClick, disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-5 py-2.5 rounded-3xl outline outline-1 outline-offset-[-1px] outline-neutral-200
      inline-flex justify-center items-center gap-2
      text-neutral-900 text-sm font-light font-['DM_Sans'] leading-5
      hover:bg-neutral-50 transition-colors
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `}
  >
    {children}
  </button>
);

/**
 * Primary Button - slate-600 background
 */
const PrimaryButton = ({ children, onClick, disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-5 py-2.5 bg-slate-600 rounded-3xl
      inline-flex justify-center items-center gap-2
      text-white text-sm font-light font-['DM_Sans'] leading-5
      hover:bg-slate-700 transition-colors
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `}
  >
    {children}
  </button>
);

/**
 * Small Outline Button (for -5/+5)
 */
const SmallOutlineButton = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="px-2.5 py-[3px] rounded-[5px] outline outline-1 outline-offset-[-1px] outline-neutral-200
               text-neutral-900 text-sm font-light font-['DM_Sans'] leading-5 hover:bg-neutral-50 transition-colors"
  >
    {children}
  </button>
);

/**
 * Split Dropdown Button - matches Figma design with left text, right chevron
 */
const SplitDropdown = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    if (!value) return 'Auswählen...';
    for (const group of options) {
      const found = group.options?.find(opt => opt.id === value);
      if (found) return found.label;
    }
    return value;
  }, [value, options]);

  return (
    <div className="relative">
      <div className="inline-flex justify-start items-start">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="h-9 pl-5 pr-4 py-2 bg-white rounded-tl-lg rounded-bl-lg outline outline-1 outline-offset-[-1px] outline-neutral-200
                     flex justify-center items-center gap-2 cursor-pointer hover:bg-neutral-50 transition-colors"
        >
          <span className="text-neutral-900 text-sm font-light font-['DM_Sans'] leading-5">
            {selectedLabel}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-9 px-2 py-2 bg-white rounded-tr-lg rounded-br-lg border-r border-t border-b border-neutral-200
                     flex justify-center items-center hover:bg-neutral-50 transition-colors"
        >
          <ChevronDownIcon />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-neutral-200 min-w-[200px] max-h-64 overflow-y-auto">
          {options.map((group, groupIdx) => (
            <div key={groupIdx} className="border-b border-neutral-100 last:border-b-0">
              {group.label && (
                <div className="px-3 py-2 bg-neutral-50 text-xs font-medium text-neutral-600">
                  {group.label}
                </div>
              )}
              {group.options?.map(option => (
                <button
                  key={option.id}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  {option.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Format seconds to MM:SS or H:MM:SS
 */
const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format time to HH:MM
 */
const formatTimeHHMM = (date) => {
  if (!date) return '--:--';
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Pomodoro Timer View - Two column layout matching Figma
 */
const PomodoroTimerView = () => {
  const {
    remainingSeconds,
    isPaused,
    togglePause,
    stopTimer,
    startTime,
    endTime,
    getDisplayInfo,
  } = useTimer();

  const [workingOn, setWorkingOn] = useState(null);
  const displayInfo = getDisplayInfo();
  const progress = displayInfo?.progress || 0;

  const dropdownOptions = useMemo(() => {
    return Object.entries(RECHTSGEBIET_LABELS).map(([id, label]) => ({
      label,
      options: (ALL_UNTERRECHTSGEBIETE[id] || []).slice(0, 5).map(urg => ({
        id: urg.id,
        label: urg.name
      }))
    }));
  }, []);

  return (
    <div className="w-full bg-white inline-flex justify-between items-start gap-8">
      {/* Left Column - Timer Circle */}
      <div className="inline-flex flex-col justify-start items-center gap-5">
        <CircularProgressRing
          progress={progress}
          timeDisplay={formatTime(remainingSeconds)}
        />

        {/* Time Range with -5/+5 */}
        <div className="inline-flex justify-center items-center gap-7">
          <SmallOutlineButton>- 5</SmallOutlineButton>
          <span className="text-neutral-900 text-lg font-light font-['DM_Sans'] leading-4">
            {formatTimeHHMM(startTime)} → {formatTimeHHMM(endTime)}
          </span>
          <SmallOutlineButton>+ 5</SmallOutlineButton>
        </div>

        {/* Session Cancel Link */}
        <button className="py-2.5 opacity-50 inline-flex justify-center items-center gap-2 text-neutral-900 text-sm font-light font-['DM_Sans'] leading-5">
          Session abbrechen & löschen
          <TrashIcon />
        </button>
      </div>

      {/* Right Column - Controls */}
      <div className="inline-flex flex-col justify-center items-start gap-9">
        {/* Pause/Stop Buttons */}
        <div className="flex flex-col justify-start items-start gap-2">
          <OutlineButton onClick={togglePause}>
            {isPaused ? 'Timer fortsetzen' : 'Timer pausieren'}
            <PauseIcon />
          </OutlineButton>
          <OutlineButton onClick={stopTimer}>
            Session beenden
            <StopIcon />
          </OutlineButton>
        </div>

        {/* Working On Dropdown */}
        <div className="flex flex-col justify-center items-start gap-3.5">
          <span className="text-neutral-900 text-lg font-light font-['DM_Sans'] leading-4">
            Ich arbeite an...
          </span>
          <SplitDropdown
            value={workingOn}
            options={dropdownOptions}
            onChange={setWorkingOn}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Countdown Timer View - Similar layout to Pomodoro
 */
const CountdownTimerView = ({ dailyLearningGoalMinutes = 480 }) => {
  const {
    remainingSeconds,
    isPaused,
    togglePause,
    getDisplayInfo,
  } = useTimer();

  const [workingOn, setWorkingOn] = useState(null);
  const displayInfo = getDisplayInfo();
  const progress = displayInfo?.progress || 0;

  const dropdownOptions = useMemo(() => {
    return Object.entries(RECHTSGEBIET_LABELS).map(([id, label]) => ({
      label,
      options: (ALL_UNTERRECHTSGEBIETE[id] || []).slice(0, 5).map(urg => ({
        id: urg.id,
        label: urg.name
      }))
    }));
  }, []);

  // Daily goal from Lernplan
  const goalHours = Math.floor(dailyLearningGoalMinutes / 60);
  const goalMinutes = dailyLearningGoalMinutes % 60;

  return (
    <div className="w-full bg-white inline-flex justify-between items-start gap-8">
      {/* Left Column - Timer Circle */}
      <div className="inline-flex flex-col justify-start items-center gap-5">
        <CircularProgressRing
          progress={progress}
          timeDisplay={formatTime(remainingSeconds)}
        />

        {/* Learning Goal with -5/+5 */}
        <div className="inline-flex justify-center items-center gap-7">
          <SmallOutlineButton>- 5</SmallOutlineButton>
          <span className="text-neutral-900 text-lg font-light font-['DM_Sans'] leading-4">
            Lernziel {goalHours}h {goalMinutes > 0 ? `${goalMinutes}min` : ''}
          </span>
          <SmallOutlineButton>+ 5</SmallOutlineButton>
        </div>
      </div>

      {/* Right Column - Controls */}
      <div className="inline-flex flex-col justify-center items-start gap-9">
        {/* Pause Button */}
        <div className="flex flex-col justify-start items-start gap-2">
          <OutlineButton onClick={togglePause}>
            {isPaused ? 'Timer fortsetzen' : 'Timer pausieren'}
            <PauseIcon />
          </OutlineButton>
        </div>

        {/* Working On Dropdown */}
        <div className="flex flex-col justify-center items-start gap-3.5">
          <span className="text-neutral-900 text-lg font-light font-['DM_Sans'] leading-4">
            Ich arbeite an...
          </span>
          <SplitDropdown
            value={workingOn}
            options={dropdownOptions}
            onChange={setWorkingOn}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Countup (Stoppuhr) Timer View
 */
const CountupTimerView = ({ dailyLearningGoalMinutes = 480 }) => {
  const {
    elapsedSeconds,
    isPaused,
    togglePause,
    getDisplayInfo,
  } = useTimer();

  const [workingOn, setWorkingOn] = useState(null);
  const displayInfo = getDisplayInfo();
  const progress = displayInfo?.progress || 0;

  const dropdownOptions = useMemo(() => {
    return Object.entries(RECHTSGEBIET_LABELS).map(([id, label]) => ({
      label,
      options: (ALL_UNTERRECHTSGEBIETE[id] || []).slice(0, 5).map(urg => ({
        id: urg.id,
        label: urg.name
      }))
    }));
  }, []);

  // Format elapsed time as H:MM or M:SS
  const timeDisplay = useMemo(() => {
    const hrs = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}`;
    }
    const secs = elapsedSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [elapsedSeconds]);

  // Daily goal from Lernplan
  const goalHours = Math.floor(dailyLearningGoalMinutes / 60);
  const goalMinutes = dailyLearningGoalMinutes % 60;

  return (
    <div className="w-full bg-white inline-flex justify-between items-start gap-8">
      {/* Left Column - Timer Circle */}
      <div className="inline-flex flex-col justify-start items-center gap-5">
        <CircularProgressRing
          progress={progress}
          timeDisplay={timeDisplay}
        />

        {/* Learning Goal with -5/+5 */}
        <div className="inline-flex justify-center items-center gap-7">
          <SmallOutlineButton>- 5</SmallOutlineButton>
          <span className="text-neutral-900 text-lg font-light font-['DM_Sans'] leading-4">
            Lernziel {goalHours}h {goalMinutes > 0 ? `${goalMinutes}min` : ''}
          </span>
          <SmallOutlineButton>+ 5</SmallOutlineButton>
        </div>
      </div>

      {/* Right Column - Controls */}
      <div className="inline-flex flex-col justify-center items-start gap-9">
        {/* Pause Button */}
        <div className="flex flex-col justify-start items-start gap-2">
          <OutlineButton onClick={togglePause}>
            {isPaused ? 'Stoppuhr fortsetzen' : 'Stoppuhr pausieren'}
            <PauseIcon />
          </OutlineButton>
        </div>

        {/* Working On Dropdown */}
        <div className="flex flex-col justify-center items-start gap-3.5">
          <span className="text-neutral-900 text-lg font-light font-['DM_Sans'] leading-4">
            Ich arbeite an...
          </span>
          <SplitDropdown
            value={workingOn}
            options={dropdownOptions}
            onChange={setWorkingOn}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Play Icon
 */
const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 3L13 8L4 13V3Z" stroke="currentColor" strokeWidth="1.33" fill="none" strokeLinejoin="round" />
  </svg>
);

/**
 * Empty State Component - shown when no timer is configured
 */
const EmptyState = () => (
  <div className="w-full py-16 flex flex-col justify-center items-center gap-4">
    <div className="text-neutral-400 text-lg font-light font-['DM_Sans']">
      Noch keine Zeiterfassung konfiguriert
    </div>
    <div className="text-neutral-400 text-sm font-light font-['DM_Sans'] text-center max-w-md">
      Klicke auf "Einstellungen", um deinen Timer einzurichten. Du kannst zwischen Pomodoro, Countdown und Stoppuhr wählen.
    </div>
  </div>
);

/**
 * Configured but not running state - shows "Starten" button
 */
const ConfiguredIdleState = ({ onStart, timerConfig }) => {
  const getTimerTypeLabel = () => {
    switch (timerConfig?.timerType) {
      case TIMER_TYPES.POMODORO:
        return `Pomodoro Timer (${timerConfig.pomodoroSettings?.sessionDuration || 25} min)`;
      case TIMER_TYPES.COUNTDOWN:
        return `Timer (${timerConfig.countdownSettings?.duration || 60} min)`;
      case TIMER_TYPES.COUNTUP:
        return 'Stoppuhr';
      default:
        return 'Timer';
    }
  };

  return (
    <div className="w-full py-12 flex flex-col justify-center items-center gap-6">
      <div className="text-neutral-900 text-lg font-light font-['DM_Sans']">
        {getTimerTypeLabel()}
      </div>
      <button
        onClick={onStart}
        className="px-8 py-3 bg-slate-600 rounded-3xl inline-flex justify-center items-center gap-2
                   text-white text-base font-light font-['DM_Sans'] leading-5
                   hover:bg-slate-700 transition-colors"
      >
        Starten
        <PlayIcon />
      </button>
    </div>
  );
};

/**
 * TimerMainDialog - Main unified timer dialog matching Figma design
 */
const TimerMainDialog = ({ open, onOpenChange, onSettingsClick, dailyLearningGoalMinutes = 480 }) => {
  const { timerType, isActive, stopTimer, isConfigured, timerConfig, startFromConfig } = useTimer();
  const [showLogbuch, setShowLogbuch] = useState(false);

  if (!open) return null;

  // Get timer type title based on state
  const getTitle = () => {
    // If timer is active, show its type
    if (isActive) {
      switch (timerType) {
        case TIMER_TYPES.POMODORO:
          return 'Pomodoro Timer';
        case TIMER_TYPES.COUNTDOWN:
          return 'Timer';
        case TIMER_TYPES.COUNTUP:
          return 'Stoppuhr';
        default:
          return 'Zeiterfassung';
      }
    }
    // If configured but not running, show config type
    if (isConfigured) {
      switch (timerConfig?.timerType) {
        case TIMER_TYPES.POMODORO:
          return 'Pomodoro Timer';
        case TIMER_TYPES.COUNTDOWN:
          return 'Timer';
        case TIMER_TYPES.COUNTUP:
          return 'Stoppuhr';
        default:
          return 'Zeiterfassung';
      }
    }
    return 'Zeiterfassung';
  };

  // Render appropriate timer view or state
  const renderContent = () => {
    // If timer is running, show the timer view
    if (isActive) {
      switch (timerType) {
        case TIMER_TYPES.POMODORO:
          return <PomodoroTimerView />;
        case TIMER_TYPES.COUNTDOWN:
          return <CountdownTimerView dailyLearningGoalMinutes={dailyLearningGoalMinutes} />;
        case TIMER_TYPES.COUNTUP:
          return <CountupTimerView dailyLearningGoalMinutes={dailyLearningGoalMinutes} />;
        default:
          return null;
      }
    }
    // If configured but not running, show the start button
    if (isConfigured) {
      return <ConfiguredIdleState onStart={startFromConfig} timerConfig={timerConfig} />;
    }
    // Not configured, show empty state
    return <EmptyState />;
  };

  const handleFinish = () => {
    if (isActive) {
      stopTimer();
    }
    onOpenChange(false);
  };

  const handleLogbuchClick = () => {
    setShowLogbuch(true);
  };

  // Settings button component with conditional red styling
  const SettingsButton = () => {
    if (!isConfigured) {
      // Red button when not configured
      return (
        <button
          onClick={onSettingsClick}
          className="px-5 py-2.5 bg-red-500 rounded-3xl inline-flex justify-center items-center gap-2
                     text-white text-sm font-light font-['DM_Sans'] leading-5
                     hover:bg-red-600 transition-colors"
        >
          Einstellungen
          <SettingsIcon />
        </button>
      );
    }
    // Normal outline button when configured
    return (
      <OutlineButton onClick={onSettingsClick}>
        Einstellungen
        <SettingsIcon />
      </OutlineButton>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="w-[806px] p-6 relative bg-white rounded-[10px] shadow-lg outline outline-1 outline-offset-[-1px] outline-neutral-200
                     inline-flex flex-col justify-start items-center gap-14 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="self-stretch flex flex-col justify-start items-start gap-1.5">
            <h2 className="self-stretch text-neutral-900 text-lg font-light font-['DM_Sans'] leading-4">
              {getTitle()}
            </h2>
            <p className="text-neutral-500 text-sm font-normal font-['DM_Sans'] leading-5">
              Du kannst in den Einstellungen die Art der Zeiterfassung und deren Konfiguration bearbeiten.
            </p>
          </div>

          {/* Timer Content */}
          <div className="self-stretch flex justify-center">
            {renderContent()}
          </div>

          {/* Footer */}
          <div className="self-stretch h-10 inline-flex justify-end items-end gap-2.5">
            <div className="flex justify-end items-center gap-2">
              <SettingsButton />
              <OutlineButton onClick={handleLogbuchClick}>
                Logbuch
                <BookIcon />
              </OutlineButton>
              <PrimaryButton onClick={handleFinish}>
                Fertig
                <CheckIcon />
              </PrimaryButton>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="w-4 h-4 absolute right-4 top-4 rounded-sm hover:bg-neutral-100 flex items-center justify-center"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Logbuch Dialog */}
      <TimerLogbuchDialog
        open={showLogbuch}
        onOpenChange={setShowLogbuch}
      />
    </>
  );
};

export default TimerMainDialog;
