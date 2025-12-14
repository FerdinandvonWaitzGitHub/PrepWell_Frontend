import React from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 5: Wochenstruktur
 * User defines which days of the week they want to learn
 * Based on Figma: Schritt_5_body
 */
const Step5Wochenstruktur = () => {
  const { weekStructure, updateWizardData } = useWizard();

  const days = [
    { key: 'montag', label: 'Mo', fullLabel: 'Montag' },
    { key: 'dienstag', label: 'Di', fullLabel: 'Dienstag' },
    { key: 'mittwoch', label: 'Mi', fullLabel: 'Mittwoch' },
    { key: 'donnerstag', label: 'Do', fullLabel: 'Donnerstag' },
    { key: 'freitag', label: 'Fr', fullLabel: 'Freitag' },
    { key: 'samstag', label: 'Sa', fullLabel: 'Samstag' },
    { key: 'sonntag', label: 'So', fullLabel: 'Sonntag' },
  ];

  const toggleDay = (dayKey) => {
    updateWizardData({
      weekStructure: {
        ...weekStructure,
        [dayKey]: !weekStructure[dayKey],
      },
    });
  };

  const selectPreset = (preset) => {
    updateWizardData({ weekStructure: preset });
  };

  const presets = [
    {
      name: 'Werktage',
      description: 'Mo - Fr',
      structure: {
        montag: true, dienstag: true, mittwoch: true,
        donnerstag: true, freitag: true, samstag: false, sonntag: false,
      },
    },
    {
      name: 'Ganze Woche',
      description: 'Mo - So',
      structure: {
        montag: true, dienstag: true, mittwoch: true,
        donnerstag: true, freitag: true, samstag: true, sonntag: true,
      },
    },
    {
      name: 'Intensiv',
      description: 'Mo - Sa',
      structure: {
        montag: true, dienstag: true, mittwoch: true,
        donnerstag: true, freitag: true, samstag: true, sonntag: false,
      },
    },
  ];

  const selectedDaysCount = Object.values(weekStructure).filter(Boolean).length;

  return (
    <div>
      <StepHeader
        step={5}
        title="Strukturiere deine Woche."
        description="An welchen Wochentagen möchtest du lernen? Du kannst dies später jederzeit anpassen."
      />

      <div className="space-y-6">
        {/* Presets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {presets.map((preset) => {
            const isActive = JSON.stringify(weekStructure) === JSON.stringify(preset.structure);
            return (
              <button
                key={preset.name}
                onClick={() => selectPreset(preset.structure)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <h4 className="font-semibold text-gray-900">{preset.name}</h4>
                <p className="text-sm text-gray-500">{preset.description}</p>
              </button>
            );
          })}
        </div>

        {/* Day selector */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-4">
            Oder wähle einzelne Tage:
          </h4>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => (
              <button
                key={day.key}
                onClick={() => toggleDay(day.key)}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                  weekStructure[day.key]
                    ? 'border-primary-500 bg-primary-100 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <span className="text-lg font-semibold">{day.label}</span>
                <span className="text-xs hidden md:block">{day.fullLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className={`rounded-xl p-4 border flex gap-3 ${
          selectedDaysCount > 0
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`flex-shrink-0 mt-0.5 ${
              selectedDaysCount > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {selectedDaysCount > 0 ? (
              <polyline points="20 6 9 17 4 12" />
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </>
            )}
          </svg>
          <p className={`text-sm ${
            selectedDaysCount > 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            {selectedDaysCount > 0 ? (
              <>
                <span className="font-semibold">{selectedDaysCount} Lerntag{selectedDaysCount !== 1 ? 'e' : ''}</span> pro Woche ausgewählt.
                {selectedDaysCount < 3 && ' Wir empfehlen mindestens 3 Lerntage pro Woche.'}
              </>
            ) : (
              'Bitte wähle mindestens einen Lerntag aus.'
            )}
          </p>
        </div>

        {/* Info */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 flex gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-blue-600 flex-shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-sm text-blue-700">
            Freie Tage werden automatisch als Erholungstage markiert.
            Du kannst sie später bei Bedarf zum Lernen nutzen.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step5Wochenstruktur;
