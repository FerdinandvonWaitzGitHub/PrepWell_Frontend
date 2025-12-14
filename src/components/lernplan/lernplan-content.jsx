import { useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import LernplanCard from './lernplan-card';
import LernplanEditCard from './lernplan-edit-card';
import { Button, PlusIcon } from '../ui';
import { ChevronDownIcon } from '../ui';

// Generate unique ID
const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Sample learning plans data
const SAMPLE_LERNPLAENE = [
  {
    id: 'lp-1',
    title: 'BGB Allgemeiner Teil',
    description: 'Grundlagen des Bürgerlichen Rechts - Rechtsgeschäftslehre, Willenserklärungen und Vertragsschluss',
    tags: ['Zivilrecht'],
    rechtsgebiet: 'zivilrecht',
    mode: 'standard',
    archived: false,
    chapters: [
      {
        id: 'ch-1',
        title: 'Rechtsgeschäftslehre',
        themes: [
          {
            id: 'th-1',
            title: 'Begriff des Rechtsgeschäfts',
            tasks: [
              { id: 't-1', title: 'Definition lernen', completed: true },
              { id: 't-2', title: 'Beispiele sammeln', completed: true }
            ]
          },
          {
            id: 'th-2',
            title: 'Arten von Rechtsgeschäften',
            tasks: [
              { id: 't-3', title: 'Einseitige RG', completed: false },
              { id: 't-4', title: 'Mehrseitige RG', completed: false }
            ]
          }
        ]
      },
      {
        id: 'ch-2',
        title: 'Willenserklärung',
        themes: [
          {
            id: 'th-3',
            title: 'Tatbestand',
            tasks: [
              { id: 't-5', title: 'Objektiver Tatbestand', completed: true },
              { id: 't-6', title: 'Subjektiver Tatbestand', completed: false }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'lp-2',
    title: 'Strafrecht AT Grundlagen',
    description: 'Aufbau der Straftat, Vorsatz und Fahrlässigkeit, Rechtfertigungsgründe',
    tags: ['Strafrecht'],
    rechtsgebiet: 'strafrecht',
    mode: 'examen',
    examDate: '2025-06-15',
    archived: false,
    chapters: [
      {
        id: 'ch-3',
        title: 'Aufbau der Straftat',
        themes: [
          {
            id: 'th-4',
            title: 'Dreistufiger Aufbau',
            tasks: [
              { id: 't-7', title: 'Tatbestand', completed: true },
              { id: 't-8', title: 'Rechtswidrigkeit', completed: true },
              { id: 't-9', title: 'Schuld', completed: false }
            ]
          }
        ]
      }
    ]
  }
];

/**
 * LernplanContent component
 * Main content area for learning plans overview
 * Supports toggle between normal view and edit mode
 */
const LernplanContent = forwardRef(({ className = '' }, ref) => {
  const [lernplaene, setLernplaene] = useState(SAMPLE_LERNPLAENE);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [viewMode, setViewMode] = useState('all'); // 'standard', 'examen', 'all'
  const [showArchived, setShowArchived] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newLernplanId, setNewLernplanId] = useState(null);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    openCreateDialog: () => {
      handleCreateNew();
    }
  }));

  // Filter learning plans
  const filteredLernplaene = useMemo(() => {
    let result = [...lernplaene];

    // Filter by archived status
    result = result.filter(lp => lp.archived === showArchived);

    // Filter by mode
    if (viewMode !== 'all') {
      result = result.filter(lp => lp.mode === viewMode);
    }

    return result;
  }, [lernplaene, viewMode, showArchived]);

  // If only one plan exists, auto-expand it
  const shouldAutoExpand = filteredLernplaene.length === 1;

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

  // Create new learning plan
  const handleCreateNew = () => {
    const newId = generateId();
    const newLernplan = {
      id: newId,
      title: '',
      description: '',
      tags: [],
      rechtsgebiet: '',
      mode: 'standard',
      archived: false,
      chapters: []
    };
    setLernplaene(prev => [newLernplan, ...prev]);
    setExpandedIds(prev => new Set([...prev, newId]));
    setNewLernplanId(newId);
    setIsEditMode(true);
  };

  // Update learning plan
  const handleUpdate = (updatedLernplan) => {
    setLernplaene(prev => prev.map(lp =>
      lp.id === updatedLernplan.id ? updatedLernplan : lp
    ));
    // Clear new flag after first update
    if (newLernplanId === updatedLernplan.id && updatedLernplan.title) {
      setNewLernplanId(null);
    }
  };

  // Delete learning plan
  const handleDelete = (lernplan) => {
    setLernplaene(prev => prev.filter(lp => lp.id !== lernplan.id));
    if (newLernplanId === lernplan.id) {
      setNewLernplanId(null);
    }
  };

  // Archive learning plan
  const handleArchive = (lernplan) => {
    setLernplaene(prev => prev.map(lp =>
      lp.id === lernplan.id ? { ...lp, archived: !lp.archived } : lp
    ));
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
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Aktiv
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              showArchived
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
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
              className="appearance-none px-3 py-1.5 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white cursor-pointer"
            >
              <option value="all">Alle Modi</option>
              <option value="standard">Standard</option>
              <option value="examen">Examen</option>
            </select>
            <ChevronDownIcon
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
            />
          </div>

          {/* Edit Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setIsEditMode(false)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                !isEditMode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ansicht
            </button>
            <button
              onClick={() => setIsEditMode(true)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                isEditMode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bearbeiten
            </button>
          </div>
        </div>
      </div>

      {/* Learning Plans List */}
      <div className="flex-1 overflow-auto">
        {filteredLernplaene.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredLernplaene.map((lernplan) => (
              isEditMode ? (
                <LernplanEditCard
                  key={lernplan.id}
                  lernplan={lernplan}
                  isExpanded={shouldAutoExpand || expandedIds.has(lernplan.id)}
                  onToggleExpand={handleToggleExpand}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onArchive={handleArchive}
                  isNew={newLernplanId === lernplan.id}
                />
              ) : (
                <LernplanCard
                  key={lernplan.id}
                  lernplan={lernplan}
                  isExpanded={shouldAutoExpand || expandedIds.has(lernplan.id)}
                  onToggleExpand={handleToggleExpand}
                />
              )
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showArchived ? 'Keine archivierten Lernpläne' : 'Noch keine Lernpläne'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {showArchived
                ? 'Du hast noch keine Lernpläne archiviert.'
                : 'Erstelle deinen ersten Lernplan, um loszulegen.'}
            </p>
            {!showArchived && (
              <Button onClick={handleCreateNew} className="flex items-center gap-2">
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

LernplanContent.displayName = 'LernplanContent';

export default LernplanContent;
