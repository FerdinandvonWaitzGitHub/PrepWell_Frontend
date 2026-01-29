import { useState } from 'react';
import CompactStatItem from './compact-stat-item';
import StatsSelectionDialog from './stats-selection-dialog';

/**
 * StatsSidebar - Right sidebar with statistics matching Figma design
 *
 * Fixed width 500px, white card with border, scrollable content
 * Shows up to 10 statistics with compact display (value + trend)
 */
const StatsSidebar = ({
  stats = [],
  selectedStatsIds = [],
  onSelectedStatsChange
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="w-[500px] h-full p-5 bg-white rounded-[10px] border border-neutral-200 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-neutral-900 text-lg font-light leading-none">
          Statistiken
        </span>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="h-9 px-4 py-2 bg-white rounded-lg border border-neutral-200 shadow-sm flex items-center gap-2 hover:bg-neutral-50 transition-colors"
        >
          <span className="text-neutral-900 text-sm font-medium leading-5">
            Anpassen
          </span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neutral-900">
            <line x1="4" y1="9" x2="20" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="4" y1="15" x2="20" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="15" cy="9" r="2.5" fill="white" stroke="currentColor" strokeWidth="2"/>
            <circle cx="9" cy="15" r="2.5" fill="white" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </div>

      {/* Stats List */}
      <div className="flex-1 overflow-y-auto flex flex-col mt-5">
        {stats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-300 mb-3">
              <path d="M3 3v18h18" />
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
            </svg>
            <p className="text-neutral-500 text-sm">Keine Statistiken ausgewählt</p>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="mt-2 text-blue-600 text-sm hover:underline"
            >
              Statistiken auswählen
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {stats.map((stat, index) => (
              <div key={stat.id}>
                <CompactStatItem
                  label={stat.label}
                  value={stat.value}
                  unit={stat.unit}
                  trend={stat.trend}
                  color={stat.color}
                />
                {/* Divider - except after last item */}
                {index < stats.length - 1 && (
                  <div className="my-2 h-px bg-neutral-200" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Selection Dialog */}
      <StatsSelectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedStats={selectedStatsIds}
        onSelectionChange={onSelectedStatsChange}
      />
    </div>
  );
};

export default StatsSidebar;
