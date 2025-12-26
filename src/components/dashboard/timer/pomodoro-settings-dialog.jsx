import React, { useState } from 'react';
import { useTimer, TIMER_TYPES } from '../../../contexts/timer-context';

/**
 * Close Icon (X)
 */
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-70">
    <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
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
 * Outline Button - matches Figma pill button style
 */
const OutlineButton = ({ children, onClick, disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-5 py-2.5 rounded-3xl outline outline-1 outline-offset-[-1px] outline-gray-200
      inline-flex justify-center items-center gap-2
      text-gray-900 text-sm font-light font-['DM_Sans'] leading-5
      hover:bg-gray-50 transition-colors
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
 * Preset Button
 */
const PresetButton = ({ selected, onClick, children }) => (
  <button
    onClick={onClick}
    className={`
      flex-1 py-2.5 px-4 rounded-lg text-sm font-light font-['DM_Sans'] transition-colors
      ${selected
        ? 'bg-gray-900 text-white'
        : 'bg-white text-gray-900 outline outline-1 outline-offset-[-1px] outline-gray-200 hover:bg-gray-50'
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
        ? 'bg-gray-900 text-white'
        : 'bg-white text-gray-900 outline outline-1 outline-offset-[-1px] outline-gray-200 hover:bg-gray-50'
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
      ${checked ? 'bg-gray-900' : 'bg-gray-200'}
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
 * PomodoroSettingsDialog - Configure Pomodoro timer settings with Figma design
 */
const PomodoroSettingsDialog = ({ open, onOpenChange, onStart, initialSettings }) => {
  const { saveTimerConfig, pomodoroSettings } = useTimer();

  const [sessionDuration, setSessionDuration] = useState(initialSettings?.sessionDuration || pomodoroSettings?.sessionDuration || 25);
  const [breakDuration, setBreakDuration] = useState(initialSettings?.breakDuration || pomodoroSettings?.breakDuration || 5);
  const [longBreakDuration, setLongBreakDuration] = useState(initialSettings?.longBreakDuration || pomodoroSettings?.longBreakDuration || 15);
  const [totalSessions, setTotalSessions] = useState(4);
  const [autoStartBreak, setAutoStartBreak] = useState(initialSettings?.autoStartBreak ?? pomodoroSettings?.autoStartBreak ?? true);

  if (!open) return null;

  const handleSave = () => {
    const settings = {
      sessionDuration,
      breakDuration,
      longBreakDuration,
      sessionsBeforeLongBreak: 4,
      autoStartBreak,
    };

    // Save configuration to localStorage
    saveTimerConfig({
      timerType: TIMER_TYPES.POMODORO,
      settings,
      totalSessions,
    });

    // Optionally start immediately if onStart is provided
    if (onStart) {
      onStart(settings, totalSessions);
    }

    onOpenChange(false);
  };

  // Preset options
  const presets = [
    { name: 'Standard', session: 25, break: 5 },
    { name: 'Kurz', session: 15, break: 3 },
    { name: 'Lang', session: 50, break: 10 },
  ];

  // Calculate total time
  const totalMinutes = totalSessions * sessionDuration + (totalSessions - 1) * breakDuration + Math.floor((totalSessions - 1) / 4) * (longBreakDuration - breakDuration);

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
          className="w-[806px] p-6 relative bg-white rounded-[10px] shadow-lg outline outline-1 outline-offset-[-1px] outline-gray-200
                     inline-flex flex-col justify-start items-start gap-8 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="self-stretch flex flex-col justify-start items-start gap-1.5">
            <h2 className="self-stretch text-gray-900 text-lg font-light font-['DM_Sans'] leading-4">
              Pomodoro Timer Einstellungen
            </h2>
            <p className="text-gray-500 text-sm font-normal font-['DM_Sans'] leading-5">
              Konfiguriere deine Pomodoro-Session
            </p>
          </div>

          {/* Content */}
          <div className="self-stretch flex flex-col gap-6">
            {/* Presets */}
            <div className="flex flex-col gap-3">
              <span className="text-gray-900 text-sm font-light font-['DM_Sans']">
                Schnellauswahl
              </span>
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

            {/* Session Duration Slider */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 text-sm font-light font-['DM_Sans']">
                  Session-Dauer
                </span>
                <span className="text-gray-900 text-sm font-light font-['DM_Sans']">
                  {sessionDuration} min
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={sessionDuration}
                onChange={(e) => setSessionDuration(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
              />
            </div>

            {/* Break Duration Slider */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 text-sm font-light font-['DM_Sans']">
                  Pause-Dauer
                </span>
                <span className="text-gray-900 text-sm font-light font-['DM_Sans']">
                  {breakDuration} min
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={breakDuration}
                onChange={(e) => setBreakDuration(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
              />
            </div>

            {/* Long Break Duration Slider */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 text-sm font-light font-['DM_Sans']">
                  Lange Pause (nach 4 Sessions)
                </span>
                <span className="text-gray-900 text-sm font-light font-['DM_Sans']">
                  {longBreakDuration} min
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                step="5"
                value={longBreakDuration}
                onChange={(e) => setLongBreakDuration(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
              />
            </div>

            {/* Number of Sessions */}
            <div className="flex flex-col gap-3">
              <span className="text-gray-900 text-sm font-light font-['DM_Sans']">
                Anzahl Sessions
              </span>
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

            {/* Auto-start break toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-gray-900 text-sm font-light font-['DM_Sans']">
                  Pause automatisch starten
                </span>
                <p className="text-gray-500 text-xs font-light font-['DM_Sans'] mt-0.5">
                  Startet die Pause automatisch nach einer Session
                </p>
              </div>
              <ToggleSwitch checked={autoStartBreak} onChange={setAutoStartBreak} />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 text-sm font-light font-['DM_Sans']">
                <span className="font-medium">Gesamtzeit:</span> {totalMinutes} Minuten
              </p>
              <p className="text-gray-500 text-xs font-light font-['DM_Sans'] mt-1">
                {totalSessions} Sessions × {sessionDuration}min + Pausen
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="self-stretch h-10 inline-flex justify-end items-end gap-2.5">
            <div className="flex justify-end items-center gap-2">
              <OutlineButton onClick={() => onOpenChange(false)}>
                Abbrechen
              </OutlineButton>
              <PrimaryButton onClick={handleSave}>
                Speichern
                <CheckIcon />
              </PrimaryButton>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="w-4 h-4 absolute right-4 top-4 rounded-sm hover:bg-gray-100 flex items-center justify-center"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </>
  );
};

export default PomodoroSettingsDialog;
