import { useEffect } from 'react';
// BUG-P3 FIX: Removed useState - toggle is no longer used
import { useWizard } from '../context/wizard-context';
import { Minus, Plus, AlertTriangle, Network } from 'lucide-react';
import { RECHTSGEBIET_LABELS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 14: Zielgewichtung der Rechtsgebiete
 * User sets percentage weights for each Rechtsgebiet.
 * Weights must sum to 100%.
 *
 * Figma Design: Horizontal cards with ButtonGroup (-, %, +)
 */

/**
 * Weight Card Component - Figma Style
 * Horizontal card with title and ButtonGroup stepper
 */
const WeightCard = ({ rechtsgebietId, weight, onChange }) => {
  const label = RECHTSGEBIET_LABELS[rechtsgebietId] || rechtsgebietId;

  const handleDecrease = () => {
    if (weight > 0) {
      onChange(Math.max(0, weight - 5)); // 5% steps like Figma
    }
  };

  const handleIncrease = () => {
    if (weight < 100) {
      onChange(Math.min(100, weight + 5)); // 5% steps like Figma
    }
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-4 flex flex-col gap-4 min-w-[160px]">
      {/* Title */}
      <p className="font-medium text-sm text-neutral-900">{label}</p>

      {/* ButtonGroup: Minus | Percent | Plus */}
      <div className="flex items-center">
        {/* Minus Button */}
        <button
          type="button"
          onClick={handleDecrease}
          disabled={weight <= 0}
          className="bg-white border border-neutral-200 rounded-l-lg h-9 w-9
                     flex items-center justify-center shadow-sm
                     hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Percent Display */}
        <div className="bg-white border-y border-neutral-200 h-9 px-4 min-w-[60px]
                        flex items-center justify-center shadow-sm">
          <span className="font-medium text-sm text-neutral-900">{weight} %</span>
        </div>

        {/* Plus Button */}
        <button
          type="button"
          onClick={handleIncrease}
          disabled={weight >= 100}
          className="bg-white border border-neutral-200 rounded-r-lg h-9 w-9
                     flex items-center justify-center shadow-sm
                     hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Step 14 Component - Figma Redesign
 * Centered layout with horizontal cards
 */
const Step14Gewichtung = () => {
  const { selectedRechtsgebiete, rechtsgebieteGewichtung, updateWizardData } = useWizard();

  // BUG-P3 FIX: Gewichtung is now always enabled (required)
  // Initialize weights on mount if not set
  useEffect(() => {
    if (Object.keys(rechtsgebieteGewichtung).length === 0 && selectedRechtsgebiete.length > 0) {
      // Initialize with equal distribution (rounded to nearest 5)
      const count = selectedRechtsgebiete.length;
      const baseWeight = Math.floor(100 / count / 5) * 5; // Round down to nearest 5
      const remainder = 100 - (baseWeight * count);

      const initialWeights = {};
      selectedRechtsgebiete.forEach((rgId, index) => {
        // Give remainder to first item (in 5% increments)
        initialWeights[rgId] = baseWeight + (index === 0 ? remainder : 0);
      });

      updateWizardData({ rechtsgebieteGewichtung: initialWeights });
    }
  }, [selectedRechtsgebiete, rechtsgebieteGewichtung, updateWizardData]);

  const handleWeightChange = (rgId, newWeight) => {
    updateWizardData({
      rechtsgebieteGewichtung: {
        ...rechtsgebieteGewichtung,
        [rgId]: newWeight
      }
    });
  };

  // Calculate total
  const totalWeight = Object.values(rechtsgebieteGewichtung).reduce(
    (sum, w) => sum + (w || 0),
    0
  );
  // BUG-P3 FIX: isValid only when sum = 100%
  const isValid = totalWeight === 100;

  return (
    <div className="flex flex-col items-center">
      {/* Header Section - Figma Style */}
      <div className="flex flex-col items-center gap-5 text-center max-w-[900px] mb-8">
        {/* Network Icon */}
        <div className="flex items-center justify-center">
          <Network className="w-12 h-12 text-neutral-900" strokeWidth={1} />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extralight text-neutral-900">
          Zielgewichtung der Rechtsgebiete
        </h1>

        {/* Description - BUG-P3 FIX: Updated text (Gewichtung is now required) */}
        <p className="text-sm font-light text-neutral-500 max-w-[900px]">
          Lege fest, wie viel Zeit du für jedes Rechtsgebiet einplanen möchtest.
          Die Gewichtung muss insgesamt 100% ergeben. Diese Verteilung hilft dir,
          den Überblick über deine Lernziele zu behalten.
        </p>
      </div>

      {/* Weight Cards - Horizontal Layout */}
      {/* BUG-P3 FIX: Removed toggle, cards are always shown */}
      <>
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            {selectedRechtsgebiete.map((rgId) => (
              <WeightCard
                key={rgId}
                rechtsgebietId={rgId}
                weight={rechtsgebieteGewichtung[rgId] || 0}
                onChange={(w) => handleWeightChange(rgId, w)}
              />
            ))}
          </div>

          {/* Error Alert - Figma Style */}
          {!isValid && (
            <div className="bg-white rounded-lg px-4 py-3 flex gap-3 items-start max-w-[700px]">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1 text-red-600">
                <p className="font-medium text-sm">Probleme</p>
                <ul className="text-sm list-disc ml-5">
                  <li>
                    Deine Gewichtungen müssen insgesamt 100% ergeben.
                    {' '}(Aktuell: {totalWeight}%)
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Success Info */}
          {isValid && (
            <div className="bg-green-50 rounded-lg px-4 py-3 flex gap-3 items-start max-w-[700px] border border-green-200">
              <div className="w-4 h-4 rounded-full bg-green-500 mt-0.5 shrink-0 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex flex-col gap-1 text-green-700">
                <p className="font-medium text-sm">Gewichtung vollständig</p>
                <p className="text-sm">
                  Die Gewichtung ist nur eine Orientierungshilfe und beeinflusst
                  nicht den automatischen Verteilungsalgorithmus.
                </p>
              </div>
            </div>
          )}
        </>
    </div>
  );
};

export default Step14Gewichtung;
