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
    <div className="w-[500px] h-full p-5 bg-white rounded-[10px] border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-gray-900 text-lg font-light leading-4">
          Statistiken
        </span>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="px-5 py-2.5 rounded-full border border-gray-300 flex items-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <span className="text-gray-900 text-sm font-light leading-5">
            Ansicht
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-900">
            <path d="M2.67 10.67V13.33H5.33M13.33 5.33V2.67H10.67M2.67 5.33V2.67H5.33M13.33 10.67V13.33H10.67" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Stats List */}
      <div className="flex-1 overflow-y-auto flex flex-col mt-5">
        {stats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 mb-3">
              <path d="M3 3v18h18" />
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
            </svg>
            <p className="text-gray-500 text-sm">Keine Statistiken ausgewählt</p>
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
                  <div className="my-2 h-px bg-gray-200" />
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
