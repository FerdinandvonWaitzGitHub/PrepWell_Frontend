import React, { useEffect } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 3: Urlaubstage einplanen
 * User defines number of vacation days
 * Based on Figma: Schritt_3_body
 *
 * Pre-calculates recommended vacation days:
 * Formula: 1 week off every 6 learning weeks (assuming 5 learning days/week initially)
 * Automatically adjusts when weekStructure changes in Step 5
 */

/**
 * Minus Icon
 */
const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/**
 * Plus Icon
 */
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/**
 * Warning Icon
 */
const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const Step3Urlaubstage = () => {
  const { vacationDays, bufferDays, startDate, endDate, weekStructure, updateWizardData } = useWizard();

  // Calculate and set recommended vacation days on mount (if not yet set)
  useEffect(() => {
    if (vacationDays === null && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const calendarDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const learningWeeks = calendarDays / 7;
      // Formula: 1 week off every 6 weeks, rounded up
      // Default assumption: 5 learning days per week (before Step 5)
      const vacationWeeks = Math.ceil(learningWeeks / 6);
      const recommendedVacationDays = vacationWeeks * 5;
      updateWizardData({ vacationDays: recommendedVacationDays });
    }
  }, [vacationDays, startDate, endDate, updateWizardData]);

  // Use 0 as fallback while calculating
  const displayVacationDays = vacationDays ?? 0;
  const displayBufferDays = bufferDays ?? 0;

  // Calculate total learning days
  const calculateLearningDays = () => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Count learning days based on week structure
    const weekdayMap = {
      0: 'sonntag', 1: 'montag', 2: 'dienstag', 3: 'mittwoch',
      4: 'donnerstag', 5: 'freitag', 6: 'samstag'
    };

    let learningDays = 0;
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayName = weekdayMap[currentDate.getDay()];
      const dayBlocks = weekStructure[dayName];
      // Count day if it has at least one 'lernblock'
      if (Array.isArray(dayBlocks) && dayBlocks.some(b => b === 'lernblock')) {
        learningDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return learningDays;
  };

  const learningDays = calculateLearningDays();
  const netLearningDays = Math.max(0, learningDays - displayBufferDays - displayVacationDays);
  const showWarning = netLearningDays < 30 && learningDays > 0;

  const handleDecrement = () => {
    if (displayVacationDays > 0) {
      updateWizardData({ vacationDays: displayVacationDays - 1 });
    }
  };

  const handleIncrement = () => {
    if (displayVacationDays < 99) {
      updateWizardData({ vacationDays: displayVacationDays + 1 });
    }
  };

  return (
    <div>
      <StepHeader
        step={3}
        title="Wie viele Urlaubstage möchtest du einplanen?"
        description="Wir empfehlen alle 6 Wochen eine Woche Urlaub einzubauen. Alle Urlaubstage werden am Ende deines Lernplans gesammelt. So kannst du dich spontan für einen Urlaub entschließen, und dein nächster Lerntag verschiebt sich nach hinten, indem Urlaubstage aufgebraucht werden - du bleibst also immer im Zeitplan."
      />

      <div className="flex flex-col items-center gap-7 py-7">
        {/* Urlaubstage Counter Card */}
        <div className="w-full max-w-[512px] p-6 bg-white rounded-[10px] border border-neutral-200 flex justify-between items-center">
          <div className="text-lg font-light text-neutral-900">
            Urlaubstage
          </div>
          <div className="flex items-center gap-7">
            {/* Minus Button */}
            <button
              onClick={handleDecrement}
              disabled={displayVacationDays <= 0}
              className="w-9 h-9 rounded-lg bg-neutral-50 border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Verringern"
            >
              <MinusIcon />
            </button>

            {/* Number Display */}
            <span className="text-5xl font-normal text-neutral-900 min-w-[80px] text-center">
              {displayVacationDays}
            </span>

            {/* Plus Button */}
            <button
              onClick={handleIncrement}
              disabled={displayVacationDays >= 99}
              className="w-9 h-9 rounded-lg bg-neutral-50 border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Erhöhen"
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        {/* Anzahl der Lerntage Info */}
        <div className="w-full max-w-[520px] p-4 bg-blue-50/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-neutral-900">
              Anzahl der Lerntage
            </span>
            <span className="text-lg font-light text-neutral-900">
              {netLearningDays} Tage
            </span>
          </div>
        </div>

        {/* Warning Box */}
        {showWarning && (
          <div className="px-4 py-3 bg-white rounded-[10px] border border-red-100 flex items-start gap-3">
            <div className="pt-0.5 text-red-500">
              <WarningIcon />
            </div>
            <div>
              <h4 className="text-sm font-medium text-red-500 leading-5">
                Achtung
              </h4>
              <p className="text-sm font-normal text-red-500 leading-5">
                Dein Lernzeitraum sollte mindestens 30 Tage betragen.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step3Urlaubstage;
