import React from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 7 - Template Path: Select a predefined template
 * User selects from available learning plan templates
 * Based on Figma: Schritt_7_Alt_3_body
 */
const Step7Template = () => {
  const { selectedTemplate, updateWizardData } = useWizard();

  // Sample templates - in production these would come from API
  const templates = [
    {
      id: 'examen-standard',
      title: 'Examen Standard (12 Monate)',
      description: 'Klassischer Examensvorbereitungsplan mit allen drei Rechtsgebieten. Ideal für Vollzeit-Vorbereitung.',
      duration: '12 Monate',
      difficulty: 'Mittel',
      rechtsgebiete: ['Zivilrecht', 'Öffentliches Recht', 'Strafrecht'],
      highlights: [
        'Systematische Grundlagenphase',
        'Integrierte Wiederholungszyklen',
        'Klausurtraining ab Monat 6',
      ],
      popular: true,
    },
    {
      id: 'examen-intensiv',
      title: 'Examen Intensiv (6 Monate)',
      description: 'Komprimierter Vorbereitungsplan für erfahrene Lernende. Höherer Tagesaufwand.',
      duration: '6 Monate',
      difficulty: 'Hoch',
      rechtsgebiete: ['Zivilrecht', 'Öffentliches Recht', 'Strafrecht'],
      highlights: [
        'Kompakte Grundlagen',
        'Früher Klausurfokus',
        'Tägliche Wiederholung',
      ],
      popular: false,
    },
    {
      id: 'zivilrecht-fokus',
      title: 'Zivilrecht Fokus',
      description: 'Spezialisierter Plan für das Zivilrecht. Perfekt als Ergänzung oder bei Schwächen.',
      duration: '3 Monate',
      difficulty: 'Mittel',
      rechtsgebiete: ['Zivilrecht'],
      highlights: [
        'BGB AT bis SchuldR',
        'SachenR und FamErbR',
        'Klausurtechnik ZR',
      ],
      popular: false,
    },
    {
      id: 'strafrecht-fokus',
      title: 'Strafrecht Fokus',
      description: 'Spezialisierter Plan für das Strafrecht. Alle wichtigen AT- und BT-Themen.',
      duration: '2 Monate',
      difficulty: 'Mittel',
      rechtsgebiete: ['Strafrecht'],
      highlights: [
        'Aufbau und Prüfungsschemata',
        'Wichtige BT-Delikte',
        'Klausurtechnik StR',
      ],
      popular: false,
    },
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Leicht': return 'bg-green-100 text-green-700';
      case 'Mittel': return 'bg-yellow-100 text-yellow-700';
      case 'Hoch': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <StepHeader
        step={7}
        title="Wähle einen Lernplan aus."
        description="Unten siehst du unsere Auswahl an Lernplänen, die wir stets erweitern."
      />

      <div className="space-y-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => updateWizardData({ selectedTemplate: template.id })}
            className={`w-full p-6 rounded-xl border-2 text-left transition-all relative ${
              selectedTemplate === template.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {/* Popular badge */}
            {template.popular && (
              <span className="absolute top-4 right-4 px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
                Beliebt
              </span>
            )}

            <div className="flex flex-col md:flex-row md:items-start gap-4">
              {/* Main content */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 pr-20">
                  {template.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  {template.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                    {template.duration}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(template.difficulty)}`}>
                    {template.difficulty}
                  </span>
                  {template.rechtsgebiete.map((rg) => (
                    <span key={rg} className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                      {rg}
                    </span>
                  ))}
                </div>

                {/* Highlights */}
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {template.highlights.map((highlight, i) => (
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
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Selection indicator */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selectedTemplate === template.id
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {selectedTemplate === template.id && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200 flex gap-3">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-blue-600 flex-shrink-0 mt-0.5"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p className="text-sm text-blue-700">
          Die Vorlage wird an deinen Lernzeitraum und deine Wochenstruktur angepasst.
          Du kannst den Plan nach der Erstellung weiter individualisieren.
        </p>
      </div>
    </div>
  );
};

export default Step7Template;
