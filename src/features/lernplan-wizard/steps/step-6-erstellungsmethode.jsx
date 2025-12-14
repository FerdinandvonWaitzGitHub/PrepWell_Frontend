import React from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 6: Erstellungsmethode wählen
 * User chooses how to create the learning plan: manual, automatic, or template
 * Based on Figma: Schritt_6_body
 */
const Step6Erstellungsmethode = () => {
  const { creationMethod, updateWizardData } = useWizard();

  const methods = [
    {
      id: 'manual',
      title: 'Manuell erstellen',
      description: 'Erstelle deinen Lernplan selbst im Kalender. Du hast volle Kontrolle über jeden Block und jedes Thema.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      features: [
        'Volle Kontrolle über jeden Tag',
        'Individuelle Themenverteilung',
        'Flexibel anpassbar',
      ],
      recommended: false,
    },
    {
      id: 'automatic',
      title: 'Automatisch erstellen',
      description: 'Lass uns deinen Lernplan automatisch generieren. Basierend auf deinen Vorgaben und bewährten Lernstrategien.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="m4.93 4.93 2.83 2.83" />
          <path d="m16.24 16.24 2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="m4.93 19.07 2.83-2.83" />
          <path d="m16.24 7.76 2.83-2.83" />
        </svg>
      ),
      features: [
        'Zeitsparend und effizient',
        'Optimale Themenverteilung',
        'Nachträglich anpassbar',
      ],
      recommended: true,
    },
    {
      id: 'template',
      title: 'Vorlage auswählen',
      description: 'Wähle aus unseren bewährten Lernplan-Vorlagen. Ideal für Examensvorbereitung und spezifische Fachgebiete.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      features: [
        'Bewährte Strukturen',
        'Sofort einsatzbereit',
        'Von Experten erstellt',
      ],
      recommended: false,
    },
  ];

  return (
    <div>
      <StepHeader
        step={6}
        title="Wie möchtest du deinen Lernplan erstellen?"
        description="Wir bieten dir folgende Optionen, um deinen Lernplan zu erstellen oder auszuwählen."
      />

      <div className="space-y-4">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => updateWizardData({ creationMethod: method.id })}
            className={`w-full p-6 rounded-xl border-2 text-left transition-all relative ${
              creationMethod === method.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {/* Recommended badge */}
            {method.recommended && (
              <span className="absolute top-4 right-4 px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                Empfohlen
              </span>
            )}

            <div className="flex gap-4">
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                creationMethod === method.id
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {method.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {method.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  {method.description}
                </p>

                {/* Features */}
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {method.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-green-500"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Selection indicator */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                creationMethod === method.id
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {creationMethod === method.id && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Step6Erstellungsmethode;
