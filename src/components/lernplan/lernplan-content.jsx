import { useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentPlanEditCard from './content-plan-edit-card';
import CalendarPlanEditCard from './calendar-plan-edit-card';
import { Button, PlusIcon } from '../ui';
import { useCalendar } from '../../contexts/calendar-context';
import { X, Calendar, AlertCircle } from 'lucide-react';

/**
 * LernplanContent component
 * Main content area for learning plans overview
 * Uses CalendarContext for all data (contentPlans)
 *
 * New hierarchical structure:
 * Plan → Rechtsgebiete → Unterrechtsgebiete → Kapitel → Themen → Aufgaben
 */
const LernplanContent = forwardRef(({ className = '' }, ref) => {
  const navigate = useNavigate();
  const [expandedIds, setExpandedIds] = useState(new Set());
  // BUG-P2 FIX: Removed viewMode state - dropdown was confusing and unnecessary
  const [showArchived, setShowArchived] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newPlanId, setNewPlanId] = useState(null);

  // T13: Reactivation dialog state
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [reactivatePlan, setReactivatePlan] = useState(null);
  const [reactivateStartDate, setReactivateStartDate] = useState('');
  const [reactivateEndDate, setReactivateEndDate] = useState('');
  const [reactivateError, setReactivateError] = useState(null);

  // Get data from CalendarContext
  const {
    // Calendar-based Lernplan (from wizard)
    archivedLernplaene: archivedCalendarPlans,
    restoreArchivedPlan,
    deleteArchivedPlan,
    lernplanMetadata: activeCalendarPlan,
    updateLernplanMetadata,
    archiveCurrentPlan,
    deleteCurrentPlan,
    blocksByDate,
    // New Content Plans (Lernpläne & Themenlisten)
    contentPlans,
    createContentPlan,
    archiveContentPlan, // T5.4: Archive function
    deleteContentPlan,  // T5.4: Delete function
  } = useCalendar();

  // State for editing calendar plan name
  const [isEditingCalendarPlanName, setIsEditingCalendarPlanName] = useState(false);
  const [calendarPlanName, setCalendarPlanName] = useState('');

  // State for calendar plan card expansion
  const [isCalendarPlanExpanded, setIsCalendarPlanExpanded] = useState(false);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    openCreateDialog: () => {
      handleCreateNew('lernplan');
    },
    openCreateThemenlisteDialog: () => {
      handleCreateNew('themenliste');
    },
  }));

  // Filter content plans
  // BUG-P2 FIX: Removed viewMode filter - show all plans regardless of mode
  const { filteredLernplaene, filteredThemenlisten } = useMemo(() => {
    let plans = contentPlans || [];

    // Filter by archived status only
    plans = plans.filter(p => p.archived === showArchived);

    // Separate by type
    const lernplaeneOnly = plans.filter(p => p.type === 'lernplan');
    const themenlistenOnly = plans.filter(p => p.type === 'themenliste');

    return { filteredLernplaene: lernplaeneOnly, filteredThemenlisten: themenlistenOnly };
  }, [contentPlans, showArchived]);

  // T5.3 FIX: Track manually collapsed items to allow collapsing even with auto-expand
  const [manuallyCollapsed, setManuallyCollapsed] = useState(new Set());

  // Toggle expand - T5.3 FIX: Also track manual collapses
  const handleToggleExpand = (id) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        // T5.3: Track that user manually collapsed this item
        setManuallyCollapsed(prevCollapsed => new Set([...prevCollapsed, id]));
      } else {
        newSet.add(id);
        // T5.3: Remove from manually collapsed when expanding
        setManuallyCollapsed(prevCollapsed => {
          const newCollapsed = new Set(prevCollapsed);
          newCollapsed.delete(id);
          return newCollapsed;
        });
      }
      return newSet;
    });
  };

  // T5.3 FIX: Helper to check if item should be expanded
  // Auto-expand single items UNLESS user has manually collapsed them
  const shouldBeExpanded = (planId) => {
    // If user manually collapsed, respect that
    if (manuallyCollapsed.has(planId)) {
      return false;
    }
    // Auto-expand if only one Themenliste or Lernplan
    const isOnlyThemenliste = filteredThemenlisten.length === 1 && filteredThemenlisten[0]?.id === planId;
    const isOnlyLernplan = filteredLernplaene.length === 1 && filteredLernplaene[0]?.id === planId;
    if (isOnlyThemenliste || isOnlyLernplan) {
      return true;
    }
    // Otherwise use expandedIds
    return expandedIds.has(planId);
  };

  // Create new content plan
  // T22: For Themenliste, navigate to the new editor page
  const handleCreateNew = (type = 'lernplan') => {
    if (type === 'themenliste') {
      // Navigate to new Themenliste editor page
      navigate('/lernplan/themenliste/neu');
    } else {
      const newPlan = createContentPlan({ type, name: '' });
      setExpandedIds(prev => new Set([...prev, newPlan.id]));
      setNewPlanId(newPlan.id);
      setIsEditMode(true);
    }
  };

  // Calendar Plan handlers
  const handleStartEditCalendarPlanName = () => {
    setCalendarPlanName(activeCalendarPlan?.name || '');
    setIsEditingCalendarPlanName(true);
  };

  const handleSaveCalendarPlanName = () => {
    if (calendarPlanName.trim()) {
      updateLernplanMetadata({ name: calendarPlanName.trim() });
    }
    setIsEditingCalendarPlanName(false);
  };

  const handleCancelEditCalendarPlanName = () => {
    setIsEditingCalendarPlanName(false);
    setCalendarPlanName(activeCalendarPlan?.name || '');
  };

  const handleArchiveCalendarPlan = () => {
    if (confirm('Möchtest du diesen Kalender-Lernplan archivieren?')) {
      archiveCurrentPlan();
    }
  };

  const handleDeleteCalendarPlan = () => {
    if (confirm('Möchtest du diesen Kalender-Lernplan dauerhaft löschen? Dies kann nicht rückgängig gemacht werden.')) {
      deleteCurrentPlan();
    }
  };

  // T13: Reactivation handlers
  const handleOpenReactivateDialog = (plan) => {
    setReactivatePlan(plan);
    setReactivateStartDate('');
    setReactivateEndDate('');
    setReactivateError(null);
    setShowReactivateDialog(true);
  };

  const handleCloseReactivateDialog = () => {
    setShowReactivateDialog(false);
    setReactivatePlan(null);
    setReactivateStartDate('');
    setReactivateEndDate('');
    setReactivateError(null);
  };

  const handleReactivate = () => {
    if (!reactivatePlan || !reactivateStartDate || !reactivateEndDate) {
      setReactivateError('Bitte gib Start- und Enddatum ein.');
      return;
    }

    const start = new Date(reactivateStartDate);
    const end = new Date(reactivateEndDate);

    if (end <= start) {
      setReactivateError('Das Enddatum muss nach dem Startdatum liegen.');
      return;
    }

    // Calculate available days
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const wizardSettings = reactivatePlan.wizardSettings || {};
    const pufferTage = wizardSettings.pufferTage || 0;
    const urlaubsTage = wizardSettings.urlaubsTage || 0;
    const blocksPerDay = wizardSettings.blocksPerDay || 3;

    // Count themes/content from archived plan
    const themenCount = (reactivatePlan.themen?.length || 0) + (reactivatePlan.completedThemen?.length || 0);

    // Simple validation: do we have enough days?
    const requiredDays = Math.ceil(themenCount / blocksPerDay) + pufferTage + urlaubsTage;

    if (totalDays < requiredDays) {
      // Not enough days - navigate to wizard with prefill
      setReactivateError(`Zeitraum zu kurz (${totalDays} Tage verfuegbar, ${requiredDays} benoetigt). Klicke "Im Wizard anpassen" um die Einstellungen anzupassen.`);
      return;
    }

    // Enough days - navigate to wizard with prefill and new dates
    navigateToWizardWithPrefill();
  };

  const navigateToWizardWithPrefill = () => {
    if (!reactivatePlan) return;

    // Build prefill data from archived plan
    const wizardSettings = reactivatePlan.wizardSettings || {};

    const prefillData = {
      // New dates from dialog
      startDate: reactivateStartDate,
      endDate: reactivateEndDate,
      // Preserved settings
      creationMethod: wizardSettings.creationMethod || 'manual',
      blocksPerDay: wizardSettings.blocksPerDay || 3,
      bufferDays: wizardSettings.pufferTage || 0,
      vacationDays: wizardSettings.urlaubsTage || 0,
      weekStructure: wizardSettings.weekStructure,
      selectedRechtsgebiete: wizardSettings.selectedRechtsgebiete || [],
      rechtsgebieteGewichtung: wizardSettings.rechtsgebieteGewichtung || {},
      verteilungsmodus: wizardSettings.verteilungsmodus || 'gemischt',
      templateId: wizardSettings.templateId,
      // Flag for wizard to know this is a reactivation
      isReactivation: true,
      reactivationPlanId: reactivatePlan.id,
    };

    handleCloseReactivateDialog();

    // Navigate to wizard with prefill state
    navigate('/lernplan/wizard', {
      state: {
        prefillData,
        from: '/lernplan',
      }
    });
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-4">
        {/* Left: Aktiv/Archiv Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(false)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              !showArchived
                ? 'bg-neutral-900 text-neutral-50'
                : 'text-neutral-500 hover:bg-neutral-100'
            }`}
          >
            Aktiv
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              showArchived
                ? 'bg-neutral-900 text-neutral-50'
                : 'text-neutral-500 hover:bg-neutral-100'
            }`}
          >
            Archiv
          </button>
        </div>

        {/* Right: Edit Toggle */}
        {/* BUG-P2 FIX: Removed Mode Dropdown - was confusing and unnecessary */}
        <div className="flex items-center gap-3">
          {/* Edit Mode Toggle */}
          <div className="flex items-center bg-neutral-100 rounded-lg p-0.5">
            <button
              onClick={() => setIsEditMode(false)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                !isEditMode
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Ansicht
            </button>
            <button
              onClick={() => setIsEditMode(true)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                isEditMode
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Bearbeiten
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Archived Calendar Plans (only in archive view) */}
        {showArchived && archivedCalendarPlans && archivedCalendarPlans.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Kalender-Lernpläne</h3>
            <div className="flex flex-col gap-3">
              {archivedCalendarPlans.map((plan) => (
                <div key={plan.id} className="bg-white rounded border border-neutral-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-2xl font-extralight text-neutral-950">
                        {plan.metadata?.name || 'Lernplan'}
                      </h4>
                      <p className="text-sm text-neutral-500 mt-1">
                        {plan.metadata?.startDate && plan.metadata?.endDate ? (
                          <>
                            {new Date(plan.metadata.startDate).toLocaleDateString('de-DE')} -{' '}
                            {new Date(plan.metadata.endDate).toLocaleDateString('de-DE')}
                          </>
                        ) : 'Keine Datumsangabe'}
                      </p>
                      {plan.metadata?.archivedAt && (
                        <p className="text-xs text-neutral-400 mt-1">
                          Archiviert am {new Date(plan.metadata.archivedAt).toLocaleDateString('de-DE')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* T13: Reaktivieren Button - only if wizardSettings exist */}
                      {plan.wizardSettings && (
                        <button
                          onClick={() => handleOpenReactivateDialog(plan)}
                          className="px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors font-medium"
                        >
                          Reaktivieren
                        </button>
                      )}
                      <button
                        onClick={() => restoreArchivedPlan(plan.id)}
                        className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        Wiederherstellen
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Möchtest du diesen Lernplan dauerhaft löschen?')) {
                            deleteArchivedPlan(plan.id);
                          }
                        }}
                        className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-neutral-100 rounded-md text-xs font-medium text-neutral-900">
                      {Object.keys(plan.blocks || {}).length} Tage
                    </span>
                    {plan.metadata?.blocksPerDay && (
                      <span className="px-2 py-0.5 bg-neutral-100 rounded-md text-xs font-medium text-neutral-900">
                        {plan.metadata.blocksPerDay} Blöcke/Tag
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Calendar Plan (only in active view) */}
        {!showArchived && activeCalendarPlan && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Aktiver Kalender-Lernplan</h3>

            {/* Edit Mode: Hierarchical Edit Card */}
            {isEditMode ? (
              <CalendarPlanEditCard
                isExpanded={isCalendarPlanExpanded}
                onToggleExpand={() => setIsCalendarPlanExpanded(!isCalendarPlanExpanded)}
                onSave={() => {}}
                onCancel={() => setIsEditMode(false)}
              />
            ) : (
              /* View Mode: Clean Summary Card */
              <div className="rounded border border-neutral-200 bg-white overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {isEditingCalendarPlanName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={calendarPlanName}
                            onChange={(e) => setCalendarPlanName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                            placeholder="Lernplan Name"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveCalendarPlanName();
                              if (e.key === 'Escape') handleCancelEditCalendarPlanName();
                            }}
                          />
                          <button
                            onClick={handleSaveCalendarPlanName}
                            className="px-2 py-1 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                          >
                            Speichern
                          </button>
                          <button
                            onClick={handleCancelEditCalendarPlanName}
                            className="px-2 py-1 text-sm text-neutral-600 hover:text-neutral-800"
                          >
                            Abbrechen
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="text-2xl font-extralight text-neutral-950">
                            {activeCalendarPlan.name || 'Lernplan'}
                          </h4>
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-neutral-900 text-neutral-50">
                            Aktiv
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-neutral-500 mt-1">
                        {activeCalendarPlan.startDate && activeCalendarPlan.endDate ? (
                          <>
                            {new Date(activeCalendarPlan.startDate).toLocaleDateString('de-DE')} -{' '}
                            {new Date(activeCalendarPlan.endDate).toLocaleDateString('de-DE')}
                          </>
                        ) : 'Keine Datumsangabe'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleStartEditCalendarPlanName}
                        className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Name bearbeiten"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={handleArchiveCalendarPlan}
                        className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Archivieren"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="21 8 21 21 3 21 3 8" />
                          <rect x="1" y="3" width="22" height="5" />
                          <line x1="10" y1="12" x2="14" y2="12" />
                        </svg>
                      </button>
                      <button
                        onClick={handleDeleteCalendarPlan}
                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Löschen"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {Object.keys(blocksByDate || {}).length} Tage
                    </span>
                    {activeCalendarPlan.blocksPerDay && (
                      <span className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        {activeCalendarPlan.blocksPerDay} Blöcke/Tag
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Themenlisten Section */}
        {filteredThemenlisten.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Themenlisten</h3>
            <div className="flex flex-col gap-3">
              {filteredThemenlisten.map((plan) => (
                <ContentPlanEditCard
                  key={plan.id}
                  plan={plan}
                  isExpanded={shouldBeExpanded(plan.id)}
                  onToggleExpand={handleToggleExpand}
                  isNew={newPlanId === plan.id}
                  viewMode={!isEditMode}
                  onArchive={archiveContentPlan}
                  onDelete={deleteContentPlan}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lernpläne Section */}
        {filteredLernplaene.length > 0 && (
          <>
            {(showArchived && archivedCalendarPlans?.length > 0) ||
             (!showArchived && activeCalendarPlan) ||
             filteredThemenlisten.length > 0 ? (
              <h3 className="text-sm font-medium text-neutral-700 mb-3">Lernpläne</h3>
            ) : null}
            <div className="flex flex-col gap-3">
              {filteredLernplaene.map((plan) => (
                <ContentPlanEditCard
                  key={plan.id}
                  plan={plan}
                  isExpanded={shouldBeExpanded(plan.id)}
                  onToggleExpand={handleToggleExpand}
                  isNew={newPlanId === plan.id}
                  viewMode={!isEditMode}
                  onArchive={archiveContentPlan}
                  onDelete={deleteContentPlan}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {filteredLernplaene.length === 0 &&
         filteredThemenlisten.length === 0 &&
         (!showArchived || !archivedCalendarPlans?.length) &&
         (!activeCalendarPlan || showArchived) && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {showArchived ? 'Keine archivierten Einträge' : 'Noch keine Lernpläne oder Themenlisten'}
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              {showArchived
                ? 'Du hast noch keine Einträge archiviert.'
                : 'Erstelle deinen ersten Lernplan oder eine Themenliste, um loszulegen.'}
            </p>
          </div>
        )}
      </div>

      {/* T13: Reactivation Dialog */}
      {showReactivateDialog && reactivatePlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Lernplan reaktivieren</h3>
                  <p className="text-sm text-neutral-500">{reactivatePlan.name || 'Archivierter Lernplan'}</p>
                </div>
              </div>
              <button
                onClick={handleCloseReactivateDialog}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-neutral-600 text-sm mb-4">
                Gib einen neuen Zeitraum fuer deinen Lernplan ein. Die Einstellungen (Bloecke/Tag, Puffer, Urlaub) werden uebernommen.
              </p>

              {/* Date inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Startdatum</label>
                  <input
                    type="date"
                    value={reactivateStartDate}
                    onChange={(e) => setReactivateStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Enddatum</label>
                  <input
                    type="date"
                    value={reactivateEndDate}
                    onChange={(e) => setReactivateEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Saved settings info */}
              {reactivatePlan.wizardSettings && (
                <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs font-medium text-neutral-600 mb-2">Gespeicherte Einstellungen:</p>
                  <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                    <span className="px-2 py-0.5 bg-white rounded border border-neutral-200">
                      {reactivatePlan.wizardSettings.blocksPerDay || 3} Bloecke/Tag
                    </span>
                    <span className="px-2 py-0.5 bg-white rounded border border-neutral-200">
                      {reactivatePlan.wizardSettings.pufferTage || 0} Puffertage
                    </span>
                    <span className="px-2 py-0.5 bg-white rounded border border-neutral-200">
                      {reactivatePlan.wizardSettings.urlaubsTage || 0} Urlaubstage
                    </span>
                  </div>
                </div>
              )}

              {/* Error message */}
              {reactivateError && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700">{reactivateError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseReactivateDialog}
                className="flex-1 px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50"
              >
                Abbrechen
              </button>
              {reactivateError ? (
                <button
                  onClick={navigateToWizardWithPrefill}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                >
                  Im Wizard anpassen
                </button>
              ) : (
                <button
                  onClick={handleReactivate}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Pruefen & Reaktivieren
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

LernplanContent.displayName = 'LernplanContent';

export default LernplanContent;
