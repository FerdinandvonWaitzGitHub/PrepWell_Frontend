/**
 * StatCard - Individual statistic display card
 *
 * Shows a single statistic with label, value, and optional trend indicator.
 */
const StatCard = ({
  label,
  value,
  unit = '',
  trend = null, // 'up', 'down', or null
  trendValue = '',
  size = 'default', // 'default', 'large'
  className = ''
}) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-neutral-500'
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→'
  };

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 p-4 ${className}`}>
      <p className="text-sm text-neutral-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`font-semibold text-neutral-900 ${size === 'large' ? 'text-3xl' : 'text-2xl'}`}>
          {value}
        </span>
        {unit && <span className="text-neutral-500 text-sm">{unit}</span>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-1 text-sm ${trendColors[trend]}`}>
          <span>{trendIcons[trend]}</span>
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
