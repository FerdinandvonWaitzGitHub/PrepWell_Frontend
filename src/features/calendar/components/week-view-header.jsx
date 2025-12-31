import { Button, ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '../../../components/ui';

/**
 * WeekViewHeader component
 * Header for week view with week title and navigation
 * Based on Figma design node-id=2409-8627
 */
const WeekViewHeader = ({
  weekTitle = 'Kalenderwoche 12',
  onPrevWeek,
  onNextWeek,
  onToday,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between bg-white px-4 py-4 border-b border-neutral-200 ${className}`}>
      {/* Week Title */}
      <div className="flex items-center">
        <h2 className="text-sm font-medium text-neutral-900">{weekTitle}</h2>
      </div>

      {/* Controls - Right aligned */}
      <div className="flex items-center gap-2">
        {/* Today Button with Calendar Icon */}
        <Button
          variant="default"
          size="sm"
          onClick={onToday}
          className="flex items-center gap-2"
        >
          <span>Heute</span>
          <CalendarIcon size={14} />
        </Button>

        {/* Navigation Buttons */}
        <Button
          variant="icon"
          size="icon"
          onClick={onPrevWeek}
          aria-label="Vorherige Woche"
        >
          <ChevronLeftIcon size={16} />
        </Button>

        <Button
          variant="icon"
          size="icon"
          onClick={onNextWeek}
          aria-label="Nächste Woche"
        >
          <ChevronRightIcon size={16} />
        </Button>
      </div>
    </div>
  );
};

export default WeekViewHeader;
