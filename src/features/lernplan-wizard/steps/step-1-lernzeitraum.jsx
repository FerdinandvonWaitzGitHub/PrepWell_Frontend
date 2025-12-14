import React, { useState, useEffect } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 1: Lernzeitraum bestimmen
 * User defines start and end date for their learning period
 * Based on Figma: Schritt_1_body
 */
const Step1Lernzeitraum = () => {
  const { startDate, endDate, updateWizardData } = useWizard();

  // Local state for controlled inputs
  const [localStartDate, setLocalStartDate] = useState(startDate || '');
  const [localEndDate, setLocalEndDate] = useState(endDate || '');

  // Calculate learning days
  const calculateLearningDays = () => {
    if (!localStartDate || !localEndDate) return null;
    const start = new Date(localStartDate);
    const end = new Date(localEndDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const learningDays = calculateLearningDays();

  // Update wizard state when local state changes
  useEffect(() => {
    updateWizardData({
      startDate: localStartDate || null,
      endDate: localEndDate || null,
    });
  }, [localStartDate, localEndDate, updateWizardData]);

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Validate end date is after start date
  const isEndDateValid = !localStartDate || !localEndDate || new Date(localEndDate) > new Date(localStartDate);

  return (
    <div>
      <StepHeader
        step={1}
        title="Definiere deinen Lernzeitraum."
        description="Wir empfehlen pro Lernmonat mindestens 2 Puffertage einzubauen - diese werden am Ende deines Lernplans gesammelt. Falls du bspw. erkrankst und einen Tag aussetzen musst, verschiebt sich der nächste Lerntag einen Schritt nach hinten und ein Puffertag wird aufgebraucht."
      />

      <div className="space-y-6">
        {/* Date inputs container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Date */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Startdatum
            </label>
            <input
              type="date"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              min={today}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-500 mt-2">
              An welchem Tag möchtest du starten?
            </p>
          </div>

          {/* End Date */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enddatum
            </label>
            <input
              type="date"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              min={localStartDate || today}
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-gray-900 bg-white ${
                !isEndDateValid ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <p className="text-xs text-gray-500 mt-2">
              Wann ist deine Prüfung oder dein Zieldatum?
            </p>
            {!isEndDateValid && (
              <p className="text-xs text-red-500 mt-1">
                Das Enddatum muss nach dem Startdatum liegen.
              </p>
            )}
          </div>
        </div>

        {/* Learning days info */}
        {learningDays && (
          <div className="bg-primary-50 rounded-xl p-6 border border-primary-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary-600"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {learningDays} Tage Lernzeitraum
                </p>
                <p className="text-sm text-gray-500">
                  Das entspricht ca. {Math.floor(learningDays / 7)} Wochen
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info alert */}
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
            Du kannst den Lernzeitraum später noch anpassen, wenn sich deine Pläne ändern.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step1Lernzeitraum;
