import React, { useState, useEffect } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';

/**
 * Step 9: Lerntage sortieren
 * User arranges the order of learning days
 * Based on Figma: Schritt_9 - Sortiere deine Lerntage
 */

const Step9Lerntage = () => {
  const { learningDaysOrder, unterrechtsgebieteOrder, blocksPerDay, updateWizardData } = useWizard();

  // Generate sample learning days based on previous settings
  const generateLearningDays = () => {
    const days = [];
    const subjects = unterrechtsgebieteOrder.length > 0
      ? unterrechtsgebieteOrder
      : [
          { id: 'bgb-at', name: 'BGB AT', color: 'bg-blue-500' },
          { id: 'schuldr-at', name: 'Schuldrecht AT', color: 'bg-blue-500' },
          { id: 'strafr-at', name: 'Strafrecht AT', color: 'bg-red-500' },
        ];

    // Create learning days for each subject
    subjects.forEach((subject, subjectIndex) => {
      // Each subject gets multiple days based on complexity
      const daysForSubject = Math.ceil(Math.random() * 3) + 2; // 2-5 days per subject
      for (let i = 0; i < daysForSubject; i++) {
        days.push({
          id: `day-${subject.id}-${i}`,
          subject: subject.name,
          color: subject.color,
          theme: `${subject.name} - Teil ${i + 1}`,
          blocks: blocksPerDay,
        });
      }
    });

    return days;
  };

  const [items, setItems] = useState(() => {
    if (learningDaysOrder.length > 0) {
      return learningDaysOrder;
    }
    return generateLearningDays();
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Update wizard state when order changes
  useEffect(() => {
    updateWizardData({ learningDaysOrder: items });
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

  return (
    <div>
      <StepHeader
        step={9}
        title="Sortiere deine Lerntage."
        description="In welcher Reihenfolge sollen die Lerntage in deinen Lernplan eingefügt werden?"
      />

      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600">Anzahl Lerntage:</span>
          <span className="font-semibold text-gray-900">{items.length} Tage</span>
        </div>

        {/* Scrollable list */}
        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group flex items-center gap-3 p-3 rounded-xl border-2 bg-white cursor-move transition-all ${
                draggedItem === index
                  ? 'opacity-50 border-primary-300'
                  : dragOverIndex === index
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Drag handle */}
              <div className="text-gray-400 group-hover:text-gray-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="6" r="1.5" />
                  <circle cx="15" cy="6" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="18" r="1.5" />
                  <circle cx="15" cy="18" r="1.5" />
                </svg>
              </div>

              {/* Position number */}
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                {index + 1}
              </div>

              {/* Color indicator */}
              <div className={`w-2 h-6 rounded ${item.color}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{item.theme}</p>
                <p className="text-xs text-gray-500">{item.blocks} Blöcke</p>
              </div>

              {/* Move buttons */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                <button
                  onClick={() => moveItem(index, 1)}
                  disabled={index === items.length - 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            Die Lerntage werden in dieser Reihenfolge in deinen Kalender eingefügt,
            basierend auf deiner Wochenstruktur.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step9Lerntage;
