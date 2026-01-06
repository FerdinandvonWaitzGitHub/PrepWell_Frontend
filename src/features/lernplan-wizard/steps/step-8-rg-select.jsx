import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import { Check, CheckCircle2 } from 'lucide-react';
import { RECHTSGEBIET_LABELS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 8: Rechtsgebiet Selection
 * User selects which Rechtsgebiet to configure URGs for next.
 * Shows completion status for each Rechtsgebiet.
 */

/**
 * Radio Option Component
 */
const RadioOption = ({ rechtsgebietId, isSelected, isCompleted, onSelect }) => {
  const label = RECHTSGEBIET_LABELS[rechtsgebietId] || rechtsgebietId;

  return (
    <div
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all
        ${isSelected
          ? 'border-primary-600 bg-primary-50'
          : isCompleted
            ? 'border-green-200 bg-green-50'
            : 'border-neutral-200 hover:border-neutral-300 bg-white'
        }
      `}
      onClick={() => !isCompleted && onSelect()}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Radio indicator */}
          <div className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${isSelected
              ? 'border-primary-600 bg-primary-600'
              : isCompleted
                ? 'border-green-500 bg-green-500'
                : 'border-neutral-300'
            }
          `}>
            {(isSelected || isCompleted) && (
              <Check className="w-3 h-3 text-white" />
            )}
          </div>

          {/* Label */}
          <div>
            <p className="text-sm text-neutral-500">
              Semesterdurchschnitte über die Gesamtdauer anzeigen.
            </p>
            <p className="text-base font-medium text-neutral-900">
              {label}
            </p>
          </div>
        </div>

        {/* Completion status */}
        {isCompleted && (
          <div className="flex items-center gap-1 text-green-600">
            <span className="text-sm font-medium">erledigt</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Step 8 Component
 */
const Step8RgSelect = () => {
  const {
    selectedRechtsgebiete,
    currentRechtsgebietIndex,
    rechtsgebieteProgress,
    updateWizardData
  } = useWizard();

  // Get current selection (the RG at current index)
  const currentRechtsgebiet = selectedRechtsgebiete[currentRechtsgebietIndex];

  const handleSelectRechtsgebiet = (rgId) => {
    // Find the index of this Rechtsgebiet
    const newIndex = selectedRechtsgebiete.indexOf(rgId);
    if (newIndex !== -1) {
      updateWizardData({ currentRechtsgebietIndex: newIndex });
    }
  };

  // Check if all Rechtsgebiete are completed
  const allCompleted = selectedRechtsgebiete.every(rgId => rechtsgebieteProgress[rgId]);

  return (
    <div>
      <StepHeader
        step={8}
        title="Mit welchem Rechtsgebiet möchtest du beginnen?"
        description="Im nächsten Schritt kannst deinen Themen Aufgaben hinzufügen. Außerdem kannst du Blöcke unterschiedlicher Dauer erstellen, je nachdem wie viele Blöcke in deiner Tagesstruktur vorhanden sind, und alle Themen in diesen Blöcken unterbringen. So kannst du planen, wie lange du für die Bearbeitung brauchst und deinen Lernplan optimal zusammenstellen."
      />

      {/* Rechtsgebiet Options */}
      <div className="space-y-3">
        {selectedRechtsgebiete.map((rgId) => (
          <RadioOption
            key={rgId}
            rechtsgebietId={rgId}
            isSelected={currentRechtsgebiet === rgId && !rechtsgebieteProgress[rgId]}
            isCompleted={rechtsgebieteProgress[rgId]}
            onSelect={() => handleSelectRechtsgebiet(rgId)}
          />
        ))}
      </div>

      {/* Info text if all completed */}
      {allCompleted && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">
            Alle Rechtsgebiete wurden konfiguriert. Du kannst nun fortfahren.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step8RgSelect;
