/**
 * StatItem - Single statistic row in the sidebar matching Figma design
 *
 * Layout: Title on left | Value + Reference + Trend on right
 */
const StatItem = ({
  label,
  value,
  unit = '',
  reference = '',
  trend,
  trendText = ''
}) => {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  // Format display value
  const displayValue = typeof value === 'number' && unit === '%'
    ? `${value}%`
    : value;

  return (
    <div className="bg-white flex justify-start items-start gap-5 overflow-hidden">
      {/* Left: Title */}
      <div className="w-24 flex flex-col justify-start items-start">
        <div className="flex items-center gap-7 overflow-hidden">
          <span className="w-24 text-blue-600 text-sm font-normal leading-5">
            {label}
          </span>
        </div>
      </div>

      {/* Right: Value + Reference + Trend */}
      <div className="flex flex-col justify-center items-start">
        {/* Value Row */}
        <div className="flex items-center gap-7 overflow-hidden">
          <span className="text-neutral-900 text-2xl font-light leading-8">
            {displayValue}
          </span>
          {reference && (
            <span className="text-neutral-500 text-sm font-normal leading-5">
              {reference}
            </span>
          )}
        </div>

        {/* Trend Row */}
        {(trend !== undefined && trend !== null) && (
          <div className="h-8 flex items-center gap-2.5 overflow-hidden">
            <div
              className={`p-px rounded-full flex justify-center items-center ${
                isPositive ? 'bg-green-400' : isNegative ? 'bg-red-400' : 'bg-neutral-400'
              }`}
              style={{
                transform: isPositive ? 'rotate(-40deg)' : isNegative ? 'rotate(40deg)' : 'none'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
                <path d="M8 4L12 9H4L8 4Z" fill="currentColor" />
              </svg>
            </div>
            <span className="text-neutral-500 text-sm font-normal leading-5">
              {trendText || (trend !== 0 ? `${trend > 0 ? '+' : ''}${trend}%` : 'Keine Änderung')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatItem;
