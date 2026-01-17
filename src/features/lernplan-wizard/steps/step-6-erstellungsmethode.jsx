import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 6: Erstellungsmethode wählen
 * User chooses how to create the learning plan: manual, automatic, AI-guided, or template
 * Based on Figma: Schritt_6_body
 */

/**
 * Check icon for selected state
 */
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/**
 * Sparkle icon for AI option
 */
const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
  </svg>
);

/**
 * Method card component matching Figma design
 */
const MethodCard = ({ method, isSelected, onSelect, disabled }) => {
  const handleClick = () => {
    if (!disabled) {
      onSelect();
    }
  };

  return (
    <div
      className={`flex-1 p-6 bg-white rounded-[10px] flex flex-col justify-between items-end min-h-[280px] transition-all ${
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : isSelected
            ? 'outline outline-2 outline-offset-[-2px] outline-neutral-900 cursor-pointer'
            : 'outline outline-1 outline-offset-[-1px] outline-neutral-200 hover:outline-neutral-300 cursor-pointer'
      }`}
      onClick={handleClick}
    >
      {/* Content section */}
      <div className="self-stretch flex justify-start items-start gap-2">
        <div className="flex-1 flex flex-col justify-start items-start gap-2.5">
          {/* Badge (if any) */}
          {method.badge && (
            <div className="h-5 flex justify-start items-center gap-2 overflow-hidden">
              <div className={`px-2 py-0.5 rounded-lg flex justify-center items-center gap-1 overflow-hidden ${method.badgeColor}`}>
                <span className="text-xs font-semibold">{method.badge}</span>
                {method.badgeIcon}
              </div>
            </div>
          )}

          {/* Title */}
          <div className="self-stretch text-neutral-900 text-lg font-light leading-5">
            {method.title}
          </div>

          {/* Description */}
          <div className="self-stretch text-neutral-500 text-sm font-light leading-5">
            {method.description}
          </div>
        </div>
      </div>

      {/* Button section */}
      <div className="flex justify-end items-center gap-2 mt-6">
        <button
          type="button"
          disabled={disabled}
          className={`px-5 py-2.5 rounded-3xl flex justify-center items-center gap-2 transition-all ${
            disabled
              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              : isSelected
                ? 'bg-neutral-900 text-white'
                : 'outline outline-1 outline-offset-[-1px] outline-neutral-300 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <span className="text-sm font-light">
            {disabled ? 'Coming Soon' : isSelected ? 'Ausgewählt' : 'Auswählen'}
          </span>
          {!disabled && <CheckIcon />}
        </button>
      </div>
    </div>
  );
};

const Step6Erstellungsmethode = () => {
  const { creationMethod, updateWizardData, isReactivation } = useWizard();

  const methods = [
    {
      id: 'calendar',
      title: 'Im Kalender erstellen',
      description: 'Du kannst deinen Lernplan direkt im Kalender erstellen. Das funktioniert genau wie in Kalendern, die du sonst kennst:\n\n• Klicke einen Tag an und bestimme das Rechtsgebiet sowie das Thema\n• Füge Aufgaben hinzu, die zum dem Thema gehören\n• Verschiebe Tage mit den zur Verfügung stehenden Funktionen\n• Wenn du fertig bist, klicke unten auf "Fertigstellen"',
      badge: null,
    },
    {
      id: 'manual',
      title: 'Als Liste erstellen & in den Kalender importieren',
      description: 'Du kannst deinen Lernplan mit unserem Lernplan-Tool erstellen. Für jedes Rechtsgebiet kannst du Unterrechtsgebiete erstellen und innerhalb der Unterrechtsgebiete Lerntage erstellen. Die Lerntage können bis zu 3 Themen beinhalten (die Anzahl an Lernblöcken, die du zuvor festgelegt hast). Jedes Thema erhält Aufgaben, die du zusätzlich als „wichtig" markieren kannst.',
      badge: null,
    },
    {
      id: 'ai',
      title: 'KI-geführte Erstellung',
      description: 'Lass unsere KI deinen optimalen Lernplan erstellen. Basierend auf deinen Vorgaben, Lernzielen und bewährten Strategien generiert die KI einen personalisierten Plan.\n\n• Intelligente Themenverteilung nach Schwierigkeitsgrad\n• Automatische Wiederholungszyklen\n• Anpassung an deinen Lerntyp\n• Kontinuierliche Optimierung',
      badge: 'Coming Soon',
      badgeColor: 'bg-neutral-400 text-white',
      badgeIcon: <SparkleIcon />,
      disabled: true,
    },
    {
      id: 'template',
      title: 'Lernplan auswählen & anpassen',
      description: 'Wähle aus verschiedenen Lernplänen von führenden Universitäten und Repetitorien einen passenden Plan aus und passe ihn später deinen Bedürfnissen an.\n\nHinweis: Die Tagesthemen aus dem gewählten Lernplan werden auf die Tage verteilt, die du im vorherigen Schritt als Lerntage definiert hast. Lernpläne stehen in unterschiedlichen Längen zur Verfügung.',
      badge: 'Empfohlen',
      badgeColor: 'bg-primary-600 text-white',
      badgeIcon: <CheckIcon />,
    },
  ];

  return (
    <div>
      <StepHeader
        step={6}
        title="Wie möchtest du deinen Lernplan erstellen?"
        description={isReactivation
          ? "Bei der Reaktivierung wird die urspruengliche Erstellungsmethode beibehalten."
          : "Wir bieten dir folgende Optionen, um deinen Lernplan zu erstellen oder auszuwählen."
        }
      />

      {/* T13: Info banner for reactivation mode */}
      {isReactivation && creationMethod && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckIcon />
            <span className="text-green-800 font-medium">
              Erstellungsmethode fixiert: {
                creationMethod === 'calendar' ? 'Im Kalender erstellen' :
                creationMethod === 'manual' ? 'Als Liste erstellen' :
                creationMethod === 'template' ? 'Lernplan auswaehlen & anpassen' :
                creationMethod
              }
            </span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            Die Methode wurde vom archivierten Lernplan uebernommen und kann nicht geaendert werden.
          </p>
        </div>
      )}

      {/* Cards grid - 2x2 on large screens, single column on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {methods.map((method) => (
          <MethodCard
            key={method.id}
            method={method}
            isSelected={creationMethod === method.id}
            onSelect={() => updateWizardData({ creationMethod: method.id })}
            // T13: Disable other methods in reactivation mode
            disabled={method.disabled || (isReactivation && creationMethod && method.id !== creationMethod)}
          />
        ))}
      </div>
    </div>
  );
};

export default Step6Erstellungsmethode;
