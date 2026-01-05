import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../../ui/dialog';
import { CHART_STATISTICS } from './chart-selection-dialog';

/**
 * StatsSelectionDialog - Dialog to select which statistics to display in sidebar
 *
 * Uses the same statistics as the chart selection but allows up to 10 selections
 *
 * @param {boolean} open - Dialog open state
 * @param {Function} onOpenChange - Dialog open state change callback
 * @param {Array} selectedStats - Currently selected stat IDs
 * @param {Function} onSelectionChange - Callback with new selection array
 */
const StatsSelectionDialog = ({
  open,
  onOpenChange,
  selectedStats = [],
  onSelectionChange
}) => {
  const [localSelection, setLocalSelection] = useState(selectedStats);
  const MAX_SELECTIONS = 10;

  // Reset local selection when dialog opens
  useEffect(() => {
    if (open) {
      setLocalSelection(selectedStats);
    }
  }, [open, selectedStats]);

  // Group stats by category (use CHART_STATISTICS)
  const groupedStats = useMemo(() => {
    const groups = {};
    CHART_STATISTICS.forEach(stat => {
      const category = stat.category || 'Sonstige';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(stat);
    });
    return groups;
  }, []);

  const handleToggle = (statId) => {
    setLocalSelection(prev => {
      if (prev.includes(statId)) {
        return prev.filter(id => id !== statId);
      }
      // Only allow up to MAX_SELECTIONS
      if (prev.length >= MAX_SELECTIONS) {
        return prev;
      }
      return [...prev, statId];
    });
  };

  const handleSave = () => {
    onSelectionChange?.(localSelection);
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    setLocalSelection(selectedStats);
    onOpenChange?.(false);
  };

  const isMaxReached = localSelection.length >= MAX_SELECTIONS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Statistiken auswählen</DialogTitle>
          <DialogDescription>
            Wähle bis zu {MAX_SELECTIONS} Statistiken aus, die in der Sidebar angezeigt werden sollen.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {Object.entries(groupedStats).map(([category, stats]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-neutral-700 mb-3">{category}</h4>
              <div className="space-y-2">
                {stats.map(stat => {
                  const isSelected = localSelection.includes(stat.id);
                  const isDisabled = !isSelected && isMaxReached;

                  return (
                    <label
                      key={stat.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border transition-colors
                        ${isSelected
                          ? 'border-blue-300 bg-blue-50 cursor-pointer'
                          : isDisabled
                            ? 'border-neutral-100 bg-neutral-50 cursor-not-allowed opacity-50'
                            : 'border-neutral-200 hover:bg-neutral-50 cursor-pointer'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => handleToggle(stat.id)}
                        className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: stat.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-neutral-900">{stat.label}</span>
                        {stat.description && (
                          <p className="text-xs text-neutral-500 mt-0.5 truncate">{stat.description}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <span className={`text-sm ${isMaxReached ? 'text-amber-600' : 'text-neutral-500'}`}>
            {localSelection.length} / {MAX_SELECTIONS} ausgewählt
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800"
            >
              Speichern
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatsSelectionDialog;
