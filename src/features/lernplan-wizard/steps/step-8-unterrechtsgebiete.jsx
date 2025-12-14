import React, { useState, useEffect } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 8: Unterrechtsgebiete sortieren
 * User arranges the order of law sub-areas for their learning plan
 * Based on Figma: Schritt_8 - Sortiere die Unterrechtsgebiete
 */

// Sample data - in production this would come from context/API
const SAMPLE_UNTERRECHTSGEBIETE = [
  { id: 'bgb-at', name: 'BGB AT', rechtsgebiet: 'zivilrecht', color: 'bg-blue-500' },
  { id: 'schuldr-at', name: 'Schuldrecht AT', rechtsgebiet: 'zivilrecht', color: 'bg-blue-500' },
  { id: 'schuldr-bt', name: 'Schuldrecht BT', rechtsgebiet: 'zivilrecht', color: 'bg-blue-500' },
  { id: 'sachenr', name: 'Sachenrecht', rechtsgebiet: 'zivilrecht', color: 'bg-blue-500' },
  { id: 'famerbr', name: 'Familien- und Erbrecht', rechtsgebiet: 'zivilrecht', color: 'bg-blue-500' },
  { id: 'strafr-at', name: 'Strafrecht AT', rechtsgebiet: 'strafrecht', color: 'bg-red-500' },
  { id: 'strafr-bt', name: 'Strafrecht BT', rechtsgebiet: 'strafrecht', color: 'bg-red-500' },
  { id: 'staatsr', name: 'Staatsrecht', rechtsgebiet: 'oeffentliches-recht', color: 'bg-green-500' },
  { id: 'verwaltungsr', name: 'Verwaltungsrecht', rechtsgebiet: 'oeffentliches-recht', color: 'bg-green-500' },
];

const Step8Unterrechtsgebiete = () => {
  const { unterrechtsgebieteOrder, updateWizardData } = useWizard();

  // Initialize with sample data if empty
  const [items, setItems] = useState(() => {
    if (unterrechtsgebieteOrder.length > 0) {
      return unterrechtsgebieteOrder;
    }
    return SAMPLE_UNTERRECHTSGEBIETE;
  });

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

  const getRechtsgebietLabel = (rg) => {
    switch (rg) {
      case 'zivilrecht': return 'Zivilrecht';
      case 'strafrecht': return 'Strafrecht';
      case 'oeffentliches-recht': return 'Öffentliches Recht';
      default: return rg;
    }
  };

  return (
    <div>
      <StepHeader
        step={8}
        title="Sortiere die Unterrechtsgebiete."
        description="In welcher Reihenfolge möchtest du die Unterrechtsgebiete bearbeiten? Du hast im nächsten Schritt die Möglichkeit, die Reihenfolge der Lerntage zu ändern."
      />

      <div className="space-y-6">
        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-600">Zivilrecht</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-gray-600">Strafrecht</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">Öffentliches Recht</span>
          </div>
        </div>

        {/* Sortable list */}
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
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{getRechtsgebietLabel(item.rechtsgebiet)}</p>
              </div>

              {/* Move buttons */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                <button
                  onClick={() => moveItem(index, 1)}
                  disabled={index === items.length - 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

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
    </div>
  );
};

export default Step8Unterrechtsgebiete;
