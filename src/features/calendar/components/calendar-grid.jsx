import React from 'react';
import DayTile from './day-tile';

/**
 * CalendarGrid component
 * Displays the calendar grid with day names and day tiles
 *
 * @param {Array} days - Array of day objects with their learning blocks
 * @param {number} currentDay - Current day number for highlighting
 * @param {Function} onDayClick - Callback when a day is clicked
 * @param {Function} onAddClick - Callback when the add button is clicked
 */
const CalendarGrid = ({ days = [], currentDay = null, onDayClick, onAddClick, className = '' }) => {
  const weekDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

  return (
    <div className={`flex flex-col bg-white ${className}`}>
      {/* Week Days Header */}
      <div className="grid grid-cols-7 bg-white border-b border-neutral-200">
        {weekDays.map((dayName, index) => (
          <div
            key={index}
            className="flex items-center px-4 py-2.5 border-r border-neutral-200 last:border-r-0"
          >
            <span className="text-sm font-medium text-neutral-900">{dayName}</span>
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr bg-white">
        {days.map((day, index) => (
          <div
            key={index}
            className="border-r border-b border-neutral-200 last:border-r-0 min-h-[143px]"
          >
            <DayTile
              day={day.day}
              learningBlocks={day.learningBlocks}
              isToday={day.day === currentDay}
              isCurrentMonth={day.isCurrentMonth}
              onClick={() => onDayClick && onDayClick(day, day.learningBlocks)}
              onAddClick={() => onAddClick && onAddClick(day)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;
