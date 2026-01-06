import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import { CheckCircle, Shuffle, Target, BookOpen } from 'lucide-react';

/**
 * Step 20: Verteilungsmodus
 * User chooses how blocks should be distributed across calendar days.
 * The algorithm will respect the Gewichtung from Step 14.
 */

/**
 * Option Card Component
 */
const OptionCard = ({
  icon: Icon,
  title,
  description,
  example,
  isSelected,
  onSelect,
  isDisabled = false,
  disabledReason = ''
}) => {
  return (
    <div
      className={`
        p-6 bg-white rounded-lg border-2 transition-all
        ${isDisabled
          ? 'opacity-50 cursor-not-allowed border-neutral-200'
          : isSelected
            ? 'border-primary-600 bg-primary-50 cursor-pointer'
            : 'border-neutral-200 hover:border-neutral-300 cursor-pointer'
        }
      `}
      onClick={() => !isDisabled && onSelect()}
    >
      {/* Icon and Title */}
      <div className="flex items-start gap-4 mb-3">
        <div className={`
          p-2 rounded-lg
          ${isSelected ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-600'}
        `}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-medium text-neutral-900">{title}</h3>
        </div>
        {isSelected && (
          <CheckCircle className="w-5 h-5 text-primary-600" />
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-neutral-600 mb-3 ml-11">
        {description}
      </p>

      {/* Example */}
      <div className="ml-11 p-3 bg-neutral-50 rounded-lg">
        <p className="text-xs text-neutral-500 mb-1">Beispiel:</p>
        <p className="text-sm text-neutral-700">{example}</p>
      </div>

      {/* Disabled reason */}
      {isDisabled && disabledReason && (
        <p className="mt-3 ml-11 text-xs text-amber-600">
          {disabledReason}
        </p>
      )}
    </div>
  );
};

/**
 * Gewichtung Preview Component
 */
const GewichtungPreview = ({ gewichtung, rechtsgebieteLabels }) => {
  const total = Object.values(gewichtung).reduce((sum, w) => sum + (w || 0), 0);

  return (
    <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      <p className="text-sm font-medium text-neutral-700 mb-3">
        Deine Gewichtung wird berücksichtigt:
      </p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(gewichtung).map(([rgId, weight]) => (
          <span
            key={rgId}
            className="inline-flex items-center px-3 py-1 bg-white rounded-full text-sm border border-neutral-200"
          >
            <span className="text-neutral-700">{rechtsgebieteLabels[rgId] || rgId}:</span>
            <span className="ml-1 font-medium text-primary-600">{weight}%</span>
          </span>
        ))}
      </div>
      {total !== 100 && (
        <p className="mt-2 text-xs text-amber-600">
          Hinweis: Die Gewichtung ergibt {total}% (sollte 100% sein)
        </p>
      )}
    </div>
  );
};

/**
 * Step 20 Component
 */
const Step20Verteilungsmodus = () => {
  const {
    verteilungsmodus,
    rechtsgebieteGewichtung,
    selectedRechtsgebiete,
    updateWizardData
  } = useWizard();

  // Labels for Rechtsgebiete
  const rechtsgebieteLabels = {
    'zivilrecht': 'Zivilrecht',
    'oeffentliches-recht': 'Öffentliches Recht',
    'strafrecht': 'Strafrecht',
    'querschnitt': 'Querschnittsrecht'
  };

  const handleSelectMode = (mode) => {
    updateWizardData({ verteilungsmodus: mode });
  };

  // Check if "themenweise" should show a hint
  const hasMultipleRgs = selectedRechtsgebiete.length > 1;

  return (
    <div>
      <StepHeader
        step={20}
        title="Wie sollen deine Lernblöcke verteilt werden?"
        description="Wähle, wie der Algorithmus deine Lernblöcke auf die Kalendertage verteilen soll. Die Verteilung berücksichtigt automatisch deine festgelegte Gewichtung."
      />

      {/* Gewichtung Preview */}
      {Object.keys(rechtsgebieteGewichtung).length > 0 && (
        <GewichtungPreview
          gewichtung={rechtsgebieteGewichtung}
          rechtsgebieteLabels={rechtsgebieteLabels}
        />
      )}

      {/* Options */}
      <div className="space-y-4">
        <OptionCard
          icon={Shuffle}
          title="Gemischt (Abwechslung)"
          description="Täglich unterschiedliche Rechtsgebiete für maximale Abwechslung. Ideal, um den Stoff frisch zu halten und Ermüdung zu vermeiden."
          example="Mo: Zivilrecht + ÖR, Di: Strafrecht + Zivilrecht, Mi: ÖR + Strafrecht"
          isSelected={verteilungsmodus === 'gemischt'}
          onSelect={() => handleSelectMode('gemischt')}
        />

        <OptionCard
          icon={Target}
          title="Fokussiert (Ein RG pro Tag)"
          description="Konzentriere dich täglich auf nur ein Rechtsgebiet. Gut für tiefes Eintauchen in komplexe Themen."
          example="Mo: nur Zivilrecht, Di: nur ÖR, Mi: nur Strafrecht"
          isSelected={verteilungsmodus === 'fokussiert'}
          onSelect={() => handleSelectMode('fokussiert')}
        />

        <OptionCard
          icon={BookOpen}
          title="Themenweise (Sequenziell)"
          description="Arbeite ein Thema komplett durch, bevor du zum nächsten wechselst. Perfekt für systematisches Lernen."
          example="Woche 1-2: BGB AT komplett, Woche 3-4: Schuldrecht AT"
          isSelected={verteilungsmodus === 'themenweise'}
          onSelect={() => handleSelectMode('themenweise')}
          isDisabled={false}
          disabledReason={hasMultipleRgs ? "Bei dieser Option wird automatisch ein Rechtsgebiet pro Tag verwendet." : ""}
        />
      </div>

      {/* Info about algorithm */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Hinweis:</strong> Der Algorithmus verteilt die Blöcke so, dass deine
          Gewichtung über den gesamten Lernzeitraum eingehalten wird. Du kannst das
          Ergebnis im nächsten Schritt überprüfen und bei Bedarf anpassen.
        </p>
      </div>
    </div>
  );
};

export default Step20Verteilungsmodus;
