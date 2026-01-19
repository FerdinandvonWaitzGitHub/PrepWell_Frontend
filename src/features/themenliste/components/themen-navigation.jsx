import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';

/**
 * ThemenNavigation - Left sidebar with accordion navigation
 * Supports: Rechtsgebiet → Untergebiet → (Kapitel) → Thema
 * T23 Phase 3: Auto-expand and visual hints for new items
 */
const ThemenNavigation = ({
  rechtsgebiete = [],
  selectedThemaId,
  onSelectThema,
  onAddRechtsgebiet,
  onAddUntergebiet,
  onAddKapitel,
  onAddThema,
  onDeleteThema,
  onDeleteRechtsgebiet,
  onDeleteUnterrechtsgebiet,
  onDeleteKapitel,
  showKapitelLevel = false,
  hierarchyLabels,
  rechtsgebietLabels,
  rechtsgebietColors,
  unterrechtsgebieteData,
}) => {
  // Expanded state for each level
  const [expandedRg, setExpandedRg] = useState(new Set());
  const [expandedUrg, setExpandedUrg] = useState(new Set());
  const [expandedKap, setExpandedKap] = useState(new Set());

  // Dropdown states for adding new items
  const [showRgDropdown, setShowRgDropdown] = useState(false);
  const [showUrgDropdown, setShowUrgDropdown] = useState(null); // rgId
  const [addingThemaIn, setAddingThemaIn] = useState(null); // { rgId, urgId, kapitelId? }
  const [addingKapitelIn, setAddingKapitelIn] = useState(null); // { rgId, urgId }
  const [newThemaName, setNewThemaName] = useState('');
  const [newKapitelName, setNewKapitelName] = useState('');

  // T23 Phase 3: Track newly created items for visual highlight
  const [highlightedRg, setHighlightedRg] = useState(null);
  const [highlightedUrg, setHighlightedUrg] = useState(null);

  // Clear highlights after 3 seconds
  useEffect(() => {
    if (highlightedRg) {
      const timer = setTimeout(() => setHighlightedRg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedRg]);

  useEffect(() => {
    if (highlightedUrg) {
      const timer = setTimeout(() => setHighlightedUrg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedUrg]);

  const toggleRg = (rgId) => {
    setExpandedRg(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rgId)) newSet.delete(rgId);
      else newSet.add(rgId);
      return newSet;
    });
  };

  const toggleUrg = (urgId) => {
    setExpandedUrg(prev => {
      const newSet = new Set(prev);
      if (newSet.has(urgId)) newSet.delete(urgId);
      else newSet.add(urgId);
      return newSet;
    });
  };

  const toggleKap = (kapId) => {
    setExpandedKap(prev => {
      const newSet = new Set(prev);
      if (newSet.has(kapId)) newSet.delete(kapId);
      else newSet.add(kapId);
      return newSet;
    });
  };

  // Get available Rechtsgebiete (not yet added)
  const availableRechtsgebiete = Object.keys(rechtsgebietLabels).filter(
    rgId => !rechtsgebiete.find(rg => rg.rechtsgebietId === rgId)
  );

  // Get available Unterrechtsgebiete for a Rechtsgebiet
  const getAvailableUntergebiete = (rgId, rg) => {
    const allUrg = unterrechtsgebieteData[rgId] || [];
    const usedUrgIds = (rg.unterrechtsgebiete || []).map(u => u.unterrechtsgebietId);
    return allUrg.filter(u => !usedUrgIds.includes(u.id));
  };

  // Handle adding new Thema
  const handleAddThema = () => {
    if (!addingThemaIn || !newThemaName.trim()) return;
    onAddThema(addingThemaIn.rgId, addingThemaIn.urgId, addingThemaIn.kapitelId, newThemaName.trim());
    setNewThemaName('');
    setAddingThemaIn(null);
  };

  // Handle adding new Kapitel
  const handleAddKapitel = () => {
    if (!addingKapitelIn || !newKapitelName.trim()) return;
    // T23 Phase 3: Auto-expand and show Thema input
    const newKapitelId = onAddKapitel(addingKapitelIn.rgId, addingKapitelIn.urgId, newKapitelName.trim());
    const { rgId, urgId } = addingKapitelIn;
    setNewKapitelName('');
    setAddingKapitelIn(null);
    if (newKapitelId) {
      // Auto-expand the new Kapitel
      setExpandedKap(prev => new Set([...prev, newKapitelId]));
      // Show Thema input
      setAddingThemaIn({ rgId, urgId, kapitelId: newKapitelId });
    }
  };

  // Get color class for rechtsgebiet
  const getColorClass = (rgId) => {
    const color = rechtsgebietColors[rgId];
    if (color === 'bg-green-500') return 'border-l-green-500';
    if (color === 'bg-blue-500') return 'border-l-blue-500';
    if (color === 'bg-red-500') return 'border-l-red-500';
    if (color === 'bg-purple-500') return 'border-l-purple-500';
    return 'border-l-neutral-400';
  };

  return (
    <div className="w-full h-full border-r border-neutral-200 bg-white overflow-y-auto">
      <div className="p-4">
        {/* Rechtsgebiete List */}
        {rechtsgebiete.map(rg => (
          <div key={rg.id} className={`mb-2 border-l-2 ${getColorClass(rg.rechtsgebietId)}`}>
            {/* Rechtsgebiet Header */}
            <div
              className={`flex items-center justify-between px-3 py-2 hover:bg-neutral-50 cursor-pointer rounded-r-lg group transition-colors ${
                highlightedRg === rg.id ? 'bg-blue-50 ring-2 ring-blue-200' : ''
              }`}
              onClick={() => toggleRg(rg.id)}
            >
              <div className="flex items-center gap-2">
                {expandedRg.has(rg.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="text-sm font-medium text-neutral-900">
                  {rechtsgebietLabels[rg.rechtsgebietId] || rg.rechtsgebietId}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUrgDropdown(showUrgDropdown === rg.id ? null : rg.id);
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"
                  title={`${hierarchyLabels?.level2 || 'Untergebiet'} hinzufügen`}
                >
                  <Plus size={14} />
                </button>
                {/* T23: Delete Rechtsgebiet */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRechtsgebiet?.(rg.id);
                  }}
                  className="p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title={`${hierarchyLabels?.level1 || 'Rechtsgebiet'} löschen`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Untergebiet Dropdown */}
            {showUrgDropdown === rg.id && (
              <div className="ml-6 mr-2 mb-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="text-xs font-medium text-neutral-500 mb-2">
                  {hierarchyLabels?.level2 || 'Untergebiet'} hinzufügen:
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {getAvailableUntergebiete(rg.rechtsgebietId, rg).map(urg => (
                    <button
                      key={urg.id}
                      onClick={() => {
                        // T23 Phase 3: Auto-expand and show next level input
                        const newUrgId = onAddUntergebiet(rg.id, urg.id, urg.name);
                        setShowUrgDropdown(null);
                        if (newUrgId) {
                          // Auto-expand the new Untergebiet
                          setExpandedUrg(prev => new Set([...prev, newUrgId]));
                          // Show add input for next level
                          if (showKapitelLevel) {
                            setAddingKapitelIn({ rgId: rg.id, urgId: newUrgId });
                          } else {
                            setAddingThemaIn({ rgId: rg.id, urgId: newUrgId });
                          }
                          // Highlight the new Untergebiet
                          setHighlightedUrg(newUrgId);
                        }
                      }}
                      className="w-full text-left px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 rounded"
                    >
                      {urg.name}
                    </button>
                  ))}
                  {getAvailableUntergebiete(rg.rechtsgebietId, rg).length === 0 && (
                    <p className="text-xs text-neutral-400 px-2">Alle hinzugefügt</p>
                  )}
                </div>
              </div>
            )}

            {/* Unterrechtsgebiete */}
            {expandedRg.has(rg.id) && (rg.unterrechtsgebiete || []).map(urg => (
              <div key={urg.id} className="ml-4">
                {/* Untergebiet Header */}
                <div
                  className={`flex items-center justify-between px-3 py-1.5 hover:bg-neutral-50 cursor-pointer rounded-lg group transition-colors ${
                    highlightedUrg === urg.id ? 'bg-blue-50 ring-2 ring-blue-200' : ''
                  }`}
                  onClick={() => toggleUrg(urg.id)}
                >
                  <div className="flex items-center gap-2">
                    {(showKapitelLevel ? (urg.kapitel || []).length > 0 : (urg.themen || []).length > 0) ? (
                      expandedUrg.has(urg.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : (
                      <div className="w-3.5" />
                    )}
                    <span className="text-sm text-neutral-700">{urg.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (showKapitelLevel) {
                          setAddingKapitelIn({ rgId: rg.id, urgId: urg.id });
                        } else {
                          setAddingThemaIn({ rgId: rg.id, urgId: urg.id });
                        }
                      }}
                      className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"
                      title={showKapitelLevel ? `${hierarchyLabels?.level3 || 'Kapitel'} hinzufügen` : `${hierarchyLabels?.level4 || 'Thema'} hinzufügen`}
                    >
                      <Plus size={12} />
                    </button>
                    {/* T23: Delete Unterrechtsgebiet */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteUnterrechtsgebiet?.(urg.id, rg.id);
                      }}
                      className="p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title={`${hierarchyLabels?.level2 || 'Untergebiet'} löschen`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Kapitel Level (Jura only) */}
                {showKapitelLevel && expandedUrg.has(urg.id) && (
                  <>
                    {(urg.kapitel || []).map(kap => (
                      <div key={kap.id} className="ml-4">
                        {/* Kapitel Header */}
                        <div
                          className="flex items-center justify-between px-3 py-1.5 hover:bg-neutral-50 cursor-pointer rounded-lg group"
                          onClick={() => toggleKap(kap.id)}
                        >
                          <div className="flex items-center gap-2">
                            {(kap.themen || []).length > 0 ? (
                              expandedKap.has(kap.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                            ) : (
                              <div className="w-3" />
                            )}
                            <span className="text-xs text-neutral-600">{kap.title}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddingThemaIn({ rgId: rg.id, urgId: urg.id, kapitelId: kap.id });
                              }}
                              className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"
                              title={`${hierarchyLabels?.level4 || 'Thema'} hinzufügen`}
                            >
                              <Plus size={10} />
                            </button>
                            {/* T23: Delete Kapitel */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteKapitel?.(kap.id, rg.id, urg.id);
                              }}
                              className="p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title={`${hierarchyLabels?.level3 || 'Kapitel'} löschen`}
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>

                        {/* Themen in Kapitel */}
                        {expandedKap.has(kap.id) && (kap.themen || []).map(thema => (
                          <div
                            key={thema.id}
                            className={`ml-4 flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer ${
                              selectedThemaId === thema.id
                                ? 'bg-neutral-100 border-l-2 border-neutral-900'
                                : 'hover:bg-neutral-50'
                            }`}
                            onClick={() => onSelectThema(thema.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-neutral-800 truncate">{thema.name}</div>
                              {thema.description && (
                                <div className="text-xs text-neutral-400 truncate">{thema.description}</div>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteThema(thema.id, { rgId: rg.id, urgId: urg.id, kapitelId: kap.id });
                              }}
                              className="p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}

                        {/* Add Thema in Kapitel Input */}
                        {addingThemaIn?.kapitelId === kap.id && (
                          <div className="ml-4 px-3 py-2">
                            <input
                              type="text"
                              value={newThemaName}
                              onChange={(e) => setNewThemaName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddThema();
                                if (e.key === 'Escape') setAddingThemaIn(null);
                              }}
                              placeholder={`Neues ${hierarchyLabels?.level4 || 'Thema'}...`}
                              className="w-full text-xs px-2 py-1 border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
                              autoFocus
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add Kapitel Input */}
                    {addingKapitelIn?.urgId === urg.id && (
                      <div className="ml-4 px-3 py-2">
                        <input
                          type="text"
                          value={newKapitelName}
                          onChange={(e) => setNewKapitelName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddKapitel();
                            if (e.key === 'Escape') setAddingKapitelIn(null);
                          }}
                          placeholder={`Neues ${hierarchyLabels?.level3 || 'Kapitel'}...`}
                          className="w-full text-xs px-2 py-1 border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
                          autoFocus
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Themen (non-Jura) */}
                {!showKapitelLevel && expandedUrg.has(urg.id) && (
                  <>
                    {(urg.themen || []).map(thema => (
                      <div
                        key={thema.id}
                        className={`ml-4 flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer group ${
                          selectedThemaId === thema.id
                            ? 'bg-neutral-100 border-l-2 border-neutral-900'
                            : 'hover:bg-neutral-50'
                        }`}
                        onClick={() => onSelectThema(thema.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-neutral-800 truncate">{thema.name}</div>
                          {thema.description && (
                            <div className="text-xs text-neutral-400 truncate">{thema.description}</div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteThema(thema.id, { rgId: rg.id, urgId: urg.id });
                          }}
                          className="p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}

                    {/* Add Thema Input (non-Jura) */}
                    {addingThemaIn?.urgId === urg.id && !addingThemaIn?.kapitelId && (
                      <div className="ml-4 px-3 py-2">
                        <input
                          type="text"
                          value={newThemaName}
                          onChange={(e) => setNewThemaName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddThema();
                            if (e.key === 'Escape') setAddingThemaIn(null);
                          }}
                          placeholder={`Neues ${hierarchyLabels?.level4 || 'Thema'}...`}
                          className="w-full text-xs px-2 py-1 border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
                          autoFocus
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Add Rechtsgebiet Button */}
        <div className="mt-4">
          {showRgDropdown ? (
            <div className="p-2 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="text-xs font-medium text-neutral-500 mb-2">
                {hierarchyLabels?.level1 || 'Rechtsgebiet'} hinzufügen:
              </div>
              <div className="space-y-1">
                {availableRechtsgebiete.map(rgId => (
                  <button
                    key={rgId}
                    onClick={() => {
                      // T23 Phase 3: Auto-expand and show Untergebiet dropdown
                      const newRg = onAddRechtsgebiet(rgId);
                      setShowRgDropdown(false);
                      if (newRg?.id) {
                        // Auto-expand the new Rechtsgebiet
                        setExpandedRg(prev => new Set([...prev, newRg.id]));
                        // Show the Untergebiet selection dropdown
                        setShowUrgDropdown(newRg.id);
                        // Highlight the new Rechtsgebiet
                        setHighlightedRg(newRg.id);
                      }
                    }}
                    className="w-full text-left px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 rounded"
                  >
                    {rechtsgebietLabels[rgId]}
                  </button>
                ))}
                {availableRechtsgebiete.length === 0 && (
                  <p className="text-xs text-neutral-400 px-2">Alle hinzugefügt</p>
                )}
              </div>
              <button
                onClick={() => setShowRgDropdown(false)}
                className="mt-2 w-full text-xs text-neutral-500 hover:text-neutral-700"
              >
                Abbrechen
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowRgDropdown(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg w-full"
            >
              <Plus size={16} />
              <span>Neues {hierarchyLabels?.level1 || 'Rechtsgebiet'}</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {rechtsgebiete.length === 0 && !showRgDropdown && (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-400 mb-2">
              Noch keine {hierarchyLabels?.level1Plural || 'Rechtsgebiete'} hinzugefügt
            </p>
            <p className="text-xs text-neutral-400">
              Klicke auf &quot;Neues {hierarchyLabels?.level1 || 'Rechtsgebiet'}&quot; um zu beginnen
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemenNavigation;
