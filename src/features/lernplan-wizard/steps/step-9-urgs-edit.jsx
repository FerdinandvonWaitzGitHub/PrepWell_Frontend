import { useState, useEffect, useMemo } from 'react';
import { useWizard } from '../context/wizard-context';
import { Plus, Minus, GripVertical, CheckCircle2 } from 'lucide-react';
import {
  RECHTSGEBIET_LABELS,
  ALL_UNTERRECHTSGEBIETE,
  DEFAULT_SELECTION
} from '../../../data/unterrechtsgebiete-data';

/**
 * Step 9: URGs Edit (PW-028 Redesign)
 *
 * All-in-One URG Editor with RG tabs:
 * - Shows all Rechtsgebiete as tabs at the top
 * - User can freely switch between RGs without clicking "Weiter"
 * - Single "Weiter" button goes directly to Step 11
 * - Reduces clicks from 9 (3 RGs × 3 steps) to 1-2
 */

/**
 * URG List Item Component
 */
const UrgListItem = ({ urg, onRemove }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors">
      {/* Drag handle (visual only for now) */}
      <button
        type="button"
        className="p-1 text-neutral-400 hover:text-neutral-600 cursor-grab"
        tabIndex={-1}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* URG Name */}
      <div className="flex-1">
        <p className="text-sm font-medium text-neutral-900">{urg?.name || 'Unterrechtsgebiet'}</p>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
        title="Entfernen"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Add URG Modal Component
 */
