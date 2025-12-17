import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui';

/**
 * CountdownSettingsDialog - Configure countdown timer duration
 */
const CountdownSettingsDialog = ({ open, onOpenChange, onStart }) => {
  const [duration, setDuration] = useState(60); // minutes
  const [customHours, setCustomHours] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(0);
  const [isCustom, setIsCustom] = useState(false);

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

  const handleCustomChange = () => {
    setIsCustom(true);
    setDuration(customHours * 60 + customMinutes);
  };

  const handleStart = () => {
    const finalDuration = isCustom ? (customHours * 60 + customMinutes) : duration;
    if (finalDuration > 0) {
      onStart(finalDuration);
      onOpenChange(false);
    }
  };

  // Calculate end time
  const endTime = new Date(Date.now() + (isCustom ? (customHours * 60 + customMinutes) : duration) * 60 * 1000);
  const endTimeStr = endTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Countdown Timer</DialogTitle>
          <DialogDescription>
            Wie lange möchtest du lernen?
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Schnellauswahl
            </label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetClick(preset.value)}
                  className={`
                    py-3 px-4 text-sm rounded-lg border transition-colors
                    ${!isCustom && duration === preset.value
                      ? 'bg-primary-100 border-primary-300 text-primary-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Eigene Zeit
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Stunden</label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={customHours}
                  onChange={(e) => {
                    setCustomHours(Math.max(0, Math.min(12, Number(e.target.value))));
                    setIsCustom(true);
                  }}
                  onFocus={() => setIsCustom(true)}
                  className={`
                    w-full px-3 py-2 text-center text-lg border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-400
                    ${isCustom ? 'border-primary-300 bg-primary-50' : 'border-gray-200'}
                  `}
                />
              </div>
              <span className="text-2xl text-gray-400 mt-5">:</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Minuten</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={customMinutes}
                  onChange={(e) => {
                    setCustomMinutes(Math.max(0, Math.min(59, Number(e.target.value))));
                    setIsCustom(true);
                  }}
                  onFocus={() => setIsCustom(true)}
                  className={`
                    w-full px-3 py-2 text-center text-lg border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-400
                    ${isCustom ? 'border-primary-300 bg-primary-50' : 'border-gray-200'}
                  `}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {isCustom
                    ? `${customHours > 0 ? `${customHours}h ` : ''}${customMinutes}min`
                    : `${Math.floor(duration / 60) > 0 ? `${Math.floor(duration / 60)}h ` : ''}${duration % 60}min`
                  }
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Endet um {endTimeStr}
                </p>
              </div>
              <div className="text-right">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-blue-500"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 8 14" />
                </svg>
              </div>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleStart}
            disabled={(isCustom && customHours === 0 && customMinutes === 0) || (!isCustom && duration === 0)}
          >
            Timer starten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CountdownSettingsDialog;
