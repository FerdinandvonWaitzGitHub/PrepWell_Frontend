import React from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 3: Urlaubstage einplanen
 * User defines number of vacation days
 * Based on Figma: Schritt_3_body
 */
const Step3Urlaubstage = () => {
  const { vacationDays, startDate, endDate, updateWizardData } = useWizard();

  // Calculate total weeks and recommended vacation
  const calculateRecommendation = () => {
    if (!startDate || !endDate) return { totalWeeks: 0, recommended: 7 };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    // 1 week vacation per 6 weeks of learning
    const recommended = Math.floor(totalWeeks / 6) * 7;
    return { totalWeeks, recommended: Math.max(0, recommended) };
  };

  const { totalWeeks, recommended } = calculateRecommendation();

  const handleChange = (value) => {
    const numValue = Math.max(0, Math.min(60, parseInt(value) || 0));
    updateWizardData({ vacationDays: numValue });
  };

  const presetOptions = [0, 7, 14, 21, 28];

  return (
    <div>
      <StepHeader
        step={3}
        title="Wie viele Urlaubstage möchtest du einplanen?"
        description="Wir empfehlen alle 6 Wochen eine Woche Urlaub einzubauen. Alle Urlaubstage werden am Ende deines Lernplans gesammelt. So kannst du dich spontan für einen Urlaub entschließen, und dein nächster Lerntag verschiebt sich nach hinten, indem Urlaubstage aufgebraucht werden - du bleibst also immer im Zeitplan."
      />

      <div className="space-y-6">
        {/* Recommendation */}
        {totalWeeks > 0 && (
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
              <span className="font-semibold">Empfehlung:</span> Bei {totalWeeks} Wochen Lernzeitraum empfehlen wir
              {recommended > 0 ? (
                <> mindestens <span className="font-semibold">{recommended} Urlaubstage</span> ({Math.floor(recommended / 7)} Woche{Math.floor(recommended / 7) !== 1 ? 'n' : ''}).</>
              ) : (
                <> keine Urlaubstage (Lernzeitraum unter 6 Wochen).</>
              )}
            </p>
          </div>
        )}

        {/* Preset options - in weeks */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {presetOptions.map((days) => (
            <button
              key={days}
              onClick={() => updateWizardData({ vacationDays: days })}
              className={`py-4 px-6 rounded-xl border-2 text-center transition-all ${
                vacationDays === days
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl font-semibold block">{days === 0 ? '0' : Math.floor(days / 7)}</span>
              <span className="text-xs text-gray-500">
                {days === 0 ? 'Keine' : days === 7 ? 'Woche' : 'Wochen'}
              </span>
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Oder gib eine eigene Anzahl ein (in Tagen):
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleChange(vacationDays - 1)}
              disabled={vacationDays <= 0}
              className="w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <input
              type="number"
              value={vacationDays}
              onChange={(e) => handleChange(e.target.value)}
              min={0}
              max={60}
              className="w-24 text-center text-2xl font-semibold py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />

            <button
              onClick={() => handleChange(vacationDays + 1)}
              disabled={vacationDays >= 60}
              className="w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <span className="text-gray-500">Urlaubstage</span>
          </div>
          {vacationDays > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              = {Math.floor(vacationDays / 7)} Woche{Math.floor(vacationDays / 7) !== 1 ? 'n' : ''} und {vacationDays % 7} Tag{vacationDays % 7 !== 1 ? 'e' : ''}
            </p>
          )}
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
            Urlaubstage helfen dir, dich zu erholen und langfristig motiviert zu bleiben.
            Du kannst sie flexibel nutzen, wann immer du eine Pause brauchst.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step3Urlaubstage;
