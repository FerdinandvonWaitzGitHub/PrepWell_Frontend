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
 * PomodoroSettingsDialog - Configure Pomodoro timer settings
 */
const PomodoroSettingsDialog = ({ open, onOpenChange, onStart, initialSettings }) => {
  const [sessionDuration, setSessionDuration] = useState(initialSettings?.sessionDuration || 25);
  const [breakDuration, setBreakDuration] = useState(initialSettings?.breakDuration || 5);
  const [longBreakDuration, setLongBreakDuration] = useState(initialSettings?.longBreakDuration || 15);
  const [totalSessions, setTotalSessions] = useState(4);
  const [autoStartBreak, setAutoStartBreak] = useState(initialSettings?.autoStartBreak ?? true);

  const handleStart = () => {
    onStart(
      {
        sessionDuration,
        breakDuration,
        longBreakDuration,
        sessionsBeforeLongBreak: 4,
        autoStartBreak,
      },
      totalSessions
    );
    onOpenChange(false);
  };

  // Preset options
  const presets = [
    { name: 'Standard', session: 25, break: 5 },
    { name: 'Kurz', session: 15, break: 3 },
    { name: 'Lang', session: 50, break: 10 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Pomodoro Timer</DialogTitle>
          <DialogDescription>
            Konfiguriere deine Pomodoro-Session
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schnellauswahl
            </label>
            <div className="flex gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setSessionDuration(preset.session);
                    setBreakDuration(preset.break);
                  }}
                  className={`
                    flex-1 py-2 px-3 text-sm rounded-lg border transition-colors
                    ${sessionDuration === preset.session && breakDuration === preset.break
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {preset.name}
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {preset.session}/{preset.break}min
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Session Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session-Dauer
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={sessionDuration}
                onChange={(e) => setSessionDuration(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <span className="w-16 text-center text-sm font-medium text-gray-900">
                {sessionDuration} min
              </span>
            </div>
          </div>

          {/* Break Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pause-Dauer
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={breakDuration}
                onChange={(e) => setBreakDuration(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <span className="w-16 text-center text-sm font-medium text-gray-900">
                {breakDuration} min
              </span>
            </div>
          </div>

          {/* Long Break Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lange Pause (nach 4 Sessions)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="45"
                step="5"
                value={longBreakDuration}
                onChange={(e) => setLongBreakDuration(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <span className="w-16 text-center text-sm font-medium text-gray-900">
                {longBreakDuration} min
              </span>
            </div>
          </div>

          {/* Number of Sessions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anzahl Sessions
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setTotalSessions(num)}
                  className={`
                    w-10 h-10 rounded-lg border text-sm font-medium transition-colors
                    ${totalSessions === num
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-start break option */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Pause automatisch starten
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Startet die Pause automatisch nach einer Session
              </p>
            </div>
            <button
              onClick={() => setAutoStartBreak(!autoStartBreak)}
              className={`
                relative w-11 h-6 rounded-full transition-colors
                ${autoStartBreak ? 'bg-primary-500' : 'bg-gray-200'}
              `}
            >
              <span
                className={`
                  absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                  ${autoStartBreak ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Gesamtzeit:</span>{' '}
              {totalSessions * sessionDuration + (totalSessions - 1) * breakDuration + Math.floor((totalSessions - 1) / 4) * (longBreakDuration - breakDuration)} Minuten
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {totalSessions} Sessions × {sessionDuration}min + Pausen
            </p>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button variant="primary" onClick={handleStart}>
            Timer starten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PomodoroSettingsDialog;
