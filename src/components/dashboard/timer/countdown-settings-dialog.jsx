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
 * Clock Icon
 */
const ClockIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-500">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 8 14" />
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
 * Preset Button
 */
const PresetButton = ({ selected, onClick, children }) => (
  <button
    onClick={onClick}
    className={`
      py-3 px-4 rounded-lg text-sm font-light font-['DM_Sans'] transition-colors
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
 * CountdownSettingsDialog - Configure countdown timer duration with Figma design
 */
const CountdownSettingsDialog = ({ open, onOpenChange, onStart }) => {
  const { saveTimerConfig, countdownSettings } = useTimer();

  const [duration, setDuration] = useState(countdownSettings?.duration || 60);
  const [customHours, setCustomHours] = useState(Math.floor((countdownSettings?.duration || 60) / 60));
  const [customMinutes, setCustomMinutes] = useState((countdownSettings?.duration || 60) % 60);
  const [isCustom, setIsCustom] = useState(false);

  if (!open) return null;

  // Quick presets
  const presets = [
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1 Stunde', value: 60 },
    { label: '1,5 Stunden', value: 90 },
    { label: '2 Stunden', value: 120 },
    { label: '3 Stunden', value: 180 },
  ];

  const handlePresetClick = (value) => {
    setDuration(value);
    setIsCustom(false);
  };

  const handleCustomChange = (hours, minutes) => {
    setCustomHours(hours);
    setCustomMinutes(minutes);
    setIsCustom(true);
    setDuration(hours * 60 + minutes);
  };

  const handleSave = () => {
    const finalDuration = isCustom ? (customHours * 60 + customMinutes) : duration;
    if (finalDuration > 0) {
      // Save configuration to localStorage
      saveTimerConfig({
        timerType: TIMER_TYPES.COUNTDOWN,
        settings: { duration: finalDuration },
      });

      // Optionally start immediately if onStart is provided
      if (onStart) {
        onStart(finalDuration);
      }

      onOpenChange(false);
    }
  };

  // Calculate end time
  const finalDuration = isCustom ? (customHours * 60 + customMinutes) : duration;
  const endTime = new Date(Date.now() + finalDuration * 60 * 1000);
  const endTimeStr = endTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  // Format duration display
  const durationDisplay = finalDuration >= 60
    ? `${Math.floor(finalDuration / 60)}h ${finalDuration % 60 > 0 ? `${finalDuration % 60}min` : ''}`
    : `${finalDuration}min`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
        <div
          className="w-[806px] p-6 relative bg-white rounded-[10px] shadow-lg outline outline-1 outline-offset-[-1px] outline-neutral-200
                     inline-flex flex-col justify-start items-start gap-8 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="self-stretch flex flex-col justify-start items-start gap-1.5">
            <h2 className="self-stretch text-neutral-900 text-lg font-light font-['DM_Sans'] leading-4">
              Countdown Timer Einstellungen
            </h2>
            <p className="text-neutral-500 text-sm font-normal font-['DM_Sans'] leading-5">
              Wie lange möchtest du lernen?
            </p>
          </div>

          {/* Content */}
          <div className="self-stretch flex flex-col gap-6">
            {/* Quick Presets */}
            <div className="flex flex-col gap-3">
              <span className="text-neutral-900 text-sm font-light font-['DM_Sans']">
                Schnellauswahl
              </span>
              <div className="grid grid-cols-3 gap-3">
                {presets.map((preset) => (
                  <PresetButton
                    key={preset.value}
                    selected={!isCustom && duration === preset.value}
                    onClick={() => handlePresetClick(preset.value)}
                  >
                    {preset.label}
                  </PresetButton>
                ))}
              </div>
            </div>

            {/* Custom Duration */}
            <div className="flex flex-col gap-3">
              <span className="text-neutral-900 text-sm font-light font-['DM_Sans']">
                Eigene Zeit
              </span>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 font-light font-['DM_Sans'] mb-1">Stunden</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={customHours}
                    onChange={(e) => handleCustomChange(Math.max(0, Math.min(12, Number(e.target.value))), customMinutes)}
                    onFocus={() => setIsCustom(true)}
                    className={`
                      w-full px-3 py-2.5 text-center text-lg font-light font-['DM_Sans'] rounded-lg
                      outline outline-1 outline-offset-[-1px]
                      focus:outline-neutral-900 focus:ring-0
                      ${isCustom ? 'outline-neutral-900 bg-neutral-50' : 'outline-neutral-200'}
                    `}
                  />
                </div>
                <span className="text-2xl text-neutral-400 mt-5 font-light">:</span>
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 font-light font-['DM_Sans'] mb-1">Minuten</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    value={customMinutes}
                    onChange={(e) => handleCustomChange(customHours, Math.max(0, Math.min(59, Number(e.target.value))))}
                    onFocus={() => setIsCustom(true)}
                    className={`
                      w-full px-3 py-2.5 text-center text-lg font-light font-['DM_Sans'] rounded-lg
                      outline outline-1 outline-offset-[-1px]
                      focus:outline-neutral-900 focus:ring-0
                      ${isCustom ? 'outline-neutral-900 bg-neutral-50' : 'outline-neutral-200'}
                    `}
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-900 text-sm font-light font-['DM_Sans']">
                    <span className="font-medium">{durationDisplay}</span>
                  </p>
                  <p className="text-neutral-500 text-xs font-light font-['DM_Sans'] mt-0.5">
                    Endet um {endTimeStr}
                  </p>
                </div>
                <ClockIcon />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="self-stretch h-10 inline-flex justify-end items-end gap-2.5">
            <div className="flex justify-end items-center gap-2">
              <OutlineButton onClick={() => onOpenChange(false)}>
                Abbrechen
              </OutlineButton>
              <PrimaryButton
                onClick={handleSave}
                disabled={finalDuration === 0}
              >
                Speichern
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
    </>
  );
};

export default CountdownSettingsDialog;
