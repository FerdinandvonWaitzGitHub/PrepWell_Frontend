import { useState } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import {
  CheckCircle2,
  Calendar,
  BookOpen,
  Target,
  Layers,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { RECHTSGEBIET_LABELS, RECHTSGEBIET_COLORS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 22: Finale Bestätigung
 * Summary of all settings before creating the learning plan.
 */

/**
 * Summary Card Component
 */
const SummaryCard = ({ icon: Icon, title, children }) => {
  return (
    <div className="p-4 bg-white rounded-lg border border-neutral-200">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-primary-600" />
        <h4 className="text-sm font-medium text-neutral-900">{title}</h4>
      </div>
      <div className="text-sm text-neutral-600">
        {children}
      </div>
    </div>
  );
};

/**
 * Rechtsgebiet Badge
 */
const RgBadge = ({ rgId, weight }) => {
  const colorClass = RECHTSGEBIET_COLORS[rgId] || 'bg-gray-500';
  const label = RECHTSGEBIET_LABELS[rgId] || rgId;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white ${colorClass}`}>
      {label}
      {weight && <span className="opacity-80">({weight}%)</span>}
    </span>
  );
};

/**
 * Step 22 Component
 */
const Step22Bestaetigung = () => {
  const {
    startDate,
    endDate,
    bufferDays,
    vacationDays,
    blocksPerDay,
    weekStructure,
    selectedRechtsgebiete,
    unterrechtsgebieteDraft,
    themenDraft,
    rechtsgebieteGewichtung,
    verteilungsmodus,
    completeWizard,
    isLoading
  } = useWizard();

  const [isCreating, setIsCreating] = useState(false);

  // Format dates
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calculate learning days
  const getLearningDaysPerWeek = () => {
    if (!weekStructure) return 0;
    return Object.values(weekStructure).filter(blocks =>
      Array.isArray(blocks) && blocks.some(b => b === 'lernblock')
    ).length;
  };

  // Count total URGs
  const totalUrgs = Object.values(unterrechtsgebieteDraft)
    .reduce((sum, urgs) => sum + (urgs?.length || 0), 0);

  // Count total themes
  const totalThemes = Object.values(themenDraft)
    .reduce((sum, themes) => sum + (themes?.length || 0), 0);

  // Verteilungsmodus label
  const verteilungsmodusLabels = {
    'gemischt': 'Gemischt (Abwechslung)',
    'fokussiert': 'Fokussiert (Ein RG pro Tag)',
    'themenweise': 'Themenweise (Sequenziell)'
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await completeWizard();
    } catch (error) {
      console.error('Error creating learning plan:', error);
      setIsCreating(false);
    }
  };

  return (
    <div>
      <StepHeader
        step={22}
        title="Zusammenfassung"
        description="Überprüfe deine Einstellungen bevor du deinen Lernplan erstellst."
      />

      {/* Success Icon */}
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-full bg-green-100">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {/* Lernzeitraum */}
        <SummaryCard icon={Calendar} title="Lernzeitraum">
          <p><strong>Start:</strong> {formatDate(startDate)}</p>
          <p><strong>Ende:</strong> {formatDate(endDate)}</p>
          <p className="mt-2">
            <span className="text-neutral-500">{bufferDays} Puffertage</span>
            <span className="mx-2">•</span>
            <span className="text-neutral-500">{vacationDays} Urlaubstage</span>
          </p>
        </SummaryCard>

        {/* Wochenstruktur */}
        <SummaryCard icon={Clock} title="Wochenstruktur">
          <p><strong>{blocksPerDay}</strong> Blöcke pro Tag</p>
          <p><strong>{getLearningDaysPerWeek()}</strong> Lerntage pro Woche</p>
        </SummaryCard>

        {/* Rechtsgebiete */}
        <SummaryCard icon={BookOpen} title="Rechtsgebiete">
          <div className="flex flex-wrap gap-2">
            {selectedRechtsgebiete.map(rgId => (
              <RgBadge
                key={rgId}
                rgId={rgId}
                weight={rechtsgebieteGewichtung[rgId]}
              />
            ))}
          </div>
        </SummaryCard>

        {/* Inhalte */}
        <SummaryCard icon={Layers} title="Inhalte">
          <p><strong>{totalUrgs}</strong> Unterrechtsgebiete</p>
          <p><strong>{totalThemes}</strong> Themen</p>
        </SummaryCard>

        {/* Verteilung */}
        <SummaryCard icon={Target} title="Verteilung">
          <p>{verteilungsmodusLabels[verteilungsmodus] || 'Nicht festgelegt'}</p>
        </SummaryCard>
      </div>

      {/* Warnings */}
      {totalThemes === 0 && (
        <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-amber-900">Hinweis</h4>
              <p className="text-sm text-amber-700">
                Du hast noch keine Themen hinzugefügt. Du kannst diese später im Kalender ergänzen.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Button */}
      <div className="mt-8">
        <button
          onClick={handleCreate}
          disabled={isCreating || isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating || isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Lernplan wird erstellt...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Lernplan erstellen
            </>
          )}
        </button>

        <p className="mt-3 text-center text-sm text-neutral-500">
          Du kannst deinen Lernplan jederzeit im Kalender anpassen.
        </p>
      </div>
    </div>
  );
};

export default Step22Bestaetigung;