const AddUrgModal = ({ rechtsgebietId, currentUrgs, onAdd, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newUrgName, setNewUrgName] = useState('');

  // Get all available URGs for this Rechtsgebiet
  const allUrgs = ALL_UNTERRECHTSGEBIETE[rechtsgebietId] || [];

  // Filter out already added URGs
  const currentUrgIds = currentUrgs.map(u => u.id);
  const availableUrgs = allUrgs.filter(u => !currentUrgIds.includes(u.id));

  // Filter by search term (guard against undefined elements)
  const filteredUrgs = availableUrgs.filter(u =>
    u && u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddExisting = (urg) => {
    onAdd(urg);
    onClose();
  };

  const handleAddCustom = () => {
    if (newUrgName.trim()) {
      onAdd({
        id: `custom-${Date.now()}`,
        name: newUrgName.trim(),
        kategorie: 'Eigene',
        isCustom: true
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl max-h-[80vh] flex flex-col">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Unterrechtsgebiet hinzufügen
        </h3>

        {/* Search/Filter */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Suchen..."
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg mb-4 text-sm"
        />

        {/* Available URGs list */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          {filteredUrgs.length > 0 ? (
            filteredUrgs.map((urg) => (
              <button
                key={urg.id}
                onClick={() => handleAddExisting(urg)}
                className="w-full p-3 text-left bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <p className="text-sm font-medium text-neutral-900">{urg?.name || 'Unterrechtsgebiet'}</p>
                <p className="text-xs text-neutral-500">{urg?.kategorie || ''}</p>
              </button>
            ))
          ) : (
            <p className="text-sm text-neutral-500 text-center py-4">
              Keine weiteren Unterrechtsgebiete verfügbar.
            </p>
          )}
        </div>

        {/* Add custom URG */}
        <div className="border-t border-neutral-200 pt-4">
          <p className="text-sm font-medium text-neutral-700 mb-2">
            Oder eigenes Unterrechtsgebiet erstellen:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newUrgName}
              onChange={(e) => setNewUrgName(e.target.value)}
              placeholder="Name eingeben..."
              className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            />
            <button
              onClick={handleAddCustom}
              disabled={!newUrgName.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hinzufügen
            </button>
          </div>
        </div>

        {/* Cancel button */}
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
};

/**
 * RG Tab Component
 */
const RgTab = ({ rgId, isActive, onClick, urgCount }) => {
  const label = RECHTSGEBIET_LABELS[rgId] || rgId;
  const hasUrgs = urgCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
        ${isActive
          ? 'bg-primary-600 text-white'
          : hasUrgs
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }
      `}
    >
      {label}
      {hasUrgs && !isActive && (
        <CheckCircle2 className="w-4 h-4" />
      )}
      {urgCount > 0 && (
        <span className={`px-1.5 py-0.5 text-xs rounded-full ${
          isActive ? 'bg-white/20' : 'bg-neutral-200'
        }`}>
          {urgCount}
        </span>
      )}
    </button>
  );
};

/**
 * Step 9 Component
 */
const Step9UrgsEdit = () => {
  const {
    selectedRechtsgebiete,
    urgCreationMode,
    unterrechtsgebieteDraft,
    themenDraft,
    updateWizardData,
    goToStep
  } = useWizard();

  // PW-028: Local RG index for tab navigation (like Step 12)
  const [localRgIndex, setLocalRgIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  // Current Rechtsgebiet based on LOCAL index (not wizard context)
  const currentRechtsgebiet = selectedRechtsgebiete[localRgIndex] || selectedRechtsgebiete[0];
  const rechtsgebietLabel = RECHTSGEBIET_LABELS[currentRechtsgebiet] || currentRechtsgebiet;

  // Get current URGs for this Rechtsgebiet
  const currentUrgs = unterrechtsgebieteDraft[currentRechtsgebiet] || [];

  // Calculate URG counts per RG for tab badges
  const urgCountsPerRg = useMemo(() => {
    const counts = {};
    for (const rgId of selectedRechtsgebiete) {
      counts[rgId] = (unterrechtsgebieteDraft[rgId] || []).length;
    }
    return counts;
  }, [selectedRechtsgebiete, unterrechtsgebieteDraft]);

  // PW-028: Initialize URGs for ALL RGs on mount (not just current)
  useEffect(() => {
    const updates = {};
    let needsUpdate = false;

    for (const rgId of selectedRechtsgebiete) {
      if (!unterrechtsgebieteDraft[rgId]) {
        let initialUrgs = [];

        if (urgCreationMode === 'prefilled') {
          // Use default selection for prefilled mode
          initialUrgs = DEFAULT_SELECTION[rgId] || [];
        }
        // For 'manual' mode, start with empty list

        console.log('[PW-028] Step 9 - Initializing URGs for:', rgId, 'Mode:', urgCreationMode);
        updates[rgId] = initialUrgs;
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
  }, [selectedRechtsgebiete, urgCreationMode, unterrechtsgebieteDraft, updateWizardData]);

  const handleRemoveUrg = (urgId) => {
    const updatedUrgs = currentUrgs.filter(u => u.id !== urgId);

    // Also remove orphaned themes for this URG
    const updatedThemenDraft = { ...themenDraft };
    delete updatedThemenDraft[urgId];

    updateWizardData({
      unterrechtsgebieteDraft: {
        ...unterrechtsgebieteDraft,
        [currentRechtsgebiet]: updatedUrgs
      },
      themenDraft: updatedThemenDraft
    });
  };

  const handleAddUrg = (urg) => {
    const updatedUrgs = [...currentUrgs, urg];
    updateWizardData({
      unterrechtsgebieteDraft: {
        ...unterrechtsgebieteDraft,
        [currentRechtsgebiet]: updatedUrgs
      }
    });
  };

  // PW-028: Custom navigation - "Weiter" goes directly to Step 11
  const handleWeiter = () => {
    // Optional: Check if any RGs have no URGs
    const emptyRgs = selectedRechtsgebiete.filter(
      rgId => (unterrechtsgebieteDraft[rgId] || []).length === 0
    );

    if (emptyRgs.length > 0) {
      // For now, just warn in console - could add a dialog later
      console.log('[PW-028] Warning: Some RGs have no URGs:', emptyRgs);
    }

    // Go directly to Step 11 (Themen-Intro), skipping Step 10
    goToStep(11);
  };

  // PW-028: Custom navigation - "Zurück" goes to Step 7
  const handleZurueck = () => {
    goToStep(7);
  };

  return (
    <div className="flex flex-col h-full">
      {/* PW-028: RG Tabs - All RGs visible, freely switchable */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 p-2 bg-neutral-50 rounded-lg justify-center">
          {selectedRechtsgebiete.map((rgId, index) => (
            <RgTab
              key={rgId}
              rgId={rgId}
              isActive={index === localRgIndex}
              onClick={() => setLocalRgIndex(index)}
              urgCount={urgCountsPerRg[rgId] || 0}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-sm text-neutral-500 mb-2">
          Rechtsgebiet {localRgIndex + 1} von {selectedRechtsgebiete.length}
        </p>
        <h1 className="text-2xl font-light text-neutral-900 mb-2">
          Unterrechtsgebiete für {rechtsgebietLabel}
        </h1>
        <p className="text-neutral-500">
          Wähle die Unterrechtsgebiete aus, die du lernen möchtest.
        </p>
      </div>

      {/* URG Count Badge */}
      <div className="mb-4 text-center">
        <span className="inline-flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-full">
          {currentUrgs.length} Unterrechtsgebiet{currentUrgs.length !== 1 ? 'e' : ''}
        </span>
      </div>

      {/* URG List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 mb-6">
          {currentUrgs.length > 0 ? (
            currentUrgs.map((urg) => (
              <UrgListItem
                key={urg.id}
                urg={urg}
                onRemove={() => handleRemoveUrg(urg.id)}
              />
            ))
          ) : (
            <div className="p-8 bg-neutral-50 rounded-lg text-center">
              <p className="text-neutral-500">
                Noch keine Unterrechtsgebiete hinzugefügt.
              </p>
            </div>
          )}
        </div>

        {/* Add Button */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Neues Unterrechtsgebiet</span>
        </button>
      </div>

      {/* PW-028: Custom Navigation Buttons */}
      <div className="mt-6 flex justify-between items-center pt-4 border-t border-neutral-200 flex-shrink-0">
        <button
          type="button"
          onClick={handleZurueck}
          className="px-6 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
        >
          Zurück
        </button>

        <button
          type="button"
          onClick={handleWeiter}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Weiter
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddUrgModal
          rechtsgebietId={currentRechtsgebiet}
          currentUrgs={currentUrgs}
          onAdd={handleAddUrg}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

export default Step9UrgsEdit;
