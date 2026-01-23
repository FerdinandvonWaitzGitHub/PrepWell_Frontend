import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon } from '../ui';
import { useCalendar } from '../../contexts/calendar-context';
import { getDisplayName } from '../../utils/themenliste-migration';

/**
 * ThemenlisteT27Card - Display component for T27-structure Themenlisten
 *
 * T33: New component for flat T27 structure (selectedAreas[] + themen[])
 * instead of hierarchical structure (rechtsgebiete[])
 *
 * @param {Object} plan - ContentPlan with T27 structure
 * @param {boolean} isExpanded - Whether the card is expanded
 * @param {Function} onToggleExpand - Toggle expansion callback
 * @param {boolean} viewMode - When true, shows read-only view
 * @param {Function} onArchive - Archive handler
 * @param {Function} onDelete - Delete handler
 */
const ThemenlisteT27Card = ({
  plan,
  isExpanded,
  onToggleExpand,
  isNew = false,
  viewMode = false,
  onArchive,
  onDelete,
}) => {
  const navigate = useNavigate();
  const {
    archiveContentPlan,
    deleteContentPlan,
    updateContentPlan,
    toggleAufgabeInThemenliste,
  } = useCalendar();

  // Expanded state for areas
  const [expandedAreas, setExpandedAreas] = useState(new Set());
  // Expanded state for themen
  const [expandedThemen, setExpandedThemen] = useState(new Set());

  // ═══════════════════════════════════════════════════════════
  // PROGRESS CALCULATION FOR FLAT STRUCTURE
  // ═══════════════════════════════════════════════════════════
  const progress = useMemo(() => {
    let total = 0;
    let completed = 0;

    // Iterate over all themen
    for (const thema of plan.themen || []) {
      // Count aufgaben
      for (const aufgabe of thema.aufgaben || []) {
        total++;
        if (aufgabe.completed) {
          completed++;
        }
      }
    }

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percent };
  }, [plan.themen]);

  // ═══════════════════════════════════════════════════════════
  // GROUP THEMEN BY AREA (for display)
  // ═══════════════════════════════════════════════════════════
  const themenByArea = useMemo(() => {
    const grouped = {};

    // Initialize with all areas
    for (const area of plan.selectedAreas || []) {
      grouped[area.id] = {
        area,
        themen: []
      };
    }

    // Assign themen to their areas
    for (const thema of plan.themen || []) {
      if (grouped[thema.areaId]) {
        grouped[thema.areaId].themen.push(thema);
      } else {
        // Fallback: thema with unknown areaId
        // Create a default group if needed
        if (!grouped['_unknown']) {
          grouped['_unknown'] = {
            area: { id: '_unknown', name: 'Sonstige', color: 'bg-neutral-400' },
            themen: []
          };
        }
        grouped['_unknown'].themen.push(thema);
      }
    }

    return grouped;
  }, [plan.selectedAreas, plan.themen]);

  // ═══════════════════════════════════════════════════════════
  // DISPLAY NAME
  // ═══════════════════════════════════════════════════════════
  const displayName = useMemo(() => {
    return plan.name || getDisplayName(plan.selectedAreas) || 'Themenliste';
  }, [plan.name, plan.selectedAreas]);

  // ═══════════════════════════════════════════════════════════
  // TOGGLE FUNCTIONS
  // ═══════════════════════════════════════════════════════════
  const toggleArea = (areaId) => {
    setExpandedAreas(prev => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  };

  const toggleThema = (themaId) => {
    setExpandedThemen(prev => {
      const next = new Set(prev);
      if (next.has(themaId)) {
        next.delete(themaId);
      } else {
        next.add(themaId);
      }
      return next;
    });
  };

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleEdit = useCallback(() => {
    // Navigate to Themenliste editor with plan ID
    navigate(`/lernplan/themenliste/${plan.id}`);
  }, [navigate, plan.id]);

  const handleArchive = useCallback((e) => {
    e.stopPropagation();
    if (viewMode && onArchive) {
      onArchive(plan.id);
    } else {
      archiveContentPlan(plan.id);
    }
  }, [viewMode, onArchive, archiveContentPlan, plan.id]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    if (confirm(`"${displayName}" wirklich löschen?`)) {
      if (viewMode && onDelete) {
        onDelete(plan.id);
      } else {
        deleteContentPlan(plan.id);
      }
    }
  }, [viewMode, onDelete, deleteContentPlan, plan.id, displayName]);

  // Toggle aufgabe completion
  const handleToggleAufgabe = useCallback((themaId, aufgabeId) => {
    if (toggleAufgabeInThemenliste) {
      toggleAufgabeInThemenliste(plan.id, themaId, aufgabeId);
    } else {
      // Fallback: manual update if function not available
      const updatedThemen = plan.themen.map(thema => {
        if (thema.id === themaId) {
          return {
            ...thema,
            aufgaben: thema.aufgaben.map(aufgabe => {
              if (aufgabe.id === aufgabeId) {
                return { ...aufgabe, completed: !aufgabe.completed };
              }
              return aufgabe;
            })
          };
        }
        return thema;
      });
      updateContentPlan(plan.id, { themen: updatedThemen });
    }
  }, [plan.id, plan.themen, toggleAufgabeInThemenliste, updateContentPlan]);

  // ═══════════════════════════════════════════════════════════
  // HELPER: Get color classes from Tailwind bg class
  // ═══════════════════════════════════════════════════════════
  const getColorClasses = (bgClass) => {
    // Convert bg-blue-500 to border-blue-300 and text-blue-700
    const colorMatch = bgClass?.match(/bg-(\w+)-(\d+)/);
    if (colorMatch) {
      const [, color] = colorMatch;
      return {
        bg: `bg-${color}-50`,
        border: `border-${color}-200`,
        text: `text-${color}-700`,
        badge: bgClass,
      };
    }
    return {
      bg: 'bg-neutral-50',
      border: 'border-neutral-200',
      text: 'text-neutral-700',
      badge: 'bg-neutral-400',
    };
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className={`bg-white rounded border ${isNew ? 'border-primary-300 ring-2 ring-primary-100' : 'border-neutral-200'} overflow-hidden`}>
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

        {/* Title */}
        <h3 className="flex-1 min-w-0 px-2 py-1 text-lg font-medium text-neutral-950 truncate">
          {displayName}
        </h3>

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
          {/* Edit Button */}
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(); }}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
            title="Bearbeiten"
          >
            <EditIcon size={16} />
          </button>
          {/* Archive Button */}
          <button
            onClick={handleArchive}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
            title={plan.archived ? 'Wiederherstellen' : 'Archivieren'}
          >
            <ArchiveIcon size={16} />
          </button>
          {/* Delete Button */}
          <button
            onClick={handleDelete}
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
          {/* Themen grouped by Area */}
          {Object.keys(themenByArea).length === 0 ||
           Object.values(themenByArea).every(g => g.themen.length === 0) ? (
            <div className="text-center py-6 bg-white rounded-lg border border-dashed border-neutral-300">
              <p className="text-sm text-neutral-400 mb-2">Noch keine Themen hinzugefügt</p>
              <button
                onClick={handleEdit}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Themen hinzufügen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.values(themenByArea).map(({ area, themen }) => {
                if (themen.length === 0) return null;
                const colors = getColorClasses(area.color);
                const isAreaExpanded = expandedAreas.has(area.id);

                return (
                  <div key={area.id} className={`rounded-lg border ${colors.border} overflow-hidden`}>
                    {/* Area Header */}
                    <div className={`flex items-center px-3 py-2 ${colors.bg}`}>
                      <button
                        onClick={() => toggleArea(area.id)}
                        className="p-1 mr-2 hover:bg-white/50 rounded"
                      >
                        <ChevronDownIcon
                          size={16}
                          className={`${colors.text} transition-transform ${isAreaExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <span className={`flex-1 font-medium ${colors.text}`}>{area.name}</span>
                      <span className="text-xs text-neutral-500">
                        {themen.length} {themen.length === 1 ? 'Thema' : 'Themen'}
                      </span>
                    </div>

                    {/* Themen List */}
                    {isAreaExpanded && (
                      <div className="bg-white p-3 space-y-2">
                        {themen.map(thema => {
                          const isThemaExpanded = expandedThemen.has(thema.id);
                          const themaProgress = thema.aufgaben?.length
                            ? thema.aufgaben.filter(a => a.completed).length
                            : 0;
                          const themaTotal = thema.aufgaben?.length || 0;
                          const themaCompleted = themaTotal > 0 && themaProgress === themaTotal;

                          return (
                            <div key={thema.id} className="border-l-2 border-neutral-200 pl-3">
                              {/* Thema Header */}
                              <div className="flex items-center py-1">
                                <button
                                  onClick={() => toggleThema(thema.id)}
                                  className="p-0.5 mr-1.5 hover:bg-neutral-100 rounded"
                                >
                                  <ChevronDownIcon
                                    size={12}
                                    className={`text-neutral-400 transition-transform ${isThemaExpanded ? 'rotate-180' : ''}`}
                                  />
                                </button>
                                <span className={`flex-1 text-sm ${themaCompleted ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
                                  {thema.name}
                                </span>
                                {themaTotal > 0 && (
                                  <span className="text-xs text-neutral-400">
                                    {themaProgress}/{themaTotal}
                                  </span>
                                )}
                              </div>

                              {/* Aufgaben List */}
                              {isThemaExpanded && (
                                <div className="ml-4 py-1 space-y-0.5">
                                  {thema.aufgaben?.length > 0 ? (
                                    thema.aufgaben.map(aufgabe => (
                                      <div key={aufgabe.id} className="flex items-center gap-2 py-0.5">
                                        <input
                                          type="checkbox"
                                          checked={aufgabe.completed}
                                          onChange={() => handleToggleAufgabe(thema.id, aufgabe.id)}
                                          className="w-3.5 h-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-400"
                                        />
                                        <span className={`text-xs ${aufgabe.completed ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
                                          {aufgabe.name}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-neutral-400 py-1">Keine Aufgaben</p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Edit Button at Bottom */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <EditIcon size={14} />
              Bearbeiten
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════
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

const EditIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export default ThemenlisteT27Card;
