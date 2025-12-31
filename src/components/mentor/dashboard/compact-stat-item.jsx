/**
 * CompactStatItem - Compact statistic row for sidebar
 *
 * Shows: Label (blue) | Value + Trend arrow
 */
const CompactStatItem = ({
  label,
  value,
  unit = '',
  trend,
  color
}) => {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  // Format display value
  const displayValue = unit
    ? `${value}${unit === '%' ? '%' : ` ${unit}`}`
    : value;

  return (
    <div className="flex justify-between items-center py-2">
      {/* Left: Label with color indicator */}
      <div className="flex items-center gap-2">
        {color && (
          <div
            className="w-2 h-2 rounded-sm flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="text-blue-600 text-sm font-normal leading-5">
          {label}
        </span>
      </div>

      {/* Right: Value + Trend */}
      <div className="flex items-center gap-2">
        <span className="text-neutral-900 text-lg font-light leading-6">
          {displayValue}
        </span>
        {(trend !== undefined && trend !== null && trend !== 0) && (
          <div
            className={`w-4 h-4 rounded-full flex justify-center items-center ${
              isPositive ? 'bg-green-400' : isNegative ? 'bg-red-400' : 'bg-neutral-300'
            }`}
            style={{
              transform: isPositive ? 'rotate(-40deg)' : isNegative ? 'rotate(40deg)' : 'none'
            }}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-white">
              <path d="M8 4L12 9H4L8 4Z" fill="currentColor" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactStatItem;
