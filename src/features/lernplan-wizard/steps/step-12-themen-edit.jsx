import { useState, useMemo, useEffect } from 'react';
import { useWizard } from '../context/wizard-context';
import {
  Plus,
  Minus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
  AlertTriangle
} from 'lucide-react';
import { RECHTSGEBIET_LABELS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 12: Themen & Aufgaben Editor
 *
 * Navigation Logic:
 * - Always starts at first RG (index 0)
 * - "Weiter" button navigates to NEXT RG (not next step)
 * - Only when on LAST RG and clicking "Weiter": validate all URGs
 * - Show popup dialog if any URGs are missing themes
 * - "Zurück" button goes to previous RG or Step 11
 */

/**
 * Validation Dialog Component
 */
const ValidationDialog = ({ isOpen, onClose, onProceed, incompleteUrgs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
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

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-neutral-600 mb-4">
            Folgende Unterrechtsgebiete haben noch keine Themen:
          </p>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {incompleteUrgs.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg"
              >
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

        {/* Footer */}
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

/**
 * URG Tab Component
 */
const UrgTab = ({ urg, isActive, onClick, themenCount }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
        ${isActive
          ? 'bg-neutral-800 text-white'
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }
      `}
    >
      {urg.name}
      {themenCount > 0 && (
        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
          isActive ? 'bg-white/20' : 'bg-neutral-300'
        }`}>
          {themenCount}
        </span>
      )}
    </button>
  );
};

/**
 * Aufgabe (Task) Item Component
 */
