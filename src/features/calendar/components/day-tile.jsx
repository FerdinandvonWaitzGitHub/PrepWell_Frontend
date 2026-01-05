import { memo } from 'react';
import LearningBlock from './learning-session';

/**
 * DayTile component
 * Represents a single day in the calendar grid
 *
 * Memoized for performance - prevents unnecessary re-renders when other days
 * in the calendar grid change. This component is rendered 35+ times per month view.
 *
 * @param {number} day - Day number (1-31)
 * @param {Array} learningBlocks - Array of learning blocks for this day
 * @param {boolean} isToday - Whether this is today's date
 * @param {boolean} isCurrentMonth - Whether this day belongs to the current month
 * @param {Function} onClick - Callback when the day is clicked
 */
const DayTile = memo(function DayTile({
  day,
  learningBlocks = [],
  isToday = false,
  isCurrentMonth = true,
  onClick,
  onAddClick,
  className = ''
}) {
  return (
    <div
      className={`flex flex-col gap-2.5 p-2 bg-white h-full min-h-[143px] ${!isCurrentMonth ? 'opacity-50' : ''} ${isCurrentMonth ? 'cursor-pointer hover:bg-neutral-50 transition-colors' : 'cursor-default'} ${className}`}
      onClick={onClick}
    >
      {/* Day Header */}
      <div className="flex items-start h-3.5">
        <span
          className={`text-xs font-normal ${
            isToday
              ? 'bg-blue-900 text-white px-1.5 py-0.5 rounded'
              : 'text-neutral-900'
          }`}
        >
          {day}
        </span>
      </div>

      {/* Learning Blocks */}
      <div className="flex flex-col gap-2.5">
        {learningBlocks.map((block, index) => (
          <LearningBlock
            key={block.id || index}
            title={block.title}
            blockType={block.blockType}
            unterrechtsgebiet={block.unterrechtsgebiet}
            isAddButton={block.isAddButton}
            isOutOfRange={block.isOutOfRange}
            onAddClick={onAddClick}
          />
        ))}
      </div>
    </div>
  );
});

export default DayTile;
