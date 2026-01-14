import { memo, useCallback, useMemo } from 'react';
import DayTile from './day-tile';

/**
 * CalendarGrid component
 * Displays the calendar grid with day names and day tiles
 *
 * Performance optimizations:
 * - Memoized weekDays array
 * - Memoized click handlers to prevent DayTile re-renders
 *
 * @param {Array} days - Array of day objects with their learning blocks
 * @param {number} currentDay - Current day number for highlighting
 * @param {Function} onDayClick - Callback when a day is clicked
 * @param {Function} onAddClick - Callback when the add button is clicked
 * @param {Function} onBlockClick - Bug 2b fix: Callback when a block is clicked (opens block dialog instead of day dialog)
 */
const CalendarGrid = memo(function CalendarGrid({ days = [], currentDay = null, onDayClick, onAddClick, onBlockClick, className = '' }) {
  // Memoize weekDays to prevent array recreation
  const weekDays = useMemo(() =>
    ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
    []
  );

  // Memoize handlers factory to create stable callbacks per day
  const handleDayClick = useCallback((day) => {
    if (onDayClick) {
      onDayClick(day, day.learningBlocks);
    }
  }, [onDayClick]);

  const handleAddClick = useCallback((day) => {
    if (onAddClick) {
      onAddClick(day);
    }
  }, [onAddClick]);

  return (
    <div className={`flex flex-col bg-white ${className}`}>
      {/* Week Days Header */}
      <div className="grid grid-cols-7 bg-white border-b border-neutral-200">
        {weekDays.map((dayName, index) => (
          <div
            key={dayName}
            className="flex items-center px-4 py-2.5 border-r border-neutral-200 last:border-r-0"
          >
            <span className="text-sm font-medium text-neutral-900">{dayName}</span>
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr bg-white">
        {days.map((day) => (
          <div
            key={day.dateKey || `${day.day}-${day.isCurrentMonth}`}
            className="border-r border-b border-neutral-200 last:border-r-0 min-h-[143px]"
          >
            <DayTile
              day={day.day}
              learningBlocks={day.learningBlocks}
              isToday={day.day === currentDay}
              isCurrentMonth={day.isCurrentMonth}
              onClick={() => handleDayClick(day)}
              onAddClick={() => handleAddClick(day)}
              onBlockClick={onBlockClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

export default CalendarGrid;
