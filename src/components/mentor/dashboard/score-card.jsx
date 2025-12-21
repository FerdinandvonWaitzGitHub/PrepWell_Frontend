/**
 * ScoreCard - Combined PrepScore & WellScore card matching Figma design
 *
 * Both scores displayed in one card with large numbers and trend indicators
 */
const ScoreCard = ({ prepScore, prepTrend, wellScore, wellTrend }) => {
  return (
    <div className="h-full p-5 bg-white rounded-[10px] border border-gray-200 flex flex-col justify-between">
      {/* Prep Score Section */}
      <ScoreSection
        title="Prep Score"
        score={prepScore}
        trend={prepTrend}
      />

      {/* Well Score Section */}
      <ScoreSection
        title="Well Score"
        score={wellScore}
        trend={wellTrend}
      />
    </div>
  );
};

/**
 * Individual score section within the card
 */
const ScoreSection = ({ title, score, trend }) => {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Title Row */}
      <div className="flex items-center gap-1.5">
        <span className="text-gray-900 text-lg font-light leading-4">{title}</span>
        <div className="p-px rounded-full flex justify-center items-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.33" />
          </svg>
        </div>
      </div>

      {/* Content Row */}
      <div className="flex justify-between items-end">
        {/* Left: Trend */}
        <div className="py-2.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="text-gray-900 text-2xl font-light leading-8">
              {trend > 0 ? '+' : ''}{trend}
            </span>
            <div className={`p-px rounded-full flex justify-center items-center ${
              isPositive ? 'bg-green-400' : isNegative ? 'bg-red-400' : 'bg-gray-400'
            }`}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="text-white"
                style={{
                  transform: isNegative ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              >
                <path
                  d="M6 3L9 7H3L6 3Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
          <span className="text-gray-500 text-sm font-normal leading-5">
            in den letzten 7 Tagen
          </span>
        </div>

        {/* Right: Score Number */}
        <span className="text-gray-900 text-7xl font-extralight leading-[72px] text-right">
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
};

export default ScoreCard;
