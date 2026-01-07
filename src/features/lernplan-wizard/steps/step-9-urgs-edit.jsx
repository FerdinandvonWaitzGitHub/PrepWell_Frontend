import { useState, useEffect } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import { Plus, Minus, GripVertical } from 'lucide-react';
import {
  RECHTSGEBIET_LABELS,
  ALL_UNTERRECHTSGEBIETE,
  DEFAULT_SELECTION
} from '../../../data/unterrechtsgebiete-data';

/**
 * Step 9: URGs Edit
 * User edits the Unterrechtsgebiete for the currently selected Rechtsgebiet.
 * - Can add/remove URGs
 * - When done, marks this RG as complete
 * - Returns to Step 8 for next RG, or proceeds to Step 10 when all done
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
        <p className="text-sm font-medium text-neutral-900">{urg.name}</p>
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

  // Filter by search term
  const filteredUrgs = availableUrgs.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                <p className="text-sm font-medium text-neutral-900">{urg.name}</p>
                <p className="text-xs text-neutral-500">{urg.kategorie}</p>
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
 * Step 9 Component
 */
const Step9UrgsEdit = () => {
  const {
    selectedRechtsgebiete,
    currentRechtsgebietIndex,
    urgCreationMode,
    unterrechtsgebieteDraft,
    themenDraft,
    updateWizardData
  } = useWizard();

  const [showAddModal, setShowAddModal] = useState(false);

  // Get current Rechtsgebiet
  const currentRechtsgebiet = selectedRechtsgebiete[currentRechtsgebietIndex];
  const rechtsgebietLabel = RECHTSGEBIET_LABELS[currentRechtsgebiet] || currentRechtsgebiet;

  // Get current URGs for this Rechtsgebiet
  const currentUrgs = unterrechtsgebieteDraft[currentRechtsgebiet] || [];

  // Initialize URGs on first load based on mode
  useEffect(() => {
    if (!unterrechtsgebieteDraft[currentRechtsgebiet]) {
      let initialUrgs = [];

      if (urgCreationMode === 'prefilled') {
        // Use default selection for prefilled mode
        initialUrgs = DEFAULT_SELECTION[currentRechtsgebiet] || [];
      }
      // For 'manual' mode, start with empty list

      updateWizardData({
        unterrechtsgebieteDraft: {
          ...unterrechtsgebieteDraft,
          [currentRechtsgebiet]: initialUrgs
        }
      });
    }
  }, [currentRechtsgebiet, urgCreationMode, unterrechtsgebieteDraft, updateWizardData]);

  const handleRemoveUrg = (urgId) => {
    const updatedUrgs = currentUrgs.filter(u => u.id !== urgId);

    // Also remove orphaned themes for this URG (P2 fix - see WIZARD_DATA_ISSUES.md)
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

  return (
    <div>
      <StepHeader
        step={9}
        title={`Unterrechtsgebiete für ${rechtsgebietLabel}`}
        description="Bearbeite die Unterrechtsgebiete für dieses Rechtsgebiet."
      />

      {/* URG Count Badge */}
      <div className="mb-6">
        <span className="inline-flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-full">
          {currentUrgs.length} Unterrechtsgebiet{currentUrgs.length !== 1 ? 'e' : ''}
        </span>
      </div>

      {/* URG List */}
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
