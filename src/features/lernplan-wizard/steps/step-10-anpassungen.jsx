import React from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 10: Anpassungen & Finale Überprüfung
 * User reviews all settings before creating the learning plan
 * Based on Figma: Schritt_10 - Nehme, falls nötig, Anpassungen vor
 */
const Step10Anpassungen = () => {
  const {
    currentStep,
    startDate,
    endDate,
    bufferDays,
    vacationDays,
    blocksPerDay,
    weekStructure,
    creationMethod,
    selectedTemplate,
    unterrechtsgebieteOrder,
    learningDaysOrder,
    goToStep,
  } = useWizard();

  // Calculate correct step numbers based on creation method
  const getLerntagStep = () => {
    switch (creationMethod) {
      case 'template':
        return 8; // Template path: Lerntage at step 8
      case 'manual':
        return null; // Manual path doesn't have Lerntage step
      default:
        return 9; // Automatic path: Lerntage at step 9
    }
  };

  const getUnterrechtsgebieteStep = () => {
    // Only automatic path has Unterrechtsgebiete step
    return creationMethod === 'automatic' ? 8 : null;
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Get active days (days with at least one 'lernblock')
  const activeDays = Object.entries(weekStructure)
    .filter(([_, blocks]) => Array.isArray(blocks) && blocks.some(b => b === 'lernblock'))
    .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 2))
    .join(', ');

  // Get creation method label
  const getMethodLabel = () => {
    switch (creationMethod) {
      case 'manual': return 'Manuell';
      case 'automatic': return 'Automatisch';
      case 'template': return 'Vorlage';
      default: return '-';
    }
  };

  // Calculate totals
  const totalDays = startDate && endDate
    ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
    : 0;

  const sections = [
    {
      title: 'Lernzeitraum',
      step: 1,
      items: [
        { label: 'Startdatum', value: formatDate(startDate) },
        { label: 'Enddatum', value: formatDate(endDate) },
        { label: 'Gesamtdauer', value: `${totalDays} Tage` },
      ],
    },
    {
      title: 'Freie Tage',
      step: 2,
      items: [
        { label: 'Puffertage', value: `${bufferDays} Tage` },
        { label: 'Urlaubstage', value: `${vacationDays} Tage` },
      ],
    },
    {
      title: 'Tagesstruktur',
      step: 4,
      items: [
        { label: 'Blöcke pro Tag', value: `${blocksPerDay} Blöcke` },
        { label: 'Lerntage', value: activeDays || '-' },
      ],
    },
    {
      title: 'Erstellungsmethode',
      step: 6,
      items: [
        { label: 'Methode', value: getMethodLabel() },
        ...(creationMethod === 'template' && selectedTemplate
          ? [{ label: 'Vorlage', value: selectedTemplate }]
          : []),
      ],
    },
  ];

  return (
    <div>
      <StepHeader
        step={currentStep}
        title="Nehme, falls nötig, Anpassungen vor."
        description="Überprüfe deine Einstellungen. Klicke auf 'Bearbeiten', um Änderungen vorzunehmen."
      />

      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
              <h4 className="font-semibold text-neutral-900">{section.title}</h4>
              <button
                onClick={() => goToStep(section.step)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Bearbeiten
              </button>
            </div>
            <div className="p-4">
              <dl className="grid grid-cols-2 gap-3">
                {section.items.map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs text-neutral-500">{item.label}</dt>
                    <dd className="text-sm font-medium text-neutral-900">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ))}

        {/* Unterrechtsgebiete summary - only for automatic path */}
        {getUnterrechtsgebieteStep() && unterrechtsgebieteOrder.length > 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
              <h4 className="font-semibold text-neutral-900">Unterrechtsgebiete</h4>
              <button
                onClick={() => goToStep(getUnterrechtsgebieteStep())}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Bearbeiten
              </button>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {unterrechtsgebieteOrder.slice(0, 5).map((item, index) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-neutral-100 rounded text-sm"
                  >
                    <span className="text-xs text-neutral-500">{index + 1}.</span>
                    {item.name}
                  </span>
                ))}
                {unterrechtsgebieteOrder.length > 5 && (
                  <span className="text-sm text-neutral-500">
                    +{unterrechtsgebieteOrder.length - 5} weitere
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lerntage summary - for template and automatic paths */}
        {getLerntagStep() && learningDaysOrder.length > 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
              <h4 className="font-semibold text-neutral-900">Lerntage</h4>
              <button
                onClick={() => goToStep(getLerntagStep())}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Bearbeiten
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-neutral-600">
                {learningDaysOrder.length} Lerntage in benutzerdefinierter Reihenfolge
              </p>
            </div>
          </div>
        )}

        {/* Ready to create */}
        <div className="bg-green-50 rounded-xl p-4 border border-green-200 flex gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-green-600 flex-shrink-0 mt-0.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-800">
              Alles bereit!
            </p>
            <p className="text-sm text-green-700 mt-0.5">
              Klicke auf "Lernplan erstellen", um deinen personalisierten Lernplan zu generieren.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step10Anpassungen;
