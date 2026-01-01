import { useMemo } from 'react';

/**
 * RadialChart - Circular progress/score chart
 *
 * Figma Node: 2165:2517 - WellScore Radial Chart
 *
 * Features:
 * - Circular progress indicator
 * - Center value display
 * - Optional label
 * - Customizable colors and sizes
 */
const RadialChart = ({
  value = 0,
  maxValue = 100,
  size = 'md',
  label = '',
  sublabel = '',
  color = 'primary',
  showPercentage = false,
  strokeWidth,
  className = '',
}) => {
  // Size configurations
  const sizeConfig = {
    sm: { width: 80, height: 80, stroke: 6, fontSize: 'text-lg', sublabelSize: 'text-xs' },
    md: { width: 120, height: 120, stroke: 8, fontSize: 'text-2xl', sublabelSize: 'text-sm' },
    lg: { width: 160, height: 160, stroke: 10, fontSize: 'text-3xl', sublabelSize: 'text-base' },
    xl: { width: 200, height: 200, stroke: 12, fontSize: 'text-4xl', sublabelSize: 'text-lg' },
  };

  const config = sizeConfig[size] || sizeConfig.md;
  const actualStrokeWidth = strokeWidth || config.stroke;

  // Color configurations
  const colorConfig = {
    primary: { stroke: '#FFC4C4', track: '#F5F5F5' },
    green: { stroke: '#22C55E', track: '#DCFCE7' },
    blue: { stroke: '#3B82F6', track: '#DBEAFE' },
    orange: { stroke: '#F97316', track: '#FED7AA' },
    purple: { stroke: '#8B5CF6', track: '#E9D5FF' },
    neutral: { stroke: '#525252', track: '#E5E5E5' },
  };

  const colors = colorConfig[color] || colorConfig.primary;

  // Calculate percentage and SVG values
  const percentage = useMemo(() => {
    return Math.min(100, Math.max(0, (value / maxValue) * 100));
  }, [value, maxValue]);

  const radius = (config.width - actualStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Display value
  const displayValue = showPercentage ? `${Math.round(percentage)}%` : value;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* SVG Circle */}
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={config.width / 2}
          cy={config.height / 2}
          r={radius}
          fill="none"
          stroke={colors.track}
          strokeWidth={actualStrokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={config.width / 2}
          cy={config.height / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={actualStrokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-medium text-neutral-900 ${config.fontSize}`}>
          {displayValue}
        </span>
        {label && (
          <span className={`text-neutral-500 ${config.sublabelSize}`}>
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-neutral-400 text-xs mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * WellScoreChart - Specialized radial chart for WellScore display
 *
 * Shows the user's WellScore (0-100) with color coding:
 * - 0-40: Red (needs improvement)
 * - 41-70: Orange (moderate)
 * - 71-100: Green (good)
 */
export const WellScoreChart = ({
  score = 0,
  size = 'lg',
  showTrend = false,
  trend = 0, // positive or negative change
  className = '',
}) => {
  // Determine color based on score
  const getScoreColor = (score) => {
    if (score >= 71) return 'green';
    if (score >= 41) return 'orange';
    return 'primary'; // red-ish for low scores
  };

  const color = getScoreColor(score);

  // Score label
  const getScoreLabel = (score) => {
    if (score >= 71) return 'Sehr gut';
    if (score >= 41) return 'Gut';
    return 'Ausbaufähig';
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <RadialChart
        value={score}
        maxValue={100}
        size={size}
        color={color}
        label="WellScore"
      />

      {/* Score Label */}
      <p className="mt-3 text-sm font-medium text-neutral-700">
        {getScoreLabel(score)}
      </p>

      {/* Trend indicator */}
      {showTrend && trend !== 0 && (
        <div className={`flex items-center gap-1 mt-1 ${
          trend > 0 ? 'text-green-600' : 'text-red-500'
        }`}>
          <svg
            className={`w-3 h-3 ${trend > 0 ? '' : 'rotate-180'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-medium">
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * ProgressRing - Simple progress ring for smaller UI elements
 */
export const ProgressRing = ({
  value = 0,
  maxValue = 100,
  size = 24,
  strokeWidth = 3,
  color = '#FFC4C4',
  trackColor = '#F5F5F5',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`transform -rotate-90 ${className}`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-300"
      />
    </svg>
  );
};

export default RadialChart;
