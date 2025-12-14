import React from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 2: Puffertage einplanen
 * User defines number of buffer days for sick days etc.
 * Based on Figma: Schritt_2_body
 */
const Step2Puffertage = () => {
  const { bufferDays, startDate, endDate, updateWizardData } = useWizard();

  // Calculate total days and recommended buffer
  const calculateRecommendation = () => {
    if (!startDate || !endDate) return { totalDays: 0, recommended: 2 };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const months = totalDays / 30;
    const recommended = Math.max(2, Math.round(months * 2));
    return { totalDays, recommended };
  };

  const { totalDays, recommended } = calculateRecommendation();

  const handleChange = (value) => {
    const numValue = Math.max(0, Math.min(30, parseInt(value) || 0));
    updateWizardData({ bufferDays: numValue });
  };

  const presetOptions = [0, 2, 4, 6, 8, 10];

  return (
    <div>
      <StepHeader
        step={2}
        title="Wie viele Puffertage möchtest du einplanen?"
        description="Wir empfehlen pro Lernmonat mindestens 2 Puffertage einzubauen - diese werden am Ende deines Lernplans gesammelt. Falls du bspw. erkrankst und einen Tag aussetzen musst, verschiebt sich der nächste Lerntag einen Schritt nach hinten und ein Puffertag wird aufgebraucht."
      />

      <div className="space-y-6">
        {/* Recommendation */}
        {totalDays > 0 && (
          <div className="bg-primary-50 rounded-xl p-4 border border-primary-200 flex gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary-600 flex-shrink-0 mt-0.5"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
            <p className="text-sm text-primary-700">
              <span className="font-semibold">Empfehlung:</span> Bei {totalDays} Tagen Lernzeitraum empfehlen wir
              mindestens <span className="font-semibold">{recommended} Puffertage</span>.
            </p>
          </div>
        )}

        {/* Preset options */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {presetOptions.map((option) => (
            <button
              key={option}
              onClick={() => updateWizardData({ bufferDays: option })}
              className={`py-4 px-6 rounded-xl border-2 text-center transition-all ${
                bufferDays === option
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl font-semibold block">{option}</span>
              <span className="text-xs text-gray-500">Tage</span>
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Oder gib eine eigene Anzahl ein:
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleChange(bufferDays - 1)}
              disabled={bufferDays <= 0}
              className="w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <input
              type="number"
              value={bufferDays}
              onChange={(e) => handleChange(e.target.value)}
              min={0}
              max={30}
              className="w-24 text-center text-2xl font-semibold py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />

            <button
              onClick={() => handleChange(bufferDays + 1)}
              disabled={bufferDays >= 30}
              className="w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <span className="text-gray-500">Puffertage</span>
          </div>
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
            Puffertage werden am Ende deines Lernplans gesammelt und können bei Bedarf genutzt werden.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step2Puffertage;
