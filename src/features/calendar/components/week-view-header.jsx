import { ChevronLeft, ChevronRight, Undo2 } from 'lucide-react';

/**
 * WeekViewHeader component
 * Header for week view with week title and navigation
 * KA-001: Figma-konformes Design mit pill-shaped Buttons
 */
const WeekViewHeader = ({
  weekTitle = 'Kalenderwoche 12',
  onPrevWeek,
  onNextWeek,
  onToday,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between bg-white px-5 py-4 ${className}`}>
      {/* Week Title - KA-001: text-sm font-medium text-neutral-950 */}
      <div className="flex items-center">
        <h2 className="text-sm font-medium text-neutral-950">{weekTitle}</h2>
      </div>

      {/* Controls - Right aligned */}
      <div className="flex items-center gap-2">
        {/* KA-001: Heute Button - Pill-shaped mit Border, Undo2 Icon */}
        <button
          onClick={onToday}
          className="flex items-center gap-2 px-5 py-2.5 border border-neutral-200 rounded-full text-sm font-light text-neutral-950 hover:bg-neutral-100 transition-colors"
        >
          <span>Heute</span>
          <Undo2 className="w-4 h-4" />
        </button>

        {/* KA-001: Navigation Buttons - Pill-shaped mit Border */}
        <button
          onClick={onPrevWeek}
          aria-label="Vorherige Woche"
          className="p-2.5 border border-neutral-200 rounded-full hover:bg-neutral-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-neutral-950" />
        </button>

        <button
          onClick={onNextWeek}
          aria-label="Nächste Woche"
          className="p-2.5 border border-neutral-200 rounded-full hover:bg-neutral-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-neutral-950" />
        </button>
      </div>
    </div>
  );
};

export default WeekViewHeader;
