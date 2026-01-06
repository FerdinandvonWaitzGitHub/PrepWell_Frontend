import { useEffect } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import { CheckCircle, Settings } from 'lucide-react';
import { RECHTSGEBIET_LABELS, RECHTSGEBIET_COLORS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 7: URG Creation Mode Selection
 * User chooses how to create Unterrechtsgebiete:
 * - 'manual': Create all URGs from scratch
 * - 'prefilled': Start with a pre-populated list of common URGs
 */

/**
 * Rechtsgebiet Badge Component
 */
const RechtsgebietBadge = ({ rechtsgebietId }) => {
  const label = RECHTSGEBIET_LABELS[rechtsgebietId] || rechtsgebietId;
  const colorClass = RECHTSGEBIET_COLORS[rechtsgebietId] || 'bg-gray-500';

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${colorClass}`}>
      {label}
    </span>
  );
};

/**
 * Option Card Component
 */
const OptionCard = ({ title, description, isRecommended, isSelected, onSelect }) => {
  return (
    <div
      className={`
        p-6 bg-white rounded-lg border-2 cursor-pointer transition-all
        ${isSelected
          ? 'border-primary-600 bg-primary-50'
          : 'border-neutral-200 hover:border-neutral-300'
        }
      `}
      onClick={onSelect}
    >
      {/* Header with optional Empfohlen badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isRecommended && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded-full">
              Empfohlen
              <CheckCircle className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-neutral-900 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-neutral-600 mb-4">
        {description}
      </p>

      {/* Select Button */}
      <button
        type="button"
        className={`
          w-full px-4 py-2.5 rounded-full flex items-center justify-center gap-2 transition-all
          ${isSelected
            ? 'bg-primary-600 text-white'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }
        `}
      >
        <span className="text-sm font-medium">
          {isSelected ? 'Ausgewählt' : 'Auswählen'}
        </span>
        {isSelected && <CheckCircle className="w-4 h-4" />}
      </button>
    </div>
  );
};

/**
 * Step 7 Component
 */
const Step7UrgMode = () => {
  const { urgCreationMode, selectedRechtsgebiete, updateWizardData } = useWizard();

  // Initialize selected Rechtsgebiete from user settings if not set
  useEffect(() => {
    if (selectedRechtsgebiete.length === 0) {
      // Read from user settings in localStorage
      const SETTINGS_KEY = 'prepwell_settings';
      const DEFAULT_RECHTSGEBIETE = ['zivilrecht', 'oeffentliches-recht', 'strafrecht'];

      try {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          const userRechtsgebiete = settings?.jura?.selectedRechtsgebiete;
          if (Array.isArray(userRechtsgebiete) && userRechtsgebiete.length > 0) {
            updateWizardData({ selectedRechtsgebiete: userRechtsgebiete });
            return;
          }
        }
      } catch (e) {
        console.error('Error reading settings:', e);
      }

      // Fallback to defaults
      updateWizardData({ selectedRechtsgebiete: DEFAULT_RECHTSGEBIETE });
    }
  }, [selectedRechtsgebiete, updateWizardData]);

  const handleSelectMode = (mode) => {
    updateWizardData({ urgCreationMode: mode });
  };

  return (
    <div>
      <StepHeader
        step={7}
        title="Rechtsgebiete & Unterrechtsgebiete"
        description="Wähle, wie du die Unterrechtsgebiete für deinen Lernplan erstellen möchtest."
      />

      {/* Current Rechtsgebiete Display */}
      <div className="mb-8 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <p className="text-sm font-medium text-neutral-700 mb-3">
          Deine bisher definierten Rechtsgebiete sind:
        </p>
        <div className="flex flex-wrap gap-2">
          {selectedRechtsgebiete.map((rgId) => (
            <RechtsgebietBadge key={rgId} rechtsgebietId={rgId} />
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <OptionCard
          title="Unterrechtsgebiete selbst erstellen"
          description="Falls du zu jedem Rechtsgebiet alle Unterrechtsgebiete selbst erstellen willst, dann wähle diese Funktion aus."
          isRecommended={false}
          isSelected={urgCreationMode === 'manual'}
          onSelect={() => handleSelectMode('manual')}
        />

        <OptionCard
          title="Mit einer Liste gängiger Unterrechtsgebiete beginnen"
          description="Zu jedem Rechtsgebiet werden automatisch alle gängigen Unterrechtsgebiete erstellt. Du kannst diese Liste später bearbeiten und URGs löschen sowie eigene hinzufügen."
          isRecommended={true}
          isSelected={urgCreationMode === 'prefilled'}
          onSelect={() => handleSelectMode('prefilled')}
        />
      </div>

      {/* Info Alert */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex-shrink-0">
          <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-900">
            Rechtsgebiete ändern
          </p>
          <p className="text-sm text-blue-700">
            Du kannst die Rechtsgebiete in den Einstellungen anpassen.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step7UrgMode;
