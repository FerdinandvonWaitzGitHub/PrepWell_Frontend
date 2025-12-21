import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../../ui/dialog';

// Available chart statistics with their categories
const CHART_STATISTICS = [
  // Lernzeit
  {
    id: 'lernzeit-per-day',
    label: 'Ø Lernzeit pro Lerntag',
    description: 'Durchschnittliche Lernzeit pro Tag mit Tendenz',
    category: 'Lernzeit',
    color: '#EA580C'
  },
  {
    id: 'lernzeit-per-week',
    label: 'Ø Lernzeit pro Woche',
    description: 'Durchschnittliche Lernzeit pro Woche',
    category: 'Lernzeit',
    color: '#0D9488'
  },
  {
    id: 'lernzeit-per-month',
    label: 'Ø Lernzeit pro Monat',
    description: 'Durchschnittliche Lernzeit pro Monat',
    category: 'Lernzeit',
    color: '#8B5CF6'
  },
  // Zeitpunkte & Muster
  {
    id: 'productive-hours',
    label: 'Produktivste Tageszeit',
    description: 'Zeitrahmen mit den meisten getrackten Sessions',
    category: 'Zeitpunkte & Muster',
    color: '#F59E0B'
  },
  {
    id: 'weekday-productivity',
    label: 'Produktivität pro Wochentag',
    description: 'Lernzeit pro Wochentag über 8 Wochen',
    category: 'Zeitpunkte & Muster',
    color: '#EC4899'
  },
  // Fächer/Rechtsgebiete
  {
    id: 'subject-distribution',
    label: 'Fächergewichtung',
    description: 'Verteilung der Lernzeit nach Rechtsgebiet',
    category: 'Fächer/Rechtsgebiete',
    color: '#10B981'
  },
  {
    id: 'subject-time-weekly',
    label: 'Zeit pro Rechtsgebiet/Woche',
    description: 'Durchschnittliche getrackte Zeit pro Rechtsgebiet',
    category: 'Fächer/Rechtsgebiete',
    color: '#6366F1'
  },
  // Aufgaben & Themen
  {
    id: 'task-completion-week',
    label: 'Aufgaben-Erledigungsrate (Woche)',
    description: 'Erledigungsrate aggregiert über 7 Tage',
    category: 'Aufgaben & Themen',
    color: '#14B8A6'
  },
  {
    id: 'task-completion-month',
    label: 'Aufgaben-Erledigungsrate (Monat)',
    description: 'Erledigungsrate aggregiert über 30 Tage',
    category: 'Aufgaben & Themen',
    color: '#F97316'
  },
  {
    id: 'tasks-per-day',
    label: 'Ø Aufgaben pro Tag',
    description: 'Durchschnittliche Aufgaben pro Lerntag',
    category: 'Aufgaben & Themen',
    color: '#84CC16'
  },
  // Konsistenz & Gewohnheiten
  {
    id: 'streak-history',
    label: 'Streak-Verlauf',
    description: 'Entwicklung der Lernstreaks über Zeit',
    category: 'Konsistenz & Gewohnheiten',
    color: '#22C55E'
  },
  {
    id: 'learning-days-week',
    label: 'Lerntage pro Woche',
    description: 'Anzahl aktiver Lerntage pro Woche',
    category: 'Konsistenz & Gewohnheiten',
    color: '#A855F7'
  },
  {
    id: 'dropout-rate',
    label: 'Ausfallquote vs. Fortschritt',
    description: 'Verhältnis ausgefallene/geplante Puffer',
    category: 'Konsistenz & Gewohnheiten',
    color: '#EF4444'
  },
  // Wiederholungen
  {
    id: 'repetition-blocks',
    label: 'Wiederholungs-Blöcke',
    description: 'Anzahl der Wiederholungsblöcke über Zeit',
    category: 'Wiederholungen',
    color: '#0EA5E9'
  },
  // Klausuren & Leistungen
  {
    id: 'exam-grades',
    label: 'Klausurnoten-Verlauf',
    description: 'Entwicklung der Klausurnoten',
    category: 'Klausuren & Leistungen',
    color: '#D946EF'
  },
  {
    id: 'exams-per-subject',
    label: 'Klausuren pro Rechtsgebiet',
    description: 'Anzahl Klausuren gruppiert nach Rechtsgebiet',
    category: 'Klausuren & Leistungen',
    color: '#F43F5E'
  },
  // Pomodoro & Timer
  {
    id: 'pomodoro-sessions',
    label: 'Pomodoro-Sessions',
    description: 'Anzahl der Pomodoro-Sessions pro Tag',
    category: 'Pomodoro & Timer',
    color: '#06B6D4'
  },
  {
    id: 'session-completion',
    label: 'Session-Abschlussrate',
    description: 'Prozent der abgeschlossenen Timer-Sessions',
    category: 'Pomodoro & Timer',
    color: '#65A30D'
  }
];

/**
 * ChartSelectionDialog - Dialog to select which statistics to display in the chart
 *
 * @param {boolean} open - Dialog open state
 * @param {Function} onOpenChange - Dialog open state change callback
 * @param {Array} selectedCharts - Currently selected chart IDs (max 3)
 * @param {Function} onSelectionChange - Callback with new selection array
 */
const ChartSelectionDialog = ({
  open,
  onOpenChange,
  selectedCharts = [],
  onSelectionChange
}) => {
  const [localSelection, setLocalSelection] = useState(selectedCharts);
  const MAX_SELECTIONS = 3;

  // Reset local selection when dialog opens
  useEffect(() => {
    if (open) {
      setLocalSelection(selectedCharts);
    }
  }, [open, selectedCharts]);

  // Group stats by category
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
    setLocalSelection(selectedCharts);
    onOpenChange?.(false);
  };

  const isMaxReached = localSelection.length >= MAX_SELECTIONS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Diagramm-Statistiken auswählen</DialogTitle>
          <DialogDescription>
            Wähle bis zu {MAX_SELECTIONS} Statistiken aus, die im Diagramm angezeigt werden sollen.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {Object.entries(groupedStats).map(([category, stats]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-700 mb-3">{category}</h4>
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
                            ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                            : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => handleToggle(stat.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: stat.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-900">{stat.label}</span>
                        {stat.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{stat.description}</p>
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
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <span className={`text-sm ${isMaxReached ? 'text-amber-600' : 'text-gray-500'}`}>
            {localSelection.length} / {MAX_SELECTIONS} ausgewählt
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
            >
              Speichern
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Export the statistics list for use in other components
export { CHART_STATISTICS };
export default ChartSelectionDialog;
