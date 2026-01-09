import { useState, useMemo } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import {
  CheckCircle2,
  Calendar,
  BookOpen,
  Target,
  Layers,
  Clock,
  AlertTriangle,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Archive,
  X
} from 'lucide-react';
import { RECHTSGEBIET_LABELS, RECHTSGEBIET_COLORS } from '../../../data/unterrechtsgebiete-data';

/**
 * Confirmation Dialog for archiving existing plan
 */
const ArchiveConfirmationDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-amber-100">
            <Archive className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Aktuellen Lernplan archivieren?
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Du hast bereits einen aktiven Lernplan. Wenn du fortfährst, wird dieser automatisch archiviert.
              Du kannst ihn später in den Einstellungen wiederherstellen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Archivieren & Fortfahren
              </button>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

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
/**
 * Block Assignments Summary Component
 */
const BlockAssignmentsSummary = ({ lernbloeckeDraft, selectedRechtsgebiete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate block statistics
  const stats = useMemo(() => {
    const result = {
      totalBlocks: 0,
      assignedBlocks: 0,
      perRg: {}
    };

    selectedRechtsgebiete.forEach(rgId => {
      const blocks = lernbloeckeDraft[rgId] || [];
      const assigned = blocks.filter(b =>
        (b.thema !== null && b.thema !== undefined) ||
        (Array.isArray(b.aufgaben) && b.aufgaben.length > 0)
      );

      result.totalBlocks += blocks.length;
      result.assignedBlocks += assigned.length;
      result.perRg[rgId] = {
        total: blocks.length,
        assigned: assigned.length,
        blocks: assigned
      };
    });

    return result;
  }, [lernbloeckeDraft, selectedRechtsgebiete]);

  if (stats.totalBlocks === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-neutral-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-primary-600" />
          <h4 className="text-sm font-medium text-neutral-900">Lernblöcke</h4>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-neutral-500 hover:text-neutral-700"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Summary */}
      <div className="text-sm text-neutral-600">
        <p>
          <strong>{stats.assignedBlocks}</strong> von <strong>{stats.totalBlocks}</strong> Blöcken zugewiesen
        </p>
      </div>

      {/* Per-RG breakdown */}
      {isExpanded && (
        <div className="mt-4 space-y-3">
          {selectedRechtsgebiete.map(rgId => {
            const rgStats = stats.perRg[rgId];
            if (!rgStats || rgStats.total === 0) return null;

            const colorClass = RECHTSGEBIET_COLORS[rgId] || 'bg-gray-500';
            const label = RECHTSGEBIET_LABELS[rgId] || rgId;

            return (
              <div key={rgId} className="p-3 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${colorClass}`}></span>
                  <span className="text-sm font-medium text-neutral-700">{label}</span>
                  <span className="text-xs text-neutral-500">
                    ({rgStats.assigned}/{rgStats.total} Blöcke)
                  </span>
                </div>

                {rgStats.blocks.length > 0 && (
                  <div className="pl-4 space-y-1">
                    {rgStats.blocks.map((block, idx) => {
                      const displayName = block.thema
                        ? block.thema.name
                        : block.aufgaben?.length === 1
                          ? block.aufgaben[0].name
                          : `${block.aufgaben?.length || 0} Aufgaben`;

                      return (
                        <p key={block.id || idx} className="text-xs text-neutral-600">
                          • {displayName}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
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
    lernbloeckeDraft,
    rechtsgebieteGewichtung,
    verteilungsmodus,
    completeWizard,
    isLoading,
    hasActiveLernplan
  } = useWizard();

  const [isCreating, setIsCreating] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  // Check if there's an active plan
  const hasExistingPlan = hasActiveLernplan?.() ?? false;

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

  // Count assigned blocks
  const assignedBlocksCount = useMemo(() => {
    if (!lernbloeckeDraft) return 0;
    return Object.values(lernbloeckeDraft).reduce((sum, blocks) => {
      if (!Array.isArray(blocks)) return sum;
      return sum + blocks.filter(b =>
        (b.thema !== null && b.thema !== undefined) ||
        (Array.isArray(b.aufgaben) && b.aufgaben.length > 0)
      ).length;
    }, 0);
  }, [lernbloeckeDraft]);

  const handleCreate = async () => {
    // If there's an existing plan, show confirmation dialog first
    if (hasExistingPlan) {
      setShowArchiveDialog(true);
      return;
    }
    // Otherwise, proceed directly
    await doCreate();
  };

  const doCreate = async () => {
    setShowArchiveDialog(false);
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

        {/* Block-Zuweisungen */}
        <BlockAssignmentsSummary
          lernbloeckeDraft={lernbloeckeDraft || {}}
          selectedRechtsgebiete={selectedRechtsgebiete}
        />
      </div>

      {/* Warning: Existing plan will be archived */}
      {hasExistingPlan && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex gap-3">
            <Archive className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Aktiver Lernplan vorhanden</h4>
              <p className="text-sm text-blue-700">
                Du hast bereits einen aktiven Lernplan. Dieser wird automatisch archiviert, wenn du den neuen Plan erstellst.
                Du kannst archivierte Pläne jederzeit in den Einstellungen wiederherstellen.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {totalThemes === 0 && (
        <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-amber-900">Keine Themen</h4>
              <p className="text-sm text-amber-700">
                Du hast noch keine Themen hinzugefügt. Du kannst diese später im Kalender ergänzen.
              </p>
            </div>
          </div>
        </div>
      )}

      {totalThemes > 0 && assignedBlocksCount === 0 && (
        <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-amber-900">Keine Zuweisungen</h4>
              <p className="text-sm text-amber-700">
                Du hast Themen erstellt, aber noch keine Blöcke zugewiesen. Der Kalender wird ohne vorausgefüllte Inhalte erstellt.
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

      {/* Archive Confirmation Dialog */}
      <ArchiveConfirmationDialog
        isOpen={showArchiveDialog}
        onConfirm={doCreate}
        onCancel={() => setShowArchiveDialog(false)}
      />
    </div>
  );
};

export default Step22Bestaetigung;
