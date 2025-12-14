import React from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 7 - Automatic Path: Automatic plan creation
 * System will generate the learning plan based on settings
 * Based on Figma: Schritt_7_Alt_2_body
 */
const Step7Automatic = () => {
  const {
    startDate,
    endDate,
    bufferDays,
    vacationDays,
    blocksPerDay,
    weekStructure,
  } = useWizard();

  // Calculate summary
  const calculateSummary = () => {
    if (!startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const learningDaysPerWeek = Object.values(weekStructure).filter(Boolean).length;
    const totalWeeks = Math.floor(totalDays / 7);
    const estimatedLearningDays = totalWeeks * learningDaysPerWeek;
    const netLearningDays = estimatedLearningDays - bufferDays - vacationDays;
    const totalBlocks = netLearningDays * blocksPerDay;

    return {
      totalDays,
      totalWeeks,
      learningDaysPerWeek,
      estimatedLearningDays,
      netLearningDays: Math.max(0, netLearningDays),
      totalBlocks: Math.max(0, totalBlocks),
    };
  };

  const summary = calculateSummary();

  return (
    <div>
      <StepHeader
        step={7}
        title="Erstelle deinen Lernplan."
        description="Basierend auf deinen Einstellungen werden wir deinen Lernplan automatisch generieren. Im nächsten Schritt kannst du die Reihenfolge der Themen festlegen."
      />

      <div className="space-y-6">
        {/* Summary */}
        {summary && (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">
              Zusammenfassung deiner Einstellungen:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <p className="text-2xl font-bold text-primary-600">{summary.totalWeeks}</p>
                <p className="text-sm text-gray-500">Wochen gesamt</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <p className="text-2xl font-bold text-primary-600">{summary.learningDaysPerWeek}</p>
                <p className="text-sm text-gray-500">Lerntage/Woche</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <p className="text-2xl font-bold text-primary-600">{blocksPerDay}</p>
                <p className="text-sm text-gray-500">Blöcke/Tag</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <p className="text-2xl font-bold text-green-600">{summary.netLearningDays}</p>
                <p className="text-sm text-gray-500">Netto Lerntage</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <p className="text-2xl font-bold text-amber-600">{bufferDays}</p>
                <p className="text-sm text-gray-500">Puffertage</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <p className="text-2xl font-bold text-blue-600">{vacationDays}</p>
                <p className="text-sm text-gray-500">Urlaubstage</p>
              </div>
            </div>
          </div>
        )}

        {/* What happens next */}
        <div className="bg-primary-50 rounded-xl p-6 border border-primary-200">
          <h4 className="font-semibold text-gray-900 mb-3">
            Was passiert als nächstes?
          </h4>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center flex-shrink-0">
                1
              </span>
              <span className="text-sm text-gray-700">
                Du wählst die Reihenfolge deiner Unterrechtsgebiete
              </span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center flex-shrink-0">
                2
              </span>
              <span className="text-sm text-gray-700">
                Du sortierst deine Lerntage nach Priorität
              </span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center flex-shrink-0">
                3
              </span>
              <span className="text-sm text-gray-700">
                Wir generieren deinen optimierten Lernplan
              </span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center flex-shrink-0">
                4
              </span>
              <span className="text-sm text-gray-700">
                Du kannst Anpassungen vornehmen, falls nötig
              </span>
            </li>
          </ol>
        </div>

        {/* Total blocks info */}
        {summary && (
          <div className="bg-green-50 rounded-xl p-4 border border-green-200 flex gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-green-600 flex-shrink-0 mt-0.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p className="text-sm text-green-700">
              Mit diesen Einstellungen stehen dir insgesamt{' '}
              <span className="font-semibold">{summary.totalBlocks} Lernblöcke</span> zur Verfügung.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step7Automatic;
