import { useState, useMemo, useEffect } from 'react';
import { ChevronDownIcon, PlusIcon } from '../ui';
import { useCalendar } from '../../contexts/calendar-context';
import { useUnterrechtsgebiete } from '../../contexts/unterrechtsgebiete-context';
import { useHierarchyLabels } from '../../hooks/use-hierarchy-labels';
import UnterrechtsgebietPicker from './unterrechtsgebiet-picker';
import { getRechtsgebietColor, getAllSubjects, AVAILABLE_COLORS } from '../../utils/rechtsgebiet-colors';

/**
 * ContentPlanEditCard - Unified component for Lernpläne and Themenlisten
 * Supports both Edit and View modes with consistent hierarchy:
 * Plan → Rechtsgebiete → Unterrechtsgebiete → Kapitel → Themen → Aufgaben
 *
 * @param {boolean} viewMode - When true, shows read-only view with only "+ Aufgabe" action
 */
const ContentPlanEditCard = ({
  plan,
  isExpanded,
  onToggleExpand,
  isNew = false,
  viewMode = false, // New prop: when true, shows simplified view mode
  onArchive, // Optional: archive handler for view mode
  onDelete,  // Optional: delete handler for view mode
}) => {
  const {
    updateContentPlan,
    deleteContentPlan,
    archiveContentPlan,
    addRechtsgebietToPlan,
    removeRechtsgebietFromPlan,
    addUnterrechtsgebietToPlan,
    removeUnterrechtsgebietFromPlan,
    addKapitelToPlan,
    updateKapitelInPlan,
    deleteKapitelFromPlan,
    addThemaToPlan,
    updateThemaInPlan,
    deleteThemaFromPlan,
    addAufgabeToPlan,
    updateAufgabeInPlan,
    toggleAufgabeInPlan,
    deleteAufgabeFromPlan,
    exportThemenlisteAsJson,
    publishThemenliste,
    unpublishThemenliste,
  } = useCalendar();

  const { RECHTSGEBIET_LABELS } = useUnterrechtsgebiete();
  const { level1, level1Plural, level2, level2Plural, level3, level3Plural, level4, level4Plural, level5, level5Plural, isJura } = useHierarchyLabels();

  // UI State
  const [expandedRechtsgebiete, setExpandedRechtsgebiete] = useState(new Set());
  const [expandedUnterrechtsgebiete, setExpandedUnterrechtsgebiete] = useState(new Set());
  const [expandedKapitel, setExpandedKapitel] = useState(new Set());
  const [expandedThemen, setExpandedThemen] = useState(new Set());

  // Picker state
  const [showRechtsgebietPicker, setShowRechtsgebietPicker] = useState(false);
  const [showUnterrechtsgebietPicker, setShowUnterrechtsgebietPicker] = useState(null); // { rechtsgebietId }
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  // Chapter level setting (from settings) - only relevant for Jura students
  const [chapterLevelEnabledSetting, setChapterLevelEnabledSetting] = useState(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('prepwell_settings') || '{}');
      return settings.jura?.chapterLevelEnabled ?? false;
    } catch {
      return false;
    }
  });

  // T5.1: Progress calculation setting - 'aufgaben' or 'themen'
  const [progressCalculation, setProgressCalculation] = useState(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('prepwell_settings') || '{}');
      return settings.learning?.progressCalculation ?? 'aufgaben';
    } catch {
      return 'aufgaben';
    }
  });

  // Chapter level is only enabled for Jura students AND when setting is enabled
  const chapterLevelEnabled = isJura && chapterLevelEnabledSetting;

  // T5.1: Thema checkbox only visible when progressCalculation is 'themen'
  const showThemaCheckbox = progressCalculation === 'themen';

  // Listen for storage changes (when settings are updated)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const settings = JSON.parse(localStorage.getItem('prepwell_settings') || '{}');
        setChapterLevelEnabledSetting(settings.jura?.chapterLevelEnabled ?? false);
        setProgressCalculation(settings.learning?.progressCalculation ?? 'aufgaben');
      } catch {
        setChapterLevelEnabledSetting(false);
        setProgressCalculation('aufgaben');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Also check on mount in case settings changed while component was mounted
    const checkSettings = () => {
      try {
        const settings = JSON.parse(localStorage.getItem('prepwell_settings') || '{}');
        setChapterLevelEnabledSetting(settings.jura?.chapterLevelEnabled ?? false);
        setProgressCalculation(settings.learning?.progressCalculation ?? 'aufgaben');
      } catch {
        setChapterLevelEnabledSetting(false);
        setProgressCalculation('aufgaben');
      }
    };

    // Check periodically for same-window changes (storage event only fires for other windows)
    const interval = setInterval(checkSettings, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Calculate progress
  const progress = useMemo(() => {
    let completed = 0;
    let total = 0;
    plan.rechtsgebiete?.forEach(rg => {
      rg.unterrechtsgebiete?.forEach(urg => {
        urg.kapitel?.forEach(k => {
          k.themen?.forEach(t => {
            // Guard: t could be undefined if array has holes
            t?.aufgaben?.forEach(a => {
              total++;
              if (a.completed) completed++;
            });
          });
        });
      });
    });
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [plan]);

  // T-SET-1: getRechtsgebietColor imported from utils/rechtsgebiet-colors.js

  // Toggle functions
  const toggleRechtsgebiet = (id) => {
    setExpandedRechtsgebiete(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleUnterrechtsgebiet = (id) => {
    setExpandedUnterrechtsgebiete(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleKapitel = (id) => {
    setExpandedKapitel(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleThema = (id) => {
    setExpandedThemen(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Handle add Rechtsgebiet
  // T7: Now supports both Jura (RECHTSGEBIET_LABELS) and non-Jura (custom subjects)
  const handleAddRechtsgebiet = (subjectId) => {
    let name = RECHTSGEBIET_LABELS[subjectId];

    // T7: For non-Jura users, get name from custom subjects
    if (!isJura) {
      const customSubjects = getAllSubjects(false);
      const subject = customSubjects.find(s => s.id === subjectId);
      name = subject?.name || subjectId;
    }

    addRechtsgebietToPlan(plan.id, {
      rechtsgebietId: subjectId,
      name,
    });
    setShowRechtsgebietPicker(false);
  };

  // Handle add Unterrechtsgebiete from picker
  const handleAddUnterrechtsgebiete = (selectedItems) => {
    if (!showUnterrechtsgebietPicker) return;
    selectedItems.forEach(item => {
      addUnterrechtsgebietToPlan(plan.id, showUnterrechtsgebietPicker.rechtsgebietId, item);
    });
    setShowUnterrechtsgebietPicker(null);
  };

  // Get already added Unterrechtsgebiet IDs for a Rechtsgebiet
  const getExcludedUnterrechtsgebietIds = (rechtsgebiet) => {
    return rechtsgebiet.unterrechtsgebiete?.map(urg => urg.unterrechtsgebietId) || [];
  };

  return (
    <div className={`bg-white rounded-lg border ${isNew ? 'border-primary-300 ring-2 ring-primary-100' : 'border-neutral-200'} overflow-hidden`}>
      {/* Header Bar */}
      <div
        className="flex items-center h-[70px] px-4 cursor-pointer hover:bg-neutral-50"
        onClick={() => onToggleExpand?.(plan.id)}
      >
        {/* Expand Icon */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand?.(plan.id); }}
          className="p-1.5 mr-3 text-neutral-500 hover:bg-neutral-100 rounded transition-colors"
        >
          <ChevronDownIcon size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Type Badge */}
        <span className={`px-2 py-0.5 text-xs font-medium rounded mr-3 ${
          plan.type === 'themenliste' ? 'bg-yellow-100 text-yellow-700' : 'bg-primary-100 text-primary-700'
        }`}>
          {plan.type === 'themenliste' ? 'Themenliste' : 'Lernplan'}
        </span>

        {/* Mode Badge (only for Lernplan) */}
        {plan.type === 'lernplan' && plan.mode === 'examen' && (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700 mr-3">
            Examen
          </span>
        )}

        {/* Title - Input in edit mode, text in view mode */}
        {viewMode ? (
          <h3 className="flex-1 min-w-0 px-2 py-1 text-base font-medium text-neutral-900 truncate">
            {plan.name || (plan.type === 'themenliste' ? 'Themenliste' : 'Lernplan')}
          </h3>
        ) : (
          <input
            type="text"
            value={plan.name}
            onChange={(e) => updateContentPlan(plan.id, { name: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder={plan.type === 'themenliste' ? 'Themenliste Titel...' : 'Lernplan Titel...'}
            className="flex-1 min-w-0 px-2 py-1 text-base font-medium text-neutral-900 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-primary-400 focus:outline-none"
          />
        )}

        {/* Progress Bar */}
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <div className="w-32 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-900 rounded-full transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className="text-sm text-neutral-500 whitespace-nowrap">
            {progress.completed}/{progress.total}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-4 flex-shrink-0">
          {/* Export Button (only for Themenlisten in edit mode) */}
          {!viewMode && plan.type === 'themenliste' && (
            <button
              onClick={(e) => { e.stopPropagation(); exportThemenlisteAsJson(plan.id); }}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
              title="Als JSON exportieren"
            >
              <ExportIcon size={16} />
            </button>
          )}
          {/* Publish/Unpublish Button (only for Themenlisten in edit mode) */}
          {!viewMode && plan.type === 'themenliste' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (plan.isPublished) {
                  unpublishThemenliste(plan.publishedId);
                } else {
                  publishThemenliste(plan.id);
                }
              }}
              className={`p-1.5 rounded transition-colors ${
                plan.isPublished
                  ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                  : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
              }`}
              title={plan.isPublished ? 'Veröffentlichung aufheben' : 'In Community veröffentlichen'}
            >
              <PublishIcon size={16} filled={plan.isPublished} />
            </button>
          )}
          {/* Archive Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (viewMode && onArchive) {
                onArchive(plan.id);
              } else {
                archiveContentPlan(plan.id);
              }
            }}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
            title={plan.archived ? 'Wiederherstellen' : 'Archivieren'}
          >
            <ArchiveIcon size={16} />
          </button>
          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`"${plan.name || 'Unbenannt'}" wirklich löschen?`)) {
                if (viewMode && onDelete) {
                  onDelete(plan.id);
                } else {
                  deleteContentPlan(plan.id);
                }
              }
            }}
            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Löschen"
          >
            <TrashIcon size={16} />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-neutral-100 bg-neutral-50 p-4">
          {/* Basic Info - only in edit mode */}
          {!viewMode && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Beschreibung</label>
                  <textarea
                    value={plan.description || ''}
                    onChange={(e) => updateContentPlan(plan.id, { description: e.target.value })}
                    placeholder="Beschreibung..."
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                  />
                </div>

                {/* Mode (only for Lernplan) */}
                {plan.type === 'lernplan' && (
                  <div className="relative">
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Modus</label>
                    <button
                      onClick={() => setShowModeDropdown(!showModeDropdown)}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50"
                    >
                      <span>{plan.mode === 'examen' ? 'Examen' : 'Standard'}</span>
                      <ChevronDownIcon size={14} className="text-neutral-400" />
                    </button>
                    {showModeDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg">
                        <button
                          onClick={() => { updateContentPlan(plan.id, { mode: 'standard' }); setShowModeDropdown(false); }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${plan.mode === 'standard' ? 'bg-primary-50 text-primary-700' : ''}`}
                        >
                          Standard
                        </button>
                        <button
                          onClick={() => { updateContentPlan(plan.id, { mode: 'examen' }); setShowModeDropdown(false); }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${plan.mode === 'examen' ? 'bg-primary-50 text-primary-700' : ''}`}
                        >
                          Examen
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Exam Date (if examen mode) */}
              {plan.type === 'lernplan' && plan.mode === 'examen' && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Examenstermin</label>
                  <input
                    type="date"
                    value={plan.examDate || ''}
                    onChange={(e) => updateContentPlan(plan.id, { examDate: e.target.value })}
                    className="px-2 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              )}
            </>
          )}

          {/* Rechtsgebiete/Fächer Section */}
          <div className={viewMode ? '' : 'border-t border-neutral-200 pt-4 mt-2'}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-neutral-700">{level1Plural} & Inhalte</h4>
              {/* Add Rechtsgebiet button - only in edit mode */}
              {!viewMode && (
                <button
                  onClick={() => setShowRechtsgebietPicker(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
                >
                  <PlusIcon size={12} />
                  {level1}
                </button>
              )}
            </div>

            {/* Rechtsgebiete/Fächer List */}
            {(!plan.rechtsgebiete || plan.rechtsgebiete.length === 0) ? (
              !viewMode && (
                <EmptyState
                  message={`Noch keine ${level1Plural} hinzugefügt`}
                  actionLabel={`${level1} hinzufügen`}
                  onAction={() => setShowRechtsgebietPicker(true)}
                />
              )
            ) : (
              <div className="space-y-3">
                {plan.rechtsgebiete.map((rechtsgebiet) => (
                  <RechtsgebietSection
                    key={rechtsgebiet.id}
                    planId={plan.id}
                    rechtsgebiet={rechtsgebiet}
                    colors={getRechtsgebietColor(rechtsgebiet.rechtsgebietId)}
                    isExpanded={expandedRechtsgebiete.has(rechtsgebiet.id)}
                    onToggle={() => toggleRechtsgebiet(rechtsgebiet.id)}
                    onRemove={() => removeRechtsgebietFromPlan(plan.id, rechtsgebiet.id)}
                    onAddUnterrechtsgebiet={() => setShowUnterrechtsgebietPicker({ rechtsgebietId: rechtsgebiet.id })}
                    // Pass down nested state
                    expandedUnterrechtsgebiete={expandedUnterrechtsgebiete}
                    toggleUnterrechtsgebiet={toggleUnterrechtsgebiet}
                    expandedKapitel={expandedKapitel}
                    toggleKapitel={toggleKapitel}
                    expandedThemen={expandedThemen}
                    toggleThema={toggleThema}
                    // Chapter level setting
                    chapterLevelEnabled={chapterLevelEnabled}
                    // T5.1: Progress calculation setting
                    showThemaCheckbox={showThemaCheckbox}
                    // View mode
                    viewMode={viewMode}
                    // Hierarchy labels
                    hierarchyLabels={{ level2, level2Plural, level3, level3Plural, level4, level4Plural, level5, level5Plural, isJura }}
                    // Pass CRUD functions
                    removeUnterrechtsgebietFromPlan={removeUnterrechtsgebietFromPlan}
                    addKapitelToPlan={addKapitelToPlan}
                    updateKapitelInPlan={updateKapitelInPlan}
                    deleteKapitelFromPlan={deleteKapitelFromPlan}
                    addThemaToPlan={addThemaToPlan}
                    updateThemaInPlan={updateThemaInPlan}
                    deleteThemaFromPlan={deleteThemaFromPlan}
                    addAufgabeToPlan={addAufgabeToPlan}
                    updateAufgabeInPlan={updateAufgabeInPlan}
                    toggleAufgabeInPlan={toggleAufgabeInPlan}
                    deleteAufgabeFromPlan={deleteAufgabeFromPlan}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rechtsgebiet/Fach Picker */}
      {showRechtsgebietPicker && (
        <RechtsgebietPickerModal
          onSelect={handleAddRechtsgebiet}
          onClose={() => setShowRechtsgebietPicker(false)}
          existingIds={plan.rechtsgebiete?.map(rg => rg.rechtsgebietId) || []}
          labels={RECHTSGEBIET_LABELS}
          level1Label={level1}
          isJura={isJura}
        />
      )}

      {/* Unterrechtsgebiet Picker */}
      {showUnterrechtsgebietPicker && (
        <UnterrechtsgebietPicker
          isOpen={true}
          onClose={() => setShowUnterrechtsgebietPicker(null)}
          onSelect={handleAddUnterrechtsgebiete}
          rechtsgebietId={plan.rechtsgebiete?.find(rg => rg.id === showUnterrechtsgebietPicker.rechtsgebietId)?.rechtsgebietId}
          excludeIds={getExcludedUnterrechtsgebietIds(
            plan.rechtsgebiete?.find(rg => rg.id === showUnterrechtsgebietPicker.rechtsgebietId) || {}
          )}
          multiSelect={true}
        />
      )}
    </div>
  );
};

/**
 * RechtsgebietSection - Collapsible Rechtsgebiet/Fach with Unterrechtsgebiete/Kapitel
 */
const RechtsgebietSection = ({
  planId,
  rechtsgebiet,
  colors,
  isExpanded,
  onToggle,
  onRemove,
  onAddUnterrechtsgebiet,
  expandedUnterrechtsgebiete,
  toggleUnterrechtsgebiet,
  expandedKapitel,
  toggleKapitel,
  expandedThemen,
  toggleThema,
  chapterLevelEnabled,
  showThemaCheckbox, // T5.1
  viewMode = false, // View mode prop
  hierarchyLabels,
  removeUnterrechtsgebietFromPlan,
  addKapitelToPlan,
  updateKapitelInPlan,
  deleteKapitelFromPlan,
  addThemaToPlan,
  updateThemaInPlan,
  deleteThemaFromPlan,
  addAufgabeToPlan,
  updateAufgabeInPlan,
  toggleAufgabeInPlan,
  deleteAufgabeFromPlan,
}) => {
  const { level2, level2Plural, level3, level3Plural, level4, level4Plural, level5, level5Plural, isJura } = hierarchyLabels;

  return (
    <div className={`rounded-lg border ${colors.border} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center px-3 py-2 ${colors.bg}`}>
        <button onClick={onToggle} className="p-1 mr-2 hover:bg-white/50 rounded">
          <ChevronDownIcon size={16} className={`${colors.text} transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        <span className={`flex-1 font-medium ${colors.text}`}>{rechtsgebiet?.name || 'Rechtsgebiet'}</span>
        <span className="text-xs text-neutral-500 mr-2">
          {rechtsgebiet?.unterrechtsgebiete?.length || 0} {level2Plural}
        </span>
        {/* Delete button - only in edit mode */}
        {!viewMode && (
          <button
            onClick={onRemove}
            className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Entfernen"
          >
            <TrashIcon size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="bg-white p-3">
          {rechtsgebiet.unterrechtsgebiete?.length > 0 ? (
            <div className="space-y-2">
              {rechtsgebiet.unterrechtsgebiete.map((urg) => (
                <UnterrechtsgebietSection
                  key={urg.id}
                  planId={planId}
                  rechtsgebietId={rechtsgebiet.id}
                  unterrechtsgebiet={urg}
                  isExpanded={expandedUnterrechtsgebiete.has(urg.id)}
                  onToggle={() => toggleUnterrechtsgebiet(urg.id)}
                  onRemove={() => removeUnterrechtsgebietFromPlan(planId, rechtsgebiet.id, urg.id)}
                  expandedKapitel={expandedKapitel}
                  toggleKapitel={toggleKapitel}
                  expandedThemen={expandedThemen}
                  toggleThema={toggleThema}
                  chapterLevelEnabled={chapterLevelEnabled}
                  showThemaCheckbox={showThemaCheckbox}
                  viewMode={viewMode}
                  hierarchyLabels={{ level3, level3Plural, level4, level4Plural, level5, level5Plural, isJura }}
                  addKapitelToPlan={addKapitelToPlan}
                  updateKapitelInPlan={updateKapitelInPlan}
                  deleteKapitelFromPlan={deleteKapitelFromPlan}
                  addThemaToPlan={addThemaToPlan}
                  updateThemaInPlan={updateThemaInPlan}
                  deleteThemaFromPlan={deleteThemaFromPlan}
                  addAufgabeToPlan={addAufgabeToPlan}
                  updateAufgabeInPlan={updateAufgabeInPlan}
                  toggleAufgabeInPlan={toggleAufgabeInPlan}
                  deleteAufgabeFromPlan={deleteAufgabeFromPlan}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-400 py-2">Keine {level2Plural}</p>
          )}
          {/* Add Unterrechtsgebiet button - only in edit mode */}
          {!viewMode && (
            <button
              onClick={onAddUnterrechtsgebiet}
              className="flex items-center gap-1 px-2 py-1 mt-2 text-xs text-primary-600 hover:bg-primary-50 rounded"
            >
              <PlusIcon size={10} />
              {level2}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * UnterrechtsgebietSection - Collapsible Unterrechtsgebiet/Kapitel with nested content
 * Shows Kapitel hierarchy when chapterLevelEnabled (Jura only), otherwise shows Themen directly
 */
const UnterrechtsgebietSection = ({
  planId,
  rechtsgebietId,
  unterrechtsgebiet,
  isExpanded,
  onToggle,
  onRemove,
  expandedKapitel,
  toggleKapitel,
  expandedThemen,
  toggleThema,
  chapterLevelEnabled,
  showThemaCheckbox, // T5.1
  viewMode = false, // View mode prop
  hierarchyLabels,
  addKapitelToPlan,
  updateKapitelInPlan,
  deleteKapitelFromPlan,
  addThemaToPlan,
  updateThemaInPlan,
  deleteThemaFromPlan,
  addAufgabeToPlan,
  updateAufgabeInPlan,
  toggleAufgabeInPlan,
  deleteAufgabeFromPlan,
}) => {
  const { level3, level3Plural, level4, level4Plural, level5, level5Plural, isJura } = hierarchyLabels;

  // Determine labels based on whether Kapitel level is shown
  // For Jura with chapterLevelEnabled: Kapitel (level3) → Thema (level4) → Aufgabe (level5)
  // For Jura without chapterLevelEnabled or non-Jura: Thema (level4/level3) → Aufgabe (level5/level4)
  const themaLabel = isJura ? level4 : level3;
  const themaPluralLabel = isJura ? level4Plural : level3Plural;
  const aufgabeLabel = isJura ? level5 : level4;
  const aufgabePluralLabel = isJura ? level5Plural : level4Plural;

  // Helper to get all Themen from all Kapitel (for flat view)
  const getAllThemen = () => {
    const themen = [];
    unterrechtsgebiet.kapitel?.forEach(k => {
      if (k.themen) {
        themen.push(...k.themen.map(t => ({ ...t, kapitelId: k.id })));
      }
    });
    return themen;
  };

  // Get the default kapitel for adding themen in flat mode
  const getOrCreateDefaultKapitel = () => {
    // Return first kapitel or null (the addThema will need to create one)
    return unterrechtsgebiet.kapitel?.[0] || null;
  };

  // Handle adding thema in flat mode (uses first/default kapitel)
  const handleAddThemaFlat = () => {
    const defaultKapitel = getOrCreateDefaultKapitel();
    if (defaultKapitel) {
      addThemaToPlan(planId, rechtsgebietId, unterrechtsgebiet.id, defaultKapitel.id);
    } else {
      // Create a default kapitel first, then the thema will be added to it
      addKapitelToPlan(planId, rechtsgebietId, unterrechtsgebiet.id, { title: '', isDefault: true });
    }
  };

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-3 py-2 bg-neutral-50">
        <button onClick={onToggle} className="p-1 mr-2 hover:bg-neutral-200 rounded">
          <ChevronDownIcon size={14} className={`text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex-1">
          <span className="text-sm font-medium text-neutral-700">{unterrechtsgebiet?.name || 'Unterrechtsgebiet'}</span>
          {unterrechtsgebiet?.kategorie && (
            <span className="ml-2 text-xs text-neutral-400">({unterrechtsgebiet.kategorie})</span>
          )}
        </div>
        {/* Delete button - only in edit mode */}
        {!viewMode && (
          <button
            onClick={onRemove}
            className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Entfernen"
          >
            <TrashIcon size={12} />
          </button>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="bg-white p-3">
          {chapterLevelEnabled ? (
            // Kapitel-Ebene aktiviert (nur Jura): Zeige Kapitel → Themen Hierarchie
            <>
              {unterrechtsgebiet.kapitel?.length > 0 ? (
                <div className="space-y-2">
                  {unterrechtsgebiet.kapitel.map((kapitel) => (
                    <KapitelSection
                      key={kapitel.id}
                      planId={planId}
                      rechtsgebietId={rechtsgebietId}
                      unterrechtsgebietId={unterrechtsgebiet.id}
                      kapitel={kapitel}
                      isExpanded={expandedKapitel.has(kapitel.id)}
                      onToggle={() => toggleKapitel(kapitel.id)}
                      expandedThemen={expandedThemen}
                      toggleThema={toggleThema}
                      showThemaCheckbox={showThemaCheckbox}
                      viewMode={viewMode}
                      hierarchyLabels={{ themaLabel, themaPluralLabel, aufgabeLabel, aufgabePluralLabel }}
                      updateKapitelInPlan={updateKapitelInPlan}
                      deleteKapitelFromPlan={deleteKapitelFromPlan}
                      addThemaToPlan={addThemaToPlan}
                      updateThemaInPlan={updateThemaInPlan}
                      deleteThemaFromPlan={deleteThemaFromPlan}
                      addAufgabeToPlan={addAufgabeToPlan}
                      updateAufgabeInPlan={updateAufgabeInPlan}
                      toggleAufgabeInPlan={toggleAufgabeInPlan}
                      deleteAufgabeFromPlan={deleteAufgabeFromPlan}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-400 py-1">Keine {level3Plural}</p>
              )}
              {/* Add Kapitel button - only in edit mode */}
              {!viewMode && (
                <button
                  onClick={() => addKapitelToPlan(planId, rechtsgebietId, unterrechtsgebiet.id)}
                  className="flex items-center gap-1 px-2 py-1 mt-2 text-xs text-primary-600 hover:bg-primary-50 rounded"
                >
                  <PlusIcon size={10} />
                  {level3}
                </button>
              )}
            </>
          ) : (
            // Kapitel-Ebene deaktiviert oder nicht-Jura: Zeige Themen direkt
            <>
              {getAllThemen().length > 0 ? (
                <div className="space-y-1">
                  {getAllThemen().map((thema) => (
                    <ThemaSection
                      key={thema.id}
                      planId={planId}
                      rechtsgebietId={rechtsgebietId}
                      unterrechtsgebietId={unterrechtsgebiet.id}
                      kapitelId={thema.kapitelId}
                      thema={thema}
                      isExpanded={expandedThemen.has(thema.id)}
                      onToggle={() => toggleThema(thema.id)}
                      showThemaCheckbox={showThemaCheckbox}
                      viewMode={viewMode}
                      hierarchyLabels={{ aufgabeLabel, aufgabePluralLabel }}
                      updateThemaInPlan={updateThemaInPlan}
                      deleteThemaFromPlan={deleteThemaFromPlan}
                      addAufgabeToPlan={addAufgabeToPlan}
                      updateAufgabeInPlan={updateAufgabeInPlan}
                      toggleAufgabeInPlan={toggleAufgabeInPlan}
                      deleteAufgabeFromPlan={deleteAufgabeFromPlan}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-400 py-1">Keine {themaPluralLabel}</p>
              )}
              {/* Add Thema button - only in edit mode */}
              {!viewMode && (
                <button
                  onClick={handleAddThemaFlat}
                  className="flex items-center gap-1 px-2 py-1 mt-2 text-xs text-primary-600 hover:bg-primary-50 rounded"
                >
                  <PlusIcon size={10} />
                  {themaLabel}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * KapitelSection - Collapsible Kapitel with Themen
 */
const KapitelSection = ({
  planId,
  rechtsgebietId,
  unterrechtsgebietId,
  kapitel,
  isExpanded,
  onToggle,
  expandedThemen,
  toggleThema,
  showThemaCheckbox, // T5.1
  viewMode = false, // View mode prop
  hierarchyLabels,
  updateKapitelInPlan,
  deleteKapitelFromPlan,
  addThemaToPlan,
  updateThemaInPlan,
  deleteThemaFromPlan,
  addAufgabeToPlan,
  updateAufgabeInPlan,
  toggleAufgabeInPlan,
  deleteAufgabeFromPlan,
}) => {
  const { themaLabel, themaPluralLabel, aufgabeLabel, aufgabePluralLabel } = hierarchyLabels;

  return (
    <div className="ml-3 border-l-2 border-neutral-200 pl-3">
      {/* Header */}
      <div className="flex items-center py-1">
        <button onClick={onToggle} className="p-0.5 mr-1.5 hover:bg-neutral-100 rounded">
          <ChevronDownIcon size={12} className={`text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        {/* Title - input in edit mode, text in view mode */}
        {viewMode ? (
          <span className="flex-1 px-1.5 py-0.5 text-sm font-medium text-neutral-900">
            {kapitel.title || 'Kapitel'}
          </span>
        ) : (
          <input
            type="text"
            value={kapitel.title}
            onChange={(e) => updateKapitelInPlan(planId, rechtsgebietId, unterrechtsgebietId, kapitel.id, { title: e.target.value })}
            className="flex-1 px-1.5 py-0.5 text-sm font-medium bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-primary-400 focus:outline-none"
          />
        )}
        {/* Delete button - only in edit mode */}
        {!viewMode && (
          <button
            onClick={() => deleteKapitelFromPlan(planId, rechtsgebietId, unterrechtsgebietId, kapitel.id)}
            className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Löschen"
          >
            <TrashIcon size={12} />
          </button>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="ml-4 py-1">
          {kapitel.themen?.length > 0 ? (
            <div className="space-y-1">
              {kapitel.themen.map((thema) => (
                <ThemaSection
                  key={thema.id}
                  planId={planId}
                  rechtsgebietId={rechtsgebietId}
                  unterrechtsgebietId={unterrechtsgebietId}
                  kapitelId={kapitel.id}
                  thema={thema}
                  isExpanded={expandedThemen.has(thema.id)}
                  onToggle={() => toggleThema(thema.id)}
                  showThemaCheckbox={showThemaCheckbox}
                  viewMode={viewMode}
                  hierarchyLabels={{ aufgabeLabel, aufgabePluralLabel }}
                  updateThemaInPlan={updateThemaInPlan}
                  deleteThemaFromPlan={deleteThemaFromPlan}
                  addAufgabeToPlan={addAufgabeToPlan}
                  updateAufgabeInPlan={updateAufgabeInPlan}
                  toggleAufgabeInPlan={toggleAufgabeInPlan}
                  deleteAufgabeFromPlan={deleteAufgabeFromPlan}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-400 py-1">Keine {themaPluralLabel}</p>
          )}
          {/* Add Thema button - only in edit mode */}
          {!viewMode && (
            <button
              onClick={() => addThemaToPlan(planId, rechtsgebietId, unterrechtsgebietId, kapitel.id)}
              className="flex items-center gap-1 px-1.5 py-1 mt-1 text-xs text-primary-600 hover:bg-primary-50 rounded"
            >
              <PlusIcon size={10} />
              {themaLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * ThemaSection - Collapsible Thema with Aufgaben
 * In viewMode: shows "+ Aufgabe" button for adding tasks (user requirement)
 */
const ThemaSection = ({
  planId,
  rechtsgebietId,
  unterrechtsgebietId,
  kapitelId,
  thema,
  isExpanded,
  onToggle,
  showThemaCheckbox = false, // T5.1: Only show checkbox when progressCalculation is 'themen'
  viewMode = false, // View mode prop
  hierarchyLabels,
  updateThemaInPlan,
  deleteThemaFromPlan,
  addAufgabeToPlan,
  updateAufgabeInPlan,
  toggleAufgabeInPlan,
  deleteAufgabeFromPlan,
}) => {
  // Guard: thema could be undefined if parent array has holes
  if (!thema) return null;

  const { aufgabeLabel, aufgabePluralLabel } = hierarchyLabels;

  // T5.7 FIX: Toggle thema completed status
  const handleThemaToggle = () => {
    updateThemaInPlan(planId, rechtsgebietId, unterrechtsgebietId, kapitelId, thema.id, {
      completed: !thema.completed
    });
  };

  return (
    <div className="border-l border-neutral-200 pl-3">
      {/* Header */}
      <div className="flex items-center py-0.5">
        {/* T5.1: Checkbox for marking theme as completed - only when showThemaCheckbox is true */}
        {showThemaCheckbox && (
          <button
            onClick={handleThemaToggle}
            className={`w-3.5 h-3.5 mr-2 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
              thema.completed
                ? 'bg-neutral-900 border-neutral-900'
                : 'border-neutral-300 hover:border-neutral-400'
            }`}
            title={thema.completed ? 'Als nicht erledigt markieren' : 'Als erledigt markieren'}
          >
            {thema.completed && (
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        )}
        <button onClick={onToggle} className="p-0.5 mr-1 hover:bg-neutral-100 rounded">
          <ChevronDownIcon size={10} className={`text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        {/* Title - input in edit mode, text in view mode */}
        {viewMode ? (
          <span className={`flex-1 px-1 py-0.5 text-xs ${thema.completed ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
            {thema.title || 'Thema'}
          </span>
        ) : (
          <input
            type="text"
            value={thema.title}
            onChange={(e) => updateThemaInPlan(planId, rechtsgebietId, unterrechtsgebietId, kapitelId, thema.id, { title: e.target.value })}
            className={`flex-1 px-1 py-0.5 text-xs bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-primary-400 focus:outline-none ${
              thema.completed ? 'text-neutral-400 line-through' : ''
            }`}
          />
        )}
        {/* Delete button - only in edit mode */}
        {!viewMode && (
          <button
            onClick={() => deleteThemaFromPlan(planId, rechtsgebietId, unterrechtsgebietId, kapitelId, thema.id)}
            className="p-0.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Löschen"
          >
            <TrashIcon size={10} />
          </button>
        )}
      </div>

      {/* Aufgaben - always expandable, even if empty (to show + Aufgabe button) */}
      {isExpanded && (
        <div className="ml-4 py-1">
          {thema.aufgaben?.length > 0 && (
            <div className="space-y-0.5">
              {thema.aufgaben.map((aufgabe) => (
                <AufgabeItem
                  key={aufgabe.id}
                  planId={planId}
                  rechtsgebietId={rechtsgebietId}
                  unterrechtsgebietId={unterrechtsgebietId}
                  kapitelId={kapitelId}
                  themaId={thema.id}
                  aufgabe={aufgabe}
                  aufgabeLabel={aufgabeLabel}
                  viewMode={viewMode}
                  updateAufgabeInPlan={updateAufgabeInPlan}
                  toggleAufgabeInPlan={toggleAufgabeInPlan}
                  deleteAufgabeFromPlan={deleteAufgabeFromPlan}
                />
              ))}
            </div>
          )}
          {/* Add Aufgabe button - ALWAYS visible (including in view mode per user requirement) */}
          <button
            onClick={() => addAufgabeToPlan(planId, rechtsgebietId, unterrechtsgebietId, kapitelId, thema.id)}
            className="flex items-center gap-1 px-1 py-0.5 mt-1 text-xs text-primary-600 hover:bg-primary-50 rounded"
          >
            <PlusIcon size={8} />
            {aufgabeLabel}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * AufgabeItem - Single task with checkbox
 */
const AufgabeItem = ({
  planId,
  rechtsgebietId,
  unterrechtsgebietId,
  kapitelId,
  themaId,
  aufgabe,
  aufgabeLabel,
  viewMode = false, // View mode prop
  updateAufgabeInPlan,
  toggleAufgabeInPlan,
  deleteAufgabeFromPlan,
}) => {
  return (
    <div className="flex items-center gap-2 py-0.5 group">
      {/* Checkbox - always interactive */}
      <input
        type="checkbox"
        checked={aufgabe.completed}
        onChange={() => toggleAufgabeInPlan(planId, rechtsgebietId, unterrechtsgebietId, kapitelId, themaId, aufgabe.id)}
        className="w-3.5 h-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-400"
      />
      {/* Title - input in edit mode OR when title is empty (to allow typing new task), text otherwise in view mode */}
      {viewMode && aufgabe.title ? (
        <span className={`flex-1 px-1 py-0.5 text-xs ${aufgabe.completed ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
          {aufgabe.title}
        </span>
      ) : (
        <input
          type="text"
          value={aufgabe.title}
          onChange={(e) => updateAufgabeInPlan(planId, rechtsgebietId, unterrechtsgebietId, kapitelId, themaId, aufgabe.id, { title: e.target.value })}
          placeholder={`${aufgabeLabel} eingeben...`}
          autoFocus={!aufgabe.title}
          className={`flex-1 px-1 py-0.5 text-xs bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-primary-400 focus:outline-none ${
            aufgabe.completed ? 'text-neutral-400 line-through' : 'text-neutral-700'
          }`}
        />
      )}
      {/* Delete button - only in edit mode */}
      {!viewMode && (
        <button
          onClick={() => deleteAufgabeFromPlan(planId, rechtsgebietId, unterrechtsgebietId, kapitelId, themaId, aufgabe.id)}
          className="p-0.5 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Löschen"
        >
          <TrashIcon size={10} />
        </button>
      )}
    </div>
  );
};

/**
 * RechtsgebietPickerModal - Simple modal for picking a Rechtsgebiet/Fach
 * T7: Now supports both Jura (4 fixed Rechtsgebiete) and non-Jura (custom subjects)
 */
const RechtsgebietPickerModal = ({ onSelect, onClose, existingIds, labels, level1Label, isJura = true }) => {
  // T7: Get subjects based on study program
  const subjects = useMemo(() => {
    if (isJura) {
      // Jura: Fixed 4 Rechtsgebiete
      return [
        { id: 'zivilrecht', name: labels['zivilrecht'] || 'Zivilrecht', color: 'blue' },
        { id: 'oeffentliches-recht', name: labels['oeffentliches-recht'] || 'Öffentliches Recht', color: 'green' },
        { id: 'strafrecht', name: labels['strafrecht'] || 'Strafrecht', color: 'red' },
        { id: 'querschnitt', name: labels['querschnitt'] || 'Querschnittsrecht', color: 'purple' },
      ];
    } else {
      // Non-Jura: Custom subjects from T-SET-1
      return getAllSubjects(false);
    }
  }, [isJura, labels]);

  // Helper: Get Tailwind color class from color name
  const getColorClass = (color) => {
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      amber: 'bg-amber-500',
      emerald: 'bg-emerald-500',
      cyan: 'bg-cyan-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
      orange: 'bg-orange-500',
    };
    return colorMap[color] || 'bg-neutral-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-lg shadow-xl p-4 w-80 max-h-[80vh] overflow-y-auto">
        <h4 className="text-sm font-medium text-neutral-900 mb-3">{level1Label} hinzufügen</h4>

        {/* T7: Empty state for non-Jura users without custom subjects */}
        {!isJura && subjects.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-neutral-500 mb-2">
              Du hast noch keine Fächer erstellt.
            </p>
            <p className="text-xs text-neutral-400">
              Gehe zu Einstellungen → Fächerfarben um deine Fächer hinzuzufügen.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {subjects.map(subject => {
              const isDisabled = existingIds.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  onClick={() => !isDisabled && onSelect(subject.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isDisabled
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${getColorClass(subject.color)}`} />
                  <span className="text-sm">{subject.name}</span>
                  {isDisabled && <span className="ml-auto text-xs text-neutral-400">Bereits hinzugefügt</span>}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * EmptyState - Empty state placeholder
 */
const EmptyState = ({ message, actionLabel, onAction }) => (
  <div className="text-center py-6 bg-white rounded-lg border border-dashed border-neutral-300">
    <p className="text-sm text-neutral-400 mb-2">{message}</p>
    <button onClick={onAction} className="text-sm text-primary-600 hover:text-primary-700">
      {actionLabel}
    </button>
  </div>
);

// Icons
const TrashIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ArchiveIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

const ExportIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const PublishIcon = ({ size = 16, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

export default ContentPlanEditCard;
