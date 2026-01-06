import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import { Check, CheckCircle2 } from 'lucide-react';
import { RECHTSGEBIET_LABELS, RECHTSGEBIET_COLORS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 17: Rechtsgebiet Selection for Blocks
 * Similar to Step 8, but for selecting which RG to create blocks for.
 */

/**
 * Radio Option Component
 */
const RadioOption = ({ rechtsgebietId, isSelected, isCompleted, onSelect }) => {
  const label = RECHTSGEBIET_LABELS[rechtsgebietId] || rechtsgebietId;
  const colorClass = RECHTSGEBIET_COLORS[rechtsgebietId] || 'bg-gray-500';

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

          {/* Label with badge */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${colorClass}`}>
              {label}
            </span>
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
 * Step 17 Component
 */
const Step17RgBloeckeSelect = () => {
  const {
    selectedRechtsgebiete,
    currentBlockRgIndex,
    blockRgProgress,
    updateWizardData
  } = useWizard();

  // Get current selection
  const currentRechtsgebiet = selectedRechtsgebiete[currentBlockRgIndex || 0];

  const handleSelectRechtsgebiet = (rgId) => {
    const newIndex = selectedRechtsgebiete.indexOf(rgId);
    if (newIndex !== -1) {
      updateWizardData({ currentBlockRgIndex: newIndex });
    }
  };

  // Check if all Rechtsgebiete are completed
  const allCompleted = selectedRechtsgebiete.every(rgId => blockRgProgress?.[rgId]);

  return (
    <div>
      <StepHeader
        step={17}
        title="Mit welchem Rechtsgebiet möchtest du beginnen?"
        description="Im nächsten Schritt kannst du Lernblöcke erstellen und deine Themen darin unterbringen. Wähle das Rechtsgebiet, mit dem du beginnen möchtest."
      />

      {/* Rechtsgebiet Options */}
      <div className="space-y-3">
        {selectedRechtsgebiete.map((rgId) => (
          <RadioOption
            key={rgId}
            rechtsgebietId={rgId}
            isSelected={currentRechtsgebiet === rgId && !blockRgProgress?.[rgId]}
            isCompleted={blockRgProgress?.[rgId]}
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

export default Step17RgBloeckeSelect;
