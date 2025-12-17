import React, { useState, useEffect } from 'react';
import { useWizard } from '../context/wizard-context';
import { useUnterrechtsgebiete } from '../../../contexts/unterrechtsgebiete-context';
import StepHeader from '../components/step-header';
import { groupByKategorie } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 8: Unterrechtsgebiete sortieren
 * User arranges the order of law sub-areas for their learning plan
 * Supports both:
 * - automatic path: extracts from manualLernplan
 * - template/AI path: uses unterrechtsgebiete-context
 */

// Rechtsgebiet colors for automatic path
const MANUAL_RECHTSGEBIET_COLORS = {
  'Zivilrecht': 'bg-blue-500',
  'Öffentliches Recht': 'bg-green-500',
  'Strafrecht': 'bg-red-500',
};

const Step8Unterrechtsgebiete = () => {
  const { unterrechtsgebieteOrder, updateWizardData, creationMethod, manualLernplan } = useWizard();
  const unterrechtsgebieteContext = useUnterrechtsgebiete();

  // Check if we're in automatic mode (using manualLernplan)
  const isAutomaticMode = creationMethod === 'automatic' && manualLernplan;

  // Extract Unterrechtsgebiete from manualLernplan for automatic path
  const extractFromManualLernplan = () => {
    if (!manualLernplan?.rechtsgebiete) return [];

    const items = [];
    Object.entries(manualLernplan.rechtsgebiete).forEach(([rechtsgebiet, data]) => {
      Object.entries(data.unterrechtsgebiete || {}).forEach(([name, unterData]) => {
        items.push({
          id: `${rechtsgebiet}-${name}`,
          name,
          rechtsgebiet,
          lerntageCount: unterData.lerntage?.length || 0,
          color: MANUAL_RECHTSGEBIET_COLORS[rechtsgebiet] || 'bg-gray-500',
        });
      });
    });
    return items;
  };

  // Get selected Unterrechtsgebiete from context (for template/AI path)
  const contextItems = isAutomaticMode ? [] : (unterrechtsgebieteContext?.getAllSelectedFlat?.() || []);

  // Dialog state (only used for template/AI path)
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeRechtsgebiet, setActiveRechtsgebiet] = useState('oeffentliches-recht');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize items from context, manualLernplan, or existing order
  const [items, setItems] = useState(() => {
    if (unterrechtsgebieteOrder.length > 0) {
      return unterrechtsgebieteOrder;
    }
    if (isAutomaticMode) {
      return extractFromManualLernplan();
    }
    return contextItems;
  });

  // Update items when context changes (only for template/AI path)
  useEffect(() => {
    if (isAutomaticMode) return; // Skip for automatic path

    const newItems = unterrechtsgebieteContext?.getAllSelectedFlat?.() || [];
    if (newItems.length > 0) {
      // Preserve order for existing items, add new ones at the end
      const existingIds = new Set(items.map(i => i.id));
      const newIds = new Set(newItems.map(i => i.id));

      // Keep ordered items that still exist
      const orderedItems = items.filter(i => newIds.has(i.id));

      // Add new items that weren't in the order
      const addedItems = newItems.filter(i => !existingIds.has(i.id));

      setItems([...orderedItems, ...addedItems]);
    }
  }, [unterrechtsgebieteContext, isAutomaticMode]);

  // Update items when manualLernplan changes (for automatic path)
  useEffect(() => {
    if (!isAutomaticMode) return;
    if (unterrechtsgebieteOrder.length === 0) {
      setItems(extractFromManualLernplan());
    }
  }, [manualLernplan, isAutomaticMode]);

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Update wizard state when order changes
  useEffect(() => {
    updateWizardData({ unterrechtsgebieteOrder: items });
  }, [items, updateWizardData]);

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedItem !== null && dragOverIndex !== null && draggedItem !== dragOverIndex) {
      const newItems = [...items];
      const [removed] = newItems.splice(draggedItem, 1);
      newItems.splice(dragOverIndex, 0, removed);
      setItems(newItems);
    }
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const moveItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    const [removed] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, removed);
    setItems(newItems);
  };

  const removeItem = (item) => {
    if (!isAutomaticMode && unterrechtsgebieteContext?.toggleUnterrechtsgebiet) {
      unterrechtsgebieteContext.toggleUnterrechtsgebiet(item.rechtsgebiet, item);
    }
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  const getRechtsgebietLabel = (rg) => {
    if (isAutomaticMode) {
      return rg; // Use raw name for automatic path
    }
    return unterrechtsgebieteContext?.RECHTSGEBIET_LABELS?.[rg] || rg;
  };

  // Get all available unterrechtsgebiete (only for template/AI path)
  const allAvailable = isAutomaticMode ? {} : (unterrechtsgebieteContext?.getAllAvailable?.() || {});

  // Filter items based on search
  const getFilteredItems = (rechtsgebietId) => {
    const items = allAvailable[rechtsgebietId] || [];
    if (!searchQuery) return items;

    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.kategorie && item.kategorie.toLowerCase().includes(query))
    );
  };

  return (
    <div>
      <StepHeader
        step={8}
        title="Sortiere die Unterrechtsgebiete."
        description="In welcher Reihenfolge möchtest du die Unterrechtsgebiete bearbeiten? Du kannst Gebiete hinzufügen oder entfernen."
      />

      <div className="space-y-6">
        {/* Legend & Add Button */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-600">Öffentliches Recht</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600">Zivilrecht</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-gray-600">Strafrecht</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm text-gray-600">Querschnitt</span>
            </div>
          </div>

          {!isAutomaticMode && (
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Gebiete bearbeiten
            </button>
          )}
        </div>

        {/* Selected count */}
        <div className="text-sm text-gray-600">
          {items.length} Unterrechtsgebiete ausgewählt
        </div>

        {/* Sortable list */}
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-3 p-4 rounded-xl border-2 bg-white cursor-move transition-all ${
                  draggedItem === index
                    ? 'opacity-50 border-primary-300'
                    : dragOverIndex === index
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Drag handle */}
                <div className="text-gray-400 group-hover:text-gray-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="6" r="1.5" />
                    <circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" />
                    <circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" />
                    <circle cx="15" cy="18" r="1.5" />
                  </svg>
                </div>

                {/* Position number */}
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                  {index + 1}
                </div>

                {/* Color indicator */}
                <div className={`w-3 h-8 rounded ${item.color}`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {getRechtsgebietLabel(item.rechtsgebiet)}
                    {item.kategorie && ` • ${item.kategorie}`}
                  </p>
                </div>

                {/* Move & Remove buttons */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Nach oben"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Nach unten"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeItem(item)}
                    className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600"
                    title="Entfernen"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">
              {isAutomaticMode
                ? 'Keine Unterrechtsgebiete erstellt. Bitte gehe zurück zu Schritt 7.'
                : 'Keine Unterrechtsgebiete ausgewählt'}
            </p>
            {!isAutomaticMode && (
              <button
                onClick={() => setShowAddDialog(true)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                Gebiete hinzufügen
              </button>
            )}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 flex gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-blue-600 flex-shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-sm text-blue-700">
            Ziehe die Einträge per Drag & Drop in die gewünschte Reihenfolge,
            oder nutze die Pfeil-Buttons zum Verschieben.
          </p>
        </div>
      </div>

      {/* Add/Edit Dialog (only for template/AI path) */}
      {showAddDialog && !isAutomaticMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Unterrechtsgebiete auswählen</h3>
              <button
                onClick={() => setShowAddDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suchen..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              />
            </div>

            {/* Tabs */}
            <div className="flex border-b overflow-x-auto">
              {Object.entries(unterrechtsgebieteContext?.RECHTSGEBIET_LABELS || {}).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveRechtsgebiet(id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeRechtsgebiet === id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {(() => {
                const filtered = getFilteredItems(activeRechtsgebiet);
                const grouped = groupByKategorie(filtered);

                if (Object.keys(grouped).length === 0) {
                  return (
                    <p className="text-center text-gray-500 py-8">
                      Keine Ergebnisse gefunden
                    </p>
                  );
                }

                return Object.entries(grouped).map(([kategorie, kategorieItems]) => (
                  <div key={kategorie} className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{kategorie}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {kategorieItems.map((item) => {
                        const selected = unterrechtsgebieteContext?.isSelected?.(activeRechtsgebiet, item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              unterrechtsgebieteContext?.toggleUnterrechtsgebiet?.(activeRechtsgebiet, item);
                              // Update local items state
                              if (selected) {
                                setItems(prev => prev.filter(i => i.id !== item.id));
                              } else {
                                const newItem = {
                                  ...item,
                                  rechtsgebiet: activeRechtsgebiet,
                                  color: unterrechtsgebieteContext?.RECHTSGEBIET_COLORS?.[activeRechtsgebiet]
                                };
                                setItems(prev => [...prev, newItem]);
                              }
                            }}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                              selected
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selected
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-300'
                            }`}>
                              {selected && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm">{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <span className="text-sm text-gray-600">
                {unterrechtsgebieteContext?.getSelectedCount?.() || 0} Gebiete ausgewählt
              </span>
              <button
                onClick={() => setShowAddDialog(false)}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step8Unterrechtsgebiete;
