import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * T32 Bug 4: AreaDropdown - Quick switcher for changing theme's Fach
 * Always visible (not just on hover) for easier access
 */
const AreaDropdown = ({ currentAreaId, areas, onChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-400
                   hover:bg-neutral-100 hover:text-neutral-600 rounded border border-transparent hover:border-neutral-200 transition-all"
        title="Fach ändern"
      >
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 min-w-[160px]">
          {areas.map(area => (
            <button
              key={area.id}
              onClick={(e) => {
                e.stopPropagation();
                onChange(area.id);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-xs text-left flex items-center gap-2
                         hover:bg-neutral-50 ${area.id === currentAreaId ? 'bg-neutral-100 font-medium' : ''}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${area.color || 'bg-neutral-400'}`} />
              <span className="truncate">{area.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * ThemenNavigation - Left sidebar with flat theme list
 *
 * T27: Redesigned from accordion hierarchy to flat list
 * - Flat list of themes with color bars
 * - Optional Kapitel grouping (if useKapitel=true)
 * - Color based on theme's areaId -> selectedAreas color lookup
 */
const ThemenNavigation = ({
  themen = [],
  kapitel = [],
  useKapitel = false,
  selectedAreas = [],
  selectedThemaId,
  onSelectThema,
  onAddThema,
  onDeleteThema,
  onAddKapitel,
  onDeleteKapitel,
  onUpdateKapitel,
  onUpdateThema, // T32: Added for inline area changes
  hierarchyLabels,
  isJura = true,
}) => {
  // T27: Get correct hierarchy labels based on Jura vs non-Jura
  // Jura (5 levels): level3=Kapitel, level4=Thema, level5=Aufgabe
  // Non-Jura (4 levels): level2=Kapitel, level3=Thema, level4=Aufgabe
  const themaLabel = isJura ? hierarchyLabels?.level4 : hierarchyLabels?.level3;
  const themaLabelPlural = isJura ? hierarchyLabels?.level4Plural : hierarchyLabels?.level3Plural;
  const kapitelLabel = isJura ? hierarchyLabels?.level3 : hierarchyLabels?.level2;
  const [addingThemaIn, setAddingThemaIn] = useState(null); // kapitelId or 'root'
  const [addingKapitel, setAddingKapitel] = useState(false);
  const [newThemaName, setNewThemaName] = useState('');
  const [newKapitelName, setNewKapitelName] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState(null); // T27: Selected area for new theme
  const [newKapitelAreaId, setNewKapitelAreaId] = useState(null); // T32: Selected area for new Kapitel
  const [lastUsedAreaId, setLastUsedAreaId] = useState(null); // T32: Remember last used area for smart default
  const [expandedKapitel, setExpandedKapitel] = useState(new Set(kapitel.map(k => k.id)));

  // Get color class for a theme based on its areaId
  const getColorForThema = (areaId) => {
    const area = selectedAreas.find(a => a.id === areaId);
    if (!area?.color) return 'border-l-neutral-400';
    // Convert bg-X-500 to border-l-X-500
    return area.color.replace('bg-', 'border-l-');
  };

  // Get background color class for color bar
  const getBgColorForThema = (areaId) => {
    const area = selectedAreas.find(a => a.id === areaId);
    return area?.color || 'bg-neutral-400';
  };

  // Handle adding new Thema
  // T32 Bug 4b: Thema inherits Fach from parent Kapitel
  const handleAddThema = (kapitelId = null) => {
    if (!newThemaName.trim()) return;

    let areaId;
    if (kapitelId && useKapitel) {
      // T32: Thema erbt Fach vom Kapitel
      const parentKapitel = kapitel.find(k => k.id === kapitelId);
      areaId = parentKapitel?.areaId || selectedAreas[0]?.id;
    } else {
      // T32: Smart Default - use selected, then last used, then first
      areaId = selectedAreaId || lastUsedAreaId || (selectedAreas.length > 0 ? selectedAreas[0].id : null);
    }

    onAddThema(newThemaName.trim(), areaId, kapitelId);

    // T32: Remember last used area for next theme
    if (areaId) {
      setLastUsedAreaId(areaId);
    }

    setNewThemaName('');
    setSelectedAreaId(null);
    setAddingThemaIn(null);
  };

  // Handle adding new Kapitel
  // T32 Bug 4b: Pass areaId to Kapitel
  const handleAddKapitel = () => {
    if (!newKapitelName.trim()) return;
    // T32: Use selected area or default to first
    const areaId = newKapitelAreaId || (selectedAreas.length > 0 ? selectedAreas[0].id : null);
    const newKapitelId = onAddKapitel(newKapitelName.trim(), areaId);
    setNewKapitelName('');
    setNewKapitelAreaId(null);
    setAddingKapitel(false);
    if (newKapitelId) {
      setExpandedKapitel(prev => new Set([...prev, newKapitelId]));
      setAddingThemaIn(newKapitelId);
    }
  };

  // Toggle Kapitel expansion
  const toggleKapitel = (kapitelId) => {
    setExpandedKapitel(prev => {
      const newSet = new Set(prev);
      if (newSet.has(kapitelId)) newSet.delete(kapitelId);
      else newSet.add(kapitelId);
      return newSet;
    });
  };

  // Render a single theme item
  // T32 Bug 4: Show Fach name under theme title when multiple areas exist
  const renderThemaItem = (thema) => {
    const themaArea = selectedAreas.find(a => a.id === thema.areaId);

    return (
      <div
        key={thema.id}
        className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer group transition-colors ${
          selectedThemaId === thema.id
            ? 'bg-neutral-100'
            : 'hover:bg-neutral-50'
        }`}
        onClick={() => onSelectThema(thema.id)}
      >
        {/* Color bar */}
        <span className={`w-1.5 h-8 rounded-full ${getBgColorForThema(thema.areaId)}`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-neutral-900 truncate">
            {thema.name || 'Unbenanntes Thema'}
          </div>
          {/* T32: Show Fach name when multiple areas exist (not just description) */}
          {selectedAreas.length > 1 && !useKapitel && themaArea && (
            <div className="text-xs text-neutral-400 truncate flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${themaArea.color || 'bg-neutral-400'}`} />
              {themaArea.name}
            </div>
          )}
          {thema.description && (
            <div className="text-xs text-neutral-500 truncate">
              {thema.description}
            </div>
          )}
        </div>

        {/* T32 Bug 4: Quick Area Switcher - always visible when multiple areas */}
        {selectedAreas.length > 1 && !useKapitel && onUpdateThema && (
          <AreaDropdown
            currentAreaId={thema.areaId}
            areas={selectedAreas}
            onChange={(newAreaId) => onUpdateThema(thema.id, { areaId: newAreaId })}
          />
        )}

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteThema(thema.id);
          }}
          className="p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Löschen"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  // Render add thema input
  // T32 Bug 4b: Don't show area selector when inside a Kapitel (theme inherits from Kapitel)
  const renderAddThemaInput = (kapitelId = null) => {
    // T32: When inside a Kapitel, show which Fach it will inherit
    const parentKapitel = kapitelId ? kapitel.find(k => k.id === kapitelId) : null;
    const inheritedArea = parentKapitel ? selectedAreas.find(a => a.id === parentKapitel.areaId) : null;
    // T32: For flat list (no Kapitel), determine current area from selection/smart default
    const currentAreaId = selectedAreaId || lastUsedAreaId || selectedAreas[0]?.id;
    const currentArea = selectedAreas.find(a => a.id === currentAreaId);

    return (
      <div className="px-3 py-2 space-y-2">
        {/* T32 Bug 4b: Show inherited Fach info when inside a Kapitel */}
        {kapitelId && inheritedArea && selectedAreas.length > 1 && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span>erbt von {kapitelLabel}:</span>
            <span className={`w-2 h-2 rounded-full ${inheritedArea.color || 'bg-neutral-400'}`} />
            <span className="text-neutral-600">{inheritedArea.name}</span>
          </div>
        )}

        {/* T32 Bug 4: Area selector only when NOT inside a Kapitel AND multiple areas exist */}
        {!kapitelId && selectedAreas.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-neutral-400">wird zugeordnet zu:</span>
            {selectedAreas.map(area => (
              <button
                key={area.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()} // T32 FIX: Prevent input blur when clicking
                onClick={() => setSelectedAreaId(area.id)}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-full border transition-colors ${
                  currentAreaId === area.id
                    ? 'border-neutral-400 bg-neutral-100'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${area.color || 'bg-neutral-400'}`} />
                <span className="truncate max-w-[80px]">{area.name}</span>
              </button>
            ))}
          </div>
        )}
        <input
          type="text"
          value={newThemaName}
          onChange={(e) => setNewThemaName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddThema(kapitelId);
            if (e.key === 'Escape') {
              setAddingThemaIn(null);
              setNewThemaName('');
              setSelectedAreaId(null);
            }
          }}
          onBlur={() => {
            if (!newThemaName.trim()) {
              setAddingThemaIn(null);
              setSelectedAreaId(null);
            }
          }}
          placeholder={`Neues ${themaLabel || 'Thema'}...`}
          className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
          autoFocus
        />
      </div>
    );
  };

  // Render add thema button
  const renderAddThemaButton = (kapitelId = null) => (
    <button
      onClick={() => setAddingThemaIn(kapitelId || 'root')}
      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 transition-colors"
    >
      <Plus size={16} />
      <span>Neues {themaLabel || 'Thema'}</span>
    </button>
  );

  // === WITH KAPITEL ===
  if (useKapitel) {
    // T27: Show prominent empty state when no Kapitels exist yet
    const showKapitelEmptyState = kapitel.length === 0;

    return (
      <div className="w-full h-full bg-white overflow-y-auto">
        <div className="border border-neutral-200 rounded-lg shadow-sm m-4 overflow-hidden">
          {/* T27: Prominent empty state inside card when no Kapitels */}
          {showKapitelEmptyState && !addingKapitel && (
            <div className="px-4 py-6 text-center border-b border-neutral-100">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                  <path d="M8 7h8M8 11h8M8 15h4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-neutral-700 mb-1">
                Starte mit einem {kapitelLabel || 'Kapitel'}
              </p>
              <p className="text-xs text-neutral-400 mb-4">
                {themaLabelPlural || 'Themen'} werden innerhalb von {kapitelLabel || 'Kapitel'}n gruppiert
              </p>
              <button
                onClick={() => setAddingKapitel(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-full hover:opacity-90 transition-colors"
              >
                <Plus size={16} />
                <span>Erstes {kapitelLabel || 'Kapitel'} erstellen</span>
              </button>
            </div>
          )}

          {kapitel.map(kap => {
            const kapitelThemen = themen.filter(t => t.kapitelId === kap.id);
            const isExpanded = expandedKapitel.has(kap.id);

            return (
              <div key={kap.id} className="border-b border-neutral-100 last:border-b-0">
                {/* Kapitel Header */}
                {/* T32 Bug 4b: Added color bar for Kapitel based on areaId */}
                <div
                  className="flex items-center justify-between px-3 py-2.5 bg-neutral-50 cursor-pointer group"
                  onClick={() => toggleKapitel(kap.id)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    {/* T32: Farbbalken für Kapitel */}
                    <span className={`w-1.5 h-6 rounded-full ${getBgColorForThema(kap.areaId)}`} />
                    <span className="text-sm font-semibold text-neutral-700">
                      {kap.name}
                    </span>
                    <span className="text-xs text-neutral-400">
                      ({kapitelThemen.length})
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteKapitel?.(kap.id);
                    }}
                    className="p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Kapitel löschen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Themen in Kapitel - T27: Indented under Kapitel */}
                {isExpanded && (
                  <div className="pl-4 border-l-2 border-neutral-100 ml-3">
                    {kapitelThemen.map(thema => renderThemaItem(thema))}

                    {/* Add Thema Input or Button */}
                    {addingThemaIn === kap.id
                      ? renderAddThemaInput(kap.id)
                      : renderAddThemaButton(kap.id)
                    }
                  </div>
                )}
              </div>
            );
          })}

          {/* T27: Removed "Ohne Kapitel" section - when useKapitel is true, themes must belong to a Kapitel */}

          {/* Add Kapitel - T27: Show input when adding, or button when kapitels exist */}
          {/* T32 Bug 4b: Show area selector when creating Kapitel with multiple areas */}
          {addingKapitel ? (
            <div className={`px-3 py-2 space-y-2 ${kapitel.length > 0 ? 'border-t border-neutral-100' : ''}`}>
              {/* T32: Fach-Auswahl für Kapitel (bei >1 Fach) */}
              {selectedAreas.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-neutral-400">Fach:</span>
                  {selectedAreas.map(area => (
                    <button
                      key={area.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()} // T32 FIX: Prevent input blur when clicking
                      onClick={() => setNewKapitelAreaId(area.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-full border transition-colors ${
                        (newKapitelAreaId || selectedAreas[0].id) === area.id
                          ? 'border-neutral-400 bg-neutral-100'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${area.color || 'bg-neutral-400'}`} />
                      <span className="truncate max-w-[80px]">{area.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={newKapitelName}
                onChange={(e) => setNewKapitelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddKapitel();
                  if (e.key === 'Escape') {
                    setAddingKapitel(false);
                    setNewKapitelName('');
                    setNewKapitelAreaId(null);
                  }
                }}
                onBlur={() => {
                  if (!newKapitelName.trim()) {
                    setAddingKapitel(false);
                    setNewKapitelAreaId(null);
                  }
                }}
                placeholder={`Neues ${kapitelLabel || 'Kapitel'}...`}
                className="w-full text-sm px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent"
                autoFocus
              />
            </div>
          ) : kapitel.length > 0 ? (
            // T27: Only show bottom button when kapitels already exist
            <button
              onClick={() => setAddingKapitel(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 transition-colors border-t border-neutral-100"
            >
              <Plus size={16} />
              <span>Neues {kapitelLabel || 'Kapitel'}</span>
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  // === WITHOUT KAPITEL (Flat List) ===
  return (
    <div className="w-full h-full bg-white overflow-y-auto">
      <div className="border border-neutral-200 rounded-lg shadow-sm m-4 overflow-hidden">
        {/* Themen List */}
        {themen.map(thema => renderThemaItem(thema))}

        {/* Add Thema Input or Button */}
        {addingThemaIn === 'root'
          ? renderAddThemaInput(null)
          : renderAddThemaButton(null)
        }
      </div>

      {/* Empty State */}
      {themen.length === 0 && addingThemaIn !== 'root' && (
        <div className="text-center py-8 px-4">
          <p className="text-sm text-neutral-400 mb-2">
            Noch keine {themaLabelPlural || 'Themen'} hinzugefügt
          </p>
          <p className="text-xs text-neutral-400">
            Klicke auf &quot;Neues {themaLabel || 'Thema'}&quot; um zu beginnen
          </p>
        </div>
      )}
    </div>
  );
};

export default ThemenNavigation;
