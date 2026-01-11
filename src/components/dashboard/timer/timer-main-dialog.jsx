import { useState, useMemo, useEffect } from 'react';
import { useTimer, TIMER_TYPES } from '../../../contexts/timer-context';
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
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1.33v1.34M8 13.33v1.34M3.29 3.29l.94.94M11.77 11.77l.94.94M1.33 8h1.34M13.33 8h1.34M3.29 12.71l.94-.94M11.77 4.23l.94-.94" />
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
 * Chevron Right Icon
 */
const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/**
 * Back Icon (Chevron Left)
 */
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.33">
    <polyline points="10 12 6 8 10 4" />
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
const CountdownTimerView = ({ dailyLearningGoalMinutes = 0 }) => {
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
const CountupTimerView = ({ dailyLearningGoalMinutes = 0 }) => {
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
 * Timer Selection View - inline timer type selection
 */
const TimerSelectionView = ({ onSelectType, onBack }) => {
  const timerOptions = [
    {
      type: 'pomodoro',
      title: 'Pomodoro Timer',
      description: 'Arbeite in fokussierten Sessions mit regelmäßigen Pausen',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      type: 'countdown',
      title: 'Countdown Timer',
      description: 'Setze ein Zeitziel und arbeite darauf hin',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 8 14" />
        </svg>
      ),
    },
    {
      type: 'countup',
      title: 'Stoppuhr',
      description: 'Tracke deine Lernzeit ohne festes Zeitlimit',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2 2" />
          <path d="M5 3L2 6" />
          <path d="M22 6l-3-3" />
          <path d="M12 5V3" />
          <path d="M10 3h4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Timer Options */}
      <div className="flex flex-col gap-3">
        {timerOptions.map((option) => (
          <button
            key={option.type}
            onClick={() => onSelectType(option.type)}
            className="w-full flex items-center gap-4 p-4 rounded-lg
                       outline outline-1 outline-offset-[-1px] outline-neutral-200
                       hover:bg-neutral-50 transition-colors text-left"
          >
            <div className="flex-shrink-0 text-neutral-600">
              {option.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-neutral-900 text-sm font-light font-['DM_Sans']">
                {option.title}
              </h3>
              <p className="text-neutral-500 text-xs font-light font-['DM_Sans'] mt-0.5">
                {option.description}
              </p>
            </div>
            <div className="flex-shrink-0 text-neutral-400">
              <ChevronRightIcon />
            </div>
          </button>
        ))}
      </div>

      {/* Footer with Back Button */}
      <div className="flex justify-start pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-neutral-500 text-sm font-light hover:text-neutral-700 transition-colors"
        >
          <BackIcon />
          Zurück
        </button>
      </div>
    </div>
  );
};

/**
 * Preset Button for Pomodoro Settings
 */
const PresetButton = ({ selected, onClick, children }) => (
  <button
    onClick={onClick}
    className={`
      flex-1 py-2.5 px-4 rounded-lg text-sm font-light font-['DM_Sans'] transition-colors
      ${selected
        ? 'bg-neutral-900 text-white'
        : 'bg-white text-neutral-900 outline outline-1 outline-offset-[-1px] outline-neutral-200 hover:bg-neutral-50'
      }
    `}
  >
    {children}
  </button>
);

/**
 * Session Count Button
 */
const SessionButton = ({ selected, onClick, children }) => (
  <button
    onClick={onClick}
    className={`
      w-10 h-10 rounded-lg text-sm font-light font-['DM_Sans'] transition-colors
      ${selected
        ? 'bg-neutral-900 text-white'
        : 'bg-white text-neutral-900 outline outline-1 outline-offset-[-1px] outline-neutral-200 hover:bg-neutral-50'
      }
    `}
  >
    {children}
  </button>
);

/**
 * Toggle Switch
 */
const ToggleSwitch = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`
      relative w-11 h-6 rounded-full transition-colors
      ${checked ? 'bg-neutral-900' : 'bg-neutral-200'}
    `}
  >
    <span
      className={`
        absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
        ${checked ? 'translate-x-5' : 'translate-x-0'}
      `}
    />
  </button>
);

/**
 * Pomodoro Settings View - inline settings
 */
const PomodoroSettingsView = ({ onSave, onBack, initialSettings }) => {
  const [sessionDuration, setSessionDuration] = useState(initialSettings?.sessionDuration || 25);
  const [breakDuration, setBreakDuration] = useState(initialSettings?.breakDuration || 5);
  const [longBreakDuration, setLongBreakDuration] = useState(initialSettings?.longBreakDuration || 15);
  const [totalSessions, setTotalSessions] = useState(4);
  const [autoStartBreak, setAutoStartBreak] = useState(initialSettings?.autoStartBreak ?? true);

  const presets = [
    { name: 'Standard', session: 25, break: 5 },
    { name: 'Kurz', session: 15, break: 3 },
    { name: 'Lang', session: 50, break: 10 },
  ];

  const totalMinutes = totalSessions * sessionDuration + (totalSessions - 1) * breakDuration + Math.floor((totalSessions - 1) / 4) * (longBreakDuration - breakDuration);

  const handleSave = () => {
    onSave({
      sessionDuration,
      breakDuration,
      longBreakDuration,
      sessionsBeforeLongBreak: 4,
      autoStartBreak,
    }, totalSessions);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="self-start flex items-center gap-1 text-neutral-500 text-sm font-light hover:text-neutral-700 transition-colors"
      >
        <BackIcon />
        Zurück zur Auswahl
      </button>

      {/* Presets */}
      <div className="flex flex-col gap-3">
        <span className="text-neutral-900 text-sm font-light font-['DM_Sans']">Schnellauswahl</span>
        <div className="flex gap-3">
          {presets.map((preset) => (
            <PresetButton
              key={preset.name}
              selected={sessionDuration === preset.session && breakDuration === preset.break}
              onClick={() => {
                setSessionDuration(preset.session);
                setBreakDuration(preset.break);
              }}
            >
              <div className="flex flex-col items-center">
                <span>{preset.name}</span>
                <span className="text-xs opacity-60">{preset.session}/{preset.break}min</span>
              </div>
            </PresetButton>
          ))}
        </div>
      </div>

      {/* Session Duration */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-neutral-900 text-sm font-light">Session-Dauer</span>
          <span className="text-neutral-900 text-sm font-light">{sessionDuration} min</span>
        </div>
        <input
          type="range"
          min="5"
          max="60"
          step="5"
          value={sessionDuration}
          onChange={(e) => setSessionDuration(Number(e.target.value))}
          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
        />
      </div>

      {/* Break Duration */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-neutral-900 text-sm font-light">Pause-Dauer</span>
          <span className="text-neutral-900 text-sm font-light">{breakDuration} min</span>
        </div>
        <input
          type="range"
          min="1"
          max="30"
          step="1"
          value={breakDuration}
          onChange={(e) => setBreakDuration(Number(e.target.value))}
          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
        />
      </div>

      {/* Number of Sessions */}
      <div className="flex flex-col gap-3">
        <span className="text-neutral-900 text-sm font-light">Anzahl Sessions</span>
        <div className="flex gap-2">
          {[2, 3, 4, 5, 6].map((num) => (
            <SessionButton
              key={num}
              selected={totalSessions === num}
              onClick={() => setTotalSessions(num)}
            >
              {num}
            </SessionButton>
          ))}
        </div>
      </div>

      {/* Auto-start break */}
      <div className="flex items-center justify-between py-2">
        <div>
          <span className="text-neutral-900 text-sm font-light">Pause automatisch starten</span>
          <p className="text-neutral-500 text-xs font-light mt-0.5">Startet die Pause nach einer Session</p>
        </div>
        <ToggleSwitch checked={autoStartBreak} onChange={setAutoStartBreak} />
      </div>

      {/* Summary */}
      <div className="bg-neutral-50 rounded-lg p-4">
        <p className="text-neutral-900 text-sm font-light">
          <span className="font-medium">Gesamtzeit:</span> {totalMinutes} Minuten
        </p>
      </div>

      {/* Save Button */}
      <PrimaryButton onClick={handleSave} className="self-end">
        Speichern & Starten
        <CheckIcon />
      </PrimaryButton>
    </div>
  );
};

/**
 * Countdown Settings View - inline settings
 */
const CountdownSettingsView = ({ onSave, onBack }) => {
  const [duration, setDuration] = useState(60);

  const presets = [30, 45, 60, 90, 120];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="self-start flex items-center gap-1 text-neutral-500 text-sm font-light hover:text-neutral-700 transition-colors"
      >
        <BackIcon />
        Zurück zur Auswahl
      </button>

      {/* Duration Presets */}
      <div className="flex flex-col gap-3">
        <span className="text-neutral-900 text-sm font-light">Timer-Dauer</span>
        <div className="flex gap-2 flex-wrap">
          {presets.map((mins) => (
            <button
              key={mins}
              onClick={() => setDuration(mins)}
              className={`px-4 py-2 rounded-lg text-sm font-light transition-colors ${
                duration === mins
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-900 outline outline-1 outline-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {mins} min
            </button>
          ))}
        </div>
      </div>

      {/* Custom Duration Slider */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-neutral-900 text-sm font-light">Individuelle Dauer</span>
          <span className="text-neutral-900 text-sm font-light">{duration} min</span>
        </div>
        <input
          type="range"
          min="5"
          max="180"
          step="5"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
        />
      </div>

      {/* Save Button */}
      <PrimaryButton onClick={() => onSave(duration)} className="self-end">
        Speichern & Starten
        <CheckIcon />
      </PrimaryButton>
    </div>
  );
};

/**
 * Empty State Component - shown when no timer is configured
 */
const EmptyState = () => (
  <div className="w-full py-16 flex flex-col justify-center items-center gap-4">
    <div className="text-neutral-400 text-lg font-light font-['DM_Sans']">
      Noch keine Zeiterfassung konfiguriert
    </div>
    <div className="text-neutral-400 text-sm font-light font-['DM_Sans'] text-center max-w-md">
      Klicke auf &ldquo;Einstellungen&rdquo;, um deinen Timer einzurichten. Du kannst zwischen Pomodoro, Countdown und Stoppuhr wählen.
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
 * Now with integrated timer selection and settings (no separate dialogs)
 */
const TimerMainDialog = ({ open, onOpenChange, dailyLearningGoalMinutes = 0 }) => {
  const {
    timerType,
    isActive,
    stopTimer: _stopTimer,
    isConfigured,
    timerConfig,
    startFromConfig,
    startPomodoro,
    startCountdown,
    startCountup,
    saveTimerConfig,
    pomodoroSettings,
  } = useTimer();
  void _stopTimer; // Reserved for future use

  const [showLogbuch, setShowLogbuch] = useState(false);
  // ViewMode: 'timer' | 'selection' | 'pomodoro-settings' | 'countdown-settings'
  const [viewMode, setViewMode] = useState('timer');

  // Reset viewMode when dialog opens based on timer state
  useEffect(() => {
    if (open) {
      if (!isActive && !isConfigured) {
        setViewMode('selection');
      } else {
        setViewMode('timer');
      }
    }
  }, [open, isActive, isConfigured]);

  if (!open) return null;

  // Get title based on viewMode and timer state
  const getTitle = () => {
    if (viewMode === 'selection') {
      return 'Timer auswählen';
    }
    if (viewMode === 'pomodoro-settings') {
      return 'Pomodoro Timer Einstellungen';
    }
    if (viewMode === 'countdown-settings') {
      return 'Timer Einstellungen';
    }

    // Timer view - show timer type
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

  // Get description based on viewMode
  const getDescription = () => {
    if (viewMode === 'selection') {
      return 'Wähle einen Timer-Typ für deine Lernsession';
    }
    if (viewMode === 'pomodoro-settings') {
      return 'Konfiguriere deine Pomodoro-Session';
    }
    if (viewMode === 'countdown-settings') {
      return 'Lege die Dauer für deinen Timer fest';
    }
    return 'Du kannst in den Einstellungen die Art der Zeiterfassung und deren Konfiguration bearbeiten.';
  };

  // Handle timer type selection
  const handleSelectType = (type) => {
    switch (type) {
      case 'pomodoro':
        setViewMode('pomodoro-settings');
        break;
      case 'countdown':
        setViewMode('countdown-settings');
        break;
      case 'countup':
        // Stoppuhr starts immediately - also save config so it remembers the type
        saveTimerConfig({
          timerType: TIMER_TYPES.COUNTUP,
          settings: {},
        });
        startCountup();
        setViewMode('timer');
        break;
    }
  };

  // Handle Pomodoro save
  const handlePomodoroSave = (settings, totalSessions) => {
    saveTimerConfig({
      timerType: TIMER_TYPES.POMODORO,
      settings,
      totalSessions,
    });
    startPomodoro(settings, totalSessions);
    setViewMode('timer');
  };

  // Handle Countdown save
  const handleCountdownSave = (durationMinutes) => {
    saveTimerConfig({
      timerType: TIMER_TYPES.COUNTDOWN,
      settings: { duration: durationMinutes },
    });
    startCountdown(durationMinutes);
    setViewMode('timer');
  };

  // Render content based on viewMode
  const renderContent = () => {
    // Selection view
    if (viewMode === 'selection') {
      return (
        <TimerSelectionView
          onSelectType={handleSelectType}
          onBack={() => setViewMode('timer')}
        />
      );
    }

    // Pomodoro settings view
    if (viewMode === 'pomodoro-settings') {
      return (
        <PomodoroSettingsView
          onSave={handlePomodoroSave}
          onBack={() => setViewMode('selection')}
          initialSettings={pomodoroSettings}
        />
      );
    }

    // Countdown settings view
    if (viewMode === 'countdown-settings') {
      return (
        <CountdownSettingsView
          onSave={handleCountdownSave}
          onBack={() => setViewMode('selection')}
        />
      );
    }

    // Timer view (default)
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
    if (isConfigured) {
      return <ConfiguredIdleState onStart={startFromConfig} timerConfig={timerConfig} />;
    }
    return <EmptyState />;
  };

  const handleFinish = () => {
    setViewMode('timer');
    onOpenChange(false);
  };

  const handleLogbuchClick = () => {
    setShowLogbuch(true);
  };

  // Settings button - opens inline selection view
  const handleSettingsButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setViewMode('selection');
  };

  // Show footer buttons only in timer view
  const showFooterButtons = viewMode === 'timer';

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
              {getDescription()}
            </p>
          </div>

          {/* Timer Content (slotFrTimerFunktion) */}
          <div className="self-stretch flex justify-center">
            {renderContent()}
          </div>

          {/* Footer - only show in timer view */}
          {showFooterButtons && (
            <div className="self-stretch inline-flex justify-end items-center gap-2.5">
              <div className="flex justify-end items-center gap-2">
                {/* Settings Button - einheitlicher Outline-Style */}
                <OutlineButton onClick={handleSettingsButtonClick}>
                  Einstellungen
                  <SettingsIcon />
                </OutlineButton>
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
          )}

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
