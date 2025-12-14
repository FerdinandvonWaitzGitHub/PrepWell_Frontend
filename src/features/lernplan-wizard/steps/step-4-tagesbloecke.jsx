import React from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 4: Tagesblöcke festlegen
 * User defines how many learning blocks per day
 * Based on Figma: Schritt_4_body
 */
const Step4Tagesbloecke = () => {
  const { blocksPerDay, updateWizardData } = useWizard();

  const blockOptions = [
    {
      value: 1,
      title: '1 Block',
      description: 'Fokussiertes Lernen in einer Session',
      icon: (
        <div className="flex gap-1">
          <div className="w-8 h-8 rounded bg-primary-500" />
        </div>
      ),
    },
    {
      value: 2,
      title: '2 Blöcke',
      description: 'Vormittags und nachmittags',
      icon: (
        <div className="flex gap-1">
          <div className="w-8 h-8 rounded bg-primary-500" />
          <div className="w-8 h-8 rounded bg-primary-400" />
        </div>
      ),
    },
    {
      value: 3,
      title: '3 Blöcke',
      description: 'Morgens, mittags, abends',
      icon: (
        <div className="flex gap-1">
          <div className="w-8 h-8 rounded bg-primary-500" />
          <div className="w-8 h-8 rounded bg-primary-400" />
          <div className="w-8 h-8 rounded bg-primary-300" />
        </div>
      ),
    },
    {
      value: 4,
      title: '4 Blöcke',
      description: 'Intensives Lernen mit mehreren Pausen',
      icon: (
        <div className="flex gap-1">
          <div className="w-6 h-8 rounded bg-primary-500" />
          <div className="w-6 h-8 rounded bg-primary-400" />
          <div className="w-6 h-8 rounded bg-primary-300" />
          <div className="w-6 h-8 rounded bg-primary-200" />
        </div>
      ),
    },
  ];

  return (
    <div>
      <StepHeader
        step={4}
        title="In wie viele Blöcke soll ein Tag eingeteilt sein?"
        description="Wir bieten dir folgende Optionen, um deinen Lernplan zu strukturieren. Jeder Block entspricht einer Lerneinheit am Tag."
      />

      <div className="space-y-6">
        {/* Block options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blockOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateWizardData({ blocksPerDay: option.value })}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                blocksPerDay === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                {option.icon}
                {blocksPerDay === option.value && (
                  <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {option.title}
              </h3>
              <p className="text-sm text-gray-500">
                {option.description}
              </p>
            </button>
          ))}
        </div>

        {/* Visual representation of day */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-4">
            So sieht ein Tag in deinem Lernplan aus:
          </h4>
          <div className="flex items-center gap-2">
            {Array.from({ length: blocksPerDay }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-16 rounded-lg bg-gradient-to-b from-primary-100 to-primary-200 border border-primary-300 flex items-center justify-center"
              >
                <span className="text-sm font-medium text-primary-700">
                  Block {i + 1}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Du kannst jedem Block ein Thema, eine Wiederholung oder eine Klausur zuweisen.
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
            Mehr Blöcke bedeuten flexiblere Planung, aber auch mehr Aufwand bei der Erstellung.
            Für die meisten Lernenden sind 2-3 Blöcke optimal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step4Tagesbloecke;
