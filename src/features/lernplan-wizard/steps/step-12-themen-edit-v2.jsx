import { useState, useMemo, useEffect } from 'react';
import { useWizard } from '../context/wizard-context';
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  AlertTriangle,
  ChevronLeft,
  ArrowRight,
  GripVertical
} from 'lucide-react';
import { RECHTSGEBIET_LABELS, DEFAULT_SELECTION } from '../../../data/unterrechtsgebiete-data';
import { getColorForSubject } from '../../../utils/rechtsgebiet-colors';

/**
 * Step 12 v4: Themen & Aufgaben Editor - PW-027 Sidebar/Main Layout
 *
 * Layout:
 * - Level 1: URG Tabs in TWO ROWS (flex-wrap, no horizontal scroll)
 * - Level 2: Themen Sidebar (left) with drag handle, trash, add button at bottom
 * - Level 3: Aufgaben Main Area (right) with add button
 */

// ============== VALIDATION DIALOG ==============
const ValidationDialog = ({ isOpen, onClose, onProceed, incompleteUrgs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Unvollständige Unterrechtsgebiete
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-neutral-600 mb-4">
            Folgende Unterrechtsgebiete haben noch keine Themen:
          </p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {incompleteUrgs.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-neutral-900">{item.rgLabel}</span>
                  <span className="text-neutral-500"> → </span>
                  <span className="text-neutral-700">{item.urgName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-neutral-200 bg-neutral-50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors"
          >
            Bearbeiten
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Trotzdem weiter
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== URG TAB (Two Rows) ==============
const UrgTab = ({ urg, rgId, isActive, onClick, hasThemes }) => {
  const colorName = getColorForSubject(rgId);

  // Generate dynamic classes based on RG color
  const getTabClasses = () => {
    if (isActive) {
      return `bg-${colorName}-600 text-white border-${colorName}-600`;
    }
    if (hasThemes) {
      return `bg-${colorName}-50 text-${colorName}-700 border-${colorName}-200 hover:bg-${colorName}-100`;
    }
    return `bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100`;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
        flex items-center gap-1.5
        ${getTabClasses()}
      `}
    >
      <span className="truncate max-w-[120px]">{urg.name}</span>
      {hasThemes && !isActive && (
        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
      )}
    </button>
  );
};

// ============== THEMA SIDEBAR ITEM ==============
const ThemaSidebarItem = ({ thema, isActive, onClick, onDelete }) => {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all group
        ${isActive
          ? 'bg-neutral-900 text-white'
          : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
        }
      `}
    >
      {/* Drag Handle */}
      <div className={`flex-shrink-0 ${isActive ? 'text-neutral-400' : 'text-neutral-300'}`}>
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Thema Name */}
      <span className="flex-1 text-sm font-medium truncate">
        {thema.name}
      </span>

      {/* Delete Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={`
          p-1 rounded transition-colors flex-shrink-0
          ${isActive
            ? 'text-neutral-400 hover:text-white hover:bg-white/20'
            : 'text-neutral-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100'
          }
        `}
        title="Thema löschen"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

// ============== AUFGABE ITEM ==============
const AufgabeItem = ({ aufgabe, onToggle, onTogglePriority, onDelete }) => {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 bg-white rounded-lg border border-neutral-200 group hover:border-neutral-300 transition-colors">
      <label className="flex items-center cursor-pointer flex-1 min-w-0">
        <input
          type="checkbox"
          checked={aufgabe.completed || false}
          onChange={() => onToggle(aufgabe.id)}
          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 flex-shrink-0"
        />
        <span className={`ml-3 text-sm truncate ${aufgabe.completed ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
          {aufgabe.name || 'Aufgabe'}
        </span>
      </label>
      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          type="button"
          onClick={() => onTogglePriority(aufgabe.id, 1)}
          className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-colors ${
            aufgabe.priority >= 1
              ? 'bg-amber-100 text-amber-600'
              : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
          }`}
          title="Priorität 1"
        >
          !
        </button>
        <button
          type="button"
          onClick={() => onTogglePriority(aufgabe.id, 2)}
          className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-colors ${
            aufgabe.priority >= 2
              ? 'bg-red-100 text-red-600'
              : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
          }`}
          title="Priorität 2"
        >
          !
        </button>
      </div>
      <button
        type="button"
        onClick={() => onDelete(aufgabe.id)}
        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
        title="Aufgabe löschen"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

// ============== MAIN COMPONENT ==============
const Step12ThemenEditV2 = () => {
  const {
    selectedRechtsgebiete,
    unterrechtsgebieteDraft,
    themenDraft,
    updateWizardData,
    goToStep
  } = useWizard();

  // State for active selections
  const [activeUrgId, setActiveUrgId] = useState(null);
  const [activeThemeId, setActiveThemeId] = useState(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [incompleteUrgs, setIncompleteUrgs] = useState([]);

  // Input states
  const [newThemaName, setNewThemaName] = useState('');
  const [newAufgabeName, setNewAufgabeName] = useState('');

  // Build flat list of all URGs with their parent RG info
  const allUrgsFlat = useMemo(() => {
    const urgs = [];
    for (const rgId of selectedRechtsgebiete) {
      const rgUrgs = unterrechtsgebieteDraft[rgId] || [];
      for (const urg of rgUrgs) {
        urgs.push({
          ...urg,
          rgId,
          rgLabel: RECHTSGEBIET_LABELS[rgId] || rgId
        });
      }
    }
    return urgs;
  }, [selectedRechtsgebiete, unterrechtsgebieteDraft]);

  // Initialize default URGs if missing
  useEffect(() => {
    let needsUpdate = false;
    const updates = {};

    for (const rgId of selectedRechtsgebiete) {
      if (!unterrechtsgebieteDraft[rgId]) {
        updates[rgId] = DEFAULT_SELECTION[rgId] || [];
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      updateWizardData({
        unterrechtsgebieteDraft: {
          ...unterrechtsgebieteDraft,
          ...updates
        }
      });
    }
  }, [selectedRechtsgebiete, unterrechtsgebieteDraft, updateWizardData]);

  // Initialize active URG on mount or when URGs change
  useEffect(() => {
    if (allUrgsFlat.length > 0 && !activeUrgId) {
      setActiveUrgId(allUrgsFlat[0].id);
    } else if (allUrgsFlat.length > 0 && !allUrgsFlat.find(u => u.id === activeUrgId)) {
      setActiveUrgId(allUrgsFlat[0].id);
    }
  }, [allUrgsFlat, activeUrgId]);

  // Get active URG and its themes
  const activeUrg = allUrgsFlat.find(u => u.id === activeUrgId);
  const activeUrgThemes = activeUrgId ? (themenDraft[activeUrgId] || []) : [];

  // Initialize active theme when URG changes
  useEffect(() => {
    if (activeUrgThemes.length > 0) {
      if (!activeThemeId || !activeUrgThemes.find(t => t.id === activeThemeId)) {
        setActiveThemeId(activeUrgThemes[0].id);
      }
    } else {
      setActiveThemeId(null);
    }
  }, [activeUrgId, activeUrgThemes, activeThemeId]);

  // Get active theme and its aufgaben
  const activeTheme = activeUrgThemes.find(t => t.id === activeThemeId);
  const activeAufgaben = activeTheme?.aufgaben || [];

  // Check if URG has themes
  const urgHasThemes = (urgId) => {
    return (themenDraft[urgId] || []).length > 0;
  };

  // Find incomplete URGs for validation
  const findIncompleteUrgs = () => {
    const incomplete = [];
    for (const urg of allUrgsFlat) {
      const themes = themenDraft[urg.id] || [];
      if (themes.length === 0) {
        incomplete.push({
          rgId: urg.rgId,
          rgLabel: urg.rgLabel,
          urgId: urg.id,
          urgName: urg.name
        });
      }
    }
    return incomplete;
  };

  // Navigation handlers
  const handleWeiter = () => {
    const incomplete = findIncompleteUrgs();
    if (incomplete.length > 0) {
      setIncompleteUrgs(incomplete);
      setShowValidationDialog(true);
    } else {
      proceedToNextStep();
    }
  };

  const handleZurueck = () => {
    goToStep(11);
  };

  const proceedToNextStep = () => {
    setShowValidationDialog(false);
    updateWizardData({ currentRechtsgebietIndex: 0 });
    goToStep(14);
  };

  // Theme operations
  const handleAddTheme = () => {
    if (!activeUrgId || !newThemaName.trim()) return;

    const newTheme = {
      id: `thema-${Date.now()}`,
      name: newThemaName.trim(),
      aufgaben: []
    };

    updateWizardData(prev => {
      const currentThemes = prev.themenDraft[activeUrgId] || [];
      return {
        themenDraft: {
          ...prev.themenDraft,
          [activeUrgId]: [...currentThemes, newTheme]
        }
      };
    });

    setNewThemaName('');
    setActiveThemeId(newTheme.id);
  };

  const handleDeleteTheme = (themeId) => {
    if (!activeUrgId) return;

    updateWizardData(prev => {
      const currentThemes = prev.themenDraft[activeUrgId] || [];
      const newThemes = currentThemes.filter(t => t.id !== themeId);
      return {
        themenDraft: {
          ...prev.themenDraft,
          [activeUrgId]: newThemes
        }
      };
    });

    if (activeThemeId === themeId) {
      const remaining = activeUrgThemes.filter(t => t.id !== themeId);
      setActiveThemeId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Aufgabe operations
  const handleAddAufgabe = () => {
    if (!activeUrgId || !activeThemeId || !newAufgabeName.trim()) return;

    const newAufgabe = {
      id: `aufgabe-${Date.now()}`,
      name: newAufgabeName.trim(),
      completed: false,
      priority: 0
    };

    updateWizardData(prev => {
      const currentThemes = prev.themenDraft[activeUrgId] || [];
      return {
        themenDraft: {
          ...prev.themenDraft,
          [activeUrgId]: currentThemes.map(t =>
            t.id === activeThemeId
              ? { ...t, aufgaben: [...(t.aufgaben || []), newAufgabe] }
              : t
          )
        }
      };
    });

    setNewAufgabeName('');
  };

  const handleToggleAufgabe = (aufgabeId) => {
    if (!activeUrgId || !activeThemeId) return;

    updateWizardData(prev => {
      const currentThemes = prev.themenDraft[activeUrgId] || [];
      return {
        themenDraft: {
          ...prev.themenDraft,
          [activeUrgId]: currentThemes.map(t =>
            t.id === activeThemeId
              ? {
                  ...t,
                  aufgaben: (t.aufgaben || []).map(a =>
                    a.id === aufgabeId ? { ...a, completed: !a.completed } : a
                  )
                }
              : t
          )
        }
      };
    });
  };

  const handleToggleAufgabePriority = (aufgabeId, level) => {
    if (!activeUrgId || !activeThemeId) return;

    updateWizardData(prev => {
      const currentThemes = prev.themenDraft[activeUrgId] || [];
      return {
        themenDraft: {
          ...prev.themenDraft,
          [activeUrgId]: currentThemes.map(t =>
            t.id === activeThemeId
              ? {
                  ...t,
                  aufgaben: (t.aufgaben || []).map(a =>
                    a.id === aufgabeId
                      ? { ...a, priority: a.priority === level ? level - 1 : level }
                      : a
                  )
                }
              : t
          )
        }
      };
    });
  };

  const handleDeleteAufgabe = (aufgabeId) => {
    if (!activeUrgId || !activeThemeId) return;

    updateWizardData(prev => {
      const currentThemes = prev.themenDraft[activeUrgId] || [];
      return {
        themenDraft: {
          ...prev.themenDraft,
          [activeUrgId]: currentThemes.map(t =>
            t.id === activeThemeId
              ? { ...t, aufgaben: (t.aufgaben || []).filter(a => a.id !== aufgabeId) }
              : t
          )
        }
      };
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <ValidationDialog
        isOpen={showValidationDialog}
        onClose={() => setShowValidationDialog(false)}
        onProceed={proceedToNextStep}
        incompleteUrgs={incompleteUrgs}
      />

      {/* ============== HEADER ============== */}
      <div className="flex-shrink-0 mb-4">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-extralight text-neutral-900 mb-2">
            Füge den Unterrechtsgebieten Themen hinzu.
          </h1>
          <p className="text-sm text-neutral-400">
            Wähle ein Unterrechtsgebiet, erstelle Themen und füge Aufgaben hinzu.
          </p>
        </div>
      </div>

      {/* ============== URG TABS (Two Rows) ============== */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {allUrgsFlat.length > 0 ? (
            allUrgsFlat.map((urg) => (
              <UrgTab
                key={urg.id}
                urg={urg}
                rgId={urg.rgId}
                isActive={urg.id === activeUrgId}
                onClick={() => setActiveUrgId(urg.id)}
                hasThemes={urgHasThemes(urg.id)}
              />
            ))
          ) : (
            <div className="text-sm text-neutral-400 py-2">
              Keine Unterrechtsgebiete vorhanden.
            </div>
          )}
        </div>
      </div>

      {/* ============== SIDEBAR + MAIN LAYOUT ============== */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">

        {/* THEMEN SIDEBAR (Left) */}
        <div className="w-56 flex-shrink-0 flex flex-col bg-neutral-50 rounded-lg p-3">
          {activeUrg ? (
            <>
              {/* Sidebar Header */}
              <div className="mb-3">
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Themen
                </h3>
              </div>

              {/* Themen List */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {activeUrgThemes.length > 0 ? (
                  activeUrgThemes.map((thema) => (
                    <ThemaSidebarItem
                      key={thema.id}
                      thema={thema}
                      isActive={thema.id === activeThemeId}
                      onClick={() => setActiveThemeId(thema.id)}
                      onDelete={() => handleDeleteTheme(thema.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-neutral-400">
                      Noch keine Themen
                    </p>
                  </div>
                )}
              </div>

              {/* Add Theme Button */}
              <div className="mt-3 pt-3 border-t border-neutral-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newThemaName}
                    onChange={(e) => setNewThemaName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTheme()}
                    placeholder="Neues Thema..."
                    className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddTheme}
                    disabled={!newThemaName.trim()}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-neutral-400 text-center">
                Wähle ein Unterrechtsgebiet
              </p>
            </div>
          )}
        </div>

        {/* AUFGABEN MAIN AREA (Right) */}
        <div className="flex-1 flex flex-col min-h-0 bg-neutral-50 rounded-lg p-4">
          {activeTheme ? (
            <>
              {/* Main Header */}
              <div className="flex-shrink-0 mb-4">
                <h2 className="text-lg font-medium text-neutral-900">
                  {activeUrg?.name}
                </h2>
                <p className="text-sm text-neutral-500">
                  Thema: {activeTheme.name}
                </p>
              </div>

              {/* Aufgaben List */}
              <div className="flex-1 overflow-y-auto">
                {activeAufgaben.length > 0 ? (
                  <div className="space-y-2">
                    {activeAufgaben.map((aufgabe) => (
                      <AufgabeItem
                        key={aufgabe.id}
                        aufgabe={aufgabe}
                        onToggle={handleToggleAufgabe}
                        onTogglePriority={handleToggleAufgabePriority}
                        onDelete={handleDeleteAufgabe}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white rounded-lg border border-dashed border-neutral-200">
                    <p className="text-neutral-400 text-sm">
                      Noch keine Aufgaben für dieses Thema.
                    </p>
                  </div>
                )}
              </div>

              {/* Add Aufgabe */}
              <div className="flex-shrink-0 mt-4 pt-4 border-t border-neutral-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAufgabeName}
                    onChange={(e) => setNewAufgabeName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAufgabe()}
                    placeholder="Neue Aufgabe..."
                    className="flex-1 px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddAufgabe}
                    disabled={!newAufgabeName.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Neue Aufgabe
                  </button>
                </div>
              </div>
            </>
          ) : activeUrg ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-neutral-500 text-sm mb-2">
                  Wähle ein Thema aus der Sidebar
                </p>
                <p className="text-neutral-400 text-xs">
                  oder erstelle ein neues Thema
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-neutral-400 text-sm">
                Wähle ein Unterrechtsgebiet aus
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ============== FOOTER ============== */}
      <div className="flex-shrink-0 mt-4 pt-4 border-t border-neutral-200">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleZurueck}
            className="flex items-center gap-2 px-5 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Zurück
          </button>

          <button
            type="button"
            onClick={handleWeiter}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Weiter
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step12ThemenEditV2;
