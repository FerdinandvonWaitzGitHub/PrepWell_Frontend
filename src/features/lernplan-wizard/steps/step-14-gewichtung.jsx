import { useState, useEffect } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import { Minus, Plus, AlertTriangle } from 'lucide-react';
import { RECHTSGEBIET_LABELS, RECHTSGEBIET_COLORS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 14: Zielgewichtung der Rechtsgebiete
 * User sets percentage weights for each Rechtsgebiet.
 * Weights must sum to 100%.
 */

/**
 * Weight Item Component
 */
const WeightItem = ({ rechtsgebietId, weight, onChange }) => {
  const label = RECHTSGEBIET_LABELS[rechtsgebietId] || rechtsgebietId;
  const colorClass = RECHTSGEBIET_COLORS[rechtsgebietId] || 'bg-gray-500';

  const handleDecrease = () => {
    if (weight > 0) {
      onChange(Math.max(0, weight - 5));
    }
  };

  const handleIncrease = () => {
    if (weight < 100) {
      onChange(Math.min(100, weight + 5));
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200">
      <div className="flex items-center gap-3">
        {/* Color indicator */}
        <div className={`w-3 h-3 rounded-full ${colorClass}`} />
        <span className="font-medium text-neutral-900">{label}</span>
      </div>

      {/* Weight controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={weight <= 0}
          className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-16 text-center">
          <span className="text-lg font-semibold text-neutral-900">{weight} %</span>
        </div>

        <button
          type="button"
          onClick={handleIncrease}
          disabled={weight >= 100}
          className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Step 14 Component
 */
const Step14Gewichtung = () => {
  const { selectedRechtsgebiete, rechtsgebieteGewichtung, updateWizardData } = useWizard();

  const [isEnabled, setIsEnabled] = useState(
    Object.keys(rechtsgebieteGewichtung).length > 0
  );

  // Initialize weights if not set
  useEffect(() => {
    if (isEnabled && Object.keys(rechtsgebieteGewichtung).length === 0) {
      // Initialize with equal distribution
      const equalWeight = Math.floor(100 / selectedRechtsgebiete.length);
      const remainder = 100 - (equalWeight * selectedRechtsgebiete.length);

      const initialWeights = {};
      selectedRechtsgebiete.forEach((rgId, index) => {
        // Give remainder to first item
        initialWeights[rgId] = equalWeight + (index === 0 ? remainder : 0);
      });

      updateWizardData({ rechtsgebieteGewichtung: initialWeights });
    }
  }, [isEnabled, selectedRechtsgebiete, rechtsgebieteGewichtung, updateWizardData]);

  const handleToggle = () => {
    if (isEnabled) {
      // Clear weights
      updateWizardData({ rechtsgebieteGewichtung: {} });
    }
    setIsEnabled(!isEnabled);
  };

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
  const isValid = !isEnabled || totalWeight === 100;

  return (
    <div>
      <StepHeader
        step={14}
        title="Zielgewichtung der Rechtsgebiete"
        description="Damit du während der folgenden Schritte deine grobe Zielgewichtung der Rechtsgebiete nicht aus dem Blick verlierst, hast du jetzt die Möglichkeit eine Zielverteilung anzugeben. Du musst diese beim Erstellen nicht zwingend einhalten, allerdings verschafft sie dir ein Gefühl dafür, wie viel Zeit du für deine URGs und Themen hast."
      />

      {/* Toggle Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`mb-6 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isEnabled
            ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        {isEnabled ? 'Zielgewichtung entfernen' : 'Zielgewichtung festlegen'}
      </button>

      {/* Weight Items */}
      {isEnabled && (
        <>
          <div className="space-y-3 mb-6">
            {selectedRechtsgebiete.map((rgId) => (
              <WeightItem
                key={rgId}
                rechtsgebietId={rgId}
                weight={rechtsgebieteGewichtung[rgId] || 0}
                onChange={(w) => handleWeightChange(rgId, w)}
              />
            ))}
          </div>

          {/* Total display */}
          <div className="flex items-center justify-between p-4 bg-neutral-100 rounded-lg">
            <span className="font-medium text-neutral-700">Gesamt</span>
            <span className={`text-lg font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
              {totalWeight} %
            </span>
          </div>

          {/* Error message if not 100% */}
          {!isValid && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-900">Probleme</h4>
                  <p className="mt-1 text-sm text-red-700">
                    Deine Gewichtungen müssen insgesamt 100% ergeben.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info message */}
          {isValid && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Hinweis:</strong> Die Gewichtung ist nur eine Orientierungshilfe und beeinflusst
                nicht den automatischen Verteilungsalgorithmus. Sie hilft dir dabei, beim Erstellen
                der Themen und Aufgaben den Überblick zu behalten.
              </p>
            </div>
          )}
        </>
      )}

      {/* Info when disabled */}
      {!isEnabled && (
        <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <p className="text-sm text-neutral-600">
            Du kannst diesen Schritt überspringen. Die Zielgewichtung ist optional und
            dient nur als Orientierungshilfe beim Erstellen deines Lernplans.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step14Gewichtung;