const AufgabeItem = ({ aufgabe, onToggle, onTogglePriority, onDelete }) => {
  return (
    <div className="flex items-center gap-3 py-2 group">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={aufgabe.completed || false}
          onChange={() => onToggle(aufgabe.id)}
          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        <span className={`ml-2 text-sm ${aufgabe.completed ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
          {aufgabe.name || 'Aufgabe'}
        </span>
      </label>

      <div className="flex-1" />

      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
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
        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
        title="Aufgabe löschen"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Theme Card Component
 */
const ThemaCard = ({
  thema,
  onAddAufgabe,
  onToggleAufgabe,
  onToggleAufgabePriority,
  onDeleteAufgabe,
  onDeleteThema
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newAufgabeName, setNewAufgabeName] = useState('');

  const handleAddAufgabe = () => {
    if (newAufgabeName.trim()) {
      onAddAufgabe({
        id: `aufgabe-${Date.now()}`,
        name: newAufgabeName.trim(),
        completed: false,
        priority: 0
      });
      setNewAufgabeName('');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-neutral-100">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-neutral-400 hover:text-neutral-600 rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>

        <h4 className="flex-1 text-base font-medium text-neutral-900">
          {thema.name}
        </h4>

        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs rounded-full">
          {thema.aufgaben?.length || 0} Aufgaben
        </span>

        <button
          type="button"
          onClick={onDeleteThema}
          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Thema löschen"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="p-4">
          <div className="space-y-1">
            {thema.aufgaben && thema.aufgaben.length > 0 ? (
              thema.aufgaben.map((aufgabe) => (
                <AufgabeItem
                  key={aufgabe.id}
                  aufgabe={aufgabe}
                  onToggle={onToggleAufgabe}
                  onTogglePriority={onToggleAufgabePriority}
                  onDelete={onDeleteAufgabe}
                />
              ))
            ) : (
              <p className="text-sm text-neutral-400 italic py-2">
                Noch keine Aufgaben hinzugefügt.
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={newAufgabeName}
              onChange={(e) => setNewAufgabeName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddAufgabe()}
              placeholder="Neue Aufgabe..."
              className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddAufgabe}
              disabled={!newAufgabeName.trim()}
              className="flex items-center gap-1 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Neue Aufgabe
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Step 12 Component
 */
const Step12ThemenEdit = () => {
  const {
    selectedRechtsgebiete,
    unterrechtsgebieteDraft,
    themenDraft,
    updateWizardData,
    goToStep,
    nextStep
  } = useWizard();

  // LOCAL state for RG navigation within Step 12
  const [localRgIndex, setLocalRgIndex] = useState(0);
  const [activeUrgIndex, setActiveUrgIndex] = useState(0);
  const [newThemaName, setNewThemaName] = useState('');
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [incompleteUrgs, setIncompleteUrgs] = useState([]);

  // Reset to first RG when entering Step 12
  useEffect(() => {
    setLocalRgIndex(0);
    setActiveUrgIndex(0);
  }, []);

  // Current Rechtsgebiet (from local state, NOT wizard context)
  const currentRgId = selectedRechtsgebiete[localRgIndex] || selectedRechtsgebiete[0];
  const currentRgLabel = RECHTSGEBIET_LABELS[currentRgId] || currentRgId;

  // URGs for current RG
  const currentUrgs = useMemo(() => {
    return unterrechtsgebieteDraft[currentRgId] || [];
  }, [unterrechtsgebieteDraft, currentRgId]);

  const activeUrg = currentUrgs[activeUrgIndex];
  const activeUrgThemen = activeUrg ? (themenDraft[activeUrg.id] || []) : [];

  // Calculate theme counts per URG
  const themenCountsPerUrg = useMemo(() => {
    const counts = {};
    for (const urg of currentUrgs) {
      counts[urg.id] = (themenDraft[urg.id] || []).length;
    }
    return counts;
  }, [currentUrgs, themenDraft]);

  // Calculate theme counts per RG
  const themenCountsPerRg = useMemo(() => {
    const counts = {};
    for (const rgId of selectedRechtsgebiete) {
      let count = 0;
      const urgs = unterrechtsgebieteDraft[rgId] || [];
      for (const urg of urgs) {
        count += (themenDraft[urg.id] || []).length;
      }
      counts[rgId] = count;
    }
    return counts;
  }, [selectedRechtsgebiete, unterrechtsgebieteDraft, themenDraft]);

  // Reset URG index when RG changes
  useEffect(() => {
    setActiveUrgIndex(0);
  }, [currentRgId]);

  // Find all incomplete URGs (no themes)
  const findIncompleteUrgs = () => {
    const incomplete = [];
    for (const rgId of selectedRechtsgebiete) {
      const rgLabel = RECHTSGEBIET_LABELS[rgId] || rgId;
      const urgs = unterrechtsgebieteDraft[rgId] || [];
      for (const urg of urgs) {
        const themes = themenDraft[urg.id] || [];
        if (themes.length === 0) {
          incomplete.push({
            rgId,
            rgLabel,
            urgId: urg.id,
            urgName: urg.name
          });
        }
      }
    }
    return incomplete;
  };

  // === Custom Navigation Handlers ===

  // Handle "Weiter" button
  const handleWeiter = () => {
    const isLastRg = localRgIndex === selectedRechtsgebiete.length - 1;

    if (isLastRg) {
      // On last RG: validate all URGs
      const incomplete = findIncompleteUrgs();
      if (incomplete.length > 0) {
        setIncompleteUrgs(incomplete);
        setShowValidationDialog(true);
      } else {
        // All complete, proceed to next step
        proceedToNextStep();
      }
    } else {
      // Not last RG: go to next RG
      setLocalRgIndex(prev => prev + 1);
    }
  };

  // Handle "Zurück" button
  const handleZurueck = () => {
    if (localRgIndex > 0) {
      // Go to previous RG
      setLocalRgIndex(prev => prev - 1);
    } else {
      // On first RG: go to Step 11
      goToStep(11);
    }
  };

  // Proceed to next step (Step 14, skipping Step 13)
  const proceedToNextStep = () => {
    setShowValidationDialog(false);
    // Update wizard context index before leaving
    updateWizardData({ currentRechtsgebietIndex: 0 });
    // Use nextStep which handles the skip to Step 14
    nextStep();
  };

  // === Theme Operations ===
  const handleAddThema = () => {
    if (!activeUrg || !newThemaName.trim()) return;
    const currentThemen = themenDraft[activeUrg.id] || [];
    const newThema = {
      id: `thema-${Date.now()}`,
      name: newThemaName.trim(),
      aufgaben: []
    };
    updateWizardData({
      themenDraft: {
        ...themenDraft,
        [activeUrg.id]: [...currentThemen, newThema]
      }
    });
    setNewThemaName('');
  };

  const handleDeleteThema = (themaId) => {
    if (!activeUrg) return;
    const currentThemen = themenDraft[activeUrg.id] || [];
    updateWizardData({
      themenDraft: {
        ...themenDraft,
        [activeUrg.id]: currentThemen.filter(t => t.id !== themaId)
      }
    });
  };

  // === Aufgabe Operations ===
  const handleAddAufgabe = (themaId, aufgabe) => {
    if (!activeUrg) return;
    const currentThemen = themenDraft[activeUrg.id] || [];
    updateWizardData({
      themenDraft: {
        ...themenDraft,
        [activeUrg.id]: currentThemen.map(t =>
          t.id === themaId
            ? { ...t, aufgaben: [...(t.aufgaben || []), aufgabe] }
            : t
        )
      }
    });
  };

  const handleToggleAufgabe = (themaId, aufgabeId) => {
    if (!activeUrg) return;
    const currentThemen = themenDraft[activeUrg.id] || [];
    updateWizardData({
      themenDraft: {
        ...themenDraft,
        [activeUrg.id]: currentThemen.map(t =>
          t.id === themaId
            ? {
                ...t,
                aufgaben: (t.aufgaben || []).map(a =>
                  a.id === aufgabeId ? { ...a, completed: !a.completed } : a
                )
              }
            : t
        )
      }
    });
  };

  const handleToggleAufgabePriority = (themaId, aufgabeId, level) => {
    if (!activeUrg) return;
    const currentThemen = themenDraft[activeUrg.id] || [];
    updateWizardData({
      themenDraft: {
        ...themenDraft,
        [activeUrg.id]: currentThemen.map(t =>
          t.id === themaId
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
    });
  };

  const handleDeleteAufgabe = (themaId, aufgabeId) => {
    if (!activeUrg) return;
    const currentThemen = themenDraft[activeUrg.id] || [];
    updateWizardData({
      themenDraft: {
        ...themenDraft,
        [activeUrg.id]: currentThemen.map(t =>
          t.id === themaId
            ? { ...t, aufgaben: (t.aufgaben || []).filter(a => a.id !== aufgabeId) }
            : t
        )
      }
    });
  };

  // Progress display
  const rgProgress = localRgIndex + 1;
  const rgTotal = selectedRechtsgebiete.length;
  const isLastRg = localRgIndex === selectedRechtsgebiete.length - 1;

  return (
    <div className="flex flex-col h-full">
      {/* Validation Dialog */}
      <ValidationDialog
        isOpen={showValidationDialog}
        onClose={() => setShowValidationDialog(false)}
        onProceed={proceedToNextStep}
        incompleteUrgs={incompleteUrgs}
      />

      {/* RG Tabs - Shows all RGs, current one highlighted */}
      <div className="mb-4 flex items-center justify-center gap-2">
        {selectedRechtsgebiete.map((rgId, index) => {
          const label = RECHTSGEBIET_LABELS[rgId] || rgId;
          const isCurrent = index === localRgIndex;
          const rgThemenCount = themenCountsPerRg[rgId] || 0;
          const isPast = index < localRgIndex;

          return (
            <button
              key={rgId}
              type="button"
              onClick={() => setLocalRgIndex(index)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isCurrent
                  ? 'bg-primary-600 text-white'
                  : isPast && rgThemenCount > 0
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {label}
              {rgThemenCount > 0 && !isCurrent && (
                <span className="ml-1.5">
                  <CheckCircle2 className="w-3 h-3 inline" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-sm text-neutral-500 mb-2">
          Rechtsgebiet {rgProgress} von {rgTotal}
        </p>
        <h1 className="text-2xl font-light text-neutral-900 mb-2">
          Themen und Aufgaben für {currentRgLabel}
        </h1>
        <p className="text-neutral-500">
          Füge Themen und Aufgaben zu deinen Unterrechtsgebieten hinzu.
        </p>
      </div>

      {/* URG Tabs */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 p-2 bg-neutral-50 rounded-lg">
          {currentUrgs.map((urg, index) => (
            <UrgTab
              key={urg.id}
              urg={urg}
              isActive={index === activeUrgIndex}
              onClick={() => setActiveUrgIndex(index)}
              themenCount={themenCountsPerUrg[urg.id] || 0}
            />
          ))}
        </div>
      </div>

      {/* URGs anpassen link */}
      <div className="mb-6 flex justify-center">
        <button
          type="button"
          onClick={() => goToStep(9)}
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-700 text-sm transition-colors"
        >
          <Pencil className="w-4 h-4" />
          URGs anpassen
        </button>
      </div>

      {/* Main Content */}
      {currentUrgs.length > 0 && activeUrg ? (
        <div className="flex-1 overflow-y-auto">
          <h2 className="text-lg font-medium text-neutral-900 mb-4 text-center">
            Meine Themen
          </h2>

          <div className="space-y-4 mb-6">
            {activeUrgThemen.length > 0 ? (
              activeUrgThemen.map((thema) => (
                <ThemaCard
                  key={thema.id}
                  thema={thema}
                  onAddAufgabe={(aufgabe) => handleAddAufgabe(thema.id, aufgabe)}
                  onToggleAufgabe={(aufgabeId) => handleToggleAufgabe(thema.id, aufgabeId)}
                  onToggleAufgabePriority={(aufgabeId, level) => handleToggleAufgabePriority(thema.id, aufgabeId, level)}
                  onDeleteAufgabe={(aufgabeId) => handleDeleteAufgabe(thema.id, aufgabeId)}
                  onDeleteThema={() => handleDeleteThema(thema.id)}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-neutral-50 rounded-lg">
                <p className="text-neutral-500 mb-4">
                  Noch keine Themen für dieses Unterrechtsgebiet.
                </p>
              </div>
            )}
          </div>

          {/* Add Theme Input */}
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={newThemaName}
              onChange={(e) => setNewThemaName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddThema()}
              placeholder="Neues Thema eingeben..."
              className="flex-1 px-4 py-3 border border-neutral-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddThema}
              disabled={!newThemaName.trim()}
              className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Hinzufügen
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-12">
            <p className="text-neutral-500">
              Keine Unterrechtsgebiete für dieses Rechtsgebiet vorhanden.
            </p>
            <button
              type="button"
              onClick={() => goToStep(9)}
              className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Zurück zu den Unterrechtsgebieten
            </button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      {(() => {
        const currentRgThemenCount = themenCountsPerRg[currentRgId] || 0;
        const currentRgHasThemes = currentRgThemenCount > 0;

        return (
          <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
            currentRgHasThemes
              ? 'bg-green-50 border border-green-200'
              : 'bg-amber-50 border border-amber-200'
          }`}>
            {currentRgHasThemes ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    {currentRgThemenCount} {currentRgThemenCount === 1 ? 'Thema' : 'Themen'} für {currentRgLabel}
                  </p>
                  <p className="text-sm text-green-700">
                    {isLastRg
                      ? 'Klicke auf "Weiter" um fortzufahren.'
                      : `Klicke auf "Weiter" um zu ${RECHTSGEBIET_LABELS[selectedRechtsgebiete[localRgIndex + 1]] || 'nächstes RG'} zu gelangen.`
                    }
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">
                    Noch keine Themen für {currentRgLabel}
                  </p>
                  <p className="text-sm text-amber-700">
                    Füge mindestens einem Unterrechtsgebiet ein Thema hinzu.
                  </p>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* Custom Navigation Buttons */}
      <div className="mt-6 flex justify-between items-center pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={handleZurueck}
          className="px-6 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
        >
          Zurück
        </button>

        <div className="flex items-center gap-2 text-sm text-neutral-500">
          {selectedRechtsgebiete.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === localRgIndex
                  ? 'bg-primary-600'
                  : index < localRgIndex
                    ? 'bg-green-500'
                    : 'bg-neutral-300'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleWeiter}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          {isLastRg ? 'Weiter' : `Weiter zu ${RECHTSGEBIET_LABELS[selectedRechtsgebiete[localRgIndex + 1]] || 'Nächstes'}`}
        </button>
      </div>
    </div>
  );
};

export default Step12ThemenEdit;
