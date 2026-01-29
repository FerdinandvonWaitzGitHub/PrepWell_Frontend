/**
 * CompactStatItem - Statistic row for sidebar matching Figma design
 *
 * Layout: Label (100px) | Value + Referenzbereich | Trend arrow + Tendenzangabe
 */
const CompactStatItem = ({
  label,
  value,
  unit = '',
  trend,
  trendLabel = 'zum Vormonat',
  referenceRange,
  color
}) => {
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  const hasTrend = trend !== undefined && trend !== null && trend !== 0;

  // Check if value is already a formatted string (contains letters, % or special chars)
  const valueIsFormatted = typeof value === 'string' && /[a-zA-Z%]/.test(value);

  // Format display value - don't add unit if value is already formatted
  const displayValue = valueIsFormatted
    ? value
    : unit
      ? `${value}${unit === '%' ? '%' : ` ${unit}`}`
      : value;

  // Format trend text - don't add unit if value already contains it
  const trendText = hasTrend
    ? `${isPositive ? '+' : ''}${trend}${!valueIsFormatted && unit ? (unit === '%' ? '%' : ` ${unit}`) : ''} ${trendLabel}`
    : null;

  return (
    <div className="flex items-start gap-5 py-3">
      {/* Left: Label (100px fixed width, allow wrapping) */}
      <div className="w-[100px] flex-shrink-0 flex flex-col items-start pt-1 overflow-hidden">
        <span className="text-neutral-900 text-sm font-normal leading-5 break-all hyphens-auto">
          {label}
        </span>
      </div>

      {/* Right: Value + Reference + Trend */}
      <div className="flex-1 flex flex-col items-start justify-center min-w-0">
        {/* Value Row */}
        <div className="flex items-center gap-[30px] flex-wrap">
          <span className="text-neutral-900 text-2xl font-light leading-8 whitespace-nowrap">
            {displayValue}
          </span>
          {referenceRange && (
            <span className="text-neutral-500 text-sm font-normal leading-5">
              {referenceRange}
            </span>
          )}
        </div>

        {/* Trend Row */}
        {hasTrend && (
          <div className="h-8 flex items-center gap-2.5">
            <div
              className={`p-px rounded-full flex justify-center items-center flex-shrink-0 ${
                isPositive ? 'bg-green-400' : isNegative ? 'bg-red-400' : 'bg-neutral-300'
              }`}
              style={{
                transform: isPositive ? 'rotate(-40deg)' : isNegative ? 'rotate(40deg)' : 'none'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 8L16 13H8L12 8Z" fill="currentColor" />
              </svg>
            </div>
            <span className="text-neutral-500 text-sm font-normal leading-5">
              {trendText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactStatItem;
