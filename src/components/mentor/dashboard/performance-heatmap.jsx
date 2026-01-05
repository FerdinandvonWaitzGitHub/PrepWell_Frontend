import { useMemo, useState } from 'react';
import YearViewDialog from './year-view-dialog';

/**
 * PerformanceHeatmap - Horizontal bar of 30 colored rectangles
 *
 * Colors based on performance:
 * - green-700: excellent (>90%)
 * - green-400: good (70-90%)
 * - green-200: okay (50-70%)
 * - fuchsia-400: below target (30-50%)
 * - fuchsia-700: poor (<30%)
 * - gray-200: no activity
 */
const PerformanceHeatmap = ({ data = [], stats = {} }) => {
  const [isYearViewOpen, setIsYearViewOpen] = useState(false);

  const {
    avgDuration = '0h 0min',
    avgDurationChange = 0
  } = stats;

  // Generate colors for each day
  const barColors = useMemo(() => {
    return data.map(day => {
      if (!day.achieved || day.achieved === 0) {
        return 'bg-neutral-200'; // No activity
      }

      const percentage = day.planned > 0
        ? (day.achieved / day.planned) * 100
        : 100;

      if (percentage >= 90) return 'bg-green-700';
      if (percentage >= 70) return 'bg-green-400';
      if (percentage >= 50) return 'bg-green-200';
      if (percentage >= 30) return 'bg-fuchsia-400';
      return 'bg-fuchsia-700';
    });
  }, [data]);

  // Ensure we always have 30 bars
  const bars = useMemo(() => {
    const result = [...barColors];
    while (result.length < 30) {
      result.push('bg-neutral-200');
    }
    return result.slice(0, 30);
  }, [barColors]);

  const isPositiveChange = avgDurationChange > 0;

  return (
    <div className="flex-1 h-full p-5 bg-white rounded-[10px] border border-neutral-200 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <span className="text-neutral-900 text-lg font-light leading-4">
          Performance letzte 30 Tage
        </span>
        <div className="p-px rounded-full flex justify-center items-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-neutral-400">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.33" />
          </svg>
        </div>
      </div>

      {/* Horizontal Bar Chart - 30 rectangles */}
      <div className="flex justify-between items-end">
        <div className="flex-1 h-14 flex gap-[3px] overflow-hidden">
          {bars.map((colorClass, index) => (
            <div
              key={index}
              className={`flex-1 h-full rounded-[10px] ${colorClass}`}
            />
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="text-neutral-900 text-2xl font-light leading-8">
            {avgDuration}
          </span>
          <span className="text-neutral-500 text-sm font-normal leading-5">
            ⌀ pro Tag
          </span>
        </div>

        {/* Trend Row */}
        <div className="h-8 flex items-center gap-2.5 overflow-hidden">
          <div className={`p-px rounded-full flex justify-center items-center ${
            isPositiveChange ? 'bg-green-400' : 'bg-red-400'
          }`}
            style={{
              transform: isPositiveChange ? 'rotate(-40deg)' : 'rotate(40deg)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
              <path d="M8 4L12 9H4L8 4Z" fill="currentColor" />
            </svg>
          </div>
          <span className="text-neutral-500 text-sm font-normal leading-5">
            {isPositiveChange ? '+' : ''}{avgDurationChange} min zum letzten Zeitraum
          </span>
        </div>
      </div>

      {/* Jahresansicht Button */}
      <div className="flex justify-center items-center gap-2">
        <button
          onClick={() => setIsYearViewOpen(true)}
          className="px-5 py-2.5 rounded-full border border-neutral-300 flex items-center gap-2 hover:bg-neutral-50 transition-colors"
        >
          <span className="text-neutral-900 text-sm font-light leading-5">
            Jahresansicht
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-neutral-900">
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Year View Dialog */}
      <YearViewDialog
        open={isYearViewOpen}
        onClose={() => setIsYearViewOpen(false)}
      />
    </div>
  );
};

export default PerformanceHeatmap;
