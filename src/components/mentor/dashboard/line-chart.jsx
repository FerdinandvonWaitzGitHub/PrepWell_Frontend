import { useMemo } from 'react';

/**
 * LineChart - Multi-line chart matching Figma design exactly
 *
 * Features:
 * - Smooth curved lines using SVG paths
 * - Grid lines with Y-axis labels on both sides
 * - X-axis labels
 * - Legend at bottom
 * - Selection button to open chart selection dialog
 */
const LineChart = ({
  title = 'Diagramm',
  series = [],
  xLabels,
  yMax: customYMax,
  ySteps = 4,
  onSelectClick,
  className = ''
}) => {
  // Chart dimensions
  const chartWidth = 700;
  const chartHeight = 192;

  // Calculate yMax from data if not provided
  const yMax = useMemo(() => {
    if (customYMax) return customYMax;
    const allValues = series.flatMap(s => s.data || []);
    const maxValue = Math.max(...allValues, 0);
    return Math.ceil(maxValue * 1.2 / 100) * 100 || 400;
  }, [series, customYMax]);

  // Determine x-labels from first series or default
  const displayXLabels = useMemo(() => {
    if (xLabels) return xLabels;
    if (series[0]?.xLabels) return series[0].xLabels;
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  }, [xLabels, series]);

  // Generate Y-axis labels (400, 300, 200, 100, 0)
  const yLabels = useMemo(() => {
    const labels = [];
    for (let i = ySteps; i >= 0; i--) {
      labels.push(Math.round((yMax / ySteps) * i));
    }
    return labels;
  }, [yMax, ySteps]);

  // Convert data points to SVG path with smooth curves
  const generateSmoothPath = (data) => {
    if (!data || data.length < 2) return '';

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y = chartHeight - (value / yMax) * chartHeight;
      return { x, y };
    });

    // Create smooth bezier curve path
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const prev = points[i - 1] || current;
      const afterNext = points[i + 2] || next;

      // Calculate control points for smooth curve
      const tension = 0.3;

      const cp1x = current.x + (next.x - prev.x) * tension;
      const cp1y = current.y + (next.y - prev.y) * tension;
      const cp2x = next.x - (afterNext.x - current.x) * tension;
      const cp2y = next.y - (afterNext.y - current.y) * tension;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    return path;
  };

  // Default chart colors matching Figma
  const defaultColors = [
    '#EA580C', // orange-600 (base-chart-1)
    '#0D9488', // teal-600 (base-chart-2)
    '#8B5CF6', // violet-500 (base-chart-3)
  ];

  // Use provided series (no fake default data)
  const displaySeries = series;

  // Check if there's actual data to display
  const hasData = displaySeries.length > 0 &&
    displaySeries.some(s => s.data && s.data.length > 0 && s.data.some(v => v > 0));

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-neutral-900 text-lg font-light leading-none">
          {title}
        </span>
        {onSelectClick && (
          <button
            onClick={onSelectClick}
            className="h-9 px-4 py-2 bg-white rounded-lg border border-neutral-200 shadow-sm flex items-center gap-2 hover:bg-neutral-50 transition-colors"
          >
            <span className="text-neutral-900 text-sm font-medium leading-5">
              Anpassen
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neutral-900">
              <line x1="4" y1="9" x2="20" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="4" y1="15" x2="20" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="15" cy="9" r="2.5" fill="white" stroke="currentColor" strokeWidth="2"/>
              <circle cx="9" cy="15" r="2.5" fill="white" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        )}
      </div>

      {/* Chart Area */}
      <div className="flex-1 flex flex-col justify-end mt-4">
        {!hasData ? (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-300 mb-3">
              <path d="M3 3v18h18" />
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
            </svg>
            <p className="text-neutral-500 text-sm">Keine Daten verfügbar</p>
            {onSelectClick && (
              <button
                onClick={onSelectClick}
                className="mt-2 text-blue-600 text-sm hover:underline"
              >
                Statistiken auswählen
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-stretch">
              {/* Y-Axis Labels Left */}
              <div className="w-8 flex flex-col justify-between items-end pr-2 -mt-1.5 -mb-1.5" style={{ height: chartHeight + 12 }}>
                {yLabels.map((label, index) => (
                  <span key={`left-${index}`} className="text-neutral-400 text-xs font-normal leading-3">
                    {label}
                  </span>
                ))}
              </div>

              {/* Main Chart Area */}
              <div className="flex-1 relative">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ height: chartHeight }}>
                  {yLabels.map((_, index) => (
                    <div key={index} className="w-full h-px bg-neutral-200 opacity-80" />
                  ))}
                </div>

                {/* SVG Chart */}
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full relative z-10"
                  style={{ height: chartHeight }}
                  preserveAspectRatio="none"
                >
                  {displaySeries.map((s, seriesIndex) => (
                    <path
                      key={seriesIndex}
                      d={generateSmoothPath(s.data)}
                      fill="none"
                      stroke={s.color || defaultColors[seriesIndex % defaultColors.length]}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </svg>

                {/* X-Axis Labels */}
                <div className="flex justify-between items-center mt-3 px-0">
                  {displayXLabels.map((label, index) => (
                    <span key={index} className="text-neutral-400 text-xs font-normal leading-3">
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Y-Axis Labels Right */}
              <div className="w-8 flex flex-col justify-between items-start pl-2 -mt-1.5 -mb-1.5" style={{ height: chartHeight + 12 }}>
                {yLabels.map((label, index) => (
                  <span key={`right-${index}`} className="text-neutral-400 text-xs font-normal leading-3">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center items-center gap-4 mt-9">
              {displaySeries.map((s, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-sm"
                    style={{ backgroundColor: s.color || defaultColors[index % defaultColors.length] }}
                  />
                  <span className="text-neutral-900 text-xs font-normal leading-4">
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LineChart;
