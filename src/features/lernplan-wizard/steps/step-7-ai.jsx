import React from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 7: KI-geführte Lernplan Erstellung
 * User configures AI parameters for automated plan generation
 */

/**
 * Sparkle Icon for AI branding
 */
const SparkleIcon = ({ className = '' }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z" />
    <path d="M19 5l.5 1.5L21 7l-1.5.5L19 9l-.5-1.5L17 7l1.5-.5L19 5z" />
  </svg>
);

/**
 * Check Icon
 */
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/**
 * Exam type options
 */
const EXAM_TYPES = [
  { id: 'staatsexamen', label: 'Staatsexamen', description: 'Umfassende Vorbereitung auf das erste oder zweite Staatsexamen' },
  { id: 'klausur', label: 'Semesterklausur', description: 'Fokussierte Vorbereitung auf eine spezifische Klausur' },
  { id: 'muendlich', label: 'Mündliche Prüfung', description: 'Vorbereitung auf mündliche Prüfungen mit Schwerpunkt auf Diskussion' },
];

/**
 * Difficulty levels
 */
const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'Entspannt', description: 'Mehr Zeit pro Thema, weniger Stoff pro Tag' },
  { id: 'medium', label: 'Ausgewogen', description: 'Optimale Balance zwischen Tiefe und Fortschritt' },
  { id: 'hard', label: 'Intensiv', description: 'Maximaler Fortschritt, höhere tägliche Anforderungen' },
];

/**
 * Focus areas (Rechtsgebiete)
 */
const FOCUS_AREAS = [
  { id: 'zivilrecht', label: 'Zivilrecht', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'strafrecht', label: 'Strafrecht', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'oeffentlichesrecht', label: 'Öffentliches Recht', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'europarecht', label: 'Europarecht', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'arbeitsrecht', label: 'Arbeitsrecht', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'handelsrecht', label: 'Handels- & Gesellschaftsrecht', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
];

/**
 * Selection card component
 */
const SelectionCard = ({ item, isSelected, onSelect, showDescription = true }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
      isSelected
        ? 'border-purple-500 bg-purple-50'
        : 'border-neutral-200 bg-white hover:border-neutral-300'
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <h4 className="font-medium text-neutral-900">{item.label}</h4>
        {showDescription && item.description && (
          <p className="text-sm text-neutral-500 mt-1">{item.description}</p>
        )}
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        isSelected
          ? 'border-purple-500 bg-purple-500'
          : 'border-neutral-300'
      }`}>
        {isSelected && (
          <CheckIcon />
        )}
      </div>
    </div>
  </button>
);

/**
 * Toggle chip for focus areas
 */
const ToggleChip = ({ item, isSelected, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`px-4 py-2 rounded-full border transition-all ${
      isSelected
        ? item.color + ' border-current'
        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-300'
    }`}
  >
    <span className="text-sm font-medium">{item.label}</span>
  </button>
);

const Step7AI = () => {
  const { aiSettings, updateWizardData } = useWizard();

  const updateAISettings = (updates) => {
    updateWizardData({
      aiSettings: { ...aiSettings, ...updates },
    });
  };

  const toggleFocusArea = (areaId) => {
    const currentAreas = aiSettings.focusAreas || [];
    const newAreas = currentAreas.includes(areaId)
      ? currentAreas.filter(id => id !== areaId)
      : [...currentAreas, areaId];
    updateAISettings({ focusAreas: newAreas });
  };

  return (
    <div>
      <StepHeader
        step={7}
        title="Konfiguriere deine KI-Unterstützung."
        description="Die KI erstellt basierend auf deinen Angaben einen optimierten Lernplan. Je mehr Informationen du angibst, desto besser wird das Ergebnis."
      />

      <div className="space-y-8">
        {/* AI Info Banner */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <SparkleIcon className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">KI-gestützte Planung</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Unsere KI analysiert deine Vorgaben und erstellt einen personalisierten Lernplan mit
                optimaler Themenverteilung, intelligenten Wiederholungszyklen und angepasstem Schwierigkeitsgrad.
              </p>
            </div>
          </div>
        </div>

        {/* Exam Type Selection */}
        <div>
          <h3 className="text-lg font-medium text-neutral-900 mb-4">
            Welche Prüfung bereitest du vor?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {EXAM_TYPES.map((examType) => (
              <SelectionCard
                key={examType.id}
                item={examType}
                isSelected={aiSettings.examType === examType.id}
                onSelect={() => updateAISettings({ examType: examType.id })}
              />
            ))}
          </div>
        </div>

        {/* Focus Areas */}
        <div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Auf welche Rechtsgebiete möchtest du dich konzentrieren?
          </h3>
          <p className="text-sm text-neutral-500 mb-4">
            Wähle die Gebiete aus, die in deinem Lernplan priorisiert werden sollen.
          </p>
          <div className="flex flex-wrap gap-3">
            {FOCUS_AREAS.map((area) => (
              <ToggleChip
                key={area.id}
                item={area}
                isSelected={(aiSettings.focusAreas || []).includes(area.id)}
                onToggle={() => toggleFocusArea(area.id)}
              />
            ))}
          </div>
        </div>

        {/* Difficulty Level */}
        <div>
          <h3 className="text-lg font-medium text-neutral-900 mb-4">
            Wie intensiv soll dein Lernplan sein?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DIFFICULTY_LEVELS.map((level) => (
              <SelectionCard
                key={level.id}
                item={level}
                isSelected={aiSettings.difficulty === level.id}
                onSelect={() => updateAISettings({ difficulty: level.id })}
              />
            ))}
          </div>
        </div>

        {/* Repetition Toggle */}
        <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="font-medium text-neutral-900">Wiederholungen einplanen</h4>
              <p className="text-sm text-neutral-500 mt-1">
                Die KI plant automatisch Wiederholungstage ein, um das Gelernte zu festigen.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateAISettings({ includeRepetition: !aiSettings.includeRepetition })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                aiSettings.includeRepetition ? 'bg-purple-600' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  aiSettings.includeRepetition ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Preview Info */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 flex gap-3">
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
            Im nächsten Schritt kannst du den von der KI generierten Lernplan überprüfen und anpassen,
            bevor er endgültig erstellt wird.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step7AI;
