import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import StatCard from './stat-card';
import StatCategory from './stat-category';

/**
 * LernzeitStats - Learning time statistics section
 */
const LernzeitStats = ({ stats, formatDuration }) => {
  const {
    avgPerLearningDay,
    avgPerWeek,
    avgPerMonth,
    longestSession,
    shortestSession,
    totalTime,
    thisWeekTime,
    lastWeekTime,
    weekComparison,
    weeks4Trend,
    trendDirection
  } = stats;

  // Prepare chart data
  const trendData = weeks4Trend.map((w, i) => ({
    name: `Woche ${i + 1}`,
    zeit: Math.round(w.time / 60) // Convert to minutes
  }));

  return (
    <StatCategory title="Lernzeit" icon="⏱️">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Ø Lernzeit pro Lerntag"
          value={formatDuration(avgPerLearningDay)}
          size="large"
        />
        <StatCard
          label="Ø Lernzeit pro Woche"
          value={formatDuration(avgPerWeek)}
        />
        <StatCard
          label="Ø Lernzeit pro Monat"
          value={formatDuration(avgPerMonth)}
        />
        <StatCard
          label="Gesamte Lernzeit"
          value={formatDuration(totalTime)}
        />
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Längste Session"
          value={formatDuration(longestSession)}
        />
        <StatCard
          label="Kürzeste Session"
          value={formatDuration(shortestSession)}
        />
        <StatCard
          label="Diese Woche"
          value={formatDuration(thisWeekTime)}
          trend={weekComparison > 0 ? 'up' : weekComparison < 0 ? 'down' : 'stable'}
          trendValue={`${Math.abs(Math.round(weekComparison))}% vs. letzte Woche`}
        />
      </div>

      {/* 4-Week Trend Chart */}
      {trendData.length > 0 && trendData.some(d => d.zeit > 0) && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <h4 className="text-sm font-medium text-neutral-700 mb-4">
            Lernzeit-Trend (letzte 4 Wochen)
            <span className={`ml-2 ${trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trendDirection === 'up' ? '↑ Steigend' : '↓ Fallend'}
            </span>
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}min`}
                />
                <Tooltip
                  formatter={(value) => [`${value} min`, 'Lernzeit']}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="zeit" fill="#FFC4C4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </StatCategory>
  );
};

export default LernzeitStats;
