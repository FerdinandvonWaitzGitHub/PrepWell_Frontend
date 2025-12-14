import React from 'react';
import { Button, ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '../../../components/ui';

/**
 * CalendarHeader component
 * Displays the month/year title and navigation controls
 *
 * @param {string} title - Month and year (e.g., "August 2025")
 * @param {Function} onPrevMonth - Handler for previous month button
 * @param {Function} onNextMonth - Handler for next month button
 * @param {Function} onToday - Handler for "today" button
 */
const CalendarHeader = ({
  title = '',
  onPrevMonth,
  onNextMonth,
  onToday,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between bg-white px-12.5 py-7.5 border-b border-gray-200 ${className}`}>
      {/* Title */}
      <div className="flex items-center">
        <h2 className="text-2xl font-light text-gray-900">{title}</h2>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Today Button */}
        <Button
          variant="default"
          size="default"
          onClick={onToday}
          className="flex items-center gap-2"
        >
          <CalendarIcon size={16} />
          <span>Heute</span>
        </Button>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="icon"
            size="icon"
            onClick={onPrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeftIcon size={16} />
          </Button>

          <Button
            variant="icon"
            size="icon"
            onClick={onNextMonth}
            aria-label="Next month"
          >
            <ChevronRightIcon size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
