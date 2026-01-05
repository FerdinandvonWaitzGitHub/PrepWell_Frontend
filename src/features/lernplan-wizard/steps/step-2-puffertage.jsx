import { useEffect } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 2: Puffertage einplanen
 * User defines number of buffer days for sick days etc.
 * Based on Figma: Schritt_2_body
 *
 * Pre-calculates recommended buffer days: 2 days per 30 calendar days
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

const Step2Puffertage = () => {
  const { bufferDays, startDate, endDate, weekStructure, updateWizardData } = useWizard();

  // Calculate and set recommended buffer days on mount (if not yet set)
  useEffect(() => {
    if (bufferDays === null && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const calendarDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      // Formula: 2 buffer days per 30 calendar days
      const recommendedBufferDays = Math.round((calendarDays / 30) * 2);
      updateWizardData({ bufferDays: recommendedBufferDays });
    }
  }, [bufferDays, startDate, endDate, updateWizardData]);

  // Use 0 as fallback while calculating
  const displayBufferDays = bufferDays ?? 0;

  // Calculate total learning days
  const calculateLearningDays = () => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalCalendarDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

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
  const netLearningDays = Math.max(0, learningDays - displayBufferDays);
  const showWarning = netLearningDays < 30 && learningDays > 0;

  const handleDecrement = () => {
    if (displayBufferDays > 0) {
      updateWizardData({ bufferDays: displayBufferDays - 1 });
    }
  };

  const handleIncrement = () => {
    if (displayBufferDays < 99) {
      updateWizardData({ bufferDays: displayBufferDays + 1 });
    }
  };

  return (
    <div>
      <StepHeader
        step={2}
        title="Wie viele Puffertage möchtest du einplanen?"
        description="Wir empfehlen pro Lernmonat mindestens 2 Puffertage einzubauen - diese werden am Ende deines Lernplans gesammelt. Falls du bspw. erkrankst und einen Tag aussetzen musst, verschiebt sich der nächste Lerntag einen Schritt nach hinten und ein Puffertag wird aufgebraucht."
      />

      <div className="flex flex-col items-center gap-7 py-7">
        {/* Puffertage Counter Card */}
        <div className="w-full max-w-[512px] p-6 bg-white rounded-[10px] border border-neutral-200 flex justify-between items-center">
          <div className="text-lg font-light text-neutral-900">
            Puffertage
          </div>
          <div className="flex items-center gap-7">
            {/* Minus Button */}
            <button
              onClick={handleDecrement}
              disabled={displayBufferDays <= 0}
              className="w-9 h-9 rounded-lg bg-neutral-50 border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Verringern"
            >
              <MinusIcon />
            </button>

            {/* Number Display */}
            <span className="text-5xl font-normal text-neutral-900 min-w-[80px] text-center">
              {displayBufferDays}
            </span>

            {/* Plus Button */}
            <button
              onClick={handleIncrement}
              disabled={displayBufferDays >= 99}
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

export default Step2Puffertage;
