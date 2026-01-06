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
  X
} from 'lucide-react';
import { RECHTSGEBIET_LABELS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 12: Themen & Aufgaben Editor
 * Based on Figma design: Shows URG tabs, themes with tasks (Aufgaben)
 *
 * Structure:
 * - Header shows current RG name
 * - URG tabs to switch between Unterrechtsgebiete
 * - Each theme has a list of Aufgaben (tasks)
 * - Can add/remove themes and Aufgaben
 */

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
      {/* Checkbox */}
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Priority buttons */}
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

      {/* Delete button */}
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
      {/* Theme Header */}
      <div className="flex items-center gap-3 p-4 border-b border-neutral-100">
        {/* Collapse/Expand button */}
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

        {/* Theme title */}
        <h4 className="flex-1 text-base font-medium text-neutral-900">
          {thema.name}
        </h4>

        {/* Aufgaben count badge */}
        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs rounded-full">
          {thema.aufgaben?.length || 0} Aufgaben
        </span>

        {/* Delete theme button */}
        <button
          type="button"
          onClick={onDeleteThema}
          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Thema löschen"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Theme Content (Aufgaben) */}
      {isExpanded && (
        <div className="p-4">
          {/* Aufgaben list */}
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

          {/* Add Aufgabe */}
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
 * Confirmation Dialog Component
 */
const ConfirmationDialog = ({ rgsWithoutThemes, onContinue, onStay }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Nicht alle Rechtsgebiete haben Themen
            </h3>
          </div>
          <button
            onClick={onStay}
            className="p-1 text-neutral-400 hover:text-neutral-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-neutral-600 mb-3">
            Folgende Rechtsgebiete haben noch keine Themen:
          </p>
          <ul className="space-y-1">
            {rgsWithoutThemes.map(rgId => (
              <li key={rgId} className="flex items-center gap-2 text-sm text-neutral-700">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                {RECHTSGEBIET_LABELS[rgId] || rgId}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-neutral-600 mb-6">
          Hast du bereits zu allen Rechtsgebieten Themen hinzugefügt, die du brauchst?
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onStay}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Nein, weitere hinzufügen
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            Ja, weiter
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Add Theme Modal
 */
const AddThemaModal = ({ onAdd, onClose }) => {
  const [themaName, setThemaName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (themaName.trim()) {
      onAdd({
        id: `thema-${Date.now()}`,
        name: themaName.trim(),
        aufgaben: []
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Neues Thema hinzufügen
        </h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={themaName}
            onChange={(e) => setThemaName(e.target.value)}
            placeholder="Thema eingeben..."
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!themaName.trim()}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Step 12 Component
 */
const Step12ThemenEdit = () => {
  const {
    selectedRechtsgebiete,
    currentRechtsgebietIndex,
    unterrechtsgebieteDraft,
    themenDraft,
    updateWizardData,
    setStep12ConfirmationHandler,
    prevStep
  } = useWizard();

  const [activeUrgIndex, setActiveUrgIndex] = useState(0);
  const [showAddThemaModal, setShowAddThemaModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Current Rechtsgebiet
  const currentRgId = selectedRechtsgebiete[currentRechtsgebietIndex] || selectedRechtsgebiete[0];
  const currentRgLabel = RECHTSGEBIET_LABELS[currentRgId] || currentRgId;

  // URGs for current RG - memoized to avoid dependency issues
  const currentUrgs = useMemo(() => {
    return unterrechtsgebieteDraft[currentRgId] || [];
  }, [unterrechtsgebieteDraft, currentRgId]);

  const activeUrg = currentUrgs[activeUrgIndex];

  // Themes for active URG
  const activeUrgThemen = activeUrg ? (themenDraft[activeUrg.id] || []) : [];

  // Calculate theme counts
  const themenCountsPerUrg = useMemo(() => {
    const counts = {};
    for (const urg of currentUrgs) {
      counts[urg.id] = (themenDraft[urg.id] || []).length;
    }
    return counts;
  }, [currentUrgs, themenDraft]);

  // Calculate theme counts per RG for validation
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

  // Find RGs without themes
  const rgsWithoutThemes = useMemo(() => {
    return selectedRechtsgebiete.filter(rgId => themenCountsPerRg[rgId] === 0);
  }, [selectedRechtsgebiete, themenCountsPerRg]);

  const totalThemenCount = Object.values(themenCountsPerRg).reduce((a, b) => a + b, 0);
  const hasAnyThemes = totalThemenCount > 0;
  const allRgsHaveThemes = rgsWithoutThemes.length === 0;

  // Register confirmation handler
  useEffect(() => {
    if (setStep12ConfirmationHandler) {
      setStep12ConfirmationHandler((goNextCallback) => {
        if (!allRgsHaveThemes && hasAnyThemes) {
          setPendingNavigation(() => goNextCallback);
          setShowConfirmDialog(true);
          return false;
        }
        return true;
      });

      return () => setStep12ConfirmationHandler(null);
    }
  }, [allRgsHaveThemes, hasAnyThemes, setStep12ConfirmationHandler]);

  // Reset URG index when RG changes
  useEffect(() => {
    setActiveUrgIndex(0);
  }, [currentRgId]);

  // === Theme operations ===
  const handleAddThema = (thema) => {
    if (!activeUrg) return;
    const currentThemen = themenDraft[activeUrg.id] || [];
    updateWizardData({
      themenDraft: {
        ...themenDraft,
        [activeUrg.id]: [...currentThemen, thema]
      }
    });
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

  // === Aufgabe operations ===
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

  // === Confirmation dialog handlers ===
  const handleConfirmContinue = () => {
    setShowConfirmDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
    }
  };

  const handleConfirmStay = () => {
    setShowConfirmDialog(false);
    setPendingNavigation(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-6">
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
          onClick={() => prevStep()}
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-700 text-sm transition-colors"
        >
          <Pencil className="w-4 h-4" />
          URGs anpassen
        </button>
      </div>

      {/* Main Content */}
      {currentUrgs.length > 0 && activeUrg ? (
        <div className="flex-1">
          {/* Section Title */}
          <h2 className="text-lg font-medium text-neutral-900 mb-4 text-center">
            Meine Themen
          </h2>

          {/* Theme Cards */}
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

          {/* Add Theme Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowAddThemaModal(true)}
              className="flex items-center gap-2 px-6 py-3 border border-neutral-300 rounded-full text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <span>Neues Thema hinzufügen</span>
              <Plus className="w-5 h-5" />
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
              onClick={() => prevStep()}
              className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Zurück zu den Unterrechtsgebieten
            </button>
          </div>
        </div>
      )}

      {/* Validation Feedback */}
      <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
        allRgsHaveThemes
          ? 'bg-green-50 border border-green-200'
          : hasAnyThemes
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-red-50 border border-red-200'
      }`}>
        {allRgsHaveThemes ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Alle Rechtsgebiete haben Themen ({totalThemenCount} insgesamt)
              </p>
              <p className="text-sm text-green-700">
                Du kannst jetzt fortfahren!
              </p>
            </div>
          </>
        ) : hasAnyThemes ? (
          <>
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                {totalThemenCount} {totalThemenCount === 1 ? 'Thema' : 'Themen'} hinzugefügt
              </p>
              <p className="text-sm text-amber-700">
                {rgsWithoutThemes.length} {rgsWithoutThemes.length === 1 ? 'Rechtsgebiet hat' : 'Rechtsgebiete haben'} noch keine Themen
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Mindestens ein Thema erforderlich
              </p>
              <p className="text-sm text-red-700">
                Füge mindestens einem Unterrechtsgebiet ein Thema hinzu, um fortzufahren.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Add Theme Modal */}
      {showAddThemaModal && (
        <AddThemaModal
          onAdd={handleAddThema}
          onClose={() => setShowAddThemaModal(false)}
        />
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <ConfirmationDialog
          rgsWithoutThemes={rgsWithoutThemes}
          onContinue={handleConfirmContinue}
          onStay={handleConfirmStay}
        />
      )}
    </div>
  );
};

export default Step12ThemenEdit;
