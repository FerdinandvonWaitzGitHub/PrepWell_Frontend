import { useState, useEffect } from 'react';
import { useStatistics } from '../../hooks/useStatistics';
import {
  ScoreCard,
  PerformanceHeatmap,
  LineChart,
  StatsSidebar,
  ChartSelectionDialog
} from './dashboard';

// LocalStorage keys
const STORAGE_KEY_SELECTED_SIDEBAR_STATS = 'prepwell_mentor_selected_sidebar_stats';
const STORAGE_KEY_SELECTED_CHARTS = 'prepwell_mentor_selected_charts';

// Default selected stats for sidebar (up to 10)
const DEFAULT_SELECTED_SIDEBAR_STATS = [
  'lernzeit-per-day',
  'lernzeit-per-week',
  'streak-history',
  'learning-days-week',
  'task-completion-week',
  'pomodoro-sessions'
];

// Default selected charts for line chart (up to 3)
const DEFAULT_SELECTED_CHARTS = [
  'lernzeit-per-day',
  'task-completion-week'
];

/**
 * MentorContent component - Matching Figma design exactly
 *
 * Layout:
 * - Left column (flex-1): Score cards + Heatmap (top), Statistik chart (bottom)
 * - Right column (500px): Statistics sidebar
 */
const MentorContent = ({ className = '' }) => {
  const {
    scores,
    heatmapData,
    lernzeit,
    formatDuration,
    getChartSeriesForIds,
    getSidebarStatsForIds
  } = useStatistics();

  // State for selected sidebar stats (up to 10)
  const [selectedSidebarStatsIds, setSelectedSidebarStatsIds] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SELECTED_SIDEBAR_STATS);
      return stored ? JSON.parse(stored) : DEFAULT_SELECTED_SIDEBAR_STATS;
    } catch {
      return DEFAULT_SELECTED_SIDEBAR_STATS;
    }
  });

  // State for selected charts (line chart display, up to 3)
  const [selectedChartIds, setSelectedChartIds] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SELECTED_CHARTS);
      return stored ? JSON.parse(stored) : DEFAULT_SELECTED_CHARTS;
    } catch {
      return DEFAULT_SELECTED_CHARTS;
    }
  });

  // State for chart selection dialog
  const [isChartDialogOpen, setIsChartDialogOpen] = useState(false);

  // Persist selections
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SELECTED_SIDEBAR_STATS, JSON.stringify(selectedSidebarStatsIds));
  }, [selectedSidebarStatsIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SELECTED_CHARTS, JSON.stringify(selectedChartIds));
  }, [selectedChartIds]);

  // Calculate heatmap stats
  const heatmapStats = {
    avgDuration: formatDuration(lernzeit.avgPerLearningDay),
    avgDurationChange: Math.round((lernzeit.weekComparison || 0) * 0.6), // Approximate minutes
    activeDays: heatmapData.stats.activeDays
  };

  // Get chart series data for selected charts
  const chartSeries = getChartSeriesForIds(selectedChartIds);

  // Get common x-labels from first series or default
  const chartXLabels = chartSeries[0]?.xLabels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  // Calculate appropriate yMax for selected series
  const chartYMax = chartSeries.length > 0
    ? Math.max(...chartSeries.map(s => s.yMax || 400))
    : 400;

  // Get sidebar stats with current values
  const sidebarStats = getSidebarStatsForIds(selectedSidebarStatsIds);

  return (
    <div className={`flex h-full overflow-hidden ${className}`}>
      {/* Left Column - Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Row: Score Card + Heatmap */}
        <div className="flex overflow-hidden">
          {/* Score Card - Fixed width */}
          <div className="w-96 flex-shrink-0">
            <ScoreCard
              prepScore={scores.prepScore}
              prepTrend={scores.prepTrend}
              wellScore={scores.wellScore}
              wellTrend={scores.wellTrend}
            />
          </div>

          {/* Performance Heatmap - Flex grow */}
          <PerformanceHeatmap
            data={heatmapData.data}
            stats={heatmapStats}
          />
        </div>

        {/* Bottom: Line Chart Section */}
        <div className="flex-1 p-5 bg-white rounded-[10px] border border-gray-200 flex flex-col overflow-hidden">
          <LineChart
            title="Diagramm"
            series={chartSeries}
            xLabels={chartXLabels}
            yMax={chartYMax}
            ySteps={4}
            onSelectClick={() => setIsChartDialogOpen(true)}
          />
        </div>
      </div>

      {/* Right Column - Sidebar */}
      <StatsSidebar
        stats={sidebarStats}
        selectedStatsIds={selectedSidebarStatsIds}
        onSelectedStatsChange={setSelectedSidebarStatsIds}
      />

      {/* Chart Selection Dialog */}
      <ChartSelectionDialog
        open={isChartDialogOpen}
        onOpenChange={setIsChartDialogOpen}
        selectedCharts={selectedChartIds}
        onSelectionChange={setSelectedChartIds}
      />
    </div>
  );
};

export default MentorContent;
