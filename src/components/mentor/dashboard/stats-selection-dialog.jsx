import { useState, useMemo, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent
} from '../../ui/dialog';
import { CHART_STATISTICS } from './chart-selection-dialog';

/**
 * StatsSelectionDialog - Dialog to select which statistics to display in sidebar
 *
 * Figma Design: https://www.figma.com/design/vVbrqavbI9IKnC1KInXg3H/PrepWell-WebApp?node-id=2571-4886
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
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-6 relative">
        {/* Close Icon */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 w-4 h-4 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Schließen"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col gap-1.5 mb-6">
          <h2 className="text-lg font-light text-neutral-900 leading-none">
            Statistiken auswählen
          </h2>
          <p className="text-sm font-normal text-neutral-500 leading-5">
            Wähle die Statistiken aus, die du angezeigt bekommen möchtest.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {Object.entries(groupedStats).map(([category, stats]) => (
            <div key={category} className="flex flex-col gap-2">
              {/* Category Title */}
              <p className="text-sm font-medium text-neutral-900 leading-5">
                Statistiken zum Thema {category}
              </p>

              {/* Stats in this category */}
              {stats.map(stat => {
                const isSelected = localSelection.includes(stat.id);
                const isDisabled = !isSelected && isMaxReached;

                return (
                  <button
                    key={stat.id}
                    onClick={() => !isDisabled && handleToggle(stat.id)}
                    disabled={isDisabled}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-colors w-full text-left
                      ${isDisabled
                        ? 'border-neutral-100 bg-neutral-50 cursor-not-allowed opacity-50'
                        : 'border-neutral-200 hover:bg-neutral-50 cursor-pointer'
                      }
                    `}
                  >
                    {/* Checkbox */}
                    <div className={`
                      w-4 h-4 rounded flex-shrink-0 border shadow-sm flex items-center justify-center
                      ${isSelected
                        ? 'bg-neutral-900 border-neutral-900'
                        : 'bg-white border-neutral-200'
                      }
                    `}>
                      {isSelected && (
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <span className="text-sm font-medium text-neutral-900 leading-none">
                        {stat.label}
                      </span>
                      {stat.description && (
                        <span className="text-sm font-normal text-neutral-500 leading-5 truncate">
                          {stat.description}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between h-10 mt-6">
          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            className="h-9 px-4 py-2 text-sm font-medium text-neutral-900 bg-white border border-neutral-200 rounded-lg shadow-sm hover:bg-neutral-50 transition-colors"
          >
            Abbrechen
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="h-9 px-4 py-2 flex items-center gap-2 text-sm font-medium text-red-50 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <span>Auswahl übernehmen</span>
            <Check className="w-5 h-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatsSelectionDialog;
