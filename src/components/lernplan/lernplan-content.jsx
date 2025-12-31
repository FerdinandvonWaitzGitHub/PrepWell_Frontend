import { useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import LernplanCard from './lernplan-card';
import ContentPlanEditCard from './content-plan-edit-card';
import { Button, PlusIcon } from '../ui';
import { ChevronDownIcon } from '../ui';
import { useCalendar } from '../../contexts/calendar-context';

/**
 * LernplanContent component
 * Main content area for learning plans overview
 * Uses CalendarContext for all data (contentPlans)
 *
 * New hierarchical structure:
 * Plan → Rechtsgebiete → Unterrechtsgebiete → Kapitel → Themen → Aufgaben
 */
const LernplanContent = forwardRef(({ className = '' }, ref) => {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [viewMode, setViewMode] = useState('all'); // 'standard', 'examen', 'all'
  const [showArchived, setShowArchived] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newPlanId, setNewPlanId] = useState(null);

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
    slotsByDate,
    // New Content Plans (Lernpläne & Themenlisten)
    contentPlans,
    createContentPlan,
    getContentPlansByType,
  } = useCalendar();

  // State for editing calendar plan name
  const [isEditingCalendarPlanName, setIsEditingCalendarPlanName] = useState(false);
  const [calendarPlanName, setCalendarPlanName] = useState('');

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
  const { filteredLernplaene, filteredThemenlisten } = useMemo(() => {
    let plans = contentPlans || [];

    // Filter by archived status
    plans = plans.filter(p => p.archived === showArchived);

    // Filter by mode (for Lernpläne)
    if (viewMode !== 'all') {
      plans = plans.filter(p => p.type === 'themenliste' || p.mode === viewMode);
    }

    // Separate by type
    const lernplaeneOnly = plans.filter(p => p.type === 'lernplan');
    const themenlistenOnly = plans.filter(p => p.type === 'themenliste');

    return { filteredLernplaene: lernplaeneOnly, filteredThemenlisten: themenlistenOnly };
  }, [contentPlans, viewMode, showArchived]);

  // Auto-expand if only one plan
  const shouldAutoExpand = filteredLernplaene.length === 1 || filteredThemenlisten.length === 1;

  // Toggle expand
  const handleToggleExpand = (id) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Create new content plan
  const handleCreateNew = (type = 'lernplan') => {
    const newPlan = createContentPlan({ type, name: '' });
    setExpandedIds(prev => new Set([...prev, newPlan.id]));
    setNewPlanId(newPlan.id);
    setIsEditMode(true);
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

  // Calculate progress for old-style plans (for LernplanCard)
  const calculateLegacyProgress = (plan) => {
    let completed = 0;
    let total = 0;
    plan.rechtsgebiete?.forEach(rg => {
      rg.unterrechtsgebiete?.forEach(urg => {
        urg.kapitel?.forEach(k => {
          k.themen?.forEach(t => {
            t.aufgaben?.forEach(a => {
              total++;
              if (a.completed) completed++;
            });
          });
        });
      });
    });
    return { completed, total };
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-4">
        {/* Left: Aktiv/Archiv Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(false)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              !showArchived
                ? 'bg-primary-100 text-primary-700'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Aktiv
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              showArchived
                ? 'bg-primary-100 text-primary-700'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Archiv
          </button>
        </div>

        {/* Right: Mode Dropdown + Edit Toggle */}
        <div className="flex items-center gap-3">
          {/* Mode Dropdown */}
          <div className="relative">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="appearance-none px-3 py-1.5 pr-8 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white cursor-pointer"
            >
              <option value="all">Alle Modi</option>
              <option value="standard">Standard</option>
              <option value="examen">Examen</option>
            </select>
            <ChevronDownIcon
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500"
            />
          </div>

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
                <div key={plan.id} className="bg-white rounded-lg border border-neutral-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-neutral-900">
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
                  <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                    <span className="px-2 py-0.5 bg-neutral-100 rounded">
                      {Object.keys(plan.slots || {}).length} Tage
                    </span>
                    {plan.metadata?.blocksPerDay && (
                      <span className="px-2 py-0.5 bg-neutral-100 rounded">
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
            <div className={`rounded-lg border p-4 ${isEditMode ? 'bg-white border-neutral-200' : 'bg-primary-50 border-primary-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isEditMode && isEditingCalendarPlanName ? (
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
                      <h4 className="font-medium text-neutral-900">
                        {activeCalendarPlan.name || 'Lernplan'}
                      </h4>
                      {isEditMode && (
                        <button
                          onClick={handleStartEditCalendarPlanName}
                          className="p-1 text-neutral-400 hover:text-neutral-600"
                          title="Name bearbeiten"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-neutral-600 mt-1">
                    {activeCalendarPlan.startDate && activeCalendarPlan.endDate ? (
                      <>
                        {new Date(activeCalendarPlan.startDate).toLocaleDateString('de-DE')} -{' '}
                        {new Date(activeCalendarPlan.endDate).toLocaleDateString('de-DE')}
                      </>
                    ) : 'Keine Datumsangabe'}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                    <span className="px-2 py-0.5 bg-neutral-100 rounded">
                      {Object.keys(slotsByDate || {}).length} Tage
                    </span>
                    {activeCalendarPlan.blocksPerDay && (
                      <span className="px-2 py-0.5 bg-neutral-100 rounded">
                        {activeCalendarPlan.blocksPerDay} Blöcke/Tag
                      </span>
                    )}
                    {activeCalendarPlan.creationMethod && (
                      <span className="px-2 py-0.5 bg-neutral-100 rounded">
                        {activeCalendarPlan.creationMethod === 'manual' ? 'Manuell' :
                         activeCalendarPlan.creationMethod === 'automatic' ? 'Automatisch' :
                         activeCalendarPlan.creationMethod === 'template' ? 'Vorlage' :
                         activeCalendarPlan.creationMethod === 'ai' ? 'KI' : activeCalendarPlan.creationMethod}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/kalender/monat"
                    className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
                  >
                    Im Kalender ansehen
                  </a>
                  {isEditMode && (
                    <>
                      <button
                        onClick={handleArchiveCalendarPlan}
                        className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Archivieren"
                      >
                        Archivieren
                      </button>
                      <button
                        onClick={handleDeleteCalendarPlan}
                        className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Löschen"
                      >
                        Löschen
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Themenlisten Section */}
        {filteredThemenlisten.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Themenlisten</h3>
            <div className="flex flex-col gap-3">
              {filteredThemenlisten.map((plan) => (
                isEditMode ? (
                  <ContentPlanEditCard
                    key={plan.id}
                    plan={plan}
                    isExpanded={shouldAutoExpand || expandedIds.has(plan.id)}
                    onToggleExpand={handleToggleExpand}
                    isNew={newPlanId === plan.id}
                  />
                ) : (
                  <LernplanCard
                    key={plan.id}
                    lernplan={convertToLegacyFormat(plan)}
                    isExpanded={shouldAutoExpand || expandedIds.has(plan.id)}
                    onToggleExpand={handleToggleExpand}
                  />
                )
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
                isEditMode ? (
                  <ContentPlanEditCard
                    key={plan.id}
                    plan={plan}
                    isExpanded={shouldAutoExpand || expandedIds.has(plan.id)}
                    onToggleExpand={handleToggleExpand}
                    isNew={newPlanId === plan.id}
                  />
                ) : (
                  <LernplanCard
                    key={plan.id}
                    lernplan={convertToLegacyFormat(plan)}
                    isExpanded={shouldAutoExpand || expandedIds.has(plan.id)}
                    onToggleExpand={handleToggleExpand}
                  />
                )
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
            {!showArchived && (
              <Button onClick={() => handleCreateNew('lernplan')} className="flex items-center gap-2">
                <PlusIcon size={14} />
                Ersten Lernplan erstellen
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Convert new hierarchical format to legacy format for LernplanCard
 * This is a temporary adapter until LernplanCard is updated
 */
const convertToLegacyFormat = (plan) => {
  // Calculate progress
  let completedTasks = 0;
  let totalTasks = 0;
  const chapters = [];

  plan.rechtsgebiete?.forEach(rg => {
    rg.unterrechtsgebiete?.forEach(urg => {
      urg.kapitel?.forEach(k => {
        const topics = k.themen?.map(t => {
          const tasks = t.aufgaben?.map(a => {
            totalTasks++;
            if (a.completed) completedTasks++;
            return { id: a.id, title: a.title, completed: a.completed };
          }) || [];
          return { id: t.id, title: t.title, tasks, completed: t.completed || false };
        }) || [];
        chapters.push({ id: k.id, title: k.title, topics });
      });
    });
  });

  // Get first Rechtsgebiet for tag
  const firstRg = plan.rechtsgebiete?.[0];
  const tagMap = {
    'zivilrecht': 'Zivilrecht',
    'oeffentliches-recht': 'Öffentliches Recht',
    'strafrecht': 'Strafrecht',
    'querschnitt': 'Querschnitt',
  };

  return {
    id: plan.id,
    title: plan.name,
    description: plan.description,
    tags: firstRg ? [tagMap[firstRg.rechtsgebietId] || firstRg.name] : [],
    rechtsgebiet: firstRg?.rechtsgebietId,
    mode: plan.mode,
    examDate: plan.examDate,
    archived: plan.archived,
    chapters,
    type: plan.type,
    // Progress info
    _progress: { completed: completedTasks, total: totalTasks },
  };
};

LernplanContent.displayName = 'LernplanContent';

export default LernplanContent;
